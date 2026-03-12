import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Fan, Pencil, Trash2, AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken } from "@/lib/queryClient";
import type { DryerEntry } from "@shared/schema";

function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const BINS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const dryerFormSchema = z.object({
  binNo: z.number().min(1).max(10),
  organiser: z.string().optional(),
  variety: z.string().optional(),
  intakeQuantity: z.string().optional(),
  dateOfIntake: z.string().min(1, "Date of intake is required"),
  shellingDate: z.string().optional(),
  shellingQty: z.string().optional(),
  intakeMoisture: z.string().optional(),
  remarks: z.string().optional(),
  status: z.string().optional(),
});

type DryerFormData = z.infer<typeof dryerFormSchema>;

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function getDaysSinceIntake(dateOfIntake: string): number {
  const intake = new Date(dateOfIntake);
  const now = new Date();
  intake.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.floor((now.getTime() - intake.getTime()) / (1000 * 60 * 60 * 24));
}

function getStatusBadge(entry: DryerEntry) {
  const days = getDaysSinceIntake(entry.dateOfIntake);
  if (entry.status === "outtake") {
    return <Badge className="bg-green-500 text-white" data-testid={`badge-status-${entry.id}`}><CheckCircle className="h-3 w-3 mr-1" />Out Take</Badge>;
  }
  if (entry.status === "intake") {
    if (days >= 5) {
      return <Badge variant="destructive" data-testid={`badge-status-${entry.id}`}><AlertTriangle className="h-3 w-3 mr-1" />Intake (Overdue {days}d)</Badge>;
    }
    if (days >= 4) {
      return <Badge className="bg-orange-500 text-white" data-testid={`badge-status-${entry.id}`}><Clock className="h-3 w-3 mr-1" />Intake (Due Tomorrow)</Badge>;
    }
    return <Badge className="bg-blue-500 text-white" data-testid={`badge-status-${entry.id}`}><Clock className="h-3 w-3 mr-1" />Intake (Day {days + 1}/5)</Badge>;
  }
  return <Badge className="bg-amber-500 text-white" data-testid={`badge-status-${entry.id}`}><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
}

