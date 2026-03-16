import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, X, ArrowLeft } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { getEmployeeToken } from "../EmployeeLogin";

function getHeaders() {
  const t = getEmployeeToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

const LEAVE_CATS = ["Sick Leave", "Casual Leave", "Privilege Leave", "Earned Leave"];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
};

const CAT_ICON: Record<string, string> = {
  "Sick Leave": "SL",
  "Casual Leave": "CL",
  "Privilege Leave": "PL",
  "Earned Leave": "EL",
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

export default function EmployeeLeave({ employee }: EmployeeLeaveProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("apply");
  const [showForm, setShowForm] = useState(true);

  // Apply form
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

  const TABS: { key: Tab; label: string }[] = [
    { key: "apply", label: "Apply" },
    { key: "history", label: "History" },
    { key: "summary", label: "Summary" },
  ];

  return (
    <div className="flex flex-col h-full animate-in fade-in">
      {/* Header */}
      <div className="bg-green-700 text-white px-4 pt-5 pb-0 -mx-4 -mt-4 mb-0">
        <p className="font-semibold text-base mb-3 px-0">Leave</p>
        <div className="flex border-b border-green-600">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 text-sm font-semibold border-b-2 transition-colors ${tab === t.key ? "border-white text-white" : "border-transparent text-green-200 hover:text-white"}`}
              data-testid={`tab-leave-${t.key}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Apply Tab */}
      {tab === "apply" && (
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Leave Type */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-500">Leave Type</p>
            <div className="flex gap-6">
              {[{ val: "half_day", label: "Half Day" }, { val: "full_day", label: "Full Day" }].map(opt => (
                <label key={opt.val} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input
                    type="radio"
                    name="leaveType"
                    value={opt.val}
                    checked={leaveType === opt.val}
                    onChange={() => setLeaveType(opt.val as any)}
                    className="accent-green-600"
                    data-testid={`radio-leave-${opt.val}`}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Leave Category */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-gray-500">Leave Category</p>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-green-600"
              data-testid="select-leave-category"
            >
              {LEAVE_CATS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Dates */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-gray-500">Leave Date</p>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={e => { setStartDate(e.target.value); if (leaveType === "half_day") setEndDate(e.target.value); }}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                data-testid="input-leave-start"
              />
              <span className="text-gray-400 text-sm">to</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                min={startDate}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                disabled={leaveType === "half_day"}
                data-testid="input-leave-end"
              />
            </div>
            {days > 0 && (
              <p className="text-[11px] text-green-700 font-medium">{days} day{days !== 1 ? "s" : ""}</p>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-gray-500">Reason</p>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Enter reason..."
              rows={4}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-green-600"
              data-testid="input-leave-reason"
            />
          </div>

          <button
            onClick={() => applyMutation.mutate()}
            disabled={applyMutation.isPending || !startDate || !endDate}
            className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white font-bold py-3 rounded-md text-sm flex items-center justify-center gap-2 transition-colors"
            data-testid="button-apply-leave"
          >
            {applyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Leave Apply
          </button>
        </div>
      )}

      {/* History Tab */}
      {tab === "history" && (
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-green-600" /></div>
          ) : leaves.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                <Plus className="h-6 w-6 text-gray-300" />
              </div>
              <p className="text-sm">No leave history yet</p>
            </div>
          ) : (
            leaves.map(leave => (
              <div key={leave.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm" data-testid={`card-leave-${leave.id}`}>
                {/* Status bar */}
                <div className={`px-3 py-1.5 flex items-center justify-between ${leave.status === "approved" ? "bg-green-50" : leave.status === "rejected" ? "bg-red-50" : "bg-amber-50"}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${leave.status === "approved" ? "bg-green-600 text-white" : leave.status === "rejected" ? "bg-red-500 text-white" : "bg-amber-500 text-white"}`}>
                      {CAT_ICON[leave.leaveCategory] || "L"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {leave.leaveCategory}
                        <span className={`ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded border ${STATUS_COLORS[leave.status] || STATUS_COLORS.pending}`}>
                          {leave.status === "pending" ? "Pending Approval" : leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                        </span>
                      </p>
                    </div>
                  </div>
                  {(leave.status === "pending" || leave.status === "approved") && (
                    <button
                      onClick={() => cancelMutation.mutate(leave.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      data-testid={`button-cancel-leave-${leave.id}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="px-3 py-2.5 space-y-1">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{fmtDate(leave.startDate)}</span>
                    <span>{fmtDate(leave.endDate)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-400 capitalize">{leave.leaveType?.replace("_", " ")}</span>
                    <span className="text-[11px] font-semibold text-green-700">
                      {calcDays(leave.startDate, leave.endDate, leave.leaveType)} day{calcDays(leave.startDate, leave.endDate, leave.leaveType) !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {leave.reason && <p className="text-xs text-gray-500 italic">{leave.reason}</p>}
                  {leave.rejectionReason && (
                    <p className="text-xs text-red-600 italic">Reason: {leave.rejectionReason}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Summary Tab */}
      {tab === "summary" && (
        <div className="flex-1 overflow-y-auto py-4">
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-green-700 text-white">
                  <th className="text-left px-3 py-2.5 font-semibold text-xs">Type</th>
                  <th className="text-center px-3 py-2.5 font-semibold text-xs">Total</th>
                  <th className="text-center px-3 py-2.5 font-semibold text-xs">Taken</th>
                  <th className="text-center px-3 py-2.5 font-semibold text-xs">Available</th>
                </tr>
              </thead>
              <tbody>
                {balances.map((bal, i) => (
                  <tr key={bal.leaveCategory} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"} data-testid={`row-balance-${bal.leaveCategory}`}>
                    <td className="px-3 py-2.5 text-xs text-gray-700 font-medium">{bal.leaveCategory}</td>
                    <td className="px-3 py-2.5 text-xs text-center text-gray-600">{bal.total}</td>
                    <td className="px-3 py-2.5 text-xs text-center text-amber-600 font-medium">{bal.taken}</td>
                    <td className="px-3 py-2.5 text-xs text-center text-green-700 font-bold">{bal.available}</td>
                  </tr>
                ))}
                {balances.length > 0 && (
                  <tr className="bg-gray-100 font-semibold border-t border-gray-200">
                    <td className="px-3 py-2.5 text-xs text-gray-700">Total</td>
                    <td className="px-3 py-2.5 text-xs text-center text-gray-600">{balances.reduce((s: number, b: any) => s + b.total, 0)}</td>
                    <td className="px-3 py-2.5 text-xs text-center text-amber-600">{balances.reduce((s: number, b: any) => s + b.taken, 0)}</td>
                    <td className="px-3 py-2.5 text-xs text-center text-green-700">{balances.reduce((s: number, b: any) => s + b.available, 0)}</td>
                  </tr>
                )}
              </tbody>
            </table>
            {balances.length === 0 && (
              <div className="py-8 text-center text-gray-400 text-sm">No leave balance configured yet.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
