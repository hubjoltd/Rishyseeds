import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Expense, ExpenseComment, ExpenseAudit } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Search, CheckCircle, XCircle, History, MessageSquare,
  FileText, Send, Loader2, BanknoteIcon, IndianRupee, Gauge, Camera, Upload,
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

function StatusPipeline({ status }: { status: string }) {
  const steps = ["pending", "approved"];
  const isRejected = status === "rejected";
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
            <div className={`px-4 py-1.5 text-xs font-semibold rounded-sm border ${
              isActive
                ? "bg-primary text-white border-primary"
                : "bg-muted/50 text-muted-foreground border-muted"
            }`}>
              {step}
            </div>
            {i < 2 && <div className="w-4 h-0.5 bg-border" />}
          </div>
        );
      })}
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
      formData.append(field === "startingOdometerPhoto" ? "startingOdometerPhoto" : "endOdometerPhoto", file);
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`/api/expenses/${expenseId}/upload-photos`, {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      queryClient.invalidateQueries({ queryKey: ["/api/expenses", expenseId] });
      toast({ title: "Photo uploaded", description: "Odometer photo saved successfully." });
    } catch {
      toast({ title: "Upload failed", description: "Could not upload photo.", variant: "destructive" });
    } finally {
      setUploadingPhoto(null);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!expense) return <div className="p-8 text-center text-muted-foreground">Expense not found.</div>;

  return (
    <div className="animate-in fade-in">
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
          {expense.status === "pending" && (
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
          <Input
            className="max-w-[180px] h-9"
            placeholder="Approved amount (₹)"
            value={approvedAmount}
            onChange={(e) => setApprovedAmount(e.target.value)}
            type="number"
            data-testid="input-approved-amount"
          />
          <Button size="sm" disabled={approveMutation.isPending} onClick={() => approveMutation.mutate()} data-testid="button-confirm-approve">
            {approveMutation.isPending ? "..." : "Confirm Approve"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowApproveInput(false)}>Cancel</Button>
        </div>
      )}

      {showRejectInput && (
        <div className="px-6 py-3 border-b bg-destructive/5 flex items-center gap-3 flex-wrap">
          <Input
            className="max-w-xs h-9"
            placeholder="Rejection reason..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            data-testid="input-reject-reason"
          />
          <Button size="sm" variant="destructive" disabled={!rejectReason.trim() || rejectMutation.isPending} onClick={() => rejectMutation.mutate()} data-testid="button-confirm-reject">
            {rejectMutation.isPending ? "..." : "Confirm Reject"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowRejectInput(false)}>Cancel</Button>
        </div>
      )}

      <div className="flex min-h-[600px]">
        <div className="w-44 border-r shrink-0 py-4">
          {(["details", "audit", "comments"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                activeTab === tab ? "bg-primary/10 text-primary font-medium border-l-2 border-primary" : "text-muted-foreground hover:bg-muted/50"
              }`}
              data-testid={`tab-expense-${tab}`}
            >
              {tab === "details" ? "Details" : tab === "audit" ? "Audit History" : "Comments"}
            </button>
          ))}
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-muted-foreground">Status = <span className="capitalize font-semibold">{expense.status}</span></span>
          </div>

          {activeTab === "details" && (
            <div className="space-y-5 max-w-3xl">
              <div className="border rounded-lg p-5 space-y-4">
                <h3 className="font-semibold text-sm border-b pb-2">Expense Details</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Type *</label>
                    <div className="border rounded px-3 py-2 bg-muted/30">{expense.type}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Employee *</label>
                    <div className="border rounded px-3 py-2 bg-muted/30">{expense.employeeName}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Employee Id</label>
                    <div className="border rounded px-3 py-2 bg-muted/30">{expense.employeeCode}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Category *</label>
                    <div className="border rounded px-3 py-2 bg-muted/30">{expense.category}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Amount *</label>
                    <div className="border rounded px-3 py-2 bg-muted/30">{expense.amount}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Expense Date *</label>
                    <div className="border rounded px-3 py-2 bg-muted/30">{formatDate(expense.expenseDate)}</div>
                  </div>
                </div>
                {expense.description && (
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Description</label>
                    <div className="border rounded px-3 py-2 bg-muted/30 text-sm min-h-[60px]">{expense.description}</div>
                  </div>
                )}
              </div>

              <div className="border rounded-lg p-5 space-y-4">
                <h3 className="font-semibold text-sm border-b pb-2 flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-primary" /> Expense (Travel/Odometer)
                </h3>
                <div className="grid grid-cols-2 gap-5 text-sm">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Starting Odometer</label>
                      <div className="border rounded px-3 py-2 bg-muted/30">{expense.startingOdometer || "-"}</div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Starting Odometer picture</label>
                      <input ref={startPhotoRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handlePhotoUpload("startingOdometerPhoto", e.target.files[0]); }} />
                      {expense.startingOdometerPhoto ? (
                        <div className="relative group w-24 h-20">
                          <img src={expense.startingOdometerPhoto} alt="Start odometer" className="w-24 h-20 object-cover rounded border cursor-pointer hover:opacity-80" onClick={() => window.open(expense.startingOdometerPhoto!, "_blank")} data-testid="img-start-odometer" />
                          <button onClick={() => startPhotoRef.current?.click()} className="absolute inset-0 bg-black/50 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-xs">
                            <Upload className="h-4 w-4" /> Replace
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => startPhotoRef.current?.click()} className="w-24 h-20 border-2 border-dashed rounded flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors gap-1" data-testid="btn-upload-start-photo">
                          {uploadingPhoto === "start" ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Camera className="h-5 w-5" /><span className="text-xs">Upload</span></>}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">End Odometer</label>
                      <div className="border rounded px-3 py-2 bg-muted/30">{expense.endOdometer || "-"}</div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">End Odometer picture</label>
                      <input ref={endPhotoRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handlePhotoUpload("endOdometerPhoto", e.target.files[0]); }} />
                      {expense.endOdometerPhoto ? (
                        <div className="relative group w-24 h-20">
                          <img src={expense.endOdometerPhoto} alt="End odometer" className="w-24 h-20 object-cover rounded border cursor-pointer hover:opacity-80" onClick={() => window.open(expense.endOdometerPhoto!, "_blank")} data-testid="img-end-odometer" />
                          <button onClick={() => endPhotoRef.current?.click()} className="absolute inset-0 bg-black/50 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-xs">
                            <Upload className="h-4 w-4" /> Replace
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => endPhotoRef.current?.click()} className="w-24 h-20 border-2 border-dashed rounded flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors gap-1" data-testid="btn-upload-end-photo">
                          {uploadingPhoto === "end" ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Camera className="h-5 w-5" /><span className="text-xs">Upload</span></>}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm mt-2">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Total Distance</label>
                    <div className="border rounded px-3 py-2 bg-muted/30">{expense.totalDistance || "-"}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Amount /Km *</label>
                    <div className="border rounded px-3 py-2 bg-muted/30">{expense.amountPerKm || "1"}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Total Travel amount *</label>
                    <div className="border rounded px-3 py-2 bg-muted/30">{expense.totalTravelAmount || expense.amount}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Expense Category</label>
                    <div className="border rounded px-3 py-2 bg-muted/30">{expense.expenseCategory || "-"}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Amount</label>
                    <div className="border rounded px-3 py-2 bg-muted/30">{expense.amount}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Final Amount</label>
                    <div className="border rounded px-3 py-2 bg-muted/30 font-semibold text-primary">{expense.finalAmount || expense.amount}</div>
                  </div>
                </div>
                {expense.adminComment && (
                  <div className="p-3 bg-muted/40 rounded text-sm">
                    <p className="text-xs text-muted-foreground mb-1">Admin Comment</p>
                    <p>{expense.adminComment}</p>
                  </div>
                )}
                {expense.status === "pending" && (
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
                    {audit.map((entry) => {
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
                    <TableHead>Creator</TableHead>
                    <TableHead>Created By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!comments || comments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-16 text-muted-foreground">
                        <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        No comment found
                      </TableCell>
                    </TableRow>
                  ) : (
                    comments.map((c) => (
                      <TableRow key={c.id} data-testid={`expense-comment-${c.id}`}>
                        <TableCell>{c.message}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDT(c.createdAt)}</TableCell>
                        <TableCell>{c.createdByName}</TableCell>
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
                  data-testid="input-expense-comment"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && newComment.trim()) {
                      e.preventDefault();
                      commentMutation.mutate(newComment.trim());
                    }
                  }}
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

export default function Expenses() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: expenseList = [], isLoading } = useQuery<ExpenseWithEmployee[]>({
    queryKey: ["/api/expenses"],
  });

  if (selectedId) {
    return <ExpenseDetailPage expenseId={selectedId} onBack={() => setSelectedId(null)} />;
  }

  const filtered = expenseList.filter((exp) => {
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
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <BanknoteIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-3xl font-bold font-display text-primary" data-testid="text-page-title">Expenses</h2>
          <p className="text-muted-foreground text-sm">All Expenses</p>
        </div>
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
              <Input
                placeholder="Search expenses..."
                className="pl-9 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-search-expenses"
              />
            </div>
            <span className="text-sm text-muted-foreground">Fetch Total {filtered.length} of many items</span>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"><input type="checkbox" className="rounded" /></TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Id</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Work Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Claimed</TableHead>
                  <TableHead>Approved</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Status Updated On</TableHead>
                  <TableHead>Status Updated By</TableHead>
                  <TableHead>Created On</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={15} className="text-center text-muted-foreground py-14">
                      <BanknoteIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      No expense found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((exp) => (
                    <TableRow key={exp.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedId(exp.id)} data-testid={`row-expense-${exp.id}`}>
                      <TableCell onClick={(e) => e.stopPropagation()}><input type="checkbox" className="rounded" /></TableCell>
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
                      <TableCell className="text-xs text-muted-foreground">NA</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{exp.workLocation || "NA"}</TableCell>
                      <TableCell className="text-xs">{exp.type}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_COLORS[exp.status] || "secondary"} className="capitalize text-xs" data-testid={`badge-expense-status-${exp.id}`}>
                          {exp.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{exp.amount ? Number(exp.amount).toLocaleString() : "NA"}</TableCell>
                      <TableCell className="text-sm">{exp.approvedAmount ? Number(exp.approvedAmount).toLocaleString() : "NA"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{exp.adminComment || "NA"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{exp.statusUpdatedOn ? formatDT(exp.statusUpdatedOn) : "NA"}</TableCell>
                      <TableCell className="text-sm">{exp.statusUpdatedBy || "NA"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDT(exp.createdAt)}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" data-testid={`button-delete-expense-${exp.id}`}>
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          {filtered.length > 0 && (
            <div className="px-4 py-3 border-t flex items-center justify-between text-xs text-muted-foreground">
              <span>1 – {filtered.length} of {expenseList.length} items</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
