import { useState, useEffect, useRef } from "react";
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
const GMAPS_KEY = (window as any).__GMAPS_KEY__ || import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;
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

function LiveMap({
  locationPoints = [],
  segments = [],
  visitStops = [],
  punchInLat,
  punchInLng,
  punchOutLat,
  punchOutLng,
}: {
  locationPoints?: any[];
  segments?: LiveMapSegment[];
  visitStops?: VisitStop[];
  punchInLat?: number | null;
  punchInLng?: number | null;
  punchOutLat?: number | null;
  punchOutLng?: number | null;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(_gmLoaded);

  useEffect(() => { if (!ready) loadGM(() => setReady(true)); }, [ready]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;

    const gpsPoints = locationPoints
      .filter(lp => lp.latitude && lp.longitude)
      .map(lp => ({ lat: Number(lp.latitude), lng: Number(lp.longitude) }));

    const allCoords = [...gpsPoints];
    visitStops.filter(v => v.lat && v.lng).forEach(v => allCoords.push({ lat: v.lat, lng: v.lng }));
    if (punchInLat && punchInLng) allCoords.push({ lat: punchInLat, lng: punchInLng });
    if (punchOutLat && punchOutLng) allCoords.push({ lat: punchOutLat, lng: punchOutLng });

    const defaultCenter = { lat: 17.4, lng: 78.5 };
    const center = allCoords.length > 0 ? allCoords[allCoords.length - 1] : defaultCenter;

    const map = new google.maps.Map(mapRef.current, {
      center,
      zoom: 14,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    const infoWindow = new google.maps.InfoWindow();

    // GPS tracking — snap to roads using Directions API
    if (gpsPoints.length > 1) {
      // Downsample: keep at most ~20 evenly-spaced points to stay within API limits
      const MAX_PTS = 20;
      const step = Math.max(1, Math.ceil(gpsPoints.length / MAX_PTS));
      const sampled: { lat: number; lng: number }[] = [];
      for (let i = 0; i < gpsPoints.length; i += step) sampled.push(gpsPoints[i]);
      // Always include the last point
      const lastPt = gpsPoints[gpsPoints.length - 1];
      if (sampled[sampled.length - 1] !== lastPt) sampled.push(lastPt);

      const ds = new google.maps.DirectionsService();
      const CHUNK = 23; // max intermediate waypoints per request

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
              new google.maps.DirectionsRenderer({
                map,
                directions: result,
                suppressMarkers: true,
                polylineOptions: { strokeColor: "#e67c22", strokeOpacity: 0.9, strokeWeight: 4 },
              });
            } else {
              // Fallback to raw polyline if Directions API fails
              new google.maps.Polyline({ path: pts, geodesic: false, strokeColor: "#e67c22", strokeOpacity: 0.9, strokeWeight: 4, map });
            }
          },
        );
      };

      // Process in chunks of CHUNK+1 points (overlap at boundaries)
      for (let i = 0; i < sampled.length - 1; i += CHUNK) {
        drawChunk(sampled.slice(i, Math.min(i + CHUNK + 1, sampled.length)));
      }
    }

    // Stoppage markers
    segments.filter(s => s.type === "stoppage" && s.lat && s.lng).forEach(s => {
      const mins = Math.floor((s.durationSecs || 0) / 60);
      const secs = Math.round((s.durationSecs || 0) % 60);
      const dur = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
      const m = new google.maps.Marker({
        position: { lat: s.lat!, lng: s.lng! },
        map,
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 7, fillColor: "#e11d48", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 },
      });
      m.addListener("click", () => {
        infoWindow.setContent(`<div style="font-size:12px"><b>Stoppage</b><br/>${dur}</div>`);
        infoWindow.open(map, m);
      });
    });

    // Customer visit markers
    visitStops.filter(v => v.lat && v.lng).forEach(v => {
      const m = new google.maps.Marker({
        position: { lat: v.lat, lng: v.lng },
        map,
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#e11d48", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2.5 },
      });
      const loc = v.locationName || "";
      m.addListener("click", () => {
        infoWindow.setContent(
          `<div style="min-width:150px;font-size:13px">` +
          `<b>${v.customerName}</b>` +
          `<div style="color:#e11d48;font-size:11px">⏱ ${v.durationStr}</div>` +
          (loc ? `<div style="color:#555;font-size:11px">${loc}</div>` : "") +
          `</div>`
        );
        infoWindow.open(map, m);
      });
    });

    // Punch-in marker (green badge)
    if (punchInLat && punchInLng) {
      const m = new google.maps.Marker({
        position: { lat: punchInLat, lng: punchInLng },
        map,
        icon: {
          url: `data:image/svg+xml;charset=utf-8,` + encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="28"><rect rx="5" width="40" height="20" fill="#15803d"/><text x="20" y="14" text-anchor="middle" fill="white" font-size="9" font-weight="bold" font-family="sans-serif">IN</text></svg>`
          ),
          scaledSize: new google.maps.Size(40, 28),
          anchor: new google.maps.Point(20, 28),
        },
      });
      m.addListener("click", () => { infoWindow.setContent("<b>Punch In</b>"); infoWindow.open(map, m); });
    }

    // Punch-out marker (red badge)
    if (punchOutLat && punchOutLng) {
      const m = new google.maps.Marker({
        position: { lat: punchOutLat, lng: punchOutLng },
        map,
        icon: {
          url: `data:image/svg+xml;charset=utf-8,` + encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="28"><rect rx="5" width="44" height="20" fill="#dc2626"/><text x="22" y="14" text-anchor="middle" fill="white" font-size="9" font-weight="bold" font-family="sans-serif">OUT</text></svg>`
          ),
          scaledSize: new google.maps.Size(44, 28),
          anchor: new google.maps.Point(22, 28),
        },
      });
      m.addListener("click", () => { infoWindow.setContent("<b>Punch Out</b>"); infoWindow.open(map, m); });
    }

    // Current location: blue person icon
    if (gpsPoints.length > 0) {
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
      m.addListener("click", () => { infoWindow.setContent("<b>Current Location</b>"); infoWindow.open(map, m); });
    }

    // Auto-fit
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

