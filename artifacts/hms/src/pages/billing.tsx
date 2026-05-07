import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListBills } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CreditCard, ChevronRight } from "lucide-react";
import { useState } from "react";

const STATUS_CONFIG = {
  draft: "bg-gray-100 text-gray-600 border-gray-200",
  final: "bg-blue-100 text-blue-700 border-blue-200",
  paid: "bg-green-100 text-green-700 border-green-200",
};

export default function Billing() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data: bills, isLoading } = useListBills(statusFilter !== "all" ? { status: statusFilter as any } : {});

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Billing</h1>
            <p className="text-muted-foreground mt-1">{(bills ?? []).length} bills</p>
          </div>
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="final">Final</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
            <Button asChild data-testid="button-new-bill">
              <Link href="/billing/new"><Plus className="w-4 h-4 mr-2" />New Bill</Link>
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
          ) : (bills ?? []).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No bills found</p>
            </div>
          ) : (
            (bills ?? []).map(bill => (
              <Link key={bill.id} href={`/billing/${bill.id}`}>
                <div className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent/30 transition-colors cursor-pointer" data-testid={`card-bill-${bill.id}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold">{bill.patientName}</p>
                      <p className="text-xs text-muted-foreground">{bill.billNumber} · {bill.billType.toUpperCase()} · {bill.paymentMode}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">₹{Number(bill.totalAmount).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{new Date(bill.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${STATUS_CONFIG[bill.status as keyof typeof STATUS_CONFIG] ?? ""}`}>
                      {bill.status}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
