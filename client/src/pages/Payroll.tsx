import { useState } from "react";
import { usePayroll, useGeneratePayroll } from "@/hooks/use-hrms";
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
import { IndianRupee, Printer, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Payroll() {
  const { data: payrolls, isLoading } = usePayroll();
  const { mutate: generatePayroll, isPending } = useGeneratePayroll();
  const { toast } = useToast();
  
  // Default to current month YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const handleGenerate = () => {
    generatePayroll({ month: selectedMonth });
  };

  const handlePrint = (payrollId: number) => {
    toast({ title: "Printing Payslip", description: `Generating PDF for payroll #${payrollId}` });
    // In a real app, this would trigger a window.print() on a specific print route
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
                      <Button variant="ghost" size="icon" onClick={() => handlePrint(p.id)}>
                        <Printer className="w-4 h-4 text-gray-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
