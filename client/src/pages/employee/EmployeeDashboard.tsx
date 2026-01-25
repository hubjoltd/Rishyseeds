import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, FileText, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { getEmployeeToken } from "../EmployeeLogin";

function getEmployeeAuthHeaders(): Record<string, string> {
  const token = getEmployeeToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
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

  const { data: todayAttendance, isLoading: todayLoading } = useQuery({
    queryKey: ["/api/employee/attendance/today"],
    queryFn: async () => {
      const res = await fetch("/api/employee/attendance/today", { headers: getEmployeeAuthHeaders() });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: attendance } = useQuery({
    queryKey: ["/api/employee/attendance"],
    queryFn: async () => {
      const res = await fetch("/api/employee/attendance", { headers: getEmployeeAuthHeaders() });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: payslips } = useQuery({
    queryKey: ["/api/employee/payslips"],
    queryFn: async () => {
      const res = await fetch("/api/employee/payslips", { headers: getEmployeeAuthHeaders() });
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
      });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const isPunchedIn = todayAttendance?.punchIn && !todayAttendance?.punchOut;
  const isPunchedOut = todayAttendance?.punchIn && todayAttendance?.punchOut;

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
            {todayAttendance?.punchIn ? (
              <p className="text-lg font-semibold">{format(new Date(todayAttendance.punchIn), "h:mm a")}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Not punched in</p>
            )}
          </CardContent>
        </Card>
      </div>

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
              onClick={() => punchMutation.mutate("in")}
              disabled={punchMutation.isPending || !!todayAttendance?.punchIn}
              className="flex-1 bg-green-600 hover:bg-green-700"
              data-testid="button-punch-in"
            >
              {punchMutation.isPending ? (
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
              disabled={punchMutation.isPending || !todayAttendance?.punchIn || !!todayAttendance?.punchOut}
              className="flex-1"
              data-testid="button-punch-out"
            >
              {punchMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Punch Out
            </Button>
          </div>

          {todayAttendance && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Today's Record</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Punch In:</span>
                  <span className="ml-2 font-medium">
                    {todayAttendance.punchIn ? format(new Date(todayAttendance.punchIn), "h:mm a") : "-"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Punch Out:</span>
                  <span className="ml-2 font-medium">
                    {todayAttendance.punchOut ? format(new Date(todayAttendance.punchOut), "h:mm a") : "-"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
