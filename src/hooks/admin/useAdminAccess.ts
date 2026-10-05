// Admin Panel V2 — erişim hook'u.
// Supabase session dinleme + canonical is_admin() kontrolünü (userIsAdmin)
// tek yerde toplar. UI durumları AdminAccessGate'te ele alınır; bu hook
// yalnızca durum makinesi ve auth aksiyonlarını sunar.
// Bkz: docs/plans/2026-06-10-admin-panel-v2-masterplan.md §11.2, Faz 2

import { useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { userIsAdmin } from "@/lib/admin";

export type AdminAccessStatus =
  | "loading" // ilk session okuması
  | "unauthenticated" // session yok -> login formu
  | "checking" // session var, is_admin() kontrolü sürüyor
  | "denied" // giriş yapmış ama admin değil
  | "authorized" // admin
  | "error"; // is_admin RPC hatası

export type AdminAccessResult = { error: string | null };

export type AdminAccessState = {
  status: AdminAccessStatus;
  session: Session | null;
  login: (email: string, password: string) => Promise<AdminAccessResult>;
  requestPasswordReset: (email: string) => Promise<AdminAccessResult>;
  logout: () => Promise<void>;
  /** "error" durumunda yetki kontrolünü yeniden dener. */
  retry: () => Promise<void>;
};

export function useAdminAccess(): AdminAccessState {
  const [status, setStatus] = useState<AdminAccessStatus>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const statusRef = useRef<AdminAccessStatus>(status);
  const sessionRef = useRef<Session | null>(session);

  // Ref'leri güncel tut
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const syncSession = useCallback(async (nextSession: Session | null) => {
    const previousUserId = sessionRef.current?.user?.id;
    const nextUserId = nextSession?.user?.id;

    setSession(nextSession);

    if (!nextSession?.user) {
      setStatus("unauthenticated");
      return;
    }

    // A11: Aynı kullanıcı zaten "authorized" ise checking'e DÜŞME.
    // Token yenilenmesi veya aynı kullanıcı için SIGNED_IN olayı paneli sökmez.
    // Farklı kullanıcı veya çıkış durumunda eski davranış (checking → authorized/denied).
    if (previousUserId === nextUserId && statusRef.current === "authorized") {
      // Oturum güncellendi ama kullanıcı aynı ve zaten yetkili → durum değişmez
      return;
    }

    setStatus("checking");
    try {
      const allowed = await userIsAdmin(nextSession.user.id);
      setStatus(allowed ? "authorized" : "denied");
    } catch (error: unknown) {
      console.error("Admin yetki kontrolü başarısız:", error);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void syncSession(nextSession);
    });

    void supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      void syncSession(initialSession);
    });

    return () => data.subscription.unsubscribe();
  }, [syncSession]);

  const login = useCallback(async (email: string, password: string): Promise<AdminAccessResult> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  }, []);

  const requestPasswordReset = useCallback(async (email: string): Promise<AdminAccessResult> => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return { error: "Sıfırlama bağlantısı için önce e-posta adresinizi girin." };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error ? "Sıfırlama isteği alınamadı. Lütfen daha sonra tekrar deneyin." : null };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setStatus("unauthenticated");
  }, []);

  const retry = useCallback(async () => {
    await syncSession(session);
  }, [session, syncSession]);

  return { status, session, login, requestPasswordReset, logout, retry };
}
