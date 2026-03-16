import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, X, CalendarDays, ClipboardList, BarChart3, CheckCircle2, Clock, XCircle, Ban } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { getEmployeeToken } from "../EmployeeLogin";

function getHeaders() {
  const t = getEmployeeToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

const LEAVE_CATS = ["Sick Leave", "Casual Leave", "Privilege Leave", "Earned Leave"];

const CAT_ABBR: Record<string, string> = {
  "Sick Leave": "SL",
  "Casual Leave": "CL",
  "Privilege Leave": "PL",
  "Earned Leave": "EL",
};

const CAT_COLOR: Record<string, string> = {
  "Sick Leave": "bg-blue-500",
  "Casual Leave": "bg-purple-500",
  "Privilege Leave": "bg-orange-500",
  "Earned Leave": "bg-teal-500",
};

function fmtDate(dt: string | null | undefined) {
  if (!dt) return "-";
  try { return format(new Date(dt), "dd MMM yyyy"); } catch { return "-"; }
}

function calcDays(start: string, end: string, type: string): number {
  if (!start || !end) return 0;
  const d = Math.abs(differenceInDays(new Date(end), new Date(start))) + 1;
  return type === "half_day" ? 0.5 : d;
}

type Tab = "apply" | "history" | "summary";

interface EmployeeLeaveProps {
  employee: { id: number; fullName: string; employeeId: string };
}

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
    pending:   { label: "Pending",   icon: <Clock className="h-3 w-3" />,         cls: "bg-amber-100 text-amber-700 border-amber-200" },
    approved:  { label: "Approved",  icon: <CheckCircle2 className="h-3 w-3" />,  cls: "bg-green-100 text-green-700 border-green-200" },
    rejected:  { label: "Rejected",  icon: <XCircle className="h-3 w-3" />,       cls: "bg-red-100 text-red-600 border-red-200" },
    cancelled: { label: "Cancelled", icon: <Ban className="h-3 w-3" />,           cls: "bg-gray-100 text-gray-500 border-gray-200" },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${s.cls}`}>
      {s.icon}{s.label}
    </span>
  );
};

export default function EmployeeLeave({ employee }: EmployeeLeaveProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("apply");

  const [leaveType, setLeaveType] = useState<"half_day" | "full_day">("full_day");
  const [category, setCategory] = useState("Sick Leave");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [reason, setReason] = useState("");

  const { data: leaves = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/employee/leaves"],
    queryFn: async () => {
      const r = await fetch("/api/employee/leaves", { headers: getHeaders() });
      if (!r.ok) return [];
      return r.json();
    },
  });

  const { data: balances = [] } = useQuery<any[]>({
    queryKey: ["/api/employee/leave-balances"],
    queryFn: async () => {
      const r = await fetch("/api/employee/leave-balances", { headers: getHeaders() });
      if (!r.ok) return [];
      return r.json();
    },
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/employee/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getHeaders() },
        body: JSON.stringify({ leaveType, leaveCategory: category, startDate, endDate, reason }),
      });
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.message || "Failed"); }
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/employee/leaves"] });
      qc.invalidateQueries({ queryKey: ["/api/employee/leave-balances"] });
      setReason("");
      setStartDate(format(new Date(), "yyyy-MM-dd"));
      setEndDate(format(new Date(), "yyyy-MM-dd"));
      toast({ title: "Leave Applied", description: "Your leave request has been submitted." });
      setTab("history");
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/employee/leaves/${id}/cancel`, { method: "PATCH", headers: getHeaders() });
      if (!r.ok) throw new Error("Failed to cancel");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/employee/leaves"] });
      toast({ title: "Leave Cancelled" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const days = calcDays(startDate, endDate, leaveType);

  const TABS = [
    { key: "apply" as Tab,   label: "Apply",   icon: <CalendarDays className="h-4 w-4" /> },
    { key: "history" as Tab, label: "History", icon: <ClipboardList className="h-4 w-4" /> },
    { key: "summary" as Tab, label: "Summary", icon: <BarChart3 className="h-4 w-4" /> },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-700 to-green-600 text-white px-4 pt-5 pb-0 -mx-4 -mt-4">
        <p className="font-bold text-lg mb-4">Leave Request</p>
        <div className="flex">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-all ${
                tab === t.key
                  ? "border-white text-white"
                  : "border-transparent text-green-200 hover:text-white"
              }`}
              data-testid={`tab-leave-${t.key}`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── APPLY TAB ── */}
      {tab === "apply" && (
        <div className="flex-1 overflow-y-auto py-4 space-y-4">

          {/* Leave Type toggle */}
          <div className="bg-gray-50 rounded-xl p-1 flex gap-1">
            {[{ val: "full_day", label: "Full Day" }, { val: "half_day", label: "Half Day" }].map(opt => (
              <button
                key={opt.val}
                onClick={() => setLeaveType(opt.val as any)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  leaveType === opt.val
                    ? "bg-white shadow text-green-700 border border-green-100"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                data-testid={`radio-leave-${opt.val}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Category chips */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Leave Category</p>
            <div className="grid grid-cols-2 gap-2">
              {LEAVE_CATS.map(c => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    category === c
                      ? "bg-green-700 text-white border-green-700 shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:border-green-300"
                  }`}
                >
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0 ${category === c ? "bg-green-600" : CAT_COLOR[c]}`}>
                    {CAT_ABBR[c]}
                  </span>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Date picker */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Leave Dates</p>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="grid grid-cols-2 divide-x divide-gray-200">
                <div className="p-3">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">From</p>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => { setStartDate(e.target.value); if (leaveType === "half_day") setEndDate(e.target.value); }}
                    className="w-full text-sm text-gray-700 font-medium outline-none bg-transparent"
                    data-testid="input-leave-start"
                  />
                </div>
                <div className={`p-3 ${leaveType === "half_day" ? "opacity-40 pointer-events-none" : ""}`}>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">To</p>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full text-sm text-gray-700 font-medium outline-none bg-transparent"
                    disabled={leaveType === "half_day"}
                    data-testid="input-leave-end"
                  />
                </div>
              </div>
              {days > 0 && (
                <div className="bg-green-50 border-t border-green-100 px-3 py-2 flex items-center justify-center">
                  <span className="text-xs font-bold text-green-700">{days} day{days !== 1 ? "s" : ""} selected</span>
                </div>
              )}
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Reason</p>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Describe your reason for leave..."
              rows={3}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400 placeholder:text-gray-400"
              data-testid="input-leave-reason"
            />
          </div>

          <button
            onClick={() => applyMutation.mutate()}
            disabled={applyMutation.isPending || !startDate || !endDate}
            className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors shadow-sm shadow-green-200"
            data-testid="button-apply-leave"
          >
            {applyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarDays className="h-4 w-4" />}
            Submit Leave Request
          </button>
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {tab === "history" && (
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-green-600" /></div>
          ) : leaves.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <ClipboardList className="h-7 w-7 text-gray-300" />
              </div>
              <p className="text-sm text-gray-400 font-medium">No leave requests yet</p>
              <button onClick={() => setTab("apply")} className="text-xs text-green-700 font-semibold underline underline-offset-2">Apply for leave</button>
            </div>
          ) : (
            leaves.map(leave => {
              const d = calcDays(leave.startDate, leave.endDate, leave.leaveType);
              return (
                <div
                  key={leave.id}
                  className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden"
                  data-testid={`card-leave-${leave.id}`}
                >
                  <div className="flex items-start gap-3 p-4">
                    {/* Abbr badge */}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0 ${CAT_COLOR[leave.leaveCategory] || "bg-gray-400"}`}>
                      {CAT_ABBR[leave.leaveCategory] || "L"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-bold text-gray-800">{leave.leaveCategory}</p>
                        <StatusBadge status={leave.status} />
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{fmtDate(leave.startDate)}</span>
                        {leave.startDate !== leave.endDate && (
                          <>
                            <span className="text-gray-300">→</span>
                            <span>{fmtDate(leave.endDate)}</span>
                          </>
                        )}
                        <span className="ml-auto font-semibold text-green-700">{d} day{d !== 1 ? "s" : ""}</span>
                      </div>

                      <p className="text-[11px] text-gray-400 capitalize mt-0.5">{leave.leaveType?.replace("_", " ")}</p>

                      {leave.reason && (
                        <p className="text-xs text-gray-500 mt-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5 italic">"{leave.reason}"</p>
                      )}
                      {leave.rejectionReason && (
                        <p className="text-xs text-red-500 mt-1.5 bg-red-50 rounded-lg px-2.5 py-1.5">
                          <span className="font-semibold">Rejected:</span> {leave.rejectionReason}
                        </p>
                      )}
                    </div>

                    {(leave.status === "pending" || leave.status === "approved") && (
                      <button
                        onClick={() => cancelMutation.mutate(leave.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors mt-0.5"
                        data-testid={`button-cancel-leave-${leave.id}`}
                        title="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── SUMMARY TAB ── */}
      {tab === "summary" && (
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {balances.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
                <BarChart3 className="h-7 w-7 text-gray-300" />
              </div>
              <p className="text-sm text-gray-400 font-medium">No leave balance configured</p>
            </div>
          ) : (
            <>
              {balances.map((bal: any) => {
                const pct = bal.total > 0 ? Math.round((bal.taken / bal.total) * 100) : 0;
                return (
                  <div key={bal.leaveCategory} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm" data-testid={`row-balance-${bal.leaveCategory}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white ${CAT_COLOR[bal.leaveCategory] || "bg-gray-400"}`}>
                        {CAT_ABBR[bal.leaveCategory] || "L"}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">{bal.leaveCategory}</p>
                        <p className="text-xs text-gray-400">{bal.taken} used of {bal.total} days</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-700">{bal.available}</p>
                        <p className="text-[10px] text-gray-400 uppercase">Available</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pct > 80 ? "bg-red-500" : pct > 50 ? "bg-amber-500" : "bg-green-500"}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 text-right">{pct}% used</p>
                  </div>
                );
              })}

              {/* Total row */}
              <div className="bg-green-700 rounded-2xl p-4 text-white">
                <p className="text-xs font-semibold opacity-70 uppercase tracking-wide mb-3">Total Summary</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: "Total", val: balances.reduce((s: number, b: any) => s + b.total, 0) },
                    { label: "Used", val: balances.reduce((s: number, b: any) => s + b.taken, 0) },
                    { label: "Left", val: balances.reduce((s: number, b: any) => s + b.available, 0) },
                  ].map(item => (
                    <div key={item.label}>
                      <p className="text-xl font-bold">{item.val}</p>
                      <p className="text-[11px] opacity-70">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
