import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Sprout,
  Users,
  CreditCard,
  LogOut,
  Package,
  MapPin,
  ArrowRightLeft,
  Boxes,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Leaf,
  UserCircle,
  CalendarCheck,
  Building2,
  Shield,
  PackagePlus,
  Cog,
  Truck,
  Menu,
  X
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import logo from "@assets/20260121014034_1768984704057.webp";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/NotificationBell";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface MenuItem {
  icon: React.ElementType;
  label: string;
  href?: string;
  roles?: string[];
  children?: { icon: React.ElementType; label: string; href: string; roles?: string[] }[];
}

const allMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/", roles: ["admin", "manager", "hr", "godown_operator", "production_operator", "dispatch_operator"] },
  {
    label: "Master Data",
    icon: Building2,
    roles: ["admin", "manager"],
    children: [
      { icon: Leaf, label: "Varieties", href: "/products", roles: ["admin", "manager"] },
      { icon: MapPin, label: "Warehouses", href: "/locations", roles: ["admin", "manager"] },
      { icon: Package, label: "Packaging Sizes", href: "/packaging-sizes", roles: ["admin", "manager"] },
    ]
  },
  {
    label: "Plant Operations",
    icon: Sprout,
    roles: ["admin", "manager", "godown_operator", "production_operator", "dispatch_operator"],
    children: [
      { icon: PackagePlus, label: "Inward", href: "/inward", roles: ["admin", "manager", "godown_operator"] },
      { icon: ArrowRightLeft, label: "Stock Movement", href: "/stock", roles: ["admin", "manager", "godown_operator"] },
      { icon: Cog, label: "Processing", href: "/processing", roles: ["admin", "manager", "production_operator"] },
      { icon: Boxes, label: "Packaging", href: "/packaging", roles: ["admin", "manager", "production_operator"] },
      { icon: Truck, label: "Outward", href: "/outward", roles: ["admin", "manager", "dispatch_operator"] },
    ]
  },
  {
    label: "HRMS",
    icon: Users,
    roles: ["admin", "hr"],
    children: [
      { icon: UserCircle, label: "Employees", href: "/employees", roles: ["admin", "hr"] },
      { icon: CalendarCheck, label: "Attendance", href: "/attendance", roles: ["admin", "hr"] },
    ]
  },
  {
    label: "Finance",
    icon: CreditCard,
    roles: ["admin", "hr"],
    children: [
      { icon: CreditCard, label: "Payroll", href: "/payroll", roles: ["admin", "hr"] },
    ]
  },
  { icon: MapPin, label: "Trip Tracking", href: "/trips", roles: ["admin", "manager"] },
  { icon: FileText, label: "Reports", href: "/reports", roles: ["admin", "manager", "hr", "godown_operator", "production_operator", "dispatch_operator"] },
  {
    label: "Administration",
    icon: Shield,
    roles: ["admin"],
    children: [
      { icon: Users, label: "Users", href: "/users", roles: ["admin"] },
      { icon: Shield, label: "Roles", href: "/roles", roles: ["admin"] },
    ]
  },
];

const roleLabels: Record<string, string> = {
  admin: "Administrator",
  manager: "Plant Manager",
  hr: "HR Manager",
  godown_operator: "Godown Operator",
  production_operator: "Production Operator",
  dispatch_operator: "Dispatch Operator",
};

