import { Navigate } from "react-router-dom";

import { useAuth } from "@/components/auth/useAuth";

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-background">Yükleniyor...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default RequireAuth;

