import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Combobox } from "@/components/ui/combobox";
import { Loader2, User, RefreshCw, Camera, MapPin, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInSeconds } from "date-fns";
import { useLocation } from "wouter";
import { getEmployeeToken, clearEmployeeToken } from "../EmployeeLogin";

function getEmployeeAuthHeaders(): Record<string, string> {
  const token = getEmployeeToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function requestLocationPermission(): Promise<boolean> {
  try {
    if (!navigator.geolocation) return false;
    try {
      if (navigator.permissions) {
        const status = await navigator.permissions.query({ name: "geolocation" });
        if (status.state === "granted") return true;
        if (status.state === "denied") return false;
      }
    } catch {}
    return new Promise<boolean>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        () => resolve(false),
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
      );
    });
  } catch {
    return false;
  }
}

function getPosition(highAccuracy: boolean, timeout: number): Promise<GeolocationPosition> {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: highAccuracy,
      timeout,
      maximumAge: 60000,
    });
  });
}

async function captureLocation(): Promise<{ latitude: string; longitude: string; locationName: string } | null> {
  try {
    if (!navigator.geolocation) return null;
    let position: GeolocationPosition;
    try {
      position = await getPosition(true, 15000);
    } catch {
      position = await getPosition(false, 15000);
    }
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    let locationName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
        headers: { "Accept-Language": "en" },
      });
      if (resp.ok) {
        const data = await resp.json();
        const addr = data.address || {};
        const parts = [
          addr.road || addr.hamlet || addr.neighbourhood || "",
          addr.suburb || addr.village || addr.town || "",
          addr.city || addr.county || addr.state_district || "",
          addr.state || "",
        ].filter(Boolean);
        if (parts.length > 0) locationName = parts.join(", ");
      }
    } catch {}
    return { latitude: lat.toString(), longitude: lng.toString(), locationName };
  } catch {
    return null;
  }
}

function formatTimeString(timeStr: string | null | undefined): string {
  if (!timeStr) return "-";
  if (timeStr.includes("T") || timeStr.includes("-")) {
    return format(new Date(timeStr), "h:mm a");
  }
  const [hours, minutes] = timeStr.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function CircleProgress({ pct }: { pct: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width="70" height="70" viewBox="0 0 70 70">
      <circle cx="35" cy="35" r={r} fill="none" stroke="#e5e7eb" strokeWidth="6" />
      <circle
        cx="35" cy="35" r={r} fill="none"
        stroke={pct > 0 ? "#2563eb" : "#d1d5db"}
        strokeWidth="6"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 35 35)"
      />
      <text x="35" y="40" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#374151">
        {Math.round(pct)}%
      </text>
    </svg>
  );
}

interface EmployeeDashboardProps {
  employee: {
    fullName: string;
    employeeId: string;
    role?: string;
    department?: string;
  };
}

