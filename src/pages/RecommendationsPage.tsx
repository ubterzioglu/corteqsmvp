// M20 · /tavsiye — Tavsiye İste liste + talep açma (ücretsiz topluluk işlevi).
//
// 🔴 RequireFeature YOK (M01/T2 kilidi: role_features'ta kuralı olmayan feature
// SESSİZCE herkese kapanır). Liste ANONİME açık (RLS select public); talep açma
// giriş ister (bileşen içinde useAuth ile kapı). Yazma RPC-only (M17).
// 🔴 Bu sayfa M19 lib'ini (use-recommendations → recommendations-api → rules/
// schemas) tüketir — check:dead üretim tüketicisi ister.
import { useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquareHeart, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSeo } from "@/lib/seo";
import { useAuth } from "@/components/auth/useAuth";
import {
  useCreateRecommendation,
  useRecommendations,
} from "@/hooks/use-recommendations";
import {
  RECOMMENDATION_BODY_MAX,
  RECOMMENDATION_TITLE_MAX,
  resolveRecommendationRpcErrorMessage,
} from "@/lib/recommendations-rules";
import type { CreateRecommendationInput } from "@/lib/recommendations-schemas";

const STATUS_LABELS: Record<string, string> = {
  open: "Açık",
  answered: "Yanıtlanmış",
  closed: "Kapalı",
};

export default function RecommendationsPage() {
  useSeo({
    title: "Tavsiye İste | CorteQS",
    description:
      "Diaspora topluluğundan tavsiye iste: güvenilir terzi, doktor, usta, danışman. Talebini aç, eşleşen profesyoneller ve topluluk yanıtlasın.",
    canonicalPath: "/tavsiye",
  });

  const { user } = useAuth();
  const [status, setStatus] = useState("open");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateRecommendationInput>({
    title: "",
    body: "",
    category_slug: "",
    country: "",
    city: "",
    diaspora_key: "tr",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const listQuery = useRecommendations({ status });
  const createMutation = useCreateRecommendation();

  const rows = listQuery.data ?? [];

  const submit = () => {
    setFormError(null);
    if (!form.title.trim() || !form.body.trim()) {
      setFormError("Başlık ve açıklama zorunlu.");
      return;
    }
    createMutation.mutate(form, {
      onSuccess: () => {
        setShowForm(false);
        setForm({ title: "", body: "", category_slug: "", country: "", city: "", diaspora_key: "tr" });
      },
      onError: (error: unknown) => setFormError(resolveRecommendationRpcErrorMessage(error)),
    });
  };

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="container mx-auto max-w-3xl space-y-6 px-4">
        <header className="space-y-2">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <MessageSquareHeart className="h-6 w-6 text-primary" aria-hidden="true" />
            Tavsiye İste
          </h1>
          <p className="text-sm text-muted-foreground">
            Topluluktan tavsiye iste — güvenilir esnaf, sağlık, danışmanlık ve daha fazlası.
            Talebini aç; eşleşen profesyoneller ve üyeler yanıtlasın. Liste herkese açık.
          </p>
        </header>

        <div className="flex flex-wrap items-center gap-2">
          {["open", "answered", "closed", "all"].map((s) => (
            <Button
              key={s}
              type="button"
              variant={status === s ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => setStatus(s)}
            >
              {s === "all" ? "Tümü" : STATUS_LABELS[s]}
            </Button>
          ))}
          <div className="ml-auto">
            {user ? (
              <Button type="button" className="rounded-full" onClick={() => setShowForm((v) => !v)}>
                <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
                Tavsiye iste
              </Button>
            ) : (
              <Link to="/auth">
                <Button type="button" variant="outline" className="rounded-full">
                  Talep açmak için giriş yap
                </Button>
              </Link>
            )}
          </div>
        </div>

        {showForm && user ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Yeni tavsiye talebi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="rec-title">Başlık</Label>
                <Input
                  id="rec-title"
                  value={form.title}
                  maxLength={RECOMMENDATION_TITLE_MAX}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Örn: Dortmund'da güvenilir terzi"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rec-body">Açıklama</Label>
                <Textarea
                  id="rec-body"
                  value={form.body}
                  maxLength={RECOMMENDATION_BODY_MAX}
                  rows={4}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  placeholder="Ne arıyorsun? Kısa ve net yaz."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="rec-city">Şehir</Label>
                  <Input
                    id="rec-city"
                    value={form.city ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rec-country">Ülke</Label>
                  <Input
                    id="rec-country"
                    value={form.country ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                  />
                </div>
              </div>
              {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
              <Button
                type="button"
                className="rounded-full"
                disabled={createMutation.isPending}
                onClick={submit}
              >
                {createMutation.isPending ? "Gönderiliyor…" : "Talebi yayınla"}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {listQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Talepler yükleniyor…</p>
        ) : listQuery.isError ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            Talepler okunamadı. Lütfen tekrar dene.
          </p>
        ) : rows.length === 0 ? (
          <p className="rounded-2xl border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            Bu durumda henüz talep yok. İlk tavsiye talebini sen aç.
          </p>
        ) : (
          <ul className="space-y-3">
            {rows.map((row) => (
              <li key={row.id}>
                <Link to={`/tavsiye/${row.id}`} className="block">
                  <Card className="transition-colors hover:border-primary/40">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0">
                      <CardTitle className="text-base">{row.title}</CardTitle>
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                        {STATUS_LABELS[row.status] ?? row.status}
                      </span>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{row.body}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {[row.city, row.country].filter(Boolean).join(", ") || "Konum belirtilmemiş"}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
