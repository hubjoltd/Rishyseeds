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
import { Truck, MapPin, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { getEmployeeToken } from "../EmployeeLogin";
import { EmployeePermissions, hasPermission } from "./EmployeeLayout";
import { useToast } from "@/hooks/use-toast";

function getEmployeeAuthHeaders(): Record<string, string> {
  const token = getEmployeeToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const outwardFormSchema = z.object({
  lotId: z.coerce.number().min(1, "Please select a lot"),
  destination: z.string().min(1, "Please select destination"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  vehicleNumber: z.string().optional(),
  driverName: z.string().optional(),
  dispatchDate: z.string().optional(),
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

const stateNames: Record<string, string> = {
  AP: "Andhra Pradesh",
  TS: "Telangana",
  MP: "Madhya Pradesh",
  UP: "Uttar Pradesh",
  KA: "Karnataka",
  CG: "Chhattisgarh",
};

const stateOptions = Object.entries(stateNames).map(([code, name]) => ({ code, name }));

export default function EmployeeOutward({ employee, permissions = {} }: EmployeeProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const canCreate = hasPermission(permissions, "outward", "create");
  const canEdit = hasPermission(permissions, "outward", "edit");
  const canDelete = hasPermission(permissions, "outward", "delete");

  const [open, setOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [deleteRecordId, setDeleteRecordId] = useState<number | null>(null);

  const form = useForm<z.infer<typeof outwardFormSchema>>({
    resolver: zodResolver(outwardFormSchema),
    defaultValues: {
      quantity: 0,
    }
  });

  const { data: outward, isLoading } = useQuery({
    queryKey: ["/api/outward"],
    queryFn: async () => {
      const res = await fetch("/api/outward", { headers: getEmployeeAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch outward records");
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
      const res = await fetch("/api/outward", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getEmployeeAuthHeaders() },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create dispatch");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/outward"] });
      toast({ title: "Success", description: "Dispatch record created" });
      setOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`/api/outward/${id}`, {
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
      queryClient.invalidateQueries({ queryKey: ["/api/outward"] });
      toast({ title: "Success", description: "Dispatch record updated" });
      setOpen(false);
      setEditingRecord(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/outward/${id}`, {
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
      queryClient.invalidateQueries({ queryKey: ["/api/outward"] });
      toast({ title: "Success", description: "Record deleted" });
      setDeleteRecordId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const activeLots = (lots || []).filter((l: any) => l.status === 'active');

  const getLotDetails = (lotId: number) => {
    const lot = (lots || []).find((l: any) => l.id === lotId);
    if (!lot) return { lotNumber: "Unknown", variety: "" };
    const product = (products || []).find((p: any) => p.id === lot.productId);
    return {
      lotNumber: lot.lotNumber,
      variety: product?.variety || "",
      display: `${lot.lotNumber} (${product?.crop} - ${product?.variety || 'Unknown'})`,
    };
  };

  const getLotNumber = (lotId: number) => {
    const lot = lots?.find((l: any) => l.id === lotId);
    return lot?.lotNumber || "Unknown";
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN");
  };

  const selectedLotId = form.watch("lotId");
  const selectedLotDetails = selectedLotId ? getLotDetails(selectedLotId) : null;

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    form.reset({
      lotId: record.lotId,
      destination: record.destination || "",
      quantity: Number(record.quantity),
      vehicleNumber: record.vehicleNumber || "",
      driverName: record.driverName || "",
      dispatchDate: record.dispatchDate || "",
      remarks: record.remarks || "",
    });
    setOpen(true);
  };

  const onSubmit = (data: z.infer<typeof outwardFormSchema>) => {
    const lotDetails = getLotDetails(data.lotId);
    if (editingRecord) {
      updateMutation.mutate({
        id: editingRecord.id,
        data: {
          destination: data.destination,
          quantity: String(data.quantity),
          vehicleNumber: data.vehicleNumber || null,
          driverName: data.driverName || null,
          dispatchDate: data.dispatchDate || null,
          remarks: data.remarks || null,
        }
      });
    } else {
      createMutation.mutate({
        lotId: data.lotId,
        destination: data.destination,
        quantity: String(data.quantity),
        variety: lotDetails.variety,
        vehicleNumber: data.vehicleNumber || null,
        driverName: data.driverName || null,
        dispatchDate: data.dispatchDate || new Date().toISOString().slice(0, 10),
        remarks: data.remarks || null,
        createdBy: employee.id,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Truck className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Outward / Dispatch</h1>
            <p className="text-muted-foreground">View dispatch records</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setEditingRecord(null);
            form.reset();
          }
        }}>
          {canCreate && (
            <DialogTrigger asChild>
              <Button data-testid="button-add-outward">
                <Plus className="w-4 h-4 mr-2" />
                Add Dispatch
              </Button>
            </DialogTrigger>
          )}
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRecord ? "Edit Dispatch Record" : "New Dispatch Record"}</DialogTitle>
              <DialogDescription>{editingRecord ? "Update dispatch details" : "Record outward dispatch"}</DialogDescription>
            </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Lot</label>
                  <Select 
                    value={form.watch("lotId")?.toString() || ""}
                    onValueChange={(val) => form.setValue("lotId", parseInt(val))}
                    disabled={!!editingRecord}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Lot" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeLots.map((lot: any) => (
                        <SelectItem key={lot.id} value={lot.id.toString()}>
                          {getLotDetails(lot.id).display}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedLotDetails && (
                    <p className="text-xs text-muted-foreground">
                      Variety: {selectedLotDetails.variety}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Destination State</label>
                  <Select 
                    value={form.watch("destination") || ""}
                    onValueChange={(val) => form.setValue("destination", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      {stateOptions.map((state) => (
                        <SelectItem key={state.code} value={state.code}>
                          {state.name} ({state.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantity (KG)</label>
                  <Input type="number" {...form.register("quantity")} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Vehicle Number</label>
                    <Input {...form.register("vehicleNumber")} placeholder="e.g., TS09AB1234" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Driver Name</label>
                    <Input {...form.register("driverName")} placeholder="Driver name" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Dispatch Date</label>
                  <Input type="date" {...form.register("dispatchDate")} />
                </div>

                <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingRecord ? "Save Changes" : "Create Dispatch Record"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Dispatch Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : outward?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No outward records found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lot Number</TableHead>
                    <TableHead>Variety</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Quantity (KG)</TableHead>
                    <TableHead>Vehicle No.</TableHead>
                    <TableHead>Dispatch Date</TableHead>
                    {(canEdit || canDelete) && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outward?.map((record: any) => (
                    <TableRow key={record.id} data-testid={`row-outward-${record.id}`}>
                      <TableCell className="font-medium">{getLotNumber(record.lotId)}</TableCell>
                      <TableCell>{record.variety || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {stateNames[record.destination] || record.destination}
                        </Badge>
                      </TableCell>
                      <TableCell>{Number(record.quantity)?.toLocaleString()}</TableCell>
                      <TableCell>{record.vehicleNumber || "-"}</TableCell>
                      <TableCell>{formatDate(record.dispatchDate)}</TableCell>
                      {(canEdit || canDelete) && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {canEdit && (
                              <Button size="icon" variant="ghost" onClick={() => handleEdit(record)} data-testid={`button-edit-outward-${record.id}`}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteRecordId(record.id)} data-testid={`button-delete-outward-${record.id}`}>
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
            <AlertDialogTitle>Delete Dispatch Record?</AlertDialogTitle>
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
