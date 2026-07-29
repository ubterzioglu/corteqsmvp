// Çarşı ilan formu — CaddeCarsiPage'deki satır içi dialog'dan çıkarıldı.
//
// image_urls DB'de baştan beri vardı ama forma bağlı değildi; artık gerçekten görsel
// yüklenebiliyor (aynı `cadde-media` bucket'ı, {uid}/carsi/ öneki). Video tek dosya.
// İletişim tercihi phone/email seçilirse değeri ZORUNLU — aksi halde ilana ulaşılamaz;
// aynı kural RPC'de de var (cadde_invalid_carsi_contact).

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CaddeMediaPreviewStrip } from "@/components/cadde/CaddeMediaGallery";
import {
  CADDE_IMAGE_MIME_TYPES,
  CADDE_VIDEO_MIME_TYPES,
  removeCaddeMedia,
  uploadCaddeMedia,
  validateCaddeMediaFile,
} from "@/lib/cadde-media";
import type { CarsiFormValue } from "@/lib/cadde-composer";
import type { CaddeCity, CaddeCountry, CaddeMediaAsset, CarsiCategory, CarsiContactMode } from "@/lib/cadde-types";

const CONTACT_MODE_LABELS: Record<CarsiContactMode, string> = {
  platform: "Platform üzerinden",
  phone: "Telefon",
  email: "E-posta",
};

/** Çarşı ilanı en fazla 6 görsel taşır (RPC sınırı) — post limitinden farklı. */
const MAX_CARSI_IMAGES = 6;

export interface CarsiItemFormProps {
  value: CarsiFormValue;
  onChange: (next: CarsiFormValue) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  categories: readonly CarsiCategory[];
  countries: readonly CaddeCountry[];
  cities: readonly CaddeCity[];
  /** cadde.carsi.paid_mode açıkken ödeme uyarısı gösterilir. */
  paidMode: boolean;
  onError: (message: string) => void;
}

