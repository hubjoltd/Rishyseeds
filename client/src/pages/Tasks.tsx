import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ClipboardList, Plus, Search, ArrowLeft, Send, MessageSquare,
  Loader2, MapPin, Clock, CheckCircle, User, Building2,
} from "lucide-react";
import { format } from "date-fns";
import type { Task, TaskComment } from "@shared/schema";

interface TaskWithEmployee extends Task {
  employeeName: string;
  employeeCode: string;
}

function getAuthHeader() {
  const t = localStorage.getItem("auth_token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

function fmtDT(dt: string | Date | null | undefined) {
  if (!dt) return "NA";
  try { return format(new Date(dt), "yyyy-MM-dd HH:mm"); } catch { return "NA"; }
}

function fmtDate(dt: string | Date | null | undefined) {
  if (!dt) return "NA";
  try { return format(new Date(dt), "dd MMM yyyy"); } catch { return "NA"; }
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-green-100 text-green-700",
};

function TaskDetailPage({ taskId, onBack }: { taskId: number; onBack: () => void }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"details" | "comments">("details");
  const [newComment, setNewComment] = useState("");

  const { data: task, isLoading } = useQuery<TaskWithEmployee>({
    queryKey: ["/api/tasks", taskId],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}`, { headers: getAuthHeader() });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: comments } = useQuery<TaskComment[]>({
    queryKey: ["/api/tasks", taskId, "comments"],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}/comments`, { headers: getAuthHeader() });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: activeTab === "comments",
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: any) => {
      await apiRequest("PATCH", `/api/tasks/${taskId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId] });
      toast({ title: "Task updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const commentMutation = useMutation({
    mutationFn: async (msg: string) => {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ message: msg }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId, "comments"] });
      setNewComment("");
    },
    onError: () => toast({ title: "Error", description: "Failed to add comment", variant: "destructive" }),
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!task) return <div className="p-8 text-center text-muted-foreground">Task not found.</div>;

  const timeline = [
    task.createdAt && { label: "Created", time: task.createdAt, color: "#6366f1" },
    task.startDate && { label: "Scheduled Start", time: task.startDate, color: "#2563eb" },
    task.startedAt && { label: "Started", time: task.startedAt, color: "#0ea5e9" },
    task.checkInTime && { label: "Checked In", time: task.checkInTime, color: "#7c3aed", desc: task.checkInLocationName || undefined },
    task.completedAt && { label: "Completed", time: task.completedAt, color: "#16a34a" },
  ].filter(Boolean) as { label: string; time: any; color: string; desc?: string }[];

  return (
    <div className="animate-in fade-in">
      <div className="border-b bg-card px-6 py-3 flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back-task">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <ClipboardList className="h-5 w-5 text-primary" />
        <div>
          <span className="font-semibold">Tasks</span>
          <span className="text-muted-foreground mx-2">/</span>
          <span className="font-semibold text-primary">{task.taskCode}</span>
        </div>
        <div className="ml-auto flex items-center gap-3 flex-wrap">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${STATUS_COLORS[task.status] || "bg-muted"}`}>
            Status = {task.status.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
          </span>
          <Select value={task.status} onValueChange={(v) => updateMutation.mutate({ status: v })}>
            <SelectTrigger className="h-8 w-36 text-xs" data-testid="select-task-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-1 px-6 border-b bg-card">
        {(["details", "comments"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            data-testid={`tab-task-${tab}`}
          >
            {tab === "details" ? "Details" : "Comments"}
          </button>
        ))}
      </div>

      <div className="flex min-h-[500px]">
        <div className="flex-1 p-6 space-y-5 border-r overflow-y-auto">
          {activeTab === "details" && (
            <div className="space-y-5 max-w-2xl">
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-sm border-b pb-2">Task Details</h3>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Title *</Label>
                  <div className="border rounded px-3 py-2 bg-muted/30 text-sm">{task.title}</div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Employee *</Label>
                    <div className="border rounded px-3 py-2 bg-muted/30 flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                        {task.employeeName.charAt(0)}
                      </div>
                      <span>{task.employeeName}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Type *</Label>
                    <div className="border rounded px-3 py-2 bg-muted/30">{task.type}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Priority</Label>
                    <div className="border rounded px-3 py-2 bg-muted/30 capitalize">{task.priority}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Work Location</Label>
                    <div className="border rounded px-3 py-2 bg-muted/30">{task.workLocation || "NA"}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Start Date</Label>
                    <div className="border rounded px-3 py-2 bg-muted/30">{fmtDate(task.startDate)}</div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">End Date</Label>
                    <div className="border rounded px-3 py-2 bg-muted/30">{fmtDate(task.endDate)}</div>
                  </div>
                </div>
                {task.notes && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Notes</Label>
                    <div className="border rounded px-3 py-2 bg-muted/30 text-sm">{task.notes}</div>
                  </div>
                )}
              </div>

              {(task.customerName || task.customerAddress) && (
                <div className="border rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-sm border-b pb-2 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" /> Customer Details
                  </h3>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Customer</Label>
                    <div className="border rounded px-3 py-2 bg-muted/30 flex items-center gap-2 text-sm">
                      <span className="font-medium">{task.customerName || "NA"}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Address</Label>
                    <div className="border rounded px-3 py-2 bg-muted/30 text-sm min-h-[60px]">{task.customerAddress || "NA"}</div>
                  </div>
                  {task.checkInTime && (
                    <div className="flex items-start gap-2 p-3 bg-blue-50/60 border border-blue-100 rounded-md text-sm">
                      <MapPin className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-blue-700">Check In · {format(new Date(task.checkInTime), "dd-MM-yyyy HH:mm")}</p>
                        {task.checkInLocationName && <p className="text-xs text-blue-600">{task.checkInLocationName}</p>}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "comments" && (
            <div className="space-y-4 max-w-2xl">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Message</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!comments || comments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-12 text-muted-foreground">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        No comment found
                      </TableCell>
                    </TableRow>
                  ) : (
                    comments.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>{c.message}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{fmtDT(c.createdAt)}</TableCell>
                        <TableCell>{c.createdByName}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <div className="flex gap-2 pt-2 border-t">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="min-h-[60px] resize-none"
                  data-testid="input-task-comment"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && newComment.trim()) {
                      e.preventDefault();
                      commentMutation.mutate(newComment.trim());
                    }
                  }}
                />
                <Button size="icon" onClick={() => newComment.trim() && commentMutation.mutate(newComment.trim())} disabled={!newComment.trim() || commentMutation.isPending} data-testid="button-send-task-comment">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="w-64 p-5 space-y-5 shrink-0 overflow-y-auto">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Task's Information</h4>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Priority</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded capitalize ${PRIORITY_COLORS[task.priority] || "bg-muted"}`}>
                  {task.priority}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Creator</p>
                <p className="text-sm font-medium">{task.createdByName || "Admin"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Assign to</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
                    {task.employeeName.charAt(0)}
                  </div>
                  <p className="text-sm">{task.employeeName}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Customer</p>
                <p className="text-sm font-medium mt-0.5">{task.customerName || "NA"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Basic Details</p>
                <p className="text-xs mt-0.5">Type: {task.type}</p>
                <p className="text-xs">Status: <span className="capitalize">{task.status.replace("_", " ")}</span></p>
              </div>
              {task.customerAddress && (
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="text-xs mt-0.5 leading-relaxed">{task.customerAddress}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Timeline</h4>
            {timeline.length === 0 ? (
              <p className="text-xs text-muted-foreground">No events yet</p>
            ) : (
              <div className="relative">
                <div className="absolute left-[7px] top-3 bottom-3 w-0.5 bg-border" />
                <div className="space-y-4">
                  {timeline.map((evt, i) => (
                    <div key={i} className="relative flex gap-3">
                      <div className="w-4 h-4 rounded-full border-2 border-white shadow shrink-0 mt-0.5" style={{ backgroundColor: evt.color }} />
                      <div>
                        <p className="text-xs font-semibold">{evt.label}</p>
                        {evt.desc && <p className="text-xs text-muted-foreground">{evt.desc}</p>}
                        <p className="text-xs text-muted-foreground">{fmtDT(evt.time)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateTaskDialog({ open, onClose, employees }: { open: boolean; onClose: () => void; employees: any[] }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: "",
    employeeDbId: "",
    customerName: "",
    customerAddress: "",
    workLocation: "",
    priority: "medium",
    type: "Visit",
    startDate: "",
    endDate: "",
    notes: "",
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        employeeDbId: Number(form.employeeDbId),
        startDate: form.startDate ? new Date(form.startDate) : undefined,
        endDate: form.endDate ? new Date(form.endDate) : undefined,
      };
      await apiRequest("POST", "/api/tasks", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task Created", description: "Task has been assigned to the employee." });
      onClose();
      setForm({ title: "", employeeDbId: "", customerName: "", customerAddress: "", workLocation: "", priority: "medium", type: "Visit", startDate: "", endDate: "", notes: "" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" /> Create New Task
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Title *</Label>
            <Input placeholder="Task title" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} data-testid="input-task-title" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Assign to Employee *</Label>
            <Select value={form.employeeDbId} onValueChange={(v) => setForm(f => ({ ...f, employeeDbId: v }))}>
              <SelectTrigger data-testid="select-task-employee">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.fullName} ({e.employeeId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Type *</Label>
              <Select value={form.type} onValueChange={(v) => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger data-testid="select-task-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Visit">Visit</SelectItem>
                  <SelectItem value="Call">Call</SelectItem>
                  <SelectItem value="Meeting">Meeting</SelectItem>
                  <SelectItem value="Delivery">Delivery</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm(f => ({ ...f, priority: v }))}>
                <SelectTrigger data-testid="select-task-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Customer Name</Label>
            <Input placeholder="e.g. Sri Harshini Fertilizer & Seeds" value={form.customerName} onChange={(e) => setForm(f => ({ ...f, customerName: e.target.value }))} data-testid="input-task-customer" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Customer Address</Label>
            <Textarea placeholder="Customer address..." value={form.customerAddress} onChange={(e) => setForm(f => ({ ...f, customerAddress: e.target.value }))} className="min-h-[70px] resize-none" data-testid="input-task-customer-address" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Work Location</Label>
            <Input placeholder="Work location" value={form.workLocation} onChange={(e) => setForm(f => ({ ...f, workLocation: e.target.value }))} data-testid="input-task-location" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Start Date</Label>
              <Input type="datetime-local" value={form.startDate} onChange={(e) => setForm(f => ({ ...f, startDate: e.target.value }))} data-testid="input-task-start" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">End Date</Label>
              <Input type="datetime-local" value={form.endDate} onChange={(e) => setForm(f => ({ ...f, endDate: e.target.value }))} data-testid="input-task-end" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <Textarea placeholder="Any additional notes..." value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} className="min-h-[60px] resize-none" data-testid="input-task-notes" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button className="flex-1" disabled={!form.title || !form.employeeDbId || createMutation.isPending} onClick={() => createMutation.mutate()} data-testid="button-create-task">
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Create Task
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Tasks() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: taskList = [], isLoading } = useQuery<TaskWithEmployee[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ["/api/employees"],
  });

  if (selectedId) {
    return <TaskDetailPage taskId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  const filtered = taskList.filter((t) => {
    const matchSearch =
      (t.employeeName || "").toLowerCase().includes(search.toLowerCase()) ||
      t.taskCode.toLowerCase().includes(search.toLowerCase()) ||
      (t.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.customerName || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const tabs = [
    { key: "all", label: "All Tasks" },
    { key: "pending", label: "Pending" },
    { key: "in_progress", label: "In Progress" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="space-y-5 animate-in fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <ClipboardList className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-bold font-display text-primary" data-testid="text-page-title">Tasks</h2>
            <p className="text-muted-foreground text-sm">All Tasks</p>
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)} data-testid="button-create-task-open">
          <Plus className="h-4 w-4 mr-2" /> Create Task
        </Button>
      </div>

      <div className="border-b">
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                statusFilter === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`tab-task-filter-${key}`}
            >
              {label}
              {key !== "all" && (
                <span className="ml-1.5 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                  {taskList.filter(t => t.status === key).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="p-0">
          <div className="flex items-center gap-3 p-4 border-b justify-between flex-wrap">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search tasks..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="input-search-tasks" />
            </div>
            <span className="text-sm text-muted-foreground">Fetch Total {filtered.length} of {taskList.length} items</span>
          </div>

          {isLoading ? (
            <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"><input type="checkbox" className="rounded" /></TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Work Location</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>Expire</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Created On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center text-muted-foreground py-14">
                      <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      No task found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((task) => (
                    <TableRow key={task.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedId(task.id)} data-testid={`row-task-${task.id}`}>
                      <TableCell onClick={(e) => e.stopPropagation()}><input type="checkbox" className="rounded" /></TableCell>
                      <TableCell>
                        <div>
                          <p className="text-primary font-medium text-sm hover:underline" data-testid={`text-task-code-${task.id}`}>{task.taskCode}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[140px]">{task.title}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                            {task.employeeName.charAt(0)}
                          </div>
                          <span className="text-sm">{task.employeeName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{task.workLocation || "NA"}</TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${PRIORITY_COLORS[task.priority] || "bg-muted text-muted-foreground"}`}>
                          {task.priority}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded border capitalize ${STATUS_COLORS[task.status] || "bg-muted text-muted-foreground"}`} data-testid={`badge-task-status-${task.id}`}>
                          {task.status.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">{task.type}</TableCell>
                      <TableCell className="text-xs">{task.customerName || "NA"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtDT(task.startDate)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtDT(task.endDate)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtDT(task.startedAt)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtDT(task.completedAt)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[140px] truncate">{task.customerAddress || "NA"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtDT(task.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          {filtered.length > 0 && (
            <div className="px-4 py-3 border-t flex items-center justify-between text-xs text-muted-foreground">
              <span>1 – {filtered.length} of {taskList.length} items</span>
              <span>50 / Page</span>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateTaskDialog open={showCreate} onClose={() => setShowCreate(false)} employees={employees} />
    </div>
  );
}
