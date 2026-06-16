import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "@/components/auth/useAuth";

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const { session, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-background">Yükleniyor...</div>;
  }

  if (!session) {
    // Korunan rotaya doğrudan/paylaşılan linkle gelen anonim kullanıcıyı login'e
    // yönlendir; mevcut konumu `next` olarak taşı ki giriş sonrası tam o sayfaya
    // dönsün. LoginPage `next` guard'ı yalnızca "/" ile başlayan path'i kabul eder.
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }

  return children;
};

export default RequireAuth;

