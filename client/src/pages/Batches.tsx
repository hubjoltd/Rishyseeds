import { useState } from "react";
import { useBatches, useCreateBatch, useUpdateBatch, useDeleteBatch } from "@/hooks/use-inventory";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBatchSchema, type Batch } from "@shared/schema";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Plus, Search, Sprout, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function Batches() {
  const { data: batches, isLoading } = useBatches();
  const { mutate: createBatch, isPending } = useCreateBatch();
  const { mutate: updateBatch, isPending: isUpdating } = useUpdateBatch();
  const { mutate: deleteBatch, isPending: isDeleting } = useDeleteBatch();
  const [open, setOpen] = useState(false);
  const [editBatch, setEditBatch] = useState<Batch | null>(null);
  const [deleteBatchId, setDeleteBatchId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const form = useForm<z.infer<typeof insertBatchSchema>>({
    resolver: zodResolver(insertBatchSchema),
  });

  const editForm = useForm<z.infer<typeof insertBatchSchema>>({
    resolver: zodResolver(insertBatchSchema),
  });

  const onSubmit = (data: z.infer<typeof insertBatchSchema>) => {
    createBatch(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    });
  };

  const onEditSubmit = (data: z.infer<typeof insertBatchSchema>) => {
    if (!editBatch) return;
    updateBatch({ id: editBatch.id, data }, {
      onSuccess: () => {
        setEditBatch(null);
        editForm.reset();
      },
    });
  };

  const handleEdit = (batch: Batch) => {
    setEditBatch(batch);
    editForm.reset({
      batchNumber: batch.batchNumber,
      productionDate: batch.productionDate,
      crop: batch.crop,
      variety: batch.variety,
      lotSize: Number(batch.lotSize),
    });
  };

  const handleDelete = () => {
    if (deleteBatchId) {
      deleteBatch(deleteBatchId, {
        onSuccess: () => setDeleteBatchId(null),
      });
    }
  };

  const filteredBatches = batches?.filter(b =>
    b.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
    b.crop.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display text-primary">Batches</h2>
          <p className="text-muted-foreground">Manage seed production batches</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20" data-testid="button-new-batch">
              <Plus className="mr-2 h-4 w-4" />
              New Batch
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Batch</DialogTitle>
              <DialogDescription>Add a new seed production batch</DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Batch Number</label>
                  <Input {...form.register("batchNumber")} placeholder="e.g., BN-2024-001" data-testid="input-batch-number" />
                  {form.formState.errors.batchNumber && <span className="text-xs text-red-500">{form.formState.errors.batchNumber.message}</span>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Production Date</label>
                  <Input type="date" {...form.register("productionDate")} data-testid="input-production-date" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Crop</label>
                  <Input {...form.register("crop")} placeholder="e.g., Wheat" data-testid="input-crop" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Variety</label>
                  <Input {...form.register("variety")} placeholder="e.g., HD-2967" data-testid="input-variety" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Initial Lot Size (KG)</label>
                <Input
                  type="number"
                  step="0.01"
                  {...form.register("lotSize", { valueAsNumber: true })}
                  data-testid="input-lot-size"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isPending} data-testid="button-submit-batch">
                {isPending ? "Creating..." : "Create Batch"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editBatch} onOpenChange={(open) => !open && setEditBatch(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Batch</DialogTitle>
            <DialogDescription>Update batch details</DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Batch Number</label>
                <Input {...editForm.register("batchNumber")} data-testid="input-edit-batch-number" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Production Date</label>
                <Input type="date" {...editForm.register("productionDate")} data-testid="input-edit-production-date" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Crop</label>
                <Input {...editForm.register("crop")} data-testid="input-edit-crop" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Variety</label>
                <Input {...editForm.register("variety")} data-testid="input-edit-variety" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Lot Size (KG)</label>
              <Input
                type="number"
                step="0.01"
                {...editForm.register("lotSize", { valueAsNumber: true })}
                data-testid="input-edit-lot-size"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isUpdating} data-testid="button-update-batch">
              {isUpdating ? "Updating..." : "Update Batch"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteBatchId} onOpenChange={(open) => !open && setDeleteBatchId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the batch and all associated records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700" data-testid="button-confirm-delete">
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search batches..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm border-none bg-transparent focus-visible:ring-0 px-0"
              data-testid="input-search-batches"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch No</TableHead>
                <TableHead>Crop & Variety</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Initial Size</TableHead>
                <TableHead className="text-right">Current Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
                </TableRow>
              ) : filteredBatches?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No batches found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredBatches?.map((batch) => (
                  <TableRow key={batch.id} className="group hover:bg-muted/50 transition-colors" data-testid={`row-batch-${batch.id}`}>
                    <TableCell className="font-medium">{batch.batchNumber}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-green-100 text-green-700 rounded-md">
                          <Sprout className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{batch.crop}</p>
                          <p className="text-xs text-muted-foreground">{batch.variety}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{batch.productionDate ? format(new Date(batch.productionDate), 'MMM dd, yyyy') : '-'}</TableCell>
                    <TableCell className="text-right">{batch.lotSize} kg</TableCell>
                    <TableCell className="text-right font-bold text-primary">{batch.currentQuantity} kg</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        batch.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {batch.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(batch)}
                          data-testid={`button-edit-batch-${batch.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteBatchId(batch.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          data-testid={`button-delete-batch-${batch.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
