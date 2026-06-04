import { useRef } from "react";
import guideHtml from "@/assets/docs/yetkilendirme-basit-rehberi.html?raw";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const AdminHelpPage = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleIframeLoad = () => {
    if (iframeRef.current?.contentDocument) {
      const height = iframeRef.current.contentDocument.documentElement.scrollHeight;
      iframeRef.current.style.height = `${height}px`;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-[2rem] leading-tight">Yetkilendirme Sistemi — Basit Rehber</CardTitle>
          <CardDescription className="text-[13px] leading-5">
            Roller, yetkiler ve katalog itemları hakkında her şey.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <iframe
            ref={iframeRef}
            srcDoc={guideHtml}
            title="CorteQS Yetkilendirme Sistemi Basit Rehberi"
            className="w-full border-0 rounded-lg"
            style={{ height: "auto", overflowY: "hidden" }}
            onLoad={handleIframeLoad}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminHelpPage;
