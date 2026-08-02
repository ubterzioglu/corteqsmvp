// Cadde paylaşım kutusu — tek metin alanı + attachment çipleri (WhatsApp sadeliği).
//
// Workshop m5+m6+m13 (30 Tem): "Detaylar" paneli (tip seçici, başlık, etiketler) ve
// Etkinlik çipi TAMAMEN kaldırıldı — kullanıcıya yalnız tek kutu + Foto/Video/Konum
// kalır; post tipi her zaman 'text'tir. VERİ SÖZLEŞMESİ KORUNUR: CaddeComposerValue
// alanları (type/title/interests) ve caddePostCreateSchema enum'u aynen durur —
// eski postların rozeti bozulmaz, etiketleme sade sürüm oturunca yeniden değerlendirilecek
// (m13 veto/rezervde).

import { useRef, useState } from "react";
import { ImagePlus, Loader2, MapPin, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CaddeMediaPreviewStrip } from "@/components/cadde/CaddeMediaGallery";
import CaddeEmojiPickerButton from "@/components/cadde/CaddeEmojiPickerButton";
import MentionTextarea, { type MentionTextareaHandle } from "@/components/cadde/MentionTextarea";
import {
  CADDE_IMAGE_MIME_TYPES,
  CADDE_VIDEO_MIME_TYPES,
  removeCaddeMedia,
  uploadCaddeMedia,
  validateCaddeMediaFile,
} from "@/lib/cadde-media";
import type { CaddeComposerValue } from "@/lib/cadde-composer";
import { insertTextAtSelection, type TextSelection } from "@/lib/cadde-text-insert";
import type { CaddeCity, CaddeCountry, CaddeMediaAsset } from "@/lib/cadde-types";

const PLACEHOLDER = "Ne düşünüyorsun? Şehrindeki bir haberi, deneyimini veya sorunu paylaş…";

export interface CaddeComposerProps {
  value: CaddeComposerValue;
  onChange: (next: CaddeComposerValue) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  countries: readonly CaddeCountry[];
  cities: readonly CaddeCity[];
  /** Hedef boş bırakılınca kullanılacak aktif filtre etiketi ("Global" olabilir). */
  filterCountryLabel: string;
  onError: (message: string) => void;
}

const CaddeComposer = ({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  countries,
  cities,
  filterCountryLabel,
  onError,
}: CaddeComposerProps) => {
  const [locationOpen, setLocationOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bodySelection, setBodySelection] = useState<TextSelection>({ start: value.body.length, end: value.body.length });
  const textareaRef = useRef<MentionTextareaHandle>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const update = (patch: Partial<CaddeComposerValue>) => onChange({ ...value, ...patch });

  const insertEmoji = (emoji: string) => {
    const next = insertTextAtSelection(value.body, emoji, bodySelection);
    update({ body: next.value });
    setBodySelection({ start: next.caret, end: next.caret });
    requestAnimationFrame(() => textareaRef.current?.focusAt(next.caret));
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      // Sıralı yükleme: limit kontrolü her adımda o ana kadarki listeye bakmalı.
      let current = value.media;
      for (const file of Array.from(files)) {
        const problem = validateCaddeMediaFile(file, current);
        if (problem) {
          onError(problem);
          continue;
        }
        const asset = await uploadCaddeMedia(file, "post");
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

  const canSubmit = (value.body.trim().length > 0 || value.media.length > 0) && !isSubmitting && !uploading;

  return (
    <Card id="cadde-composer" className="scroll-mt-24 border-slate-200 bg-white/95">
      <CardContent className="space-y-3 p-4 sm:p-5">
        <MentionTextarea
          ref={textareaRef}
          value={value.body}
          onChange={(body) => update({ body })}
          onSelectionChange={setBodySelection}
          onMentionAdd={(mention) =>
            // Aynı hedef iki kez eklenmesin; gövdede iki kez geçse de tek kayıt yeter.
            update({
              mentions: value.mentions.some((item) => item.type === mention.type && item.id === mention.id)
                ? value.mentions
                : [...value.mentions, mention],
            })
          }
          placeholder={PLACEHOLDER}
          rows={3}
          maxLength={4000}
          ariaLabel="Paylaşım metni"
          className="resize-none border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
        />

        <CaddeMediaPreviewStrip media={value.media} onRemove={handleRemove} disabled={isSubmitting} />

        {/* Ek şeridi — tıklanınca ilgili giriş açılır; tip bundan türer. */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
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

          <AttachmentChip icon={ImagePlus} label="Fotoğraf" onClick={() => imageInputRef.current?.click()} disabled={uploading} />
          <AttachmentChip icon={Video} label="Video" onClick={() => videoInputRef.current?.click()} disabled={uploading} />
          <AttachmentChip
            icon={MapPin}
            label="Konum"
            active={locationOpen || Boolean(value.country)}
            onClick={() => setLocationOpen((open) => !open)}
          />
          <CaddeEmojiPickerButton onSelect={insertEmoji} disabled={isSubmitting || uploading} />

          <div className="ml-auto flex items-center gap-2">
            <Button onClick={onSubmit} disabled={!canSubmit} className="rounded-full px-5">
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Yükleniyor
                </>
              ) : isSubmitting ? (
                "Gönderiliyor…"
              ) : (
                "Paylaş"
              )}
            </Button>
          </div>
        </div>

        {locationOpen ? (
          <div className="grid gap-3 rounded-2xl bg-slate-50 p-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">
                Ülke <span className="font-normal text-slate-500">(boş = {filterCountryLabel})</span>
              </Label>
              <Select
                value={value.country || "__filter__"}
                onValueChange={(next) => update({ country: next === "__filter__" ? "" : next, city: "" })}
              >
                <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__filter__">Filtreyi kullan</SelectItem>
                  {countries.map((country) => (
                    <SelectItem key={country.id} value={country.name}>{country.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Şehir</Label>
              <Select
                value={value.city || "__all__"}
                onValueChange={(next) => update({ city: next === "__all__" ? "" : next })}
                disabled={!value.country}
              >
                <SelectTrigger className="bg-white"><SelectValue placeholder="Tüm şehirler" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Tüm şehirler</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : null}

      </CardContent>
    </Card>
  );
};

interface AttachmentChipProps {
  icon: typeof ImagePlus;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}

const AttachmentChip = ({ icon: Icon, label, onClick, active, disabled }: AttachmentChipProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-pressed={active}
    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
      active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`}
  >
    <Icon className="h-4 w-4" aria-hidden />
    {label}
  </button>
);

export default CaddeComposer;
