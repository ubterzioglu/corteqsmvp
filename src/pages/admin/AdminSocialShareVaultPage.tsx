// Sosyal Medya Paylaşım Deposu — dört içerik paketi tek sayfada, sekmesiz, art arda.
//  • "Araç Tanıtımları": 12 platform aracı (3 Canva promptu + 1 LinkedIn postu).
//    Veri: lib/admin-shell/social-share-vault.ts
//  • "Diaspora Postları": 50 hazır LinkedIn postu (1 Canva promptu), tema filtreli.
//    Veri: lib/admin-shell/social-diaspora-posts.ts
//  • "Test Araçları": 10 click-through test aracı (3 varyant × Canva+LinkedIn).
//    Veri: lib/admin-shell/social-test-tools.ts
//  • "BURAK BURAYA BAK": 12 araç × 3 varyant + medya yükleme.
//    Veri: lib/admin-shell/burak-share-tools.ts + social_share_assets.
// Her metin tek tıkla, ayrıca sayfa başından tüm bölümler toplu kopyalanır.
// Her kalemde LinkedIn/Instagram/Reddit/X/Facebook/Threads paylaşım rozetleri.

import { Camera, Check, ClipboardList, Linkedin, Megaphone, Palette, Share2, Users } from "lucide-react";
import { useState, type ComponentType } from "react";

import { AdminPageShell } from "@/components/admin/page";
import { BurakShareTab } from "@/components/admin/social-share/BurakShareTab";
import { DiasporaPostsTab } from "@/components/admin/social-share/DiasporaPostsTab";
import { TestToolsTab } from "@/components/admin/social-share/TestToolsTab";
import { ToolPromotionsTab } from "@/components/admin/social-share/ToolPromotionsTab";
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

type Section = {
  id: string;
  title: string;
  icon: ComponentType<{ className?: string }>;
  count: number;
};

const SECTIONS: Section[] = [
  { id: "tools", title: "Araç Tanıtımları", icon: Megaphone, count: SOCIAL_SHARE_TOOLS.length },
  { id: "diaspora", title: "Diaspora Postları", icon: Users, count: DIASPORA_POSTS.length },
  { id: "tests", title: "Test Araçları", icon: ClipboardList, count: SOCIAL_TEST_TOOLS.length },
  { id: "burak", title: "BURAK BURAYA BAK", icon: Camera, count: BURAK_SHARE_TOOLS.length },
];

function SectionHeader({ section }: { section: Section }) {
  const Icon = section.icon;
  return (
    <div className="mb-4 flex items-center gap-2 border-b pb-2">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <h2 className="text-lg font-semibold">{section.title}</h2>
      <span className="text-sm text-muted-foreground">({section.count})</span>
    </div>
  );
}

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
      <div className="space-y-10">
        <section>
          <SectionHeader section={SECTIONS[0]} />
          <ToolPromotionsTab copiedId={copiedId} onCopy={handleCopy} renderShareBar={renderShareBar} />
        </section>

        <section>
          <SectionHeader section={SECTIONS[1]} />
          <DiasporaPostsTab copiedId={copiedId} onCopy={handleCopy} renderShareBar={renderShareBar} />
        </section>

        <section>
          <SectionHeader section={SECTIONS[2]} />
          <TestToolsTab copiedId={copiedId} onCopy={handleCopy} renderShareBar={renderShareBar} />
        </section>

        <section>
          <SectionHeader section={SECTIONS[3]} />
          <BurakShareTab copiedId={copiedId} onCopy={handleCopy} renderShareBar={renderShareBar} />
        </section>
      </div>
    </AdminPageShell>
  );
};

export default AdminSocialShareVaultPage;
