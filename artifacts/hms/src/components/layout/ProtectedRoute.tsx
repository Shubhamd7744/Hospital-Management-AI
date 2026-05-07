import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const [location, setLocation] = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  const { data: me, isLoading, isError } = useGetMe({
    query: {
      enabled: isAuthenticated,
      retry: false,
      queryKey: getGetMeQueryKey(),
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    } else if (isError) {
      logout();
      setLocation("/login");
    } else if (me && allowedRoles && !allowedRoles.includes(me.role)) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, isError, location, setLocation, logout, me, allowedRoles]);

  if (!isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (allowedRoles && me && !allowedRoles.includes(me.role)) {
    return null;
  }

  return <>{children}</>;
}
