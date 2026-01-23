import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLocationSchema } from "@shared/schema";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, MapPin, Warehouse, Package, ArrowRightLeft, Leaf, Building2, Pencil, Trash2 } from "lucide-react";
import { useUpdateLocation, useDeleteLocation, useLots, useProducts, useStockBalances, useLocations } from "@/hooks/use-inventory";
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
import { useLocation as useWouterLocation } from "wouter";
import type { Location, Lot, Product, StockBalance, StockMovement } from "@shared/schema";
import { format } from "date-fns";

type TabType = "details" | "crops" | "movements";

export default function LocationDetail() {
  const [, params] = useRoute("/locations/:id");
  const locationId = params?.id ? parseInt(params.id) : null;
  const [activeTab, setActiveTab] = useState<TabType>("details");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [, navigate] = useWouterLocation();
  const { mutate: updateLocation, isPending: isUpdating } = useUpdateLocation();
  const { mutate: deleteLocation, isPending: isDeleting } = useDeleteLocation();

  const form = useForm<z.infer<typeof insertLocationSchema>>({
    resolver: zodResolver(insertLocationSchema),
    defaultValues: { name: "", type: "", capacity: undefined, address: "", isActive: true }
  });

  const { data: location, isLoading: locationLoading } = useQuery<Location>({
    queryKey: ["/api/locations", locationId],
    queryFn: async () => {
      const res = await fetch(`/api/locations/${locationId}`);
      if (!res.ok) throw new Error("Failed to fetch location");
      return res.json();
    },
    enabled: !!locationId,
  });

  const { data: lots } = useLots();
  const { data: products } = useProducts();
  const { data: stockBalances } = useStockBalances();
  const { data: allLocations } = useLocations();

  const { data: movements } = useQuery<StockMovement[]>({
    queryKey: ["/api/stock/history"],
  });

  const locationMovements = movements?.filter(
    m => m.fromLocationId === locationId || m.toLocationId === locationId
  ) || [];

  // Get stock balances for this location
  const locationStockBalances = (stockBalances as StockBalance[] || []).filter(
    sb => sb.locationId === locationId && Number(sb.quantity) > 0
  );

  // Get unique lots at this location
  const lotIdsAtLocation = Array.from(new Set(locationStockBalances.map(sb => sb.lotId)));
  const lotsAtLocation = (lots as Lot[] || []).filter(lot => lotIdsAtLocation.includes(lot.id));

  // Get unique crops/products at this location
  const productIdsAtLocation = Array.from(new Set(lotsAtLocation.map(lot => lot.productId)));
  const uniqueProducts = (products as Product[] || []).filter(p => productIdsAtLocation.includes(p.id));

  const getProductName = (productId: number) => {
    const product = (products as Product[] || []).find(p => p.id === productId);
    return product ? `${product.crop} - ${product.variety}` : '-';
  };

  const getLotNumber = (lotId: number | null) => {
    if (!lotId) return '-';
    const lot = (lots as Lot[] || []).find(l => l.id === lotId);
    return lot?.lotNumber || '-';
  };

  const getLocationName = (locId: number) => {
    const loc = (allLocations || []).find(l => l.id === locId);
    return loc?.name || `Location #${locId}`;
  };

  const getStockFormLabel = (form: string) => {
    switch (form) {
      case 'loose': return 'Raw Seeds';
      case 'cobs': return 'Cobs';
      case 'packed': return 'Packed';
      default: return form;
    }
  };

  // Calculate total stock at location
  const totalStockAtLocation = locationStockBalances.reduce((sum, sb) => sum + Number(sb.quantity), 0);

  useEffect(() => {
    if (location) {
      form.reset({
        name: location.name,
        type: location.type,
        capacity: location.capacity || undefined,
        address: location.address || "",
        isActive: location.isActive ?? true
      });
    }
  }, [location, form]);

  const onEditSubmit = (data: z.infer<typeof insertLocationSchema>) => {
    if (!locationId) return;
    updateLocation({ id: locationId, data }, {
      onSuccess: () => setEditOpen(false)
    });
  };

  const handleDelete = () => {
    if (!locationId) return;
    deleteLocation(locationId, {
      onSuccess: () => navigate("/locations")
    });
  };

  if (locationLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  if (!location) {
    return <div className="p-8 text-center text-muted-foreground">Warehouse not found</div>;
  }

  const getLocationIcon = (type: string) => {
    switch (type) {
      case "storage": return Warehouse;
      case "processing": return Building2;
      default: return MapPin;
    }
  };

  const Icon = getLocationIcon(location.type);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/locations">
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl stat-gradient-green">
              <Icon className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display">{location.name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Badge variant="secondary" className="badge-info capitalize">{location.type}</Badge>
                <span className="text-sm">{location.address || "No address"}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setEditOpen(true)} data-testid="button-edit-warehouse">
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)} data-testid="button-delete-warehouse">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Warehouse</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{location.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-delete-warehouse"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Warehouse</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Warehouse Name</label>
              <Input {...form.register("name")} placeholder="e.g., Warehouse A" data-testid="input-warehouse-name" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Input {...form.register("type")} placeholder="storage, processing, etc." data-testid="input-warehouse-type" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Capacity (optional)</label>
              <Input 
                type="number" 
                {...form.register("capacity", { 
                  setValueAs: (v) => v === "" || v === undefined ? undefined : Number(v)
                })} 
                data-testid="input-location-capacity" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Address</label>
              <Input {...form.register("address")} data-testid="input-location-address" />
            </div>
            <Button type="submit" className="w-full" disabled={isUpdating} data-testid="button-save-location">
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="flex gap-2 border-b border-primary/10 pb-1">
        <button
          onClick={() => setActiveTab("details")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === "details" 
              ? "bg-primary/10 text-primary border-b-2 border-primary" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
          data-testid="tab-details"
        >
          <Building2 className="w-4 h-4 inline mr-2" />
          Warehouse Details
        </button>
        <button
          onClick={() => setActiveTab("crops")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === "crops" 
              ? "bg-primary/10 text-primary border-b-2 border-primary" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
          data-testid="tab-crops"
        >
          <Leaf className="w-4 h-4 inline mr-2" />
          Crops List
        </button>
        <button
          onClick={() => setActiveTab("movements")}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === "movements" 
              ? "bg-primary/10 text-primary border-b-2 border-primary" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
          data-testid="tab-movements"
        >
          <ArrowRightLeft className="w-4 h-4 inline mr-2" />
          Stock Movement
        </button>
      </div>

      {activeTab === "details" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-green">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Location Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{location.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <Badge variant="secondary" className="badge-info capitalize">{location.type}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Capacity</p>
                  <p className="font-medium">{location.capacity || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={location.isActive ? "badge-success" : "badge-danger"}>
                    {location.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{location.address || "No address provided"}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-green">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl stat-gradient-green text-center">
                  <p className="text-3xl font-bold text-green-600">{uniqueProducts.length}</p>
                  <p className="text-sm text-muted-foreground">Crop Varieties</p>
                </div>
                <div className="p-4 rounded-xl stat-gradient-blue text-center">
                  <p className="text-3xl font-bold text-blue-600">{lotsAtLocation.length}</p>
                  <p className="text-sm text-muted-foreground">Active Lots</p>
                </div>
                <div className="p-4 rounded-xl stat-gradient-amber text-center">
                  <p className="text-3xl font-bold text-amber-600">{totalStockAtLocation.toFixed(0)}</p>
                  <p className="text-sm text-muted-foreground">Total Stock (KG)</p>
                </div>
                <div className="p-4 rounded-xl stat-gradient-purple text-center">
                  <p className="text-3xl font-bold text-purple-600">{locationMovements.length}</p>
                  <p className="text-sm text-muted-foreground">Movements</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "crops" && (
        <Card className="shadow-green">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-primary" />
              Stock at this Warehouse
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Lot Number</TableHead>
                  <TableHead>Crop</TableHead>
                  <TableHead>Variety</TableHead>
                  <TableHead>Stock Form</TableHead>
                  <TableHead className="text-right">Quantity (KG)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locationStockBalances.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No stock found at this warehouse
                    </TableCell>
                  </TableRow>
                ) : (
                  locationStockBalances.map((sb) => {
                    const lot = (lots as Lot[] || []).find(l => l.id === sb.lotId);
                    const product = lot ? (products as Product[] || []).find(p => p.id === lot.productId) : null;
                    return (
                      <TableRow key={sb.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30">
                              <Package className="w-4 h-4 text-green-600" />
                            </div>
                            <span className="font-mono font-medium">{lot?.lotNumber || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{product?.crop || '-'}</TableCell>
                        <TableCell className="text-primary font-medium">{product?.variety || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{getStockFormLabel(sb.stockForm)}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold">{Number(sb.quantity).toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeTab === "movements" && (
        <Card className="shadow-green">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-primary" />
              Stock Movement History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Date</TableHead>
                  <TableHead>Lot & Crop</TableHead>
                  <TableHead>Direction</TableHead>
                  <TableHead>Other Warehouse</TableHead>
                  <TableHead className="text-right">Quantity (KG)</TableHead>
                  <TableHead>Responsible</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locationMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No movements recorded for this warehouse
                    </TableCell>
                  </TableRow>
                ) : (
                  locationMovements.map((mov) => {
                    const lot = (lots as Lot[] || []).find(l => l.id === mov.lotId);
                    const product = lot ? (products as Product[] || []).find(p => p.id === lot.productId) : null;
                    const isOutgoing = mov.fromLocationId === locationId;
                    const otherLocationId = isOutgoing ? mov.toLocationId : mov.fromLocationId;
                    return (
                      <TableRow key={mov.id}>
                        <TableCell>
                          {mov.movementDate ? format(new Date(mov.movementDate), "dd/MM/yyyy") : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="font-mono font-medium">{lot?.lotNumber || '-'}</div>
                            <div className="text-xs text-muted-foreground">
                              {product ? `${product.crop} - ${product.variety}` : '-'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={isOutgoing ? "badge-danger" : "badge-success"}>
                            {isOutgoing ? "Outgoing" : "Incoming"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="font-medium">{getLocationName(otherLocationId)}</div>
                            <div className="text-xs text-muted-foreground">
                              {isOutgoing ? "Destination" : "Source"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold">{mov.quantity} kg</TableCell>
                        <TableCell>{mov.responsiblePerson || "-"}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
