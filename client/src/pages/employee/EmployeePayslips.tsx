import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Download, Loader2, IndianRupee, Printer, Eye, Building2, Calendar, User, Banknote } from "lucide-react";
import { getEmployeeToken } from "../EmployeeLogin";
import logo from "@assets/image_1773664509659.png";

function getEmployeeAuthHeaders(): Record<string, string> {
  const token = getEmployeeToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface EmployeePayslipsProps {
  employee: any;
}

function generatePayslipHTML(payslip: any, employee: any) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Salary Slip - ${payslip.month}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; padding: 20px; }
    .payslip { max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #166534 0%, #15803d 100%); color: white; padding: 30px; display: flex; justify-content: space-between; align-items: center; }
    .company-info h1 { font-size: 24px; margin-bottom: 5px; }
    .company-info p { opacity: 0.9; font-size: 12px; }
    .slip-info { text-align: right; }
    .slip-info .month { font-size: 20px; font-weight: bold; }
    .slip-info .date { opacity: 0.9; font-size: 12px; margin-top: 5px; }
    .employee-section { padding: 25px 30px; background: #f8fdf8; border-bottom: 1px solid #e5e7eb; }
    .employee-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    .info-item label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-item p { font-size: 14px; font-weight: 600; color: #1f2937; margin-top: 2px; }
    .salary-section { padding: 30px; }
    .salary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
    .earnings, .deductions { background: #fafafa; border-radius: 8px; padding: 20px; }
    .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid; }
    .earnings .section-title { color: #166534; border-color: #166534; }
    .deductions .section-title { color: #dc2626; border-color: #dc2626; }
    .salary-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e5e7eb; }
    .salary-item:last-child { border-bottom: none; }
    .salary-item span:first-child { color: #4b5563; }
    .salary-item span:last-child { font-weight: 600; }
    .earnings .salary-item span:last-child { color: #166534; }
    .deductions .salary-item span:last-child { color: #dc2626; }
    .totals-section { margin-top: 20px; padding-top: 15px; border-top: 2px solid #e5e7eb; }
    .total-item { display: flex; justify-content: space-between; font-size: 15px; font-weight: 700; }
    .net-salary { background: linear-gradient(135deg, #166534 0%, #15803d 100%); color: white; margin: 30px; padding: 25px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; }
    .net-salary .label { font-size: 14px; opacity: 0.9; }
    .net-salary .amount { font-size: 32px; font-weight: 800; }
    .footer { text-align: center; padding: 20px; background: #f9fafb; color: #6b7280; font-size: 11px; }
    .footer p { margin: 3px 0; }
    @media print {
      body { background: white; padding: 0; }
      .payslip { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="payslip">
    <div class="header">
      <div class="company-info">
        <h1>RISHI HYBRID SEEDS PVT LTD</h1>
        <p>Sy no. 713, Plot no. 38 Part-Devarayamjal Village</p>
        <p>Shameerpet Medchal-Malkajgiri Dist, Secunderabad, Telangana-500078</p>
      </div>
      <div class="slip-info">
        <div class="month">${payslip.month}</div>
        <div class="date">Salary Slip</div>
      </div>
    </div>
    
    <div class="employee-section">
      <div class="employee-grid">
        <div class="info-item">
          <label>Employee Name</label>
          <p>${employee.fullName}</p>
        </div>
        <div class="info-item">
          <label>Employee ID</label>
          <p>${employee.employeeId}</p>
        </div>
        <div class="info-item">
          <label>Designation</label>
          <p>${employee.role || 'Employee'}</p>
        </div>
        <div class="info-item">
          <label>Department</label>
          <p>${employee.department || '-'}</p>
        </div>
        <div class="info-item">
          <label>Work Location</label>
          <p>${employee.workLocation || '-'}</p>
        </div>
        <div class="info-item">
          <label>Payment Mode</label>
          <p>Bank Transfer</p>
        </div>
      </div>
    </div>
    
    <div class="salary-section">
      <div class="salary-grid">
        <div class="earnings">
          <div class="section-title">Earnings</div>
          <div class="salary-item">
            <span>Basic Salary</span>
            <span>₹${Number(payslip.basicSalary || 0).toLocaleString('en-IN')}</span>
          </div>
          <div class="salary-item">
            <span>House Rent Allowance (HRA)</span>
            <span>₹${Number(payslip.hra || employee.hra || 0).toLocaleString('en-IN')}</span>
          </div>
          <div class="salary-item">
            <span>Dearness Allowance (DA)</span>
            <span>₹${Number(payslip.da || employee.da || 0).toLocaleString('en-IN')}</span>
          </div>
          <div class="salary-item">
            <span>Other Allowances</span>
            <span>₹${Number(payslip.otherAllowances || employee.otherAllowances || 0).toLocaleString('en-IN')}</span>
          </div>
          <div class="totals-section">
            <div class="total-item">
              <span>Gross Earnings</span>
              <span style="color: #166534;">₹${Number(payslip.basicSalary + (payslip.totalAllowances || 0)).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
        
        <div class="deductions">
          <div class="section-title">Deductions</div>
          <div class="salary-item">
            <span>Provident Fund (PF)</span>
            <span>₹${Number(payslip.pfDeduction || employee.pfDeduction || 0).toLocaleString('en-IN')}</span>
          </div>
          <div class="salary-item">
            <span>ESI</span>
            <span>₹${Number(payslip.esiDeduction || employee.esiDeduction || 0).toLocaleString('en-IN')}</span>
          </div>
          <div class="salary-item">
            <span>Professional Tax</span>
            <span>₹${Number(payslip.professionalTax || 200).toLocaleString('en-IN')}</span>
          </div>
          <div class="salary-item">
            <span>TDS</span>
            <span>₹${Number(payslip.tdsDeduction || employee.tdsDeduction || 0).toLocaleString('en-IN')}</span>
          </div>
          <div class="totals-section">
            <div class="total-item">
              <span>Total Deductions</span>
              <span style="color: #dc2626;">₹${Number(payslip.totalDeductions || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="net-salary">
      <div>
        <div class="label">Net Salary Payable</div>
        <div style="font-size: 12px; opacity: 0.8; margin-top: 4px;">Amount credited to bank account</div>
      </div>
      <div class="amount">₹${Number(payslip.netSalary || 0).toLocaleString('en-IN')}</div>
    </div>
    
    <div class="footer">
      <p>This is a computer-generated salary slip and does not require a signature.</p>
      <p>For any queries, please contact the HR department.</p>
      <p style="margin-top: 10px; font-weight: 600;">RISHI HYBRID SEEDS PVT LTD</p>
    </div>
  </div>
</body>
</html>`;
}

export default function EmployeePayslips({ employee }: EmployeePayslipsProps) {
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const { data: payslips, isLoading } = useQuery({
    queryKey: ["/api/employee/payslips"],
    queryFn: async () => {
      const res = await fetch("/api/employee/payslips", { headers: getEmployeeAuthHeaders() });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const handleView = (payslip: any) => {
    setSelectedPayslip(payslip);
    setViewDialogOpen(true);
  };

  const handlePrint = (payslip: any) => {
    const html = generatePayslipHTML(payslip, employee);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const handleDownload = (payslip: any) => {
    const html = generatePayslipHTML(payslip, employee);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Salary_Slip_${employee.employeeId}_${payslip.month.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const totalEarnings = payslips?.reduce((sum: number, p: any) => sum + Number(p.netSalary || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-xl">
          <Banknote className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Salary Slips</h1>
          <p className="text-muted-foreground">View, print and download your salary slips</p>
        </div>
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
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No salary slips available yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Payslips will appear here after payroll is processed</p>
            </div>
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
                    <TableHead className="text-right">Actions</TableHead>
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
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleView(payslip)}
                            title="View"
                            data-testid={`button-view-payslip-${payslip.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handlePrint(payslip)}
                            title="Print"
                            data-testid={`button-print-payslip-${payslip.id}`}
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDownload(payslip)}
                            title="Download"
                            data-testid={`button-download-payslip-${payslip.id}`}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Salary Slip - {selectedPayslip?.month}
            </DialogTitle>
          </DialogHeader>
          {selectedPayslip && (
            <div className="bg-white rounded-lg overflow-hidden border">
              <div className="bg-gradient-to-r from-green-700 to-green-600 text-white p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold">RISHI HYBRID SEEDS PVT LTD</h2>
                    <p className="text-sm opacity-90 mt-1">Sy no. 713, Plot no. 38 Part-Devarayamjal Village</p>
                    <p className="text-sm opacity-90">Shameerpet Medchal-Malkajgiri Dist, Telangana-500078</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{selectedPayslip.month}</p>
                    <p className="text-sm opacity-90">Salary Slip</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-green-50/50 border-b">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Employee Name</p>
                    <p className="font-semibold">{employee.fullName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Employee ID</p>
                    <p className="font-semibold">{employee.employeeId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Designation</p>
                    <p className="font-semibold">{employee.role || 'Employee'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Department</p>
                    <p className="font-semibold">{employee.department || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Work Location</p>
                    <p className="font-semibold">{employee.workLocation || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Payment Mode</p>
                    <p className="font-semibold">Bank Transfer</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-bold text-green-700 border-b-2 border-green-600 pb-2 mb-3 uppercase tracking-wide text-sm">Earnings</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Basic Salary</span>
                        <span className="font-medium text-green-700">₹{Number(selectedPayslip.basicSalary || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">HRA</span>
                        <span className="font-medium text-green-700">₹{Number(employee.hra || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">DA</span>
                        <span className="font-medium text-green-700">₹{Number(employee.da || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Other Allowances</span>
                        <span className="font-medium text-green-700">₹{Number(employee.otherAllowances || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-green-200 font-bold">
                        <span>Gross Earnings</span>
                        <span className="text-green-700">₹{Number(Number(selectedPayslip.basicSalary || 0) + Number(selectedPayslip.totalAllowances || 0)).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 rounded-lg p-4">
                    <h3 className="font-bold text-red-700 border-b-2 border-red-600 pb-2 mb-3 uppercase tracking-wide text-sm">Deductions</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Provident Fund</span>
                        <span className="font-medium text-red-700">₹{Number(employee.pfDeduction || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ESI</span>
                        <span className="font-medium text-red-700">₹{Number(employee.esiDeduction || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Professional Tax</span>
                        <span className="font-medium text-red-700">₹200</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">TDS</span>
                        <span className="font-medium text-red-700">₹{Number(employee.tdsDeduction || 0).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-red-200 font-bold">
                        <span>Total Deductions</span>
                        <span className="text-red-700">₹{Number(selectedPayslip.totalDeductions || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-gradient-to-r from-green-700 to-green-600 text-white rounded-xl p-6 flex justify-between items-center">
                  <div>
                    <p className="text-sm opacity-90">Net Salary Payable</p>
                    <p className="text-xs opacity-75 mt-1">Amount credited to bank account</p>
                  </div>
                  <p className="text-3xl font-bold">₹{Number(selectedPayslip.netSalary || 0).toLocaleString('en-IN')}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 text-center text-sm text-muted-foreground border-t">
                <p>This is a computer-generated salary slip and does not require a signature.</p>
                <p className="mt-1">For any queries, please contact the HR department.</p>
              </div>

              <div className="p-4 flex justify-end gap-2 border-t">
                <Button variant="outline" onClick={() => handlePrint(selectedPayslip)}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button onClick={() => handleDownload(selectedPayslip)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
