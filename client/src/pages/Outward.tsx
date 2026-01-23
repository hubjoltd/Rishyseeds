import { useState } from "react";
import { useOutwardRecords, useCreateOutwardRecord, useDeleteOutwardRecord, useLots, useProducts, useLocations, useStockBalances } from "@/hooks/use-inventory";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { OutwardRecord, Lot, Product, Location, StockBalance } from "@shared/schema";
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
import { Plus, Search, Truck, Trash2 } from "lucide-react";
import { format } from "date-fns";

const outwardFormSchema = z.object({
  lotId: z.coerce.number().min(1, "Please select a lot"),
  locationId: z.coerce.number().min(1, "Please select a warehouse"),
  stockForm: z.string().min(1, "Please select stock form"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  destinationType: z.string().min(1, "Please select destination type"),
  destinationName: z.string().optional(),
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
  const { mutate: createRecord, isPending } = useCreateOutwardRecord();
  const { mutate: deleteRecord, isPending: isDeleting } = useDeleteOutwardRecord();
  const { canDelete } = useAuth();
  
  const [open, setOpen] = useState(false);
  const [deleteRecordId, setDeleteRecordId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const canDeleteOutward = canDelete('outward');

  const form = useForm<z.infer<typeof outwardFormSchema>>({
    resolver: zodResolver(outwardFormSchema),
    defaultValues: {
      stockForm: "loose",
      quantity: 0,
    }
  });

  const onSubmit = (data: z.infer<typeof outwardFormSchema>) => {
    createRecord({
      lotId: data.lotId,
      locationId: data.locationId,
      stockForm: data.stockForm,
      quantity: String(data.quantity),
      destinationType: data.destinationType,
      destinationName: data.destinationName || null,
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
              <div className="space-y-2">
                <label className="text-sm font-medium">Lot</label>
                <Select onValueChange={(val) => form.setValue("lotId", parseInt(val))}>
                  <SelectTrigger data-testid="select-lot">
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {form.watch("stockForm") === 'packed' ? 'No. of Packets/Bags' : 'Quantity (KG)'}
                  </label>
                  <Input 
                    type="number" 
                    {...form.register("quantity")}
                    placeholder={form.watch("stockForm") === 'packed' ? 'Number of bags' : 'Quantity in KG'}
                    data-testid="input-quantity"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Destination Type</label>
                  <Select onValueChange={(val) => form.setValue("destinationType", val)}>
                    <SelectTrigger data-testid="select-destination-type">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dealer">Dealer</SelectItem>
                      <SelectItem value="farmer">Farmer</SelectItem>
                      <SelectItem value="own_use">Own Use</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
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
                  <TableHead>Lot</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Form</TableHead>
                  <TableHead className="text-right">Packets/Bags</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No dispatch records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record: OutwardRecord) => (
                    <TableRow key={record.id} data-testid={`row-outward-${record.id}`}>
                      <TableCell className="font-mono text-sm">{getLotDetails(record.lotId)}</TableCell>
                      <TableCell>{getLocationName(record.locationId)}</TableCell>
                      <TableCell>
                        <Badge variant={record.stockForm === 'packed' ? 'default' : 'secondary'}>
                          {record.stockForm === 'loose' ? 'Raw Seeds' : record.stockForm === 'cobs' ? 'Cobs' : record.stockForm}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {record.stockForm === 'packed' ? (
                          <span>{record.quantity} <span className="text-muted-foreground text-xs">bags</span></span>
                        ) : (
                          <span>{record.quantity} <span className="text-muted-foreground text-xs">KG</span></span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <Badge variant="outline" className="w-fit">{record.destinationType}</Badge>
                          {record.destinationName && <span className="text-xs text-muted-foreground mt-1">{record.destinationName}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{record.invoiceNumber || '-'}</TableCell>
                      <TableCell>{record.dispatchDate ? format(new Date(record.dispatchDate), "PP") : "-"}</TableCell>
                      <TableCell className="text-right">
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
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
