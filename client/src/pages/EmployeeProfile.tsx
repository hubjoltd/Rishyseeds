import { useState, useEffect, useRef, useMemo, Fragment } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, ZoomControl, CircleMarker } from "react-leaflet";
import L from "leaflet";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { getAuthToken, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  Battery,
  BatteryCharging,
  BatteryLow,
  Signal,
  Zap,
  Play,
  ClipboardList,
  CalendarDays,
  FileText,
  Rss,
  ScrollText,
  Fingerprint,
  Smartphone,
  Wifi as WifiIcon,
  CircleDot,
  Bus,
  Car,
  Train,
  Bike,
  PersonStanding,
  Eye,
  X,
  ImageOff,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
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
  transportMode?: string;
  gapDistKm?: number;
}

function TransportModeIcon({ mode, className }: { mode?: string; className?: string }) {
  const cls = className ?? "w-2.5 h-2.5 text-white";
  switch (mode) {
    case "train":    return <Train className={cls} />;
    case "walking":  return <PersonStanding className={cls} />;
    case "bike":     return <Bike className={cls} />;
    case "car":      return <Car className={cls} />;
    default:         return <Car className={cls} />;
  }
}

function transportModeLabel(mode?: string): string {
  switch (mode) {
    case "train":    return "Train";
    case "walking":  return "Walking";
    case "bike":     return "Bike";
    case "car":      return "Car / Bus";
    default:         return "Travelled";
  }
}

function transportModeDotColor(mode?: string): string {
  switch (mode) {
    case "train":    return "bg-blue-600";
    case "walking":  return "bg-green-500";
    case "bike":     return "bg-orange-500";
    case "car":      return "bg-orange-500";
    default:         return "bg-orange-500";
  }
}

interface VisitStop { lat: number; lng: number; customerName: string; locationName: string | null; durationStr: string }

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Reduce GPS ping-to-ping zigzag noise using a 3-point moving average.
// Keeps first and last points unchanged so the route still connects correctly
// to stoppage markers and segment boundaries.
function smoothPolyline(pts: [number, number][], window = 3): [number, number][] {
  if (pts.length <= 2) return pts;
  const half = Math.floor(window / 2);
  return pts.map((_, i) => {
    const s = Math.max(0, i - half);
    const e = Math.min(pts.length - 1, i + half);
    const slice = pts.slice(s, e + 1);
    const lat = slice.reduce((sum, p) => sum + p[0], 0) / slice.length;
    const lng = slice.reduce((sum, p) => sum + p[1], 0) / slice.length;
    return [lat, lng] as [number, number];
  });
}

const MAP_TYPES = [
  { id: "roadmap",      label: "Google Maps"        },
  { id: "terrain",      label: "Google Terrain"     },
  { id: "hybrid",       label: "Satellite + Labels" },
  { id: "satellite",    label: "Satellite Only"     },
  { id: "openstreetmap",label: "OpenStreetMap"      },
];

