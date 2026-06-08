// Backward-compat shim — canonical auth: src/components/auth/useAuth.ts
// Bu dosyayı import eden 38+ bileşen otomatik olarak canonical sistemi kullanır.
import { useAuth as useCanonicalAuth } from "@/components/auth/useAuth";
export { AuthProvider } from "@/components/auth/AuthProvider";

export const useAuth = () => {
  const auth = useCanonicalAuth();
  // `loading` alias: orphaned context'te `loading` vardı, canonical'da `isLoading`
  return { ...auth, loading: auth.isLoading };
};
