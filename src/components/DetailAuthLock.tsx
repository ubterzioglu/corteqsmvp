import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Detay sayfalarının üstünde gösterilen ortak uyarı.
 * Kullanıcı giriş yapmadıysa "DEMO – Etkileşim için giriş yapın" CTA'sı gösterir.
 */
const DetailAuthLock = ({ category = "kart" }: { category?: string }) => {
  const { user } = useAuth();
  if (user) return null;
  return (
    <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border border-dashed border-gold/40 bg-gold/5">
      <div className="flex items-center gap-3 text-sm">
        <div className="w-9 h-9 rounded-full bg-gold/15 flex items-center justify-center shrink-0">
          <Lock className="h-4 w-4 text-gold" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Bu {category} DEMO içeriktir</p>
          <p className="text-muted-foreground font-body">
            Mesaj, takip, üyelik, randevu, bağış ve aidat gibi tüm aksiyonlar için lütfen giriş yapın.
          </p>
        </div>
      </div>
      <Link to="/auth">
        <Button size="sm" variant="default" className="gap-1.5 shrink-0">
          <Lock className="h-3.5 w-3.5" /> Giriş / Kayıt
        </Button>
      </Link>
    </div>
  );
};

export default DetailAuthLock;
