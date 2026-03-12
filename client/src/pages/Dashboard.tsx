import { useDashboardStats } from "@/hooks/use-dashboard";
import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "@/components/StatsCard";
import {
  Package,
  Users,
  AlertTriangle,
  TrendingDown,
  Activity,
  ArrowUpRight,
  MapPin,
  Boxes,
  ArrowDownToLine,
  PackageCheck,
  Truck,
  UserCheck,
  ClipboardList,
  Navigation
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const CHART_COLORS = [
  "#22c55e", "#3b82f6", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"
];

function activityIcon(type: string) {
  switch (type) {
    case "inward": return <ArrowDownToLine className="h-3.5 w-3.5 text-green-600" />;
    case "packaging": return <PackageCheck className="h-3.5 w-3.5 text-blue-600" />;
    case "outward": return <Truck className="h-3.5 w-3.5 text-orange-600" />;
    case "trip": return <Navigation className="h-3.5 w-3.5 text-purple-600" />;
    case "task": return <ClipboardList className="h-3.5 w-3.5 text-cyan-600" />;
    case "attendance": return <UserCheck className="h-3.5 w-3.5 text-emerald-600" />;
    default: return <Activity className="h-3.5 w-3.5 text-muted-foreground" />;
  }
}

function activityBadgeColor(type: string) {
  const map: Record<string, string> = {
    inward: "bg-green-50 text-green-700 border-green-200",
    packaging: "bg-blue-50 text-blue-700 border-blue-200",
    outward: "bg-orange-50 text-orange-700 border-orange-200",
    trip: "bg-purple-50 text-purple-700 border-purple-200",
    task: "bg-cyan-50 text-cyan-700 border-cyan-200",
    attendance: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return map[type] || "bg-muted text-muted-foreground border-muted";
}

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: feedsData } = useQuery<any[]>({
    queryKey: ["/api/feeds"],
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  const stockByLot: { name: string; stock: number }[] = (stats as any)?.stockByLot || [];
  const locationData: { name: string; stock: number }[] = (stats as any)?.locationData || [];
  const lowStockLots: { id: number; lotNumber: string; initialQuantity: string; currentBalance: number }[] =
    (stats as any)?.lowStockLots || [];

  const totalLooseStock: number = (stats as any)?.totalLooseStock ?? stats?.totalStock ?? 0;
  const activeLots: number = (stats as any)?.activeLots ?? stats?.activeBatches ?? 0;
  const totalPackedPackets: number = (stats as any)?.totalPackedPackets ?? 0;
  const totalPackagingBags: number = (stats as any)?.totalPackagingBags ?? 0;

  const recentInventoryActivity: { id: string; type: string; label: string; detail: string; date: string }[] =
    (stats as any)?.recentActivity || [];

  const employeeFeeds: any[] = feedsData?.slice(0, 8) || [];

  const shortName = (name: string) => name.length > 12 ? name.slice(0, 12) + ".." : name;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight font-display text-primary">Dashboard</h2>
        <p className="text-muted-foreground">Real-time overview of seed stock and operations.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Lots"
          value={activeLots}
          icon={Package}
          className="border-l-blue-500"
        />
        <StatsCard
          title="Total Loose Stock (KG)"
          value={totalLooseStock.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          icon={Activity}
          className="border-l-green-500"
        />
        <StatsCard
          title="Active Employees"
          value={stats?.totalEmployees ?? 0}
          icon={Users}
          className="border-l-orange-500"
        />
        <StatsCard
          title="Total Packed Packets"
          value={(totalPackedPackets + totalPackagingBags).toLocaleString()}
          icon={Boxes}
          className="border-l-purple-500"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Current Stock by Lot (KG)</CardTitle>
            <CardDescription>Live loose seed balance per active lot</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {stockByLot.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No stock data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stockByLot} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    tickFormatter={shortName}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}kg`}
                  />
                  <Tooltip formatter={(value: number) => [`${value.toFixed(2)} kg`, "Loose Stock"]} />
                  <Bar dataKey="stock" radius={[4, 4, 0, 0]}>
                    {stockByLot.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle>
              {lowStockLots.length > 0 ? (
                <span className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  Low Stock Alerts
                </span>
              ) : "Low Stock Alerts"}
            </CardTitle>
            <CardDescription>Lots below 20% of initial quantity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockLots.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <Activity className="w-8 h-8 mb-2 text-green-500" />
                  <p className="text-sm font-medium">All stock levels healthy</p>
                  <p className="text-xs">No lots below 20% threshold</p>
                </div>
              ) : (
                lowStockLots.map((lot) => {
                  const pct = Math.round((lot.currentBalance / Number(lot.initialQuantity)) * 100);
                  return (
                    <div
                      key={lot.id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-red-50/50 border-red-100 dark:bg-red-900/10 dark:border-red-900/50"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none font-mono">{lot.lotNumber}</p>
                        <p className="text-xs text-muted-foreground">Initial: {lot.initialQuantity} kg</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1 text-red-600 font-bold text-sm">
                          <TrendingDown className="w-3 h-3" />
                          {lot.currentBalance.toFixed(2)} kg
                        </div>
                        <Badge variant="destructive" className="text-xs">{pct}% remaining</Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="w-4 h-4 text-primary" />
              Recent Inventory Activity
            </CardTitle>
            <CardDescription>Latest inward, packaging, and dispatch events</CardDescription>
          </CardHeader>
          <CardContent>
            {recentInventoryActivity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <Package className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">No recent inventory activity</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentInventoryActivity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-2.5 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                    <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${activityBadgeColor(item.type)}`}>
                      {activityIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {format(new Date(item.date), "d MMM")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-4 h-4 text-primary" />
              Employee Activity Feed
            </CardTitle>
            <CardDescription>Recent field trips, tasks, and attendance</CardDescription>
          </CardHeader>
          <CardContent>
            {employeeFeeds.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <Users className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">No recent employee activity</p>
              </div>
            ) : (
              <div className="space-y-2">
                {employeeFeeds.map((feed: any) => (
                  <div key={feed.id} className="flex items-start gap-3 p-2.5 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                    <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${activityBadgeColor(feed.actionType || feed.type)}`}>
                      {activityIcon(feed.actionType || feed.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{feed.employeeName}</p>
                      <p className="text-xs text-muted-foreground truncate">{feed.action}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {feed.dateTime ? format(new Date(feed.dateTime), "d MMM") : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Stock by Location (KG)
          </CardTitle>
          <CardDescription>Current loose seed stock distributed across all storage locations</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          {locationData.length === 0 ? (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground">
              No location data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={locationData} layout="vertical" margin={{ top: 5, right: 40, left: 8, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#888888"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}kg`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#888888"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  width={160}
                  tickFormatter={(v: string) => v.length > 22 ? v.slice(0, 22) + ".." : v}
                />
                <Tooltip formatter={(value: number) => [`${value.toFixed(2)} kg`, "Loose Stock"]} />
                <Bar dataKey="stock" radius={[0, 4, 4, 0]}>
                  {locationData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
