import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MapPin,
  Camera,
  Play,
  Square,
  Plus,
  Clock,
  Navigation,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronLeft,
  Eye,
  Route,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getEmployeeToken } from "../EmployeeLogin";
import { format } from "date-fns";
import "leaflet/dist/leaflet.css";

function getEmployeeAuthHeaders(): Record<string, string> {
  const token = getEmployeeToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface EmployeeTripsProps {
  employee: {
    id: number;
    fullName: string;
    employeeId: string;
  };
}

interface TripData {
  id: number;
  employeeId: number;
  status: string;
  startTime: string | null;
  endTime: string | null;
  startLatitude: string | null;
  startLongitude: string | null;
  startLocationName: string | null;
  endLatitude: string | null;
  endLongitude: string | null;
  endLocationName: string | null;
  startMeterPhoto: string | null;
  endMeterPhoto: string | null;
  startMeterReading: string | null;
  endMeterReading: string | null;
  totalKm: string | null;
  expenseAmount: string | null;
  rejectionReason: string | null;
  approvedBy: number | null;
  approvedAt: string | null;
  createdAt: string;
  visits?: VisitData[];
}

interface VisitData {
  id: number;
  tripId: number;
  punchInTime: string | null;
  punchOutTime: string | null;
  punchInLatitude: string | null;
  punchInLongitude: string | null;
  punchInLocationName: string | null;
  punchOutLatitude: string | null;
  punchOutLongitude: string | null;
  punchOutLocationName: string | null;
  punchInPhoto: string | null;
  punchOutPhoto: string | null;
  status: string;
  remarks: string | null;
  customerName: string | null;
  customerAddress: string | null;
}

function TripMap({ points }: { points: { lat: number; lng: number; label: string; color: string }[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || points.length === 0) return;

    let L: any;
    const initMap = async () => {
      L = (await import("leaflet")).default;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const map = L.map(mapRef.current!, { scrollWheelZoom: false }).setView(
        [points[0].lat, points[0].lng],
        13
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      const bounds: [number, number][] = [];

      points.forEach((point) => {
        const icon = L.divIcon({
          className: "custom-marker",
          html: `<div style="background-color: ${point.color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        L.marker([point.lat, point.lng], { icon }).addTo(map).bindPopup(point.label);
        bounds.push([point.lat, point.lng]);
      });

      if (bounds.length > 1) {
        const polyline = L.polyline(bounds, { color: "#6366f1", weight: 3, dashArray: "8, 8" });
        polyline.addTo(map);
        map.fitBounds(L.latLngBounds(bounds).pad(0.2));
      }

      mapInstanceRef.current = map;

      setTimeout(() => map.invalidateSize(), 100);
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [points]);

  return <div ref={mapRef} style={{ height: "250px", width: "100%" }} className="rounded-md z-0" />;
}

function VisitTimer({ punchInTime }: { punchInTime: string }) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = Date.now() - new Date(punchInTime).getTime();
      const totalSecs = Math.floor(diff / 1000);
      const h = Math.floor(totalSecs / 3600);
      const m = Math.floor((totalSecs % 3600) / 60);
      const s = totalSecs % 60;
      setElapsed(
        h > 0
          ? `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`
          : `${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [punchInTime]);

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/30 rounded-md border border-green-200 dark:border-green-800">
      <Clock className="w-4 h-4 text-green-500 animate-pulse" />
      <div>
        <p className="text-xs text-muted-foreground">Time at location</p>
        <p className="text-sm font-bold text-green-600 dark:text-green-400 tabular-nums">{elapsed}</p>
      </div>
    </div>
  );
}

function formatDuration(inTime: string, outTime: string): string {
  const diff = new Date(outTime).getTime() - new Date(inTime).getTime();
  const totalSecs = Math.floor(diff / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "started":
      return <Badge className="bg-green-500">In Progress</Badge>;
    case "completed":
      return <Badge className="bg-amber-500">Submitted</Badge>;
    case "approved":
      return <Badge className="bg-green-500">Approved</Badge>;
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function getGPSLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  });
}

export default function EmployeeTrips({ employee }: EmployeeTripsProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedTrip, setSelectedTrip] = useState<TripData | null>(null);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showVisitDialog, setShowVisitDialog] = useState(false);
  const [startMeterReading, setStartMeterReading] = useState("");
  const [endMeterReading, setEndMeterReading] = useState("");
  const [visitRemarks, setVisitRemarks] = useState("");
  const [visitCustomerName, setVisitCustomerName] = useState("");
  const [visitCustomerAddress, setVisitCustomerAddress] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: trips, isLoading } = useQuery<TripData[]>({
    queryKey: ["/api/employee/trips"],
    queryFn: async () => {
      const res = await fetch("/api/employee/trips", { headers: getEmployeeAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch trips");
      return res.json();
    },
  });

  const { data: tripDetail, isLoading: tripDetailLoading } = useQuery<TripData>({
    queryKey: ["/api/employee/trips", selectedTrip?.id],
    queryFn: async () => {
      const res = await fetch(`/api/employee/trips/${selectedTrip!.id}`, {
        headers: getEmployeeAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch trip details");
      return res.json();
    },
    enabled: !!selectedTrip,
  });

  const captureGPS = useCallback(async () => {
    setGpsLoading(true);
    try {
      const position = await getGPSLocation();
      setCurrentLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      toast({ title: "Location Captured", description: "GPS coordinates captured successfully" });
      return { lat: position.coords.latitude, lng: position.coords.longitude };
    } catch (err: any) {
      let description = err.message || "Failed to capture location";
      if (err.code === 1) {
        description = "Location permission denied. Please enable Location in your browser/phone settings and try again.";
      } else if (err.code === 2) {
        description = "Location unavailable. Please check your GPS/internet connection.";
      } else if (err.code === 3) {
        description = "Location request timed out. Please try again.";
      }
      toast({
        title: "GPS Error",
        description,
        variant: "destructive",
      });
      return null;
    } finally {
      setGpsLoading(false);
    }
  }, [toast]);

  const startTripMutation = useMutation({
    mutationFn: async (data: { lat: number; lng: number; meterReading: string; photo: File }) => {
      const formData = new FormData();
      formData.append("startLatitude", data.lat.toString());
      formData.append("startLongitude", data.lng.toString());
      formData.append("startMeterReading", data.meterReading);
      formData.append("startMeterPhoto", data.photo);

      const res = await fetch("/api/employee/trips", {
        method: "POST",
        headers: getEmployeeAuthHeaders(),
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to start trip");
      }
      return res.json();
    },
    onSuccess: (newTrip) => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/trips"] });
      setShowStartDialog(false);
      setStartMeterReading("");
      setPhotoFile(null);
      setCurrentLocation(null);
      setSelectedTrip(newTrip);
      toast({ title: "Trip Started", description: "Your trip has been started successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const endTripMutation = useMutation({
    mutationFn: async (data: {
      tripId: number;
      lat: number;
      lng: number;
      meterReading: string;
      photo: File;
    }) => {
      const formData = new FormData();
      formData.append("endLatitude", data.lat.toString());
      formData.append("endLongitude", data.lng.toString());
      formData.append("endMeterReading", data.meterReading);
      formData.append("endMeterPhoto", data.photo);

      const res = await fetch(`/api/employee/trips/${data.tripId}/end`, {
        method: "PATCH",
        headers: getEmployeeAuthHeaders(),
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to end trip");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employee/trips", selectedTrip?.id] });
      setShowEndDialog(false);
      setEndMeterReading("");
      setPhotoFile(null);
      setCurrentLocation(null);
      toast({ title: "Trip Ended", description: "Your trip has been completed and submitted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const addVisitMutation = useMutation({
    mutationFn: async (data: {
      tripId: number;
      lat: number;
      lng: number;
      photo: File;
      remarks: string;
      customerName: string;
      customerAddress: string;
    }) => {
      const formData = new FormData();
      formData.append("punchInLatitude", data.lat.toString());
      formData.append("punchInLongitude", data.lng.toString());
      formData.append("punchInPhoto", data.photo);
      if (data.remarks) formData.append("remarks", data.remarks);
      if (data.customerName) formData.append("customerName", data.customerName);
      if (data.customerAddress) formData.append("customerAddress", data.customerAddress);

      const res = await fetch(`/api/employee/trips/${data.tripId}/visits`, {
        method: "POST",
        headers: getEmployeeAuthHeaders(),
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to add visit");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/trips", selectedTrip?.id] });
      setShowVisitDialog(false);
      setVisitRemarks("");
      setVisitCustomerName("");
      setVisitCustomerAddress("");
      setPhotoFile(null);
      setCurrentLocation(null);
      toast({ title: "Visit Added", description: "Punched in at new location" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const punchOutVisitMutation = useMutation({
    mutationFn: async (data: {
      tripId: number;
      visitId: number;
      lat: number;
      lng: number;
      photo: File;
    }) => {
      const formData = new FormData();
      formData.append("punchOutLatitude", data.lat.toString());
      formData.append("punchOutLongitude", data.lng.toString());
      formData.append("punchOutPhoto", data.photo);

      const res = await fetch(
        `/api/employee/trips/${data.tripId}/visits/${data.visitId}/punch-out`,
        {
          method: "PATCH",
          headers: getEmployeeAuthHeaders(),
          body: formData,
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to punch out");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/trips", selectedTrip?.id] });
      setPhotoFile(null);
      setCurrentLocation(null);
      toast({ title: "Punched Out", description: "Visit punch out recorded" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleStartTrip = async () => {
    if (!currentLocation) {
      const loc = await captureGPS();
      if (!loc) return;
      setCurrentLocation(loc);
      return;
    }
    if (!photoFile) {
      toast({ title: "Photo Required", description: "Please capture meter reading photo", variant: "destructive" });
      return;
    }
    if (!startMeterReading) {
      toast({ title: "Meter Reading Required", description: "Please enter starting meter reading", variant: "destructive" });
      return;
    }
    startTripMutation.mutate({
      lat: currentLocation.lat,
      lng: currentLocation.lng,
      meterReading: startMeterReading,
      photo: photoFile,
    });
  };

  const handleEndTrip = async () => {
    if (!selectedTrip) return;
    if (!currentLocation) {
      const loc = await captureGPS();
      if (!loc) return;
      setCurrentLocation(loc);
      return;
    }
    if (!photoFile) {
      toast({ title: "Photo Required", description: "Please capture meter reading photo", variant: "destructive" });
      return;
    }
    if (!endMeterReading) {
      toast({ title: "Meter Reading Required", description: "Please enter ending meter reading", variant: "destructive" });
      return;
    }
    endTripMutation.mutate({
      tripId: selectedTrip.id,
      lat: currentLocation.lat,
      lng: currentLocation.lng,
      meterReading: endMeterReading,
      photo: photoFile,
    });
  };

  const handleAddVisit = async () => {
    if (!selectedTrip) return;
    if (!currentLocation) {
      const loc = await captureGPS();
      if (!loc) return;
      setCurrentLocation(loc);
      return;
    }
    if (!photoFile) {
      toast({ title: "Photo Required", description: "Please capture a photo", variant: "destructive" });
      return;
    }
    addVisitMutation.mutate({
      tripId: selectedTrip.id,
      lat: currentLocation.lat,
      lng: currentLocation.lng,
      photo: photoFile,
      remarks: visitRemarks,
      customerName: visitCustomerName,
      customerAddress: visitCustomerAddress,
    });
  };

  const handlePunchOutVisit = async (visitId: number) => {
    if (!selectedTrip) return;
    if (!photoFile) {
      toast({ title: "Photo Required", description: "Please capture a photo first", variant: "destructive" });
      fileInputRef.current?.click();
      return;
    }
    const loc = await captureGPS();
    if (!loc) return;
    punchOutVisitMutation.mutate({
      tripId: selectedTrip.id,
      visitId,
      lat: loc.lat,
      lng: loc.lng,
      photo: photoFile,
    });
  };

  const activeTrip = trips?.find((t) => t.status === "started" || t.status === "in_progress");
  const trip = tripDetail || selectedTrip;

  const getTripMapPoints = (t: TripData) => {
    const points: { lat: number; lng: number; label: string; color: string }[] = [];
    if (t.startLatitude && t.startLongitude) {
      points.push({
        lat: Number(t.startLatitude),
        lng: Number(t.startLongitude),
        label: "Start",
        color: "#22c55e",
      });
    }
    if (t.visits) {
      t.visits.forEach((v, i) => {
        if (v.punchInLatitude && v.punchInLongitude) {
          points.push({
            lat: Number(v.punchInLatitude),
            lng: Number(v.punchInLongitude),
            label: `Visit ${i + 1} (In)`,
            color: "#3b82f6",
          });
        }
        if (v.punchOutLatitude && v.punchOutLongitude) {
          points.push({
            lat: Number(v.punchOutLatitude),
            lng: Number(v.punchOutLongitude),
            label: `Visit ${i + 1} (Out)`,
            color: "#8b5cf6",
          });
        }
      });
    }
    if (t.endLatitude && t.endLongitude) {
      points.push({
        lat: Number(t.endLatitude),
        lng: Number(t.endLongitude),
        label: "End",
        color: "#ef4444",
      });
    }
    return points;
  };

  if (selectedTrip && trip) {
    const mapPoints = getTripMapPoints(trip);
    const visits = trip.visits || [];
    const isActive = trip.status === "started" || trip.status === "in_progress";

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedTrip(null)}
            data-testid="button-back-trips"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">
              Trip #{trip.id}
            </h1>
            <p className="text-muted-foreground">
              {trip.startTime ? format(new Date(trip.startTime), "MMM dd, yyyy h:mm a") : "Not started"}
            </p>
          </div>
          {getStatusBadge(trip.status)}
        </div>

        {tripDetailLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[250px] w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <>
            {mapPoints.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="w-4 h-4" /> Route Map
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TripMap points={mapPoints} />
                  <div className="flex items-center gap-4 mt-3 flex-wrap">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-xs text-muted-foreground">Start</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-xs text-muted-foreground">Visits</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-xs text-muted-foreground">End</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Trip Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Start Time</span>
                    <p className="font-medium" data-testid="text-trip-start">
                      {trip.startTime ? format(new Date(trip.startTime), "h:mm a") : "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">End Time</span>
                    <p className="font-medium" data-testid="text-trip-end">
                      {trip.endTime ? format(new Date(trip.endTime), "h:mm a") : "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Start Reading</span>
                    <p className="font-medium" data-testid="text-start-reading">
                      {trip.startMeterReading ? `${Number(trip.startMeterReading).toLocaleString()} km` : "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">End Reading</span>
                    <p className="font-medium" data-testid="text-end-reading">
                      {trip.endMeterReading ? `${Number(trip.endMeterReading).toLocaleString()} km` : "-"}
                    </p>
                  </div>
                  {trip.totalKm && (
                    <div>
                      <span className="text-muted-foreground">Total Distance</span>
                      <p className="font-medium" data-testid="text-total-km">
                        {Number(trip.totalKm).toFixed(1)} km
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Visits</span>
                    <p className="font-medium" data-testid="text-visit-count">{visits.length}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  {trip.startMeterPhoto && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Start Meter</p>
                      <img
                        src={trip.startMeterPhoto}
                        alt="Start meter"
                        className="rounded-md w-full h-32 object-cover"
                        data-testid="img-start-meter"
                      />
                    </div>
                  )}
                  {trip.endMeterPhoto && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">End Meter</p>
                      <img
                        src={trip.endMeterPhoto}
                        alt="End meter"
                        className="rounded-md w-full h-32 object-cover"
                        data-testid="img-end-meter"
                      />
                    </div>
                  )}
                </div>

                {trip.rejectionReason && (
                  <div className="mt-4 p-3 bg-destructive/10 rounded-md">
                    <p className="text-sm font-medium text-destructive">Rejection Reason</p>
                    <p className="text-sm text-muted-foreground" data-testid="text-rejection-reason">
                      {trip.rejectionReason}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-base">Visits ({visits.length})</CardTitle>
                {isActive && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setPhotoFile(null);
                      setCurrentLocation(null);
                      setVisitRemarks("");
                      setVisitCustomerName("");
                      setVisitCustomerAddress("");
                      setShowVisitDialog(true);
                    }}
                    data-testid="button-add-visit"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Visit
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {visits.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4 text-sm">No visits recorded yet</p>
                ) : (
                  <div className="space-y-3">
                    {visits.map((visit, idx) => (
                      <div
                        key={visit.id}
                        className="p-3 border rounded-md space-y-2"
                        data-testid={`card-visit-${visit.id}`}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">Visit {idx + 1}</span>
                            <Badge
                              variant={visit.status === "punched_in" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {visit.status === "punched_in" ? "Active" : "Completed"}
                            </Badge>
                          </div>
                          {visit.status === "punched_out" && visit.punchInTime && visit.punchOutTime && (
                            <span className="text-xs text-muted-foreground font-medium">
                              Duration: {formatDuration(visit.punchInTime, visit.punchOutTime)}
                            </span>
                          )}
                        </div>

                        {visit.customerName && (
                          <div className="p-2 bg-primary/5 border border-primary/20 rounded-md">
                            <p className="text-xs font-semibold text-primary flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {visit.customerName}
                            </p>
                            {visit.customerAddress && (
                              <p className="text-xs text-muted-foreground mt-0.5">{visit.customerAddress}</p>
                            )}
                          </div>
                        )}

                        {visit.status === "punched_in" && visit.punchInTime && (
                          <VisitTimer punchInTime={visit.punchInTime} />
                        )}

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Punch In</span>
                            <p className="font-medium">
                              {visit.punchInTime
                                ? format(new Date(visit.punchInTime), "h:mm a")
                                : "-"}
                            </p>
                            {visit.punchInLocationName && (
                              <p className="text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" />{visit.punchInLocationName}
                              </p>
                            )}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Punch Out</span>
                            <p className="font-medium">
                              {visit.punchOutTime
                                ? format(new Date(visit.punchOutTime), "h:mm a")
                                : "-"}
                            </p>
                            {visit.punchOutLocationName && (
                              <p className="text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" />{visit.punchOutLocationName}
                              </p>
                            )}
                          </div>
                        </div>
                        {visit.remarks && (
                          <p className="text-xs text-muted-foreground italic">{visit.remarks}</p>
                        )}
                        <div className="flex gap-2 flex-wrap">
                          {visit.punchInPhoto && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">In Photo</p>
                              <img
                                src={visit.punchInPhoto}
                                alt="Punch in"
                                className="w-16 h-16 rounded-md object-cover"
                              />
                            </div>
                          )}
                          {visit.punchOutPhoto && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Out Photo</p>
                              <img
                                src={visit.punchOutPhoto}
                                alt="Punch out"
                                className="w-16 h-16 rounded-md object-cover"
                              />
                            </div>
                          )}
                        </div>
                        {isActive && visit.status === "punched_in" && (
                          <div className="space-y-2">
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                              className="text-xs"
                              data-testid={`input-visit-photo-out-${visit.id}`}
                            />
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handlePunchOutVisit(visit.id)}
                              disabled={punchOutVisitMutation.isPending}
                              data-testid={`button-punch-out-visit-${visit.id}`}
                            >
                              {punchOutVisitMutation.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin mr-1" />
                              ) : (
                                <Square className="w-3 h-3 mr-1" />
                              )}
                              Punch Out
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {isActive && (
              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  variant="destructive"
                  onClick={() => {
                    setPhotoFile(null);
                    setCurrentLocation(null);
                    setEndMeterReading("");
                    setShowEndDialog(true);
                  }}
                  data-testid="button-end-trip"
                >
                  <Square className="w-4 h-4 mr-2" /> End Trip
                </Button>
              </div>
            )}
          </>
        )}

        <Dialog open={showVisitDialog} onOpenChange={setShowVisitDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Visit</DialogTitle>
              <DialogDescription>Enter customer details and capture your location</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Customer Name *</label>
                <Input
                  value={visitCustomerName}
                  onChange={(e) => setVisitCustomerName(e.target.value)}
                  placeholder="e.g. Sri Harshini Fertilizer &amp; Seeds"
                  data-testid="input-visit-customer-name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Customer Address</label>
                <Textarea
                  value={visitCustomerAddress}
                  onChange={(e) => setVisitCustomerAddress(e.target.value)}
                  placeholder="Enter customer address"
                  className="min-h-[70px] resize-none"
                  data-testid="input-visit-customer-address"
                />
              </div>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={captureGPS}
                  disabled={gpsLoading}
                  data-testid="button-visit-gps"
                >
                  {gpsLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Navigation className="w-4 h-4 mr-2" />
                  )}
                  {currentLocation
                    ? `Location: ${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`
                    : "Capture GPS Location"}
                </Button>
                {currentLocation && (
                  <div className="flex items-center gap-2 text-xs text-green-600">
                    <CheckCircle className="w-3 h-3" /> GPS location captured
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Photo</label>
                <Input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  data-testid="input-visit-photo"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Remarks (Optional)</label>
                <Textarea
                  value={visitRemarks}
                  onChange={(e) => setVisitRemarks(e.target.value)}
                  placeholder="Add notes about this visit"
                  data-testid="input-visit-remarks"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleAddVisit}
                disabled={addVisitMutation.isPending || !visitCustomerName.trim()}
                data-testid="button-submit-visit"
              >
                {addVisitMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Punch In
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>End Trip</DialogTitle>
              <DialogDescription>Capture end location and meter reading</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={captureGPS}
                disabled={gpsLoading}
                data-testid="button-end-gps"
              >
                {gpsLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4 mr-2" />
                )}
                {currentLocation
                  ? `Location: ${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`
                  : "Capture GPS Location"}
              </Button>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Meter Reading (km)</label>
                <Input
                  type="number"
                  value={endMeterReading}
                  onChange={(e) => setEndMeterReading(e.target.value)}
                  placeholder="Enter ending meter reading"
                  data-testid="input-end-meter"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Meter Photo</label>
                <Input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  data-testid="input-end-photo"
                />
              </div>
              <Button
                className="w-full"
                variant="destructive"
                onClick={handleEndTrip}
                disabled={endTripMutation.isPending}
                data-testid="button-submit-end"
              >
                {endTripMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Square className="w-4 h-4 mr-2" />
                )}
                End Trip
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Route className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Trips</h1>
            <p className="text-muted-foreground">Track and manage your field trips</p>
          </div>
        </div>
        {!activeTrip && (
          <Button
            onClick={() => {
              setPhotoFile(null);
              setCurrentLocation(null);
              setStartMeterReading("");
              setShowStartDialog(true);
            }}
            data-testid="button-start-trip"
          >
            <Play className="w-4 h-4 mr-2" /> Start New Trip
          </Button>
        )}
      </div>

      {activeTrip && (
        <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Navigation className="w-5 h-5 text-green-500 animate-pulse" />
              Active Trip
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="space-y-1">
                <p className="text-sm">
                  Started at{" "}
                  {activeTrip.startTime
                    ? format(new Date(activeTrip.startTime), "h:mm a")
                    : "Unknown"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Meter: {activeTrip.startMeterReading ? `${Number(activeTrip.startMeterReading).toLocaleString()} km` : "-"}
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setSelectedTrip(activeTrip)}
                data-testid="button-view-active-trip"
              >
                <Eye className="w-4 h-4 mr-1" /> View
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="w-5 h-5" /> Trip History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !trips || trips.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 text-sm">
              No trips yet. Start your first trip!
            </p>
          ) : (
            <div className="space-y-3">
              {trips.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 p-3 border rounded-md hover-elevate cursor-pointer flex-wrap"
                  onClick={() => setSelectedTrip(t)}
                  data-testid={`card-trip-${t.id}`}
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">Trip #{t.id}</span>
                      {getStatusBadge(t.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t.startTime
                        ? format(new Date(t.startTime), "MMM dd, yyyy h:mm a")
                        : "No date"}
                    </p>
                    {t.totalKm && (
                      <p className="text-xs text-muted-foreground">
                        Distance: {Number(t.totalKm).toFixed(1)} km
                      </p>
                    )}
                  </div>
                  <ChevronLeft className="w-4 h-4 rotate-180 text-muted-foreground shrink-0" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Trip</DialogTitle>
            <DialogDescription>Capture your starting location and meter reading</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={captureGPS}
              disabled={gpsLoading}
              data-testid="button-start-gps"
            >
              {gpsLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4 mr-2" />
              )}
              {currentLocation
                ? `Location: ${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`
                : "Capture GPS Location"}
            </Button>
            {currentLocation && (
              <div className="flex items-center gap-2 text-xs text-green-600">
                <CheckCircle className="w-3 h-3" /> GPS location captured
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Starting Meter Reading (km)</label>
              <Input
                type="number"
                value={startMeterReading}
                onChange={(e) => setStartMeterReading(e.target.value)}
                placeholder="Enter current meter reading"
                data-testid="input-start-meter"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Meter Photo</label>
              <Input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                ref={fileInputRef}
                data-testid="input-start-photo"
              />
            </div>
            <Button
              className="w-full"
              onClick={handleStartTrip}
              disabled={startTripMutation.isPending}
              data-testid="button-submit-start"
            >
              {startTripMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Start Trip
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
