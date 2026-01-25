import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowDownToLine, Package, Plus, Pencil, Trash2 } from "lucide-react";
import { getEmployeeToken } from "../EmployeeLogin";
import { EmployeePermissions, hasPermission } from "./EmployeeLayout";

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
  permissions?: EmployeePermissions;
}

export default function EmployeeInward({ employee, permissions = {} }: EmployeeProps) {
  const canCreate = hasPermission(permissions, "lots", "create");
  const canEdit = hasPermission(permissions, "lots", "edit");
  const canDelete = hasPermission(permissions, "lots", "delete");

  const { data: lots, isLoading } = useQuery({
    queryKey: ["/api/lots"],
    queryFn: async () => {
      const res = await fetch("/api/lots", { headers: getEmployeeAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch lots");
      return res.json();
    },
  });

  const { data: products } = useQuery({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const res = await fetch("/api/products", { headers: getEmployeeAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
  });

  const getProductName = (productId: number) => {
    const product = products?.find((p: { id: number }) => p.id === productId);
    return product ? `${product.crop} - ${product.variety}` : "Unknown";
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <ArrowDownToLine className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inward Records</h1>
            <p className="text-muted-foreground">View incoming seed lots</p>
          </div>
        </div>
        {canCreate && (
          <Button data-testid="button-add-inward">
            <Plus className="w-4 h-4 mr-2" />
            Add Inward
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Lot Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : lots?.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No inward records found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lot Number</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Quantity (KG)</TableHead>
                    <TableHead>Received Date</TableHead>
                    <TableHead>Status</TableHead>
                    {(canEdit || canDelete) && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lots?.map((lot: any) => (
                    <TableRow key={lot.id} data-testid={`row-lot-${lot.id}`}>
                      <TableCell className="font-medium">{lot.lotNumber}</TableCell>
                      <TableCell>{getProductName(lot.productId)}</TableCell>
                      <TableCell>{lot.source || "-"}</TableCell>
                      <TableCell>{lot.receivedQuantity?.toLocaleString()}</TableCell>
                      <TableCell>{formatDate(lot.receivedDate)}</TableCell>
                      <TableCell>
                        <Badge variant={lot.status === "active" ? "default" : "secondary"}>
                          {lot.status || "Active"}
                        </Badge>
                      </TableCell>
                      {(canEdit || canDelete) && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {canEdit && (
                              <Button size="icon" variant="ghost" data-testid={`button-edit-lot-${lot.id}`}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button size="icon" variant="ghost" className="text-destructive" data-testid={`button-delete-lot-${lot.id}`}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      )}
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
