import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import WhatsAppLandingsModeration from "@/components/admin/WhatsAppLandingsModeration";

export default function AdminWhatsAppLandingsPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-end gap-2">
        <Link to="/admin/whatsapp-landings/guide">
          <Button variant="outline">Topluluk Kullanma Kılavuzu</Button>
        </Link>
        <Link to="/admin/whatsapp-landings/editors">
          <Button variant="outline">Topluluk Editörleri</Button>
        </Link>
      </div>
      <WhatsAppLandingsModeration />
    </div>
  );
}
