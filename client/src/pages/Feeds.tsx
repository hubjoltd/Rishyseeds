import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Radio, Search, RefreshCw } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface Feed {
  id: string;
  employeeName: string;
  team: string;
  action: string;
  actionType: string;
  platform: string;
  intel: string;
  dateTime: string;
  taskCode?: string;
}

function fmtDT(dt: string) {
  try { return format(new Date(dt), "yyyy-MM-dd HH:mm:ss"); } catch { return dt; }
}

function fmtRelative(dt: string) {
  try { return formatDistanceToNow(new Date(dt), { addSuffix: true }); } catch { return "NA"; }
}

const ACTION_CONFIG: Record<string, { color: string; dot: string }> = {
  task_started: { color: "text-blue-600", dot: "bg-blue-500" },
  task_completed: { color: "text-green-600", dot: "bg-green-500" },
  task_assigned: { color: "text-purple-600", dot: "bg-purple-500" },
  trip_started: { color: "text-sky-600", dot: "bg-sky-500" },
  trip_ended: { color: "text-indigo-600", dot: "bg-indigo-500" },
  visit_in: { color: "text-orange-600", dot: "bg-orange-500" },
  visit_out: { color: "text-teal-600", dot: "bg-teal-500" },
  attendance_in: { color: "text-emerald-600", dot: "bg-emerald-500" },
  attendance_out: { color: "text-rose-600", dot: "bg-rose-500" },
};

export default function Feeds() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const { data: feeds = [], isLoading, refetch, isFetching } = useQuery<Feed[]>({
    queryKey: ["/api/feeds"],
    refetchInterval: 30000,
  });

  const filtered = feeds.filter(f => {
    const matchSearch =
      f.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      f.action.toLowerCase().includes(search.toLowerCase()) ||
      (f.intel || "").toLowerCase().includes(search.toLowerCase()) ||
      (f.taskCode || "").toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === "all" || f.actionType === actionFilter;
    return matchSearch && matchAction;
  });

  const actionTabs = [
    { key: "all", label: "All" },
    { key: "task_started", label: "Task Started" },
    { key: "task_completed", label: "Task Completed" },
    { key: "task_assigned", label: "Task Assigned" },
    { key: "trip_started", label: "Trip Started" },
    { key: "trip_ended", label: "Trip Ended" },
    { key: "visit_in", label: "Visit In" },
    { key: "visit_out", label: "Visit Out" },
    { key: "attendance_in", label: "Attendance In" },
    { key: "attendance_out", label: "Attendance Out" },
  ];

  return (
    <div className="space-y-5 animate-in fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Radio className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-bold font-display text-primary" data-testid="text-page-title">Feeds</h2>
            <p className="text-muted-foreground text-sm">Record</p>
          </div>
        </div>
        <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching} data-testid="button-refresh-feeds">
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="p-0">
          <div className="flex items-center gap-3 p-4 border-b justify-between flex-wrap">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employee, action..."
                className="pl-9 h-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
                data-testid="input-search-feeds"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {actionTabs.slice(0, 5).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActionFilter(key)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    actionFilter === key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                  data-testid={`filter-feeds-${key}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 border-b flex-wrap">
            {actionTabs.slice(5).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActionFilter(key)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  actionFilter === key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
                data-testid={`filter-feeds-${key}`}
              >
                {label}
              </button>
            ))}
            <span className="ml-auto text-xs text-muted-foreground">
              Fetch Total: 1 – {filtered.length} of {feeds.length} items
            </span>
          </div>

          {isLoading ? (
            <div className="p-10 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Intel</TableHead>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Friendly date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-14 text-muted-foreground">
                      <Radio className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      No feed records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((feed) => {
                    const config = ACTION_CONFIG[feed.actionType] || { color: "text-muted-foreground", dot: "bg-muted-foreground" };
                    return (
                      <TableRow key={feed.id} data-testid={`row-feed-${feed.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${config.dot}`} />
                            <span className="text-sm font-medium">{feed.employeeName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{feed.team || "NA"}</TableCell>
                        <TableCell>
                          <span className={`text-sm font-medium flex items-center gap-1.5 ${config.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                            {feed.action}
                            {feed.taskCode && (
                              <span className="text-xs text-muted-foreground font-normal">({feed.taskCode})</span>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground uppercase">{feed.platform}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{feed.intel || "NA"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{fmtDT(feed.dateTime)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{fmtRelative(feed.dateTime)}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}

          {filtered.length > 0 && (
            <div className="px-4 py-3 border-t flex items-center justify-between text-xs text-muted-foreground">
              <span>1 – {Math.min(filtered.length, 200)} of {feeds.length} items</span>
              <span>50 / Page</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
