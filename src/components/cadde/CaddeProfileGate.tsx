import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Lock, Settings } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { missingGateFieldLabel, type CaddeActorContext } from "@/lib/cadde-rules";

interface CaddeProfileGateProps {
  context: CaddeActorContext | null | undefined;
  isLoading: boolean;
  children: ReactNode;
}

/**
 * Cadde profil kapısı (CKS §6): profili eksik kullanıcı blurlu demo görür,
 * eksik alan listesi ve profil ayarları CTA'sı gösterilir.
 * Context yüklenemezse kapı FAIL-OPEN davranır — gerçek enforce DB'dedir
 * (create_cadde_post_v1 + RLS); UI kilidi yalnız yönlendirme amaçlıdır.
 */
const CaddeProfileGate = ({ context, isLoading, children }: CaddeProfileGateProps) => {
  if (isLoading || !context || context.canEnterCadde) return <>{children}</>;

  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-50 blur-[1.5px]" aria-hidden="true">
        {children}
      </div>
      <div className="absolute inset-0 z-30 flex items-start justify-center px-4 pt-32">
        <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-xl">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Lock className="h-6 w-6" />
          </div>
          <Badge variant="outline" className="mb-3 border-amber-500/40 text-amber-600">
            Önizleme Görünümü
          </Badge>
          <h2 className="mb-2 text-xl font-bold text-foreground">Caddeye çıkmak için profilini tamamla</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Gerçek topluluğa katılmak için aşağıdaki bilgileri tamamlaman gerekiyor:
          </p>
          <ul className="mb-5 space-y-1 text-sm font-medium text-foreground">
            {context.missingGateFields.map((field) => (
              <li key={field} className="rounded-lg bg-muted px-3 py-1.5">
                {missingGateFieldLabel(field)}
              </li>
            ))}
          </ul>
          <Button asChild className="w-full gap-2">
            <Link to="/profile?tab=settings">
              <Settings className="h-4 w-4" /> Profil Ayarlarını Tamamla
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CaddeProfileGate;
