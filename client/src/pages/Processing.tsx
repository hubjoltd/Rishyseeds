import { useState } from "react";
import { useProcessingRecords, useCreateProcessingRecord, useDeleteProcessingRecord, useCompleteProcessing, useLots, useProducts, useLocations } from "@/hooks/use-inventory";
import { useEmployees } from "@/hooks/use-hrms";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ProcessingRecord, Lot, Product, Location } from "@shared/schema";
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
import { Plus, Search, Cog, Trash2, CheckCircle } from "lucide-react";
import { format } from "date-fns";

const processingFormSchema = z.object({
  inputLotId: z.coerce.number().min(1, "Please select input lot"),
  inputQuantity: z.coerce.number().positive("Quantity must be positive"),
  processingType: z.string().min(1, "Please select processing type"),
  processedBy: z.string().optional(),
  remarks: z.string().optional(),
});

const completeProcessingSchema = z.object({
  outputQuantity: z.coerce.number().positive("Output quantity must be positive"),
  wasteQuantity: z.coerce.number().min(0, "Waste cannot be negative"),
});

export default function Processing() {
  const { data: records, isLoading } = useProcessingRecords();
  const { data: lots } = useLots();
  const { data: products } = useProducts();
  const { data: employees } = useEmployees();
  const { mutate: createRecord, isPending } = useCreateProcessingRecord();
  const { mutate: deleteRecord, isPending: isDeleting } = useDeleteProcessingRecord();
  const { mutate: completeProcessing, isPending: isCompleting } = useCompleteProcessing();
  const { canDelete, canEdit } = useAuth();
  
  const getCreatedByName = (createdById: number | null | undefined) => {
    if (!createdById) return "-";
    const emp = (employees || []).find((e: any) => e.id === createdById);
    return emp?.fullName || emp?.employeeId || "-";
  };
  
  const [open, setOpen] = useState(false);
  const [deleteRecordId, setDeleteRecordId] = useState<number | null>(null);
  const [completeRecordId, setCompleteRecordId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const canDeleteProcessing = canDelete('processing');
  const canEditProcessing = canEdit('processing');

  const activeLots = (lots as Lot[] || []).filter((l: Lot) => l.status === 'active');
  const filteredLots = selectedProductId 
    ? activeLots.filter(l => l.productId === selectedProductId)
    : activeLots;

  const form = useForm<z.infer<typeof processingFormSchema>>({
    resolver: zodResolver(processingFormSchema),
    defaultValues: {
      inputQuantity: 0,
    }
  });

  const completeForm = useForm<z.infer<typeof completeProcessingSchema>>({
    resolver: zodResolver(completeProcessingSchema),
    defaultValues: {
      outputQuantity: 0,
      wasteQuantity: 0,
    }
  });

  const selectedRecordForComplete = completeRecordId 
    ? (records as ProcessingRecord[] || []).find((r: ProcessingRecord) => r.id === completeRecordId)
    : null;

  const onSubmit = (data: z.infer<typeof processingFormSchema>) => {
    createRecord({
      inputLotId: data.inputLotId,
      inputQuantity: String(data.inputQuantity),
      processingType: data.processingType,
      processedBy: data.processedBy || null,
      remarks: data.remarks || null,
      status: "pending",
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

  const handleComplete = (data: z.infer<typeof completeProcessingSchema>) => {
    if (completeRecordId) {
      completeProcessing({
        id: completeRecordId,
        outputQuantity: data.outputQuantity,
        wasteQuantity: data.wasteQuantity,
      }, {
        onSuccess: () => {
          setCompleteRecordId(null);
          completeForm.reset();
        },
      });
    }
  };

  const getLotDetails = (lotId: number) => {
    const lot = (lots as Lot[] || []).find((l: Lot) => l.id === lotId);
    if (!lot) return "Unknown";
    const product = (products as Product[] || []).find((p: Product) => p.id === lot.productId);
    return `${lot.lotNumber} (${product?.crop} - ${product?.variety || 'Unknown'})`;
  };

  const filteredRecords = (records as ProcessingRecord[] || []).filter((record: ProcessingRecord) => {
    const lot = (lots as Lot[] || []).find((l: Lot) => l.id === record.inputLotId);
    return lot?.lotNumber.toLowerCase().includes(search.toLowerCase()) || 
           record.processingType.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display text-primary">Processing</h2>
          <p className="text-muted-foreground">Process raw seeds (cleaning, grading, treatment)</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20" data-testid="button-new-processing">
              <Plus className="mr-2 h-4 w-4" />
              New Processing
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Processing Record</DialogTitle>
              <DialogDescription>Process seeds from an existing lot</DialogDescription>
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
                    form.setValue("inputLotId", 0);
                  }}
                  placeholder="Select Product"
                  searchPlaceholder="Search products..."
                  data-testid="select-product"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Input Lot <span className="text-destructive">*</span></label>
                <Select 
                  onValueChange={(val) => form.setValue("inputLotId", parseInt(val))}
                  disabled={!selectedProductId}
                >
                  <SelectTrigger data-testid="select-input-lot">
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
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Input Quantity (KG)</label>
                <Input 
                  type="number" 
                  {...form.register("inputQuantity")}
                  placeholder="Enter quantity to process"
                  data-testid="input-quantity"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Processing Type</label>
                <Select onValueChange={(val) => form.setValue("processingType", val)}>
                  <SelectTrigger data-testid="select-processing-type">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cleaning">Cleaning</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="drying">Drying</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Processed By</label>
                <Select onValueChange={(val) => form.setValue("processedBy", val)}>
                  <SelectTrigger data-testid="select-processed-by">
                    <SelectValue placeholder="Select Machine" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="old_machine">Old Machine</SelectItem>
                    <SelectItem value="new_machine">New Machine</SelectItem>
                  </SelectContent>
                </Select>
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
                data-testid="button-submit-processing"
              >
                {isPending ? "Creating..." : "Create Record"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by lot number or type..."
          className="pl-10 max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-processing"
        />
      </div>

      <Card className="border-0 shadow-lg shadow-primary/5">
        <CardHeader className="pb-0">
          <div className="flex items-center gap-2">
            <Cog className="h-5 w-5 text-primary" />
            <span className="font-semibold">Processing Records</span>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <p className="text-muted-foreground">Loading records...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Input Lot</TableHead>
                  <TableHead>Input Qty</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Output Qty</TableHead>
                  <TableHead>Waste</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      No processing records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record: ProcessingRecord) => (
                    <TableRow key={record.id} data-testid={`row-processing-${record.id}`}>
                      <TableCell className="font-mono">{getLotDetails(record.inputLotId)}</TableCell>
                      <TableCell>{record.inputQuantity} kg</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{record.processingType}</Badge>
                      </TableCell>
                      <TableCell>{record.outputQuantity || '-'} kg</TableCell>
                      <TableCell>{record.wasteQuantity || '0'} kg</TableCell>
                      <TableCell>
                        <Badge variant={record.status === 'completed' ? 'default' : 'outline'}>
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{record.processingDate ? format(new Date(record.processingDate), "PP") : "-"}</TableCell>
                      <TableCell>{getCreatedByName(record.createdBy)}</TableCell>
                      <TableCell className="text-right flex gap-1 justify-end">
                        {record.status === 'pending' && canEditProcessing && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCompleteRecordId(record.id)}
                            data-testid={`button-complete-processing-${record.id}`}
                          >
                            <CheckCircle className="h-4 w-4 text-primary" />
                          </Button>
                        )}
                        {canDeleteProcessing && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteRecordId(record.id)}
                            data-testid={`button-delete-processing-${record.id}`}
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
            <AlertDialogTitle>Delete Processing Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this processing record? This action cannot be undone.
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

      <Dialog open={!!completeRecordId} onOpenChange={() => setCompleteRecordId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Processing</DialogTitle>
            <DialogDescription>
              Enter the output quantity and waste. A new output lot will be created automatically.
              {selectedRecordForComplete && (
                <span className="block mt-2 text-sm">
                  Input: {selectedRecordForComplete.inputQuantity} kg
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={completeForm.handleSubmit(handleComplete)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Output Quantity (KG)</label>
              <Input 
                type="number" 
                {...completeForm.register("outputQuantity")}
                placeholder="Processed output quantity"
                data-testid="input-output-quantity"
              />
              <p className="text-xs text-muted-foreground">Quantity of usable processed seeds</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Waste Quantity (KG)</label>
              <Input 
                type="number" 
                {...completeForm.register("wasteQuantity")}
                placeholder="Waste/loss quantity"
                data-testid="input-waste-quantity"
              />
              <p className="text-xs text-muted-foreground">Processing loss (dust, debris, damaged seeds)</p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isCompleting}
              data-testid="button-submit-complete"
            >
              {isCompleting ? "Completing..." : "Complete & Create Output Lot"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
