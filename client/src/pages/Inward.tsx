import { useState } from "react";
import { useLots, useCreateLot, useUpdateLot, useDeleteLot, useGenerateLotNumber, useStockBalances, useProducts, useLocations, useSetStockBalance, useOutwardRecords, useOutwardReturns } from "@/hooks/use-inventory";
import { PaginationBar } from "@/components/PaginationBar";
import { useEmployees } from "@/hooks/use-hrms";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Lot, Product, Location, StockBalance, OutwardRecord } from "@shared/schema";
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
import { Plus, Search, PackagePlus, Trash2, RefreshCw, Pencil, Layers, BarChart3, ChevronDown, ChevronUp } from "lucide-react";
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

const stockDistSchema = z.object({
  coldStorageInward: z.coerce.number().min(0).default(0),
  coldStorageOutward: z.coerce.number().min(0).default(0),
  storagePlant: z.coerce.number().min(0).default(0),
  storageOffice: z.coerce.number().min(0).default(0),
});

// ── Stock Distribution Dialog ─────────────────────────────────────────────────
function StockDistributionDialog({
  lot,
  locations,
  stockBalances,
  onSave,
  isSaving,
}: {
  lot: Lot;
  locations: Location[];
  stockBalances: StockBalance[];
  onSave: (vals: z.infer<typeof stockDistSchema>) => void;
  isSaving: boolean;
}) {
  const [open, setOpen] = useState(false);

  const coldStorageIds = locations.filter((l) => (l as any).type === "cold_storage").map((l) => l.id);
  const plantIds = locations.filter((l) => (l as any).type === "storage" && l.name.toLowerCase().includes("plant")).map((l) => l.id);
  const officeIds = locations.filter((l) => (l as any).type === "office").map((l) => l.id);

  const getBalance = (locIds: number[], form: string) =>
    stockBalances
      .filter((b) => b.lotId === lot.id && locIds.includes(b.locationId) && b.stockForm === form)
      .reduce((s, b) => s + Number(b.quantity || 0), 0);

  const form = useForm<z.infer<typeof stockDistSchema>>({
    resolver: zodResolver(stockDistSchema),
    defaultValues: {
      coldStorageInward: getBalance(coldStorageIds, "cs_inward"),
      coldStorageOutward: getBalance(coldStorageIds, "cs_outward"),
      storagePlant: getBalance(plantIds, "loose"),
      storageOffice: getBalance(officeIds, "loose"),
    },
  });

  const handleOpen = (val: boolean) => {
    if (val) {
      form.reset({
        coldStorageInward: getBalance(coldStorageIds, "cs_inward"),
        coldStorageOutward: getBalance(coldStorageIds, "cs_outward"),
        storagePlant: getBalance(plantIds, "loose"),
        storageOffice: getBalance(officeIds, "loose"),
      });
    }
    setOpen(val);
  };

  const handleSubmit = (data: z.infer<typeof stockDistSchema>) => {
    onSave(data);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Edit Stock Distribution" data-testid={`button-stock-dist-${lot.id}`}>
          <Layers className="h-4 w-4 text-blue-600" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Stock Distribution — {lot.lotNumber}</DialogTitle>
          <DialogDescription>Set quantities for each storage location type (kg)</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
          <div className="rounded-lg border border-blue-200 bg-blue-50/60 dark:bg-blue-950/20 dark:border-blue-900 p-3 space-y-3">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Cold Storage</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-green-700 dark:text-green-400">Inward (kg)</label>
                <Input type="number" step="0.01" min="0" {...form.register("coldStorageInward")} data-testid="input-cs-inward" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-red-600 dark:text-red-400">Outward (kg)</label>
                <Input type="number" step="0.01" min="0" {...form.register("coldStorageOutward")} data-testid="input-cs-outward" />
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-orange-200 bg-orange-50/60 dark:bg-orange-950/20 dark:border-orange-900 p-3 space-y-3">
            <p className="text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase tracking-wide">Storage Locations</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-orange-700 dark:text-orange-400">Plant (kg)</label>
                <Input type="number" step="0.01" min="0" {...form.register("storagePlant")} data-testid="input-storage-plant" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-purple-700 dark:text-purple-400">Main Office (kg)</label>
                <Input type="number" step="0.01" min="0" {...form.register("storageOffice")} data-testid="input-storage-office" />
              </div>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isSaving} data-testid="button-save-stock-dist">
            {isSaving ? "Saving..." : "Save Distribution"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Inward() {
  const { data: lots, isLoading } = useLots();
  const { data: stockBalances, isLoading: balancesLoading } = useStockBalances();
  const { data: products } = useProducts();
  const { data: locations } = useLocations();
  const { data: employees } = useEmployees();
  const { mutate: createLot, isPending } = useCreateLot();
  const { mutate: updateLot, isPending: isUpdating } = useUpdateLot();
  const { mutate: deleteLot, isPending: isDeleting } = useDeleteLot();
  const { mutateAsync: generateLotNumber, isPending: isGenerating } = useGenerateLotNumber();
  const { mutate: setStockBalance, isPending: isSavingDist } = useSetStockBalance();
  const { data: outwardRecords } = useOutwardRecords();
  const { data: outwardReturnsData = [] } = useOutwardReturns();
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
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const [generatedLotNumber, setGeneratedLotNumber] = useState("");

  const canDeleteLot = canDelete("lots");
  const canEditLot = canEdit("lots");

  const form = useForm<z.infer<typeof inwardFormSchema>>({
    resolver: zodResolver(inwardFormSchema),
    defaultValues: {
      stockForm: "loose",
      quantityUnit: "kg",
      initialQuantity: 0,
      sourceName: "",
    },
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
    const quantityInKg = data.quantityUnit === "tons" ? data.initialQuantity * 1000 : data.initialQuantity;
    createLot(
      {
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
      },
      {
        onSuccess: () => {
          setOpen(false);
          form.reset();
          setGeneratedLotNumber("");
        },
      }
    );
  };

  const handleDelete = () => {
    if (deleteLotId) {
      deleteLot(deleteLotId, { onSuccess: () => setDeleteLotId(null) });
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
    const quantityInKg = data.quantityUnit === "tons" ? data.initialQuantity * 1000 : data.initialQuantity;
    updateLot(
      {
        id: editingLot.id,
        data: {
          sourceName: data.sourceName || null,
          initialQuantity: String(quantityInKg),
          stockForm: data.stockForm,
          inwardDate: data.inwardDate || null,
          expiryDate: data.expiryDate || null,
          remarks: data.remarks || null,
        },
      },
      {
        onSuccess: () => {
          setOpen(false);
          setEditingLot(null);
          form.reset();
          setGeneratedLotNumber("");
        },
      }
    );
  };

  const getProductDetails = (productId: number) => {
    const product = products?.find((p: Product) => p.id === productId);
    return product ? `${product.crop} - ${product.variety}` : "Unknown";
  };

  const locs = (locations as Location[]) || [];
  const coldStorageIds = locs.filter((l) => (l as any).type === "cold_storage").map((l) => l.id);
  const plantIds = locs.filter((l) => (l as any).type === "storage" && l.name.toLowerCase().includes("plant")).map((l) => l.id);
  const officeIds = locs.filter((l) => (l as any).type === "office").map((l) => l.id);
  const firstCsId = coldStorageIds[0] ?? 0;
  const firstPlantId = plantIds[0] ?? 0;
  const firstOfficeId = officeIds[0] ?? 0;

  const balances = (stockBalances as StockBalance[]) || [];

  const getColBalance = (lotId: number, locIds: number[], form: string) =>
    balances
      .filter((b) => b.lotId === lotId && locIds.includes(b.locationId) && b.stockForm === form)
      .reduce((s, b) => s + Number(b.quantity || 0), 0);

  const getLotDispatched = (lotId: number) => {
    const outward = ((outwardRecords as OutwardRecord[]) || [])
      .filter((r) => r.lotId === lotId)
      .reduce((s, r) => s + Number(r.quantity || 0), 0);
    const returned = ((outwardReturnsData as any[]) || [])
      .filter((r) => r.lotId === lotId)
      .reduce((s: number, r: any) => s + Number(r.quantity || 0), 0);
    return Math.max(0, outward - returned);
  };

  const getLotBalance = (lotId: number, initialQty?: number | string) => {
    const balances = ((stockBalances as StockBalance[]) || []).filter(sb => sb.lotId === lotId);
    if (balances.length > 0) {
      return Math.max(0, balances.reduce((total, b) => {
        const qty = Number(b.quantity);
        if (b.stockForm === 'cs_outward') return total - qty;
        if (b.stockForm === 'packed' && b.packetSize) {
          const s = b.packetSize.toLowerCase().trim();
          if (s.endsWith('kg')) return total + qty * parseFloat(s);
          if (s.endsWith('g')) return total + qty * parseFloat(s) / 1000;
        }
        return total + qty;
      }, 0));
    }
    // Fallback for lots without stock_balances records
    const dispatched = getLotDispatched(lotId);
    return Math.max(0, Number(initialQty || 0) - dispatched);
  };

  const handleSaveDistribution = (lotId: number, vals: z.infer<typeof stockDistSchema>) => {
    const saves = [
      { lotId, locationId: firstCsId || 1, quantity: vals.coldStorageInward, stockForm: "cs_inward" },
      { lotId, locationId: firstCsId || 1, quantity: vals.coldStorageOutward, stockForm: "cs_outward" },
      { lotId, locationId: firstPlantId || 2, quantity: vals.storagePlant, stockForm: "loose" },
      { lotId, locationId: firstOfficeId || 1, quantity: vals.storageOffice, stockForm: "loose" },
    ];
    saves.forEach((s) => {
      if (s.locationId) setStockBalance(s);
    });
  };

  const filteredLots = ((lots as Lot[]) || []).filter((lot: Lot) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const product = ((products as Product[]) || []).find(p => p.id === lot.productId);
    return (
      lot.lotNumber.toLowerCase().includes(q) ||
      product?.crop?.toLowerCase().includes(q) ||
      product?.variety?.toLowerCase().includes(q) ||
      lot.sourceName?.toLowerCase().includes(q)
    );
  });
  const paginatedLots = filteredLots.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display text-primary">Inward / Lots</h2>
          <p className="text-muted-foreground">Record incoming seed stock with auto-generated lot numbers</p>
        </div>

        <Dialog
          open={open}
          onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
              setEditingLot(null);
              form.reset();
              setGeneratedLotNumber("");
            }
          }}
        >
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
                  <Input value={getProductDetails(editingLot.productId)} disabled className="bg-muted" />
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
                      <RefreshCw className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
                    </Button>
                  )}
                </div>
                {!editingLot && <p className="text-xs text-muted-foreground">Format: MA-XX-26-001</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Source / Supplier (Optional)</label>
                <Input {...form.register("sourceName")} placeholder="Enter supplier or source name" data-testid="input-source-name" />
              </div>

              {!editingLot && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Warehouse (Location)</label>
                  <Select onValueChange={(val) => form.setValue("locationId", parseInt(val))}>
                    <SelectTrigger data-testid="select-location">
                      <SelectValue placeholder="Select Warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {locs.map((loc: Location) => (
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
                  <Input type="number" {...form.register("initialQuantity")} placeholder="Enter quantity" data-testid="input-quantity" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Unit</label>
                  <Select defaultValue="kg" onValueChange={(val) => form.setValue("quantityUnit", val)}>
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
                  <Select defaultValue="loose" onValueChange={(val) => form.setValue("stockForm", val)}>
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
                  <Input type="date" {...form.register("inwardDate")} data-testid="input-inward-date" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Expiry Date</label>
                  <Input type="date" {...form.register("expiryDate")} data-testid="input-expiry-date" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Remarks</label>
                <Input {...form.register("remarks")} placeholder="Optional notes" data-testid="input-remarks" />
              </div>

              <Button type="submit" className="w-full" disabled={editingLot ? isUpdating : isPending} data-testid="button-submit-inward">
                {editingLot ? (isUpdating ? "Saving..." : "Save Changes") : isPending ? "Recording..." : "Record Inward"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by lot, crop, variety, organiser..."
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
                  <TableHead className="text-xs whitespace-nowrap">Date</TableHead>
                  <TableHead className="text-xs">Crop</TableHead>
                  <TableHead className="text-xs">Variety</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Lot No.</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Organiser</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Quantity</TableHead>
                  <TableHead className="text-center text-xs bg-blue-50 dark:bg-blue-950/20 text-green-700 dark:text-green-400 whitespace-nowrap">
                    Cold Storage<br />Inward
                  </TableHead>
                  <TableHead className="text-center text-xs bg-blue-50 dark:bg-blue-950/20 text-red-600 dark:text-red-400 whitespace-nowrap">
                    Cold Storage<br />Outward
                  </TableHead>
                  <TableHead className="text-center text-xs bg-cyan-50 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-400 whitespace-nowrap">
                    Cold Storage<br />Remaining
                  </TableHead>
                  <TableHead className="text-center text-xs bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300 whitespace-nowrap">
                    Storage<br />Plant
                  </TableHead>
                  <TableHead className="text-center text-xs bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300 whitespace-nowrap">
                    Storage<br />Main Office
                  </TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Current Stock<br />Balance</TableHead>
                  <TableHead className="text-xs whitespace-nowrap">Plan By</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLots.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={16} className="text-center text-muted-foreground py-8">
                      No lots found. Record your first inward entry above.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLots.map((lot: Lot) => {
                    const product = ((products as Product[]) || []).find(p => p.id === lot.productId);
                    const csIn = getColBalance(lot.id, coldStorageIds, "cs_inward");
                    const csOut = getColBalance(lot.id, coldStorageIds, "cs_outward");
                    const csRem = Math.max(0, csIn - csOut);
                    const plant = getColBalance(lot.id, plantIds, "loose");
                    const office = getColBalance(lot.id, officeIds, "loose");
                    return (
                      <TableRow key={lot.id} data-testid={`row-lot-${lot.id}`}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {lot.inwardDate ? format(new Date(lot.inwardDate), "dd MMM yy") : "-"}
                        </TableCell>
                        <TableCell className="text-xs font-medium">{product?.crop || "-"}</TableCell>
                        <TableCell className="text-xs">
                          <div>{product?.variety || "-"}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {lot.stockForm === "loose" ? "Raw Seeds" : lot.stockForm === "cobs" ? "Cobs" : lot.stockForm}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs font-medium whitespace-nowrap">{lot.lotNumber}</TableCell>
                        <TableCell className="text-xs">{lot.sourceName || <span className="text-muted-foreground">-</span>}</TableCell>
                        <TableCell className="text-xs font-semibold text-green-700 dark:text-green-400 whitespace-nowrap">
                          {Number(lot.initialQuantity).toFixed(0)} {lot.quantityUnit || "kg"}
                        </TableCell>
                        <TableCell className="text-center bg-blue-50/40 dark:bg-blue-950/10">
                          {csIn > 0 ? (
                            <span className="text-green-700 dark:text-green-400 font-medium text-xs">{csIn.toFixed(0)}</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center bg-blue-50/40 dark:bg-blue-950/10">
                          {csOut > 0 ? (
                            <span className="text-red-600 dark:text-red-400 font-medium text-xs">-{csOut.toFixed(0)}</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center bg-cyan-50/40 dark:bg-cyan-950/10">
                          {csRem > 0 ? (
                            <span className="text-cyan-700 dark:text-cyan-400 font-semibold text-xs">{csRem.toFixed(0)}</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center bg-orange-50/40 dark:bg-orange-950/10">
                          {plant > 0 ? (
                            <span className="text-orange-700 dark:text-orange-400 font-medium text-xs">{plant.toFixed(0)}</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center bg-purple-50/40 dark:bg-purple-950/10">
                          {office > 0 ? (
                            <span className="text-purple-700 dark:text-purple-400 font-medium text-xs">{office.toFixed(0)}</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {(() => {
                            const bal = getLotBalance(lot.id, lot.initialQuantity);
                            const dispatched = getLotDispatched(lot.id);
                            return (
                              <div>
                                <span className={`text-xs ${bal < Number(lot.initialQuantity) ? "text-orange-600 dark:text-orange-400" : "text-green-700 dark:text-green-400"}`}>
                                  {bal.toFixed(0)} kg
                                </span>
                                {dispatched > 0 && (
                                  <div className="text-[10px] text-muted-foreground">-{dispatched.toFixed(0)} dispatched</div>
                                )}
                              </div>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="text-xs">{getCreatedByName(lot.createdBy)}</TableCell>
                        <TableCell>
                          <Badge variant={lot.status === "active" ? "default" : "outline"} className="text-xs">{lot.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {canEditLot && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(lot)}
                                  title="Edit Lot"
                                  data-testid={`button-edit-lot-${lot.id}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <StockDistributionDialog
                                  lot={lot}
                                  locations={locs}
                                  stockBalances={balances}
                                  onSave={(vals) => handleSaveDistribution(lot.id, vals)}
                                  isSaving={isSavingDist}
                                />
                              </>
                            )}
                            {canDeleteLot && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteLotId(lot.id)}
                                title="Delete Lot"
                                data-testid={`button-delete-lot-${lot.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
          <PaginationBar page={page} total={filteredLots.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteLotId} onOpenChange={(open) => { if (!open) setDeleteLotId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lot?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this lot and all associated stock records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
