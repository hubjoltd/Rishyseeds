import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Loader2, MapPin, Clock, Gauge,
  Navigation, Play, Square, Building2,
  ChevronRight, LogIn, LogOut, Camera, X, Check,
} from "lucide-react";
import { format } from "date-fns";
import { getEmployeeToken } from "../EmployeeLogin";

function getHeaders(): Record<string, string> {
  const t = getEmployeeToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

interface EmployeeTripsProps {
  employee: { id: number; fullName: string; employeeId: string };
}

function fmtTime(dt: string | null | undefined) {
  if (!dt) return "-";
  try { return format(new Date(dt), "hh:mm a"); } catch { return "-"; }
}
function fmtDateTime(dt: string | null | undefined) {
  if (!dt) return "-";
  try { return format(new Date(dt), "dd MMM yyyy, hh:mm a"); } catch { return "-"; }
}
function fmtDur(a: string | null | undefined, b: string | null | undefined) {
  if (!a || !b) return "-";
  const secs = Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 1000);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function getGPS(): Promise<{ lat: number; lng: number; name?: string }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error("GPS not supported")); return; }
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let name: string | undefined;
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const d = await r.json();
          name = d.display_name;
        } catch {}
        resolve({ lat, lng, name });
      },
      err => reject(err),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    started: "bg-green-100 text-green-700",
    in_progress: "bg-green-100 text-green-700",
    completed: "bg-amber-100 text-amber-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };
  const labels: Record<string, string> = {
    started: "Active",
    in_progress: "Active",
    completed: "Submitted",
    approved: "Approved",
    rejected: "Rejected",
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${map[status] || "bg-gray-100 text-gray-500"}`}>
      {labels[status] || status}
    </span>
  );
}

type View = "list" | "detail" | "start_trip" | "end_trip";

export default function EmployeeTrips({ employee }: EmployeeTripsProps) {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [view, setView] = useState<View>("list");
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Photo capture state for CHECK IN / CHECK OUT
  const [captureMode, setCaptureMode] = useState<"in" | "out" | null>(null);
  const [captureFile, setCaptureFile] = useState<File | null>(null);
  const [capturePreview, setCapturePreview] = useState<string | null>(null);
  const [captureActiveVisitId, setCaptureActiveVisitId] = useState<number | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const captureGPS = useCallback(async (): Promise<{ lat: number; lng: number; name?: string } | null> => {
    setGpsLoading(true);
    try {
      const loc = await getGPS();
      return loc;
    } catch (err: any) {
      let msg = "GPS unavailable";
      if (err?.code === 1) msg = "Location permission denied. Enable it in settings.";
      else if (err?.code === 2) msg = "Location unavailable.";
      else if (err?.code === 3) msg = "GPS timed out. Try again.";
      toast({ title: "GPS Error", description: msg, variant: "destructive" });
      return null;
    } finally {
      setGpsLoading(false);
    }
  }, [toast]);

  const { data: trips = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/employee/trips"],
    queryFn: async () => {
      const res = await fetch("/api/employee/trips", { headers: getHeaders() });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: tripDetail, isLoading: detailLoading } = useQuery<any>({
    queryKey: ["/api/employee/trips", selectedTrip?.id],
    queryFn: async () => {
      const res = await fetch(`/api/employee/trips/${selectedTrip!.id}`, { headers: getHeaders() });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: !!selectedTrip && view === "detail",
    refetchInterval: 15000,
  });

  const startTripMutation = useMutation({
    mutationFn: async () => {
      const loc = await captureGPS();
      const fd = new FormData();
      if (loc) {
        fd.append("startLatitude", String(loc.lat));
        fd.append("startLongitude", String(loc.lng));
        if (loc.name) fd.append("startLocationName", loc.name);
      }
      const res = await fetch("/api/employee/trips", { method: "POST", headers: getHeaders(), body: fd });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || "Failed"); }
      return res.json();
    },
    onSuccess: (trip) => {
      qc.invalidateQueries({ queryKey: ["/api/employee/trips"] });
      setSelectedTrip(trip); setView("detail");
      toast({ title: "Trip Started", description: "Safe travels!" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const endTripMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTrip) throw new Error("No active trip");
      const loc = await captureGPS();
      const fd = new FormData();
      if (loc) {
        fd.append("endLatitude", String(loc.lat));
        fd.append("endLongitude", String(loc.lng));
        if (loc.name) fd.append("endLocationName", loc.name);
      }
      const res = await fetch(`/api/employee/trips/${selectedTrip.id}/end`, { method: "PATCH", headers: getHeaders(), body: fd });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || "Failed"); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/employee/trips"] });
      qc.invalidateQueries({ queryKey: ["/api/employee/trips", selectedTrip?.id] });
      setView("detail");
      toast({ title: "Trip Ended", description: "Trip submitted for approval" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const addVisitMutation = useMutation({
    mutationFn: async (photo: File) => {
      if (!selectedTrip) throw new Error("No active trip");
      const loc = await captureGPS();
      const fd = new FormData();
      fd.append("punchInPhoto", photo);
      if (loc) {
        fd.append("punchInLatitude", String(loc.lat));
        fd.append("punchInLongitude", String(loc.lng));
        if (loc.name) fd.append("punchInLocationName", loc.name);
      }
      const res = await fetch(`/api/employee/trips/${selectedTrip.id}/visits`, { method: "POST", headers: getHeaders(), body: fd });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || "Failed"); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/employee/trips", selectedTrip?.id] });
      resetCapture();
      toast({ title: "Checked In", description: "Location & photo captured" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const punchOutMutation = useMutation({
    mutationFn: async ({ visitId, photo }: { visitId: number; photo: File }) => {
      if (!selectedTrip) throw new Error("No trip");
      const loc = await captureGPS();
      const fd = new FormData();
      fd.append("punchOutPhoto", photo);
      if (loc) {
        fd.append("punchOutLatitude", String(loc.lat));
        fd.append("punchOutLongitude", String(loc.lng));
        if (loc.name) fd.append("punchOutLocationName", loc.name);
      }
      const res = await fetch(`/api/employee/trips/${selectedTrip.id}/visits/${visitId}/punch-out`, { method: "PATCH", headers: getHeaders(), body: fd });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || "Failed"); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/employee/trips", selectedTrip?.id] });
      resetCapture();
      toast({ title: "Checked Out" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const resetCapture = () => {
    setCaptureMode(null);
    setCaptureFile(null);
    setCapturePreview(null);
    setCaptureActiveVisitId(null);
    if (cameraRef.current) cameraRef.current.value = "";
  };

  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCaptureFile(file);
    const reader = new FileReader();
    reader.onload = () => setCapturePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const confirmCapture = () => {
    if (!captureFile) return;
    if (captureMode === "in") {
      addVisitMutation.mutate(captureFile);
    } else if (captureMode === "out" && captureActiveVisitId !== null) {
      punchOutMutation.mutate({ visitId: captureActiveVisitId, photo: captureFile });
    }
  };

  const activeTrip = trips.find(t => t.status === "started" || t.status === "in_progress");
  const trip = tripDetail || selectedTrip;

  // ===== PHOTO CAPTURE SCREEN =====
  if (captureMode !== null) {
    const isIn = captureMode === "in";
    const isPending = addVisitMutation.isPending || punchOutMutation.isPending || gpsLoading;
    return (
      <div className="flex flex-col h-full animate-in fade-in">
        {/* Hidden camera input */}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleCameraChange}
        />
        <div className={`text-white px-4 pt-5 pb-4 flex items-center gap-3 -mx-4 -mt-4 mb-4 ${isIn ? "bg-green-700" : "bg-orange-500"}`}>
          <button onClick={resetCapture} className="p-1"><ArrowLeft className="h-5 w-5" /></button>
          <span className="font-semibold text-base">{isIn ? "CHECK IN — Take Photo" : "CHECK OUT — Take Photo"}</span>
        </div>

        <div className="flex-1 space-y-4">
          <p className="text-xs text-gray-500 text-center">
            A photo is required to {isIn ? "check in" : "check out"} at a client location.
          </p>

          {/* Photo preview / capture area */}
          {capturePreview ? (
            <div className="relative rounded-xl overflow-hidden border border-gray-200 aspect-video bg-black">
              <img src={capturePreview} alt="Captured" className="w-full h-full object-cover" />
              <button
                onClick={() => { setCaptureFile(null); setCapturePreview(null); if (cameraRef.current) cameraRef.current.value = ""; }}
                className="absolute top-2 right-2 bg-black/60 rounded-full p-1.5"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => cameraRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center py-14 gap-3 bg-gray-50 active:bg-gray-100"
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isIn ? "bg-green-100" : "bg-orange-100"}`}>
                <Camera className={`h-8 w-8 ${isIn ? "text-green-700" : "text-orange-600"}`} />
              </div>
              <p className="text-sm font-semibold text-gray-700">Tap to open camera</p>
              <p className="text-xs text-gray-400">Photo proof is mandatory</p>
            </button>
          )}

          {capturePreview && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => cameraRef.current?.click()}
            >
              <Camera className="h-4 w-4 mr-2" /> Retake Photo
            </Button>
          )}
        </div>

        <div className="pt-3 border-t">
          <Button
            className={`w-full font-bold py-3 ${isIn ? "bg-green-700 hover:bg-green-800" : "bg-orange-500 hover:bg-orange-600"}`}
            disabled={!captureFile || isPending}
            onClick={confirmCapture}
          >
            {isPending
              ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing…</>
              : captureFile
                ? <><Check className="h-4 w-4 mr-2" /> CONFIRM {isIn ? "CHECK IN" : "CHECK OUT"}</>
                : <><Camera className="h-4 w-4 mr-2" /> Take Photo First</>
            }
          </Button>
        </div>
      </div>
    );
  }

  // ===== START TRIP FORM =====
  if (view === "start_trip") {
    return (
      <div className="flex flex-col h-full animate-in fade-in">
        <div className="bg-green-700 text-white px-4 pt-5 pb-4 flex items-center gap-3 -mx-4 -mt-4 mb-4">
          <button onClick={() => setView("list")} className="p-1"><ArrowLeft className="h-5 w-5" /></button>
          <span className="font-semibold text-base">Start Trip</span>
        </div>

        <div className="flex-1 space-y-4">
          <div className="border border-green-100 rounded-md bg-green-50 px-3 py-3 flex items-start gap-3">
            <Navigation className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800 mb-0.5">Ready to Start?</p>
              <p className="text-xs text-green-700">Your current GPS location will be captured when you tap Start Trip.</p>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t">
          <Button
            className="w-full bg-green-700 hover:bg-green-800 font-bold py-3"
            disabled={startTripMutation.isPending || gpsLoading}
            onClick={() => startTripMutation.mutate()}
            data-testid="button-confirm-start-trip"
          >
            {startTripMutation.isPending || gpsLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            START TRIP
          </Button>
        </div>
      </div>
    );
  }

  // ===== END TRIP FORM =====
  if (view === "end_trip") {
    return (
      <div className="flex flex-col h-full animate-in fade-in">
        <div className="bg-green-700 text-white px-4 pt-5 pb-4 flex items-center gap-3 -mx-4 -mt-4 mb-4">
          <button onClick={() => setView("detail")} className="p-1"><ArrowLeft className="h-5 w-5" /></button>
          <span className="font-semibold text-base">End Trip</span>
        </div>

        <div className="flex-1 space-y-4">
          <div className="border border-red-100 rounded-md bg-red-50 px-3 py-3 flex items-start gap-3">
            <MapPin className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800 mb-0.5">End Trip?</p>
              <p className="text-xs text-red-700">Your current GPS location will be captured and the trip will be submitted for approval.</p>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t">
          <Button
            className="w-full bg-red-600 hover:bg-red-700 font-bold py-3"
            disabled={endTripMutation.isPending || gpsLoading}
            onClick={() => endTripMutation.mutate()}
            data-testid="button-confirm-end-trip"
          >
            {endTripMutation.isPending || gpsLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Square className="h-4 w-4 mr-2" />}
            END TRIP
          </Button>
        </div>
      </div>
    );
  }

  // ===== TRIP DETAIL =====
  if (view === "detail" && trip) {
    const visits: any[] = trip.visits || [];
    const isActive = trip.status === "started" || trip.status === "in_progress";
    const activeVisit = visits.find((v: any) => v.status === "active" || !v.punchOutTime);

    return (
      <div className="flex flex-col h-full animate-in fade-in">
        <div className="bg-green-700 text-white px-4 pt-5 pb-4 flex items-center gap-3 -mx-4 -mt-4 mb-3">
          <button onClick={() => { setView("list"); setSelectedTrip(null); }} className="p-1"><ArrowLeft className="h-5 w-5" /></button>
          <div className="flex-1">
            <span className="font-semibold text-base">Trip #{trip.id}</span>
          </div>
          <StatusBadge status={trip.status} />
        </div>

        {detailLoading && !tripDetail && (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-green-600" /></div>
        )}

        <div className="flex-1 overflow-y-auto space-y-3 pb-4">
          {/* Odometer card */}
          <div className="border border-gray-100 rounded-md bg-white overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
              <Gauge className="h-3.5 w-3.5 text-gray-500" />
              <span className="text-xs font-semibold text-gray-500">Odometer</span>
            </div>
            <div className="grid grid-cols-3 divide-x divide-gray-100">
              <div className="px-3 py-3 text-center">
                <p className="text-[10px] text-gray-400 mb-1">Start</p>
                <p className="text-sm font-bold text-gray-700">{trip.startMeterReading || "-"}</p>
                <p className="text-[10px] text-gray-400">km</p>
              </div>
              <div className="px-3 py-3 text-center">
                <p className="text-[10px] text-gray-400 mb-1">End</p>
                <p className="text-sm font-bold text-gray-700">{trip.endMeterReading || "-"}</p>
                <p className="text-[10px] text-gray-400">km</p>
              </div>
              <div className="px-3 py-3 text-center">
                <p className="text-[10px] text-gray-400 mb-1">Total</p>
                <p className="text-sm font-bold text-green-700">{trip.totalKm ? `${Number(trip.totalKm).toFixed(1)}` : "-"}</p>
                <p className="text-[10px] text-gray-400">km</p>
              </div>
            </div>
          </div>

          {/* Time card */}
          <div className="border border-gray-100 rounded-md bg-white">
            <div className="grid grid-cols-2 divide-x divide-gray-100">
              <div className="px-3 py-3">
                <p className="text-[10px] text-gray-400 mb-1 flex items-center gap-1"><Play className="h-2.5 w-2.5 text-green-500" />Trip Start</p>
                <p className="text-xs font-bold text-gray-700">{fmtTime(trip.startTime)}</p>
                <p className="text-[10px] text-gray-400">{trip.startLocationName ? trip.startLocationName.split(",")[0] : "-"}</p>
              </div>
              <div className="px-3 py-3">
                <p className="text-[10px] text-gray-400 mb-1 flex items-center gap-1"><Square className="h-2.5 w-2.5 text-red-500" />Trip End</p>
                <p className="text-xs font-bold text-gray-700">{trip.endTime ? fmtTime(trip.endTime) : isActive ? "In Progress" : "-"}</p>
                <p className="text-[10px] text-gray-400">{trip.endLocationName ? trip.endLocationName.split(",")[0] : "-"}</p>
              </div>
            </div>
            {trip.startTime && trip.endTime && (
              <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50 text-center">
                <span className="text-xs text-gray-500 font-medium">Duration: {fmtDur(trip.startTime, trip.endTime)}</span>
              </div>
            )}
          </div>

          {/* Client Visits */}
          <div className="border border-gray-100 rounded-md bg-white overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-gray-500" />
              <span className="text-xs font-semibold text-gray-500">Client Visits</span>
              {visits.length > 0 && (
                <span className="bg-green-100 text-green-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">{visits.length}</span>
              )}
            </div>

            {visits.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-gray-400">
                No client visits recorded yet
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {visits.map((v: any, i: number) => {
                  const isVisitActive = !v.punchOutTime;
                  const isDash = v._source === "checkin";
                  return (
                    <div key={v.id} className={`px-3 py-3 ${isVisitActive ? "bg-green-50" : ""}`}>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-xs font-bold text-gray-800">
                              {v.customerName || `Visit ${i + 1}`}
                            </p>
                            {isDash && (
                              <span className="text-[9px] font-semibold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">Dashboard</span>
                            )}
                          </div>
                          {v.customerAddress && (
                            <p className="text-[10px] text-gray-500 leading-relaxed mt-0.5">{v.customerAddress}</p>
                          )}
                        </div>
                        {isVisitActive ? (
                          <span className="bg-green-100 text-green-700 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Active
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-500 text-[10px] font-semibold px-2 py-0.5 rounded-full">Done</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-gray-400">
                        <span className="flex items-center gap-1 text-green-600">
                          <LogIn className="h-3 w-3" />{fmtTime(v.punchInTime)}
                        </span>
                        {v.punchOutTime && (
                          <span className="flex items-center gap-1 text-red-500">
                            <LogOut className="h-3 w-3" />{fmtTime(v.punchOutTime)}
                          </span>
                        )}
                        {v.punchInTime && v.punchOutTime && (
                          <span className="text-gray-400">{fmtDur(v.punchInTime, v.punchOutTime)}</span>
                        )}
                      </div>
                      {/* Photo thumbnails */}
                      {(v.punchInPhoto || v.punchOutPhoto) && (
                        <div className="flex gap-2 mt-2">
                          {v.punchInPhoto && (
                            <a href={v.punchInPhoto} target="_blank" rel="noopener noreferrer" className="relative">
                              <img src={v.punchInPhoto} alt="Check-in" className="h-14 w-14 object-cover rounded-md border border-green-200" />
                              <span className="absolute bottom-0 left-0 right-0 text-[8px] text-center bg-green-600/80 text-white rounded-b-md">IN</span>
                            </a>
                          )}
                          {v.punchOutPhoto && (
                            <a href={v.punchOutPhoto} target="_blank" rel="noopener noreferrer" className="relative">
                              <img src={v.punchOutPhoto} alt="Check-out" className="h-14 w-14 object-cover rounded-md border border-orange-200" />
                              <span className="absolute bottom-0 left-0 right-0 text-[8px] text-center bg-orange-500/80 text-white rounded-b-md">OUT</span>
                            </a>
                          )}
                        </div>
                      )}
                      {v.remarks && <p className="text-[11px] text-gray-500 mt-1 italic">{v.remarks}</p>}
                      {isVisitActive && isActive && !isDash && (
                        <p className="text-[10px] text-green-600 mt-1 font-medium flex items-center gap-1">
                          <Navigation className="h-3 w-3" /> GPS tracking active · tap CHECK OUT below to close
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rejection reason */}
          {trip.rejectionReason && (
            <div className="border border-red-200 rounded-md bg-red-50 px-3 py-2.5">
              <p className="text-xs font-semibold text-red-600 mb-1">Rejected</p>
              <p className="text-xs text-red-700">{trip.rejectionReason}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        {isActive && (
          <div className="pt-3 border-t space-y-2">
            {activeVisit ? (
              <Button
                className="w-full bg-orange-500 hover:bg-orange-600 font-bold py-2.5"
                onClick={() => { setCaptureActiveVisitId(activeVisit.id); setCaptureMode("out"); }}
                data-testid="button-check-out"
              >
                <Camera className="h-4 w-4 mr-2" /> CHECK OUT — Take Photo
              </Button>
            ) : (
              <Button
                className="w-full bg-green-700 hover:bg-green-800 font-bold py-2.5"
                onClick={() => { resetCapture(); setCaptureMode("in"); }}
                data-testid="button-check-in"
              >
                <Camera className="h-4 w-4 mr-2" /> CHECK IN — Take Photo
              </Button>
            )}
            <Button
              className="w-full bg-red-600 hover:bg-red-700 font-bold py-2.5"
              onClick={() => setView("end_trip")}
              data-testid="button-end-trip"
            >
              <Square className="h-4 w-4 mr-2" /> END TRIP
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ===== TRIP LIST =====
  return (
    <div className="flex flex-col h-full animate-in fade-in">
      {/* Active trip banner */}
      {activeTrip && (
        <div
          className="bg-green-700 text-white rounded-md px-4 py-3 mb-3 flex items-center justify-between cursor-pointer"
          onClick={() => { setSelectedTrip(activeTrip); setView("detail"); }}
          data-testid="card-active-trip"
        >
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            <div>
              <p className="text-xs font-bold">Trip #{activeTrip.id} — Active</p>
              <p className="text-[11px] text-green-200">{fmtTime(activeTrip.startTime)} · {activeTrip.startMeterReading || "?"} km start</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-green-200" />
        </div>
      )}

      {/* Trips list */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-green-600" /></div>
        ) : trips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-2">
              <Navigation className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium">No Trips Yet</p>
            <p className="text-xs text-gray-300">Start your first trip below</p>
          </div>
        ) : (
          trips.map(t => {
            const visitsCount = t.visits?.length || 0;
            return (
              <div
                key={t.id}
                className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm cursor-pointer active:scale-[0.99] transition-transform"
                onClick={() => { setSelectedTrip(t); setView("detail"); }}
                data-testid={`card-trip-${t.id}`}
              >
                <div className="px-3 pt-3 pb-2 flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-xs text-green-700 font-semibold">Trip #{t.id}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{fmtDateTime(t.startTime)}</p>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
                <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100">
                  <div className="px-3 py-2 text-center">
                    <p className="text-[10px] text-gray-400">Distance</p>
                    <p className="text-xs font-bold text-gray-700">{t.totalKm ? `${Number(t.totalKm).toFixed(1)} km` : "-"}</p>
                  </div>
                  <div className="px-3 py-2 text-center">
                    <p className="text-[10px] text-gray-400">Visits</p>
                    <p className="text-xs font-bold text-gray-700">{visitsCount}</p>
                  </div>
                  <div className="px-3 py-2 text-center">
                    <p className="text-[10px] text-gray-400">Duration</p>
                    <p className="text-xs font-bold text-gray-700">{fmtDur(t.startTime, t.endTime)}</p>
                  </div>
                </div>
                {(t.startMeterReading || t.endMeterReading) && (
                  <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50 flex items-center gap-2 text-[11px] text-gray-400">
                    <Gauge className="h-3 w-3" />
                    <span>{t.startMeterReading || "?"} → {t.endMeterReading || "?"} km</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Start trip button (only if no active trip) */}
      {!activeTrip && (
        <div className="pt-3 border-t">
          <Button
            className="w-full bg-green-700 hover:bg-green-800 font-bold py-3"
            onClick={() => setView("start_trip")}
            data-testid="button-start-trip"
          >
            <Play className="h-4 w-4 mr-2" /> START NEW TRIP
          </Button>
        </div>
      )}
      {activeTrip && (
        <div className="pt-3 border-t">
          <Button
            variant="outline"
            className="w-full border-green-200 text-green-700 font-bold"
            onClick={() => { setSelectedTrip(activeTrip); setView("detail"); }}
            data-testid="button-view-active-trip"
          >
            VIEW ACTIVE TRIP →
          </Button>
        </div>
      )}
    </div>
  );
}
