import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, MapPin, Clock, CheckCircle, Loader2, Navigation,
  Plus, ChevronRight, Calendar, User, Building2, Phone, Search, X,
} from "lucide-react";
import { format } from "date-fns";
import { getEmployeeToken } from "../EmployeeLogin";

function getHeaders() {
  const t = getEmployeeToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

const TASK_TYPES = [
  "ATTENDING COMPLAINT",
  "PROMOTIONAL MATERIAL DISTRIBUTION AND DISPLAY",
  "PAYMENT COLLECTION/ADVANCE CHEQUE COLLECTION",
  "ORDER COLLECTION",
  "VISIT FOR INVENTORY",
  "MONTHLY SCHEME BRIEFING",
  "COMPANY INTRODUCTION (New Client Visit)",
  "SALES VISIT",
  "SERVICE VISIT",
  "DEMO",
  "FOLLOW UP",
  "OTHER",
];

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-400",
  low: "bg-green-500",
};

function fmtDate(dt: string | null | undefined) {
  if (!dt) return "-";
  try { return format(new Date(dt), "yyyy-MM-dd HH:mm"); } catch { return "-"; }
}

function fmtDT(dt: string | null | undefined) {
  if (!dt) return "-";
  try { return format(new Date(dt), "dd MMM yyyy, hh:mm a"); } catch { return "-"; }
}

type View = "list" | "detail" | "complete" | "create";

interface EmployeeTasksProps {
  employee: { id: number; fullName: string; employeeId: string };
}

