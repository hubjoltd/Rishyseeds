import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, Route, Switch } from "wouter";
import { EmployeeSidebar } from "@/components/EmployeeSidebar";
import { Loader2 } from "lucide-react";
import { getEmployeeToken, clearEmployeeToken } from "../EmployeeLogin";
import EmployeeDashboard from "./EmployeeDashboard";
import EmployeeAttendance from "./EmployeeAttendance";
import EmployeePayslips from "./EmployeePayslips";
import EmployeeOperations from "./EmployeeOperations";

function getEmployeeAuthHeaders(): Record<string, string> {
  const token = getEmployeeToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
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

  return (
    <div className="flex h-screen bg-gray-50/50">
      <EmployeeSidebar employee={employee} onLogout={handleLogout} />
      <main className="flex-1 overflow-auto p-4 lg:p-6 pt-16 lg:pt-6">
        <Switch>
          <Route path="/employee-portal" component={() => <EmployeeDashboard employee={employee} />} />
          <Route path="/employee-portal/attendance" component={() => <EmployeeAttendance employee={employee} />} />
          <Route path="/employee-portal/payslips" component={() => <EmployeePayslips employee={employee} />} />
          <Route path="/employee-portal/operations" component={() => <EmployeeOperations employee={employee} />} />
          <Route component={() => <EmployeeDashboard employee={employee} />} />
        </Switch>
      </main>
    </div>
  );
}
