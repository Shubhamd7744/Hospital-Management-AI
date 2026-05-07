import { useParams, Link, useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetAdmission, useUpdateAdmission, getGetAdmissionQueryKey, getListAdmissionsQueryKey, getListBedsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Bed, Calendar, User, FileText } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const ROOM_LABELS: Record<string, string> = { general: "General", semi_special: "Semi-Special", special: "Special" };

export default function IpdDetail() {
  const { id } = useParams<{ id: string }>();
  const admissionId = parseInt(id ?? "0", 10);
  const [_, setLocation] = useLocation();
  const qc = useQueryClient();

  const { data: admission, isLoading } = useGetAdmission(admissionId, {
    query: { enabled: !!admissionId, queryKey: getGetAdmissionQueryKey(admissionId) },
  });
  const updateAdmission = useUpdateAdmission();

  const handleDischarge = () => {
    if (!admission) return;
    updateAdmission.mutate({ id: admissionId, data: { status: "discharged", dischargeDate: new Date().toISOString() } }, {
      onSuccess: () => {
        toast.success("Patient marked as discharged");
        qc.invalidateQueries({ queryKey: getGetAdmissionQueryKey(admissionId) });
        qc.invalidateQueries({ queryKey: getListAdmissionsQueryKey() });
        qc.invalidateQueries({ queryKey: getListBedsQueryKey() });
      },
      onError: () => toast.error("Failed to update"),
    });
  };

  if (isLoading) {
    return <AppLayout><div className="p-8"><Skeleton className="h-64 w-full" /></div></AppLayout>;
  }

  if (!admission) {
    return <AppLayout><div className="p-8 text-center text-muted-foreground">Admission not found</div></AppLayout>;
  }

  const days = Math.floor((Date.now() - new Date(admission.admissionDate).getTime()) / 86400000);

  return (
    <AppLayout>
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild><Link href="/ipd"><ArrowLeft className="w-4 h-4" /></Link></Button>
            <div>
              <h1 className="text-3xl font-display font-bold">{admission.patientName}</h1>
              <p className="text-muted-foreground mt-1">IPD Admission</p>
            </div>
          </div>
          <div className="flex gap-2">
            {admission.status === "admitted" && (
              <>
                <Button variant="outline" asChild>
                  <Link href={`/discharge/${admission.id}`}>
                    <FileText className="w-4 h-4 mr-2" />Create Discharge
                  </Link>
                </Button>
                <Button variant="destructive" onClick={handleDischarge} disabled={updateAdmission.isPending}>
                  Discharge
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="border-b pb-3"><CardTitle className="text-sm font-medium">Admission Info</CardTitle></CardHeader>
            <CardContent className="p-5 space-y-4">
              <InfoRow icon={<User className="w-4 h-4" />} label="Patient" value={`${admission.patientName} · ${admission.patientMobile}`} />
              <InfoRow icon={<Bed className="w-4 h-4" />} label="Bed" value={`${admission.bedNumber} (${ROOM_LABELS[admission.roomType] ?? admission.roomType})`} />
              {admission.doctorName && <InfoRow icon={<User className="w-4 h-4" />} label="Doctor" value={`Dr. ${admission.doctorName}`} />}
              <InfoRow icon={<Calendar className="w-4 h-4" />} label="Admitted On" value={new Date(admission.admissionDate).toLocaleDateString()} />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Duration</span>
                <span className="text-sm font-medium">{days === 0 ? "Today" : `${days} day${days !== 1 ? "s" : ""}`}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Type</span>
                <Badge variant="outline" className="capitalize">{admission.admissionType}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge className={admission.status === "admitted" ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100" : ""} variant={admission.status === "discharged" ? "secondary" : "default"}>
                  {admission.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b pb-3"><CardTitle className="text-sm font-medium">Clinical Notes</CardTitle></CardHeader>
            <CardContent className="p-5 space-y-4">
              {admission.diagnosis ? (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Diagnosis</p>
                  <p className="text-sm">{admission.diagnosis}</p>
                </div>
              ) : <p className="text-sm text-muted-foreground">No diagnosis recorded</p>}
              {admission.notes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{admission.notes}</p>
                </div>
              )}
              {admission.dischargeDate && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Discharged On</p>
                  <p className="text-sm font-medium">{new Date(admission.dischargeDate).toLocaleDateString()}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href={`/billing/new?admissionId=${admission.id}&patientId=${admission.patientId}&type=ipd`}>Create IPD Bill</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/mediclaim?patientId=${admission.patientId}`}>View Mediclaim</Link>
          </Button>
        </div>
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
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
