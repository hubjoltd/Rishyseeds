import { useState, useMemo } from "react";
import { useBatches, useCreateStockMovement, useStockMovements, useLocations, useDeleteStockMovement, useUpdateStockMovement } from "@/hooks/use-inventory";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertStockMovementSchema, type StockMovement } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRightLeft, History, AlertCircle, Trash2, Pencil } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function Stock() {
  const { data: movements, isLoading } = useStockMovements();
  const { data: batches } = useBatches();
  const { data: locations } = useLocations();
  const { mutate: moveStock, isPending } = useCreateStockMovement();
  const { mutate: deleteMovement, isPending: isDeleting } = useDeleteStockMovement();
  const { mutate: updateMovement, isPending: isUpdating } = useUpdateStockMovement();
  const { canDelete, canEdit } = useAuth();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<StockMovement | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { toast } = useToast();
  
  const canDeleteStock = canDelete('stock');
  const canEditStock = canEdit('stock');

  const handleDeleteMovement = () => {
    if (deleteId !== null) {
      deleteMovement(deleteId, {
        onSuccess: () => setDeleteId(null)
      });
    }
  };

  const handleEditMovement = (movement: StockMovement) => {
    setEditingMovement(movement);
    editForm.reset({
      batchId: movement.batchId,
      fromLocationId: movement.fromLocationId,
      toLocationId: movement.toLocationId,
      quantity: Number(movement.quantity),
      responsiblePerson: movement.responsiblePerson || "",
      remarks: movement.remarks || "",
    });
    setEditOpen(true);
  };

  const onEditSubmit = (data: z.infer<typeof movementFormSchema>) => {
    if (!editingMovement) return;
    
    // Validate quantity for the selected batch
    const batch = batches?.find(b => b.id === data.batchId);
    const batchAvailable = batch ? Number(batch.currentQuantity) : 0;
    // When editing, add back the original quantity to available
    const originalQty = editingMovement.batchId === data.batchId ? Number(editingMovement.quantity) : 0;
    const effectiveAvailable = batchAvailable + originalQty;
    
    if (data.quantity > effectiveAvailable) {
      toast({
        title: "Invalid Quantity",
        description: `Cannot move ${data.quantity}kg. Only ${effectiveAvailable}kg available in this batch.`,
        variant: "destructive",
      });
      return;
    }
    
    updateMovement({
      id: editingMovement.id,
      data: {
        ...data,
        quantity: String(data.quantity),
      }
    }, {
      onSuccess: () => {
        setEditOpen(false);
        setEditingMovement(null);
        editForm.reset();
      },
    });
  };

  // Extend the schema because zod expects numbers but form returns strings initially
  const movementFormSchema = insertStockMovementSchema.extend({
    batchId: z.coerce.number(),
    fromLocationId: z.coerce.number(),
    toLocationId: z.coerce.number(),
    quantity: z.coerce.number().positive("Quantity must be positive"),
  });

  const form = useForm<z.infer<typeof movementFormSchema>>({
    resolver: zodResolver(movementFormSchema),
  });

  const editForm = useForm<z.infer<typeof movementFormSchema>>({
    resolver: zodResolver(movementFormSchema),
  });

  // Watch selected batch to validate quantity
  const selectedBatchId = form.watch("batchId");
  const enteredQuantity = form.watch("quantity");

  const selectedBatch = useMemo(() => {
    return batches?.find(b => b.id === selectedBatchId);
  }, [batches, selectedBatchId]);

  const availableStock = selectedBatch ? Number(selectedBatch.currentQuantity) : 0;
  const quantityExceedsAvailable = enteredQuantity > availableStock;

  const onSubmit = (data: z.infer<typeof movementFormSchema>) => {
    // Validation: Cannot move more than available
    if (data.quantity > availableStock) {
      toast({
        title: "Invalid Quantity",
        description: `Cannot move ${data.quantity}kg. Only ${availableStock}kg available in this batch.`,
        variant: "destructive",
      });
      return;
    }

    // Convert quantity to string for API (decimal type in database)
    const submitData = {
      ...data,
      quantity: String(data.quantity),
    };

    moveStock(submitData, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold font-display text-primary">Stock Movement</h2>
          <p className="text-muted-foreground">Track inventory flow between locations</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-movement">
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              New Movement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Move Stock</DialogTitle>
              <DialogDescription>
                Transfer inventory between storage and packaging locations
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Batch</label>
                <Select onValueChange={(val) => form.setValue("batchId", parseInt(val))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {batches?.map((b) => (
                      <SelectItem key={b.id} value={b.id.toString()}>
                        {b.batchNumber} - {b.crop} ({b.currentQuantity}kg avail)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.batchId && <p className="text-xs text-red-500">Required</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">From Location</label>
                  <Select onValueChange={(val) => form.setValue("fromLocationId", parseInt(val))}>
                    <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
                    <SelectContent>
                      {locations?.map((l) => (
                        <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">To Location</label>
                  <Select onValueChange={(val) => form.setValue("toLocationId", parseInt(val))}>
                    <SelectTrigger><SelectValue placeholder="Destination" /></SelectTrigger>
                    <SelectContent>
                      {locations?.map((l) => (
                        <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity (KG)</label>
                <Input 
                  type="number" 
                  {...form.register("quantity")} 
                  className={quantityExceedsAvailable ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {selectedBatch && (
                  <p className={`text-xs ${quantityExceedsAvailable ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                    {quantityExceedsAvailable ? (
                      <span className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Exceeds available stock! Max: {availableStock}kg
                      </span>
                    ) : (
                      `Available: ${availableStock}kg`
                    )}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Responsible Person</label>
                <Input {...form.register("responsiblePerson")} placeholder="Name" />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isPending || quantityExceedsAvailable}
                data-testid="button-confirm-movement"
              >
                {isPending ? "Moving..." : "Confirm Movement"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Movement History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Batch ID</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Person</TableHead>
                {(canEditStock || canDeleteStock) && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={(canEditStock || canDeleteStock) ? 7 : 6} className="text-center">Loading...</TableCell></TableRow>
              ) : movements?.length === 0 ? (
                <TableRow><TableCell colSpan={(canEditStock || canDeleteStock) ? 7 : 6} className="text-center text-muted-foreground">No movements recorded.</TableCell></TableRow>
              ) : (
                movements?.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{m.movementDate ? format(new Date(m.movementDate), 'MMM dd, yyyy') : '-'}</TableCell>
                    <TableCell>{m.batchId}</TableCell>
                    <TableCell>{locations?.find(l => l.id === m.fromLocationId)?.name || m.fromLocationId}</TableCell>
                    <TableCell>{locations?.find(l => l.id === m.toLocationId)?.name || m.toLocationId}</TableCell>
                    <TableCell className="text-right font-medium">{m.quantity} kg</TableCell>
                    <TableCell>{m.responsiblePerson}</TableCell>
                    {(canEditStock || canDeleteStock) && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {canEditStock && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEditMovement(m)}
                              data-testid={`button-edit-movement-${m.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          )}
                          {canDeleteStock && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteId(m.id)}
                              data-testid={`button-delete-movement-${m.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Movement</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this stock movement? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteMovement}
                  className="bg-destructive hover:bg-destructive/90"
                  data-testid="button-confirm-delete-movement"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Stock Movement</DialogTitle>
                <DialogDescription>
                  Update movement details
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Batch</label>
                  <Select 
                    value={editForm.watch("batchId")?.toString()} 
                    onValueChange={(val) => editForm.setValue("batchId", parseInt(val))}
                  >
                    <SelectTrigger data-testid="select-edit-batch">
                      <SelectValue placeholder="Select Batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {batches?.map((b) => (
                        <SelectItem key={b.id} value={b.id.toString()}>
                          {b.batchNumber} - {b.crop} ({b.currentQuantity}kg avail)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">From Location</label>
                    <Select 
                      value={editForm.watch("fromLocationId")?.toString()}
                      onValueChange={(val) => editForm.setValue("fromLocationId", parseInt(val))}
                    >
                      <SelectTrigger data-testid="select-edit-from-location"><SelectValue placeholder="Source" /></SelectTrigger>
                      <SelectContent>
                        {locations?.map((l) => (
                          <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">To Location</label>
                    <Select 
                      value={editForm.watch("toLocationId")?.toString()}
                      onValueChange={(val) => editForm.setValue("toLocationId", parseInt(val))}
                    >
                      <SelectTrigger data-testid="select-edit-to-location"><SelectValue placeholder="Destination" /></SelectTrigger>
                      <SelectContent>
                        {locations?.map((l) => (
                          <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantity (KG)</label>
                  <Input 
                    type="number" 
                    {...editForm.register("quantity")}
                    data-testid="input-edit-quantity"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Responsible Person</label>
                  <Input {...editForm.register("responsiblePerson")} placeholder="Name" data-testid="input-edit-responsible-person" />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isUpdating}
                  data-testid="button-confirm-edit-movement"
                >
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
