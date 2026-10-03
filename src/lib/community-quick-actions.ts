// M08 · Topluluk hızlı eylemleri — TEK KAYNAK LİSTE.
//
// Ürün kararı (topluluk motoru planı Faz 5): üye panelinin ilk ekranında
// ücretsiz topluluk işlevlerine kısayol. Liste BAŞLANGIÇTA iki eylem:
//   • Etkinlik oluştur → /events/create
//   • Grup ekle → /addcom
// ⚠️ "Davet et" M12'de, "Tavsiye iste" M20'de EKLENİR — rotası olmayan
// eylem listeye KONMAZ (ölü link dark pattern'dir). Yeni eylem eklerken
// `community-free-features.test.ts` rotaların guard'sız kaldığını zaten
// denetliyor; bu liste bileşen + test tarafından kilitlenir.
//
// İkonlar ANAHTAR olarak taşınır (lib TSX'siz kalır); bileşen lucide eşler.

export type CommunityQuickActionIcon = "calendar-plus" | "users" | "gift" | "message-heart";

export interface CommunityQuickAction {
  id: string;
  label: string;
  description: string;
  to: string;
  icon: CommunityQuickActionIcon;
}

export const COMMUNITY_QUICK_ACTIONS: readonly CommunityQuickAction[] = [
  {
    id: "create-event",
    label: "Etkinlik oluştur",
    description: "İlk etkinliğin onaydan geçer, sonrakiler otomatik yayınlanır.",
    to: "/events/create",
    icon: "calendar-plus",
  },
  {
    id: "add-group",
    label: "Grup ekle",
    description: "WhatsApp/Telegram/Discord grubunu dizine ekle.",
    to: "/addcom",
    icon: "users",
  },
] as const;
