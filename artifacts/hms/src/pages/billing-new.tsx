import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useCreateBill, useListPatients, getListBillsQueryKey } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Search } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";

interface Item { description: string; chargeType: string; quantity: number; unitPrice: number; }

const CHARGE_TYPES = [
  { value: "consultation", label: "Consultation" },
  { value: "bed", label: "Bed Charge" },
  { value: "procedure", label: "Procedure" },
  { value: "doctor_visit", label: "Doctor Visit" },
  { value: "other", label: "Other" },
];

export default function BillingNew() {
  const [_, setLocation] = useLocation();
  const qc = useQueryClient();
  const createBill = useCreateBill();
  const [patientSearch, setPatientSearch] = useState("");
  const debouncedSearch = useDebounce(patientSearch, 300);
  const { data: patients } = useListPatients(debouncedSearch ? { q: debouncedSearch } : {});
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [billType, setBillType] = useState<"opd" | "ipd">("opd");
  const [paymentMode, setPaymentMode] = useState<"cash" | "mediclaim">("cash");
  const [items, setItems] = useState<Item[]>([{ description: "Consultation Fee", chargeType: "consultation", quantity: 1, unitPrice: 500 }]);
  const [discount, setDiscount] = useState(0);

  const addItem = () => setItems(prev => [...prev, { description: "", chargeType: "other", quantity: 1, unitPrice: 0 }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, key: keyof Item, value: string | number) => {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [key]: value } : item));
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const total = Math.max(0, subtotal - discount);

  const handleSubmit = (status: "draft" | "final") => {
    if (!selectedPatient) { toast.error("Select a patient"); return; }
    if (items.length === 0) { toast.error("Add at least one item"); return; }
    createBill.mutate({
      data: {
        patientId: selectedPatient,
        billType,
        paymentMode,
        discount,
        paidAmount: status === "final" ? total : 0,
        items: items.map(i => ({ description: i.description, chargeType: i.chargeType as any, quantity: i.quantity, unitPrice: i.unitPrice })),
      },
    }, {
      onSuccess: (bill) => {
        toast.success(`Bill ${status === "draft" ? "saved as draft" : "finalized"}`);
        qc.invalidateQueries({ queryKey: getListBillsQueryKey() });
        setLocation(`/billing/${bill.id}`);
      },
      onError: () => toast.error("Failed to create bill"),
    });
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild><Link href="/billing"><ArrowLeft className="w-4 h-4" /></Link></Button>
          <div>
            <h1 className="text-3xl font-display font-bold">New Bill</h1>
            <p className="text-muted-foreground mt-1">Create a patient bill</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="border-b pb-3"><CardTitle className="text-sm font-medium">Patient & Bill Type</CardTitle></CardHeader>
              <CardContent className="p-5 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Patient *</label>
                  <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Search patient..." value={patientSearch}
                      onChange={e => { setPatientSearch(e.target.value); setSelectedPatient(null); }} />
                  </div>
                  {(patients?.patients ?? []).length > 0 && !selectedPatient && (
                    <div className="mt-1 border rounded-lg divide-y max-h-32 overflow-y-auto">
                      {(patients?.patients ?? []).map(p => (
                        <div key={p.id} onClick={() => { setSelectedPatient(p.id); setPatientSearch(`${p.name} (${p.patientId})`); }}
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-accent/50">
                          {p.name} <span className="text-xs text-muted-foreground">{p.patientId}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Bill Type</label>
                    <Select value={billType} onValueChange={(v) => setBillType(v as "opd" | "ipd")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="opd">OPD</SelectItem>
                        <SelectItem value="ipd">IPD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Payment Mode</label>
                    <Select value={paymentMode} onValueChange={(v) => setPaymentMode(v as "cash" | "mediclaim")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="mediclaim">Mediclaim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium">Bill Items</CardTitle>
                <Button size="sm" variant="outline" onClick={addItem}>
                  <Plus className="w-3 h-3 mr-1.5" />Add Item
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {items.map((item, i) => (
                    <div key={i} className="p-4 grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-4">
                        {i === 0 && <label className="text-xs text-muted-foreground mb-1 block">Description</label>}
                        <Input value={item.description} onChange={e => updateItem(i, "description", e.target.value)} placeholder="Service description" />
                      </div>
                      <div className="col-span-3">
                        {i === 0 && <label className="text-xs text-muted-foreground mb-1 block">Type</label>}
                        <Select value={item.chargeType} onValueChange={v => updateItem(i, "chargeType", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CHARGE_TYPES.map(ct => <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        {i === 0 && <label className="text-xs text-muted-foreground mb-1 block">Qty</label>}
                        <Input type="number" value={item.quantity} onChange={e => updateItem(i, "quantity", Number(e.target.value))} min={1} />
                      </div>
                      <div className="col-span-2">
                        {i === 0 && <label className="text-xs text-muted-foreground mb-1 block">Rate (₹)</label>}
                        <Input type="number" value={item.unitPrice} onChange={e => updateItem(i, "unitPrice", Number(e.target.value))} min={0} />
                      </div>
                      <div className="col-span-1">
                        <Button size="icon" variant="ghost" onClick={() => removeItem(i)} className="text-destructive hover:text-destructive h-10 w-10">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="border-b pb-3"><CardTitle className="text-sm font-medium">Summary</CardTitle></CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Discount</span>
                    <Input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="w-24 h-7 text-right text-sm" min={0} />
                  </div>
                  <div className="flex justify-between font-semibold text-base border-t pt-2">
                    <span>Total</span>
                    <span>₹{total.toLocaleString()}</span>
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <Button className="w-full" onClick={() => handleSubmit("final")} disabled={createBill.isPending} data-testid="button-finalize-bill">
                    Finalize Bill
                  </Button>
                  <Button className="w-full" variant="outline" onClick={() => handleSubmit("draft")} disabled={createBill.isPending}>
                    Save as Draft
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
