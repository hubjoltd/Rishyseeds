import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lot, Product, Location } from "@shared/schema";
import { useLots, useProducts, useDeleteOutwardReturn, useOutwardReturns, useCreateOutwardReturn, useLocations } from "@/hooks/use-inventory";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RotateCcw, Trash2, PlusCircle, PackageOpen } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STATE_OPTIONS = [
  { value: "AP", label: "Andhra Pradesh (AP)" },
  { value: "TS", label: "Telangana (TS)" },
  { value: "UP", label: "Uttar Pradesh (UP)" },
  { value: "MP", label: "Madhya Pradesh (MP)" },
  { value: "GJ", label: "Gujarat (GJ)" },
  { value: "KA", label: "Karnataka (KA)" },
  { value: "OD", label: "Odisha (OD)" },
  { value: "CG", label: "Chhattisgarh (CG)" },
  { value: "MH", label: "Maharashtra (MH)" },
  { value: "RJ", label: "Rajasthan (RJ)" },
  { value: "HR", label: "Haryana (HR)" },
  { value: "PB", label: "Punjab (PB)" },
  { value: "OTHER", label: "Other" },
];


const STOCK_FORM_OPTIONS = [
  { value: "raw_seed", label: "Raw Seed" },
  { value: "codes", label: "Codes" },
  { value: "packed", label: "Packed" },
];

const UNIT_OPTIONS = [
  { value: "KG", label: "KG" },
  { value: "QTL", label: "Quintal (QTL)" },
  { value: "MT", label: "Metric Ton (MT)" },
  { value: "bags", label: "Bags" },
];

