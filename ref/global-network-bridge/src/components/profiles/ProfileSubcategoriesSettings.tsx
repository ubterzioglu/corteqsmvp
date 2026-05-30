import { useEffect, useMemo, useState } from "react";
import { CheckCircle, Plus, Tags, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  USER_SUBCATEGORIES,
  loadUserSubcategories,
  saveUserSubcategories,
} from "@/data/userSubcategories";

interface ProfileSubcategoriesSettingsProps {
  /** Override account type (defaults to AuthContext accountType). Useful for preview mode. */
  accountTypeOverride?: string;
}

/**
 * Lets a signed-in user pick the subcategories that match the role they
 * registered with at signup. These tags drive where the user shows up on
 * listing pages and inside category-scoped searches.
 *
 * Persistence is local-first (localStorage) keyed by `accountType` + `user.id`.
 * Backend sync hook is left as a follow-up so we don't add a new column today.
 */
const ProfileSubcategoriesSettings = ({ accountTypeOverride }: ProfileSubcategoriesSettingsProps) => {
  const { user, accountType } = useAuth();
  const { toast } = useToast();
  const effectiveType = accountTypeOverride || accountType || "individual";

  const groups = USER_SUBCATEGORIES[effectiveType] || [];
  const [selected, setSelected] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setSelected(loadUserSubcategories(effectiveType, user?.id));
    setDirty(false);
  }, [effectiveType, user?.id]);

  const accountLabel = useMemo(() => {
    const map: Record<string, string> = {
      consultant: "Danışman", business: "İşletme", association: "Kuruluş",
      blogger: "Blogger / Vlogger", ambassador: "Şehir Elçisi", individual: "Bireysel",
    };
    return map[effectiveType] || "Profil";
  }, [effectiveType]);

  if (!groups.length) {
    // Association uses its own org-taxonomy form, so we render nothing.
    return null;
  }

  const toggle = (opt: string) => {
    setSelected((prev) => {
      const next = prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt];
      setDirty(true);
      return next;
    });
  };

  const handleSave = () => {
    saveUserSubcategories(effectiveType, user?.id, selected);
    setDirty(false);
    toast({
      title: "Alt kategoriler kaydedildi",
      description: selected.length
        ? `${selected.length} alt kategori platformda eşleştirme için kullanılacak.`
        : "Hiçbir alt kategori seçilmedi — listelerde sadece ana kategoride görüneceksiniz.",
    });
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-card space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Tags className="h-5 w-5 text-primary" />
            {effectiveType === "individual" ? "Bireysel İlgi Alanlarım" : `${accountLabel} Alt Kategorileri`}
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            {effectiveType === "individual" ? (
              <>
                İlgi alanlarınızı işaretleyin. Seçtiklerinize göre <strong>Cadde akışında</strong>,
                etkinlik önerilerinde ve reklam/vitrin gösterimlerinde size daha alakalı içerikler öne çıkarılır.
              </>
            ) : (
              <>
                Kayıt olurken seçtiğiniz <strong>{accountLabel}</strong> rolünün alt kategorilerini işaretleyin.
                Platformda bu kategorilerin altında listelenirsiniz; arama ve filtrelerde doğru yerde çıkarsınız.
              </>
            )}
          </p>
        </div>
        <Badge variant="outline" className="text-[11px]">
          {selected.length} seçili
        </Badge>
      </div>

      <div className="space-y-5">
        {groups.map((g) => (
          <div key={g.key}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              {g.label}
            </p>
            <div className="flex flex-wrap gap-2">
              {g.options.map((opt) => {
                const active = selected.includes(opt);
                return (
                  <Badge
                    key={opt}
                    onClick={() => toggle(opt)}
                    className={`cursor-pointer text-xs py-1.5 px-3 gap-1.5 transition-all border ${
                      active
                        ? "bg-primary/15 text-primary border-primary/40 ring-1 ring-primary/20"
                        : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {active ? <CheckCircle className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                    {opt}
                  </Badge>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
        <p className="text-[11px] text-muted-foreground">
          {dirty ? "Kaydedilmemiş değişiklikleriniz var." : "Tüm değişiklikler kaydedildi."}
        </p>
        <Button onClick={handleSave} disabled={!dirty} size="sm" className="gap-2">
          <Save className="h-4 w-4" /> Kaydet
        </Button>
      </div>
    </div>
  );
};

export default ProfileSubcategoriesSettings;
