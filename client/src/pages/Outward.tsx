import { useState } from "react";
import { useOutwardRecords, useCreateOutwardRecord, useDeleteOutwardRecord, useOutwardReturns, useCreateOutwardReturn, useLots, useProducts, useLocations, useStockBalances } from "@/hooks/use-inventory";
import { useEmployees } from "@/hooks/use-hrms";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { OutwardRecord, Lot, Product, Location, StockBalance, OutwardReturn } from "@shared/schema";
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
import { Plus, Search, Truck, Trash2, RotateCcw, History } from "lucide-react";
import { format } from "date-fns";

const outwardFormSchema = z.object({
  lotId: z.coerce.number().min(1, "Please select a lot"),
  locationId: z.coerce.number().min(1, "Please select a warehouse"),
  stockForm: z.string().min(1, "Please select stock form"),
  packetSize: z.string().optional(),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  destinationType: z.string().min(1, "Please select destination type"),
  destinationName: z.string().optional(),
  variety: z.string().optional(),
  invoiceNumber: z.string().optional(),
  vehicleNumber: z.string().optional(),
  dispatchedBy: z.string().optional(),
  remarks: z.string().optional(),
});

export default function Outward() {
  const { data: records, isLoading } = useOutwardRecords();
  const { data: lots } = useLots();
  const { data: products } = useProducts();
  const { data: locations } = useLocations();
  const { data: stockBalances } = useStockBalances();
  const { data: employees } = useEmployees();
  const { data: outwardReturnsData = [] } = useOutwardReturns();
  const { mutate: createRecord, isPending } = useCreateOutwardRecord();
  const { mutate: deleteRecord, isPending: isDeleting } = useDeleteOutwardRecord();
  const { mutate: createReturn, isPending: isReturning } = useCreateOutwardReturn();
  const { canDelete } = useAuth();
  
  const getCreatedByName = (createdById: number | null | undefined) => {
    if (!createdById) return "-";
    const emp = (employees || []).find((e: any) => e.id === createdById);
    return emp?.fullName || emp?.employeeId || "-";
  };
  
  const [open, setOpen] = useState(false);
  const [deleteRecordId, setDeleteRecordId] = useState<number | null>(null);
  const [returnRecord, setReturnRecord] = useState<OutwardRecord | null>(null);
  const [returnQty, setReturnQty] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split("T")[0]);
  const [returnPartyName, setReturnPartyName] = useState("");
  const [returnStateName, setReturnStateName] = useState("");
  const [returnLocation, setReturnLocation] = useState("");
  const [returnUnit, setReturnUnit] = useState("KG");
  const [returnStockForm, setReturnStockForm] = useState("");
  const [returnExpiryDate, setReturnExpiryDate] = useState("");
  const [search, setSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const canDeleteOutward = canDelete('outward');

  const form = useForm<z.infer<typeof outwardFormSchema>>({
    resolver: zodResolver(outwardFormSchema),
    defaultValues: {
      stockForm: "loose",
      quantity: 0,
    }
  });

  const watchedLotId = form.watch("lotId");
  const watchedLocationId = form.watch("locationId");
  const watchedStockForm = form.watch("stockForm");

  const availablePacketSizes = (stockBalances as StockBalance[] || [])
    .filter((b: StockBalance) =>
      b.lotId === watchedLotId &&
      b.locationId === watchedLocationId &&
      b.stockForm === 'packed' &&
      b.packetSize &&
      Number(b.quantity) > 0
    )
    .map((b: StockBalance) => b.packetSize as string)
    .filter((v, i, a) => a.indexOf(v) === i);

  const onSubmit = (data: z.infer<typeof outwardFormSchema>) => {
    createRecord({
      lotId: data.lotId,
      locationId: data.locationId,
      stockForm: data.stockForm,
      packetSize: data.stockForm === 'packed' ? (data.packetSize || null) : null,
      quantity: String(data.quantity),
      destinationType: data.destinationType,
      destinationName: data.destinationName || null,
      variety: data.variety || null,
      invoiceNumber: data.invoiceNumber || null,
      vehicleNumber: data.vehicleNumber || null,
      dispatchedBy: data.dispatchedBy || null,
      remarks: data.remarks || null,
    }, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    });
  };

  const handleDelete = () => {
    if (deleteRecordId) {
      deleteRecord(deleteRecordId, {
        onSuccess: () => setDeleteRecordId(null),
      });
    }
  };

  const getLotDetails = (lotId: number) => {
    const lot = (lots as Lot[] || []).find((l: Lot) => l.id === lotId);
    if (!lot) return "Unknown";
    const product = (products as Product[] || []).find((p: Product) => p.id === lot.productId);
    return `${lot.lotNumber} (${product?.crop} - ${product?.variety || 'Unknown'})`;
  };

  const getLotDispatched = (lotId: number): number => {
    return (records as OutwardRecord[] || [])
      .filter((r: OutwardRecord) => r.lotId === lotId)
      .reduce((sum: number, r: OutwardRecord) => sum + Number(r.quantity || 0), 0);
  };

  const getLotReturned = (lotId: number): number => {
    return ((outwardReturnsData as OutwardReturn[]) || [])
      .filter((r: OutwardReturn) => r.lotId === lotId)
      .reduce((sum: number, r: OutwardReturn) => sum + Number(r.quantity || 0), 0);
  };

  const getLotBalance = (lotId: number): number => {
    const lot = (lots as Lot[] || []).find((l: Lot) => l.id === lotId);
    if (!lot) return 0;
    return Math.max(0, Number(lot.initialQuantity || 0) - getLotDispatched(lotId) + getLotReturned(lotId));
  };

  const resetReturnForm = () => {
    setReturnQty("");
    setReturnReason("");
    setReturnDate(new Date().toISOString().split("T")[0]);
    setReturnPartyName("");
    setReturnStateName("");
    setReturnLocation("");
    setReturnUnit("KG");
    setReturnStockForm("");
    setReturnExpiryDate("");
  };

  const handleReturn = () => {
    if (!returnRecord || !returnQty || Number(returnQty) <= 0) return;
    createReturn({
      outwardRecordId: returnRecord.id,
      lotId: returnRecord.lotId,
      partyName: returnPartyName || null,
      stateName: returnStateName || null,
      location: returnLocation || null,
      quantity: String(returnQty),
      unit: returnUnit || "KG",
      stockForm: returnStockForm || null,
      inwardDate: returnDate,
      expiryDate: returnExpiryDate || null,
      returnDate: returnDate,
      reason: returnReason || null,
    } as any, {
      onSuccess: () => {
        setReturnRecord(null);
        resetReturnForm();
      },
    });
  };

  const getLocationName = (locationId: number) => {
    const location = (locations as Location[] || []).find((l: Location) => l.id === locationId);
    return location?.name || "Unknown";
  };

  const filteredRecords = (records as OutwardRecord[] || []).filter((record: OutwardRecord) => {
    const lot = (lots as Lot[] || []).find((l: Lot) => l.id === record.lotId);
    return lot?.lotNumber.toLowerCase().includes(search.toLowerCase()) || 
           record.destinationType?.toLowerCase().includes(search.toLowerCase()) ||
           record.invoiceNumber?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display text-primary">Outward / Dispatch</h2>
          <p className="text-muted-foreground">Record stock dispatches to dealers, farmers, or transfers</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20" data-testid="button-new-outward">
              <Plus className="mr-2 h-4 w-4" />
              New Dispatch
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Record Dispatch</DialogTitle>
              <DialogDescription>Create an outward record for stock dispatch</DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Product</label>
                  <Combobox
                    options={(products as Product[] || []).map((p: Product) => ({
                      value: p.id.toString(),
                      label: `${p.crop} - ${p.variety}`,
                    }))}
                    value={selectedProductId?.toString()}
                    onValueChange={(val) => {
                      const productId = val ? parseInt(val) : null;
                      setSelectedProductId(productId);
                      const product = (products as Product[] || []).find((p: Product) => p.id === productId);
                      if (product) {
                        form.setValue("variety", product.variety || "");
                      }
                    }}
                    placeholder="Select Product"
                    searchPlaceholder="Search products..."
                    data-testid="select-product"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Lot</label>
                  <Select onValueChange={(val) => form.setValue("lotId", parseInt(val))}>
                    <SelectTrigger data-testid="select-lot">
                      <SelectValue placeholder="Select Lot" />
                    </SelectTrigger>
                    <SelectContent>
                      {(lots as Lot[] || []).filter((l: Lot) => l.status === 'active' && (!selectedProductId || l.productId === selectedProductId)).map((lot: Lot) => (
                        <SelectItem key={lot.id} value={lot.id.toString()}>
                          {lot.lotNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Source Warehouse</label>
                  <Select onValueChange={(val) => form.setValue("locationId", parseInt(val))}>
                    <SelectTrigger data-testid="select-location">
                      <SelectValue placeholder="Select" />
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

              {watchedStockForm === 'packed' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Packet Size</label>
                  <Select onValueChange={(val) => form.setValue("packetSize", val)}>
                    <SelectTrigger data-testid="select-packet-size">
                      <SelectValue placeholder="Select packet size" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePacketSizes.length > 0 ? (
                        availablePacketSizes.map((ps) => (
                          <SelectItem key={ps} value={ps}>{ps}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="100g">100g</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantity (KG)</label>
                  <Input 
                    type="number" 
                    step="0.01"
                    {...form.register("quantity")}
                    placeholder="Quantity in KG"
                    data-testid="input-quantity"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Destination Type</label>
                  <Select onValueChange={(val) => form.setValue("destinationType", val)}>
                    <SelectTrigger data-testid="select-destination-type">
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AP">AP (Andhra Pradesh)</SelectItem>
                      <SelectItem value="TS">TS (Telangana)</SelectItem>
                      <SelectItem value="MP">MP (Madhya Pradesh)</SelectItem>
                      <SelectItem value="UP">UP (Uttar Pradesh)</SelectItem>
                      <SelectItem value="KA">KA (Karnataka)</SelectItem>
                      <SelectItem value="CG">CG (Chhattisgarh)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Destination Name</label>
                <Input 
                  {...form.register("destinationName")}
                  placeholder="Dealer/farmer name"
                  data-testid="input-destination-name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Invoice Number</label>
                  <Input 
                    {...form.register("invoiceNumber")}
                    placeholder="INV-001"
                    data-testid="input-invoice"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Vehicle Number</label>
                  <Input 
                    {...form.register("vehicleNumber")}
                    placeholder="MH-12-AB-1234"
                    data-testid="input-vehicle"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Dispatched By</label>
                <Input 
                  {...form.register("dispatchedBy")}
                  placeholder="Person name"
                  data-testid="input-dispatched-by"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isPending}
                data-testid="button-submit-outward"
              >
                {isPending ? "Recording..." : "Record Dispatch"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by lot, destination, or invoice..."
          className="pl-10 max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-outward"
        />
      </div>

      <Card className="border-0 shadow-lg shadow-primary/5">
        <CardHeader className="pb-0">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <span className="font-semibold">Dispatch Records</span>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <p className="text-muted-foreground">Loading records...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Lot</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Form</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300">Closing Balance</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      No dispatch records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record: OutwardRecord) => (
                    <TableRow key={record.id} data-testid={`row-outward-${record.id}`}>
                      <TableCell>{record.dispatchDate ? format(new Date(record.dispatchDate), "PP") : "-"}</TableCell>
                      <TableCell className="font-mono text-sm">{getLotDetails(record.lotId)}</TableCell>
                      <TableCell>
                        <div className="font-medium">{getLocationName(record.locationId)}</div>
                        <div className="text-xs text-muted-foreground">Warehouse</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{record.destinationName || '-'}</div>
                        <div className="text-xs text-muted-foreground">{record.destinationType}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={record.stockForm === 'packed' ? 'default' : 'secondary'}>
                          {record.stockForm === 'loose' ? 'Raw Seeds' : record.stockForm === 'cobs' ? 'Cobs' : record.stockForm}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <span>{Number(record.quantity).toFixed(2)} <span className="text-muted-foreground text-xs">KG</span></span>
                        {record.stockForm === 'packed' && record.packetSize && (
                          <div className="text-xs text-muted-foreground">{record.packetSize}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right bg-amber-50/40 dark:bg-amber-950/10">
                        {(() => {
                          const bal = getLotBalance(record.lotId);
                          return (
                            <span className={`font-semibold ${bal <= 0 ? "text-red-600 dark:text-red-400" : bal < 100 ? "text-orange-600 dark:text-orange-400" : "text-green-700 dark:text-green-400"}`}>
                              {bal.toFixed(2)} <span className="text-muted-foreground text-xs font-normal">kg</span>
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{record.invoiceNumber || '-'}</TableCell>
                      <TableCell>{getCreatedByName(record.createdBy)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setReturnRecord(record);
                              resetReturnForm();
                            }}
                            title="Return Stock"
                            data-testid={`button-return-outward-${record.id}`}
                          >
                            <RotateCcw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </Button>
                          {canDeleteOutward && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteRecordId(record.id)}
                              data-testid={`button-delete-outward-${record.id}`}
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

      {/* Return Stock Dialog */}
      <Dialog open={!!returnRecord} onOpenChange={(v) => { if (!v) { setReturnRecord(null); resetReturnForm(); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-amber-600" />
              Return Stock
            </DialogTitle>
            <DialogDescription>
              Lot: <span className="font-semibold">{returnRecord ? getLotDetails(returnRecord.lotId) : ""}</span>
              &nbsp;&bull;&nbsp;
              <span className="text-xs">Original dispatch: {returnRecord ? Number(returnRecord.quantity).toFixed(0) + " KG" : ""}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Party Name</label>
                <Input
                  value={returnPartyName}
                  onChange={e => setReturnPartyName(e.target.value)}
                  placeholder="Party / dealer name"
                  data-testid="input-return-party"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">State Name</label>
                <Select value={returnStateName} onValueChange={setReturnStateName}>
                  <SelectTrigger data-testid="select-return-state">
                    <SelectValue placeholder="Select state..." />
                  </SelectTrigger>
                  <SelectContent>
                    {[
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
                    ].map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Location (Received At)</label>
                <Select value={returnLocation} onValueChange={setReturnLocation}>
                  <SelectTrigger data-testid="select-return-location">
                    <SelectValue placeholder="Select warehouse..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(locations as Location[] || []).map((l: Location) => (
                      <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Stock Form</label>
                <Select value={returnStockForm} onValueChange={setReturnStockForm}>
                  <SelectTrigger data-testid="select-return-stock-form">
                    <SelectValue placeholder="Select stock form..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="raw_seed">Raw Seed</SelectItem>
                    <SelectItem value="codes">Codes</SelectItem>
                    <SelectItem value="packed">Packed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Quantity <span className="text-destructive">*</span></label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={returnQty}
                    onChange={e => setReturnQty(e.target.value)}
                    placeholder="0"
                    className="flex-1"
                    data-testid="input-return-quantity"
                  />
                  <Select value={returnUnit} onValueChange={setReturnUnit}>
                    <SelectTrigger className="w-24" data-testid="select-return-unit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KG">KG</SelectItem>
                      <SelectItem value="QTL">QTL</SelectItem>
                      <SelectItem value="MT">MT</SelectItem>
                      <SelectItem value="bags">Bags</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Inward Date <span className="text-destructive">*</span></label>
                <Input
                  type="date"
                  value={returnDate}
                  onChange={e => setReturnDate(e.target.value)}
                  data-testid="input-return-date"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Expiry Date</label>
                <Input
                  type="date"
                  value={returnExpiryDate}
                  onChange={e => setReturnExpiryDate(e.target.value)}
                  data-testid="input-return-expiry-date"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Remarks</label>
              <Input
                value={returnReason}
                onChange={e => setReturnReason(e.target.value)}
                placeholder="Any additional notes..."
                data-testid="input-return-reason"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setReturnRecord(null); resetReturnForm(); }}
                disabled={isReturning}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                onClick={handleReturn}
                disabled={isReturning || !returnQty || Number(returnQty) <= 0}
                data-testid="button-confirm-return"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {isReturning ? "Processing..." : "Record Return"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteRecordId} onOpenChange={() => setDeleteRecordId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Dispatch Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this dispatch record? This action cannot be undone.
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
