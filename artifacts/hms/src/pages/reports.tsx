import { AppLayout } from "@/components/layout/AppLayout";
import { useGetDashboardStats, useGetOpdTrend, useGetRevenueReport, useGetBedOccupancy } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, IndianRupee, Bed, Activity } from "lucide-react";

export default function Reports() {
  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0];

  const { data: stats, isLoading: loadingStats } = useGetDashboardStats({ date: today });
  const { data: trend, isLoading: loadingTrend } = useGetOpdTrend({ days: 7 });
  const { data: revenue, isLoading: loadingRevenue } = useGetRevenueReport({ from: weekAgo, to: today });
  const { data: occupancy, isLoading: loadingOccupancy } = useGetBedOccupancy();

  const ROOM_LABELS: Record<string, string> = { general: "General", semi_special: "Semi-Special", special: "Special" };
  const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"];

  return (
    <AppLayout>
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Reports</h1>
          <p className="text-muted-foreground mt-1">Operational analytics and summaries</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loadingStats ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />) : (
            <>
              <Card><CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2"><Activity className="w-4 h-4 text-primary" /><span className="text-xs text-muted-foreground">Today OPD</span></div>
                <p className="text-2xl font-display font-bold">{stats?.opdCount ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stats?.opdCompleted ?? 0} completed</p>
              </CardContent></Card>
              <Card><CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2"><Bed className="w-4 h-4 text-primary" /><span className="text-xs text-muted-foreground">IPD Census</span></div>
                <p className="text-2xl font-display font-bold">{stats?.currentIpdCensus ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stats?.availableBeds ?? 0} beds free</p>
              </CardContent></Card>
              <Card><CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2"><IndianRupee className="w-4 h-4 text-primary" /><span className="text-xs text-muted-foreground">Today Revenue</span></div>
                <p className="text-2xl font-display font-bold">₹{(stats?.todayRevenue ?? 0).toLocaleString()}</p>
              </CardContent></Card>
              <Card><CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-primary" /><span className="text-xs text-muted-foreground">Pending Claims</span></div>
                <p className="text-2xl font-display font-bold">{stats?.pendingClaims ?? 0}</p>
              </CardContent></Card>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="border-b pb-3"><CardTitle className="text-base font-medium">OPD Trend (7 Days)</CardTitle></CardHeader>
            <CardContent className="p-5">
              {loadingTrend ? <Skeleton className="h-48 w-full" /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trend ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric" })} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => [v, "OPD Count"]} />
                    <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b pb-3"><CardTitle className="text-base font-medium">Bed Occupancy</CardTitle></CardHeader>
            <CardContent className="p-5">
              {loadingOccupancy ? <Skeleton className="h-48 w-full" /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={(occupancy?.byRoomType ?? []).map(r => ({ name: ROOM_LABELS[r.roomType] ?? r.roomType, Occupied: r.occupied, Available: r.available }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="Occupied" fill="hsl(var(--chart-1))" radius={[4,4,0,0]} />
                    <Bar dataKey="Available" fill="hsl(var(--chart-2))" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b pb-3"><CardTitle className="text-base font-medium">Revenue Breakdown (7 Days)</CardTitle></CardHeader>
            <CardContent className="p-5">
              {loadingRevenue ? <Skeleton className="h-48 w-full" /> : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 rounded-lg bg-chart-1/10 border border-chart-1/20">
                      <p className="text-xs text-muted-foreground">Cash</p>
                      <p className="text-lg font-bold">₹{(revenue?.cashRevenue ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-chart-2/10 border border-chart-2/20">
                      <p className="text-xs text-muted-foreground">Mediclaim</p>
                      <p className="text-lg font-bold">₹{(revenue?.mediclaimRevenue ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-chart-3/10 border border-chart-3/20">
                      <p className="text-xs text-muted-foreground">OPD Revenue</p>
                      <p className="text-lg font-bold">₹{(revenue?.opdRevenue ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted border">
                      <p className="text-xs text-muted-foreground">Pending</p>
                      <p className="text-lg font-bold">₹{(revenue?.pendingAmount ?? 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center border-t pt-3">
                    <span className="text-sm text-muted-foreground">Total Revenue</span>
                    <span className="font-bold text-lg">₹{(revenue?.totalRevenue ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b pb-3"><CardTitle className="text-base font-medium">Today's Summary</CardTitle></CardHeader>
            <CardContent className="p-5 space-y-3">
              {loadingStats ? <Skeleton className="h-48 w-full" /> : (
                <div className="space-y-3 text-sm">
                  {[
                    { label: "OPD Visits", value: stats?.opdCount ?? 0 },
                    { label: "OPD Completed", value: stats?.opdCompleted ?? 0 },
                    { label: "OPD Waiting", value: stats?.opdWaiting ?? 0 },
                    { label: "New IPD Admissions", value: stats?.ipdAdmissions ?? 0 },
                    { label: "IPD Discharges", value: stats?.ipdDischarges ?? 0 },
                    { label: "Current IPD Patients", value: stats?.currentIpdCensus ?? 0 },
                    { label: "Total Beds", value: stats?.totalBeds ?? 0 },
                    { label: "Beds Occupied", value: stats?.occupiedBeds ?? 0 },
                    { label: "Beds Available", value: stats?.availableBeds ?? 0 },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center py-1.5 border-b last:border-0">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-semibold">{row.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
