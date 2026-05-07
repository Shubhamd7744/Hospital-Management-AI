import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListMediclaims, useUpdateMediclaim, useCreateMediclaim, useListPatients, getListMediclaimsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, FileText } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

const STATUS_CONFIG = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  submitted: "bg-blue-100 text-blue-700 border-blue-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
};

export default function Mediclaim() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data: claims, isLoading } = useListMediclaims(statusFilter !== "all" ? { status: statusFilter as any } : {});
  const updateClaim = useUpdateMediclaim();
  const createClaim = useCreateMediclaim();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const debouncedSearch = useDebounce(patientSearch, 300);
  const { data: patients } = useListPatients(debouncedSearch ? { q: debouncedSearch } : {});
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [newClaim, setNewClaim] = useState({ insuranceProvider: "", policyNumber: "", tpaName: "", sumInsured: "" });

  const handleUpdateStatus = (id: number, claimStatus: string) => {
    updateClaim.mutate({ id, data: { claimStatus: claimStatus as any } }, {
      onSuccess: () => {
        toast.success("Status updated");
        qc.invalidateQueries({ queryKey: getListMediclaimsQueryKey() });
        setEditingId(null);
      },
      onError: () => toast.error("Failed to update"),
    });
  };

  const handleCreate = () => {
    if (!selectedPatient || !newClaim.insuranceProvider || !newClaim.policyNumber) {
      toast.error("Patient, insurance provider, and policy number are required");
      return;
    }
    createClaim.mutate({
      data: {
        patientId: selectedPatient,
        insuranceProvider: newClaim.insuranceProvider,
        policyNumber: newClaim.policyNumber,
        tpaName: newClaim.tpaName || null,
        sumInsured: newClaim.sumInsured ? Number(newClaim.sumInsured) : null,
      },
    }, {
      onSuccess: () => {
        toast.success("Mediclaim created");
        qc.invalidateQueries({ queryKey: getListMediclaimsQueryKey() });
        setAddOpen(false);
        setSelectedPatient(null);
        setPatientSearch("");
        setNewClaim({ insuranceProvider: "", policyNumber: "", tpaName: "", sumInsured: "" });
      },
      onError: () => toast.error("Failed to create"),
    });
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Mediclaim</h1>
            <p className="text-muted-foreground mt-1">Insurance claim tracking</p>
          </div>
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-claim"><Plus className="w-4 h-4 mr-2" />New Claim</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New Mediclaim</DialogTitle></DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Patient</label>
                    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input className="pl-9" placeholder="Search patient..." value={patientSearch} onChange={e => setPatientSearch(e.target.value)} />
                    </div>
                    {(patients?.patients ?? []).length > 0 && !selectedPatient && (
                      <div className="mt-1 border rounded-lg divide-y max-h-32 overflow-y-auto">
                        {(patients?.patients ?? []).map(p => (
                          <div key={p.id} onClick={() => { setSelectedPatient(p.id); setPatientSearch(`${p.name} (${p.patientId})`); }}
                            className="px-3 py-2 text-sm cursor-pointer hover:bg-accent/50">
                            {p.name} <span className="text-muted-foreground text-xs">{p.patientId}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Input placeholder="Insurance Provider *" value={newClaim.insuranceProvider} onChange={e => setNewClaim(c => ({ ...c, insuranceProvider: e.target.value }))} />
                  <Input placeholder="Policy Number *" value={newClaim.policyNumber} onChange={e => setNewClaim(c => ({ ...c, policyNumber: e.target.value }))} />
                  <Input placeholder="TPA Name" value={newClaim.tpaName} onChange={e => setNewClaim(c => ({ ...c, tpaName: e.target.value }))} />
                  <Input placeholder="Sum Insured (₹)" type="number" value={newClaim.sumInsured} onChange={e => setNewClaim(c => ({ ...c, sumInsured: e.target.value }))} />
                  <Button onClick={handleCreate} disabled={createClaim.isPending} className="w-full">
                    {createClaim.isPending ? "Creating..." : "Create Claim"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
          ) : (claims ?? []).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No claims found</p>
            </div>
          ) : (
            (claims ?? []).map(claim => (
              <Card key={claim.id} data-testid={`card-claim-${claim.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <p className="font-semibold">{claim.patientName}</p>
                      <p className="text-sm text-muted-foreground">{claim.insuranceProvider} · {claim.policyNumber}</p>
                      {claim.tpaName && <p className="text-xs text-muted-foreground">TPA: {claim.tpaName}</p>}
                      <div className="flex gap-3 text-xs text-muted-foreground mt-2">
                        {claim.sumInsured && <span>Sum Insured: ₹{Number(claim.sumInsured).toLocaleString()}</span>}
                        {claim.claimAmount && <span>Claim: ₹{Number(claim.claimAmount).toLocaleString()}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${STATUS_CONFIG[claim.claimStatus as keyof typeof STATUS_CONFIG] ?? ""}`}>
                        {claim.claimStatus}
                      </span>
                      {editingId === claim.id ? (
                        <div className="flex gap-2">
                          <Select value={newStatus} onValueChange={setNewStatus}>
                            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="New status" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="submitted">Submitted</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button size="sm" className="h-8" onClick={() => handleUpdateStatus(claim.id, newStatus)}>Save</Button>
                          <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingId(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { setEditingId(claim.id); setNewStatus(claim.claimStatus); }}>
                          Update Status
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
