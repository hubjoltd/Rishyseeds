import { useAttendance, useEmployees } from "@/hooks/use-hrms";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import type { Employee } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCheck, Clock, MapPin, Pencil, Trash2, Loader2, Users, LogIn, LogOut, UserX } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken } from "@/lib/queryClient";

type AttendanceRecord = {
  id: number;
  employeeId: number;
  date: string;
  status: string;
  shift: string | null;
  checkIn: string | null;
  checkOut: string | null;
  checkInLatitude: string | null;
  checkInLongitude: string | null;
  checkInLocation: string | null;
  checkOutLatitude: string | null;
  checkOutLongitude: string | null;
  checkOutLocation: string | null;
};

function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function Attendance() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const formattedDate = date ? format(date, 'yyyy-MM-dd') : undefined;

  const { data: attendanceData, isLoading } = useAttendance(formattedDate);
  const { data: employees } = useEmployees();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null);
  const [editCheckOut, setEditCheckOut] = useState("");

  const getEmployeeName = (empId: number) => {
    const emp = (employees as Employee[] || []).find(e => e.id === empId);
    return emp ? emp.fullName : `EMP-${empId}`;
  };

  const records = (attendanceData as AttendanceRecord[] || []);
  const allEmployees = (employees as Employee[] || []);
  const totalEmployees = allEmployees.length;
  const punchedInOnly = records.filter(r => r.checkIn && !r.checkOut).length;
  const punchedOut = records.filter(r => r.checkIn && r.checkOut).length;
  const withCheckIn = records.filter(r => r.checkIn).length;
  const notPunched = Math.max(0, totalEmployees - withCheckIn);

  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: number; body: Record<string, string | null> }) => {
      const res = await fetch(`/api/attendance/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Update failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      setEditRecord(null);
      toast({ title: "Updated", description: "Attendance record updated successfully." });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const openEdit = (record: AttendanceRecord) => {
    setEditRecord(record);
    setEditCheckOut(record.checkOut ?? "");
  };

  const handleSave = () => {
    if (!editRecord) return;
    updateMutation.mutate({ id: editRecord.id, body: { checkOut: editCheckOut || "" } });
  };

  const handleRemovePunchOut = () => {
    if (!editRecord) return;
    updateMutation.mutate({
      id: editRecord.id,
      body: {
        checkOut: null,
        checkOutLatitude: null,
        checkOutLongitude: null,
        checkOutLocation: null,
      },
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h2 className="text-3xl font-bold font-display text-primary">Attendance</h2>
        <p className="text-muted-foreground">Daily attendance logs</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Employees</p>
              <p className="text-2xl font-bold text-foreground" data-testid="stat-total-employees">{totalEmployees}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-green-50">
              <LogIn className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Punched In</p>
              <p className="text-2xl font-bold text-green-600" data-testid="stat-punched-in">{punchedInOnly}</p>
              <p className="text-[10px] text-muted-foreground">checked in, not out</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-50">
              <LogOut className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Punched Out</p>
              <p className="text-2xl font-bold text-purple-600" data-testid="stat-punched-out">{punchedOut}</p>
              <p className="text-[10px] text-muted-foreground">completed day</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-red-50">
              <UserX className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Not Punched</p>
              <p className="text-2xl font-bold text-red-500" data-testid="stat-not-punched">{notPunched}</p>
              <p className="text-[10px] text-muted-foreground">no check-in yet</p>
            </div>
          </CardContent>
        </Card>
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
                  <TableHead>Employee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check In Location</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Check Out Location</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center">Loading...</TableCell></TableRow>
                ) : records.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No attendance records for this date.</TableCell></TableRow>
                ) : (
                  records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{getEmployeeName(record.employeeId)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                          record.status === 'present' ? 'bg-green-100 text-green-700' :
                          record.status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {record.status}
                        </span>
                      </TableCell>
                      <TableCell>{record.shift ?? '-'}</TableCell>
                      <TableCell>
                        {record.checkIn ? <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-muted-foreground"/>{record.checkIn}</span> : '-'}
                      </TableCell>
                      <TableCell>
                        {record.checkInLocation ? (
                          <span className="flex items-center gap-1 text-xs" data-testid={`text-checkin-location-${record.id}`}><MapPin className="w-3 h-3 text-green-600" />{record.checkInLocation}</span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {record.checkOut ? <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-muted-foreground"/>{record.checkOut}</span> : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell>
                        {record.checkOutLocation ? (
                          <span className="flex items-center gap-1 text-xs" data-testid={`text-checkout-location-${record.id}`}><MapPin className="w-3 h-3 text-red-600" />{record.checkOutLocation}</span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary"
                          onClick={() => openEdit(record)}
                          data-testid={`button-edit-attendance-${record.id}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!editRecord} onOpenChange={(open) => { if (!open) setEditRecord(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Punch Out</DialogTitle>
          </DialogHeader>
          {editRecord && (
            <div className="space-y-4 py-2">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{getEmployeeName(editRecord.employeeId)}</span>
                {" · "}{editRecord.date}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="checkout-time">Punch Out Time (HH:MM:SS)</Label>
                <Input
                  id="checkout-time"
                  type="text"
                  placeholder="e.g. 18:30:00"
                  value={editCheckOut}
                  onChange={e => setEditCheckOut(e.target.value)}
                  data-testid="input-checkout-time"
                />
                <p className="text-xs text-muted-foreground">Leave empty and click Save to clear the punch out.</p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 gap-1.5"
              onClick={handleRemovePunchOut}
              disabled={updateMutation.isPending}
              data-testid="button-remove-punchout"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove Punch Out
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateMutation.isPending}
              data-testid="button-save-attendance"
            >
              {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
