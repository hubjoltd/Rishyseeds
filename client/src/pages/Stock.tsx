import { useState, useMemo } from "react";
import { useLots, useProducts, useCreateStockMovement, useStockMovements, useLocations, useDeleteStockMovement, useUpdateStockMovement, useStockBalances } from "@/hooks/use-inventory";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { StockMovement, Lot, Product, StockBalance } from "@shared/schema";
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
import { ArrowRightLeft, History, AlertCircle, Trash2, Pencil, Package } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const movementFormSchema = z.object({
  lotId: z.coerce.number().min(1, "Please select a lot"),
  fromLocationId: z.coerce.number().min(1, "Please select source location"),
  toLocationId: z.coerce.number().min(1, "Please select destination"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  responsiblePerson: z.string().optional(),
  remarks: z.string().optional(),
});

export default function Stock() {
  const { data: movements, isLoading } = useStockMovements();
  const { data: lots } = useLots();
  const { data: products } = useProducts();
  const { data: locations } = useLocations();
  const { data: stockBalances } = useStockBalances();
  const { mutate: moveStock, isPending } = useCreateStockMovement();
  const { mutate: deleteMovement, isPending: isDeleting } = useDeleteStockMovement();
  const { mutate: updateMovement, isPending: isUpdating } = useUpdateStockMovement();
  const { canDelete, canEdit } = useAuth();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingMovement, setEditingMovement] = useState<StockMovement | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const { toast } = useToast();
  
  const canDeleteStock = canDelete('stock');
  const canEditStock = canEdit('stock');

  const getProductName = (productId: number) => {
    const product = (products as Product[] || []).find(p => p.id === productId);
    return product ? `${product.crop} - ${product.variety}` : `Product #${productId}`;
  };

  const getLotDetails = (lotId: number | null | undefined) => {
    if (!lotId) return '-';
    const lot = (lots as Lot[] || []).find(l => l.id === lotId);
    if (!lot) return `Lot #${lotId}`;
    const product = (products as Product[] || []).find(p => p.id === lot.productId);
    return `${lot.lotNumber} (${product?.crop} - ${product?.variety || 'Unknown'})`;
  };

  const getLocationName = (locationId: number) => {
    const location = (locations || []).find(l => l.id === locationId);
    return location?.name || `Location #${locationId}`;
  };

  const getLooseStockForLot = (lotId: number) => {
    const balances = (stockBalances as StockBalance[] || []).filter(
      sb => sb.lotId === lotId && sb.stockForm === 'loose'
    );
    return balances.reduce((sum, sb) => sum + Number(sb.quantity), 0);
  };

  const getStockByWarehouse = (lotId: number) => {
    const balances = (stockBalances as StockBalance[] || []).filter(
      sb => sb.lotId === lotId && sb.stockForm === 'loose' && Number(sb.quantity) > 0
    );
    return balances.map(sb => ({
      locationId: sb.locationId,
      locationName: getLocationName(sb.locationId),
      quantity: Number(sb.quantity)
    }));
  };

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
      lotId: movement.lotId || 0,
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
    
    const availableStock = getLooseStockForLot(data.lotId);
    const originalQty = editingMovement.lotId === data.lotId ? Number(editingMovement.quantity) : 0;
    const effectiveAvailable = availableStock + originalQty;
    
    if (data.quantity > effectiveAvailable) {
      toast({
        title: "Invalid Quantity",
        description: `Cannot move ${data.quantity}kg. Only ${effectiveAvailable.toFixed(2)}kg available.`,
        variant: "destructive",
      });
      return;
    }
    
    updateMovement({
      id: editingMovement.id,
      data: {
        lotId: data.lotId,
        fromLocationId: data.fromLocationId,
        toLocationId: data.toLocationId,
        quantity: String(data.quantity),
        responsiblePerson: data.responsiblePerson || null,
        remarks: data.remarks || null,
      }
    }, {
      onSuccess: () => {
        setEditOpen(false);
        setEditingMovement(null);
        editForm.reset();
      },
    });
  };

  const form = useForm<z.infer<typeof movementFormSchema>>({
    resolver: zodResolver(movementFormSchema),
    defaultValues: {
      quantity: 0,
    }
  });

  const editForm = useForm<z.infer<typeof movementFormSchema>>({
    resolver: zodResolver(movementFormSchema),
  });

  const selectedLotId = form.watch("lotId");
  const enteredQuantity = form.watch("quantity");

  const selectedLot = useMemo(() => {
    return (lots as Lot[] || []).find(l => l.id === selectedLotId);
  }, [lots, selectedLotId]);

  const availableStock = selectedLot ? getLooseStockForLot(selectedLot.id) : 0;
  const quantityExceedsAvailable = enteredQuantity > availableStock;

  const onSubmit = (data: z.infer<typeof movementFormSchema>) => {
    if (data.quantity > availableStock) {
      toast({
        title: "Invalid Quantity",
        description: `Cannot move ${data.quantity}kg. Only ${availableStock.toFixed(2)}kg available in stock.`,
        variant: "destructive",
      });
      return;
    }

    moveStock({
      lotId: data.lotId,
      fromLocationId: data.fromLocationId,
      toLocationId: data.toLocationId,
      quantity: String(data.quantity),
      responsiblePerson: data.responsiblePerson || null,
      remarks: data.remarks || null,
    }, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    });
  };

  const activeLots = (lots as Lot[] || []).filter(l => l.status === 'active');
  const filteredLots = selectedProductId 
    ? activeLots.filter(l => l.productId === selectedProductId)
    : activeLots;

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
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Move Stock</DialogTitle>
              <DialogDescription>
                Transfer inventory between warehouse locations
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Product (Variety) <span className="text-destructive">*</span></label>
                <Select onValueChange={(val) => {
                  setSelectedProductId(parseInt(val));
                  form.setValue("lotId", 0);
                }}>
                  <SelectTrigger data-testid="select-product">
                    <SelectValue placeholder="Select Product" />
                  </SelectTrigger>
                  <SelectContent>
                    {(products as Product[] || []).map((p: Product) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.crop} - {p.variety}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Lot Number <span className="text-destructive">*</span></label>
                <Select 
                  onValueChange={(val) => form.setValue("lotId", parseInt(val))}
                  disabled={!selectedProductId}
                >
                  <SelectTrigger data-testid="select-lot">
                    <SelectValue placeholder={selectedProductId ? "Select Lot" : "Select product first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredLots.map((lot) => (
                      <SelectItem key={lot.id} value={lot.id.toString()}>
                        {lot.lotNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.lotId && <p className="text-xs text-red-500">Required</p>}
              </div>

              {selectedLot && (
                <div className="p-3 rounded-lg bg-muted/50 border space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Package className="w-4 h-4 text-primary" />
                    <span className="font-medium">Lot Details</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Product:</span>
                      <p className="font-medium">{getProductName(selectedLot.productId)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Received Qty:</span>
                      <p className="font-medium">{Number(selectedLot.initialQuantity).toFixed(2)} KG</p>
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Total Available:</span>
                    <p className="font-bold text-primary">{availableStock.toFixed(2)} KG</p>
                  </div>
                  {getStockByWarehouse(selectedLot.id).length > 0 && (
                    <div className="text-sm border-t pt-2">
                      <span className="text-muted-foreground font-medium">Stock by Warehouse:</span>
                      <div className="mt-1 space-y-1">
                        {getStockByWarehouse(selectedLot.id).map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs bg-background rounded px-2 py-1">
                            <span>{item.locationName}</span>
                            <span className="font-medium">{item.quantity.toFixed(2)} KG</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">From Location</label>
                  <Select onValueChange={(val) => form.setValue("fromLocationId", parseInt(val))}>
                    <SelectTrigger data-testid="select-from-location"><SelectValue placeholder="Source" /></SelectTrigger>
                    <SelectContent>
                      {(locations || []).map((l) => (
                        <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">To Location</label>
                  <Select onValueChange={(val) => form.setValue("toLocationId", parseInt(val))}>
                    <SelectTrigger data-testid="select-to-location"><SelectValue placeholder="Destination" /></SelectTrigger>
                    <SelectContent>
                      {(locations || []).map((l) => (
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
                  data-testid="input-quantity"
                />
                {selectedLot && quantityExceedsAvailable && (
                  <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Exceeds available stock! Max: {availableStock.toFixed(2)}kg
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Responsible Person</label>
                <Input {...form.register("responsiblePerson")} placeholder="Name" data-testid="input-responsible-person" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Remarks</label>
                <Input {...form.register("remarks")} placeholder="Optional notes" data-testid="input-remarks" />
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
                <TableHead>Lot & Crop Details</TableHead>
                <TableHead>From Warehouse</TableHead>
                <TableHead>To Warehouse</TableHead>
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
                movements?.map((m) => {
                  const lot = (lots as Lot[] || []).find(l => l.id === m.lotId);
                  const product = lot ? (products as Product[] || []).find(p => p.id === lot.productId) : null;
                  return (
                    <TableRow key={m.id} data-testid={`row-movement-${m.id}`}>
                      <TableCell>{m.movementDate ? format(new Date(m.movementDate), 'MMM dd, yyyy') : '-'}</TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="font-mono font-medium">{lot?.lotNumber || '-'}</div>
                          <div className="text-xs text-muted-foreground">
                            {product ? `${product.crop} - ${product.variety}` : '-'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="font-medium">{getLocationName(m.fromLocationId)}</div>
                          <div className="text-xs text-muted-foreground">Source</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="font-medium">{getLocationName(m.toLocationId)}</div>
                          <div className="text-xs text-muted-foreground">Destination</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{m.quantity} kg</TableCell>
                      <TableCell>{m.responsiblePerson || '-'}</TableCell>
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
                  );
                })
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
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Edit Stock Movement</DialogTitle>
                <DialogDescription>
                  Update movement details
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Lot Number</label>
                  <Select 
                    value={editForm.watch("lotId")?.toString()} 
                    onValueChange={(val) => editForm.setValue("lotId", parseInt(val))}
                  >
                    <SelectTrigger data-testid="select-edit-lot">
                      <SelectValue placeholder="Select Lot" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeLots.map((lot) => (
                        <SelectItem key={lot.id} value={lot.id.toString()}>
                          {lot.lotNumber}
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
                        {(locations || []).map((l) => (
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
                        {(locations || []).map((l) => (
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

                <div className="space-y-2">
                  <label className="text-sm font-medium">Remarks</label>
                  <Input {...editForm.register("remarks")} placeholder="Optional notes" data-testid="input-edit-remarks" />
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
