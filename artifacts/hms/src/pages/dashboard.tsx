import { AppLayout } from "@/components/layout/AppLayout";
import { useGetDashboardStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Activity, Bed, IndianRupee, FileText } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useGetDashboardStats();

  const isDoctor = user?.role === "doctor";
  const isAdmin = user?.role === "admin";
  const isReceptionist = user?.role === "receptionist";

  return (
    <AppLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Overview of today's clinical operations.</p>
          </div>
          {isReceptionist && (
            <Button asChild>
              <Link href="/patients/register">Register Patient</Link>
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="OPD Queue" 
              value={stats.opdCount.toString()} 
              subtext={`${stats.opdWaiting} waiting`}
              icon={<Activity className="w-4 h-4 text-primary" />}
            />
            <StatCard 
              title="IPD Census" 
              value={stats.currentIpdCensus.toString()} 
              subtext={`${stats.availableBeds} beds available`}
              icon={<Bed className="w-4 h-4 text-primary" />}
            />
            {(isAdmin || isReceptionist) && (
              <>
                <StatCard 
                  title="Today's Revenue" 
                  value={`₹${stats.todayRevenue.toLocaleString()}`} 
                  subtext="Cash + Mediclaim"
                  icon={<IndianRupee className="w-4 h-4 text-primary" />}
                />
                <StatCard 
                  title="Pending Claims" 
                  value={stats.pendingClaims.toString()} 
                  subtext="Requires action"
                  icon={<FileText className="w-4 h-4 text-primary" />}
                />
              </>
            )}
            {isDoctor && (
              <StatCard 
                title="Completed Consults" 
                value={stats.opdCompleted.toString()} 
                subtext="Today"
                icon={<Users className="w-4 h-4 text-primary" />}
              />
            )}
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
              <CardTitle className="text-lg font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2" asChild>
                <Link href="/opd">
                  <Activity className="w-6 h-6 text-primary" />
                  <span>OPD Board</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2" asChild>
                <Link href="/patients">
                  <Users className="w-6 h-6 text-primary" />
                  <span>Patient Directory</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2" asChild>
                <Link href="/ipd">
                  <Bed className="w-6 h-6 text-primary" />
                  <span>IPD Wards</span>
                </Link>
              </Button>
              {isAdmin && (
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2" asChild>
                  <Link href="/reports">
                    <IndianRupee className="w-6 h-6 text-primary" />
                    <span>Revenue Reports</span>
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="border-b pb-2">
              <CardTitle className="text-lg font-medium">Recent Updates</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <p>System running smoothly.</p>
                <p className="text-sm">No critical alerts.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({ title, value, subtext, icon }: { title: string, value: string, subtext: string, icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-muted-foreground text-sm">{title}</h3>
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            {icon}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-3xl font-display font-bold">{value}</span>
          <span className="text-sm text-muted-foreground">{subtext}</span>
        </div>
      </CardContent>
    </Card>
  );
}
