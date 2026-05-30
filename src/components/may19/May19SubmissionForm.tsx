import { useRef, useState } from "react";
import { Loader2, Paperclip } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  submitMay19CampaignEntry,
  uploadMay19CampaignFile,
  type May19SubmissionKind,
} from "@/lib/may19-campaign";

type FormState = {
  fullName: string;
  email: string;
  country: string;
  city: string;
  title: string;
  description: string;
  consent: boolean;
};

const initialFormState: FormState = {
  fullName: "",
  email: "",
  country: "",
  city: "",
  title: "",
  description: "",
  consent: false,
};

const inputClass = "h-10 rounded-xl border-slate-200 bg-white/90";

type May19SubmissionFormProps = {
  kind: May19SubmissionKind;
};

export default function May19SubmissionForm({ kind }: May19SubmissionFormProps) {
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submitLabel = kind === "idea" ? "Fikrimi Gönder" : "Anımı Gönder";

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let uploadedMeta: { storageBucket: string; storagePath: string; fileName: string } | null = null;

      if (selectedFile) {
        uploadedMeta = await uploadMay19CampaignFile(kind, selectedFile);
      }

      await submitMay19CampaignEntry({
        kind,
        fullName: form.fullName,
        email: form.email,
        country: form.country,
        city: form.city,
        title: form.title,
        description: form.description,
        consent: form.consent,
        storageBucket: uploadedMeta?.storageBucket,
        storagePath: uploadedMeta?.storagePath,
        fileName: uploadedMeta?.fileName,
      });

      setForm(initialFormState);
      setSelectedFile(null);
      toast({
        title: kind === "idea" ? "Fikrin alındı" : "Anın alındı",
        description:
          kind === "idea"
            ? "19 Mayıs fikrin moderasyon listesine eklendi."
            : "19 Mayıs anın moderasyon listesine eklendi.",
      });
    } catch (error) {
      toast({
        title: "Gönderim tamamlanamadı",
        description:
          error instanceof Error
            ? error.message
            : "Gönderim sırasında bir sorun oluştu. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label className="mb-1.5 block text-xs font-semibold text-slate-600">Ad Soyad</Label>
          <Input required className={inputClass} value={form.fullName} onChange={(event) => update("fullName", event.target.value)} />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <Label className="mb-1.5 block text-xs font-semibold text-slate-600">E-posta</Label>
          <Input required type="email" className={inputClass} value={form.email} onChange={(event) => update("email", event.target.value)} />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <Label className="mb-1.5 block text-xs font-semibold text-slate-600">Ülke</Label>
          <Input required className={inputClass} value={form.country} onChange={(event) => update("country", event.target.value)} />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Label className="mb-1.5 block text-xs font-semibold text-slate-600">Şehir</Label>
          <Input required className={inputClass} value={form.city} onChange={(event) => update("city", event.target.value)} />
        </div>

        <div className="col-span-2">
          <Label className="mb-1.5 block text-xs font-semibold text-slate-600">
            {kind === "idea" ? "Fikir başlığı" : "İçerik başlığı"}
          </Label>
          <Input required className={inputClass} value={form.title} onChange={(event) => update("title", event.target.value)} />
        </div>

        <div className="col-span-2">
          <Label className="mb-1.5 block text-xs font-semibold text-slate-600">
            {kind === "idea" ? "Fikir açıklaması" : "Kısa açıklama"}
          </Label>
          <Textarea required rows={3} className="rounded-xl border-slate-200 bg-white/90 text-sm" value={form.description} onChange={(event) => update("description", event.target.value)} />
        </div>

        <div className="col-span-2">
          <Label className="mb-1.5 block text-xs font-semibold text-slate-600">
            {kind === "idea" ? "Dosya (opsiyonel)" : "Foto/Video (opsiyonel)"}
          </Label>
          <input
            ref={fileInputRef}
            type="file"
            accept={kind === "idea" ? ".pdf,image/*,video/mp4" : "image/*,video/mp4,video/quicktime"}
            className="hidden"
            onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <Paperclip className="h-4 w-4 text-slate-500" />
            Dosya Seç
          </button>
          <p className="mt-2 text-xs text-slate-600">
            {selectedFile ? `Seçilen dosya: ${selectedFile.name}` : "Henüz dosya seçilmedi."}
          </p>
        </div>

        <label className="col-span-2 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-700">
          <Checkbox checked={form.consent} onCheckedChange={(checked) => update("consent", Boolean(checked))} className="mt-0.5" />
          <span>Bu içeriğin CorteQS tarafından incelenip kampanya içinde kullanılmasına izin veriyorum.</span>
        </label>

        <div className="col-span-2 pt-2">
          <Button
            type="button"
            size="sm"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            className={kind === "idea" ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-orange-500 text-white hover:bg-orange-600"}
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
