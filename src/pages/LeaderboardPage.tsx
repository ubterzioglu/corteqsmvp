// M12 · /liderlik — davet liderlik tablosu (plan Faz 3).
//
// ÜCRETSİZ ve HERKESE AÇIK sayfa: RequireFeature YOK (M01 kilidi —
// community-free-features.test.ts denetler), RequireAuth da YOK (liderlik
// büyüme yüzeyi; anon RPC M11'de grant + gövde-auth yokluğuyla kilitli).
// Girişli üyeye InviteCard çizilir; anon listede gezinir, davet için yönlendirme
// görür.
//
// ⚠️ SIZINTI ÜÇLÜSÜ (admin · placeholder · dizinde-görünmez rol) SQL'de
// elenir (M11 — smoke'ta ölçüldü). Bu sayfa RPC'nin döndürdüğünü AYNEN çizer:
// istemci tarafı ek filtre YOK (çift kaynak yarışı — filtre SQL'in işi).
//
// Sitemap: BİLEREK EKLENMEDİ — CLAUDE.md 3 kriterinden "thin content değil"
// bugün sağlanmıyor (davet kaydı 0 iken sayfa boş durum + kural metni; kayıt
// birikince değerlendirilir).
import { useQuery } from "@tanstack/react-query";
import { Medal, Trophy, Users } from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "@/components/auth/useAuth";
import { InviteCard } from "@/components/invites/InviteCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchInviteLeaderboard } from "@/lib/invites-api";
import { resolveInviteBadge } from "@/lib/invites-badges";
import { useSeo } from "@/lib/seo";

export default function LeaderboardPage() {
  const { user } = useAuth();

  useSeo({
    title: "Davet Liderliği | CorteQS",
    description:
      "CorteQS topluluğuna en çok arkadaşını davet eden üyeler. Davet et, liderlik tablosunda yüksel, rozet kazan.",
    canonicalPath: "/liderlik",
  });

  const leaderboardQuery = useQuery({
    queryKey: ["invite-leaderboard"],
    queryFn: () => fetchInviteLeaderboard(),
    staleTime: 60_000,
  });

  const entries = leaderboardQuery.data?.entries ?? [];
  const tiers = leaderboardQuery.data?.badge_tiers ?? [];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <header className="text-center">
        <p className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
          <Trophy className="h-4 w-4" aria-hidden="true" />
          Davet Liderliği
        </p>
        <h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
          Topluluğu en çok büyüten üyeler
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
          Davet ettiğin arkadaşın kayıt olduğunda bir sıra yükselirsin. Bir üye yalnız bir
          kez sayılır. Liste, dizinin görünürlük kurallarıyla aynıdır: yönetici, test ve
          yer tutucu kayıtlar burada görünmez.
        </p>
      </header>

      {user ? (
        <div className="mt-8">
          <InviteCard />
        </div>
      ) : (
        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50/50 px-5 py-4 text-center">
          <p className="text-sm text-slate-700">
            Davet kodunu almak için giriş yap — liderliğe yükselmek iki tık.
          </p>
          <Button asChild size="sm" className="mt-3 bg-emerald-600 text-white hover:bg-emerald-700">
            <Link to="/login">Giriş yap / üye ol</Link>
          </Button>
        </div>
      )}

      <section aria-label="Liderlik tablosu" className="mt-8">
        {leaderboardQuery.isLoading ? (
          <p className="text-center text-sm text-slate-500" role="status">
            Liste yükleniyor...
          </p>
        ) : null}

        {leaderboardQuery.error ? (
          // KR08 dersi: hata GÖRÜNÜR — sessiz boş liste "kimse yok" sanılır.
          <Card className="border-red-200 bg-red-50" data-testid="leaderboard-error">
            <CardContent className="pt-6 text-center">
              <p className="text-sm font-semibold text-red-700">Liderlik tablosu okunamadı.</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => void leaderboardQuery.refetch()}>
                Yeniden dene
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {!leaderboardQuery.isLoading && !leaderboardQuery.error && entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <Users className="mx-auto mb-3 h-10 w-10 text-slate-300" aria-hidden="true" />
            <h2 className="text-base font-semibold text-slate-700">Henüz davet kaydı yok</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              İlk sırayı sen al: davet linkini paylaş, arkadaşın kayıt olsun.
            </p>
          </div>
        ) : null}

        {entries.length > 0 ? (
          <ol className="space-y-2" data-testid="leaderboard-list">
            {entries.map((entry, index) => {
              const badge = resolveInviteBadge(entry.invite_count, tiers);
              return (
                <li key={`${entry.slug}-${index}`}>
                  <Card className="border-slate-200">
                    <CardContent className="flex items-center gap-4 py-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                          index === 0
                            ? "bg-amber-100 text-amber-700"
                            : index < 3
                              ? "bg-slate-100 text-slate-600"
                              : "bg-slate-50 text-slate-400"
                        }`}
                        aria-label={`Sıra ${index + 1}`}
                      >
                        {index === 0 ? <Medal className="h-4.5 w-4.5" aria-hidden="true" /> : index + 1}
                      </span>
                      <div className="min-w-0 flex-1 text-left">
                        <Link
                          to={`/directory/catalog/${encodeURIComponent(entry.slug)}`}
                          className="truncate text-sm font-semibold text-slate-900 hover:underline"
                        >
                          {entry.display_name}
                        </Link>
                        {badge ? (
                          <Badge className="ml-2 border-emerald-600 bg-emerald-500 text-white" data-testid="leaderboard-badge">
                            {badge.label}
                          </Badge>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-sm font-bold tabular-nums text-emerald-700">
                        {entry.invite_count} davet
                      </span>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ol>
        ) : null}
      </section>
    </div>
  );
}
