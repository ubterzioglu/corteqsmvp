// Araç sayfası — /tools/:toolSlug. Landing → stepper → sonuç (inline).
// Login zorunlu (App.tsx RequireAuth); hub (/tools) login'siz, tıklayınca buraya
// gelince guard'a takılıp next parametresiyle login'e yönlenir. docs/10tool/00 §UX akışı.
// NOT: Bazı Almanya araçları DB skorlama motoruna uymaz (deterministik hesaplayıcı / karar ağacı /
// soru havuzu) → germany-standalone-tools registry üzerinden kendi bileşenleriyle render edilir.
// Mod seçimi (hızlı/detaylı) kaldırıldı — her araç tek modlu sabit 20 sorudan oluşur
// (relocation_tool_questions.mode = 'both'); session RPC'si şema uyumluluğu için sabit
// 'detailed' mode değeriyle çağrılır.
import { Suspense, lazy, useEffect, useMemo, useState, type CSSProperties } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { QuestionStepper } from "@/components/relocation/tools/QuestionStepper";
import { ToolResultView } from "@/components/relocation/tools/ToolResultView";
import { BackToToolsButton } from "@/components/relocation/tools/BackToToolsButton";
import {
  getSessionForResume,
  getToolBySlug,
  requestDiasporaIntro,
} from "@/lib/relocation-tools-api";
import { relocationToolsKeys } from "@/lib/relocation-tools-query-keys";
import { useRelocationToolSession } from "@/hooks/useRelocationToolSession";
import { TOOLS_UI_COPY } from "@/lib/relocation-tools-copy";
import { toolHeroImage } from "@/lib/relocation-tools-images";
import { getStandaloneTool } from "@/lib/standalone-tools";
import { useSeo } from "@/lib/seo";

const TOOL_SESSION_MODE = "detailed" as const;

interface SpaceDecor {
  emoji: string;
  style: CSSProperties;
}

// Uzay banner'ındaki yüzen ikonlar — .profile-globe (index.css) konumsuz gelir, konum burada verilir.
const SPACE_DECORATIONS: SpaceDecor[] = [
  {
    emoji: "✨",
    style: { top: "1rem", left: "6%", "--globe-size": "30px", "--globe-opacity": "0.55", "--globe-duration": "18s" } as CSSProperties,
  },
  {
    emoji: "🪐",
    style: {
      top: "3.25rem",
      right: "8%",
      "--globe-size": "26px",
      "--globe-opacity": "0.45",
      "--globe-duration": "24s",
      "--globe-delay": "-8s",
    } as CSSProperties,
  },
  {
    emoji: "⭐",
    style: {
      bottom: "0.75rem",
      left: "16%",
      "--globe-size": "18px",
      "--globe-opacity": "0.5",
      "--globe-duration": "20s",
      "--globe-delay": "-3s",
    } as CSSProperties,
  },
];

