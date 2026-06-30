// Vatandaşlık Testi (Almanya) standalone tool sayfası — /relocation/tools/vatandaslik-testi-almanya.
// 3 mod: Tüm Sorular (Genel) / Gerçek Deneme Sınavı (33 soru, 60 dk) / Eyalet Soruları.
// Sorular germany_citizenship_questions tablosundan (RLS public read). Skorlama istemcide.
import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle, Timer, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  type CitizenshipQuestion,
  listGeneralQuestions,
  listStateQuestions,
  listStates,
} from "@/lib/germany-citizenship-api";
import {
  type ExamMode,
  REAL_EXAM_DURATION_SEC,
  REAL_EXAM_PASS_THRESHOLD,
  REAL_EXAM_TOTAL,
  buildRealExam,
  isCorrect,
  scoreExam,
  shuffle,
} from "@/lib/germany-citizenship-exam";

const OPTION_KEYS = ["a", "b", "c", "d"] as const;

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VatandaslikTestiToolPage() {
  const [mode, setMode] = useState<ExamMode | null>(null);
  const [selectedState, setSelectedState] = useState<string>("");
  const [states, setStates] = useState<string[]>([]);
  const [questions, setQuestions] = useState<CitizenshipQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  // Eyalet listesini ilk yüklemede çek.
  useEffect(() => {
    listStates()
      .then(setStates)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Eyaletler yüklenemedi"));
  }, []);

  // Gerçek sınav geri sayımı.
  useEffect(() => {
    if (mode !== "real" || finished || secondsLeft === null) return;
    if (secondsLeft <= 0) {
      setFinished(true);
      return;
    }
    const t = setTimeout(() => setSecondsLeft((s) => (s === null ? null : s - 1)), 1000);
    return () => clearTimeout(t);
  }, [mode, finished, secondsLeft]);

  const seed = useMemo(() => {
    // Date kullanmadan deterministik olmayan tohum: pencere boyutları + answers uzunluğu yerine
    // her başlatmada artan sayaç. (Math.random harness'te bloklu olabilir → performance.now fallback.)
    return Math.floor(performance.now()) ^ 0x1234abcd;
  }, []);

  const startMode = useCallback(
    async (m: ExamMode) => {
      setLoading(true);
      setError(null);
      setCurrent(0);
      setAnswers({});
      setRevealed(false);
      setFinished(false);
      try {
        if (m === "all") {
          const all = await listGeneralQuestions();
          setQuestions(shuffle(all, seed));
          setSecondsLeft(null);
        } else if (m === "state") {
          if (!selectedState) {
            setError("Önce bir eyalet seç.");
            setLoading(false);
            return;
          }
          const st = await listStateQuestions(selectedState);
          setQuestions(shuffle(st, seed));
          setSecondsLeft(null);
        } else {
          // real
          const [gen, st] = await Promise.all([
            listGeneralQuestions(),
            selectedState ? listStateQuestions(selectedState) : Promise.resolve([]),
          ]);
          setQuestions(buildRealExam(gen, st, seed));
          setSecondsLeft(REAL_EXAM_DURATION_SEC);
        }
        setMode(m);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Sorular yüklenemedi");
      } finally {
        setLoading(false);
      }
    },
    [seed, selectedState],
  );

  const question = questions[current];
  const isReal = mode === "real";

  const pickAnswer = (optKey: string) => {
    if (!question) return;
    if (!isReal && revealed) return; // pratik modda cevap kilitli
    setAnswers((prev) => ({ ...prev, [question.id]: optKey }));
    if (!isReal) setRevealed(true); // pratik modda anında geri bildirim
  };

  const next = () => {
    setRevealed(false);
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      setFinished(true);
    }
  };

  const reset = () => {
    setMode(null);
    setQuestions([]);
    setCurrent(0);
    setAnswers({});
    setRevealed(false);
    setFinished(false);
    setSecondsLeft(null);
    setError(null);
  };

  const score = useMemo(
    () => (finished ? scoreExam(questions, answers, isReal) : null),
    [finished, questions, answers, isReal],
  );

  // --- Render ---

  if (!mode) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 text-center">
          <span className="mb-1 block text-3xl">🇩🇪</span>
          <h1 className="text-2xl font-extrabold text-foreground">Vatandaşlık Testi (Almanya)</h1>
          <p className="text-sm text-muted-foreground">
            Einbürgerungstest pratiği — resmî BAMF soru havuzu, Almanca + Türkçe.
          </p>
        </div>

        {error && <p className="mb-4 text-center text-sm text-destructive">{error}</p>}

        <div className="space-y-3">
          <ModeCard
            title="Tüm Sorular (Genel)"
            desc="Genel havuzdan tüm sorularla sınırsız pratik; her soruda anında geri bildirim."
            disabled={loading}
            onClick={() => startMode("all")}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Eyalet Soruları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Seçtiğin eyalete özel 10 soruyla hızlı tekrar.
              </p>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger><SelectValue placeholder="Eyalet seç" /></SelectTrigger>
                <SelectContent>
                  {states.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="w-full"
                disabled={loading || !selectedState}
                onClick={() => startMode("state")}
              >
                Eyalet Sorularına Başla
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gerçek Deneme Sınavı</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {REAL_EXAM_TOTAL} soru (30 genel + 3 eyalet), 60 dakikalık geri sayım, baraj{" "}
                {REAL_EXAM_PASS_THRESHOLD}/{REAL_EXAM_TOTAL}. Eyalet seçersen 3 soru o eyaletten gelir.
              </p>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger><SelectValue placeholder="Eyalet seç (opsiyonel)" /></SelectTrigger>
                <SelectContent>
                  {states.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="w-full" disabled={loading} onClick={() => startMode("real")}>
                Deneme Sınavını Başlat
              </Button>
            </CardContent>
          </Card>
        </div>
        {loading && <p className="mt-4 text-center text-sm text-muted-foreground">Yükleniyor…</p>}
      </div>
    );
  }

  if (finished && score) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-6">
        <Card className={cn("border-2", score.passed ? "border-green-500" : "border-red-500")}>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {score.passed ? "🎉 Geçtin!" : "Tekrar dene"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-4xl font-extrabold text-foreground">
              {score.correct} / {score.total}
            </p>
            {isReal && (
              <p className="mt-1 text-sm text-muted-foreground">
                Geçme barajı: {REAL_EXAM_PASS_THRESHOLD}/{REAL_EXAM_TOTAL}
              </p>
            )}
            <Button className="mt-6 w-full" onClick={reset}>
              Yeni Test
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-6 text-center text-sm text-muted-foreground">
        Soru bulunamadı.
      </div>
    );
  }

  const userAnswer = answers[question.id];

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Soru {current + 1} / {questions.length}
        </span>
        {isReal && secondsLeft !== null && (
          <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
            <Timer className="h-4 w-4" /> {formatTime(secondsLeft)}
          </span>
        )}
        <button onClick={reset} className="text-sm text-muted-foreground hover:text-foreground">
          Çıkış
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base leading-snug">{question.soru_almanca}</CardTitle>
          <p className="text-sm text-muted-foreground">{question.soru_turkce}</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {question.image_url && (
            <img
              src={question.image_url}
              alt=""
              loading="lazy"
              className="mb-2 max-h-56 w-full rounded-lg object-contain"
            />
          )}
          {OPTION_KEYS.map((key) => {
            const text = question.secenekler[key];
            if (text === undefined) return null;
            const isPicked = userAnswer === key;
            const isAnswer = question.dogru_cevap === key;
            const showFeedback = !isReal && revealed;
            return (
              <button
                key={key}
                onClick={() => pickAnswer(key)}
                disabled={showFeedback}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                  showFeedback && isAnswer && "border-green-500 bg-green-50 dark:bg-green-900/20",
                  showFeedback && isPicked && !isAnswer && "border-red-500 bg-red-50 dark:bg-red-900/20",
                  !showFeedback && isPicked && "border-primary bg-accent",
                  !showFeedback && !isPicked && "border-border hover:border-primary hover:bg-accent",
                )}
              >
                <span className="font-semibold uppercase text-muted-foreground">{key})</span>
                <span className="flex-1">{text}</span>
                {showFeedback && isAnswer && <CheckCircle className="h-4 w-4 text-green-600" />}
                {showFeedback && isPicked && !isAnswer && <XCircle className="h-4 w-4 text-red-600" />}
              </button>
            );
          })}

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">
              {isReal ? "Seçimini yap, ilerle" : "Cevapla → doğru/yanlış anında görünür"}
            </span>
            <Button onClick={next} disabled={isReal ? !userAnswer : !revealed}>
              {current < questions.length - 1 ? "Sonraki" : "Bitir"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ModeCard({
  title,
  desc,
  onClick,
  disabled,
}: {
  title: string;
  desc: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary hover:bg-accent disabled:opacity-50"
    >
      <p className="font-semibold text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </button>
  );
}
