// M20 · /tavsiye/:id — tavsiye talebi detayı: talep + yanıtlar + yanıt formu +
// eşleşen profesyoneller (M18 match RPC). 🔴 RequireFeature YOK (M01/T2).
// 🔴 Eşleşen profesyonellerde İLETİŞİM YOK (M18 search_text okumaz) — yalnız
// dizin adı/şehir; kilitli iletişim M22'nin işi (ProLockedInboxCard).
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BadgeCheck, MessageSquareHeart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import ProLockedInboxCard from "@/components/recommendations/ProLockedInboxCard";
import { useSeo } from "@/lib/seo";
import { useAuth } from "@/components/auth/useAuth";
import {
  useAnswerRecommendation,
  useMatchedProfessionals,
  useRecommendationDetail,
} from "@/hooks/use-recommendations";
import { RECOMMENDATION_BODY_MAX } from "@/lib/recommendations-rules";

export default function RecommendationDetailPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const [answer, setAnswer] = useState("");
  const [answerError, setAnswerError] = useState<string | null>(null);

  const detailQuery = useRecommendationDetail(id);
  const matchQuery = useMatchedProfessionals(id);
  const answerMutation = useAnswerRecommendation(id);

  const request = detailQuery.data?.request ?? null;

  useSeo(
    {
      title: request ? `${request.title} | Tavsiye | CorteQS` : "Tavsiye | CorteQS",
      description: request?.body.slice(0, 155) ?? "CorteQS topluluk tavsiye talebi.",
      canonicalPath: `/tavsiye/${id}`,
    },
    // 🔴 use-seo-deps-contract: veri bağımlı useSeo deps TAŞIR (request sonradan
    // yüklenir; deps olmazsa head eski başlıkta kalır).
    [id, request?.title, request?.body],
  );

  const submitAnswer = () => {
    setAnswerError(null);
    if (!answer.trim()) {
      setAnswerError("Yanıt boş olamaz.");
      return;
    }
    answerMutation.mutate(answer, {
      onSuccess: () => setAnswer(""),
      // 🔴 TEK çözüm: api katmanı hatayı zaten Türkçe Error olarak fırlatır —
      // burada yeniden resolver ÇAĞRILMAZ (çift çözüm genel mesaja düşürüyordu).
      onError: (error: unknown) =>
        setAnswerError(error instanceof Error ? error.message : "İşlem tamamlanamadı. Lütfen tekrar dene."),
    });
  };

  if (detailQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background py-10">
        <div className="container mx-auto max-w-3xl px-4 text-sm text-muted-foreground">
          Yükleniyor…
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-background py-10">
        <div className="container mx-auto max-w-3xl space-y-4 px-4">
          <p className="text-sm text-muted-foreground">Tavsiye talebi bulunamadı.</p>
          <Link to="/tavsiye">
            <Button variant="outline" className="rounded-full">
              <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Tavsiyelere dön
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const answers = detailQuery.data?.answers ?? [];
  const matches = matchQuery.data ?? [];
  // F11: kullanıcının yanıtı VARSA form çizilmez (SQL zaten recommendation_already_answered
  // ile reddeder; UI davetkâr boş form göstermez — "yanıtın gönderildi" durumu).
  const myAnswered = user ? answers.some((a) => a.user_id === user.id) : false;

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="container mx-auto max-w-3xl space-y-6 px-4">
        <Link to="/tavsiye" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Tavsiyelere dön
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{request.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="whitespace-pre-line text-sm text-foreground">{request.body}</p>
            <p className="text-xs text-muted-foreground">
              {[request.city, request.country].filter(Boolean).join(", ") || "Konum belirtilmemiş"}
              {request.category_slug ? ` · kategori: ${request.category_slug}` : ""}
            </p>
          </CardContent>
        </Card>

        {matches.length > 0 ? (
          <section className="space-y-2">
            <h2 className="text-sm font-medium">Eşleşen profesyoneller</h2>
            <p className="text-xs text-muted-foreground">
              Kategori + şehir/ülkeye göre sıralanır (en alakalı önce). İletişim bilgisi burada
              gösterilmez.
            </p>
            <ul className="space-y-2">
              {matches.map((pro) => (
                <li key={pro.item_id}>
                  <Card>
                    <CardContent className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium">{pro.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {[pro.city, pro.country_code].filter(Boolean).join(", ") || "—"}
                          {pro.match_reason ? ` · ${pro.match_reason}` : ""}
                        </p>
                      </div>
                      <BadgeCheck className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* M22 · kilitli "talep sahibine doğrudan ulaş" yüzeyi — girişli ve
            talebin SAHİBİ OLMAYAN kullanıcıya (kendi iletişim kartın anlamsız).
            İletişim ÇİZİLMEZ; ilgi kaydı feature_interest 'pro.inbox'. */}
        {user && user.id !== request.user_id ? <ProLockedInboxCard /> : null}

        <section className="space-y-3">
          <h2 className="text-sm font-medium">Yanıtlar ({answers.length})</h2>
          {answers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz yanıt yok. İlk yanıtı sen ver.</p>
          ) : (
            <ul className="space-y-3">
              {answers.map((a) => (
                <li key={a.id}>
                  <Card>
                    <CardContent className="space-y-1 py-3">
                      <p className="whitespace-pre-line text-sm text-foreground">{a.body}</p>
                      {a.is_professional ? (
                        <p className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                          <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                          Profesyonel
                        </p>
                      ) : null}
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ul>
          )}

          {request.status === "closed" ? (
            <p className="text-sm text-muted-foreground">Bu talep kapatılmış; yeni yanıt kabul etmiyor.</p>
          ) : !user ? (
            <Link to="/auth">
              <Button variant="outline" className="rounded-full">
                Yanıtlamak için giriş yap
              </Button>
            </Link>
          ) : user.id === request.user_id ? (
            // 🔴 Sahip kendi talebini YANITLAYAMAZ (SQL: recommendation_self_answer —
            // inceleme W3). Form hiç çizilmez; UI ile SQL kuralı aynı.
            <p className="text-sm text-muted-foreground">
              Bu senin talebin — kendi talebine yanıt yazamazsın.
            </p>
          ) : myAnswered ? (
            // F11: yanıtını vermiş kullanıcıya davetkâr boş form GÖSTERİLMEZ —
            // SQL zaten recommendation_already_answered ile reddeder.
            <p className="text-sm text-muted-foreground" data-testid="already-answered-note">
              Yanıtın gönderildi — bu talebe bir kez yanıt verebilirsin.
            </p>
          ) : (
            <div className="space-y-2">
              <Textarea
                value={answer}
                maxLength={RECOMMENDATION_BODY_MAX}
                rows={3}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Bir tavsiye ver…"
              />
              {answerError ? <p className="text-sm text-destructive">{answerError}</p> : null}
              <Button
                type="button"
                className="rounded-full"
                disabled={answerMutation.isPending}
                onClick={submitAnswer}
              >
                <MessageSquareHeart className="mr-1.5 h-4 w-4" aria-hidden="true" />
                {answerMutation.isPending ? "Gönderiliyor…" : "Yanıtla"}
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
