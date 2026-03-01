import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, getAuthToken } from "@/lib/queryClient";
import type { Trip, TripVisit } from "@shared/schema";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Navigation,
  Car,
} from "lucide-react";
import { format } from "date-fns";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface TripWithEmployee extends Trip {
  employeeName: string;
  employeeCode: string;
}

interface TripDetail extends TripWithEmployee {
  visits: TripVisit[];
}

const statusColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  started: "secondary",
  submitted: "outline",
  approved: "default",
  rejected: "destructive",
};

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

    if (trip.startLatitude && trip.startLongitude) {
      points.push([Number(trip.startLatitude), Number(trip.startLongitude)]);
    }

    if (trip.visits) {
      trip.visits.forEach((v) => {
        if (v.punchInLatitude && v.punchInLongitude) {
          points.push([Number(v.punchInLatitude), Number(v.punchInLongitude)]);
        }
        if (v.punchOutLatitude && v.punchOutLongitude) {
          points.push([Number(v.punchOutLatitude), Number(v.punchOutLongitude)]);
        }
      });
    }

    if (trip.endLatitude && trip.endLongitude) {
      points.push([Number(trip.endLatitude), Number(trip.endLongitude)]);
    }

    if (points.length === 0) return;

    const map = L.map(mapRef.current).setView(points[0], 13);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const greenIcon = L.divIcon({
      className: "",
      html: `<div style="background:#16a34a;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.4)"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    const blueIcon = L.divIcon({
      className: "",
      html: `<div style="background:#2563eb;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.4)"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });

    const redIcon = L.divIcon({
      className: "",
      html: `<div style="background:#dc2626;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.4)"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    if (trip.startLatitude && trip.startLongitude) {
      L.marker([Number(trip.startLatitude), Number(trip.startLongitude)], { icon: greenIcon })
        .addTo(map)
        .bindPopup(`<b>Start</b><br/>${trip.startLocationName || "Start Point"}`);
    }

    if (trip.visits) {
      trip.visits.forEach((v, i) => {
        if (v.punchInLatitude && v.punchInLongitude) {
          L.marker([Number(v.punchInLatitude), Number(v.punchInLongitude)], { icon: blueIcon })
            .addTo(map)
            .bindPopup(`<b>Visit ${i + 1} - In</b><br/>${v.punchInLocationName || ""}`);
        }
        if (v.punchOutLatitude && v.punchOutLongitude) {
          L.marker([Number(v.punchOutLatitude), Number(v.punchOutLongitude)], { icon: blueIcon })
            .addTo(map)
            .bindPopup(`<b>Visit ${i + 1} - Out</b><br/>${v.punchOutLocationName || ""}`);
        }
      });
    }

    if (trip.endLatitude && trip.endLongitude) {
      L.marker([Number(trip.endLatitude), Number(trip.endLongitude)], { icon: redIcon })
        .addTo(map)
        .bindPopup(`<b>End</b><br/>${trip.endLocationName || "End Point"}`);
    }

    if (points.length > 1) {
      const polyline = L.polyline(points, { color: "#6366f1", weight: 3, opacity: 0.7, dashArray: "8 4" });
      polyline.addTo(map);
      map.fitBounds(polyline.getBounds().pad(0.2));
    }

    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [trip]);

  return <div ref={mapRef} className="h-[300px] w-full rounded-md" />;
}

export default function Trips() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const { data: trips, isLoading } = useQuery<TripWithEmployee[]>({
    queryKey: ["/api/trips"],
  });

  const { data: selectedTrip, isLoading: isLoadingDetail } = useQuery<TripDetail>({
    queryKey: ["/api/trips", selectedTripId],
    enabled: !!selectedTripId,
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/trips/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trips", selectedTripId] });
      toast({ title: "Trip Approved", description: "Trip has been approved successfully." });
      setSelectedTripId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      await apiRequest("PATCH", `/api/trips/${id}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trips", selectedTripId] });
      toast({ title: "Trip Rejected", description: "Trip has been rejected." });
      setSelectedTripId(null);
      setShowRejectInput(false);
      setRejectReason("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const filteredTrips = (trips || []).filter((trip) => {
    const matchesSearch =
      trip.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      trip.employeeCode.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || trip.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDateTime = (dt: string | Date | null | undefined) => {
    if (!dt) return "-";
    try {
      return format(new Date(dt), "dd MMM yyyy, hh:mm a");
    } catch {
      return "-";
    }
  };

  const formatDate = (dt: string | Date | null | undefined) => {
    if (!dt) return "-";
    try {
      return format(new Date(dt), "dd MMM yyyy");
    } catch {
      return "-";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display text-primary" data-testid="text-page-title">
            Trip Management
          </h2>
          <p className="text-muted-foreground">
            Review and approve employee field trips
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by employee name or code..."
          className="pl-10 max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-trips"
        />
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList data-testid="tabs-status-filter">
          <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
          <TabsTrigger value="submitted" data-testid="tab-submitted">Submitted</TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="border-0 shadow-lg shadow-primary/5">
        <CardHeader className="pb-0">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-primary" />
            <span className="font-semibold">Trips</span>
            {trips && (
              <Badge variant="secondary" data-testid="text-trip-count">
                {filteredTrips.length}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <p className="text-muted-foreground">Loading trips...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>KM</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrips.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-8"
                    >
                      No trips found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTrips.map((trip) => (
                    <TableRow key={trip.id} data-testid={`row-trip-${trip.id}`}>
                      <TableCell>
                        <div>
                          <span className="font-medium" data-testid={`text-employee-name-${trip.id}`}>
                            {trip.employeeName}
                          </span>
                          <br />
                          <span className="text-xs text-muted-foreground">
                            {trip.employeeCode}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-trip-date-${trip.id}`}>
                        {formatDate(trip.startTime)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusColors[trip.status] || "secondary"}
                          data-testid={`badge-status-${trip.id}`}
                        >
                          {trip.status}
                        </Badge>
                      </TableCell>
                      <TableCell data-testid={`text-km-${trip.id}`}>
                        {trip.totalKm ? `${Number(trip.totalKm).toFixed(1)} km` : "-"}
                      </TableCell>
                      <TableCell data-testid={`text-amount-${trip.id}`}>
                        {trip.expenseAmount ? `₹${Number(trip.expenseAmount).toFixed(0)}` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedTripId(trip.id);
                            setShowRejectInput(false);
                            setRejectReason("");
                          }}
                          data-testid={`button-view-trip-${trip.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedTripId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTripId(null);
            setShowRejectInput(false);
            setRejectReason("");
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Trip Details</DialogTitle>
            <DialogDescription>
              {selectedTrip
                ? `${selectedTrip.employeeName} (${selectedTrip.employeeCode})`
                : "Loading..."}
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetail ? (
            <p className="text-muted-foreground py-4">Loading trip details...</p>
          ) : selectedTrip ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    variant={statusColors[selectedTrip.status] || "secondary"}
                    data-testid="badge-detail-status"
                  >
                    {selectedTrip.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total KM</p>
                  <p className="font-medium" data-testid="text-detail-km">
                    {selectedTrip.totalKm
                      ? `${Number(selectedTrip.totalKm).toFixed(1)} km`
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Start Time</p>
                  <p className="text-sm" data-testid="text-detail-start-time">
                    {formatDateTime(selectedTrip.startTime)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">End Time</p>
                  <p className="text-sm" data-testid="text-detail-end-time">
                    {formatDateTime(selectedTrip.endTime)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Start Meter</p>
                  <p className="text-sm" data-testid="text-detail-start-meter">
                    {selectedTrip.startMeterReading || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">End Meter</p>
                  <p className="text-sm" data-testid="text-detail-end-meter">
                    {selectedTrip.endMeterReading || "-"}
                  </p>
                </div>
              </div>

              {(selectedTrip.startMeterPhoto || selectedTrip.endMeterPhoto) && (
                <div>
                  <p className="text-sm font-medium mb-2">Meter Photos</p>
                  <div className="flex gap-4 flex-wrap">
                    {selectedTrip.startMeterPhoto && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Start Meter</p>
                        <img
                          src={selectedTrip.startMeterPhoto}
                          alt="Start meter reading"
                          className="w-40 h-32 object-cover rounded-md border"
                          data-testid="img-start-meter"
                        />
                      </div>
                    )}
                    {selectedTrip.endMeterPhoto && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">End Meter</p>
                        <img
                          src={selectedTrip.endMeterPhoto}
                          alt="End meter reading"
                          className="w-40 h-32 object-cover rounded-md border"
                          data-testid="img-end-meter"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedTrip.visits && selectedTrip.visits.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">
                    Visits ({selectedTrip.visits.length})
                  </p>
                  <div className="space-y-3">
                    {selectedTrip.visits.map((visit, idx) => (
                      <Card key={visit.id} data-testid={`card-visit-${visit.id}`}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">Visit {idx + 1}</span>
                              <Badge variant={visit.status === "punched_out" ? "default" : "secondary"}>
                                {visit.status === "punched_out" ? "Completed" : "Active"}
                              </Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-muted-foreground">
                            <div>
                              <Clock className="inline h-3 w-3 mr-1" />
                              In: {formatDateTime(visit.punchInTime)}
                            </div>
                            <div>
                              <Clock className="inline h-3 w-3 mr-1" />
                              Out: {formatDateTime(visit.punchOutTime)}
                            </div>
                            {visit.punchInLocationName && (
                              <div>
                                <Navigation className="inline h-3 w-3 mr-1" />
                                {visit.punchInLocationName}
                              </div>
                            )}
                          </div>
                          {(visit.punchInPhoto || visit.punchOutPhoto) && (
                            <div className="flex gap-3 mt-2 flex-wrap">
                              {visit.punchInPhoto && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Punch In</p>
                                  <img
                                    src={visit.punchInPhoto}
                                    alt="Punch in"
                                    className="w-24 h-20 object-cover rounded-md border"
                                    data-testid={`img-visit-in-${visit.id}`}
                                  />
                                </div>
                              )}
                              {visit.punchOutPhoto && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Punch Out</p>
                                  <img
                                    src={visit.punchOutPhoto}
                                    alt="Punch out"
                                    className="w-24 h-20 object-cover rounded-md border"
                                    data-testid={`img-visit-out-${visit.id}`}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-2">Route Map</p>
                <TripMap trip={selectedTrip} />
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-full bg-green-600" /> Start
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-full bg-blue-600" /> Visits
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 rounded-full bg-red-600" /> End
                  </span>
                </div>
              </div>

              {selectedTrip.rejectionReason && (
                <div className="p-3 bg-destructive/10 rounded-md">
                  <p className="text-sm font-medium text-destructive">Rejection Reason</p>
                  <p className="text-sm" data-testid="text-rejection-reason">
                    {selectedTrip.rejectionReason}
                  </p>
                </div>
              )}

              {selectedTrip.status === "submitted" && (
                <div className="space-y-3 border-t pt-4">
                  {showRejectInput ? (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Enter rejection reason..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        data-testid="input-reject-reason"
                      />
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant="destructive"
                          onClick={() =>
                            rejectMutation.mutate({
                              id: selectedTrip.id,
                              reason: rejectReason,
                            })
                          }
                          disabled={!rejectReason.trim() || rejectMutation.isPending}
                          data-testid="button-confirm-reject"
                        >
                          {rejectMutation.isPending ? "Rejecting..." : "Confirm Reject"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowRejectInput(false);
                            setRejectReason("");
                          }}
                          data-testid="button-cancel-reject"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        onClick={() => approveMutation.mutate(selectedTrip.id)}
                        disabled={approveMutation.isPending}
                        data-testid="button-approve-trip"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {approveMutation.isPending ? "Approving..." : "Approve"}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => setShowRejectInput(true)}
                        data-testid="button-reject-trip"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
