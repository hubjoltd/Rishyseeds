import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PaginationBar } from "@/components/PaginationBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Plus, Search, Loader2, Phone, Mail, MapPin, User, Building2, RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import type { Customer } from "@shared/schema";

function fmtDT(dt: string | Date | null | undefined) {
  if (!dt) return "NA";
  try { return format(new Date(dt), "yyyy-MM-dd HH:mm"); } catch { return "NA"; }
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700 border-green-200",
  inactive: "bg-red-100 text-red-700 border-red-200",
};

function AddCustomerDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", mobile: "", email: "", address: "", status: "active" });

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/customers", form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: "Customer added" });
      onClose();
      setForm({ name: "", mobile: "", email: "", address: "", status: "active" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Add Customer
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Name *</Label>
            <Input placeholder="Customer name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} data-testid="input-customer-name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Mobile</Label>
              <Input placeholder="Mobile number" value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} data-testid="input-customer-mobile" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} data-testid="input-customer-email" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Address</Label>
            <Textarea placeholder="Address..." value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="min-h-[70px] resize-none" data-testid="input-customer-address" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
              <SelectTrigger data-testid="select-customer-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button className="flex-1" disabled={!form.name || createMutation.isPending} onClick={() => createMutation.mutate()} data-testid="button-save-customer">
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Add Customer
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditCustomerDialog({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: customer.name,
    mobile: customer.mobile || "",
    email: customer.email || "",
    address: customer.address || "",
    status: customer.status,
  });

  const updateMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/customers/${customer.id}`, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: "Customer updated" });
      onClose();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Edit Customer
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Name *</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} data-testid="input-edit-customer-name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Mobile</Label>
              <Input value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} data-testid="input-edit-customer-mobile" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} data-testid="input-edit-customer-email" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Address</Label>
            <Textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="min-h-[70px] resize-none" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button className="flex-1" disabled={!form.name || updateMutation.isPending} onClick={() => updateMutation.mutate()}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Customers() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const [showAdd, setShowAdd] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);

  const { data: customerList = [], isLoading, refetch, isFetching } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const filtered = customerList.filter(c => {
    const matchSearch = (c.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.mobile || "").includes(search) ||
      (c.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.ownerName || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });
  const paginatedCustomers = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const tabs = [
    { key: "all", label: "All Customer" },
    { key: "active", label: "Active" },
    { key: "inactive", label: "Inactive" },
  ];

  return (
    <div className="space-y-5 animate-in fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-bold font-display text-primary" data-testid="text-page-title">Customer</h2>
            <p className="text-muted-foreground text-sm">All Customer</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching} data-testid="button-refresh-customers">
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={() => setShowAdd(true)} data-testid="button-add-customer">
            <Plus className="h-4 w-4 mr-2" /> Add Customer
          </Button>
        </div>
      </div>

      <div className="border-b">
        <div className="flex items-center gap-1">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                statusFilter === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`tab-customers-${key}`}
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
              <Input placeholder="Search customers..." className="pl-9 h-9" value={search} onChange={e => setSearch(e.target.value)} data-testid="input-search-customers" />
            </div>
            <span className="text-sm text-muted-foreground">Fetch Total {filtered.length} of {customerList.length} items</span>
          </div>

          {isLoading ? (
            <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"><input type="checkbox" className="rounded" /></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Reporting Manager</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Created On</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-14">
                      <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      No customers found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedCustomers.map((c) => (
                    <TableRow key={c.id} data-testid={`row-customer-${c.id}`}>
                      <TableCell onClick={e => e.stopPropagation()}><input type="checkbox" className="rounded" /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-sm" data-testid={`text-customer-name-${c.id}`}>{c.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          {c.mobile ? (
                            <>
                              <Phone className="h-3 w-3" />
                              <span>{c.mobile}</span>
                            </>
                          ) : "NA"}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.email || "NA"}</TableCell>
                      <TableCell>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded border uppercase ${STATUS_COLORS[c.status] || "bg-muted text-muted-foreground"}`} data-testid={`badge-customer-status-${c.id}`}>
                          {c.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {c.ownerName ? (
                          <div className="flex items-center gap-1.5 text-sm">
                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-[10px] font-bold shrink-0">
                              {c.ownerName.charAt(0)}
                            </div>
                            <span>{c.ownerName}</span>
                          </div>
                        ) : "NA"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.reportingManagerName || "NA"}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded ${c.source === "visit" ? "bg-blue-100 text-blue-700" : c.source === "manual" ? "bg-purple-100 text-purple-700" : "bg-muted text-muted-foreground"}`}>
                          {c.source === "visit" ? "Visit" : c.source === "manual" ? "Manual" : c.source || "NA"}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fmtDT(c.createdAt)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditCustomer(c)} data-testid={`button-edit-customer-${c.id}`}>
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          <PaginationBar page={page} total={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </CardContent>
      </Card>

      <AddCustomerDialog open={showAdd} onClose={() => setShowAdd(false)} />
      {editCustomer && <EditCustomerDialog customer={editCustomer} onClose={() => setEditCustomer(null)} />}
    </div>
  );
}
