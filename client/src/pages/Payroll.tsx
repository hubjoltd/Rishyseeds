import { useState } from "react";
import { usePayroll, useGeneratePayroll, useEmployees } from "@/hooks/use-hrms";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IndianRupee, Printer, Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PayslipModal } from "@/components/PayslipModal";
import type { Payroll as PayrollType } from "@shared/routes";

export default function Payroll() {
  const { data: payrolls, isLoading } = usePayroll();
  const { data: employees } = useEmployees();
  const { mutate: generatePayroll, isPending } = useGeneratePayroll();
  const { toast } = useToast();
  
  // Default to current month YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollType | null>(null);
  const [payslipOpen, setPayslipOpen] = useState(false);

  const handleGenerate = () => {
    generatePayroll({ month: selectedMonth });
  };

  const handleViewPayslip = (payroll: PayrollType) => {
    setSelectedPayroll(payroll);
    setPayslipOpen(true);
  };

  const handleDownloadPayslip = (payroll: PayrollType) => {
    window.open(`/api/payroll/${payroll.id}/download`, "_blank");
  };

  const getEmployeeForPayroll = (employeeId: number) => {
    return employees?.find(e => e.id === employeeId);
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold font-display text-primary">Payroll</h2>
          <p className="text-muted-foreground">Salary generation and payslips</p>
        </div>
        
        <div className="flex gap-4 items-center bg-card p-2 rounded-lg border shadow-sm">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border rounded px-2 py-1 bg-background text-sm"
          />
          <Button onClick={handleGenerate} disabled={isPending} size="sm">
            {isPending ? "Generating..." : "Generate Payroll"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payroll History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead className="text-right">Present Days</TableHead>
                <TableHead className="text-right">Basic Pay</TableHead>
                <TableHead className="text-right">Net Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center">Loading...</TableCell></TableRow>
              ) : payrolls?.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No payroll records found.</TableCell></TableRow>
              ) : (
                payrolls?.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.month}</TableCell>
                    <TableCell>{p.employeeId}</TableCell>
                    <TableCell className="text-right">{p.presentDays}</TableCell>
                    <TableCell className="text-right">₹{p.basicPay}</TableCell>
                    <TableCell className="text-right font-bold text-green-700">₹{p.netSalary}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 uppercase">
                        {p.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          title="View Payslip"
                          onClick={() => handleViewPayslip(p)}
                          data-testid={`button-view-payslip-${p.id}`}
                        >
                          <FileText className="w-4 h-4 text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Download Payslip PDF"
                          onClick={() => handleDownloadPayslip(p)}
                          data-testid={`button-download-payslip-${p.id}`}
                        >
                          <Download className="w-4 h-4 text-green-700" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PayslipModal
        open={payslipOpen}
        onOpenChange={setPayslipOpen}
        payroll={selectedPayroll}
        employee={selectedPayroll ? getEmployeeForPayroll(selectedPayroll.employeeId) : null}
      />
    </div>
  );
}
