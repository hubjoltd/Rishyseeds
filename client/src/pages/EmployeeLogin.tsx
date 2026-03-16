import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo from "/favicon.png";

const EMPLOYEE_TOKEN_KEY = 'employee_auth_token';

function setEmployeeToken(token: string): void {
  localStorage.setItem(EMPLOYEE_TOKEN_KEY, token);
}

export function getEmployeeToken(): string | null {
  return localStorage.getItem(EMPLOYEE_TOKEN_KEY);
}

export function clearEmployeeToken(): void {
  localStorage.removeItem(EMPLOYEE_TOKEN_KEY);
}

const employeeLoginSchema = z.object({
  employeeId: z.string().min(1, "Email, mobile number, or Employee ID is required"),
  password: z.string().min(1, "Password is required"),
});

export default function EmployeeLogin() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof employeeLoginSchema>>({
    resolver: zodResolver(employeeLoginSchema),
    defaultValues: {
      employeeId: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: z.infer<typeof employeeLoginSchema>) => {
      const res = await fetch("/api/employee/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Login failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.token) {
        setEmployeeToken(data.token);
      }
      queryClient.setQueryData(["/api/employee/me"], data);
      toast({ title: "Welcome!", description: `Logged in as ${data.fullName}` });
      setLocation("/employee-portal");
    },
    onError: (error: Error) => {
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: z.infer<typeof employeeLoginSchema>) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/30">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

      <Card className="w-full max-w-md shadow-2xl border-primary/20">
        <CardHeader className="flex flex-col items-center space-y-4 pt-8">
          <img src={logo} alt="Rishi Seeds" className="h-24 w-auto object-contain" />
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold font-display text-primary">Employee Portal</h1>
            <p className="text-sm text-muted-foreground">Sign in to access your dashboard</p>
          </div>
        </CardHeader>
        <CardContent className="pt-6 pb-8 px-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="employeeId">Email / Mobile Number / Employee ID</Label>
              <Input
                id="employeeId"
                {...form.register("employeeId")}
                className="h-11"
                placeholder="Enter email, mobile number, or Employee ID"
                data-testid="input-employee-id"
              />
              {form.formState.errors.employeeId && (
                <p className="text-xs text-destructive">{form.formState.errors.employeeId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...form.register("password")}
                className="h-11"
                placeholder="Enter your password"
                data-testid="input-password"
              />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full h-11 text-base mt-2"
              disabled={loginMutation.isPending}
              data-testid="button-login"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
