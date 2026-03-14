import { useState, useMemo } from "react";
import { useLots, useProducts, useOutwardRecords } from "@/hooks/use-inventory";
import type { Lot, Product, OutwardRecord } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { Search, Layers, TrendingDown, TrendingUp, PackageCheck } from "lucide-react";

export default function VarietyStock() {
  const { data: lots = [] } = useLots() as { data: Lot[] };
  const { data: products = [] } = useProducts() as { data: Product[] };
  const { data: outwardRecords = [] } = useOutwardRecords() as { data: OutwardRecord[] };

  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    (lots as Lot[]).forEach((lot) => {
      if (lot.inwardDate) years.add(String(new Date(lot.inwardDate).getFullYear()));
    });
    return ["all", ...Array.from(years).sort((a, b) => Number(b) - Number(a))];
  }, [lots]);

  const filteredLots = useMemo(() =>
    (lots as Lot[]).filter((lot) => {
      if (selectedYear === "all") return true;
      if (!lot.inwardDate) return false;
      return String(new Date(lot.inwardDate).getFullYear()) === selectedYear;
    }),
    [lots, selectedYear]
  );

  const getLotOutward = (lotId: number): number => {
    return (outwardRecords as OutwardRecord[])
      .filter((r) => r.lotId === lotId)
      .reduce((s, r) => s + Number(r.quantity || 0), 0);
  };

  const getLotBalance = (lot: Lot): number =>
    Math.max(0, Number(lot.initialQuantity || 0) - getLotOutward(lot.id));

  type VarietyRow = {
    productId: number;
    crop: string;
    variety: string;
    type: string;
    lotCount: number;
    totalInward: number;
    totalOutward: number;
    closingBalance: number;
    lots: Lot[];
  };

  const varietyRows = useMemo(() => {
    const map: Record<number, VarietyRow> = {};
    for (const lot of filteredLots) {
      const product = (products as Product[]).find((p) => p.id === lot.productId);
      if (!product) continue;
      if (!map[product.id]) {
        map[product.id] = {
          productId: product.id,
          crop: product.crop,
          variety: product.variety || "-",
          type: (product as any).type || "-",
          lotCount: 0,
          totalInward: 0,
          totalOutward: 0,
          closingBalance: 0,
          lots: [],
        };
      }
      const inward = Number(lot.initialQuantity || 0);
      const outward = getLotOutward(lot.id);
      const balance = getLotBalance(lot);
      map[product.id].lotCount += 1;
      map[product.id].totalInward += inward;
      map[product.id].totalOutward += outward;
      map[product.id].closingBalance += balance;
      map[product.id].lots.push(lot);
    }
    return Object.values(map).sort((a, b) => a.crop.localeCompare(b.crop));
  }, [filteredLots, products, outwardRecords]);

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return varietyRows.filter(
      (r) => r.crop.toLowerCase().includes(s) || r.variety.toLowerCase().includes(s)
    );
  }, [varietyRows, search]);

  const totalInward = filtered.reduce((s, r) => s + r.totalInward, 0);
  const totalOutward = filtered.reduce((s, r) => s + r.totalOutward, 0);
  const totalBalance = filtered.reduce((s, r) => s + r.closingBalance, 0);

  const fmt = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: 0 });

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display text-primary">Variety Stock Register</h2>
          <p className="text-muted-foreground">Inward, outward and closing balance by crop variety</p>
        </div>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-36" data-testid="select-year">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map((y) => (
              <SelectItem key={y} value={y}>{y === "all" ? "All Years" : y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Varieties</p>
                <p className="text-2xl font-bold">{filtered.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950/40">
                <TrendingUp className="h-5 w-5 text-green-700 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Inward</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{fmt(totalInward)} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950/40">
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Outward</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{fmt(totalOutward)} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-950/40">
                <PackageCheck className="h-5 w-5 text-amber-700 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Closing Balance</p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{fmt(totalBalance)} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by crop or variety..."
          className="pl-10 max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-variety"
        />
      </div>

      {/* Table */}
      <Card className="border-0 shadow-lg shadow-primary/5">
        <CardHeader className="pb-0">
          <div className="flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-primary" />
            <span className="font-semibold">Stock by Variety</span>
            <Badge variant="outline" className="ml-2">{filtered.length} varieties</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Crop</TableHead>
                <TableHead>Variety</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-center">Lots</TableHead>
                <TableHead className="text-right bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300">
                  Inward (kg)
                </TableHead>
                <TableHead className="text-right bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400">
                  Outward (kg)
                </TableHead>
                <TableHead className="text-right bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300">
                  Closing Balance (kg)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                    No stock data found. Record inward entries to see variety-wise stock.
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {filtered.map((row) => (
                    <TableRow key={row.productId} data-testid={`row-variety-${row.productId}`}>
                      <TableCell className="font-medium">{row.crop}</TableCell>
                      <TableCell className="text-primary font-medium">{row.variety}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{row.type}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{row.lotCount}</Badge>
                      </TableCell>
                      <TableCell className="text-right bg-green-50/40 dark:bg-green-950/10">
                        <span className="font-semibold text-green-700 dark:text-green-400">
                          {fmt(row.totalInward)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right bg-red-50/40 dark:bg-red-950/10">
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          {row.totalOutward > 0 ? `-${fmt(row.totalOutward)}` : "-"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right bg-amber-50/40 dark:bg-amber-950/10">
                        <span className={`font-bold text-base ${
                          row.closingBalance <= 0
                            ? "text-red-600 dark:text-red-400"
                            : row.closingBalance < 500
                            ? "text-orange-600 dark:text-orange-400"
                            : "text-amber-700 dark:text-amber-400"
                        }`}>
                          {fmt(row.closingBalance)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Totals footer */}
                  <TableRow className="border-t-2 bg-muted/30 font-bold">
                    <TableCell colSpan={3} className="font-bold">TOTAL</TableCell>
                    <TableCell className="text-center font-bold">
                      {filtered.reduce((s, r) => s + r.lotCount, 0)} lots
                    </TableCell>
                    <TableCell className="text-right bg-green-50/40 dark:bg-green-950/10 font-bold text-green-700 dark:text-green-400">
                      {fmt(totalInward)}
                    </TableCell>
                    <TableCell className="text-right bg-red-50/40 dark:bg-red-950/10 font-bold text-red-600 dark:text-red-400">
                      -{fmt(totalOutward)}
                    </TableCell>
                    <TableCell className="text-right bg-amber-50/40 dark:bg-amber-950/10 font-bold text-amber-700 dark:text-amber-400 text-base">
                      {fmt(totalBalance)}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
