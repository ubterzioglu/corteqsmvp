import { useMemo, useState } from "react";
import type { SurveyWithQuestions } from "@/lib/surveys";
import { createSurvey, updateSurvey, upsertSurveyQuestions } from "@/lib/surveys";
import SurveyQuestionEditor, { type EditableQuestion } from "@/components/admin/surveys/SurveyQuestionEditor";
import { supabase } from "@/integrations/supabase/client";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function formatDateSlugPart(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

async function buildAutoDateSlug() {
  const base = `anket-${formatDateSlugPart()}`;
  const { data, error } = await supabase
    .from("surveys")
    .select("slug")
    .like("slug", `${base}%`);

  if (error) throw error;

  const existing = new Set((data ?? []).map((row) => row.slug));
  if (!existing.has(base)) return base;

  let suffix = 2;
  while (existing.has(`${base}-${suffix}`)) {
    suffix += 1;
  }
  return `${base}-${suffix}`;
}

interface SurveyBuilderProps {
  initial?: SurveyWithQuestions | null;
  onSaved?: (surveyId: string) => void;
}

export default function SurveyBuilder({ initial, onSaved }: SurveyBuilderProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [startsAt, setStartsAt] = useState(initial?.starts_at ? initial.starts_at.slice(0, 16) : "");
  const [endsAt, setEndsAt] = useState(initial?.ends_at ? initial.ends_at.slice(0, 16) : "");
  const [allowAnonymous, setAllowAnonymous] = useState(initial?.allow_anonymous ?? true);
  const [allowMultiple, setAllowMultiple] = useState(initial?.allow_multiple_submissions ?? false);
  const [isFeatured, setIsFeatured] = useState(initial?.is_featured ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [questions, setQuestions] = useState<EditableQuestion[]>(
    (initial?.survey_questions ?? []).map((question) => ({
      ...question,
      localId: question.id,
      question: question.question,
      type: question.type,
      options: Array.isArray(question.options) ? question.options.map((item) => String(item)) : [],
      is_required: question.is_required,
    })),
  );

  const computedSlug = useMemo(() => slugify(title), [title]);

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        localId: crypto.randomUUID(),
        type: "short_text",
        question: "",
        description: "",
        placeholder: "",
        options: [],
        is_required: false,
      },
    ]);
  };

  const handleSave = async () => {
    setError(null);
    if (!title.trim()) {
      setError("Başlık zorunlu.");
      return;
    }
    if (questions.some((question) => !question.question.trim())) {
      setError("Tüm sorular için metin girin.");
      return;
    }

    setSaving(true);
    try {
      const resolvedSlug = slug.trim() || (await buildAutoDateSlug());
      const payload = {
        title: title.trim(),
        slug: resolvedSlug,
        description: description.trim() || null,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        allow_anonymous: allowAnonymous,
        allow_multiple_submissions: allowMultiple,
        is_featured: isFeatured,
      };

      const survey = initial
        ? await updateSurvey(initial.id, payload)
        : await createSurvey({ ...payload, status: "draft" });

      await upsertSurveyQuestions(
        survey.id,
        questions.map((question, index) => ({
          id: question.id,
          question: question.question.trim(),
          description: question.description?.trim() || null,
          placeholder: question.placeholder?.trim() || null,
          type: question.type,
          options: question.options,
          validation: {},
          is_required: question.is_required,
          sort_order: index,
        })),
      );

      onSaved?.(survey.id);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Kaydetme başarısız.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-900">Anket Bilgileri</h2>
        <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Başlık" value={title} onChange={(e) => setTitle(e.target.value)} />
        <input className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder={computedSlug || "slug"} value={slug} onChange={(e) => setSlug(e.target.value)} />
        <textarea className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Açıklama" value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm text-slate-700">
            Başlangıç
            <input type="datetime-local" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </label>
          <label className="text-sm text-slate-700">
            Bitiş
            <input type="datetime-local" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </label>
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={allowAnonymous} onChange={(e) => setAllowAnonymous(e.target.checked)} /> Anonymous cevaplara izin ver</label>
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={allowMultiple} onChange={(e) => setAllowMultiple(e.target.checked)} /> Multiple submissions izin ver</label>
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} /> Featured</label>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Sorular</h2>
          <button type="button" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold" onClick={addQuestion}>Soru Ekle</button>
        </div>

        {questions.map((question, index) => (
          <SurveyQuestionEditor
            key={question.localId}
            index={index}
            question={question}
            onChange={(next) => setQuestions((prev) => prev.map((item) => (item.localId === question.localId ? next : item)))}
            onRemove={() => setQuestions((prev) => prev.filter((item) => item.localId !== question.localId))}
            onMoveUp={() =>
              setQuestions((prev) => {
                if (index === 0) return prev;
                const next = [...prev];
                [next[index - 1], next[index]] = [next[index], next[index - 1]];
                return next;
              })
            }
            onMoveDown={() =>
              setQuestions((prev) => {
                if (index === prev.length - 1) return prev;
                const next = [...prev];
                [next[index + 1], next[index]] = [next[index], next[index + 1]];
                return next;
              })
            }
          />
        ))}
      </section>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="button"
        className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </div>
  );
}
