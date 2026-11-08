// Profil → "Geri Bildirim" sekmesi (L10a). /feedback sayfasıyla AYNI veri katmanını
// (`src/lib/feedback.ts`) kullanır; ek olarak üyenin kendi geçmişini listeler.
// Sayfa yolu = şu anki pathname (SiteHeader linki `location.state.from` taşırdı; burada
// kullanıcı zaten profilde).

import { useState, type FormEvent } from "react";
import { useLocation } from "react-router-dom";
import { CheckCircle2, MessageSquareHeart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useMyFeedback } from "@/hooks/profile/useMyFeedback";
import { getFeedbackStatusLabel, validateFeedbackBody } from "@/lib/feedback";
import { formatLongDateTimeTR } from "@/lib/format-date";

export default function ProfileFeedbackPanel() {
  const { pathname } = useLocation();
  const { query, submitMutation } = useMyFeedback();

  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = validateFeedbackBody(body);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    try {
      await submitMutation.mutateAsync({ body, pagePath: pathname || "/profile" });
      setBody("");
      setSent(true);
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : "Geri bildirim gönderilemedi.");
    }
  };

  const history = query.data ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquareHeart className="h-5 w-5 text-primary" />
            Geri Bildirim
          </CardTitle>
          <CardDescription>
            Hata bildirimi, öneri veya genel görüş — aklındaki her şeyi yazabilirsin. Geri bildirimini yalnız CorteQS
            ekibi görür.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Textarea
              aria-label="Geri bildirim metni"
              value={body}
              onChange={(event) => {
                setBody(event.target.value);
                if (error) setError(null);
                if (sent) setSent(false);
              }}
              placeholder="Görüşünü buraya yaz…"
              rows={6}
              disabled={submitMutation.isPending}
            />
            {error && (
              <p role="alert" className="mt-2 text-sm text-destructive">
                {error}
              </p>
            )}
            {sent && (
              <p role="status" className="mt-2 flex items-center gap-1.5 text-sm text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                Teşekkürler! Geri bildirimin ekibimize ulaştı.
              </p>
            )}
            <div className="mt-4 flex justify-end">
              <Button type="submit" disabled={submitMutation.isPending}>
                {submitMutation.isPending ? "Gönderiliyor…" : "Gönder"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gönderdiğin geri bildirimler</CardTitle>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <p className="text-sm text-muted-foreground">Yükleniyor…</p>
          ) : query.isError ? (
            <p role="alert" className="text-sm text-destructive">
              {query.error instanceof Error ? query.error.message : "Geri bildirimleriniz yüklenemedi."}
            </p>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz geri bildirim göndermedin.</p>
          ) : (
            <ul className="space-y-3">
              {history.map((item) => (
                <li key={item.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{formatLongDateTimeTR(item.createdAt)}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-foreground">
                      {getFeedbackStatusLabel(item.status)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-foreground">{item.body}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
