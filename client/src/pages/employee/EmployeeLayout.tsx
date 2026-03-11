import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, Route, Switch } from "wouter";
import { EmployeeSidebar } from "@/components/EmployeeSidebar";
import { Loader2 } from "lucide-react";
import { getEmployeeToken, clearEmployeeToken } from "../EmployeeLogin";
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
import EmployeeExpenses from "./EmployeeExpenses";

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
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: employee, isLoading } = useQuery({
    queryKey: ["/api/employee/me"],
    queryFn: async () => {
      const token = getEmployeeToken();
      if (!token) {
        setLocation("/employee-login");
        return null;
      }
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

  if (!employee) {
    return null;
  }

  const permissions = permissionsData?.permissions || {};

  return (
    <div className="flex h-screen bg-gray-50/50">
      <EmployeeSidebar employee={employee} onLogout={handleLogout} permissions={permissions} />
      <main className="flex-1 overflow-auto p-4 lg:p-6 pt-16 lg:pt-6">
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
          <Route path="/employee-portal/expenses" component={() => <EmployeeExpenses employee={employee} />} />
          <Route path="/employee-portal/profile" component={() => <EmployeeProfile employee={employee} />} />
          <Route component={() => <EmployeeDashboard employee={employee} />} />
        </Switch>
      </main>
    </div>
  );
}
