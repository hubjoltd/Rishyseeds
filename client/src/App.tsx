import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

// Pages
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Batches from "@/pages/Batches";
import Employees from "@/pages/Employees";
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
    <div className="flex min-h-screen bg-muted/10">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <Component />
      </main>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
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
