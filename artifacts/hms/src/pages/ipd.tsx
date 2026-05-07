import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListBeds, useListAdmissions, getListBedsQueryKey, getListAdmissionsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Bed, Users, ChevronRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ROOM_LABELS: Record<string, string> = { general: "General", semi_special: "Semi-Special", special: "Special" };

export default function Ipd() {
  const { data: beds, isLoading: loadingBeds } = useListBeds();
  const { data: admissions, isLoading: loadingAdmissions } = useListAdmissions({ status: "admitted" });

  type Bed = NonNullable<typeof beds>[number];
  const bedsByType = (beds ?? []).reduce((acc, bed) => {
    if (!acc[bed.roomType]) acc[bed.roomType] = [];
    acc[bed.roomType]!.push(bed);
    return acc;
  }, {} as Record<string, Bed[]>);

  const totalBeds = (beds ?? []).length;
  const occupiedBeds = (beds ?? []).filter(b => b.status === "occupied").length;

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">IPD Management</h1>
            <p className="text-muted-foreground mt-1">{occupiedBeds}/{totalBeds} beds occupied</p>
          </div>
          <Button asChild data-testid="button-admit-patient">
            <Link href="/ipd/admit"><Plus className="w-4 h-4 mr-2" />Admit Patient</Link>
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="p-4 text-center">
            <p className="text-3xl font-display font-bold">{totalBeds}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Beds</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-3xl font-display font-bold text-amber-600">{occupiedBeds}</p>
            <p className="text-xs text-muted-foreground mt-1">Occupied</p>
          </CardContent></Card>
          <Card><CardContent className="p-4 text-center">
            <p className="text-3xl font-display font-bold text-green-600">{totalBeds - occupiedBeds}</p>
            <p className="text-xs text-muted-foreground mt-1">Available</p>
          </CardContent></Card>
        </div>

        <Tabs defaultValue="beds">
          <TabsList>
            <TabsTrigger value="beds"><Bed className="w-4 h-4 mr-2" />Bed Grid</TabsTrigger>
            <TabsTrigger value="admissions"><Users className="w-4 h-4 mr-2" />Current Admissions</TabsTrigger>
          </TabsList>

          <TabsContent value="beds" className="mt-4 space-y-6">
            {loadingBeds ? (
              <Skeleton className="h-48 w-full" />
            ) : Object.entries(bedsByType).map(([type, typeBeds]) => (
              <div key={type}>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {ROOM_LABELS[type] ?? type}
                </h3>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                  {(typeBeds ?? []).map(bed => (
                    <div key={bed.id}
                      className={`aspect-square rounded-xl border flex flex-col items-center justify-center text-xs font-medium transition-colors ${bed.status === "available" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}
                      title={bed.status === "occupied" ? (bed.currentPatientName ?? "Occupied") : "Available"}
                      data-testid={`bed-${bed.id}`}
                    >
                      <Bed className="w-4 h-4 mb-1" />
                      <span>{bed.bedNumber}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {!loadingBeds && (beds ?? []).length === 0 && (
              <div className="text-center py-10 text-muted-foreground text-sm">No beds configured</div>
            )}
          </TabsContent>

          <TabsContent value="admissions" className="mt-4 space-y-2">
            {loadingAdmissions ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
            ) : (admissions ?? []).length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">No current admissions</div>
            ) : (
              (admissions ?? []).map(admission => {
                const days = Math.floor((Date.now() - new Date(admission.admissionDate).getTime()) / 86400000);
                return (
                  <Link key={admission.id} href={`/ipd/${admission.id}`}>
                    <div className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent/30 transition-colors cursor-pointer" data-testid={`card-admission-${admission.id}`}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                          {admission.patientName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold">{admission.patientName}</p>
                          <p className="text-xs text-muted-foreground">
                            Bed {admission.bedNumber} · {ROOM_LABELS[admission.roomType] ?? admission.roomType}
                            {admission.doctorName ? ` · Dr. ${admission.doctorName}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                          <Badge variant="outline" className="capitalize">{admission.admissionType}</Badge>
                          <p className="text-xs text-muted-foreground mt-1">{days === 0 ? "Admitted today" : `${days} day${days !== 1 ? "s" : ""} admitted`}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
