import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateAdmission, useListPatients, useListBeds, useListUsers, getListAdmissionsQueryKey, getListBedsQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Search } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";

const schema = z.object({
  bedId: z.string().min(1, "Select a bed"),
  doctorId: z.string().optional(),
  admissionType: z.enum(["cash", "mediclaim"]),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
});

const ROOM_LABELS: Record<string, string> = { general: "General", semi_special: "Semi-Special", special: "Special" };

export default function IpdAdmit() {
  const [_, setLocation] = useLocation();
  const qc = useQueryClient();
  const createAdmission = useCreateAdmission();
  const [patientSearch, setPatientSearch] = useState("");
  const debouncedSearch = useDebounce(patientSearch, 300);
  const { data: patients } = useListPatients(debouncedSearch ? { q: debouncedSearch } : {});
  const { data: beds } = useListBeds();
  const { data: users } = useListUsers();
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const doctors = (users ?? []).filter(u => u.role === "doctor");
  const availableBeds = (beds ?? []).filter(b => b.status === "available");

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { admissionType: "cash" },
  });

  const onSubmit = (values: z.infer<typeof schema>) => {
    if (!selectedPatient) { toast.error("Select a patient"); return; }
    createAdmission.mutate({
      data: {
        patientId: selectedPatient,
        bedId: parseInt(values.bedId),
        doctorId: values.doctorId ? parseInt(values.doctorId) : null,
        admissionType: values.admissionType,
        diagnosis: values.diagnosis || null,
        notes: values.notes || null,
      },
    }, {
      onSuccess: (admission) => {
        toast.success("Patient admitted successfully");
        qc.invalidateQueries({ queryKey: getListAdmissionsQueryKey() });
        qc.invalidateQueries({ queryKey: getListBedsQueryKey() });
        setLocation(`/ipd/${admission.id}`);
      },
      onError: (e: any) => toast.error(e?.data?.error || "Failed to admit patient"),
    });
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild><Link href="/ipd"><ArrowLeft className="w-4 h-4" /></Link></Button>
          <div>
            <h1 className="text-3xl font-display font-bold">Admit Patient</h1>
            <p className="text-muted-foreground mt-1">IPD admission form</p>
          </div>
        </div>

        <Card>
          <CardHeader className="border-b pb-4"><CardTitle className="text-base font-medium">Admission Details</CardTitle></CardHeader>
          <CardContent className="p-6 space-y-5">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Patient *</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search patient by name or mobile..."
                  value={patientSearch} onChange={e => { setPatientSearch(e.target.value); setSelectedPatient(null); }}
                  data-testid="input-patient-search" />
              </div>
              {(patients?.patients ?? []).length > 0 && !selectedPatient && (
                <div className="mt-2 border rounded-lg divide-y max-h-40 overflow-y-auto">
                  {(patients?.patients ?? []).map(p => (
                    <div key={p.id} onClick={() => { setSelectedPatient(p.id); setPatientSearch(`${p.name} (${p.patientId})`); }}
                      className="px-3 py-2 text-sm cursor-pointer hover:bg-accent/50">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-muted-foreground text-xs ml-2">{p.patientId} · {p.mobile}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="bedId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bed *</FormLabel>
                    <Select onValueChange={field.onChange}>
                      <FormControl><SelectTrigger data-testid="select-bed"><SelectValue placeholder="Select available bed" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {availableBeds.map(bed => (
                          <SelectItem key={bed.id} value={String(bed.id)}>
                            {bed.bedNumber} — {ROOM_LABELS[bed.roomType] ?? bed.roomType}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="doctorId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Attending Doctor</FormLabel>
                      <Select onValueChange={field.onChange}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Assign doctor" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {doctors.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="admissionType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admission Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="mediclaim">Mediclaim</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="diagnosis" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provisional Diagnosis</FormLabel>
                    <FormControl><Input placeholder="Initial diagnosis" {...field} /></FormControl>
                  </FormItem>
                )} />

                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl><Textarea className="resize-none" placeholder="Additional notes..." {...field} /></FormControl>
                  </FormItem>
                )} />

                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={createAdmission.isPending || !selectedPatient} className="flex-1" data-testid="button-admit">
                    {createAdmission.isPending ? "Admitting..." : "Admit Patient"}
                  </Button>
                  <Button type="button" variant="outline" asChild><Link href="/ipd">Cancel</Link></Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
