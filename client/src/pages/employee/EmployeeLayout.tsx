import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, Route, Switch } from "wouter";
import { EmployeeSidebar } from "@/components/EmployeeSidebar";
import { Loader2 } from "lucide-react";
import { getEmployeeToken, clearEmployeeToken } from "../EmployeeLogin";
import { useEffect, useRef } from "react";
import { registerPushNotifications } from "@/lib/pushNotifications";
import { requestAllLocationPermissions, startGpsTracking, isCapacitorNative } from "@/lib/native-gps";
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

  // ── GPS tracking ─────────────────────────────────────────────────────────
  // Start once when the employee is punched in. Use gpsStartedRef to avoid
  // restarting on every query refetch or re-render.
  // On native Android: the foreground service runs independently — the cleanup
  // returned from startGpsTracking() is a no-op. Only stopGpsTracking()
  // (called from punch-out in EmployeeDashboard) actually stops the service.
  // On web: we store the real stop function and call it on unmount.
  const isPunchedIn = !!(todayAttendance?.checkIn && !todayAttendance?.checkOut);

  useEffect(() => {
    if (!isPunchedIn || gpsStartedRef.current) return;

    gpsStartedRef.current = true;

    startGpsTracking({
      authHeaders: getEmployeeAuthHeaders(),
      throttleMs: 15000,
      onStatus: () => {},
    }).then((stop) => {
      // On native this is a no-op; on web this is the real watchPosition stop.
      webGpsStopRef.current = stop;
    }).catch(() => {
      gpsStartedRef.current = false; // allow retry
      if (!isCapacitorNative) {
        toast({
          title: "Location Permission Denied",
          description: "Enable location access in device settings for GPS tracking.",
          variant: "destructive",
        });
      }
    });
  }, [isPunchedIn]);

  // On unmount (logout / app close): stop web GPS
  useEffect(() => {
    return () => {
      if (webGpsStopRef.current) {
        webGpsStopRef.current();
        webGpsStopRef.current = null;
      }
      gpsStartedRef.current = false;
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
