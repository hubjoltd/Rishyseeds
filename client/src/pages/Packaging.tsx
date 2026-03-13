import { useState } from "react";
import { useLots, useProducts, usePackagingSizes, useStockBalances, useLocations, useCreatePackagingOutput, usePackagingOutputs, useDeletePackagingOutput, useUpdatePackagingOutput } from "@/hooks/use-inventory";
import { useEmployees } from "@/hooks/use-hrms";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPackagingOutputSchema, type PackagingOutput, type Lot, type Product, type PackagingSize, type StockBalance, type Location } from "@shared/schema";
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
import { Combobox } from "@/components/ui/combobox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Plus, Boxes, Trash2, Pencil } from "lucide-react";
import { format } from "date-fns";

export default function Packaging() {
  const { data: packagingOutputs, isLoading } = usePackagingOutputs();
  const { data: lots } = useLots();
  const { data: products } = useProducts();
  const { data: packagingSizes } = usePackagingSizes();
  const { data: stockBalances } = useStockBalances();
  const { data: locations } = useLocations();
  const { data: employees } = useEmployees();
  const { mutate: createPackaging, isPending } = useCreatePackagingOutput();
  const { mutate: deletePackaging, isPending: isDeleting } = useDeletePackagingOutput();
  const { mutate: updatePackaging, isPending: isUpdating } = useUpdatePackagingOutput();
  const { canDelete, canEdit } = useAuth();
  
  const getCreatedByName = (createdById: number | null | undefined) => {
    if (!createdById) return "-";
    const emp = (employees || []).find((e: any) => e.id === createdById);
    return emp?.fullName || emp?.employeeId || "-";
  };
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingPackaging, setEditingPackaging] = useState<PackagingOutput | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedLotId, setSelectedLotId] = useState<number | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  
  const canDeletePackaging = canDelete('packaging');
  const canEditPackaging = canEdit('packaging');

  const activeSizes = (packagingSizes as PackagingSize[] || []).filter((s: PackagingSize) => s.isActive);
  const activeLots = (lots as Lot[] || []).filter((l: Lot) => l.status === 'active');
  const filteredLots = selectedProductId 
    ? activeLots.filter(l => l.productId === selectedProductId)
    : activeLots;
  
  const getLotDetails = (lotId: number) => {
    const lot = (lots as Lot[] || []).find((l: Lot) => l.id === lotId);
    if (!lot) return "Unknown";
    const product = (products as Product[] || []).find((p: Product) => p.id === lot.productId);
    return `${lot.lotNumber} (${product?.crop} - ${product?.variety || 'Unknown'})`;
  };

  const getLooseStockForLotAndLocation = (lotId: number, locationId: number | null) => {
    const balances = (stockBalances as StockBalance[] || []).filter(
      (b: StockBalance) => b.lotId === lotId && b.stockForm === 'loose' && (locationId ? b.locationId === locationId : true)
    );
    return balances.reduce((sum: number, b: StockBalance) => sum + Number(b.quantity), 0);
  };

  const getLocationName = (locationId: number) => {
    const loc = (locations as Location[] || []).find((l: Location) => l.id === locationId);
    return loc?.name || "Unknown";
  };

  const selectedLotLooseStock = selectedLotId ? getLooseStockForLotAndLocation(selectedLotId, selectedLocationId) : 0;

  const handleDeletePackaging = () => {
    if (deleteId !== null) {
      deletePackaging(deleteId, {
        onSuccess: () => setDeleteId(null)
      });
    }
  };

  const handleEditPackaging = (pkg: PackagingOutput) => {
    setEditingPackaging(pkg);
    editForm.reset({
      lotId: pkg.lotId || undefined,
      packagingSizeId: pkg.packagingSizeId || undefined,
      packetSize: pkg.packetSize,
      numberOfPackets: pkg.numberOfPackets,
      wasteQuantity: Number(pkg.wasteQuantity || 0),
      packedBy: pkg.packedBy || "",
      remarks: pkg.remarks || "",
    });
    setEditOpen(true);
  };

  const getSizeWeightKg = (size: PackagingSize) => {
    const numericSize = Number(size.size);
    return size.unit.toLowerCase() === 'g' ? numericSize / 1000 : numericSize;
  };

  const onEditSubmit = (data: z.infer<typeof packagingFormSchema>) => {
    if (!editingPackaging) return;
    
    const size = activeSizes.find((s: PackagingSize) => s.id === data.packagingSizeId);
    const totalKg = size ? getSizeWeightKg(size) * data.numberOfPackets : 0;
    
    updatePackaging({
      id: editingPackaging.id,
      data: {
        lotId: data.lotId,
        packagingSizeId: data.packagingSizeId,
        packetSize: size?.label || data.packetSize,
        numberOfPackets: data.numberOfPackets,
        totalQuantityKg: String(totalKg),
        wasteQuantity: data.wasteQuantity !== undefined ? String(data.wasteQuantity) : "0",
        packedBy: data.packedBy || null,
        remarks: data.remarks || null,
      }
    }, {
      onSuccess: () => {
        setEditOpen(false);
        setEditingPackaging(null);
        editForm.reset();
      },
    });
  };

  const packagingFormSchema = insertPackagingOutputSchema.extend({
    lotId: z.coerce.number().min(1, "Please select a lot"),
    locationId: z.coerce.number().min(1, "Please select a warehouse"),
    packagingSizeId: z.coerce.number().min(1, "Please select a package size"),
    numberOfPackets: z.coerce.number().positive("Must be at least 1"),
    wasteQuantity: z.coerce.number().optional(),
    packedBy: z.string().optional(),
    remarks: z.string().optional(),
  });

  const form = useForm<z.infer<typeof packagingFormSchema>>({
    resolver: zodResolver(packagingFormSchema),
    defaultValues: {
      packetSize: "",
      numberOfPackets: 0,
      wasteQuantity: 0,
      packedBy: "",
      remarks: "",
    }
  });

  const editForm = useForm<z.infer<typeof packagingFormSchema>>({
    resolver: zodResolver(packagingFormSchema),
  });

  const watchedSizeId = form.watch("packagingSizeId");
  const watchedPackets = form.watch("numberOfPackets");
  
  const selectedSize = activeSizes.find((s: PackagingSize) => s.id === watchedSizeId);
  const estimatedQuantity = selectedSize && watchedPackets 
    ? (getSizeWeightKg(selectedSize) * watchedPackets).toFixed(2) 
    : "0";

  const onSubmit = (data: z.infer<typeof packagingFormSchema>) => {
    const size = activeSizes.find((s: PackagingSize) => s.id === data.packagingSizeId);
    const totalKg = size ? getSizeWeightKg(size) * data.numberOfPackets : 0;
    
    const submitData = {
      lotId: data.lotId,
      locationId: data.locationId,
      packagingSizeId: data.packagingSizeId,
      packetSize: size?.label || data.packetSize,
      numberOfPackets: data.numberOfPackets,
      totalQuantityKg: String(totalKg),
      wasteQuantity: data.wasteQuantity !== undefined ? String(data.wasteQuantity) : "0",
      packedBy: data.packedBy || null,
      remarks: data.remarks || null,
    };
    
    createPackaging(submitData, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
        setSelectedLotId(null);
        setSelectedLocationId(null);
      },
    });
  };

  // Calculate total output for a packaging record
  const calculateOutput = (packetSize: string, numberOfPackets: number) => {
    const sizeMatch = packetSize.match(/(\d+)/);
    if (!sizeMatch) return numberOfPackets;
    const size = parseFloat(sizeMatch[1]);
    const unit = packetSize.toLowerCase().includes('g') && !packetSize.toLowerCase().includes('kg') ? 0.001 : 1;
    return (size * unit * numberOfPackets).toFixed(2);
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold font-display text-primary">Packaging Output</h2>
          <p className="text-muted-foreground">Record finished packaging production</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-packaging">
              <Plus className="mr-2 h-4 w-4" />
              Record Output
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Packaging Output</DialogTitle>
              <DialogDescription>
                Enter details after packaging completion
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Product (Variety) <span className="text-destructive">*</span></label>
                <Combobox
                  options={(products as Product[] || []).map((p: Product) => ({
                    value: p.id.toString(),
                    label: `${p.crop} - ${p.variety}`,
                  }))}
                  value={selectedProductId?.toString()}
                  onValueChange={(val) => {
                    setSelectedProductId(val ? parseInt(val) : null);
                    form.setValue("lotId", 0);
                    setSelectedLotId(null);
                  }}
                  placeholder="Select Product"
                  searchPlaceholder="Search products..."
                  data-testid="select-product"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Lot <span className="text-destructive">*</span></label>
                <Select 
                  onValueChange={(val) => {
                    const lotId = parseInt(val);
                    form.setValue("lotId", lotId);
                    setSelectedLotId(lotId);
                  }}
                  disabled={!selectedProductId}
                >
                  <SelectTrigger data-testid="select-lot">
                    <SelectValue placeholder={selectedProductId ? "Select Lot" : "Select product first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredLots.map((lot: Lot) => (
                      <SelectItem key={lot.id} value={lot.id.toString()}>
                        {lot.lotNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.lotId && <p className="text-xs text-red-500">Required</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Warehouse</label>
                <Select onValueChange={(val) => {
                  const locationId = parseInt(val);
                  form.setValue("locationId", locationId);
                  setSelectedLocationId(locationId);
                }}>
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
                {form.formState.errors.locationId && <p className="text-xs text-red-500">Required</p>}
                {selectedLotId && selectedLocationId && (
                  <p className="text-xs text-muted-foreground">
                    Available raw seeds at {getLocationName(selectedLocationId)}: <span className="font-medium">{selectedLotLooseStock.toFixed(2)} kg</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Package Size</label>
                  <Select onValueChange={(val) => {
                    const sizeId = parseInt(val);
                    form.setValue("packagingSizeId", sizeId);
                    const size = activeSizes.find((s: PackagingSize) => s.id === sizeId);
                    if (size) form.setValue("packetSize", size.label);
                  }}>
                    <SelectTrigger data-testid="select-package-size">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeSizes.map((size: PackagingSize) => (
                        <SelectItem key={size.id} value={size.id.toString()}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.packagingSizeId && <p className="text-xs text-red-500">Required</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantity</label>
                  <Input 
                    type="number" 
                    {...form.register("numberOfPackets")}
                    data-testid="input-number-of-packets"
                  />
                </div>
              </div>

              {parseFloat(estimatedQuantity) > 0 && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    Estimated quantity: <span className="font-bold text-primary">{estimatedQuantity} kg</span>
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Packed By</label>
                  <Input 
                    {...form.register("packedBy")}
                    placeholder="Person name"
                    data-testid="input-packed-by"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Waste/Loss (KG)</label>
                  <Input 
                    type="number" 
                    step="0.01"
                    {...form.register("wasteQuantity")} 
                    placeholder="0"
                    data-testid="input-waste-quantity"
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
                disabled={isPending}
                data-testid="button-submit-packaging"
              >
                {isPending ? "Recording..." : "Record Output"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Boxes className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Entries</p>
                <p className="text-2xl font-bold">{packagingOutputs?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Packets</p>
                <p className="text-2xl font-bold">
                  {packagingOutputs?.reduce((sum, p) => sum + p.numberOfPackets, 0) || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <Package className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Waste</p>
                <p className="text-2xl font-bold">
                  {packagingOutputs?.reduce((sum, p) => sum + Number(p.wasteQuantity || 0), 0).toFixed(2) || 0} kg
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Packaging Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Lot</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Packet Size</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Total (KG)</TableHead>
                <TableHead className="text-right">Waste (KG)</TableHead>
                <TableHead>Created By</TableHead>
                {(canEditPackaging || canDeletePackaging) && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={(canEditPackaging || canDeletePackaging) ? 9 : 8} className="text-center">Loading...</TableCell></TableRow>
              ) : packagingOutputs?.length === 0 ? (
                <TableRow><TableCell colSpan={(canEditPackaging || canDeletePackaging) ? 9 : 8} className="text-center text-muted-foreground py-8">No packaging records found.</TableCell></TableRow>
              ) : (
                packagingOutputs?.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.productionDate ? format(new Date(p.productionDate), 'MMM dd, yyyy') : '-'}</TableCell>
                    <TableCell className="font-medium font-mono text-sm">
                      {p.lotId ? getLotDetails(p.lotId) : (p.batchId ? `Batch #${p.batchId}` : '-')}
                    </TableCell>
                    <TableCell>{p.locationId ? getLocationName(p.locationId) : '-'}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {p.packetSize}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold">{p.numberOfPackets}</TableCell>
                    <TableCell className="text-right text-green-600 font-medium">
                      {p.totalQuantityKg ? Number(p.totalQuantityKg).toFixed(2) : calculateOutput(p.packetSize, p.numberOfPackets)} kg
                    </TableCell>
                    <TableCell className="text-right text-orange-600">
                      {Number(p.wasteQuantity || 0).toFixed(2)} kg
                    </TableCell>
                    <TableCell>{getCreatedByName(p.createdBy)}</TableCell>
                    {(canEditPackaging || canDeletePackaging) && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {canEditPackaging && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEditPackaging(p)}
                              data-testid={`button-edit-packaging-${p.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          )}
                          {canDeletePackaging && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteId(p.id)}
                              data-testid={`button-delete-packaging-${p.id}`}
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
                <AlertDialogTitle>Delete Packaging Record</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this packaging record? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeletePackaging}
                  className="bg-destructive hover:bg-destructive/90"
                  data-testid="button-confirm-delete-packaging"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Packaging Record</DialogTitle>
                <DialogDescription>
                  Update packaging details
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Lot</label>
                  <Select 
                    value={editForm.watch("lotId")?.toString()} 
                    onValueChange={(val) => editForm.setValue("lotId", parseInt(val))}
                  >
                    <SelectTrigger data-testid="select-edit-lot">
                      <SelectValue placeholder="Select Lot" />
                    </SelectTrigger>
                    <SelectContent>
                      {(lots as Lot[] || []).filter((l: Lot) => l.status === 'active').map((lot: Lot) => (
                        <SelectItem key={lot.id} value={lot.id.toString()}>
                          {getLotDetails(lot.id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Package Size</label>
                    <Select 
                      value={editForm.watch("packagingSizeId")?.toString()}
                      onValueChange={(val) => {
                        const sizeId = parseInt(val);
                        editForm.setValue("packagingSizeId", sizeId);
                        const size = activeSizes.find((s: PackagingSize) => s.id === sizeId);
                        if (size) editForm.setValue("packetSize", size.label);
                      }}
                    >
                      <SelectTrigger data-testid="select-edit-packet-size">
                        <SelectValue placeholder="Size" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeSizes.map((size: PackagingSize) => (
                          <SelectItem key={size.id} value={size.id.toString()}>
                            {size.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quantity</label>
                    <Input 
                      type="number" 
                      {...editForm.register("numberOfPackets")}
                      data-testid="input-edit-number-of-packets"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Packed By</label>
                    <Input 
                      {...editForm.register("packedBy")}
                      placeholder="Person name"
                      data-testid="input-edit-packed-by"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Waste/Loss (KG)</label>
                    <Input 
                      type="number" 
                      step="0.01"
                      {...editForm.register("wasteQuantity")} 
                      placeholder="0"
                      data-testid="input-edit-waste-quantity"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isUpdating}
                  data-testid="button-confirm-edit-packaging"
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