const CarsiItemForm = ({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  categories,
  countries,
  cities,
  paidMode,
  onError,
}: CarsiItemFormProps) => {
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const update = (patch: Partial<CarsiFormValue>) => onChange({ ...value, ...patch });

  const imageCount = value.media.filter((asset) => asset.kind === "image").length;
  const hasVideo = value.media.some((asset) => asset.kind === "video");

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      let current = value.media;
      for (const file of Array.from(files)) {
        // Görsel limiti Çarşı'da 6 (post'ta 4) — ortak yardımcıyı kullanmadan önce kontrol et.
        if (file.type.startsWith("image/") && current.filter((a) => a.kind === "image").length >= MAX_CARSI_IMAGES) {
          onError(`Bir ilana en fazla ${MAX_CARSI_IMAGES} görsel ekleyebilirsin.`);
          continue;
        }
        const problem = validateCaddeMediaFile(file, current.filter((a) => a.kind === "video"));
        if (problem && !problem.includes("görsel ekleyebilirsin")) {
          onError(problem);
          continue;
        }
        const asset = await uploadCaddeMedia(file, "carsi");
        current = [...current, asset];
        onChange({ ...value, media: current });
      }
    } catch (error: unknown) {
      onError(error instanceof Error ? error.message : "Dosya yüklenemedi.");
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  const handleRemove = async (asset: CaddeMediaAsset) => {
    update({ media: value.media.filter((item) => item.path !== asset.path) });
    await removeCaddeMedia(asset.path);
  };

  return (
    <div className="space-y-4">
      {paidMode ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Ödemenizi tamamlayarak ilanınızı yayınlayabilirsiniz. İlanınız ödeme onaylanana kadar
          taslak olarak kaydedilir.
        </div>
      ) : null}

      <div className="space-y-2">
        <Label>Kategori *</Label>
        <Select value={value.categoryKey || undefined} onValueChange={(next) => update({ categoryKey: next })}>
          <SelectTrigger><SelectValue placeholder="Kategori seç" /></SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.key} value={category.key}>{category.labelTr}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Başlık *</Label>
        <Input value={value.title} onChange={(event) => update({ title: event.target.value })} maxLength={100} placeholder="Örn. IKEA çalışma masası" />
      </div>

      <div className="space-y-2">
        <Label>Açıklama *</Label>
        <Textarea
          value={value.description}
          onChange={(event) => update({ description: event.target.value })}
          rows={4}
          maxLength={2000}
          placeholder="Durumu, teslim şekli, detaylar…"
        />
      </div>

      <div className="space-y-2">
        <Label>
          Görsel ve video <span className="font-normal text-slate-500">(en fazla {MAX_CARSI_IMAGES} görsel + 1 video)</span>
        </Label>
        <input
          ref={imageInputRef}
          type="file"
          accept={CADDE_IMAGE_MIME_TYPES.join(",")}
          multiple
          hidden
          onChange={(event) => handleFiles(event.target.files)}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept={CADDE_VIDEO_MIME_TYPES.join(",")}
          hidden
          onChange={(event) => handleFiles(event.target.files)}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-2xl"
            onClick={() => imageInputRef.current?.click()}
            disabled={uploading || imageCount >= MAX_CARSI_IMAGES}
          >
            <ImagePlus className="mr-2 h-4 w-4" />
            Fotoğraf ekle
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-2xl"
            onClick={() => videoInputRef.current?.click()}
            disabled={uploading || hasVideo}
          >
            <Video className="mr-2 h-4 w-4" />
            Video ekle
          </Button>
          {uploading ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Yükleniyor…
            </span>
          ) : null}
        </div>
        <CaddeMediaPreviewStrip media={value.media} onRemove={handleRemove} disabled={isSubmitting} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Fiyat <span className="font-normal text-slate-500">(boş = belirtilmedi, 0 = ücretsiz)</span></Label>
          <Input type="number" min={0} value={value.price} onChange={(event) => update({ price: event.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Para birimi</Label>
          <Select value={value.currency} onValueChange={(next) => update({ currency: next })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {["EUR", "USD", "GBP", "TRY"].map((code) => (
                <SelectItem key={code} value={code}>{code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Ülke</Label>
          <Select
            value={value.country || "__none__"}
            onValueChange={(next) => update({ country: next === "__none__" ? "" : next, city: "" })}
          >
            <SelectTrigger><SelectValue placeholder="Global" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Global</SelectItem>
              {countries.map((country) => (
                <SelectItem key={country.id} value={country.name}>{country.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Şehir</Label>
          <Select
            value={value.city || "__none__"}
            onValueChange={(next) => update({ city: next === "__none__" ? "" : next })}
            disabled={!value.country}
          >
            <SelectTrigger><SelectValue placeholder="Tüm şehirler" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Tüm şehirler</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>İletişim tercihi</Label>
          <Select value={value.contactMode} onValueChange={(next) => update({ contactMode: next as CarsiContactMode, contactValue: "" })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(CONTACT_MODE_LABELS) as CarsiContactMode[]).map((mode) => (
                <SelectItem key={mode} value={mode}>{CONTACT_MODE_LABELS[mode]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {value.contactMode !== "platform" ? (
          <div className="space-y-2">
            <Label>{value.contactMode === "phone" ? "Telefon *" : "E-posta *"}</Label>
            <Input
              value={value.contactValue}
              onChange={(event) => update({ contactValue: event.target.value })}
              placeholder={value.contactMode === "phone" ? "+49 170 1234567" : "ad@ornek.com"}
              inputMode={value.contactMode === "phone" ? "tel" : "email"}
            />
          </div>
        ) : null}
      </div>

      <Button className="w-full" onClick={onSubmit} disabled={isSubmitting || uploading}>
        {isSubmitting ? "Yayınlanıyor…" : paidMode ? "Taslak Olarak Kaydet" : "İlanı Yayınla"}
      </Button>
    </div>
  );
};

export default CarsiItemForm;
