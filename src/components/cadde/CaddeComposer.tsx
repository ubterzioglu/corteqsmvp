// Cadde paylaşım kutusu — tek metin alanı + attachment çipleri (WhatsApp sadeliği).
//
// Workshop m5+m6+m13 (30 Tem): "Detaylar" paneli (tip seçici, başlık, etiketler) ve
// Etkinlik çipi TAMAMEN kaldırıldı — kullanıcıya yalnız tek kutu + Foto/Video/Konum
// kalır; post tipi her zaman 'text'tir. VERİ SÖZLEŞMESİ KORUNUR: CaddeComposerValue
// alanları (type/title/interests) ve caddePostCreateSchema enum'u aynen durur —
// eski postların rozeti bozulmaz, etiketleme sade sürüm oturunca yeniden değerlendirilecek
// (m13 veto/rezervde).
//
// DİKKAT — m13'ün kaldırdığı "Etiketler" AYRI BİR ALANDI (interests). Gövde içi
// "@mention" ve "#hashtag" hiç kaldırılmadı, bugün de çalışıyor; 587595fa revizyonuyla
// metin alanının altındaki ipucu satırı bunu görünür kılar. İkisini karıştırıp ipucunu
// "m13 zaten kaldırmıştı" diyerek silme.

import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, MapPin, Plus, Trash2, Video, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CaddeMediaPreviewStrip } from "@/components/cadde/CaddeMediaGallery";
import CaddeEmojiPickerButton from "@/components/cadde/CaddeEmojiPickerButton";
import CaddeInfoPopover from "@/components/cadde/CaddeInfoPopover";
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

const CAFE_PLACEHOLDER = "Bu odada bir şey paylaş…";

export interface CaddeComposerProps {
  value: CaddeComposerValue;
  onChange: (next: CaddeComposerValue) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  countries?: readonly CaddeCountry[];
  cities?: readonly CaddeCity[];
  /** Hedef boş bırakılınca kullanılacak kayıtlı profil konumu etiketi. */
  defaultLocationLabel?: string;
  onError: (message: string) => void;
  /**
   * m59+m60+m61: kafe içi paylaşım kutusu da aynı composer'dır — medya, emoji ve
   * mention desteği böylece tek yerden gelir. Tek fark konum: kafe postu zaten
   * odaya gider, ülke/şehir hedefi anlamsızdır; "cafe" varyantında konum çipi ve
   * paneli hiç çizilmez.
   */
  variant?: "feed" | "cafe";
}

