import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Clock, Calendar, FileText, CheckCircle, XCircle, Loader2, Share2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { getEmployeeToken, clearEmployeeToken } from "../EmployeeLogin";
import html2canvas from "html2canvas";

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
  const attendanceCardRef = useRef<HTMLDivElement>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareImage, setShareImage] = useState<string | null>(null);
  const [shareType, setShareType] = useState<"in" | "out">("in");
  const [capturing, setCapturing] = useState(false);

  const captureAndShare = useCallback(async (type: "in" | "out") => {
    setShareType(type);
    setCapturing(true);
    await new Promise(r => setTimeout(r, 500));
    try {
      const el = attendanceCardRef.current;
      if (!el) return;
      const canvas = await html2canvas(el, { backgroundColor: "#ffffff", scale: 2, useCORS: true });
      const dataUrl = canvas.toDataURL("image/png");
      setShareImage(dataUrl);
      setShareDialogOpen(true);

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `attendance_${type}_${format(new Date(), "yyyy-MM-dd_HH-mm")}.png`, { type: "image/png" });
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: `Attendance Punch ${type === "in" ? "In" : "Out"} - ${employee.fullName}`,
              text: `${employee.fullName} punched ${type} at ${format(new Date(), "h:mm a")} on ${format(new Date(), "dd MMM yyyy")}`,
              files: [file],
            });
          } catch {}
        }
      }, "image/png");
    } catch {
      toast({ title: "Error", description: "Could not capture screenshot", variant: "destructive" });
    } finally {
      setCapturing(false);
    }
  }, [employee.fullName, toast]);

  const handleDownloadImage = () => {
    if (!shareImage) return;
    const a = document.createElement("a");
    a.href = shareImage;
    a.download = `attendance_${shareType}_${format(new Date(), "yyyy-MM-dd_HH-mm")}.png`;
    a.click();
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`${employee.fullName} (${employee.employeeId}) - Punch ${shareType === "in" ? "In" : "Out"} at ${format(new Date(), "h:mm a")} on ${format(new Date(), "dd MMM yyyy")}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

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
      toast({
        title: type === "in" ? "Punched In" : "Punched Out",
        description: `Successfully punched ${type} at ${format(new Date(), "h:mm a")}`,
        variant: type === "in" ? "success" : "destructive",
      });
      captureAndShare(type);
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

      <Card ref={attendanceCardRef}>
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
              onClick={() => punchMutation.mutate("in")}
              disabled={punchMutation.isPending || capturing || !!todayAttendance?.checkIn}
              className="flex-1 bg-green-600 hover:bg-green-700"
              data-testid="button-punch-in"
            >
              {punchMutation.isPending || capturing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Punch In
            </Button>
            <Button
              size="lg"
              variant="destructive"
              onClick={() => punchMutation.mutate("out")}
              disabled={punchMutation.isPending || capturing || !todayAttendance?.checkIn || !!todayAttendance?.checkOut}
              className="flex-1"
              data-testid="button-punch-out"
            >
              {punchMutation.isPending || capturing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Punch Out
            </Button>
          </div>

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

      <AlertDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {shareType === "in" ? "Punched In Successfully" : "Punched Out Successfully"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Screenshot captured. Share it to WhatsApp or download it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {shareImage && (
            <div className="border rounded-lg overflow-hidden my-2">
              <img src={shareImage} alt="Attendance screenshot" className="w-full" data-testid="img-attendance-screenshot" />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Button onClick={handleWhatsAppShare} className="w-full bg-green-600 hover:bg-green-700" data-testid="button-share-whatsapp">
              <Share2 className="w-4 h-4 mr-2" />
              Share to WhatsApp
            </Button>
            <Button variant="outline" onClick={handleDownloadImage} className="w-full" data-testid="button-download-screenshot">
              <Download className="w-4 h-4 mr-2" />
              Download Image
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-close-share">Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
