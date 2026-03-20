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
const GMAPS_KEY = "AIzaSyBrXqf4qkgKxH6eIqCv0QnxPx7X-59qPQ8";
let _gmLoaded = typeof (window as any).google !== "undefined";
let _gmLoading = false;
const _gmCbs: Array<() => void> = [];
function loadGM(cb: () => void) {
  if (_gmLoaded) { cb(); return; }
  _gmCbs.push(cb);
  if (_gmLoading) return;
  _gmLoading = true;
  const s = document.createElement("script");
  s.src = `https://maps.googleapis.com/maps/api/js?key=${GMAPS_KEY}`;
  s.async = true;
  s.onload = () => { _gmLoaded = true; _gmLoading = false; _gmCbs.forEach(f => f()); _gmCbs.length = 0; };
  document.head.appendChild(s);
}

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
  { id: "roadmap",        label: "Google Streets" },
  { id: "openstreetmap",  label: "OpenStreetMap"  },
  { id: "terrain",        label: "Google Terrain" },
  { id: "hybrid",         label: "Google Hybrid"  },
];

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
  const mapRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(_gmLoaded);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const overlaysRef = useRef<any[]>([]);
  const lastKeyRef = useRef<string>("");

  useEffect(() => { if (!ready) loadGM(() => setReady(true)); }, [ready]);

  // Initialize map instance ONCE when Google Maps is ready
  useEffect(() => {
    if (!ready || !mapRef.current || mapInstanceRef.current) return;
    const map = new google.maps.Map(mapRef.current, {
      center: { lat: 17.4, lng: 78.5 },
      zoom: 14,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });
    // Register OpenStreetMap as a custom tile layer
    const osmType = new google.maps.ImageMapType({
      getTileUrl: (coord: google.maps.Point, zoom: number) =>
        `https://tile.openstreetmap.org/${zoom}/${coord.x}/${coord.y}.png`,
      tileSize: new google.maps.Size(256, 256),
      name: "OpenStreetMap",
      maxZoom: 19,
    });
    map.mapTypes.set("openstreetmap", osmType);
    mapInstanceRef.current = map;
    infoWindowRef.current = new google.maps.InfoWindow();
  }, [ready]);

  // Switch map type whenever the selector changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setMapTypeId(mapTypeId as google.maps.MapTypeId);
  }, [mapTypeId]);

  // Redraw overlays only when data actually changes (prevents 30-second flicker from polling)
  useEffect(() => {
    if (!ready || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const infoWindow = infoWindowRef.current!;

    const lastPt = locationPoints.length > 0 ? locationPoints[locationPoints.length - 1] : null;
    const lastPtKey = lastPt ? `${lastPt.id ?? locationPoints.length}_${lastPt.recordedAt}` : "none";
    const newKey = `${lastPtKey}|${locationPoints.length}|${punchInLat}|${punchInLng}|${punchOutLat}|${punchOutLng}|${segments.length}|${visitStops.length}`;
    if (newKey === lastKeyRef.current) return;
    lastKeyRef.current = newKey;

    // Clear previous overlays
    overlaysRef.current.forEach(o => { try { if (o.setMap) o.setMap(null); } catch { /* ignore */ } });
    overlaysRef.current = [];

    const gpsPoints = locationPoints
      .filter(lp => lp.latitude && lp.longitude)
      .map(lp => ({ lat: Number(lp.latitude), lng: Number(lp.longitude) }));

    const allCoords = [...gpsPoints];
    visitStops.filter(v => v.lat && v.lng).forEach(v => allCoords.push({ lat: v.lat, lng: v.lng }));
    if (punchInLat && punchInLng) allCoords.push({ lat: punchInLat, lng: punchInLng });
    if (punchOutLat && punchOutLng) allCoords.push({ lat: punchOutLat, lng: punchOutLng });

    // Center on latest known position
    if (allCoords.length > 0) {
      map.setCenter(allCoords[allCoords.length - 1]);
    }

    // GPS tracking — check spread first; skip Directions API if all points are within 300m (stationary)
    if (gpsPoints.length > 1) {
      const anchor = gpsPoints[0];
      const maxSpreadM = gpsPoints.reduce((mx, p) => Math.max(mx, haversineM(anchor.lat, anchor.lng, p.lat, p.lng)), 0);

      // Draw blue GPS route polyline for travelled segments (TrackClap style)
      const drawPolyline = (pts: { lat: number; lng: number }[]) => {
        if (pts.length < 2) return;
        const pl = new google.maps.Polyline({ path: pts, geodesic: true, strokeColor: "#2563eb", strokeOpacity: 0.9, strokeWeight: 4, map });
        overlaysRef.current.push(pl);
      };

      if (maxSpreadM < 80) {
        // Stationary — draw raw GPS track (zoom in to see micro-movement)
        drawPolyline(gpsPoints);
      } else if (maxSpreadM < 350) {
        // Short movement — raw GPS polyline, no road-snapping needed
        drawPolyline(gpsPoints);
      } else {
        // Significant travel — snap to roads via Directions API
        const MAX_PTS = 23;
        const step = Math.max(1, Math.ceil(gpsPoints.length / MAX_PTS));
        const sampled: { lat: number; lng: number }[] = [];
        for (let i = 0; i < gpsPoints.length; i += step) sampled.push(gpsPoints[i]);
        const lastGpsPt = gpsPoints[gpsPoints.length - 1];
        if (sampled[sampled.length - 1] !== lastGpsPt) sampled.push(lastGpsPt);

        const ds = new google.maps.DirectionsService();
        const CHUNK = 23;

        const drawChunk = (pts: { lat: number; lng: number }[]) => {
          if (pts.length < 2) return;
          const origin = pts[0];
          const destination = pts[pts.length - 1];
          const waypoints = pts.slice(1, -1).map(p => ({
            location: new google.maps.LatLng(p.lat, p.lng),
            stopover: false as const,
          }));
          ds.route(
            { origin, destination, waypoints, travelMode: google.maps.TravelMode.DRIVING, optimizeWaypoints: false },
            (result, status) => {
              if (status === "OK" && result) {
                const dr = new google.maps.DirectionsRenderer({
                  map, directions: result, suppressMarkers: true,
                  polylineOptions: { strokeColor: "#2563eb", strokeOpacity: 0.9, strokeWeight: 4 },
                });
                overlaysRef.current.push(dr);
              } else {
                drawPolyline(pts);
              }
            },
          );
        };

        for (let i = 0; i < sampled.length - 1; i += CHUNK) {
          drawChunk(sampled.slice(i, Math.min(i + CHUNK + 1, sampled.length)));
        }
      }
    }

    // Stoppage markers — orange circle pins (TrackClap style)
    segments.filter(s => s.type === "stoppage" && s.lat && s.lng).forEach(s => {
      const mins = Math.floor((s.durationSecs || 0) / 60);
      const secs = Math.round((s.durationSecs || 0) % 60);
      const dur = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
        <ellipse cx="18" cy="41" rx="6" ry="3" fill="rgba(0,0,0,0.18)"/>
        <path d="M18 0C10.27 0 4 6.27 4 14c0 10.5 14 28 14 28S32 24.5 32 14C32 6.27 25.73 0 18 0z" fill="#f97316" stroke="white" stroke-width="2"/>
        <circle cx="18" cy="14" r="7" fill="white"/>
        <text x="18" y="18" text-anchor="middle" fill="#f97316" font-size="9" font-weight="bold" font-family="sans-serif">S</text>
      </svg>`;
      const m = new google.maps.Marker({
        position: { lat: s.lat!, lng: s.lng! },
        map,
        zIndex: 50,
        icon: {
          url: `data:image/svg+xml;charset=utf-8,` + encodeURIComponent(svg),
          scaledSize: new google.maps.Size(36, 44),
          anchor: new google.maps.Point(18, 44),
        },
      });
      m.addListener("click", () => {
        infoWindow.setContent(
          `<div style="font-size:13px;min-width:130px">` +
          `<b style="color:#f97316">⏸ Stoppage</b><br/>` +
          `<span style="font-size:12px;font-weight:bold">${dur}</span><br/>` +
          `<span style="font-size:11px;color:#666">${new Date(s.startTime).toLocaleTimeString()} – ${new Date(s.endTime).toLocaleTimeString()}</span>` +
          `</div>`
        );
        infoWindow.open(map, m);
      });
      overlaysRef.current.push(m);
    });

    // CHK — customer visit markers (green pin with "CHK" label)
    visitStops.filter(v => v.lat && v.lng).forEach(v => {
      const chkSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="42" viewBox="0 0 34 42">
        <ellipse cx="17" cy="39" rx="5" ry="3" fill="rgba(0,0,0,0.18)"/>
        <path d="M17 0C9.82 0 4 5.82 4 13c0 9.9 13 27 13 27S30 22.9 30 13C30 5.82 24.18 0 17 0z" fill="#16a34a" stroke="white" stroke-width="2"/>
        <circle cx="17" cy="13" r="7" fill="white"/>
        <text x="17" y="10" text-anchor="middle" fill="#16a34a" font-size="5.5" font-weight="bold" font-family="sans-serif">CHK</text>
        <text x="17" y="18" text-anchor="middle" fill="#16a34a" font-size="5" font-family="sans-serif">✓</text>
      </svg>`;
      const m = new google.maps.Marker({
        position: { lat: v.lat, lng: v.lng },
        map,
        zIndex: 80,
        icon: {
          url: `data:image/svg+xml;charset=utf-8,` + encodeURIComponent(chkSvg),
          scaledSize: new google.maps.Size(34, 42),
          anchor: new google.maps.Point(17, 42),
        },
      });
      const loc = v.locationName || "";
      m.addListener("click", () => {
        infoWindow.setContent(
          `<div style="min-width:150px;font-size:13px">` +
          `<b style="color:#16a34a">✓ CHK — ${v.customerName}</b>` +
          `<div style="color:#555;font-size:11px;margin-top:2px">⏱ ${v.durationStr}</div>` +
          (loc ? `<div style="color:#555;font-size:11px">${loc}</div>` : "") +
          `</div>`
        );
        infoWindow.open(map, m);
      });
      overlaysRef.current.push(m);
    });

    // ── START marker: prefer punch-in coords, fallback to first GPS point ──
    const startPos = (punchInLat && punchInLng)
      ? { lat: punchInLat, lng: punchInLng }
      : (gpsPoints.length > 0 ? gpsPoints[0] : null);
    if (startPos) {
      const startSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="52" viewBox="0 0 36 52">
        <ellipse cx="18" cy="49" rx="6" ry="3" fill="rgba(0,0,0,0.2)"/>
        <path d="M18 0C10.27 0 4 6.27 4 14c0 10.5 14 36 14 36S32 24.5 32 14C32 6.27 25.73 0 18 0z" fill="#15803d" stroke="white" stroke-width="2"/>
        <circle cx="18" cy="14" r="9" fill="white"/>
        <text x="18" y="18" text-anchor="middle" fill="#15803d" font-size="8" font-weight="bold" font-family="sans-serif">START</text>
      </svg>`;
      const m = new google.maps.Marker({
        position: startPos,
        map,
        zIndex: 200,
        icon: {
          url: `data:image/svg+xml;charset=utf-8,` + encodeURIComponent(startSvg),
          scaledSize: new google.maps.Size(36, 52),
          anchor: new google.maps.Point(18, 52),
        },
      });
      m.addListener("click", () => { infoWindow.setContent(`<div style="font-size:13px"><b style="color:#15803d">▶ Trip Start</b>${punchInLat ? "<br/><span style='font-size:11px;color:#555'>Punch In location</span>" : ""}</div>`); infoWindow.open(map, m); });
      overlaysRef.current.push(m);
    }

    // ── END marker: prefer punch-out coords, fallback to last GPS point ──
    const endPos = (punchOutLat && punchOutLng)
      ? { lat: punchOutLat, lng: punchOutLng }
      : (gpsPoints.length > 1 ? gpsPoints[gpsPoints.length - 1] : null);
    if (endPos) {
      const endSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="52" viewBox="0 0 36 52">
        <ellipse cx="18" cy="49" rx="6" ry="3" fill="rgba(0,0,0,0.2)"/>
        <path d="M18 0C10.27 0 4 6.27 4 14c0 10.5 14 36 14 36S32 24.5 32 14C32 6.27 25.73 0 18 0z" fill="#dc2626" stroke="white" stroke-width="2"/>
        <circle cx="18" cy="14" r="9" fill="white"/>
        <text x="18" y="18" text-anchor="middle" fill="#dc2626" font-size="8" font-weight="bold" font-family="sans-serif">END</text>
      </svg>`;
      const m = new google.maps.Marker({
        position: endPos,
        map,
        zIndex: 200,
        icon: {
          url: `data:image/svg+xml;charset=utf-8,` + encodeURIComponent(endSvg),
          scaledSize: new google.maps.Size(36, 52),
          anchor: new google.maps.Point(18, 52),
        },
      });
      m.addListener("click", () => { infoWindow.setContent(`<div style="font-size:13px"><b style="color:#dc2626">⬛ Trip End</b>${punchOutLat ? "<br/><span style='font-size:11px;color:#555'>Punch Out location</span>" : "<br/><span style='font-size:11px;color:#555'>Last recorded location</span>"}</div>`); infoWindow.open(map, m); });
      overlaysRef.current.push(m);
    }

    // ── Current live position: blue person icon (only if trip is ongoing = no punch-out yet) ──
    if (!punchOutLat && gpsPoints.length > 0) {
      const last = gpsPoints[gpsPoints.length - 1];
      const m = new google.maps.Marker({
        position: last,
        map,
        zIndex: 1000,
        icon: {
          url: `data:image/svg+xml;charset=utf-8,` + encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 38 38">` +
            `<circle cx="19" cy="19" r="18" fill="#1d4ed8" stroke="white" stroke-width="3"/>` +
            `<path d="M19 10c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm0 10c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="white"/>` +
            `</svg>`
          ),
          scaledSize: new google.maps.Size(38, 38),
          anchor: new google.maps.Point(19, 19),
        },
      });
      m.addListener("click", () => { infoWindow.setContent("<div style='font-size:13px'><b>📍 Current Location</b><br/><span style='font-size:11px;color:#555'>Live tracking</span></div>"); infoWindow.open(map, m); });
      overlaysRef.current.push(m);
    }

    // Auto-fit bounds
    if (allCoords.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      allCoords.forEach(c => bounds.extend(c));
      map.fitBounds(bounds, 40);
    }
  }, [ready, locationPoints, segments, visitStops, punchInLat, punchInLng, punchOutLat, punchOutLng]);

  if (!ready) return (
    <div className="relative h-full w-full flex items-center justify-center bg-muted/30 rounded">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full" />

      {/* Map type selector — top-right overlay exactly like TrackClap */}
      <div className="absolute top-2 right-2 z-10 bg-white rounded shadow-md py-1.5 px-2.5 text-[11px] select-none">
        {MAP_TYPES.map(opt => (
          <label key={opt.id} className="flex items-center gap-1.5 cursor-pointer py-[2px]">
            <input
              type="radio"
              name="liveMapType"
              value={opt.id}
              checked={mapTypeId === opt.id}
              onChange={() => onMapTypeChange(opt.id)}
              className="accent-blue-600 w-3 h-3"
            />
            <span className="text-gray-700 leading-none">{opt.label}</span>
          </label>
        ))}
      </div>

      {/* Legend — bottom-left */}
      <div className="absolute bottom-6 left-2 z-10 bg-white/90 rounded shadow text-[10px] px-2 py-1.5 flex flex-col gap-1">
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

// ── Leaflet tile sources (matching TrackClap reference) ──
const LEAFLET_TILES: Record<string, { url: string; subdomains?: string[]; attr: string }> = {
  roadmap:       { url: "https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",   subdomains: ["0","1","2","3"], attr: "© Google" },
  openstreetmap: { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",        subdomains: ["a","b","c"],    attr: "© OpenStreetMap contributors" },
  terrain:       { url: "https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",   subdomains: ["0","1","2","3"], attr: "© Google" },
  hybrid:        { url: "https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",   subdomains: ["0","1","2","3"], attr: "© Google" },
};

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

// Inner layer content — must be inside MapContainer so hooks work
function PlaybackMapInner({
  routePoints,
  chkStops,
  mapTypeId,
}: {
  routePoints: [number, number][];
  chkStops: { pos: [number, number]; num: number; inTime: string; outTime: string; loc: string }[];
  mapTypeId: string;
}) {
  const tile = LEAFLET_TILES[mapTypeId] ?? LEAFLET_TILES.roadmap;

  const startIcon = L.divIcon({
    html: `<div style="width:34px;height:34px;border-radius:50%;background:#e11d48;border:3px solid white;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;color:white;box-shadow:0 2px 6px rgba(0,0,0,0.35)">B</div>`,
    className: "",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

  return (
    <>
      <TileLayer key={mapTypeId} url={tile.url} subdomains={tile.subdomains} attribution={tile.attr} maxZoom={20} />
      <ZoomControl position="topright" />
      <PbBoundsFitter points={routePoints} />
      {routePoints.length > 1 && (
        <Polyline positions={routePoints} pathOptions={{ color: "#f97316", weight: 4, opacity: 0.9 }} />
      )}
      {routePoints.length > 0 && (
        <Marker position={routePoints[0]} icon={startIcon}>
          <Popup><b>Trip Start</b></Popup>
        </Marker>
      )}
      {chkStops.map(stop => {
        const chkIcon = L.divIcon({
          html: `<div style="width:30px;height:30px;border-radius:50%;background:#2563eb;border:2.5px solid white;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:13px;color:white;box-shadow:0 2px 5px rgba(0,0,0,0.3)">${stop.num}</div>`,
          className: "",
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });
        return (
          <Marker key={stop.num} position={stop.pos} icon={chkIcon}>
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

  const { data: locationData } = useQuery<{ points: { latitude: string; longitude: string; recordedAt: string }[] }>({
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

  // Build route points from GPS track, fallback to trip waypoints
  const routePoints: [number, number][] = useMemo(() => {
    const gpsPts = (locationData?.points ?? [])
      .filter(p => p.latitude && p.longitude)
      .map(p => [Number(p.latitude), Number(p.longitude)] as [number, number]);
    if (gpsPts.length > 0) return gpsPts;
    const waypoints: [number, number][] = [];
    filtered.forEach(trip => {
      if (trip.startLatitude && trip.startLongitude) waypoints.push([Number(trip.startLatitude), Number(trip.startLongitude)]);
      (trip.visits || []).forEach(v => {
        if (v.punchInLatitude && v.punchInLongitude) waypoints.push([Number(v.punchInLatitude), Number(v.punchInLongitude)]);
      });
      if (trip.endLatitude && trip.endLongitude) waypoints.push([Number(trip.endLatitude), Number(trip.endLongitude)]);
    });
    return waypoints;
  }, [locationData, filtered]);

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

  const defaultCenter: [number, number] = routePoints.length > 0 ? routePoints[0] : [22.8, 80.0];

  return (
    <div className="relative h-full w-full">
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
          onMapTypeChange={onMapTypeChange}
        />
      </MapContainer>

      {/* Layers / map-type icon — sits above the Leaflet zoom control */}
      <div className="absolute z-[1001] select-none" style={{ top: 10, right: 10 }}>
        {/* Layers button */}
        <button
          onClick={() => setLayerOpen(o => !o)}
          title="Map type"
          className="w-[34px] h-[34px] bg-white rounded shadow-md flex items-center justify-center mb-[2px] hover:bg-gray-50 border border-gray-300"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2"/>
            <polyline points="2 12 12 17 22 12"/>
            <polyline points="2 17 12 22 22 17"/>
          </svg>
        </button>

        {/* Dropdown panel */}
        {layerOpen && (
          <div className="absolute right-0 top-[38px] bg-white rounded shadow-lg border border-gray-200 py-1 w-[150px] text-[12px] z-[1002]">
            {MAP_TYPES.map(opt => (
              <button
                key={opt.id}
                onClick={() => { onMapTypeChange(opt.id); setLayerOpen(false); }}
                className={`w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 ${mapTypeId === opt.id ? "font-semibold text-blue-600" : "text-gray-700"}`}
              >
                {mapTypeId === opt.id && <span className="text-blue-600">✓</span>}
                {mapTypeId !== opt.id && <span className="w-3"/>}
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-8 left-2 z-[1000] bg-white/90 rounded shadow text-[10px] px-2 py-1.5 flex flex-col gap-1">
        <div className="flex items-center gap-1.5"><span className="inline-block w-6 h-[3px] rounded bg-orange-500"/><span>Route</span></div>
        <div className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-red-600"/><span>Start (B)</span></div>
        <div className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-full bg-blue-600"/><span>CHK Visit</span></div>
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
  const [sharedMapTypeId, setSharedMapTypeId] = useState("roadmap");

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
