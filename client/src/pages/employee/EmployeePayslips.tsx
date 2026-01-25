import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Loader2, IndianRupee } from "lucide-react";
import { format } from "date-fns";
import { getEmployeeToken } from "../EmployeeLogin";

function getEmployeeAuthHeaders(): Record<string, string> {
  const token = getEmployeeToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface EmployeePayslipsProps {
  employee: {
    fullName: string;
    employeeId: string;
  };
}

export default function EmployeePayslips({ employee }: EmployeePayslipsProps) {
  const { data: payslips, isLoading } = useQuery({
    queryKey: ["/api/employee/payslips"],
    queryFn: async () => {
      const res = await fetch("/api/employee/payslips", { headers: getEmployeeAuthHeaders() });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const handleDownload = async (payslipId: number, month: string) => {
    try {
      const res = await fetch(`/api/employee/payslips/${payslipId}/download`, {
        headers: getEmployeeAuthHeaders(),
      });
      if (!res.ok) throw new Error("Download failed");
      
      const html = await res.text();
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payslip-${month}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  const totalEarnings = payslips?.reduce((sum: number, p: any) => sum + Number(p.netSalary || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payslips</h1>
        <p className="text-muted-foreground">View and download your salary slips</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" /> Total Payslips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{payslips?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Available for download</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <IndianRupee className="w-4 h-4" /> Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">
              ₹{totalEarnings.toLocaleString("en-IN")}
            </p>
            <p className="text-xs text-muted-foreground">Net salary received</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Salary Slips
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : payslips?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No payslips available yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Basic Salary</TableHead>
                    <TableHead>Allowances</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payslips?.map((payslip: any) => (
                    <TableRow key={payslip.id}>
                      <TableCell className="font-medium">{payslip.month}</TableCell>
                      <TableCell>₹{Number(payslip.basicSalary || 0).toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-green-600">
                        +₹{Number(payslip.totalAllowances || 0).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-red-600">
                        -₹{Number(payslip.totalDeductions || 0).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="font-bold">
                        ₹{Number(payslip.netSalary || 0).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell>
                        <Badge className={payslip.status === "paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>
                          {payslip.status === "paid" ? "Paid" : "Pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(payslip.id, payslip.month)}
                          data-testid={`button-download-payslip-${payslip.id}`}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </TableCell>
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
