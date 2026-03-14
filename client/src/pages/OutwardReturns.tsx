import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Lot, Product } from "@shared/schema";
import { useLots, useProducts, useDeleteOutwardReturn, useOutwardReturns } from "@/hooks/use-inventory";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RotateCcw, Trash2, Search, PackageOpen } from "lucide-react";
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

export default function OutwardReturns() {
  const { data: returns = [], isLoading } = useOutwardReturns();
  const { data: lots = [] } = useLots() as { data: Lot[] };
  const { data: products = [] } = useProducts() as { data: Product[] };
  const deleteReturn = useDeleteOutwardReturn();

  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const getLot = (lotId: number) => (lots as Lot[]).find(l => l.id === lotId);
  const getProduct = (productId: number) => (products as Product[]).find(p => p.id === productId);

  const filtered = (returns as any[]).filter(r => {
    if (!search.trim()) return true;
    const lot = getLot(r.lotId);
    const product = lot ? getProduct(lot.productId) : null;
    const searchLower = search.toLowerCase();
    return (
      lot?.lotNumber?.toLowerCase().includes(searchLower) ||
      product?.crop?.toLowerCase().includes(searchLower) ||
      product?.variety?.toLowerCase().includes(searchLower) ||
      r.returnedBy?.toLowerCase().includes(searchLower) ||
      r.reason?.toLowerCase().includes(searchLower)
    );
  });

  const sorted = [...filtered].sort((a, b) =>
    new Date(b.returnDate || b.createdAt).getTime() - new Date(a.returnDate || a.createdAt).getTime()
  );

  const totalReturned = (returns as any[]).reduce((s: number, r: any) => s + Number(r.quantity || 0), 0);

  const formatDate = (d: string) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
            <RotateCcw className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Return Stock</h1>
            <p className="text-sm text-muted-foreground">Track all stock returned after outward dispatch</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
            <PackageOpen className="h-3.5 w-3.5 mr-1.5" />
            {(returns as any[]).length} Returns &bull; {totalReturned.toFixed(0)} KG Total
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            data-testid="input-return-search"
            placeholder="Search by lot, crop, variety, returned by..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-40 text-muted-foreground">Loading return records...</div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
          <RotateCcw className="h-10 w-10 opacity-30" />
          <p className="text-sm">{search ? "No returns match your search." : "No return records yet. Use the Return Stock button on the Outward page to record a return."}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground">#</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground">Lot Number</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground">Crop / Variety</th>
                <th className="px-4 py-3 text-center font-semibold text-xs uppercase tracking-wide text-muted-foreground">Qty Returned (KG)</th>
                <th className="px-4 py-3 text-center font-semibold text-xs uppercase tracking-wide text-muted-foreground">Return Date</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground">Returned By</th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground">Reason</th>
                <th className="px-4 py-3 text-center font-semibold text-xs uppercase tracking-wide text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r: any, idx: number) => {
                const lot = getLot(r.lotId);
                const product = lot ? getProduct(lot.productId) : null;
                return (
                  <tr
                    key={r.id}
                    data-testid={`row-return-${r.id}`}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-muted-foreground">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono font-medium text-foreground">
                        {lot?.lotNumber || `Lot #${r.lotId}`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {product ? (
                        <div>
                          <div className="font-medium text-foreground">{product.crop}</div>
                          <div className="text-xs text-muted-foreground">{product.variety}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 font-semibold">
                        +{Number(r.quantity).toFixed(0)} KG
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{formatDate(r.returnDate)}</td>
                    <td className="px-4 py-3">
                      {r.returnedBy ? (
                        <span className="text-foreground">{r.returnedBy}</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.reason ? (
                        <span className="text-foreground line-clamp-2 max-w-[200px]">{r.reason}</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        data-testid={`btn-delete-return-${r.id}`}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={() => setDeleteId(r.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-muted/40 border-t-2 border-border font-semibold">
                <td colSpan={3} className="px-4 py-2.5 text-xs uppercase tracking-wide text-muted-foreground">
                  {sorted.length} record{sorted.length !== 1 ? "s" : ""}
                  {search ? " (filtered)" : ""}
                </td>
                <td className="px-4 py-2.5 text-center text-amber-700 dark:text-amber-300">
                  {sorted.reduce((s: number, r: any) => s + Number(r.quantity || 0), 0).toFixed(0)} KG
                </td>
                <td colSpan={4} />
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
              This will permanently remove the return entry. The quantity will be deducted back from the inward balance. This action cannot be undone.
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
