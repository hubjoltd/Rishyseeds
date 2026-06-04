import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, RefreshCw, Users, Clock, Wifi, WifiOff, Navigation, Route, ParkingSquare, Timer, Battery, BatteryLow, BatteryMedium, BatteryFull, Zap } from "lucide-react";
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

interface LiveSummary {
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  kmToday: number;
  stoppageCount: number;
  timeOnFieldSecs: number;
  pingCount: number;
  firstPingTime: string;
  lastPingTime: string;
  lastSpeed: number | null;
  lastBattery: number | null;
  lastLatitude: number;
  lastLongitude: number;
}

function secsAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m ago`;
}

function fmtDuration(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${secs}s`;
}

function isStale(dateStr: string): boolean {
  return Date.now() - new Date(dateStr).getTime() > 10 * 60 * 1000;
}

function isMoving(loc: LiveLocation): boolean {
  return loc.speed != null && loc.speed > 0.5;
}

function BatteryIcon({ level, charging }: { level: number | null; charging: boolean | null }) {
  if (level === null) return null;
  const Icon = charging ? Zap : level > 70 ? BatteryFull : level > 30 ? BatteryMedium : BatteryLow;
  const color = charging ? "text-green-500" : level > 50 ? "text-green-500" : level > 20 ? "text-yellow-500" : "text-red-500";
  return (
    <span className={`flex items-center gap-0.5 text-[10px] font-medium ${color}`}>
      <Icon className="w-3 h-3" />{level}%
    </span>
  );
}

// Inject pulsing CSS for active/moving live markers
if (typeof document !== "undefined" && !document.getElementById("livemap-pulse-css")) {
  const s = document.createElement("style");
  s.id = "livemap-pulse-css";
  s.textContent = `
    @keyframes livemap-ping {
      0%   { box-shadow: 0 0 0 0 rgba(255,255,255,0.7), 0 2px 8px rgba(0,0,0,0.35); }
      60%  { box-shadow: 0 0 0 10px rgba(255,255,255,0), 0 2px 8px rgba(0,0,0,0.35); }
      100% { box-shadow: 0 0 0 0 rgba(255,255,255,0), 0 2px 8px rgba(0,0,0,0.35); }
    }
    @keyframes livemap-move {
      0%   { box-shadow: 0 0 0 0 rgba(229,57,53,0.6), 0 2px 8px rgba(0,0,0,0.35); }
      60%  { box-shadow: 0 0 0 14px rgba(229,57,53,0), 0 2px 8px rgba(0,0,0,0.35); }
      100% { box-shadow: 0 0 0 0 rgba(229,57,53,0), 0 2px 8px rgba(0,0,0,0.35); }
    }
    .livemap-active-marker { animation: livemap-ping 1.6s ease-out infinite; }
    .livemap-moving-marker { animation: livemap-move 1s ease-out infinite; }
  `;
  document.head.appendChild(s);
}

const COLOURS = [
  "#1B5E20", "#1565C0", "#6A1B9A", "#E65100", "#00695C",
  "#AD1457", "#4527A0", "#0277BD", "#558B2F", "#4E342E",
];

type RefreshMs = 10000 | 30000;

