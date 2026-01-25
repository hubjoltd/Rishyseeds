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
import { Factory, Plus, Pencil, Trash2, Loader2, CheckCircle } from "lucide-react";
import { getEmployeeToken } from "../EmployeeLogin";
import { EmployeePermissions, hasPermission } from "./EmployeeLayout";
import { useToast } from "@/hooks/use-toast";

function getEmployeeAuthHeaders(): Record<string, string> {
  const token = getEmployeeToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const processingFormSchema = z.object({
  inputLotId: z.coerce.number().min(1, "Please select input lot"),
  inputQuantity: z.coerce.number().positive("Quantity must be positive"),
  processingType: z.string().min(1, "Please select processing type"),
  processedBy: z.string().optional(),
  processingDate: z.string().optional(),
  remarks: z.string().optional(),
});

const completeProcessingSchema = z.object({
  outputQuantity: z.coerce.number().positive("Output quantity must be positive"),
  wasteQuantity: z.coerce.number().min(0, "Waste cannot be negative"),
});

interface EmployeeProps {
  employee: {
    id: number;
    fullName: string;
    employeeId: string;
  };
  permissions?: EmployeePermissions;
}

export default function EmployeeProcessing({ employee, permissions = {} }: EmployeeProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const canCreate = hasPermission(permissions, "processing", "create");
  const canEdit = hasPermission(permissions, "processing", "edit");
  const canDelete = hasPermission(permissions, "processing", "delete");

  const [open, setOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [deleteRecordId, setDeleteRecordId] = useState<number | null>(null);
  const [completeRecordId, setCompleteRecordId] = useState<number | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedLotId, setSelectedLotId] = useState<number | null>(null);

  const form = useForm<z.infer<typeof processingFormSchema>>({
    resolver: zodResolver(processingFormSchema),
    defaultValues: {
      inputQuantity: 0,
    }
  });

  const completeForm = useForm<z.infer<typeof completeProcessingSchema>>({
    resolver: zodResolver(completeProcessingSchema),
    defaultValues: {
      outputQuantity: 0,
      wasteQuantity: 0,
    }
  });

  const { data: processing, isLoading } = useQuery({
    queryKey: ["/api/processing"],
    queryFn: async () => {
      const res = await fetch("/api/processing", { headers: getEmployeeAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch processing records");
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
      const res = await fetch("/api/processing", {
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
      queryClient.invalidateQueries({ queryKey: ["/api/processing"] });
      toast({ title: "Success", description: "Processing record created", variant: "success" });
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
      const res = await fetch(`/api/processing/${id}`, {
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
      queryClient.invalidateQueries({ queryKey: ["/api/processing"] });
      toast({ title: "Success", description: "Processing record updated", variant: "success" });
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
      const res = await fetch(`/api/processing/${id}`, {
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
      queryClient.invalidateQueries({ queryKey: ["/api/processing"] });
      toast({ title: "Success", description: "Record deleted" });
      setDeleteRecordId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await fetch(`/api/processing/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getEmployeeAuthHeaders() },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to complete processing");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/processing"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lots"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-balances"] });
      toast({ title: "Success", description: "Processing completed and output lot created", variant: "success" });
      setCompleteRecordId(null);
      completeForm.reset();
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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN");
  };

  const selectedRecordForComplete = completeRecordId 
    ? (processing || []).find((r: any) => r.id === completeRecordId)
    : null;

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    const lot = lots?.find((l: any) => l.id === record.inputLotId);
    if (lot) {
      setSelectedProductId(lot.productId);
    }
    setSelectedLotId(record.inputLotId);
    form.reset({
      inputLotId: record.inputLotId,
      inputQuantity: Number(record.inputQuantity),
      processingType: record.processingType || "",
      processedBy: record.processedBy || "",
      processingDate: record.processingDate || "",
      remarks: record.remarks || "",
    });
    setOpen(true);
  };

  const onSubmit = (data: z.infer<typeof processingFormSchema>) => {
    if (editingRecord) {
      updateMutation.mutate({
        id: editingRecord.id,
        data: {
          inputQuantity: String(data.inputQuantity),
          processingType: data.processingType,
          processedBy: data.processedBy || null,
          processingDate: data.processingDate || null,
          remarks: data.remarks || null,
        }
      });
    } else {
      createMutation.mutate({
        inputLotId: data.inputLotId,
        inputQuantity: String(data.inputQuantity),
        processingType: data.processingType,
        processedBy: data.processedBy || null,
        processingDate: data.processingDate || new Date().toISOString().slice(0, 10),
        remarks: data.remarks || null,
        status: "pending",
        createdBy: employee.id,
      });
    }
  };

  const handleComplete = (data: z.infer<typeof completeProcessingSchema>) => {
    if (completeRecordId) {
      completeMutation.mutate({
        id: completeRecordId,
        data: {
          outputQuantity: data.outputQuantity,
          wasteQuantity: data.wasteQuantity,
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Factory className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Processing Records</h1>
            <p className="text-muted-foreground">View seed processing activities</p>
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
              <Button data-testid="button-add-processing">
                <Plus className="w-4 h-4 mr-2" />
                Add Processing
              </Button>
            </DialogTrigger>
          )}
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRecord ? "Edit Processing Record" : "New Processing Record"}</DialogTitle>
              <DialogDescription>{editingRecord ? "Update processing details" : "Record seed processing activity"}</DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Product (Variety) <span className="text-destructive">*</span></label>
                  <Select 
                    value={selectedProductId?.toString() || ""}
                    onValueChange={(val) => {
                      setSelectedProductId(parseInt(val));
                      form.setValue("inputLotId", 0);
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
                  <label className="text-sm font-medium">Input Lot <span className="text-destructive">*</span></label>
                  <Select 
                    value={form.watch("inputLotId")?.toString() || ""}
                    onValueChange={(val) => {
                      const id = parseInt(val);
                      form.setValue("inputLotId", id);
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Processing Type <span className="text-destructive">*</span></label>
                    <Select 
                      value={form.watch("processingType") || ""}
                      onValueChange={(val) => form.setValue("processingType", val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cleaning">Cleaning</SelectItem>
                        <SelectItem value="Processing">Processing</SelectItem>
                        <SelectItem value="Drying">Drying</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Processed By</label>
                    <Select 
                      value={form.watch("processedBy") || ""}
                      onValueChange={(val) => form.setValue("processedBy", val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Machine" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Old Machine">Old Machine</SelectItem>
                        <SelectItem value="New Machine">New Machine</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Input Quantity (KG) <span className="text-destructive">*</span></label>
                  <Input type="number" {...form.register("inputQuantity")} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Processing Date</label>
                  <Input type="date" {...form.register("processingDate")} />
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
                  {editingRecord ? "Save Changes" : "Create Processing Record"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="w-5 h-5" />
            Processing Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : processing?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No processing records found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Input Lot</TableHead>
                    <TableHead>Process Type</TableHead>
                    <TableHead>Input Qty (KG)</TableHead>
                    <TableHead>Output Qty (KG)</TableHead>
                    <TableHead>Waste (KG)</TableHead>
                    <TableHead>Processed By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    {(canEdit || canDelete) && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processing?.map((record: any) => (
                    <TableRow key={record.id} data-testid={`row-processing-${record.id}`}>
                      <TableCell className="font-medium">{getLotNumber(record.inputLotId)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.processingType}</Badge>
                      </TableCell>
                      <TableCell>{Number(record.inputQuantity)?.toLocaleString()}</TableCell>
                      <TableCell>{record.outputQuantity ? Number(record.outputQuantity)?.toLocaleString() : "-"}</TableCell>
                      <TableCell>{record.wasteQuantity ? Number(record.wasteQuantity)?.toLocaleString() : "0"}</TableCell>
                      <TableCell>{record.processedBy || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={record.status === 'completed' ? 'default' : 'secondary'}>
                          {record.status === 'completed' ? 'Completed' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(record.processingDate)}</TableCell>
                      {(canEdit || canDelete) && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {canEdit && record.status !== 'completed' && (
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="text-green-600"
                                onClick={() => {
                                  setCompleteRecordId(record.id);
                                  completeForm.reset({
                                    outputQuantity: Number(record.inputQuantity) * 0.9,
                                    wasteQuantity: Number(record.inputQuantity) * 0.1,
                                  });
                                }} 
                                data-testid={`button-complete-processing-${record.id}`}
                                title="Complete Processing"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                            {canEdit && (
                              <Button size="icon" variant="ghost" onClick={() => handleEdit(record)} data-testid={`button-edit-processing-${record.id}`}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteRecordId(record.id)} data-testid={`button-delete-processing-${record.id}`}>
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
            <AlertDialogTitle>Delete Processing Record?</AlertDialogTitle>
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

      <Dialog open={!!completeRecordId} onOpenChange={() => setCompleteRecordId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Processing</DialogTitle>
            <DialogDescription>
              Enter the output quantity and waste for this processing batch.
              {selectedRecordForComplete && (
                <span className="block mt-2 text-sm">
                  Input: <strong>{Number(selectedRecordForComplete.inputQuantity).toLocaleString()} KG</strong> from {getLotNumber(selectedRecordForComplete.inputLotId)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={completeForm.handleSubmit(handleComplete)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Output Quantity (KG) <span className="text-destructive">*</span></label>
                <Input 
                  type="number" 
                  step="0.01"
                  {...completeForm.register("outputQuantity")} 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Waste Quantity (KG)</label>
                <Input 
                  type="number" 
                  step="0.01"
                  {...completeForm.register("wasteQuantity")} 
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              A new output lot will be created with the output quantity.
            </p>
            <Button type="submit" className="w-full" disabled={completeMutation.isPending}>
              {completeMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Complete Processing
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
