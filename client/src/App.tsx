import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Sidebar, { MobileHeader } from "@/components/Sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

// Pages
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Batches from "@/pages/Batches";
import Employees from "@/pages/Employees";
import EmployeeProfile from "@/pages/EmployeeProfile";
import NotFound from "@/pages/not-found";
import Locations from "@/pages/Locations";
import Stock from "@/pages/Stock";
import Packaging from "@/pages/Packaging";
import Payroll from "@/pages/Payroll";
import Attendance from "@/pages/Attendance";
import Products from "@/pages/Products";
import Reports from "@/pages/Reports";
import LocationDetail from "@/pages/LocationDetail";
import Users from "@/pages/Users";
import Inward from "@/pages/Inward";
import Processing from "@/pages/Processing";
import Outward from "@/pages/Outward";
import PackagingSizes from "@/pages/PackagingSizes";
import EmployeeLogin from "@/pages/EmployeeLogin";
import EmployeeLayout from "@/pages/employee/EmployeeLayout";
import Roles from "@/pages/Roles";
import Trips from "@/pages/Trips";
import Tasks from "@/pages/Tasks";
import Customers from "@/pages/Customers";
import Feeds from "@/pages/Feeds";
import Dryer from "@/pages/Dryer";
import Expenses from "@/pages/Expenses";
import PurchasedStock from "@/pages/PurchasedStock";
import VarietyStock from "@/pages/VarietyStock";
import OverdueDryerAlert from "@/components/OverdueDryerAlert";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-muted/10">
      <MobileHeader />
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <Component />
      </main>
      <OverdueDryerAlert />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/employee-login" component={EmployeeLogin} />
      <Route path="/employee-portal/:rest*" component={EmployeeLayout} />
      <Route path="/employee-portal" component={EmployeeLayout} />
      
      {/* Protected Routes */}
      <Route path="/">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/batches">
        <ProtectedRoute component={Batches} />
      </Route>
      <Route path="/employees">
        <ProtectedRoute component={Employees} />
      </Route>
      <Route path="/employees/:id">
        <ProtectedRoute component={EmployeeProfile} />
      </Route>
      <Route path="/locations">
        <ProtectedRoute component={Locations} />
      </Route>
      <Route path="/locations/:id">
        <ProtectedRoute component={LocationDetail} />
      </Route>
      <Route path="/stock">
        <ProtectedRoute component={Stock} />
      </Route>
      <Route path="/packaging">
        <ProtectedRoute component={Packaging} />
      </Route>
      <Route path="/payroll">
        <ProtectedRoute component={Payroll} />
      </Route>
      <Route path="/attendance">
        <ProtectedRoute component={Attendance} />
      </Route>
      <Route path="/products">
        <ProtectedRoute component={Products} />
      </Route>
      <Route path="/reports">
        <ProtectedRoute component={Reports} />
      </Route>
      <Route path="/users">
        <ProtectedRoute component={Users} />
      </Route>
      <Route path="/roles">
        <ProtectedRoute component={Roles} />
      </Route>
      <Route path="/inward">
        <ProtectedRoute component={Inward} />
      </Route>
      <Route path="/processing">
        <ProtectedRoute component={Processing} />
      </Route>
      <Route path="/outward">
        <ProtectedRoute component={Outward} />
      </Route>
      <Route path="/packaging-sizes">
        <ProtectedRoute component={PackagingSizes} />
      </Route>
      <Route path="/trips">
        <ProtectedRoute component={Trips} />
      </Route>
      <Route path="/tasks">
        <ProtectedRoute component={Tasks} />
      </Route>
      <Route path="/customers">
        <ProtectedRoute component={Customers} />
      </Route>
      <Route path="/feeds">
        <ProtectedRoute component={Feeds} />
      </Route>
      <Route path="/dryer">
        <ProtectedRoute component={Dryer} />
      </Route>
      <Route path="/expenses">
        <ProtectedRoute component={Expenses} />
      </Route>
      <Route path="/purchased-stock">
        <ProtectedRoute component={PurchasedStock} />
      </Route>
      <Route path="/variety-stock">
        <ProtectedRoute component={VarietyStock} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
