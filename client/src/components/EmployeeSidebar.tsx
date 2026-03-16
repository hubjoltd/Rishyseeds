import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Clock,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  User,
  ArrowDownToLine,
  Factory,
  Boxes,
  ArrowRightLeft,
  Truck,
  ChevronDown,
  Navigation,
  BanknoteIcon,
  ClipboardList,
  CalendarDays,
  MessageSquare,
  Umbrella,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "/favicon.png";

interface MenuItem {
  icon: React.ElementType;
  label: string;
  href: string;
  resource?: string;
}

interface MenuSection {
  title: string;
  icon: React.ElementType;
  items: MenuItem[];
  sectionResource?: string;
}

const mainMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/employee-portal", resource: "dashboard" },
  { icon: Clock, label: "Attendance", href: "/employee-portal/attendance", resource: "attendance" },
  { icon: FileText, label: "Payslips", href: "/employee-portal/payslips", resource: "payroll" },
  { icon: Navigation, label: "My Trips", href: "/employee-portal/trips" },
  { icon: ClipboardList, label: "My Tasks", href: "/employee-portal/tasks" },
  { icon: BanknoteIcon, label: "My Expenses", href: "/employee-portal/expenses" },
  { icon: Umbrella, label: "Leave", href: "/employee-portal/leave" },
  { icon: CalendarDays, label: "Calendar", href: "/employee-portal/calendar" },
  { icon: MessageSquare, label: "Chat", href: "/employee-portal/chat" },
  { icon: User, label: "My Profile", href: "/employee-portal/profile" },
];

const plantOperationsSection: MenuSection = {
  title: "Plant Operations",
  icon: Factory,
  sectionResource: "lots",
  items: [
    { icon: ArrowDownToLine, label: "Inward", href: "/employee-portal/inward", resource: "lots" },
    { icon: ArrowRightLeft, label: "Stock Movement", href: "/employee-portal/stock-movement", resource: "stock" },
    { icon: Factory, label: "Processing", href: "/employee-portal/processing", resource: "processing" },
    { icon: Boxes, label: "Packing", href: "/employee-portal/packing", resource: "packaging" },
    { icon: Truck, label: "Outward", href: "/employee-portal/outward", resource: "outward" },
  ],
};

type EmployeePermissions = Record<string, string[]>;

interface EmployeeSidebarProps {
  employee: {
    fullName: string;
    employeeId: string;
    role?: string;
  } | null;
  onLogout: () => void;
  permissions?: EmployeePermissions;
}

export function EmployeeSidebar({ employee, onLogout, permissions = {} }: EmployeeSidebarProps) {
  const [location] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isPlantOpsOpen, setIsPlantOpsOpen] = useState(true);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  const isActive = (href: string) => {
    if (href === "/employee-portal") {
      return location === "/employee-portal" || location === "/employee-portal/";
    }
    return location.startsWith(href);
  };

  const hasPermission = (resource: string): boolean => {
    if (!resource) return true;
    const resourcePerms = permissions[resource];
    return Array.isArray(resourcePerms) && resourcePerms.length > 0;
  };

  const filteredMainItems = mainMenuItems.filter(item => 
    !item.resource || hasPermission(item.resource)
  );

  const filteredPlantOpsItems = plantOperationsSection.items.filter(item =>
    !item.resource || hasPermission(item.resource)
  );

  const showPlantOps = filteredPlantOpsItems.length > 0 || 
    (plantOperationsSection.sectionResource && hasPermission(plantOperationsSection.sectionResource));

  const isPlantOpsActive = filteredPlantOpsItems.some((item) => isActive(item.href));

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className={cn(
        "flex items-center border-b border-green-200/50 transition-all duration-300",
        isCollapsed ? "justify-center p-4" : "gap-3 p-4"
      )}>
        <img src={logo} alt="Rishi Seeds" className={cn("transition-all", isCollapsed ? "w-10 h-10" : "w-12 h-12")} />
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-primary text-lg truncate">Employee Portal</h1>
            <p className="text-xs text-muted-foreground truncate">{employee?.fullName || "Loading..."}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {filteredMainItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link href={item.href}>
                  <div
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer",
                      active
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover-elevate",
                      isCollapsed && "justify-center"
                    )}
                    data-testid={`nav-employee-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Icon className={cn("flex-shrink-0", isCollapsed ? "w-6 h-6" : "w-5 h-5")} />
                    {!isCollapsed && <span className="truncate font-medium">{item.label}</span>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        {showPlantOps && (
          <div className="mt-4">
            {!isCollapsed && (
              <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Plant Operations
              </p>
            )}
            <div
              onClick={() => !isCollapsed && setIsPlantOpsOpen(!isPlantOpsOpen)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer",
                isPlantOpsActive && isCollapsed
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover-elevate",
                isCollapsed && "justify-center"
              )}
              data-testid="nav-employee-plant-operations"
            >
              <Factory className={cn("flex-shrink-0", isCollapsed ? "w-6 h-6" : "w-5 h-5")} />
              {!isCollapsed && (
                <>
                  <span className="truncate font-medium flex-1">Operations</span>
                  <ChevronDown className={cn("w-4 h-4 transition-transform", isPlantOpsOpen && "rotate-180")} />
                </>
              )}
            </div>

            {(isPlantOpsOpen || isCollapsed) && (
              <ul className={cn("space-y-1", !isCollapsed && "ml-4 mt-1")}>
                {filteredPlantOpsItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <li key={item.href}>
                      <Link href={item.href}>
                        <div
                          onClick={() => setIsMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer",
                            active
                              ? "bg-primary text-primary-foreground shadow-md"
                              : "text-muted-foreground hover-elevate",
                            isCollapsed && "justify-center"
                          )}
                          data-testid={`nav-employee-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <Icon className={cn("flex-shrink-0", isCollapsed ? "w-5 h-5" : "w-4 h-4")} />
                          {!isCollapsed && <span className="truncate text-sm">{item.label}</span>}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </nav>

      <div className="border-t border-green-200/50 p-2">
        {!isCollapsed && employee && (
          <div className="px-3 py-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{employee.fullName}</p>
                <p className="text-xs text-muted-foreground truncate">{employee.role || employee.employeeId}</p>
              </div>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          onClick={onLogout}
          className={cn(
            "w-full text-destructive",
            isCollapsed ? "justify-center px-2" : "justify-start"
          )}
          data-testid="button-employee-logout"
        >
          <LogOut className={cn("flex-shrink-0", isCollapsed ? "w-5 h-5" : "w-4 h-4 mr-2")} />
          {!isCollapsed && "Logout"}
        </Button>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={toggleCollapse}
        className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 p-0 rounded-full shadow-md"
        data-testid="button-employee-collapse-sidebar"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </Button>
    </div>
  );

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMobile}
        className="lg:hidden fixed top-4 left-4 z-50 bg-white shadow-md"
        data-testid="button-employee-mobile-menu"
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed lg:relative z-40 h-full bg-gradient-to-b from-green-50/80 to-white border-r border-green-100 transition-all duration-300 flex flex-col",
          isCollapsed ? "lg:w-[72px]" : "lg:w-64",
          isMobileOpen ? "w-64 translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
