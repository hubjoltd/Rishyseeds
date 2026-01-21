import { useState } from "react";
import { useEmployees, useCreateEmployee } from "@/hooks/use-hrms";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEmployeeSchema } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, UserPlus, Briefcase, Users, Search, Building2, Banknote, Phone, Mail, CreditCard, IndianRupee } from "lucide-react";

type FormTab = "basic" | "salary" | "bank";

export default function Employees() {
  const { data: employees, isLoading } = useEmployees();
  const { mutate: createEmployee, isPending } = useCreateEmployee();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FormTab>("basic");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");

  const form = useForm<z.infer<typeof insertEmployeeSchema>>({
    resolver: zodResolver(insertEmployeeSchema),
    defaultValues: {
      status: "active",
      salaryType: "monthly",
      hra: "0",
      da: "0",
      travelAllowance: "0",
      medicalAllowance: "0",
      otherAllowances: "0",
      pfDeduction: "0",
      esiDeduction: "0",
      tdsDeduction: "0",
      otherDeductions: "0",
    }
  });

  const onSubmit = (data: z.infer<typeof insertEmployeeSchema>) => {
    createEmployee(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
        setActiveTab("basic");
      },
    });
  };

  const filteredEmployees = employees?.filter(emp =>
    emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCount = employees?.filter(e => e.status === "active").length || 0;
  const totalSalary = employees?.reduce((sum, e) => sum + Number(e.basicSalary || 0), 0) || 0;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
        <div>
          <h2 className="text-3xl font-bold font-display text-primary">Employees</h2>
          <p className="text-muted-foreground">Manage employee records and salary configuration</p>
        </div>

        <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) setActiveTab("basic"); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-white" data-testid="button-add-employee">
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Add New Employee</DialogTitle>
            </DialogHeader>
            
            <div className="flex gap-2 border-b border-primary/10 pb-1 mb-4">
              <button
                type="button"
                onClick={() => setActiveTab("basic")}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === "basic" 
                    ? "bg-primary/10 text-primary border-b-2 border-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                data-testid="tab-basic"
              >
                <UserPlus className="w-4 h-4 inline mr-2" />
                Basic Info
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("salary")}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === "salary" 
                    ? "bg-primary/10 text-primary border-b-2 border-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                data-testid="tab-salary"
              >
                <IndianRupee className="w-4 h-4 inline mr-2" />
                Salary Config
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("bank")}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === "bank" 
                    ? "bg-primary/10 text-primary border-b-2 border-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                data-testid="tab-bank"
              >
                <CreditCard className="w-4 h-4 inline mr-2" />
                Bank & Contact
              </button>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)}>
              {activeTab === "basic" && (
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Employee ID *</label>
                      <Input {...form.register("employeeId")} placeholder="EMP-001" data-testid="input-employee-id" />
                      {form.formState.errors.employeeId && <span className="text-xs text-red-500">Required</span>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Full Name *</label>
                      <Input {...form.register("fullName")} placeholder="Rajesh Kumar" data-testid="input-full-name" />
                      {form.formState.errors.fullName && <span className="text-xs text-red-500">Required</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Role/Designation *</label>
                      <Input {...form.register("role")} placeholder="Manager" data-testid="input-role" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Department</label>
                      <Select onValueChange={(val) => form.setValue("department", val)}>
                        <SelectTrigger data-testid="select-department">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Production">Production</SelectItem>
                          <SelectItem value="Packaging">Packaging</SelectItem>
                          <SelectItem value="Storage">Storage</SelectItem>
                          <SelectItem value="Quality">Quality</SelectItem>
                          <SelectItem value="Sales">Sales</SelectItem>
                          <SelectItem value="Admin">Admin</SelectItem>
                          <SelectItem value="Accounts">Accounts</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Work Location</label>
                      <Input {...form.register("workLocation")} placeholder="Main Office" data-testid="input-work-location" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Join Date</label>
                      <Input type="date" {...form.register("joinDate")} data-testid="input-join-date" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select onValueChange={(val) => form.setValue("status", val)} defaultValue="active">
                      <SelectTrigger data-testid="select-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="on_leave">On Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {activeTab === "salary" && (
                <div className="grid gap-4">
                  <Card className="shadow-green">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-medium text-primary">Basic Salary</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Salary Type *</label>
                        <Select onValueChange={(val) => form.setValue("salaryType", val)} defaultValue="monthly">
                          <SelectTrigger data-testid="select-salary-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="daily">Daily Wage</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Basic Salary *</label>
                        <Input type="number" {...form.register("basicSalary")} placeholder="25000" data-testid="input-basic-salary" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-green">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-medium text-green-600">Allowances</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">HRA</label>
                        <Input type="number" {...form.register("hra")} placeholder="0" data-testid="input-hra" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">DA</label>
                        <Input type="number" {...form.register("da")} placeholder="0" data-testid="input-da" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Travel</label>
                        <Input type="number" {...form.register("travelAllowance")} placeholder="0" data-testid="input-travel" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Medical</label>
                        <Input type="number" {...form.register("medicalAllowance")} placeholder="0" data-testid="input-medical" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Other Allowances</label>
                        <Input type="number" {...form.register("otherAllowances")} placeholder="0" data-testid="input-other-allowances" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-green">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-medium text-red-600">Deductions</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">PF Deduction</label>
                        <Input type="number" {...form.register("pfDeduction")} placeholder="0" data-testid="input-pf" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">ESI Deduction</label>
                        <Input type="number" {...form.register("esiDeduction")} placeholder="0" data-testid="input-esi" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">TDS Deduction</label>
                        <Input type="number" {...form.register("tdsDeduction")} placeholder="0" data-testid="input-tds" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Other Deductions</label>
                        <Input type="number" {...form.register("otherDeductions")} placeholder="0" data-testid="input-other-deductions" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeTab === "bank" && (
                <div className="grid gap-4">
                  <Card className="shadow-green">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-medium text-primary">Bank Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Bank Name</label>
                        <Input {...form.register("bankName")} placeholder="State Bank of India" data-testid="input-bank-name" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Account Number</label>
                        <Input {...form.register("bankAccountNumber")} placeholder="1234567890" data-testid="input-account-number" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">IFSC Code</label>
                        <Input {...form.register("ifscCode")} placeholder="SBIN0001234" data-testid="input-ifsc" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">PAN Number</label>
                        <Input {...form.register("panNumber")} placeholder="ABCDE1234F" data-testid="input-pan" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-green">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-medium text-primary">Contact Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Phone</label>
                        <Input {...form.register("phone")} placeholder="+91 9876543210" data-testid="input-phone" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Email</label>
                        <Input type="email" {...form.register("email")} placeholder="employee@email.com" data-testid="input-email" />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <label className="text-sm text-muted-foreground">Address</label>
                        <Input {...form.register("address")} placeholder="Full address" data-testid="input-address" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="flex justify-between mt-6">
                <div className="flex gap-2">
                  {activeTab !== "basic" && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setActiveTab(activeTab === "salary" ? "basic" : "salary")}
                    >
                      Previous
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  {activeTab !== "bank" && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setActiveTab(activeTab === "basic" ? "salary" : "bank")}
                    >
                      Next
                    </Button>
                  )}
                  <Button type="submit" disabled={isPending} data-testid="button-submit-employee">
                    {isPending ? "Adding..." : "Add Employee"}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="stat-gradient-green shadow-green">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-500/20">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Employees</p>
              <p className="text-2xl font-bold">{employees?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-gradient-blue shadow-green">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/20">
              <UserPlus className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Employees</p>
              <p className="text-2xl font-bold">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-gradient-amber shadow-green">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/20">
              <Banknote className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Payroll</p>
              <p className="text-2xl font-bold">₹{totalSalary.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, ID, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-employees"
          />
        </div>
      </div>

      <Card className="shadow-green">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>Employee</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Salary Type</TableHead>
                <TableHead className="text-right">Basic Salary</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Loading employees...</TableCell>
                </TableRow>
              ) : filteredEmployees?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No employees found</TableCell>
                </TableRow>
              ) : (
                filteredEmployees?.map((emp) => (
                  <TableRow key={emp.id} data-testid={`row-employee-${emp.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {emp.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{emp.fullName}</p>
                          <p className="text-xs text-muted-foreground">{emp.role}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{emp.employeeId}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{emp.department || "-"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{emp.salaryType}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold">₹{Number(emp.basicSalary).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={emp.status === "active" ? "badge-success" : "badge-warning"}>
                        {emp.status}
                      </Badge>
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
