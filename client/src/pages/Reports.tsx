import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, TrendingUp, Package, ArrowRightLeft, MapPin, Printer } from "lucide-react";
import { format } from "date-fns";
import type { Batch, StockMovement, Location } from "@shared/schema";

type ReportType = "stock" | "movements" | "locations" | "batches";

export default function Reports() {
  const [reportType, setReportType] = useState<ReportType>("stock");

  const { data: batches, isLoading: batchesLoading } = useQuery<Batch[]>({ queryKey: ["/api/batches"] });
  const { data: movements, isLoading: movementsLoading } = useQuery<StockMovement[]>({ queryKey: ["/api/stock/history"] });
  const { data: locations, isLoading: locationsLoading } = useQuery<Location[]>({ queryKey: ["/api/locations"] });
  
  const isLoading = batchesLoading || movementsLoading || locationsLoading;

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    let data: string = "";
    let filename = "";

    if (reportType === "stock") {
      const headers = ["Batch No", "Crop", "Variety", "Initial Stock", "Current Stock", "Status"];
      const rows = batches?.map(b => [b.batchNumber, b.crop, b.variety, b.lotSize, b.currentQuantity, b.status]) || [];
      data = [headers, ...rows].map(row => row.join(",")).join("\n");
      filename = "stock_report.csv";
    } else if (reportType === "movements") {
      const headers = ["Date", "Batch ID", "Quantity", "From Location", "To Location"];
      const rows = movements?.map(m => [
        m.movementDate ? format(new Date(m.movementDate), "yyyy-MM-dd") : "",
        m.batchId,
        m.quantity,
        m.fromLocationId,
        m.toLocationId
      ]) || [];
      data = [headers, ...rows].map(row => row.join(",")).join("\n");
      filename = "movements_report.csv";
    } else if (reportType === "locations") {
      const headers = ["Name", "Type", "Address", "Status"];
      const rows = locations?.map(l => [l.name, l.type, l.address || "", l.isActive ? "Active" : "Inactive"]) || [];
      data = [headers, ...rows].map(row => row.join(",")).join("\n");
      filename = "locations_report.csv";
    } else if (reportType === "batches") {
      const headers = ["Crop", "Batch Count", "Total Stock (KG)"];
      const cropGroups = Array.from(new Set(batches?.map(b => b.crop) || []));
      const rows = cropGroups.map(crop => {
        const cropBatches = batches?.filter(b => b.crop === crop) || [];
        const totalStock = cropBatches.reduce((sum, b) => sum + Number(b.currentQuantity), 0);
        return [crop, cropBatches.length, totalStock.toFixed(2)];
      });
      data = [headers, ...rows].map(row => row.join(",")).join("\n");
      filename = "batch_summary_report.csv";
    }

    if (!data) return;

    const blob = new Blob([data], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display">Reports</h2>
          <p className="text-sm text-muted-foreground">Generate and export compliance reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="flex gap-3 flex-wrap">
        <Button
          variant={reportType === "stock" ? "default" : "outline"}
          onClick={() => setReportType("stock")}
          className="gap-2"
        >
          <Package className="w-4 h-4" />
          Stock Report
        </Button>
        <Button
          variant={reportType === "movements" ? "default" : "outline"}
          onClick={() => setReportType("movements")}
          className="gap-2"
        >
          <ArrowRightLeft className="w-4 h-4" />
          Movement Log
        </Button>
        <Button
          variant={reportType === "locations" ? "default" : "outline"}
          onClick={() => setReportType("locations")}
          className="gap-2"
        >
          <MapPin className="w-4 h-4" />
          Locations
        </Button>
        <Button
          variant={reportType === "batches" ? "default" : "outline"}
          onClick={() => setReportType("batches")}
          className="gap-2"
        >
          <TrendingUp className="w-4 h-4" />
          Batch Summary
        </Button>
      </div>

      {/* Report Content */}
      <Card className="card-modern overflow-hidden print:shadow-none">
        <CardHeader className="bg-muted/30 print:bg-white">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {reportType === "stock" && "Stock Report"}
              {reportType === "movements" && "Movement Register"}
              {reportType === "locations" && "Locations Report"}
              {reportType === "batches" && "Batch Summary"}
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              Generated: {format(new Date(), "dd MMM yyyy, hh:mm a")}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {reportType === "stock" && (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20">
                  <TableHead>Batch No</TableHead>
                  <TableHead>Crop</TableHead>
                  <TableHead>Variety</TableHead>
                  <TableHead className="text-right">Initial (KG)</TableHead>
                  <TableHead className="text-right">Current (KG)</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batchesLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : batches?.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">No data</TableCell></TableRow>
                ) : (
                  batches?.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium">{batch.batchNumber}</TableCell>
                      <TableCell>{batch.crop}</TableCell>
                      <TableCell>{batch.variety}</TableCell>
                      <TableCell className="text-right">{batch.lotSize}</TableCell>
                      <TableCell className="text-right font-bold text-primary">{batch.currentQuantity}</TableCell>
                      <TableCell>
                        <Badge className={batch.status === "active" ? "badge-success" : "badge-warning"}>
                          {batch.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {reportType === "movements" && (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20">
                  <TableHead>Date</TableHead>
                  <TableHead>Batch ID</TableHead>
                  <TableHead className="text-right">Quantity (KG)</TableHead>
                  <TableHead>From Location</TableHead>
                  <TableHead>To Location</TableHead>
                  <TableHead>Responsible</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movementsLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : movements?.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">No movements recorded</TableCell></TableRow>
                ) : (
                  movements?.map((mov) => (
                    <TableRow key={mov.id}>
                      <TableCell>{mov.movementDate ? format(new Date(mov.movementDate), "dd/MM/yyyy") : "-"}</TableCell>
                      <TableCell className="font-medium">{mov.batchId}</TableCell>
                      <TableCell className="text-right font-bold">{mov.quantity}</TableCell>
                      <TableCell>{mov.fromLocationId}</TableCell>
                      <TableCell>{mov.toLocationId}</TableCell>
                      <TableCell>{mov.responsiblePerson || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {reportType === "locations" && (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20">
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locationsLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : locations?.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8">No locations</TableCell></TableRow>
                ) : (
                  locations?.map((loc) => (
                    <TableRow key={loc.id}>
                      <TableCell className="font-medium">{loc.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="badge-info capitalize">{loc.type}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{loc.address || "-"}</TableCell>
                      <TableCell>
                        <Badge className={loc.isActive ? "badge-success" : "badge-danger"}>
                          {loc.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {reportType === "batches" && (
            <div className="p-6">
              {batchesLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : (
              <><div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20">
                  <p className="text-3xl font-bold text-green-600">{batches?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Batches</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                  <p className="text-3xl font-bold text-blue-600">
                    {batches?.reduce((sum, b) => sum + Number(b.currentQuantity), 0).toFixed(0) || 0} KG
                  </p>
                  <p className="text-sm text-muted-foreground">Total Stock</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                  <p className="text-3xl font-bold text-amber-600">
                    {batches?.filter(b => b.status === "active").length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Active Batches</p>
                </div>
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20">
                  <p className="text-3xl font-bold text-rose-600">{movements?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Movements</p>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20">
                    <TableHead>Crop</TableHead>
                    <TableHead className="text-right">Batches</TableHead>
                    <TableHead className="text-right">Total Stock (KG)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from(new Set(batches?.map(b => b.crop) || [])).map(crop => {
                    const cropBatches = batches?.filter(b => b.crop === crop) || [];
                    const totalStock = cropBatches.reduce((sum, b) => sum + Number(b.currentQuantity), 0);
                    return (
                      <TableRow key={crop}>
                        <TableCell className="font-medium">{crop}</TableCell>
                        <TableCell className="text-right">{cropBatches.length}</TableCell>
                        <TableCell className="text-right font-bold text-primary">{totalStock.toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