export default function LiveMap() {
  const mapRef         = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef     = useRef<Record<number, any>>({});
  const [selected, setSelected]   = useState<LiveLocation | null>(null);
  const [leafletReady, setLeafletReady] = useState(false);
  const [refreshMs, setRefreshMs] = useState<RefreshMs>(10000);
  const [countdown, setCountdown] = useState(10);

  const { data: locations = [], dataUpdatedAt, refetch, isFetching } = useQuery<LiveLocation[]>({
    queryKey: ["/api/employees/live-locations"],
    refetchInterval: refreshMs,
  });

  const { data: summaries = [] } = useQuery<LiveSummary[]>({
    queryKey: ["/api/employees/live-summary"],
    refetchInterval: refreshMs,
  });

  // Countdown resets on each fetch or interval change
  useEffect(() => {
    setCountdown(refreshMs / 1000);
    const id = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [dataUpdatedAt, refreshMs]);

  // Load Leaflet
  useEffect(() => {
    if (typeof window === "undefined") return;
    Promise.all([import("leaflet"), import("leaflet/dist/leaflet.css") as any]).then(([L]) => {
      if (!mapRef.current || mapInstanceRef.current) return;
      const map = L.map(mapRef.current, { center: [20.5, 77.0], zoom: 6, zoomControl: true });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors", maxZoom: 19,
      }).addTo(map);
      mapInstanceRef.current = map;
      setLeafletReady(true);
    });
    return () => { mapInstanceRef.current?.remove(); mapInstanceRef.current = null; };
  }, []);

  // Update markers
  useEffect(() => {
    if (!leafletReady || !mapInstanceRef.current) return;
    import("leaflet").then((L) => {
      const map = mapInstanceRef.current;
      const existingIds = new Set(Object.keys(markersRef.current).map(Number));
      const newIds      = new Set(locations.map(l => l.employeeId));
      existingIds.forEach(id => {
        if (!newIds.has(id)) { markersRef.current[id]?.remove(); delete markersRef.current[id]; }
      });
      locations.forEach((loc, idx) => {
        const colour  = COLOURS[idx % COLOURS.length];
        const stale   = isStale(loc.recordedAt);
        const moving  = isMoving(loc);
        const bg      = stale ? "#9e9e9e" : moving ? "#E53935" : colour;
        const animCls = stale ? "" : moving ? "livemap-moving-marker" : "livemap-active-marker";
        const inner   = moving
          ? `<span style="transform:rotate(45deg);color:white;font-size:16px;line-height:1;">▲</span>`
          : `<span style="transform:rotate(45deg);color:white;font-size:13px;font-weight:700">${loc.employeeName.charAt(0).toUpperCase()}</span>`;
        const iconHtml = `<div class="${animCls}" style="background:${bg};width:36px;height:36px;
          border-radius:${moving ? "4px 50% 50% 50%" : "50% 50% 50% 0"};transform:rotate(-45deg);
          border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35);
          display:flex;align-items:center;justify-content:center;">${inner}</div>`;
        const icon = L.divIcon({ html: iconHtml, className: "", iconSize: [36, 36], iconAnchor: [18, 36] });
        if (markersRef.current[loc.employeeId]) {
          markersRef.current[loc.employeeId].setLatLng([loc.latitude, loc.longitude]);
          markersRef.current[loc.employeeId].setIcon(icon);
        } else {
          markersRef.current[loc.employeeId] = L.marker([loc.latitude, loc.longitude], { icon })
            .addTo(map).on("click", () => setSelected(loc));
        }
      });
      if (locations.length > 0 && Object.keys(markersRef.current).length === locations.length) {
        const bounds = L.latLngBounds(locations.map(l => [l.latitude, l.longitude] as [number, number]));
        if (bounds.isValid()) map.fitBounds(bounds, { padding: [60, 60] });
      }
    });
  }, [locations, leafletReady]);

  // Build a lookup: employeeId → location (for status/last-seen in summary cards)
  const locMap: Record<number, LiveLocation & { colour: string }> = {};
  locations.forEach((loc, idx) => {
    locMap[loc.employeeId] = { ...loc, colour: COLOURS[idx % COLOURS.length] };
  });

  const activeCount = locations.filter(l => !isStale(l.recordedAt)).length;
  const movingCount = locations.filter(l => isMoving(l)).length;

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] gap-3">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MapPin className="w-6 h-6 text-primary" />
            Live Employee Map
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time GPS · refreshing every {refreshMs / 1000}s
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
            <Users className="w-3.5 h-3.5" />
            {activeCount} active · {locations.length} today
          </Badge>
          {movingCount > 0 && (
            <Badge className="gap-1.5 px-3 py-1.5 text-sm bg-red-600 text-white border-0">
              <Navigation className="w-3.5 h-3.5" /> {movingCount} moving
            </Badge>
          )}
          {isFetching
            ? <Badge variant="outline" className="gap-1.5 text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                <RefreshCw className="w-3 h-3 animate-spin" /> Updating…
              </Badge>
            : <Badge variant="outline" className="gap-1.5 text-green-600 border-green-200 bg-green-50 dark:bg-green-950/20">
                <Wifi className="w-3 h-3" /> {countdown}s
              </Badge>
          }
          <div className="flex rounded-md border overflow-hidden">
            <Button size="sm" variant={refreshMs === 10000 ? "default" : "ghost"}
              className="rounded-none h-8 px-3 text-xs" onClick={() => setRefreshMs(10000)}
              data-testid="button-refresh-10s">10s</Button>
            <Button size="sm" variant={refreshMs === 30000 ? "default" : "ghost"}
              className="rounded-none h-8 px-3 text-xs border-l" onClick={() => setRefreshMs(30000)}
              data-testid="button-refresh-30s">30s</Button>
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()} data-testid="button-refresh-map">
            <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* ── Map ───────────────────────────────────────────────────── */}
      <div className="rounded-xl overflow-hidden border shadow-sm relative shrink-0" style={{ height: "45%" }}>
        <div ref={mapRef} className="w-full h-full" data-testid="live-map-container" />
        {!leafletReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/40">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* ── Grid Cards ────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {locations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground text-sm gap-2">
            <WifiOff className="w-8 h-8 opacity-40" />
            <p>No GPS data received today yet.<br />Employees must be punched in with the mobile app.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 pb-2">
            {summaries.map(s => {
              const loc    = locMap[s.employeeId];
              const stale  = loc ? isStale(loc.recordedAt) : true;
              const moving = loc ? isMoving(loc) : false;
              const colour = loc?.colour ?? COLOURS[0];
              const bg     = stale ? "#9e9e9e" : moving ? "#E53935" : colour;
              const speedKmh = loc?.speed != null ? (loc.speed * 3.6).toFixed(0) : null;

              return (
                <Card
                  key={s.employeeId}
                  className={`cursor-pointer transition-all border-2 hover:shadow-md ${
                    selected?.employeeId === s.employeeId
                      ? "border-primary shadow-md"
                      : moving
                        ? "border-red-200 dark:border-red-900"
                        : "border-transparent hover:border-primary/30"
                  }`}
                  onClick={() => {
                    if (loc) {
                      setSelected(loc);
                      mapInstanceRef.current?.setView([loc.latitude, loc.longitude], 15);
                    }
                  }}
                  data-testid={`card-employee-summary-${s.employeeId}`}
                >
                  <CardContent className="p-3 flex flex-col gap-2">

                    {/* Name row */}
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                        style={{ background: bg }}
                      >
                        {moving ? "▲" : s.employeeName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate leading-tight">{s.employeeName}</p>
                        <p className="text-[10px] text-muted-foreground">{s.employeeCode}</p>
                      </div>
                      {stale
                        ? <Badge variant="secondary" className="text-[9px] px-1.5 py-0.5 shrink-0">Off</Badge>
                        : moving
                          ? <Badge className="text-[9px] px-1.5 py-0.5 bg-red-600 shrink-0">Moving</Badge>
                          : <Badge className="text-[9px] px-1.5 py-0.5 bg-green-600 shrink-0">Live</Badge>
                      }
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-1 text-center">
                      <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-1.5">
                        <div className="flex items-center justify-center gap-0.5 mb-0.5">
                          <Route className="w-3 h-3 text-blue-600" />
                        </div>
                        <p className="text-sm font-bold text-blue-700 dark:text-blue-400 leading-none">{s.kmToday}</p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">km</p>
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-1.5">
                        <div className="flex items-center justify-center gap-0.5 mb-0.5">
                          <ParkingSquare className="w-3 h-3 text-orange-600" />
                        </div>
                        <p className="text-sm font-bold text-orange-700 dark:text-orange-400 leading-none">{s.stoppageCount}</p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">stops</p>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-1.5">
                        <div className="flex items-center justify-center gap-0.5 mb-0.5">
                          <Timer className="w-3 h-3 text-purple-600" />
                        </div>
                        <p className="text-sm font-bold text-purple-700 dark:text-purple-400 leading-none">
                          {fmtDuration(s.timeOnFieldSecs)}
                        </p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">field</p>
                      </div>
                    </div>

                    {/* Bottom row */}
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className={`flex items-center gap-1 text-[10px] ${stale ? "text-orange-500" : "text-green-600"}`}>
                        <Clock className="w-2.5 h-2.5" />
                        {loc ? secsAgo(loc.recordedAt) : secsAgo(s.lastPingTime)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {moving && speedKmh && (
                          <span className="text-[10px] text-red-600 font-medium">{speedKmh} km/h</span>
                        )}
                        <BatteryIcon level={loc?.batteryLevel ?? s.lastBattery} charging={loc?.isCharging ?? null} />
                      </div>
                    </div>

                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        {dataUpdatedAt > 0 && (
          <p className="text-[10px] text-muted-foreground text-center pt-1">
            Last updated {new Date(dataUpdatedAt).toLocaleTimeString()}
          </p>
        )}
      </div>

    </div>
  );
}
