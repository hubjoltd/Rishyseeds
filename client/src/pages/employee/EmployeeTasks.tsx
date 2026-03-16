import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  ClipboardList, ArrowLeft, MapPin, Clock, CheckCircle, Loader2, Navigation,
} from "lucide-react";
import { format } from "date-fns";
import { getEmployeeToken } from "../EmployeeLogin";

function getHeaders() {
  const t = getEmployeeToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  in_progress: "bg-green-100 text-green-700 border-green-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-green-100 text-green-700",
};

function fmtDate(dt: string | null | undefined) {
  if (!dt) return "-";
  try { return format(new Date(dt), "dd MMM yyyy"); } catch { return "-"; }
}
function fmtDT(dt: string | null | undefined) {
  if (!dt) return "-";
  try { return format(new Date(dt), "dd MMM yyyy, hh:mm a"); } catch { return "-"; }
}

interface EmployeeTasksProps {
  employee: { id: number; fullName: string; employeeId: string };
}

export default function EmployeeTasks({ employee }: EmployeeTasksProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  const { data: taskList = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/employee/tasks"],
    queryFn: async () => {
      const res = await fetch("/api/employee/tasks", { headers: getHeaders() });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const getGPS = useCallback(async () => {
    setGpsLoading(true);
    return new Promise<{ lat: number; lng: number } | null>((resolve) => {
      if (!navigator.geolocation) { setGpsLoading(false); resolve(null); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => { setGpsLoading(false); resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
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
      toast({ title: "Checked In", description: "Task marked as In Progress" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const completeMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const res = await fetch(`/api/employee/tasks/${taskId}/complete`, {
        method: "PATCH",
        headers: getHeaders(),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || "Failed"); }
      return res.json();
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["/api/employee/tasks"] });
      setSelectedTask(updated);
      toast({ title: "Task Completed" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (selectedTask) {
    const task = taskList.find(t => t.id === selectedTask.id) || selectedTask;
    return (
      <div className="space-y-4 animate-in fade-in">
        <div className="flex items-center gap-3 border-b pb-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedTask(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h3 className="font-semibold text-primary">{task.taskCode}</h3>
            <p className="text-xs text-muted-foreground">{task.title}</p>
          </div>
          <span className={`ml-auto text-xs font-semibold px-3 py-1 rounded-full border ${STATUS_COLORS[task.status] || "bg-muted"}`}>
            {task.status.replace("_", " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            { label: "Type", value: task.type },
            { label: "Priority", value: <span className={`text-xs px-2 py-0.5 rounded capitalize ${PRIORITY_COLORS[task.priority] || "bg-muted"}`}>{task.priority}</span> },
            { label: "Start", value: fmtDate(task.startDate) },
            { label: "End", value: fmtDate(task.endDate) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-muted-foreground">{label}</p>
              <div className="font-medium mt-0.5">{value}</div>
            </div>
          ))}
        </div>

        {(task.customerName || task.customerAddress) && (
          <div className="border rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> Customer Details
            </h4>
            {task.customerName && <p className="text-sm font-medium">{task.customerName}</p>}
            {task.customerAddress && <p className="text-xs text-muted-foreground leading-relaxed">{task.customerAddress}</p>}
          </div>
        )}

        {task.notes && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Notes</p>
            <p className="text-sm bg-muted/40 rounded p-3">{task.notes}</p>
          </div>
        )}

        {task.checkInTime && (
          <div className="flex items-start gap-2 p-3 bg-green-50/60 border border-green-100 rounded-md">
            <MapPin className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-700">Checked In at {fmtDT(task.checkInTime)}</p>
              {task.checkInLocationName && <p className="text-xs text-green-700">{task.checkInLocationName}</p>}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          {task.status === "pending" && (
            <Button className="flex-1" disabled={checkInMutation.isPending || gpsLoading} onClick={() => checkInMutation.mutate(task.id)} data-testid="button-task-checkin">
              {checkInMutation.isPending || gpsLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Navigation className="h-4 w-4 mr-2" />}
              Check In & Start
            </Button>
          )}
          {task.status === "in_progress" && (
            <Button className="flex-1 bg-green-600 hover:bg-green-700" disabled={completeMutation.isPending} onClick={() => completeMutation.mutate(task.id)} data-testid="button-task-complete">
              {completeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Mark Complete
            </Button>
          )}
          {task.status === "completed" && (
            <div className="flex items-center gap-2 text-green-600 font-medium text-sm">
              <CheckCircle className="h-5 w-5" /> Completed on {fmtDT(task.completedAt)}
            </div>
          )}
        </div>
      </div>
    );
  }

  const counts = {
    pending: taskList.filter(t => t.status === "pending").length,
    in_progress: taskList.filter(t => t.status === "in_progress").length,
    completed: taskList.filter(t => t.status === "completed").length,
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <ClipboardList className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">My Tasks</h3>
          <p className="text-xs text-muted-foreground">Tasks assigned to you</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pending", value: counts.pending, color: "text-amber-600" },
          { label: "In Progress", value: counts.in_progress, color: "text-green-700" },
          { label: "Completed", value: counts.completed, color: "text-green-600" },
        ].map(({ label, value, color }) => (
          <Card key={label} className="border">
            <CardContent className="p-3 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taskList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      No tasks assigned yet
                    </TableCell>
                  </TableRow>
                ) : (
                  taskList.map((task) => (
                    <TableRow key={task.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedTask(task)} data-testid={`row-my-task-${task.id}`}>
                      <TableCell>
                        <p className="text-primary font-medium text-sm">{task.taskCode}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[140px]">{task.title}</p>
                      </TableCell>
                      <TableCell className="text-xs">{task.customerName || "-"}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded capitalize ${PRIORITY_COLORS[task.priority] || "bg-muted"}`}>
                          {task.priority}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded border capitalize ${STATUS_COLORS[task.status] || "bg-muted"}`}>
                          {task.status.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtDate(task.endDate)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
