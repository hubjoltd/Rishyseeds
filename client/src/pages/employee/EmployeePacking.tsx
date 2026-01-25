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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Boxes, Package, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { getEmployeeToken } from "../EmployeeLogin";
import { EmployeePermissions, hasPermission } from "./EmployeeLayout";
import { useToast } from "@/hooks/use-toast";

function getEmployeeAuthHeaders(): Record<string, string> {
  const token = getEmployeeToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const packingFormSchema = z.object({
  lotId: z.coerce.number().min(1, "Please select a lot"),
  packagingSizeId: z.coerce.number().min(1, "Please select package size"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  inputQuantity: z.coerce.number().positive("Input quantity must be positive"),
  wasteQuantity: z.coerce.number().min(0, "Waste cannot be negative").optional(),
  packagingDate: z.string().optional(),
});

interface EmployeeProps {
  employee: {
    id: number;
    fullName: string;
    employeeId: string;
  };
  permissions?: EmployeePermissions;
}

export default function EmployeePacking({ employee, permissions = {} }: EmployeeProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const canCreate = hasPermission(permissions, "packaging", "create");
  const canEdit = hasPermission(permissions, "packaging", "edit");
  const canDelete = hasPermission(permissions, "packaging", "delete");

  const [open, setOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [deleteRecordId, setDeleteRecordId] = useState<number | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedLotId, setSelectedLotId] = useState<number | null>(null);

  const form = useForm<z.infer<typeof packingFormSchema>>({
    resolver: zodResolver(packingFormSchema),
    defaultValues: {
      quantity: 0,
      inputQuantity: 0,
      wasteQuantity: 0,
    }
  });

  const { data: packaging, isLoading } = useQuery({
    queryKey: ["/api/packaging"],
    queryFn: async () => {
      const res = await fetch("/api/packaging", { headers: getEmployeeAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch packaging records");
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

  const { data: packagingSizes } = useQuery({
    queryKey: ["/api/packaging-sizes"],
    queryFn: async () => {
      const res = await fetch("/api/packaging-sizes", { headers: getEmployeeAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch packaging sizes");
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

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/packaging", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getEmployeeAuthHeaders() },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create record");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packaging"] });
      toast({ title: "Success", description: "Packing record created" });
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
      const res = await fetch(`/api/packaging/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getEmployeeAuthHeaders() },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update record");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packaging"] });
      toast({ title: "Success", description: "Packing record updated" });
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
      const res = await fetch(`/api/packaging/${id}`, {
        method: "DELETE",
        headers: getEmployeeAuthHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to delete record");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/packaging"] });
      toast({ title: "Success", description: "Record deleted" });
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

  const getPackageSize = (sizeId: number) => {
    const size = packagingSizes?.find((s: any) => s.id === sizeId);
    return size ? `${size.size} ${size.unit}` : "Unknown";
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN");
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    const lot = lots?.find((l: any) => l.id === record.lotId);
    if (lot) {
      setSelectedProductId(lot.productId);
    }
    setSelectedLotId(record.lotId);
    form.reset({
      lotId: record.lotId,
      packagingSizeId: record.packagingSizeId,
      quantity: record.quantity,
      inputQuantity: Number(record.inputQuantity),
      wasteQuantity: Number(record.wasteQuantity) || 0,
      packagingDate: record.packagingDate || "",
    });
    setOpen(true);
  };

  const onSubmit = (data: z.infer<typeof packingFormSchema>) => {
    if (editingRecord) {
      updateMutation.mutate({
        id: editingRecord.id,
        data: {
          quantity: data.quantity,
          inputQuantity: String(data.inputQuantity),
          wasteQuantity: String(data.wasteQuantity || 0),
          packagingDate: data.packagingDate || null,
        }
      });
    } else {
      createMutation.mutate({
        lotId: data.lotId,
        packagingSizeId: data.packagingSizeId,
        quantity: data.quantity,
        inputQuantity: String(data.inputQuantity),
        wasteQuantity: String(data.wasteQuantity || 0),
        packagingDate: data.packagingDate || new Date().toISOString().slice(0, 10),
        createdBy: employee.id,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Boxes className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Packing Records</h1>
            <p className="text-muted-foreground">View packaging activities</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setEditingRecord(null);
            form.reset();
            setSelectedProductId(null);
            setSelectedLotId(null);
          }
        }}>
          {canCreate && (
            <DialogTrigger asChild>
              <Button data-testid="button-add-packing">
                <Plus className="w-4 h-4 mr-2" />
                Add Packing
              </Button>
            </DialogTrigger>
          )}
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRecord ? "Edit Packing Record" : "New Packing Record"}</DialogTitle>
              <DialogDescription>{editingRecord ? "Update packing details" : "Record packaging output"}</DialogDescription>
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
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Package Size</label>
                  <Select 
                    value={form.watch("packagingSizeId")?.toString() || ""} 
                    onValueChange={(val) => form.setValue("packagingSizeId", parseInt(val))}
                    disabled={!!editingRecord}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Size" />
                    </SelectTrigger>
                    <SelectContent>
                      {(packagingSizes || []).map((size: any) => (
                        <SelectItem key={size.id} value={size.id.toString()}>
                          {size.size} {size.unit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Number of Bags</label>
                    <Input type="number" {...form.register("quantity")} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Input Qty (KG)</label>
                    <Input type="number" {...form.register("inputQuantity")} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Waste (KG)</label>
                  <Input type="number" {...form.register("wasteQuantity")} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Packing Date</label>
                  <Input type="date" {...form.register("packagingDate")} />
                </div>

                <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingRecord ? "Save Changes" : "Create Packing Record"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Packaging Output
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : packaging?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No packing records found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lot Number</TableHead>
                    <TableHead>Package Size</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Input (KG)</TableHead>
                    <TableHead>Waste (KG)</TableHead>
                    <TableHead>Date</TableHead>
                    {(canEdit || canDelete) && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packaging?.map((record: any) => (
                    <TableRow key={record.id} data-testid={`row-packing-${record.id}`}>
                      <TableCell className="font-medium">{getLotNumber(record.lotId)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{getPackageSize(record.packagingSizeId)}</Badge>
                      </TableCell>
                      <TableCell>{record.quantity?.toLocaleString()} bags</TableCell>
                      <TableCell>{Number(record.inputQuantity)?.toLocaleString()}</TableCell>
                      <TableCell>{Number(record.wasteQuantity)?.toLocaleString() || 0}</TableCell>
                      <TableCell>{formatDate(record.packagingDate)}</TableCell>
                      {(canEdit || canDelete) && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {canEdit && (
                              <Button size="icon" variant="ghost" onClick={() => handleEdit(record)} data-testid={`button-edit-packing-${record.id}`}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteRecordId(record.id)} data-testid={`button-delete-packing-${record.id}`}>
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
            <AlertDialogTitle>Delete Packing Record?</AlertDialogTitle>
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
