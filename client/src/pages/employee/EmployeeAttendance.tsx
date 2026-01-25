import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Loader2 } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";
import { getEmployeeToken } from "../EmployeeLogin";

function getEmployeeAuthHeaders(): Record<string, string> {
  const token = getEmployeeToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface EmployeeAttendanceProps {
  employee: {
    fullName: string;
    employeeId: string;
  };
}

export default function EmployeeAttendance({ employee }: EmployeeAttendanceProps) {
  const { data: attendance, isLoading } = useQuery({
    queryKey: ["/api/employee/attendance"],
    queryFn: async () => {
      const res = await fetch("/api/employee/attendance", { headers: getEmployeeAuthHeaders() });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const formatDuration = (punchIn: string, punchOut: string | null) => {
    if (!punchOut) return "-";
    const minutes = differenceInMinutes(new Date(punchOut), new Date(punchIn));
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const thisMonthAttendance = attendance?.filter((a: any) => {
    const date = new Date(a.date);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }) || [];

  const lastMonthAttendance = attendance?.filter((a: any) => {
    const date = new Date(a.date);
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
  }) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance History</h1>
        <p className="text-muted-foreground">View your attendance records</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" /> This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{thisMonthAttendance.length}</p>
            <p className="text-xs text-muted-foreground">Days Present</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Last Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{lastMonthAttendance.length}</p>
            <p className="text-xs text-muted-foreground">Days Present</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" /> Total Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">{attendance?.length || 0}</p>
            <p className="text-xs text-muted-foreground">All Time</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Attendance Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : attendance?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No attendance records found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Punch In</TableHead>
                    <TableHead>Punch Out</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance?.slice(0, 30).map((record: any) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {format(new Date(record.date), "EEE, MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {record.checkIn ? format(new Date(record.checkIn), "h:mm a") : "-"}
                      </TableCell>
                      <TableCell>
                        {record.checkOut ? format(new Date(record.checkOut), "h:mm a") : "-"}
                      </TableCell>
                      <TableCell>
                        {formatDuration(record.checkIn, record.checkOut)}
                      </TableCell>
                      <TableCell>
                        {record.checkOut ? (
                          <Badge className="bg-green-100 text-green-700">Completed</Badge>
                        ) : record.checkIn ? (
                          <Badge className="bg-amber-100 text-amber-700">Working</Badge>
                        ) : (
                          <Badge variant="outline">Absent</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
