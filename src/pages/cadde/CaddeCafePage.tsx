// Cadde 3.0 Faz 4 — Cafe detay sayfası (/cadde/cafe/:cafeId, spec §13.4).
// Header (canlı/arşiv durumu, kapsam, tema, kalan süre, üye sayısı) + giriş kutusu
// (open/approval/referral) + cafe-içi composer/feed + sahibi için üye onay paneli.
// Arşivlenen veya süresi biten cafe read-only görünür; enforce DB'dedir (RPC + RLS),
// buradaki guard'lar yalnız UX içindir.

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Archive, Clock3, KeyRound, MapPin, MessageCircle, ShieldQuestion, Users } from "lucide-react";

import { useAuth } from "@/components/auth/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  approveCaddeCafeMember,
  archiveCaddeCafe,
  createCaddePost,
  getCaddeCafe,
  joinCaddeCafe,
  listCaddeCafeFeed,
  listCaddeCafeMembers,
} from "@/lib/cadde-api";
import { caddeQueryKeys } from "@/lib/cadde-query-keys";

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));

const remainingLabel = (endsAt: string): string => {
  const diffMs = new Date(endsAt).getTime() - Date.now();
  if (diffMs <= 0) return "Sona erdi";
  const hours = Math.floor(diffMs / 3_600_000);
  const minutes = Math.floor((diffMs % 3_600_000) / 60_000);
  return hours > 0 ? `${hours} sa ${minutes} dk kaldı` : `${minutes} dk kaldı`;
};

