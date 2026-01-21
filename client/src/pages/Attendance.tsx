import { useAttendance } from "@/hooks/use-hrms";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserCheck, Clock } from "lucide-react";

export default function Attendance() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const formattedDate = date ? format(date, 'yyyy-MM-dd') : undefined;
  
  const { data: attendanceData, isLoading } = useAttendance(formattedDate);

  return (
    <div className="space-y-8 animate-in fade-in">
      <div>
        <h2 className="text-3xl font-bold font-display text-primary">Attendance</h2>
        <p className="text-muted-foreground">Daily attendance logs</p>
      </div>

      <div className="grid md:grid-cols-[300px_1fr] gap-8">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-sm uppercase text-muted-foreground">Select Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border shadow-sm"
            />
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              Logs for {date ? format(date, 'MMMM dd, yyyy') : 'Selected Date'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center">Loading...</TableCell></TableRow>
                ) : attendanceData?.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No attendance records for this date.</TableCell></TableRow>
                ) : (
                  attendanceData?.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.employeeId}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                          record.status === 'present' ? 'bg-green-100 text-green-700' : 
                          record.status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {record.status}
                        </span>
                      </TableCell>
                      <TableCell>{record.shift}</TableCell>
                      <TableCell className="flex items-center gap-1">
                         {record.checkIn ? <><Clock className="w-3 h-3 text-muted-foreground"/> {record.checkIn}</> : '-'}
                      </TableCell>
                      <TableCell>
                        {record.checkOut ? <><Clock className="w-3 h-3 text-muted-foreground"/> {record.checkOut}</> : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
