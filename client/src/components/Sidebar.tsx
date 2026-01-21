import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Sprout,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Package,
  MapPin,
  ClipboardCheck
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import logo from "@assets/20260121014034_1768984704057.webp";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  {
    label: "Seed Operations",
    icon: Sprout,
    children: [
      { icon: Package, label: "Batches", href: "/batches" },
      { icon: MapPin, label: "Locations", href: "/locations" },
      { icon: ClipboardCheck, label: "Stock & Packaging", href: "/stock" },
    ]
  },
  {
    label: "HRMS",
    icon: Users,
    children: [
      { icon: Users, label: "Employees", href: "/employees" },
      { icon: ClipboardCheck, label: "Attendance", href: "/attendance" },
    ]
  },
  { icon: CreditCard, label: "Payroll", href: "/payroll" },
];

export function Sidebar() {
  const [location] = useLocation();
  const { logout } = useAuth();

  return (
    <div className="h-screen w-64 bg-card border-r flex flex-col fixed left-0 top-0 z-20 shadow-xl">
      <div className="p-6 border-b flex items-center justify-center">
        {/* Static logo import */}
        <img src={logo} alt="Rishi Seeds" className="h-12 w-auto object-contain" />
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
        {menuItems.map((item, index) => {
          if (item.children) {
            return (
              <div key={index} className="space-y-1">
                <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {item.label}
                </div>
                {item.children.map((child) => (
                  <Link key={child.href} href={child.href}>
                    <div className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer text-sm font-medium",
                      location === child.href
                        ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}>
                      <child.icon className="w-4 h-4" />
                      {child.label}
                    </div>
                  </Link>
                ))}
              </div>
            );
          }

          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer text-sm font-medium",
                location === item.href
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t bg-muted/20">
        <button
          onClick={() => logout()}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
