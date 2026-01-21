import { useState } from "react";
import { usePackagingSizes, useCreatePackagingSize, useUpdatePackagingSize, useDeletePackagingSize } from "@/hooks/use-inventory";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { PackagingSize } from "@shared/schema";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Package } from "lucide-react";

const packagingSizeFormSchema = z.object({
  size: z.coerce.number().positive("Size must be positive"),
  unit: z.string().min(1, "Please select a unit"),
  label: z.string().min(1, "Label is required"),
});

export default function PackagingSizes() {
  const { data: sizes, isLoading } = usePackagingSizes();
  const { mutate: createSize, isPending: isCreating } = useCreatePackagingSize();
  const { mutate: updateSize, isPending: isUpdating } = useUpdatePackagingSize();
  const { mutate: deleteSize, isPending: isDeleting } = useDeletePackagingSize();
  const { canDelete, canEdit } = useAuth();
  
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<PackagingSize | null>(null);

  const canDeleteSizes = canDelete('packagingSizes');
  const canEditSizes = canEdit('packagingSizes');

  const form = useForm<z.infer<typeof packagingSizeFormSchema>>({
    resolver: zodResolver(packagingSizeFormSchema),
    defaultValues: {
      size: 0,
      unit: "Kg",
      label: "",
    }
  });

  const editForm = useForm<z.infer<typeof packagingSizeFormSchema>>({
    resolver: zodResolver(packagingSizeFormSchema),
  });

  const onSubmit = (data: z.infer<typeof packagingSizeFormSchema>) => {
    createSize({
      size: String(data.size),
      unit: data.unit,
      label: data.label || `${data.size} ${data.unit}`,
    }, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    });
  };

  const onEditSubmit = (data: z.infer<typeof packagingSizeFormSchema>) => {
    if (!selectedSize) return;
    updateSize({
      id: selectedSize.id,
      data: {
        size: String(data.size),
        unit: data.unit,
        label: data.label || `${data.size} ${data.unit}`,
      },
    }, {
      onSuccess: () => {
        setEditOpen(false);
        setSelectedSize(null);
      },
    });
  };

  const handleEdit = (size: PackagingSize) => {
    setSelectedSize(size);
    editForm.reset({
      size: Number(size.size),
      unit: size.unit,
      label: size.label,
    });
    setEditOpen(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteSize(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  const updateLabel = (sizeValue: number, unit: string) => {
    form.setValue("label", `${sizeValue} ${unit}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display text-primary">Packaging Sizes</h2>
          <p className="text-muted-foreground">Manage standard packaging sizes for products</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20" data-testid="button-new-size">
              <Plus className="mr-2 h-4 w-4" />
              Add Size
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Packaging Size</DialogTitle>
              <DialogDescription>Create a new standard packaging size</DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Size</label>
                  <Input 
                    type="number" 
                    {...form.register("size", {
                      onChange: (e) => updateLabel(Number(e.target.value), form.getValues("unit"))
                    })}
                    placeholder="e.g., 10"
                    data-testid="input-size"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Unit</label>
                  <Select 
                    defaultValue="Kg"
                    onValueChange={(val) => {
                      form.setValue("unit", val);
                      updateLabel(form.getValues("size"), val);
                    }}
                  >
                    <SelectTrigger data-testid="select-unit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Kg">Kg</SelectItem>
                      <SelectItem value="g">g</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Display Label</label>
                <Input 
                  {...form.register("label")}
                  placeholder="e.g., 10 Kg"
                  data-testid="input-label"
                />
                <p className="text-xs text-muted-foreground">This label will be shown in dropdowns</p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isCreating}
                data-testid="button-submit-size"
              >
                {isCreating ? "Creating..." : "Create Size"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-0 shadow-lg shadow-primary/5">
        <CardHeader className="pb-0">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <span className="font-semibold">Available Sizes</span>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <p className="text-muted-foreground">Loading sizes...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(sizes as PackagingSize[] || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No packaging sizes defined yet. Add common sizes like 10 Kg, 25 Kg, 50 Kg.
                    </TableCell>
                  </TableRow>
                ) : (
                  (sizes as PackagingSize[] || []).map((size: PackagingSize) => (
                    <TableRow key={size.id} data-testid={`row-size-${size.id}`}>
                      <TableCell className="font-medium">{size.label}</TableCell>
                      <TableCell>{size.size}</TableCell>
                      <TableCell>{size.unit}</TableCell>
                      <TableCell>
                        <Badge variant={size.isActive ? 'default' : 'secondary'}>
                          {size.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {canEditSizes && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(size)}
                              data-testid={`button-edit-size-${size.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canDeleteSizes && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(size.id)}
                              data-testid={`button-delete-size-${size.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Packaging Size</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Size</label>
                <Input 
                  type="number" 
                  {...editForm.register("size")}
                  data-testid="input-edit-size"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Unit</label>
                <Select 
                  value={editForm.watch("unit")}
                  onValueChange={(val) => editForm.setValue("unit", val)}
                >
                  <SelectTrigger data-testid="select-edit-unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kg">Kg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Display Label</label>
              <Input 
                {...editForm.register("label")}
                data-testid="input-edit-label"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isUpdating}
              data-testid="button-save-size"
            >
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Packaging Size</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this packaging size? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              data-testid="button-confirm-delete"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
