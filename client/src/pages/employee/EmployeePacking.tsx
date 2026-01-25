import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Boxes, Package } from "lucide-react";
import { getEmployeeToken } from "../EmployeeLogin";

function getEmployeeAuthHeaders(): Record<string, string> {
  const token = getEmployeeToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface EmployeeProps {
  employee: {
    id: number;
    fullName: string;
    employeeId: string;
  };
}

export default function EmployeePacking({ employee }: EmployeeProps) {
  const { data: packaging, isLoading } = useQuery({
    queryKey: ["/api/packaging-outputs"],
    queryFn: async () => {
      const res = await fetch("/api/packaging-outputs", { headers: getEmployeeAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch packaging records");
      return res.json();
    },
  });

  const { data: lots } = useQuery({
    queryKey: ["/api/lots"],
    queryFn: async () => {
      const res = await fetch("/api/lots", { headers: getEmployeeAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch lots");
      return res.json();
    },
  });

  const { data: packagingSizes } = useQuery({
    queryKey: ["/api/packaging-sizes"],
    queryFn: async () => {
      const res = await fetch("/api/packaging-sizes", { headers: getEmployeeAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch packaging sizes");
      return res.json();
    },
  });

  const getLotNumber = (lotId: number) => {
    const lot = lots?.find((l: any) => l.id === lotId);
    return lot?.lotNumber || "Unknown";
  };

  const getPackageSize = (sizeId: number) => {
    const size = packagingSizes?.find((s: any) => s.id === sizeId);
    return size ? `${size.size} ${size.unit}` : "Unknown";
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Boxes className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Packing Records</h1>
          <p className="text-muted-foreground">View packaging activities</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Packaging Output
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : packaging?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No packing records found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lot Number</TableHead>
                    <TableHead>Package Size</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Input (KG)</TableHead>
                    <TableHead>Waste (KG)</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {packaging?.map((record: any) => (
                    <TableRow key={record.id} data-testid={`row-packing-${record.id}`}>
                      <TableCell className="font-medium">{getLotNumber(record.lotId)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{getPackageSize(record.packagingSizeId)}</Badge>
                      </TableCell>
                      <TableCell>{record.quantity?.toLocaleString()} bags</TableCell>
                      <TableCell>{record.inputQuantity?.toLocaleString()}</TableCell>
                      <TableCell>{record.wasteQuantity?.toLocaleString() || 0}</TableCell>
                      <TableCell>{formatDate(record.packagingDate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
