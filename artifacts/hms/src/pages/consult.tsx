import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetOpdQueue, useCreateConsultation, useUpdateOpdTokenStatus, useGetPatient, getGetOpdQueueQueryKey, getGetPatientQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Save, CheckCircle2, User, Phone, Calendar } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function Consult() {
  const { tokenId } = useParams<{ tokenId: string }>();
  const [_, setLocation] = useLocation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: queue } = useGetOpdQueue({ date: today });
  const token = (queue ?? []).find(t => t.id === parseInt(tokenId ?? "0", 10));

  const { data: patient } = useGetPatient(token?.patientId ?? 0, {
    query: { enabled: !!token?.patientId, queryKey: getGetPatientQueryKey(token?.patientId ?? 0) },
  });

  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  const createConsultation = useCreateConsultation();
  const updateStatus = useUpdateOpdTokenStatus();

  const handleSave = (finalize = false) => {
    if (!token || !user) return;
    createConsultation.mutate({
      data: {
        patientId: token.patientId,
        opdTokenId: token.id,
        doctorId: user.id,
        symptoms: symptoms || null,
        diagnosis: diagnosis || null,
        prescription: prescription || null,
        notes: notes || null,
        followUpDate: followUpDate || null,
      },
    }, {
      onSuccess: () => {
        if (finalize) {
          updateStatus.mutate({ id: token.id, data: { status: "completed" } }, {
            onSuccess: () => {
              toast.success("Consultation saved and completed");
              qc.invalidateQueries({ queryKey: getGetOpdQueueQueryKey({ date: today }) });
              setLocation("/opd");
            },
          });
        } else {
          toast.success("Consultation saved");
          qc.invalidateQueries({ queryKey: getGetOpdQueueQueryKey({ date: today }) });
        }
      },
      onError: () => toast.error("Failed to save consultation"),
    });
  };

  if (!token) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-muted-foreground">
          <p>Token not found. <Link href="/opd" className="text-primary underline">Back to OPD</Link></p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/opd"><ArrowLeft className="w-4 h-4" /></Link>
            </Button>
            <div>
              <h1 className="text-3xl font-display font-bold">Consultation</h1>
              <p className="text-muted-foreground mt-1">Token #{token.tokenNumber} — {token.patientName}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleSave(false)} disabled={createConsultation.isPending}>
              <Save className="w-4 h-4 mr-2" />Save Draft
            </Button>
            <Button onClick={() => handleSave(true)} disabled={createConsultation.isPending} data-testid="button-complete-consultation">
              <CheckCircle2 className="w-4 h-4 mr-2" />Complete
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-sm font-medium">Patient Info</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                {patient ? (
                  <>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-semibold">{patient.name}</p>
                        <p className="text-xs text-muted-foreground">{patient.patientId}</p>
                      </div>
                    </div>
                    {patient.age && <p className="text-sm text-muted-foreground ml-6">{patient.age} years · {patient.gender}</p>}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-3.5 h-3.5" />{patient.mobile}
                    </div>
                    {patient.bloodGroup && (
                      <div className="inline-flex items-center px-2 py-0.5 rounded bg-red-50 text-red-700 text-xs font-medium">
                        Blood: {patient.bloodGroup}
                      </div>
                    )}
                  </>
                ) : (
                  <Skeleton className="h-20 w-full" />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-sm font-medium">Clinical Notes</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Chief Complaints / Symptoms</label>
                  <Textarea placeholder="Describe patient's complaints..." className="min-h-20 resize-none"
                    value={symptoms} onChange={e => setSymptoms(e.target.value)} data-testid="textarea-symptoms" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Diagnosis</label>
                  <Textarea placeholder="Provisional or confirmed diagnosis..." className="min-h-16 resize-none"
                    value={diagnosis} onChange={e => setDiagnosis(e.target.value)} data-testid="textarea-diagnosis" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-sm font-medium">Prescription</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-5">
                <Textarea placeholder="Tab. Paracetamol 500mg — 1-0-1 x 5 days&#10;Tab. Cetirizine 10mg — 0-0-1 x 5 days"
                  className="min-h-32 resize-none font-mono text-sm"
                  value={prescription} onChange={e => setPrescription(e.target.value)} data-testid="textarea-prescription" />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Additional Notes</label>
                    <Textarea placeholder="Other instructions..." className="min-h-16 resize-none"
                      value={notes} onChange={e => setNotes(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Follow-up Date</label>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <Input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} data-testid="input-followup" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
