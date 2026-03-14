import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLots, useLocations, useStockMovements, useStockBalances, useProducts, useOutwardRecords, useOutwardReturns, useCreateLot } from "@/hooks/use-inventory";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Warehouse, Plus, Search, TrendingUp, Package, ChevronDown, ChevronUp } from "lucide-react";
import type { Lot, Location, StockMovement, StockBalance, Product } from "@shared/schema";

const STOCK_FORM_OPTIONS = [
  { value: "raw_seed", label: "Raw Seed" },
  { value: "cobs", label: "Cobs" },
  { value: "loose", label: "Loose" },
  { value: "packed", label: "Packed" },
];

const UNIT_OPTIONS = [
  { value: "kg", label: "KG" },
  { value: "qtl", label: "Quintal (QTL)" },
  { value: "mt", label: "Metric Ton (MT)" },
  { value: "bags", label: "Bags" },
];

const formSchema = z.object({
  productId: z.coerce.number().min(1, "Select a product"),
  lotNumber: z.string().min(1, "Lot number is required"),
  sourceName: z.string().optional(),
  locationId: z.coerce.number().min(1, "Select warehouse location"),
  germinationPercentage: z.coerce.number().min(0).max(100).optional(),
  initialQuantity: z.coerce.number().positive("Quantity must be positive"),
  quantityUnit: z.string().min(1, "Unit is required"),
  stockForm: z.string().min(1, "Stock form is required"),
  inwardDate: z.string().min(1, "Inward date is required"),
  remarks: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const defaultValues: FormValues = {
  productId: 0,
  lotNumber: "",
  sourceName: "",
  locationId: 0,
  germinationPercentage: undefined,
  initialQuantity: 0,
  quantityUnit: "kg",
  stockForm: "raw_seed",
  inwardDate: new Date().toISOString().split("T")[0],
  remarks: "",
};

export default function PurchasedStock() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showDistribution, setShowDistribution] = useState(false);

  const { data: lots = [] } = useLots() as { data: Lot[] };
  const { data: products = [] } = useProducts() as { data: Product[] };
  const { data: locations = [] } = useLocations() as { data: Location[] };
  const { data: movements = [] } = useStockMovements() as { data: StockMovement[] };
  const { data: stockBalances = [] } = useStockBalances() as { data: StockBalance[] };
  const { data: outwardRecords = [] } = useOutwardRecords();
  const { data: outwardReturnsData = [] } = useOutwardReturns();
  const createLot = useCreateLot();

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
  const getLocation = (id: number) => (locations as Location[]).find(l => l.id === id);

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

  const getLotInitialLocation = (lotId: number): Location | undefined => {
    const bal = (stockBalances as StockBalance[]).find(sb => sb.lotId === lotId);
    return bal ? getLocation(bal.locationId) : undefined;
  };

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
        lot.remarks?.toLowerCase().includes(q)
      );
    });
  }, [filteredLots, search]);

  const sorted = [...searched].sort((a, b) =>
    new Date(b.inwardDate || b.createdAt).getTime() - new Date(a.inwardDate || a.createdAt).getTime()
  );

  const totalInward = filteredLots.reduce((s, l) => s + Number(l.initialQuantity || 0), 0);

  const productsGrouped = useMemo(() => {
    return (products as Product[]).reduce((acc, p) => {
      const key = p.crop || "Other";
      if (!acc[key]) acc[key] = [];
      acc[key].push(p);
      return acc;
    }, {} as Record<string, Product[]>);
  }, [products]);

  const coldStorageLocations = useMemo(() =>
    (locations as Location[]).filter(l => (l as any).type === "cold_storage"),
    [locations]
  );

  const plantLocations = useMemo(() =>
    (locations as Location[]).filter(l => (l as any).type === "storage" && l.name.toLowerCase().includes("plant")),
    [locations]
  );

  const officeLocations = useMemo(() =>
    (locations as Location[]).filter(l => (l as any).type === "office"),
    [locations]
  );

  const activeColdStorages = useMemo(() => {
    const lotIds = new Set(filteredLots.map(l => l.id));
    return coldStorageLocations.filter(cs =>
      (movements as StockMovement[]).some(m =>
        (m.lotId && lotIds.has(m.lotId)) &&
        (m.toLocationId === cs.id || m.fromLocationId === cs.id)
      )
    );
  }, [filteredLots, coldStorageLocations, movements]);

  const plantLocationIds = plantLocations.map(l => l.id);
  const officeLocationIds = officeLocations.map(l => l.id);

  const getColdStorageInward = (lotId: number, locationId: number) =>
    (movements as StockMovement[])
      .filter(m => m.lotId === lotId && m.toLocationId === locationId)
      .reduce((sum, m) => sum + Number(m.quantity || 0), 0);

  const getColdStorageOutward = (lotId: number, locationId: number) =>
    (movements as StockMovement[])
      .filter(m => m.lotId === lotId && m.fromLocationId === locationId)
      .reduce((sum, m) => sum + Number(m.quantity || 0), 0);

  const getLocationBalance = (lotId: number, locationIds: number[]) =>
    (stockBalances as StockBalance[])
      .filter(sb => sb.lotId === lotId && locationIds.includes(sb.locationId))
      .reduce((sum, sb) => sum + Number(sb.quantity || 0), 0);

  const onSubmit = (values: FormValues) => {
    createLot.mutate({
      lotNumber: values.lotNumber,
      productId: values.productId,
      sourceType: "inward",
      sourceName: values.sourceName || null,
      locationId: values.locationId,
      germinationPercentage: values.germinationPercentage != null ? String(values.germinationPercentage) : null,
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

  const formatDate = (d: string | null | undefined) => {
    if (!d) return "-";
    try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
    catch { return d; }
  };

  const getStockFormLabel = (v: string) => STOCK_FORM_OPTIONS.find(o => o.value === v)?.label || v;

  return (
    <div className="p-6 space-y-5">
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
              {availableYears.map(y => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
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
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Cold Storages</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{activeColdStorages.length}</p>
          <p className="text-xs text-muted-foreground">Active this year</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Closing Balance</p>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">
            {filteredLots.reduce((s, l) => s + getLotBalance(l.id, l.initialQuantity), 0).toFixed(0)}
          </p>
          <p className="text-xs text-muted-foreground">KG</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            data-testid="input-search-stock"
            placeholder="Search lot, crop, variety, supplier..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground">#</th>
              <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground">Lot No</th>
              <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground">Crop / Variety</th>
              <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground">Source / Supplier</th>
              <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground">Warehouse</th>
              <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wide text-muted-foreground">Germ %</th>
              <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wide text-muted-foreground">Quantity</th>
              <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wide text-muted-foreground">Stock Form</th>
              <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wide text-muted-foreground">Inward Date</th>
              <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wide text-muted-foreground">Closing Balance</th>
              <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-10 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Warehouse className="h-8 w-8 opacity-30" />
                    <p className="text-sm">{search ? "No records match your search." : `No purchased stock for ${selectedYear}. Click "Add Purchased Stock" to record.`}</p>
                  </div>
                </td>
              </tr>
            ) : sorted.map((lot, idx) => {
              const product = getProduct(lot.productId);
              const initLoc = getLotInitialLocation(lot.id);
              const balance = getLotBalance(lot.id, lot.initialQuantity);
              const germPct = (lot as any).germinationPercentage;
              return (
                <tr
                  key={lot.id}
                  data-testid={`row-purchased-stock-${lot.id}`}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-3 py-2.5 text-muted-foreground text-xs">{idx + 1}</td>
                  <td className="px-3 py-2.5">
                    <span className="font-mono font-medium text-xs text-foreground">{lot.lotNumber}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    {product ? (
                      <div>
                        <div className="font-medium text-xs text-foreground">{product.crop}</div>
                        <div className="text-xs text-muted-foreground">{product.variety}</div>
                      </div>
                    ) : <span className="text-muted-foreground text-xs">-</span>}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-foreground">{lot.sourceName || <span className="text-muted-foreground">-</span>}</td>
                  <td className="px-3 py-2.5 text-xs text-foreground max-w-[130px] truncate" title={initLoc?.name}>
                    {initLoc?.name || <span className="text-muted-foreground">-</span>}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {germPct != null && germPct !== "" ? (
                      <Badge variant="outline" className="text-xs font-medium">{Number(germPct).toFixed(0)}%</Badge>
                    ) : <span className="text-muted-foreground text-xs">-</span>}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className="font-semibold text-green-700 dark:text-green-400 text-xs">
                      {Number(lot.initialQuantity).toFixed(0)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">{(lot.quantityUnit || "kg").toUpperCase()}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Badge variant="secondary" className="text-xs">{getStockFormLabel(lot.stockForm)}</Badge>
                  </td>
                  <td className="px-3 py-2.5 text-center text-xs text-muted-foreground whitespace-nowrap">{formatDate(lot.inwardDate)}</td>
                  <td className="px-3 py-2.5 text-center">
                    <Badge className={`text-xs font-semibold ${balance > 0 ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200"}`}>
                      {balance.toFixed(0)} KG
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground max-w-[150px]">
                    <span className="line-clamp-2">{lot.remarks || "-"}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {sorted.length > 0 && (
            <tfoot>
              <tr className="bg-muted/40 border-t-2 border-border font-semibold text-xs">
                <td colSpan={6} className="px-3 py-2 text-muted-foreground uppercase tracking-wide">
                  {sorted.length} record{sorted.length !== 1 ? "s" : ""}{search ? " (filtered)" : ""}
                </td>
                <td className="px-3 py-2 text-center text-green-700 dark:text-green-400">
                  {sorted.reduce((s, l) => s + Number(l.initialQuantity || 0), 0).toFixed(0)} KG
                </td>
                <td colSpan={2} />
                <td className="px-3 py-2 text-center text-amber-700 dark:text-amber-300">
                  {sorted.reduce((s, l) => s + getLotBalance(l.id, l.initialQuantity), 0).toFixed(0)} KG
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Storage Distribution (collapsible) */}
      {filteredLots.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-sm font-semibold"
            onClick={() => setShowDistribution(v => !v)}
            data-testid="btn-toggle-distribution"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              Storage Distribution — Cold Storage / Plant / Office
            </div>
            {showDistribution ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showDistribution && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="border border-border px-3 py-2 text-left font-semibold text-xs uppercase tracking-wide" rowSpan={2}>Crop</th>
                    <th className="border border-border px-3 py-2 text-left font-semibold text-xs uppercase tracking-wide" rowSpan={2}>Variety</th>
                    <th className="border border-border px-3 py-2 text-left font-semibold text-xs uppercase tracking-wide" rowSpan={2}>Organiser</th>
                    <th className="border border-border px-3 py-2 text-center font-semibold text-xs uppercase tracking-wide" rowSpan={2}>Inward (KG)</th>
                    {activeColdStorages.length > 0 && (
                      <th className="border border-border px-3 py-2 text-center font-semibold text-xs uppercase tracking-wide bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300" colSpan={activeColdStorages.length * 3}>
                        Cold Storage
                      </th>
                    )}
                    {plantLocations.length > 0 && <th className="border border-border px-3 py-2 text-center font-semibold text-xs uppercase tracking-wide bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300" rowSpan={2}>Plant</th>}
                    {officeLocations.length > 0 && <th className="border border-border px-3 py-2 text-center font-semibold text-xs uppercase tracking-wide bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300" rowSpan={2}>Office</th>}
                    <th className="border border-border px-3 py-2 text-center font-semibold text-xs uppercase tracking-wide bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300" rowSpan={2}>Closing Balance</th>
                  </tr>
                  {activeColdStorages.length > 0 && (
                    <tr className="bg-muted/30">
                      {activeColdStorages.map(cs => (
                        <>
                          <th key={`cs-in-${cs.id}`} className="border border-border px-2 py-1.5 text-center text-xs bg-blue-50/60 dark:bg-blue-950/20">
                            <div className="text-[10px] text-blue-600 dark:text-blue-400 truncate max-w-[80px]">{cs.name.length > 12 ? cs.name.slice(0, 12) + "..." : cs.name}</div>
                            <div className="text-green-600 font-semibold">In</div>
                          </th>
                          <th key={`cs-out-${cs.id}`} className="border border-border px-2 py-1.5 text-center text-xs bg-blue-50/60 dark:bg-blue-950/20">
                            <div className="text-[10px] text-blue-600 dark:text-blue-400 truncate max-w-[80px]">{cs.name.length > 12 ? cs.name.slice(0, 12) + "..." : cs.name}</div>
                            <div className="text-red-600 font-semibold">Out</div>
                          </th>
                          <th key={`cs-rem-${cs.id}`} className="border border-border px-2 py-1.5 text-center text-xs bg-cyan-50/60 dark:bg-cyan-950/20">
                            <div className="text-[10px] text-cyan-600 dark:text-cyan-400 truncate max-w-[80px]">{cs.name.length > 12 ? cs.name.slice(0, 12) + "..." : cs.name}</div>
                            <div className="text-cyan-700 font-semibold">Rem.</div>
                          </th>
                        </>
                      ))}
                    </tr>
                  )}
                </thead>
                <tbody>
                  {filteredLots.map(lot => {
                    const product = getProduct(lot.productId);
                    const plantBal = getLocationBalance(lot.id, plantLocationIds);
                    const officeBal = getLocationBalance(lot.id, officeLocationIds);
                    return (
                      <tr key={lot.id} className="hover:bg-muted/30 transition-colors">
                        <td className="border border-border px-3 py-2 font-medium text-xs">{product?.crop || "-"}</td>
                        <td className="border border-border px-3 py-2 text-xs">
                          <div>{product?.variety || "-"}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{lot.lotNumber}</div>
                        </td>
                        <td className="border border-border px-3 py-2 text-xs">{lot.sourceName || <span className="text-muted-foreground">-</span>}</td>
                        <td className="border border-border px-3 py-2 text-center text-xs font-semibold text-green-700 dark:text-green-400">
                          {Number(lot.initialQuantity).toFixed(0)} KG
                        </td>
                        {activeColdStorages.map(cs => {
                          const inward = getColdStorageInward(lot.id, cs.id);
                          const outward = getColdStorageOutward(lot.id, cs.id);
                          const remaining = Math.max(0, inward - outward);
                          return (
                            <>
                              <td key={`ci-${lot.id}-${cs.id}`} className="border border-border px-2 py-2 text-center text-xs bg-blue-50/30 dark:bg-blue-950/10">
                                {inward > 0 ? <span className="text-green-700 dark:text-green-400 font-medium">{inward.toFixed(0)}</span> : <span className="text-muted-foreground">-</span>}
                              </td>
                              <td key={`co-${lot.id}-${cs.id}`} className="border border-border px-2 py-2 text-center text-xs bg-blue-50/30 dark:bg-blue-950/10">
                                {outward > 0 ? <span className="text-red-600 dark:text-red-400 font-medium">-{outward.toFixed(0)}</span> : <span className="text-muted-foreground">-</span>}
                              </td>
                              <td key={`cr-${lot.id}-${cs.id}`} className="border border-border px-2 py-2 text-center text-xs bg-cyan-50/30 dark:bg-cyan-950/10">
                                {remaining > 0 ? <span className="text-cyan-700 dark:text-cyan-400 font-semibold">{remaining.toFixed(0)}</span> : <span className="text-muted-foreground">-</span>}
                              </td>
                            </>
                          );
                        })}
                        {plantLocations.length > 0 && (
                          <td className="border border-border px-2 py-2 text-center text-xs bg-orange-50/30 dark:bg-orange-950/10">
                            {plantBal > 0 ? <span className="text-orange-700 dark:text-orange-400 font-medium">{plantBal.toFixed(0)}</span> : <span className="text-muted-foreground">-</span>}
                          </td>
                        )}
                        {officeLocations.length > 0 && (
                          <td className="border border-border px-2 py-2 text-center text-xs bg-purple-50/30 dark:bg-purple-950/10">
                            {officeBal > 0 ? <span className="text-purple-700 dark:text-purple-400 font-medium">{officeBal.toFixed(0)}</span> : <span className="text-muted-foreground">-</span>}
                          </td>
                        )}
                        <td className="border border-border px-3 py-2 text-center text-xs font-semibold text-rose-700 dark:text-rose-400">
                          {getLotBalance(lot.id, lot.initialQuantity).toFixed(0)} KG
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Purchased Stock Dialog */}
      <Dialog open={open} onOpenChange={v => { if (!v) { setOpen(false); form.reset(defaultValues); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Add Purchased Stock
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Product (Crop / Variety) <span className="text-destructive">*</span></FormLabel>
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
                              {prods.map(p => (
                                <SelectItem key={p.id} value={String(p.id)}>{p.variety}</SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lotNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lot Number <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input data-testid="input-lot-number" placeholder="e.g. MAIZE-HYB-20260314-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sourceName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source / Supplier</FormLabel>
                      <FormControl>
                        <Input data-testid="input-source-name" placeholder="Supplier / party name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="locationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Warehouse Location <span className="text-destructive">*</span></FormLabel>
                      <Select value={field.value ? String(field.value) : ""} onValueChange={v => field.onChange(Number(v))}>
                        <FormControl>
                          <SelectTrigger data-testid="select-location">
                            <SelectValue placeholder="Select warehouse..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(locations as Location[]).map(l => (
                            <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="germinationPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Germination Percentage (%)</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-germination"
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          placeholder="e.g. 85"
                          {...field}
                          value={field.value ?? ""}
                          onChange={e => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="initialQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input data-testid="input-quantity" type="number" min="0" step="0.01" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantityUnit"
                  render={({ field }) => (
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
                  )}
                />

                <FormField
                  control={form.control}
                  name="stockForm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Form <span className="text-destructive">*</span></FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-stock-form">
                            <SelectValue placeholder="Select stock form..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STOCK_FORM_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="inwardDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inward Date <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input data-testid="input-inward-date" type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Textarea data-testid="textarea-remarks" placeholder="Additional notes..." rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancel</Button>
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
    </div>
  );
}
