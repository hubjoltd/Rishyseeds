import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useLots, useLocations, useStockMovements, useStockBalances,
  useProducts, useOutwardRecords, useOutwardReturns, useCreateLot,
  useUpdateLot, useDeleteLot
} from "@/hooks/use-inventory";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Warehouse, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import type { Lot, Location, StockMovement, StockBalance, Product } from "@shared/schema";

const STOCK_FORM_OPTIONS = [
  { value: "raw_seed", label: "Raw Seed" },
  { value: "cobs", label: "Cobs" },
  { value: "loose", label: "Loose" },
  { value: "packed", label: "Packed" },
];

const UNIT_OPTIONS = [
  { value: "kg", label: "KG" },
  { value: "tons", label: "Tons" },
  { value: "qtl", label: "Quintal (QTL)" },
];

const formSchema = z.object({
  productId: z.coerce.number().min(1, "Select a product"),
  lotNumber: z.string().min(1, "Lot number is required"),
  sourceName: z.string().optional(),
  locationId: z.coerce.number().min(1, "Select warehouse location"),
  germinationPercentage: z.coerce.number().min(0).max(100).optional().or(z.literal("")),
  initialQuantity: z.coerce.number().positive("Quantity must be positive"),
  quantityUnit: z.string().min(1, "Unit is required"),
  numberOfBags: z.coerce.number().min(0).optional().or(z.literal("")),
  stockForm: z.string().min(1, "Type is required"),
  inwardDate: z.string().min(1, "Date is required"),
  remarks: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const defaultValues: FormValues = {
  productId: 0,
  lotNumber: "",
  sourceName: "",
  locationId: 0,
  germinationPercentage: "",
  initialQuantity: 0,
  quantityUnit: "kg",
  numberOfBags: "",
  stockForm: "raw_seed",
  inwardDate: new Date().toISOString().split("T")[0],
  remarks: "",
};

export default function PurchasedStock() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [editingLot, setEditingLot] = useState<Lot | null>(null);
  const [deletingLot, setDeletingLot] = useState<Lot | null>(null);

  const { data: lots = [] } = useLots() as { data: Lot[] };
  const { data: products = [] } = useProducts() as { data: Product[] };
  const { data: locations = [] } = useLocations() as { data: Location[] };
  const { data: movements = [] } = useStockMovements() as { data: StockMovement[] };
  const { data: stockBalances = [] } = useStockBalances() as { data: StockBalance[] };
  const { data: outwardRecords = [] } = useOutwardRecords();
  const { data: outwardReturnsData = [] } = useOutwardReturns();
  const createLot = useCreateLot();
  const updateLot = useUpdateLot();
  const deleteLot = useDeleteLot();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    (lots as Lot[]).forEach(lot => {
      if (lot.inwardDate) years.add(String(new Date(lot.inwardDate).getFullYear()));
    });
    const arr = Array.from(years).sort((a, b) => Number(b) - Number(a));
    if (!arr.includes(String(currentYear))) arr.unshift(String(currentYear));
    return arr;
  }, [lots, currentYear]);

  const getProduct = (productId: number) => (products as Product[]).find(p => p.id === productId);

  const getLotReturned = (lotId: number): number =>
    ((outwardReturnsData as any[]) || [])
      .filter(r => r.lotId === lotId)
      .reduce((s: number, r: any) => s + Number(r.quantity || 0), 0);

  const getLotBalance = (lotId: number, initialQty: number | string): number => {
    const outward = ((outwardRecords as any[]) || [])
      .filter(r => r.lotId === lotId)
      .reduce((s: number, r: any) => s + Number(r.quantity || 0), 0);
    return Math.max(0, Number(initialQty || 0) - outward + getLotReturned(lotId));
  };

  const productsGrouped = useMemo(() =>
    (products as Product[]).reduce((acc, p) => {
      const key = p.crop || "Other";
      if (!acc[key]) acc[key] = [];
      acc[key].push(p);
      return acc;
    }, {} as Record<string, Product[]>),
    [products]
  );

  const purchasedLots = useMemo(() =>
    (lots as Lot[]).filter(lot => lot.sourceType === "inward"),
    [lots]
  );

  const filteredLots = useMemo(() =>
    purchasedLots.filter(lot => {
      if (!lot.inwardDate) return true;
      return String(new Date(lot.inwardDate).getFullYear()) === selectedYear;
    }),
    [purchasedLots, selectedYear]
  );

  const searched = useMemo(() => {
    if (!search.trim()) return filteredLots;
    const q = search.toLowerCase();
    return filteredLots.filter(lot => {
      const product = getProduct(lot.productId);
      return (
        lot.lotNumber.toLowerCase().includes(q) ||
        product?.crop?.toLowerCase().includes(q) ||
        product?.variety?.toLowerCase().includes(q) ||
        lot.sourceName?.toLowerCase().includes(q) ||
        lot.stockForm?.toLowerCase().includes(q)
      );
    });
  }, [filteredLots, search]);

  const sorted = [...searched].sort((a, b) =>
    new Date(b.inwardDate || b.createdAt).getTime() - new Date(a.inwardDate || a.createdAt).getTime()
  );

  const totalInward = filteredLots.reduce((s, l) => s + Number(l.initialQuantity || 0), 0);
  const totalBags = filteredLots.reduce((s, l) => s + Number((l as any).numberOfBags || 0), 0);

  // Distribution data
  const coldStorageLocations = useMemo(() =>
    (locations as Location[]).filter(l => (l as any).type === "cold_storage"), [locations]);
  const plantLocations = useMemo(() =>
    (locations as Location[]).filter(l => (l as any).type === "storage" && l.name.toLowerCase().includes("plant")), [locations]);
  const officeLocations = useMemo(() =>
    (locations as Location[]).filter(l => (l as any).type === "office"), [locations]);
  const activeColdStorages = useMemo(() => {
    const lotIds = new Set(filteredLots.map(l => l.id));
    return coldStorageLocations.filter(cs =>
      (movements as StockMovement[]).some(m =>
        (m.lotId && lotIds.has(m.lotId)) && (m.toLocationId === cs.id || m.fromLocationId === cs.id)
      )
    );
  }, [filteredLots, coldStorageLocations, movements]);
  const plantLocationIds = plantLocations.map(l => l.id);
  const officeLocationIds = officeLocations.map(l => l.id);
  const getColdStorageInward = (lotId: number, locationId: number) =>
    (movements as StockMovement[]).filter(m => m.lotId === lotId && m.toLocationId === locationId)
      .reduce((sum, m) => sum + Number(m.quantity || 0), 0);
  const getColdStorageOutward = (lotId: number, locationId: number) =>
    (movements as StockMovement[]).filter(m => m.lotId === lotId && m.fromLocationId === locationId)
      .reduce((sum, m) => sum + Number(m.quantity || 0), 0);
  const getLocationBalance = (lotId: number, locationIds: number[]) =>
    (stockBalances as StockBalance[]).filter(sb => sb.lotId === lotId && locationIds.includes(sb.locationId))
      .reduce((sum, sb) => sum + Number(sb.quantity || 0), 0);

  const onSubmit = (values: FormValues) => {
    createLot.mutate({
      lotNumber: values.lotNumber,
      productId: values.productId,
      sourceType: "inward",
      sourceName: values.sourceName || null,
      locationId: values.locationId,
      germinationPercentage: values.germinationPercentage !== "" && values.germinationPercentage != null
        ? String(values.germinationPercentage) : null,
      numberOfBags: values.numberOfBags !== "" && values.numberOfBags != null
        ? Number(values.numberOfBags) : null,
      initialQuantity: String(values.initialQuantity),
      quantityUnit: values.quantityUnit,
      stockForm: values.stockForm,
      inwardDate: values.inwardDate,
      remarks: values.remarks || null,
      status: "active",
    } as any, {
      onSuccess: () => {
        form.reset(defaultValues);
        setOpen(false);
      },
    });
  };

  const onUpdate = (values: FormValues) => {
    if (!editingLot) return;
    updateLot.mutate({ id: editingLot.id, data: {
      productId: values.productId,
      lotNumber: values.lotNumber,
      sourceType: "inward",
      sourceName: values.sourceName || null,
      locationId: values.locationId,
      germinationPercentage: values.germinationPercentage !== "" && values.germinationPercentage != null
        ? String(values.germinationPercentage) : null,
      numberOfBags: values.numberOfBags !== "" && values.numberOfBags != null
        ? Number(values.numberOfBags) : null,
      initialQuantity: String(values.initialQuantity),
      quantityUnit: values.quantityUnit,
      stockForm: values.stockForm,
      inwardDate: values.inwardDate,
      remarks: values.remarks || null,
    } as any }, {
      onSuccess: () => {
        setEditingLot(null);
        form.reset(defaultValues);
      },
    });
  };

  const openEdit = (lot: Lot) => {
    setEditingLot(lot);
    form.reset({
      productId: lot.productId,
      lotNumber: lot.lotNumber,
      sourceName: lot.sourceName || "",
      locationId: lot.locationId || 0,
      germinationPercentage: (lot as any).germinationPercentage ?? "",
      initialQuantity: Number(lot.initialQuantity),
      quantityUnit: lot.quantityUnit || "kg",
      numberOfBags: (lot as any).numberOfBags ?? "",
      stockForm: lot.stockForm || "raw_seed",
      inwardDate: lot.inwardDate || new Date().toISOString().split("T")[0],
      remarks: lot.remarks || "",
    });
  };

  const formatDate = (d: string | null | undefined) => {
    if (!d) return "-";
    try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
    catch { return d; }
  };

  const getStockFormLabel = (v: string) => STOCK_FORM_OPTIONS.find(o => o.value === v)?.label || v;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Warehouse className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Purchased Stock</h1>
            <p className="text-sm text-muted-foreground">Inward purchased stock records</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-28" data-testid="select-year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button
            data-testid="btn-add-purchased-stock"
            onClick={() => { form.reset(defaultValues); setOpen(true); }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Purchased Stock
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Lots</p>
          <p className="text-2xl font-bold text-primary">{filteredLots.length}</p>
          <p className="text-xs text-muted-foreground">{selectedYear}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Inward</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">{totalInward.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground">KG</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Bags</p>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{totalBags}</p>
          <p className="text-xs text-muted-foreground">Bags</p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-lg px-4 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Closing Balance</p>
          <p className="text-2xl font-bold text-rose-700 dark:text-rose-400">
            {filteredLots.reduce((s, l) => s + getLotBalance(l.id, l.initialQuantity), 0).toFixed(0)}
          </p>
          <p className="text-xs text-muted-foreground">KG</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          data-testid="input-search-stock"
          placeholder="Search crop, variety, type, lot..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Main Table — matches handwritten format */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap">Date</th>
              <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground">Crop</th>
              <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground">Variety</th>
              <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground">Type</th>
              <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground">Lots</th>
              <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap">Organiser Name</th>
              <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap">Germination %</th>
              <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap">Total Qty (KGs/Tons)</th>
              <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wide text-muted-foreground">Bags</th>
              <th className="px-3 py-2.5 text-right font-semibold text-xs uppercase tracking-wide text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Warehouse className="h-8 w-8 opacity-30" />
                    <p className="text-sm">
                      {search
                        ? "No records match your search."
                        : `No purchased stock for ${selectedYear}. Click "Add Purchased Stock" to record.`}
                    </p>
                  </div>
                </td>
              </tr>
            ) : sorted.map((lot, idx) => {
              const product = getProduct(lot.productId);
              const germPct = (lot as any).germinationPercentage;
              const bags = (lot as any).numberOfBags;
              return (
                <tr
                  key={lot.id}
                  data-testid={`row-purchased-stock-${lot.id}`}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(lot.inwardDate)}
                  </td>
                  <td className="px-3 py-2.5 font-medium text-xs text-foreground">
                    {product?.crop || "-"}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-foreground">
                    {product?.variety || "-"}
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge variant="secondary" className="text-xs whitespace-nowrap">
                      {getStockFormLabel(lot.stockForm)}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-xs text-foreground font-medium">{lot.lotNumber}</span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-foreground">
                    {lot.sourceName || <span className="text-muted-foreground">-</span>}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {germPct != null && germPct !== "" ? (
                      <Badge variant="outline" className="text-xs font-medium">
                        {Number(germPct).toFixed(0)}%
                      </Badge>
                    ) : <span className="text-muted-foreground text-xs">-</span>}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="font-semibold text-green-700 dark:text-green-400 text-xs">
                      {Number(lot.initialQuantity).toFixed(0)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      {(lot.quantityUnit || "kg").toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center text-xs text-foreground">
                    {bags != null && bags !== 0
                      ? <span className="font-medium">{bags}</span>
                      : <span className="text-muted-foreground">-</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <button
                      onClick={() => openEdit(lot)}
                      data-testid={`btn-edit-purchased-${lot.id}`}
                      className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors mr-1"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingLot(lot)}
                      data-testid={`btn-delete-purchased-${lot.id}`}
                      className="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {sorted.length > 0 && (
            <tfoot>
              <tr className="bg-muted/40 border-t-2 border-border font-semibold text-xs">
                <td colSpan={7} className="px-3 py-2 text-muted-foreground uppercase tracking-wide">
                  {sorted.length} record{sorted.length !== 1 ? "s" : ""}{search ? " (filtered)" : ""}
                </td>
                <td className="px-3 py-2 text-center text-muted-foreground">—</td>
                <td className="px-3 py-2 text-center text-green-700 dark:text-green-400">
                  {sorted.reduce((s, l) => s + Number(l.initialQuantity || 0), 0).toFixed(0)} KG
                </td>
                <td className="px-3 py-2 text-center text-amber-700 dark:text-amber-300">
                  {sorted.reduce((s, l) => s + Number((l as any).numberOfBags || 0), 0)} bags
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>


      {/* Add Purchased Stock Dialog */}
      <Dialog open={open} onOpenChange={v => { if (!v) { setOpen(false); form.reset(defaultValues); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5 text-primary" />
              Add Purchased Stock
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Product */}
                <FormField control={form.control} name="productId" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Product — Crop / Variety <span className="text-destructive">*</span></FormLabel>
                    <Select value={field.value ? String(field.value) : ""} onValueChange={v => field.onChange(Number(v))}>
                      <FormControl>
                        <SelectTrigger data-testid="select-product">
                          <SelectValue placeholder="Select crop / variety..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(productsGrouped).map(([crop, prods]) => (
                          <div key={crop}>
                            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted/50">{crop}</div>
                            {prods.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.variety}</SelectItem>)}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Type */}
                <FormField control={form.control} name="stockForm" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type <span className="text-destructive">*</span></FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-stock-form">
                          <SelectValue placeholder="Select type..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STOCK_FORM_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Lot Number */}
                <FormField control={form.control} name="lotNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lot Number <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input data-testid="input-lot-number" placeholder="e.g. MAIZE-HYB-20260314-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Organiser Name */}
                <FormField control={form.control} name="sourceName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organiser Name</FormLabel>
                    <FormControl>
                      <Input data-testid="input-source-name" placeholder="Supplier / organiser name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Warehouse Location */}
                <FormField control={form.control} name="locationId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warehouse Location <span className="text-destructive">*</span></FormLabel>
                    <Select value={field.value ? String(field.value) : ""} onValueChange={v => field.onChange(Number(v))}>
                      <FormControl>
                        <SelectTrigger data-testid="select-location">
                          <SelectValue placeholder="Select warehouse..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(locations as Location[]).map(l => <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Germination % */}
                <FormField control={form.control} name="germinationPercentage" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Germination Percentage (%)</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-germination"
                        type="number" min="0" max="100" step="0.1"
                        placeholder="e.g. 85"
                        value={field.value ?? ""}
                        onChange={e => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Quantity */}
                <FormField control={form.control} name="initialQuantity" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Quantity <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input data-testid="input-quantity" type="number" min="0" step="0.01" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Unit */}
                <FormField control={form.control} name="quantityUnit" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit <span className="text-destructive">*</span></FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-unit">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UNIT_OPTIONS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Bags */}
                <FormField control={form.control} name="numberOfBags" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Bags</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-bags"
                        type="number" min="0" step="1"
                        placeholder="e.g. 50"
                        value={field.value ?? ""}
                        onChange={e => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Inward Date */}
                <FormField control={form.control} name="inwardDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input data-testid="input-inward-date" type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Remarks */}
              <FormField control={form.control} name="remarks" render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Textarea data-testid="textarea-remarks" placeholder="Additional notes..." rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  data-testid="btn-submit-purchased-stock"
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={createLot.isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {createLot.isPending ? "Saving..." : "Add Purchased Stock"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingLot} onOpenChange={v => { if (!v) { setEditingLot(null); form.reset(defaultValues); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              Edit Purchased Stock
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onUpdate)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="productId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={v => field.onChange(Number(v))} value={field.value ? String(field.value) : ""}>
                      <FormControl>
                        <SelectTrigger data-testid="edit-select-product"><SelectValue placeholder="Select product" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(productsGrouped).map(([crop, prods]) => (
                          <div key={crop}>
                            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">{crop}</div>
                            {prods.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.variety}</SelectItem>)}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="stockForm" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Form <span className="text-destructive">*</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="edit-select-stock-form"><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STOCK_FORM_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="lotNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lot Number <span className="text-destructive">*</span></FormLabel>
                    <FormControl><Input data-testid="edit-input-lot-number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="sourceName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organiser Name</FormLabel>
                    <FormControl><Input data-testid="edit-input-source-name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="initialQuantity" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity <span className="text-destructive">*</span></FormLabel>
                    <FormControl><Input data-testid="edit-input-quantity" type="number" min={0} step="0.01" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="quantityUnit" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="edit-select-unit"><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="kg">KG</SelectItem>
                        <SelectItem value="ton">Ton</SelectItem>
                        <SelectItem value="quintal">Quintal</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="germinationPercentage" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Germination %</FormLabel>
                    <FormControl><Input data-testid="edit-input-germination" type="number" min={0} max={100} step="0.1" placeholder="e.g. 92" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="numberOfBags" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Bags</FormLabel>
                    <FormControl><Input data-testid="edit-input-bags" type="number" min={0} placeholder="e.g. 50" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="inwardDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date <span className="text-destructive">*</span></FormLabel>
                    <FormControl><Input data-testid="edit-input-inward-date" type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="remarks" render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl><Textarea data-testid="edit-textarea-remarks" placeholder="Additional notes..." rows={2} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={() => { setEditingLot(null); form.reset(defaultValues); }}>
                  Cancel
                </Button>
                <Button
                  data-testid="btn-save-edit-purchased"
                  type="submit"
                  className="flex-1"
                  disabled={updateLot.isPending}
                >
                  {updateLot.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingLot} onOpenChange={v => { if (!v) setDeletingLot(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchased Stock?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete lot <strong>{deletingLot?.lotNumber}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="btn-cancel-delete-purchased">Cancel</AlertDialogCancel>
            <AlertDialogAction
              data-testid="btn-confirm-delete-purchased"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deletingLot) return;
                deleteLot.mutate(deletingLot.id, { onSuccess: () => setDeletingLot(null) });
              }}
            >
              {deleteLot.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
