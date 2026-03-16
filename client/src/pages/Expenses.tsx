import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Expense, ExpenseComment, ExpenseAudit } from "@shared/schema";
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
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Search, CheckCircle, XCircle, History, MessageSquare,
  FileText, Send, Loader2, BanknoteIcon, Gauge, Camera, Upload,
  Plus, Pencil, Save, X,
} from "lucide-react";
import { format } from "date-fns";

interface ExpenseWithEmployee extends Expense {
  employeeName: string;
  employeeCode: string;
}

function formatDT(dt: string | Date | null | undefined) {
  if (!dt) return "-";
  try { return format(new Date(dt), "yyyy-MM-dd HH:mm"); } catch { return "-"; }
}

function formatDate(dt: string | Date | null | undefined) {
  if (!dt) return "-";
  try { return format(new Date(dt), "dd MMM yyyy"); } catch { return "-"; }
}

function getAuthHeader() {
  const t = localStorage.getItem("auth_token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

const STATUS_COLORS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
};

const EXPENSE_TYPES = [
  "LOCAL TRAVEL CLAIM", "FOOD & BEVERAGE", "ACCOMMODATION",
  "FUEL REIMBURSEMENT", "TELEPHONE / INTERNET", "STATIONERY / PRINTING",
  "PROMOTIONAL EXPENSE", "OTHER",
];

const EXPENSE_CATEGORIES = ["Food", "Fuel", "Travel", "Office", "Medical", "Accommodation", "Communication", "Other"];

function StatusPipeline({ status }: { status: string }) {
  return (
    <div className="flex items-center gap-0">
      {["Pending", "Approve", "Reject"].map((step, i) => {
        const stepKey = step.toLowerCase();
        const isActive =
          (stepKey === "pending" && status === "pending") ||
          (stepKey === "approve" && status === "approved") ||
          (stepKey === "reject" && status === "rejected");
        return (
          <div key={step} className="flex items-center gap-0">
            <div className={`px-4 py-1.5 text-xs font-semibold rounded-sm border ${isActive ? "bg-primary text-white border-primary" : "bg-muted/50 text-muted-foreground border-muted"}`}>
              {step}
            </div>
            {i < 2 && <div className="w-4 h-0.5 bg-border" />}
          </div>
        );
      })}
    </div>
  );
}

function FieldRow({ label, value, editMode, children }: { label: string; value?: React.ReactNode; editMode?: boolean; children?: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {editMode && children ? children : (
        <div className="border rounded px-3 py-2 bg-muted/30 text-sm min-h-[36px] flex items-center">{value ?? "-"}</div>
      )}
    </div>
  );
}

function ExpenseDetailPage({ expenseId, onBack }: { expenseId: number; onBack: () => void }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"details" | "audit" | "comments">("details");
  const [showApproveInput, setShowApproveInput] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [approvedAmount, setApprovedAmount] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [newComment, setNewComment] = useState("");
  const startPhotoRef = useRef<HTMLInputElement>(null);
  const endPhotoRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState<"start" | "end" | null>(null);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState<Record<string, string>>({});

  const { data: expense, isLoading } = useQuery<ExpenseWithEmployee>({
    queryKey: ["/api/expenses", expenseId],
    queryFn: async () => {
      const res = await fetch(`/api/expenses/${expenseId}`, { headers: getAuthHeader() });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: comments } = useQuery<ExpenseComment[]>({
    queryKey: ["/api/expenses", expenseId, "comments"],
    queryFn: async () => {
      const res = await fetch(`/api/expenses/${expenseId}/comments`, { headers: getAuthHeader() });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: activeTab === "comments",
  });

  const { data: audit } = useQuery<ExpenseAudit[]>({
    queryKey: ["/api/expenses", expenseId, "audit"],
    queryFn: async () => {
      const res = await fetch(`/api/expenses/${expenseId}/audit`, { headers: getAuthHeader() });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: activeTab === "audit",
  });

  function startEdit() {
    if (!expense) return;
    setEditFields({
      title: expense.title || "",
      category: expense.category || "Expense",
      type: expense.type || "",
      amount: expense.amount || "",
      expenseDate: expense.expenseDate || format(new Date(), "yyyy-MM-dd"),
      description: expense.description || "",
      workLocation: expense.workLocation || "",
      startingOdometer: expense.startingOdometer || "",
      endOdometer: expense.endOdometer || "",
      totalDistance: expense.totalDistance || "",
      amountPerKm: expense.amountPerKm || "1",
      totalTravelAmount: expense.totalTravelAmount || "",
      expenseCategory: expense.expenseCategory || "",
      finalAmount: expense.finalAmount || expense.amount || "",
      adminComment: expense.adminComment || "",
    });
    setEditMode(true);
  }

  function setField(key: string, val: string) {
    setEditFields(prev => {
      const next = { ...prev, [key]: val };
      // Auto-calculate when odometer fields change
      const start = Number(next.startingOdometer) || 0;
      const end = Number(next.endOdometer) || 0;
      const rate = Number(next.amountPerKm) || 1;
      if (key === "startingOdometer" || key === "endOdometer" || key === "amountPerKm") {
        const dist = end > start ? end - start : 0;
        next.totalDistance = dist > 0 ? String(dist) : prev.totalDistance;
        const travel = dist * rate;
        next.totalTravelAmount = dist > 0 ? String(travel) : prev.totalTravelAmount;
        next.finalAmount = travel > 0 ? String(travel) : prev.finalAmount;
      }
      return next;
    });
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/expenses/${expenseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(editFields),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || "Failed"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", expenseId] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setEditMode(false);
      toast({ title: "Expense updated successfully" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/expenses/${expenseId}/approve`, {
        approvedAmount: approvedAmount || expense?.amount,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", expenseId] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", expenseId, "audit"] });
      setShowApproveInput(false);
      toast({ title: "Expense Approved" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/expenses/${expenseId}/reject`, { reason: rejectReason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", expenseId] });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", expenseId, "audit"] });
      setShowRejectInput(false);
      setRejectReason("");
      toast({ title: "Expense Rejected" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const commentMutation = useMutation({
    mutationFn: async (msg: string) => {
      const res = await fetch(`/api/expenses/${expenseId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ message: msg }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", expenseId, "comments"] });
      setNewComment("");
    },
    onError: () => toast({ title: "Error", description: "Failed to add comment", variant: "destructive" }),
  });

  const handlePhotoUpload = async (field: "startingOdometerPhoto" | "endOdometerPhoto", file: File) => {
    const which = field === "startingOdometerPhoto" ? "start" : "end";
    setUploadingPhoto(which);
    try {
      const formData = new FormData();
      formData.append(field, file);
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`/api/expenses/${expenseId}/upload-photos`, {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", expenseId] });
      toast({ title: "Photo uploaded" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploadingPhoto(null);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!expense) return <div className="p-8 text-center text-muted-foreground">Expense not found.</div>;

  const ef = editFields;

  return (
    <div className="animate-in fade-in">
      {/* Header */}
      <div className="border-b bg-card px-6 py-3 flex items-center gap-4 flex-wrap">
        <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back-expense">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BanknoteIcon className="h-4 w-4" />
          <span>Expense</span>
          <span>/</span>
          <span className="text-foreground font-medium">{expense.expenseCode}</span>
        </div>
        <div className="ml-auto flex items-center gap-3 flex-wrap">
          <StatusPipeline status={expense.status} />
          {!editMode ? (
            <Button size="sm" variant="outline" onClick={startEdit} data-testid="button-edit-expense">
              <Pencil className="h-4 w-4 mr-1" /> Edit
            </Button>
          ) : (
            <>
              <Button size="sm" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()} data-testid="button-save-expense">
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />} Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditMode(false)} data-testid="button-cancel-edit">
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
            </>
          )}
          {expense.status === "pending" && !editMode && (
            <>
              <Button size="sm" onClick={() => { setShowApproveInput(v => !v); setShowRejectInput(false); }} data-testid="button-approve-expense">
                <CheckCircle className="h-4 w-4 mr-1" /> Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={() => { setShowRejectInput(v => !v); setShowApproveInput(false); }} data-testid="button-reject-expense">
                <XCircle className="h-4 w-4 mr-1" /> Reject
              </Button>
            </>
          )}
        </div>
      </div>

      {showApproveInput && (
        <div className="px-6 py-3 border-b bg-green-50/60 flex items-center gap-3 flex-wrap">
          <Input className="max-w-[180px] h-9" placeholder="Approved amount (₹)" value={approvedAmount} onChange={e => setApprovedAmount(e.target.value)} type="number" data-testid="input-approved-amount" />
          <Button size="sm" disabled={approveMutation.isPending} onClick={() => approveMutation.mutate()} data-testid="button-confirm-approve">
            {approveMutation.isPending ? "..." : "Confirm Approve"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowApproveInput(false)}>Cancel</Button>
        </div>
      )}

      {showRejectInput && (
        <div className="px-6 py-3 border-b bg-destructive/5 flex items-center gap-3 flex-wrap">
          <Input className="max-w-xs h-9" placeholder="Rejection reason..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} data-testid="input-reject-reason" />
          <Button size="sm" variant="destructive" disabled={!rejectReason.trim() || rejectMutation.isPending} onClick={() => rejectMutation.mutate()} data-testid="button-confirm-reject">
            {rejectMutation.isPending ? "..." : "Confirm Reject"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowRejectInput(false)}>Cancel</Button>
        </div>
      )}

      <div className="flex min-h-[600px]">
        {/* Sidebar tabs */}
        <div className="w-44 border-r shrink-0 py-4">
          {(["details", "audit", "comments"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${activeTab === tab ? "bg-primary/10 text-primary font-medium border-l-2 border-primary" : "text-muted-foreground hover:bg-muted/50"}`}
              data-testid={`tab-expense-${tab}`}
            >
              {tab === "details" ? "Details" : tab === "audit" ? "Audit History" : "Comments"}
            </button>
          ))}
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {editMode && (
            <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs font-medium">
              <Pencil className="h-3.5 w-3.5" /> Edit mode — modify fields and click Save
            </div>
          )}

          {activeTab === "details" && (
            <div className="space-y-5 max-w-3xl">
              {/* Core details */}
              <div className="border rounded-lg p-5 space-y-4">
                <h3 className="font-semibold text-sm border-b pb-2">Expense Details</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <FieldRow label="Employee" value={expense.employeeName} />
                  <FieldRow label="Employee ID" value={expense.employeeCode} />
                  <FieldRow label="Expense Code" value={expense.expenseCode} />

                  <FieldRow label="Category *" value={expense.category} editMode={editMode}>
                    <Select value={ef.category} onValueChange={v => setField("category", v)}>
                      <SelectTrigger className="h-9" data-testid="select-edit-category"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Expense", "Travel", "Food", "Accommodation", "Other"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FieldRow>

                  <FieldRow label="Type *" value={expense.type} editMode={editMode}>
                    <Select value={ef.type} onValueChange={v => setField("type", v)}>
                      <SelectTrigger className="h-9" data-testid="select-edit-type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {EXPENSE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FieldRow>

                  <FieldRow label="Expense Date *" value={formatDate(expense.expenseDate)} editMode={editMode}>
                    <Input type="date" value={ef.expenseDate} onChange={e => setField("expenseDate", e.target.value)} className="h-9" data-testid="input-edit-date" />
                  </FieldRow>

                  <div className="col-span-3">
                    <FieldRow label="Title" value={expense.title} editMode={editMode}>
                      <Input value={ef.title} onChange={e => setField("title", e.target.value)} className="h-9" data-testid="input-edit-title" />
                    </FieldRow>
                  </div>

                  <div className="col-span-3">
                    <FieldRow label="Description" value={expense.description} editMode={editMode}>
                      <Textarea value={ef.description} onChange={e => setField("description", e.target.value)} className="min-h-[60px] resize-none" data-testid="input-edit-description" />
                    </FieldRow>
                  </div>

                  <FieldRow label="Work Location" value={expense.workLocation} editMode={editMode}>
                    <Input value={ef.workLocation} onChange={e => setField("workLocation", e.target.value)} className="h-9" data-testid="input-edit-location" />
                  </FieldRow>

                  <FieldRow label="Admin Comment" value={expense.adminComment} editMode={editMode}>
                    <Input value={ef.adminComment} onChange={e => setField("adminComment", e.target.value)} className="h-9" data-testid="input-edit-admin-comment" placeholder="Leave a comment..." />
                  </FieldRow>
                </div>
              </div>

              {/* Odometer section */}
              <div className="border rounded-lg p-5 space-y-4">
                <h3 className="font-semibold text-sm border-b pb-2 flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-primary" /> Expense (Travel / Odometer)
                </h3>

                <div className="grid grid-cols-2 gap-5 text-sm">
                  {/* Start side */}
                  <div className="space-y-3">
                    <FieldRow label="Starting Odometer" value={expense.startingOdometer || "-"} editMode={editMode}>
                      <Input type="number" value={ef.startingOdometer} onChange={e => setField("startingOdometer", e.target.value)} className="h-9" placeholder="Starting km" data-testid="input-edit-start-odo" />
                    </FieldRow>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Starting Odometer picture</Label>
                      <input ref={startPhotoRef} type="file" accept="image/*" className="hidden"
                        onChange={e => { if (e.target.files?.[0]) handlePhotoUpload("startingOdometerPhoto", e.target.files[0]); }} />
                      {expense.startingOdometerPhoto ? (
                        <div className="relative group w-24 h-20">
                          <img src={expense.startingOdometerPhoto} alt="Start odometer" className="w-24 h-20 object-cover rounded border cursor-pointer hover:opacity-80"
                            onClick={() => window.open(expense.startingOdometerPhoto!, "_blank")} data-testid="img-start-odometer" />
                          <button onClick={() => startPhotoRef.current?.click()}
                            className="absolute inset-0 bg-black/50 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-xs">
                            <Upload className="h-4 w-4" /> Replace
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => startPhotoRef.current?.click()}
                          className="w-24 h-20 border-2 border-dashed rounded flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors gap-1"
                          data-testid="btn-upload-start-photo">
                          {uploadingPhoto === "start" ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Camera className="h-5 w-5" /><span className="text-xs">Upload</span></>}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* End side */}
                  <div className="space-y-3">
                    <FieldRow label="End Odometer" value={expense.endOdometer || "-"} editMode={editMode}>
                      <Input type="number" value={ef.endOdometer} onChange={e => setField("endOdometer", e.target.value)} className="h-9" placeholder="Ending km" data-testid="input-edit-end-odo" />
                    </FieldRow>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">End Odometer picture</Label>
                      <input ref={endPhotoRef} type="file" accept="image/*" className="hidden"
                        onChange={e => { if (e.target.files?.[0]) handlePhotoUpload("endOdometerPhoto", e.target.files[0]); }} />
                      {expense.endOdometerPhoto ? (
                        <div className="relative group w-24 h-20">
                          <img src={expense.endOdometerPhoto} alt="End odometer" className="w-24 h-20 object-cover rounded border cursor-pointer hover:opacity-80"
                            onClick={() => window.open(expense.endOdometerPhoto!, "_blank")} data-testid="img-end-odometer" />
                          <button onClick={() => endPhotoRef.current?.click()}
                            className="absolute inset-0 bg-black/50 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-xs">
                            <Upload className="h-4 w-4" /> Replace
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => endPhotoRef.current?.click()}
                          className="w-24 h-20 border-2 border-dashed rounded flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors gap-1"
                          data-testid="btn-upload-end-photo">
                          {uploadingPhoto === "end" ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Camera className="h-5 w-5" /><span className="text-xs">Upload</span></>}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Calculated fields row */}
                <div className="grid grid-cols-4 gap-4 text-sm mt-2">
                  <FieldRow label="Total Distance (km)" value={expense.totalDistance || "-"} editMode={editMode}>
                    <Input type="number" value={ef.totalDistance} onChange={e => setField("totalDistance", e.target.value)} className="h-9" data-testid="input-edit-distance" />
                  </FieldRow>

                  {/* RATE FIELD — highlighted */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground font-semibold text-primary">Amount /Km (Rate) *</Label>
                    {editMode ? (
                      <Input
                        type="number"
                        value={ef.amountPerKm}
                        onChange={e => setField("amountPerKm", e.target.value)}
                        className="h-9 border-primary ring-1 ring-primary/30 font-semibold"
                        placeholder="Rate per km"
                        data-testid="input-edit-rate"
                      />
                    ) : (
                      <div className="border rounded px-3 py-2 bg-primary/5 text-sm font-semibold text-primary min-h-[36px] flex items-center">
                        ₹ {expense.amountPerKm || "1"}
                      </div>
                    )}
                  </div>

                  <FieldRow label="Total Travel Amount *" value={expense.totalTravelAmount ? `₹ ${Number(expense.totalTravelAmount).toLocaleString()}` : "-"} editMode={editMode}>
                    <Input type="number" value={ef.totalTravelAmount} onChange={e => setField("totalTravelAmount", e.target.value)} className="h-9" data-testid="input-edit-travel-amt" />
                  </FieldRow>

                  <FieldRow label="Expense Category" value={expense.expenseCategory || "-"} editMode={editMode}>
                    <Select value={ef.expenseCategory || ""} onValueChange={v => setField("expenseCategory", v)}>
                      <SelectTrigger className="h-9" data-testid="select-edit-exp-cat"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FieldRow>

                  <FieldRow label="Amount" value={expense.amount ? `₹ ${Number(expense.amount).toLocaleString()}` : "-"} editMode={editMode}>
                    <Input type="number" value={ef.amount} onChange={e => setField("amount", e.target.value)} className="h-9" data-testid="input-edit-amount" />
                  </FieldRow>

                  <FieldRow label="Final Amount" value={expense.finalAmount ? `₹ ${Number(expense.finalAmount).toLocaleString()}` : "-"} editMode={editMode}>
                    <Input type="number" value={ef.finalAmount} onChange={e => setField("finalAmount", e.target.value)} className="h-9 font-semibold" data-testid="input-edit-final-amount" />
                  </FieldRow>
                </div>

                {/* Save button shortcut inside odometer section */}
                {editMode && (
                  <div className="flex gap-2 pt-3 border-t">
                    <Button size="sm" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()} data-testid="button-save-odometer">
                      {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />} Save Changes
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
                  </div>
                )}

                {expense.status === "pending" && !editMode && (
                  <div className="flex gap-3 pt-2 border-t">
                    <Button size="sm" onClick={() => setShowApproveInput(true)} data-testid="button-approve-bottom">
                      <CheckCircle className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setShowRejectInput(true)} data-testid="button-reject-bottom">
                      <XCircle className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "audit" && (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <History className="h-4 w-4 text-primary" /> Audit History
              </h3>
              {!audit || audit.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <History className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No audit history yet</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />
                  <div className="space-y-5">
                    {audit.map(entry => {
                      const colors: Record<string, string> = { approved: "bg-green-500", rejected: "bg-red-500", pending: "bg-blue-500" };
                      return (
                        <div key={entry.id} className="relative flex gap-4 pl-8" data-testid={`expense-audit-${entry.id}`}>
                          <div className={`absolute left-1.5 w-3 h-3 rounded-full ${colors[entry.toStatus] || "bg-gray-400"} mt-1`} />
                          <div className="bg-muted/30 border rounded-lg p-3 flex-1">
                            <p className="text-xs font-semibold text-primary mb-0.5">Stage → {entry.toStatus.charAt(0).toUpperCase() + entry.toStatus.slice(1)}</p>
                            <p className="text-xs text-muted-foreground">{entry.changedByName} — {formatDT(entry.changedAt)}</p>
                            {entry.notes && <p className="text-xs mt-1 italic">{entry.notes}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "comments" && (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Message</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Created By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!comments || comments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-16 text-muted-foreground">
                        <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        No comments yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    comments.map(c => (
                      <TableRow key={c.id} data-testid={`expense-comment-${c.id}`}>
                        <TableCell>{c.message}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDT(c.createdAt)}</TableCell>
                        <TableCell className="text-sm">{c.createdByName}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <div className="flex gap-2 pt-2 border-t">
                <Textarea value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add a comment..." className="min-h-[60px] resize-none"
                  data-testid="input-expense-comment"
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && newComment.trim()) { e.preventDefault(); commentMutation.mutate(newComment.trim()); } }}
                />
                <Button size="icon" onClick={() => newComment.trim() && commentMutation.mutate(newComment.trim())} disabled={!newComment.trim() || commentMutation.isPending} data-testid="button-send-expense-comment">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== Create Expense Dialog =====
function CreateExpenseModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: number) => void }) {
  const { toast } = useToast();

  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ["/api/employees"],
  });

  const [form, setForm] = useState({
    employeeDbId: "",
    title: "",
    category: "Expense",
    type: "LOCAL TRAVEL CLAIM",
    expenseDate: format(new Date(), "yyyy-MM-dd"),
    description: "",
    workLocation: "",
    startingOdometer: "",
    endOdometer: "",
    amountPerKm: "1",
    totalDistance: "",
    totalTravelAmount: "",
    expenseCategory: "",
    amount: "",
    finalAmount: "",
    adminComment: "",
  });

  function set(key: string, val: string) {
    setForm(prev => {
      const next = { ...prev, [key]: val };
      if (key === "startingOdometer" || key === "endOdometer" || key === "amountPerKm") {
        const start = Number(next.startingOdometer) || 0;
        const end = Number(next.endOdometer) || 0;
        const rate = Number(next.amountPerKm) || 1;
        const dist = end > start ? end - start : 0;
        next.totalDistance = dist > 0 ? String(dist) : next.totalDistance;
        const travel = dist * rate;
        next.totalTravelAmount = dist > 0 ? String(travel) : next.totalTravelAmount;
        next.finalAmount = travel > 0 ? String(travel) : next.finalAmount;
      }
      return next;
    });
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!form.employeeDbId) throw new Error("Please select an employee");
      if (!form.expenseDate) throw new Error("Please set the expense date");
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({
          ...form,
          employeeDbId: Number(form.employeeDbId),
          amount: form.amount || form.finalAmount || "0",
          finalAmount: form.finalAmount || form.amount || "0",
        }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || "Failed"); }
      return res.json();
    },
    onSuccess: (exp) => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({ title: "Expense created" });
      onCreated(exp.id);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const totalDist = Number(form.endOdometer) - Number(form.startingOdometer);
  const travelAmt = totalDist > 0 ? totalDist * (Number(form.amountPerKm) || 1) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">New Expense</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Employee + basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs text-muted-foreground">Employee *</Label>
              <Select value={form.employeeDbId} onValueChange={v => set("employeeDbId", v)}>
                <SelectTrigger data-testid="select-new-employee"><SelectValue placeholder="Select employee..." /></SelectTrigger>
                <SelectContent>
                  {employees.map((e: any) => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.fullName} ({e.employeeId})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Expense Type *</Label>
              <Select value={form.type} onValueChange={v => set("type", v)}>
                <SelectTrigger data-testid="select-new-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Category *</Label>
              <Select value={form.category} onValueChange={v => set("category", v)}>
                <SelectTrigger data-testid="select-new-category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Expense", "Travel", "Food", "Accommodation", "Other"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Expense Date *</Label>
              <Input type="date" value={form.expenseDate} onChange={e => set("expenseDate", e.target.value)} data-testid="input-new-date" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Expense Category</Label>
              <Select value={form.expenseCategory} onValueChange={v => set("expenseCategory", v)}>
                <SelectTrigger data-testid="select-new-exp-cat"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Title</Label>
              <Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Leave blank to auto-generate" data-testid="input-new-title" />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Work Location</Label>
              <Input value={form.workLocation} onChange={e => set("workLocation", e.target.value)} data-testid="input-new-location" />
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Textarea value={form.description} onChange={e => set("description", e.target.value)} className="min-h-[60px] resize-none" data-testid="input-new-description" />
            </div>
          </div>

          {/* Odometer section */}
          <div className="border rounded-lg p-4 space-y-4">
            <h4 className="text-sm font-semibold flex items-center gap-2 border-b pb-2">
              <Gauge className="h-4 w-4 text-primary" /> Odometer / Travel
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Starting Odometer (km)</Label>
                <Input type="number" placeholder="e.g. 50000" value={form.startingOdometer} onChange={e => set("startingOdometer", e.target.value)} data-testid="input-new-start-odo" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">End Odometer (km)</Label>
                <Input type="number" placeholder="e.g. 50185" value={form.endOdometer} onChange={e => set("endOdometer", e.target.value)} data-testid="input-new-end-odo" />
              </div>

              {/* Rate field — emphasized */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground font-semibold text-primary">Amount / Km (Rate) *</Label>
                <Input
                  type="number"
                  value={form.amountPerKm}
                  onChange={e => set("amountPerKm", e.target.value)}
                  className="border-primary ring-1 ring-primary/30 font-semibold"
                  placeholder="Rate per km"
                  data-testid="input-new-rate"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Expense Category</Label>
                <Input value={form.expenseCategory} placeholder="e.g. Fuel" readOnly className="bg-muted/30" />
              </div>
            </div>

            {totalDist > 0 && (
              <div className="grid grid-cols-3 gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                <div><p className="text-xs text-muted-foreground">Distance</p><p className="font-bold text-sm">{totalDist} km</p></div>
                <div><p className="text-xs text-muted-foreground">Travel Amount</p><p className="font-bold text-sm text-primary">₹ {travelAmt.toFixed(0)}</p></div>
                <div><p className="text-xs text-muted-foreground">Final Amount</p><p className="font-bold text-sm text-primary">₹ {form.finalAmount || travelAmt.toFixed(0)}</p></div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Amount (₹)</Label>
                <Input type="number" value={form.amount} onChange={e => set("amount", e.target.value)} placeholder="Manual amount" data-testid="input-new-amount" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Final Amount (₹)</Label>
                <Input type="number" value={form.finalAmount} onChange={e => set("finalAmount", e.target.value)} placeholder="Auto-calculated" data-testid="input-new-final" />
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={createMutation.isPending || !form.employeeDbId} onClick={() => createMutation.mutate()} data-testid="button-create-expense">
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Create Expense
          </Button>
        </div>
      </div>
    </div>
  );
}

// ===== Main list page =====
export default function Expenses() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: expenseList = [], isLoading } = useQuery<ExpenseWithEmployee[]>({
    queryKey: ["/api/expenses"],
  });

  if (selectedId) {
    return <ExpenseDetailPage expenseId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  const filtered = expenseList.filter(exp => {
    const matchSearch =
      exp.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      exp.expenseCode.toLowerCase().includes(search.toLowerCase()) ||
      (exp.title || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || exp.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const tabs = [
    { key: "all", label: "All Expenses" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];

  return (
    <div className="space-y-5 animate-in fade-in">
      {showCreate && (
        <CreateExpenseModal
          onClose={() => setShowCreate(false)}
          onCreated={id => { setShowCreate(false); setSelectedId(id); }}
        />
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BanknoteIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-bold font-display text-primary" data-testid="text-page-title">Expenses</h2>
            <p className="text-muted-foreground text-sm">All Expenses</p>
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)} data-testid="button-new-expense">
          <Plus className="h-4 w-4 mr-2" /> New Expense
        </Button>
      </div>

      <div className="border-b">
        <div className="flex items-center gap-1 overflow-x-auto">
          {tabs.map(({ key, label }) => (
            <button key={key} onClick={() => setStatusFilter(key)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${statusFilter === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              data-testid={`tab-expense-filter-${key}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="p-0">
          <div className="flex items-center gap-3 p-4 border-b justify-between flex-wrap">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search expenses..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} data-testid="input-search-expenses" />
            </div>
            <span className="text-sm text-muted-foreground">{filtered.length} of {expenseList.length} items</span>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Rate/km</TableHead>
                  <TableHead>Claimed</TableHead>
                  <TableHead>Approved</TableHead>
                  <TableHead>Created On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-14">
                      <BanknoteIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      No expense found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(exp => (
                    <TableRow key={exp.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedId(exp.id)} data-testid={`row-expense-${exp.id}`}>
                      <TableCell>
                        <span className="text-primary text-sm font-medium hover:underline" data-testid={`text-expense-title-${exp.id}`}>
                          {exp.title || exp.expenseCode}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{exp.expenseCode}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {exp.employeeName.charAt(0)}
                          </div>
                          <span className="text-sm">{exp.employeeName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{exp.type}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_COLORS[exp.status] || "secondary"} className="capitalize text-xs" data-testid={`badge-expense-status-${exp.id}`}>
                          {exp.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{exp.totalDistance ? `${exp.totalDistance} km` : "-"}</TableCell>
                      <TableCell className="text-sm font-medium text-primary">{exp.amountPerKm ? `₹${exp.amountPerKm}/km` : "-"}</TableCell>
                      <TableCell className="text-sm">{exp.amount ? `₹${Number(exp.amount).toLocaleString()}` : "-"}</TableCell>
                      <TableCell className="text-sm">{exp.approvedAmount ? `₹${Number(exp.approvedAmount).toLocaleString()}` : "-"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDT(exp.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          {filtered.length > 0 && (
            <div className="px-4 py-3 border-t text-xs text-muted-foreground">
              {filtered.length} of {expenseList.length} items
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
