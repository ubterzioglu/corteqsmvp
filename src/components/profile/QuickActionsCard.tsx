// M08 · Üye paneli hızlı eylemler kartı (Faz 5).
//
// Yapısal emsal: `AdminQuickActions.tsx` (section + Link grid) — ama profil
// kart diliyle (shadcn Card + GOOGLE_SOFT_CARD stili). ⚠️ `<nav>` ve `<button>`
// KULLANMA: ProfilePage.test.tsx premium yolda "ilk nav boş olmalı" kilidi
// çalıştırıyor (readMenuLabels); Link grid'i bu yüzeylere dokunmaz.
//
// Liste tek kaynaktan: `community-quick-actions.ts` (M12 "Davet et",
// M20 "Tavsiye iste" oraya eklenecek — bu bileşen değişmeden büyür).
import { CalendarPlus, HeartHandshake, Gift, Users, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  COMMUNITY_QUICK_ACTIONS,
  type CommunityQuickActionIcon,
} from "@/lib/community-quick-actions";
import { GOOGLE_SOFT_CARD_BLUE_SECTION } from "./profile-card-styles";

const ICONS: Record<CommunityQuickActionIcon, LucideIcon> = {
  "calendar-plus": CalendarPlus,
  users: Users,
  gift: Gift,
  "message-heart": HeartHandshake,
};

export function QuickActionsCard() {
  return (
    <Card
      data-testid="quick-actions-card"
      className={`overflow-hidden ${GOOGLE_SOFT_CARD_BLUE_SECTION}`}
      aria-label="Hızlı işlemler"
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
          Hızlı işlemler
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2">
          {COMMUNITY_QUICK_ACTIONS.map((action) => {
            const Icon = ICONS[action.icon];
            return (
              <Link
                key={action.id}
                to={action.to}
                data-testid={`quick-action-${action.id}`}
                className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-emerald-300 hover:shadow-sm"
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100">
                  <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
                <span className="min-w-0 text-left">
                  <span className="block text-sm font-semibold text-slate-900">{action.label}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                    {action.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default QuickActionsCard;
