import { useAttendance, useEmployees } from "@/hooks/use-hrms";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useMemo } from "react";
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
import { UserCheck, Clock, MapPin, Pencil, Trash2, Loader2, Users, LogIn, LogOut, UserX, ChevronLeft, ChevronRight } from "lucide-react";
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

type FilterType = "total" | "punchedIn" | "punchedOut" | "notPunched";

function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const PAGE_SIZE = 15;

export default function Attendance() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const formattedDate = date ? format(date, 'yyyy-MM-dd') : undefined;

  const { data: attendanceData, isLoading } = useAttendance(formattedDate);
  const { data: employees } = useEmployees();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null);
  const [editCheckOut, setEditCheckOut] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("total");
  const [page, setPage] = useState(1);

  const getEmployeeName = (empId: number) => {
    const emp = (employees as Employee[] || []).find(e => e.id === empId);
    return emp ? emp.fullName : `EMP-${empId}`;
  };

  const records = (attendanceData as AttendanceRecord[] || []);
  const allEmployees = (employees as Employee[] || []);
  const totalEmployees = allEmployees.length;
  const punchedInOnly = records.filter(r => r.checkIn && !r.checkOut).length;
  const punchedOut = records.filter(r => r.checkIn && r.checkOut).length;
  const withCheckInIds = new Set(records.filter(r => r.checkIn).map(r => r.employeeId));
  const notPunched = Math.max(0, totalEmployees - withCheckInIds.size);

  // Filtered rows — for notPunched we synthesise rows from employee list
  const filteredRows = useMemo(() => {
    if (activeFilter === "punchedIn") return records.filter(r => r.checkIn && !r.checkOut);
    if (activeFilter === "punchedOut") return records.filter(r => r.checkIn && r.checkOut);
    if (activeFilter === "notPunched") {
      // Return fake records for employees with no check-in
      return allEmployees
        .filter(e => !withCheckInIds.has(e.id))
        .map(e => ({
          id: -e.id,
          employeeId: e.id,
          date: formattedDate || "",
          status: "absent",
          shift: null,
          checkIn: null,
          checkOut: null,
          checkInLatitude: null,
          checkInLongitude: null,
          checkInLocation: null,
          checkOutLatitude: null,
          checkOutLongitude: null,
          checkOutLocation: null,
        } as AttendanceRecord));
    }
    return records;
  }, [activeFilter, records, allEmployees, withCheckInIds, formattedDate]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pagedRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleCardClick = (filter: FilterType) => {
    setActiveFilter(f => f === filter ? "total" : filter);
    setPage(1);
  };

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

  const filterLabel: Record<FilterType, string> = {
    total: format(date || new Date(), 'MMMM dd, yyyy'),
    punchedIn: "Punched In Employees",
    punchedOut: "Punched Out Employees",
    notPunched: "Not Punched Employees",
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h2 className="text-3xl font-bold font-display text-primary">Attendance</h2>
        <p className="text-muted-foreground">Daily attendance logs</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          className={`border shadow-sm cursor-pointer transition-all duration-150 ${activeFilter === "total" ? "ring-2 ring-blue-500 bg-blue-50/60" : "hover:shadow-md"}`}
          onClick={() => handleCardClick("total")}
          data-testid="card-filter-total"
        >
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

        <Card
          className={`border shadow-sm cursor-pointer transition-all duration-150 ${activeFilter === "punchedIn" ? "ring-2 ring-green-500 bg-green-50/60" : "hover:shadow-md"}`}
          onClick={() => handleCardClick("punchedIn")}
          data-testid="card-filter-punched-in"
        >
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

        <Card
          className={`border shadow-sm cursor-pointer transition-all duration-150 ${activeFilter === "punchedOut" ? "ring-2 ring-purple-500 bg-purple-50/60" : "hover:shadow-md"}`}
          onClick={() => handleCardClick("punchedOut")}
          data-testid="card-filter-punched-out"
        >
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

        <Card
          className={`border shadow-sm cursor-pointer transition-all duration-150 ${activeFilter === "notPunched" ? "ring-2 ring-red-500 bg-red-50/60" : "hover:shadow-md"}`}
          onClick={() => handleCardClick("notPunched")}
          data-testid="card-filter-not-punched"
        >
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
              onSelect={(d) => { setDate(d); setPage(1); setActiveFilter("total"); }}
              className="rounded-md border shadow-sm"
            />
          </CardContent>
        </Card>

        <Card className="flex-1 min-w-0">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCheck className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">{filterLabel[activeFilter]}</span>
              {activeFilter !== "total" && (
                <button
                  onClick={() => { setActiveFilter("total"); setPage(1); }}
                  className="ml-auto flex-shrink-0 text-xs text-muted-foreground hover:text-foreground underline"
                  data-testid="button-clear-filter"
                >
                  Show all
                </button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[140px]">Employee</TableHead>
                    <TableHead className="min-w-[90px]">Status</TableHead>
                    <TableHead className="min-w-[70px]">Shift</TableHead>
                    <TableHead className="min-w-[80px]">Check In</TableHead>
                    <TableHead className="min-w-[140px]">Check In Location</TableHead>
                    <TableHead className="min-w-[80px]">Check Out</TableHead>
                    <TableHead className="min-w-[140px]">Check Out Location</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></TableCell></TableRow>
                  ) : pagedRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pagedRows.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium whitespace-nowrap">{getEmployeeName(record.employeeId)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                            record.status === 'present' ? 'bg-green-100 text-green-700' :
                            record.status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {record.status}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{record.shift ?? '-'}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {record.checkIn ? <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-muted-foreground flex-shrink-0"/>{record.checkIn}</span> : '-'}
                        </TableCell>
                        <TableCell>
                          {record.checkInLocation ? (
                            <span className="flex items-center gap-1 text-xs" data-testid={`text-checkin-location-${record.id}`}><MapPin className="w-3 h-3 text-green-600 flex-shrink-0" />{record.checkInLocation}</span>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {record.checkOut ? <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-muted-foreground flex-shrink-0"/>{record.checkOut}</span> : <span className="text-muted-foreground text-xs">—</span>}
                        </TableCell>
                        <TableCell>
                          {record.checkOutLocation ? (
                            <span className="flex items-center gap-1 text-xs" data-testid={`text-checkout-location-${record.id}`}><MapPin className="w-3 h-3 text-red-600 flex-shrink-0" />{record.checkOutLocation}</span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {record.id > 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-primary"
                              onClick={() => openEdit(record)}
                              data-testid={`button-edit-attendance-${record.id}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {filteredRows.length > PAGE_SIZE && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-xs text-muted-foreground">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredRows.length)} of {filteredRows.length}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    data-testid="button-page-prev"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs px-2 font-medium">{page} / {totalPages}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    data-testid="button-page-next"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
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
