import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Factory } from "lucide-react";
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

export default function EmployeeProcessing({ employee }: EmployeeProps) {
  const { data: processing, isLoading } = useQuery({
    queryKey: ["/api/processing"],
    queryFn: async () => {
      const res = await fetch("/api/processing", { headers: getEmployeeAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch processing records");
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
          <Factory className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Processing Records</h1>
          <p className="text-muted-foreground">View seed processing activities</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Factory className="w-5 h-5" />
            Processing Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : processing?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No processing records found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Input Lot</TableHead>
                    <TableHead>Process Type</TableHead>
                    <TableHead>Input Qty (KG)</TableHead>
                    <TableHead>Output Qty (KG)</TableHead>
                    <TableHead>Waste (KG)</TableHead>
                    <TableHead>Processed By</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processing?.map((record: any) => (
                    <TableRow key={record.id} data-testid={`row-processing-${record.id}`}>
                      <TableCell className="font-medium">{getLotNumber(record.inputLotId)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.processingType}</Badge>
                      </TableCell>
                      <TableCell>{record.inputQuantity?.toLocaleString()}</TableCell>
                      <TableCell>{record.outputQuantity?.toLocaleString()}</TableCell>
                      <TableCell>{record.wasteQuantity?.toLocaleString() || 0}</TableCell>
                      <TableCell>{record.processedBy || "-"}</TableCell>
                      <TableCell>{formatDate(record.processingDate)}</TableCell>
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
