import { useParams, Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useGetBill, useUpdateBill, getGetBillQueryKey, getListBillsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Printer } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export default function BillDetail() {
  const { id } = useParams<{ id: string }>();
  const billId = parseInt(id ?? "0", 10);
  const qc = useQueryClient();
  const { data: bill, isLoading } = useGetBill(billId, {
    query: { enabled: !!billId, queryKey: getGetBillQueryKey(billId) },
  });
  const updateBill = useUpdateBill();

  const handleMarkPaid = () => {
    updateBill.mutate({ id: billId, data: { status: "paid", paidAmount: bill?.totalAmount } }, {
      onSuccess: () => {
        toast.success("Bill marked as paid");
        qc.invalidateQueries({ queryKey: getGetBillQueryKey(billId) });
        qc.invalidateQueries({ queryKey: getListBillsQueryKey() });
      },
      onError: () => toast.error("Failed to update"),
    });
  };

  const handleFinalize = () => {
    updateBill.mutate({ id: billId, data: { status: "final" } }, {
      onSuccess: () => {
        toast.success("Bill finalized");
        qc.invalidateQueries({ queryKey: getGetBillQueryKey(billId) });
        qc.invalidateQueries({ queryKey: getListBillsQueryKey() });
      },
      onError: () => toast.error("Failed to update"),
    });
  };

  if (isLoading) return <AppLayout><div className="p-8"><Skeleton className="h-80 w-full" /></div></AppLayout>;
  if (!bill) return <AppLayout><div className="p-8 text-center text-muted-foreground">Bill not found</div></AppLayout>;

  return (
    <AppLayout>
      <div className="p-8 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild><Link href="/billing"><ArrowLeft className="w-4 h-4" /></Link></Button>
            <div>
              <h1 className="text-3xl font-display font-bold">{bill.billNumber}</h1>
              <p className="text-muted-foreground mt-1">{bill.patientName}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" />Print</Button>
            {bill.status === "draft" && <Button variant="outline" onClick={handleFinalize}>Finalize</Button>}
            {bill.status === "final" && <Button onClick={handleMarkPaid} disabled={updateBill.isPending}>Mark as Paid</Button>}
          </div>
        </div>

        <Card className="print:shadow-none">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Invoice</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">{new Date(bill.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
              <span className={`text-xs font-medium px-3 py-1.5 rounded-full border capitalize ${bill.status === "paid" ? "bg-green-100 text-green-700 border-green-200" : bill.status === "final" ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                {bill.status}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Bill To</p>
                <p className="font-semibold">{bill.patientName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Details</p>
                <p className="font-medium capitalize">{bill.billType} Visit · {bill.paymentMode}</p>
              </div>
            </div>

            <div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2 text-muted-foreground font-medium">Description</th>
                    <th className="text-center pb-2 text-muted-foreground font-medium">Qty</th>
                    <th className="text-right pb-2 text-muted-foreground font-medium">Rate</th>
                    <th className="text-right pb-2 text-muted-foreground font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {bill.items.map((item, i) => (
                    <tr key={i}>
                      <td className="py-3">
                        <p className="font-medium">{item.description}</p>
                        <p className="text-xs text-muted-foreground capitalize">{item.chargeType.replace("_", " ")}</p>
                      </td>
                      <td className="py-3 text-center">{item.quantity}</td>
                      <td className="py-3 text-right">₹{item.unitPrice.toLocaleString()}</td>
                      <td className="py-3 text-right font-medium">₹{item.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{Number(bill.subtotal).toLocaleString()}</span>
              </div>
              {Number(bill.discount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₹{Number(bill.discount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t pt-2">
                <span>Total Amount</span>
                <span>₹{Number(bill.totalAmount).toLocaleString()}</span>
              </div>
              {Number(bill.paidAmount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Paid Amount</span>
                  <span>₹{Number(bill.paidAmount).toLocaleString()}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
