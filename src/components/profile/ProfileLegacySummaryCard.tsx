import { CheckCircle2, ChevronDown, Clock3 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  GOOGLE_SOFT_CARD_BLUE_SECTION,
  GOOGLE_SOFT_CARD_SUBTLE,
  GOOGLE_SOFT_DANGER_PANEL,
  GOOGLE_SOFT_SUCCESS_PANEL,
} from "./profile-card-styles";

export type ProfileCompletionHighlight = {
  key: string;
  label: string;
  complete: boolean;
};

export type ProfileLegacySummaryCardProps = {
  open: boolean;
  onOpenToggle: () => void;
  profileTypeLabel: string;
  completionPercentage: number;
  highlights: ProfileCompletionHighlight[];
};

/** Legacy düzende hero'nun altındaki katlanır "Profil Durumu" özeti. */
export const ProfileLegacySummaryCard = ({
  open,
  onOpenToggle,
  profileTypeLabel,
  completionPercentage,
  highlights,
}: ProfileLegacySummaryCardProps) => {
  return (
    <Card className={`overflow-hidden ${GOOGLE_SOFT_CARD_BLUE_SECTION}`}>
      <CardHeader className="p-0">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-expanded={open}
          aria-controls="profile-summary-content"
          onClick={onOpenToggle}
        >
          <CardTitle className="text-[11px]">Profil Durumu</CardTitle>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
      </CardHeader>
      {open ? (
        <CardContent id="profile-summary-content" className="pt-0 pb-4">
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-6">
            <div className={`flex items-center gap-2 rounded-[20px] px-2.5 py-1.5 text-[11px] ${GOOGLE_SOFT_CARD_SUBTLE}`}>
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Profil Tipi</p>
              <p className="font-bold text-slate-950">{profileTypeLabel}</p>
            </div>
            <div className={`flex items-center gap-2 rounded-[20px] px-2.5 py-1.5 text-[11px] ${GOOGLE_SOFT_CARD_SUBTLE}`}>
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">Profil Skoru</p>
              <p className="font-bold text-slate-950">%{completionPercentage}</p>
            </div>
            {highlights.map((item) => (
              <div
                key={item.key}
                className={`flex items-center gap-1.5 rounded-2xl px-2.5 py-1.5 text-[11px] ${item.complete ? GOOGLE_SOFT_SUCCESS_PANEL : GOOGLE_SOFT_DANGER_PANEL}`}
              >
                <div className="flex items-center gap-1.5">
                  {item.complete ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Clock3 className="h-3.5 w-3.5 text-rose-500" />
                  )}
                  <p className="font-semibold text-slate-900">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
};

export default ProfileLegacySummaryCard;
