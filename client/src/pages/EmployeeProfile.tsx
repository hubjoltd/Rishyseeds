import { useState, useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, ZoomControl } from "react-leaflet";
import L from "leaflet";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import type { Employee, Trip, TripVisit } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAuthToken } from "@/lib/queryClient";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Briefcase,
  Building2,
  User,
  Wifi,
  Radio,
  Navigation,
  Clock,
  Activity,
  RefreshCw,
  Download,
  Filter,
  Route,
  Gauge,
  Timer,
  CheckCircle2,
  LogIn,
  LogOut,
  History,
  Loader2,
  BanknoteIcon,
  CreditCard,
  IndianRupee,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface TripWithVisits extends Trip {
  visits: TripVisit[];
  visitCount: number;
}

type ProfileTab = "live" | "playback" | "task" | "attendance" | "details" | "feeds" | "expense" | "audit";

function authHeaders(): Record<string, string> {
  const t = getAuthToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

function formatDT(dt: string | Date | null | undefined) {
  if (!dt) return "-";
  try { return format(new Date(dt), "yyyy-MM-dd HH:mm"); } catch { return "-"; }
}

function friendlyDate(dt: string | Date | null | undefined) {
  if (!dt) return "-";
  try { return formatDistanceToNow(new Date(dt), { addSuffix: true }); } catch { return "-"; }
}

function formatTime(dt: string | Date | null | undefined) {
  if (!dt) return "-";
  try { return format(new Date(dt), "hh:mm a"); } catch { return "-"; }
}

function formatDate(dt: string | Date | null | undefined) {
  if (!dt) return "-";
  try { return format(new Date(dt), "dd MMM yyyy"); } catch { return "-"; }
}

function avatarColor(name: string) {
  const colors = ["#2563eb","#7c3aed","#16a34a","#dc2626","#ea580c","#0891b2","#be185d","#65a30d"];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

function formatDuration(start: Date, end: Date): string {
  const totalSecs = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function StoppageAddress({ lat, lng }: { lat: number; lng: number }) {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`, { headers: { "Accept-Language": "en" } })
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        const addr = d.address || {};
        const parts = [
          addr.road || addr.hamlet || addr.neighbourhood || addr.pedestrian || "",
          addr.suburb || addr.village || addr.town || addr.residential || "",
          addr.city || addr.county || addr.state_district || "",
          addr.state || "",
        ].filter(Boolean);
        setAddress(parts.length > 0 ? parts.join(", ") : (d.display_name || null));
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [lat, lng]);
  if (loading) return <p className="text-[10px] text-muted-foreground italic">Fetching address…</p>;
  if (!address) return <p className="text-[10px] text-muted-foreground">{lat.toFixed(5)}, {lng.toFixed(5)}</p>;
  return <p className="text-[10px] text-muted-foreground leading-relaxed">{address}</p>;
}

function LastGpsAddress({ point }: { point: { latitude: string; longitude: string; recordedAt: string } }) {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const lat = Number(point.latitude);
  const lng = Number(point.longitude);
  useEffect(() => {
    if (!lat || !lng) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`, { headers: { "Accept-Language": "en" } })
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        const addr = d.address || {};
        const parts = [
          addr.road || addr.hamlet || addr.neighbourhood || addr.pedestrian || "",
          addr.suburb || addr.village || addr.town || addr.residential || "",
          addr.city || addr.county || addr.state_district || "",
          addr.state || "",
        ].filter(Boolean);
        setAddress(parts.length > 0 ? parts.join(", ") : (d.display_name || null));
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [lat, lng]);
  const t = new Date(point.recordedAt);
  const timeStr = `${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`;
  return (
    <div>
      {loading
        ? <p className="text-[10px] text-muted-foreground italic">Fetching address…</p>
        : address
          ? <p className="text-[10px] text-muted-foreground leading-relaxed">{address}</p>
          : <p className="text-[10px] text-muted-foreground">{lat.toFixed(5)}, {lng.toFixed(5)}</p>
      }
      <p className="text-[10px] text-muted-foreground/60 mt-0.5">Last ping at {timeStr}</p>
    </div>
  );
}

interface LiveMapSegment {
  type: "travelled" | "stoppage";
  startTime: string;
  endTime: string;
  distanceKm?: number;
  durationSecs?: number;
  lat?: number;
  lng?: number;
}

interface VisitStop { lat: number; lng: number; customerName: string; locationName: string | null; durationStr: string }

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const MAP_TYPES = [
  { id: "hybrid",       label: "Google Satellite" },
  { id: "satellite",    label: "Google Satellite (No Labels)" },
  { id: "roadmap",      label: "Google Roads"     },
  { id: "terrain",      label: "Google Terrain"   },
  { id: "openstreetmap",label: "OpenStreetMap"    },
];

const LEAFLET_TILES: Record<string, { url: string; subdomains?: string[]; attr: string }> = {
  roadmap:      { url: "/api/tiles/m/{z}/{x}/{y}.png",  attr: '© <a href="https://maps.google.com">Google Maps</a>' },
  terrain:      { url: "/api/tiles/p/{z}/{x}/{y}.png",  attr: '© <a href="https://maps.google.com">Google Maps</a>' },
  hybrid:       { url: "/api/tiles/y/{z}/{x}/{y}.png",  attr: '© <a href="https://maps.google.com">Google Maps</a>' },
  satellite:    { url: "/api/tiles/s/{z}/{x}/{y}.png",  attr: '© <a href="https://maps.google.com">Google Maps</a>' },
  openstreetmap:{ url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", subdomains: ["a","b","c","d"], attr: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>' },
};

// ── LiveMapInner — inside MapContainer so Leaflet hooks work ──
function LiveMapInner({
  locationPoints,
  segments,
  visitStops,
  punchInLat,
  punchInLng,
  punchOutLat,
  punchOutLng,
  mapTypeId,
}: {
  locationPoints: any[];
  segments: LiveMapSegment[];
  visitStops: VisitStop[];
  punchInLat?: number | null;
  punchInLng?: number | null;
  punchOutLat?: number | null;
  punchOutLng?: number | null;
  mapTypeId: string;
}) {
  const map = useMap();
  const tile = LEAFLET_TILES[mapTypeId] ?? LEAFLET_TILES.roadmap;

  const gpsPoints = useMemo(() =>
    locationPoints.filter(p => p.latitude && p.longitude)
      .map(p => [Number(p.latitude), Number(p.longitude)] as [number, number]),
    [locationPoints]
  );

  // Auto-fit bounds when data changes
  useEffect(() => {
    const all: [number, number][] = [...gpsPoints];
    visitStops.forEach(v => { if (v.lat && v.lng) all.push([v.lat, v.lng]); });
    if (punchInLat && punchInLng) all.push([punchInLat, punchInLng]);
    if (punchOutLat && punchOutLng) all.push([punchOutLat, punchOutLng]);
    if (all.length > 1) {
      map.fitBounds(L.latLngBounds(all.map(c => L.latLng(c[0], c[1]))), { padding: [40, 40] });
    } else if (all.length === 1) {
      map.setView(all[0], 15);
    }
  }, [gpsPoints, visitStops, punchInLat, punchInLng, punchOutLat, punchOutLng]);

  const stoppageIcon = L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44"><ellipse cx="18" cy="41" rx="6" ry="3" fill="rgba(0,0,0,0.18)"/><path d="M18 0C10.27 0 4 6.27 4 14c0 10.5 14 28 14 28S32 24.5 32 14C32 6.27 25.73 0 18 0z" fill="#f97316" stroke="white" stroke-width="2"/><circle cx="18" cy="14" r="7" fill="white"/><text x="18" y="18" text-anchor="middle" fill="#f97316" font-size="9" font-weight="bold" font-family="sans-serif">S</text></svg>`,
    className: "", iconSize: [36, 44], iconAnchor: [18, 44],
  });
  const chkIcon = L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="42" viewBox="0 0 34 42"><ellipse cx="17" cy="39" rx="5" ry="3" fill="rgba(0,0,0,0.18)"/><path d="M17 0C9.82 0 4 5.82 4 13c0 9.9 13 27 13 27S30 22.9 30 13C30 5.82 24.18 0 17 0z" fill="#16a34a" stroke="white" stroke-width="2"/><circle cx="17" cy="13" r="7" fill="white"/><text x="17" y="10" text-anchor="middle" fill="#16a34a" font-size="5.5" font-weight="bold" font-family="sans-serif">CHK</text><text x="17" y="18" text-anchor="middle" fill="#16a34a" font-size="5" font-family="sans-serif">✓</text></svg>`,
    className: "", iconSize: [34, 42], iconAnchor: [17, 42],
  });
  const startIcon = L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="52" viewBox="0 0 36 52"><ellipse cx="18" cy="49" rx="6" ry="3" fill="rgba(0,0,0,0.2)"/><path d="M18 0C10.27 0 4 6.27 4 14c0 10.5 14 36 14 36S32 24.5 32 14C32 6.27 25.73 0 18 0z" fill="#15803d" stroke="white" stroke-width="2"/><circle cx="18" cy="14" r="9" fill="white"/><text x="18" y="18" text-anchor="middle" fill="#15803d" font-size="8" font-weight="bold" font-family="sans-serif">START</text></svg>`,
    className: "", iconSize: [36, 52], iconAnchor: [18, 52],
  });
  const endIcon = L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="52" viewBox="0 0 36 52"><ellipse cx="18" cy="49" rx="6" ry="3" fill="rgba(0,0,0,0.2)"/><path d="M18 0C10.27 0 4 6.27 4 14c0 10.5 14 36 14 36S32 24.5 32 14C32 6.27 25.73 0 18 0z" fill="#dc2626" stroke="white" stroke-width="2"/><circle cx="18" cy="14" r="9" fill="white"/><text x="18" y="18" text-anchor="middle" fill="#dc2626" font-size="8" font-weight="bold" font-family="sans-serif">END</text></svg>`,
    className: "", iconSize: [36, 52], iconAnchor: [18, 52],
  });
  const currentPosIcon = L.divIcon({
    html: `<div style="width:38px;height:38px;border-radius:50%;background:#1d4ed8;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.4)"><svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></div>`,
    className: "", iconSize: [38, 38], iconAnchor: [19, 19],
  });

  const startPos: [number, number] | null = punchInLat && punchInLng
    ? [punchInLat, punchInLng]
    : gpsPoints.length > 0 ? gpsPoints[0] : null;
  const endPos: [number, number] | null = punchOutLat && punchOutLng
    ? [punchOutLat, punchOutLng]
    : gpsPoints.length > 1 ? gpsPoints[gpsPoints.length - 1] : null;
  const currentPos: [number, number] | null = !punchOutLat && gpsPoints.length > 0
    ? gpsPoints[gpsPoints.length - 1] : null;

  return (
    <>
      <TileLayer key={mapTypeId} url={tile.url} {...(tile.subdomains !== undefined ? { subdomains: tile.subdomains } : {})} attribution={tile.attr} maxZoom={20} />

      {/* GPS route polyline — orange */}
      {gpsPoints.length > 1 && (
        <Polyline positions={gpsPoints} pathOptions={{ color: "#f97316", weight: 5, opacity: 0.9 }} />
      )}

      {/* Stoppage markers */}
      {segments.filter(s => s.type === "stoppage" && s.lat && s.lng).map((s, i) => {
        const mins = Math.floor((s.durationSecs || 0) / 60);
        const secs = Math.round((s.durationSecs || 0) % 60);
        const dur = `${String(mins).padStart(2,"0")}:${String(secs).padStart(2,"0")}`;
        return (
          <Marker key={`stop-${i}`} position={[s.lat!, s.lng!]} icon={stoppageIcon}>
            <Popup>
              <div style={{ fontSize: 13, minWidth: 130 }}>
                <b style={{ color: "#f97316" }}>⏸ Stoppage</b><br/>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{dur}</span><br/>
                <span style={{ fontSize: 11, color: "#666" }}>{new Date(s.startTime).toLocaleTimeString()} – {new Date(s.endTime).toLocaleTimeString()}</span>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* CHK visit markers */}
      {visitStops.filter(v => v.lat && v.lng).map((v, i) => (
        <Marker key={`chk-${i}`} position={[v.lat, v.lng]} icon={chkIcon}>
          <Popup>
            <div style={{ minWidth: 150, fontSize: 13 }}>
              <b style={{ color: "#16a34a" }}>✓ CHK — {v.customerName}</b>
              <div style={{ color: "#555", fontSize: 11, marginTop: 2 }}>⏱ {v.durationStr}</div>
              {v.locationName && <div style={{ color: "#555", fontSize: 11 }}>{v.locationName}</div>}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* START marker */}
      {startPos && (
        <Marker position={startPos} icon={startIcon} zIndexOffset={200}>
          <Popup><div style={{ fontSize: 13 }}><b style={{ color: "#15803d" }}>▶ Trip Start</b>{punchInLat ? <><br/><span style={{ fontSize: 11, color: "#555" }}>Punch In location</span></> : null}</div></Popup>
        </Marker>
      )}

      {/* END marker */}
      {endPos && (
        <Marker position={endPos} icon={endIcon} zIndexOffset={200}>
          <Popup><div style={{ fontSize: 13 }}><b style={{ color: "#dc2626" }}>⬛ Trip End</b>{punchOutLat ? <><br/><span style={{ fontSize: 11, color: "#555" }}>Punch Out location</span></> : <><br/><span style={{ fontSize: 11, color: "#555" }}>Last recorded location</span></>}</div></Popup>
        </Marker>
      )}

      {/* Current live position — blue person avatar */}
      {currentPos && (
        <Marker position={currentPos} icon={currentPosIcon} zIndexOffset={1000}>
          <Popup><div style={{ fontSize: 13 }}><b>📍 Current Location</b><br/><span style={{ fontSize: 11, color: "#555" }}>Live tracking</span></div></Popup>
        </Marker>
      )}
    </>
  );
}

function LiveMap({
  locationPoints = [],
  segments = [],
  visitStops = [],
  punchInLat,
  punchInLng,
  punchOutLat,
  punchOutLng,
  mapTypeId,
  onMapTypeChange,
}: {
  locationPoints?: any[];
  segments?: LiveMapSegment[];
  visitStops?: VisitStop[];
  punchInLat?: number | null;
  punchInLng?: number | null;
  punchOutLat?: number | null;
  punchOutLng?: number | null;
  mapTypeId: string;
  onMapTypeChange: (t: string) => void;
}) {

  const gpsPoints = locationPoints
    .filter(p => p.latitude && p.longitude)
    .map(p => [Number(p.latitude), Number(p.longitude)] as [number, number]);
  const defaultCenter: [number, number] = gpsPoints.length > 0 ? gpsPoints[gpsPoints.length - 1]
    : punchInLat && punchInLng ? [punchInLat, punchInLng]
    : [22.8, 80.0];

  return (
    <div className="relative h-full w-full">
      <MapContainer center={defaultCenter} zoom={14} style={{ height: "100%", width: "100%" }} zoomControl={false}>
        <LiveMapInner
          locationPoints={locationPoints}
          segments={segments}
          visitStops={visitStops}
          punchInLat={punchInLat}
          punchInLng={punchInLng}
          punchOutLat={punchOutLat}
          punchOutLng={punchOutLng}
          mapTypeId={mapTypeId}
        />
        <ZoomControl position="bottomright" />
      </MapContainer>

      {/* Map type selector — top-right overlay */}
      <div className="absolute top-2 right-2 z-[1001] bg-white rounded shadow-md py-1.5 px-2.5 text-[11px] select-none">
        {MAP_TYPES.map(opt => (
          <label key={opt.id} className="flex items-center gap-1.5 cursor-pointer py-[2px]">
            <input type="radio" name="liveMapType" value={opt.id} checked={mapTypeId === opt.id} onChange={() => onMapTypeChange(opt.id)} className="accent-blue-600 w-3 h-3" />
            <span className="text-gray-700 leading-none">{opt.label}</span>
          </label>
        ))}
      </div>

      {/* Legend — bottom-left */}
      <div className="absolute bottom-10 left-2 z-[1000] bg-white/90 rounded shadow text-[10px] px-2 py-1.5 flex flex-col gap-1">
        <div className="flex items-center gap-1.5"><span className="inline-block w-6 h-[3px] rounded bg-blue-600"/><span>Travelled</span></div>
        <div className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-orange-500"/><span>Stoppage</span></div>
        <div className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-green-600"/><span>CHK Visit</span></div>
      </div>
    </div>
  );
}

function fmtPopupTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    const h = d.getHours(), m = d.getMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    const hh = h % 12 || 12;
    return `${hh}:${String(m).padStart(2, "0")} ${ampm}`;
  } catch { return "-"; }
}

// Fits map bounds whenever routePoints change — must be inside MapContainer
function PbBoundsFitter({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) {
      const bounds = L.latLngBounds(points.map(p => L.latLng(p[0], p[1])));
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [points, map]);
  return null;
}

// Captures Leaflet map ref so custom controls outside MapContainer can call map methods
function MapRefCapture({ onReady }: { onReady?: (m: any) => void }) {
  const map = useMap();
  useEffect(() => { if (typeof onReady === "function") onReady(map); }, [map]);
  return null;
}

// SVG drop-pin icon maker (Google Maps style teardrop pointing down)
function makePinIcon(fill: string, innerSvg: string, size = 32) {
  return L.divIcon({
    html: `<svg viewBox="0 0 32 44" width="${size}" height="${Math.round(size * 1.375)}" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 28 16 28S32 26 32 16C32 7.163 24.837 0 16 0z" fill="${fill}" stroke="white" stroke-width="2"/>
      ${innerSvg}
    </svg>`,
    className: "",
    iconSize: [size, Math.round(size * 1.375)],
    iconAnchor: [size / 2, Math.round(size * 1.375)],
    popupAnchor: [0, -Math.round(size * 1.375)],
  });
}

// Haversine distance in km
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Circle icon helper — used for all markers in both modes
function makeCircleIcon(bg: string, label: string, size = 34) {
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};border:3px solid white;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:${Math.round(size * 0.41)}px;color:white;box-shadow:0 2px 6px rgba(0,0,0,0.4)">${label}</div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Person avatar circle icon
function makePersonIcon() {
  return L.divIcon({
    html: `<div style="width:36px;height:36px;border-radius:50%;background:#2563eb;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.4)"><svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8V21.6h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg></div>`,
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

// Animated playback dot — blue pulsing circle
function makePlaybackDotIcon() {
  return L.divIcon({
    html: `<div style="width:18px;height:18px;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 0 0 4px rgba(37,99,235,0.25)"></div>`,
    className: "",
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

// Inner layer content — must be inside MapContainer so hooks work
function PlaybackMapInner({
  routePoints,
  chkStops,
  mapTypeId,
  routeColor,
  playbackPos,
  onMapReady,
}: {
  routePoints: [number, number][];
  chkStops: { pos: [number, number]; num: number; inTime: string; outTime: string; loc: string }[];
  mapTypeId: string;
  routeColor: string;
  playbackPos: [number, number] | null;
  onMapReady: (m: any) => void;
}) {
  const tile = LEAFLET_TILES[mapTypeId] ?? LEAFLET_TILES.roadmap;

  const startIcon = makeCircleIcon("#e11d48", "B", 34);
  const personIcon = makePersonIcon();
  const playbackDot = makePlaybackDotIcon();

  const lastPt = routePoints.length > 0 ? routePoints[routePoints.length - 1] : null;

  return (
    <>
      <TileLayer key={mapTypeId} url={tile.url} {...(tile.subdomains !== undefined ? { subdomains: tile.subdomains } : {})} attribution={tile.attr} maxZoom={20} />
      <MapRefCapture onReady={onMapReady} />
      <PbBoundsFitter points={routePoints} />

      {/* Route line — orange default, blue in playback mode */}
      {routePoints.length > 1 && (
        <Polyline positions={routePoints} pathOptions={{ color: routeColor, weight: 4, opacity: 0.9 }} />
      )}

      {/* Start marker — red B circle */}
      {routePoints.length > 0 && (
        <Marker position={routePoints[0]} icon={startIcon}>
          <Popup><b>Trip Start</b></Popup>
        </Marker>
      )}

      {/* CHK stop markers — numbered blue circles */}
      {chkStops.map((stop) => {
        const icon = makeCircleIcon("#2563eb", String(stop.num), 30);
        return (
          <Marker key={stop.num} position={stop.pos} icon={icon}>
            <Popup>
              <div style={{ minWidth: 150, fontSize: 13 }}>
                <b style={{ color: "#2563eb" }}>CHK {stop.num}</b>
                {stop.loc && <div style={{ color: "#555", fontSize: 11, marginTop: 2 }}>{stop.loc}</div>}
                <table style={{ marginTop: 6, width: "100%" }}>
                  <tbody>
                    <tr><td style={{ color: "#16a34a", fontWeight: 600, paddingRight: 8 }}>Punch In</td><td style={{ fontWeight: 600 }}>{stop.inTime}</td></tr>
                    <tr><td style={{ color: "#dc2626", fontWeight: 600, paddingRight: 8 }}>Punch Out</td><td style={{ fontWeight: 600 }}>{stop.outTime}</td></tr>
                  </tbody>
                </table>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Person avatar at last known GPS position — always shown */}
      {lastPt && (
        <Marker position={lastPt} icon={personIcon}>
          <Popup><b>Last Known Position</b></Popup>
        </Marker>
      )}

      {/* Playback mode: moving dot along the route */}
      {playbackPos && (
        <Marker position={playbackPos} icon={playbackDot} zIndexOffset={1000} />
      )}
    </>
  );
}

function PlaybackMap({ trips, date, employeeId, mapTypeId, onMapTypeChange }: {
  trips: TripWithVisits[];
  date: string;
  employeeId: number;
  mapTypeId: string;
  onMapTypeChange: (t: string) => void;
}) {
  const [layerOpen, setLayerOpen] = useState(false);
  // altMode=false → default view (orange route, Image 1)
  // altMode=true  → playback animation view (blue route + bar, Image 2)
  const [altMode, setAltMode] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [playbackIdx, setPlaybackIdx] = useState(0);
  const playTimerRef = useRef<any>(null);
  const leafletMap = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: locationData, refetch: refetchPlayback, isFetching: pbFetching } = useQuery<{ points: { latitude: string; longitude: string; recordedAt: string }[] }>({
    queryKey: ["/api/employees", employeeId, "locations", date, "playback"],
    queryFn: async () => {
      const res = await fetch(`/api/employees/${employeeId}/locations?date=${date}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!res.ok) return { points: [] };
      return res.json();
    },
    enabled: !!employeeId && !!date,
  });

  const filtered = trips.filter(t => t.startTime && format(new Date(t.startTime), "yyyy-MM-dd") === date);

  // Build route with timestamps for playback
  const routeWithTime = useMemo(() => {
    const gpsPts = (locationData?.points ?? [])
      .filter(p => p.latitude && p.longitude)
      .map(p => ({ pos: [Number(p.latitude), Number(p.longitude)] as [number, number], ts: p.recordedAt }));
    if (gpsPts.length > 0) return gpsPts;
    const waypoints: { pos: [number, number]; ts: string }[] = [];
    filtered.forEach(trip => {
      if (trip.startLatitude && trip.startLongitude)
        waypoints.push({ pos: [Number(trip.startLatitude), Number(trip.startLongitude)], ts: trip.startTime as string });
      (trip.visits || []).forEach(v => {
        if (v.punchInLatitude && v.punchInLongitude)
          waypoints.push({ pos: [Number(v.punchInLatitude), Number(v.punchInLongitude)], ts: v.punchInTime as unknown as string });
      });
      if (trip.endLatitude && trip.endLongitude)
        waypoints.push({ pos: [Number(trip.endLatitude), Number(trip.endLongitude)], ts: trip.endTime as string });
    });
    return waypoints;
  }, [locationData, filtered]);

  const routePoints = useMemo(() => routeWithTime.map(r => r.pos), [routeWithTime]);

  // Build CHK stop list
  const chkStops = useMemo(() => {
    let num = 1;
    return filtered.flatMap(trip =>
      (trip.visits || []).filter(v => v.punchInLatitude && v.punchInLongitude).map(v => ({
        pos: [Number(v.punchInLatitude!), Number(v.punchInLongitude!)] as [number, number],
        num: num++,
        inTime: fmtPopupTime(v.punchInTime as unknown as string),
        outTime: fmtPopupTime(v.punchOutTime as unknown as string),
        loc: v.punchInLocationName || v.punchOutLocationName || "",
      }))
    );
  }, [filtered]);

  // Playback timer — advances index when playing
  useEffect(() => {
    if (playing) {
      playTimerRef.current = setInterval(() => {
        setPlaybackIdx(prev => {
          if (prev >= routeWithTime.length - 1) { setPlaying(false); return prev; }
          return prev + 1;
        });
      }, 180);
    } else {
      clearInterval(playTimerRef.current);
    }
    return () => clearInterval(playTimerRef.current);
  }, [playing, routeWithTime.length]);

  // Reset playback when date or altMode changes
  useEffect(() => { setPlaybackIdx(0); setPlaying(false); }, [date, altMode]);

  // Speed between consecutive points (km/h)
  const currentSpeedKmh = useMemo(() => {
    if (routeWithTime.length < 2 || playbackIdx === 0) return 0;
    const p1 = routeWithTime[playbackIdx - 1];
    const p2 = routeWithTime[playbackIdx];
    const distKm = haversineKm(p1.pos[0], p1.pos[1], p2.pos[0], p2.pos[1]);
    const timeSec = (new Date(p2.ts).getTime() - new Date(p1.ts).getTime()) / 1000;
    if (timeSec <= 0) return 0;
    return (distKm / timeSec) * 3600;
  }, [routeWithTime, playbackIdx]);

  const currentTs = routeWithTime[playbackIdx]?.ts;
  const tsDisplay = currentTs ? format(new Date(currentTs), "yyyy-MM-dd HH:mm") : "--";
  const speedDisplay = `${currentSpeedKmh.toFixed(2)} KM/H`;

  // Moving dot position during playback — visible whenever animation has started
  const playbackPos: [number, number] | null = routeWithTime.length > 0 && playbackIdx > 0
    ? routeWithTime[Math.min(playbackIdx, routeWithTime.length - 1)].pos
    : null;

  const defaultCenter: [number, number] = routePoints.length > 0 ? routePoints[0] : [22.8, 80.0];

  const fitBounds = () => {
    const m = leafletMap.current;
    if (!m || routePoints.length < 2) return;
    const bounds = L.latLngBounds(routePoints.map(p => L.latLng(p[0], p[1])));
    m.fitBounds(bounds, { padding: [40, 40] });
  };

  // 2nd icon: toggle playback mode + fit bounds
  const handleLocateToggle = () => {
    setAltMode(prev => !prev);
    fitBounds();
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  const ctrlBtn = "w-[34px] h-[34px] bg-white flex items-center justify-center hover:bg-gray-50 cursor-pointer border-b border-gray-200 last:border-b-0";

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <MapContainer
        key={date}
        center={defaultCenter}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <PlaybackMapInner
          routePoints={routePoints}
          chkStops={chkStops}
          mapTypeId={mapTypeId}
          routeColor={altMode ? "#2563eb" : "#f97316"}
          playbackPos={playbackPos}
          onMapReady={(m) => { leafletMap.current = m; }}
        />
      </MapContainer>

      {/* ── Right-side control panel ── */}
      <div className="absolute z-[1001] select-none flex flex-col items-center gap-[6px]" style={{ top: 10, right: 10 }}>

        {/* 1. Layers / map-type selector */}
        <div className="relative">
          <button
            onClick={() => setLayerOpen(o => !o)}
            title="Map type"
            className="w-[34px] h-[34px] bg-white rounded shadow-md flex items-center justify-center hover:bg-gray-50 border border-gray-300"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"/>
              <polyline points="2 12 12 17 22 12"/>
              <polyline points="2 17 12 22 22 17"/>
            </svg>
          </button>
          {layerOpen && (
            <div className="absolute right-0 top-[38px] bg-white rounded shadow-lg border border-gray-200 py-1 w-[150px] text-[12px] z-[1002]">
              {MAP_TYPES.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { onMapTypeChange(opt.id); setLayerOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 ${mapTypeId === opt.id ? "font-semibold text-blue-600" : "text-gray-700"}`}
                >
                  {mapTypeId === opt.id ? <span className="text-blue-600">✓</span> : <span className="w-3"/>}
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. Target button — toggles orange ↔ blue route */}
        <button
          onClick={handleLocateToggle}
          title={altMode ? "Back to standard view" : "Playback animation mode"}
          className="w-[34px] h-[34px] bg-white rounded shadow-md flex items-center justify-center hover:bg-gray-50 border border-gray-300"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke={altMode ? "#1a73e8" : "#666"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="7"/>
            <line x1="12" y1="1" x2="12" y2="5"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="1" y1="12" x2="5" y2="12"/>
            <line x1="19" y1="12" x2="23" y2="12"/>
          </svg>
        </button>

        {/* 3+4. Zoom +/− group */}
        <div className="bg-white rounded shadow-md border border-gray-300 overflow-hidden flex flex-col">
          <button onClick={() => leafletMap.current?.zoomIn()} title="Zoom in" className={ctrlBtn}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#666" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          <button onClick={() => leafletMap.current?.zoomOut()} title="Zoom out" className={ctrlBtn}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#666" strokeWidth="2.5" strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>

        {/* 5. Fullscreen toggle */}
        <button
          onClick={toggleFullscreen}
          title="Fullscreen"
          className="w-[34px] h-[34px] bg-white rounded shadow-md flex items-center justify-center hover:bg-gray-50 border border-gray-300"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
            <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
          </svg>
        </button>

        {/* 6. Blue location pin — go to route start */}
        <button
          onClick={() => { if (routePoints.length > 0 && leafletMap.current) leafletMap.current.setView(routePoints[0], 15); }}
          title="Go to start"
          className="w-[34px] h-[34px] bg-white rounded shadow-md flex items-center justify-center hover:bg-gray-50 border border-gray-300"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="#1a73e8" stroke="white" strokeWidth="0.5">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </button>
      </div>

      {/* ── Playback bar — always visible at the bottom ── */}
      <div className="absolute bottom-0 left-0 right-0 z-[1001] bg-white border-t border-gray-200 px-4 py-2.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-5">
          {/* Play / Pause */}
          <button
            onClick={() => {
              if (playbackIdx >= routeWithTime.length - 1) setPlaybackIdx(0);
              setPlaying(p => !p);
            }}
            title={playing ? "Pause" : "Play"}
            className="text-gray-700 hover:text-blue-600 transition-colors"
          >
            {playing ? (
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            )}
          </button>
          {/* Stop / Reset */}
          <button
            onClick={() => { setPlaying(false); setPlaybackIdx(0); }}
            title="Stop & Reset"
            className="text-gray-700 hover:text-blue-600 transition-colors"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9"/>
            </svg>
          </button>
        </div>
        {/* Speed + Refresh + Timestamp */}
        <div className="flex items-center gap-4 text-[13px] font-mono text-gray-700 font-medium">
          {playbackIdx > 0 && <span>{speedDisplay}</span>}
          <button
            onClick={() => { setPlaying(false); setPlaybackIdx(0); refetchPlayback(); }}
            title="Refresh GPS data"
            className="text-blue-500 hover:text-blue-700 transition-colors"
          >
            <svg
              viewBox="0 0 24 24" width="18" height="18" fill="none"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
              className={pbFetching ? "animate-spin" : ""}
            >
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </button>
          <span>{tsDisplay}</span>
        </div>
      </div>
    </div>
  );
}

export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const empId = Number(id);
  const [activeTab, setActiveTab] = useState<ProfileTab>("live");
  const [playbackDate, setPlaybackDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [liveDate, setLiveDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [speedLimitKm, setSpeedLimitKm] = useState(100);
  const [stoppageMinutes, setStoppageMinutes] = useState(30);
  const [sharedMapTypeId, setSharedMapTypeId] = useState("hybrid");

  const { data: employee, isLoading: empLoading } = useQuery<Employee>({
    queryKey: ["/api/employees", empId],
    queryFn: async () => {
      const res = await fetch(`/api/employees/${empId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!empId,
  });

  const { data: trips = [], isLoading: tripsLoading } = useQuery<TripWithVisits[]>({
    queryKey: ["/api/employees", empId, "trips"],
    queryFn: async () => {
      const res = await fetch(`/api/employees/${empId}/trips`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!empId,
  });

  const { data: locationData, isLoading: locationLoading, refetch: refetchLocations } = useQuery<{
    points: any[];
    segments: Array<
      | { type: "travelled"; startTime: string; endTime: string; distanceKm: number }
      | { type: "stoppage"; startTime: string; endTime: string; durationSecs: number; lat: number; lng: number }
    >;
    totalKm: number;
    stoppageCount: number;
  }>({
    queryKey: ["/api/employees", empId, "locations", liveDate],
    queryFn: async () => {
      const res = await fetch(`/api/employees/${empId}/locations?date=${liveDate}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!empId && activeTab === "live",
    refetchInterval: 30000,
  });

  const { data: playbackLocationData } = useQuery<{
    points: Array<{ latitude: string; longitude: string; speed: string | null; recordedAt: string }>;
    totalKm: number;
    stoppageCount: number;
    segments: any[];
  }>({
    queryKey: ["/api/employees", empId, "locations", playbackDate, "playback-stats"],
    queryFn: async () => {
      const res = await fetch(`/api/employees/${empId}/locations?date=${playbackDate}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!empId && activeTab === "playback",
  });

  const { data: liveCheckins = [], refetch: refetchCheckins } = useQuery<any[]>({
    queryKey: ["/api/employees", empId, "checkins", liveDate],
    queryFn: async () => {
      const res = await fetch(`/api/employees/${empId}/checkins?date=${liveDate}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!empId && activeTab === "live",
    refetchInterval: 30000,
  });

  const { data: attendanceRecords = [], isLoading: attLoading } = useQuery<any[]>({
    queryKey: ["/api/employees", empId, "attendance"],
    queryFn: async () => {
      const res = await fetch(`/api/employees/${empId}/attendance`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!empId,
  });

  const { data: employeeTasks = [], isLoading: tasksLoading } = useQuery<any[]>({
    queryKey: ["/api/tasks", "employee", empId],
    queryFn: async () => {
      const res = await fetch(`/api/tasks`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed");
      const all = await res.json();
      return all.filter((t: any) => t.employeeDbId === empId);
    },
    enabled: !!empId,
  });

  const { data: employeeFeeds = [], isLoading: feedsLoading } = useQuery<any[]>({
    queryKey: ["/api/feeds", "employee", empId],
    queryFn: async () => {
      const res = await fetch(`/api/feeds?employeeId=${empId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!empId,
  });

  const { data: allExpenses = [], isLoading: expensesLoading } = useQuery<any[]>({
    queryKey: ["/api/expenses", "employee", empId],
    queryFn: async () => {
      const res = await fetch(`/api/expenses`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed");
      const all = await res.json();
      return all.filter((e: any) => e.employeeDbId === empId);
    },
    enabled: !!empId && activeTab === "expense",
  });

  if (empLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Employee not found.
        <Button variant="ghost" onClick={() => navigate("/employees")}>Back to Employees</Button>
      </div>
    );
  }

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const todayTrips = trips.filter(t => t.startTime && format(new Date(t.startTime), "yyyy-MM-dd") === todayStr);
  const todayKm = todayTrips.reduce((s, t) => s + Number(t.totalKm || 0), 0);
  const todayCheckIns = todayTrips.reduce((s, t) => s + (t.visits || []).filter(v => v.punchInTime).length, 0);
  const todayCheckOuts = todayTrips.reduce((s, t) => s + (t.visits || []).filter(v => v.punchOutTime).length, 0);
  const punchInToday = todayTrips[0]?.startTime;
  const lastLocation = (() => {
    for (const trip of [...trips].reverse()) {
      const lastVisit = [...(trip.visits || [])].reverse().find(v => v.punchOutLocationName || v.punchInLocationName);
      if (lastVisit) return lastVisit.punchOutLocationName || lastVisit.punchInLocationName;
      if (trip.endLocationName) return trip.endLocationName;
    }
    return null;
  })();

  const expenses = trips.filter(t => t.expenseAmount && Number(t.expenseAmount) > 0);

  // Build visit events from customer_checkins table (real check-in/check-out data from employee app)
  type VisitStoppage = {
    type: "visit";
    checkinId: number;
    startTime: string;
    endTime: string | null;
    customerName: string;
    locationName: string | null;
    lat: number | null;
    lng: number | null;
  };
  const liveDateVisitEvents: VisitStoppage[] = liveCheckins.map((c: any) => ({
    type: "visit" as const,
    checkinId: c.id,
    startTime: c.checkedInAt,
    endTime: c.checkedOutAt || null,
    customerName: c.customerName || "Customer Visit",
    locationName: c.locationName || null,
    lat: c.locationLatitude ? Number(c.locationLatitude) : null,
    lng: c.locationLongitude ? Number(c.locationLongitude) : null,
  }));

  type GpsSegment =
    | { type: "travelled"; startTime: string; endTime: string; distanceKm: number }
    | { type: "stoppage"; startTime: string; endTime: string; durationSecs: number; lat: number; lng: number };
  type PunchEvent = { type: "punch_in" | "punch_out"; startTime: string; location: string | null; lat: number | null; lng: number | null };
  type TimelineEvent = GpsSegment | VisitStoppage | PunchEvent;

  // Find attendance record for the selected live date
  const liveDateAttendance = attendanceRecords.find((r: any) => {
    if (!r.date) return false;
    try { return format(new Date(r.date), "yyyy-MM-dd") === liveDate; } catch { return false; }
  });

  const makeTimeISO = (hhmm: string, dateStr: string): string => {
    try {
      const parts = hhmm.split(":");
      const d = new Date(dateStr);
      d.setHours(Number(parts[0]), Number(parts[1]), Number(parts[2] || 0), 0);
      return d.toISOString();
    } catch { return new Date(dateStr).toISOString(); }
  };

  const punchInEvent: PunchEvent | null = liveDateAttendance?.checkIn
    ? {
        type: "punch_in",
        startTime: makeTimeISO(String(liveDateAttendance.checkIn), liveDate),
        location: liveDateAttendance.checkInLocation || null,
        lat: liveDateAttendance.checkInLatitude ? Number(liveDateAttendance.checkInLatitude) : null,
        lng: liveDateAttendance.checkInLongitude ? Number(liveDateAttendance.checkInLongitude) : null,
      }
    : null;

  const punchOutEvent: PunchEvent | null = liveDateAttendance?.checkOut
    ? {
        type: "punch_out",
        startTime: makeTimeISO(String(liveDateAttendance.checkOut), liveDate),
        location: liveDateAttendance.checkOutLocation || null,
        lat: liveDateAttendance.checkOutLatitude ? Number(liveDateAttendance.checkOutLatitude) : null,
        lng: liveDateAttendance.checkOutLongitude ? Number(liveDateAttendance.checkOutLongitude) : null,
      }
    : null;

  // Remove GPS-computed stoppages that overlap with customer visits (same time window)
  // so we don't show duplicate stoppages at the same location/time
  const filteredGpsSegments = (locationData?.segments || [] as GpsSegment[]).filter(seg => {
    if (seg.type !== "stoppage") return true; // always keep travelled segments
    const segStart = new Date(seg.startTime).getTime();
    const segEnd = new Date(seg.endTime).getTime();
    const OVERLAP_MS = 3 * 60 * 1000; // 3 min tolerance
    return !liveDateVisitEvents.some(v => {
      const vStart = new Date(v.startTime).getTime();
      const vEnd = v.endTime ? new Date(v.endTime).getTime() : Date.now();
      return segStart <= (vEnd + OVERLAP_MS) && segEnd >= (vStart - OVERLAP_MS);
    });
  });

  type GapTravel = { type: "gap_travel"; startTime: string; endTime: string };

  const rawTimelineEvents: TimelineEvent[] = [
    ...(punchInEvent ? [punchInEvent] : []),
    ...filteredGpsSegments,
    ...liveDateVisitEvents,
    ...(punchOutEvent ? [punchOutEvent] : []),
  ].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  // Helper: get the end-time of an event (for gap detection)
  const eventEndTime = (e: TimelineEvent): string | null => {
    if (e.type === "punch_in") return e.startTime;
    if (e.type === "punch_out") return e.startTime;
    if (e.type === "travelled" || e.type === "stoppage") return (e as any).endTime ?? null;
    if (e.type === "visit") return e.endTime ?? e.startTime;
    return null;
  };

  // Fill gaps > 90s between consecutive events with a synthesised "Travelled" entry
  const allTimelineEvents: (TimelineEvent | GapTravel)[] = [];
  for (let i = 0; i < rawTimelineEvents.length; i++) {
    const ev = rawTimelineEvents[i];
    allTimelineEvents.push(ev);
    if (i < rawTimelineEvents.length - 1) {
      const endT = eventEndTime(ev);
      const nextStartT = rawTimelineEvents[i + 1].startTime;
      if (endT) {
        const gapMs = new Date(nextStartT).getTime() - new Date(endT).getTime();
        if (gapMs > 90 * 1000) {
          allTimelineEvents.push({ type: "gap_travel", startTime: endT, endTime: nextStartT });
        }
      }
    }
  }

  const hasTimeline = allTimelineEvents.length > 0 || !!liveDateAttendance;

  const playbackDateTrips = trips.filter(t => t.startTime && format(new Date(t.startTime), "yyyy-MM-dd") === playbackDate);
  const playbackKm = playbackLocationData?.totalKm ?? playbackDateTrips.reduce((s, t) => s + Number(t.totalKm || 0), 0);
  const playbackCheckIns = playbackDateTrips.reduce((s, t) => s + (t.visits || []).filter(v => v.punchInTime).length, 0);
  const playbackCheckOuts = playbackDateTrips.reduce((s, t) => s + (t.visits || []).filter(v => v.punchOutTime).length, 0);
  const speedViolations = (playbackLocationData?.points ?? []).filter(p => p.speed && Number(p.speed) * 3.6 > speedLimitKm).length;
  const playbackStoppages = playbackLocationData?.stoppageCount ?? 0;

  const tabs: { key: ProfileTab; label: string; icon?: React.ReactNode }[] = [
    { key: "live", label: "Live" },
    { key: "playback", label: "Playback" },
    { key: "task", label: "Task" },
    { key: "attendance", label: "All Attendance" },
    { key: "details", label: "Details" },
    { key: "feeds", label: "Feeds" },
    { key: "expense", label: "Expense" },
    { key: "audit", label: "Audit History" },
  ];

  return (
    <div className="space-y-0 -m-4 md:-m-8 animate-in fade-in">
      <div className="bg-card border-b px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <button onClick={() => navigate("/employees")} className="flex items-center gap-1 hover:text-primary transition-colors" data-testid="link-back-employees">
            <ArrowLeft className="h-4 w-4" /> Employees
          </button>
          <span>/</span>
          <span className="text-foreground font-medium">{employee.fullName}</span>
        </div>

        <div className="flex items-start gap-4 flex-wrap">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0"
            style={{ backgroundColor: avatarColor(employee.fullName) }}
            data-testid="avatar-employee"
          >
            {employee.fullName.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold" data-testid="text-employee-name">{employee.fullName}</h1>
              <Badge variant={employee.status === "active" ? "default" : "secondary"} className="text-xs" data-testid="badge-employee-status">
                {employee.status === "active" ? "Active" : employee.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground capitalize">{employee.role || "Employee"}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" /> {employee.employeeId}
              </span>
              {employee.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {employee.phone}
                </span>
              )}
              {employee.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {employee.email}
                </span>
              )}
              {employee.joinDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {formatDate(employee.joinDate)}
                </span>
              )}
              {employee.workLocation && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {employee.workLocation}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/employees")} data-testid="button-back-emp">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-card border-b px-6 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`tab-emp-${key}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 md:p-6">
        {activeTab === "live" && (
          <div className="flex gap-0 rounded-xl border overflow-hidden bg-card" style={{ height: "calc(100vh - 210px)", minHeight: "600px" }}>

            {/* ── LEFT: TrackClap-style activity panel ── */}
            <div className="w-64 shrink-0 flex flex-col border-r bg-white" style={{ height: "100%" }}>

              {/* Header exactly as TrackClap: date row + "Completed N | Distance X Km" */}
              <div className="px-3 py-2 border-b bg-white shrink-0">
                <div className="flex items-center gap-1 mb-1.5">
                  <Input
                    type="date"
                    value={liveDate}
                    onChange={(e) => setLiveDate(e.target.value)}
                    className="h-6 text-[11px] flex-1 border-gray-200"
                    data-testid="input-live-date"
                  />
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => { refetchLocations(); refetchCheckins(); }} data-testid="button-refresh-locations">
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-gray-600">
                  <span>Completed</span>
                  <span className="font-bold text-gray-900">{liveCheckins.length}</span>
                  <span className="text-gray-300 mx-1">|</span>
                  <span>Distance</span>
                  <span className="font-bold text-gray-900">{(locationData?.totalKm ?? 0).toFixed(2)} Km</span>
                  {locationLoading && <Loader2 className="h-3 w-3 animate-spin text-gray-400 ml-auto" />}
                </div>
              </div>

              {/* Timeline scroll area */}
              <div className="flex-1 overflow-y-auto">
                {locationLoading && !hasTimeline ? (
                  <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : !hasTimeline ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-xs gap-2 px-4 text-center">
                    <Timer className="h-10 w-10 opacity-20" />
                    <p className="font-medium">No activity recorded</p>
                    <p className="text-[10px] opacity-70">GPS pings are sent every 30 seconds</p>
                  </div>
                ) : (
                  /* ── TrackClap-style timeline: icon circles ON the vertical line ── */
                  <div className="relative">
                    {/* Continuous vertical connector line, centred on icons at left=[19px] */}
                    <div className="absolute left-[19px] top-0 bottom-0 w-[2px] bg-gray-200 z-0" />

                    {allTimelineEvents.map((seg, idx) => {
                      const startT = new Date(seg.startTime);
                      const fmt  = (d: Date) => d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
                      const fmtS = (d: Date) => d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });

                      // Icon bubble sitting on the connector line
                      const dot = (bgCls: string, children: React.ReactNode) => (
                        <div className={`absolute left-[8px] top-[8px] z-10 w-[22px] h-[22px] rounded-full ${bgCls} border-[2.5px] border-white shadow-md flex items-center justify-center`}>
                          {children}
                        </div>
                      );
                      // Right-label span
                      const dur = (label: string) => (
                        <span className="text-[10px] text-gray-400 shrink-0 font-mono ml-auto pl-1">({label})</span>
                      );
                      // Time-range row
                      const timeRow = (a: Date, b?: Date | null) => (
                        <p className="text-[10px] text-gray-400 font-mono leading-none mt-0.5">{fmtS(a)}{b ? `–${fmtS(b)}` : ""}</p>
                      );

                      /* ── GAP TRAVEL (synthesised gap between events) ── */
                      if (seg.type === "gap_travel") {
                        const gapEndT = new Date((seg as any).endTime);
                        return (
                          <div key={idx} className="relative flex items-start pl-[40px] pr-3 py-[7px]">
                            {dot("bg-orange-400", <Navigation className="w-2.5 h-2.5 text-white" />)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline">
                                <p className="text-[11px] font-semibold text-orange-700 leading-tight">Travelled</p>
                                {dur(formatDuration(startT, gapEndT))}
                              </div>
                              {timeRow(startT, gapEndT)}
                            </div>
                          </div>
                        );
                      }

                      /* ── PUNCH IN ── */
                      if (seg.type === "punch_in") {
                        return (
                          <div key={idx} className="relative flex items-start pl-[40px] pr-3 py-[7px] hover:bg-green-50/50 transition-colors">
                            {dot("bg-green-600", <span className="text-[7px] font-black text-white leading-none">IN</span>)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline">
                                <p className="text-[11px] font-bold text-green-700 leading-tight">Punch In</p>
                                {dur(fmt(startT))}
                              </div>
                              {seg.location
                                ? <p className="text-[10px] text-gray-500 leading-snug mt-0.5 line-clamp-2">{seg.location}</p>
                                : (seg.lat && seg.lng ? <StoppageAddress lat={seg.lat!} lng={seg.lng!} /> : null)
                              }
                            </div>
                          </div>
                        );
                      }

                      /* ── PUNCH OUT ── */
                      if (seg.type === "punch_out") {
                        return (
                          <div key={idx} className="relative flex items-start pl-[40px] pr-3 py-[7px] hover:bg-red-50/50 transition-colors">
                            {dot("bg-red-600", <span className="text-[6px] font-black text-white leading-none">OUT</span>)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline">
                                <p className="text-[11px] font-bold text-red-700 leading-tight">Punch Out</p>
                                {dur(fmt(startT))}
                              </div>
                              {seg.location
                                ? <p className="text-[10px] text-gray-500 leading-snug mt-0.5 line-clamp-2">{seg.location}</p>
                                : (seg.lat && seg.lng ? <StoppageAddress lat={seg.lat!} lng={seg.lng!} /> : null)
                              }
                            </div>
                          </div>
                        );
                      }

                      /* ── STOPPAGE ── */
                      if (seg.type === "stoppage") {
                        const mm = Math.floor(seg.durationSecs / 60);
                        const ss = Math.round(seg.durationSecs % 60);
                        return (
                          <div key={idx} className="relative flex items-start pl-[40px] pr-3 py-[7px] hover:bg-gray-50 transition-colors">
                            {dot("bg-gray-400", <Timer className="w-2.5 h-2.5 text-white" />)}
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-gray-700 leading-tight">
                                Stoppage of {String(mm).padStart(2,"0")}:{String(ss).padStart(2,"0")}
                              </p>
                              {timeRow(new Date(seg.startTime), new Date(seg.endTime))}
                              <StoppageAddress lat={seg.lat} lng={seg.lng} />
                            </div>
                          </div>
                        );
                      }

                      /* ── VISIT / CHECK-IN (CHK) ── */
                      if (seg.type === "visit") {
                        const outT = seg.endTime ? new Date(seg.endTime) : null;
                        const durSecs = outT ? Math.round((outT.getTime() - startT.getTime()) / 1000) : null;
                        const durShort = durSecs !== null
                          ? (durSecs < 60 ? `${durSecs} Sec` : `${Math.floor(durSecs / 60)}m ${durSecs % 60}s`)
                          : "ongoing";
                        return (
                          <div key={idx} className="relative flex items-start pl-[40px] pr-3 py-[7px] hover:bg-blue-50/40 transition-colors">
                            {dot("bg-blue-600", <MapPin className="w-2.5 h-2.5 text-white" />)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline">
                                <p className="text-[11px] font-bold text-blue-700 leading-tight">CHK {seg.checkinId}</p>
                                {dur(durShort)}
                              </div>
                              <p className="text-[10px] text-gray-400 font-mono leading-none mt-0.5">{fmt(startT)}{outT ? `–${fmt(outT)}` : ""}</p>
                              <p className="text-[10px] text-blue-800 font-semibold leading-snug mt-0.5 line-clamp-1">● {seg.customerName}</p>
                              {seg.locationName
                                ? <p className="text-[10px] text-gray-500 leading-none mt-0.5 line-clamp-1">{seg.locationName}</p>
                                : (seg.lat && seg.lng ? <StoppageAddress lat={seg.lat} lng={seg.lng} /> : null)
                              }
                            </div>
                          </div>
                        );
                      }

                      /* ── TRAVELLED (from GPS segments — server computed) ── */
                      const endT = new Date((seg as any).endTime);
                      const distKm: number = (seg as any).distanceKm ?? 0;
                      const distLabel = distKm === 0 ? "0" : distKm < 1 ? distKm.toFixed(1) : distKm.toFixed(2);
                      return (
                        <div key={idx} className="relative flex items-start pl-[40px] pr-3 py-[7px]">
                          {dot("bg-orange-500", <Navigation className="w-2.5 h-2.5 text-white" />)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline">
                              <p className="text-[11px] font-semibold text-orange-700 leading-tight">Travelled ({distLabel} Km)</p>
                              {dur(formatDuration(startT, endT))}
                            </div>
                            {timeRow(startT, endT)}
                          </div>
                        </div>
                      );
                    })}

                    {/* ── Nearest Location footer ── */}
                    {(locationData?.points?.length ?? 0) > 0 && (() => {
                      const lastPt = locationData!.points[locationData!.points.length - 1];
                      return (
                        <div className="relative flex items-start pl-[40px] pr-3 py-[7px] border-t border-gray-100 bg-green-50/50">
                          <div className="absolute left-[8px] top-[7px] z-10 w-[22px] h-[22px] rounded-full bg-green-500 border-[2.5px] border-white shadow-md flex items-center justify-center">
                            <MapPin className="w-2.5 h-2.5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-green-700 leading-tight">Nearest Location</p>
                            <LastGpsAddress point={lastPt} />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT: Full-height Map ── */}
            <div className="flex-1 relative" style={{ height: "100%" }}>
                {tripsLoading ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <LiveMap
                    locationPoints={locationData?.points ?? []}
                    segments={filteredGpsSegments as LiveMapSegment[]}
                    visitStops={liveDateVisitEvents
                      .filter(v => v.lat && v.lng)
                      .map(v => ({
                        lat: v.lat!,
                        lng: v.lng!,
                        customerName: v.customerName,
                        locationName: v.locationName,
                        durationStr: v.endTime
                          ? formatDuration(new Date(v.startTime), new Date(v.endTime))
                          : "ongoing",
                      }))}
                    punchInLat={punchInEvent?.lat ?? null}
                    punchInLng={punchInEvent?.lng ?? null}
                    punchOutLat={punchOutEvent?.lat ?? null}
                    punchOutLng={punchOutEvent?.lng ?? null}
                    mapTypeId={sharedMapTypeId}
                    onMapTypeChange={setSharedMapTypeId}
                  />
                )}
              </div>
          </div>
        )}

        {activeTab === "playback" && (
          <div className="flex gap-0 rounded-xl border overflow-hidden bg-card" style={{ minHeight: "620px" }}>

            {/* ── LEFT: sidebar (same style as Live tab) ── */}
            <div className="w-64 shrink-0 flex flex-col border-r bg-white" style={{ minHeight: "620px" }}>

              {/* Header: date picker + stats */}
              <div className="px-3 py-2.5 border-b bg-gray-50 shrink-0 space-y-2">
                <Input
                  type="date"
                  value={playbackDate}
                  onChange={(e) => setPlaybackDate(e.target.value)}
                  className="h-7 text-xs w-full"
                  data-testid="input-playback-date"
                />
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Speed Limit (km/h)</p>
                    <Input type="number" value={speedLimitKm} onChange={e => setSpeedLimitKm(Number(e.target.value))} className="h-6 text-xs" />
                  </div>
                  <div>
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Stoppage (min)</p>
                    <Input type="number" value={stoppageMinutes} onChange={e => setStoppageMinutes(Number(e.target.value))} className="h-6 text-xs" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <div className="flex flex-col items-center bg-white rounded border py-1">
                    <span className="text-muted-foreground text-[9px]">Distance</span>
                    <span className="font-bold text-foreground">{playbackKm.toFixed(2)} km</span>
                  </div>
                  <div className="flex flex-col items-center bg-white rounded border py-1">
                    <span className="text-muted-foreground text-[9px]">Stoppages</span>
                    <span className="font-bold text-foreground">{playbackStoppages}</span>
                  </div>
                  <div className="flex flex-col items-center bg-white rounded border py-1">
                    <span className="text-muted-foreground text-[9px]">Check In</span>
                    <span className="font-bold text-green-600">{playbackCheckIns}</span>
                  </div>
                  <div className="flex flex-col items-center bg-white rounded border py-1">
                    <span className="text-muted-foreground text-[9px]">Check Out</span>
                    <span className="font-bold text-red-500">{playbackCheckOuts}</span>
                  </div>
                  {speedViolations > 0 && (
                    <div className="col-span-2 flex flex-col items-center bg-red-50 rounded border border-red-200 py-1">
                      <span className="text-muted-foreground text-[9px]">Speed Violations</span>
                      <span className="font-bold text-red-600">{speedViolations}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline scroll area */}
              <div className="flex-1 overflow-y-auto">
                {(() => {
                  const pbSegments = playbackLocationData?.segments ?? [];
                  const pbVisits = playbackDateTrips.flatMap((trip, ti) =>
                    (trip.visits || []).map((v, vi) => ({ v, idx: ti * 10 + vi + 1 }))
                  );
                  const hasPlaybackActivity = pbSegments.length > 0 || pbVisits.length > 0;

                  if (!hasPlaybackActivity) return (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-xs gap-2 px-4 text-center">
                      <Timer className="h-10 w-10 opacity-20" />
                      <p className="font-medium">No activity recorded</p>
                      <p className="text-[10px] opacity-70">GPS pings are sent every 60 seconds</p>
                    </div>
                  );

                  const fmtT = (iso: string) => {
                    try { const d = new Date(iso); return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }); } catch { return "-"; }
                  };
                  const fmtDur = (secs: number) => `${String(Math.floor(secs / 60)).padStart(2, "0")}m ${String(Math.round(secs % 60)).padStart(2, "0")}s`;

                  return (
                    <div className="relative py-2">
                      <div className="absolute left-[27px] top-2 bottom-2 w-px bg-gray-200" />

                      {pbSegments.map((seg: any, idx: number) => {
                        if (seg.type === "stoppage") {
                          return (
                            <div key={idx} className="flex items-start gap-2 px-3 py-2 hover:bg-gray-50">
                              <div className="relative z-10 shrink-0 w-9 flex justify-center pt-0.5">
                                <div className="w-7 h-7 rounded-full bg-red-100 border border-red-300 flex items-center justify-center">
                                  <Timer className="w-3.5 h-3.5 text-red-500" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0 pt-0.5">
                                <p className="text-[11px] font-semibold text-red-700">Stoppage of {fmtDur(seg.durationSecs)}</p>
                                <p className="text-[10px] text-gray-500 font-mono">{fmtT(seg.startTime)}–{fmtT(seg.endTime)}</p>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div key={idx} className="flex items-start gap-2 px-3 py-2 hover:bg-orange-50/50">
                            <div className="relative z-10 shrink-0 w-9 flex justify-center pt-0.5">
                              <div className="w-7 h-7 rounded-full bg-orange-100 border border-orange-300 flex items-center justify-center">
                                <Navigation className="w-3.5 h-3.5 text-orange-600" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                              <div className="flex items-baseline justify-between gap-1">
                                <p className="text-[11px] font-semibold text-orange-700">Travelled ({(seg.distanceKm ?? 0).toFixed(2)} km)</p>
                              </div>
                              <p className="text-[10px] text-gray-500 font-mono">{fmtT(seg.startTime)}–{fmtT(seg.endTime)}</p>
                            </div>
                          </div>
                        );
                      })}

                      {pbVisits.map(({ v, idx }) => (
                        <div key={idx} className="flex items-start gap-2 px-3 py-2 hover:bg-blue-50/50">
                          <div className="relative z-10 shrink-0 w-9 flex justify-center pt-0.5">
                            <div className="w-7 h-7 rounded-full bg-blue-600 border-2 border-white shadow flex items-center justify-center">
                              <span className="text-white text-[9px] font-bold">{idx}</span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <p className="text-[11px] font-bold text-blue-700">CHK {idx}</p>
                            <p className="text-[10px] text-gray-500 font-mono">
                              {fmtT(v.punchInTime as unknown as string)}
                              {v.punchOutTime ? `–${fmtT(v.punchOutTime as unknown as string)}` : ""}
                            </p>
                            {(v.punchInLocationName || v.punchOutLocationName) && (
                              <p className="text-[10px] text-blue-600 mt-0.5 line-clamp-1">{v.punchInLocationName || v.punchOutLocationName}</p>
                            )}
                          </div>
                        </div>
                      ))}

                    </div>
                  );
                })()}
              </div>
            </div>

            {/* ── RIGHT: Full-height Playback Map ── */}
            <div className="flex-1 relative" style={{ minHeight: "620px" }}>
              {tripsLoading ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <PlaybackMap
                  trips={trips}
                  date={playbackDate}
                  employeeId={empId}
                  mapTypeId={sharedMapTypeId}
                  onMapTypeChange={setSharedMapTypeId}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === "task" && (
          <div className="space-y-3">
            <Card className="border shadow-sm">
              <CardContent className="p-0">
                {tasksLoading ? (
                  <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" /></div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task Code</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created By</TableHead>
                        <TableHead>Started</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead>Due Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employeeTasks.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
                            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                            No tasks assigned to this employee
                          </TableCell>
                        </TableRow>
                      ) : (
                        employeeTasks.map((t) => (
                          <TableRow key={t.id} data-testid={`row-task-${t.id}`}>
                            <TableCell>
                              <span className="text-primary font-medium text-sm">{t.taskCode}</span>
                            </TableCell>
                            <TableCell className="text-sm max-w-[200px] truncate">{t.title || "-"}</TableCell>
                            <TableCell>
                              <Badge variant={t.priority === "high" ? "destructive" : "secondary"} className="text-xs capitalize">{t.priority || "medium"}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={t.status === "completed" ? "default" : t.status === "in_progress" ? "secondary" : "outline"} className="text-xs capitalize">
                                {t.status?.replace("_", " ") || "pending"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{t.createdByName || "-"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{t.startedAt ? formatDT(t.startedAt) : "-"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{t.completedAt ? formatDT(t.completedAt) : "-"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{t.dueDate ? formatDate(t.dueDate) : "-"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
                {employeeTasks.length > 0 && (
                  <div className="px-4 py-2 border-t text-xs text-muted-foreground">
                    Total {employeeTasks.length} tasks
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "attendance" && (
          <div className="space-y-3">
            <Card className="border shadow-sm">
              <CardContent className="p-0">
                {attLoading ? (
                  <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" /></div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Shift</TableHead>
                        <TableHead>Check In</TableHead>
                        <TableHead>Check Out</TableHead>
                        <TableHead>Check In Location</TableHead>
                        <TableHead>Check Out Location</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendanceRecords.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
                            No attendance records found
                          </TableCell>
                        </TableRow>
                      ) : (
                        attendanceRecords.map((rec: any) => (
                          <TableRow key={rec.id} data-testid={`row-attendance-${rec.id}`}>
                            <TableCell className="text-sm font-medium">{formatDate(rec.date)}</TableCell>
                            <TableCell>
                              <Badge variant={rec.status === "present" ? "default" : rec.status === "half_day" ? "secondary" : "destructive"} className="text-xs capitalize">
                                {rec.status?.replace("_", " ")}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground capitalize">{rec.shift || "-"}</TableCell>
                            <TableCell className="text-xs">{rec.checkIn || "-"}</TableCell>
                            <TableCell className="text-xs">{rec.checkOut || "-"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">{rec.checkInLocation || "-"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">{rec.checkOutLocation || "-"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
                {attendanceRecords.length > 0 && (
                  <div className="px-4 py-2 border-t text-xs text-muted-foreground">
                    Total {attendanceRecords.length} items
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "details" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl">
            <div className="border rounded-lg p-5 space-y-4">
              <h3 className="font-semibold text-sm border-b pb-2 flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> Basic Information
              </h3>
              {[
                { label: "Employee ID", value: employee.employeeId },
                { label: "Full Name", value: employee.fullName },
                { label: "Designation", value: employee.role },
                { label: "Department", value: employee.department },
                { label: "Work Location", value: employee.workLocation },
                { label: "Join Date", value: formatDate(employee.joinDate) },
                { label: "Status", value: employee.status },
                { label: "Phone", value: employee.phone },
                { label: "Email", value: employee.email },
                { label: "Address", value: employee.address },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-3 text-sm">
                  <span className="text-muted-foreground w-36 shrink-0">{label}</span>
                  <span className="font-medium">{value || "-"}</span>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="border rounded-lg p-5 space-y-4">
                <h3 className="font-semibold text-sm border-b pb-2 flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-primary" /> Salary Configuration
                </h3>
                {[
                  { label: "Salary Type", value: employee.salaryType },
                  { label: "Basic Salary", value: employee.basicSalary ? `₹${Number(employee.basicSalary).toLocaleString()}` : "-" },
                  { label: "HRA", value: employee.hra && Number(employee.hra) > 0 ? `₹${Number(employee.hra).toLocaleString()}` : "-" },
                  { label: "DA", value: employee.da && Number(employee.da) > 0 ? `₹${Number(employee.da).toLocaleString()}` : "-" },
                  { label: "Travel Allowance", value: employee.travelAllowance && Number(employee.travelAllowance) > 0 ? `₹${Number(employee.travelAllowance).toLocaleString()}` : "-" },
                  { label: "PF Deduction", value: employee.pfDeduction && Number(employee.pfDeduction) > 0 ? `₹${Number(employee.pfDeduction).toLocaleString()}` : "-" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex gap-3 text-sm">
                    <span className="text-muted-foreground w-36 shrink-0">{label}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>

              <div className="border rounded-lg p-5 space-y-4">
                <h3 className="font-semibold text-sm border-b pb-2 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" /> Bank Details
                </h3>
                {[
                  { label: "Bank Name", value: employee.bankName },
                  { label: "Account Number", value: employee.bankAccountNumber },
                  { label: "IFSC Code", value: employee.ifscCode },
                  { label: "PAN Number", value: employee.panNumber },
                ].map(({ label, value }) => (
                  <div key={label} className="flex gap-3 text-sm">
                    <span className="text-muted-foreground w-36 shrink-0">{label}</span>
                    <span className="font-medium">{value || "-"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "feeds" && (
          <div className="space-y-3">
            <Card className="border shadow-sm">
              <CardContent className="p-0">
                {feedsLoading ? (
                  <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" /></div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Action</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Intel</TableHead>
                        <TableHead>Date/Time</TableHead>
                        <TableHead>Friendly Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employeeFeeds.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                            <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
                            No activity feeds found
                          </TableCell>
                        </TableRow>
                      ) : (
                        employeeFeeds.slice(0, 100).map((f: any, i: number) => (
                          <TableRow key={f.id || i} data-testid={`row-feed-${i}`}>
                            <TableCell>
                              <span className="flex items-center gap-2 text-sm">
                                <MapPin className="h-3 w-3 text-primary" />
                                {f.action}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm">{f.platform}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{f.intel || "NA"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{formatDT(f.dateTime)}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{friendlyDate(f.dateTime)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
                {employeeFeeds.length > 0 && (
                  <div className="px-4 py-2 border-t text-xs text-muted-foreground">
                    1 – {Math.min(100, employeeFeeds.length)} of {employeeFeeds.length} items
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "expense" && (
          <div className="space-y-3">
            <Card className="border shadow-sm">
              <CardContent className="p-0">
                {expensesLoading ? (
                  <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" /></div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Work Location</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Claimed</TableHead>
                        <TableHead>Approved</TableHead>
                        <TableHead>Comment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allExpenses.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center text-muted-foreground py-10">
                            <BanknoteIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                            No expenses found for this employee
                          </TableCell>
                        </TableRow>
                      ) : (
                        allExpenses.map((exp) => (
                          <TableRow key={exp.id} data-testid={`row-expense-${exp.id}`}>
                            <TableCell className="text-primary font-medium text-sm font-mono">{exp.expenseCode}</TableCell>
                            <TableCell className="text-sm max-w-[200px] truncate">{exp.title || "-"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{exp.type || "-"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{exp.expenseCategory || exp.category || "-"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{exp.workLocation || "-"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {exp.expenseDate ? format(new Date(exp.expenseDate), "dd MMM yyyy") : "-"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={exp.status === "approved" ? "default" : exp.status === "rejected" ? "destructive" : "secondary"}
                                className="text-xs capitalize"
                              >
                                {exp.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm font-medium">₹{Number(exp.amount || 0).toLocaleString()}</TableCell>
                            <TableCell className="text-sm">
                              {exp.status === "approved" ? `₹${Number(exp.approvedAmount || exp.amount || 0).toLocaleString()}` : "-"}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{exp.adminComment || "-"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
                <div className="px-4 py-2 border-t text-xs text-muted-foreground">
                  Total {allExpenses.length} expense{allExpenses.length !== 1 ? "s" : ""}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "audit" && (
          <div className="space-y-3">
            <Card className="border shadow-sm">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Audit Type</TableHead>
                      <TableHead>Old Value</TableHead>
                      <TableHead>New Value</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Action By</TableHead>
                      <TableHead>Action On</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trips.flatMap(trip =>
                      ([] as any[])
                    ).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                          <History className="h-8 w-8 mx-auto mb-2 opacity-30" />
                          No audit history found
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
                <div className="px-4 py-2 border-t text-xs text-muted-foreground">Total 0 items</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
