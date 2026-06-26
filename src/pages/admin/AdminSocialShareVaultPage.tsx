// Sosyal Medya Paylaşım Deposu — üç içerik paketi tek sayfada, sekmeli.
//  • "Araç Tanıtımları": 10 platform aracı (3 Canva promptu + 1 LinkedIn postu).
//    Veri: lib/admin-shell/social-share-vault.ts
//  • "Diaspora Postları": 50 hazır LinkedIn postu (1 Canva promptu), tema filtreli.
//    Veri: lib/admin-shell/social-diaspora-posts.ts
//  • "Test Araçları": 10 click-through test aracı (3 varyant × Canva+LinkedIn).
//    Veri: lib/admin-shell/social-test-tools.ts
// Her metin tek tıkla, ayrıca sayfa başından aktif sekme için toplu kopyalanır.

import { useState } from "react";
import { Check, ClipboardList, Linkedin, Megaphone, Palette, Share2, Users } from "lucide-react";

import { AdminPageShell } from "@/components/admin/page";
import { DiasporaPostsTab } from "@/components/admin/social-share/DiasporaPostsTab";
import { TestToolsTab } from "@/components/admin/social-share/TestToolsTab";
import { ToolPromotionsTab } from "@/components/admin/social-share/ToolPromotionsTab";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { SOCIAL_SHARE_TOOLS } from "@/lib/admin-shell/social-share-vault";
import { DIASPORA_POSTS } from "@/lib/admin-shell/social-diaspora-posts";
import { SOCIAL_TEST_TOOLS } from "@/lib/admin-shell/social-test-tools";

const SEPARATOR = "\n\n———\n\n";

type TabKey = "tools" | "diaspora" | "tests";

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

const BULK_BUTTONS: Record<TabKey, BulkButton[]> = {
  tools: [
    { id: "all-tool-canva", label: "Tüm Canva Promptları", value: allToolCanva },
    { id: "all-tool-linkedin", label: "Tüm LinkedIn Postları", value: allToolLinkedin },
  ],
  diaspora: [
    { id: "all-diaspora-canva", label: "Tüm Canva Promptları", value: allDiasporaCanva },
    { id: "all-diaspora-linkedin", label: "Tüm LinkedIn Postları", value: allDiasporaLinkedin },
  ],
  tests: [
    { id: "all-test-canva", label: "Tüm Canva Promptları", value: allTestCanva },
    { id: "all-test-linkedin", label: "Tüm LinkedIn Postları", value: allTestLinkedin },
  ],
};

const AdminSocialShareVaultPage = () => {
  const { toast } = useToast();
  const [tab, setTab] = useState<TabKey>("tools");
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
      description="Hazır Canva görsel promptları ve kopyala-yapıştır Türkçe LinkedIn postları. Soldaki promptu Canva'ya yapıştır (stil: Illustration, metinsiz üret); sağdaki postu LinkedIn'e kopyala. Toplu kopyalama butonları aktif sekmenin içeriğini kopyalar."
      icon={Share2}
      accent="amber"
      contentWidth="wide"
      actions={
        <div className="flex flex-wrap gap-2">
          {BULK_BUTTONS[tab].map((btn) => (
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
      <Tabs value={tab} onValueChange={(value) => setTab(value as TabKey)}>
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="tools" className="gap-2">
            <Megaphone className="h-4 w-4" />
            Araç Tanıtımları ({SOCIAL_SHARE_TOOLS.length})
          </TabsTrigger>
          <TabsTrigger value="diaspora" className="gap-2">
            <Users className="h-4 w-4" />
            Diaspora Postları ({DIASPORA_POSTS.length})
          </TabsTrigger>
          <TabsTrigger value="tests" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Test Araçları ({SOCIAL_TEST_TOOLS.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tools">
          <ToolPromotionsTab copiedId={copiedId} onCopy={handleCopy} />
        </TabsContent>

        <TabsContent value="diaspora">
          <DiasporaPostsTab copiedId={copiedId} onCopy={handleCopy} />
        </TabsContent>

        <TabsContent value="tests">
          <TestToolsTab copiedId={copiedId} onCopy={handleCopy} />
        </TabsContent>
      </Tabs>
    </AdminPageShell>
  );
};

export default AdminSocialShareVaultPage;
