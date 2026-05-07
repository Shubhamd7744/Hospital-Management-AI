import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "sonner";
import NotFound from "@/pages/not-found";

import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Patients from "@/pages/patients";
import PatientRegister from "@/pages/patient-register";
import PatientDetail from "@/pages/patient-detail";
import Opd from "@/pages/opd";
import Consult from "@/pages/consult";
import Ipd from "@/pages/ipd";
import IpdAdmit from "@/pages/ipd-admit";
import IpdDetail from "@/pages/ipd-detail";
import Mediclaim from "@/pages/mediclaim";
import Billing from "@/pages/billing";
import BillingNew from "@/pages/billing-new";
import BillDetail from "@/pages/bill-detail";
import Discharge from "@/pages/discharge";
import Reports from "@/pages/reports";
import Audit from "@/pages/audit";
import SettingsUsers from "@/pages/settings-users";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/patients" component={Patients} />
      <Route path="/patients/register" component={PatientRegister} />
      <Route path="/patients/:id" component={PatientDetail} />
      <Route path="/opd" component={Opd} />
      <Route path="/opd/:tokenId/consult" component={Consult} />
      <Route path="/ipd" component={Ipd} />
      <Route path="/ipd/admit" component={IpdAdmit} />
      <Route path="/ipd/:id" component={IpdDetail} />
      <Route path="/mediclaim" component={Mediclaim} />
      <Route path="/billing" component={Billing} />
      <Route path="/billing/new" component={BillingNew} />
      <Route path="/billing/:id" component={BillDetail} />
      <Route path="/discharge/:admissionId" component={Discharge} />
      <Route path="/reports" component={Reports} />
      <Route path="/audit" component={Audit} />
      <Route path="/settings/users" component={SettingsUsers} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
        <Sonner richColors position="top-right" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
