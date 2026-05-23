import { useAttendance, useEmployees } from "@/hooks/use-hrms";
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, subMonths, subQuarters, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useMemo, useRef } from "react";
import type { Employee } from "@shared/schema";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  UserCheck, Clock, MapPin, Pencil, Trash2, Loader2, Users, LogIn, LogOut,
  UserX, ChevronLeft, ChevronRight, Download, FileSpreadsheet, FileText,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken } from "@/lib/queryClient";
import * as XLSX from "xlsx";

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
  kmTravelled?: number | null;
};

type FilterType = "total" | "punchedIn" | "punchedOut" | "notPunched";
type PeriodPreset = "today" | "thisWeek" | "thisMonth" | "lastMonth" | "thisQuarter" | "lastQuarter" | "custom";

function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const PAGE_SIZE = 15;

function isoDate(d: Date) { return format(d, "yyyy-MM-dd"); }

function getPeriodDates(preset: PeriodPreset, customStart: Date, customEnd: Date): { startDate: Date; endDate: Date } {
  const now = new Date();
  switch (preset) {
    case "today": return { startDate: now, endDate: now };
    case "thisWeek": {
      const day = now.getDay();
      const mon = new Date(now); mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      return { startDate: mon, endDate: sun };
    }
    case "thisMonth": return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
    case "lastMonth": { const lm = subMonths(now, 1); return { startDate: startOfMonth(lm), endDate: endOfMonth(lm) }; }
    case "thisQuarter": return { startDate: startOfQuarter(now), endDate: endOfQuarter(now) };
    case "lastQuarter": { const lq = subQuarters(now, 1); return { startDate: startOfQuarter(lq), endDate: endOfQuarter(lq) }; }
    case "custom": return { startDate: customStart, endDate: customEnd };
  }
}

