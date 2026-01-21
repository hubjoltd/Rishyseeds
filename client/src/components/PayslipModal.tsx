import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import logo from "@assets/20260121014034_1768984704057.webp";
import type { Payroll, Employee } from "@shared/routes";

interface PayslipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payroll: Payroll | null;
  employee?: Employee | null;
}

export function PayslipModal({ open, onOpenChange, payroll, employee }: PayslipModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!payroll) return null;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payslip - ${payroll.month}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Arial', sans-serif; padding: 40px; color: #1a1a1a; }
            .payslip { max-width: 800px; margin: 0 auto; border: 2px solid #16a34a; padding: 30px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #16a34a; padding-bottom: 20px; margin-bottom: 30px; }
            .logo img { height: 60px; }
            .company-info { text-align: right; }
            .company-info h1 { color: #16a34a; font-size: 24px; margin-bottom: 5px; }
            .company-info p { color: #666; font-size: 12px; }
            .title { text-align: center; margin-bottom: 30px; }
            .title h2 { color: #16a34a; font-size: 20px; border-bottom: 1px solid #ddd; display: inline-block; padding-bottom: 5px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .info-box { background: #f9f9f9; padding: 15px; border-radius: 8px; }
            .info-box h3 { font-size: 12px; color: #666; margin-bottom: 5px; text-transform: uppercase; }
            .info-box p { font-size: 16px; font-weight: 600; }
            .salary-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .salary-table th, .salary-table td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #e5e5e5; }
            .salary-table th { background: #f0fdf4; color: #16a34a; font-size: 12px; text-transform: uppercase; }
            .salary-table .amount { text-align: right; font-weight: 600; }
            .salary-table .total { background: #16a34a; color: white; }
            .salary-table .total td { font-size: 18px; font-weight: 700; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; }
            .footer p { color: #999; font-size: 11px; }
            .signature { margin-top: 50px; display: flex; justify-content: space-between; }
            .signature-box { text-align: center; }
            .signature-line { width: 150px; border-top: 1px solid #333; margin-top: 40px; padding-top: 5px; }
            @media print { body { padding: 0; } .payslip { border: none; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Payslip Preview</span>
            <Button onClick={handlePrint} size="sm" data-testid="button-print-payslip">
              <Printer className="w-4 h-4 mr-2" />
              Print / Download PDF
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="payslip bg-white p-8 border-2 border-primary rounded-lg">
          {/* Header with Logo */}
          <div className="header flex justify-between items-center border-b-2 border-primary pb-6 mb-8">
            <div className="logo">
              <img src={logo} alt="Rishi Seeds" className="h-16 object-contain" />
            </div>
            <div className="company-info text-right">
              <h1 className="text-2xl font-bold text-primary">Rishi Seeds Pvt. Ltd.</h1>
              <p className="text-sm text-muted-foreground">Agricultural Excellence Since 1985</p>
              <p className="text-xs text-muted-foreground mt-1">GSTIN: 29AAAAA0000A1Z5</p>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-primary inline-block border-b-2 border-primary/30 pb-1">
              SALARY SLIP FOR {payroll.month.toUpperCase()}
            </h2>
          </div>

          {/* Employee Info Grid */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="text-xs text-muted-foreground uppercase mb-1">Employee ID</h3>
              <p className="font-semibold">{employee?.employeeId || `EMP-${payroll.employeeId}`}</p>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="text-xs text-muted-foreground uppercase mb-1">Employee Name</h3>
              <p className="font-semibold">{employee?.fullName || 'Employee'}</p>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="text-xs text-muted-foreground uppercase mb-1">Department</h3>
              <p className="font-semibold">{employee?.department || 'Operations'}</p>
            </div>
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="text-xs text-muted-foreground uppercase mb-1">Designation</h3>
              <p className="font-semibold">{employee?.role || 'Staff'}</p>
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-primary">{payroll.totalDays}</p>
              <p className="text-xs text-muted-foreground">Total Days</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-green-600">{payroll.presentDays}</p>
              <p className="text-xs text-muted-foreground">Present Days</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-2xl font-bold text-orange-500">{Number(payroll.totalDays) - Number(payroll.presentDays)}</p>
              <p className="text-xs text-muted-foreground">Leave Days</p>
            </div>
          </div>

          {/* Salary Table - Earnings and Deductions side by side */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Earnings Column */}
            <div>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-green-50">
                    <th className="text-left p-3 text-green-700 text-sm uppercase">Earnings</th>
                    <th className="text-right p-3 text-green-700 text-sm uppercase">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2 text-sm">Basic Salary</td>
                    <td className="p-2 text-right font-semibold">{Number(payroll.basicPay).toLocaleString()}</td>
                  </tr>
                  {employee?.hra && Number(employee.hra) > 0 && (
                    <tr className="border-b">
                      <td className="p-2 text-sm">House Rent Allowance (HRA)</td>
                      <td className="p-2 text-right font-semibold">{Number(employee.hra).toLocaleString()}</td>
                    </tr>
                  )}
                  {employee?.da && Number(employee.da) > 0 && (
                    <tr className="border-b">
                      <td className="p-2 text-sm">Dearness Allowance (DA)</td>
                      <td className="p-2 text-right font-semibold">{Number(employee.da).toLocaleString()}</td>
                    </tr>
                  )}
                  {employee?.travelAllowance && Number(employee.travelAllowance) > 0 && (
                    <tr className="border-b">
                      <td className="p-2 text-sm">Travel Allowance</td>
                      <td className="p-2 text-right font-semibold">{Number(employee.travelAllowance).toLocaleString()}</td>
                    </tr>
                  )}
                  {employee?.medicalAllowance && Number(employee.medicalAllowance) > 0 && (
                    <tr className="border-b">
                      <td className="p-2 text-sm">Medical Allowance</td>
                      <td className="p-2 text-right font-semibold">{Number(employee.medicalAllowance).toLocaleString()}</td>
                    </tr>
                  )}
                  {employee?.otherAllowances && Number(employee.otherAllowances) > 0 && (
                    <tr className="border-b">
                      <td className="p-2 text-sm">Other Allowances</td>
                      <td className="p-2 text-right font-semibold">{Number(employee.otherAllowances).toLocaleString()}</td>
                    </tr>
                  )}
                  {Number(payroll.overtimeAmount || 0) > 0 && (
                    <tr className="border-b">
                      <td className="p-2 text-sm">Overtime Pay</td>
                      <td className="p-2 text-right font-semibold">{Number(payroll.overtimeAmount).toLocaleString()}</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-green-100">
                    <td className="p-3 font-bold text-green-700">Total Earnings</td>
                    <td className="p-3 text-right font-bold text-green-700">
                      ₹{(
                        Number(payroll.basicPay) + 
                        Number(employee?.hra || 0) + 
                        Number(employee?.da || 0) + 
                        Number(employee?.travelAllowance || 0) + 
                        Number(employee?.medicalAllowance || 0) +
                        Number(employee?.otherAllowances || 0) +
                        Number(payroll.overtimeAmount || 0)
                      ).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Deductions Column */}
            <div>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-red-50">
                    <th className="text-left p-3 text-red-700 text-sm uppercase">Deductions</th>
                    <th className="text-right p-3 text-red-700 text-sm uppercase">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {employee?.pfDeduction && Number(employee.pfDeduction) > 0 && (
                    <tr className="border-b">
                      <td className="p-2 text-sm">Provident Fund (PF)</td>
                      <td className="p-2 text-right font-semibold">{Number(employee.pfDeduction).toLocaleString()}</td>
                    </tr>
                  )}
                  {employee?.esiDeduction && Number(employee.esiDeduction) > 0 && (
                    <tr className="border-b">
                      <td className="p-2 text-sm">ESI</td>
                      <td className="p-2 text-right font-semibold">{Number(employee.esiDeduction).toLocaleString()}</td>
                    </tr>
                  )}
                  {employee?.tdsDeduction && Number(employee.tdsDeduction) > 0 && (
                    <tr className="border-b">
                      <td className="p-2 text-sm">TDS</td>
                      <td className="p-2 text-right font-semibold">{Number(employee.tdsDeduction).toLocaleString()}</td>
                    </tr>
                  )}
                  {employee?.otherDeductions && Number(employee.otherDeductions) > 0 && (
                    <tr className="border-b">
                      <td className="p-2 text-sm">Other Deductions</td>
                      <td className="p-2 text-right font-semibold">{Number(employee.otherDeductions).toLocaleString()}</td>
                    </tr>
                  )}
                  {Number(payroll.deductions || 0) > 0 && (
                    <tr className="border-b">
                      <td className="p-2 text-sm">Monthly Deductions</td>
                      <td className="p-2 text-right font-semibold">{Number(payroll.deductions).toLocaleString()}</td>
                    </tr>
                  )}
                  {/* Show "No deductions" if all are 0 */}
                  {!employee?.pfDeduction && !employee?.esiDeduction && !employee?.tdsDeduction && !employee?.otherDeductions && !Number(payroll.deductions || 0) && (
                    <tr className="border-b">
                      <td className="p-2 text-sm text-muted-foreground" colSpan={2}>No deductions</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-red-100">
                    <td className="p-3 font-bold text-red-700">Total Deductions</td>
                    <td className="p-3 text-right font-bold text-red-700">
                      ₹{(
                        Number(employee?.pfDeduction || 0) + 
                        Number(employee?.esiDeduction || 0) + 
                        Number(employee?.tdsDeduction || 0) + 
                        Number(employee?.otherDeductions || 0) +
                        Number(payroll.deductions || 0)
                      ).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Net Salary */}
          <div className="bg-primary text-white p-4 rounded-lg flex justify-between items-center">
            <span className="text-lg font-bold">NET SALARY PAYABLE</span>
            <span className="text-2xl font-bold">₹{Number(payroll.netSalary).toLocaleString()}</span>
          </div>

          {/* Bank Details */}
          {employee?.bankAccountNumber && (
            <div className="mt-6 p-4 bg-muted/30 rounded-lg">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Payment Details</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Bank</p>
                  <p className="font-medium">{employee.bankName || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Account No.</p>
                  <p className="font-medium">{employee.bankAccountNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">IFSC</p>
                  <p className="font-medium">{employee.ifscCode || '-'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Signatures */}
          <div className="flex justify-between mt-12 pt-8">
            <div className="text-center">
              <div className="w-40 border-t border-gray-400 mt-10 pt-2">
                <p className="text-sm text-muted-foreground">Employee Signature</p>
              </div>
            </div>
            <div className="text-center">
              <div className="w-40 border-t border-gray-400 mt-10 pt-2">
                <p className="text-sm text-muted-foreground">Authorized Signatory</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              This is a computer-generated document. No signature is required.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Generated on {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
