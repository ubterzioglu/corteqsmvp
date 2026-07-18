// Sosyal Medya Paylaşım Deposu — dört içerik paketi tek birleşik listede
// (UnifiedShareList), kaynak filtre çipleriyle + kaynağa özel kategori/tema alt
// filtreleriyle daraltılabilir. Her kartın başlığında kaynağı gösteren rozet var
// (Araç Tanıtımları/Diaspora/Test/Burak).
//  • "Araç Tanıtımları": 10 platform aracı (2 ChatGPT görsel promptu + LinkedIn +
//    Instagram + Reddit postu). Veri: lib/admin-shell/social-share-vault.ts
//  • "Diaspora Postları": 50 hazır post (2 ChatGPT görsel promptu + LinkedIn +
//    Instagram + Reddit), tema rozetli. Veri: lib/admin-shell/social-diaspora-posts.ts
//  • "Test Araçları": 10 click-through test aracı (3 varyant × 2 görsel promptu
//    + LinkedIn + Instagram + Reddit). Veri: lib/admin-shell/social-test-tools.ts
//  • "Burak": 12 araç × 3 varyant. Veri: lib/admin-shell/burak-share-tools.ts.
// Tüm 4 kaynakta her varyant altında küçük Görsel/Video ikon-butonları — tıklanınca
// medya yükleme paneli açılır (social_share_assets, ortak burak-share bucket).
// Normalize katmanı: lib/admin-shell/social-share-unified.ts.
// Her metin tek tıkla, ayrıca sayfa başından tüm bölümler toplu kopyalanır.
// Her kalemde LinkedIn/Instagram/Reddit/X/Facebook/Threads paylaşım rozetleri.

import { Check, Instagram, Linkedin, MessageCircle, Palette, Share2 } from "lucide-react";
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

const allToolImagePrompts = (): string =>
  SOCIAL_SHARE_TOOLS.map((t) => `${t.order}. ${t.name}\n\n${t.imagePrompts.join("\n\n")}`).join(
    SEPARATOR,
  );

const allToolLinkedin = (): string =>
  SOCIAL_SHARE_TOOLS.map((t) => `${t.order}. ${t.name}\n\n${t.linkedinPost}`).join(SEPARATOR);

const allToolInstagram = (): string =>
  SOCIAL_SHARE_TOOLS.map((t) => `${t.order}. ${t.name}\n\n${t.instagramPost}`).join(SEPARATOR);

const allToolReddit = (): string =>
  SOCIAL_SHARE_TOOLS.map((t) => `${t.order}. ${t.name}\n\n${t.redditPost}`).join(SEPARATOR);

const allDiasporaImagePrompts = (): string =>
  DIASPORA_POSTS.map((p) => `${p.order}. ${p.title}\n\n${p.imagePrompts.join("\n\n")}`).join(
    SEPARATOR,
  );

const allDiasporaLinkedin = (): string =>
  DIASPORA_POSTS.map((p) => `${p.order}. ${p.title}\n\n${p.linkedinPost}`).join(SEPARATOR);

const allDiasporaInstagram = (): string =>
  DIASPORA_POSTS.map((p) => `${p.order}. ${p.title}\n\n${p.instagramPost}`).join(SEPARATOR);

const allDiasporaReddit = (): string =>
  DIASPORA_POSTS.map((p) => `${p.order}. ${p.title}\n\n${p.redditPost}`).join(SEPARATOR);

const allTestImagePrompts = (): string =>
  SOCIAL_TEST_TOOLS.map((t) =>
    t.variants
      .map((v, i) => `${t.order}.${i + 1} ${t.name}\n\n${v.imagePrompts.join("\n\n")}`)
      .join("\n\n"),
  ).join(SEPARATOR);

const allTestLinkedin = (): string =>
  SOCIAL_TEST_TOOLS.map((t) =>
    t.variants
      .map((v, i) => `${t.order}.${i + 1} ${t.name}\n\n${v.linkedinPost}`)
      .join("\n\n"),
  ).join(SEPARATOR);

const allTestInstagram = (): string =>
  SOCIAL_TEST_TOOLS.map((t) =>
    t.variants
      .map((v, i) => `${t.order}.${i + 1} ${t.name}\n\n${v.instagramPost}`)
      .join("\n\n"),
  ).join(SEPARATOR);

const allTestReddit = (): string =>
  SOCIAL_TEST_TOOLS.map((t) =>
    t.variants
      .map((v, i) => `${t.order}.${i + 1} ${t.name}\n\n${v.redditPost}`)
      .join("\n\n"),
  ).join(SEPARATOR);

const allBurakImagePrompts = (): string =>
  BURAK_SHARE_TOOLS.map((t) =>
    t.variants
      .map((v, i) => `${t.order}.${i + 1} ${t.name}\n\n${v.imagePrompts.join("\n\n")}`)
      .join("\n\n"),
  ).join(SEPARATOR);

const allBurakLinkedin = (): string =>
  BURAK_SHARE_TOOLS.map((t) =>
    t.variants.map((v, i) => `${t.order}.${i + 1} ${t.name}\n\n${v.linkedinPost}`).join("\n\n"),
  ).join(SEPARATOR);

const allBurakInstagram = (): string =>
  BURAK_SHARE_TOOLS.map((t) =>
    t.variants.map((v, i) => `${t.order}.${i + 1} ${t.name}\n\n${v.instagramPost}`).join("\n\n"),
  ).join(SEPARATOR);

const allBurakReddit = (): string =>
  BURAK_SHARE_TOOLS.map((t) =>
    t.variants.map((v, i) => `${t.order}.${i + 1} ${t.name}\n\n${v.redditPost}`).join("\n\n"),
  ).join(SEPARATOR);

const allPageImagePrompts = (): string =>
  [
    allToolImagePrompts(),
    allDiasporaImagePrompts(),
    allTestImagePrompts(),
    allBurakImagePrompts(),
  ].join(SEPARATOR);

const allPageLinkedin = (): string =>
  [allToolLinkedin(), allDiasporaLinkedin(), allTestLinkedin(), allBurakLinkedin()].join(SEPARATOR);

const allPageInstagram = (): string =>
  [allToolInstagram(), allDiasporaInstagram(), allTestInstagram(), allBurakInstagram()].join(
    SEPARATOR,
  );

const allPageReddit = (): string =>
  [allToolReddit(), allDiasporaReddit(), allTestReddit(), allBurakReddit()].join(SEPARATOR);

const PAGE_BULK_BUTTONS: BulkButton[] = [
  { id: "all-page-image-prompts", label: "Tüm Görsel Promptları", value: allPageImagePrompts },
  { id: "all-page-linkedin", label: "Tüm LinkedIn Postları", value: allPageLinkedin },
  { id: "all-page-instagram", label: "Tüm Instagram Postları", value: allPageInstagram },
  { id: "all-page-reddit", label: "Tüm Reddit Postları", value: allPageReddit },
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
      description="Hazır ChatGPT görsel promptları ve kopyala-yapıştır Türkçe LinkedIn/Instagram/Reddit postları. Promptu ChatGPT'ye yapıştır (square 1:1, metinsiz görsel üret); postları ilgili platforma kopyala; Görsel/Video butonlarıyla üretilen medyayı sakla. Toplu kopyalama butonları sayfadaki tüm içeriği kopyalar."
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
              ) : btn.id.endsWith("instagram") ? (
                <Instagram className="mr-2 h-4 w-4" />
              ) : btn.id.endsWith("reddit") ? (
                <MessageCircle className="mr-2 h-4 w-4" />
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
