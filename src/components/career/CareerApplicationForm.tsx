import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CAREER_CV_ACCEPT,
  CAREER_PRESENTATION_ACCEPT,
  careerErrorMessage,
  newCareerApplicationId,
  submitCareerApplication,
  uploadCareerFiles,
  validateCareerCvFile,
  validateCareerPresentationFile,
} from "@/lib/careers/careers-api";
import { CAREER_INTERNSHIP, CAREER_JOBS } from "@/lib/careers/careers-data";
import { LEGACY_CAREER_POSITIONS } from "@/lib/careers/careers-legacy";
import {
  CAREER_MODELS,
  careerApplicationSchema,
  type CareerApplicationInput,
} from "@/lib/careers/careers-schemas";

import CareerFileDrop from "./CareerFileDrop";

const MODEL_LABELS: Record<(typeof CAREER_MODELS)[number], string> = {
  "kurucu-ekip": "Kurucu Ekip Modeli",
  "yatirimci-ortak": "Yatırımcı-Ortak Modeli",
  staj: "Staj programı",
  gorusmede: "Görüşmede konuşalım",
};

type CareerApplicationFormProps = {
  /** İlan kartından seçilen pozisyon (KR05) — form alanını doldurur. */
  selectedPosition: string | null;
};

export function CareerApplicationForm({ selectedPosition }: CareerApplicationFormProps) {
  const [cv, setCv] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState<File | null>(null);
  const [presentation, setPresentation] = useState<File | null>(null);
  const [cvError, setCvError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const form = useForm<CareerApplicationInput>({
    resolver: zodResolver(careerApplicationSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      linkedin: "",
      country: "",
      city: "",
      position: selectedPosition ?? "",
      model: "gorusmede",
      coverLetterText: "",
      consent: true as unknown as CareerApplicationInput["consent"],
      source: "kariyer-sayfasi",
    },
  });

  // İlan kartındaki "Bu pozisyona başvur" seçimi forma yansır.
  useEffect(() => {
    if (selectedPosition) form.setValue("position", selectedPosition, { shouldValidate: true });
  }, [selectedPosition, form]);

  // Onay kutusu VARSAYILAN OLARAK İŞARETSİZ olmalı; şema `z.literal(true)`
  // beklediği için başlangıç değeri yanlış tipte kalmasın diye burada sıfırlanır.
  useEffect(() => {
    form.setValue("consent", false as unknown as CareerApplicationInput["consent"]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (values: CareerApplicationInput) => {
    if (!cv) {
      setCvError("CV yüklemen gerekiyor.");
      return;
    }
    setCvError(null);
    setSubmitting(true);

    try {
      const applicationId = newCareerApplicationId();
      const paths = await uploadCareerFiles(applicationId, { cv, coverLetter, presentation });
      await submitCareerApplication(applicationId, values, paths);

      setDone(true);
      toast.success("Başvurun bize ulaştı. En kısa sürede döneceğiz.");
      form.reset();
      setCv(null);
      setCoverLetter(null);
      setPresentation(null);
    } catch (error: unknown) {
      // ⚠️ `careerErrorMessage` düz nesne hatayı da çözer; `instanceof Error`
      // ile daraltmak kullanıcıya `[object Object]` gösterir.
      toast.error(careerErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-8 text-center">
        <h3 className="text-lg font-semibold">Başvurun alındı</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Teşekkürler. Başvurunu inceleyip en kısa sürede sana döneceğiz.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => setDone(false)}>
          Yeni başvuru gönder
        </Button>
      </div>
    );
  }

  const errors = form.formState.errors;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="career-fullName" className="text-sm font-medium">
            Ad soyad <span className="text-destructive">*</span>
          </label>
          <Input id="career-fullName" className="mt-2" {...form.register("fullName")} />
          {errors.fullName && <p role="alert" className="mt-1 text-sm text-destructive">{errors.fullName.message}</p>}
        </div>
        <div>
          <label htmlFor="career-email" className="text-sm font-medium">
            E-posta <span className="text-destructive">*</span>
          </label>
          <Input id="career-email" type="email" className="mt-2" {...form.register("email")} />
          {errors.email && <p role="alert" className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <div>
          <label htmlFor="career-phone" className="text-sm font-medium">
            Telefon
          </label>
          <Input id="career-phone" className="mt-2" {...form.register("phone")} />
        </div>
        <div>
          <label htmlFor="career-linkedin" className="text-sm font-medium">
            LinkedIn
          </label>
          <Input id="career-linkedin" className="mt-2" placeholder="https://" {...form.register("linkedin")} />
        </div>
        <div>
          <label htmlFor="career-country" className="text-sm font-medium">
            Ülke <span className="text-destructive">*</span>
          </label>
          <Input id="career-country" className="mt-2" {...form.register("country")} />
          {errors.country && <p role="alert" className="mt-1 text-sm text-destructive">{errors.country.message}</p>}
        </div>
        <div>
          <label htmlFor="career-city" className="text-sm font-medium">
            Şehir
          </label>
          <Input id="career-city" className="mt-2" {...form.register("city")} />
        </div>
        <div>
          <label htmlFor="career-position" className="text-sm font-medium">
            Pozisyon <span className="text-destructive">*</span>
          </label>
          <select
            id="career-position"
            className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            {...form.register("position")}
          >
            <option value="">Seçiniz</option>
            {CAREER_JOBS.map((job) => (
              <option key={job.id} value={job.id}>
                {job.tr}
              </option>
            ))}
            <option value={CAREER_INTERNSHIP.id}>{CAREER_INTERNSHIP.tr}</option>
            {/* ⚠️ Önceki dönem ilanları da listede olmalı (KR07): eski bir ilandan
                "Bu pozisyona başvur" diyen kullanıcıya boş bir kutu gösterilirdi
                ve seçim sessizce kaybolurdu. */}
            <optgroup label="Önceki dönem ilanları">
              {LEGACY_CAREER_POSITIONS.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </optgroup>
          </select>
          {errors.position && <p role="alert" className="mt-1 text-sm text-destructive">{errors.position.message}</p>}
        </div>
        <div>
          <label htmlFor="career-model" className="text-sm font-medium">
            Katılım modeli <span className="text-destructive">*</span>
          </label>
          <select
            id="career-model"
            className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            {...form.register("model")}
          >
            {CAREER_MODELS.map((model) => (
              <option key={model} value={model}>
                {MODEL_LABELS[model]}
              </option>
            ))}
          </select>
          {errors.model && <p role="alert" className="mt-1 text-sm text-destructive">{errors.model.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="career-cover" className="text-sm font-medium">
          Ön yazı
        </label>
        <Textarea id="career-cover" rows={5} className="mt-2" {...form.register("coverLetterText")} />
        {errors.coverLetterText && (
          <p role="alert" className="mt-1 text-sm text-destructive">{errors.coverLetterText.message}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <CareerFileDrop
          id="career-cv"
          label="CV"
          required
          accept={CAREER_CV_ACCEPT}
          hint="PDF, DOC veya DOCX · en fazla 10 MB"
          file={cv}
          onChange={setCv}
          validate={validateCareerCvFile}
        />
        <CareerFileDrop
          id="career-cover-file"
          label="Ön yazı (dosya)"
          accept={CAREER_CV_ACCEPT}
          hint="PDF, DOC veya DOCX · en fazla 10 MB"
          file={coverLetter}
          onChange={setCoverLetter}
          validate={validateCareerCvFile}
        />
        <CareerFileDrop
          id="career-presentation"
          label="Sunum"
          accept={CAREER_PRESENTATION_ACCEPT}
          hint="PDF, PPT, PPTX veya KEY · en fazla 25 MB"
          file={presentation}
          onChange={setPresentation}
          validate={validateCareerPresentationFile}
        />
      </div>
      {cvError && <p role="alert" className="text-sm text-destructive">{cvError}</p>}

      <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 p-4">
        <Checkbox
          id="career-consent"
          checked={form.watch("consent") === true}
          onCheckedChange={(checked) =>
            form.setValue("consent", (checked === true) as unknown as CareerApplicationInput["consent"], {
              shouldValidate: true,
            })
          }
        />
        <label htmlFor="career-consent" className="text-sm leading-relaxed text-muted-foreground">
          Başvurumda paylaştığım kişisel verilerin{" "}
          <a href="/legal/kvkk" className="font-medium text-primary underline-offset-2 hover:underline">
            KVKK Aydınlatma Metni
          </a>{" "}
          ve{" "}
          <a href="/legal/privacy" className="font-medium text-primary underline-offset-2 hover:underline">
            Gizlilik Politikası
          </a>{" "}
          kapsamında işlenmesini kabul ediyorum. <span className="text-destructive">*</span>
        </label>
      </div>
      {errors.consent && <p role="alert" className="text-sm text-destructive">{errors.consent.message}</p>}

      <Button type="submit" size="lg" disabled={submitting}>
        {submitting ? "Gönderiliyor…" : "Başvurumu gönder"}
      </Button>
    </form>
  );
}

export default CareerApplicationForm;
