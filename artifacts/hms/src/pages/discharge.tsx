import { useParams, useLocation, Link } from "wouter";
import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetAdmission, useCreateDischarge, getGetAdmissionQueryKey, getListAdmissionsQueryKey, getListBedsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, FileText } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

export default function Discharge() {
  const { admissionId } = useParams<{ admissionId: string }>();
  const admId = parseInt(admissionId ?? "0", 10);
  const [_, setLocation] = useLocation();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: admission, isLoading } = useGetAdmission(admId, {
    query: { enabled: !!admId, queryKey: getGetAdmissionQueryKey(admId) },
  });
  const createDischarge = useCreateDischarge();

  const [finalDiagnosis, setFinalDiagnosis] = useState("");
  const [treatmentSummary, setTreatmentSummary] = useState("");
  const [procedures, setProcedures] = useState("");
  const [medications, setMedications] = useState("");
  const [followUpAdvice, setFollowUpAdvice] = useState("");
  const [condition, setCondition] = useState<"stable" | "improved" | "critical" | "expired">("stable");

  const handleSubmit = () => {
    if (!admission) return;
    createDischarge.mutate({
      data: {
        admissionId: admId,
        doctorId: user?.id ?? admission.doctorId ?? null,
        dischargeDate: new Date().toISOString(),
        finalDiagnosis: finalDiagnosis || null,
        treatmentSummary: treatmentSummary || null,
        procedures: procedures || null,
        medications: medications || null,
        followUpAdvice: followUpAdvice || null,
        condition,
      },
    }, {
      onSuccess: () => {
        toast.success("Discharge summary created");
        qc.invalidateQueries({ queryKey: getGetAdmissionQueryKey(admId) });
        qc.invalidateQueries({ queryKey: getListAdmissionsQueryKey() });
        qc.invalidateQueries({ queryKey: getListBedsQueryKey() });
        setLocation("/ipd");
      },
      onError: () => toast.error("Failed to create discharge summary"),
    });
  };

  if (isLoading) return <AppLayout><div className="p-8"><Skeleton className="h-64 w-full" /></div></AppLayout>;
  if (!admission) return <AppLayout><div className="p-8 text-center text-muted-foreground">Admission not found</div></AppLayout>;

  return (
    <AppLayout>
      <div className="p-8 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild><Link href={`/ipd/${admId}`}><ArrowLeft className="w-4 h-4" /></Link></Button>
          <div>
            <h1 className="text-3xl font-display font-bold">Discharge Summary</h1>
            <p className="text-muted-foreground mt-1">{admission.patientName} · Admitted {new Date(admission.admissionDate).toLocaleDateString()}</p>
          </div>
        </div>

        <Card>
          <CardHeader className="border-b pb-3"><CardTitle className="text-sm font-medium">Clinical Summary</CardTitle></CardHeader>
          <CardContent className="p-6 space-y-5">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Final Diagnosis</label>
              <Textarea className="resize-none min-h-16" placeholder="Final confirmed diagnosis..."
                value={finalDiagnosis} onChange={e => setFinalDiagnosis(e.target.value)} data-testid="textarea-diagnosis" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Treatment Summary</label>
              <Textarea className="resize-none min-h-20" placeholder="Summary of treatment provided during admission..."
                value={treatmentSummary} onChange={e => setTreatmentSummary(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Procedures Performed</label>
              <Textarea className="resize-none min-h-16" placeholder="List any procedures, surgeries, investigations..."
                value={procedures} onChange={e => setProcedures(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Discharge Medications</label>
              <Textarea className="resize-none min-h-20 font-mono text-sm" placeholder="Tab. Amoxicillin 500mg — 1-0-1 x 7 days&#10;Tab. Pantoprazole 40mg — 1-0-0 x 14 days"
                value={medications} onChange={e => setMedications(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Follow-up Advice</label>
              <Textarea className="resize-none min-h-16" placeholder="Follow-up instructions, diet, activity restrictions..."
                value={followUpAdvice} onChange={e => setFollowUpAdvice(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Condition at Discharge</label>
              <Select value={condition} onValueChange={(v) => setCondition(v as typeof condition)}>
                <SelectTrigger className="w-48" data-testid="select-condition"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="stable">Stable</SelectItem>
                  <SelectItem value="improved">Improved</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSubmit} disabled={createDischarge.isPending} className="flex-1" data-testid="button-save-discharge">
                <FileText className="w-4 h-4 mr-2" />{createDischarge.isPending ? "Saving..." : "Save Discharge Summary"}
              </Button>
              <Button variant="outline" asChild><Link href={`/ipd/${admId}`}>Cancel</Link></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
