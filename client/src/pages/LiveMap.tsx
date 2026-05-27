import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, RefreshCw, Users, Clock, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface LiveLocation {
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  recordedAt: string;
}

function minutesAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  return `${Math.floor(diff / 60)}h ${diff % 60}m ago`;
}

function isStale(dateStr: string): boolean {
  return Date.now() - new Date(dateStr).getTime() > 10 * 60 * 1000; // > 10 min
}

// Inject pulsing CSS for active live markers
if (typeof document !== "undefined" && !document.getElementById("livemap-pulse-css")) {
  const s = document.createElement("style");
  s.id = "livemap-pulse-css";
  s.textContent = `
    @keyframes livemap-ping {
      0%   { box-shadow: 0 0 0 0 rgba(255,255,255,0.7), 0 2px 8px rgba(0,0,0,0.35); }
      60%  { box-shadow: 0 0 0 10px rgba(255,255,255,0), 0 2px 8px rgba(0,0,0,0.35); }
      100% { box-shadow: 0 0 0 0 rgba(255,255,255,0), 0 2px 8px rgba(0,0,0,0.35); }
    }
    .livemap-active-marker { animation: livemap-ping 1.6s ease-out infinite; }
  `;
  document.head.appendChild(s);
}

// Colour palette for markers
const COLOURS = [
  "#1B5E20", "#1565C0", "#6A1B9A", "#E65100", "#00695C",
  "#AD1457", "#4527A0", "#0277BD", "#558B2F", "#4E342E",
];

export default function LiveMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Record<number, any>>({});
  const [selected, setSelected] = useState<LiveLocation | null>(null);
  const [leafletReady, setLeafletReady] = useState(false);

  // Fetch live locations — auto-refresh every 15 s
  const { data: locations = [], dataUpdatedAt, refetch, isFetching } = useQuery<LiveLocation[]>({
    queryKey: ["/api/employees/live-locations"],
    refetchInterval: 15000,
  });

  // Load Leaflet dynamically
  useEffect(() => {
    if (typeof window === "undefined") return;
    Promise.all([
      import("leaflet"),
      // @ts-ignore
      import("leaflet/dist/leaflet.css"),
    ]).then(([L]) => {
      if (!mapRef.current || mapInstanceRef.current) return;
      const map = L.map(mapRef.current, {
        center: [20.5, 77.0], // central India default
        zoom: 6,
        zoomControl: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);
      mapInstanceRef.current = map;
      setLeafletReady(true);
    });
    return () => {
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers whenever data or map changes
  useEffect(() => {
    if (!leafletReady || !mapInstanceRef.current) return;
    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;
      const existingIds = new Set(Object.keys(markersRef.current).map(Number));
      const newIds = new Set(locations.map(l => l.employeeId));

      // Remove markers no longer in data
      existingIds.forEach(id => {
        if (!newIds.has(id)) {
          markersRef.current[id]?.remove();
          delete markersRef.current[id];
        }
      });

      locations.forEach((loc, idx) => {
        const colour = COLOURS[idx % COLOURS.length];
        const stale = isStale(loc.recordedAt);
        const iconHtml = `
          <div class="${stale ? "" : "livemap-active-marker"}" style="
            background:${stale ? "#9e9e9e" : colour};
            width:36px;height:36px;border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);border:3px solid white;
            box-shadow:0 2px 6px rgba(0,0,0,.35);
            display:flex;align-items:center;justify-content:center;
          ">
            <span style="transform:rotate(45deg);color:white;font-size:13px;font-weight:700">
              ${loc.employeeName.charAt(0).toUpperCase()}
            </span>
          </div>`;
        const icon = L.divIcon({ html: iconHtml, className: "", iconSize: [36, 36], iconAnchor: [18, 36] });

        if (markersRef.current[loc.employeeId]) {
          markersRef.current[loc.employeeId].setLatLng([loc.latitude, loc.longitude]);
          markersRef.current[loc.employeeId].setIcon(icon);
        } else {
          const marker = L.marker([loc.latitude, loc.longitude], { icon })
            .addTo(map)
            .on("click", () => setSelected(loc));
          markersRef.current[loc.employeeId] = marker;
        }
      });

      // Fit map to markers if first load
      if (locations.length > 0 && Object.keys(markersRef.current).length === locations.length) {
        const bounds = L.latLngBounds(locations.map(l => [l.latitude, l.longitude] as [number, number]));
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [60, 60] });
      }
    });
  }, [locations, leafletReady]);

  const activeCount = locations.filter(l => !isStale(l.recordedAt)).length;

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MapPin className="w-6 h-6 text-primary" />
            Live Employee Map
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time GPS locations · auto-refreshes every 15 seconds
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
            <Users className="w-3.5 h-3.5" />
            {activeCount} active · {locations.length} total today
          </Badge>
          {isFetching
            ? <Badge variant="outline" className="gap-1.5 text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                <RefreshCw className="w-3 h-3 animate-spin" /> Updating…
              </Badge>
            : <Badge variant="outline" className="gap-1.5 text-green-600 border-green-200 bg-green-50 dark:bg-green-950/20">
                <Wifi className="w-3 h-3" /> Live
              </Badge>
          }
          <Button size="sm" variant="outline" onClick={() => refetch()} data-testid="button-refresh-map">
            <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
          </Button>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Map */}
        <div className="flex-1 rounded-xl overflow-hidden border shadow-sm relative min-h-[400px]">
          <div ref={mapRef} className="w-full h-full" data-testid="live-map-container" />
          {!leafletReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/40">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Sidebar panel */}
        <div className="w-72 shrink-0 flex flex-col gap-2 overflow-y-auto">
          {locations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground text-sm gap-2">
              <WifiOff className="w-8 h-8 opacity-40" />
              <p>No GPS data received today yet.<br />Employees must be punched in with the mobile app.</p>
            </div>
          ) : (
            locations.map((loc, idx) => {
              const stale = isStale(loc.recordedAt);
              const colour = COLOURS[idx % COLOURS.length];
              return (
                <Card
                  key={loc.employeeId}
                  className={`cursor-pointer transition-all border-2 ${selected?.employeeId === loc.employeeId ? "border-primary shadow-md" : "border-transparent hover:border-primary/30"}`}
                  onClick={() => {
                    setSelected(loc);
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.setView([loc.latitude, loc.longitude], 15);
                    }
                  }}
                  data-testid={`card-employee-location-${loc.employeeId}`}
                >
                  <CardContent className="p-3 flex gap-3 items-start">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{ background: stale ? "#9e9e9e" : colour }}
                    >
                      {loc.employeeName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{loc.employeeName}</p>
                      <p className="text-xs text-muted-foreground">{loc.employeeCode}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className={`text-xs ${stale ? "text-orange-500" : "text-green-600"}`}>
                          {minutesAgo(loc.recordedAt)}
                        </span>
                        {loc.speed != null && loc.speed > 0 && (
                          <span className="text-xs text-muted-foreground ml-2">
                            {(loc.speed * 3.6).toFixed(0)} km/h
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                      </p>
                    </div>
                    {stale
                      ? <Badge variant="secondary" className="text-[10px] shrink-0">Inactive</Badge>
                      : <Badge className="text-[10px] bg-green-600 shrink-0">Live</Badge>
                    }
                  </CardContent>
                </Card>
              );
            })
          )}
          {dataUpdatedAt > 0 && (
            <p className="text-[10px] text-muted-foreground text-center pt-1">
              Last updated {new Date(dataUpdatedAt).toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
