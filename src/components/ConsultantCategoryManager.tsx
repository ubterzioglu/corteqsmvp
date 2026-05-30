import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Plus, X, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ALL_CATEGORIES = [
  "Yaşam ve Relokasyon",
  "Finans",
  "Hukuk",
  "Şirket Kuruluşu",
  "Vize / Göçmenlik",
  "Gayrimenkul",
];

const ConsultantCategoryManager = () => {
  const { toast } = useToast();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("consultant_categories")
        .select("category")
        .eq("user_id", user.id);

      if (data) {
        setSelectedCategories(data.map(d => d.category));
      }
      setLoading(false);
    };
    fetchCategories();
  }, []);

  const toggleCategory = async (category: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(true);
    try {
      if (selectedCategories.includes(category)) {
        // Remove
        const { error } = await supabase
          .from("consultant_categories")
          .delete()
          .eq("user_id", user.id)
          .eq("category", category);
        if (error) throw error;
        setSelectedCategories(prev => prev.filter(c => c !== category));
        toast({ title: `"${category}" kaldırıldı` });
      } else {
        // Add
        const { error } = await supabase
          .from("consultant_categories")
          .insert({ user_id: user.id, category });
        if (error) throw error;
        setSelectedCategories(prev => [...prev, category]);
        toast({ title: `"${category}" eklendi` });
      }
    } catch (err: any) {
      toast({ title: "Hata", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-20 bg-muted rounded-lg" />;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Hizmet verdiğiniz kategorileri seçin. Bu kategorilerdeki yeni talepler size bildirim olarak düşecektir.
      </p>
      <div className="flex flex-wrap gap-2">
        {ALL_CATEGORIES.map(cat => {
          const isSelected = selectedCategories.includes(cat);
          return (
            <Badge
              key={cat}
              className={`cursor-pointer transition-all text-sm py-1.5 px-3 gap-1.5 ${
                isSelected
                  ? "bg-primary/15 text-primary border-primary/30 ring-2 ring-primary/20"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted border-border"
              }`}
              onClick={() => !saving && toggleCategory(cat)}
            >
              {isSelected ? <CheckCircle className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {cat}
            </Badge>
          );
        })}
      </div>
      {selectedCategories.length === 0 && (
        <p className="text-xs text-destructive">
          ⚠️ Henüz kategori seçmediniz. Hizmet talepleri almak için en az bir kategori seçin.
        </p>
      )}
    </div>
  );
};

export default ConsultantCategoryManager;
