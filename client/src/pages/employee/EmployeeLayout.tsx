import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, Route, Switch } from "wouter";
import { EmployeeSidebar } from "@/components/EmployeeSidebar";
import { Loader2 } from "lucide-react";
import { getEmployeeToken, clearEmployeeToken } from "../EmployeeLogin";
import { useEffect, useRef } from "react";
import { registerPushNotifications } from "@/lib/pushNotifications";
import { requestAllLocationPermissions, startGpsTracking, stopGpsTracking, isCapacitorNative } from "@/lib/native-gps";
import { useToast } from "@/hooks/use-toast";
import EmployeeDashboard from "./EmployeeDashboard";
import EmployeeAttendance from "./EmployeeAttendance";
import EmployeePayslips from "./EmployeePayslips";
import EmployeeOperations from "./EmployeeOperations";
import EmployeeInward from "./EmployeeInward";
import EmployeeProcessing from "./EmployeeProcessing";
import EmployeePacking from "./EmployeePacking";
import EmployeeStockMovement from "./EmployeeStockMovement";
import EmployeeOutward from "./EmployeeOutward";
import EmployeeProfile from "./EmployeeProfile";
import EmployeeTrips from "./EmployeeTrips";
import EmployeeTasks from "./EmployeeTasks";
import EmployeeExpenses from "./EmployeeExpenses";
import EmployeeLeave from "./EmployeeLeave";
import EmployeeCalendar from "./EmployeeCalendar";
import EmployeeChat from "./EmployeeChat";

