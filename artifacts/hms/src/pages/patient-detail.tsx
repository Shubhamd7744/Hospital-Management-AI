import { useParams, Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetPatient, useGetPatientVisits } from "@workspace/api-client-react";
import { getGetPatientQueryKey, getGetPatientVisitsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, MapPin, User, Calendar, Activity, Bed, Plus } from "lucide-react";

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const patientId = parseInt(id ?? "0", 10);

  const { data: patient, isLoading: loadingPatient } = useGetPatient(patientId, {
    query: { enabled: !!patientId, queryKey: getGetPatientQueryKey(patientId) },
  });
  const { data: visits, isLoading: loadingVisits } = useGetPatientVisits(patientId, {
    query: { enabled: !!patientId, queryKey: getGetPatientVisitsQueryKey(patientId) },
  });

  if (loadingPatient) {
    return <AppLayout><div className="p-8 space-y-4"><Skeleton className="h-40 w-full" /><Skeleton className="h-60 w-full" /></div></AppLayout>;
  }

  if (!patient) {
    return <AppLayout><div className="p-8 text-center text-muted-foreground">Patient not found</div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/patients"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-display font-bold">{patient.name}</h1>
            <p className="text-muted-foreground mt-1">{patient.patientId}</p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/opd`}>
              <Plus className="w-4 h-4 mr-2" />Add to OPD Queue
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-base font-medium">Demographics</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <InfoRow icon={<User className="w-4 h-4" />} label="Gender" value={patient.gender} />
              {patient.age && <InfoRow icon={<Calendar className="w-4 h-4" />} label="Age" value={`${patient.age} years`} />}
              <InfoRow icon={<Phone className="w-4 h-4" />} label="Mobile" value={patient.mobile} />
              {patient.bloodGroup && <InfoRow icon={<Activity className="w-4 h-4" />} label="Blood Group" value={patient.bloodGroup} />}
              {patient.address && <InfoRow icon={<MapPin className="w-4 h-4" />} label="Address" value={patient.address} />}
              {patient.emergencyContact && <InfoRow icon={<Phone className="w-4 h-4" />} label="Emergency" value={patient.emergencyContact} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-base font-medium">Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Visits</span>
                <span className="font-semibold">{visits?.length ?? 0}</span>
              </div>
              {patient.lastVisitDate && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Last Visit</span>
                  <span className="font-semibold">{new Date(patient.lastVisitDate).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Registered</span>
                <span className="font-semibold">{new Date(patient.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" asChild className="flex-1">
                  <Link href={`/billing/new?patientId=${patient.id}`}>Create Bill</Link>
                </Button>
                <Button size="sm" variant="outline" asChild className="flex-1">
                  <Link href={`/mediclaim?patientId=${patient.id}`}>Mediclaim</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="border-b pb-3">
            <CardTitle className="text-base font-medium">Visit History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingVisits ? (
              <div className="p-6"><Skeleton className="h-20 w-full" /></div>
            ) : !visits || visits.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No visit history yet</div>
            ) : (
              <div className="divide-y">
                {visits.map((visit) => (
                  <div key={`${visit.type}-${visit.id}`} className="flex items-center justify-between px-6 py-4" data-testid={`row-visit-${visit.id}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${visit.type === "opd" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}>
                        {visit.type === "opd" ? <Activity className="w-4 h-4" /> : <Bed className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium capitalize">{visit.type} Visit</p>
                        <p className="text-xs text-muted-foreground">{new Date(visit.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {visit.diagnosis && <p className="text-sm text-muted-foreground hidden md:block">{visit.diagnosis}</p>}
                      <Badge variant={visit.status === "completed" || visit.status === "discharged" ? "default" : "secondary"} className="capitalize">
                        {visit.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium capitalize">{value}</p>
      </div>
    </div>
  );
}
