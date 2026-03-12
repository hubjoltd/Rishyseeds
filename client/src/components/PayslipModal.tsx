import { useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
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

  const gross =
    Number(payroll.basicPay) +
    Number(employee?.hra || 0) +
    Number(employee?.da || 0) +
    Number(employee?.travelAllowance || 0) +
    Number(employee?.medicalAllowance || 0) +
    Number(employee?.otherAllowances || 0) +
    Number(payroll.overtimeAmount || 0);

  const totalDeductions =
    Number(employee?.pfDeduction || 0) +
    Number(employee?.esiDeduction || 0) +
    Number((employee as any)?.professionalTax || 0) +
    Number(employee?.tdsDeduction || 0) +
    Number(employee?.otherDeductions || 0) +
    Number(payroll.deductions || 0);

  const netPay = Number(payroll.netSalary);

  const doj = (employee as any)?.joinDate
    ? new Date((employee as any).joinDate).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "-";

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Pay Slip - ${payroll.month}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,sans-serif;background:#fff;color:#222}
.slip{max-width:820px;margin:0 auto;border:1.5px solid #16a34a}
.top-bar{background:linear-gradient(135deg,#14532d 0%,#16a34a 100%);color:#fff;padding:18px 24px;display:flex;align-items:center;gap:16px}
.top-bar img{height:52px;background:#fff;border-radius:6px;padding:3px}
.top-bar .co-name{font-size:20px;font-weight:800;letter-spacing:0.5px}
.top-bar .co-sub{font-size:11px;opacity:0.85;margin-top:2px}
.title-bar{background:#166534;color:#fff;text-align:center;padding:7px;font-size:13px;font-weight:700;letter-spacing:1.5px}
.emp-table{width:100%;border-collapse:collapse;border-bottom:1.5px solid #16a34a}
.emp-table td{padding:6px 14px;font-size:12px;border-bottom:1px solid #e5e7eb}
.emp-table .label{font-weight:700;width:130px;color:#166534}
.emp-table .val{color:#111}
.attend-bar{display:flex;background:#f0fdf4;border-bottom:1.5px solid #16a34a}
.attend-item{flex:1;text-align:center;padding:8px 4px;border-right:1px solid #bbf7d0}
.attend-item:last-child{border-right:none}
.attend-item .num{font-size:20px;font-weight:800;color:#16a34a}
.attend-item .lbl{font-size:10px;color:#166534;text-transform:uppercase;letter-spacing:0.5px}
.salary-section{display:flex}
.earn-col{flex:1;border-right:1px solid #d1fae5}
.ded-col{flex:1}
.col-head{background:#166534;color:#fff;font-size:11px;font-weight:700;letter-spacing:1px;padding:7px 12px;text-transform:uppercase}
.earn-col .col-head{background:#166534}
.ded-col .col-head{background:#991b1b}
.sal-row{display:flex;justify-content:space-between;padding:5px 12px;font-size:12px;border-bottom:1px solid #f0fdf4}
.sal-row:nth-child(odd){background:#f9fafb}
.sal-row .comp{color:#374151}
.sal-row .amt{font-weight:600;color:#111}
.sub-total-row{display:flex;justify-content:space-between;padding:6px 12px;font-size:12.5px;font-weight:700;border-top:2px solid #16a34a}
.earn-col .sub-total-row{background:#dcfce7;color:#15803d}
.ded-col .sub-total-row{background:#fee2e2;color:#b91c1c}
.net-bar{background:linear-gradient(135deg,#14532d 0%,#16a34a 100%);color:#fff;display:flex;justify-content:space-between;align-items:center;padding:10px 20px;font-size:15px;font-weight:800;letter-spacing:0.5px}
.net-bar .amt{font-size:22px}
.bank-section{padding:8px 14px;background:#f0fdf4;border-top:1px solid #bbf7d0;font-size:11.5px}
.bank-grid{display:flex;gap:24px;margin-top:4px}
.bank-grid .bk{color:#166534;font-weight:700}
.footer{text-align:center;padding:8px;border-top:1.5px solid #16a34a;font-size:10.5px;color:#6b7280;background:#f9fafb}
.sig-row{display:flex;justify-content:space-between;padding:14px 30px 6px;font-size:11px;color:#6b7280}
.sig-line{border-top:1px solid #9ca3af;width:130px;margin-bottom:4px}
@media print{body{padding:0}.slip{border:none}}
</style></head><body><div class="slip">${printContent.innerHTML}</div></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
  };

  const EarningsRow = ({ label, value }: { label: string; value: number }) =>
    value > 0 ? (
      <div className="flex justify-between px-3 py-1.5 text-xs border-b border-green-50 odd:bg-gray-50">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold">₹{value.toLocaleString()}</span>
      </div>
    ) : null;

  const DeductionRow = ({ label, value }: { label: string; value: number }) =>
    value > 0 ? (
      <div className="flex justify-between px-3 py-1.5 text-xs border-b border-red-50 odd:bg-gray-50">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-red-700">₹{value.toLocaleString()}</span>
      </div>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0">
        <DialogHeader className="px-5 pt-4 pb-2">
          <DialogTitle className="flex items-center justify-between">
            <span className="font-semibold text-base">Rishi Pay Slip Preview</span>
            <Button onClick={handlePrint} size="sm" className="bg-green-700 hover:bg-green-800 text-white" data-testid="button-print-payslip">
              <Printer className="w-4 h-4 mr-2" />
              Print / Download PDF
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div ref={printRef} className="bg-white border-2 border-green-700 mx-3 mb-4 overflow-hidden rounded-md">

          {/* Gradient header */}
          <div className="flex items-center gap-4 px-5 py-4" style={{ background: "linear-gradient(135deg,#14532d 0%,#16a34a 100%)" }}>
            <img src={logo} alt="Rishi Seeds" className="h-14 rounded-md object-contain bg-white p-1" />
            <div className="text-white">
              <div className="font-extrabold text-xl tracking-wide leading-tight">RISHI HYBRID SEEDS PVT LTD</div>
              <div className="text-green-100 text-xs mt-0.5">SECUNDERABAD — Agricultural Excellence</div>
            </div>
          </div>

          {/* Title banner */}
          <div className="bg-green-900 text-white text-center py-2 text-sm font-bold tracking-widest uppercase">
            Pay Slip For The Month Of {payroll.month.toUpperCase()}
          </div>

          {/* Employee info — date first */}
          <table className="w-full border-collapse border-b-2 border-green-700 text-sm">
            <tbody>
              <tr>
                <td className="px-4 py-1.5 font-bold text-green-800 w-36">Date</td>
                <td className="px-2 py-1.5 text-gray-800">:&nbsp; {doj}</td>
                <td className="px-4 py-1.5 font-bold text-green-800 w-36">EMP. Code</td>
                <td className="px-2 py-1.5 text-gray-800">:&nbsp; {employee?.employeeId || "-"}</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-1.5 font-bold text-green-800">Emp. Name</td>
                <td className="px-2 py-1.5 text-gray-800">:&nbsp; {employee?.fullName || "-"}</td>
                <td className="px-4 py-1.5 font-bold text-green-800">UAN</td>
                <td className="px-2 py-1.5 text-gray-800">:&nbsp; {(employee as any)?.uan || "-"}</td>
              </tr>
              <tr>
                <td className="px-4 py-1.5 font-bold text-green-800">Dept.</td>
                <td className="px-2 py-1.5 text-gray-800">:&nbsp; {employee?.department || "-"}</td>
                <td className="px-4 py-1.5 font-bold text-green-800">Present Days</td>
                <td className="px-2 py-1.5 text-gray-800">:&nbsp; {payroll.presentDays} / {payroll.totalDays}</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-1.5 font-bold text-green-800">Designation</td>
                <td className="px-2 py-1.5 text-gray-800">:&nbsp; {employee?.role || "-"}</td>
                <td className="px-4 py-1.5 font-bold text-green-800">Leave Days</td>
                <td className="px-2 py-1.5 text-gray-800">:&nbsp; {Number(payroll.totalDays) - Number(payroll.presentDays)}</td>
              </tr>
            </tbody>
          </table>

          {/* Earnings + Deductions side by side */}
          <div className="flex border-b-2 border-green-700">
            {/* Earnings */}
            <div className="flex-1 border-r border-green-200">
              <div className="bg-green-800 text-white px-3 py-1.5 text-xs font-bold uppercase tracking-widest flex justify-between">
                <span>Earnings</span>
                <span>Rs.</span>
              </div>
              <EarningsRow label="BASIC" value={Number(payroll.basicPay)} />
              <EarningsRow label="HRA" value={Number(employee?.hra || 0)} />
              <EarningsRow label="DA" value={Number(employee?.da || 0)} />
              <EarningsRow label="CONV (Travel Allow.)" value={Number(employee?.travelAllowance || 0)} />
              <EarningsRow label="MED. ALLOW." value={Number(employee?.medicalAllowance || 0)} />
              <EarningsRow label="OTHER ALLOW." value={Number(employee?.otherAllowances || 0)} />
              <EarningsRow label="OVERTIME" value={Number(payroll.overtimeAmount || 0)} />
              {gross === 0 && (
                <div className="px-3 py-1.5 text-xs text-gray-400">No earnings recorded</div>
              )}
              <div className="flex justify-between px-3 py-2 bg-green-100 border-t-2 border-green-700 text-sm font-bold text-green-800">
                <span>GROSS</span>
                <span>₹{gross.toLocaleString()}</span>
              </div>
            </div>

            {/* Deductions */}
            <div className="flex-1">
              <div className="bg-red-800 text-white px-3 py-1.5 text-xs font-bold uppercase tracking-widest flex justify-between">
                <span>Deductions</span>
                <span>Rs.</span>
              </div>
              <DeductionRow label="Provident Fund (PF)" value={Number(employee?.pfDeduction || 0)} />
              <DeductionRow label="ESI Contribution" value={Number(employee?.esiDeduction || 0)} />
              <DeductionRow label="Professional Tax (PT)" value={Number((employee as any)?.professionalTax || 0)} />
              <DeductionRow label="TDS (Income Tax)" value={Number(employee?.tdsDeduction || 0)} />
              <DeductionRow label="Other Deductions" value={Number(employee?.otherDeductions || 0)} />
              <DeductionRow label="MONTHLY DEDUCTIONS" value={Number(payroll.deductions || 0)} />
              {totalDeductions === 0 && (
                <div className="px-3 py-1.5 text-xs text-gray-400">No deductions</div>
              )}
              <div className="flex justify-between px-3 py-2 bg-red-100 border-t-2 border-red-700 text-sm font-bold text-red-800">
                <span>TOTAL</span>
                <span>₹{totalDeductions.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Net Take Home */}
          <div className="flex justify-between items-center px-6 py-3" style={{ background: "linear-gradient(135deg,#14532d 0%,#16a34a 100%)" }}>
            <span className="text-white text-base font-extrabold tracking-wide uppercase">Net Take Home</span>
            <span className="text-white text-2xl font-black">₹{netPay.toLocaleString()}</span>
          </div>

          {/* Bank details if available */}
          {employee?.bankAccountNumber && (
            <div className="px-4 py-2 bg-green-50 border-b border-green-200 text-xs">
              <span className="font-bold text-green-800">Bank: </span>
              <span className="text-gray-700">{employee.bankName || "-"}</span>
              <span className="mx-3 text-green-300">|</span>
              <span className="font-bold text-green-800">A/C: </span>
              <span className="text-gray-700">{employee.bankAccountNumber}</span>
              <span className="mx-3 text-green-300">|</span>
              <span className="font-bold text-green-800">IFSC: </span>
              <span className="text-gray-700">{employee.ifscCode || "-"}</span>
            </div>
          )}

          {/* Signatures */}
          <div className="flex justify-between px-8 pt-5 pb-2">
            <div className="text-center">
              <div className="w-32 border-t border-gray-400 pt-1 text-xs text-gray-500">Employee Signature</div>
            </div>
            <div className="text-center">
              <div className="w-32 border-t border-gray-400 pt-1 text-xs text-gray-500">Authorized Signatory</div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center py-2 border-t border-green-200 bg-gray-50 text-xs text-gray-500">
            This is a computer generated Pay Slip, Signature not required.
            <span className="ml-3 text-gray-400">Generated: {new Date().toLocaleDateString("en-IN")}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
