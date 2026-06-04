import guideHtml from "@/assets/docs/yetkilendirme-basit-rehberi.html?raw";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const AdminHelpPage = () => {
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
            srcDoc={guideHtml}
            title="CorteQS Yetkilendirme Sistemi Basit Rehberi"
            className="w-full border-0 rounded-lg"
            style={{ minHeight: "600px", height: "100%" }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminHelpPage;
