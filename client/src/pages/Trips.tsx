import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Trip, TripVisit, TripComment, TripAudit } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  FileText,
  History,
  MessageSquare,
  ChevronRight,
  Send,
  User,
  CalendarDays,
  Gauge,
  Route,
  Camera,
} from "lucide-react";
import { format } from "date-fns";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface TripWithEmployee extends Trip {
  employeeName: string;
  employeeCode: string;
  visitCount: number;
}

interface TripDetail extends TripWithEmployee {
  visits: TripVisit[];
}

const STATUS_PIPELINE = ["started", "submitted", "approved"];

function StatusPipeline({ status }: { status: string }) {
  const isRejected = status === "rejected";
  const steps = ["started", "submitted", isRejected ? "rejected" : "approved"];
  const labels: Record<string, string> = {
    started: "Started",
    submitted: "Submitted",
    approved: "Approved",
    rejected: "Rejected",
  };
  const currentIdx = steps.indexOf(status);

  return (
    <div className="flex items-center gap-0" data-testid="status-pipeline">
      {steps.map((step, idx) => {
        const isActive = step === status;
        const isDone = currentIdx > idx;
        const isRej = step === "rejected";
        return (
          <div key={step} className="flex items-center">
            <div
              className={`
                px-5 py-2 text-sm font-medium rounded-sm
                ${isActive
                  ? isRej
                    ? "bg-red-500 text-white"
                    : "bg-primary text-primary-foreground"
                  : isDone
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }
              `}
              data-testid={`pipeline-step-${step}`}
            >
              {labels[step]}
            </div>
            {idx < steps.length - 1 && (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function TripMap({ trip }: { trip: TripDetail }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    const points: [number, number][] = [];
    if (trip.startLatitude && trip.startLongitude)
      points.push([Number(trip.startLatitude), Number(trip.startLongitude)]);
    if (trip.visits) {
      trip.visits.forEach((v) => {
        if (v.punchInLatitude && v.punchInLongitude)
          points.push([Number(v.punchInLatitude), Number(v.punchInLongitude)]);
        if (v.punchOutLatitude && v.punchOutLongitude)
          points.push([Number(v.punchOutLatitude), Number(v.punchOutLongitude)]);
      });
    }
    if (trip.endLatitude && trip.endLongitude)
      points.push([Number(trip.endLatitude), Number(trip.endLongitude)]);
    if (points.length === 0) return;

    const map = L.map(mapRef.current).setView(points[0], 13);
    mapInstanceRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const mkIcon = (color: string, size: number) =>
      L.divIcon({
        className: "",
        html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.4)"></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

    if (trip.startLatitude && trip.startLongitude)
      L.marker([Number(trip.startLatitude), Number(trip.startLongitude)], { icon: mkIcon("#16a34a", 14) })
        .addTo(map).bindPopup(`<b>Start</b><br/>${trip.startLocationName || "Start Point"}`);

    if (trip.visits) {
      trip.visits.forEach((v, i) => {
        if (v.punchInLatitude && v.punchInLongitude)
          L.marker([Number(v.punchInLatitude), Number(v.punchInLongitude)], { icon: mkIcon("#2563eb", 12) })
            .addTo(map).bindPopup(`<b>Visit ${i + 1} In</b><br/>${v.punchInLocationName || ""}`);
        if (v.punchOutLatitude && v.punchOutLongitude)
          L.marker([Number(v.punchOutLatitude), Number(v.punchOutLongitude)], { icon: mkIcon("#7c3aed", 12) })
            .addTo(map).bindPopup(`<b>Visit ${i + 1} Out</b><br/>${v.punchOutLocationName || ""}`);
      });
    }
    if (trip.endLatitude && trip.endLongitude)
      L.marker([Number(trip.endLatitude), Number(trip.endLongitude)], { icon: mkIcon("#dc2626", 14) })
        .addTo(map).bindPopup(`<b>End</b><br/>${trip.endLocationName || "End Point"}`);

    if (points.length > 1) {
      const polyline = L.polyline(points, { color: "#6366f1", weight: 3, opacity: 0.7, dashArray: "8 4" });
      polyline.addTo(map);
      map.fitBounds(polyline.getBounds().pad(0.2));
    }
    setTimeout(() => map.invalidateSize(), 100);
    return () => {
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    };
  }, [trip]);

  return <div ref={mapRef} className="h-[300px] w-full rounded-md" />;
}

function formatDateTime(dt: string | Date | null | undefined) {
  if (!dt) return "-";
  try { return format(new Date(dt), "dd MMM yyyy, hh:mm a"); } catch { return "-"; }
}

function formatDate(dt: string | Date | null | undefined) {
  if (!dt) return "-";
  try { return format(new Date(dt), "dd MMM yyyy"); } catch { return "-"; }
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

const statusBadgeVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  started: "secondary",
  submitted: "outline",
  approved: "default",
  rejected: "destructive",
};

function DetailsTab({ trip, onApprove, onReject, isApproving, isRejecting }: {
  trip: TripDetail;
  onApprove: () => void;
  onReject: (reason: string) => void;
  isApproving: boolean;
  isRejecting: boolean;
}) {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const mapPoints = (() => {
    const pts: [number, number][] = [];
    if (trip.startLatitude && trip.startLongitude) pts.push([Number(trip.startLatitude), Number(trip.startLongitude)]);
    if (trip.visits) trip.visits.forEach(v => {
      if (v.punchInLatitude && v.punchInLongitude) pts.push([Number(v.punchInLatitude), Number(v.punchInLongitude)]);
    });
    if (trip.endLatitude && trip.endLongitude) pts.push([Number(trip.endLatitude), Number(trip.endLongitude)]);
    return pts;
  })();

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Employee</p>
          <p className="font-semibold" data-testid="text-detail-employee">{trip.employeeName}</p>
          <p className="text-xs text-muted-foreground">{trip.employeeCode}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Status</p>
          <Badge variant={statusBadgeVariant[trip.status] || "secondary"} data-testid="badge-detail-status">
            {trip.status}
          </Badge>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Date</p>
          <p className="font-semibold" data-testid="text-detail-date">{formatDate(trip.startTime)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Start Time</p>
          <p className="text-sm" data-testid="text-detail-start-time">{formatDateTime(trip.startTime)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">End Time</p>
          <p className="text-sm" data-testid="text-detail-end-time">{formatDateTime(trip.endTime)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Distance</p>
          <p className="font-semibold text-primary" data-testid="text-detail-km">
            {trip.totalKm ? `${Number(trip.totalKm).toFixed(1)} km` : "-"}
          </p>
        </div>
      </div>

      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Gauge className="h-4 w-4 text-primary" /> Odometer Details
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Starting Odometer</p>
            <p className="text-lg font-bold" data-testid="text-detail-start-meter">
              {trip.startMeterReading ? `${Number(trip.startMeterReading).toLocaleString()} km` : "-"}
            </p>
            {trip.startMeterPhoto && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Starting Odometer Picture</p>
                <img
                  src={trip.startMeterPhoto}
                  alt="Start meter"
                  className="w-28 h-24 object-cover rounded-md border cursor-pointer hover:opacity-90"
                  data-testid="img-start-meter"
                  onClick={() => window.open(trip.startMeterPhoto!, "_blank")}
                />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">End Odometer</p>
            <p className="text-lg font-bold" data-testid="text-detail-end-meter">
              {trip.endMeterReading ? `${Number(trip.endMeterReading).toLocaleString()} km` : "-"}
            </p>
            {trip.endMeterPhoto && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">End Odometer Picture</p>
                <img
                  src={trip.endMeterPhoto}
                  alt="End meter"
                  className="w-28 h-24 object-cover rounded-md border cursor-pointer hover:opacity-90"
                  data-testid="img-end-meter"
                  onClick={() => window.open(trip.endMeterPhoto!, "_blank")}
                />
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Total Distance</p>
            <p className="font-semibold">{trip.totalKm ? `${Number(trip.totalKm).toFixed(1)} km` : "-"}</p>
          </div>
          {trip.expenseAmount && (
            <div>
              <p className="text-xs text-muted-foreground">Total Travel Amount</p>
              <p className="font-semibold">₹{Number(trip.expenseAmount).toFixed(0)}</p>
            </div>
          )}
        </div>
      </div>

      {trip.visits && trip.visits.length > 0 && (
        <div className="border rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" /> Location Visits ({trip.visits.length})
          </h3>
          <div className="space-y-3">
            {trip.visits.map((visit, idx) => (
              <div key={visit.id} className="border rounded-md p-3 space-y-3" data-testid={`card-visit-${visit.id}`}>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </div>
                    <span className="text-sm font-medium">Visit {idx + 1}</span>
                    <Badge variant={visit.status === "punched_out" ? "default" : "secondary"} className="text-xs">
                      {visit.status === "punched_out" ? "Completed" : "Active"}
                    </Badge>
                  </div>
                  {visit.status === "punched_out" && visit.punchInTime && visit.punchOutTime && (
                    <div className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full" data-testid={`text-visit-duration-${visit.id}`}>
                      <Timer className="h-3 w-3" />
                      {formatDuration(visit.punchInTime, visit.punchOutTime)}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <p className="text-muted-foreground font-medium">Punch In</p>
                    <p className="font-semibold">{visit.punchInTime ? formatDateTime(visit.punchInTime) : "-"}</p>
                    {visit.punchInLocationName && (
                      <p className="flex items-center gap-1 text-muted-foreground">
                        <Navigation className="h-3 w-3" />{visit.punchInLocationName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground font-medium">Punch Out</p>
                    <p className="font-semibold">{visit.punchOutTime ? formatDateTime(visit.punchOutTime) : "-"}</p>
                    {visit.punchOutLocationName && (
                      <p className="flex items-center gap-1 text-muted-foreground">
                        <Navigation className="h-3 w-3" />{visit.punchOutLocationName}
                      </p>
                    )}
                  </div>
                </div>
                {(visit.punchInPhoto || visit.punchOutPhoto) && (
                  <div className="flex gap-3 flex-wrap">
                    {visit.punchInPhoto && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Punch In Photo</p>
                        <img src={visit.punchInPhoto} alt="Punch in" className="w-20 h-16 object-cover rounded-md border cursor-pointer hover:opacity-90" onClick={() => window.open(visit.punchInPhoto!, "_blank")} data-testid={`img-visit-in-${visit.id}`} />
                      </div>
                    )}
                    {visit.punchOutPhoto && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Punch Out Photo</p>
                        <img src={visit.punchOutPhoto} alt="Punch out" className="w-20 h-16 object-cover rounded-md border cursor-pointer hover:opacity-90" onClick={() => window.open(visit.punchOutPhoto!, "_blank")} data-testid={`img-visit-out-${visit.id}`} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {mapPoints.length > 1 && (
        <div className="border rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Route className="h-4 w-4 text-primary" /> Route Map
          </h3>
          <TripMap trip={trip} />
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-600 inline-block" /> Start</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-600 inline-block" /> Visit In</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-violet-600 inline-block" /> Visit Out</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-600 inline-block" /> End</span>
          </div>
        </div>
      )}

      {trip.rejectionReason && (
        <div className="p-3 bg-destructive/10 rounded-md border border-destructive/20">
          <p className="text-sm font-medium text-destructive">Rejection Reason</p>
          <p className="text-sm mt-1" data-testid="text-rejection-reason">{trip.rejectionReason}</p>
        </div>
      )}

      {trip.status === "submitted" && (
        <div className="border-t pt-4 space-y-3">
          {showRejectInput ? (
            <div className="space-y-2">
              <Textarea
                placeholder="Enter rejection reason..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                data-testid="input-reject-reason"
              />
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() => { onReject(rejectReason); setShowRejectInput(false); setRejectReason(""); }}
                  disabled={!rejectReason.trim() || isRejecting}
                  data-testid="button-confirm-reject"
                >
                  {isRejecting ? "Rejecting..." : "Confirm Reject"}
                </Button>
                <Button variant="outline" onClick={() => { setShowRejectInput(false); setRejectReason(""); }} data-testid="button-cancel-reject">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button onClick={onApprove} disabled={isApproving} data-testid="button-approve-trip">
                <CheckCircle className="h-4 w-4 mr-2" />
                {isApproving ? "Approving..." : "Approve"}
              </Button>
              <Button variant="destructive" onClick={() => setShowRejectInput(true)} data-testid="button-reject-trip">
                <XCircle className="h-4 w-4 mr-2" /> Reject
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AuditHistoryTab({ tripId }: { tripId: number }) {
  const { data: history, isLoading } = useQuery<TripAudit[]>({
    queryKey: ["/api/trips", tripId, "audit"],
    queryFn: async () => {
      const res = await fetch(`/api/trips/${tripId}/audit`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const statusLabels: Record<string, string> = {
    started: "Trip Started",
    submitted: "Trip Submitted",
    approved: "Trip Approved",
    rejected: "Trip Rejected",
  };

  const statusColors: Record<string, string> = {
    started: "bg-blue-500",
    submitted: "bg-amber-500",
    approved: "bg-green-500",
    rejected: "bg-red-500",
  };

  return (
    <div className="p-6 space-y-4">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <History className="h-4 w-4 text-primary" /> Audit History
      </h3>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : !history || history.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <History className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No audit history yet</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
          <div className="space-y-6">
            {history.map((entry) => (
              <div key={entry.id} className="relative flex gap-4 pl-10" data-testid={`audit-entry-${entry.id}`}>
                <div className={`absolute left-2.5 w-3 h-3 rounded-full ${statusColors[entry.toStatus] || "bg-gray-400"} mt-1`} />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">
                      {statusLabels[entry.toStatus] || entry.toStatus}
                    </span>
                    {entry.fromStatus && (
                      <span className="text-xs text-muted-foreground">
                        from {entry.fromStatus}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" /> {entry.changedByName}
                    <span className="mx-1">·</span>
                    <CalendarDays className="h-3 w-3" />
                    {entry.changedAt ? formatDateTime(entry.changedAt) : "-"}
                  </p>
                  {entry.notes && entry.notes !== "Trip approved" && entry.notes !== "Trip rejected" && (
                    <p className="text-xs text-muted-foreground italic mt-1">{entry.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CommentsTab({ tripId }: { tripId: number }) {
  const { toast } = useToast();
  const [message, setMessage] = useState("");

  const { data: comments, isLoading } = useQuery<TripComment[]>({
    queryKey: ["/api/trips", tripId, "comments"],
    queryFn: async () => {
      const res = await fetch(`/api/trips/${tripId}/comments`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (msg: string) => {
      const res = await fetch(`/api/trips/${tripId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({ message: msg }),
      });
      if (!res.ok) throw new Error("Failed to add comment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId, "comments"] });
      setMessage("");
    },
    onError: () => toast({ title: "Error", description: "Failed to add comment", variant: "destructive" }),
  });

  return (
    <div className="p-6 flex flex-col h-full space-y-4">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-primary" /> Comments
      </h3>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : !comments || comments.length === 0 ? (
        <div className="flex-1 text-center py-12 text-muted-foreground">
          <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No comments found</p>
        </div>
      ) : (
        <div className="flex-1 space-y-3">
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
        </div>
      )}

      <div className="flex gap-2 pt-2 border-t">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a comment..."
          className="min-h-[60px] resize-none"
          data-testid="input-comment"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && message.trim()) {
              e.preventDefault();
              addCommentMutation.mutate(message.trim());
            }
          }}
        />
        <Button
          size="icon"
          onClick={() => message.trim() && addCommentMutation.mutate(message.trim())}
          disabled={!message.trim() || addCommentMutation.isPending}
          data-testid="button-send-comment"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function TripDetailPage({
  tripId,
  onBack,
}: {
  tripId: number;
  onBack: () => void;
}) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"details" | "audit" | "comments">("details");

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

  const approveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/trips/${tripId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId, "audit"] });
      toast({ title: "Trip Approved", description: "Trip has been approved successfully." });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: async (reason: string) => {
      await apiRequest("PATCH", `/api/trips/${tripId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId] });
      queryClient.invalidateQueries({ queryKey: ["/api/trips", tripId, "audit"] });
      toast({ title: "Trip Rejected", description: "Trip has been rejected." });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const tabs = [
    { id: "details" as const, label: "Details", icon: FileText },
    { id: "audit" as const, label: "Audit History", icon: History },
    { id: "comments" as const, label: "Comments", icon: MessageSquare },
  ];

  return (
    <div className="space-y-0 animate-in fade-in">
      <div className="border-b bg-card">
        <div className="flex items-center justify-between gap-4 px-6 py-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back-trips">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              <span className="font-semibold text-lg">Trip #{tripId}</span>
              {trip && <span className="text-sm text-muted-foreground">— {trip.employeeName}</span>}
            </div>
          </div>
          {trip && <StatusPipeline status={trip.status} />}
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground">Loading trip details...</div>
      ) : trip ? (
        <div className="flex min-h-[600px]">
          <div className="w-44 border-r bg-muted/20 flex-shrink-0">
            <nav className="p-2 space-y-1 pt-4">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left ${
                    activeTab === id
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  data-testid={`tab-${id}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex-1 overflow-y-auto">
            {activeTab === "details" && (
              <DetailsTab
                trip={trip}
                onApprove={() => approveMutation.mutate()}
                onReject={(reason) => rejectMutation.mutate(reason)}
                isApproving={approveMutation.isPending}
                isRejecting={rejectMutation.isPending}
              />
            )}
            {activeTab === "audit" && <AuditHistoryTab tripId={tripId} />}
            {activeTab === "comments" && <CommentsTab tripId={tripId} />}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground">Trip not found.</div>
      )}
    </div>
  );
}

export default function Trips() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);

  const { data: trips, isLoading } = useQuery<TripWithEmployee[]>({
    queryKey: ["/api/trips"],
  });

  if (selectedTripId) {
    return (
      <TripDetailPage
        tripId={selectedTripId}
        onBack={() => setSelectedTripId(null)}
      />
    );
  }

  const filteredTrips = (trips || []).filter((trip) => {
    const matchesSearch =
      trip.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      trip.employeeCode.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || trip.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusTabs = [
    { value: "all", label: "All Expenses" },
    { value: "submitted", label: "Submitted" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "started", label: "Started" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Car className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-bold font-display text-primary" data-testid="text-page-title">
              Trip Management
            </h2>
            <p className="text-muted-foreground text-sm">Review and approve employee field trips</p>
          </div>
        </div>
      </div>

      <div className="border-b">
        <div className="flex items-center gap-1 overflow-x-auto">
          {statusTabs.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                statusFilter === value
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`tab-filter-${value}`}
            >
              {label}
              {value !== "all" && trips && (
                <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                  statusFilter === value ? "bg-primary/10" : "bg-muted"
                }`}>
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
              <span className="text-sm text-muted-foreground">
                {filteredTrips.length} trip{filteredTrips.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading trips...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Trip ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Visits</TableHead>
                  <TableHead>KM</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrips.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                      <Car className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      No trips found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTrips.map((trip) => (
                    <TableRow
                      key={trip.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedTripId(trip.id)}
                      data-testid={`row-trip-${trip.id}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                            {trip.employeeName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-medium text-sm" data-testid={`text-employee-name-${trip.id}`}>
                              {trip.employeeName}
                            </span>
                            <p className="text-xs text-muted-foreground">{trip.employeeCode}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground font-mono" data-testid={`text-trip-id-${trip.id}`}>
                        TRP-{String(trip.id).padStart(4, "0")}
                      </TableCell>
                      <TableCell className="text-sm" data-testid={`text-trip-date-${trip.id}`}>
                        {formatDate(trip.startTime)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant[trip.status] || "secondary"} data-testid={`badge-status-${trip.id}`}>
                          {trip.status}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-visits-${trip.id}`}>
                        {trip.visitCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-primary" />{trip.visitCount}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm" data-testid={`text-km-${trip.id}`}>
                        {trip.totalKm ? `${Number(trip.totalKm).toFixed(1)} km` : "-"}
                      </TableCell>
                      <TableCell className="text-sm" data-testid={`text-amount-${trip.id}`}>
                        {trip.expenseAmount ? `₹${Number(trip.expenseAmount).toFixed(0)}` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); setSelectedTripId(trip.id); }}
                          className="text-primary hover:text-primary"
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

          {filteredTrips.length > 0 && (
            <div className="px-4 py-3 border-t text-xs text-muted-foreground">
              Showing 1 - {filteredTrips.length} of {filteredTrips.length} items
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
