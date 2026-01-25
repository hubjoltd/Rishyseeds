import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, LogOut, Clock, User, FileText, Calendar, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import logo from "@assets/20260121014034_1768984704057.webp";

export default function EmployeePanel() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: employee, isLoading } = useQuery({
    queryKey: ["/api/employee/me"],
    queryFn: async () => {
      const res = await fetch("/api/employee/me", { credentials: "include" });
      if (res.status === 401) {
        setLocation("/employee-login");
        return null;
      }
      if (!res.ok) throw new Error("Failed to fetch employee data");
      return res.json();
    },
  });

  const { data: attendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ["/api/employee/attendance"],
    queryFn: async () => {
      const res = await fetch("/api/employee/attendance", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch attendance");
      return res.json();
    },
    enabled: !!employee,
  });

  const { data: payslips, isLoading: payslipsLoading } = useQuery({
    queryKey: ["/api/employee/payslips"],
    queryFn: async () => {
      const res = await fetch("/api/employee/payslips", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch payslips");
      return res.json();
    },
    enabled: !!employee,
  });

  const { data: todayAttendance, isLoading: todayLoading } = useQuery({
    queryKey: ["/api/employee/attendance/today"],
    queryFn: async () => {
      const res = await fetch("/api/employee/attendance/today", { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!employee,
  });

  const punchMutation = useMutation({
    mutationFn: async (type: "in" | "out") => {
      const res = await fetch(`/api/employee/punch-${type}`, {
        method: "POST",
        credentials: "include",
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
      toast({ title: "Success", description: `Punched ${type} successfully` });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/employee/logout", { method: "POST", credentials: "include" });
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/employee/me"], null);
      queryClient.clear();
      setLocation("/employee-login");
    },
  });

  const downloadPayslip = async (payrollId: number, month: string) => {
    try {
      const res = await fetch(`/api/employee/payslips/${payrollId}/download`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to download payslip");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payslip-${month}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({ title: "Error", description: "Failed to download payslip", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!employee) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/10">
      <header className="bg-background border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src={logo} alt="Rishi Seeds" className="h-10 w-auto" />
          <div>
            <h1 className="font-bold text-lg">Employee Portal</h1>
            <p className="text-sm text-muted-foreground">{employee.fullName}</p>
          </div>
        </div>
        <Button variant="ghost" onClick={() => logoutMutation.mutate()} data-testid="button-logout">
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </header>

      <main className="p-6 max-w-6xl mx-auto space-y-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Punch In / Out
            </CardTitle>
            <CardDescription>Record your attendance for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1">
                <p className="text-lg font-medium">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
                {todayAttendance ? (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Punch In: <span className="font-medium text-foreground">{todayAttendance.checkIn || "Not recorded"}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Punch Out: <span className="font-medium text-foreground">{todayAttendance.checkOut || "Not recorded"}</span>
                    </p>
                    <Badge variant={todayAttendance.status === "present" ? "default" : "secondary"}>
                      {todayAttendance.status}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-2">No attendance recorded yet today</p>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => punchMutation.mutate("in")}
                  disabled={punchMutation.isPending || todayAttendance?.checkIn}
                  className="min-w-32"
                  data-testid="button-punch-in"
                >
                  {punchMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Punch In"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => punchMutation.mutate("out")}
                  disabled={punchMutation.isPending || !todayAttendance?.checkIn || todayAttendance?.checkOut}
                  className="min-w-32"
                  data-testid="button-punch-out"
                >
                  {punchMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Punch Out"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" data-testid="tab-profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="attendance" data-testid="tab-attendance">
              <Calendar className="h-4 w-4 mr-2" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="payslips" data-testid="tab-payslips">
              <FileText className="h-4 w-4 mr-2" />
              Payslips
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Employee Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Employee ID</p>
                      <p className="font-medium">{employee.employeeId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="font-medium">{employee.fullName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Role / Designation</p>
                      <p className="font-medium">{employee.role}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Department</p>
                      <p className="font-medium">{employee.department || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Work Location</p>
                      <p className="font-medium">{employee.workLocation || "-"}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{employee.phone || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{employee.email || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Join Date</p>
                      <p className="font-medium">{employee.joinDate ? format(new Date(employee.joinDate), "PP") : "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant={employee.status === "active" ? "default" : "secondary"}>
                        {employee.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle>Attendance History</CardTitle>
              </CardHeader>
              <CardContent>
                {attendanceLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Shift</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(attendance || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No attendance records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      (attendance || []).map((record: any) => (
                        <TableRow key={record.id} data-testid={`row-attendance-${record.id}`}>
                          <TableCell>{format(new Date(record.date), "PP")}</TableCell>
                          <TableCell>{record.checkIn || "-"}</TableCell>
                          <TableCell>{record.checkOut || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={record.status === "present" ? "default" : "secondary"}>
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{record.shift || "-"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payslips">
            <Card>
              <CardHeader>
                <CardTitle>Payslips</CardTitle>
                <CardDescription>Download your monthly salary slips</CardDescription>
              </CardHeader>
              <CardContent>
                {payslipsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Basic Pay</TableHead>
                      <TableHead>Allowances</TableHead>
                      <TableHead>Deductions</TableHead>
                      <TableHead>Net Salary</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(payslips || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No payslips found
                        </TableCell>
                      </TableRow>
                    ) : (
                      (payslips || []).map((payslip: any) => (
                        <TableRow key={payslip.id} data-testid={`row-payslip-${payslip.id}`}>
                          <TableCell className="font-medium">{payslip.month}</TableCell>
                          <TableCell>{Number(payslip.basicPay).toLocaleString()}</TableCell>
                          <TableCell>{Number(payslip.allowances || 0).toLocaleString()}</TableCell>
                          <TableCell>{Number(payslip.deductions || 0).toLocaleString()}</TableCell>
                          <TableCell className="font-bold">{Number(payslip.netSalary).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={payslip.status === "paid" ? "default" : "secondary"}>
                              {payslip.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadPayslip(payslip.id, payslip.month)}
                              data-testid={`button-download-payslip-${payslip.id}`}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
