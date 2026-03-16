import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isSameMonth, addMonths, subMonths, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, Gift, CalendarDays, List } from "lucide-react";
import { getEmployeeToken } from "../EmployeeLogin";

function getHeaders() {
  const t = getEmployeeToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

type CalView = "month" | "list";

interface EmployeeCalendarProps {
  employee: { id: number; fullName: string; employeeId: string };
}

export default function EmployeeCalendar({ employee }: EmployeeCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calView, setCalView] = useState<CalView>("month");

  const { data: holidays = [] } = useQuery<any[]>({
    queryKey: ["/api/holidays"],
    queryFn: async () => {
      const r = await fetch("/api/holidays", { headers: getHeaders() });
      if (!r.ok) return [];
      return r.json();
    },
  });

  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ["/api/employee/chat/people"],
    queryFn: async () => {
      const r = await fetch("/api/employee/chat/people", { headers: getHeaders() });
      if (!r.ok) return [];
      return r.json();
    },
  });

  const { data: attendanceList = [] } = useQuery<any[]>({
    queryKey: ["/api/employee/attendance"],
    queryFn: async () => {
      const r = await fetch("/api/employee/attendance", { headers: getHeaders() });
      if (!r.ok) return [];
      return r.json();
    },
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDow = getDay(monthStart); // 0=Sun

  const isHoliday = (date: Date) => holidays.find(h => isSameDay(new Date(h.date), date));
  const isAttendance = (date: Date) => attendanceList.find((a: any) => {
    const d = a.date || a.createdAt;
    return d && isSameDay(new Date(d), date);
  });

  // Upcoming holidays in the current month and beyond
  const upcomingHolidays = holidays
    .filter(h => new Date(h.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 10);

  // Birthdays (mocked from employees list — real app would have DOB in employee record)
  const thisMonthStr = format(currentMonth, "MM");

  const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="flex flex-col h-full animate-in fade-in">
      {/* Header */}
      <div className="bg-green-700 text-white px-4 pt-5 pb-4 -mx-4 -mt-4 mb-4 flex items-center justify-between">
        <p className="font-semibold text-base">Calendar</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCalView(calView === "month" ? "list" : "month")}
            className="p-1.5 bg-green-600 rounded"
            data-testid="button-toggle-cal-view"
          >
            {calView === "month" ? <List className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {calView === "month" && (
          <>
            {/* Month navigation */}
            <div className="flex items-center justify-between px-1">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 rounded hover:bg-gray-100" data-testid="button-prev-month">
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <span className="font-bold text-gray-800">{format(currentMonth, "MMMM yyyy")}</span>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 rounded hover:bg-gray-100" data-testid="button-next-month">
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            {/* Calendar grid */}
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
              {/* Day headers */}
              <div className="grid grid-cols-7 bg-green-700">
                {DAYS_SHORT.map(d => (
                  <div key={d} className="py-2 text-center text-xs font-semibold text-white">{d}</div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7">
                {Array.from({ length: startDow }, (_, i) => (
                  <div key={`empty-${i}`} className="h-10 border-b border-r border-gray-100" />
                ))}
                {days.map(day => {
                  const holiday = isHoliday(day);
                  const attended = isAttendance(day);
                  const today = isToday(day);
                  const dow = getDay(day);
                  const isSun = dow === 0;

                  return (
                    <div
                      key={day.toISOString()}
                      className={`h-10 flex flex-col items-center justify-center border-b border-r border-gray-100 relative
                        ${today ? "bg-green-700" : holiday ? "bg-red-50" : isSun ? "bg-gray-50" : ""}`}
                      data-testid={`day-${format(day, "yyyy-MM-dd")}`}
                    >
                      <span className={`text-xs font-semibold
                        ${today ? "text-white" : holiday ? "text-red-500" : isSun ? "text-gray-400" : "text-gray-700"}`}>
                        {format(day, "d")}
                      </span>
                      {attended && !today && <div className="w-1 h-1 rounded-full bg-green-500 mt-0.5" />}
                      {holiday && <div className="w-1 h-1 rounded-full bg-red-400 mt-0.5" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 px-1 text-xs text-gray-500">
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-700" /><span>Today</span></div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-50 border border-red-200" /><span>Holiday</span></div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" /><span>Attended</span></div>
            </div>
          </>
        )}

        {/* Holidays section */}
        {upcomingHolidays.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Upcoming Holidays</p>
            <div className="space-y-2">
              {upcomingHolidays.map(h => (
                <div key={h.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2.5 shadow-sm" data-testid={`holiday-${h.id}`}>
                  <div className="w-10 text-center">
                    <p className="text-lg font-bold text-green-700 leading-none">{format(new Date(h.date), "dd")}</p>
                    <p className="text-[10px] text-gray-400">{format(new Date(h.date), "MMM")}</p>
                  </div>
                  <div className="h-10 w-px bg-gray-200" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-700">{h.name}</p>
                    <p className="text-[11px] text-gray-400">{format(new Date(h.date), "EEEE")}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${h.type === "national" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>
                    {h.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* List view - all important dates */}
        {calView === "list" && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">All Holidays</p>
            {holidays.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No holidays configured yet.</div>
            ) : (
              <div className="space-y-2">
                {holidays.map(h => (
                  <div key={h.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2.5">
                    <div className="w-10 text-center">
                      <p className="text-base font-bold text-green-700 leading-none">{format(new Date(h.date), "dd")}</p>
                      <p className="text-[10px] text-gray-400">{format(new Date(h.date), "MMM")}</p>
                      <p className="text-[9px] text-gray-400">{format(new Date(h.date), "yyyy")}</p>
                    </div>
                    <div className="h-10 w-px bg-gray-200" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-700">{h.name}</p>
                      <p className="text-[11px] text-gray-400">{format(new Date(h.date), "EEEE, dd MMMM yyyy")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