const LEAFLET_TILES: Record<string, { url: string; subdomains?: string[]; attr: string }> = {
  roadmap:      { url: "/api/tiles/m/{z}/{x}/{y}.png",  attr: '© <a href="https://maps.google.com">Google Maps</a>' },
  terrain:      { url: "/api/tiles/p/{z}/{x}/{y}.png",  attr: '© <a href="https://maps.google.com">Google Maps</a>' },
  hybrid:       { url: "/api/tiles/y/{z}/{x}/{y}.png",  attr: '© <a href="https://maps.google.com">Google Maps</a>' },
  satellite:    { url: "/api/tiles/s/{z}/{x}/{y}.png",  attr: '© <a href="https://maps.google.com">Google Maps</a>' },
  openstreetmap:{ url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", subdomains: ["a","b","c","d"], attr: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>' },
};

// Inject pulsing-dot CSS once
if (typeof document !== "undefined" && !document.getElementById("rishi-gps-pulse-css")) {
  const s = document.createElement("style");
  s.id = "rishi-gps-pulse-css";
  s.textContent = `
    @keyframes rishi-pulse {
      0%   { box-shadow: 0 0 0 0 rgba(29,78,216,0.55), 0 2px 8px rgba(0,0,0,0.35); }
      60%  { box-shadow: 0 0 0 14px rgba(29,78,216,0), 0 2px 8px rgba(0,0,0,0.35); }
      100% { box-shadow: 0 0 0 0 rgba(29,78,216,0), 0 2px 8px rgba(0,0,0,0.35); }
    }
    .rishi-live-dot { animation: rishi-pulse 1.8s ease-out infinite; }
  `;
  document.head.appendChild(s);
}

// ── LiveMapInner — inside MapContainer so Leaflet hooks work ──
type HighlightSegment = {
  startTime: string;
  endTime: string;
  type: string;
  lat?: number | null;
  lng?: number | null;
};

function LiveMapInner({
  locationPoints,
  segments,
  visitStops,
  punchInLat,
  punchInLng,
  punchOutLat,
  punchOutLng,
  mapTypeId,
  autoFollow,
  snappedSegments,
  travelSegmentsPoints,
  travelSegmentWindows,
  snappedGapSegments,
  rawLatestPoint,
  highlightedSegment,
  overspeedPoints,
  isSnapping,
}: {
  locationPoints: any[];
  segments: LiveMapSegment[];
  visitStops: VisitStop[];
  punchInLat?: number | null;
  punchInLng?: number | null;
  punchOutLat?: number | null;
  punchOutLng?: number | null;
  mapTypeId: string;
  autoFollow: boolean;
  snappedSegments: [number, number][][];
  travelSegmentsPoints: [number, number][][];
  travelSegmentWindows: { startTime: string; endTime: string }[];
  rawLatestPoint?: [number, number] | null;
  snappedGapSegments: { path: [number, number][]; gapMins: number }[];
  highlightedSegment?: HighlightSegment | null;
  overspeedPoints?: { lat: number; lng: number; speedKmh: number }[];
  isSnapping?: boolean;
}) {
  const map = useMap();
  const tile = LEAFLET_TILES[mapTypeId] ?? LEAFLET_TILES.roadmap;
  const fittedOnce = useRef(false);

  // Force Leaflet to recalculate its size after the container becomes visible
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 120);
    return () => clearTimeout(t);
  }, [map]);

  const gpsPoints = useMemo(() =>
    locationPoints.filter(p => p.latitude && p.longitude)
      .map(p => [Number(p.latitude), Number(p.longitude)] as [number, number]),
    [locationPoints]
  );

  // Detect signal-drop gaps: consecutive GPS pings more than 5 minutes apart that are
  // geographically more than 100 m apart indicate genuine GPS signal loss during travel.
  // IMPORTANT: Uses the same stoppage-filtered point list as the parent's signalGapPairsForSnap
  // so that snappedGapSegments[i] always corresponds exactly to signalGapLines[i].
  // Raw locationPoints has drift pings inside stoppages; filtering to keep only the first
  // ping per stoppage window prevents index misalignment between the two arrays.
  const SIGNAL_GAP_MS = 5 * 60 * 1000;  // 5 min — catches most real signal losses
  const SIGNAL_GAP_MIN_DIST_M = 100;    // 100 m — show even short-distance gaps
  const signalGapLines = useMemo(() => {
    // Apply the same stoppage-drift filtering as filteredLocationPoints so the
    // consecutive pairs we examine match those in the parent's signalGapPairsForSnap.
    const stoppageRanges = (segments ?? []).filter(s => s.type === "stoppage").map(s => ({
      start: new Date(s.startTime).getTime(),
      end:   new Date(s.endTime).getTime(),
    }));
    const seenWin = new Set<number>();
    const filtered = locationPoints.filter(p => {
      if (!p.latitude || !p.longitude || !p.recordedAt) return false;
      const t = new Date(p.recordedAt).getTime();
      for (let wi = 0; wi < stoppageRanges.length; wi++) {
        if (t >= stoppageRanges[wi].start && t <= stoppageRanges[wi].end) {
          if (seenWin.has(wi)) return false;
          seenWin.add(wi);
          return true;
        }
      }
      return true;
    });
    const gaps: { path: [[number, number], [number, number]]; gapMins: number }[] = [];
    for (let i = 1; i < filtered.length; i++) {
      const t1 = new Date(filtered[i - 1].recordedAt).getTime();
      const t2 = new Date(filtered[i].recordedAt).getTime();
      const gap = t2 - t1;
      if (gap > SIGNAL_GAP_MS) {
        const p1: [number, number] = [Number(filtered[i - 1].latitude), Number(filtered[i - 1].longitude)];
        const p2: [number, number] = [Number(filtered[i].latitude), Number(filtered[i].longitude)];
        if (haversineM(p1[0], p1[1], p2[0], p2[1]) < SIGNAL_GAP_MIN_DIST_M) continue;
        // Skip gaps that overlap ANY stoppage window: blue lines already anchor to the
        // stoppage marker on both sides, so no red line is needed to bridge this gap.
        if (stoppageRanges.some(s => s.start < t2 && s.end > t1)) continue;
        gaps.push({ path: [p1, p2], gapMins: Math.round(gap / 60000) });
      }
    }
    return gaps;
  }, [locationPoints, segments]);

  // First load: fit all points. Subsequent updates: auto-follow latest point if enabled.
  useEffect(() => {
    const all: [number, number][] = [...gpsPoints];
    visitStops.forEach(v => { if (v.lat && v.lng) all.push([v.lat, v.lng]); });
    if (punchInLat && punchInLng) all.push([punchInLat, punchInLng]);
    if (punchOutLat && punchOutLng) all.push([punchOutLat, punchOutLng]);

    if (!fittedOnce.current) {
      // First time: fit all points to view
      if (all.length > 1) {
        map.fitBounds(L.latLngBounds(all.map(c => L.latLng(c[0], c[1]))), { padding: [50, 50] });
      } else if (all.length === 1) {
        map.setView(all[0], 15);
      }
      if (all.length > 0) fittedOnce.current = true;
    } else if (autoFollow && gpsPoints.length > 0) {
      // Auto-follow mode: pan smoothly to latest GPS point
      map.panTo(gpsPoints[gpsPoints.length - 1], { animate: true, duration: 0.8 });
    }
  }, [gpsPoints, visitStops, punchInLat, punchInLng, punchOutLat, punchOutLng, autoFollow]);

  // Fly to highlighted segment when user clicks a timeline entry
  useEffect(() => {
    if (!highlightedSegment) return;
    const { type, lat, lng, startTime, endTime } = highlightedSegment;
    // Point-based segments: fly directly to the coordinate
    if ((type === "stoppage" || type === "visit" || type === "punch_in" || type === "punch_out") && lat && lng) {
      map.flyTo([lat, lng], 16, { animate: true, duration: 0.7 });
      return;
    }
    // Travel / gap: collect GPS pings inside the time window and fit their bounds
    const startMs = new Date(startTime).getTime();
    const endMs   = new Date(endTime).getTime();
    const pts: [number, number][] = locationPoints
      .filter(p => p.latitude && p.longitude && p.recordedAt)
      .filter(p => { const t = new Date(p.recordedAt).getTime(); return t >= startMs && t <= endMs; })
      .map(p => [Number(p.latitude), Number(p.longitude)] as [number, number]);
    if (pts.length >= 2) {
      map.flyToBounds(L.latLngBounds(pts.map(c => L.latLng(c[0], c[1]))), { padding: [60, 60], animate: true, duration: 0.7 });
    } else if (pts.length === 1) {
      map.flyTo(pts[0], 15, { animate: true, duration: 0.7 });
    }
  }, [highlightedSegment]);

  // Returns true if travel sub-group i should be highlighted
  const isSegHighlighted = (i: number) => {
    if (!highlightedSegment || highlightedSegment.type !== "travelled") return false;
    const win = travelSegmentWindows?.[i];
    return !!win && win.startTime === highlightedSegment.startTime;
  };

  // Numbered stoppage icon factory
  const makeStoppageIcon = (_num: number, dur = "") => L.divIcon({
    html: `<div style="width:52px;height:52px;border-radius:50%;background:#f97316;border:3px solid #ffffff;box-shadow:0 0 0 2px #f97316,0 3px 8px rgba(0,0,0,0.35);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;">
      <span style="color:#fff;font-size:8px;font-weight:800;letter-spacing:0.5px;line-height:1;font-family:sans-serif;">IDLE</span>
      <span style="color:#fff;font-size:${dur.length > 5 ? 8 : 9}px;font-weight:700;line-height:1;font-family:sans-serif;">${dur || "⏸"}</span>
    </div>`,
    className: "", iconSize: [52, 52], iconAnchor: [26, 26],
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
  // Pulsing blue live-position dot
  const currentPosIcon = L.divIcon({
    html: `<div class="rishi-live-dot" style="width:38px;height:38px;border-radius:50%;background:#1d4ed8;border:3px solid white;display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg></div>`,
    className: "", iconSize: [38, 38], iconAnchor: [19, 19],
  });

  const startPos: [number, number] | null = punchInLat && punchInLng
    ? [punchInLat, punchInLng]
    : gpsPoints.length > 0 ? gpsPoints[0] : null;
  // END marker only when employee has actually punched out — never fall back to last GPS point
  const endPos: [number, number] | null = punchOutLat && punchOutLng
    ? [punchOutLat, punchOutLng]
    : null;
  // Live dot: always placed at the latest raw GPS ping so the person icon
  // reflects the most recent known position, not the end of the snapped route.
  const currentPos: [number, number] | null = !punchOutLat
    ? (rawLatestPoint ?? null)
    : null;

  // Fallback waypoint route: punch-in → visits → punch-out (used when GPS data is sparse)
  const waypointLine = useMemo<[number, number][]>(() => {
    const pts: [number, number][] = [];
    if (punchInLat && punchInLng) pts.push([punchInLat, punchInLng]);
    visitStops.filter(v => v.lat && v.lng).forEach(v => pts.push([v.lat, v.lng]));
    if (punchOutLat && punchOutLng) pts.push([punchOutLat, punchOutLng]);
    return pts;
  }, [punchInLat, punchInLng, punchOutLat, punchOutLng, visitStops]);

  return (
    <>
      <TileLayer key={mapTypeId} url={tile.url} {...(tile.subdomains !== undefined ? { subdomains: tile.subdomains } : {})} attribution={tile.attr} maxZoom={20} />

      {/* ── Route line — one polyline per travel segment, no connecting lines between segments ── */}
      {/* Per-segment fallback: show raw GPS for any segment OSRM couldn't snap.
          When isSnapping is true and old snapped data exists, suppress raw GPS
          fallback entirely to prevent the brief raw→snapped flicker during re-snap. */}
      {travelSegmentsPoints.map((seg, i) => {
        const hasSnapped = snappedSegments[i] && snappedSegments[i].length > 1;
        const suppressForFlicker = isSnapping && snappedSegments.length > 0;
        if (hasSnapped || seg.length <= 1 || suppressForFlicker) return null;
        const smoothed = smoothPolyline(seg);
        const hi = isSegHighlighted(i);
        return (
          <Fragment key={`raw-seg-${i}`}>
            {hi && <Polyline positions={smoothed} pathOptions={{ color: "#fbbf24", weight: 18, opacity: 0.65, lineCap: "round", lineJoin: "round" }} />}
            <Polyline positions={smoothed} pathOptions={{ color: "#ffffff", weight: hi ? 14 : 12, opacity: 0.9, lineCap: "round", lineJoin: "round" }} />
            <Polyline positions={smoothed} pathOptions={{ color: hi ? "#0ea5e9" : "#1565C0", weight: hi ? 9 : 7, opacity: 1, lineCap: "round", lineJoin: "round" }} />
          </Fragment>
        );
      })}
      {/* Once OSRM returns: one snapped polyline per segment */}
      {snappedSegments.map((seg, i) =>
        seg.length > 1 ? (() => {
          const hi = isSegHighlighted(i);
          return (
            <Fragment key={`snap-seg-${i}`}>
              {hi && <Polyline positions={seg} pathOptions={{ color: "#fbbf24", weight: 18, opacity: 0.65, lineCap: "round", lineJoin: "round" }} />}
              <Polyline positions={seg} pathOptions={{ color: "#ffffff", weight: hi ? 14 : 12, opacity: 0.9, lineCap: "round", lineJoin: "round" }} />
              <Polyline positions={seg} pathOptions={{ color: hi ? "#0ea5e9" : "#1565C0", weight: hi ? 9 : 7, opacity: 1, lineCap: "round", lineJoin: "round" }} />
            </Fragment>
          );
        })() : null
      )}

      {/* Transport mode circular icon badges on route — Google Maps Timeline style */}
      {(() => {
        const travelSegs = segments.filter(s => s.type === "travelled");
        if (travelSegs.length === 0) return null;

        // SVG icon paths (Material Design 24×24, white fill)
        const modeSvg: Record<string, string> = {
          car:     `<path d="M17.5 5H7.5L5 9H2v2h1.5l1 7h1V17h13v1h1l1-7H21V9h-3L17.5 5zm-10 1h9l1.5 3H6L7.5 6zM17 15H7l-.75-4h11.5L17 15zm-8.5-1c.83 0 1.5-.67 1.5-1.5S9.33 11 8.5 11 7 11.67 7 12.5 7.67 14 8.5 14zm7 0c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5-1.5.67-1.5 1.5.67 1.5 1.5 1.5z"/>`,
          train:   `<path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-6H6V6h5v5zm5.5 6c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6h-5V6h5v5z"/>`,
          walking: `<path d="M13.49 5.48c.98 0 1.77-.79 1.77-1.77s-.79-1.77-1.77-1.77-1.77.79-1.77 1.77.79 1.77 1.77 1.77zm-3.01 13.95l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z"/>`,
          cycling: `<path d="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zm5.8-10l2.4-2.4.8.8c1.3 1.3 3 2.1 5.1 2.1V9c-1.5 0-2.7-.6-3.6-1.5l-1.9-1.9c-.5-.4-1-.6-1.6-.6s-1.1.2-1.4.6L7.8 8.4c-.4.4-.6.9-.6 1.4 0 .6.2 1.1.6 1.4L11 14v5h2v-6.2l-2.2-3.3zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z"/>`,
          bike:    `<path d="M19 7c0-1.1-.9-2-2-2h-3l2 4h-2l-2-4H7C5.34 5 4 6.34 4 8v4H2v1c0 1.1.9 2 2 2h1c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h1v-4c0-2.21-1.79-4-4-4h-1zM8 17c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm10 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>`,
        };
        const modeColor: Record<string, string> = {
          car: "#7c3aed", train: "#1d4ed8", walking: "#15803d", bike: "#ea580c",
        };
        const modeLabel: Record<string, string> = {
          car: "Car / Bus", train: "Train", walking: "Walking", bike: "Bike",
        };

        // Returns positions at evenly-spaced fractions along a polyline
        const routePositions = (pts: [number, number][], fracs: number[]): ([number, number] | null)[] =>
          fracs.map(f => pts[Math.max(0, Math.min(pts.length - 1, Math.round(f * (pts.length - 1))))]);

        const makeModeIcon = (mode: string, color: string, label: string, distKm?: number) => {
          const svg = modeSvg[mode] ?? modeSvg.car;
          const distStr = distKm != null ? `<div style="font-size:9px;font-weight:700;margin-top:2px;letter-spacing:.3px;">${distKm < 1 ? `${(distKm*1000).toFixed(0)}m` : `${distKm.toFixed(1)}km`}</div>` : "";
          const html = `<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-50%);pointer-events:none;"><div style="width:38px;height:38px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 24 24" width="20" height="20" fill="white" xmlns="http://www.w3.org/2000/svg">${svg}</svg></div>${distStr ? `<div style="background:${color};color:white;border-radius:8px;padding:1px 5px;margin-top:2px;white-space:nowrap;font-family:sans-serif;font-size:9px;font-weight:700;box-shadow:0 1px 4px rgba(0,0,0,0.3);">${label}${distKm != null ? ' · ' + (distKm < 1 ? `${(distKm*1000).toFixed(0)}m` : `${distKm.toFixed(1)}km`) : ''}</div>` : ''}`;
          return L.divIcon({ html, className: "", iconSize: [0, 0], iconAnchor: [0, 0] });
        };

        // Use snapped polylines when available; fall back to raw GPS points
        const polylines = snappedSegments.some(s => s.length > 1) ? snappedSegments : travelSegmentsPoints;

        const markers: JSX.Element[] = [];

        polylines.forEach((seg, i) => {
          if (seg.length < 2) return;
          const win = travelSegmentWindows[i];
          if (!win) return;

          const winMidMs = (new Date(win.startTime).getTime() + new Date(win.endTime).getTime()) / 2;
          const serverSeg = travelSegs.find(s =>
            new Date(s.startTime).getTime() <= winMidMs + 90_000 &&
            new Date(s.endTime).getTime()   >= winMidMs - 90_000
          );
          const mode  = (serverSeg as any)?.transportMode ?? "car";
          const distKm: number | undefined = (serverSeg as any)?.distanceKm;
          const color = modeColor[mode] ?? modeColor.car;
          const label = modeLabel[mode] ?? modeLabel.car;

          // 1 icon per segment at midpoint — keeps map clean (no clutter)
          const midPos = routePositions(seg, [0.5])[0];
          if (!midPos) return;
          markers.push(
            <Marker
              key={`mode-icon-${i}`}
              position={midPos}
              icon={makeModeIcon(mode, color, label, distKm)}
              zIndexOffset={50}
            />
          );
        });

        return markers;
      })()}

      {/* Fallback dashed route — only when no GPS points recorded at all */}
      {travelSegmentsPoints.every(s => s.length <= 1) && gpsPoints.length <= 1 && waypointLine.length > 1 && <>
        <Polyline positions={waypointLine} pathOptions={{ color: "#ffffff", weight: 10, opacity: 0.85, lineCap: "round", lineJoin: "round" }} />
        <Polyline positions={waypointLine} pathOptions={{ color: "#1565C0", weight: 5, opacity: 0.9, dashArray: "12 8", lineCap: "round", lineJoin: "round" }} />
      </>}

      {/* Signal-drop gaps — road-snapped red line indicating signal loss */}
      {signalGapLines.map((gap, i) => {
        const snapped = snappedGapSegments[i];
        const positions: [number, number][] = snapped && snapped.path.length > 1 ? snapped.path : gap.path;
        const gapMins = snapped ? snapped.gapMins : gap.gapMins;
        return (
          <Fragment key={`gap-${i}`}>
            <Polyline positions={positions} pathOptions={{ color: "#ffffff", weight: 12, opacity: 0.9, lineCap: "round", lineJoin: "round" }} />
            <Polyline positions={positions} pathOptions={{ color: "#ef4444", weight: 7, opacity: 1, lineCap: "round", lineJoin: "round" }}>
              <Popup>
                <div style={{ fontSize: 13, minWidth: 150 }}>
                  <b style={{ color: "#dc2626" }}>📵 Signal Lost</b><br />
                  <span style={{ fontSize: 12 }}>No GPS for <b>{gapMins} min{gapMins !== 1 ? "s" : ""}</b></span><br />
                  <span style={{ fontSize: 11, color: "#888" }}>Route estimated from last known point</span>
                </div>
              </Popup>
            </Polyline>
          </Fragment>
        );
      })}

      {/* Stoppage markers — orange road-line style circle (white border + orange fill) */}
      {segments.filter(s => s.type === "stoppage" && s.lat && s.lng).map((s, i) => {
        const totalMins = Math.floor((s.durationSecs || 0) / 60);
        const hrs = Math.floor(totalMins / 60);
        const mins = totalMins % 60;
        const dur = hrs > 0 ? `${hrs}h ${mins}m` : `${totalMins}m`;
        const hiStop = highlightedSegment?.type === "stoppage" && highlightedSegment.startTime === s.startTime;
        return (
          <CircleMarker
            key={`stop-${i}`}
            center={[s.lat!, s.lng!]}
            radius={hiStop ? 15 : 11}
            pathOptions={{ color: hiStop ? "#fbbf24" : "#ffffff", weight: hiStop ? 5 : 4, fillColor: "#f97316", fillOpacity: 1 }}
          >
            <Popup>
              <div style={{ fontSize: 13, minWidth: 130 }}>
                <b style={{ color: "#f97316" }}>⏸ Idle #{i + 1}</b><br/>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{dur}</span><br/>
                <span style={{ fontSize: 11, color: "#666" }}>{new Date(s.startTime).toLocaleTimeString()} – {new Date(s.endTime).toLocaleTimeString()}</span>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}

      {/* Overspeed dots — mustard yellow */}
      {(overspeedPoints ?? []).map((p, i) => (
        <CircleMarker
          key={`overspeed-${i}`}
          center={[p.lat, p.lng]}
          radius={5}
          pathOptions={{ color: "#92610a", weight: 1, fillColor: "#d4920a", fillOpacity: 0.92 }}
        >
          <Popup>
            <div style={{ fontSize: 13, minWidth: 110 }}>
              <b style={{ color: "#92610a" }}>⚡ Overspeed</b><br/>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{p.speedKmh.toFixed(0)} km/h</span>
            </div>
          </Popup>
        </CircleMarker>
      ))}

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
  onSnappedKm,
  onOsrmSegmentDistances,
  onGapKm,
  highlightedSegment,
  overspeedPoints,
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
  onSnappedKm?: (km: number) => void;
  onOsrmSegmentDistances?: (kmPerSegment: number[]) => void;
  onGapKm?: (km: number) => void;
  highlightedSegment?: HighlightSegment | null;
  overspeedPoints?: { lat: number; lng: number; speedKmh: number }[];
}) {
  const [autoFollow, setAutoFollow] = useState(true);
  const [snappedSegments, setSnappedSegments] = useState<[number, number][][]>([]);
  const [snappedGapSegments, setSnappedGapSegments] = useState<{ path: [number, number][]; gapMins: number }[]>([]);
  const [snapping, setSnapping] = useState(false);
  const lastSnapCount = useRef(0);

  // Suppress GPS noise during stoppage windows.
  // Inside each server-detected stoppage, only the FIRST ping (entry point) is kept;
  // all subsequent drift pings are discarded so they never produce blue loops or red lines.
  const filteredLocationPoints = useMemo(() => {
    const stoppages = (segments ?? []).filter(s => s.type === "stoppage");
    if (stoppages.length === 0) return locationPoints;
    const windows = stoppages.map(s => ({
      start: new Date(s.startTime).getTime(),
      end:   new Date(s.endTime).getTime(),
    }));
    const seenWindow = new Set<number>();
    return locationPoints.filter(p => {
      if (!p.recordedAt) return true;
      const t = new Date(p.recordedAt).getTime();
      for (let i = 0; i < windows.length; i++) {
        if (t >= windows[i].start && t <= windows[i].end) {
          if (seenWindow.has(i)) return false; // discard drift ping
          seenWindow.add(i);
          return true; // keep only the first entry ping per stoppage
        }
      }
      return true;
    });
  }, [locationPoints, segments]);

  const gpsPoints = useMemo(() =>
    filteredLocationPoints
      .filter(p => p.latitude && p.longitude)
      .map(p => [Number(p.latitude), Number(p.longitude)] as [number, number]),
    [filteredLocationPoints]
  );

  // Latest raw GPS point (unfiltered) — used for the live person dot so stoppage suppression
  // doesn't freeze the marker at the first entry ping of the current stoppage
  const rawLatestPoint = useMemo<[number, number] | null>(() => {
    const valid = locationPoints.filter(p => p.latitude && p.longitude);
    if (valid.length === 0) return null;
    const last = valid[valid.length - 1];
    return [Number(last.latitude), Number(last.longitude)];
  }, [locationPoints]);

  // One GPS-point array per travel segment — excludes stoppage pings entirely.
  // Keeping segments separate prevents OSRM from routing between them and drawing loops.
  // Falls back to [gpsPoints] (single array) when segments haven't loaded yet.
  //
  // Returns both the flat sub-group point arrays (for OSRM snapping / map rendering)
  // AND subGroupCounts[i] = how many sub-groups server segment i produced.
  // This lets the OSRM effect aggregate sub-group distances back to per-segment totals
  // so the distance enrichment index never gets out of sync.
  const travelSegmentsData = useMemo(() => {
    const allSegs = segments ?? [];
    const hasMeaningfulTravel = allSegs.some(s => s.type === "travelled" && ((s as any).distanceKm ?? 0) >= 0.05);
    if (!hasMeaningfulTravel) return { points: [gpsPoints], timestamps: [[]], subGroupCounts: [1] };

    const result: [number, number][][] = [];
    const resultTs: number[][] = [];
    const subGroupCounts: number[] = [];
    const segmentWindows: { startTime: string; endTime: string }[] = [];

    for (let i = 0; i < allSegs.length; i++) {
      const seg = allSegs[i];
      if (seg.type !== "travelled") continue;

      const segStart = new Date(seg.startTime).getTime();
      const segEnd   = new Date(seg.endTime).getTime();

      // The stoppage immediately before this travel segment gives us the exact
      // location where the employee was parked. We use it as an anchor so the
      // blue line always starts from the stoppage point, even if the first GPS
      // ping after the stoppage is late (cellular delay / phone wake-up lag).
      const prevStoppage = allSegs.slice(0, i).reverse().find(s => s.type === "stoppage") as any;
      const stopAnchor: [number, number] | null =
        prevStoppage && prevStoppage.lat != null && prevStoppage.lng != null
          ? [Number(prevStoppage.lat), Number(prevStoppage.lng)]
          : null;

      // Next stoppage after this travel segment — used as endpoint anchor when GPS is
      // completely absent (phone offline the entire leg). Without this the sparse fallback
      // has no endpoint and draws nothing, leaving the segment invisible.
      const nextStoppage = allSegs.slice(i + 1).find(s => s.type === "stoppage") as any;
      const endAnchor: [number, number] | null =
        nextStoppage && nextStoppage.lat != null && nextStoppage.lng != null
          ? [Number(nextStoppage.lat), Number(nextStoppage.lng)]
          : null;

      // Skip near-zero-distance segments — but if both surrounding stoppages have
      // known locations, draw a direct fallback line between them so the map never
      // shows two stoppage markers with no connecting route.
      if (((seg as any).distanceKm ?? 0) < 0.05) {
        if (stopAnchor && endAnchor) {
          result.push([stopAnchor, endAnchor]);
          resultTs.push([Math.round(segStart / 1000), Math.round(segEnd / 1000)]);
          segmentWindows.push({ startTime: seg.startTime, endTime: (seg as any).endTime ?? seg.startTime });
          subGroupCounts.push(1);
        }
        continue;
      }

      // Extend the ping window by up to 2 minutes past the server-computed segEnd.
      // GPS pings at the START of the next stoppage cluster (the "approach" phase) still
      // show real movement — the employee hasn't fully stopped yet. Without them OSRM
      // only receives waypoints up to the last travel ping, anchoring the route short of
      // the actual arrival point and under-counting the final 200-400 m of every leg.
      // Cap the extension at the next travel segment's start so we never borrow pings
      // from a completely different trip leg.
      const nextTravelSeg = allSegs.slice(i + 1).find(s => s.type === "travelled");
      const nextTravelStartMs = nextTravelSeg
        ? new Date(nextTravelSeg.startTime).getTime()
        : Infinity;
      const segEndExtended = Math.min(segEnd + 2 * 60 * 1000, nextTravelStartMs - 1000);

      const segPings = filteredLocationPoints.filter(p => {
        if (!p.latitude || !p.longitude || !p.recordedAt) return false;
        const t = new Date(p.recordedAt).getTime();
        if (t < segStart || t > segEndExtended) return false;
        // 500 m threshold: cellular GPS in rural Telangana often reports 300-500 m accuracy.
        // The old 200 m limit was silently dropping all pings for early travel segments,
        // leaving those legs invisible on the map. OSRM map-match handles noisy GPS well,
        // so we only reject extreme outliers (towers reporting > 500 m).
        const acc = p.accuracy != null && p.accuracy !== "" ? Number(p.accuracy) : null;
        if (acc !== null && acc > 500) return false;
        return true;
      });

      // Split segPings at signal gaps (>10 min) BEFORE sending to OSRM.
      // Without this, OSRM routes a continuous blue road line through the gap,
      // producing both blue and red lines on the same section — confusing.
      // Each sub-group gets its own OSRM call → separate blue lines.
      // Red lines (rendered in LiveMapInner) cover the gaps between sub-groups.
      // 10 min threshold matches server SIGNAL_GAP_SEC — cellular GPS pings every 2–7 min
      // naturally, so the old 5 min was splitting valid travel into orphan single-ping groups
      // that got discarded (OSRM needs ≥ 2 points), hiding the route on the map.
      const LIVE_SPLIT_MS = 10 * 60 * 1000;
      const sorted = [...segPings].sort(
        (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
      );
      const subGroups: (typeof segPings)[] = [];
      {
        let cur: typeof segPings = [];
        for (const ping of sorted) {
          if (cur.length > 0) {
            const gap = new Date(ping.recordedAt).getTime() - new Date(cur[cur.length - 1].recordedAt).getTime();
            if (gap > LIVE_SPLIT_MS) { subGroups.push(cur); cur = []; }
          }
          cur.push(ping);
        }
        if (cur.length > 0) subGroups.push(cur);
      }

      // Apply centroid binning to each sub-group independently.
      // Short sub-groups (≤ 5 min) use 30-second bins so map-match gets more anchor
      // points and can follow a winding road more faithfully. Longer groups stay on
      // 60-second bins to keep OSRM requests lean while still smoothing GPS noise.
      let pushedCount = 0;
      for (let gi = 0; gi < subGroups.length; gi++) {
        const group = subGroups[gi];
        if (group.length === 0) continue;
        const gStart = new Date(group[0].recordedAt).getTime();
        const gEnd   = new Date(group[group.length - 1].recordedAt).getTime();
        const groupDurMs = gEnd - gStart;
        // Short legs (≤ 5 min): 30-second bins → more OSRM anchors for winding roads.
        // Longer legs: 60-second bins to keep requests lean.
        const BIN_MS = groupDurMs <= 5 * 60_000 ? 30_000 : 60_000;
        const repPings: [number, number][] = [];
        const repTs: number[] = []; // unix seconds — sent to OSRM timestamps param
        for (let t = gStart; t <= gEnd + BIN_MS; t += BIN_MS) {
          const bin = group.filter(p => {
            const pt = new Date(p.recordedAt).getTime();
            return pt >= t && pt < t + BIN_MS;
          });
          if (bin.length === 0) continue;
          const cLat = bin.reduce((s, p) => s + Number(p.latitude),  0) / bin.length;
          const cLng = bin.reduce((s, p) => s + Number(p.longitude), 0) / bin.length;
          let best = bin[0], bestD = Infinity;
          for (const p of bin) {
            const d = (Number(p.latitude) - cLat) ** 2 + (Number(p.longitude) - cLng) ** 2;
            if (d < bestD) { bestD = d; best = p; }
          }
          repPings.push([Number(best.latitude), Number(best.longitude)]);
          repTs.push(Math.round(new Date(best.recordedAt).getTime() / 1000));
        }
        // Fallback: if centroid binning yields < 2 points (very sparse pings), use the raw
        // group points directly so the segment is never invisible on the map.
        let finalPings: [number, number][] = repPings.length >= 2
          ? repPings
          : group.map(p => [Number(p.latitude), Number(p.longitude)] as [number, number]);
        let finalTs: number[] = repPings.length >= 2
          ? repTs
          : group.map(p => Math.round(new Date(p.recordedAt).getTime() / 1000));

        // Anchor the FIRST sub-group's start to the previous stoppage location so
        // the blue line always begins exactly from the IDLE marker even when the
        // first GPS ping after cellular wake-up is late. Applied after finalPings
        // so it works for both the repPings path and the raw fallback path.
        if (gi === 0 && stopAnchor) {
          const first = finalPings[0];
          const tooClose = first && Math.abs(first[0] - stopAnchor[0]) < 0.0002
            && Math.abs(first[1] - stopAnchor[1]) < 0.0002;
          if (!tooClose) {
            finalPings = [stopAnchor, ...finalPings];
            finalTs = [(finalTs[0] ?? Math.round(gStart / 1000)) - 30, ...finalTs];
          }
        }
        // Anchor the LAST sub-group's end to the next stoppage location so the
        // blue line always reaches the IDLE marker, not just the last GPS ping
        // before parking (which can be 100-500 m short of the actual stop point).
        if (gi === subGroups.length - 1 && endAnchor) {
          const last = finalPings[finalPings.length - 1];
          const tooClose = last && Math.abs(last[0] - endAnchor[0]) < 0.0002
            && Math.abs(last[1] - endAnchor[1]) < 0.0002;
          if (!tooClose) {
            const lastTs = finalTs[finalTs.length - 1] ?? Math.round(segEnd / 1000);
            finalPings = [...finalPings, endAnchor];
            finalTs = [...finalTs, Math.max(lastTs + 30, Math.round(segEnd / 1000))];
          }
        }
        if (finalPings.length >= 2) {
          result.push(finalPings);
          resultTs.push(finalTs);
          segmentWindows.push({ startTime: seg.startTime, endTime: (seg as any).endTime ?? seg.startTime });
          pushedCount++;
        }
      }
      // Sparse GPS fallback: when cellular GPS pings are spaced > 10 min apart,
      // every ping ends up in its own sub-group (1 ping each) which fails the
      // >= 2 point threshold. The entire travel segment becomes invisible on the map.
      // Fix: if no sub-group was pushed, concatenate ALL pings from ALL sub-groups
      // into one continuous path — this always produces a visible route line even
      // for highway legs where the employee had a GPS ping only every 10-15 min.
      if (pushedCount === 0) {
        // Build a path from whatever GPS pings exist in all sub-groups
        const allPts: [number, number][] = [];
        const allTs: number[] = [];
        for (const g of subGroups) {
          for (const p of g) {
            allPts.push([Number(p.latitude), Number(p.longitude)]);
            allTs.push(Math.round(new Date(p.recordedAt).getTime() / 1000));
          }
        }
        // Prepend start anchor (previous stoppage location).
        // Use the actual segment start time so the timestamp is realistic even when
        // there are no GPS pings (avoids OSRM rejecting 1600 km/h implied speeds).
        if (stopAnchor) {
          const anchorTs = allTs.length > 0
            ? Math.min(allTs[0] - 30, Math.round(segStart / 1000))
            : Math.round(segStart / 1000);
          allPts.unshift(stopAnchor);
          allTs.unshift(anchorTs);
        }
        // Append end anchor (next stoppage location) so line reaches the destination
        // even when GPS was offline the entire leg (phone switched off / no signal).
        // Use actual segment end time for a realistic travel speed.
        if (endAnchor) {
          const anchorTs = allTs.length > 0
            ? Math.max(allTs[allTs.length - 1] + 30, Math.round(segEnd / 1000))
            : Math.round(segEnd / 1000);
          allPts.push(endAnchor);
          allTs.push(anchorTs);
        }
        if (allPts.length >= 2) {
          result.push(allPts);
          resultTs.push(allTs);
          segmentWindows.push({ startTime: seg.startTime, endTime: (seg as any).endTime ?? seg.startTime });
          pushedCount++;
        }
      }
      // Record how many sub-groups were actually pushed for this server segment
      // (used to aggregate OSRM distances back to per-segment totals)
      subGroupCounts.push(pushedCount > 0 ? pushedCount : 0);
    }

    if (result.length > 0) return { points: result, timestamps: resultTs, subGroupCounts, segmentWindows };
    return { points: [gpsPoints], timestamps: [[]], subGroupCounts: [1], segmentWindows: [] }; // guard: never return empty
  }, [filteredLocationPoints, segments, gpsPoints]);

  const travelSegmentsPoints = travelSegmentsData.points;
  const travelSegmentsTimestamps = travelSegmentsData.timestamps ?? [];

  // Total travel point count across all segments — used to detect new data without re-snapping
  const totalTravelCount = useMemo(
    () => travelSegmentsPoints.reduce((sum, seg) => sum + seg.length, 0),
    [travelSegmentsPoints]
  );

  // Snap route segments to roads via OSRM for all employee types.
  useEffect(() => {
    // All employee types (satellite, WiFi, CELLULAR) now use OSRM for solid blue road lines.
    // Cellular employees use filtered representative pings (1/min) so OSRM follows the
    // actual road without zigzag or false highway detours.
    if (totalTravelCount < 2) { setSnappedSegments([]); return; }
    if (totalTravelCount === lastSnapCount.current) return; // no new points
    let cancelled = false;
    setSnapping(true);
    // Snap each segment separately so there are no connecting lines between segments
    Promise.all(travelSegmentsPoints.map((seg, i) => seg.length >= 2 ? osrmSnap(seg, travelSegmentsTimestamps[i]) : Promise.resolve({ coords: [] as [number,number][], distanceM: 0 }))).then(results => {
      if (!cancelled) {
        setSnappedSegments(results.map(r => r.coords));
        const subGroupDistances = results.map(r => r.distanceM / 1000);
        const totalOsrmKm = subGroupDistances.reduce((s, d) => s + d, 0);

        // Aggregate sub-group distances back to per-server-segment totals.
        // A single server "travelled" segment may have been split into multiple
        // OSRM sub-groups (at signal gaps). Without aggregating, the enrichment
        // index (_tIdx) gets out of sync and wrong distances are shown.
        const { subGroupCounts } = travelSegmentsData;
        const perSegmentDistances: number[] = [];
        let flatIdx = 0;
        for (const count of subGroupCounts) {
          let segKm = 0;
          for (let k = 0; k < count; k++) {
            segKm += subGroupDistances[flatIdx++] ?? 0;
          }
          perSegmentDistances.push(segKm);
        }

        if (onOsrmSegmentDistances) onOsrmSegmentDistances(perSegmentDistances);
        if (onSnappedKm) onSnappedKm(totalOsrmKm);
        setSnapping(false);
        lastSnapCount.current = totalTravelCount;
      }
    });
    return () => { cancelled = true; };
  }, [totalTravelCount]);


  // Snap signal-gap endpoints to roads using route/v1 simplified (clean 2-point route).
  // Using osrmSnapGap (not osrmSnap) avoids the map-match winding-path noise problem.
  const signalGapPairsForSnap = useMemo(() => {
    const SIGNAL_GAP_MS = 5 * 60 * 1000; // 5 min — matches child signalGapLines threshold
    const SIGNAL_GAP_MIN_DIST_M = 100;   // 100 m — match child threshold
    const valid = filteredLocationPoints.filter(p => p.latitude && p.longitude && p.recordedAt);
    const segs = segments ?? [];
    // Only suppress gaps inside STOPPAGE segments — gaps inside travel segments are
    // genuine signal drops that need the red line shown on the map.
    const stoppageRanges = segs.filter((s: any) => s.type === "stoppage").map((s: any) => ({
      start: new Date(s.startTime).getTime(),
      end:   new Date(s.endTime).getTime(),
    }));
    const gaps: { pair: [[number, number], [number, number]]; gapMins: number }[] = [];
    for (let i = 1; i < valid.length; i++) {
      const t1 = new Date(valid[i - 1].recordedAt).getTime();
      const t2 = new Date(valid[i].recordedAt).getTime();
      const gap = t2 - t1;
      if (gap > SIGNAL_GAP_MS) {
        const p1: [number, number] = [Number(valid[i - 1].latitude), Number(valid[i - 1].longitude)];
        const p2: [number, number] = [Number(valid[i].latitude), Number(valid[i].longitude)];
        if (haversineM(p1[0], p1[1], p2[0], p2[1]) < SIGNAL_GAP_MIN_DIST_M) continue;
        // Skip gaps that overlap ANY stoppage: blue lines already anchor to it from both sides.
        if (stoppageRanges.some((s: any) => s.start < t2 && s.end > t1)) continue;
        gaps.push({ pair: [p1, p2], gapMins: Math.round(gap / 60000) });
      }
    }
    return gaps;
  }, [filteredLocationPoints, segments]);

  useEffect(() => {
    if (signalGapPairsForSnap.length === 0) { setSnappedGapSegments([]); return; }
    let cancelled = false;
    Promise.all(signalGapPairsForSnap.map(g => osrmSnapGap(g.pair[0], g.pair[1]))).then(results => {
      if (!cancelled) {
        setSnappedGapSegments(results.map((r, i) => ({
          path: r.coords,
          gapMins: signalGapPairsForSnap[i].gapMins,
        })));
        // Use straight-line haversine for gap km — road distance can overcount
        // signal-loss periods where the employee may not have followed the routed road.
        const totalGapKm = signalGapPairsForSnap.reduce((s, g) =>
          s + haversineKm(g.pair[0][0], g.pair[0][1], g.pair[1][0], g.pair[1][1]), 0);
        if (totalGapKm > 0) onGapKm?.(totalGapKm);
      }
    });
    return () => { cancelled = true; };
  }, [signalGapPairsForSnap.length]);

  const defaultCenter: [number, number] = gpsPoints.length > 0 ? gpsPoints[gpsPoints.length - 1]
    : punchInLat && punchInLng ? [punchInLat, punchInLng]
    : [22.8, 80.0];

  return (
    <div className="relative h-full w-full">
      <MapContainer center={defaultCenter} zoom={14} style={{ height: "100%", width: "100%" }} zoomControl={false}>
        <LiveMapInner
          locationPoints={filteredLocationPoints}
          segments={segments}
          visitStops={visitStops}
          punchInLat={punchInLat}
          punchInLng={punchInLng}
          punchOutLat={punchOutLat}
          punchOutLng={punchOutLng}
          mapTypeId={mapTypeId}
          autoFollow={autoFollow}
          snappedSegments={snappedSegments}
          travelSegmentsPoints={travelSegmentsPoints}
          travelSegmentWindows={travelSegmentsData.segmentWindows}
          rawLatestPoint={rawLatestPoint}
          snappedGapSegments={snappedGapSegments}
          highlightedSegment={highlightedSegment}
          overspeedPoints={overspeedPoints}
          isSnapping={snapping}
        />
        <ZoomControl position="bottomright" />
      </MapContainer>

      {/* Top-left: LIVE badge + Follow toggle + snapping indicator */}
      <div className="absolute top-2 left-2 z-[1001] flex flex-col gap-1.5">
        {gpsPoints.length > 0 && (
          <div className="flex items-center gap-1.5 bg-white rounded-full shadow px-2.5 py-1 text-[11px] font-semibold text-blue-700 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse inline-block" />
            LIVE
          </div>
        )}
        <button
          onClick={() => setAutoFollow(f => !f)}
          title={autoFollow ? "Auto-follow ON — click to disable" : "Auto-follow OFF — click to enable"}
          className={`flex items-center gap-1.5 rounded-full shadow px-2.5 py-1 text-[11px] font-semibold border transition-colors ${autoFollow ? "bg-blue-600 text-white border-blue-700" : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"}`}
          data-testid="button-auto-follow"
        >
          <Navigation className="w-3 h-3" />
          {autoFollow ? "Following" : "Follow"}
        </button>
        {snapping && (
          <div className="flex items-center gap-1.5 bg-white/90 rounded-full shadow px-2.5 py-1 text-[11px] text-blue-700 border border-blue-100">
            <Loader2 className="w-3 h-3 animate-spin" /> Snapping…
          </div>
        )}
      </div>

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
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-6 h-[4px] rounded" style={{ background: "#1e3a8a" }}/>
          <span>Route (Road)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-6 border-t-2 border-dashed border-blue-500" style={{ height: 0 }}/>
          <span>Route (Approx.)</span>
        </div>
        <div className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-orange-500"/><span>Stoppage</span></div>
        <div className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-green-600"/><span>CHK Visit</span></div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-6 h-[4px] rounded" style={{ background: "#ef4444" }}/>
          <span className="text-red-600 font-medium">Signal Lost</span>
        </div>
      </div>

      {/* No-data badge — bottom-center */}
      {gpsPoints.length === 0 && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1001] bg-white/90 border border-blue-200 rounded-full shadow px-3 py-1 text-[11px] text-blue-700 font-medium flex items-center gap-1.5 whitespace-nowrap">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-300" />
          GPS tracking starts on next punch-in
        </div>
      )}
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

// Animated playback dot — pulsing blue circle (reuses rishi-gps-pulse-css already injected)
function makePlaybackDotIcon() {
  return L.divIcon({
    html: `<div class="rishi-live-dot" style="width:22px;height:22px;border-radius:50%;background:#1d4ed8;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>`,
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

// Numbered orange stoppage pin (for Playback)
function makePbStoppageIcon(_num: number, dur = "") {
  return L.divIcon({
    html: `<div style="width:52px;height:52px;border-radius:50%;background:#f97316;border:3px solid #ffffff;box-shadow:0 0 0 2px #f97316,0 3px 8px rgba(0,0,0,0.35);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;">
      <span style="color:#fff;font-size:8px;font-weight:800;letter-spacing:0.5px;line-height:1;font-family:sans-serif;">IDLE</span>
      <span style="color:#fff;font-size:${dur.length > 5 ? 8 : 9}px;font-weight:700;line-height:1;font-family:sans-serif;">${dur || "⏸"}</span>
    </div>`,
    className: "", iconSize: [52, 52], iconAnchor: [26, 26],
  });
}

// ── GPS track splitting at impossible-speed gaps ──────────────────────────
// Splits a GPS track into continuous segments. A new segment starts whenever
// consecutive points imply speed > 150 km/h (impossible by road vehicle).
// This prevents OSRM from routing across GPS teleports (e.g. phone off during
// a 600 km journey — OSRM would otherwise draw the full highway route).
// Split track only where there is a straight-line gap > maxDistKm (default 50 km).
// Uses distance only — NOT speed — so it works correctly even when GPS pings
// are batched and arrive at the server with identical recordedAt timestamps.
function splitTrackAtGaps(
  pts: [number, number][],
  _times?: Date[],
  _maxKmh?: number,
  maxDistKm = 50
): [number, number][][] {
  if (pts.length === 0) return [];
  const segs: [number, number][][] = [];
  let cur: [number, number][] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const distKm = haversineKm(pts[i-1][0], pts[i-1][1], pts[i][0], pts[i][1]);
    if (distKm > maxDistKm) {
      if (cur.length > 0) segs.push(cur);
      cur = [pts[i]];
    } else {
      cur.push(pts[i]);
    }
  }
  if (cur.length > 0) segs.push(cur);
  return segs;
}

// Snap GPS points to actual roads via OSRM public API (falls back to raw points on error)
/** Fetch road-snapped route from OSRM.
 *  Strategy (in priority order):
 *  1. match/v1 WITH timestamps at 150 m radius — best quality, follows actual path
 *  2. match/v1 WITH timestamps at 250 m radius — for roads far from OSM centre-lines
 *  3. match/v1 WITHOUT timestamps at 250 m radius — fallback if timestamps desync
 *  4. route/v1 forcing ALL GPS waypoints (no sampling) — route must pass through each
 *     actual GPS point so it follows the real path, not a phantom shortcut
 *  5. Raw GPS points — honest last resort, no phantom roads
 *
 *  Key quality improvements vs previous version:
 *  - Timestamps sent to match/v1: OSRM knows vehicle speed between each point, making
 *    matching dramatically more accurate on Indian roads where multiple parallel roads exist.
 *  - tidy=true: OSRM removes duplicate / jittery GPS noise server-side.
 *  - Point cap raised 100→200: captures more turn points within the same time window.
 *  - route/v1 fallback uses ALL points as forced waypoints (no sampling): OSRM must
 *    route through each GPS point so it cannot invent shortcuts the employee never took.
 */
async function osrmSnap(points: [number, number][], timestamps?: number[]): Promise<{ coords: [number, number][]; distanceM: number }> {
  if (points.length < 2) return { coords: points, distanceM: 0 };

  const geoToLeaflet = (coords: [number, number][]): [number, number][] =>
    coords.map(([lng, lat]) => [lat, lng]);

  const fetchWithTimeout = async (url: string, ms = 12000): Promise<Response> => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try { return await fetch(url, { signal: ctrl.signal }); }
    finally { clearTimeout(t); }
  };

  // ── Google Roads API snap-to-roads (via server proxy) — priority #1 ──────────
  // Sends up to 300 GPS points to the Roads snapToRoads API. Each ping is snapped
  // to the nearest road segment; haversine is summed between snapped points.
  // This is exactly how TrackOlap calculates distance, which is why it matches
  // Google Maps — it measures the actual road path driven, not an optimal route.
  // (Google Directions API with via: waypoints gives the optimal route between
  //  sampled checkpoints, not the actual road the employee drove — hence wrong km.)
  const tryGoogle = async (pts: [number, number][]): Promise<{ coords: [number, number][]; distanceM: number } | null> => {
    try {
      // Sample to max 300 points (Roads API handles chunking of 100 each on backend)
      const step = Math.max(1, Math.ceil(pts.length / 300));
      const sample = pts.filter((_, i) => i % step === 0 || i === pts.length - 1);
      const waypoints = sample.map(([lat, lng]) => ({ lat, lng }));
      const res = await fetch("/api/snap-to-roads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waypoints }),
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.polyline || data.polyline.length < 2) return null;
      return { coords: data.polyline as [number, number][], distanceM: data.distanceM ?? 0 };
    } catch { return null; }
  };

  // ── Match/v1: map-match GPS trace to roads, optionally with timestamps ──
  // Timestamps let OSRM know how fast the vehicle was moving between each point,
  // which is the single biggest factor in choosing the correct road when multiple
  // parallel roads exist (a very common situation in Indian cities and towns).
  const tryMatch = async (
    pts: [number, number][],
    snapRadius: number,
    ts?: number[]
  ): Promise<{ coords: [number, number][]; distanceM: number } | null> => {
    try {
      // Cap at 200 points (up from 100) — captures more turns within the same window.
      // OSRM public server handles up to ~500 coords before URL limits hit.
      const step = Math.max(1, Math.ceil(pts.length / 200));
      const indices = pts.map((_, i) => i).filter(i => i % step === 0 || i === pts.length - 1);
      const sample = indices.map(i => pts[i]);
      const sampleTs = ts ? indices.map(i => ts[i]) : null;

      const coordStr = sample.map(([lat, lng]) => `${lng},${lat}`).join(";");
      const radiuses = sample.map(() => String(snapRadius)).join(";");
      let url = `https://router.project-osrm.org/match/v1/driving/${coordStr}?overview=full&geometries=geojson&radiuses=${radiuses}`;
      if (sampleTs && sampleTs.length === sample.length) {
        // Verify timestamps are strictly increasing before sending (OSRM requirement)
        const tsOk = sampleTs.every((t, i) => i === 0 || t > sampleTs[i - 1]);
        if (tsOk) url += `&timestamps=${sampleTs.join(";")}`;
      }
      const res = await fetchWithTimeout(url, 12000);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.code !== "Ok" || !Array.isArray(data.matchings) || data.matchings.length === 0) return null;
      const allCoords: [number, number][] = [];
      let distanceM = 0;
      for (const m of data.matchings) {
        if (Array.isArray(m?.geometry?.coordinates))
          allCoords.push(...geoToLeaflet(m.geometry.coordinates));
        distanceM += m?.distance ?? 0;
      }
      return allCoords.length > 1 ? { coords: allCoords, distanceM } : null;
    } catch { return null; }
  };

  // ── Route/v1 fallback: force OSRM through ALL GPS waypoints (no sampling) ──
  // Unlike the old sampled route/v1 that invented shortcuts, using every GPS point
  // as a forced intermediate waypoint means OSRM must route through each actual
  // location recorded. Works best when GPS pings are ≤ 1 km apart.
  const tryRouteAllWaypoints = async (pts: [number, number][]): Promise<{ coords: [number, number][]; distanceM: number } | null> => {
    try {
      // OSRM URL limit ~8000 chars; each coord ~14 chars → safe up to ~400 points.
      // For very long traces, sample every 2nd point but never skip more than that.
      const step = pts.length > 400 ? 2 : 1;
      const sample = pts.filter((_, i) => i % step === 0 || i === pts.length - 1);
      const coordStr = sample.map(([lat, lng]) => `${lng},${lat}`).join(";");
      const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`;
      const res = await fetchWithTimeout(url, 12000);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.code !== "Ok" || !data.routes?.[0]?.geometry?.coordinates) return null;
      const coords = geoToLeaflet(data.routes[0].geometry.coordinates);
      const distanceM: number = data.routes[0].distance ?? 0;
      return coords.length > 1 ? { coords, distanceM } : null;
    } catch { return null; }
  };

  // ── Outlier filter: remove pings that jump > 3× the median consecutive distance ──
  const filterOutlierPts = (pts: [number, number][], ts?: number[]): { pts: [number, number][]; ts?: number[] } => {
    if (pts.length <= 2) return { pts, ts };
    const dists: number[] = [];
    for (let i = 1; i < pts.length; i++) {
      dists.push(haversineKm(pts[i-1][0], pts[i-1][1], pts[i][0], pts[i][1]) * 1000);
    }
    const sorted = [...dists].sort((a, b) => a - b);
    const medianM = sorted[Math.floor(sorted.length / 2)];
    const maxGapM = Math.max(150, medianM * 3);
    const outPts: [number, number][] = [pts[0]];
    const outTs: number[] = ts ? [ts[0]] : [];
    for (let i = 1; i < pts.length; i++) {
      const last = outPts[outPts.length - 1];
      const d = haversineKm(last[0], last[1], pts[i][0], pts[i][1]) * 1000;
      if (d <= maxGapM) {
        if (d >= 100 && i + 1 < pts.length) {
          const returnD = haversineKm(last[0], last[1], pts[i+1][0], pts[i+1][1]) * 1000;
          if (returnD < d * 0.5) continue;
        }
        outPts.push(pts[i]);
        if (ts) outTs.push(ts[i]);
      }
    }
    if (outPts.length < 2) return { pts, ts }; // fallback: keep original
    return { pts: outPts, ts: ts ? outTs : undefined };
  };

  const { pts: cleanPoints, ts: cleanTs } = filterOutlierPts(points, timestamps);

  // 1. Google Directions API — exact Google Maps accuracy
  const google = await tryGoogle(cleanPoints);
  if (google) return google;

  // 2. map-match WITH timestamps, 150 m radius (best OSRM quality)
  const m150 = await tryMatch(cleanPoints, 150, cleanTs);
  if (m150) return m150;

  // 3. map-match WITH timestamps, 250 m radius (rural India roads far from OSM centrelines)
  const m250 = await tryMatch(cleanPoints, 250, cleanTs);
  if (m250) return m250;

  // 4. map-match WITHOUT timestamps, 250 m radius (safety net if timestamps desync)
  if (cleanTs) {
    const m250noTs = await tryMatch(cleanPoints, 250);
    if (m250noTs) return m250noTs;
  }

  // 5. route/v1 with ALL waypoints — must pass through every GPS point, so no shortcuts
  const routed = await tryRouteAllWaypoints(cleanPoints);
  if (routed) return routed;

  // 6. Raw GPS — no phantom roads, shows exactly where the employee actually was
  // Compute haversine distance so the km counter isn't 0 for this segment
  let rawDistM = 0;
  for (let i = 1; i < cleanPoints.length; i++) {
    rawDistM += haversineKm(cleanPoints[i-1][0], cleanPoints[i-1][1], cleanPoints[i][0], cleanPoints[i][1]) * 1000;
  }
  return { coords: cleanPoints, distanceM: rawDistM };
}

// Snaps a 2-point signal-gap pair to the road network using route/v1 only.
// Map-match (tryMatch) is designed for dense GPS traces; with just 2 endpoints
// it produces noisy winding paths. Route/v1 gives a clean simplified road route.
// Returns coords AND the road distance so gap km is included in the trip total.
async function osrmSnapGap(p1: [number, number], p2: [number, number]): Promise<{ coords: [number, number][]; distanceM: number }> {
  // Try Google Directions first for signal-gap segments too
  try {
    const res = await fetch("/api/google-directions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ waypoints: [{ lat: p1[0], lng: p1[1] }, { lat: p2[0], lng: p2[1] }] }),
      signal: AbortSignal.timeout(12000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.polyline && data.polyline.length > 1 && data.distanceM > 0)
        return { coords: data.polyline as [number, number][], distanceM: data.distanceM };
    }
  } catch {}
  // Fallback: OSRM route/v1
  try {
    const coordStr = `${p1[1]},${p1[0]};${p2[1]},${p2[0]}`;
    const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(t));
    if (!res.ok) {
      const fallbackM = haversineKm(p1[0], p1[1], p2[0], p2[1]) * 1000;
      return { coords: [p1, p2], distanceM: fallbackM };
    }
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.[0]?.geometry?.coordinates) {
      const fallbackM = haversineKm(p1[0], p1[1], p2[0], p2[1]) * 1000;
      return { coords: [p1, p2], distanceM: fallbackM };
    }
    const coords: [number, number][] = data.routes[0].geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng]
    );
    const distanceM: number = data.routes[0].distance ?? haversineKm(p1[0], p1[1], p2[0], p2[1]) * 1000;
    return coords.length > 1 ? { coords, distanceM } : { coords: [p1, p2], distanceM };
  } catch {
    const fallbackM = haversineKm(p1[0], p1[1], p2[0], p2[1]) * 1000;
    return { coords: [p1, p2], distanceM: fallbackM };
  }
}

// Inner layer — must be inside MapContainer so Leaflet hooks work
function PlaybackMapInner({
  rawSegments,
  snappedSegments,
  chkStops,
  stoppages,
  mapTypeId,
  playbackPos,
  onMapReady,
  punchInLat,
  punchInLng,
  punchInLocation,
  punchInTime,
  punchOutLat,
  punchOutLng,
  punchOutLocation,
  punchOutTime,
  signalGapLines = [],
  snappedGapLines = [],
}: {
  rawSegments: [number, number][][];
  snappedSegments: [number, number][][];
  chkStops: { pos: [number, number]; num: number; inTime: string; outTime: string; loc: string }[];
  stoppages: { pos: [number, number]; num: number; durationStr: string; startTs: string; endTs: string }[];
  mapTypeId: string;
  playbackPos: [number, number] | null;
  onMapReady: (m: any) => void;
  punchInLat?: number | null;
  punchInLng?: number | null;
  punchInLocation?: string | null;
  punchInTime?: string | null;
  punchOutLat?: number | null;
  punchOutLng?: number | null;
  punchOutLocation?: string | null;
  punchOutTime?: string | null;
  signalGapLines?: { path: [[number, number], [number, number]]; gapMins: number }[];
  snappedGapLines?: { path: [number, number][]; gapMins: number }[];
}) {
  const tile = LEAFLET_TILES[mapTypeId] ?? LEAFLET_TILES.roadmap;
  const map = useMap();

  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 120);
    return () => clearTimeout(t);
  }, [map]);

  // Flat arrays for bounds fitting and start/end marker fallbacks
  const rawPointsFlat = rawSegments.flat();
  const allRoutePts = snappedSegments.some(s => s.length > 1)
    ? snappedSegments.flat()
    : rawPointsFlat;

  const startIcon = L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="52" viewBox="0 0 36 52"><ellipse cx="18" cy="49" rx="6" ry="3" fill="rgba(0,0,0,0.2)"/><path d="M18 0C10.27 0 4 6.27 4 14c0 10.5 14 36 14 36S32 24.5 32 14C32 6.27 25.73 0 18 0z" fill="#15803d" stroke="white" stroke-width="2"/><circle cx="18" cy="14" r="9" fill="white"/><text x="18" y="18" text-anchor="middle" fill="#15803d" font-size="8" font-weight="bold" font-family="sans-serif">START</text></svg>`,
    className: "", iconSize: [36, 52], iconAnchor: [18, 52],
  });
  const endIcon = L.divIcon({
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="52" viewBox="0 0 36 52"><ellipse cx="18" cy="49" rx="6" ry="3" fill="rgba(0,0,0,0.2)"/><path d="M18 0C10.27 0 4 6.27 4 14c0 10.5 14 36 14 36S32 24.5 32 14C32 6.27 25.73 0 18 0z" fill="#dc2626" stroke="white" stroke-width="2"/><circle cx="18" cy="14" r="9" fill="white"/><text x="18" y="18" text-anchor="middle" fill="#dc2626" font-size="8" font-weight="bold" font-family="sans-serif">END</text></svg>`,
    className: "", iconSize: [36, 52], iconAnchor: [18, 52],
  });
  const playbackDot = makePlaybackDotIcon();

  return (
    <>
      <TileLayer key={mapTypeId} url={tile.url} {...(tile.subdomains !== undefined ? { subdomains: tile.subdomains } : {})} attribution={tile.attr} maxZoom={20} />
      <MapRefCapture onReady={onMapReady} />
      <PbBoundsFitter points={allRoutePts} />

      {/* ── Route lines — one per sub-segment (split at signal gaps) ── */}
      {/* Per-segment fallback: show raw GPS for any segment OSRM couldn't snap. */}
      {rawSegments.map((seg, i) => {
        const hasSnapped = snappedSegments[i] && snappedSegments[i].length > 1;
        if (hasSnapped || seg.length <= 1) return null;
        const smoothed = smoothPolyline(seg);
        return (
          <Fragment key={`pb-raw-${i}`}>
            <Polyline positions={smoothed} pathOptions={{ color: "#ffffff", weight: 12, opacity: 0.9, lineCap: "round", lineJoin: "round" }} />
            <Polyline positions={smoothed} pathOptions={{ color: "#1565C0", weight: 7, opacity: 1, lineCap: "round", lineJoin: "round" }} />
          </Fragment>
        );
      })}
      {/* Once OSRM returns: snapped road lines per segment */}
      {snappedSegments.map((seg, i) =>
        seg.length > 1 ? (
          <Fragment key={`pb-snap-${i}`}>
            <Polyline positions={seg} pathOptions={{ color: "#ffffff", weight: 12, opacity: 0.9, lineCap: "round", lineJoin: "round" }} />
            <Polyline positions={seg} pathOptions={{ color: "#1565C0", weight: 7, opacity: 1, lineCap: "round", lineJoin: "round" }} />
          </Fragment>
        ) : null
      )}

      {/* Signal-drop gaps — road-snapped red line indicating signal loss */}
      {signalGapLines.map((gap, i) => {
        const snapped = snappedGapLines[i];
        const positions: [number, number][] = snapped && snapped.path.length > 1 ? snapped.path : gap.path;
        const gapMins = snapped ? snapped.gapMins : gap.gapMins;
        return (
          <Fragment key={`pb-gap-${i}`}>
            <Polyline positions={positions} pathOptions={{ color: "#ffffff", weight: 12, opacity: 0.9, lineCap: "round", lineJoin: "round" }} />
            <Polyline positions={positions} pathOptions={{ color: "#ef4444", weight: 7, opacity: 1, lineCap: "round", lineJoin: "round" }}>
              <Popup>
                <div style={{ fontSize: 13, minWidth: 150 }}>
                  <b style={{ color: "#dc2626" }}>📵 Signal Lost</b><br />
                  <span style={{ fontSize: 12 }}>No GPS for <b>{gapMins} min{gapMins !== 1 ? "s" : ""}</b></span><br />
                  <span style={{ fontSize: 11, color: "#888" }}>Route estimated from last known point</span>
                </div>
              </Popup>
            </Polyline>
          </Fragment>
        );
      })}

      {/* Stoppage markers — orange road-line style circle (white border + orange fill) */}
      {stoppages.map(s => (
        <CircleMarker
          key={`pb-stop-${s.num}`}
          center={s.pos}
          radius={11}
          pathOptions={{ color: "#ffffff", weight: 4, fillColor: "#f97316", fillOpacity: 1 }}
        >
          <Popup>
            <div style={{ fontSize: 13, minWidth: 140 }}>
              <b style={{ color: "#f97316" }}>⏸ Idle #{s.num}</b><br/>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{s.durationStr}</span><br/>
              <span style={{ fontSize: 11, color: "#666" }}>{s.startTs} – {s.endTs}</span>
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {/* Numbered CHK blue circles */}
      {chkStops.map(stop => (
        <Marker key={`pb-chk-${stop.num}`} position={stop.pos} icon={makeCircleIcon("#2563eb", String(stop.num), 30)}>
          <Popup>
            <div style={{ minWidth: 150, fontSize: 13 }}>
              <b style={{ color: "#2563eb" }}>CHK {stop.num}</b>
              {stop.loc && <div style={{ color: "#555", fontSize: 11, marginTop: 2 }}>{stop.loc}</div>}
              <table style={{ marginTop: 6, width: "100%" }}>
                <tbody>
                  <tr><td style={{ color: "#16a34a", fontWeight: 600, paddingRight: 8 }}>In</td><td style={{ fontWeight: 600 }}>{stop.inTime}</td></tr>
                  <tr><td style={{ color: "#dc2626", fontWeight: 600, paddingRight: 8 }}>Out</td><td style={{ fontWeight: 600 }}>{stop.outTime}</td></tr>
                </tbody>
              </table>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Punch-In / START marker — uses attendance location, falls back to first GPS point */}
      {(punchInLat && punchInLng
        ? <Marker position={[punchInLat, punchInLng]} icon={startIcon} zIndexOffset={200}>
            <Popup>
              <div style={{ fontSize: 13, minWidth: 140 }}>
                <b style={{ color: "#15803d" }}>▶ Punch In</b>
                {punchInTime && <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{punchInTime}</div>}
                {punchInLocation && <div style={{ fontSize: 11, color: "#555" }}>{punchInLocation}</div>}
              </div>
            </Popup>
          </Marker>
        : rawPointsFlat.length > 0
          ? <Marker position={rawPointsFlat[0]} icon={startIcon} zIndexOffset={200}>
              <Popup><b style={{ color: "#15803d" }}>▶ Trip Start</b></Popup>
            </Marker>
          : null
      )}

      {/* Punch-Out / END marker — uses attendance location, falls back to last GPS point */}
      {(punchOutLat && punchOutLng
        ? <Marker position={[punchOutLat, punchOutLng]} icon={endIcon} zIndexOffset={200}>
            <Popup>
              <div style={{ fontSize: 13, minWidth: 140 }}>
                <b style={{ color: "#dc2626" }}>⬛ Punch Out</b>
                {punchOutTime && <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{punchOutTime}</div>}
                {punchOutLocation && <div style={{ fontSize: 11, color: "#555" }}>{punchOutLocation}</div>}
              </div>
            </Popup>
          </Marker>
        : rawPointsFlat.length > 1
          ? <Marker position={rawPointsFlat[rawPointsFlat.length - 1]} icon={endIcon} zIndexOffset={200}>
              <Popup><b style={{ color: "#dc2626" }}>⬛ Last Position</b></Popup>
            </Marker>
          : null
      )}

      {/* Moving playback dot */}
      {playbackPos && (
        <Marker position={playbackPos} icon={playbackDot} zIndexOffset={1000}>
          <Popup><b>▶ Playback Position</b></Popup>
        </Marker>
      )}
    </>
  );
}

const PB_SPEEDS = [1, 2, 5, 10, 20];

function PlaybackMap({ trips, date, employeeId, mapTypeId, onMapTypeChange, attendanceRecords, onOsrmDistance, onGapKm }: {
  trips: TripWithVisits[];
  date: string;
  employeeId: number;
  mapTypeId: string;
  onMapTypeChange: (t: string) => void;
  attendanceRecords: any[];
  onOsrmDistance?: (km: number) => void;
  onGapKm?: (km: number) => void;
}) {
  const [layerOpen, setLayerOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [playbackIdx, setPlaybackIdx] = useState(0);
  const [speedMult, setSpeedMult] = useState(1);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [snappedSegments, setSnappedSegments] = useState<[number, number][][]>([]);
  const [snappedPbGapSegments, setSnappedPbGapSegments] = useState<{ path: [number, number][]; gapMins: number }[]>([]);
  const [snapping, setSnapping] = useState(false);
  const playTimerRef = useRef<any>(null);
  const leafletMap = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find attendance record for the selected playback date
  const pbAttendance = useMemo(() =>
    attendanceRecords.find((r: any) => {
      if (!r.date) return false;
      try { return format(new Date(r.date), "yyyy-MM-dd") === date; } catch { return false; }
    }),
    [attendanceRecords, date]
  );
  const pbPunchInLat = pbAttendance?.checkInLatitude ? Number(pbAttendance.checkInLatitude) : null;
  const pbPunchInLng = pbAttendance?.checkInLongitude ? Number(pbAttendance.checkInLongitude) : null;
  const pbPunchOutLat = pbAttendance?.checkOutLatitude ? Number(pbAttendance.checkOutLatitude) : null;
  const pbPunchOutLng = pbAttendance?.checkOutLongitude ? Number(pbAttendance.checkOutLongitude) : null;

  const { data: locationData, refetch: refetchPlayback, isFetching: pbFetching } = useQuery<{
    points: { latitude: string; longitude: string; recordedAt: string; speed?: string | null; accuracy?: string | null }[];
    segments?: { type: string; startTime: string; endTime: string; lat?: number; lng?: number; durationSecs?: number }[];
  }>({
    queryKey: ["/api/employees", employeeId, "locations", date, "playback"],
    queryFn: async () => {
      const res = await fetch(`/api/employees/${employeeId}/locations?date=${date}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!res.ok) return { points: [], segments: [] };
      return res.json();
    },
    enabled: !!employeeId && !!date,
    staleTime: 0,
  });

  const filtered = trips.filter(t => t.startTime && format(new Date(t.startTime), "yyyy-MM-dd") === date);

  // Build timestamped route from GPS points → fallback to waypoints
  const routeWithTime = useMemo(() => {
    const MAX_ACCURACY_M = 80; // skip pings worse than 80 m — same threshold as server
    const raw = (locationData?.points ?? [])
      .filter(p => {
        if (!p.latitude || !p.longitude) return false;
        // Drop poor-accuracy points to prevent zigzag inflation on the map and in distance
        const acc = p.accuracy != null && p.accuracy !== "" ? Number(p.accuracy) : null;
        if (acc !== null && acc > MAX_ACCURACY_M) return false;
        return true;
      })
      .map(p => ({
        pos: [Number(p.latitude), Number(p.longitude)] as [number, number],
        ts: p.recordedAt,
        speedMs: p.speed != null && p.speed !== "" ? Number(p.speed) : null,
      }));

    // Bounce detection: if a ping jumps far but the NEXT ping returns near the previous
    // position, it is GPS noise (tower-switch / multipath) — drop it from the route.
    const gpsPts: typeof raw = [];
    for (let i = 0; i < raw.length; i++) {
      if (gpsPts.length === 0) { gpsPts.push(raw[i]); continue; }
      const last = gpsPts[gpsPts.length - 1];
      const dM = haversineKm(last.pos[0], last.pos[1], raw[i].pos[0], raw[i].pos[1]) * 1000;
      if (dM >= 100 && i + 1 < raw.length) {
        const returnM = haversineKm(last.pos[0], last.pos[1], raw[i + 1].pos[0], raw[i + 1].pos[1]) * 1000;
        if (returnM < dM * 0.5) continue; // GPS bounce — skip this ping
      }
      gpsPts.push(raw[i]);
    }

    // Stationary noise suppression: the server detects stoppages (person not moving).
    // During those periods the GPS keeps drifting ±50–100 m, creating spurious blue/red
    // noise loops on the map even though the person never left the building.
    // Fix: keep only the FIRST point entering a stoppage window; skip all subsequent
    // drift pings inside it.  Travel lines still connect cleanly to the entry point,
    // and the stoppage orange marker shows exactly where they were.
    const stoppageRanges = (locationData?.segments ?? [])
      .filter((s: any) => s.type === "stoppage")
      .map((s: any) => ({
        start: new Date(s.startTime).getTime(),
        end: new Date(s.endTime).getTime(),
      }));

    const inStoppage = (ts: string) => {
      const t = new Date(ts).getTime();
      return stoppageRanges.some((r: any) => t >= r.start && t <= r.end);
    };

    const routePts: typeof gpsPts = [];
    for (let i = 0; i < gpsPts.length; i++) {
      if (!inStoppage(gpsPts[i].ts)) {
        routePts.push(gpsPts[i]);
      } else {
        // Keep the first point that enters a stoppage window so the travel line
        // leading up to it isn't left dangling, then skip all subsequent noise.
        const prevInStoppage = i > 0 && inStoppage(gpsPts[i - 1].ts);
        if (!prevInStoppage) routePts.push(gpsPts[i]);
      }
    }

    if (routePts.length > 0) return routePts;
    const wps: { pos: [number, number]; ts: string; speedMs: null }[] = [];
    filtered.forEach(trip => {
      if (trip.startLatitude && trip.startLongitude)
        wps.push({ pos: [Number(trip.startLatitude), Number(trip.startLongitude)], ts: trip.startTime as string, speedMs: null });
      (trip.visits || []).forEach(v => {
        if (v.punchInLatitude && v.punchInLongitude)
          wps.push({ pos: [Number(v.punchInLatitude), Number(v.punchInLongitude)], ts: v.punchInTime as unknown as string, speedMs: null });
      });
      if (trip.endLatitude && trip.endLongitude)
        wps.push({ pos: [Number(trip.endLatitude), Number(trip.endLongitude)], ts: trip.endTime as string, speedMs: null });
    });
    return wps;
  }, [locationData, filtered]);

  const rawPoints = useMemo(() => routeWithTime.map(r => r.pos), [routeWithTime]);

  // Split routeWithTime into sub-segments at signal gaps (>5 min) before OSRM,
  // so the blue snapped line never bridges a gap — red lines cover the gaps.
  // At each gap boundary, if a stoppage falls in the gap, append/prepend its
  // lat/lng so the blue line connects cleanly to the IDLE marker on both sides.
  const rawSegments = useMemo(() => {
    const SIGNAL_GAP_MS = 5 * 60 * 1000;
    const stoppageAnchors = (locationData?.segments ?? [])
      .filter((s: any) => s.type === "stoppage" && s.lat != null && s.lng != null);
    const segs: [number, number][][] = [];
    let cur: [number, number][] = [];
    for (let i = 0; i < routeWithTime.length; i++) {
      if (cur.length > 0) {
        const gapMs = new Date(routeWithTime[i].ts).getTime() - new Date(routeWithTime[i - 1].ts).getTime();
        if (gapMs > SIGNAL_GAP_MS) {
          // Find a stoppage that falls entirely within this time gap
          const gapStartMs = new Date(routeWithTime[i - 1].ts).getTime();
          const gapEndMs   = new Date(routeWithTime[i].ts).getTime();
          const bridgeStop = stoppageAnchors.find((s: any) => {
            const sStart = new Date(s.startTime).getTime();
            const sEnd   = new Date(s.endTime).getTime();
            return sStart >= gapStartMs && sEnd <= gapEndMs;
          });
          if (bridgeStop) {
            const anchor: [number, number] = [Number((bridgeStop as any).lat), Number((bridgeStop as any).lng)];
            // Append stoppage location to end of the closing segment
            const lastPt = cur[cur.length - 1];
            if (haversineM(lastPt[0], lastPt[1], anchor[0], anchor[1]) > 22) cur.push(anchor);
            segs.push(cur);
            // Open next segment from the stoppage location
            const nextPt = routeWithTime[i].pos;
            cur = haversineM(anchor[0], anchor[1], nextPt[0], nextPt[1]) > 22 ? [anchor] : [];
          } else {
            segs.push(cur);
            cur = [];
          }
        }
      }
      cur.push(routeWithTime[i].pos);
    }
    if (cur.length > 0) segs.push(cur);
    return segs.filter(s => s.length > 0);
  }, [routeWithTime, locationData?.segments]);

  // Snap each sub-segment independently so blue road lines stop at gap boundaries
  useEffect(() => {
    if (rawSegments.every(s => s.length < 2)) { setSnappedSegments([]); return; }
    let cancelled = false;
    setSnapping(true);
    Promise.all(
      rawSegments.map(seg => seg.length >= 2
        ? osrmSnap(seg)
        : Promise.resolve({ coords: [] as [number, number][], distanceM: 0 })
      )
    ).then(results => {
      if (!cancelled) {
        setSnappedSegments(results.map(r => r.coords));
        setSnapping(false);
        // Report total OSRM road distance (same method as Google Maps) to parent
        const totalOsrmKm = results.reduce((s, r) => s + r.distanceM / 1000, 0);
        if (totalOsrmKm > 0) onOsrmDistance?.(totalOsrmKm);
      }
    });
    return () => { cancelled = true; };
  }, [rawSegments.map(s => s.length).join(",")]);

  // Build numbered stoppages from segments
  const stoppages = useMemo(() => {
    let num = 1;
    return (locationData?.segments ?? [])
      .filter(s => s.type === "stoppage" && s.lat && s.lng)
      .map(s => {
        const mins = Math.floor((s.durationSecs || 0) / 60);
        const secs = Math.round((s.durationSecs || 0) % 60);
        return {
          pos: [s.lat!, s.lng!] as [number, number],
          num: num++,
          durationStr: `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`,
          startTs: new Date(s.startTime).toLocaleTimeString(),
          endTs: new Date(s.endTime).toLocaleTimeString(),
        };
      });
  }, [locationData]);

  // Signal-drop gaps for playback view — 10 min threshold matches Live map + server SIGNAL_GAP_SEC.
  // Cellular GPS pings every 2–7 min naturally; old 5 min was showing false signal-loss gaps.
  const pbSignalGapLines = useMemo(() => {
    const SIGNAL_GAP_MS = 5 * 60 * 1000;  // 5 min — catches real signal losses
    const SIGNAL_GAP_MIN_DIST_M = 100;    // 100 m — show even short gaps
    const segs = locationData?.segments ?? [];
    // Only suppress gaps inside STOPPAGE segments — travel-segment gaps are real signal drops.
    const stoppageRanges = segs.filter((s: any) => s.type === "stoppage").map((s: any) => ({
      start: new Date(s.startTime).getTime(),
      end:   new Date(s.endTime).getTime(),
    }));
    const gaps: { path: [[number, number], [number, number]]; gapMins: number }[] = [];
    for (let i = 1; i < routeWithTime.length; i++) {
      const t1 = new Date(routeWithTime[i - 1].ts).getTime();
      const t2 = new Date(routeWithTime[i].ts).getTime();
      const gap = t2 - t1;
      if (gap > SIGNAL_GAP_MS) {
        const p1 = routeWithTime[i - 1].pos;
        const p2 = routeWithTime[i].pos;
        if (haversineM(p1[0], p1[1], p2[0], p2[1]) < SIGNAL_GAP_MIN_DIST_M) continue;
        // Skip gaps that overlap ANY stoppage: blue lines already anchor to it from both sides.
        if (stoppageRanges.some((s: any) => s.start < t2 && s.end > t1)) continue;
        gaps.push({ path: [p1, p2], gapMins: Math.round(gap / 60000) });
      }
    }
    return gaps;
  }, [routeWithTime, locationData?.segments]);

  // Snap playback gap lines to roads (route/v1 simplified — clean 2-point road route)
  useEffect(() => {
    if (pbSignalGapLines.length === 0) { setSnappedPbGapSegments([]); return; }
    let cancelled = false;
    Promise.all(pbSignalGapLines.map(g => osrmSnapGap(g.path[0], g.path[1]))).then(results => {
      if (!cancelled) {
        setSnappedPbGapSegments(results.map((r, i) => ({
          path: r.coords,
          gapMins: pbSignalGapLines[i].gapMins,
        })));
        // Use straight-line haversine for gap km — road distance can overcount
        // signal-loss periods where the employee may not have followed the routed road.
        const totalGapKm = pbSignalGapLines.reduce((s, g) =>
          s + haversineKm(g.path[0][0], g.path[0][1], g.path[1][0], g.path[1][1]), 0);
        if (totalGapKm > 0) onGapKm?.(totalGapKm);
      }
    });
    return () => { cancelled = true; };
  }, [pbSignalGapLines.length]);

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

  // Playback timer — interval shrinks as speed increases
  useEffect(() => {
    if (playing) {
      playTimerRef.current = setInterval(() => {
        setPlaybackIdx(prev => {
          if (prev >= routeWithTime.length - 1) { setPlaying(false); return prev; }
          return prev + 1;
        });
      }, Math.max(50, Math.round(180 / speedMult)));
    } else {
      clearInterval(playTimerRef.current);
    }
    return () => clearInterval(playTimerRef.current);
  }, [playing, routeWithTime.length, speedMult]);

  // Reset playback when date changes
  useEffect(() => { setPlaybackIdx(0); setPlaying(false); setSnappedSegments([]); }, [date]);

  // Speed at current playback position (km/h)
  // Priority: GPS Doppler speed from device (most accurate) → computed from position diff
  const currentSpeedKmh = useMemo(() => {
    if (routeWithTime.length < 1 || playbackIdx < 0) return 0;
    const cur = routeWithTime[Math.min(playbackIdx, routeWithTime.length - 1)];
    // Use GPS Doppler speed if the device reported it (satellite lock)
    if (cur.speedMs != null && cur.speedMs > 0) return cur.speedMs * 3.6;
    // Fallback: compute from consecutive position difference
    if (playbackIdx === 0 || routeWithTime.length < 2) return 0;
    const p1 = routeWithTime[playbackIdx - 1];
    const p2 = cur;
    const distKm = haversineKm(p1.pos[0], p1.pos[1], p2.pos[0], p2.pos[1]);
    const timeSec = (new Date(p2.ts).getTime() - new Date(p1.ts).getTime()) / 1000;
    if (timeSec <= 0) return 0;
    const computed = (distKm / timeSec) * 3600;
    // Cap at 200 km/h to hide GPS teleport artefacts in the display
    return Math.min(computed, 200);
  }, [routeWithTime, playbackIdx]);

  const currentTs = routeWithTime[playbackIdx]?.ts;
  const tsDisplay = currentTs ? format(new Date(currentTs), "yyyy-MM-dd HH:mm:ss") : "--";
  const speedDisplay = `${currentSpeedKmh.toFixed(2)} KM/H`;
  const progress = routeWithTime.length > 1 ? (playbackIdx / (routeWithTime.length - 1)) * 100 : 0;

  const playbackPos: [number, number] | null = routeWithTime.length > 0 && playbackIdx >= 0
    ? routeWithTime[Math.min(playbackIdx, routeWithTime.length - 1)].pos
    : null;

  const defaultCenter: [number, number] = rawPoints.length > 0 ? rawPoints[0] : [22.8, 80.0];

  const fitAll = () => {
    const m = leafletMap.current;
    const flat = snappedSegments.some(s => s.length > 1)
      ? snappedSegments.flat()
      : rawPoints;
    if (!m || flat.length < 1) return;
    if (flat.length === 1) { m.setView(flat[0], 15); return; }
    m.fitBounds(L.latLngBounds(flat.map(p => L.latLng(p[0], p[1]))), { padding: [50, 50] });
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  const ctrlBtn = "w-8 h-8 bg-white flex items-center justify-center hover:bg-gray-50 cursor-pointer border-b border-gray-200 last:border-b-0 transition-colors";

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
          rawSegments={rawSegments}
          snappedSegments={snappedSegments}
          chkStops={chkStops}
          stoppages={stoppages}
          mapTypeId={mapTypeId}
          playbackPos={playbackPos}
          onMapReady={(m) => { leafletMap.current = m; }}
          punchInLat={pbPunchInLat}
          punchInLng={pbPunchInLng}
          punchInLocation={pbAttendance?.checkInLocation || null}
          punchInTime={pbAttendance?.checkIn ? String(pbAttendance.checkIn) : null}
          punchOutLat={pbPunchOutLat}
          punchOutLng={pbPunchOutLng}
          punchOutLocation={pbAttendance?.checkOutLocation || null}
          punchOutTime={pbAttendance?.checkOut ? String(pbAttendance.checkOut) : null}
          signalGapLines={pbSignalGapLines}
          snappedGapLines={snappedPbGapSegments}
        />
      </MapContainer>

      {/* ── Top-left: snapping indicator ── */}
      {snapping && (
        <div className="absolute top-2 left-2 z-[1001] bg-white/90 rounded-full shadow px-3 py-1 text-[11px] text-blue-700 font-medium flex items-center gap-1.5">
          <Loader2 className="w-3 h-3 animate-spin" /> Snapping to roads…
        </div>
      )}

      {/* ── Right-side controls ── */}
      <div className="absolute z-[1001] select-none flex flex-col items-center gap-1.5" style={{ top: 10, right: 10 }}>
        {/* Layers / map-type */}
        <div className="relative">
          <button onClick={() => setLayerOpen(o => !o)} title="Map type"
            className="w-8 h-8 bg-white rounded shadow-md flex items-center justify-center hover:bg-gray-50 border border-gray-200">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 12 12 17 22 12"/><polyline points="2 17 12 22 22 17"/>
            </svg>
          </button>
          {layerOpen && (
            <div className="absolute right-0 top-9 bg-white rounded shadow-lg border border-gray-200 py-1 w-36 text-[12px] z-[1002]">
              {MAP_TYPES.map(opt => (
                <button key={opt.id} onClick={() => { onMapTypeChange(opt.id); setLayerOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 ${mapTypeId === opt.id ? "font-semibold text-blue-600" : "text-gray-700"}`}>
                  {mapTypeId === opt.id ? "✓" : <span className="w-3"/>} {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Fit all */}
        <button onClick={fitAll} title="Fit route to screen"
          className="w-8 h-8 bg-white rounded shadow-md flex items-center justify-center hover:bg-gray-50 border border-gray-200">
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="#555" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="12" cy="12" r="7"/><line x1="12" y1="1" x2="12" y2="5"/>
            <line x1="12" y1="19" x2="12" y2="23"/><line x1="1" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="23" y2="12"/>
          </svg>
        </button>
        {/* Zoom +/- */}
        <div className="bg-white rounded shadow-md border border-gray-200 overflow-hidden flex flex-col">
          <button onClick={() => leafletMap.current?.zoomIn()} title="Zoom in" className={ctrlBtn}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          <button onClick={() => leafletMap.current?.zoomOut()} title="Zoom out" className={ctrlBtn}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
        {/* Fullscreen */}
        <button onClick={toggleFullscreen} title="Fullscreen"
          className="w-8 h-8 bg-white rounded shadow-md flex items-center justify-center hover:bg-gray-50 border border-gray-200">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
            <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
          </svg>
        </button>
        {/* Go to start */}
        <button onClick={() => { if (rawPoints.length > 0 && leafletMap.current) leafletMap.current.setView(rawPoints[0], 16); }}
          title="Go to start" className="w-8 h-8 bg-white rounded shadow-md flex items-center justify-center hover:bg-gray-50 border border-gray-200">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="#1a73e8" stroke="white" strokeWidth="0.5">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </button>
      </div>

      {/* ── Bottom playback bar (TrackOlap-style) ── */}
      <div className="absolute bottom-0 left-0 right-0 z-[1001] bg-white border-t border-gray-200 shadow-lg select-none">
        {/* Progress bar — full width, clickable */}
        <div
          className="h-1.5 bg-gray-200 cursor-pointer relative"
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            const newIdx = Math.round(pct * (routeWithTime.length - 1));
            setPlaybackIdx(Math.max(0, Math.min(newIdx, routeWithTime.length - 1)));
          }}
        >
          <div className="h-full bg-blue-700 transition-all" style={{ width: `${progress}%` }} />
          {/* Scrubber thumb */}
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue-700 border-2 border-white shadow"
            style={{ left: `calc(${progress}% - 6px)` }} />
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-3 px-3 py-2">
          {/* Play / Pause */}
          <button
            onClick={() => {
              if (playbackIdx >= routeWithTime.length - 1) setPlaybackIdx(0);
              setPlaying(p => !p);
            }}
            title={playing ? "Pause" : "Play"}
            className="text-gray-700 hover:text-blue-700 transition-colors"
            data-testid="button-pb-play"
          >
            {playing ? (
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
            )}
          </button>

          {/* Stop / Reset */}
          <button
            onClick={() => { setPlaying(false); setPlaybackIdx(0); }}
            title="Stop & Reset"
            className="text-gray-700 hover:text-blue-700 transition-colors"
            data-testid="button-pb-stop"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <rect x="4" y="4" width="16" height="16" rx="2"/>
            </svg>
          </button>

          {/* Speed multiplier selector */}
          <div className="relative">
            <button
              onClick={() => setSpeedOpen(o => !o)}
              className="flex items-center gap-1 border border-gray-300 rounded px-2 py-0.5 text-[12px] font-semibold text-gray-700 hover:border-blue-400 hover:text-blue-700 transition-colors bg-white"
              data-testid="button-pb-speed"
            >
              {speedMult}x
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {speedOpen && (
              <div className="absolute bottom-8 left-0 bg-white border border-gray-200 rounded shadow-lg py-1 z-[1010]">
                {PB_SPEEDS.map(s => (
                  <button key={s} onClick={() => { setSpeedMult(s); setSpeedOpen(false); }}
                    className={`block w-full text-left px-4 py-1 text-[13px] hover:bg-gray-50 ${speedMult === s ? "font-bold text-blue-600" : "text-gray-700"}`}>
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Spacer + timestamp + speed + refresh */}
          <div className="flex-1 flex items-center justify-end gap-4 font-mono text-[12px] text-gray-600">
            <span className="font-semibold text-gray-800" data-testid="text-pb-speed">{speedDisplay}</span>
            <span className="text-gray-500" data-testid="text-pb-ts">{tsDisplay}</span>
            <button
              onClick={() => { setPlaying(false); setPlaybackIdx(0); refetchPlayback(); }}
              title="Refresh GPS data for this date"
              className="text-blue-500 hover:text-blue-700 transition-colors"
              data-testid="button-pb-refresh"
            >
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.2"
                strokeLinecap="round" strokeLinejoin="round" className={pbFetching ? "animate-spin" : ""}>
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Monotonic segment distance lock: once a km value is seen for a segment it can only go up.
// Persisted in localStorage so it survives page refreshes within the same day.
function lockedSegKm(_empId: number, _date: string, _startTime: string, rawKm: number): number {
  return rawKm;
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
  const [liveRefreshMs, setLiveRefreshMs] = useState<10000 | 30000>(10000);
  const [liveCountdown, setLiveCountdown] = useState(10);
  const [sharedMapTypeId, setSharedMapTypeId] = useState("openstreetmap");
  const [highlightedSegment, setHighlightedSegment] = useState<HighlightSegment | null>(null);

  const handleTimelineClick = (seg: HighlightSegment) => {
    setHighlightedSegment(prev =>
      prev?.startTime === seg.startTime && prev?.type === seg.type ? null : seg
    );
  };

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

  const [liveSnappedKm, setLiveSnappedKm] = useState<number | null>(null);
  const [liveGapKm, setLiveGapKm] = useState<number>(0);
  const [osrmSegmentDistances, setOsrmSegmentDistances] = useState<number[]>([]);
  const [playbackOsrmKm, setPlaybackOsrmKm] = useState<number | null>(null);
  const [playbackGapKm, setPlaybackGapKm] = useState<number>(0);
  // Clear stale OSRM distances whenever the date changes (fresh snap will repopulate)
  useEffect(() => { setLiveSnappedKm(null); setOsrmSegmentDistances([]); setLiveGapKm(0); }, [liveDate]);
  useEffect(() => { setPlaybackOsrmKm(null); setPlaybackGapKm(0); }, [playbackDate]);
  // Clear inflated localStorage distance locks left over from before this fix
  useEffect(() => {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith("seg_km_") || k.startsWith("peak_km_"))
        .forEach(k => localStorage.removeItem(k));
    } catch { /* ignore */ }
  }, []);

  // Countdown ticker — resets when interval changes or a fetch completes
  useEffect(() => {
    if (activeTab !== "live") return;
    setLiveCountdown(liveRefreshMs / 1000);
    const id = setInterval(() => setLiveCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [liveRefreshMs, activeTab]);

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
    refetchInterval: activeTab === "live" ? liveRefreshMs : false,
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
    refetchInterval: activeTab === "live" ? liveRefreshMs : false,
  });

  const { data: playbackCheckins = [] } = useQuery<any[]>({
    queryKey: ["/api/employees", empId, "checkins", playbackDate],
    queryFn: async () => {
      const res = await fetch(`/api/employees/${empId}/checkins?date=${playbackDate}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!empId && activeTab === "playback",
  });

  // Always-on query for today's device telemetry (battery / network / GPS) — shown in header
  const deviceTodayStr = format(new Date(), "yyyy-MM-dd");
  const { data: deviceStatusData } = useQuery<{ points: any[] }>({
    queryKey: ["/api/employees", empId, "device-status", deviceTodayStr],
    queryFn: async () => {
      const res = await fetch(`/api/employees/${empId}/locations?date=${deviceTodayStr}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!empId,
    refetchInterval: 10000,
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
    queryKey: ["/api/expenses/employee", empId],
    queryFn: async () => {
      const res = await fetch(`/api/expenses/employee/${empId}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!empId && activeTab === "expense",
  });

  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);
  const [showApproveInput, setShowApproveInput] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [approveAmount, setApproveAmount] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const { toast } = useToast();

  function closeExpenseModal() {
    setSelectedExpense(null);
    setShowApproveInput(false);
    setShowRejectInput(false);
    setApproveAmount("");
    setRejectReason("");
  }

  const approveMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("PATCH", `/api/expenses/${id}/approve`, {
        approvedAmount: approveAmount || selectedExpense?.amount,
      }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses/employee", empId] });
      setSelectedExpense((prev: any) => prev ? { ...prev, status: "approved", approvedAmount: data?.approvedAmount ?? approveAmount ?? prev.amount, finalAmount: data?.finalAmount ?? approveAmount ?? prev.amount } : null);
      setShowApproveInput(false);
      setApproveAmount("");
      toast({ title: "Expense Approved" });
    },
    onError: () => toast({ title: "Failed to approve", variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("PATCH", `/api/expenses/${id}/reject`, { reason: rejectReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses/employee", empId] });
      setSelectedExpense((prev: any) => prev ? { ...prev, status: "rejected", adminComment: rejectReason } : null);
      setShowRejectInput(false);
      setRejectReason("");
      toast({ title: "Expense Rejected" });
    },
    onError: () => toast({ title: "Failed to reject", variant: "destructive" }),
  });

  // Signal lost stats for the Live tab summary panel
  // Uses same segment-coverage filter: gaps inside a known segment are sparse travel pings, not lost signal.
  const liveSignalLostStats = useMemo(() => {
    const SIGNAL_GAP_MS = 5 * 60 * 1000;
    const SIGNAL_GAP_MIN_DIST_M = 500;
    const pts = (locationData?.points ?? []).filter((p: any) => p.latitude && p.longitude && p.recordedAt);
    const segs = locationData?.segments ?? [];
    const segRanges = segs.map((s: any) => ({
      start: new Date(s.startTime).getTime(),
      end:   new Date(s.endTime).getTime(),
    }));
    let count = 0;
    let totalMins = 0;
    for (let i = 1; i < pts.length; i++) {
      const t1 = new Date(pts[i - 1].recordedAt).getTime();
      const t2 = new Date(pts[i].recordedAt).getTime();
      const gap = t2 - t1;
      if (gap > SIGNAL_GAP_MS) {
        const distM = haversineM(
          Number(pts[i - 1].latitude), Number(pts[i - 1].longitude),
          Number(pts[i].latitude), Number(pts[i].longitude)
        );
        if (distM < SIGNAL_GAP_MIN_DIST_M) continue;
        // Skip if t1 falls within any known segment (s.end > t1 strict)
        if (segRanges.some((s: any) => s.start <= t1 && s.end > t1)) continue;
        count++;
        totalMins += Math.round(gap / 60000);
      }
    }
    return { count, totalMins };
  }, [locationData]);

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
    | { type: "travelled"; startTime: string; endTime: string; distanceKm: number; transportMode?: string; gapDistKm?: number }
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

  const enrichedTimelineEvents = allTimelineEvents;

  // Sum "travelled" segments (server-computed, locked) + "gap_travel" segments
  // (synthesised gaps between server segments that contain real GPS movement).
  // gap_travel km is computed client-side from actual GPS points in the gap window —
  // the same calculation used when rendering each gap_travel row in the timeline.
  const _livePointsForTotal = locationData?.points ?? [];
  const enrichedTotalKm = enrichedTimelineEvents.reduce((sum, ev) => {
    if (ev.type === "travelled") {
      return sum + lockedSegKm(empId, liveDate, ev.startTime, (ev as any).distanceKm ?? 0);
    }
    if (ev.type === "gap_travel") {
      const gapStart = new Date(ev.startTime).getTime();
      const gapEnd   = new Date((ev as any).endTime).getTime();
      const gapPts   = _livePointsForTotal
        .filter((p: any) => {
          const t = new Date(p.recordedAt).getTime();
          return t >= gapStart && t <= gapEnd && p.latitude && p.longitude;
        })
        .map((p: any) => [Number(p.latitude), Number(p.longitude)] as [number, number]);
      let gapKm = 0;
      for (let gi = 1; gi < gapPts.length; gi++)
        gapKm += haversineKm(gapPts[gi - 1][0], gapPts[gi - 1][1], gapPts[gi][0], gapPts[gi][1]);
      return sum + gapKm;
    }
    return sum;
  }, 0);

  // Summary bar stats
  const summaryTravelSecs = enrichedTimelineEvents.reduce((sum, ev) => {
    if (ev.type === "travelled" || ev.type === "gap_travel") {
      const s = new Date(ev.startTime).getTime();
      const e = new Date((ev as any).endTime ?? ev.startTime).getTime();
      return sum + Math.max(0, (e - s) / 1000);
    }
    return sum;
  }, 0);

  const summaryStopSecs = enrichedTimelineEvents.reduce((sum, ev) => {
    if (ev.type === "stoppage") {
      return sum + ((ev as any).durationSecs ?? 0);
    }
    return sum;
  }, 0);

  const summaryVisits = enrichedTimelineEvents.filter(ev => ev.type === "visit").length;

  const summarySpeedViolations = (locationData?.points ?? []).filter(
    (p: any) => p.speed && Number(p.speed) * 3.6 > speedLimitKm
  ).length;

  const overspeedMapPoints = (locationData?.points ?? [])
    .filter((p: any) => p.speed && Number(p.speed) * 3.6 > speedLimitKm && p.latitude && p.longitude)
    .map((p: any) => ({ lat: Number(p.latitude), lng: Number(p.longitude), speedKmh: Number(p.speed) * 3.6 }));

  const fmtSecs = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m`;
    return `<1m`;
  };

  const hasTimeline = allTimelineEvents.length > 0 || !!liveDateAttendance;

  const playbackDateTrips = trips.filter(t => t.startTime && format(new Date(t.startTime), "yyyy-MM-dd") === playbackDate);
  const playbackKm = playbackLocationData?.totalKm ?? playbackDateTrips.reduce((s, t) => s + Number(t.totalKm || 0), 0);
  const playbackCheckIns = playbackCheckins.filter((c: any) => c.checkedInAt).length;
  const playbackCheckOuts = playbackCheckins.filter((c: any) => c.checkedOutAt).length;
  const speedViolations = (playbackLocationData?.points ?? []).filter(p => p.speed && Number(p.speed) * 3.6 > speedLimitKm).length;
  const playbackStoppages = playbackLocationData?.stoppageCount ?? 0;

  const tabs: { key: ProfileTab; label: string; icon: React.ReactNode }[] = [
    { key: "live",       label: "Live",           icon: <Radio className="h-3.5 w-3.5" /> },
    { key: "playback",   label: "Playback",        icon: <Play className="h-3.5 w-3.5" /> },
    { key: "task",       label: "Task",            icon: <ClipboardList className="h-3.5 w-3.5" /> },
    { key: "attendance", label: "All Attendance",  icon: <CalendarDays className="h-3.5 w-3.5" /> },
    { key: "details",    label: "Details",         icon: <FileText className="h-3.5 w-3.5" /> },
    { key: "feeds",      label: "Feeds",           icon: <Rss className="h-3.5 w-3.5" /> },
    { key: "expense",    label: "Expense",         icon: <IndianRupee className="h-3.5 w-3.5" /> },
    { key: "audit",      label: "Audit History",   icon: <ScrollText className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-0 -m-4 md:-m-8 animate-in fade-in">
      <div className="bg-card border-b px-4 py-2.5">
        {/* ── Main header row (matches TrackOlap layout) ── */}
        {(() => {
          const pts = deviceStatusData?.points ?? [];
          const latest = pts.length > 0 ? pts[pts.length - 1] : null;
          const bat: number | null = latest?.batteryLevel ?? null;
          const charging: boolean = !!(latest?.isCharging);
          const net: string | null = latest?.networkType ?? null;
          const acc: number | null = latest?.accuracy != null ? Math.round(Number(latest.accuracy)) : null;
          const lastSeen: Date | null = latest?.recordedAt ? new Date(latest.recordedAt) : null;

          const todayAtt = attendanceRecords.find((r: any) => {
            try { return format(new Date(r.date), "yyyy-MM-dd") === deviceTodayStr; } catch { return false; }
          });
          const punchStatus = todayAtt?.checkOut ? "out" : todayAtt?.checkIn ? "in" : "none";

          // Is device "online"? — pinged within last 5 min
          const isOnline = lastSeen && (Date.now() - lastSeen.getTime()) < 5 * 60 * 1000;

          const lastSeenLabel = lastSeen
            ? (() => {
                const diff = Math.floor((Date.now() - lastSeen.getTime()) / 60000);
                if (diff < 1) return "just now";
                if (diff < 60) return `${diff} min ago`;
                const h = Math.floor(diff / 60);
                return `${h}h ${diff % 60}m ago`;
              })()
            : null;

          const signalBars = !net || net === "none" ? 0 : net === "2g" ? 1 : net === "3g" ? 2 : net === "4g" ? 3 : 4;
          const signalColor = signalBars === 0 ? "#ef4444" : signalBars <= 1 ? "#f97316" : signalBars <= 2 ? "#eab308" : "#22c55e";
          const batColor = bat === null ? "#9ca3af" : bat <= 20 ? "#ef4444" : bat <= 50 ? "#f59e0b" : "#22c55e";

          const sep = <span className="text-gray-200 select-none mx-0.5">|</span>;

          return (
            <div className="flex items-center gap-3 min-w-0" data-testid="div-employee-header">

              {/* ── Avatar with online dot ── */}
              <div className="relative shrink-0">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-base font-bold"
                  style={{ backgroundColor: avatarColor(employee.fullName) }}
                  data-testid="avatar-employee"
                >
                  {employee.fullName.charAt(0).toUpperCase()}
                </div>
                {/* online / offline dot */}
                <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${isOnline ? "bg-green-500" : "bg-gray-300"}`} />
              </div>

              {/* ── Name + role + 2 info rows ── */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold leading-tight truncate" data-testid="text-employee-name">{employee.fullName}</h1>
                  <Badge variant={employee.status === "active" ? "default" : "secondary"} className="text-[9px] px-1.5 py-0 shrink-0" data-testid="badge-employee-status">
                    {employee.status === "active" ? "Active" : employee.status}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground capitalize leading-none mb-1">{employee.role || "Employee"}</p>

                {/* Row 1: ID | email | join date */}
                <div className="flex items-center text-[10px] text-muted-foreground flex-wrap gap-y-0.5">
                  <span className="flex items-center gap-0.5"><User className="h-2.5 w-2.5" />{employee.employeeId}</span>
                  {employee.email && <>{sep}<span className="flex items-center gap-0.5"><Mail className="h-2.5 w-2.5" />{employee.email}</span></>}
                  {employee.joinDate && <>{sep}<span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />{formatDate(employee.joinDate)}</span></>}
                </div>

                {/* Row 2: phone | location | fingerprint punch */}
                <div className="flex items-center text-[10px] text-muted-foreground flex-wrap gap-y-0.5 mt-0.5">
                  {employee.phone && <span className="flex items-center gap-0.5"><Phone className="h-2.5 w-2.5" />{employee.phone}</span>}
                  {employee.workLocation && <>{sep}<span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{employee.workLocation}</span></>}
                  {sep}
                  <span className={`flex items-center gap-0.5 font-semibold ${punchStatus === "in" ? "text-green-600" : punchStatus === "out" ? "text-gray-400" : "text-amber-500"}`}>
                    <Fingerprint className="h-2.5 w-2.5" />
                    {punchStatus === "in"  ? `In · ${todayAtt?.checkIn}`
                     : punchStatus === "out" ? `Out · ${todayAtt?.checkOut}`
                     : "Not punched"}
                  </span>
                </div>
              </div>

              {/* ── Device chips (TrackOlap-style) ── */}
              <div className="flex items-center gap-1.5 shrink-0 border-l pl-3" data-testid="div-device-status-bar">

                {/* Phone / app chip */}
                <div className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-md bg-gray-50 border border-gray-100 min-w-[52px]">
                  <Smartphone className="h-4 w-4 text-gray-500" />
                  <span className="text-[9px] text-gray-500 leading-none font-medium">Android</span>
                </div>

                {/* Signal chip */}
                {net !== null && (
                  <div className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-md bg-gray-50 border border-gray-100 min-w-[44px]">
                    {net === "wifi"
                      ? <WifiIcon className="h-4 w-4" style={{ color: signalColor }} />
                      : (
                        <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
                          {[0,1,2,3].map(i => (
                            <rect key={i} x={i*5} y={14-(i+1)*3.2} width="4" height={(i+1)*3.2} rx="0.8"
                              fill={i < signalBars ? signalColor : "#e5e7eb"} />
                          ))}
                        </svg>
                      )
                    }
                    <span className="text-[9px] leading-none font-semibold" style={{ color: signalColor }}>
                      {net === "wifi" ? "WiFi" : net === "none" ? "Off" : net.toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Battery chip */}
                {bat !== null && (
                  <div className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-md bg-gray-50 border border-gray-100 min-w-[44px]">
                    <div className="flex items-center gap-0.5">
                      <svg width="22" height="12" viewBox="0 0 22 12" fill="none">
                        <rect x="0.5" y="0.5" width="18" height="11" rx="2" stroke="#9ca3af" strokeWidth="1"/>
                        <rect x="19" y="3.5" width="2" height="5" rx="1" fill="#9ca3af"/>
                        <rect x="1.5" y="1.5" width={Math.max(1, Math.round((bat/100)*15))} height="9" rx="1.5" fill={batColor}/>
                        {charging && <text x="9" y="9.5" fontSize="7" textAnchor="middle" fill="white" fontWeight="bold">⚡</text>}
                      </svg>
                      {charging && <Zap className="h-2.5 w-2.5 text-green-500" />}
                    </div>
                    <span className={`text-[9px] leading-none font-bold ${bat <= 20 ? "text-red-600" : bat <= 50 ? "text-amber-500" : "text-gray-600"}`}>{bat}%</span>
                  </div>
                )}

                {/* Last seen chip */}
                {lastSeenLabel && (
                  <div className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-md bg-gray-50 border border-gray-100 min-w-[52px]">
                    <Clock className="h-4 w-4 text-orange-400" />
                    <span className="text-[9px] text-gray-500 leading-none font-medium text-center">{lastSeenLabel}</span>
                  </div>
                )}

                {/* GPS accuracy chip */}
                {acc !== null && (
                  <div className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-md bg-gray-50 border border-gray-100 min-w-[44px]">
                    <Navigation className="h-4 w-4 text-primary" />
                    <span className="text-[9px] text-gray-500 leading-none font-medium">±{acc}m</span>
                  </div>
                )}
              </div>

              {/* ── Action buttons ── */}
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { }} data-testid="button-refresh-header">
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => navigate("/employees")} data-testid="button-back-emp">
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
                </Button>
              </div>
            </div>
          );
        })()}
      </div>

      <div className="bg-card border-b px-6 overflow-x-auto">
        <div className="flex items-center gap-0 min-w-max">
          {tabs.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`tab-emp-${key}`}
            >
              {icon}
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
                  {/* 10s / 30s toggle */}
                  <div className="flex rounded border overflow-hidden shrink-0">
                    <button
                      className={`text-[9px] px-1.5 h-6 font-semibold transition-colors ${liveRefreshMs === 10000 ? "bg-primary text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                      onClick={() => { setLiveRefreshMs(10000); setLiveCountdown(10); }}
                      data-testid="button-live-refresh-10s"
                    >10s</button>
                    <button
                      className={`text-[9px] px-1.5 h-6 font-semibold border-l transition-colors ${liveRefreshMs === 30000 ? "bg-primary text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                      onClick={() => { setLiveRefreshMs(30000); setLiveCountdown(30); }}
                      data-testid="button-live-refresh-30s"
                    >30s</button>
                  </div>
                  {/* Countdown badge */}
                  <span className="text-[9px] font-bold text-green-600 w-4 text-center shrink-0 tabular-nums">{liveCountdown}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => { refetchLocations(); refetchCheckins(); setLiveCountdown(liveRefreshMs / 1000); }} data-testid="button-refresh-locations">
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-gray-600">
                  <span>Completed</span>
                  <span className="font-bold text-gray-900">{liveCheckins.length}</span>
                  <span className="text-gray-300 mx-1">|</span>
                  <span>Distance</span>
                  <span className="font-bold text-gray-900">
                    {(() => {
                      // Use backend totalKm (filtered haversine — rejects GPS jitter, tower jumps,
                      // drift < 75m, impossible speeds). snap-to-roads is ONLY for the visual route;
                      // it over-counts GPS zigzag noise on Indian cellular GPS.
                      const displayKm = Math.max(locationData?.totalKm ?? 0, enrichedTotalKm);
                      return Math.round(displayKm);
                    })()} Km
                  </span>
                  {locationLoading && <Loader2 className="h-3 w-3 animate-spin text-gray-400 ml-auto" />}
                </div>
                {liveSignalLostStats.count > 0 && (
                  <div className="flex items-center gap-1 text-[11px] mt-0.5" data-testid="text-signal-lost-summary">
                    <Signal className="h-3 w-3 text-red-500 shrink-0" />
                    <span className="text-red-600 font-semibold">Signal Lost</span>
                    <span className="font-bold text-red-700">{liveSignalLostStats.count}×</span>
                    <span className="text-gray-300 mx-0.5">|</span>
                    <span className="text-red-600">{liveSignalLostStats.totalMins} min</span>
                  </div>
                )}

                {/* ── Device status strip (battery · network · GPS) ── */}
                {(() => {
                  const pts = locationData?.points ?? [];
                  const latest = pts.length > 0 ? pts[pts.length - 1] : null;
                  const bat: number | null = latest?.batteryLevel ?? null;
                  const charging: boolean | null = latest?.isCharging ?? null;
                  const net: string | null = latest?.networkType ?? null;
                  const acc: number | null = latest?.accuracy != null ? Math.round(Number(latest.accuracy)) : null;
                  const speed: number | null = latest?.speed != null ? parseFloat(latest.speed) : null;
                  const lastSeen: string | null = latest?.recordedAt ?? null;

                  if (!latest) return null;

                  return (
                    <div className="mt-1.5 rounded-lg border border-gray-100 bg-gray-50/80 px-2 py-1.5 flex flex-wrap gap-x-3 gap-y-1">
                      {/* Battery */}
                      <div className="flex items-center gap-1 text-[10px]">
                        {charging
                          ? <BatteryCharging className="h-3 w-3 text-green-500 shrink-0" />
                          : bat !== null && bat <= 20
                            ? <BatteryLow className="h-3 w-3 text-red-500 shrink-0" />
                            : <Battery className="h-3 w-3 text-emerald-500 shrink-0" />
                        }
                        <span className={
                          bat === null ? "text-gray-400"
                          : bat <= 20 ? "text-red-600 font-semibold"
                          : bat <= 50 ? "text-yellow-600"
                          : "text-emerald-700"
                        }>
                          {bat !== null ? `${bat}%` : "–"}
                        </span>
                        {charging && <Zap className="h-2.5 w-2.5 text-green-500" />}
                      </div>

                      {/* Network */}
                      <div className="flex items-center gap-1 text-[10px]">
                        {!net || net === "none"
                          ? <Signal className="h-3 w-3 text-red-400 shrink-0" />
                          : net === "wifi"
                            ? <Wifi className="h-3 w-3 text-blue-500 shrink-0" />
                            : net === "4g" || net === "5g"
                              ? <Signal className="h-3 w-3 text-emerald-500 shrink-0" />
                              : <Radio className="h-3 w-3 text-orange-400 shrink-0" />
                        }
                        <span className="text-gray-700">
                          {!net ? "–" : net === "wifi" ? "WiFi" : net.toUpperCase()}
                        </span>
                      </div>

                      {/* GPS accuracy */}
                      <div className="flex items-center gap-1 text-[10px]">
                        <MapPin className="h-3 w-3 text-primary shrink-0" />
                        <span className="text-gray-700">
                          {acc !== null ? `±${acc}m` : "GPS"}
                          {speed !== null && speed > 0.5 ? ` · ${(speed * 3.6).toFixed(0)}km/h` : ""}
                        </span>
                      </div>

                      {/* Last seen */}
                      {lastSeen && (
                        <div className="flex items-center gap-1 text-[10px] w-full mt-0.5">
                          <Clock className="h-2.5 w-2.5 text-gray-400 shrink-0" />
                          <span className="text-gray-400">
                            {(() => {
                              const diff = Math.floor((Date.now() - new Date(lastSeen).getTime()) / 60000);
                              if (diff < 1) return "just now";
                              if (diff === 1) return "1 min ago";
                              return `${diff} min ago`;
                            })()}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Day summary bar */}
              {hasTimeline && (
                <div className="grid grid-cols-5 border-b divide-x bg-gray-50/60 text-center shrink-0">
                  <div className="py-2 px-1 flex flex-col items-center gap-0.5">
                    <span className="text-[11px] font-bold text-gray-800 leading-tight">
                      {enrichedTotalKm >= 1 ? `${Math.round(enrichedTotalKm)} km` : enrichedTotalKm > 0 ? `${(enrichedTotalKm * 1000).toFixed(0)} m` : "0 km"}
                    </span>
                    <span className="text-[9px] text-gray-400 uppercase tracking-wide leading-none">Distance</span>
                  </div>
                  <div className="py-2 px-1 flex flex-col items-center gap-0.5">
                    <span className="text-[11px] font-bold text-orange-600 leading-tight">
                      {summaryTravelSecs > 0 ? fmtSecs(summaryTravelSecs) : "—"}
                    </span>
                    <span className="text-[9px] text-gray-400 uppercase tracking-wide leading-none">Travel</span>
                  </div>
                  <div className="py-2 px-1 flex flex-col items-center gap-0.5">
                    <span className="text-[11px] font-bold text-gray-500 leading-tight">
                      {summaryStopSecs > 0 ? fmtSecs(summaryStopSecs) : "—"}
                    </span>
                    <span className="text-[9px] text-gray-400 uppercase tracking-wide leading-none">Stopped</span>
                  </div>
                  <div className="py-2 px-1 flex flex-col items-center gap-0.5">
                    <span className="text-[11px] font-bold text-blue-600 leading-tight">
                      {summaryVisits > 0 ? summaryVisits : "—"}
                    </span>
                    <span className="text-[9px] text-gray-400 uppercase tracking-wide leading-none">Visits</span>
                  </div>
                  <div className="py-2 px-1 flex flex-col items-center gap-0.5">
                    <span className={`text-[11px] font-bold leading-tight ${summarySpeedViolations > 0 ? "text-[#92610a]" : "text-gray-400"}`}>
                      {summarySpeedViolations > 0 ? summarySpeedViolations : "—"}
                    </span>
                    <span className={`text-[9px] uppercase tracking-wide leading-none ${summarySpeedViolations > 0 ? "text-[#b07d2a]" : "text-gray-400"}`}>
                      Overspeeds
                    </span>
                  </div>
                </div>
              )}

              {/* Timeline scroll area */}
              <div className="flex-1 overflow-y-auto">
                {locationLoading && !hasTimeline ? (
                  <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : !hasTimeline ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-xs gap-2 px-4 text-center">
                    <Timer className="h-10 w-10 opacity-20" />
                    <p className="font-medium">No activity recorded</p>
                    <p className="text-[10px] opacity-70">GPS pings are sent every 10 seconds</p>
                  </div>
                ) : (
                  /* ── TrackClap-style timeline: icon circles ON the vertical line ── */
                  <div className="relative">
                    {/* Continuous vertical connector line, centred on icons at left=[19px] */}
                    <div className="absolute left-[19px] top-0 bottom-0 w-[2px] bg-gray-200 z-0" />

                    {(() => { let travelIdx = 0; return enrichedTimelineEvents.map((seg, idx) => {
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
                        const gapStart = startT.getTime();
                        const gapEnd   = gapEndT.getTime();
                        const gapPts   = (locationData?.points ?? [])
                          .filter((p: any) => {
                            const t = new Date(p.recordedAt).getTime();
                            return t >= gapStart && t <= gapEnd && p.latitude && p.longitude;
                          })
                          .map((p: any) => [Number(p.latitude), Number(p.longitude)] as [number, number]);
                        let gapKm = 0;
                        for (let gi = 1; gi < gapPts.length; gi++)
                          gapKm += haversineKm(gapPts[gi-1][0], gapPts[gi-1][1], gapPts[gi][0], gapPts[gi][1]);
                        const gapLabel = gapKm >= 1 ? `${gapKm.toFixed(2)} Km` : gapKm > 0 ? `${(gapKm * 1000).toFixed(0)} m` : null;
                        const hiGap = highlightedSegment?.startTime === seg.startTime && highlightedSegment?.type === "gap_travel";
                        return (
                          <div
                            key={idx}
                            className={`relative flex items-start pl-[40px] pr-3 py-[7px] cursor-pointer transition-colors ${hiGap ? "bg-orange-50 ring-1 ring-orange-300 ring-inset rounded" : "hover:bg-orange-50/40"}`}
                            onClick={() => handleTimelineClick({ type: "gap_travel", startTime: seg.startTime, endTime: (seg as any).endTime })}
                          >
                            {dot("bg-orange-400", <Navigation className="w-2.5 h-2.5 text-white" />)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline">
                                <p className="text-[11px] font-semibold text-orange-700 leading-tight">
                                  {gapLabel ? `Travelled (${gapLabel})` : "Travelled"}
                                </p>
                                {dur(formatDuration(startT, gapEndT))}
                              </div>
                              {timeRow(startT, gapEndT)}
                            </div>
                          </div>
                        );
                      }

                      /* ── PUNCH IN ── */
                      if (seg.type === "punch_in") {
                        const hiPI = highlightedSegment?.startTime === seg.startTime && highlightedSegment?.type === "punch_in";
                        return (
                          <div
                            key={idx}
                            className={`relative flex items-start pl-[40px] pr-3 py-[7px] cursor-pointer transition-colors ${hiPI ? "bg-green-50 ring-1 ring-green-300 ring-inset rounded" : "hover:bg-green-50/50"}`}
                            onClick={() => handleTimelineClick({ type: "punch_in", startTime: seg.startTime, endTime: seg.startTime, lat: seg.lat, lng: seg.lng })}
                          >
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
                        const hiPO = highlightedSegment?.startTime === seg.startTime && highlightedSegment?.type === "punch_out";
                        return (
                          <div
                            key={idx}
                            className={`relative flex items-start pl-[40px] pr-3 py-[7px] cursor-pointer transition-colors ${hiPO ? "bg-red-50 ring-1 ring-red-300 ring-inset rounded" : "hover:bg-red-50/50"}`}
                            onClick={() => handleTimelineClick({ type: "punch_out", startTime: seg.startTime, endTime: seg.startTime, lat: seg.lat, lng: seg.lng })}
                          >
                            {dot("bg-red-600", <span className="text-[6px] font-black text-white leading-none">OUT</span>)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline">
                                <p className="text-[11px] font-bold text-red-700 leading-tight">Punch Out</p>
                                {dur(fmt(startT))}
                              </div>
                              <p className="text-[10px] font-semibold text-gray-700 leading-tight mt-0.5">
                                🛣️ Total travelled: {enrichedTotalKm >= 1 ? `${enrichedTotalKm.toFixed(1)} km` : enrichedTotalKm > 0 ? `${(enrichedTotalKm * 1000).toFixed(0)} m` : "0 km"}
                              </p>
                              <p className="text-[10px] font-semibold text-gray-700 leading-tight mt-0.5">
                                ⏱️ Total hrs travelled: {summaryTravelSecs > 0 ? fmtSecs(summaryTravelSecs) : "0m"}
                              </p>
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
                        const hiSt = highlightedSegment?.startTime === seg.startTime && highlightedSegment?.type === "stoppage";
                        return (
                          <div
                            key={idx}
                            className={`relative flex items-start pl-[40px] pr-3 py-[7px] cursor-pointer transition-colors ${hiSt ? "bg-orange-50 ring-1 ring-orange-300 ring-inset rounded" : "hover:bg-gray-50"}`}
                            onClick={() => handleTimelineClick({ type: "stoppage", startTime: seg.startTime, endTime: seg.endTime, lat: seg.lat, lng: seg.lng })}
                          >
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
                        const hiVi = highlightedSegment?.startTime === seg.startTime && highlightedSegment?.type === "visit";
                        return (
                          <div
                            key={idx}
                            className={`relative flex items-start pl-[40px] pr-3 py-[7px] cursor-pointer transition-colors ${hiVi ? "bg-blue-50 ring-1 ring-blue-300 ring-inset rounded" : "hover:bg-blue-50/40"}`}
                            onClick={() => handleTimelineClick({ type: "visit", startTime: seg.startTime, endTime: seg.endTime ?? seg.startTime, lat: seg.lat, lng: seg.lng })}
                          >
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
                      travelIdx++;
                      const distKm: number = (seg as any).distanceKm ?? 0;
                      const gapKmT: number = (seg as any).gapDistKm ?? 0;
                      const distLabel = distKm === 0 ? "0" : distKm < 1 ? distKm.toFixed(1) : distKm.toFixed(2);
                      const hiTr = highlightedSegment?.startTime === seg.startTime && highlightedSegment?.type === "travelled";
                      const tMode: string | undefined = (seg as any).transportMode;
                      const dotColor = transportModeDotColor(tMode);
                      const modeLabel = transportModeLabel(tMode);
                      return (
                        <div
                          key={idx}
                          className={`relative flex items-start pl-[40px] pr-3 py-[7px] cursor-pointer transition-colors ${hiTr ? "bg-blue-50 ring-1 ring-blue-300 ring-inset rounded" : "hover:bg-orange-50/40"}`}
                          onClick={() => handleTimelineClick({ type: "travelled", startTime: seg.startTime, endTime: (seg as any).endTime })}
                        >
                          {dot(dotColor, <TransportModeIcon mode={tMode} />)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-1">
                              <p className="text-[11px] font-semibold text-orange-700 leading-tight">{modeLabel} ({distLabel} Km)</p>
                              {dur(formatDuration(startT, endT))}
                            </div>
                            {timeRow(startT, endT)}
                            {gapKmT > 0.05 && (
                              <p className="text-[10px] text-red-500 font-medium mt-0.5 leading-tight">
                                📵 {gapKmT < 1 ? `${(gapKmT * 1000).toFixed(0)} m` : `${gapKmT.toFixed(1)} km`} estimated during signal gap (included above)
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    }); })()}

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
                    onSnappedKm={setLiveSnappedKm}
                    onOsrmSegmentDistances={setOsrmSegmentDistances}
                    onGapKm={setLiveGapKm}
                    highlightedSegment={highlightedSegment}
                    overspeedPoints={overspeedMapPoints}
                  />
                )}
              </div>
          </div>
        )}

        {activeTab === "playback" && (
          <div className="flex gap-0 rounded-xl border overflow-hidden bg-card" style={{ height: "calc(100vh - 210px)", minHeight: "600px" }}>

            {/* ── LEFT: sidebar (same style as Live tab) ── */}
            <div className="w-64 shrink-0 flex flex-col border-r bg-white" style={{ height: "100%" }}>

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
                    <span className="font-bold text-foreground">{Math.round(playbackKm)} km</span>
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
                      <p className="text-[10px] opacity-70">GPS pings are sent every 10 seconds</p>
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
                        const pbMode: string | undefined = (seg as any).transportMode;
                        const pbDistKm: number = seg.distanceKm ?? 0;
                        const pbGapKm: number = (seg as any).gapDistKm ?? 0;
                        const pbDistLabel = pbDistKm < 1 ? pbDistKm.toFixed(1) : pbDistKm.toFixed(2);
                        return (
                          <div key={idx} className="flex items-start gap-2 px-3 py-2 hover:bg-orange-50/50">
                            <div className="relative z-10 shrink-0 w-9 flex justify-center pt-0.5">
                              <div className={`w-7 h-7 rounded-full border flex items-center justify-center ${pbMode === "train" ? "bg-blue-100 border-blue-300" : pbMode === "walking" ? "bg-green-100 border-green-300" : "bg-orange-100 border-orange-300"}`}>
                                <TransportModeIcon mode={pbMode} className={`w-3.5 h-3.5 ${pbMode === "train" ? "text-blue-600" : pbMode === "walking" ? "text-green-600" : "text-orange-600"}`} />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                              <div className="flex items-baseline justify-between gap-1">
                                <p className="text-[11px] font-semibold text-orange-700">{transportModeLabel(pbMode)} ({pbDistLabel} km)</p>
                              </div>
                              <p className="text-[10px] text-gray-500 font-mono">{fmtT(seg.startTime)}–{fmtT(seg.endTime)}</p>
                              {pbGapKm > 0.05 && (
                                <p className="text-[10px] text-red-500 font-medium mt-0.5 leading-tight">
                                  📵 {pbGapKm < 1 ? `${(pbGapKm * 1000).toFixed(0)} m` : `${pbGapKm.toFixed(1)} km`} estimated during signal gap (included above)
                                </p>
                              )}
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
            <div className="flex-1 relative" style={{ height: "100%" }}>
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
                  attendanceRecords={attendanceRecords}
                  onOsrmDistance={setPlaybackOsrmKm}
                  onGapKm={setPlaybackGapKm}
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
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Claimed</TableHead>
                        <TableHead>Approved</TableHead>
                        <TableHead className="w-16">View</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allExpenses.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                            <BanknoteIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                            No expenses found for this employee
                          </TableCell>
                        </TableRow>
                      ) : (
                        allExpenses.map((exp) => (
                          <TableRow key={exp.id} data-testid={`row-expense-${exp.id}`}>
                            <TableCell className="text-primary font-medium text-sm font-mono">{exp.expenseCode}</TableCell>
                            <TableCell className="text-sm max-w-[180px] truncate">{exp.title || "-"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{exp.type || "-"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{exp.expenseCategory || exp.category || "-"}</TableCell>
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
                            <TableCell>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                data-testid={`btn-view-expense-${exp.id}`}
                                onClick={() => setSelectedExpense(exp)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
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

            {/* Expense Detail Modal */}
            <Dialog open={!!selectedExpense} onOpenChange={(open) => { if (!open) closeExpenseModal(); }}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <span className="font-mono text-primary">{selectedExpense?.expenseCode}</span>
                    <Badge
                      variant={selectedExpense?.status === "approved" ? "default" : selectedExpense?.status === "rejected" ? "destructive" : "secondary"}
                      className="text-xs capitalize ml-1"
                    >
                      {selectedExpense?.status}
                    </Badge>
                  </DialogTitle>
                </DialogHeader>

                {selectedExpense && (
                  <div className="space-y-4 text-sm">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Title</p>
                        <p className="font-medium">{selectedExpense.title || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Date</p>
                        <p className="font-medium">{selectedExpense.expenseDate ? format(new Date(selectedExpense.expenseDate), "dd MMM yyyy") : "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Type</p>
                        <p>{selectedExpense.type || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Category</p>
                        <p>{selectedExpense.expenseCategory || selectedExpense.category || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Work Location</p>
                        <p>{selectedExpense.workLocation || "-"}</p>
                      </div>
                      {selectedExpense.modeOfTravel && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">Mode of Travel</p>
                          <p>{selectedExpense.modeOfTravel}</p>
                        </div>
                      )}
                    </div>

                    {/* Travel / Odometer section */}
                    {(selectedExpense.startingOdometer || selectedExpense.endOdometer || selectedExpense.totalDistance) && (
                      <>
                        <Separator />
                        <div>
                          <p className="font-semibold text-sm mb-3 flex items-center gap-1.5"><Gauge className="h-4 w-4 text-primary" /> Odometer / Travel</p>
                          <div className="grid grid-cols-3 gap-3 mb-3">
                            <div className="bg-muted/40 rounded-lg p-3 text-center">
                              <p className="text-xs text-muted-foreground mb-0.5">Start Reading</p>
                              <p className="text-lg font-bold">{selectedExpense.startingOdometer ? Number(selectedExpense.startingOdometer).toLocaleString() : "-"}</p>
                              <p className="text-xs text-muted-foreground">km</p>
                            </div>
                            <div className="bg-muted/40 rounded-lg p-3 text-center">
                              <p className="text-xs text-muted-foreground mb-0.5">End Reading</p>
                              <p className="text-lg font-bold">{selectedExpense.endOdometer ? Number(selectedExpense.endOdometer).toLocaleString() : "-"}</p>
                              <p className="text-xs text-muted-foreground">km</p>
                            </div>
                            <div className="bg-primary/10 rounded-lg p-3 text-center">
                              <p className="text-xs text-muted-foreground mb-0.5">Distance</p>
                              <p className="text-lg font-bold text-primary">{selectedExpense.totalDistance ? Number(selectedExpense.totalDistance).toLocaleString() : "-"}</p>
                              <p className="text-xs text-muted-foreground">km</p>
                            </div>
                          </div>
                          {/* Odometer photos */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1.5">Starting Odometer Photo</p>
                              {selectedExpense.startingOdometerPhoto ? (
                                <a href={selectedExpense.startingOdometerPhoto} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={selectedExpense.startingOdometerPhoto}
                                    alt="Starting odometer"
                                    className="w-full h-36 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = "none";
                                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                                    }}
                                  />
                                  <div className="hidden w-full h-36 rounded-lg border bg-muted flex items-center justify-center">
                                    <ImageOff className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                </a>
                              ) : (
                                <div className="w-full h-36 rounded-lg border bg-muted flex items-center justify-center">
                                  <p className="text-xs text-muted-foreground">No photo</p>
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1.5">Ending Odometer Photo</p>
                              {selectedExpense.endOdometerPhoto ? (
                                <a href={selectedExpense.endOdometerPhoto} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={selectedExpense.endOdometerPhoto}
                                    alt="Ending odometer"
                                    className="w-full h-36 object-cover rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = "none";
                                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                                    }}
                                  />
                                  <div className="hidden w-full h-36 rounded-lg border bg-muted flex items-center justify-center">
                                    <ImageOff className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                </a>
                              ) : (
                                <div className="w-full h-36 rounded-lg border bg-muted flex items-center justify-center">
                                  <p className="text-xs text-muted-foreground">No photo</p>
                                </div>
                              )}
                            </div>
                          </div>
                          {(selectedExpense.amountPerKm || selectedExpense.totalTravelAmount) && (
                            <div className="mt-3 grid grid-cols-2 gap-3">
                              {selectedExpense.amountPerKm && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-0.5">Rate per km</p>
                                  <p className="font-medium">₹{Number(selectedExpense.amountPerKm).toLocaleString()}</p>
                                </div>
                              )}
                              {selectedExpense.totalTravelAmount && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-0.5">Travel Amount</p>
                                  <p className="font-medium">₹{Number(selectedExpense.totalTravelAmount).toLocaleString()}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Bills / ticket photo */}
                    {selectedExpense.billsTicketPhoto && (
                      <>
                        <Separator />
                        <div>
                          <p className="font-semibold text-sm mb-2 flex items-center gap-1.5"><FileText className="h-4 w-4 text-primary" /> Bills / Ticket</p>
                          <a href={selectedExpense.billsTicketPhoto} target="_blank" rel="noopener noreferrer">
                            <img
                              src={selectedExpense.billsTicketPhoto}
                              alt="Bill or ticket"
                              className="w-full max-h-48 object-contain rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          </a>
                        </div>
                      </>
                    )}

                    {/* Other fare breakdown */}
                    {(selectedExpense.busFare || selectedExpense.trainAirFare || selectedExpense.hotelFare ||
                      selectedExpense.daAmount || selectedExpense.conveyanceFare || selectedExpense.postageFare || selectedExpense.otherFare) && (
                      <>
                        <Separator />
                        <div>
                          <p className="font-semibold text-sm mb-2">Expense Breakdown</p>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            {selectedExpense.busFare && <div className="flex justify-between"><span className="text-muted-foreground">Bus Fare</span><span>₹{Number(selectedExpense.busFare).toLocaleString()}</span></div>}
                            {selectedExpense.trainAirFare && <div className="flex justify-between"><span className="text-muted-foreground">Train/Air</span><span>₹{Number(selectedExpense.trainAirFare).toLocaleString()}</span></div>}
                            {selectedExpense.hotelFare && <div className="flex justify-between"><span className="text-muted-foreground">Hotel</span><span>₹{Number(selectedExpense.hotelFare).toLocaleString()}</span></div>}
                            {selectedExpense.daAmount && <div className="flex justify-between"><span className="text-muted-foreground">DA ({selectedExpense.daDays} days)</span><span>₹{Number(selectedExpense.daAmount).toLocaleString()}</span></div>}
                            {selectedExpense.conveyanceFare && <div className="flex justify-between"><span className="text-muted-foreground">Conveyance</span><span>₹{Number(selectedExpense.conveyanceFare).toLocaleString()}</span></div>}
                            {selectedExpense.postageFare && <div className="flex justify-between"><span className="text-muted-foreground">Postage</span><span>₹{Number(selectedExpense.postageFare).toLocaleString()}</span></div>}
                            {selectedExpense.otherFare && <div className="flex justify-between"><span className="text-muted-foreground">Other</span><span>₹{Number(selectedExpense.otherFare).toLocaleString()}</span></div>}
                          </div>
                          {selectedExpense.otherRemarks && <p className="text-xs text-muted-foreground mt-1">{selectedExpense.otherRemarks}</p>}
                        </div>
                      </>
                    )}

                    {/* Amounts */}
                    <Separator />
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-muted/40 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-0.5">Claimed</p>
                        <p className="text-base font-bold">₹{Number(selectedExpense.amount || 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-muted/40 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-0.5">Approved</p>
                        <p className="text-base font-bold">
                          {selectedExpense.status === "approved" ? `₹${Number(selectedExpense.approvedAmount || selectedExpense.amount || 0).toLocaleString()}` : "-"}
                        </p>
                      </div>
                      <div className="bg-primary/10 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground mb-0.5">Final Amount</p>
                        <p className="text-base font-bold text-primary">
                          {selectedExpense.finalAmount ? `₹${Number(selectedExpense.finalAmount).toLocaleString()}` : "-"}
                        </p>
                      </div>
                    </div>

                    {/* Admin comment */}
                    {selectedExpense.adminComment && (
                      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                        <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-0.5">Admin Comment</p>
                        <p className="text-sm">{selectedExpense.adminComment}</p>
                      </div>
                    )}

                    {/* Description */}
                    {selectedExpense.description && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Description</p>
                        <p className="text-sm">{selectedExpense.description}</p>
                      </div>
                    )}

                    {/* Approve / Reject Actions */}
                    {selectedExpense.status === "pending" && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Admin Action</p>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              data-testid="btn-approve-expense"
                              onClick={() => { setShowApproveInput(v => !v); setShowRejectInput(false); }}
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              data-testid="btn-reject-expense"
                              onClick={() => { setShowRejectInput(v => !v); setShowApproveInput(false); }}
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                            </Button>
                          </div>

                          {showApproveInput && (
                            <div className="flex gap-2 items-center flex-wrap bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                              <Input
                                className="max-w-[180px] h-8 text-sm"
                                placeholder={`Approved amount (₹${Number(selectedExpense.amount || 0).toLocaleString()})`}
                                type="number"
                                value={approveAmount}
                                onChange={e => setApproveAmount(e.target.value)}
                                data-testid="input-approved-amount"
                              />
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                disabled={approveMutation.isPending}
                                onClick={() => approveMutation.mutate(selectedExpense.id)}
                                data-testid="btn-confirm-approve"
                              >
                                {approveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirm Approve"}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setShowApproveInput(false)}>Cancel</Button>
                            </div>
                          )}

                          {showRejectInput && (
                            <div className="flex gap-2 items-center flex-wrap bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                              <Input
                                className="max-w-xs h-8 text-sm"
                                placeholder="Rejection reason..."
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                data-testid="input-reject-reason"
                              />
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={!rejectReason.trim() || rejectMutation.isPending}
                                onClick={() => rejectMutation.mutate(selectedExpense.id)}
                                data-testid="btn-confirm-reject"
                              >
                                {rejectMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirm Reject"}
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setShowRejectInput(false)}>Cancel</Button>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Re-open approved/rejected expenses */}
                    {(selectedExpense.status === "approved" || selectedExpense.status === "rejected") && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                        {selectedExpense.status === "approved" ? "Approved" : "Rejected"}
                        {selectedExpense.statusUpdatedBy && ` by ${selectedExpense.statusUpdatedBy}`}
                        {selectedExpense.statusUpdatedOn && ` on ${format(new Date(selectedExpense.statusUpdatedOn), "dd MMM yyyy")}`}
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
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