export default function Attendance() {
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("today");
  const [customStart, setCustomStart] = useState<Date>(new Date());
  const [customEnd, setCustomEnd] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState<"start" | "end">("start");
  const [filterEmpId, setFilterEmpId] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<FilterType>("total");
  const [page, setPage] = useState(1);
  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null);
  const [editCheckOut, setEditCheckOut] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: employees } = useEmployees();
  const allEmployees = (employees as Employee[] || []);

  const { startDate, endDate } = getPeriodDates(periodPreset, customStart, customEnd);
  const isSingleDay = periodPreset === "today";

  const startStr = isoDate(startDate);
  const endStr = isoDate(endDate);
  const empIdNum = filterEmpId !== "all" ? Number(filterEmpId) : undefined;

  // Single day uses existing attendance API; range uses report API
  const { data: singleDayData, isLoading: singleLoading } = useAttendance(isSingleDay ? startStr : undefined);
  const { data: rangeData, isLoading: rangeLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ["/api/attendance/report", startStr, endStr, filterEmpId],
    queryFn: async () => {
      const params = new URLSearchParams({ startDate: startStr, endDate: endStr });
      if (empIdNum) params.set("employeeId", String(empIdNum));
      const res = await fetch(`/api/attendance/report?${params}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch report");
      return res.json();
    },
    enabled: !isSingleDay,
  });

  const isLoading = isSingleDay ? singleLoading : rangeLoading;
  const rawRecords: AttendanceRecord[] = isSingleDay
    ? ((singleDayData as AttendanceRecord[] || []).filter(r => !empIdNum || r.employeeId === empIdNum))
    : (rangeData || []);

  const getEmployeeName = (empId: number) => {
    const emp = allEmployees.find(e => e.id === empId);
    return emp ? emp.fullName : `EMP-${empId}`;
  };

  // Stats
  const totalEmployees = allEmployees.length;
  const punchedInOnly = rawRecords.filter(r => r.checkIn && !r.checkOut).length;
  const punchedOut = rawRecords.filter(r => r.checkIn && r.checkOut).length;
  const withCheckInIds = useMemo(() => new Set(rawRecords.filter(r => r.checkIn).map(r => r.employeeId)), [rawRecords]);
  const notPunchedCount = isSingleDay ? Math.max(0, (empIdNum ? 1 : totalEmployees) - withCheckInIds.size) : 0;

  // Filtered rows for table
  const filteredRows = useMemo(() => {
    if (activeFilter === "punchedIn") return rawRecords.filter(r => r.checkIn && !r.checkOut);
    if (activeFilter === "punchedOut") return rawRecords.filter(r => r.checkIn && r.checkOut);
    if (activeFilter === "notPunched" && isSingleDay) {
      const empSource = empIdNum ? allEmployees.filter(e => e.id === empIdNum) : allEmployees;
      return empSource
        .filter(e => !withCheckInIds.has(e.id))
        .map(e => ({
          id: -e.id, employeeId: e.id, date: startStr, status: "absent",
          shift: null, checkIn: null, checkOut: null,
          checkInLatitude: null, checkInLongitude: null, checkInLocation: null,
          checkOutLatitude: null, checkOutLongitude: null, checkOutLocation: null,
          kmTravelled: null,
        } as AttendanceRecord));
    }
    return rawRecords;
  }, [activeFilter, rawRecords, allEmployees, withCheckInIds, isSingleDay, empIdNum, startStr]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pagedRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleCardClick = (f: FilterType) => { setActiveFilter(a => a === f ? "total" : f); setPage(1); };
  const handlePeriodChange = (p: PeriodPreset) => { setPeriodPreset(p); setActiveFilter("total"); setPage(1); };
  const handleEmpFilter = (v: string) => { setFilterEmpId(v); setActiveFilter("total"); setPage(1); };

  // Export CSV
  const exportCsv = () => {
    const headers = ["Date", "Employee", "Status", "Shift", "Check In", "Check In Location", "Check Out", "Check Out Location", "KM Travelled"];
    const rows = filteredRows.map(r => [
      r.date, getEmployeeName(r.employeeId), r.status, r.shift ?? "",
      r.checkIn ?? "", r.checkInLocation ?? "", r.checkOut ?? "", r.checkOutLocation ?? "",
      r.kmTravelled != null ? r.kmTravelled : "",
    ]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `attendance_${startStr}_${endStr}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // Export Excel
  const exportExcel = () => {
    const wsData = [
      ["Date", "Employee", "Status", "Shift", "Check In", "Check In Location", "Check Out", "Check Out Location", "KM Travelled"],
      ...filteredRows.map(r => [
        r.date, getEmployeeName(r.employeeId), r.status, r.shift ?? "",
        r.checkIn ?? "", r.checkInLocation ?? "", r.checkOut ?? "", r.checkOutLocation ?? "",
        r.kmTravelled != null ? r.kmTravelled : "",
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [{ wch: 12 }, { wch: 22 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 28 }, { wch: 10 }, { wch: 28 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");
    XLSX.writeFile(wb, `attendance_${startStr}_${endStr}.xlsx`);
  };

  // Export PDF via print
  const exportPdf = () => {
    const rows = filteredRows.map(r => `
      <tr>
        <td>${r.date}</td><td>${getEmployeeName(r.employeeId)}</td>
        <td>${r.status}</td><td>${r.shift ?? "-"}</td>
        <td>${r.checkIn ?? "-"}</td><td>${r.checkInLocation ?? "-"}</td>
        <td>${r.checkOut ?? "-"}</td><td>${r.checkOutLocation ?? "-"}</td>
        <td>${r.kmTravelled != null ? r.kmTravelled + " km" : "-"}</td>
      </tr>`).join("");
    const html = `<html><head><title>Attendance Report</title>
      <style>body{font-family:sans-serif;font-size:11px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:4px 6px;text-align:left}th{background:#f0f0f0}h2{margin-bottom:8px}</style>
      </head><body>
      <h2>Attendance Report — ${startStr === endStr ? startStr : startStr + " to " + endStr}</h2>
      <table><thead><tr><th>Date</th><th>Employee</th><th>Status</th><th>Shift</th><th>Check In</th><th>Check In Location</th><th>Check Out</th><th>Check Out Location</th><th>KM</th></tr></thead>
      <tbody>${rows}</tbody></table></body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 400);
  };

  // Edit / mutations
  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: number; body: Record<string, string | null> }) => {
      const res = await fetch(`/api/attendance/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || "Update failed"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/report"] });
      setEditRecord(null);
      toast({ title: "Updated", description: "Attendance record updated." });
    },
    onError: (err: Error) => { toast({ title: "Error", description: err.message, variant: "destructive" }); },
  });

  const openEdit = (r: AttendanceRecord) => { setEditRecord(r); setEditCheckOut(r.checkOut ?? ""); };
  const handleSave = () => { if (!editRecord) return; updateMutation.mutate({ id: editRecord.id, body: { checkOut: editCheckOut || "" } }); };
  const handleRemovePunchOut = () => {
    if (!editRecord) return;
    updateMutation.mutate({ id: editRecord.id, body: { checkOut: null, checkOutLatitude: null, checkOutLongitude: null, checkOutLocation: null } });
  };

  const periodLabels: Record<PeriodPreset, string> = {
    today: "Today", thisWeek: "This Week", thisMonth: "This Month",
    lastMonth: "Last Month", thisQuarter: "This Quarter", lastQuarter: "Last Quarter", custom: "Custom Range",
  };

  const tableTitle = activeFilter === "punchedIn" ? "Punched In"
    : activeFilter === "punchedOut" ? "Punched Out"
    : activeFilter === "notPunched" ? "Not Punched"
    : startStr === endStr ? format(parseISO(startStr), "MMM dd, yyyy")
    : `${format(parseISO(startStr), "MMM dd")} – ${format(parseISO(endStr), "MMM dd, yyyy")}`;

  const showKm = !isSingleDay || filteredRows.some(r => r.kmTravelled != null);

  return (
    <div className="space-y-5 animate-in fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold font-display text-primary">Attendance</h2>
          <p className="text-muted-foreground text-sm">Daily attendance logs &amp; reports</p>
        </div>
        {/* Export buttons */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv} data-testid="button-export-csv" className="gap-1.5">
            <Download className="w-3.5 h-3.5" />CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportExcel} data-testid="button-export-excel" className="gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5" />Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportPdf} data-testid="button-export-pdf" className="gap-1.5">
            <FileText className="w-3.5 h-3.5" />PDF
          </Button>
        </div>
      </div>

      {/* Period + Employee filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Period</Label>
          <div className="flex flex-wrap gap-1.5">
            {(["today", "thisMonth", "lastMonth", "thisQuarter", "lastQuarter", "custom"] as PeriodPreset[]).map(p => (
              <Button
                key={p}
                variant={periodPreset === p ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => handlePeriodChange(p)}
                data-testid={`button-period-${p}`}
              >
                {periodLabels[p]}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Employee</Label>
          <Select value={filterEmpId} onValueChange={handleEmpFilter}>
            <SelectTrigger className="h-8 w-48 text-xs" data-testid="select-employee-filter">
              <SelectValue placeholder="All Employees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
              {allEmployees.map(e => (
                <SelectItem key={e.id} value={String(e.id)}>{e.fullName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Custom date range pickers */}
        {periodPreset === "custom" && (
          <div className="flex gap-2 items-end">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Start</Label>
              <Input
                type="date"
                className="h-8 text-xs w-36"
                value={isoDate(customStart)}
                onChange={e => { if (e.target.value) { setCustomStart(new Date(e.target.value)); setPage(1); } }}
                data-testid="input-custom-start"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">End</Label>
              <Input
                type="date"
                className="h-8 text-xs w-36"
                value={isoDate(customEnd)}
                onChange={e => { if (e.target.value) { setCustomEnd(new Date(e.target.value)); setPage(1); } }}
                data-testid="input-custom-end"
              />
            </div>
          </div>
        )}
      </div>

      {/* Date range label */}
      {!isSingleDay && (
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Showing: <span className="font-medium text-foreground">{format(startDate, "MMM dd, yyyy")} – {format(endDate, "MMM dd, yyyy")}</span>
          </span>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          className={`border shadow-sm cursor-pointer transition-all duration-150 ${activeFilter === "total" ? "ring-2 ring-blue-500 bg-blue-50/60" : "hover:shadow-md"}`}
          onClick={() => handleCardClick("total")}
          data-testid="card-filter-total"
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50"><Users className="w-5 h-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Records</p>
              <p className="text-2xl font-bold text-foreground" data-testid="stat-total-employees">{rawRecords.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`border shadow-sm cursor-pointer transition-all duration-150 ${activeFilter === "punchedIn" ? "ring-2 ring-green-500 bg-green-50/60" : "hover:shadow-md"}`}
          onClick={() => handleCardClick("punchedIn")}
          data-testid="card-filter-punched-in"
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-green-50"><LogIn className="w-5 h-5 text-green-600" /></div>
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
            <div className="p-2.5 rounded-lg bg-purple-50"><LogOut className="w-5 h-5 text-purple-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Punched Out</p>
              <p className="text-2xl font-bold text-purple-600" data-testid="stat-punched-out">{punchedOut}</p>
              <p className="text-[10px] text-muted-foreground">completed day</p>
            </div>
          </CardContent>
        </Card>
        <Card
          className={`border shadow-sm cursor-pointer transition-all duration-150 ${activeFilter === "notPunched" && isSingleDay ? "ring-2 ring-red-500 bg-red-50/60" : !isSingleDay ? "opacity-60 cursor-default" : "hover:shadow-md"}`}
          onClick={() => isSingleDay && handleCardClick("notPunched")}
          data-testid="card-filter-not-punched"
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-red-50"><UserX className="w-5 h-5 text-red-500" /></div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Not Punched</p>
              <p className="text-2xl font-bold text-red-500" data-testid="stat-not-punched">{isSingleDay ? notPunchedCount : "—"}</p>
              <p className="text-[10px] text-muted-foreground">{isSingleDay ? "no check-in yet" : "single day only"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="min-w-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserCheck className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">{tableTitle}</span>
              {activeFilter !== "total" && (
                <button onClick={() => { setActiveFilter("total"); setPage(1); }} className="text-xs text-muted-foreground hover:text-foreground underline ml-2 flex-shrink-0" data-testid="button-clear-filter">
                  Show all
                </button>
              )}
            </CardTitle>
            <Badge variant="secondary" className="text-xs flex-shrink-0">{filteredRows.length} records</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {!isSingleDay && <TableHead className="min-w-[100px]">Date</TableHead>}
                  <TableHead className="min-w-[140px]">Employee</TableHead>
                  <TableHead className="min-w-[90px]">Status</TableHead>
                  <TableHead className="min-w-[70px]">Shift</TableHead>
                  <TableHead className="min-w-[80px]">Check In</TableHead>
                  <TableHead className="min-w-[140px]">Check In Location</TableHead>
                  <TableHead className="min-w-[80px]">Check Out</TableHead>
                  <TableHead className="min-w-[140px]">Check Out Location</TableHead>
                  <TableHead className="min-w-[80px] text-right">KM</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={isSingleDay ? 9 : 10} className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></TableCell></TableRow>
                ) : pagedRows.length === 0 ? (
                  <TableRow><TableCell colSpan={isSingleDay ? 9 : 10} className="text-center text-muted-foreground py-8">No records found.</TableCell></TableRow>
                ) : (
                  pagedRows.map((record) => (
                    <TableRow key={`${record.id}-${record.date}`}>
                      {!isSingleDay && <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{record.date}</TableCell>}
                      <TableCell className="font-medium whitespace-nowrap">{getEmployeeName(record.employeeId)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                          record.status === "present" ? "bg-green-100 text-green-700" :
                          record.status === "absent" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                        }`}>{record.status}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{record.shift ?? "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {record.checkIn ? <span className="flex items-center gap-1 text-xs"><Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />{record.checkIn}</span> : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        {record.checkInLocation
                          ? <span className="flex items-center gap-1 text-xs" data-testid={`text-checkin-location-${record.id}`}><MapPin className="w-3 h-3 text-green-600 flex-shrink-0" />{record.checkInLocation}</span>
                          : <span className="text-muted-foreground text-xs">-</span>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {record.checkOut ? <span className="flex items-center gap-1 text-xs"><Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />{record.checkOut}</span> : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell>
                        {record.checkOutLocation
                          ? <span className="flex items-center gap-1 text-xs" data-testid={`text-checkout-location-${record.id}`}><MapPin className="w-3 h-3 text-red-600 flex-shrink-0" />{record.checkOutLocation}</span>
                          : <span className="text-muted-foreground text-xs">-</span>}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {record.kmTravelled != null
                          ? <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">{record.kmTravelled} km</span>
                          : <span className="text-muted-foreground text-xs">-</span>}
                      </TableCell>
                      <TableCell>
                        {record.id > 0 && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => openEdit(record)} data-testid={`button-edit-attendance-${record.id}`}>
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
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} data-testid="button-page-prev">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs px-2 font-medium">{page} / {totalPages}</span>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} data-testid="button-page-next">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editRecord} onOpenChange={(open) => { if (!open) setEditRecord(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit Punch Out</DialogTitle></DialogHeader>
          {editRecord && (
            <div className="space-y-4 py-2">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{getEmployeeName(editRecord.employeeId)}</span>{" · "}{editRecord.date}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="checkout-time">Punch Out Time (HH:MM:SS)</Label>
                <Input id="checkout-time" type="text" placeholder="e.g. 18:30:00" value={editCheckOut} onChange={e => setEditCheckOut(e.target.value)} data-testid="input-checkout-time" />
                <p className="text-xs text-muted-foreground">Leave empty and click Save to clear the punch out.</p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 gap-1.5" onClick={handleRemovePunchOut} disabled={updateMutation.isPending} data-testid="button-remove-punchout">
              <Trash2 className="w-3.5 h-3.5" />Remove Punch Out
            </Button>
            <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending} data-testid="button-save-attendance">
              {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
