import { useState, useMemo } from "react";
import { useBatches, useCreateStockMovement, useStockMovements, useLocations, useDeleteStockMovement } from "@/hooks/use-inventory";
import { useAuth } from "@/hooks/use-auth";
import { useForm, useWatch } from "react-hook-form";
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
import { ArrowRightLeft, History, AlertCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function Stock() {
  const { data: movements, isLoading } = useStockMovements();
  const { data: batches } = useBatches();
  const { data: locations } = useLocations();
  const { mutate: moveStock, isPending } = useCreateStockMovement();
  const { mutate: deleteMovement, isPending: isDeleting } = useDeleteStockMovement();
  const { canDelete } = useAuth();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { toast } = useToast();
  
  const canDeleteStock = canDelete('stock');

  const handleDeleteMovement = () => {
    if (deleteId !== null) {
      deleteMovement(deleteId, {
        onSuccess: () => setDeleteId(null)
      });
    }
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
                {canDeleteStock && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={canDeleteStock ? 7 : 6} className="text-center">Loading...</TableCell></TableRow>
              ) : movements?.length === 0 ? (
                <TableRow><TableCell colSpan={canDeleteStock ? 7 : 6} className="text-center text-muted-foreground">No movements recorded.</TableCell></TableRow>
              ) : (
                movements?.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{m.movementDate ? format(new Date(m.movementDate), 'MMM dd, yyyy') : '-'}</TableCell>
                    <TableCell>{m.batchId}</TableCell>
                    <TableCell>{locations?.find(l => l.id === m.fromLocationId)?.name || m.fromLocationId}</TableCell>
                    <TableCell>{locations?.find(l => l.id === m.toLocationId)?.name || m.toLocationId}</TableCell>
                    <TableCell className="text-right font-medium">{m.quantity} kg</TableCell>
                    <TableCell>{m.responsiblePerson}</TableCell>
                    {canDeleteStock && (
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteId(m.id)}
                          data-testid={`button-delete-movement-${m.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
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
        </CardContent>
      </Card>
    </div>
  );
}
