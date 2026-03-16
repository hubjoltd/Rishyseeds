import { useState } from "react";
import { Link } from "wouter";
import { useLocations, useCreateLocation, useDeleteLocation } from "@/hooks/use-inventory";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLocationSchema } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
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
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Plus, Warehouse, ChevronRight, Trash2 } from "lucide-react";
import { PaginationBar } from "@/components/PaginationBar";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/queryClient";

const PAGE_SIZE = 20;

export default function Locations() {
  const { data: locations, isLoading } = useLocations();
  const { mutate: createLocation, isPending } = useCreateLocation();
  const { mutate: deleteLocation } = useDeleteLocation();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof insertLocationSchema>>({
    resolver: zodResolver(insertLocationSchema),
    defaultValues: { isActive: true }
  });

  const onSubmit = (data: z.infer<typeof insertLocationSchema>) => {
    createLocation(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    });
  };

  const allLocations = locations || [];
  const totalPages = Math.ceil(allLocations.length / PAGE_SIZE);
  const paginated = allLocations.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const isAllSelected = paginated.length > 0 && paginated.every(l => selectedIds.has(l.id));
  const isSomeSelected = paginated.some(l => selectedIds.has(l.id));

  const toggleSelect = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        paginated.forEach(l => next.delete(l.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        paginated.forEach(l => next.add(l.id));
        return next;
      });
    }
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    const ids = Array.from(selectedIds);
    const token = getAuthToken();
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    let failed = 0;
    for (const id of ids) {
      try {
        const res = await fetch(`/api/locations/${id}`, { method: "DELETE", headers });
        if (!res.ok) failed++;
      } catch { failed++; }
    }
    await queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
    setBulkDeleting(false);
    setBulkDeleteOpen(false);
    setSelectedIds(new Set());
    if (failed === 0) {
      toast({ title: `Deleted ${ids.length} warehouse${ids.length > 1 ? "s" : ""}` });
    } else {
      toast({ title: `Deleted ${ids.length - failed}, failed ${failed}`, variant: "destructive" });
    }
    if (page > Math.ceil((allLocations.length - ids.length) / PAGE_SIZE)) setPage(1);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex justify-between items-center gap-4 flex-wrap">
        <div>
          <h2 className="text-3xl font-bold font-display text-primary">Warehouses</h2>
          <p className="text-muted-foreground">Storage and processing facilities</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteOpen(true)}
              data-testid="button-bulk-delete-warehouses"
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete Selected ({selectedIds.size})
            </Button>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-warehouse">
                <Plus className="mr-2 h-4 w-4" />
                Add Warehouse
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Warehouse</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Warehouse Name</label>
                  <Input {...form.register("name")} placeholder="e.g., Warehouse A" data-testid="input-warehouse-name" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <Input {...form.register("type")} placeholder="storage, processing, etc." />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Capacity (optional)</label>
                  <Input type="number" {...form.register("capacity", { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Address</label>
                  <Input {...form.register("address")} />
                </div>
                <Button type="submit" className="w-full" disabled={isPending} data-testid="button-submit-warehouse">
                  {isPending ? "Adding..." : "Add Warehouse"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Select all bar (only shown when there are items) */}
      {!isLoading && allLocations.length > 0 && (
        <div className="flex items-center gap-3 px-1">
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={toggleSelectAll}
            id="select-all-warehouses"
            data-testid="checkbox-select-all-warehouses"
          />
          <label htmlFor="select-all-warehouses" className="text-sm text-muted-foreground cursor-pointer select-none">
            {isAllSelected ? "Deselect all on this page" : "Select all on this page"}
          </label>
          {selectedIds.size > 0 && (
            <span className="text-sm font-medium text-destructive ml-2">{selectedIds.size} selected</span>
          )}
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {paginated.map((loc) => (
            <div key={loc.id} className="relative group">
              {/* Checkbox overlay */}
              <div
                className="absolute top-3 left-3 z-10"
                onClick={(e) => toggleSelect(loc.id, e)}
              >
                <Checkbox
                  checked={selectedIds.has(loc.id)}
                  onCheckedChange={() => {}}
                  data-testid={`checkbox-warehouse-${loc.id}`}
                  className="bg-white shadow-sm"
                />
              </div>

              <Link href={`/locations/${loc.id}`}>
                <Card
                  className={`cursor-pointer hover:shadow-lg transition-all duration-200 group ${selectedIds.has(loc.id) ? "ring-2 ring-destructive/60 bg-destructive/5" : ""}`}
                  data-testid={`card-location-${loc.id}`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4 pl-6">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${selectedIds.has(loc.id) ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                          <Warehouse className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{loc.name}</h3>
                          <p className="text-sm text-muted-foreground uppercase tracking-wider text-xs font-semibold">{loc.type}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground pl-6">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="line-clamp-2">{loc.address || "No address provided"}</span>
                      </div>
                      {loc.capacity && (
                        <div className="font-medium text-foreground">
                          Capacity: {loc.capacity} Units
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && allLocations.length > 0 && (
        <div className="border rounded-lg bg-card">
          <PaginationBar
            page={page}
            total={allLocations.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} Warehouse{selectedIds.size > 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected warehouse{selectedIds.size > 1 ? "s" : ""}.
              This action cannot be undone. Any stock data linked to these warehouses may be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-bulk-delete"
            >
              {bulkDeleting ? "Deleting..." : `Delete ${selectedIds.size}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
