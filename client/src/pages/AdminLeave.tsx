import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Calendar, Settings, ChevronRight, X, Search, Save } from "lucide-react";
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

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border border-amber-200",
  approved: "bg-green-100 text-green-700 border border-green-200",
  rejected: "bg-red-100 text-red-700 border border-red-200",
  cancelled: "bg-gray-100 text-gray-500 border border-gray-200",
};

const LEAVE_CATS = ["Sick Leave", "Casual Leave", "Privilege Leave", "Earned Leave"];

type Tab = "requests" | "config";

export default function AdminLeave() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("requests");
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Config tab
  const [configEmpSearch, setConfigEmpSearch] = useState("");
  const [selectedConfigEmp, setSelectedConfigEmp] = useState<any | null>(null);
  const [configValues, setConfigValues] = useState({ sickLeaveQuota: 7, casualLeaveQuota: 7, privilegeLeaveQuota: 8, earnedLeaveQuota: 0, weeklyOff: "Sunday", workingHours: "8" });

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

  const { data: empConfig } = useQuery<any>({
    queryKey: ["/api/employee-config", selectedConfigEmp?.id],
    queryFn: async () => {
      const r = await fetch(`/api/employee-config/${selectedConfigEmp.id}`, { headers: getAuthHeader() });
      if (!r.ok) return null;
      return r.json();
    },
    enabled: !!selectedConfigEmp,
    onSuccess: (data: any) => {
      if (data) setConfigValues({ sickLeaveQuota: data.sickLeaveQuota ?? 7, casualLeaveQuota: data.casualLeaveQuota ?? 7, privilegeLeaveQuota: data.privilegeLeaveQuota ?? 8, earnedLeaveQuota: data.earnedLeaveQuota ?? 0, weeklyOff: data.weeklyOff ?? "Sunday", workingHours: String(data.workingHours ?? "8") });
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
      toast({ title: "Leave Configuration Saved", description: `Updated for ${selectedConfigEmp?.fullName}` });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = leaves.filter(l => filterStatus === "all" ? true : l.status === filterStatus);
  const filteredEmps = employees.filter((e: any) => e.fullName?.toLowerCase().includes(configEmpSearch.toLowerCase()) || e.employeeId?.toLowerCase().includes(configEmpSearch.toLowerCase()));

  const STATUS_FILTERS = [
    { key: "pending", label: "Pending", count: leaves.filter(l => l.status === "pending").length },
    { key: "approved", label: "Approved", count: leaves.filter(l => l.status === "approved").length },
    { key: "rejected", label: "Rejected", count: leaves.filter(l => l.status === "rejected").length },
    { key: "all", label: "All", count: leaves.length },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-gray-800">Leave Management</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 gap-1">
        {[{ key: "requests" as Tab, label: "Leave Requests" }, { key: "config" as Tab, label: "Leave Configuration" }].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${tab === t.key ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            data-testid={`tab-admin-leave-${t.key}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* REQUESTS TAB */}
      {tab === "requests" && (
        <>
          {/* Status filter chips */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilterStatus(f.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${filterStatus === f.key ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-300 hover:border-primary"}`}
                data-testid={`filter-leave-${f.key}`}
              >
                {f.label} {f.count > 0 && <span className="ml-1 opacity-80">({f.count})</span>}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No leave requests found.</div>
          ) : (
            <div className="space-y-3">
              {filtered.map(leave => (
                <div key={leave.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden" data-testid={`card-admin-leave-${leave.id}`}>
                  <div className="px-4 py-3 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-gray-800 text-sm">{leave.employeeName}</p>
                        <span className="text-xs text-gray-400">{leave.employeeCode}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[leave.status] || STATUS_COLORS.pending}`}>
                          {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                        <div><span className="font-medium text-gray-600">Category:</span> {leave.leaveCategory}</div>
                        <div><span className="font-medium text-gray-600">Type:</span> {leave.leaveType?.replace("_", " ")}</div>
                        <div><span className="font-medium text-gray-600">From:</span> {fmtDate(leave.startDate)}</div>
                        <div><span className="font-medium text-gray-600">To:</span> {fmtDate(leave.endDate)}</div>
                      </div>

                      {leave.reason && (
                        <p className="text-xs text-gray-500 italic mt-1.5">"{leave.reason}"</p>
                      )}
                      {leave.rejectionReason && (
                        <p className="text-xs text-red-500 mt-1">Reason: {leave.rejectionReason}</p>
                      )}
                    </div>

                    {leave.status === "pending" && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => approveMutation.mutate(leave.id)}
                          disabled={approveMutation.isPending}
                          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-md transition-colors"
                          data-testid={`button-approve-leave-${leave.id}`}
                        >
                          {approveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                          Approve
                        </button>
                        <button
                          onClick={() => { setRejectId(leave.id); setRejectReason(""); }}
                          className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-md border border-red-200 transition-colors"
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
                    <div className="border-t border-gray-200 px-4 py-3 bg-red-50">
                      <p className="text-xs font-semibold text-red-700 mb-2">Rejection Reason</p>
                      <div className="flex gap-2">
                        <input
                          value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)}
                          placeholder="Enter reason for rejection..."
                          className="flex-1 border border-red-200 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-400 bg-white"
                          data-testid="input-reject-reason"
                        />
                        <button
                          onClick={() => rejectMutation.mutate({ id: leave.id, reason: rejectReason })}
                          disabled={rejectMutation.isPending}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-md"
                          data-testid="button-confirm-reject"
                        >
                          {rejectMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirm"}
                        </button>
                        <button onClick={() => setRejectId(null)} className="text-gray-400 hover:text-gray-600 px-2">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* CONFIG TAB */}
      {tab === "config" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Employee list */}
          <div className="md:col-span-1">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-md px-2 py-1.5">
                  <Search className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  <input
                    value={configEmpSearch}
                    onChange={e => setConfigEmpSearch(e.target.value)}
                    placeholder="Search employee..."
                    className="flex-1 text-xs outline-none text-gray-700"
                    data-testid="input-config-emp-search"
                  />
                </div>
              </div>
              <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                {filteredEmps.map((emp: any) => (
                  <button
                    key={emp.id}
                    onClick={() => setSelectedConfigEmp(emp)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors ${selectedConfigEmp?.id === emp.id ? "bg-primary/5 border-l-2 border-primary" : ""}`}
                    data-testid={`button-config-emp-${emp.id}`}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-700">{emp.fullName}</p>
                      <p className="text-xs text-gray-400">{emp.employeeId} · {emp.workLocation || "N/A"}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                  </button>
                ))}
                {filteredEmps.length === 0 && (
                  <div className="px-4 py-8 text-center text-xs text-gray-400">No employees found</div>
                )}
              </div>
            </div>
          </div>

          {/* Config form */}
          <div className="md:col-span-2">
            {!selectedConfigEmp ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
                <Settings className="h-16 w-16 opacity-20" />
                <p className="text-sm">Select an employee to configure their leave quotas</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{selectedConfigEmp.fullName}</p>
                    <p className="text-xs text-gray-400">{selectedConfigEmp.employeeId} · {selectedConfigEmp.designation || selectedConfigEmp.jobTitle || ""}</p>
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Annual Leave Quotas</p>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { key: "sickLeaveQuota", label: "Sick Leave (SL)", abbr: "SL" },
                        { key: "casualLeaveQuota", label: "Casual Leave (CL)", abbr: "CL" },
                        { key: "privilegeLeaveQuota", label: "Privilege Leave (PL)", abbr: "PL" },
                        { key: "earnedLeaveQuota", label: "Earned Leave (EL)", abbr: "EL" },
                      ].map(field => (
                        <div key={field.key} className="space-y-1.5">
                          <label className="text-xs font-medium text-gray-600">{field.label}</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              max="365"
                              value={(configValues as any)[field.key]}
                              onChange={e => setConfigValues(prev => ({ ...prev, [field.key]: Number(e.target.value) }))}
                              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                              data-testid={`input-leave-quota-${field.key}`}
                            />
                            <span className="text-xs text-gray-400 w-6 shrink-0">days</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Work Schedule</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-600">Weekly Off</label>
                        <select
                          value={configValues.weeklyOff}
                          onChange={e => setConfigValues(prev => ({ ...prev, weeklyOff: e.target.value }))}
                          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white"
                          data-testid="select-weekly-off"
                        >
                          {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-600">Working Hours / Day</label>
                        <input
                          type="number"
                          min="1"
                          max="24"
                          step="0.5"
                          value={configValues.workingHours}
                          onChange={e => setConfigValues(prev => ({ ...prev, workingHours: e.target.value }))}
                          className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                          data-testid="input-working-hours"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => saveConfigMutation.mutate()}
                      disabled={saveConfigMutation.isPending}
                      className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 rounded-md text-sm flex items-center justify-center gap-2 transition-colors"
                      data-testid="button-save-leave-config"
                    >
                      {saveConfigMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Configuration
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
