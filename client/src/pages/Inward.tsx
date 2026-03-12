import { useState, useEffect } from "react";
import { useLots, useCreateLot, useUpdateLot, useDeleteLot, useGenerateLotNumber, useStockBalances, useProducts, useLocations } from "@/hooks/use-inventory";
import { useEmployees } from "@/hooks/use-hrms";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Lot, Product, Location, StockBalance } from "@shared/schema";
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
import { Combobox } from "@/components/ui/combobox";
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
import { Plus, Search, PackagePlus, Trash2, RefreshCw, Pencil } from "lucide-react";
import { format } from "date-fns";

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

export default function Inward() {
  const { data: lots, isLoading } = useLots();
  const { data: stockBalances } = useStockBalances();
  const { data: products } = useProducts();
  const { data: locations } = useLocations();
  const { data: employees } = useEmployees();
  const { mutate: createLot, isPending } = useCreateLot();
  const { mutate: updateLot, isPending: isUpdating } = useUpdateLot();
  const { mutate: deleteLot, isPending: isDeleting } = useDeleteLot();
  const { mutateAsync: generateLotNumber, isPending: isGenerating } = useGenerateLotNumber();
  const { canDelete, canEdit } = useAuth();
  
  const getCreatedByName = (createdById: number | null | undefined) => {
    if (!createdById) return "-";
    const emp = (employees || []).find((e: any) => e.id === createdById);
    return emp?.fullName || emp?.employeeId || "-";
  };
  
  const [open, setOpen] = useState(false);
  const [editingLot, setEditingLot] = useState<Lot | null>(null);
  const [deleteLotId, setDeleteLotId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [generatedLotNumber, setGeneratedLotNumber] = useState("");

  const canDeleteLot = canDelete('lots');
  const canEditLot = canEdit('lots');

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

  const handleGenerateLotNumber = async () => {
    if (selectedProductId) {
      try {
        const result = await generateLotNumber(selectedProductId);
        setGeneratedLotNumber(result.lotNumber);
      } catch (e) {
        console.error("Failed to generate lot number");
      }
    }
  };

  const onSubmit = async (data: z.infer<typeof inwardFormSchema>) => {
    let lotNumber = generatedLotNumber;
    if (!lotNumber && data.productId) {
      const result = await generateLotNumber(data.productId);
      lotNumber = result.lotNumber;
    }
    
    const quantityInKg = data.quantityUnit === "tons" 
      ? data.initialQuantity * 1000 
      : data.initialQuantity;
    
    createLot({
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
    }, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
        setGeneratedLotNumber("");
      },
    });
  };

  const handleDelete = () => {
    if (deleteLotId) {
      deleteLot(deleteLotId, {
        onSuccess: () => setDeleteLotId(null),
      });
    }
  };

  const handleEdit = (lot: Lot) => {
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
    
    const quantityInKg = data.quantityUnit === "tons" 
      ? data.initialQuantity * 1000 
      : data.initialQuantity;
    
    updateLot({
      id: editingLot.id,
      data: {
        sourceName: data.sourceName || null,
        initialQuantity: String(quantityInKg),
        stockForm: data.stockForm,
        inwardDate: data.inwardDate || null,
        expiryDate: data.expiryDate || null,
        remarks: data.remarks || null,
      }
    }, {
      onSuccess: () => {
        setOpen(false);
        setEditingLot(null);
        form.reset();
        setGeneratedLotNumber("");
      },
    });
  };

  const getProductDetails = (productId: number) => {
    const product = products?.find((p: Product) => p.id === productId);
    return product ? `${product.crop} - ${product.variety}` : "Unknown";
  };

  const parseBalanceToKg = (b: StockBalance): number => {
    const qty = Number(b.quantity);
    if (b.stockForm === 'packed' && b.packetSize) {
      const s = b.packetSize.toLowerCase().trim();
      if (s.endsWith('kg')) return qty * parseFloat(s);
      if (s.endsWith('g')) return qty * parseFloat(s) / 1000;
    }
    return qty;
  };

  const getLotBalance = (lotId: number) => {
    const balances = stockBalances?.filter((b: StockBalance) => b.lotId === lotId && b.stockForm === 'loose') || [];
    return balances.reduce((sum: number, b: StockBalance) => sum + Number(b.quantity), 0);
  };

  const filteredLots = (lots as Lot[] || []).filter((lot: Lot) =>
    lot.lotNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display text-primary">Inward / Lots</h2>
          <p className="text-muted-foreground">Record incoming seed stock with auto-generated lot numbers</p>
        </div>

        <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setEditingLot(null);
            form.reset();
            setGeneratedLotNumber("");
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20" data-testid="button-new-inward">
              <Plus className="mr-2 h-4 w-4" />
              Record Inward
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingLot ? "Edit Lot" : "Record Inward Stock"}</DialogTitle>
              <DialogDescription>{editingLot ? "Update lot details" : "Add new incoming seed stock to the system"}</DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(editingLot ? handleUpdate : onSubmit)} className="space-y-4">
              {editingLot ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Product (Crop/Variety)</label>
                  <Input 
                    value={getProductDetails(editingLot.productId)}
                    disabled
                    className="bg-muted"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Product (Crop/Variety)</label>
                  <Combobox
                    options={(products as Product[] || []).map((p: Product) => ({
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
                  <Input 
                    value={generatedLotNumber} 
                    onChange={(e) => setGeneratedLotNumber(e.target.value)}
                    placeholder="Auto-generated or enter manually"
                    data-testid="input-lot-number"
                  />
                  {!editingLot && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleGenerateLotNumber}
                      disabled={!selectedProductId || isGenerating}
                      data-testid="button-generate-lot"
                    >
                      <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                    </Button>
                  )}
                </div>
                {!editingLot && <p className="text-xs text-muted-foreground">Format: MA-XX-26-001</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Source / Supplier (Optional)</label>
                <Input 
                  {...form.register("sourceName")}
                  placeholder="Enter supplier or source name"
                  data-testid="input-source-name"
                />
              </div>

              {!editingLot && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Warehouse (Location)</label>
                  <Select onValueChange={(val) => form.setValue("locationId", parseInt(val))}>
                    <SelectTrigger data-testid="select-location">
                      <SelectValue placeholder="Select Warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {(locations as Location[] || []).map((loc: Location) => (
                        <SelectItem key={loc.id} value={loc.id.toString()}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantity</label>
                  <Input 
                    type="number" 
                    {...form.register("initialQuantity")}
                    placeholder="Enter quantity"
                    data-testid="input-quantity"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Unit</label>
                  <Select 
                    defaultValue="kg"
                    onValueChange={(val) => form.setValue("quantityUnit", val)}
                  >
                    <SelectTrigger data-testid="select-quantity-unit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">KG</SelectItem>
                      <SelectItem value="tons">Tons</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Stock Form</label>
                  <Select 
                    defaultValue="loose"
                    onValueChange={(val) => form.setValue("stockForm", val)}
                  >
                    <SelectTrigger data-testid="select-stock-form">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="loose">Raw Seeds</SelectItem>
                      <SelectItem value="cobs">Cobs</SelectItem>
                      <SelectItem value="packed">Packed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Inward Date</label>
                  <Input 
                    type="date" 
                    {...form.register("inwardDate")}
                    data-testid="input-inward-date"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Expiry Date</label>
                  <Input 
                    type="date" 
                    {...form.register("expiryDate")}
                    data-testid="input-expiry-date"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Remarks</label>
                <Input 
                  {...form.register("remarks")}
                  placeholder="Optional notes"
                  data-testid="input-remarks"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={editingLot ? isUpdating : isPending}
                data-testid="button-submit-inward"
              >
                {editingLot 
                  ? (isUpdating ? "Saving..." : "Save Changes")
                  : (isPending ? "Recording..." : "Record Inward")
                }
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by lot number..."
          className="pl-10 max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-lots"
        />
      </div>

      <Card className="border-0 shadow-lg shadow-primary/5">
        <CardHeader className="pb-0">
          <div className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5 text-primary" />
            <span className="font-semibold">Lot Inventory</span>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <p className="text-muted-foreground">Loading lots...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lot Number</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Initial Qty</TableHead>
                  <TableHead>Current Balance (Loose)</TableHead>
                  <TableHead>Stock Form</TableHead>
                  <TableHead>Inward Date</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLots.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      No lots found. Record your first inward entry above.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLots.map((lot: Lot) => (
                    <TableRow key={lot.id} data-testid={`row-lot-${lot.id}`}>
                      <TableCell className="font-mono font-medium">{lot.lotNumber}</TableCell>
                      <TableCell>{getProductDetails(lot.productId)}</TableCell>
                      <TableCell>{lot.initialQuantity} kg</TableCell>
                      <TableCell className="font-medium">{getLotBalance(lot.id)} kg</TableCell>
                      <TableCell>
                        <Badge variant={lot.stockForm === 'packed' ? 'default' : 'secondary'}>
                          {lot.stockForm === 'loose' ? 'Raw Seeds' : lot.stockForm === 'cobs' ? 'Cobs' : lot.stockForm}
                        </Badge>
                      </TableCell>
                      <TableCell>{lot.inwardDate ? format(new Date(lot.inwardDate), "PP") : "-"}</TableCell>
                      <TableCell>{getCreatedByName(lot.createdBy)}</TableCell>
                      <TableCell>
                        <Badge variant={lot.status === 'active' ? 'default' : 'outline'}>
                          {lot.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canEditLot && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(lot)}
                              data-testid={`button-edit-lot-${lot.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canDeleteLot && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteLotId(lot.id)}
                              data-testid={`button-delete-lot-${lot.id}`}
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

      <AlertDialog open={!!deleteLotId} onOpenChange={() => setDeleteLotId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lot</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lot? This action cannot be undone and will affect all related stock balances.
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
