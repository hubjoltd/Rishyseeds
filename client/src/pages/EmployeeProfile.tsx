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
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

function LiveMap({ trips }: { trips: TripWithVisits[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(true);

  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }

    const today = new Date().toDateString();
    const todayTrips = trips.filter(t => t.startTime && new Date(t.startTime).toDateString() === today);
    const allTrips = todayTrips.length > 0 ? todayTrips : trips.slice(0, 1);

    const points: [number, number][] = [];
    allTrips.forEach(trip => {
      if (trip.startLatitude && trip.startLongitude)
        points.push([Number(trip.startLatitude), Number(trip.startLongitude)]);
      (trip.visits || []).forEach(v => {
        if (v.punchInLatitude && v.punchInLongitude) points.push([Number(v.punchInLatitude), Number(v.punchInLongitude)]);
        if (v.punchOutLatitude && v.punchOutLongitude) points.push([Number(v.punchOutLatitude), Number(v.punchOutLongitude)]);
      });
      if (trip.endLatitude && trip.endLongitude)
        points.push([Number(trip.endLatitude), Number(trip.endLongitude)]);
    });

    const defaultCenter: [number, number] = [22.8, 80.0];
    const initialCenter = points.length > 0 ? points[points.length - 1] : defaultCenter;
    const map = L.map(mapRef.current).setView(initialCenter, 13);
    mapInstanceRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap contributors" }).addTo(map);

    if (points.length > 0) {
      const pl = L.polyline(points, { color: "#f97316", weight: 4, opacity: 0.9 }).addTo(map);
      points.forEach((p, i) => {
        const isLast = i === points.length - 1;
        const icon = L.divIcon({
          className: "",
          html: `<div style="background:${isLast ? "#2563eb" : "#f97316"};width:${isLast ? 16 : 10}px;height:${isLast ? 16 : 10}px;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.4)"></div>`,
          iconSize: [isLast ? 16 : 10, isLast ? 16 : 10],
          iconAnchor: [(isLast ? 16 : 10) / 2, (isLast ? 16 : 10) / 2],
        });
        L.marker(p, { icon }).addTo(map);
      });
      if (points.length > 1) map.fitBounds(pl.getBounds().pad(0.2));
    }

    // Request admin's current location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGeoLoading(false);
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const adminIcon = L.divIcon({
            className: "",
            html: `<div style="width:20px;height:20px;background:#16a34a;border-radius:50%;border:3px solid white;box-shadow:0 0 0 5px rgba(22,163,74,0.25),0 2px 8px rgba(0,0,0,0.3)"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });
          if (mapInstanceRef.current) {
            L.marker([lat, lng], { icon: adminIcon })
              .bindPopup("<b>Your Location</b><br>Admin current position")
              .addTo(mapInstanceRef.current);
            if (points.length === 0) {
              mapInstanceRef.current.setView([lat, lng], 14);
            }
          }
        },
        (err) => {
          setGeoLoading(false);
          setGeoError(err.code === 1 ? "Location permission denied" : "Could not get location");
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setGeoLoading(false);
      setGeoError("Geolocation not supported in this browser");
    }

    setTimeout(() => map.invalidateSize(), 100);
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, [trips]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full" />
      {geoLoading && (
        <div className="absolute top-3 right-3 z-[1000] bg-white/90 dark:bg-black/70 text-xs px-3 py-1.5 rounded-full shadow flex items-center gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin text-green-600" />
          <span>Getting your location...</span>
        </div>
      )}
      {!geoLoading && geoError && (
        <div className="absolute top-3 right-3 z-[1000] bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-1.5 rounded-full shadow">
          {geoError}
        </div>
      )}
      {!geoLoading && !geoError && (
        <div className="absolute top-3 right-3 z-[1000] bg-green-50 border border-green-200 text-green-700 text-xs px-3 py-1.5 rounded-full shadow flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          Live
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

function PlaybackMap({ trips, date }: { trips: TripWithVisits[]; date: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }

    const filtered = trips.filter(t => t.startTime && format(new Date(t.startTime), "yyyy-MM-dd") === date);
    const points: [number, number][] = [];
    filtered.forEach(trip => {
      if (trip.startLatitude && trip.startLongitude)
        points.push([Number(trip.startLatitude), Number(trip.startLongitude)]);
      (trip.visits || []).forEach(v => {
        if (v.punchInLatitude && v.punchInLongitude) points.push([Number(v.punchInLatitude), Number(v.punchInLongitude)]);
        if (v.punchOutLatitude && v.punchOutLongitude) points.push([Number(v.punchOutLatitude), Number(v.punchOutLongitude)]);
      });
      if (trip.endLatitude && trip.endLongitude)
        points.push([Number(trip.endLatitude), Number(trip.endLongitude)]);
    });

    const defaultCenter: [number, number] = [22.8, 80.0];
    const center = points.length > 0 ? points[0] : defaultCenter;
    const map = L.map(mapRef.current).setView(center, 12);
    mapInstanceRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap contributors" }).addTo(map);

    if (points.length > 0) {
      const pl = L.polyline(points, { color: "#f97316", weight: 4, opacity: 0.9 }).addTo(map);
      filtered.forEach((trip, ti) => {
        const checkIns = (trip.visits || []).filter(v => v.punchInLatitude && v.punchInLongitude);
        checkIns.forEach((v, vi) => {
          const icon = L.divIcon({
            className: "",
            html: `<div style="background:#2563eb;color:white;width:22px;height:22px;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;box-shadow:0 0 4px rgba(0,0,0,0.4)">${ti * 10 + vi + 1}</div>`,
            iconSize: [22, 22], iconAnchor: [11, 11],
          });
          const inTime = fmtPopupTime(v.punchInTime as unknown as string);
          const outTime = fmtPopupTime(v.punchOutTime as unknown as string);
          const loc = v.punchInLocationName || v.punchOutLocationName || "";
          L.marker([Number(v.punchInLatitude!), Number(v.punchInLongitude!)], { icon })
            .addTo(map)
            .bindPopup(
              `<div style="min-width:160px;font-family:sans-serif;font-size:13px">` +
              `<b style="font-size:14px">Check-in ${ti * 10 + vi + 1}</b>` +
              (loc ? `<div style="color:#555;margin-top:2px;font-size:11px">${loc}</div>` : "") +
              `<table style="margin-top:6px;width:100%;border-collapse:collapse">` +
              `<tr><td style="color:#16a34a;font-weight:600;padding:2px 6px 2px 0">Punch In</td><td style="font-weight:600">${inTime}</td></tr>` +
              `<tr><td style="color:#dc2626;font-weight:600;padding:2px 6px 2px 0">Punch Out</td><td style="font-weight:600">${outTime}</td></tr>` +
              `</table></div>`
            );
        });
      });
      if (points.length > 1) map.fitBounds(pl.getBounds().pad(0.2));
    }

    setTimeout(() => map.invalidateSize(), 100);
    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, [trips, date]);

  return <div ref={mapRef} className="h-full w-full" />;
}

export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const empId = Number(id);
  const [activeTab, setActiveTab] = useState<ProfileTab>("live");
  const [playbackDate, setPlaybackDate] = useState(format(new Date(), "yyyy-MM-dd"));

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
        <Button variant="link" onClick={() => navigate("/employees")}>Back to Employees</Button>
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

  const playbackDateTrips = trips.filter(t => t.startTime && format(new Date(t.startTime), "yyyy-MM-dd") === playbackDate);
  const playbackKm = playbackDateTrips.reduce((s, t) => s + Number(t.totalKm || 0), 0);
  const playbackCheckIns = playbackDateTrips.reduce((s, t) => s + (t.visits || []).filter(v => v.punchInTime).length, 0);
  const playbackCheckOuts = playbackDateTrips.reduce((s, t) => s + (t.visits || []).filter(v => v.punchOutTime).length, 0);

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
          <div className="flex gap-4 flex-wrap md:flex-nowrap">
            <div className="w-full md:w-64 shrink-0 space-y-3">
              <div className="bg-card border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Today</span>
                  <span className="text-xs text-muted-foreground">{formatDate(new Date())}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-lg font-bold text-primary">{todayTrips.length}</p>
                    <p className="text-xs text-muted-foreground">Trips</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-lg font-bold text-primary">{todayKm.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">KM</p>
                  </div>
                </div>
              </div>

              {punchInToday && (
                <div className="bg-card border rounded-lg p-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Punch In</p>
                  <p className="text-sm font-bold text-primary">{formatTime(punchInToday)}</p>
                  {todayTrips[0]?.startLocationName && (
                    <p className="text-xs text-muted-foreground flex items-start gap-1">
                      <MapPin className="h-3 w-3 mt-0.5 shrink-0" />{todayTrips[0].startLocationName}
                    </p>
                  )}
                </div>
              )}

              {(todayCheckIns > 0 || todayCheckOuts > 0) && (
                <div className="bg-card border rounded-lg p-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Today's Activity</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Check Ins</span>
                      <span className="font-semibold">{todayCheckIns}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Check Outs</span>
                      <span className="font-semibold">{todayCheckOuts}</span>
                    </div>
                  </div>
                </div>
              )}

              {lastLocation && (
                <div className="bg-card border rounded-lg p-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Nearest Location
                  </p>
                  <p className="text-xs text-foreground leading-relaxed">{lastLocation}</p>
                </div>
              )}
            </div>

            <div className="flex-1 bg-card border rounded-lg overflow-hidden" style={{ minHeight: "500px" }}>
              {tripsLoading ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : trips.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <MapPin className="h-12 w-12 mb-3 opacity-30" />
                  <p>No location data available</p>
                </div>
              ) : (
                <LiveMap trips={trips} />
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
                <PlaybackMap trips={trips} date={playbackDate} />
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
                    <label className="text-muted-foreground">Speed Limit (Km)</label>
                    <Input type="number" defaultValue={100} className="h-7 text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-muted-foreground">Stoppage (Min)</label>
                    <Input type="number" defaultValue={30} className="h-7 text-xs" />
                  </div>
                </div>
              </div>

              <div className="bg-card border rounded-lg p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <Activity className="h-3 w-3" /> Stats
                </p>
                <div className="space-y-2">
                  {[
                    { label: "Km", value: playbackKm.toFixed(1), icon: <Route className="h-4 w-4 text-blue-500" /> },
                    { label: "Speed Violations", value: "0", icon: <Gauge className="h-4 w-4 text-red-500" /> },
                    { label: "Stoppage", value: "0", icon: <Timer className="h-4 w-4 text-amber-500" /> },
                    { label: "Check In", value: String(playbackCheckIns), icon: <LogIn className="h-4 w-4 text-green-500" /> },
                    { label: "Check Outs", value: String(playbackCheckOuts), icon: <LogOut className="h-4 w-4 text-violet-500" /> },
                  ].map(({ label, value, icon }) => (
                    <div key={label} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                      <span className="flex items-center gap-2 text-muted-foreground text-xs">{icon}{label}</span>
                      <span className="font-bold text-primary">{value}</span>
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
                {tripsLoading ? (
                  <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" /></div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Id</TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>Work Location</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Claimed</TableHead>
                        <TableHead>Approved</TableHead>
                        <TableHead>Comment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                            <BanknoteIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                            No expense found
                          </TableCell>
                        </TableRow>
                      ) : (
                        expenses.map((trip) => (
                          <TableRow key={trip.id} data-testid={`row-expense-${trip.id}`}>
                            <TableCell className="text-primary font-medium text-sm">TRP-{String(trip.id).padStart(4, "0")}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{trip.id}</TableCell>
                            <TableCell className="text-sm">{employee.fullName}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{employee.workLocation || "-"}</TableCell>
                            <TableCell className="text-xs">Travel</TableCell>
                            <TableCell>
                              <Badge variant={trip.status === "approved" ? "default" : "secondary"} className="text-xs capitalize">
                                {trip.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm font-medium">₹{Number(trip.expenseAmount).toLocaleString()}</TableCell>
                            <TableCell className="text-sm">{trip.status === "approved" ? `₹${Number(trip.expenseAmount).toLocaleString()}` : "-"}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{trip.rejectionReason || "-"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
                <div className="px-4 py-2 border-t text-xs text-muted-foreground">
                  Total {expenses.length} items
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
