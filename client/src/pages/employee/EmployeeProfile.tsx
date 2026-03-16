import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getEmployeeToken } from "../EmployeeLogin";
import { 
  User, 
  Building2, 
  Lock, 
  Phone, 
  Mail, 
  MapPin, 
  Briefcase,
  CreditCard,
  Landmark,
  FileText,
  Calendar,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle
} from "lucide-react";

interface EmployeeProfileProps {
  employee: any;
}

export default function EmployeeProfile({ employee }: EmployeeProfileProps) {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getAuthHeaders = (): Record<string, string> => {
    const token = getEmployeeToken();
    if (!token) return {};
    return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  };

  const { data: fullEmployee, isLoading } = useQuery({
    queryKey: ["/api/employee/profile"],
    queryFn: async () => {
      const res = await fetch("/api/employee/profile", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await fetch("/api/employee/update-password", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update password");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Updated",
        description: "Your password has been successfully changed.",
        variant: "success",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 4) {
      toast({
        title: "Error",
        description: "Password must be at least 4 characters",
        variant: "destructive",
      });
      return;
    }
    updatePasswordMutation.mutate({ currentPassword, newPassword });
  };

  const emp = fullEmployee || employee;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: string | number | null) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-xl">
          <User className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-muted-foreground">View and manage your account</p>
        </div>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="personal" className="flex items-center gap-2" data-testid="tab-personal">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Personal</span>
          </TabsTrigger>
          <TabsTrigger value="bank" className="flex items-center gap-2" data-testid="tab-bank">
            <Landmark className="w-4 h-4" />
            <span className="hidden sm:inline">Bank</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2" data-testid="tab-security">
            <Lock className="w-4 h-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Details
              </CardTitle>
              <CardDescription>Your personal and employment information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-xl">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{emp.fullName}</h3>
                      <p className="text-muted-foreground">{emp.role || "Employee"}</p>
                      <Badge variant="secondary" className="mt-1">{emp.employeeId}</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-muted-foreground flex items-center gap-2">
                        <Briefcase className="w-4 h-4" /> Department
                      </Label>
                      <p className="font-medium">{emp.department || "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Work Location
                      </Label>
                      <p className="font-medium">{emp.workLocation || "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground flex items-center gap-2">
                        <Phone className="w-4 h-4" /> Phone
                      </Label>
                      <p className="font-medium">{emp.phone || "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground flex items-center gap-2">
                        <Mail className="w-4 h-4" /> Email
                      </Label>
                      <p className="font-medium">{emp.email || "-"}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4" /> Join Date
                      </Label>
                      <p className="font-medium">{formatDate(emp.joinDate)}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground flex items-center gap-2">
                        <CreditCard className="w-4 h-4" /> Salary Type
                      </Label>
                      <p className="font-medium capitalize">{emp.salaryType || "-"}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> Address
                    </Label>
                    <p className="font-medium">{emp.address || "-"}</p>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">Salary Components</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Basic Salary</p>
                        <p className="font-semibold text-green-700">{formatCurrency(emp.basicSalary)}</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-muted-foreground">HRA</p>
                        <p className="font-semibold text-green-700">{formatCurrency(emp.hra)}</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-muted-foreground">DA</p>
                        <p className="font-semibold text-green-700">{formatCurrency(emp.da)}</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Travel</p>
                        <p className="font-semibold text-green-700">{formatCurrency(emp.travelAllowance)}</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Medical</p>
                        <p className="font-semibold text-green-700">{formatCurrency(emp.medicalAllowance)}</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Other</p>
                        <p className="font-semibold text-green-700">{formatCurrency(emp.otherAllowances)}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bank" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="w-5 h-5" />
                Bank Details
              </CardTitle>
              <CardDescription>Your bank account and tax information</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-green-700">
                        <Building2 className="w-5 h-5" />
                        <span className="font-semibold">Bank Information</span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Bank Name</p>
                          <p className="font-medium">{emp.bankName || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Account Number</p>
                          <p className="font-medium font-mono">{emp.bankAccountNumber || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">IFSC Code</p>
                          <p className="font-medium font-mono">{emp.ifscCode || "-"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-purple-50 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-purple-700">
                        <FileText className="w-5 h-5" />
                        <span className="font-semibold">Tax Information</span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground">PAN Number</p>
                          <p className="font-medium font-mono">{emp.panNumber || "-"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-orange-50 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-orange-700">
                        <CreditCard className="w-5 h-5" />
                        <span className="font-semibold">Deductions</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">PF</p>
                          <p className="font-medium">{formatCurrency(emp.pfDeduction)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">ESI</p>
                          <p className="font-medium">{formatCurrency(emp.esiDeduction)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">TDS</p>
                          <p className="font-medium">{formatCurrency(emp.tdsDeduction)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Other</p>
                          <p className="font-medium">{formatCurrency(emp.otherDeductions)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Change Password
              </CardTitle>
              <CardDescription>Update your login password</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      data-testid="input-current-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={4}
                      data-testid="input-new-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={4}
                      data-testid="input-confirm-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-sm text-destructive">Passwords do not match</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  disabled={updatePasswordMutation.isPending || !currentPassword || !newPassword || newPassword !== confirmPassword}
                  className="w-full"
                  data-testid="button-update-password"
                >
                  {updatePasswordMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Update Password
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
