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
import { FileText, Download, TrendingUp, Package, ArrowRightLeft, MapPin, Printer, Layers } from "lucide-react";
import { format } from "date-fns";
import type { Lot, Product, Location, StockBalance, OutwardRecord, ProcessingRecord } from "@shared/schema";

type ReportType = "lots" | "variety" | "location" | "outward" | "processing";

export default function Reports() {
  const [reportType, setReportType] = useState<ReportType>("lots");

  const { data: lots, isLoading: lotsLoading } = useQuery<Lot[]>({ queryKey: ["/api/lots"] });
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const { data: locations, isLoading: locationsLoading } = useQuery<Location[]>({ queryKey: ["/api/locations"] });
  const { data: stockBalances, isLoading: stockLoading } = useQuery<StockBalance[]>({ queryKey: ["/api/stock-balances"] });
  const { data: outwardRecords, isLoading: outwardLoading } = useQuery<OutwardRecord[]>({ queryKey: ["/api/outward"] });
  const { data: processingRecords, isLoading: processingLoading } = useQuery<ProcessingRecord[]>({ queryKey: ["/api/processing"] });
  
  const isLoading = lotsLoading || productsLoading || locationsLoading || stockLoading || outwardLoading || processingLoading;

  const getProductName = (productId: number) => {
    const product = (products as Product[] || []).find(p => p.id === productId);
    return product ? `${product.crop} - ${product.variety}` : `Product #${productId}`;
  };

  const getLocationName = (locationId: number) => {
    const location = (locations as Location[] || []).find(l => l.id === locationId);
    return location?.name || `Location #${locationId}`;
  };

  const getLotNumber = (lotId: number) => {
    const lot = (lots as Lot[] || []).find(l => l.id === lotId);
    return lot?.lotNumber || `Lot #${lotId}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    let data: string = "";
    let filename = "";

    if (reportType === "lots") {
      const headers = ["Lot Number", "Product", "Quantity (KG)", "Source", "Status", "Date"];
      const rows = lots?.map(l => [
        l.lotNumber, 
        getProductName(l.productId), 
        l.initialQuantity, 
        l.sourceName || '-',
        l.status, 
        l.inwardDate ? format(new Date(l.inwardDate), "yyyy-MM-dd") : ""
      ]) || [];
      data = [headers, ...rows].map(row => row.join(",")).join("\n");
      filename = "lot_stock_report.csv";
    } else if (reportType === "variety") {
      const headers = ["Variety", "Lot Count", "Total Stock (KG)"];
      const productGroups = Array.from(new Set(lots?.map(l => l.productId) || []));
      const rows = productGroups.map(productId => {
        const productLots = lots?.filter(l => l.productId === productId) || [];
        const totalStock = productLots.reduce((sum, l) => sum + Number(l.initialQuantity), 0);
        return [getProductName(productId), productLots.length, totalStock.toFixed(2)];
      });
      data = [headers, ...rows].map(row => row.join(",")).join("\n");
      filename = "variety_summary_report.csv";
    } else if (reportType === "location") {
      const headers = ["Location", "Lot", "Stock Form", "Quantity"];
      const rows = stockBalances?.map(sb => [
        getLocationName(sb.locationId),
        getLotNumber(sb.lotId),
        sb.stockForm,
        sb.quantity
      ]) || [];
      data = [headers, ...rows].map(row => row.join(",")).join("\n");
      filename = "location_stock_report.csv";
    } else if (reportType === "outward") {
      const headers = ["Date", "Lot", "From", "Quantity", "Destination Type", "Destination Name", "Invoice"];
      const rows = outwardRecords?.map(o => [
        o.dispatchDate ? format(new Date(o.dispatchDate), "yyyy-MM-dd") : "",
        getLotNumber(o.lotId),
        getLocationName(o.locationId),
        o.quantity,
        o.destinationType,
        o.destinationName || '-',
        o.invoiceNumber || '-'
      ]) || [];
      data = [headers, ...rows].map(row => row.join(",")).join("\n");
      filename = "outward_report.csv";
    } else if (reportType === "processing") {
      const headers = ["Date", "Input Lot", "Input Qty", "Output Qty", "Waste", "Type", "Status"];
      const rows = processingRecords?.map(p => [
        p.processingDate ? format(new Date(p.processingDate), "yyyy-MM-dd") : "",
        getLotNumber(p.inputLotId),
        p.inputQuantity,
        p.outputQuantity || '-',
        p.wasteQuantity || '-',
        p.processingType,
        p.status
      ]) || [];
      data = [headers, ...rows].map(row => row.join(",")).join("\n");
      filename = "processing_report.csv";
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

  const activeLots = lots?.filter(l => l.status === 'active') || [];
  const totalStock = activeLots.reduce((sum, l) => sum + Number(l.initialQuantity), 0);
  const completedProcessing = processingRecords?.filter(p => p.status === 'completed') || [];
  const totalOutward = outwardRecords?.reduce((sum, o) => sum + Number(o.quantity), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display">Reports</h2>
          <p className="text-sm text-muted-foreground">Generate and export stock reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} data-testid="button-print">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button onClick={handleExport} data-testid="button-export">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <p className="text-3xl font-bold text-green-600">{activeLots.length}</p>
          <p className="text-sm text-muted-foreground">Active Lots</p>
        </div>
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-3xl font-bold text-blue-600">{totalStock.toFixed(0)} KG</p>
          <p className="text-sm text-muted-foreground">Total Stock</p>
        </div>
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-3xl font-bold text-amber-600">{completedProcessing.length}</p>
          <p className="text-sm text-muted-foreground">Processing Done</p>
        </div>
        <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
          <p className="text-3xl font-bold text-purple-600">{totalOutward.toFixed(0)} KG</p>
          <p className="text-sm text-muted-foreground">Total Dispatched</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Button
          variant={reportType === "lots" ? "default" : "outline"}
          onClick={() => setReportType("lots")}
          className="gap-2"
          data-testid="button-lots-report"
        >
          <Package className="w-4 h-4" />
          Lot Stock
        </Button>
        <Button
          variant={reportType === "variety" ? "default" : "outline"}
          onClick={() => setReportType("variety")}
          className="gap-2"
          data-testid="button-variety-report"
        >
          <Layers className="w-4 h-4" />
          Variety-wise
        </Button>
        <Button
          variant={reportType === "location" ? "default" : "outline"}
          onClick={() => setReportType("location")}
          className="gap-2"
          data-testid="button-location-report"
        >
          <MapPin className="w-4 h-4" />
          Location-wise
        </Button>
        <Button
          variant={reportType === "outward" ? "default" : "outline"}
          onClick={() => setReportType("outward")}
          className="gap-2"
          data-testid="button-outward-report"
        >
          <ArrowRightLeft className="w-4 h-4" />
          Outward Log
        </Button>
        <Button
          variant={reportType === "processing" ? "default" : "outline"}
          onClick={() => setReportType("processing")}
          className="gap-2"
          data-testid="button-processing-report"
        >
          <TrendingUp className="w-4 h-4" />
          Processing
        </Button>
      </div>

      <Card className="card-modern overflow-hidden print:shadow-none">
        <CardHeader className="bg-muted/30 print:bg-white">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {reportType === "lots" && "Lot Stock Report"}
              {reportType === "variety" && "Variety-wise Summary"}
              {reportType === "location" && "Location-wise Stock"}
              {reportType === "outward" && "Outward/Dispatch Log"}
              {reportType === "processing" && "Processing Report"}
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              Generated: {format(new Date(), "dd MMM yyyy, hh:mm a")}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {reportType === "lots" && (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20">
                  <TableHead>Lot Number</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Quantity (KG)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lotsLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : lots?.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">No lots found</TableCell></TableRow>
                ) : (
                  lots?.map((lot) => (
                    <TableRow key={lot.id} data-testid={`row-lot-${lot.id}`}>
                      <TableCell className="font-mono font-medium">{lot.lotNumber}</TableCell>
                      <TableCell>{getProductName(lot.productId)}</TableCell>
                      <TableCell>{lot.sourceName || '-'}</TableCell>
                      <TableCell className="text-right font-bold text-primary">{Number(lot.initialQuantity).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge className={lot.status === "active" ? "badge-success" : "badge-warning"}>
                          {lot.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{lot.inwardDate ? format(new Date(lot.inwardDate), "dd/MM/yyyy") : "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {reportType === "variety" && (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20">
                  <TableHead>Variety</TableHead>
                  <TableHead className="text-right">Lot Count</TableHead>
                  <TableHead className="text-right">Total Stock (KG)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsLoading || lotsLoading ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : (
                  (() => {
                    const productIds = Array.from(new Set(lots?.map(l => l.productId) || []));
                    if (productIds.length === 0) {
                      return <TableRow><TableCell colSpan={3} className="text-center py-8">No data</TableCell></TableRow>;
                    }
                    return productIds.map(productId => {
                      const productLots = lots?.filter(l => l.productId === productId && l.status === 'active') || [];
                      const totalStock = productLots.reduce((sum, l) => sum + Number(l.initialQuantity), 0);
                      return (
                        <TableRow key={productId} data-testid={`row-variety-${productId}`}>
                          <TableCell className="font-medium">{getProductName(productId)}</TableCell>
                          <TableCell className="text-right">{productLots.length}</TableCell>
                          <TableCell className="text-right font-bold text-primary">{totalStock.toFixed(2)}</TableCell>
                        </TableRow>
                      );
                    });
                  })()
                )}
              </TableBody>
            </Table>
          )}

          {reportType === "location" && (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20">
                  <TableHead>Location</TableHead>
                  <TableHead>Lot</TableHead>
                  <TableHead>Stock Form</TableHead>
                  <TableHead>Packet Size</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : stockBalances?.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">No stock balances found</TableCell></TableRow>
                ) : (
                  stockBalances?.map((sb) => (
                    <TableRow key={sb.id} data-testid={`row-stock-${sb.id}`}>
                      <TableCell className="font-medium">{getLocationName(sb.locationId)}</TableCell>
                      <TableCell className="font-mono">{getLotNumber(sb.lotId)}</TableCell>
                      <TableCell>
                        <Badge variant={sb.stockForm === 'packed' ? 'default' : 'secondary'}>
                          {sb.stockForm}
                        </Badge>
                      </TableCell>
                      <TableCell>{sb.packetSize || '-'}</TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        {Number(sb.quantity).toFixed(2)} {sb.stockForm === 'packed' ? 'pcs' : 'KG'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {reportType === "outward" && (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20">
                  <TableHead>Date</TableHead>
                  <TableHead>Lot</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Invoice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outwardLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : outwardRecords?.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">No outward records</TableCell></TableRow>
                ) : (
                  outwardRecords?.map((record) => (
                    <TableRow key={record.id} data-testid={`row-outward-${record.id}`}>
                      <TableCell>{record.dispatchDate ? format(new Date(record.dispatchDate), "dd/MM/yyyy") : "-"}</TableCell>
                      <TableCell className="font-mono">{getLotNumber(record.lotId)}</TableCell>
                      <TableCell>{getLocationName(record.locationId)}</TableCell>
                      <TableCell className="text-right font-bold">
                        {Number(record.quantity).toFixed(2)} {record.stockForm === 'packed' ? 'pcs' : 'KG'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <Badge variant="outline" className="w-fit capitalize">{record.destinationType.replace('_', ' ')}</Badge>
                          {record.destinationName && <span className="text-xs text-muted-foreground mt-1">{record.destinationName}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{record.invoiceNumber || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {reportType === "processing" && (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/20">
                  <TableHead>Date</TableHead>
                  <TableHead>Input Lot</TableHead>
                  <TableHead className="text-right">Input (KG)</TableHead>
                  <TableHead className="text-right">Output (KG)</TableHead>
                  <TableHead className="text-right">Waste (KG)</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processingLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : processingRecords?.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8">No processing records</TableCell></TableRow>
                ) : (
                  processingRecords?.map((record) => (
                    <TableRow key={record.id} data-testid={`row-processing-${record.id}`}>
                      <TableCell>{record.processingDate ? format(new Date(record.processingDate), "dd/MM/yyyy") : "-"}</TableCell>
                      <TableCell className="font-mono">{getLotNumber(record.inputLotId)}</TableCell>
                      <TableCell className="text-right">{Number(record.inputQuantity).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        {record.outputQuantity ? Number(record.outputQuantity).toFixed(2) : '-'}
                      </TableCell>
                      <TableCell className="text-right text-destructive">
                        {record.wasteQuantity ? Number(record.wasteQuantity).toFixed(2) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">{record.processingType}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={record.status === "completed" ? "badge-success" : "badge-warning"}>
                          {record.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
