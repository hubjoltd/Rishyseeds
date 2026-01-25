import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Truck, MapPin } from "lucide-react";
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

const stateNames: Record<string, string> = {
  AP: "Andhra Pradesh",
  TS: "Telangana",
  MP: "Madhya Pradesh",
  UP: "Uttar Pradesh",
  KA: "Karnataka",
  CG: "Chhattisgarh",
};

export default function EmployeeOutward({ employee }: EmployeeProps) {
  const { data: outward, isLoading } = useQuery({
    queryKey: ["/api/outward"],
    queryFn: async () => {
      const res = await fetch("/api/outward", { headers: getEmployeeAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch outward records");
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

  const getLotNumber = (lotId: number) => {
    const lot = lots?.find((l: any) => l.id === lotId);
    return lot?.lotNumber || "Unknown";
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Truck className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Outward / Dispatch</h1>
          <p className="text-muted-foreground">View dispatch records</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Dispatch Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : outward?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No outward records found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lot Number</TableHead>
                    <TableHead>Variety</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Quantity (KG)</TableHead>
                    <TableHead>Vehicle No.</TableHead>
                    <TableHead>Dispatch Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outward?.map((record: any) => (
                    <TableRow key={record.id} data-testid={`row-outward-${record.id}`}>
                      <TableCell className="font-medium">{getLotNumber(record.lotId)}</TableCell>
                      <TableCell>{record.variety || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {stateNames[record.destination] || record.destination}
                        </Badge>
                      </TableCell>
                      <TableCell>{record.quantity?.toLocaleString()}</TableCell>
                      <TableCell>{record.vehicleNumber || "-"}</TableCell>
                      <TableCell>{formatDate(record.dispatchDate)}</TableCell>
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
