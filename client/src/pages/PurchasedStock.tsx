import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLots, useLocations, useStockMovements, useStockBalances, useProducts } from "@/hooks/use-inventory";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Warehouse } from "lucide-react";
import type { Lot, Location, StockMovement, StockBalance, Product } from "@shared/schema";

export default function PurchasedStock() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));

  const { data: lots = [] } = useLots() as { data: Lot[] };
  const { data: products = [] } = useProducts() as { data: Product[] };
  const { data: locations = [] } = useLocations() as { data: Location[] };
  const { data: movements = [] } = useStockMovements() as { data: StockMovement[] };
  const { data: stockBalances = [] } = useStockBalances() as { data: StockBalance[] };

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    (lots as Lot[]).forEach(lot => {
      if (lot.inwardDate) {
        const y = String(new Date(lot.inwardDate).getFullYear());
        years.add(y);
      }
    });
    const arr = Array.from(years).sort((a, b) => Number(b) - Number(a));
    if (!arr.includes(String(currentYear))) arr.unshift(String(currentYear));
    return arr;
  }, [lots, currentYear]);

  const filteredLots = useMemo(() =>
    (lots as Lot[]).filter(lot => {
      if (!lot.inwardDate) return false;
      return String(new Date(lot.inwardDate).getFullYear()) === selectedYear;
    }),
    [lots, selectedYear]
  );

  const coldStorageLocations = useMemo(() =>
    (locations as Location[]).filter(l => (l as any).type === "cold_storage"),
    [locations]
  );

  const plantLocations = useMemo(() =>
    (locations as Location[]).filter(l =>
      (l as any).type === "storage" && l.name.toLowerCase().includes("plant")
    ),
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

  const getProduct = (productId: number) =>
    (products as Product[]).find(p => p.id === productId);

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

  const plantLocationIds = plantLocations.map(l => l.id);
  const officeLocationIds = officeLocations.map(l => l.id);

  const totalInward = filteredLots.reduce((s, l) => s + Number(l.initialQuantity || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display text-primary flex items-center gap-2">
            <Warehouse className="h-7 w-7" />
            Purchased Stock Display
          </h2>
          <p className="text-muted-foreground">Year-wise inward purchased stock with storage allocation</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Filter by Year:</span>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32" data-testid="select-year">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(y => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 min-w-[160px]">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Lots</p>
          <p className="text-2xl font-bold text-primary">{filteredLots.length}</p>
          <p className="text-xs text-muted-foreground">{selectedYear}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3 min-w-[160px]">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Inward</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-400">{totalInward.toFixed(0)} KG</p>
          <p className="text-xs text-muted-foreground">Purchased stock</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 min-w-[160px]">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Cold Storages</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{activeColdStorages.length}</p>
          <p className="text-xs text-muted-foreground">With activity this year</p>
        </div>
      </div>

      {filteredLots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border rounded-lg bg-card">
          <Warehouse className="h-12 w-12 mb-3 opacity-30" />
          <p className="font-medium">No inward stock records for {selectedYear}</p>
          <p className="text-sm">Try selecting a different year</p>
        </div>
      ) : (
        <div className="border rounded-lg bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border border-border px-3 py-2 text-left font-semibold text-xs uppercase tracking-wide" rowSpan={2}>Crop</th>
                  <th className="border border-border px-3 py-2 text-left font-semibold text-xs uppercase tracking-wide" rowSpan={2}>Variety</th>
                  <th className="border border-border px-3 py-2 text-left font-semibold text-xs uppercase tracking-wide" rowSpan={2}>Organiser Name</th>
                  <th className="border border-border px-3 py-2 text-center font-semibold text-xs uppercase tracking-wide" rowSpan={2}>Inward Purchased<br/>Stock (KG)</th>
                  {activeColdStorages.length > 0 && (
                    <th
                      className="border border-border px-3 py-2 text-center font-semibold text-xs uppercase tracking-wide bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                      colSpan={activeColdStorages.length * 2}
                    >
                      Storage — Cold Storage
                    </th>
                  )}
                  {plantLocations.length > 0 && (
                    <th
                      className="border border-border px-3 py-2 text-center font-semibold text-xs uppercase tracking-wide bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300"
                      rowSpan={2}
                    >
                      Storage<br/>Plant
                    </th>
                  )}
                  {officeLocations.length > 0 && (
                    <th
                      className="border border-border px-3 py-2 text-center font-semibold text-xs uppercase tracking-wide bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300"
                      rowSpan={2}
                    >
                      Storage<br/>Main Office
                    </th>
                  )}
                </tr>
                {activeColdStorages.length > 0 && (
                  <tr className="bg-muted/30">
                    {activeColdStorages.map(cs => (
                      <>
                        <th
                          key={`cs-in-${cs.id}`}
                          className="border border-border px-2 py-1.5 text-center font-medium text-xs bg-blue-50/60 dark:bg-blue-950/20 max-w-[120px]"
                        >
                          <div className="text-[10px] text-blue-600 dark:text-blue-400 leading-tight whitespace-nowrap overflow-hidden text-ellipsis" title={cs.name}>
                            {cs.name.length > 20 ? cs.name.slice(0, 20) + "..." : cs.name}
                          </div>
                          <div className="text-green-600 font-semibold">Inward</div>
                        </th>
                        <th
                          key={`cs-out-${cs.id}`}
                          className="border border-border px-2 py-1.5 text-center font-medium text-xs bg-blue-50/60 dark:bg-blue-950/20 max-w-[120px]"
                        >
                          <div className="text-[10px] text-blue-600 dark:text-blue-400 leading-tight whitespace-nowrap overflow-hidden text-ellipsis" title={cs.name}>
                            {cs.name.length > 20 ? cs.name.slice(0, 20) + "..." : cs.name}
                          </div>
                          <div className="text-red-600 font-semibold">Outward</div>
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
                    <tr key={lot.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-purchased-stock-${lot.id}`}>
                      <td className="border border-border px-3 py-2 font-medium">
                        {product?.crop || "-"}
                      </td>
                      <td className="border border-border px-3 py-2">
                        <div>{product?.variety || "-"}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{lot.lotNumber}</div>
                      </td>
                      <td className="border border-border px-3 py-2">
                        {lot.sourceName ? (
                          <span>{lot.sourceName}</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </td>
                      <td className="border border-border px-3 py-2 text-center font-semibold text-green-700 dark:text-green-400">
                        {Number(lot.initialQuantity).toFixed(0)}
                        <span className="text-xs font-normal text-muted-foreground ml-1">KG</span>
                      </td>
                      {activeColdStorages.map(cs => {
                        const inward = getColdStorageInward(lot.id, cs.id);
                        const outward = getColdStorageOutward(lot.id, cs.id);
                        return (
                          <>
                            <td key={`ci-${lot.id}-${cs.id}`} className="border border-border px-3 py-2 text-center bg-blue-50/30 dark:bg-blue-950/10">
                              {inward > 0 ? (
                                <span className="text-green-700 dark:text-green-400 font-medium">{inward.toFixed(0)}</span>
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </td>
                            <td key={`co-${lot.id}-${cs.id}`} className="border border-border px-3 py-2 text-center bg-blue-50/30 dark:bg-blue-950/10">
                              {outward > 0 ? (
                                <span className="text-red-600 dark:text-red-400 font-medium">-{outward.toFixed(0)}</span>
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </td>
                          </>
                        );
                      })}
                      {plantLocations.length > 0 && (
                        <td className="border border-border px-3 py-2 text-center bg-orange-50/30 dark:bg-orange-950/10">
                          {plantBal > 0 ? (
                            <span className="text-orange-700 dark:text-orange-400 font-medium">{plantBal.toFixed(0)}</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </td>
                      )}
                      {officeLocations.length > 0 && (
                        <td className="border border-border px-3 py-2 text-center bg-purple-50/30 dark:bg-purple-950/10">
                          {officeBal > 0 ? (
                            <span className="text-purple-700 dark:text-purple-400 font-medium">{officeBal.toFixed(0)}</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}

                <tr className="bg-muted/50 font-bold">
                  <td className="border border-border px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground" colSpan={3}>
                    Total
                  </td>
                  <td className="border border-border px-3 py-2 text-center text-green-700 dark:text-green-400">
                    {filteredLots.reduce((s, l) => s + Number(l.initialQuantity || 0), 0).toFixed(0)}
                    <span className="text-xs font-normal text-muted-foreground ml-1">KG</span>
                  </td>
                  {activeColdStorages.map(cs => (
                    <>
                      <td key={`ct-in-${cs.id}`} className="border border-border px-3 py-2 text-center bg-blue-50/30 dark:bg-blue-950/10 text-green-700 dark:text-green-400">
                        {filteredLots.reduce((s, l) => s + getColdStorageInward(l.id, cs.id), 0).toFixed(0) !== "0"
                          ? filteredLots.reduce((s, l) => s + getColdStorageInward(l.id, cs.id), 0).toFixed(0)
                          : <span className="text-muted-foreground">-</span>}
                      </td>
                      <td key={`ct-out-${cs.id}`} className="border border-border px-3 py-2 text-center bg-blue-50/30 dark:bg-blue-950/10 text-red-600 dark:text-red-400">
                        {(() => {
                          const total = filteredLots.reduce((s, l) => s + getColdStorageOutward(l.id, cs.id), 0);
                          return total > 0 ? `-${total.toFixed(0)}` : <span className="text-muted-foreground">-</span>;
                        })()}
                      </td>
                    </>
                  ))}
                  {plantLocations.length > 0 && (
                    <td className="border border-border px-3 py-2 text-center bg-orange-50/30 dark:bg-orange-950/10 text-orange-700 dark:text-orange-400">
                      {filteredLots.reduce((s, l) => s + getLocationBalance(l.id, plantLocationIds), 0).toFixed(0)}
                    </td>
                  )}
                  {officeLocations.length > 0 && (
                    <td className="border border-border px-3 py-2 text-center bg-purple-50/30 dark:bg-purple-950/10 text-purple-700 dark:text-purple-400">
                      {filteredLots.reduce((s, l) => s + getLocationBalance(l.id, officeLocationIds), 0).toFixed(0)}
                    </td>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-blue-200 dark:bg-blue-800" />
          <span>Cold Storage</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-orange-200 dark:bg-orange-800" />
          <span>Plant Storage</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-purple-200 dark:bg-purple-800" />
          <span>Main Office</span>
        </div>
        <span className="ml-2">Green = Inward KG | Red = Outward KG</span>
      </div>
    </div>
  );
}
