import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowRightLeft, ArrowRight, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { getEmployeeToken } from "../EmployeeLogin";
import { EmployeePermissions, hasPermission } from "./EmployeeLayout";
import { useToast } from "@/hooks/use-toast";

function getEmployeeAuthHeaders(): Record<string, string> {
  const token = getEmployeeToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const stockMovementFormSchema = z.object({
  lotId: z.coerce.number().min(1, "Please select a lot"),
  fromLocationId: z.coerce.number().min(1, "Please select source location"),
  toLocationId: z.coerce.number().min(1, "Please select destination"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  stockForm: z.string().min(1, "Please select stock form"),
  movementDate: z.string().optional(),
  remarks: z.string().optional(),
});

interface EmployeeProps {
  employee: {
    id: number;
    fullName: string;
    employeeId: string;
  };
  permissions?: EmployeePermissions;
}

export default function EmployeeStockMovement({ employee, permissions = {} }: EmployeeProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const canCreate = hasPermission(permissions, "stock", "create");
  const canEdit = hasPermission(permissions, "stock", "edit");
  const canDelete = hasPermission(permissions, "stock", "delete");

  const [open, setOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [deleteRecordId, setDeleteRecordId] = useState<number | null>(null);
  const [selectedLotId, setSelectedLotId] = useState<number | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const form = useForm<z.infer<typeof stockMovementFormSchema>>({
    resolver: zodResolver(stockMovementFormSchema),
    defaultValues: {
      quantity: 0,
      stockForm: "loose",
    }
  });

  const { data: movements, isLoading } = useQuery({
    queryKey: ["/api/stock/movements"],
    queryFn: async () => {
      const res = await fetch("/api/stock/movements", { headers: getEmployeeAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch stock movements");
      return res.json();
    },
  });

  const { data: lots } = useQuery({
    queryKey: ["/api/lots"],
    queryFn: async () => {
      const res = await fetch("/api/lots", { headers: getEmployeeAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch lots");
      return res.json();
    },
  });

  const { data: locations } = useQuery({
    queryKey: ["/api/locations"],
    queryFn: async () => {
      const res = await fetch("/api/locations", { headers: getEmployeeAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch locations");
      return res.json();
    },
  });

  const { data: products } = useQuery({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const res = await fetch("/api/products", { headers: getEmployeeAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
  });

  const { data: stockBalances } = useQuery({
    queryKey: ["/api/stock-balances"],
    queryFn: async () => {
      const res = await fetch("/api/stock-balances", { headers: getEmployeeAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch stock balances");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/stock/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getEmployeeAuthHeaders() },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create movement");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock/movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-balances"] });
      toast({ title: "Success", description: "Stock movement recorded", variant: "success" });
      setOpen(false);
      form.reset();
      setSelectedProductId(null);
      setSelectedLotId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`/api/stock/movements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getEmployeeAuthHeaders() },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update movement");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock/movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-balances"] });
      toast({ title: "Success", description: "Movement updated", variant: "success" });
      setOpen(false);
      setEditingRecord(null);
      form.reset();
      setSelectedProductId(null);
      setSelectedLotId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/stock/movements/${id}`, {
        method: "DELETE",
        headers: getEmployeeAuthHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to delete movement");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock/movements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-balances"] });
      toast({ title: "Success", description: "Movement deleted" });
      setDeleteRecordId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const activeLots = (lots || []).filter((l: any) => l.status === 'active');
  const filteredLots = selectedProductId 
    ? activeLots.filter((l: any) => l.productId === selectedProductId)
    : activeLots;

  const getStockForLotAndLocation = (lotId: number, locationId: number) => {
    const balance = (stockBalances || []).find(
      (b: any) => b.lotId === lotId && b.locationId === locationId
    );
    return balance ? Number(balance.quantity) : 0;
  };

  const getLotDetails = (lotId: number) => {
    const lot = (lots || []).find((l: any) => l.id === lotId);
    if (!lot) return "Unknown";
    const product = (products || []).find((p: any) => p.id === lot.productId);
    return `${lot.lotNumber} (${product?.crop} - ${product?.variety || 'Unknown'})`;
  };

  const getLotNumber = (lotId: number) => {
    const lot = lots?.find((l: any) => l.id === lotId);
    return lot?.lotNumber || "Unknown";
  };

  const getLocationName = (locId: number) => {
    const loc = locations?.find((l: any) => l.id === locId);
    return loc?.name || "Unknown";
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN");
  };

  const selectedLot = selectedLotId ? lots?.find((l: any) => l.id === selectedLotId) : null;
  const fromLocationId = form.watch("fromLocationId");
  const availableStock = selectedLotId && fromLocationId ? getStockForLotAndLocation(selectedLotId, fromLocationId) : 0;

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    const lot = lots?.find((l: any) => l.id === record.lotId);
    if (lot) {
      setSelectedProductId(lot.productId);
    }
    setSelectedLotId(record.lotId);
    form.reset({
      lotId: record.lotId,
      fromLocationId: record.fromLocationId,
      toLocationId: record.toLocationId,
      quantity: Number(record.quantity),
      stockForm: record.stockForm || "loose",
      movementDate: record.movementDate || "",
      remarks: record.remarks || "",
    });
    setOpen(true);
  };

  const onSubmit = (data: z.infer<typeof stockMovementFormSchema>) => {
    if (editingRecord) {
      updateMutation.mutate({
        id: editingRecord.id,
        data: {
          quantity: String(data.quantity),
          stockForm: data.stockForm,
          movementDate: data.movementDate || null,
          remarks: data.remarks || null,
        }
      });
    } else {
      createMutation.mutate({
        lotId: data.lotId,
        fromLocationId: data.fromLocationId,
        toLocationId: data.toLocationId,
        quantity: String(data.quantity),
        stockForm: data.stockForm,
        movementDate: data.movementDate || new Date().toISOString().slice(0, 10),
        remarks: data.remarks || null,
        createdBy: employee.id,
      });
    }
  };

  const stockFormLabels: Record<string, string> = {
    loose: "Raw Seeds",
    cobs: "Cobs",
    packed: "Packed",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <ArrowRightLeft className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock Movement</h1>
            <p className="text-muted-foreground">View stock transfer records</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setEditingRecord(null);
            form.reset();
            setSelectedLotId(null);
            setSelectedProductId(null);
          }
        }}>
          {canCreate && (
            <DialogTrigger asChild>
              <Button data-testid="button-add-movement">
                <Plus className="w-4 h-4 mr-2" />
                Add Movement
              </Button>
            </DialogTrigger>
          )}
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRecord ? "Edit Stock Movement" : "Record Stock Movement"}</DialogTitle>
              <DialogDescription>{editingRecord ? "Update movement details" : "Transfer stock between locations"}</DialogDescription>
            </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Product (Variety) <span className="text-destructive">*</span></label>
                  <Select 
                    value={selectedProductId?.toString() || ""}
                    onValueChange={(val) => {
                      setSelectedProductId(parseInt(val));
                      form.setValue("lotId", 0);
                      setSelectedLotId(null);
                    }}
                    disabled={!!editingRecord}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Product" />
                    </SelectTrigger>
                    <SelectContent>
                      {(products || []).map((p: any) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.crop} - {p.variety}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Lot <span className="text-destructive">*</span></label>
                  <Select 
                    value={form.watch("lotId")?.toString() || ""}
                    onValueChange={(val) => {
                      const id = parseInt(val);
                      form.setValue("lotId", id);
                      setSelectedLotId(id);
                    }}
                    disabled={!!editingRecord || !selectedProductId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={selectedProductId ? "Select Lot" : "Select product first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredLots.map((lot: any) => (
                        <SelectItem key={lot.id} value={lot.id.toString()}>
                          {lot.lotNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedLot && (
                    <p className="text-xs text-muted-foreground">
                      Initial Quantity: {Number(selectedLot.initialQuantity).toLocaleString()} KG
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">From Location <span className="text-destructive">*</span></label>
                    <Select 
                      value={form.watch("fromLocationId")?.toString() || ""}
                      onValueChange={(val) => form.setValue("fromLocationId", parseInt(val))}
                      disabled={!!editingRecord}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {(locations || []).map((loc: any) => (
                          <SelectItem key={loc.id} value={loc.id.toString()}>{loc.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedLotId && fromLocationId && (
                      <p className="text-xs text-muted-foreground">
                        Available: <span className="font-medium">{availableStock.toLocaleString()} KG</span>
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">To Location <span className="text-destructive">*</span></label>
                    <Select 
                      value={form.watch("toLocationId")?.toString() || ""}
                      onValueChange={(val) => form.setValue("toLocationId", parseInt(val))}
                      disabled={!!editingRecord}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {(locations || []).map((loc: any) => (
                          <SelectItem key={loc.id} value={loc.id.toString()}>{loc.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quantity (KG) <span className="text-destructive">*</span></label>
                    <Input type="number" {...form.register("quantity")} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Stock Form <span className="text-destructive">*</span></label>
                    <Select 
                      value={form.watch("stockForm") || "loose"}
                      onValueChange={(val) => form.setValue("stockForm", val)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="loose">Raw Seeds</SelectItem>
                        <SelectItem value="cobs">Cobs</SelectItem>
                        <SelectItem value="packed">Packed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Movement Date</label>
                  <Input type="date" {...form.register("movementDate")} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Remarks</label>
                  <Textarea 
                    {...form.register("remarks")} 
                    placeholder="Optional notes..."
                    rows={2}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingRecord ? "Save Changes" : "Record Movement"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5" />
            Movement History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : movements?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No stock movements found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lot Number</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead></TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Quantity (KG)</TableHead>
                    <TableHead>Stock Form</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Remarks</TableHead>
                    {(canEdit || canDelete) && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements?.map((record: any) => (
                    <TableRow key={record.id} data-testid={`row-movement-${record.id}`}>
                      <TableCell className="font-medium">{getLotNumber(record.lotId)}</TableCell>
                      <TableCell>{getLocationName(record.fromLocationId)}</TableCell>
                      <TableCell>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </TableCell>
                      <TableCell>{getLocationName(record.toLocationId)}</TableCell>
                      <TableCell>{Number(record.quantity)?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{stockFormLabels[record.stockForm] || record.stockForm || "Raw Seeds"}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(record.movementDate)}</TableCell>
                      <TableCell className="max-w-[150px] truncate">{record.remarks || "-"}</TableCell>
                      {(canEdit || canDelete) && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {canEdit && (
                              <Button size="icon" variant="ghost" onClick={() => handleEdit(record)} data-testid={`button-edit-movement-${record.id}`}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteRecordId(record.id)} data-testid={`button-delete-movement-${record.id}`}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteRecordId} onOpenChange={() => setDeleteRecordId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Movement Record?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteRecordId && deleteMutation.mutate(deleteRecordId)} className="bg-destructive text-destructive-foreground">
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