const CaddeCafePage = () => {
  const { cafeId = "" } = useParams<{ cafeId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [postBody, setPostBody] = useState("");
  const [joinAnswer, setJoinAnswer] = useState("");
  const [referralCode, setReferralCode] = useState("");

  const cafeQuery = useQuery({
    queryKey: caddeQueryKeys.cafe(cafeId, user?.id ?? null),
    queryFn: () => getCaddeCafe(cafeId, user?.id ?? null),
    enabled: Boolean(cafeId),
  });
  const cafe = cafeQuery.data ?? null;

  const isOwner = Boolean(user && cafe?.hostUserId === user.id);
  const isArchived = Boolean(cafe?.archivedAt) || cafe?.isActive === false;
  const hasEnded = cafe ? new Date(cafe.endsAt).getTime() <= Date.now() : false;
  const isReadOnly = isArchived || hasEnded;
  const isApprovedMember = cafe?.viewerMemberStatus === "approved";

  const feedQuery = useQuery({
    queryKey: caddeQueryKeys.cafeFeed(cafeId, user?.id ?? null),
    queryFn: () => listCaddeCafeFeed(cafeId, user?.id ?? null),
    enabled: Boolean(cafeId && cafe),
  });

  const membersQuery = useQuery({
    queryKey: caddeQueryKeys.cafeMembers(cafeId),
    queryFn: () => listCaddeCafeMembers(cafeId),
    enabled: Boolean(cafeId && isOwner),
  });

  const invalidateCafe = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: caddeQueryKeys.cafe(cafeId, user?.id ?? null) }),
      queryClient.invalidateQueries({ queryKey: caddeQueryKeys.cafeMembers(cafeId) }),
      queryClient.invalidateQueries({ queryKey: caddeQueryKeys.cafeFeed(cafeId, user?.id ?? null) }),
      queryClient.invalidateQueries({ queryKey: caddeQueryKeys.cafesRoot }),
    ]);
  };

  const joinMutation = useMutation({
    mutationFn: () => joinCaddeCafe({ cafeId, referralCode: referralCode || undefined, answer: joinAnswer || undefined }),
    onSuccess: async (result) => {
      await invalidateCafe();
      toast({ title: result.status === "pending" ? "Katılım talebin sahibe iletildi" : "Cafe'ye katıldın" });
    },
    onError: (error) => {
      toast({ title: "Katılım başarısız", description: error instanceof Error ? error.message : "Bilinmeyen hata", variant: "destructive" });
    },
  });

  const postMutation = useMutation({
    mutationFn: async () => {
      if (!postBody.trim()) throw new Error("Paylaşım metni zorunlu.");
      await createCaddePost({ type: "text", body: postBody, isBridge: false, cafeId });
    },
    onSuccess: async () => {
      setPostBody("");
      await invalidateCafe();
      toast({ title: "Paylaşım cafe'ye eklendi" });
    },
    onError: (error) => {
      toast({ title: "Paylaşım gönderilemedi", description: error instanceof Error ? error.message : "Bilinmeyen hata", variant: "destructive" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ memberId, approve }: { memberId: string; approve: boolean }) => approveCaddeCafeMember(memberId, approve),
    onSuccess: invalidateCafe,
    onError: (error) => {
      toast({ title: "İşlem başarısız", description: error instanceof Error ? error.message : "Bilinmeyen hata", variant: "destructive" });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => archiveCaddeCafe(cafeId),
    onSuccess: async () => {
      await invalidateCafe();
      toast({ title: "Cafe arşivlendi" });
    },
    onError: (error) => {
      toast({ title: "Arşivleme başarısız", description: error instanceof Error ? error.message : "Bilinmeyen hata", variant: "destructive" });
    },
  });

  const pendingMembers = useMemo(
    () => (membersQuery.data ?? []).filter((member) => member.status === "pending"),
    [membersQuery.data],
  );

  if (cafeQuery.isLoading) {
    return <main className="mx-auto max-w-3xl px-4 py-16 text-center text-slate-500">Cafe yükleniyor...</main>;
  }

  if (!cafe) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-slate-600">Cafe bulunamadı veya kaldırılmış.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/cadde">Cadde'ye Dön</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fffdf8_0%,#fff7ec_22%,#f6f8fb_100%)]">
      <section className="mx-auto w-full max-w-3xl space-y-5 px-4 py-8">
        <Card className="border-orange-100 bg-white/95">
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {isReadOnly ? (
                <Badge variant="secondary" className="gap-1"><Archive className="h-3 w-3" /> Arşiv (read-only)</Badge>
              ) : (
                <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">Canlı</Badge>
              )}
              {cafe.isBridge ? <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100">Köprü</Badge> : null}
              {cafe.themeKey ? <Badge variant="outline">{cafe.themeKey}</Badge> : null}
            </div>
            <CardTitle className="text-2xl">{cafe.title}</CardTitle>
            <CardDescription>{cafe.summary}</CardDescription>
            <div className="flex flex-wrap gap-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-orange-500" />{[cafe.country, cafe.city].filter(Boolean).join(" • ") || "Global"}</span>
              <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4 text-orange-500" />{formatDateTime(cafe.startsAt)} → {formatDateTime(cafe.endsAt)} ({remainingLabel(cafe.endsAt)})</span>
              <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4 text-orange-500" />{cafe.memberCount}{cafe.capacity ? `/${cafe.capacity}` : ""} üye • Host: {cafe.hostName}</span>
            </div>
            {isOwner && !isArchived ? (
              <div>
                <Button variant="outline" size="sm" onClick={() => archiveMutation.mutate()} disabled={archiveMutation.isPending}>
                  <Archive className="mr-2 h-4 w-4" />
                  {archiveMutation.isPending ? "Arşivleniyor..." : "Cafe'yi Arşivle"}
                </Button>
              </div>
            ) : null}
          </CardHeader>
        </Card>

        {!isApprovedMember && !isReadOnly ? (
          <Card className="border-slate-200 bg-white/95">
            <CardHeader>
              <CardTitle className="text-base">Cafe'ye Katıl</CardTitle>
              <CardDescription>
                {cafe.viewerMemberStatus === "pending"
                  ? "Katılım talebin cafe sahibinin onayını bekliyor."
                  : cafe.entryMode === "approval"
                    ? "Bu cafe onaylı girişli; soruyu yanıtla, sahibi onaylasın."
                    : cafe.entryMode === "referral"
                      ? "Bu cafe davet kodlu; kodu girerek katıl."
                      : "Bu cafe açık girişli."}
              </CardDescription>
            </CardHeader>
            {cafe.viewerMemberStatus !== "pending" ? (
              <CardContent className="space-y-3">
                {cafe.entryMode === "approval" ? (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5"><ShieldQuestion className="h-4 w-4 text-orange-500" />{cafe.entryQuestion ?? "Giriş sorusu"}</Label>
                    <Textarea value={joinAnswer} onChange={(event) => setJoinAnswer(event.target.value)} rows={2} maxLength={500} placeholder="Yanıtın" />
                  </div>
                ) : null}
                {cafe.entryMode === "referral" ? (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5"><KeyRound className="h-4 w-4 text-orange-500" />Davet kodu</Label>
                    <Input value={referralCode} onChange={(event) => setReferralCode(event.target.value)} placeholder="Kodunu gir" />
                  </div>
                ) : null}
                <Button onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending}>
                  {joinMutation.isPending ? "Gönderiliyor..." : cafe.entryMode === "approval" ? "Katılım Talebi Gönder" : "Katıl"}
                </Button>
              </CardContent>
            ) : null}
          </Card>
        ) : null}

        {isOwner && pendingMembers.length > 0 ? (
          <Card className="border-amber-200 bg-amber-50/60">
            <CardHeader>
              <CardTitle className="text-base">Üye Onay Paneli</CardTitle>
              <CardDescription>{pendingMembers.length} bekleyen katılım talebi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingMembers.map((member) => (
                <div key={member.id} className="rounded-2xl border border-amber-200 bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{member.displayName}</p>
                      {member.answer ? <p className="mt-1 text-sm text-slate-600">"{member.answer}"</p> : null}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => approveMutation.mutate({ memberId: member.id, approve: true })} disabled={approveMutation.isPending}>Onayla</Button>
                      <Button size="sm" variant="outline" onClick={() => approveMutation.mutate({ memberId: member.id, approve: false })} disabled={approveMutation.isPending}>Reddet</Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <Card className="border-slate-200 bg-white/95">
          <CardHeader>
            <CardTitle className="text-base">Cafe Akışı</CardTitle>
            <CardDescription>
              {isReadOnly
                ? "Bu cafe kapandı; akış read-only arşiv olarak görünür."
                : isApprovedMember
                  ? "Bu odadaki paylaşımlar yalnız cafe akışında görünür."
                  : "Paylaşım yapabilmek için cafe'ye katıl."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isReadOnly && isApprovedMember ? (
              <div className="space-y-2">
                <Textarea value={postBody} onChange={(event) => setPostBody(event.target.value)} placeholder="Cafe'de paylaş..." rows={3} />
                <div className="flex justify-end">
                  <Button onClick={() => postMutation.mutate()} disabled={postMutation.isPending}>
                    {postMutation.isPending ? "Gönderiliyor..." : "Paylaş"}
                  </Button>
                </div>
                <Separator />
              </div>
            ) : null}

            {(feedQuery.data ?? []).map((post) => (
              <div key={post.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">{post.authorName}</p>
                  <span className="text-xs text-slate-500">{formatDateTime(post.createdAt)}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{post.body}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-slate-500">
                  <MessageCircle className="h-3.5 w-3.5" />
                  {post.commentCount} yorum
                </div>
              </div>
            ))}

            {!feedQuery.isLoading && (feedQuery.data ?? []).length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">Bu cafe'de henüz paylaşım yok.</p>
            ) : null}
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button asChild variant="outline">
            <Link to="/cadde">← Cadde'ye Dön</Link>
          </Button>
        </div>
      </section>
    </main>
  );
};

export default CaddeCafePage;
