import { useDashboardStats } from "@/hooks/use-dashboard";
import { StatsCard } from "@/components/StatsCard";
import {
  Package,
  Users,
  AlertTriangle,
  IndianRupee,
  Activity
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Mock data for charts (backend could provide this later)
const stockTrends = [
  { name: 'Jan', stock: 4000 },
  { name: 'Feb', stock: 3000 },
  { name: 'Mar', stock: 2000 },
  { name: 'Apr', stock: 2780 },
  { name: 'May', stock: 1890 },
  { name: 'Jun', stock: 2390 },
];

const productionData = [
  { name: 'Week 1', output: 2400 },
  { name: 'Week 2', output: 1398 },
  { name: 'Week 3', output: 9800 },
  { name: 'Week 4', output: 3908 },
];

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();

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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight font-display text-primary">Dashboard</h2>
        <p className="text-muted-foreground">Overview of seed production and operations.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Active Batches"
          value={stats?.activeBatches ?? 0}
          icon={Package}
          className="border-l-blue-500"
        />
        <StatsCard
          title="Total Stock (KG)"
          value={stats?.totalStock?.toLocaleString() ?? 0}
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
          title="Pending Payroll"
          value={stats?.pendingPayroll ?? 0}
          icon={IndianRupee}
          className="border-l-red-500"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Stock Trends</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={stockTrends}>
                <defs>
                  <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}kg`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <Tooltip />
                <Area type="monotone" dataKey="stock" stroke="var(--primary)" fillOpacity={1} fill="url(#colorStock)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.lowStockBatches?.length === 0 ? (
                <p className="text-sm text-muted-foreground">No low stock alerts.</p>
              ) : (
                stats?.lowStockBatches?.map((batch: any) => (
                  <div key={batch.id} className="flex items-center justify-between p-4 border rounded-lg bg-red-50/50 border-red-100 dark:bg-red-900/10 dark:border-red-900/50">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{batch.crop} - {batch.variety}</p>
                      <p className="text-xs text-muted-foreground">Batch: {batch.batchNumber}</p>
                    </div>
                    <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      {batch.currentQuantity} kg
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
