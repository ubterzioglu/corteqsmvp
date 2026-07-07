// Üye Geri Bildirimi — /feedback (RequireAuth ile korunur, PublicLayout içinde).
// SiteHeader'daki "Feedback Ver" linkinden gelinir; linkin bulunduğu sayfa
// location.state.from ile taşınır ve page_path olarak kaydedilir.
// DB katmanı: src/lib/feedback.ts (member_feedback INSERT, RLS: auth.uid() = created_by).

import { useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { CheckCircle2, MessageSquareHeart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitFeedback, validateFeedbackBody } from "@/lib/feedback";

export default function FeedbackPage() {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "";

  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = validateFeedbackBody(body);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await submitFeedback(body, from || "/feedback");
      setSent(true);
      setBody("");
    } catch (submitError: unknown) {
      setError(
        submitError instanceof Error ? submitError.message : "Feedback gönderilemedi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-[60vh] bg-background px-4 py-12">
      <div className="mx-auto max-w-xl">
        {sent ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
            <h1 className="text-xl font-bold text-foreground">Teşekkürler!</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Geri bildirimin ekibimize ulaştı. Görüşlerin CorteQS'i birlikte
              geliştirmemize yardımcı oluyor.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button variant="outline" onClick={() => setSent(false)}>
                Yeni feedback yaz
              </Button>
              <Button asChild>
                <Link to={from || "/"}>Devam et</Link>
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-border bg-card p-6 sm:p-8"
          >
            <div className="mb-5 flex items-start gap-3">
              <MessageSquareHeart className="mt-1 h-6 w-6 shrink-0 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-foreground">Feedback Ver</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Hata bildirimi, öneri veya genel görüş — aklındaki her şeyi yazabilirsin.
                  Geri bildirimini yalnız CorteQS ekibi görür.
                </p>
              </div>
            </div>

            <Textarea
              value={body}
              onChange={(event) => {
                setBody(event.target.value);
                if (error) setError(null);
              }}
              placeholder="Görüşünü buraya yaz…"
              rows={7}
              disabled={isSubmitting}
            />

            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

            <div className="mt-4 flex items-center justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Gönderiliyor…" : "Gönder"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
