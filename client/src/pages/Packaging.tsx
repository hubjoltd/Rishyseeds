import { useState } from "react";
import { useBatches, useCreatePackagingOutput, usePackagingOutputs, useDeletePackagingOutput } from "@/hooks/use-inventory";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPackagingOutputSchema } from "@shared/schema";
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
import { Package, Plus, Boxes, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function Packaging() {
  const { data: packagingOutputs, isLoading } = usePackagingOutputs();
  const { data: batches } = useBatches();
  const { mutate: createPackaging, isPending } = useCreatePackagingOutput();
  const { mutate: deletePackaging, isPending: isDeleting } = useDeletePackagingOutput();
  const { canDelete } = useAuth();
  const [open, setOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  const canDeletePackaging = canDelete('packaging');

  const handleDeletePackaging = () => {
    if (deleteId !== null) {
      deletePackaging(deleteId, {
        onSuccess: () => setDeleteId(null)
      });
    }
  };

  const packagingFormSchema = insertPackagingOutputSchema.extend({
    batchId: z.coerce.number(),
    numberOfPackets: z.coerce.number().positive("Must be at least 1"),
    wasteQuantity: z.coerce.number().optional(),
  });

  const form = useForm<z.infer<typeof packagingFormSchema>>({
    resolver: zodResolver(packagingFormSchema),
    defaultValues: {
      packetSize: "",
      numberOfPackets: 0,
      wasteQuantity: 0,
    }
  });

  const onSubmit = (data: z.infer<typeof packagingFormSchema>) => {
    // Convert wasteQuantity to string for API (decimal type in database)
    const submitData = {
      ...data,
      wasteQuantity: data.wasteQuantity !== undefined ? String(data.wasteQuantity) : undefined,
    };
    
    createPackaging(submitData, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
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
                <label className="text-sm font-medium">Batch</label>
                <Select onValueChange={(val) => form.setValue("batchId", parseInt(val))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {batches?.map((b) => (
                      <SelectItem key={b.id} value={b.id.toString()}>
                        {b.batchNumber} - {b.crop} / {b.variety}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.batchId && <p className="text-xs text-red-500">Required</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Packet Size</label>
                  <Select onValueChange={(val) => form.setValue("packetSize", val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100g">100g</SelectItem>
                      <SelectItem value="250g">250g</SelectItem>
                      <SelectItem value="500g">500g</SelectItem>
                      <SelectItem value="1kg">1kg</SelectItem>
                      <SelectItem value="5kg">5kg</SelectItem>
                      <SelectItem value="10kg">10kg</SelectItem>
                      <SelectItem value="25kg">25kg</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Number of Packets</label>
                  <Input 
                    type="number" 
                    {...form.register("numberOfPackets")}
                    data-testid="input-number-of-packets"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Waste/Loss (KG)</label>
                <Input 
                  type="number" 
                  step="0.01"
                  {...form.register("wasteQuantity")} 
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">Optional - record any material loss</p>
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
                <TableHead>Batch ID</TableHead>
                <TableHead>Packet Size</TableHead>
                <TableHead className="text-right">Packets</TableHead>
                <TableHead className="text-right">Est. Output (KG)</TableHead>
                <TableHead className="text-right">Waste (KG)</TableHead>
                {canDeletePackaging && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={canDeletePackaging ? 7 : 6} className="text-center">Loading...</TableCell></TableRow>
              ) : packagingOutputs?.length === 0 ? (
                <TableRow><TableCell colSpan={canDeletePackaging ? 7 : 6} className="text-center text-muted-foreground py-8">No packaging records found.</TableCell></TableRow>
              ) : (
                packagingOutputs?.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.productionDate ? format(new Date(p.productionDate), 'MMM dd, yyyy') : '-'}</TableCell>
                    <TableCell className="font-medium">{p.batchId}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {p.packetSize}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold">{p.numberOfPackets}</TableCell>
                    <TableCell className="text-right text-green-600 font-medium">
                      {calculateOutput(p.packetSize, p.numberOfPackets)} kg
                    </TableCell>
                    <TableCell className="text-right text-orange-600">
                      {Number(p.wasteQuantity || 0).toFixed(2)} kg
                    </TableCell>
                    {canDeletePackaging && (
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeleteId(p.id)}
                          data-testid={`button-delete-packaging-${p.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
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
        </CardContent>
      </Card>
    </div>
  );
}