export default function EmployeeTasks({ employee }: EmployeeTasksProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<"pending" | "in_progress" | "completed" | "all">("pending");
  const [view, setView] = useState<View>("list");
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Completion form state
  const [dealerName, setDealerName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [townName, setTownName] = useState("");
  const [odAmount, setOdAmount] = useState("");
  const [regularDue, setRegularDue] = useState("");

  // Create task state
  const [createTitle, setCreateTitle] = useState("");
  const [createType, setCreateType] = useState("");
  const [createCustomer, setCreateCustomer] = useState("");
  const [createAddress, setCreateAddress] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [createPriority, setCreatePriority] = useState("medium");
  const [createStartDate, setCreateStartDate] = useState("");
  const [createEndDate, setCreateEndDate] = useState("");
  const [typeSearch, setTypeSearch] = useState("");
  const [showTypeList, setShowTypeList] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerList, setShowCustomerList] = useState(false);

  const { data: taskList = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/employee/tasks"],
    queryFn: async () => {
      const res = await fetch("/api/employee/tasks", { headers: getHeaders() });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: customersList = [] } = useQuery<any[]>({
    queryKey: ["/api/employee/customers"],
    queryFn: async () => {
      const res = await fetch("/api/employee/customers", { headers: getHeaders() });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const getGPS = useCallback(async () => {
    setGpsLoading(true);
    return new Promise<{ lat: number; lng: number; name?: string } | null>((resolve) => {
      if (!navigator.geolocation) { setGpsLoading(false); resolve(null); return; }
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          let name: string | undefined;
          try {
            const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
            const d = await r.json();
            name = d.display_name;
          } catch {}
          setGpsLoading(false);
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, name });
        },
        () => { setGpsLoading(false); resolve(null); },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    });
  }, []);

  const checkInMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const loc = await getGPS();
      const formData = new FormData();
      if (loc) {
        formData.append("checkInLatitude", loc.lat.toString());
        formData.append("checkInLongitude", loc.lng.toString());
        if (loc.name) formData.append("checkInLocationName", loc.name);
      }
      const res = await fetch(`/api/employee/tasks/${taskId}/checkin`, {
        method: "PATCH",
        headers: getHeaders(),
        body: formData,
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || "Failed"); }
      return res.json();
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["/api/employee/tasks"] });
      setSelectedTask(updated);
      setView("complete");
      toast({ title: "Task Started", description: "Fill in the visit details below" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const completeMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const res = await fetch(`/api/employee/tasks/${taskId}/complete`, {
        method: "PATCH",
        headers: { ...getHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ dealerName, contactPerson, contactNo, townName, odAmount, regularDue }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || "Failed"); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/employee/tasks"] });
      setView("list");
      setSelectedTask(null);
      setActiveTab("completed");
      toast({ title: "Task Completed", description: "Your RM will be notified" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/employee/tasks", {
        method: "POST",
        headers: { ...getHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          title: createTitle,
          type: createType,
          customerName: createCustomer,
          customerAddress: createAddress,
          notes: createDesc,
          priority: createPriority,
          startDate: createStartDate ? new Date(createStartDate).toISOString() : new Date().toISOString(),
          endDate: createEndDate ? new Date(createEndDate).toISOString() : null,
        }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || "Failed"); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/employee/tasks"] });
      setView("list");
      setCreateTitle(""); setCreateType(""); setCreateCustomer(""); setCreateAddress(""); setCreateDesc(""); setCreatePriority("medium"); setCreateStartDate(""); setCreateEndDate("");
      toast({ title: "Task Created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = taskList.filter(t => {
    if (activeTab === "all") return true;
    if (activeTab === "in_progress") return t.status === "in_progress";
    return t.status === activeTab;
  });

  const counts = {
    pending: taskList.filter(t => t.status === "pending").length,
    in_progress: taskList.filter(t => t.status === "in_progress").length,
    completed: taskList.filter(t => t.status === "completed").length,
    all: taskList.length,
  };

  // ===== CREATE TASK VIEW =====
  if (view === "create") {
    const filteredTypes = TASK_TYPES.filter(t => t.toLowerCase().includes(typeSearch.toLowerCase()));
    const filteredCustomers = customersList.filter((c: any) =>
      c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.address?.toLowerCase().includes(customerSearch.toLowerCase())
    );
    return (
      <div className="flex flex-col h-full animate-in fade-in">
        {/* Header */}
        <div className="bg-green-700 text-white px-4 pt-5 pb-4 flex items-center gap-3 -mx-4 -mt-4 mb-4">
          <button onClick={() => setView("list")} className="p-1">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="font-semibold text-base">Create Task</span>
        </div>

        <div className="space-y-4 flex-1 overflow-y-auto pb-4">
          <div>
            <Input
              placeholder="What Task is all about?"
              value={createTitle}
              onChange={e => setCreateTitle(e.target.value)}
              className="rounded-md border-gray-300 text-sm"
              data-testid="input-create-task-title"
            />
          </div>

          {/* Place Name (Customer) */}
          <div className="space-y-1">
            <label className="text-xs text-gray-500 font-medium">Place Name</label>
            <div className="relative">
              <button
                className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm text-left bg-white flex items-center justify-between"
                onClick={() => setShowCustomerList(v => !v)}
                data-testid="button-select-customer"
              >
                <span className={createCustomer ? "text-gray-800" : "text-gray-400"}>
                  {createCustomer || "Select"}
                </span>
                <ChevronRight className="h-4 w-4 text-gray-400 rotate-90" />
              </button>
              {showCustomerList && (
                <div className="absolute z-50 top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg mt-1">
                  <div className="p-2 border-b">
                    <div className="flex items-center gap-2 bg-gray-50 rounded px-2">
                      <Search className="h-3.5 w-3.5 text-gray-400" />
                      <input
                        autoFocus
                        value={customerSearch}
                        onChange={e => setCustomerSearch(e.target.value)}
                        className="flex-1 bg-transparent py-1.5 text-sm outline-none"
                        placeholder="Search..."
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredCustomers.length === 0 ? (
                      <p className="text-xs text-gray-400 p-3 text-center">No customers found</p>
                    ) : filteredCustomers.map((c: any) => (
                      <button
                        key={c.id}
                        className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 border-b last:border-0"
                        onClick={() => {
                          setCreateCustomer(c.name);
                          if (c.address) setCreateAddress(c.address);
                          setShowCustomerList(false);
                          setCustomerSearch("");
                        }}
                        data-testid={`option-customer-${c.id}`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Task Type */}
          <div className="space-y-1">
            <label className="text-xs text-gray-500 font-medium">Task Type</label>
            <div className="relative">
              <button
                className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm text-left bg-white flex items-center justify-between"
                onClick={() => setShowTypeList(v => !v)}
                data-testid="button-select-task-type"
              >
                <span className={createType ? "text-gray-800 text-xs" : "text-gray-400"}>
                  {createType || "Select"}
                </span>
                <ChevronRight className="h-4 w-4 text-gray-400 rotate-90" />
              </button>
              {showTypeList && (
                <div className="absolute z-50 top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg mt-1">
                  <div className="p-2 border-b">
                    <div className="flex items-center gap-2 bg-gray-50 rounded px-2">
                      <Search className="h-3.5 w-3.5 text-gray-400" />
                      <input
                        autoFocus
                        value={typeSearch}
                        onChange={e => setTypeSearch(e.target.value)}
                        className="flex-1 bg-transparent py-1.5 text-sm outline-none"
                        placeholder="Search..."
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredTypes.map(t => (
                      <button
                        key={t}
                        className={`w-full text-left px-3 py-2.5 text-xs hover:bg-gray-50 border-b last:border-0 ${createType === t ? "bg-green-50 text-green-700 font-semibold" : ""}`}
                        onClick={() => { setCreateType(t); setShowTypeList(false); setTypeSearch(""); }}
                        data-testid={`option-task-type-${t}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="border border-gray-300 rounded-md p-3 space-y-2">
            <p className="text-xs text-gray-500 font-medium">Address</p>
            <div className="flex items-start gap-2">
              <Input
                placeholder="Find or type address"
                value={createAddress}
                onChange={e => setCreateAddress(e.target.value)}
                className="flex-1 text-sm border-0 p-0 focus-visible:ring-0 h-auto"
                data-testid="input-create-task-address"
              />
              <button
                onClick={async () => {
                  const loc = await getGPS();
                  if (loc?.name) setCreateAddress(loc.name);
                }}
                className="shrink-0 text-gray-400 hover:text-green-700 transition-colors"
              >
                {gpsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="border border-gray-300 rounded-md p-3 space-y-2">
            <p className="text-xs text-gray-500 font-medium">Description</p>
            <Textarea
              placeholder="Type your description"
              value={createDesc}
              onChange={e => setCreateDesc(e.target.value)}
              className="border-0 p-0 focus-visible:ring-0 resize-none min-h-[80px] text-sm"
              data-testid="input-create-task-desc"
            />
          </div>

          {/* Timeline (Start / End date) */}
          <div className="space-y-2">
            <label className="text-xs text-gray-500 font-medium">Timeline</label>
            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <p className="text-[10px] text-gray-400">Start Date</p>
                <Input
                  type="datetime-local"
                  value={createStartDate}
                  onChange={e => setCreateStartDate(e.target.value)}
                  className="text-xs h-9"
                  data-testid="input-create-task-start"
                />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-[10px] text-gray-400">Due Date</p>
                <Input
                  type="datetime-local"
                  value={createEndDate}
                  onChange={e => setCreateEndDate(e.target.value)}
                  className="text-xs h-9"
                  data-testid="input-create-task-end"
                />
              </div>
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-1">
            <label className="text-xs text-gray-500 font-medium">Priority</label>
            <div className="flex gap-2">
              {["high", "medium", "low"].map(p => (
                <button
                  key={p}
                  onClick={() => setCreatePriority(p)}
                  className={`flex-1 py-2 rounded-md text-xs font-semibold capitalize border transition-all ${createPriority === p ? "bg-green-700 text-white border-green-700" : "bg-white text-gray-600 border-gray-300"}`}
                  data-testid={`button-priority-${p}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t">
          <Button
            className="w-full bg-green-700 hover:bg-green-800 font-bold text-sm py-3"
            disabled={!createTitle.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate()}
            data-testid="button-create-task-submit"
          >
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            CREATE TASK
          </Button>
        </div>
      </div>
    );
  }

  // ===== COMPLETION FORM VIEW =====
  if (view === "complete" && selectedTask) {
    const task = taskList.find(t => t.id === selectedTask.id) || selectedTask;
    return (
      <div className="flex flex-col h-full animate-in fade-in">
        {/* Header */}
        <div className="bg-green-700 text-white px-4 pt-5 pb-4 flex items-center gap-3 -mx-4 -mt-4 mb-4">
          <button onClick={() => { setView("detail"); }} className="p-1">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="font-semibold text-base">Update Task</span>
        </div>

        <div className="border border-gray-200 rounded-md px-3 py-2 mb-4">
          <p className="text-sm font-semibold text-gray-700">{task.title}</p>
        </div>

        <div className="bg-green-700 text-white rounded-md px-3 py-2 text-xs font-semibold mb-4">
          {task.type}
        </div>

        <div className="space-y-3 flex-1 overflow-y-auto pb-4">
          {[
            { label: "Customer/ Dealer Name", value: dealerName, setter: setDealerName, id: "dealerName", required: false },
            { label: "Contact Person", value: contactPerson, setter: setContactPerson, id: "contactPerson", required: false },
            { label: "Contact No.", value: contactNo, setter: setContactNo, id: "contactNo", required: false },
            { label: "Town Name", value: townName, setter: setTownName, id: "townName", required: false },
            { label: "OD Amount", value: odAmount, setter: setOdAmount, id: "odAmount", required: false },
            { label: "Regular Due", value: regularDue, setter: setRegularDue, id: "regularDue", required: false },
          ].map(({ label, value, setter, id, required }) => (
            <div key={id} className="flex items-center border-b border-gray-100 pb-2 gap-2">
              <label className="text-xs text-gray-500 w-32 shrink-0">
                {label}{required && <span className="text-red-500">*</span>}
              </label>
              <Input
                placeholder="Please enter text ..."
                value={value}
                onChange={e => setter(e.target.value)}
                className="flex-1 border-0 border-b border-gray-200 rounded-none px-0 text-sm h-7 focus-visible:ring-0"
                data-testid={`input-complete-${id}`}
              />
            </div>
          ))}
        </div>

        <div className="pt-3 border-t">
          <Button
            className="w-full bg-green-700 hover:bg-green-800 font-bold py-3"
            disabled={completeMutation.isPending}
            onClick={() => completeMutation.mutate(task.id)}
            data-testid="button-task-submit"
          >
            {completeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            SUBMIT
          </Button>
        </div>
      </div>
    );
  }

  // ===== TASK DETAIL VIEW =====
  if (view === "detail" && selectedTask) {
    const task = taskList.find(t => t.id === selectedTask.id) || selectedTask;
    return (
      <div className="flex flex-col h-full animate-in fade-in">
        {/* Header */}
        <div className="bg-green-700 text-white px-4 pt-5 pb-4 flex items-center gap-3 -mx-4 -mt-4 mb-4">
          <button onClick={() => setView("list")} className="p-1">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="font-semibold text-base">Update Task</span>
        </div>

        {/* Task title box */}
        <div className="border border-gray-200 rounded-md px-3 py-2 mb-4 bg-white">
          <p className="text-sm font-semibold text-gray-700">{task.title}</p>
        </div>

        {/* Field rows */}
        <div className="space-y-0 mb-4 border border-gray-100 rounded-md divide-y divide-gray-100 bg-white text-sm">
          {[
            { label: "Place Name", value: task.customerName || "-", icon: <Building2 className="h-3.5 w-3.5 text-gray-400" /> },
            { label: "Task Type", value: task.type, icon: null },
            { label: "Assign By", value: task.createdByName || "-", icon: <User className="h-3.5 w-3.5 text-gray-400" /> },
            { label: "Priority", value: (
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[task.priority] || "bg-gray-400"}`} />
                <span className="capitalize font-medium">{task.priority}</span>
              </span>
            )},
          ].map(({ label, value, icon }) => (
            <div key={label} className="flex items-start px-3 py-2.5 gap-3">
              <span className="text-gray-400 text-xs w-24 shrink-0 pt-0.5">{label}</span>
              <span className="text-xs text-gray-300 shrink-0">:</span>
              <div className="flex-1 flex items-start gap-1 text-xs font-medium text-gray-700">
                {icon}{value}
              </div>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="border border-gray-100 rounded-md bg-white mb-4 overflow-hidden">
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
            <p className="text-xs text-gray-400 font-medium">Timeline</p>
          </div>
          <div className="px-3 py-2 space-y-2.5">
            {task.startDate && (
              <div className="flex items-start gap-2 text-xs text-gray-600">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-0.5 shrink-0" />
                <span>{fmtDate(task.startDate)} <span className="text-gray-400">(Start)</span></span>
              </div>
            )}
            {task.endDate && (
              <div className="flex items-start gap-2 text-xs text-gray-600">
                <div className="w-2 h-2 rounded-full bg-gray-400 mt-0.5 shrink-0" />
                <span>{fmtDate(task.endDate)} <span className="text-gray-400">(End)</span></span>
              </div>
            )}
            {task.startedAt && (
              <div className="flex items-start gap-2 text-xs text-amber-600">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-0.5 shrink-0" />
                <span>{fmtDate(task.startedAt)} <span className="text-amber-400">(Task Started)</span></span>
              </div>
            )}
            {task.completedAt && (
              <div className="flex items-start gap-2 text-xs text-green-700 font-medium">
                <CheckCircle className="h-3.5 w-3.5 mt-0 shrink-0" />
                <span>{fmtDate(task.completedAt)} <span className="text-green-500 font-normal">(Completed)</span></span>
              </div>
            )}
            {!task.startDate && !task.endDate && !task.startedAt && !task.completedAt && (
              <p className="text-[11px] text-gray-400 py-1">No timeline dates set</p>
            )}
          </div>
        </div>

        {/* Address */}
        {(task.customerAddress || task.checkInLocationName) && (
          <div className="border border-gray-100 rounded-md bg-white mb-4 overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
              <p className="text-xs text-gray-400 font-medium">Address</p>
            </div>
            <div className="px-3 py-2.5 flex items-start justify-between gap-3">
              <p className="text-xs text-gray-600 leading-relaxed flex-1">
                {task.customerAddress || task.checkInLocationName}
              </p>
              {task.customerAddress && (
                <a
                  href={`https://www.google.com/maps/search/${encodeURIComponent(task.customerAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-green-700"
                  data-testid="link-task-navigate"
                >
                  <Navigation className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Notes if completed */}
        {task.notes && task.status === "completed" && (
          <div className="border border-gray-100 rounded-md bg-white mb-4 px-3 py-2.5">
            <p className="text-xs text-gray-400 font-medium mb-1">Visit Details</p>
            <p className="text-xs text-gray-600 whitespace-pre-line">{task.notes}</p>
          </div>
        )}

        <div className="mt-auto pt-3">
          {task.status === "pending" && (
            <div className="flex justify-end">
              <Button
                className="bg-gray-800 hover:bg-gray-900 text-white text-xs font-bold px-8 py-2.5 rounded"
                disabled={checkInMutation.isPending || gpsLoading}
                onClick={() => checkInMutation.mutate(task.id)}
                data-testid="button-start-task"
              >
                {checkInMutation.isPending || gpsLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                START TASK
              </Button>
            </div>
          )}
          {task.status === "in_progress" && (
            <Button
              className="w-full bg-green-700 hover:bg-green-800 font-bold"
              onClick={() => setView("complete")}
              data-testid="button-fill-complete"
            >
              FILL COMPLETION DETAILS
            </Button>
          )}
          {task.status === "completed" && (
            <div className="flex items-center justify-center gap-2 text-green-700 font-semibold text-sm py-3 bg-green-50 rounded-md border border-green-200">
              <CheckCircle className="h-5 w-5" />
              Task Completed
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== TASK LIST VIEW =====
  const TABS: { key: typeof activeTab; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "in_progress", label: "In Progress" },
    { key: "completed", label: "Completed" },
    { key: "all", label: "All" },
  ];

  return (
    <div className="flex flex-col h-full animate-in fade-in">
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 mb-3 -mx-4 px-2">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors relative ${activeTab === tab.key ? "text-green-700 border-b-2 border-green-700" : "text-gray-400"}`}
            data-testid={`tab-tasks-${tab.key}`}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Task cards */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-green-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-2">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-2">
              <Plus className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium">No Task Found</p>
          </div>
        ) : (
          filtered.map((task) => (
            <div
              key={task.id}
              className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm cursor-pointer active:scale-[0.99] transition-transform"
              onClick={() => { setSelectedTask(task); setView("detail"); }}
              data-testid={`card-task-${task.id}`}
            >
              <div className="px-3 pt-3 pb-2">
                <p className="text-sm font-bold text-gray-800 leading-tight mb-0.5">{task.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{task.type}</p>
              </div>

              <div className="px-3 pb-2 flex items-start justify-between gap-2">
                <div className="space-y-1 flex-1">
                  {task.startDate && (
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                      <Calendar className="h-3 w-3" />
                      <span>{fmtDate(task.startDate)} <span className="text-gray-300">(Start)</span></span>
                    </div>
                  )}
                  {task.endDate && (
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                      <Clock className="h-3 w-3" />
                      <span>{fmtDate(task.endDate)} <span className="text-gray-300">(End)</span></span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className={`w-2 h-2 rounded-full ${PRIORITY_DOT[task.priority] || "bg-gray-300"}`} />
                    <span className="text-gray-500 capitalize">Priority {task.priority}</span>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    task.status === "completed" ? "bg-green-100 text-green-700"
                    : task.status === "in_progress" ? "bg-amber-100 text-amber-700"
                    : "bg-gray-100 text-gray-500"
                  }`}>
                    {task.status === "in_progress" ? "In Progress" : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                  </span>
                </div>
              </div>

              {task.createdByName && (
                <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50 flex items-center gap-1.5">
                  <User className="h-3 w-3 text-gray-400" />
                  <span className="text-[11px] text-gray-400">Created By: <span className="text-gray-600">{task.createdByName}</span></span>
                </div>
              )}

              {(task.customerAddress || task.checkInLocationName) && (
                <div className="px-3 py-1.5 border-t border-gray-100 flex items-start gap-1.5">
                  <MapPin className="h-3 w-3 text-gray-400 mt-0.5 shrink-0" />
                  <span className="text-[11px] text-gray-500 leading-relaxed">
                    {task.customerAddress || task.checkInLocationName}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* FAB + button */}
      <button
        onClick={() => setView("create")}
        className="fixed bottom-20 right-4 w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-xl flex items-center justify-center z-50 transition-transform active:scale-95"
        data-testid="button-create-task"
      >
        <Plus className="h-7 w-7" />
      </button>
    </div>
  );
}
