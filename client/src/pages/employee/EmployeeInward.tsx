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
import { Combobox } from "@/components/ui/combobox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowDownToLine, Package, Plus, Pencil, Trash2, RefreshCw, Loader2 } from "lucide-react";
import { getEmployeeToken } from "../EmployeeLogin";
import { EmployeePermissions, hasPermission } from "./EmployeeLayout";
import { useToast } from "@/hooks/use-toast";

function getEmployeeAuthHeaders(): Record<string, string> {
  const token = getEmployeeToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const inwardFormSchema = z.object({
  productId: z.coerce.number().min(1, "Please select a product"),
  locationId: z.coerce.number().min(1, "Please select a warehouse"),
  initialQuantity: z.coerce.number().positive("Quantity must be positive"),
  quantityUnit: z.string().default("kg"),
  stockForm: z.string().default("loose"),
  sourceName: z.string().optional(),
  inwardDate: z.string().optional(),
  expiryDate: z.string().optional(),
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

export default function EmployeeInward({ employee, permissions = {} }: EmployeeProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const canCreate = hasPermission(permissions, "lots", "create");
  const canEdit = hasPermission(permissions, "lots", "edit");
  const canDelete = hasPermission(permissions, "lots", "delete");

  const [open, setOpen] = useState(false);
  const [editingLot, setEditingLot] = useState<any>(null);
  const [deleteLotId, setDeleteLotId] = useState<number | null>(null);
  const [generatedLotNumber, setGeneratedLotNumber] = useState("");

  const form = useForm<z.infer<typeof inwardFormSchema>>({
    resolver: zodResolver(inwardFormSchema),
    defaultValues: {
      stockForm: "loose",
      quantityUnit: "kg",
      initialQuantity: 0,
      sourceName: "",
    }
  });

  const selectedProductId = form.watch("productId");

  const { data: lots, isLoading } = useQuery({
    queryKey: ["/api/lots"],
    queryFn: async () => {
      const res = await fetch("/api/lots", { headers: getEmployeeAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch lots");
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

  const { data: locations } = useQuery({
    queryKey: ["/api/locations"],
    queryFn: async () => {
      const res = await fetch("/api/locations", { headers: getEmployeeAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch locations");
      return res.json();
    },
  });

  const generateLotMutation = useMutation({
    mutationFn: async (productId: number) => {
      const res = await fetch(`/api/lots/generate-number/${productId}`, { headers: getEmployeeAuthHeaders() });
      if (!res.ok) throw new Error("Failed to generate lot number");
      return res.json();
    },
  });

  const createLotMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/lots", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getEmployeeAuthHeaders() },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create lot");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-balances"] });
      toast({ title: "Success", description: "Inward record created successfully" });
      setOpen(false);
      form.reset();
      setGeneratedLotNumber("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateLotMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`/api/lots/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getEmployeeAuthHeaders() },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to update lot");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-balances"] });
      toast({ title: "Success", description: "Lot updated successfully" });
      setOpen(false);
      setEditingLot(null);
      form.reset();
      setGeneratedLotNumber("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteLotMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/lots/${id}`, {
        method: "DELETE",
        headers: getEmployeeAuthHeaders(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to delete lot");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-balances"] });
      toast({ title: "Success", description: "Lot deleted successfully" });
      setDeleteLotId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleGenerateLotNumber = async () => {
    if (selectedProductId) {
      try {
        const result = await generateLotMutation.mutateAsync(selectedProductId);
        setGeneratedLotNumber(result.lotNumber);
      } catch (e) {
        console.error("Failed to generate lot number");
      }
    }
  };

  const getProductName = (productId: number) => {
    const product = products?.find((p: { id: number }) => p.id === productId);
    return product ? `${product.crop} - ${product.variety}` : "Unknown";
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN");
  };

  const onSubmit = async (data: z.infer<typeof inwardFormSchema>) => {
    let lotNumber = generatedLotNumber;
    if (!lotNumber && data.productId) {
      const result = await generateLotMutation.mutateAsync(data.productId);
      lotNumber = result.lotNumber;
    }

    const quantityInKg = data.quantityUnit === "tons" ? data.initialQuantity * 1000 : data.initialQuantity;

    createLotMutation.mutate({
      lotNumber,
      productId: data.productId,
      locationId: data.locationId,
      sourceType: "inward",
      sourceName: data.sourceName || null,
      initialQuantity: String(quantityInKg),
      quantityUnit: data.quantityUnit,
      stockForm: data.stockForm,
      inwardDate: data.inwardDate || new Date().toISOString().slice(0, 10),
      expiryDate: data.expiryDate || null,
      remarks: data.remarks || null,
      status: "active",
      createdBy: employee.id,
    });
  };

  const handleEdit = (lot: any) => {
    setEditingLot(lot);
    form.reset({
      productId: lot.productId,
      locationId: 0,
      initialQuantity: Number(lot.initialQuantity),
      quantityUnit: lot.quantityUnit || "kg",
      stockForm: lot.stockForm || "loose",
      sourceName: lot.sourceName || "",
      inwardDate: lot.inwardDate || "",
      expiryDate: lot.expiryDate || "",
      remarks: lot.remarks || "",
    });
    setGeneratedLotNumber(lot.lotNumber);
    setOpen(true);
  };

  const handleUpdate = (data: z.infer<typeof inwardFormSchema>) => {
    if (!editingLot) return;

    const quantityInKg = data.quantityUnit === "tons" ? data.initialQuantity * 1000 : data.initialQuantity;

    updateLotMutation.mutate({
      id: editingLot.id,
      data: {
        sourceName: data.sourceName || null,
        initialQuantity: String(quantityInKg),
        stockForm: data.stockForm,
        inwardDate: data.inwardDate || null,
        expiryDate: data.expiryDate || null,
        remarks: data.remarks || null,
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <ArrowDownToLine className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inward Records</h1>
            <p className="text-muted-foreground">View incoming seed lots</p>
          </div>
        </div>
        {canCreate && (
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
              setEditingLot(null);
              form.reset();
              setGeneratedLotNumber("");
            }
          }}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-inward">
                <Plus className="w-4 h-4 mr-2" />
                Add Inward
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingLot ? "Edit Lot" : "Record Inward Stock"}</DialogTitle>
                <DialogDescription>{editingLot ? "Update lot details" : "Add new incoming seed stock"}</DialogDescription>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(editingLot ? handleUpdate : onSubmit)} className="space-y-4">
                {editingLot ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Product</label>
                    <Input value={getProductName(editingLot.productId)} disabled className="bg-muted" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Product (Crop/Variety)</label>
                    <Combobox
                      options={(products || []).map((p: any) => ({
                        value: p.id.toString(),
                        label: `${p.crop} - ${p.variety}`,
                      }))}
                      value={form.watch("productId")?.toString()}
                      onValueChange={(val) => {
                        form.setValue("productId", val ? parseInt(val) : 0);
                        setGeneratedLotNumber("");
                      }}
                      placeholder="Select Product"
                      searchPlaceholder="Search products..."
                      data-testid="select-product"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">Lot Number</label>
                  <div className="flex gap-2">
                    <Input value={generatedLotNumber} readOnly placeholder="Auto-generated" className="bg-muted" />
                    {!editingLot && (
                      <Button type="button" variant="outline" onClick={handleGenerateLotNumber} disabled={!selectedProductId || generateLotMutation.isPending}>
                        <RefreshCw className={`h-4 w-4 ${generateLotMutation.isPending ? 'animate-spin' : ''}`} />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Source / Supplier</label>
                  <Input {...form.register("sourceName")} placeholder="Enter supplier name" />
                </div>

                {!editingLot && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Warehouse</label>
                    <Select onValueChange={(val) => form.setValue("locationId", parseInt(val))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        {(locations || []).map((l: any) => (
                          <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quantity</label>
                    <Input type="number" {...form.register("initialQuantity")} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Unit</label>
                    <Select defaultValue="kg" onValueChange={(val) => form.setValue("quantityUnit", val)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">KG</SelectItem>
                        <SelectItem value="tons">Tons</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Stock Form</label>
                  <Select defaultValue="loose" onValueChange={(val) => form.setValue("stockForm", val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="loose">Raw Seeds</SelectItem>
                      <SelectItem value="cobs">Cobs</SelectItem>
                      <SelectItem value="packed">Packed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Inward Date</label>
                  <Input type="date" {...form.register("inwardDate")} />
                </div>

                <Button type="submit" className="w-full" disabled={createLotMutation.isPending || updateLotMutation.isPending}>
                  {(createLotMutation.isPending || updateLotMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingLot ? "Save Changes" : "Create Inward"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Lot Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : lots?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No inward records found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lot Number</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Quantity (KG)</TableHead>
                    <TableHead>Received Date</TableHead>
                    <TableHead>Status</TableHead>
                    {(canEdit || canDelete) && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lots?.map((lot: any) => (
                    <TableRow key={lot.id} data-testid={`row-lot-${lot.id}`}>
                      <TableCell className="font-medium">{lot.lotNumber}</TableCell>
                      <TableCell>{getProductName(lot.productId)}</TableCell>
                      <TableCell>{lot.sourceName || lot.source || "-"}</TableCell>
                      <TableCell>{Number(lot.initialQuantity || lot.receivedQuantity)?.toLocaleString()}</TableCell>
                      <TableCell>{formatDate(lot.inwardDate || lot.receivedDate)}</TableCell>
                      <TableCell>
                        <Badge variant={lot.status === "active" ? "default" : "secondary"}>
                          {lot.status || "Active"}
                        </Badge>
                      </TableCell>
                      {(canEdit || canDelete) && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {canEdit && (
                              <Button size="icon" variant="ghost" onClick={() => handleEdit(lot)} data-testid={`button-edit-lot-${lot.id}`}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteLotId(lot.id)} data-testid={`button-delete-lot-${lot.id}`}>
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

      <AlertDialog open={!!deleteLotId} onOpenChange={() => setDeleteLotId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lot?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This will permanently delete this lot record.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteLotId && deleteLotMutation.mutate(deleteLotId)} className="bg-destructive text-destructive-foreground">
              {deleteLotMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
