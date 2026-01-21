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

          {/* Salary Table */}
          <table className="w-full mb-8 border-collapse">
            <thead>
              <tr className="bg-primary/10">
                <th className="text-left p-3 text-primary text-sm uppercase">Earnings</th>
                <th className="text-right p-3 text-primary text-sm uppercase">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-3">Basic Salary</td>
                <td className="p-3 text-right font-semibold">₹{Number(payroll.basicPay).toLocaleString()}</td>
              </tr>
              <tr className="border-b">
                <td className="p-3">Allowances</td>
                <td className="p-3 text-right font-semibold">₹{Number(payroll.allowances || 0).toLocaleString()}</td>
              </tr>
              <tr className="border-b">
                <td className="p-3">Overtime</td>
                <td className="p-3 text-right font-semibold">₹{Number(payroll.overtimeAmount || 0).toLocaleString()}</td>
              </tr>
              <tr className="border-b bg-red-50">
                <td className="p-3 text-red-600">Deductions</td>
                <td className="p-3 text-right font-semibold text-red-600">- ₹{Number(payroll.deductions || 0).toLocaleString()}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-primary text-white">
                <td className="p-4 font-bold text-lg">Net Salary</td>
                <td className="p-4 text-right font-bold text-xl">₹{Number(payroll.netSalary).toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>

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