function getEmployeeAuthHeaders(): Record<string, string> {
  const token = getEmployeeToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type EmployeePermissions = Record<string, string[]>;

export function hasPermission(permissions: EmployeePermissions, resource: string, action: string): boolean {
  const resourcePerms = permissions[resource];
  return Array.isArray(resourcePerms) && resourcePerms.includes(action);
}

export default function EmployeeLayout() {
  const [currentPath, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Ref-latch: GPS starts once when isPunchedIn becomes true.
  // We do NOT stop it on re-render / query flaps — only on component unmount (logout).
  // On native Android the module-level flag in native-gps.ts additionally
  // prevents the foreground service from being double-started.
  const gpsStartedRef = useRef(false);
  const webGpsStopRef = useRef<(() => void) | null>(null);

  const { data: employee, isLoading } = useQuery({
    queryKey: ["/api/employee/me"],
    queryFn: async () => {
      const token = getEmployeeToken();
      if (!token) { setLocation("/employee-login"); return null; }
      const res = await fetch("/api/employee/me", { headers: getEmployeeAuthHeaders() });
      if (res.status === 401) {
        clearEmployeeToken();
        setLocation("/employee-login");
        return null;
      }
      if (!res.ok) throw new Error("Failed to fetch employee data");
      return res.json();
    },
  });

  const { data: permissionsData } = useQuery({
    queryKey: ["/api/employee/permissions"],
    queryFn: async () => {
      const res = await fetch("/api/employee/permissions", { headers: getEmployeeAuthHeaders() });
      if (!res.ok) return null;
      return res.json() as Promise<{ role: string; permissions: EmployeePermissions }>;
    },
    enabled: !!employee,
  });

  // Today's attendance — drives GPS start
  const { data: todayAttendance } = useQuery({
    queryKey: ["/api/employee/attendance/today"],
    queryFn: async () => {
      const res = await fetch("/api/employee/attendance/today", { headers: getEmployeeAuthHeaders() });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!employee,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (employee) {
      registerPushNotifications().catch(() => {});
      requestAllLocationPermissions().catch(() => {});
    }
  }, [employee?.id]);

  // Fix: Capacitor Android blank screen when returning from camera.
  // When the WebView resumes after the camera/file-picker closes, force a repaint.
  useEffect(() => {
    if (!isCapacitorNative) return;
    const repaint = () => {
      // Dispatch resize so React and the browser reflow the layout
      window.dispatchEvent(new Event("resize"));
      // Also nudge document body to force GPU layer flush
      document.body.style.opacity = "0.99";
      requestAnimationFrame(() => { document.body.style.opacity = ""; });
    };
    document.addEventListener("visibilitychange", repaint);
    document.addEventListener("resume", repaint);
    return () => {
      document.removeEventListener("visibilitychange", repaint);
      document.removeEventListener("resume", repaint);
    };
  }, []);

  // ── GPS tracking — strictly tied to punch-in / punch-out ─────────────────
  // GPS starts ONLY when isPunchedIn becomes true.
  // GPS stops as soon as isPunchedIn becomes false (punch-out or day end).
  // EmployeeDashboard also calls stopGpsTracking() on punch-out as a first
  // responder; this effect is the safety-net that catches any missed stops
  // and resets the latch so GPS can restart on the next punch-in.
  const isPunchedIn = !!(todayAttendance?.checkIn && !todayAttendance?.checkOut);
  const prevPunchedInRef = useRef<boolean | null>(null);

  useEffect(() => {
    // Skip until attendance data has loaded (null = not yet fetched)
    if (todayAttendance === undefined) return;

    const prev = prevPunchedInRef.current;
    prevPunchedInRef.current = isPunchedIn;

    if (isPunchedIn && !gpsStartedRef.current) {
      // ── Punch-in detected → start GPS ──────────────────────────────────
      gpsStartedRef.current = true;
      startGpsTracking({
        authHeaders: getEmployeeAuthHeaders(),
        throttleMs: 10000,
        onStatus: () => {},
      }).then((stop) => {
        webGpsStopRef.current = stop; // no-op on native; real stop fn on web
      }).catch(() => {
        gpsStartedRef.current = false; // allow retry on next render
        if (!isCapacitorNative) {
          toast({
            title: "Location Permission Denied",
            description: "Enable location access in device settings for GPS tracking.",
            variant: "destructive",
          });
        }
      });
    } else if (!isPunchedIn && prev === true) {
      // ── Punch-out detected → stop GPS (safety-net) ─────────────────────
      gpsStartedRef.current = false;
      if (webGpsStopRef.current) {
        webGpsStopRef.current();
        webGpsStopRef.current = null;
      }
      // Native: stop the foreground service in case Dashboard call was missed
      stopGpsTracking().catch(() => {});
    }
  }, [isPunchedIn, todayAttendance]);

  // On unmount (logout): always stop GPS and clean up
  useEffect(() => {
    return () => {
      if (webGpsStopRef.current) {
        webGpsStopRef.current();
        webGpsStopRef.current = null;
      }
      gpsStartedRef.current = false;
      stopGpsTracking().catch(() => {});
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/employee/logout", {
        method: "POST",
        headers: getEmployeeAuthHeaders(),
      });
    } catch (e) {}
    clearEmployeeToken();
    queryClient.clear();
    setLocation("/employee-login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!employee) return null;

  const permissions = permissionsData?.permissions || {};
  const isDashboard = currentPath === "/employee-portal" || currentPath === "/employee-portal/";

  return (
    <div className="flex h-screen bg-gray-50/50">
      <EmployeeSidebar employee={employee} onLogout={handleLogout} permissions={permissions} />
      <main className={`flex-1 overflow-auto ${isDashboard ? "pt-16 lg:pt-0" : "p-4 lg:p-6 pt-16 lg:pt-6"}`}>
        <Switch>
          <Route path="/employee-portal" component={() => <EmployeeDashboard employee={employee} />} />
          <Route path="/employee-portal/attendance" component={() => <EmployeeAttendance employee={employee} />} />
          <Route path="/employee-portal/payslips" component={() => <EmployeePayslips employee={employee} />} />
          <Route path="/employee-portal/operations" component={() => <EmployeeOperations employee={employee} />} />
          <Route path="/employee-portal/inward" component={() => <EmployeeInward employee={employee} permissions={permissions} />} />
          <Route path="/employee-portal/processing" component={() => <EmployeeProcessing employee={employee} permissions={permissions} />} />
          <Route path="/employee-portal/packing" component={() => <EmployeePacking employee={employee} permissions={permissions} />} />
          <Route path="/employee-portal/stock-movement" component={() => <EmployeeStockMovement employee={employee} permissions={permissions} />} />
          <Route path="/employee-portal/outward" component={() => <EmployeeOutward employee={employee} permissions={permissions} />} />
          <Route path="/employee-portal/trips" component={() => <EmployeeTrips employee={employee} />} />
          <Route path="/employee-portal/tasks" component={() => <EmployeeTasks employee={employee} />} />
          <Route path="/employee-portal/expenses" component={() => <EmployeeExpenses employee={employee} />} />
          <Route path="/employee-portal/leave" component={() => <EmployeeLeave employee={employee} />} />
          <Route path="/employee-portal/calendar" component={() => <EmployeeCalendar employee={employee} />} />
          <Route path="/employee-portal/chat" component={() => <EmployeeChat employee={employee} />} />
          <Route path="/employee-portal/profile" component={() => <EmployeeProfile employee={employee} />} />
          <Route component={() => <EmployeeDashboard employee={employee} />} />
        </Switch>
      </main>
    </div>
  );
}
