import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PaginationBar } from "@/components/PaginationBar";
import type { Trip, TripVisit, TripComment, TripAudit } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Navigation,
  Car,
  Timer,
  ArrowLeft,
  History,
  MessageSquare,
  Send,
  User,
  Gauge,
  Route,
  ChevronDown,
  Circle,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

interface TripWithEmployee extends Trip {
  employeeName: string;
  employeeCode: string;
  visitCount: number;
}

interface TripDetail extends TripWithEmployee {
  visits: TripVisit[];
}

function formatDateTime(dt: string | Date | null | undefined) {
  if (!dt) return "-";
  try { return format(new Date(dt), "dd MMM yyyy, hh:mm a"); } catch { return "-"; }
}

function formatDate(dt: string | Date | null | undefined) {
  if (!dt) return "-";
  try { return format(new Date(dt), "dd MMM yyyy"); } catch { return "-"; }
}

function formatTime(dt: string | Date | null | undefined) {
  if (!dt) return "-";
  try { return format(new Date(dt), "hh:mm a"); } catch { return "-"; }
}

function formatDuration(inTime: string | null | undefined, outTime: string | null | undefined): string {
  if (!inTime || !outTime) return "-";
  try {
    const diff = new Date(outTime).getTime() - new Date(inTime).getTime();
    const totalSecs = Math.floor(diff / 1000);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  } catch { return "-"; }
}

function tripStatusLabel(status: string) {
  const map: Record<string, string> = {
    started: "In Progress",
    submitted: "Submitted",
    approved: "Approved",
    rejected: "Rejected",
    completed: "Completed",
  };
  return map[status] || status;
}

const statusBadgeVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  started: "secondary",
  submitted: "outline",
  approved: "default",
  rejected: "destructive",
};

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

let googleMapsLoaded = false;
let googleMapsLoading = false;
const googleMapsCallbacks: Array<() => void> = [];

function loadGoogleMaps(callback: () => void) {
  if (googleMapsLoaded) { callback(); return; }
  googleMapsCallbacks.push(callback);
  if (googleMapsLoading) return;
  googleMapsLoading = true;
  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
  script.async = true;
  script.onload = () => {
    googleMapsLoaded = true;
    googleMapsLoading = false;
    googleMapsCallbacks.forEach(cb => cb());
    googleMapsCallbacks.length = 0;
  };
  document.head.appendChild(script);
}

function TripMap({ trip }: { trip: TripDetail }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const [ready, setReady] = useState(googleMapsLoaded);

  useEffect(() => {
    if (!ready) { loadGoogleMaps(() => setReady(true)); }
  }, [ready]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;

    type LatLng = { lat: number; lng: number; label: string; color: string };
    const points: LatLng[] = [];

    if (trip.startLatitude && trip.startLongitude)
      points.push({ lat: Number(trip.startLatitude), lng: Number(trip.startLongitude), label: `Start: ${trip.startLocationName || "Start Point"}`, color: "#16a34a" });
    (trip.visits || []).forEach((v, i) => {
      if (v.punchInLatitude && v.punchInLongitude)
        points.push({ lat: Number(v.punchInLatitude), lng: Number(v.punchInLongitude), label: `Visit ${i + 1} In: ${v.punchInLocationName || ""}`, color: "#2563eb" });
      if (v.punchOutLatitude && v.punchOutLongitude)
        points.push({ lat: Number(v.punchOutLatitude), lng: Number(v.punchOutLongitude), label: `Visit ${i + 1} Out: ${v.punchOutLocationName || ""}`, color: "#7c3aed" });
    });
    if (trip.endLatitude && trip.endLongitude)
      points.push({ lat: Number(trip.endLatitude), lng: Number(trip.endLongitude), label: `End: ${trip.endLocationName || "End Point"}`, color: "#dc2626" });

    if (points.length === 0) return;

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: points[0].lat, lng: points[0].lng },
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });
    mapInstanceRef.current = map;

    const bounds = new google.maps.LatLngBounds();
    const infoWindow = new google.maps.InfoWindow();

    points.forEach((p) => {
      const pos = { lat: p.lat, lng: p.lng };
      bounds.extend(pos);
      const marker = new google.maps.Marker({
        position: pos,
        map,
        title: p.label,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: p.color,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
        },
      });
      marker.addListener("click", () => {
        infoWindow.setContent(`<div style="font-size:13px;padding:2px 4px">${p.label}</div>`);
        infoWindow.open(map, marker);
      });
    });

    if (points.length > 1) {
      new google.maps.Polyline({
        path: points.map(p => ({ lat: p.lat, lng: p.lng })),
        geodesic: true,
        strokeColor: "#6366f1",
        strokeOpacity: 0.8,
        strokeWeight: 3,
        map,
      });
      map.fitBounds(bounds);
    }
  }, [ready, trip]);

  if (!ready) return (
    <div className="h-[260px] w-full rounded-md flex items-center justify-center bg-muted/30">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
  return <div ref={mapRef} className="h-[260px] w-full rounded-md" />;
}

