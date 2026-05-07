import { useState } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { useListPatients } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, UserPlus, Phone, Calendar, ChevronRight } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

export default function Patients() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const { data, isLoading } = useListPatients(debouncedQuery ? { q: debouncedQuery } : {});

  const patients = data?.patients ?? [];

  return (
    <AppLayout>
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">Patients</h1>
            <p className="text-muted-foreground mt-1">{data?.total ?? 0} registered patients</p>
          </div>
          <Button asChild data-testid="button-register-patient">
            <Link href="/patients/register">
              <UserPlus className="w-4 h-4 mr-2" />
              Register Patient
            </Link>
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-10 h-11 text-base"
            placeholder="Search by name, mobile number, or patient ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            data-testid="input-patient-search"
          />
        </div>

        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))
          ) : patients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Search className="w-10 h-10 mb-3 opacity-30" />
              <p className="font-medium">No patients found</p>
              <p className="text-sm mt-1">{query ? "Try a different search term" : "Register the first patient to get started"}</p>
            </div>
          ) : (
            patients.map((patient) => (
              <Link key={patient.id} href={`/patients/${patient.id}`} data-testid={`card-patient-${patient.id}`}>
                <div className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent/30 transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-sm">
                      {patient.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{patient.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-muted-foreground">{patient.patientId}</span>
                        <span className="text-muted-foreground text-xs">•</span>
                        <span className="text-xs text-muted-foreground capitalize">{patient.gender}</span>
                        {patient.age && <><span className="text-muted-foreground text-xs">•</span><span className="text-xs text-muted-foreground">{patient.age}y</span></>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        <span>{patient.mobile}</span>
                      </div>
                      {patient.lastVisitDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>Last: {new Date(patient.lastVisitDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
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