const CaddeComposer = ({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  countries = [],
  cities = [],
  defaultLocationLabel = "",
  onError,
  variant = "feed",
}: CaddeComposerProps) => {
  const showLocation = variant === "feed";
  const [locationOpen, setLocationOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bodySelection, setBodySelection] = useState<TextSelection>({ start: value.body.length, end: value.body.length });
  const textareaRef = useRef<MentionTextareaHandle>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const countryIdByName = useMemo(() => new Map(countries.map((country) => [country.name, country.id])), [countries]);
  const citiesForCountry = (countryName: string) => {
    const countryId = countryIdByName.get(countryName);
    return countryId ? cities.filter((city) => city.countryId === countryId) : [];
  };
  const primaryCities = citiesForCountry(value.country);
  const extraTargets = value.targets ?? [];

  // m63: async yükleme sırasında en güncel composer değerine erişmek için. `value`
  // closure'da donuyor; yükleme bitince onunla yazmak kullanıcının o sırada yazdığı
  // metni geri alıyordu.
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const update = (patch: Partial<CaddeComposerValue>) => onChange({ ...value, ...patch });
  const updateTarget = (index: number, patch: Partial<(typeof extraTargets)[number]>) => {
    update({
      targets: extraTargets.map((target, targetIndex) =>
        targetIndex === index ? { ...target, ...patch } : target,
      ),
    });
  };

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
        // m63: `value` DEĞİL `valueRef.current` — `value` bu fonksiyon çağrıldığı andaki
        // snapshot'tır. Yükleme sürerken kullanıcı yazmaya devam ederse eski gövde geri
        // yazılıp yazdıkları siliniyordu ("bir anda kayboldu / dondu" şikayeti).
        onChange({ ...valueRef.current, media: current });
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
          placeholder={showLocation ? PLACEHOLDER : CAFE_PLACEHOLDER}
          rows={3}
          maxLength={4000}
          ariaLabel="Paylaşım metni"
          className="resize-none border-0 bg-transparent px-0 text-base shadow-none focus-visible:ring-0"
        />

        {/* Revizyon 587595fa: "@" mention (MentionTextarea + search_cadde_mentions_v1) ve
            "#" hashtag (cadde-text.ts) ÇALIŞIYORDU ama composer'da bunu söyleyen tek
            satır yoktu — özellik keşfedilemez olduğu için yok sayılıyordu. Konum ipucu
            (aşağıda) ile AYNI desen: kısa satır + uzun anlatım balonu.
            Satır her iki varyantta da çizilir: kafe içi paylaşımda da etiketleme çalışır. */}
        <p
          data-testid="cadde-composer-tag-hint"
          className="flex items-start gap-1.5 text-xs leading-relaxed text-slate-500"
        >
          <span className="min-w-0">@ ile üye etiketle, # ile konu etiketi ekle.</span>
          <CaddeInfoPopover
            label="Etiketleme nasıl çalışır?"
            triggerTestId="cadde-composer-tag-info-trigger"
            contentTestId="cadde-composer-tag-info-content"
            triggerClassName="shrink-0 text-orange-600 hover:bg-orange-100 hover:text-orange-800 focus-visible:ring-orange-500"
          >
            <p className="text-xs font-semibold text-slate-900">Etiketleme nasıl çalışır?</p>
            <p className="text-xs leading-relaxed text-slate-600">
              <strong>@</strong> yazıp en az iki harf girince öneri listesi açılır; üyeleri,
              işletmeleri, cafe'leri ve Çarşı ilanlarını etiketleyebilirsin. Seçtiğin ad
              paylaşımda bağlantıya dönüşür.
            </p>
            <p className="text-xs leading-relaxed text-slate-600">
              <strong>#</strong> ile konu etiketi eklersin (ör. #İstanbul). Türkçe harfler
              desteklenir; etikete tıklayan o konunun akışını görür.
            </p>
          </CaddeInfoPopover>
        </p>

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
          {showLocation ? (
            <AttachmentChip
              icon={MapPin}
              label="Konum"
              active={locationOpen || Boolean(value.country)}
              onClick={() => setLocationOpen((open) => !open)}
            />
          ) : null}
          <CaddeEmojiPickerButton onSelect={insertEmoji} disabled={isSubmitting || uploading} />

          {/* m63: yükleme sırasında TÜM ek çipleri ve Paylaş butonu pasifleşiyordu ama
              hiçbir gösterge yoktu — kullanıcı bunu "donma" olarak bildiriyordu. */}
          {uploading ? (
            <span
              data-testid="cadde-composer-uploading"
              role="status"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500"
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              Yükleniyor…
            </span>
          ) : null}

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

        {showLocation && locationOpen ? (
          <div className="space-y-3 rounded-2xl bg-slate-50 p-3">
            {/* m86+m87: konum seçiminin NE İŞE YARADIĞI burada söyleniyor. Kullanıcı
                bunu "nerede yaşıyorum" sanıyordu; oysa paylaşımın hangi ülke akışına
                düşeceğini belirliyor. Satır kısa özet, balon uzun anlatım. */}
            <p
              data-testid="cadde-composer-location-hint"
              className="flex items-start gap-1.5 text-xs leading-relaxed text-slate-600"
            >
              <span className="min-w-0">
                Seçtiğin konum, paylaşımının hangi ülke ve şehir akışında görüneceğini belirler.
              </span>
              <CaddeInfoPopover
                label="Konum seçimi ne işe yarar?"
                triggerTestId="cadde-composer-location-info-trigger"
                contentTestId="cadde-composer-location-info-content"
                triggerClassName="shrink-0 text-orange-600 hover:bg-orange-100 hover:text-orange-800 focus-visible:ring-orange-500"
              >
                <p className="text-xs font-semibold text-slate-900">Konum seçimi ne işe yarar?</p>
                <p className="text-xs leading-relaxed text-slate-600">
                  Paylaşımın, seçtiğin ülkenin (ve şehrin) akışında gösterilir. Boş bırakırsan
                  profilinde kayıtlı konumun kullanılır.
                </p>
                <p className="text-xs leading-relaxed text-slate-600">
                  Global akışa doğrudan paylaşım yapılmaz; paylaşımın oraya etkileşimiyle taşınır.
                </p>
              </CaddeInfoPopover>
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Ülke <span className="font-normal text-slate-500">(boş = {defaultLocationLabel})</span>
                </Label>
                <Select
                  value={value.country || "__profile__"}
                  onValueChange={(next) => update({ country: next === "__profile__" ? "" : next, city: "" })}
                >
                  <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__profile__">Profil konumunu kullan</SelectItem>
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
                    {primaryCities.map((city) => (
                      <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3">
              <p className="text-xs font-medium text-slate-700">Ek hedef</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-full bg-white"
                disabled={extraTargets.length >= 1}
                onClick={() => update({ targets: [...extraTargets, { country: "", city: "" }] })}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                {extraTargets.length >= 1 ? "Premium ile" : "+ Hedef"}
              </Button>
            </div>
            {extraTargets.map((target, index) => {
              const targetCities = citiesForCountry(target.country);
              return (
                <div key={index} className="grid gap-2 rounded-xl border border-slate-200 bg-white p-2 sm:grid-cols-[1fr_1fr_auto]">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Ek hedef ülke {index + 1}</Label>
                    <Select value={target.country || "__none__"} onValueChange={(next) => updateTarget(index, { country: next === "__none__" ? "" : next, city: "" })}>
                      <SelectTrigger><SelectValue placeholder="Ülke seç" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Ülke seç</SelectItem>
                        {countries.map((country) => (
                          <SelectItem key={country.id} value={country.name}>{country.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Ek hedef şehir {index + 1}</Label>
                    <Select value={target.city || "__all__"} onValueChange={(next) => updateTarget(index, { city: next === "__all__" ? "" : next })} disabled={!target.country}>
                      <SelectTrigger><SelectValue placeholder="Tüm şehirler" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Tüm şehirler</SelectItem>
                        {targetCities.map((city) => (
                          <SelectItem key={city.id} value={city.name}>{city.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="self-end text-slate-500 hover:text-red-600"
                    aria-label="Ek hedefi kaldır"
                    onClick={() => update({ targets: extraTargets.filter((_, targetIndex) => targetIndex !== index) })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
            {extraTargets.length > 0 ? (
              <p className="text-xs leading-5 text-slate-500">Birden fazla hedef premium ayarıyla DB tarafında kontrol edilir.</p>
            ) : null}
          </div>
        ) : null}

      </CardContent>
    </Card>
  );
};

interface AttachmentChipProps {
  icon: LucideIcon;
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
