import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import type { Payroll, Employee } from "@shared/routes";

interface PayslipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payroll: Payroll | null;
  employee?: Employee | null;
}

export function PayslipModal({ open, onOpenChange, payroll, employee }: PayslipModalProps) {
  if (!payroll) return null;

  const fmt = (v: number) => v.toLocaleString("en-IN");

  const monthLabel = (() => {
    const [y, m] = payroll.month.split("-");
    const names = ["","JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE","JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"];
    return `${names[parseInt(m)] || m}'${y}`;
  })();

  const gross =
    Number(payroll.basicPay) +
    Number(employee?.hra || 0) +
    Number(employee?.da || 0) +
    Number(employee?.travelAllowance || 0) +
    Number(employee?.medicalAllowance || 0) +
    Number(employee?.otherAllowances || 0) +
    Number(payroll.overtimeAmount || 0);

  const profTax = Number((employee as any)?.professionalTax || 0);

  const totalDeductions =
    Number(employee?.pfDeduction || 0) +
    Number(employee?.esiDeduction || 0) +
    profTax +
    Number(employee?.tdsDeduction || 0) +
    Number(employee?.otherDeductions || 0) +
    Number(payroll.deductions || 0);

  const netPay = Number(payroll.netSalary);
  const leaveDays = Number(payroll.totalDays) - Number(payroll.presentDays);

  const doj = (employee as any)?.joinDate
    ? new Date((employee as any).joinDate).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "-";

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Pay Slip - ${payroll.month}</title>
<style>
  @page{size:A4;margin:12mm}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Arial',sans-serif;background:#fff;color:#000;font-size:12px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{max-width:760px;margin:0 auto;border:2px solid #000;padding:0}
  .co-header{text-align:center;padding:18px 20px 12px;border-bottom:1px solid #000}
  .co-name{font-size:15px;font-weight:900;letter-spacing:0.5px;text-transform:uppercase}
  .slip-title{font-size:13px;font-weight:700;margin-top:4px;text-transform:uppercase}
  .emp-info{padding:10px 16px;border-bottom:1px solid #000}
  .emp-info table{width:100%;border-collapse:collapse}
  .emp-info td{padding:3px 6px;font-size:11.5px;vertical-align:top}
  .lbl{font-weight:700;width:100px;white-space:nowrap}
  .sep{width:14px;text-align:center}
  .val{font-weight:700}
  .sal-grid{display:flex;border-bottom:1px solid #000}
  .earn-col{flex:1;border-right:1px solid #000}
  .ded-col{flex:1}
  .col-hdr{display:flex;justify-content:space-between;padding:5px 8px;font-size:11.5px;font-weight:900;border-bottom:1px solid #000;text-transform:uppercase}
  .st{width:100%;border-collapse:collapse}
  .st .el,.st .dl{padding:4px 8px;font-size:11px;width:55%}
  .st .ec,.st .dc{padding:4px 2px;font-size:11px;width:8%;text-align:center}
  .st .ev,.st .dv{padding:4px 8px;font-size:11px;width:37%;text-align:right;font-weight:600}
  .st tr{border-bottom:1px dotted #ccc}
  .gross-row,.total-row{display:flex;justify-content:space-between;padding:5px 8px;font-size:12px;font-weight:900;border-top:1px solid #000;text-transform:uppercase}
  .net-row{display:flex;justify-content:space-between;align-items:center;padding:8px 16px;border-bottom:1px solid #000;font-size:12.5px;font-weight:900;text-transform:uppercase}
  .slip-footer{text-align:center;padding:10px 16px;font-size:11px;font-style:italic}
</style></head><body><div class="page">
  <div class="co-header">
    <div class="co-name">RISHI HYBRID SEEDS PVT LTD, SECUNDERABAD</div>
    <div class="slip-title">Pay Slip For The Month Of ${monthLabel}</div>
  </div>
  <div class="emp-info"><table><tr>
    <td><table>
      <tr><td class="lbl">EMP. NAME</td><td class="sep">:</td><td class="val">${employee?.fullName || "-"}</td></tr>
      <tr><td class="lbl">DEPT.</td><td class="sep">:</td><td class="val">${employee?.department || "-"}</td></tr>
      <tr><td class="lbl">DESG.</td><td class="sep">:</td><td class="val">${employee?.role || "-"}</td></tr>
      <tr><td class="lbl">PRESENT DAYS</td><td class="sep">:</td><td class="val">${payroll.presentDays} / ${payroll.totalDays}</td></tr>
    </table></td>
    <td style="width:50%"><table>
      <tr><td class="lbl">D.O.J</td><td class="sep">:</td><td class="val">${doj}</td></tr>
      <tr><td class="lbl">EMP CODE</td><td class="sep">:</td><td class="val">${employee?.employeeId || "-"}</td></tr>
      <tr><td class="lbl">UAN</td><td class="sep">:</td><td class="val">${(employee as any)?.uan || "0"}</td></tr>
      <tr><td class="lbl">LEAVE DAYS</td><td class="sep">:</td><td class="val">${leaveDays}</td></tr>
    </table></td>
  </tr></table></div>
  <div class="sal-grid">
    <div class="earn-col">
      <div class="col-hdr"><span>EARNINGS</span><span>RS.</span></div>
      <table class="st">
        <tr><td class="el">BASIC</td><td class="ec">:</td><td class="ev">${fmt(Number(payroll.basicPay))}</td></tr>
        <tr><td class="el">HRA</td><td class="ec">:</td><td class="ev">${fmt(Number(employee?.hra||0))}</td></tr>
        <tr><td class="el">DA</td><td class="ec">:</td><td class="ev">${fmt(Number(employee?.da||0))}</td></tr>
        <tr><td class="el">CONV</td><td class="ec">:</td><td class="ev">${fmt(Number(employee?.travelAllowance||0))}</td></tr>
        <tr><td class="el">SPL ALLOW</td><td class="ec">:</td><td class="ev">${fmt(Number(employee?.otherAllowances||0))}</td></tr>
        <tr><td class="el">MED.ALLOW</td><td class="ec">:</td><td class="ev">${fmt(Number(employee?.medicalAllowance||0))}</td></tr>
        <tr><td class="el">OVERTIME</td><td class="ec">:</td><td class="ev">${fmt(Number(payroll.overtimeAmount||0))}</td></tr>
      </table>
      <div class="gross-row"><span>GROSS</span><span>:</span><span>${fmt(gross)}</span></div>
    </div>
    <div class="ded-col">
      <div class="col-hdr"><span>DEDUCTIONS</span><span>:</span><span>RS</span></div>
      <table class="st">
        <tr><td class="dl">PF</td><td class="dc">:</td><td class="dv">${fmt(Number(employee?.pfDeduction||0))}</td></tr>
        <tr><td class="dl">VPF</td><td class="dc">:</td><td class="dv">0</td></tr>
        <tr><td class="dl">ESI</td><td class="dc">:</td><td class="dv">${fmt(Number(employee?.esiDeduction||0))}</td></tr>
        <tr><td class="dl">PROF.TAX</td><td class="dc">:</td><td class="dv">${fmt(profTax)}</td></tr>
        <tr><td class="dl">I.TAX (TDS)</td><td class="dc">:</td><td class="dv">${fmt(Number(employee?.tdsDeduction||0))}</td></tr>
        <tr><td class="dl">SAL.ADV</td><td class="dc">:</td><td class="dv">0</td></tr>
        <tr><td class="dl">OTHERS</td><td class="dc">:</td><td class="dv">${fmt(Number(employee?.otherDeductions||0)+Number(payroll.deductions||0))}</td></tr>
      </table>
      <div class="total-row"><span>TOTAL</span><span>:</span><span>${fmt(totalDeductions)}</span></div>
    </div>
  </div>
  <div class="net-row"><span>NET TAKE HOME</span><span>:</span><span>${fmt(netPay)}</span></div>
  <div class="slip-footer">This is computer generated Pay Slip, Signature not required</div>
</div></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
  };

  const ERow = ({ label, value }: { label: string; value: number }) => (
    <tr className="border-b border-dotted border-gray-300">
      <td className="px-2 py-1 text-xs w-[55%]">{label}</td>
      <td className="px-1 py-1 text-xs w-[8%] text-center">:</td>
      <td className="px-2 py-1 text-xs w-[37%] text-right font-semibold">{fmt(value)}</td>
    </tr>
  );

  const DRow = ({ label, value }: { label: string; value: number }) => (
    <tr className="border-b border-dotted border-gray-300">
      <td className="px-2 py-1 text-xs w-[55%]">{label}</td>
      <td className="px-1 py-1 text-xs w-[8%] text-center">:</td>
      <td className="px-2 py-1 text-xs w-[37%] text-right font-semibold">{fmt(value)}</td>
    </tr>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0">
        <DialogHeader className="px-5 pt-4 pb-2 border-b">
          <DialogTitle className="flex items-center justify-between">
            <span className="font-semibold text-base">Pay Slip Preview</span>
            <Button onClick={handlePrint} size="sm" variant="outline" data-testid="button-print-payslip">
              <Printer className="w-4 h-4 mr-2" />
              Print / Download
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="p-4">
          <div className="border-2 border-black bg-white text-black font-sans text-sm">

            {/* Company Header */}
            <div className="text-center py-4 px-4 border-b border-black">
              <div className="font-black text-base tracking-wide uppercase">RISHI HYBRID SEEDS PVT LTD, SECUNDERABAD</div>
              <div className="font-bold text-sm mt-1 uppercase">Pay Slip For The Month Of {monthLabel}</div>
            </div>

            {/* Employee Info */}
            <div className="grid grid-cols-2 gap-0 border-b border-black px-4 py-2">
              <div className="space-y-0.5">
                {[
                  ["EMP. NAME", employee?.fullName || "-"],
                  ["DEPT.", employee?.department || "-"],
                  ["DESG.", employee?.role || "-"],
                  ["PRESENT DAYS", `${payroll.presentDays} / ${payroll.totalDays}`],
                ].map(([label, val]) => (
                  <div key={label} className="flex gap-2 text-xs">
                    <span className="font-bold w-28 shrink-0">{label}</span>
                    <span>:</span>
                    <span className="font-bold">{val}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-0.5">
                {[
                  ["D.O.J", doj],
                  ["EMP CODE", employee?.employeeId || "-"],
                  ["UAN", (employee as any)?.uan || "0"],
                  ["LEAVE DAYS", String(leaveDays)],
                ].map(([label, val]) => (
                  <div key={label} className="flex gap-2 text-xs">
                    <span className="font-bold w-28 shrink-0">{label}</span>
                    <span>:</span>
                    <span className="font-bold">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Salary Grid */}
            <div className="flex border-b border-black">
              {/* Earnings */}
              <div className="flex-1 border-r border-black">
                <div className="flex justify-between px-2 py-1 font-black text-xs uppercase border-b border-black">
                  <span>EARNINGS</span><span>RS.</span>
                </div>
                <table className="w-full border-collapse">
                  <tbody>
                    <ERow label="BASIC" value={Number(payroll.basicPay)} />
                    <ERow label="HRA" value={Number(employee?.hra || 0)} />
                    <ERow label="DA" value={Number(employee?.da || 0)} />
                    <ERow label="CONV" value={Number(employee?.travelAllowance || 0)} />
                    <ERow label="SPL ALLOW" value={Number(employee?.otherAllowances || 0)} />
                    <ERow label="MED.ALLOW" value={Number(employee?.medicalAllowance || 0)} />
                    <ERow label="OVERTIME" value={Number(payroll.overtimeAmount || 0)} />
                  </tbody>
                </table>
                <div className="flex justify-between px-2 py-1.5 font-black text-xs uppercase border-t border-black">
                  <span>GROSS</span><span>:</span><span>{fmt(gross)}</span>
                </div>
              </div>

              {/* Deductions */}
              <div className="flex-1">
                <div className="flex justify-between px-2 py-1 font-black text-xs uppercase border-b border-black">
                  <span>DEDUCTIONS</span><span>:</span><span>RS</span>
                </div>
                <table className="w-full border-collapse">
                  <tbody>
                    <DRow label="PF" value={Number(employee?.pfDeduction || 0)} />
                    <DRow label="VPF" value={0} />
                    <DRow label="ESI" value={Number(employee?.esiDeduction || 0)} />
                    <DRow label="PROF.TAX" value={profTax} />
                    <DRow label="I.TAX (TDS)" value={Number(employee?.tdsDeduction || 0)} />
                    <DRow label="SAL.ADV" value={0} />
                    <DRow label="OTHERS" value={Number(employee?.otherDeductions || 0) + Number(payroll.deductions || 0)} />
                  </tbody>
                </table>
                <div className="flex justify-between px-2 py-1.5 font-black text-xs uppercase border-t border-black">
                  <span>TOTAL</span><span>:</span><span>{fmt(totalDeductions)}</span>
                </div>
              </div>
            </div>

            {/* Net Take Home */}
            <div className="flex justify-between items-center px-4 py-2 border-b border-black font-black text-sm uppercase">
              <span>NET TAKE HOME</span>
              <span>:</span>
              <span className="text-base">{fmt(netPay)}</span>
            </div>

            {/* Footer */}
            <div className="text-center py-3 text-xs italic">
              This is computer generated Pay Slip, Signature not required
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
