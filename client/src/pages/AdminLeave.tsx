import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, CheckCircle2, XCircle, CalendarDays, Settings2,
  ChevronRight, X, Search, Save, Clock, Ban, User, CalendarCheck
} from "lucide-react";
import { format } from "date-fns";
import { getAuthToken } from "@/lib/queryClient";

function getAuthHeader(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function fmtDate(dt: string | null | undefined) {
  if (!dt) return "-";
  try { return format(new Date(dt), "dd MMM yyyy"); } catch { return "-"; }
}

const LEAVE_CATS = ["Sick Leave", "Casual Leave", "Privilege Leave", "Earned Leave"];

const CAT_COLOR: Record<string, string> = {
  "Sick Leave": "bg-blue-500",
  "Casual Leave": "bg-purple-500",
  "Privilege Leave": "bg-orange-500",
  "Earned Leave": "bg-teal-500",
};

const CAT_ABBR: Record<string, string> = {
  "Sick Leave": "SL",
  "Casual Leave": "CL",
  "Privilege Leave": "PL",
  "Earned Leave": "EL",
};

type Tab = "requests" | "config";

const StatusConfig: Record<string, { label: string; icon: React.ReactNode; pill: string; dot: string }> = {
  pending:   { label: "Pending Approval", icon: <Clock className="h-3.5 w-3.5" />,        pill: "bg-amber-100 text-amber-700 border-amber-200",  dot: "bg-amber-400" },
  approved:  { label: "Approved",         icon: <CheckCircle2 className="h-3.5 w-3.5" />, pill: "bg-green-100 text-green-700 border-green-200",  dot: "bg-green-500" },
  rejected:  { label: "Rejected",         icon: <XCircle className="h-3.5 w-3.5" />,      pill: "bg-red-100 text-red-600 border-red-200",        dot: "bg-red-500" },
  cancelled: { label: "Cancelled",        icon: <Ban className="h-3.5 w-3.5" />,          pill: "bg-gray-100 text-gray-500 border-gray-200",     dot: "bg-gray-400" },
};

export default function AdminLeave() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("requests");
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [configEmpSearch, setConfigEmpSearch] = useState("");
  const [selectedConfigEmp, setSelectedConfigEmp] = useState<any | null>(null);
  const [configValues, setConfigValues] = useState({
    sickLeaveQuota: 7, casualLeaveQuota: 7, privilegeLeaveQuota: 8, earnedLeaveQuota: 0,
    weeklyOff: "Sunday", workingHours: "8",
  });

  const { data: leaves = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/leaves"],
    queryFn: async () => {
      const r = await fetch("/api/leaves", { headers: getAuthHeader() });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ["/api/employees"],
    queryFn: async () => {
      const r = await fetch("/api/employees", { headers: getAuthHeader() });
      if (!r.ok) return [];
      return r.json();
    },
  });

  useQuery<any>({
    queryKey: ["/api/employee-config", selectedConfigEmp?.id],
    queryFn: async () => {
      const r = await fetch(`/api/employee-config/${selectedConfigEmp.id}`, { headers: getAuthHeader() });
      if (!r.ok) return null;
      return r.json();
    },
    enabled: !!selectedConfigEmp,
    onSuccess: (data: any) => {
      if (data) setConfigValues({
        sickLeaveQuota: data.sickLeaveQuota ?? 7,
        casualLeaveQuota: data.casualLeaveQuota ?? 7,
        privilegeLeaveQuota: data.privilegeLeaveQuota ?? 8,
        earnedLeaveQuota: data.earnedLeaveQuota ?? 0,
        weeklyOff: data.weeklyOff ?? "Sunday",
        workingHours: String(data.workingHours ?? "8"),
      });
    },
  } as any);

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/leaves/${id}/approve`, { method: "PATCH", headers: getAuthHeader() });
      if (!r.ok) throw new Error("Failed to approve");
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/leaves"] }); toast({ title: "Leave Approved" }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const r = await fetch(`/api/leaves/${id}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ reason }),
      });
      if (!r.ok) throw new Error("Failed to reject");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/leaves"] });
      setRejectId(null);
      setRejectReason("");
      toast({ title: "Leave Rejected" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const saveConfigMutation = useMutation({
    mutationFn: async () => {
      if (!selectedConfigEmp) return;
      const r = await fetch("/api/employee-config", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ employeeDbId: selectedConfigEmp.id, ...configValues }),
      });
      if (!r.ok) throw new Error("Failed to save config");
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/employee-config", selectedConfigEmp?.id] });
      toast({ title: "Configuration Saved", description: `Updated for ${selectedConfigEmp?.fullName}` });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = leaves.filter(l => filterStatus === "all" ? true : l.status === filterStatus);
  const filteredEmps = employees.filter((e: any) =>
    e.fullName?.toLowerCase().includes(configEmpSearch.toLowerCase()) ||
    e.employeeId?.toLowerCase().includes(configEmpSearch.toLowerCase())
  );

  const counts = {
    pending:  leaves.filter(l => l.status === "pending").length,
    approved: leaves.filter(l => l.status === "approved").length,
    rejected: leaves.filter(l => l.status === "rejected").length,
    all:      leaves.length,
  };

  const STATUS_FILTERS = [
    { key: "pending",  label: "Pending",  count: counts.pending },
    { key: "approved", label: "Approved", count: counts.approved },
    { key: "rejected", label: "Rejected", count: counts.rejected },
    { key: "all",      label: "All",      count: counts.all },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* ── Page Header ── */}
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-green-700 flex items-center justify-center shadow-sm">
          <CalendarDays className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-sm text-gray-500">Review requests and configure leave policies</p>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Pending",  val: counts.pending,  color: "text-amber-600",  bg: "bg-amber-50 border-amber-100" },
          { label: "Approved", val: counts.approved, color: "text-green-700",  bg: "bg-green-50 border-green-100" },
          { label: "Rejected", val: counts.rejected, color: "text-red-600",    bg: "bg-red-50 border-red-100" },
          { label: "Total",    val: counts.all,      color: "text-gray-700",   bg: "bg-gray-50 border-gray-100" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-3 text-center ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-gray-200 gap-1">
        {[
          { key: "requests" as Tab, label: "Leave Requests",     icon: <CalendarCheck className="h-4 w-4" /> },
          { key: "config"   as Tab, label: "Leave Configuration", icon: <Settings2 className="h-4 w-4" /> },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              tab === t.key ? "border-green-700 text-green-700" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            data-testid={`tab-admin-leave-${t.key}`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── REQUESTS TAB ── */}
      {tab === "requests" && (
        <div className="space-y-4">
          {/* Filter chips */}
          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilterStatus(f.key)}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  filterStatus === f.key
                    ? "bg-green-700 text-white border-green-700 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-green-400"
                }`}
                data-testid={`filter-leave-${f.key}`}
              >
                {f.label}
                {f.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${filterStatus === f.key ? "bg-green-600" : "bg-gray-100 text-gray-500"}`}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-green-700" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto">
                <CalendarDays className="h-7 w-7 text-gray-300" />
              </div>
              <p className="text-sm text-gray-400 font-medium">No {filterStatus !== "all" ? filterStatus : ""} requests found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(leave => {
                const sc = StatusConfig[leave.status] || StatusConfig.pending;
                return (
                  <div
                    key={leave.id}
                    className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden"
                    data-testid={`card-admin-leave-${leave.id}`}
                  >
                    <div className="p-4 flex items-start gap-4">
                      {/* Category badge */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0 ${CAT_COLOR[leave.leaveCategory] || "bg-gray-400"}`}>
                        {CAT_ABBR[leave.leaveCategory] || "L"}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Name + status */}
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <p className="font-bold text-gray-900 text-sm">{leave.employeeName}</p>
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{leave.employeeCode}</span>
                          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${sc.pill}`}>
                            {sc.icon}{sc.label}
                          </span>
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1.5">
                          {[
                            { label: "Category", val: leave.leaveCategory },
                            { label: "Type",     val: leave.leaveType?.replace("_", " ") },
                            { label: "From",     val: fmtDate(leave.startDate) },
                            { label: "To",       val: fmtDate(leave.endDate) },
                          ].map(d => (
                            <div key={d.label}>
                              <p className="text-[10px] font-semibold text-gray-400 uppercase">{d.label}</p>
                              <p className="text-xs text-gray-700 font-medium capitalize">{d.val}</p>
                            </div>
                          ))}
                        </div>

                        {leave.reason && (
                          <p className="text-xs text-gray-500 italic mt-2 bg-gray-50 rounded-lg px-3 py-1.5">"{leave.reason}"</p>
                        )}
                        {leave.rejectionReason && (
                          <p className="text-xs text-red-500 mt-2 bg-red-50 rounded-lg px-3 py-1.5">
                            <span className="font-semibold">Rejection reason:</span> {leave.rejectionReason}
                          </p>
                        )}
                      </div>

                      {leave.status === "pending" && (
                        <div className="flex flex-col gap-2 shrink-0">
                          <button
                            onClick={() => approveMutation.mutate(leave.id)}
                            disabled={approveMutation.isPending}
                            className="flex items-center gap-1.5 bg-green-700 hover:bg-green-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                            data-testid={`button-approve-leave-${leave.id}`}
                          >
                            {approveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                            Approve
                          </button>
                          <button
                            onClick={() => { setRejectId(leave.id); setRejectReason(""); }}
                            className="flex items-center gap-1.5 bg-white hover:bg-red-50 text-red-600 text-xs font-semibold px-4 py-2 rounded-lg border border-red-200 transition-colors"
                            data-testid={`button-reject-leave-${leave.id}`}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Inline reject form */}
                    {rejectId === leave.id && (
                      <div className="border-t border-red-100 px-4 py-3 bg-red-50">
                        <p className="text-xs font-bold text-red-700 mb-2">Enter Rejection Reason</p>
                        <div className="flex gap-2">
                          <input
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="Reason for rejection..."
                            className="flex-1 border border-red-200 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
                            data-testid="input-reject-reason"
                          />
                          <button
                            onClick={() => rejectMutation.mutate({ id: leave.id, reason: rejectReason })}
                            disabled={rejectMutation.isPending}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                            data-testid="button-confirm-reject"
                          >
                            {rejectMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirm"}
                          </button>
                          <button onClick={() => setRejectId(null)} className="text-gray-400 hover:text-gray-600 px-1">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── CONFIG TAB ── */}
      {tab === "config" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Employee list */}
          <div className="md:col-span-1">
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                  <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <input
                    value={configEmpSearch}
                    onChange={e => setConfigEmpSearch(e.target.value)}
                    placeholder="Search employee..."
                    className="flex-1 text-xs bg-transparent outline-none text-gray-700"
                    data-testid="input-config-emp-search"
                  />
                </div>
              </div>
              <div className="divide-y divide-gray-50 max-h-[520px] overflow-y-auto">
                {filteredEmps.map((emp: any) => (
                  <button
                    key={emp.id}
                    onClick={() => setSelectedConfigEmp(emp)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                      selectedConfigEmp?.id === emp.id ? "bg-green-50 border-l-[3px] border-green-700" : "border-l-[3px] border-transparent"
                    }`}
                    data-testid={`button-config-emp-${emp.id}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-700 truncate">{emp.fullName}</p>
                        <p className="text-[11px] text-gray-400">{emp.employeeId}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                  </button>
                ))}
                {filteredEmps.length === 0 && (
                  <div className="px-4 py-10 text-center text-xs text-gray-400">No employees found</div>
                )}
              </div>
            </div>
          </div>

          {/* Config form */}
          <div className="md:col-span-2">
            {!selectedConfigEmp ? (
              <div className="flex flex-col items-center justify-center h-72 text-gray-300 gap-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <Settings2 className="h-16 w-16 opacity-30" />
                <p className="text-sm text-gray-400 font-medium">Select an employee to configure</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                {/* Employee header */}
                <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-green-700 to-green-600 text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold">{selectedConfigEmp.fullName}</p>
                      <p className="text-xs opacity-70">{selectedConfigEmp.employeeId} · {selectedConfigEmp.designation || selectedConfigEmp.jobTitle || "Employee"}</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-6">
                  {/* Leave quotas */}
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Annual Leave Quotas</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: "sickLeaveQuota",      label: "Sick Leave",      abbr: "SL", color: "bg-blue-500" },
                        { key: "casualLeaveQuota",     label: "Casual Leave",    abbr: "CL", color: "bg-purple-500" },
                        { key: "privilegeLeaveQuota",  label: "Privilege Leave", abbr: "PL", color: "bg-orange-500" },
                        { key: "earnedLeaveQuota",     label: "Earned Leave",    abbr: "EL", color: "bg-teal-500" },
                      ].map(field => (
                        <div key={field.key} className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white ${field.color}`}>
                              {field.abbr}
                            </div>
                            <label className="text-xs font-semibold text-gray-600">{field.label}</label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max="365"
                              value={(configValues as any)[field.key]}
                              onChange={e => setConfigValues(prev => ({ ...prev, [field.key]: Number(e.target.value) }))}
                              className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400"
                              data-testid={`input-leave-quota-${field.key}`}
                            />
                            <span className="text-xs text-gray-400 shrink-0">days</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Work schedule */}
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Work Schedule</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-600">Weekly Off Day</label>
                        <select
                          value={configValues.weeklyOff}
                          onChange={e => setConfigValues(prev => ({ ...prev, weeklyOff: e.target.value }))}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400"
                          data-testid="select-weekly-off"
                        >
                          {["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-600">Working Hours / Day</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1" max="24" step="0.5"
                            value={configValues.workingHours}
                            onChange={e => setConfigValues(prev => ({ ...prev, workingHours: e.target.value }))}
                            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-400"
                            data-testid="input-working-hours"
                          />
                          <span className="text-xs text-gray-400 shrink-0">hrs</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => saveConfigMutation.mutate()}
                    disabled={saveConfigMutation.isPending}
                    className="w-full bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors shadow-sm shadow-green-100"
                    data-testid="button-save-leave-config"
                  >
                    {saveConfigMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Configuration
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
