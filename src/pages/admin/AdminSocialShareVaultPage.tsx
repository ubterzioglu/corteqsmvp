// Sosyal Medya Paylaşım Deposu — dört içerik paketi tek birleşik listede
// (UnifiedShareList), kaynak filtre çipleriyle daraltılabilir. Her kartın
// başlığında kaynağı gösteren rozet var (Araç Tanıtımları/Diaspora/Test/Burak).
//  • "Araç Tanıtımları": 12 platform aracı (3 Canva promptu + 1 LinkedIn postu).
//    Veri: lib/admin-shell/social-share-vault.ts
//  • "Diaspora Postları": 50 hazır LinkedIn postu (1 Canva promptu), tema rozetli.
//    Veri: lib/admin-shell/social-diaspora-posts.ts
//  • "Test Araçları": 10 click-through test aracı (3 varyant × Canva+LinkedIn).
//    Veri: lib/admin-shell/social-test-tools.ts
//  • "Burak": 12 araç × 3 varyant + medya yükleme.
//    Veri: lib/admin-shell/burak-share-tools.ts + social_share_assets.
// Normalize katmanı: lib/admin-shell/social-share-unified.ts.
// Her metin tek tıkla, ayrıca sayfa başından tüm bölümler toplu kopyalanır.
// Her kalemde LinkedIn/Instagram/Reddit/X/Facebook/Threads paylaşım rozetleri.

import { Check, Linkedin, Palette, Share2 } from "lucide-react";
import { useState } from "react";

import { AdminPageShell } from "@/components/admin/page";
import { UnifiedShareList } from "@/components/admin/social-share/UnifiedShareList";
import { useShareTracking } from "@/components/admin/social-share/useShareTracking";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { SOCIAL_SHARE_TOOLS } from "@/lib/admin-shell/social-share-vault";
import { DIASPORA_POSTS } from "@/lib/admin-shell/social-diaspora-posts";
import { SOCIAL_TEST_TOOLS } from "@/lib/admin-shell/social-test-tools";
import { BURAK_SHARE_TOOLS } from "@/lib/admin-shell/burak-share-tools";

const SEPARATOR = "\n\n———\n\n";

type BulkButton = { id: string; label: string; value: () => string };

const allToolCanva = (): string =>
  SOCIAL_SHARE_TOOLS.map((t) => `${t.order}. ${t.name}\n\n${t.canvaPrompts.join("\n\n")}`).join(
    SEPARATOR,
  );

const allToolLinkedin = (): string =>
  SOCIAL_SHARE_TOOLS.map((t) => `${t.order}. ${t.name}\n\n${t.linkedinPost}`).join(SEPARATOR);

const allDiasporaCanva = (): string =>
  DIASPORA_POSTS.map((p) => `${p.order}. ${p.title}\n\n${p.canvaPrompt}`).join(SEPARATOR);

const allDiasporaLinkedin = (): string =>
  DIASPORA_POSTS.map((p) => `${p.order}. ${p.title}\n\n${p.linkedinPost}`).join(SEPARATOR);

const allTestCanva = (): string =>
  SOCIAL_TEST_TOOLS.map((t) =>
    t.variants
      .map((v, i) => `${t.order}.${i + 1} ${t.name}\n\n${v.canvaPrompt}`)
      .join("\n\n"),
  ).join(SEPARATOR);

const allTestLinkedin = (): string =>
  SOCIAL_TEST_TOOLS.map((t) =>
    t.variants
      .map((v, i) => `${t.order}.${i + 1} ${t.name}\n\n${v.linkedinPost}`)
      .join("\n\n"),
  ).join(SEPARATOR);

const allBurakCanva = (): string =>
  BURAK_SHARE_TOOLS.map((t) =>
    t.variants.map((v, i) => `${t.order}.${i + 1} ${t.name}\n\n${v.canvaPrompt}`).join("\n\n"),
  ).join(SEPARATOR);

const allBurakLinkedin = (): string =>
  BURAK_SHARE_TOOLS.map((t) =>
    t.variants.map((v, i) => `${t.order}.${i + 1} ${t.name}\n\n${v.linkedinPost}`).join("\n\n"),
  ).join(SEPARATOR);

const allPageCanva = (): string =>
  [allToolCanva(), allDiasporaCanva(), allTestCanva(), allBurakCanva()].join(SEPARATOR);

const allPageLinkedin = (): string =>
  [allToolLinkedin(), allDiasporaLinkedin(), allTestLinkedin(), allBurakLinkedin()].join(SEPARATOR);

const PAGE_BULK_BUTTONS: BulkButton[] = [
  { id: "all-page-canva", label: "Tüm Canva Promptları", value: allPageCanva },
  { id: "all-page-linkedin", label: "Tüm LinkedIn Postları", value: allPageLinkedin },
];

const AdminSocialShareVaultPage = () => {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { renderShareBar } = useShareTracking();

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast({ title: "Kopyalandı!" });
      setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 2000);
    } catch (error: unknown) {
      toast({ title: "Kopyalanamadı", variant: "destructive" });
    }
  };

  return (
    <AdminPageShell
      title="Sosyal Medya Paylaşım Deposu"
      description="Hazır Canva görsel promptları ve kopyala-yapıştır Türkçe LinkedIn postları. Soldaki promptu Canva'ya yapıştır (stil: Illustration, metinsiz üret); sağdaki postu LinkedIn'e kopyala. Toplu kopyalama butonları sayfadaki tüm içeriği kopyalar."
      icon={Share2}
      accent="amber"
      contentWidth="wide"
      actions={
        <div className="flex flex-wrap gap-2">
          {PAGE_BULK_BUTTONS.map((btn) => (
            <Button
              key={btn.id}
              variant="outline"
              size="sm"
              onClick={() => handleCopy(btn.value(), btn.id)}
            >
              {copiedId === btn.id ? (
                <Check className="mr-2 h-4 w-4" />
              ) : btn.id.endsWith("linkedin") ? (
                <Linkedin className="mr-2 h-4 w-4" />
              ) : (
                <Palette className="mr-2 h-4 w-4" />
              )}
              {btn.label}
            </Button>
          ))}
        </div>
      }
    >
      <UnifiedShareList copiedId={copiedId} onCopy={handleCopy} renderShareBar={renderShareBar} />
    </AdminPageShell>
  );
};

export default AdminSocialShareVaultPage;
