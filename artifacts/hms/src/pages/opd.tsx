import { useState } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetOpdQueue, useCreateOpdToken, useUpdateOpdTokenStatus, useListPatients, useListUsers, getGetOpdQueueQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Clock, CheckCircle2, Activity, UserCheck, Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useDebounce } from "@/hooks/use-debounce";

const STATUS_CONFIG = {
  waiting: { label: "Waiting", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
  in_consultation: { label: "In Consultation", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Activity },
  completed: { label: "Completed", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-500 border-gray-200", icon: CheckCircle2 },
};

export default function Opd() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const today = new Date().toISOString().split("T")[0];
  const { data: queue, isLoading } = useGetOpdQueue({ date: today });
  const updateStatus = useUpdateOpdTokenStatus();
  const [addOpen, setAddOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const debouncedSearch = useDebounce(patientSearch, 300);
  const { data: patients } = useListPatients(debouncedSearch ? { q: debouncedSearch } : {});
  const { data: users } = useListUsers();
  const doctors = (users ?? []).filter(u => u.role === "doctor");
  const createToken = useCreateOpdToken();
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [visitType, setVisitType] = useState<"cash" | "mediclaim">("cash");

  const isDoctor = user?.role === "doctor";

  const handleStatusChange = (id: number, status: string) => {
    updateStatus.mutate({ id, data: { status: status as "waiting" | "in_consultation" | "completed" | "cancelled" } }, {
      onSuccess: () => {
        toast.success("Status updated");
        qc.invalidateQueries({ queryKey: getGetOpdQueueQueryKey({ date: today }) });
      },
      onError: () => toast.error("Failed to update status"),
    });
  };

  const handleAddToQueue = () => {
    if (!selectedPatient) { toast.error("Select a patient"); return; }
    createToken.mutate({
      data: {
        patientId: selectedPatient,
        doctorId: selectedDoctor ? parseInt(selectedDoctor) : null,
        visitType,
      },
    }, {
      onSuccess: () => {
        toast.success("Patient added to queue");
        qc.invalidateQueries({ queryKey: getGetOpdQueueQueryKey({ date: today }) });
        setAddOpen(false);
        setSelectedPatient(null);
        setPatientSearch("");
        setSelectedDoctor("");
      },
      onError: () => toast.error("Failed to add patient"),
    });
  };

  const waiting = (queue ?? []).filter(t => t.status === "waiting" || t.status === "in_consultation");
  const completed = (queue ?? []).filter(t => t.status === "completed" || t.status === "cancelled");

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">OPD Queue</h1>
            <p className="text-muted-foreground mt-1">Today — {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
          </div>
          {!isDoctor && (
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-to-queue"><Plus className="w-4 h-4 mr-2" />Add to Queue</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Patient to OPD Queue</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Search Patient</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input className="pl-9" placeholder="Name or mobile..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} />
                    </div>
                    {(patients?.patients ?? []).length > 0 && (
                      <div className="mt-2 border rounded-lg divide-y max-h-40 overflow-y-auto">
                        {(patients?.patients ?? []).map(p => (
                          <div key={p.id} onClick={() => { setSelectedPatient(p.id); setPatientSearch(p.name); }}
                            className={`px-3 py-2 text-sm cursor-pointer hover:bg-accent/50 ${selectedPatient === p.id ? "bg-accent" : ""}`}>
                            <span className="font-medium">{p.name}</span> <span className="text-muted-foreground text-xs ml-2">{p.patientId} · {p.mobile}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Assign Doctor (Optional)</label>
                    <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                      <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                      <SelectContent>
                        {doctors.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Visit Type</label>
                    <Select value={visitType} onValueChange={(v) => setVisitType(v as "cash" | "mediclaim")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="mediclaim">Mediclaim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddToQueue} disabled={createToken.isPending || !selectedPatient} className="w-full">
                    {createToken.isPending ? "Adding..." : "Add to Queue"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total", value: queue?.length ?? 0, color: "text-foreground" },
            { label: "Waiting", value: waiting.length, color: "text-amber-600" },
            { label: "Completed", value: completed.length, color: "text-green-600" },
          ].map(stat => (
            <Card key={stat.label}>
              <CardContent className="p-4 text-center">
                <p className={`text-3xl font-display font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Active Queue</h2>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
          ) : waiting.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">No patients in queue</div>
          ) : (
            waiting.map((token) => {
              const cfg = STATUS_CONFIG[token.status as keyof typeof STATUS_CONFIG];
              return (
                <div key={token.id} className="flex items-center justify-between p-4 rounded-xl border bg-card" data-testid={`card-token-${token.id}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-foreground text-sm">
                      {token.tokenNumber}
                    </div>
                    <div>
                      <p className="font-semibold">{token.patientName}</p>
                      <p className="text-xs text-muted-foreground">{token.patientMobile}{token.doctorName ? ` · Dr. ${token.doctorName}` : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                    {isDoctor && token.status === "waiting" && (
                      <Button size="sm" onClick={() => handleStatusChange(token.id, "in_consultation")}>
                        <UserCheck className="w-3 h-3 mr-1.5" />Start
                      </Button>
                    )}
                    {isDoctor && token.status === "in_consultation" && (
                      <Button size="sm" asChild variant="outline">
                        <Link href={`/opd/${token.id}/consult`}>Open Consultation</Link>
                      </Button>
                    )}
                    {!isDoctor && (
                      <Select value={token.status} onValueChange={(v) => handleStatusChange(token.id, v)}>
                        <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="waiting">Waiting</SelectItem>
                          <SelectItem value="in_consultation">In Consultation</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {completed.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Completed</h2>
            {completed.map((token) => (
              <div key={token.id} className="flex items-center justify-between p-4 rounded-xl border bg-muted/30 opacity-70">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground text-sm">
                    {token.tokenNumber}
                  </div>
                  <div>
                    <p className="font-medium">{token.patientName}</p>
                    <p className="text-xs text-muted-foreground">{token.patientMobile}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  {token.consultationId && (
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/opd/${token.id}/consult`}>View</Link>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