const formSchema = z.object({
  lotId: z.coerce.number().min(1, "Select a lot"),
  partyName: z.string().min(1, "Party name is required"),
  stateName: z.string().min(1, "State is required"),
  location: z.string().min(1, "Location is required"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  unit: z.string().min(1, "Unit is required"),
  stockForm: z.string().min(1, "Stock form is required"),
  inwardDate: z.string().min(1, "Inward date is required"),
  expiryDate: z.string().optional(),
  reason: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function OutwardReturns() {
  const { data: returns = [], isLoading } = useOutwardReturns();
  const { data: lots = [] } = useLots() as { data: Lot[] };
  const { data: products = [] } = useProducts() as { data: Product[] };
  const { data: locations = [] } = useLocations() as { data: Location[] };
  const createReturn = useCreateOutwardReturn();
  const deleteReturn = useDeleteOutwardReturn();

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedLotId, setSelectedLotId] = useState<number | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      lotId: 0,
      partyName: "",
      stateName: "",
      location: "",
      quantity: 0,
      unit: "KG",
      stockForm: "",
      inwardDate: new Date().toISOString().split("T")[0],
      expiryDate: "",
      reason: "",
    },
  });

  const getLot = (lotId: number) => (lots as Lot[]).find(l => l.id === lotId);
  const getProduct = (productId: number) => (products as Product[]).find(p => p.id === productId);

  const selectedLot = selectedLotId ? getLot(selectedLotId) : null;
  const selectedProduct = selectedLot ? getProduct(selectedLot.productId) : null;

  const lotsGrouped = (lots as Lot[]).reduce((acc, lot) => {
    const product = getProduct(lot.productId);
    const key = product ? `${product.crop} - ${product.variety}` : `Product #${lot.productId}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(lot);
    return acc;
  }, {} as Record<string, Lot[]>);

  const onSubmit = (values: FormValues) => {
    createReturn.mutate({
      lotId: values.lotId,
      partyName: values.partyName,
      stateName: values.stateName,
      location: values.location,
      quantity: String(values.quantity),
      unit: values.unit,
      stockForm: values.stockForm,
      inwardDate: values.inwardDate,
      expiryDate: values.expiryDate || null,
      reason: values.reason || null,
      returnDate: values.inwardDate,
    } as any, {
      onSuccess: () => {
        form.reset({
          lotId: 0,
          partyName: "",
          stateName: "",
          location: "",
          quantity: 0,
          unit: "KG",
          stockForm: "",
          inwardDate: new Date().toISOString().split("T")[0],
          expiryDate: "",
          reason: "",
        });
        setSelectedLotId(null);
      },
    });
  };

  const formatDate = (d: string) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  const getStockFormLabel = (v: string) => STOCK_FORM_OPTIONS.find(o => o.value === v)?.label || v;
  const getStateLabel = (v: string) => STATE_OPTIONS.find(o => o.value === v)?.label || v;
  const getLocationLabel = (v: string) => {
    const loc = (locations as Location[]).find(l => String(l.id) === v);
    return loc?.name || v;
  };

  const totalReturned = (returns as any[]).reduce((s: number, r: any) => s + Number(r.quantity || 0), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
          <RotateCcw className="h-6 w-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Return Stock</h1>
          <p className="text-sm text-muted-foreground">Record stock returned from parties and dealers</p>
        </div>
      </div>

      <Card className="border-amber-200 dark:border-amber-800/50">
        <CardHeader className="pb-4 border-b border-border">
          <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <PlusCircle className="h-4 w-4" />
            New Return Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="lotId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product (Crop / Variety) &amp; Lot No <span className="text-destructive">*</span></FormLabel>
                      <Select
                        value={field.value ? String(field.value) : ""}
                        onValueChange={val => {
                          field.onChange(Number(val));
                          setSelectedLotId(Number(val));
                        }}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-return-lot">
                            <SelectValue placeholder="Select crop / variety / lot..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(lotsGrouped).map(([productName, groupLots]) => (
                            <div key={productName}>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                                {productName}
                              </div>
                              {groupLots.map(lot => (
                                <SelectItem key={lot.id} value={String(lot.id)}>
                                  {lot.lotNumber}
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedProduct && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedProduct.crop} &mdash; {selectedProduct.variety}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="partyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Party Name <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input data-testid="input-return-party" placeholder="Enter party / dealer name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stateName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State Name <span className="text-destructive">*</span></FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-return-state">
                            <SelectValue placeholder="Select state..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STATE_OPTIONS.map(s => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location (Received At) <span className="text-destructive">*</span></FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-return-location">
                            <SelectValue placeholder="Select warehouse / location..." />
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

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input data-testid="input-return-quantity" type="number" min="0" step="0.01" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit <span className="text-destructive">*</span></FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-return-unit">
                              <SelectValue placeholder="Unit..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {UNIT_OPTIONS.map(u => (
                              <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="stockForm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Form <span className="text-destructive">*</span></FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger data-testid="select-return-stock-form">
                            <SelectValue placeholder="Select stock form..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {STOCK_FORM_OPTIONS.map(s => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
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
                        <Input data-testid="input-return-inward-date" type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expiry Date</FormLabel>
                      <FormControl>
                        <Input data-testid="input-return-expiry-date" type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Textarea data-testid="textarea-return-remarks" placeholder="Any additional notes or reason for return..." rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-1">
                <Button
                  data-testid="btn-submit-return"
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  disabled={createReturn.isPending}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {createReturn.isPending ? "Saving..." : "Record Return"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <PackageOpen className="h-4 w-4 text-amber-500" />
          Return Records
        </h2>
        <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
          {(returns as any[]).length} entries &bull; {totalReturned.toFixed(0)} KG total
        </Badge>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Loading records...</div>
      ) : (returns as any[]).length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground">
          <RotateCcw className="h-8 w-8 opacity-30" />
          <p className="text-sm">No return records yet. Use the form above to add one.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground">#</th>
                <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground">Lot No</th>
                <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground">Crop / Variety</th>
                <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground">Party Name</th>
                <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground">State</th>
                <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground">Location</th>
                <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wide text-muted-foreground">Qty</th>
                <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wide text-muted-foreground">Stock Form</th>
                <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wide text-muted-foreground">Inward Date</th>
                <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wide text-muted-foreground">Expiry Date</th>
                <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground">Remarks</th>
                <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wide text-muted-foreground">Del</th>
              </tr>
            </thead>
            <tbody>
              {[...(returns as any[])].sort((a, b) =>
                new Date(b.inwardDate || b.returnDate || b.createdAt).getTime() -
                new Date(a.inwardDate || a.returnDate || a.createdAt).getTime()
              ).map((r: any, idx: number) => {
                const lot = getLot(r.lotId);
                const product = lot ? getProduct(lot.productId) : null;
                return (
                  <tr
                    key={r.id}
                    data-testid={`row-return-${r.id}`}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-3 py-2.5 text-muted-foreground text-xs">{idx + 1}</td>
                    <td className="px-3 py-2.5">
                      <span className="font-mono font-medium text-xs text-foreground">
                        {lot?.lotNumber || `#${r.lotId}`}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      {product ? (
                        <div>
                          <div className="font-medium text-xs text-foreground">{product.crop}</div>
                          <div className="text-xs text-muted-foreground">{product.variety}</div>
                        </div>
                      ) : <span className="text-muted-foreground text-xs">-</span>}
                    </td>
                    <td className="px-3 py-2.5 text-foreground text-sm">{r.partyName || <span className="text-muted-foreground text-xs">-</span>}</td>
                    <td className="px-3 py-2.5">
                      {r.stateName ? (
                        <Badge variant="outline" className="text-xs">{r.stateName}</Badge>
                      ) : <span className="text-muted-foreground text-xs">-</span>}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-foreground capitalize">
                      {r.location ? getLocationLabel(r.location) : <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 font-semibold text-xs whitespace-nowrap">
                        +{Number(r.quantity).toFixed(0)} {r.unit || "KG"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-center text-xs text-foreground">
                      {r.stockForm ? getStockFormLabel(r.stockForm) : <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="px-3 py-2.5 text-center text-xs text-muted-foreground whitespace-nowrap">{formatDate(r.inwardDate || r.returnDate)}</td>
                    <td className="px-3 py-2.5 text-center text-xs text-muted-foreground whitespace-nowrap">{formatDate(r.expiryDate)}</td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground max-w-[150px]">
                      <span className="line-clamp-2">{r.reason || "-"}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <Button
                        data-testid={`btn-delete-return-${r.id}`}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={() => setDeleteId(r.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-muted/40 border-t-2 border-border font-semibold text-xs">
                <td colSpan={6} className="px-3 py-2 text-muted-foreground uppercase tracking-wide">
                  {(returns as any[]).length} record{(returns as any[]).length !== 1 ? "s" : ""}
                </td>
                <td className="px-3 py-2 text-center text-amber-700 dark:text-amber-300">
                  {totalReturned.toFixed(0)} KG
                </td>
                <td colSpan={5} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <AlertDialog open={deleteId !== null} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Return Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the return entry. The quantity will be deducted from the inward balance. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deleteId !== null) {
                  deleteReturn.mutate(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
