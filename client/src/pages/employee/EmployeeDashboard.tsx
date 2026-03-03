import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Clock, Calendar, FileText, CheckCircle, XCircle, Loader2, Share2, Download, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { getEmployeeToken, clearEmployeeToken } from "../EmployeeLogin";

function getEmployeeAuthHeaders(): Record<string, string> {
  const token = getEmployeeToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatTimeString(timeStr: string | null | undefined): string {
  if (!timeStr) return "-";
  // Handle both time strings "HH:mm" and ISO timestamps
  if (timeStr.includes("T") || timeStr.includes("-")) {
    return format(new Date(timeStr), "h:mm a");
  }
  // Convert "HH:mm" to 12-hour format
  const [hours, minutes] = timeStr.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
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
  const [originalPhotoFile, setOriginalPhotoFile] = useState<File | null>(null);
  const [photoServerUrl, setPhotoServerUrl] = useState<string | null>(null);
  const [shareType, setShareType] = useState<"in" | "out">("in");
  const [punchTime, setPunchTime] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const pendingPunchType = useRef<"in" | "out" | null>(null);

  const openCameraForPunch = (type: "in" | "out") => {
    pendingPunchType.current = type;
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
    } catch {
      return null;
    }
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingPunchType.current) return;
    const type = pendingPunchType.current;
    setOriginalPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setEmployeePhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
    setIsUploading(true);
    const serverUrl = await uploadPhotoToServer(file);
    setPhotoServerUrl(serverUrl);
    setIsUploading(false);
    punchMutation.mutate(type);
  };

  const getShareText = useCallback(() => {
    return `*Rishi Hybrid Seeds Pvt. Ltd.*\n\n*Punch ${shareType === "in" ? "In" : "Out"}*\nName: ${employee.fullName}\nID: ${employee.employeeId}\nTime: ${punchTime}\nDate: ${format(new Date(), "dd MMM yyyy, EEEE")}`;
  }, [shareType, punchTime, employee]);

  const [shareStatus, setShareStatus] = useState<string>("");

  const handleShareWithPhoto = useCallback(async () => {
    const text = getShareText();
    setShareStatus("Preparing...");

    try {
      if (!navigator.share) {
        setShareStatus("Share not supported on this browser. Use Save Photo + WhatsApp buttons below.");
        return;
      }

      let fileToShare: File | null = null;

      if (originalPhotoFile) {
        fileToShare = originalPhotoFile;
        setShareStatus("Using camera photo...");
      } else if (photoServerUrl) {
        setShareStatus("Fetching photo from server...");
        const resp = await fetch(photoServerUrl);
        const blob = await resp.blob();
        fileToShare = new File([blob], "punch_photo.jpg", { type: "image/jpeg" });
      }

      if (fileToShare) {
        const canShare = navigator.canShare ? navigator.canShare({ files: [fileToShare] }) : false;
        if (canShare) {
          setShareStatus("Opening share menu...");
          await navigator.share({ text, files: [fileToShare] });
          setShareStatus("Shared!");
          return;
        } else {
          setShareStatus("Your browser doesn't support sharing photos. Use the buttons below instead.");
        }
      } else {
        setShareStatus("No photo available. Sending text only...");
        await navigator.share({ text });
        setShareStatus("Shared text only.");
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        setShareStatus("Share cancelled.");
        return;
      }
      setShareStatus(`Share failed: ${err?.message || "Unknown error"}. Use the buttons below.`);
    }
  }, [getShareText, originalPhotoFile, photoServerUrl]);

  const handleDownloadImage = useCallback(() => {
    if (photoServerUrl) {
      window.open(photoServerUrl, "_blank");
      return;
    }
    if (originalPhotoFile) {
      const blobUrl = URL.createObjectURL(originalPhotoFile);
      window.open(blobUrl, "_blank");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      return;
    }
    toast({ title: "Error", description: "Photo not available", variant: "destructive" });
  }, [originalPhotoFile, photoServerUrl, toast]);

  const handleSendWhatsApp = useCallback(() => {
    const text = getShareText();
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
  }, [getShareText]);

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
  });

  const { data: attendance } = useQuery({
    queryKey: ["/api/employee/attendance"],
    queryFn: async () => {
      const res = await fetch("/api/employee/attendance", { headers: getEmployeeAuthHeaders() });
      if (handleAuthError(res)) return [];
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: payslips } = useQuery({
    queryKey: ["/api/employee/payslips"],
    queryFn: async () => {
      const res = await fetch("/api/employee/payslips", { headers: getEmployeeAuthHeaders() });
      if (handleAuthError(res)) return [];
      if (!res.ok) return [];
      return res.json();
    },
  });

  const punchMutation = useMutation({
    mutationFn: async (type: "in" | "out") => {
      const res = await fetch(`/api/employee/punch-${type}`, {
        method: "POST",
        headers: getEmployeeAuthHeaders(),
      });
      if (res.status === 401) {
        clearEmployeeToken();
        queryClient.clear();
        setLocation("/employee-login");
        throw new Error("Session expired. Please login again.");
      }
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Punch failed");
      }
      return res.json();
    },
    onSuccess: (_, type) => {
      queryClient.invalidateQueries({ queryKey: ["/api/employee/attendance/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employee/attendance"] });
      const time = format(new Date(), "h:mm a");
      setPunchTime(time);
      setShareType(type);
      toast({
        title: type === "in" ? "Punched In" : "Punched Out",
        description: `Successfully punched ${type} at ${time}`,
        variant: type === "in" ? "success" : "destructive",
      });
      setShareDialogOpen(true);
    },
    onError: (error: Error) => {
      if (error.message !== "Session expired. Please login again.") {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    },
  });

  const isPunchedIn = todayAttendance?.checkIn && !todayAttendance?.checkOut;
  const isPunchedOut = todayAttendance?.checkIn && todayAttendance?.checkOut;

  const thisMonthAttendance = attendance?.filter((a: any) => {
    const date = new Date(a.date);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {employee.fullName}</h1>
        <p className="text-muted-foreground">{employee.role || employee.department || employee.employeeId}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" /> Today's Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isPunchedOut ? (
              <Badge variant="secondary" className="bg-gray-100">Completed</Badge>
            ) : isPunchedIn ? (
              <Badge className="bg-green-500">Working</Badge>
            ) : (
              <Badge variant="outline">Not Started</Badge>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" /> This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{thisMonthAttendance.length}</p>
            <p className="text-xs text-muted-foreground">Days Present</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" /> Payslips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{payslips?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Available</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" /> Punch Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayAttendance?.checkIn ? (
              <p className="text-lg font-semibold">{formatTimeString(todayAttendance.checkIn)}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Not punched in</p>
            )}
          </CardContent>
        </Card>
      </div>

      <input
        type="file"
        accept="image/*"
        capture="user"
        ref={cameraInputRef}
        onChange={handlePhotoCapture}
        className="hidden"
        data-testid="input-camera"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Attendance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              onClick={() => openCameraForPunch("in")}
              disabled={punchMutation.isPending || !!todayAttendance?.checkIn}
              className="flex-1 bg-green-600 hover:bg-green-700"
              data-testid="button-punch-in"
            >
              {punchMutation.isPending && pendingPunchType.current === "in" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Camera className="w-4 h-4 mr-2" />
              )}
              Punch In
            </Button>
            <Button
              size="lg"
              variant="destructive"
              onClick={() => openCameraForPunch("out")}
              disabled={punchMutation.isPending || !todayAttendance?.checkIn || !!todayAttendance?.checkOut}
              className="flex-1"
              data-testid="button-punch-out"
            >
              {punchMutation.isPending && pendingPunchType.current === "out" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Camera className="w-4 h-4 mr-2" />
              )}
              Punch Out
            </Button>
          </div>
          <p className="text-xs text-center text-muted-foreground">Take a selfie to punch in/out. Photo will be shared to WhatsApp.</p>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Today's Record</p>
              <p className="text-xs font-medium text-primary">{employee.fullName} ({employee.employeeId})</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Punch In:</span>
                <span className="ml-2 font-medium">
                  {formatTimeString(todayAttendance?.checkIn)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Punch Out:</span>
                <span className="ml-2 font-medium">
                  {formatTimeString(todayAttendance?.checkOut)}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{format(new Date(), "EEEE, dd MMMM yyyy")}</p>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={shareDialogOpen} onOpenChange={(o) => { setShareDialogOpen(o); if (!o) { setEmployeePhoto(null); setOriginalPhotoFile(null); setPhotoServerUrl(null); setShareStatus(""); } }}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {shareType === "in" ? "Punched In Successfully" : "Punched Out Successfully"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Share your photo and attendance details via WhatsApp.
            </AlertDialogDescription>
          </AlertDialogHeader>
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
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={handleShareWithPhoto} disabled={isUploading} className="w-full bg-green-600 hover:bg-green-700" data-testid="button-share-whatsapp">
              <Share2 className="w-4 h-4 mr-2" />
              {isUploading ? "Uploading Photo..." : "Share Photo + Details"}
            </Button>
            {shareStatus && (
              <p className="text-xs text-center p-2 bg-blue-50 rounded text-blue-700" data-testid="text-share-status">{shareStatus}</p>
            )}
            <div className="border-t pt-2 mt-1">
              <p className="text-xs text-muted-foreground mb-2 text-center">If share button doesn't work:</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleDownloadImage} disabled={isUploading} className="flex-1 text-xs" data-testid="button-download-screenshot">
                  <Download className="w-3 h-3 mr-1" />
                  Save Photo
                </Button>
                <Button variant="outline" onClick={handleSendWhatsApp} disabled={isUploading} className="flex-1 text-xs" data-testid="button-whatsapp-text">
                  <Share2 className="w-3 h-3 mr-1" />
                  WhatsApp Text
                </Button>
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-close-share">Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
