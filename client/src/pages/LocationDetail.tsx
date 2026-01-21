import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, MapPin, Warehouse, Package, ArrowRightLeft, Leaf, Building2 } from "lucide-react";
import type { Location, Batch, StockMovement } from "@shared/schema";
import { format } from "date-fns";

type TabType = "details" | "crops" | "movements";

export default function LocationDetail() {
  const [, params] = useRoute("/locations/:id");
  const locationId = params?.id ? parseInt(params.id) : null;
  const [activeTab, setActiveTab] = useState<TabType>("details");

  const { data: location, isLoading: locationLoading } = useQuery<Location>({
    queryKey: ["/api/locations", locationId],
    queryFn: async () => {
      const res = await fetch(`/api/locations/${locationId}`);
      if (!res.ok) throw new Error("Failed to fetch location");
      return res.json();
    },
    enabled: !!locationId,
  });

  const { data: batches } = useQuery<Batch[]>({
    queryKey: ["/api/batches"],
  });

  const { data: movements } = useQuery<StockMovement[]>({
    queryKey: ["/api/stock/history"],
  });

  const locationMovements = movements?.filter(
    m => m.fromLocationId === locationId || m.toLocationId === locationId
  ) || [];

  const uniqueCrops = Array.from(new Set(batches?.map(b => b.crop) || []));

  if (locationLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  if (!location) {
    return <div className="p-8 text-center text-muted-foreground">Location not found</div>;
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
                  <p className="text-3xl font-bold text-green-600">{uniqueCrops.length}</p>
                  <p className="text-sm text-muted-foreground">Total Crops</p>
                </div>
                <div className="p-4 rounded-xl stat-gradient-blue text-center">
                  <p className="text-3xl font-bold text-blue-600">{locationMovements.length}</p>
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
              Crops at this Location
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Crop</TableHead>
                  <TableHead>Variety</TableHead>
                  <TableHead>Batch Number</TableHead>
                  <TableHead className="text-right">Quantity (KG)</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No crops found at this location
                    </TableCell>
                  </TableRow>
                ) : (
                  batches?.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30">
                            <Leaf className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="font-medium">{batch.crop}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-primary font-medium">{batch.variety}</TableCell>
                      <TableCell>{batch.batchNumber}</TableCell>
                      <TableCell className="text-right font-bold">{batch.currentQuantity}</TableCell>
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
                  <TableHead>Batch ID</TableHead>
                  <TableHead className="text-right">Quantity (KG)</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Responsible</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locationMovements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No movements recorded for this location
                    </TableCell>
                  </TableRow>
                ) : (
                  locationMovements.map((mov) => (
                    <TableRow key={mov.id}>
                      <TableCell>
                        {mov.movementDate ? format(new Date(mov.movementDate), "dd/MM/yyyy") : "-"}
                      </TableCell>
                      <TableCell className="font-medium">{mov.batchId}</TableCell>
                      <TableCell className="text-right font-bold">{mov.quantity}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={mov.fromLocationId === locationId ? "badge-danger" : ""}>
                          {mov.fromLocationId === locationId ? "This Location" : `Location #${mov.fromLocationId}`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={mov.toLocationId === locationId ? "badge-success" : ""}>
                          {mov.toLocationId === locationId ? "This Location" : `Location #${mov.toLocationId}`}
                        </Badge>
                      </TableCell>
                      <TableCell>{mov.responsiblePerson || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