function TripDetailPage({ tripId, onBack }: { tripId: number; onBack: () => void }) {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<"details" | "audit" | "comments">("details");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [newComment, setNewComment] = useState("");

  const { data: trip, isLoading } = useQuery<TripDetail>({
    queryKey: ["/api/trips", tripId],
    queryFn: async () => {
      const res = await fetch(`/api/trips/${tripId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: comments } = useQuery<TripComment[]>({
    queryKey: ["/api/trips", tripId, "comments"],
    queryFn: async () => {
      const res = await fetch(`/api/trips/${tripId}/comments`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: activeSection === "comments",
  });

  const { data: auditHistory } = useQuery<TripAudit[]>({
    queryKey: ["/api/trips", tripId, "audit"],
    queryFn: async () => {
      const res = await fetch(`/api/trips/${tripId}/audit`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: activeSection === "audit",
  });

  const approveMutation = useMutation({
    mutationFn: async () => { await apiRequest("PATCH", `/api/trips/${tripId}/approve`); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId, "audit"] });
      toast({ title: "Trip Approved" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: async (reason: string) => { await apiRequest("PATCH", `/api/trips/${tripId}/reject`, { reason }); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId, "audit"] });
      setShowRejectInput(false);
      setRejectReason("");
      toast({ title: "Trip Rejected" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const addCommentMutation = useMutation({
    mutationFn: async (msg: string) => {
      const res = await fetch(`/api/trips/${tripId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
        body: JSON.stringify({ message: msg }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId, "comments"] });
      setNewComment("");
    },
    onError: () => toast({ title: "Error", description: "Failed to add comment", variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!trip) return <div className="p-8 text-center text-muted-foreground">Trip not found.</div>;

  const timeline: { label: string; time: string | null; color: string; desc?: string }[] = [];
  if (trip.startTime) timeline.push({ label: "Trip Started", time: trip.startTime, color: "#2563eb", desc: trip.startLocationName || undefined });
  (trip.visits || []).forEach((v, i) => {
    if (v.punchInTime) timeline.push({ label: `Visit ${i + 1} – Check In`, time: v.punchInTime, color: "#7c3aed", desc: v.punchInLocationName || undefined });
    if (v.punchOutTime) timeline.push({ label: `Visit ${i + 1} – Check Out`, time: v.punchOutTime, color: "#7c3aed", desc: v.punchOutLocationName || undefined });
  });
  if (trip.endTime) timeline.push({ label: "Trip Completed", time: trip.endTime, color: "#16a34a", desc: trip.endLocationName || undefined });

  const hasMapPoints = (trip.startLatitude && trip.startLongitude) || (trip.visits || []).some(v => v.punchInLatitude);

  return (
    <div className="animate-in fade-in">
      <div className="border-b bg-card px-6 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back-trips">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Car className="h-5 w-5 text-primary" />
        <span className="font-semibold text-lg">TRP-{String(trip.id).padStart(4, "0")}</span>
        <span className="text-muted-foreground text-sm">— {trip.employeeName}</span>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant={statusBadgeVariant[trip.status] || "secondary"} data-testid="badge-detail-status">
            {tripStatusLabel(trip.status)}
          </Badge>
          {trip.status === "submitted" && (
            <>
              <Button size="sm" onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending} data-testid="button-approve-trip">
                <CheckCircle className="h-4 w-4 mr-1" /> {approveMutation.isPending ? "Approving..." : "Approve"}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setShowRejectInput(v => !v)} data-testid="button-reject-trip">
                <XCircle className="h-4 w-4 mr-1" /> Reject
              </Button>
            </>
          )}
        </div>
      </div>

      {showRejectInput && (
        <div className="px-6 py-3 border-b bg-destructive/5 flex items-center gap-3">
          <Textarea
            className="min-h-[40px] max-h-[80px] resize-none flex-1"
            placeholder="Enter rejection reason..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            data-testid="input-reject-reason"
          />
          <Button variant="destructive" size="sm" disabled={!rejectReason.trim() || rejectMutation.isPending} onClick={() => rejectMutation.mutate(rejectReason)} data-testid="button-confirm-reject">
            {rejectMutation.isPending ? "..." : "Confirm"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setShowRejectInput(false); setRejectReason(""); }} data-testid="button-cancel-reject">Cancel</Button>
        </div>
      )}

      <div className="flex items-center gap-1 px-6 border-b bg-card">
        {(["details", "audit", "comments"] as const).map((sec) => (
          <button
            key={sec}
            onClick={() => setActiveSection(sec)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              activeSection === sec ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            data-testid={`tab-${sec}`}
          >
            {sec === "details" ? "Details" : sec === "audit" ? "Audit History" : "Comments"}
          </button>
        ))}
      </div>

      {activeSection === "details" && (
        <div className="flex gap-0 min-h-[600px]">
          <div className="flex-1 p-6 space-y-5 border-r overflow-y-auto">
            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-b pb-2">Trip Details</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Title</p>
                  <p className="font-medium">TRP-{String(trip.id).padStart(4, "0")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Employee</p>
                  <p className="font-medium">{trip.employeeName}</p>
                  <p className="text-xs text-muted-foreground">{trip.employeeCode}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant={statusBadgeVariant[trip.status] || "secondary"} className="mt-1">
                    {tripStatusLabel(trip.status)}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium">{formatDate(trip.startTime)}</p>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                <Gauge className="h-4 w-4 text-primary" /> Odometer
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Start Reading</p>
                  <p className="font-bold text-lg">{trip.startMeterReading ? `${Number(trip.startMeterReading).toLocaleString()} km` : "-"}</p>
                  {trip.startMeterPhoto && (
                    <img src={trip.startMeterPhoto} alt="Start meter" className="w-24 h-20 object-cover rounded-md border cursor-pointer hover:opacity-80" onClick={() => window.open(trip.startMeterPhoto!, "_blank")} data-testid="img-start-meter" />
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">End Reading</p>
                  <p className="font-bold text-lg">{trip.endMeterReading ? `${Number(trip.endMeterReading).toLocaleString()} km` : "-"}</p>
                  {trip.endMeterPhoto && (
                    <img src={trip.endMeterPhoto} alt="End meter" className="w-24 h-20 object-cover rounded-md border cursor-pointer hover:opacity-80" onClick={() => window.open(trip.endMeterPhoto!, "_blank")} data-testid="img-end-meter" />
                  )}
                </div>
              </div>
              {trip.totalKm && (
                <div className="pt-2 border-t flex gap-6 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Distance</p>
                    <p className="font-semibold text-primary">{Number(trip.totalKm).toFixed(1)} km</p>
                  </div>
                  {trip.expenseAmount && (
                    <div>
                      <p className="text-xs text-muted-foreground">Travel Amount</p>
                      <p className="font-semibold">₹{Number(trip.expenseAmount).toFixed(0)}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {(trip.visits || []).length > 0 && (
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" /> Location Check-ins ({trip.visits!.length})
                </h3>
                <div className="space-y-4">
                  {trip.visits!.map((visit, idx) => (
                    <div key={visit.id} className="relative pl-6 pb-4 border-b last:border-0 last:pb-0" data-testid={`card-visit-${visit.id}`}>
                      <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[9px] font-bold">
                        {idx + 1}
                      </div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div>
                          <span className="text-sm font-medium">Visit {idx + 1}</span>
                          {(visit as any).customerName && (
                            <p className="text-xs text-primary font-medium mt-0.5">{(visit as any).customerName}</p>
                          )}
                          {(visit as any).customerAddress && (
                            <p className="text-xs text-muted-foreground">{(visit as any).customerAddress}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={visit.status === "punched_out" ? "default" : "secondary"} className="text-xs">
                            {visit.status === "punched_out" ? "Completed" : "Active"}
                          </Badge>
                          {visit.status === "punched_out" && visit.punchInTime && visit.punchOutTime && (
                            <span className="text-xs text-primary font-medium flex items-center gap-1" data-testid={`text-visit-duration-${visit.id}`}>
                              <Timer className="h-3 w-3" />{formatDuration(visit.punchInTime, visit.punchOutTime)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0" />
                          <div>
                            <p className="text-muted-foreground">Check In · {formatTime(visit.punchInTime)}</p>
                            {visit.punchInLocationName && (
                              <p className="text-foreground font-medium mt-0.5 flex items-center gap-1">
                                <Navigation className="h-3 w-3 text-muted-foreground" />{visit.punchInLocationName}
                              </p>
                            )}
                            <p className="text-muted-foreground">{formatDateTime(visit.punchInTime)}</p>
                          </div>
                        </div>
                        {visit.punchInPhoto && (
                          <img src={visit.punchInPhoto} alt="Check in" className="w-16 h-14 object-cover rounded-md border cursor-pointer hover:opacity-80 ml-4" onClick={() => window.open(visit.punchInPhoto!, "_blank")} data-testid={`img-visit-in-${visit.id}`} />
                        )}
                        {visit.punchOutTime && (
                          <div className="flex items-start gap-2 mt-1">
                            <div className="w-2 h-2 rounded-full bg-violet-500 mt-1 shrink-0" />
                            <div>
                              <p className="text-muted-foreground">Check Out · {formatTime(visit.punchOutTime)}</p>
                              {visit.punchOutLocationName && (
                                <p className="text-foreground font-medium mt-0.5 flex items-center gap-1">
                                  <Navigation className="h-3 w-3 text-muted-foreground" />{visit.punchOutLocationName}
                                </p>
                              )}
                              <p className="text-muted-foreground">{formatDateTime(visit.punchOutTime)}</p>
                            </div>
                          </div>
                        )}
                        {visit.punchOutPhoto && (
                          <img src={visit.punchOutPhoto} alt="Check out" className="w-16 h-14 object-cover rounded-md border cursor-pointer hover:opacity-80 ml-4" onClick={() => window.open(visit.punchOutPhoto!, "_blank")} data-testid={`img-visit-out-${visit.id}`} />
                        )}
                        {visit.remarks && <p className="text-muted-foreground italic ml-4">{visit.remarks}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {trip.rejectionReason && (
              <div className="p-3 bg-destructive/10 rounded-md border border-destructive/20">
                <p className="text-sm font-medium text-destructive">Rejection Reason</p>
                <p className="text-sm mt-1" data-testid="text-rejection-reason">{trip.rejectionReason}</p>
              </div>
            )}

            {hasMapPoints && (
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Route className="h-4 w-4 text-primary" /> Route Map
                </h3>
                <TripMap trip={trip} />
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-600 inline-block" /> Start</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" /> Check In</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-violet-600 inline-block" /> Check Out</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" /> End</span>
                </div>
              </div>
            )}
          </div>

          <div className="w-72 p-5 space-y-5 shrink-0 overflow-y-auto">
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Timeline</h4>
              {timeline.length === 0 ? (
                <p className="text-xs text-muted-foreground">No timeline events</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-[7px] top-3 bottom-3 w-0.5 bg-border" />
                  <div className="space-y-5">
                    {timeline.map((evt, i) => (
                      <div key={i} className="relative flex gap-3">
                        <div className="w-4 h-4 rounded-full border-2 border-white shadow shrink-0 mt-0.5" style={{ backgroundColor: evt.color }} />
                        <div className="flex-1 space-y-0.5">
                          <p className="text-xs font-semibold text-foreground">{evt.label}</p>
                          {evt.desc && <p className="text-xs text-muted-foreground leading-tight">{evt.desc}</p>}
                          <p className="text-xs text-muted-foreground">{formatDateTime(evt.time)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-4 space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Basic Details</h4>
              <div className="space-y-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Employee ID</p>
                  <p className="font-medium">{trip.employeeCode}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total KM</p>
                  <p className="font-medium">{trip.totalKm ? `${Number(trip.totalKm).toFixed(1)} km` : "-"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Visits</p>
                  <p className="font-medium">{(trip.visits || []).length}</p>
                </div>
                {trip.startLocationName && (
                  <div>
                    <p className="text-muted-foreground">Start Location</p>
                    <p className="font-medium">{trip.startLocationName}</p>
                  </div>
                )}
                {trip.endLocationName && (
                  <div>
                    <p className="text-muted-foreground">End Location</p>
                    <p className="font-medium">{trip.endLocationName}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSection === "audit" && (
        <div className="p-6 space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <History className="h-4 w-4 text-primary" /> Audit History
          </h3>
          {!auditHistory || auditHistory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No audit history yet</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
              <div className="space-y-6">
                {auditHistory.map((entry) => {
                  const colors: Record<string, string> = { approved: "bg-green-500", rejected: "bg-red-500", submitted: "bg-amber-500", started: "bg-blue-500" };
                  return (
                    <div key={entry.id} className="relative flex gap-4 pl-10" data-testid={`audit-entry-${entry.id}`}>
                      <div className={`absolute left-2.5 w-3 h-3 rounded-full ${colors[entry.toStatus] || "bg-gray-400"} mt-1`} />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-semibold capitalize">{entry.toStatus}</p>
                        <p className="text-xs text-muted-foreground">{entry.changedByName} · {formatDateTime(entry.changedAt)}</p>
                        {entry.notes && entry.notes !== "Trip approved" && (
                          <p className="text-xs text-muted-foreground italic">{entry.notes}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {activeSection === "comments" && (
        <div className="p-6 space-y-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" /> Comments
          </h3>
          {!comments || comments.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No comments yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Message</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Created By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comments.map((c) => (
                  <TableRow key={c.id} data-testid={`comment-row-${c.id}`}>
                    <TableCell className="text-sm">{c.message}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDateTime(c.createdAt)}</TableCell>
                    <TableCell className="text-sm">{c.createdByName}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="flex gap-2 pt-2 border-t">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="min-h-[60px] resize-none"
              data-testid="input-comment"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && newComment.trim()) {
                  e.preventDefault();
                  addCommentMutation.mutate(newComment.trim());
                }
              }}
            />
            <Button size="icon" onClick={() => newComment.trim() && addCommentMutation.mutate(newComment.trim())} disabled={!newComment.trim() || addCommentMutation.isPending} data-testid="button-send-comment">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Trips() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);

  const { data: trips, isLoading } = useQuery<TripWithEmployee[]>({
    queryKey: ["/api/trips"],
  });

  if (selectedTripId) {
    return <TripDetailPage tripId={selectedTripId} onBack={() => setSelectedTripId(null)} />;
  }

  const filteredTrips = (trips || []).filter((trip) => {
    const matchesSearch =
      trip.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      trip.employeeCode.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || trip.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const paginatedTrips = filteredTrips.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const statusTabs = [
    { value: "all", label: "All Trips" },
    { value: "started", label: "In Progress" },
    { value: "submitted", label: "Submitted" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ];

  return (
    <div className="space-y-5 animate-in fade-in">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Car className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-bold font-display text-primary" data-testid="text-page-title">
              Trips
            </h2>
            <p className="text-muted-foreground text-sm">Employee field trip tracking</p>
          </div>
        </div>
      </div>

      <div className="border-b">
        <div className="flex items-center gap-1 overflow-x-auto">
          {statusTabs.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                statusFilter === value ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`tab-filter-${value}`}
            >
              {label}
              {trips && value !== "all" && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs rounded-full bg-muted">
                  {trips.filter(t => t.status === value).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="p-0">
          <div className="flex items-center gap-3 p-4 border-b">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by employee name or code..."
                className="pl-9 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-search-trips"
              />
            </div>
            {trips && (
              <span className="text-sm text-muted-foreground">{filteredTrips.length} trip{filteredTrips.length !== 1 ? "s" : ""}</span>
            )}
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading trips...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Visits</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>KM</TableHead>
                  <TableHead>Create Time</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrips.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-12">
                      <Car className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      No trips found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTrips.map((trip) => (
                    <TableRow
                      key={trip.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedTripId(trip.id)}
                      data-testid={`row-trip-${trip.id}`}
                    >
                      <TableCell>
                        <span className="font-medium text-primary text-sm" data-testid={`text-trip-id-${trip.id}`}>
                          TRP-{String(trip.id).padStart(4, "0")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                            {trip.employeeName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium" data-testid={`text-employee-name-${trip.id}`}>{trip.employeeName}</p>
                            <p className="text-xs text-muted-foreground">{trip.employeeCode}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">Trip</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant[trip.status] || "secondary"} data-testid={`badge-status-${trip.id}`}>
                          {tripStatusLabel(trip.status)}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-visits-${trip.id}`}>
                        {trip.visitCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-primary" />{trip.visitCount}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground" data-testid={`text-trip-date-${trip.id}`}>
                        {trip.startTime ? formatDateTime(trip.startTime) : "-"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {trip.endTime ? formatDateTime(trip.endTime) : "-"}
                      </TableCell>
                      <TableCell className="text-sm" data-testid={`text-km-${trip.id}`}>
                        {trip.totalKm ? `${Number(trip.totalKm).toFixed(1)} km` : "-"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {trip.createdAt ? formatDateTime(trip.createdAt) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary"
                          onClick={(e) => { e.stopPropagation(); setSelectedTripId(trip.id); }}
                          data-testid={`button-view-trip-${trip.id}`}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          <PaginationBar page={page} total={filteredTrips.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </CardContent>
      </Card>
    </div>
  );
}