function SidebarContent({ 
  collapsed, 
  setCollapsed, 
  onNavigate 
}: { 
  collapsed: boolean; 
  setCollapsed: (v: boolean) => void;
  onNavigate?: () => void;
}) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [expandedSections, setExpandedSections] = useState<string[]>(["Master Data", "Plant Operations", "HRMS", "Finance", "Administration"]);
  
  const userRole = user?.role || "admin";
  
  const menuItems = allMenuItems.filter(item => 
    !item.roles || item.roles.includes(userRole)
  ).map(item => ({
    ...item,
    children: item.children?.filter(child => 
      !child.roles || child.roles.includes(userRole)
    )
  }));

  const toggleSection = (label: string) => {
    setExpandedSections(prev => 
      prev.includes(label) ? prev.filter(s => s !== label) : [...prev, label]
    );
  };

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  const handleNavClick = () => {
    onNavigate?.();
  };

  return (
    <div className="h-full flex flex-col">
      <div className={cn(
        "flex items-center gap-3 p-4 border-b border-primary/10",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <div className="flex items-center gap-3">
            <img src={logo} alt="Rishi Seeds" className="w-10 h-10 object-contain" />
            <div>
              <h1 className="text-lg font-bold text-primary font-display">Rishi Seeds</h1>
              <p className="text-[10px] text-muted-foreground">Admin Panel</p>
            </div>
          </div>
        )}
        {collapsed && (
          <img src={logo} alt="Rishi Seeds" className="w-9 h-9 object-contain" />
        )}
        <div className="flex items-center gap-1">
          <NotificationBell />
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-8 w-8 shrink-0 hidden md:flex", collapsed && "absolute -right-4 bg-card border shadow-sm z-10")}
            onClick={() => setCollapsed(!collapsed)}
            data-testid="button-toggle-sidebar"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.label}>
              {item.href ? (
                <Link href={item.href} onClick={handleNavClick}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200",
                      isActive(item.href) 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      collapsed && "justify-center px-2"
                    )}
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    <item.icon className={cn("w-5 h-5 shrink-0", isActive(item.href) && "text-primary")} />
                    {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                  </div>
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => toggleSection(item.label)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-muted-foreground hover:bg-muted hover:text-foreground",
                      collapsed && "justify-center px-2"
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                        <ChevronDown className={cn(
                          "w-4 h-4 transition-transform duration-200",
                          expandedSections.includes(item.label) && "rotate-180"
                        )} />
                      </>
                    )}
                  </button>
                  {!collapsed && expandedSections.includes(item.label) && item.children && (
                    <ul className="mt-1 ml-4 space-y-1 border-l border-primary/20 pl-3">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link href={child.href} onClick={handleNavClick}>
                            <div
                              className={cn(
                                "flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 text-sm",
                                isActive(child.href)
                                  ? "bg-primary/10 text-primary font-medium"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                              )}
                              data-testid={`nav-${child.label.toLowerCase().replace(/\s/g, '-')}`}
                            >
                              <child.icon className="w-4 h-4 shrink-0" />
                              <span>{child.label}</span>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {user && !collapsed && (
        <div className="p-3 border-t border-primary/10">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCircle className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.fullName || user.username}</p>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 mt-0.5">
                {roleLabels[userRole] || userRole}
              </Badge>
            </div>
          </div>
        </div>
      )}

      <div className={cn(
        "p-3 border-t border-primary/10",
        collapsed ? "flex justify-center" : ""
      )}>
        <button
          onClick={() => logout()}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg w-full transition-all duration-200 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20",
            collapsed && "justify-center px-2"
          )}
          data-testid="button-logout"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>

      {!collapsed && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="pulse-dot" />
            <span>Real-time connected</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function MobileHeader() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden flex items-center justify-between p-3 border-b bg-card sticky top-0 z-50">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[280px]">
          <SidebarContent 
            collapsed={false} 
            setCollapsed={() => {}} 
            onNavigate={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
      <div className="flex items-center gap-2">
        <img src={logo} alt="Rishi Seeds" className="w-8 h-8 object-contain" />
        <span className="font-bold text-primary">Rishi Seeds</span>
      </div>
      <NotificationBell />
    </div>
  );
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        "h-screen bg-card flex-col transition-all duration-300 ease-in-out shadow-green hidden md:flex",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      <SidebarContent collapsed={collapsed} setCollapsed={setCollapsed} />
    </aside>
  );
}