function PlaybackMap({ trips, date, employeeId }: { trips: TripWithVisits[]; date: string; employeeId: number }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(_gmLoaded);

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

  useEffect(() => { if (!ready) loadGM(() => setReady(true)); }, [ready]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;

    const filtered = trips.filter(t => t.startTime && format(new Date(t.startTime), "yyyy-MM-dd") === date);

    type LatLng = { lat: number; lng: number };
    const allPoints: LatLng[] = [];

    // Prepend punch-in / first GPS point as the journey start
    const locationPts = (locationData?.points ?? [])
      .filter(p => p.latitude && p.longitude)
      .map(p => ({ lat: Number(p.latitude), lng: Number(p.longitude) }));
    if (locationPts.length > 0) allPoints.push(locationPts[0]);

    filtered.forEach(trip => {
      if (trip.startLatitude && trip.startLongitude)
        allPoints.push({ lat: Number(trip.startLatitude), lng: Number(trip.startLongitude) });
      (trip.visits || []).forEach(v => {
        if (v.punchInLatitude && v.punchInLongitude) allPoints.push({ lat: Number(v.punchInLatitude), lng: Number(v.punchInLongitude) });
        if (v.punchOutLatitude && v.punchOutLongitude) allPoints.push({ lat: Number(v.punchOutLatitude), lng: Number(v.punchOutLongitude) });
      });
      if (trip.endLatitude && trip.endLongitude)
        allPoints.push({ lat: Number(trip.endLatitude), lng: Number(trip.endLongitude) });
    });

    const defaultCenter = { lat: 22.8, lng: 80.0 };
    const center = allPoints.length > 0 ? allPoints[0] : defaultCenter;
    const map = new google.maps.Map(mapRef.current, {
      center, zoom: 12,
      mapTypeControl: false, streetViewControl: false, fullscreenControl: true,
    });

    const infoWindow = new google.maps.InfoWindow();
    const bounds = new google.maps.LatLngBounds();
    allPoints.forEach(p => bounds.extend(p));

    if (allPoints.length > 1) {
      // Draw road route using Directions API
      const ds = new google.maps.DirectionsService();
      const CHUNK = 10;
      for (let i = 0; i < allPoints.length - 1; i += CHUNK) {
        const chunk = allPoints.slice(i, Math.min(i + CHUNK + 1, allPoints.length));
        if (chunk.length < 2) break;
        ds.route(
          {
            origin: chunk[0], destination: chunk[chunk.length - 1],
            waypoints: chunk.slice(1, -1).map(p => ({ location: new google.maps.LatLng(p.lat, p.lng), stopover: false })),
            travelMode: google.maps.TravelMode.DRIVING, optimizeWaypoints: false,
          },
          (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
              new google.maps.DirectionsRenderer({
                map, directions: result, suppressMarkers: true,
                polylineOptions: { strokeColor: "#e67c22", strokeOpacity: 0.9, strokeWeight: 4 },
              });
            }
          }
        );
      }
      map.fitBounds(bounds, 40);
    }

    // Visit check-in numbered markers
    filtered.forEach((trip, ti) => {
      (trip.visits || []).filter(v => v.punchInLatitude && v.punchInLongitude).forEach((v, vi) => {
        const num = ti * 10 + vi + 1;
        const m = new google.maps.Marker({
          position: { lat: Number(v.punchInLatitude!), lng: Number(v.punchInLongitude!) },
          map,
          icon: {
            url: `data:image/svg+xml;charset=utf-8,` + encodeURIComponent(
              `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="11" fill="#2563eb" stroke="white" stroke-width="2"/><text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold" font-family="sans-serif">${num}</text></svg>`
            ),
            scaledSize: new google.maps.Size(24, 24),
            anchor: new google.maps.Point(12, 12),
          },
        });
        const inTime = fmtPopupTime(v.punchInTime as unknown as string);
        const outTime = fmtPopupTime(v.punchOutTime as unknown as string);
        const loc = v.punchInLocationName || v.punchOutLocationName || "";
        m.addListener("click", () => {
          infoWindow.setContent(
            `<div style="min-width:160px;font-size:13px">` +
            `<b>Check-in ${num}</b>` +
            (loc ? `<div style="color:#555;font-size:11px;margin-top:2px">${loc}</div>` : "") +
            `<table style="margin-top:6px;width:100%">` +
            `<tr><td style="color:#16a34a;font-weight:600;padding-right:8px">Punch In</td><td style="font-weight:600">${inTime}</td></tr>` +
            `<tr><td style="color:#dc2626;font-weight:600;padding-right:8px">Punch Out</td><td style="font-weight:600">${outTime}</td></tr>` +
            `</table></div>`
          );
          infoWindow.open(map, m);
        });
      });
    });
  }, [ready, trips, date, locationData]);

  if (!ready) return (
    <div className="h-full w-full flex items-center justify-center bg-muted/30 rounded">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
  return <div ref={mapRef} className="h-full w-full" />;
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
          <div className="flex gap-0 rounded-xl border overflow-hidden bg-card" style={{ minHeight: "620px" }}>

            {/* ── LEFT: TrackClap-style activity panel ── */}
            <div className="w-64 shrink-0 flex flex-col border-r bg-white" style={{ minHeight: "620px" }}>

              {/* Panel header: date picker + stats */}
              <div className="px-3 py-2.5 border-b bg-gray-50 shrink-0">
                <div className="flex items-center gap-1.5 mb-2">
                  <Input
                    type="date"
                    value={liveDate}
                    onChange={(e) => setLiveDate(e.target.value)}
                    className="h-7 text-xs flex-1"
                    data-testid="input-live-date"
                  />
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { refetchLocations(); refetchCheckins(); }} data-testid="button-refresh-locations">
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="text-muted-foreground">Completed</span>
                  <span className="font-bold text-foreground">{liveCheckins.length}</span>
                  <span className="text-muted-foreground ml-auto">Distance</span>
                  <span className="font-bold text-foreground">{(locationData?.totalKm ?? 0).toFixed(2)} Km</span>
                  {locationLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-1" />}
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
                    <p className="text-[10px] opacity-70">GPS pings are sent every 60 seconds</p>
                  </div>
                ) : (
                  <div className="relative py-2">
                    {/* vertical connector line */}
                    <div className="absolute left-[27px] top-2 bottom-2 w-px bg-gray-200" />

                    {allTimelineEvents.map((seg, idx) => {
                      const startT = new Date(seg.startTime);
                      const fmtTime = (d: Date) => d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
                      const fmtTimeShort = (d: Date) => d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });

                      /* ── GAP TRAVEL ── */
                      if (seg.type === "gap_travel") {
                        const gapEndT = new Date((seg as any).endTime);
                        const gapDur = formatDuration(startT, gapEndT);
                        return (
                          <div key={idx} className="flex items-start gap-2 px-3 py-2 hover:bg-orange-50/50 transition-colors">
                            <div className="relative z-10 shrink-0 w-9 flex justify-center pt-0.5">
                              <div className="w-7 h-7 rounded-full bg-orange-100 border border-orange-300 flex items-center justify-center">
                                <Navigation className="w-3.5 h-3.5 text-orange-600" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                              <div className="flex items-baseline justify-between gap-1">
                                <p className="text-[11px] font-semibold text-orange-700">Travelled</p>
                                <span className="text-[10px] text-muted-foreground shrink-0">({gapDur})</span>
                              </div>
                              <p className="text-[10px] text-gray-500 font-mono">{fmtTimeShort(startT)}–{fmtTimeShort(gapEndT)}</p>
                            </div>
                          </div>
                        );
                      }

                      /* ── PUNCH IN ── */
                      if (seg.type === "punch_in") {
                        return (
                          <div key={idx} className="flex items-start gap-2 px-3 py-2 hover:bg-green-50/50 transition-colors">
                            <div className="relative z-10 shrink-0 w-9 flex justify-center pt-0.5">
                              <div className="w-7 h-7 rounded-full bg-green-600 border-2 border-white shadow flex items-center justify-center">
                                <span className="text-[8px] font-black text-white leading-none">IN</span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                              <div className="flex items-baseline justify-between gap-1">
                                <p className="text-[11px] font-bold text-green-700">Punch In</p>
                                <span className="text-[10px] text-gray-500 font-mono shrink-0">{fmtTime(startT)}</span>
                              </div>
                              {seg.location
                                ? <p className="text-[10px] text-gray-500 leading-relaxed mt-0.5 line-clamp-2">{seg.location}</p>
                                : (seg.lat && seg.lng ? <StoppageAddress lat={seg.lat} lng={seg.lng} /> : null)
                              }
                            </div>
                          </div>
                        );
                      }

                      /* ── PUNCH OUT ── */
                      if (seg.type === "punch_out") {
                        return (
                          <div key={idx} className="flex items-start gap-2 px-3 py-2 hover:bg-red-50/50 transition-colors">
                            <div className="relative z-10 shrink-0 w-9 flex justify-center pt-0.5">
                              <div className="w-7 h-7 rounded-full bg-red-600 border-2 border-white shadow flex items-center justify-center">
                                <span className="text-[7px] font-black text-white leading-none">OUT</span>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                              <div className="flex items-baseline justify-between gap-1">
                                <p className="text-[11px] font-bold text-red-700">Punch Out</p>
                                <span className="text-[10px] text-gray-500 font-mono shrink-0">{fmtTime(startT)}</span>
                              </div>
                              {seg.location
                                ? <p className="text-[10px] text-gray-500 leading-relaxed mt-0.5 line-clamp-2">{seg.location}</p>
                                : (seg.lat && seg.lng ? <StoppageAddress lat={seg.lat} lng={seg.lng} /> : null)
                              }
                            </div>
                          </div>
                        );
                      }

                      /* ── STOPPAGE ── */
                      if (seg.type === "stoppage") {
                        const mins = Math.floor(seg.durationSecs / 60);
                        const secs = Math.round(seg.durationSecs % 60);
                        const durStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
                        return (
                          <div key={idx} className="flex items-start gap-2 px-3 py-2 hover:bg-gray-50 transition-colors">
                            <div className="relative z-10 shrink-0 w-9 flex justify-center pt-0.5">
                              <div className="w-7 h-7 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center">
                                <Timer className="w-3.5 h-3.5 text-gray-500" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                              <div className="flex items-baseline justify-between gap-1">
                                <p className="text-[11px] font-semibold text-gray-700">Stoppage of {durStr}</p>
                              </div>
                              <p className="text-[10px] text-gray-500 font-mono">{fmtTimeShort(new Date(seg.startTime))}–{fmtTimeShort(new Date(seg.endTime))}</p>
                              <StoppageAddress lat={seg.lat} lng={seg.lng} />
                            </div>
                          </div>
                        );
                      }

                      /* ── VISIT / CHECK-IN (CHK) ── */
                      if (seg.type === "visit") {
                        const outT = seg.endTime ? new Date(seg.endTime) : null;
                        const durStr = outT ? formatDuration(startT, outT) : "ongoing";
                        const durSecs = outT ? Math.round((outT.getTime() - startT.getTime()) / 1000) : null;
                        const durShort = durSecs !== null
                          ? (durSecs < 60 ? `${durSecs} Seconds` : `${Math.floor(durSecs / 60)}m ${durSecs % 60}s`)
                          : "ongoing";
                        return (
                          <div key={idx} className="flex items-start gap-2 px-3 py-2 hover:bg-blue-50/50 transition-colors">
                            <div className="relative z-10 shrink-0 w-9 flex justify-center pt-0.5">
                              <div className="w-7 h-7 rounded-full bg-blue-600 border-2 border-white shadow flex items-center justify-center">
                                <MapPin className="w-3.5 h-3.5 text-white" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                              <div className="flex items-baseline justify-between gap-1">
                                <p className="text-[11px] font-bold text-blue-700">Stoppage {seg.checkinId}</p>
                                <span className="text-[10px] text-muted-foreground shrink-0">({durShort})</span>
                              </div>
                              <p className="text-[10px] text-gray-500 font-mono">
                                {fmtTime(startT)}{outT ? `–${fmtTime(outT)}` : ""}
                              </p>
                              {seg.locationName
                                ? <p className="text-[10px] text-blue-600 font-medium mt-0.5 line-clamp-1">{seg.locationName}</p>
                                : (seg.lat && seg.lng ? <StoppageAddress lat={seg.lat} lng={seg.lng} /> : null)
                              }
                              <p className="text-[10px] text-gray-600 font-medium">{seg.customerName}</p>
                            </div>
                          </div>
                        );
                      }

                      /* ── TRAVELLED (from segments) ── */
                      const endT = new Date((seg as any).endTime);
                      const distKm = (seg as any).distanceKm ?? 0;
                      const durTravelled = formatDuration(startT, endT);
                      return (
                        <div key={idx} className="flex items-start gap-2 px-3 py-2 hover:bg-orange-50/50 transition-colors">
                          <div className="relative z-10 shrink-0 w-9 flex justify-center pt-0.5">
                            <div className="w-7 h-7 rounded-full bg-orange-100 border border-orange-300 flex items-center justify-center">
                              <Navigation className="w-3.5 h-3.5 text-orange-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-baseline justify-between gap-1">
                              <p className="text-[11px] font-semibold text-orange-700">Travelled ({distKm.toFixed(2)} km)</p>
                              <span className="text-[10px] text-muted-foreground shrink-0">({durTravelled})</span>
                            </div>
                            <p className="text-[10px] text-gray-500 font-mono">{fmtTimeShort(startT)}–{fmtTimeShort(endT)}</p>
                          </div>
                        </div>
                      );
                    })}

                    {/* ── Nearest Location ── */}
                    {(locationData?.points?.length ?? 0) > 0 && (() => {
                      const lastPt = locationData!.points[locationData!.points.length - 1];
                      return (
                        <div className="flex items-start gap-2 px-3 py-2 mt-1 border-t bg-green-50/40">
                          <div className="relative z-10 shrink-0 w-9 flex justify-center pt-0.5">
                            <div className="w-7 h-7 rounded-full bg-green-100 border border-green-300 flex items-center justify-center">
                              <MapPin className="w-3.5 h-3.5 text-green-700" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <p className="text-[11px] font-bold text-green-700 mb-0.5">Nearest Location</p>
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
            <div className="flex-1 relative" style={{ minHeight: "620px" }}>
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
                  />
                )}
              </div>
          </div>
        )}

        {activeTab === "playback" && (
          <div className="flex gap-4 flex-wrap md:flex-nowrap">
            <div className="flex-1 bg-card border rounded-lg overflow-hidden" style={{ minHeight: "500px" }}>
              {tripsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <PlaybackMap trips={trips} date={playbackDate} employeeId={empId} />
              )}
            </div>

            <div className="w-full md:w-64 shrink-0 space-y-3">
              <div className="bg-card border rounded-lg p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Start-End Date</p>
                <Input
                  type="date"
                  value={playbackDate}
                  onChange={(e) => setPlaybackDate(e.target.value)}
                  className="h-8 text-sm"
                  data-testid="input-playback-date"
                />
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="space-y-1">
                    <label className="text-muted-foreground">Speed Limit (Km/h)</label>
                    <Input type="number" value={speedLimitKm} onChange={e => setSpeedLimitKm(Number(e.target.value))} className="h-7 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-muted-foreground">Stoppage (Min)</label>
                    <Input type="number" value={stoppageMinutes} onChange={e => setStoppageMinutes(Number(e.target.value))} className="h-7 text-xs" />
                  </div>
                </div>
              </div>

              <div className="bg-card border rounded-lg p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Activity className="h-3 w-3" /> Stats
                </p>
                <div className="space-y-2">
                  {[
                    { label: "Km", value: playbackKm.toFixed(2), icon: <Route className="h-4 w-4 text-blue-500" /> },
                    { label: "Speed Violations", value: String(speedViolations), icon: <Gauge className="h-4 w-4 text-red-500" />, highlight: speedViolations > 0 },
                    { label: "Stoppage", value: String(playbackStoppages), icon: <Timer className="h-4 w-4 text-amber-500" /> },
                    { label: "Check In", value: String(playbackCheckIns), icon: <LogIn className="h-4 w-4 text-green-500" /> },
                    { label: "Check Outs", value: String(playbackCheckOuts), icon: <LogOut className="h-4 w-4 text-violet-500" /> },
                  ].map(({ label, value, icon, highlight }) => (
                    <div key={label} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                      <span className="flex items-center gap-2 text-muted-foreground text-xs">{icon}{label}</span>
                      <span className={`font-bold ${highlight ? "text-red-600" : "text-primary"}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Check-in details cards */}
              {playbackDateTrips.flatMap((trip, ti) =>
                (trip.visits || []).map((v, vi) => ({ v, idx: ti * 10 + vi + 1 }))
              ).length > 0 && (
                <div className="bg-card border rounded-lg p-4 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Check-ins
                  </p>
                  <div className="space-y-2">
                    {playbackDateTrips.flatMap((trip, ti) =>
                      (trip.visits || []).map((v, vi) => ({ v, idx: ti * 10 + vi + 1 }))
                    ).map(({ v, idx }) => (
                      <div key={idx} className="rounded-md border bg-muted/30 p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">{idx}</div>
                          <span className="text-xs font-semibold text-foreground">Check-in {idx}</span>
                        </div>
                        {(v.punchInLocationName || v.punchOutLocationName) && (
                          <p className="text-[11px] text-muted-foreground leading-tight pl-7">
                            {v.punchInLocationName || v.punchOutLocationName}
                          </p>
                        )}
                        <div className="grid grid-cols-2 gap-1 pl-7">
                          <div className="space-y-0.5">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Punch In</p>
                            <p className="text-xs font-bold text-green-600">{fmtPopupTime(v.punchInTime as unknown as string)}</p>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Punch Out</p>
                            <p className="text-xs font-bold text-red-500">{fmtPopupTime(v.punchOutTime as unknown as string)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
