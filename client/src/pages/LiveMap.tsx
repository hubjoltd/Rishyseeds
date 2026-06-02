import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, RefreshCw, Users, Clock, Wifi, WifiOff, Navigation, Zap } from "lucide-react";
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
  batteryLevel: number | null;
  isCharging: boolean | null;
  networkType: string | null;
  recordedAt: string;
}

function secsAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ${m % 60}m ago`;
}

function isStale(dateStr: string): boolean {
  return Date.now() - new Date(dateStr).getTime() > 10 * 60 * 1000;
}

function isMoving(loc: LiveLocation): boolean {
  return loc.speed != null && loc.speed > 0.5; // > 1.8 km/h
}

const COLOURS = [
  "#1B5E20", "#1565C0", "#6A1B9A", "#E65100", "#00695C",
  "#AD1457", "#4527A0", "#0277BD", "#558B2F", "#4E342E",
];

const MOVE_COLOUR = "#E53935"; // red for moving

// Inject CSS for animations
if (typeof document !== "undefined" && !document.getElementById("livemap-css")) {
  const s = document.createElement("style");
  s.id = "livemap-css";
  s.textContent = `
    @keyframes livemap-ping {
      0%   { box-shadow: 0 0 0 0 rgba(255,255,255,0.7), 0 2px 8px rgba(0,0,0,0.35); }
      60%  { box-shadow: 0 0 0 10px rgba(255,255,255,0), 0 2px 8px rgba(0,0,0,0.35); }
      100% { box-shadow: 0 0 0 0 rgba(255,255,255,0), 0 2px 8px rgba(0,0,0,0.35); }
    }
    @keyframes livemap-move-ring {
      0%   { box-shadow: 0 0 0 0 rgba(229,57,53,0.6), 0 2px 8px rgba(0,0,0,0.35); }
      60%  { box-shadow: 0 0 0 14px rgba(229,57,53,0), 0 2px 8px rgba(0,0,0,0.35); }
      100% { box-shadow: 0 0 0 0 rgba(229,57,53,0), 0 2px 8px rgba(0,0,0,0.35); }
    }
    .livemap-active-marker { animation: livemap-ping 1.6s ease-out infinite; }
    .livemap-moving-marker { animation: livemap-move-ring 1s ease-out infinite; }
  `;
  document.head.appendChild(s);
}

type MapType = "road" | "satellite" | "terrain";
const MAP_TYPES: { id: MapType; label: string; lyrs: string }[] = [
  { id: "road",      label: "Road",      lyrs: "m" },
  { id: "satellite", label: "Satellite", lyrs: "s" },
  { id: "terrain",   label: "Terrain",   lyrs: "p" },
];

type RefreshMs = 10000 | 30000;

export default function LiveMap() {
  const mapRef        = useRef<HTMLDivElement>(null);
  const mapInstance   = useRef<any>(null);
  const tileLayer     = useRef<any>(null);
  const markersRef    = useRef<Record<number, any>>({});
  const prevLocsRef   = useRef<Record<number, LiveLocation>>({});

  const [selected,     setSelected]     = useState<LiveLocation | null>(null);
  const [leafletReady, setLeafletReady] = useState(false);
  const [mapType,      setMapType]      = useState<MapType>("road");
  const [refreshMs,    setRefreshMs]    = useState<RefreshMs>(10000);
  const [movingCount,  setMovingCount]  = useState(0);
  const [countdown,    setCountdown]    = useState(refreshMs / 1000);

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: locations = [], dataUpdatedAt, refetch, isFetching } = useQuery<LiveLocation[]>({
    queryKey: ["/api/employees/live-locations"],
    refetchInterval: refreshMs,
  });

  // Countdown timer — resets on each fetch
  useEffect(() => {
    setCountdown(refreshMs / 1000);
    const id = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [dataUpdatedAt, refreshMs]);

  // Track moving count
  useEffect(() => {
    setMovingCount(locations.filter(isMoving).length);
  }, [locations]);

  // ── Init Leaflet map ───────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    Promise.all([import("leaflet"), import("leaflet/dist/leaflet.css")]).then(([L]) => {
      if (!mapRef.current || mapInstance.current) return;
      const map = (L as any).map(mapRef.current, {
        center: [20.5, 77.0],
        zoom: 6,
        zoomControl: true,
      });
      // Google Maps road tiles via server proxy
      tileLayer.current = (L as any).tileLayer(
        "/api/tiles/m/{z}/{x}/{y}.png",
        { attribution: "© Google Maps", maxZoom: 20 }
      ).addTo(map);
      mapInstance.current = map;
      setLeafletReady(true);
    });
    return () => { mapInstance.current?.remove(); mapInstance.current = null; };
  }, []);

  // ── Swap tile layer when map type changes ──────────────────────────────────
  useEffect(() => {
    if (!leafletReady || !mapInstance.current) return;
    import("leaflet").then((L) => {
      const lyrs = MAP_TYPES.find(t => t.id === mapType)?.lyrs ?? "m";
      if (tileLayer.current) {
        tileLayer.current.remove();
      }
      tileLayer.current = (L as any).tileLayer(
        `/api/tiles/${lyrs}/{z}/{x}/{y}.png`,
        { attribution: "© Google Maps", maxZoom: 20 }
      ).addTo(mapInstance.current);
    });
  }, [mapType, leafletReady]);

  // ── Build marker icon ──────────────────────────────────────────────────────
  const makeIcon = useCallback((loc: LiveLocation, colour: string, L: any) => {
    const moving = isMoving(loc);
    const stale  = isStale(loc.recordedAt);
    const bg     = stale ? "#9e9e9e" : moving ? MOVE_COLOUR : colour;
    const cls    = stale ? "" : moving ? "livemap-moving-marker" : "livemap-active-marker";
    const inner  = moving
      ? `<span style="transform:rotate(45deg);color:white;font-size:16px;">▲</span>`
      : `<span style="transform:rotate(45deg);color:white;font-size:13px;font-weight:700">${loc.employeeName.charAt(0).toUpperCase()}</span>`;
    const html = `
      <div class="${cls}" style="
        background:${bg};
        width:38px;height:38px;border-radius:${moving ? "4px 50% 50% 50%" : "50% 50% 50% 0"};
        transform:rotate(-45deg);border:3px solid white;
        box-shadow:0 2px 6px rgba(0,0,0,.35);
        display:flex;align-items:center;justify-content:center;">
        ${inner}
      </div>`;
    return L.divIcon({ html, className: "", iconSize: [38, 38], iconAnchor: [19, 38] });
  }, []);

  // ── Update markers on data change ─────────────────────────────────────────
  useEffect(() => {
    if (!leafletReady || !mapInstance.current) return;
    import("leaflet").then((L) => {
      const map = mapInstance.current;
      const existingIds = new Set(Object.keys(markersRef.current).map(Number));
      const newIds      = new Set(locations.map(l => l.employeeId));

      // Remove gone employees
      existingIds.forEach(id => {
        if (!newIds.has(id)) { markersRef.current[id]?.remove(); delete markersRef.current[id]; }
      });

      let firstLoad = Object.keys(markersRef.current).length === 0 && locations.length > 0;

      locations.forEach((loc, idx) => {
        const colour = COLOURS[idx % COLOURS.length];
        const icon   = makeIcon(loc, colour, L);

        if (markersRef.current[loc.employeeId]) {
          markersRef.current[loc.employeeId].setLatLng([loc.latitude, loc.longitude]);
          markersRef.current[loc.employeeId].setIcon(icon);
        } else {
          const marker = (L as any).marker([loc.latitude, loc.longitude], { icon })
            .addTo(map)
            .on("click", () => {
              setSelected(loc);
              map.setView([loc.latitude, loc.longitude], 16, { animate: true });
            });
          markersRef.current[loc.employeeId] = marker;
        }

        // If this employee just started moving, pan to them
        const prev = prevLocsRef.current[loc.employeeId];
        if (!prev && isMoving(loc)) {
          map.panTo([loc.latitude, loc.longitude], { animate: true });
        }
      });

      prevLocsRef.current = Object.fromEntries(locations.map(l => [l.employeeId, l]));

      if (firstLoad) {
        const bounds = (L as any).latLngBounds(locations.map(l => [l.latitude, l.longitude] as [number, number]));
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [60, 60] });
      }
    });
  }, [locations, leafletReady, makeIcon]);

  const activeCount = locations.filter(l => !isStale(l.recordedAt)).length;

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] gap-3">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MapPin className="w-6 h-6 text-primary" />
            Live Employee Map
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Google Maps tiles · Road-accurate positions
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Moving indicator */}
          {movingCount > 0 && (
            <Badge className="gap-1.5 px-3 py-1.5 text-sm bg-red-600 animate-pulse">
              <Navigation className="w-3.5 h-3.5" />
              {movingCount} moving
            </Badge>
          )}

          <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
            <Users className="w-3.5 h-3.5" />
            {activeCount} active · {locations.length} total
          </Badge>

          {/* Refresh interval toggle */}
          <div className="flex items-center rounded-md border overflow-hidden text-sm font-medium">
            {([10000, 30000] as RefreshMs[]).map(ms => (
              <button
                key={ms}
                onClick={() => { setRefreshMs(ms); refetch(); }}
                className={`px-3 py-1.5 transition-colors ${refreshMs === ms
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted"}`}
                data-testid={`button-refresh-${ms / 1000}s`}
              >
                {ms / 1000}s
              </button>
            ))}
          </div>

          {/* Live/fetching status */}
          {isFetching
            ? <Badge variant="outline" className="gap-1.5 text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                <RefreshCw className="w-3 h-3 animate-spin" /> Updating…
              </Badge>
            : <Badge variant="outline" className="gap-1.5 text-green-600 border-green-200 bg-green-50 dark:bg-green-950/20">
                <Wifi className="w-3 h-3" /> Live · {countdown}s
              </Badge>
          }

          <Button size="sm" variant="outline" onClick={() => refetch()} data-testid="button-refresh-map">
            <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
          </Button>
        </div>
      </div>

      <div className="flex gap-3 flex-1 min-h-0">
        {/* ── Map ── */}
        <div className="flex-1 rounded-xl overflow-hidden border shadow-sm relative min-h-[400px]">
          <div ref={mapRef} className="w-full h-full" data-testid="live-map-container" />

          {/* Map type switcher */}
          <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1 bg-white dark:bg-zinc-900 rounded-lg border shadow-md p-1">
            {MAP_TYPES.map(t => (
              <button
                key={t.id}
                onClick={() => setMapType(t.id)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${mapType === t.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"}`}
                data-testid={`button-maptype-${t.id}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {!leafletReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/40">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="w-72 shrink-0 flex flex-col gap-2 overflow-y-auto">
          {locations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground text-sm gap-2">
              <WifiOff className="w-8 h-8 opacity-40" />
              <p>No GPS data today yet.<br />Employees must be punched in with the mobile app.</p>
            </div>
          ) : (
            locations.map((loc, idx) => {
              const stale   = isStale(loc.recordedAt);
              const moving  = isMoving(loc);
              const colour  = COLOURS[idx % COLOURS.length];
              const bgStyle = stale ? "#9e9e9e" : moving ? MOVE_COLOUR : colour;
              return (
                <Card
                  key={loc.employeeId}
                  className={`cursor-pointer transition-all border-2 ${selected?.employeeId === loc.employeeId
                    ? "border-primary shadow-md"
                    : moving
                    ? "border-red-300 dark:border-red-800"
                    : "border-transparent hover:border-primary/30"}`}
                  onClick={() => {
                    setSelected(loc);
                    if (mapInstance.current) {
                      mapInstance.current.setView([loc.latitude, loc.longitude], 17, { animate: true });
                    }
                  }}
                  data-testid={`card-employee-location-${loc.employeeId}`}
                >
                  <CardContent className="p-3 flex gap-3 items-start">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                      style={{ background: bgStyle }}
                    >
                      {moving
                        ? <Navigation className="w-4 h-4" />
                        : loc.employeeName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{loc.employeeName}</p>
                      <p className="text-xs text-muted-foreground">{loc.employeeCode}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className={`text-xs ${stale ? "text-orange-500" : "text-green-600"}`}>
                          {secsAgo(loc.recordedAt)}
                        </span>
                        {moving && (
                          <span className="text-xs font-semibold text-red-600 flex items-center gap-0.5">
                            <Navigation className="w-3 h-3" />
                            {(loc.speed! * 3.6).toFixed(0)} km/h
                          </span>
                        )}
                      </div>
                      {loc.accuracy != null && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          ±{loc.accuracy.toFixed(0)}m accuracy
                          {loc.batteryLevel != null && ` · 🔋${loc.batteryLevel}%`}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {stale
                        ? <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
                        : moving
                        ? <Badge className="text-[10px] bg-red-600 gap-1"><Zap className="w-2.5 h-2.5" />Moving</Badge>
                        : <Badge className="text-[10px] bg-green-600">Live</Badge>
                      }
                    </div>
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
