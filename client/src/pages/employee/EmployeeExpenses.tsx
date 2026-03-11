import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, BanknoteIcon, ArrowLeft, Loader2, Gauge, CheckCircle, XCircle, Camera,
} from "lucide-react";
import { format } from "date-fns";
import { getEmployeeToken } from "../EmployeeLogin";

function getHeaders() {
  const t = getEmployeeToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

interface EmployeeExpensesProps {
  employee: { id: number; fullName: string; employeeId: string; workLocation?: string };
}

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
};

function formatDT(dt: string | null | undefined) {
  if (!dt) return "-";
  try { return format(new Date(dt), "dd MMM yyyy, hh:mm a"); } catch { return "-"; }
}

export default function EmployeeExpenses({ employee }: EmployeeExpensesProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);

  const [form, setForm] = useState({
    category: "Expense",
    type: "Expense",
    amount: "",
    expenseDate: format(new Date(), "yyyy-MM-dd"),
    description: "",
    workLocation: employee.workLocation || "",
    startingOdometer: "",
    endOdometer: "",
    amountPerKm: "1",
    expenseCategory: "",
  });

  const { data: expenseList = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/employee/expenses"],
    queryFn: async () => {
      const res = await fetch("/api/employee/expenses", { headers: getHeaders() });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const startOdo = Number(form.startingOdometer) || 0;
      const endOdo = Number(form.endOdometer) || 0;
      const totalDistance = endOdo > startOdo ? endOdo - startOdo : undefined;
      const amtPerKm = Number(form.amountPerKm) || 1;
      const totalTravel = totalDistance ? totalDistance * amtPerKm : undefined;
      const payload = {
        category: form.category,
        type: form.type,
        amount: form.amount || (totalTravel ? String(totalTravel) : "0"),
        expenseDate: form.expenseDate,
        description: form.description,
        workLocation: form.workLocation,
        startingOdometer: form.startingOdometer || undefined,
        endOdometer: form.endOdometer || undefined,
        totalDistance: totalDistance ? String(totalDistance) : undefined,
        amountPerKm: form.amountPerKm,
        totalTravelAmount: totalTravel ? String(totalTravel) : undefined,
        expenseCategory: form.expenseCategory || undefined,
        finalAmount: form.amount || (totalTravel ? String(totalTravel) : "0"),
      };
      const res = await fetch("/api/employee/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getHeaders() },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || "Failed"); }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/employee/expenses"] });
      setShowForm(false);
      setForm({
        category: "Expense", type: "Expense", amount: "", expenseDate: format(new Date(), "yyyy-MM-dd"),
        description: "", workLocation: employee.workLocation || "", startingOdometer: "",
        endOdometer: "", amountPerKm: "1", expenseCategory: "",
      });
      toast({ title: "Expense submitted successfully" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const startOdoNum = Number(form.startingOdometer) || 0;
  const endOdoNum = Number(form.endOdometer) || 0;
  const computedDistance = endOdoNum > startOdoNum ? endOdoNum - startOdoNum : 0;
  const computedTravel = computedDistance * (Number(form.amountPerKm) || 1);

  if (selectedExpense) {
    return (
      <div className="space-y-4 animate-in fade-in">
        <div className="flex items-center gap-3 border-b pb-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedExpense(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h3 className="font-semibold">{selectedExpense.title || selectedExpense.expenseCode}</h3>
            <p className="text-xs text-muted-foreground">{selectedExpense.expenseCode}</p>
          </div>
          <Badge variant={STATUS_COLORS[selectedExpense.status] || "secondary"} className="ml-auto capitalize">
            {selectedExpense.status}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            { label: "Category", value: selectedExpense.category },
            { label: "Type", value: selectedExpense.type },
            { label: "Amount", value: selectedExpense.amount ? `₹${Number(selectedExpense.amount).toLocaleString()}` : "-" },
            { label: "Expense Date", value: formatDT(selectedExpense.expenseDate) },
            { label: "Work Location", value: selectedExpense.workLocation || "-" },
            { label: "Final Amount", value: selectedExpense.finalAmount ? `₹${Number(selectedExpense.finalAmount).toLocaleString()}` : "-" },
            { label: "Approved Amount", value: selectedExpense.approvedAmount ? `₹${Number(selectedExpense.approvedAmount).toLocaleString()}` : "-" },
            { label: "Admin Comment", value: selectedExpense.adminComment || "-" },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-medium">{value}</p>
            </div>
          ))}
        </div>
        {selectedExpense.description && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Description</p>
            <p className="text-sm bg-muted/40 rounded p-3">{selectedExpense.description}</p>
          </div>
        )}
        {(selectedExpense.startingOdometer || selectedExpense.endOdometer) && (
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-2"><Gauge className="h-4 w-4 text-primary" /> Odometer Details</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-muted-foreground">Starting Odometer</p><p className="font-medium">{selectedExpense.startingOdometer || "-"}</p></div>
              <div><p className="text-xs text-muted-foreground">End Odometer</p><p className="font-medium">{selectedExpense.endOdometer || "-"}</p></div>
              <div><p className="text-xs text-muted-foreground">Total Distance</p><p className="font-medium">{selectedExpense.totalDistance || "-"} km</p></div>
              <div><p className="text-xs text-muted-foreground">Amount/Km</p><p className="font-medium">₹{selectedExpense.amountPerKm || "1"}</p></div>
              <div><p className="text-xs text-muted-foreground">Total Travel Amount</p><p className="font-semibold text-primary">₹{selectedExpense.totalTravelAmount || "-"}</p></div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="space-y-4 animate-in fade-in">
        <div className="flex items-center gap-3 border-b pb-3">
          <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h3 className="font-semibold">Submit Expense</h3>
            <p className="text-xs text-muted-foreground">Fill in the details below</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="border rounded-lg p-4 space-y-4">
            <h4 className="text-sm font-semibold border-b pb-2">Expense Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Category *</Label>
                <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger data-testid="select-expense-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Expense">Expense</SelectItem>
                    <SelectItem value="Travel">Travel</SelectItem>
                    <SelectItem value="Food">Food</SelectItem>
                    <SelectItem value="Accommodation">Accommodation</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Expense Date *</Label>
                <Input type="date" value={form.expenseDate} onChange={(e) => setForm(f => ({ ...f, expenseDate: e.target.value }))} data-testid="input-expense-date" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Amount (₹) *</Label>
                <Input type="number" placeholder="Enter amount" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} data-testid="input-expense-amount" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Work Location</Label>
                <Input placeholder="Location" value={form.workLocation} onChange={(e) => setForm(f => ({ ...f, workLocation: e.target.value }))} data-testid="input-expense-location" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Textarea placeholder="Describe the expense..." value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="min-h-[70px] resize-none" data-testid="input-expense-description" />
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-4">
            <h4 className="text-sm font-semibold border-b pb-2 flex items-center gap-2">
              <Gauge className="h-4 w-4 text-primary" /> Travel / Odometer (Optional)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Starting Odometer (km)</Label>
                <Input type="number" placeholder="e.g. 50000" value={form.startingOdometer} onChange={(e) => setForm(f => ({ ...f, startingOdometer: e.target.value }))} data-testid="input-start-odometer" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">End Odometer (km)</Label>
                <Input type="number" placeholder="e.g. 50185" value={form.endOdometer} onChange={(e) => setForm(f => ({ ...f, endOdometer: e.target.value }))} data-testid="input-end-odometer" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Amount per Km (₹)</Label>
                <Input type="number" placeholder="1" value={form.amountPerKm} onChange={(e) => setForm(f => ({ ...f, amountPerKm: e.target.value }))} data-testid="input-amount-per-km" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Expense Category</Label>
                <Input placeholder="e.g. Fuel" value={form.expenseCategory} onChange={(e) => setForm(f => ({ ...f, expenseCategory: e.target.value }))} data-testid="input-expense-category-text" />
              </div>
            </div>
            {computedDistance > 0 && (
              <div className="p-3 bg-primary/5 rounded-lg grid grid-cols-3 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Total Distance</p><p className="font-bold">{computedDistance} km</p></div>
                <div><p className="text-xs text-muted-foreground">Travel Amount</p><p className="font-bold text-primary">₹{computedTravel.toFixed(0)}</p></div>
                <div><p className="text-xs text-muted-foreground">Final Amount</p><p className="font-bold text-primary">₹{form.amount || computedTravel.toFixed(0)}</p></div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || (!form.amount && computedTravel === 0)} className="flex-1" data-testid="button-submit-expense">
              {createMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting...</> : "Submit Expense"}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)} data-testid="button-cancel-expense">Cancel</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BanknoteIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">My Expenses</h3>
            <p className="text-xs text-muted-foreground">Track and submit expense claims</p>
          </div>
        </div>
        <Button onClick={() => setShowForm(true)} data-testid="button-new-expense">
          <Plus className="h-4 w-4 mr-2" /> New Expense
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: expenseList.length, color: "text-primary" },
          { label: "Pending", value: expenseList.filter(e => e.status === "pending").length, color: "text-amber-600" },
          { label: "Approved", value: expenseList.filter(e => e.status === "approved").length, color: "text-green-600" },
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
                  <TableHead>Title / Code</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approved</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenseList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      <BanknoteIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      No expenses submitted yet
                    </TableCell>
                  </TableRow>
                ) : (
                  expenseList.map((exp) => (
                    <TableRow key={exp.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedExpense(exp)} data-testid={`row-my-expense-${exp.id}`}>
                      <TableCell>
                        <p className="text-primary font-medium text-sm">{exp.expenseCode}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[160px]">{exp.title}</p>
                      </TableCell>
                      <TableCell className="text-sm">{exp.category}</TableCell>
                      <TableCell className="text-sm font-medium">₹{Number(exp.amount).toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDT(exp.expenseDate)}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_COLORS[exp.status] || "secondary"} className="capitalize text-xs">
                          {exp.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {exp.approvedAmount ? `₹${Number(exp.approvedAmount).toLocaleString()}` : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          {expenseList.length > 0 && (
            <div className="px-4 py-2 border-t text-xs text-muted-foreground">
              Total {expenseList.length} items
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
