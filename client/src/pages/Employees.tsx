import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useEmployees, useCreateEmployee, useUpdateEmployee } from "@/hooks/use-hrms";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEmployeeSchema, type Employee, type Role } from "@shared/schema";
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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, UserPlus, Briefcase, Users, Search, Building2, Banknote, Phone, Mail, CreditCard, IndianRupee, Pencil, Eye, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAuthToken } from "@/lib/queryClient";
import { useLocation } from "wouter";

type FormTab = "basic" | "salary" | "bank";

export default function Employees() {
  const { data: employees, isLoading } = useEmployees();
  const { data: roles } = useQuery<Role[]>({ queryKey: ["/api/roles"] });
  const { mutate: createEmployee, isPending } = useCreateEmployee();
  const { mutate: updateEmployee, isPending: isUpdating } = useUpdateEmployee();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState<FormTab>("basic");
  const [editTab, setEditTab] = useState<FormTab>("basic");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [viewPasswordEmp, setViewPasswordEmp] = useState<Employee | null>(null);
  const [viewPasswordValue, setViewPasswordValue] = useState<string | null>(null);
  const [changePasswordEmp, setChangePasswordEmp] = useState<Employee | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleViewPassword = async (emp: Employee) => {
    setViewPasswordEmp(emp);
    setViewPasswordValue(null);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/employees/${emp.id}/password`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch password");
      const data = await res.json();
      setViewPasswordValue(data.password);
    } catch {
      setViewPasswordValue("Error loading password");
    }
  };

  const handleChangePassword = async () => {
    if (!changePasswordEmp || !newPassword) return;
    setPasswordLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/employees/${changePasswordEmp.id}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ password: newPassword }),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || "Failed"); }
      toast({ title: "Success", description: `Password updated for ${changePasswordEmp.fullName}` });
      setChangePasswordEmp(null);
      setNewPassword("");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setPasswordLoading(false);
    }
  };

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
      professionalTax: "0",
      otherDeductions: "0",
    }
  });

  const editForm = useForm<z.infer<typeof insertEmployeeSchema>>({
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
      professionalTax: "0",
      otherDeductions: "0",
    }
  });

  useEffect(() => {
    if (editingEmployee) {
      editForm.reset({
        employeeId: editingEmployee.employeeId,
        fullName: editingEmployee.fullName,
        role: editingEmployee.role || "",
        department: editingEmployee.department || "",
        workLocation: editingEmployee.workLocation || "",
        joinDate: editingEmployee.joinDate || "",
        status: editingEmployee.status || "active",
        salaryType: editingEmployee.salaryType || "monthly",
        basicSalary: editingEmployee.basicSalary || "0",
        hra: editingEmployee.hra || "0",
        da: editingEmployee.da || "0",
        travelAllowance: editingEmployee.travelAllowance || "0",
        medicalAllowance: editingEmployee.medicalAllowance || "0",
        otherAllowances: editingEmployee.otherAllowances || "0",
        pfDeduction: editingEmployee.pfDeduction || "0",
        esiDeduction: editingEmployee.esiDeduction || "0",
        tdsDeduction: editingEmployee.tdsDeduction || "0",
        professionalTax: editingEmployee.professionalTax || "0",
        otherDeductions: editingEmployee.otherDeductions || "0",
        bankName: editingEmployee.bankName || "",
        bankAccountNumber: editingEmployee.bankAccountNumber || "",
        ifscCode: editingEmployee.ifscCode || "",
        panNumber: editingEmployee.panNumber || "",
        phone: editingEmployee.phone || "",
        email: editingEmployee.email || "",
        address: editingEmployee.address || "",
        password: "",
      });
    }
  }, [editingEmployee, editForm]);

  const onSubmit = (data: z.infer<typeof insertEmployeeSchema>) => {
    createEmployee(data, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
        setActiveTab("basic");
      },
    });
  };

  const onEditSubmit = (data: z.infer<typeof insertEmployeeSchema>) => {
    if (!editingEmployee) return;
    const updates = { ...data };
    if (!updates.password) {
      delete (updates as any).password;
    }
    updateEmployee({ id: editingEmployee.id, data: updates }, {
      onSuccess: () => {
        setEditOpen(false);
        setEditingEmployee(null);
        setEditTab("basic");
      },
    });
  };

  const handleEditClick = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditOpen(true);
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
                      <Select onValueChange={(val) => form.setValue("role", val)} value={form.watch("role")}>
                        <SelectTrigger data-testid="select-role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles?.filter(r => r.isActive).map((role) => (
                            <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                        <label className="text-sm text-muted-foreground">Professional Tax</label>
                        <Input type="number" {...form.register("professionalTax")} placeholder="0" data-testid="input-professional-tax" />
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

                  <Card className="shadow-green">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-medium text-primary">Employee Portal Login</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Password (for employee login)</label>
                        <Input type="password" {...form.register("password")} placeholder="Set password for employee portal access" data-testid="input-employee-password" />
                        <p className="text-xs text-muted-foreground">If left blank, employee can use their Employee ID as password</p>
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

        <Dialog open={editOpen} onOpenChange={(isOpen) => { setEditOpen(isOpen); if (!isOpen) { setEditingEmployee(null); setEditTab("basic"); } }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Edit Employee</DialogTitle>
            </DialogHeader>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
              <div className="flex gap-2 border-b pb-2">
                <button type="button" onClick={() => setEditTab("basic")} className={`px-4 py-2 text-sm font-medium rounded-t-lg ${editTab === "basic" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>Basic Info</button>
                <button type="button" onClick={() => setEditTab("salary")} className={`px-4 py-2 text-sm font-medium rounded-t-lg ${editTab === "salary" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>Salary Config</button>
                <button type="button" onClick={() => setEditTab("bank")} className={`px-4 py-2 text-sm font-medium rounded-t-lg ${editTab === "bank" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>Bank & Contact</button>
              </div>
              {editTab === "basic" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Employee ID</label>
                    <Input {...editForm.register("employeeId")} data-testid="input-edit-employee-id" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <Input {...editForm.register("fullName")} data-testid="input-edit-employee-name" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Role</label>
                    <Select onValueChange={(val) => editForm.setValue("role", val)} value={editForm.watch("role")}>
                      <SelectTrigger data-testid="select-edit-role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles?.filter(r => r.isActive).map((role) => (
                          <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Department</label>
                    <Input {...editForm.register("department")} data-testid="input-edit-employee-department" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Work Location</label>
                    <Input {...editForm.register("workLocation")} placeholder="Main Office" data-testid="input-edit-work-location" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Joining Date</label>
                    <Input type="date" {...editForm.register("joinDate")} data-testid="input-edit-employee-joining-date" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={editForm.watch("status") ?? undefined} onValueChange={(val) => editForm.setValue("status", val)}>
                      <SelectTrigger data-testid="select-edit-employee-status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="on_leave">On Leave</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              {editTab === "salary" && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-primary mb-3">Basic Salary</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Salary Type *</label>
                        <Select value={editForm.watch("salaryType")} onValueChange={(val) => editForm.setValue("salaryType", val)}>
                          <SelectTrigger data-testid="select-edit-salary-type"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Basic Salary (₹) *</label>
                        <Input type="number" {...editForm.register("basicSalary")} data-testid="input-edit-basic-salary" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-primary mb-3">Allowances</h4>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">HRA</label>
                        <Input type="number" {...editForm.register("hra")} placeholder="0" data-testid="input-edit-hra" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">DA</label>
                        <Input type="number" {...editForm.register("da")} placeholder="0" data-testid="input-edit-da" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Travel</label>
                        <Input type="number" {...editForm.register("travelAllowance")} placeholder="0" data-testid="input-edit-travel" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Medical</label>
                        <Input type="number" {...editForm.register("medicalAllowance")} placeholder="0" data-testid="input-edit-medical" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Other Allowances</label>
                        <Input type="number" {...editForm.register("otherAllowances")} placeholder="0" data-testid="input-edit-other-allowances" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-destructive mb-3">Deductions</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">PF Deduction</label>
                        <Input type="number" {...editForm.register("pfDeduction")} placeholder="0" data-testid="input-edit-pf" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">ESI Deduction</label>
                        <Input type="number" {...editForm.register("esiDeduction")} placeholder="0" data-testid="input-edit-esi" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">TDS Deduction</label>
                        <Input type="number" {...editForm.register("tdsDeduction")} placeholder="0" data-testid="input-edit-tds" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Professional Tax</label>
                        <Input type="number" {...editForm.register("professionalTax")} placeholder="0" data-testid="input-edit-professional-tax" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">Other Deductions</label>
                        <Input type="number" {...editForm.register("otherDeductions")} placeholder="0" data-testid="input-edit-other-deductions" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {editTab === "bank" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bank Name</label>
                    <Input {...editForm.register("bankName")} placeholder="State Bank of India" data-testid="input-edit-bank-name" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bank Account Number</label>
                    <Input {...editForm.register("bankAccountNumber")} data-testid="input-edit-bank-account" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bank IFSC Code</label>
                    <Input {...editForm.register("ifscCode")} data-testid="input-edit-ifsc" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">PAN Number</label>
                    <Input {...editForm.register("panNumber")} data-testid="input-edit-pan" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone</label>
                    <Input {...editForm.register("phone")} data-testid="input-edit-phone" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input {...editForm.register("email")} data-testid="input-edit-email" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Address</label>
                    <Input {...editForm.register("address")} data-testid="input-edit-address" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Password (for employee portal)</label>
                    <Input type="password" {...editForm.register("password")} placeholder="Leave blank to keep unchanged" data-testid="input-edit-password" />
                    <p className="text-xs text-muted-foreground">Update password for employee portal login</p>
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="submit" disabled={isUpdating} data-testid="button-save-employee">
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Loading employees...</TableCell>
                </TableRow>
              ) : filteredEmployees?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No employees found</TableCell>
                </TableRow>
              ) : (
                filteredEmployees?.map((emp) => (
                  <TableRow key={emp.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/employees/${emp.id}`)} data-testid={`row-employee-${emp.id}`}>
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
                    <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => { e.stopPropagation(); handleViewPassword(emp); }}
                          title="View Password"
                          data-testid={`button-view-password-${emp.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => { e.stopPropagation(); setChangePasswordEmp(emp); setNewPassword(""); }}
                          title="Change Password"
                          data-testid={`button-change-password-${emp.id}`}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => { e.stopPropagation(); handleEditClick(emp); }}
                          data-testid={`button-edit-employee-${emp.id}`}
                        >
                          <Pencil className="h-4 w-4" />
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

      <AlertDialog open={!!viewPasswordEmp} onOpenChange={() => setViewPasswordEmp(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Employee Password</AlertDialogTitle>
            <AlertDialogDescription>
              Password for <span className="font-semibold">{viewPasswordEmp?.fullName}</span> ({viewPasswordEmp?.employeeId})
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            {viewPasswordValue === null ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <KeyRound className="h-5 w-5 text-primary" />
                <span className="font-mono text-lg font-bold tracking-wider" data-testid="text-employee-password">{viewPasswordValue}</span>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-close-view-password">Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!changePasswordEmp} onOpenChange={() => { setChangePasswordEmp(null); setNewPassword(""); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Password</AlertDialogTitle>
            <AlertDialogDescription>
              Set a new password for <span className="font-semibold">{changePasswordEmp?.fullName}</span> ({changePasswordEmp?.employeeId})
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              type="text"
              placeholder="Enter new password (min 4 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              data-testid="input-new-password"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-change-password">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleChangePassword}
              disabled={passwordLoading || newPassword.length < 4}
              data-testid="button-confirm-change-password"
            >
              {passwordLoading ? "Updating..." : "Update Password"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