export default function EmployeeDashboard({ employee }: EmployeeDashboardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [employeePhoto, setEmployeePhoto] = useState<string | null>(null);
  const [photoServerUrl, setPhotoServerUrl] = useState<string | null>(null);
  const [shareType, setShareType] = useState<"in" | "out">("in");
  const [punchTime, setPunchTime] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [punchLocation, setPunchLocation] = useState<string | null>(null);
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const pendingPunchType = useRef<"in" | "out" | null>(null);
  const pendingLocationRef = useRef<Promise<{ latitude: string; longitude: string; locationName: string } | null> | null>(null);

  // Customer check-in state
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [checkInStep, setCheckInStep] = useState<"select" | "new">("select");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [newCustomerForm, setNewCustomerForm] = useState({ companyName: "", mobile: "", email: "", noOfEmployees: "" });
  const [expensePeriod, setExpensePeriod] = useState<"today" | "month" | "all">("today");

  useEffect(() => {
    requestLocationPermission().then(setLocationGranted);
  }, []);

  const handleAuthError = (res: Response) => {
    if (res.status === 401) {
      clearEmployeeToken();
      queryClient.clear();
      setLocation("/employee-login");
      return true;
    }
    return false;
  };

  const { data: todayAttendance, isLoading: todayLoading } = useQuery({
    queryKey: ["/api/employee/attendance/today"],
    queryFn: async () => {
      const res = await fetch("/api/employee/attendance/today", { headers: getEmployeeAuthHeaders() });
      if (handleAuthError(res)) return null;
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: 30000,
  });

  const { data: dashStats } = useQuery({
    queryKey: ["/api/employee/dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/employee/dashboard-stats", { headers: getEmployeeAuthHeaders() });
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: 60000,
  });

  const { data: customersList } = useQuery({
    queryKey: ["/api/employee/customers"],
    queryFn: async () => {
      const res = await fetch("/api/employee/customers", { headers: getEmployeeAuthHeaders() });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const isPunchedIn = todayAttendance?.checkIn && !todayAttendance?.checkOut;
  const isPunchedOut = todayAttendance?.checkIn && todayAttendance?.checkOut;

  useEffect(() => {
    if (!isPunchedIn || !todayAttendance?.checkIn) { setElapsedSeconds(0); return; }
    const getInTime = () => {
      const ci = todayAttendance.checkIn;
      if (ci.includes("T") || ci.includes("-")) return new Date(ci);
      const [h, m] = ci.split(":").map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      return d;
    };
    const inTime = getInTime();
    const tick = () => setElapsedSeconds(differenceInSeconds(new Date(), inTime));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [isPunchedIn, todayAttendance?.checkIn]);

  const openCameraForPunch = (type: "in" | "out") => {
    pendingPunchType.current = type;
    pendingLocationRef.current = captureLocation();
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
      cameraInputRef.current.click();
    }
  };

  const uploadPhotoToServer = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch("/api/employee/upload-punch-photo", { method: "POST", body: formData });
      if (!res.ok) return null;
      const data = await res.json();
      return data.url;
    } catch { return null; }
  };

  const punchMutation = useMutation({
    mutationFn: async ({ type, location }: { type: "in" | "out"; location: { latitude: string; longitude: string; locationName: string } | null }) => {
      const res = await fetch(`/api/employee/punch-${type}`, {
        method: "POST",
        headers: { ...getEmployeeAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: location?.latitude || null, longitude: location?.longitude || null, locationName: location?.locationName || null }),
      });
      if (res.status === 401) { clearEmployeeToken(); queryClient.clear(); setLocation("/employee-login"); throw new Error("Session expired"); }
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Punch failed"); }
      return res.json();
    },
    onSuccess: (data, { type }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/attendance/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employee/attendance"] });
      const time = format(new Date(), "h:mm a");
      setPunchTime(time);
      setShareType(type);
      if (data.location) setPunchLocation(data.location);
      toast({ title: type === "in" ? "Punched In" : "Punched Out", description: `Punched ${type} at ${time}`, variant: type === "in" ? "success" : "destructive" });
      setShareDialogOpen(true);
    },
    onError: (error: Error) => {
      if (error.message !== "Session expired") toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingPunchType.current) return;
    const type = pendingPunchType.current;
    const reader = new FileReader();
    reader.onload = () => setEmployeePhoto(reader.result as string);
    reader.readAsDataURL(file);
    setIsUploading(true);
    toast({ title: "Processing...", description: "Capturing location and uploading photo..." });
    const locationPromise = pendingLocationRef.current || captureLocation();
    pendingLocationRef.current = null;
    const uploadPromise = uploadPhotoToServer(file);
    const [location, serverUrl] = await Promise.all([locationPromise, uploadPromise]);
    setPhotoServerUrl(serverUrl);
    if (location) setPunchLocation(location.locationName);
    setIsUploading(false);
    punchMutation.mutate({ type, location });
  };

  const handleShareToWhatsApp = useCallback(() => {
    if (!photoServerUrl) { toast({ title: "Error", description: "Photo still uploading, please wait.", variant: "destructive" }); return; }
    const filename = photoServerUrl.split("/").pop();
    const paramObj: Record<string, string> = { name: employee.fullName, id: employee.employeeId, type: shareType, time: punchTime, date: format(new Date(), "dd MMM yyyy, EEEE") };
    if (punchLocation) paramObj.location = punchLocation;
    const params = new URLSearchParams(paramObj);
    const shareUrl = `${window.location.origin}/punch-share/${filename}?${params.toString()}`;
    const locLine = punchLocation ? `\nLocation: ${punchLocation}` : "";
    const text = `*Rishi Hybrid Seeds Pvt. Ltd.*\n\n*Punch ${shareType === "in" ? "In" : "Out"}*\nName: ${employee.fullName}\nID: ${employee.employeeId}\nTime: ${punchTime}\nDate: ${format(new Date(), "dd MMM yyyy, EEEE")}${locLine}\n\n${shareUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  }, [photoServerUrl, employee, shareType, punchTime, punchLocation, toast]);

  const customerCheckinMutation = useMutation({
    mutationFn: async (payload: object) => {
      const res = await fetch("/api/employee/customer-checkin", {
        method: "POST",
        headers: { ...getEmployeeAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || "Check-in failed"); }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Customer Check-In Recorded", variant: "success" });
      setCheckInDialogOpen(false);
      setCheckInStep("select");
      setSelectedCustomerId("");
      setNewCustomerForm({ companyName: "", mobile: "", email: "", noOfEmployees: "" });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleExistingCheckIn = () => {
    if (!selectedCustomerId) return;
    const cust = (customersList || []).find((c: any) => c.id.toString() === selectedCustomerId);
    customerCheckinMutation.mutate({ customerId: Number(selectedCustomerId), customerName: cust?.name || "" });
  };

  const handleNewCustomerCheckIn = () => {
    if (!newCustomerForm.companyName.trim()) { toast({ title: "Company name required", variant: "destructive" }); return; }
    customerCheckinMutation.mutate({ isNew: true, companyName: newCustomerForm.companyName, mobile: newCustomerForm.mobile, email: newCustomerForm.email });
  };

  const tasks = dashStats?.tasks || { pendingToday: 0, inProgress: 0, overdue: 0, total: 0, completed: 0 };
  const expenses = dashStats?.expenses || { pending: 0, approved: 0, rejected: 0 };
  const taskCompletionPct = tasks.total > 0 ? (tasks.completed / tasks.total) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-100">
      <input type="file" accept="image/*" capture="user" ref={cameraInputRef} onChange={handlePhotoCapture} className="hidden" data-testid="input-camera" />

      {/* Blue Header Banner */}
      <div className="bg-blue-600 px-4 pt-6 pb-8 rounded-b-3xl shadow-lg">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-white text-xl font-bold">Hi, {employee.fullName.split(" ")[0]}</p>
            {isPunchedIn ? (
              <p className="text-yellow-300 text-sm font-medium mt-0.5">You are punched in !</p>
            ) : (
              <p className="text-yellow-300 text-sm font-medium mt-0.5">You are punched out !</p>
            )}
            {locationGranted === false && (
              <p className="text-red-200 text-xs mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Location not enabled
              </p>
            )}
          </div>
          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center ml-3 flex-shrink-0">
            <User className="w-7 h-7 text-gray-500" />
          </div>
        </div>

        {isPunchedIn ? (
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1 bg-white/20 rounded-xl px-3 py-2 text-center">
                <p className="text-white/70 text-xs">In Time</p>
                <p className="text-white font-bold text-sm">{formatTimeString(todayAttendance?.checkIn)}</p>
              </div>
              <div className="flex-1 bg-white/20 rounded-xl px-3 py-2 text-center">
                <p className="text-white/70 text-xs">Total Duration</p>
                <p className="text-white font-bold text-sm">{formatDuration(elapsedSeconds)}</p>
              </div>
              <Button
                onClick={() => openCameraForPunch("out")}
                disabled={punchMutation.isPending}
                className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-4 font-bold flex-shrink-0 h-auto"
                data-testid="button-punch-out"
              >
                {punchMutation.isPending && pendingPunchType.current === "out" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Punch Out"}
              </Button>
            </div>
          </div>
        ) : isPunchedOut ? (
          <div className="text-center">
            <p className="text-white/80 text-sm mb-2">Shift completed. In: {formatTimeString(todayAttendance?.checkIn)} | Out: {formatTimeString(todayAttendance?.checkOut)}</p>
            <div className="inline-block bg-gray-400/50 text-white text-sm px-6 py-2 rounded-full font-semibold">Day Completed</div>
          </div>
        ) : (
          <div className="flex justify-center">
            <Button
              onClick={() => openCameraForPunch("in")}
              disabled={punchMutation.isPending || todayLoading}
              className="bg-green-500 hover:bg-green-600 text-white rounded-full px-16 py-3 text-base font-bold shadow-lg min-w-[160px]"
              data-testid="button-punch-in"
            >
              {punchMutation.isPending && pendingPunchType.current === "in" ? <Loader2 className="w-5 h-5 animate-spin" /> : "Punch In"}
            </Button>
          </div>
        )}
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* Customer Check In — only when punched in */}
        {isPunchedIn && (
          <div className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center justify-between">
            <p className="font-semibold text-gray-700 text-sm">Customer Check In</p>
            <Button
              onClick={() => { setCheckInDialogOpen(true); setCheckInStep("select"); }}
              className="bg-green-500 hover:bg-green-600 text-white rounded-full px-5 py-1.5 text-sm font-semibold h-auto"
              data-testid="button-customer-checkin"
            >
              Check In
            </Button>
          </div>
        )}

        {/* Overall Performance MTD */}
        <div className="bg-white rounded-2xl px-4 py-4 shadow-sm">
          <p className="font-bold text-gray-800 text-sm mb-3">Overall Performance (MTD)</p>
          <div className="border border-gray-200 rounded-xl p-3 inline-flex items-center gap-4">
            <div>
              <p className="text-xs text-gray-500">Task Completed</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{tasks.completed} <span className="text-gray-400 text-base font-normal">of {tasks.total}</span></p>
            </div>
            <CircleProgress pct={taskCompletionPct} />
          </div>
        </div>

        {/* Task Overview */}
        <div className="bg-white rounded-2xl px-4 py-4 shadow-sm">
          <p className="font-bold text-gray-800 text-sm mb-3">Task Overview</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="border border-gray-200 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 leading-tight">Pending<br />(Today)</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{tasks.pendingToday}</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 leading-tight">In Progress<br />(All)</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{tasks.inProgress}</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 leading-tight">Overdue<br />(All)</p>
              <p className="text-2xl font-bold text-red-500 mt-1">{tasks.overdue}</p>
            </div>
          </div>
        </div>

        {/* Manage Leave */}
        <div className="bg-white rounded-2xl px-4 py-4 shadow-sm">
          <p className="font-bold text-gray-800 text-sm mb-3">Manage Leave</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="border border-gray-200 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">Balance</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">0.0</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">Taken</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">0.0</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">0.0</p>
            </div>
          </div>
        </div>

        {/* Expense */}
        <div className="bg-white rounded-2xl px-4 py-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-gray-800 text-sm">Expense</p>
            <select
              value={expensePeriod}
              onChange={(e) => setExpensePeriod(e.target.value as any)}
              className="text-xs text-gray-600 border border-gray-200 rounded-lg px-2 py-1 bg-white"
              data-testid="select-expense-period"
            >
              <option value="today">Today</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="border border-gray-200 rounded-xl p-3 text-center">
              <p className="text-xs text-teal-600 font-semibold tracking-wide">PENDING</p>
              <p className="text-lg font-bold text-teal-600 mt-1">{expenses.pending.toFixed(1)}</p>
              <p className="text-xs text-gray-400">INR</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-3 text-center">
              <p className="text-xs text-green-600 font-semibold tracking-wide">APPROVED</p>
              <p className="text-lg font-bold text-green-600 mt-1">{expenses.approved.toFixed(1)}</p>
              <p className="text-xs text-gray-400">INR</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-3 text-center">
              <p className="text-xs text-amber-500 font-semibold tracking-wide">REJECTED</p>
              <p className="text-lg font-bold text-amber-500 mt-1">{expenses.rejected.toFixed(1)}</p>
              <p className="text-xs text-gray-400">INR</p>
            </div>
          </div>
        </div>

      </div>

      {/* Customer Check-In Dialog */}
      <Dialog open={checkInDialogOpen} onOpenChange={(v) => { setCheckInDialogOpen(v); if (!v) { setCheckInStep("select"); setSelectedCustomerId(""); } }}>
        <DialogContent className="max-w-sm mx-auto">
          {checkInStep === "select" ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-center text-base font-bold">Check In</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Select Existing Customer</p>
                  <Combobox
                    options={(customersList || []).map((c: any) => ({ value: c.id.toString(), label: c.name }))}
                    value={selectedCustomerId}
                    onValueChange={setSelectedCustomerId}
                    placeholder="Select & Search Customer"
                    searchPlaceholder="Search customer..."
                    data-testid="select-existing-customer"
                  />
                </div>
                {selectedCustomerId && (
                  <Button
                    onClick={handleExistingCheckIn}
                    disabled={customerCheckinMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700 text-white rounded-full font-semibold"
                    data-testid="button-confirm-existing-checkin"
                  >
                    {customerCheckinMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Check In
                  </Button>
                )}
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-gray-200" />
                  <span className="text-xs text-gray-400">OR</span>
                  <div className="flex-1 border-t border-gray-200" />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setCheckInStep("new")}
                  className="w-full rounded-full border-blue-500 text-blue-600 font-semibold"
                  data-testid="button-new-customer"
                >
                  New Customer &amp; Check In ?
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <button onClick={() => setCheckInStep("select")} className="text-blue-600 text-sm font-medium">&#8592;</button>
                  <DialogTitle className="text-base font-bold">Add Customer</DialogTitle>
                </div>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div className="flex justify-center mb-2">
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-9 h-9 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium">Company Name *</label>
                  <Input
                    value={newCustomerForm.companyName}
                    onChange={(e) => setNewCustomerForm(f => ({ ...f, companyName: e.target.value }))}
                    placeholder="Enter company name"
                    className="mt-1"
                    data-testid="input-company-name"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium">Mobile</label>
                  <Input
                    value={newCustomerForm.mobile}
                    onChange={(e) => setNewCustomerForm(f => ({ ...f, mobile: e.target.value }))}
                    placeholder="Mobile number"
                    type="tel"
                    className="mt-1"
                    data-testid="input-mobile"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium">Email</label>
                  <Input
                    value={newCustomerForm.email}
                    onChange={(e) => setNewCustomerForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="Please enter email"
                    type="email"
                    className="mt-1"
                    data-testid="input-email"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 font-medium">No of Employees</label>
                  <Input
                    value={newCustomerForm.noOfEmployees}
                    onChange={(e) => setNewCustomerForm(f => ({ ...f, noOfEmployees: e.target.value }))}
                    placeholder="Please enter number..."
                    type="number"
                    className="mt-1"
                    data-testid="input-no-employees"
                  />
                </div>
                <Button
                  onClick={handleNewCustomerCheckIn}
                  disabled={customerCheckinMutation.isPending}
                  className="w-full bg-green-600 hover:bg-green-700 text-white rounded-full font-bold py-3"
                  data-testid="button-add-checkin"
                >
                  {customerCheckinMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  ADD &amp; CHECK IN
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* WhatsApp Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={(o) => { setShareDialogOpen(o); if (!o) { setEmployeePhoto(null); setPhotoServerUrl(null); setPunchLocation(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{shareType === "in" ? "Punched In Successfully" : "Punched Out Successfully"}</DialogTitle>
          </DialogHeader>
          {employeePhoto && (
            <div className="border rounded-lg overflow-hidden my-2">
              <img src={employeePhoto} alt="Employee photo" className="w-full max-h-64 object-cover" data-testid="img-employee-photo" />
            </div>
          )}
          <div className="p-3 bg-gray-50 rounded-lg text-sm space-y-1">
            <p className="font-bold text-primary">Rishi Hybrid Seeds Pvt. Ltd.</p>
            <p className="font-semibold">{employee.fullName} ({employee.employeeId})</p>
            <p>Punch {shareType === "in" ? "In" : "Out"} at <span className="font-medium">{punchTime}</span></p>
            <p className="text-muted-foreground">{format(new Date(), "dd MMM yyyy, EEEE")}</p>
            {punchLocation && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span data-testid="text-punch-location">{punchLocation}</span>
              </div>
            )}
          </div>
          <Button
            onClick={handleShareToWhatsApp}
            disabled={isUploading || !photoServerUrl}
            className="w-full bg-green-600 hover:bg-green-700"
            data-testid="button-share-whatsapp"
          >
            <Share2 className="w-4 h-4 mr-2" />
            {isUploading ? "Uploading Photo..." : "Share to WhatsApp"}
          </Button>
          <Button variant="outline" onClick={() => setShareDialogOpen(false)} className="w-full" data-testid="button-close-share">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