export default function Dryer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DryerEntry | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedBin, setSelectedBin] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: entries, isLoading } = useQuery<DryerEntry[]>({
    queryKey: ["/api/dryer"],
  });

  useEffect(() => {
    if (entries && entries.length > 0) {
      const hasOverdue = entries.some(e => e.status === "intake" && getDaysSinceIntake(e.dateOfIntake) >= 5);
      if (hasOverdue) {
        fetch("/api/dryer/auto-expire", { method: "POST", headers: getAuthHeaders() })
          .then(res => res.json())
          .then(data => {
            if (data.expired > 0) {
              queryClient.invalidateQueries({ queryKey: ["/api/dryer"] });
              toast({ title: "Overdue Alert", description: `${data.expired} intake entries have exceeded 5 days!`, variant: "destructive" });
            }
          })
          .catch(() => {});
      }
    }
  }, [entries]);

  const form = useForm<DryerFormData>({
    resolver: zodResolver(dryerFormSchema),
    defaultValues: {
      binNo: 1,
      organiser: "",
      variety: "",
      intakeQuantity: "",
      dateOfIntake: new Date().toISOString().split("T")[0],
      shellingDate: "",
      shellingQty: "",
      intakeMoisture: "",
      remarks: "",
      status: "pending",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: DryerFormData) => {
      const payload = {
        ...data,
        fiveDayDueDate: addDays(data.dateOfIntake, 5),
        status: data.status || "pending",
      };
      const res = await fetch("/api/dryer", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || "Failed"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dryer"] });
      setOpen(false);
      form.reset();
      toast({ title: "Success", description: "Dryer entry created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: DryerFormData }) => {
      const payload = {
        ...data,
        fiveDayDueDate: addDays(data.dateOfIntake, 5),
        status: data.status || "pending",
      };
      const res = await fetch(`/api/dryer/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || "Failed"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dryer"] });
      setOpen(false);
      setEditingEntry(null);
      form.reset();
      toast({ title: "Success", description: "Dryer entry updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/dryer/${id}`, { method: "DELETE", headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dryer"] });
      setDeleteId(null);
      toast({ title: "Deleted", description: "Entry removed" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleEdit = (entry: DryerEntry) => {
    setEditingEntry(entry);
    form.reset({
      binNo: entry.binNo,
      organiser: entry.organiser || "",
      variety: entry.variety || "",
      intakeQuantity: entry.intakeQuantity || "",
      dateOfIntake: entry.dateOfIntake,
      shellingDate: entry.shellingDate || "",
      shellingQty: entry.shellingQty || "",
      intakeMoisture: entry.intakeMoisture || "",
      remarks: entry.remarks || "",
      status: entry.status,
    });
    setOpen(true);
  };

  const onSubmit = (data: DryerFormData) => {
    if (editingEntry) {
      updateMutation.mutate({ id: editingEntry.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const binOccupancy = (bin: number) => {
    return entries?.filter(e => e.binNo === bin && (e.status === "pending" || e.status === "intake")) || [];
  };

  const filteredEntries = (entries || []).filter(e => {
    if (selectedBin && e.binNo !== selectedBin) return false;
    if (filterStatus === "pending") return e.status === "pending";
    if (filterStatus === "intake") return e.status === "intake";
    if (filterStatus === "outtake") return e.status === "outtake";
    if (filterStatus === "overdue") return e.status === "intake" && getDaysSinceIntake(e.dateOfIntake) >= 5;
    return true;
  });

  const activeEntries = filteredEntries.filter(e => e.status !== "outtake");
  const reportEntries = (entries || []).filter(e => {
    if (selectedBin && e.binNo !== selectedBin) return false;
    return e.status === "outtake";
  });

  const overdueCount = (entries || []).filter(e => e.status === "intake" && getDaysSinceIntake(e.dateOfIntake) >= 5).length;
  const pendingCount = (entries || []).filter(e => e.status === "pending").length;
  const intakeCount = (entries || []).filter(e => e.status === "intake").length;
  const outtakeCount = (entries || []).filter(e => e.status === "outtake").length;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display text-primary" data-testid="text-dryer-title">Dryer Management</h2>
          <p className="text-muted-foreground">Manage shelling bins and track 5-day drying cycles</p>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) { setEditingEntry(null); form.reset(); } }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white" data-testid="button-new-entry">
              <Plus className="mr-2 h-4 w-4" /> New Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEntry ? "Edit Entry" : "New Dryer Entry"}</DialogTitle>
              <DialogDescription>Fill in the shelling/drying details</DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bin No *</label>
                  <Select value={String(form.watch("binNo"))} onValueChange={(v) => form.setValue("binNo", Number(v))}>
                    <SelectTrigger data-testid="select-bin-no"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BINS.map(b => <SelectItem key={b} value={String(b)}>Bin {b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date of Intake *</label>
                  <Input type="date" {...form.register("dateOfIntake")} data-testid="input-date-intake" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">5 Days Due Date (Auto)</label>
                  <Input
                    type="date"
                    readOnly
                    value={form.watch("dateOfIntake") ? addDays(form.watch("dateOfIntake"), 5) : ""}
                    className="bg-muted/50 cursor-not-allowed"
                    data-testid="input-five-day-due"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Organiser</label>
                  <Input {...form.register("organiser")} placeholder="e.g., Kotireddy" data-testid="input-organiser" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Variety</label>
                  <Input {...form.register("variety")} placeholder="e.g., 105, 1108" data-testid="input-variety" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Intake Quantity (Kg)</label>
                  <Input type="number" {...form.register("intakeQuantity")} placeholder="e.g., 12115" data-testid="input-intake-qty" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Intake Moisture (%)</label>
                  <Input type="number" step="0.1" {...form.register("intakeMoisture")} placeholder="e.g., 8.5" data-testid="input-intake-moisture" />
                </div>
              </div>
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-primary mb-3">Shelling Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Shelling Date</label>
                    <Input type="date" {...form.register("shellingDate")} data-testid="input-shelling-date" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Shelling Qty (Kg)</label>
                    <Input type="number" {...form.register("shellingQty")} placeholder="e.g., 6100" data-testid="input-shelling-qty" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={form.watch("status") || "pending"} onValueChange={(v) => form.setValue("status", v)}>
                    <SelectTrigger data-testid="select-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="intake">Intake</SelectItem>
                      <SelectItem value="outtake">Out Take</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Remarks</label>
                  <Textarea {...form.register("remarks")} placeholder="Add any notes or remarks" data-testid="input-remarks" />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-submit-entry">
                {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : (editingEntry ? "Update Entry" : "Create Entry")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {BINS.map(bin => {
          const occupied = binOccupancy(bin);
          const intakeInBin = occupied.filter(e => e.status === "intake");
          const hasOverdue = intakeInBin.some(e => getDaysSinceIntake(e.dateOfIntake) >= 5);
          const hasIntake = intakeInBin.length > 0;
          const hasPending = occupied.some(e => e.status === "pending");
          const hasEntries = occupied.length > 0;
          const statusPriority: Record<string, number> = { intake: 0, pending: 1, outtake: 2 };
          const sorted = [...occupied].sort((a, b) => {
            const sp = (statusPriority[a.status] ?? 3) - (statusPriority[b.status] ?? 3);
            if (sp !== 0) return sp;
            return new Date(b.dateOfIntake).getTime() - new Date(a.dateOfIntake).getTime();
          });
          const latestEntry = sorted.length > 0 ? sorted[0] : null;
          return (
            <Card
              key={bin}
              className={`cursor-pointer transition-all hover:shadow-md min-h-[140px] ${
                selectedBin === bin ? "ring-2 ring-primary" : ""
              } ${hasOverdue ? "border-destructive bg-destructive/5" : hasIntake ? "border-blue-400 bg-blue-50 dark:bg-blue-950/20" : hasPending ? "border-amber-400 bg-amber-50 dark:bg-amber-950/20" : hasEntries ? "border-green-400 bg-green-50 dark:bg-green-950/20" : "border-muted bg-muted/10"}`}
              onClick={() => setSelectedBin(selectedBin === bin ? null : bin)}
              data-testid={`card-bin-${bin}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Fan className={`h-5 w-5 ${hasOverdue ? "text-destructive" : hasIntake ? "text-blue-500" : hasPending ? "text-amber-500" : hasEntries ? "text-green-500" : "text-muted-foreground"}`} />
                    <span className="font-bold text-base">Bin {bin}</span>
                  </div>
                  {hasOverdue && <AlertTriangle className="h-4 w-4 text-destructive" />}
                  {!hasOverdue && hasEntries && (
                    <span className="text-xs text-muted-foreground">{occupied.length} entr{occupied.length === 1 ? "y" : "ies"}</span>
                  )}
                </div>
                {latestEntry ? (
                  <div className="space-y-1.5 text-sm">
                    {latestEntry.organiser && (
                      <div className="flex items-start gap-1">
                        <span className="text-muted-foreground font-medium min-w-[36px]">Org:</span>
                        <span className="truncate">{latestEntry.organiser}</span>
                      </div>
                    )}
                    {latestEntry.variety && (
                      <div className="flex items-start gap-1">
                        <span className="text-muted-foreground font-medium min-w-[36px]">Var:</span>
                        <span className="truncate">{latestEntry.variety}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-1">
                      <span className="text-muted-foreground font-medium min-w-[36px]">In:</span>
                      <span>{latestEntry.dateOfIntake}</span>
                    </div>
                    {latestEntry.intakeQuantity && (
                      <div className="flex items-start gap-1">
                        <span className="text-muted-foreground font-medium min-w-[36px]">Qty:</span>
                        <span>{latestEntry.intakeQuantity}</span>
                      </div>
                    )}
                    <div className="mt-2">
                      {getStatusBadge(latestEntry)}
                    </div>
                    {occupied.length > 1 && (
                      <p className="text-xs text-muted-foreground mt-1">+{occupied.length - 1} more entr{occupied.length - 1 === 1 ? "y" : "ies"}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[70px] text-muted-foreground">
                    <p className="text-sm">Empty</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant={filterStatus === "all" ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilterStatus("all")} data-testid="filter-all">
          All ({entries?.length || 0})
        </Badge>
        <Badge variant={filterStatus === "pending" ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilterStatus("pending")} data-testid="filter-pending">
          <Clock className="h-3 w-3 mr-1" /> Pending ({pendingCount})
        </Badge>
        <Badge variant={filterStatus === "intake" ? "default" : "outline"} className="cursor-pointer bg-blue-500" onClick={() => setFilterStatus("intake")} data-testid="filter-intake">
          <Clock className="h-3 w-3 mr-1" /> Intake ({intakeCount})
        </Badge>
        <Badge variant={filterStatus === "outtake" ? "default" : "outline"} className="cursor-pointer bg-green-500" onClick={() => setFilterStatus("outtake")} data-testid="filter-outtake">
          <CheckCircle className="h-3 w-3 mr-1" /> Out Take ({outtakeCount})
        </Badge>
        <Badge variant={filterStatus === "overdue" ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilterStatus("overdue")} data-testid="filter-overdue">
          <AlertTriangle className="h-3 w-3 mr-1" /> Overdue ({overdueCount})
        </Badge>
      </div>

      {overdueCount > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
            <div>
              <p className="font-semibold text-destructive" data-testid="text-overdue-warning">{overdueCount} entries have exceeded 5 days!</p>
              <p className="text-sm text-muted-foreground">These entries require remarks and will be auto-marked as 'Not Done'</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-0 shadow-lg shadow-primary/5">
        <CardHeader className="pb-0">
          <div className="flex items-center gap-2">
            <Fan className="h-5 w-5 text-primary" />
            <CardTitle>
              {selectedBin ? `Bin ${selectedBin} - Active Entries` : "Active Bin Entries"}
            </CardTitle>
            {selectedBin && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedBin(null)} data-testid="button-clear-bin-filter">
                Clear filter
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : activeEntries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No active entries. All completed entries are in the Report section below.</p>
          ) : (
            <div className="space-y-4">
              {(selectedBin ? [selectedBin] : BINS).map(bin => {
                const binEntries = activeEntries.filter(e => e.binNo === bin);
                if (binEntries.length === 0) return null;
                return (
                  <div key={bin} data-testid={`section-bin-${bin}`}>
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <Fan className="h-4 w-4 text-primary" />
                      <h3 className="font-bold text-sm text-primary">Bin {bin}</h3>
                      <Badge variant="outline" className="text-xs">{binEntries.length} entr{binEntries.length === 1 ? "y" : "ies"}</Badge>
                    </div>
                    <div className="overflow-x-auto border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="w-[50px]">S.No</TableHead>
                            <TableHead>Bin</TableHead>
                            <TableHead>Organiser</TableHead>
                            <TableHead>Variety</TableHead>
                            <TableHead>Intake Qty</TableHead>
                            <TableHead>Date of Intake</TableHead>
                            <TableHead>5-Day Due</TableHead>
                            <TableHead>Shelling Date</TableHead>
                            <TableHead>Shelling Qty</TableHead>
                            <TableHead>Days</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Remarks</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {binEntries.map((entry, idx) => {
                            const days = getDaysSinceIntake(entry.dateOfIntake);
                            const isOverdue = entry.status === "intake" && days >= 5;
                            return (
                              <TableRow key={entry.id} className={isOverdue ? "bg-destructive/5" : ""} data-testid={`row-dryer-${entry.id}`}>
                                <TableCell>{idx + 1}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="font-bold">Bin {entry.binNo}</Badge>
                                </TableCell>
                                <TableCell>{entry.organiser || "-"}</TableCell>
                                <TableCell>{entry.variety || "-"}</TableCell>
                                <TableCell>{entry.intakeQuantity ? `${Number(entry.intakeQuantity).toLocaleString()} Kg` : "-"}</TableCell>
                                <TableCell>{entry.dateOfIntake}</TableCell>
                                <TableCell className={isOverdue ? "text-destructive font-semibold" : ""}>{entry.fiveDayDueDate}</TableCell>
                                <TableCell>{entry.shellingDate || "-"}</TableCell>
                                <TableCell>{entry.shellingQty ? `${Number(entry.shellingQty).toLocaleString()} Kg` : "-"}</TableCell>
                                <TableCell>
                                  <span className={days >= 5 ? "text-destructive font-bold" : days >= 4 ? "text-orange-500 font-semibold" : ""}>
                                    {days}
                                  </span>
                                </TableCell>
                                <TableCell>{getStatusBadge(entry)}</TableCell>
                                <TableCell className="max-w-[150px] truncate text-xs" title={entry.remarks || ""}>
                                  {entry.remarks || "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(entry)} data-testid={`button-edit-dryer-${entry.id}`}>
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(entry.id)} data-testid={`button-delete-dryer-${entry.id}`}>
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg shadow-green-500/10 border-green-200 dark:border-green-800">
        <CardHeader className="pb-0">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <CardTitle className="text-green-700 dark:text-green-400">
              {selectedBin ? `Bin ${selectedBin} - Report (Shell Completed)` : "Report — Shell Completed"}
            </CardTitle>
            <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400">
              {reportEntries.length} entr{reportEntries.length === 1 ? "y" : "ies"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {reportEntries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No completed (outtake) entries yet.</p>
          ) : (
            <div className="space-y-4">
              {(selectedBin ? [selectedBin] : BINS).map(bin => {
                const binEntries = reportEntries.filter(e => e.binNo === bin);
                if (binEntries.length === 0) return null;
                return (
                  <div key={bin} data-testid={`section-report-bin-${bin}`}>
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <Fan className="h-4 w-4 text-green-600" />
                      <h3 className="font-bold text-sm text-green-700 dark:text-green-400">Bin {bin}</h3>
                      <Badge variant="outline" className="text-xs border-green-300 text-green-700">{binEntries.length} completed</Badge>
                    </div>
                    <div className="overflow-x-auto border border-green-200 dark:border-green-800 rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-green-50/80 dark:bg-green-950/20">
                            <TableHead className="w-[50px]">S.No</TableHead>
                            <TableHead>Bin</TableHead>
                            <TableHead>Organiser</TableHead>
                            <TableHead>Variety</TableHead>
                            <TableHead>Intake Qty</TableHead>
                            <TableHead>Date of Intake</TableHead>
                            <TableHead>5-Day Due</TableHead>
                            <TableHead>Shelling Date</TableHead>
                            <TableHead>Shelling Qty</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Remarks</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {binEntries.map((entry, idx) => (
                            <TableRow key={entry.id} className="bg-green-50/30 dark:bg-green-950/10" data-testid={`row-report-${entry.id}`}>
                              <TableCell>{idx + 1}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="font-bold border-green-300 text-green-700">Bin {entry.binNo}</Badge>
                              </TableCell>
                              <TableCell>{entry.organiser || "-"}</TableCell>
                              <TableCell>{entry.variety || "-"}</TableCell>
                              <TableCell>{entry.intakeQuantity ? `${Number(entry.intakeQuantity).toLocaleString()} Kg` : "-"}</TableCell>
                              <TableCell>{entry.dateOfIntake}</TableCell>
                              <TableCell>{entry.fiveDayDueDate}</TableCell>
                              <TableCell>{entry.shellingDate || "-"}</TableCell>
                              <TableCell>{entry.shellingQty ? `${Number(entry.shellingQty).toLocaleString()} Kg` : "-"}</TableCell>
                              <TableCell>{getStatusBadge(entry)}</TableCell>
                              <TableCell className="max-w-[150px] truncate text-xs" title={entry.remarks || ""}>
                                {entry.remarks || "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => handleEdit(entry)} data-testid={`button-edit-report-${entry.id}`}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(entry.id)} data-testid={`button-delete-report-${entry.id}`}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="button-confirm-delete">
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