export default function RelocationToolPage() {
  const { toolSlug = "", sessionId: routeSessionId = "" } = useParams<{
    toolSlug: string;
    sessionId: string;
  }>();
  const { toast } = useToast();
  const [started, setStarted] = useState(false);

  // Standalone Almanya aracı mı? Öyleyse session motorunu atla, kendi bileşenini lazy yükle.
  // Hook sırası bozulmasın diye TÜM hook'lar koşulsuz çağrılır; standalone return en sonda.
  const standalone = getStandaloneTool(toolSlug);
  const StandaloneComponent = useMemo(
    () => (standalone ? lazy(standalone.load) : null),
    [standalone],
  );

  const toolQuery = useQuery({
    queryKey: relocationToolsKeys.tool(toolSlug),
    queryFn: () => getToolBySlug(toolSlug),
    enabled: !!toolSlug && !standalone,
  });

  const resumeQuery = useQuery({
    queryKey: relocationToolsKeys.session(routeSessionId),
    queryFn: () => getSessionForResume(routeSessionId),
    enabled: !!routeSessionId && !standalone,
  });

  const tool = toolQuery.data;

  useSeo(
    tool
      ? {
          title: `${tool.title_tr} | CorteQS`,
          description: tool.summary_tr,
          canonicalPath: `/tools/${tool.slug}`,
        }
      : { canonicalPath: `/tools/${toolSlug}` },
    [tool?.slug],
  );

  const session = useRelocationToolSession({
    toolKey: tool?.key ?? "",
    onError: (message) =>
      toast({ title: "Sonuç hesaplanamadı", description: message, variant: "destructive" }),
  });
  const attachSession = session.attachSession;

  useEffect(() => {
    if (resumeQuery.data?.session_id) {
      attachSession(resumeQuery.data.session_id);
      setStarted(true);
    }
  }, [attachSession, resumeQuery.data?.session_id]);

  // B22: sonuç üretilince adres çubuğu kalıcı sonuç rotasına çevrilir
  // (/tools/:slug/result/:resultId — rota ve kayıt zaten var). Böylece CTA ile
  // başka sayfaya gidip GERİ dönünce ya da F5'te sonuç kaybolmaz.
  // replaceState router'ı yeniden render etmez; inline görünüm aynen sürer.
  const resultId = session.result?.result_id ?? null;
  useEffect(() => {
    if (session.sessionId && !resultId && toolSlug && !routeSessionId) {
      window.history.replaceState(
        window.history.state,
        "",
        `/tools/${toolSlug}/session/${session.sessionId}`,
      );
    }
  }, [resultId, routeSessionId, session.sessionId, toolSlug]);

  useEffect(() => {
    if (resultId && toolSlug) {
      window.history.replaceState(window.history.state, "", `/tools/${toolSlug}/result/${resultId}`);
    }
  }, [resultId, toolSlug]);

  // Standalone araç: kendi bileşenini render et (session/landing/stepper akışını atla).
  if (StandaloneComponent) {
    return (
      <>
        <Suspense
          fallback={
            <div className="container mx-auto max-w-3xl px-4 py-6 text-sm text-muted-foreground">
              {TOOLS_UI_COPY.loading}
            </div>
          }
        >
          <StandaloneComponent />
        </Suspense>
        {/* Dönüş butonu standalone araçlar için BURADA: bu araçlar ToolResultView'dan
            geçmediği için oradaki buton onlara ulaşmıyor. Tek darboğaz olduğundan
            yeni eklenecek standalone araçlar da otomatik kapsanır.
            Genişlik `max-w-2xl`: 6 standalone sayfanın 4'ü bu genişlikte
            (ikisi max-w-4xl); daha dar bir buton geniş içeriğin altında ortalanmış
            durur, tersi (içerikten taşan buton) bozuk görünürdü. */}
        <div className="container mx-auto max-w-2xl px-4 pb-8">
          <BackToToolsButton />
        </div>
      </>
    );
  }

  if (toolQuery.isLoading || (!!routeSessionId && resumeQuery.isLoading)) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-6 text-sm text-muted-foreground">
        {TOOLS_UI_COPY.loading}
      </div>
    );
  }
  if (!tool) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-6 text-sm text-destructive">
        {TOOLS_UI_COPY.notFound}
      </div>
    );
  }
  if (
    routeSessionId
    && (!resumeQuery.data || resumeQuery.data.tool_key !== tool.key)
  ) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-6 text-sm text-destructive">
        Devam edilecek araç oturumu bulunamadı.
      </div>
    );
  }

  const resetAll = () => {
    setStarted(false);
    session.reset();
    // B22 simetrisi: sonuç URL'sinden araç köküne dön (yeni çözümün adresi kirlenmesin).
    window.history.replaceState(window.history.state, "", `/tools/${toolSlug}`);
  };

  const result = session.result;
  // Hero görsel yalnızca karşılama ekranında (sorular başlamadan önce) gösterilir.
  const heroImage = toolHeroImage(tool.slug);
  const showHero = !result && !started && !!heroImage;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6">
      <div className="tools-space-shell relative mb-6 overflow-hidden rounded-3xl px-5 py-8 text-center sm:px-8">
        <div className="tools-space-stars" aria-hidden="true" />
        {SPACE_DECORATIONS.map((decor) => (
          <span key={decor.emoji} className="profile-globe" style={decor.style} aria-hidden="true">
            {decor.emoji}
          </span>
        ))}

        <div className="relative z-10">
          {showHero && (
            <img
              src={heroImage}
              alt=""
              className="mx-auto mb-5 aspect-[16/9] w-full max-w-md rounded-2xl object-cover shadow-lg ring-1 ring-white/15"
            />
          )}
          <h1 className="font-display text-2xl font-bold tracking-tight text-white md:text-3xl">
            {tool.title_tr}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/70">{tool.summary_tr}</p>
        </div>
      </div>

      {result ? (
        <ToolResultView
          result={result}
          onRetake={resetAll}
          onRequestIntro={(candidateId) => {
            void requestDiasporaIntro(candidateId)
              .then(() =>
                toast({
                  title: "Tanışma isteği gönderildi",
                  description: "Karşı taraf kabul ederse iletişim açılır.",
                }),
              )
              .catch((err: unknown) =>
                toast({
                  title: "İstek gönderilemedi",
                  description: err instanceof Error ? err.message : "Beklenmeyen hata",
                  variant: "destructive",
                }),
              );
          }}
        />
      ) : (
        <QuestionStepper
          key={routeSessionId || "new-session"}
          questions={tool.questions}
          initialAnswers={resumeQuery.data?.answers}
          isSubmitting={session.isRunning}
          onAnswerStart={() => setStarted(true)}
          onAnswerChange={(questionKey, answer) => session.saveProgress({
            mode: TOOL_SESSION_MODE,
            questionKey,
            answer,
          })}
          onComplete={(answers) => session.run({ mode: TOOL_SESSION_MODE, answers })}
        />
      )}
    </div>
  );
}
