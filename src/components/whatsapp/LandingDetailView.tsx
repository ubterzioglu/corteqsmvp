import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, ExternalLink, Pencil, Share2, ShieldCheck } from "lucide-react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { LandingDetailMetaCards } from "@/components/whatsapp/LandingDetailMetaCards";
import { PlatformLogo } from "@/components/whatsapp/PlatformLogo";
import {
  getLandingHeroImage,
  stripCommunityPrefix,
  waPlaceholderImage,
} from "@/lib/whatsapp-landing-presentation";
import type { WhatsAppLanding } from "@/lib/whatsapp-landings";

interface LandingDetailViewProps {
  loading: boolean;
  landing: WhatsAppLanding | null;
  canEdit: boolean;
  copied: boolean;
  onBackToList: () => void;
  onShare: () => void;
}

export function LandingDetailView({
  loading,
  landing,
  canEdit,
  copied,
  onBackToList,
  onShare,
}: LandingDetailViewProps) {
  const conditionItems = useMemo(
    () =>
      landing?.conditions
        ?.split("\n")
        .map((condition) => condition.trim())
        .filter(Boolean) ?? [],
    [landing],
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto max-w-5xl px-4 pb-16 pt-10">
        {loading ? (
          <div className="rounded-3xl border border-border bg-card p-10 text-center text-muted-foreground">
            Landing yükleniyor...
          </div>
        ) : !landing ? (
          <div className="rounded-3xl border border-border bg-card p-10 text-center">
            <h1 className="text-2xl font-bold text-foreground">Landing sayfası bulunamadı</h1>
            <p className="mt-3 text-muted-foreground">
              Bu slug için yayınlanmış bir grup sayfası yok veya henüz onaylanmamış olabilir.
            </p>
            <Button className="mt-6" variant="outline" onClick={onBackToList}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tüm gruplara dön
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            <Link
              to="/addcom"
              onClick={(event) => {
                event.preventDefault();
                onBackToList();
              }}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/95 px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Tüm gruplar
            </Link>

            {landing.mode === "visual" || landing.heroImage ? (
              <section className="relative overflow-hidden rounded-[2rem] border border-border">
                <img
                  src={getLandingHeroImage(landing)}
                  alt={landing.groupName}
                  className="aspect-video w-full object-cover"
                  onError={(event) => {
                    if (event.currentTarget.src !== waPlaceholderImage) {
                      event.currentTarget.src = waPlaceholderImage;
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/35 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-8">
                  <div className="mb-4 flex items-center gap-4">
                    <div className="shrink-0"><PlatformLogo platform={landing.platform} size="lg" /></div>
                    <h1 className="text-3xl font-black leading-tight md:text-5xl">{landing.groupName}</h1>
                  </div>
                  <p className="mt-3 max-w-2xl text-sm text-slate-100 md:text-lg">{landing.tagline}</p>
                </div>
              </section>
            ) : (
              <section className="rounded-[2rem] border border-border bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_55%,#f8fafc_100%)] p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
                <div className="mb-4 flex items-center gap-4">
                  <div className="shrink-0"><PlatformLogo platform={landing.platform} size="lg" /></div>
                  <h1 className="text-3xl font-black text-foreground md:text-5xl">{landing.groupName}</h1>
                </div>
                <p className="mt-3 max-w-2xl text-base text-muted-foreground md:text-xl">
                  {landing.tagline}
                </p>
              </section>
            )}

            <LandingDetailMetaCards landing={landing} />

            <section className="rounded-[1.75rem] border border-border bg-card p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] md:p-8">
              <h2 className="text-xl font-bold text-foreground">Grubun çağrı metni</h2>
              <p className="mt-4 whitespace-pre-line text-foreground/85">{stripCommunityPrefix(landing.callToActionText)}</p>

              <div className="mt-6 flex flex-col gap-3">
                {canEdit ? (
                  <Button
                    size="lg"
                    asChild
                    variant="outline"
                    className="w-full gap-2 border-[#4285F4] bg-[#4285F4] text-black hover:bg-[#357AE8] hover:text-black"
                  >
                    <Link to={`/addcom/edit/${encodeURIComponent(landing.id)}`}>
                      <Pencil className="h-5 w-5" />
                      Landing'i Düzenle
                    </Link>
                  </Button>
                ) : null}

                <Button size="lg" asChild className="w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700">
                  <a href={landing.whatsappLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-5 w-5" />
                    Platforma git!
                  </a>
                </Button>

                <Button size="lg" className="w-full gap-2 bg-orange-500 text-white hover:bg-orange-600" onClick={onShare}>
                  {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                  {copied ? "Kopyalandı" : "Sayfayı Paylaş"}
                </Button>
              </div>
            </section>

            {conditionItems.length > 0 ? (
              <section className="rounded-[1.75rem] border border-border bg-card p-2 md:p-3">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="group-conditions" className="border-none">
                    <AccordionTrigger className="rounded-[1.25rem] px-4 py-4 text-left text-lg font-bold text-foreground hover:no-underline md:px-5">
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-emerald-600" />
                        Grup koşulları
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-1 md:px-5">
                      <ul className="space-y-2">
                        {conditionItems.map((condition) => (
                          <li key={condition} className="flex items-start gap-2 text-sm text-foreground/85">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                            <span>{condition}</span>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </section>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
