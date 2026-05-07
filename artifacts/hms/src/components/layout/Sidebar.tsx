import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Activity,
  Bed,
  FileText,
  CreditCard,
  BarChart3,
  ShieldAlert,
  Settings,
  LogOut
} from "lucide-react";
import { useLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        logout();
      }
    });
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["admin", "doctor", "receptionist"] },
    { name: "Patients", href: "/patients", icon: Users, roles: ["admin", "doctor", "receptionist"] },
    { name: "OPD Queue", href: "/opd", icon: Activity, roles: ["admin", "doctor", "receptionist"] },
    { name: "IPD Admissions", href: "/ipd", icon: Bed, roles: ["admin", "doctor", "receptionist"] },
    { name: "Mediclaim", href: "/mediclaim", icon: FileText, roles: ["admin", "receptionist"] },
    { name: "Billing", href: "/billing", icon: CreditCard, roles: ["admin", "receptionist"] },
    { name: "Reports", href: "/reports", icon: BarChart3, roles: ["admin"] },
    { name: "Audit Logs", href: "/audit", icon: ShieldAlert, roles: ["admin"] },
    { name: "Users", href: "/settings/users", icon: Settings, roles: ["admin"] },
  ];

  const filteredNavItems = navItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <div className="w-64 bg-sidebar border-r flex flex-col h-full">
      <div className="p-6 flex items-center gap-3 border-b">
        <div className="w-8 h-8 bg-primary text-primary-foreground rounded flex items-center justify-center font-bold font-display">
          H
        </div>
        <div className="font-display font-bold text-xl tracking-tight text-sidebar-foreground">
          MedFlow
        </div>
      </div>
      
      <div className="flex-1 py-6 px-3 flex flex-col gap-1 overflow-y-auto">
        <div className="px-3 mb-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
          Menu
        </div>
        {filteredNavItems.map((item) => {
          const isActive = location === item.href || location.startsWith(`${item.href}/`);
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-medium">{user?.name}</span>
            <span className="text-xs text-sidebar-foreground/60 capitalize">{user?.role}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
