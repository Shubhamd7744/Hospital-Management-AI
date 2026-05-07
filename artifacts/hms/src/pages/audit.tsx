import { AppLayout } from "@/components/layout/AppLayout";
import { useListAuditLogs } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldAlert } from "lucide-react";

export default function Audit() {
  const { data, isLoading } = useListAuditLogs({ limit: 100 });
  const logs = data?.logs ?? [];

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">{data?.total ?? 0} total events</p>
        </div>

        <Card>
          <CardHeader className="border-b pb-3"><CardTitle className="text-sm font-medium">Activity Log</CardTitle></CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShieldAlert className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No audit events recorded</p>
              </div>
            ) : (
              <div className="divide-y">
                {logs.map(log => (
                  <div key={log.id} className="flex items-start gap-4 px-6 py-4" data-testid={`row-audit-${log.id}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold uppercase tracking-wide bg-muted px-1.5 py-0.5 rounded">{log.action}</span>
                        <span className="text-sm font-medium">{log.entity}</span>
                        {log.entityId && <span className="text-xs text-muted-foreground">#{log.entityId}</span>}
                      </div>
                      {log.details && <p className="text-xs text-muted-foreground mt-1">{log.details}</p>}
                      {log.userName && <p className="text-xs text-muted-foreground mt-0.5">by {log.userName}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString("en-IN", { hour12: true, hour: "numeric", minute: "2-digit", day: "numeric", month: "short" })}</p>
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
