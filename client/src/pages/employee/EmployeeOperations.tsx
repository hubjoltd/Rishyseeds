import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, Cog, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { getEmployeeToken } from "../EmployeeLogin";

function getEmployeeAuthHeaders(): Record<string, string> {
  const token = getEmployeeToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface EmployeeOperationsProps {
  employee: {
    fullName: string;
    employeeId: string;
  };
}

export default function EmployeeOperations({ employee }: EmployeeOperationsProps) {
  const { data: operations, isLoading } = useQuery({
    queryKey: ["/api/employee/operations"],
    queryFn: async () => {
      const res = await fetch("/api/employee/operations", { headers: getEmployeeAuthHeaders() });
      if (!res.ok) return { processing: [], packaging: [], outward: [] };
      return res.json();
    },
  });

  const processingCount = operations?.processing?.length || 0;
  const packagingCount = operations?.packaging?.length || 0;
  const outwardCount = operations?.outward?.length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Operations</h1>
        <p className="text-muted-foreground">View your work history and operations</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Cog className="w-4 h-4" /> Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{processingCount}</p>
            <p className="text-xs text-muted-foreground">Tasks completed</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="w-4 h-4" /> Packaging
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{packagingCount}</p>
            <p className="text-xs text-muted-foreground">Packages created</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Truck className="w-4 h-4" /> Dispatch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">{outwardCount}</p>
            <p className="text-xs text-muted-foreground">Shipments handled</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {processingCount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cog className="w-5 h-5 text-green-600" />
                  Processing Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Lot Number</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Input Qty</TableHead>
                        <TableHead>Output Qty</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {operations?.processing?.slice(0, 10).map((op: any) => (
                        <TableRow key={op.id}>
                          <TableCell>{format(new Date(op.createdAt), "MMM d, yyyy")}</TableCell>
                          <TableCell className="font-medium">{op.lotNumber}</TableCell>
                          <TableCell>{op.processingType}</TableCell>
                          <TableCell>{op.inputQuantity} KG</TableCell>
                          <TableCell>{op.outputQuantity} KG</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-700">Completed</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {packagingCount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-green-600" />
                  Packaging Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Lot Number</TableHead>
                        <TableHead>Package Size</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {operations?.packaging?.slice(0, 10).map((op: any) => (
                        <TableRow key={op.id}>
                          <TableCell>{format(new Date(op.createdAt), "MMM d, yyyy")}</TableCell>
                          <TableCell className="font-medium">{op.lotNumber}</TableCell>
                          <TableCell>{op.packageSize}</TableCell>
                          <TableCell>{op.quantity}</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-700">Completed</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {outwardCount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-amber-600" />
                  Dispatch Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Lot Number</TableHead>
                        <TableHead>Destination</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {operations?.outward?.slice(0, 10).map((op: any) => (
                        <TableRow key={op.id}>
                          <TableCell>{format(new Date(op.createdAt), "MMM d, yyyy")}</TableCell>
                          <TableCell className="font-medium">{op.lotNumber}</TableCell>
                          <TableCell>{op.destination}</TableCell>
                          <TableCell>{op.quantity} KG</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-700">Dispatched</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {processingCount === 0 && packagingCount === 0 && outwardCount === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No operations recorded yet</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
