// Cadde akis kolonu — /cadde sayfasinin sol (ana) sutunu.
//
// A06b'de `CaddePage.tsx`'ten AYRILDI (o dosya 1314 satirdi). JSX govdesi
// BIREBIR tasindi; tek bir satiri yeniden yazilmadi — davranis degisikligi yok,
// `CaddePage.test.tsx`'teki 74 testin tamami degistirilmeden gecmelidir.
//
// ⚠️ Prop'lar TEK TEK degil GRUPLU gecilir. Olcum (A06a): bu bolum cevresindeki
// kapsamdan 50 ayri ad kullaniyordu; hepsini prop yapmak 655 satirlik satir ici
// bolumden daha kotu bir arayuz uretirdi. Bunun yerine sayfanin dort hook'unun
// SONUC NESNELERI oldugu gibi gecilir ve burada parcalanir.
//
// `session`/`user`, `navigate`, `toast` ve `queryClient` prop DEGILDIR: hepsi
// baglam hook'larindan gelir, yani ayni orneklerdir.
import { useQueryClient } from "@tanstack/react-query";
import { Flag, HelpCircle, Megaphone, MessageCircle, RefreshCw, Send, Share2, Sparkles, ThumbsUp } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "@/components/auth/useAuth";
import CaddeBadge from "@/components/cadde/CaddeBadge";
import CaddeComposer from "@/components/cadde/CaddeComposer";
import CaddeEmojiPickerButton from "@/components/cadde/CaddeEmojiPickerButton";
import CaddeFeedScopeBar from "@/components/cadde/CaddeFeedScopeBar";
import { CaddeLoadErrorCard } from "@/components/cadde/CaddeLoadErrorCard";
import CaddeMediaGallery from "@/components/cadde/CaddeMediaGallery";
import CaddePostBody from "@/components/cadde/CaddePostBody";
import CaddePostMenu from "@/components/cadde/CaddePostMenu";
import NotificationsBell from "@/components/cadde/NotificationsBell";
import SponsoredFeedCard from "@/components/cadde/SponsoredFeedCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import type { useCaddeComposerState } from "@/hooks/cadde/useCaddeComposerState";
import type { useCaddeFeedState } from "@/hooks/cadde/useCaddeFeedState";
import type { useCaddeLayoutState } from "@/hooks/cadde/useCaddeLayoutState";
import type { useCaddePageData } from "@/hooks/cadde/useCaddePageData";
import { CADDE_REACTION_CLOSE_DELAY_MS } from "@/hooks/cadde/useCaddePostEngagement";
import type { useCaddePostEngagement } from "@/hooks/cadde/useCaddePostEngagement";
import { describeCaddeWidenCount } from "@/lib/cadde-feed-widen";
import { serializeCaddeFilters } from "@/lib/cadde-format";
import type { CaddeFilterState, CaddeReactionType } from "@/lib/cadde-types";
import { caddeQueryKeys } from "@/lib/cadde-query-keys";


const REACTION_META: Array<{ key: CaddeReactionType; label: string; icon: typeof ThumbsUp }> = [
  { key: "like", label: "Beğendim", icon: ThumbsUp },
  { key: "support", label: "Destek", icon: Sparkles },
  { key: "unsure", label: "Soru", icon: HelpCircle },
];

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));


export type CaddeFeedViewProps = {
  composerState: ReturnType<typeof useCaddeComposerState>;
  engagement: ReturnType<typeof useCaddePostEngagement>;
  feedState: ReturnType<typeof useCaddeFeedState>;
  layout: ReturnType<typeof useCaddeLayoutState>;
  filters: CaddeFilterState;
  updateFilters: (nextPartial: Partial<CaddeFilterState>) => void;
  scrollToComposer: () => void;
  feedQuery: ReturnType<typeof useCaddePageData>["feedQuery"];
  countriesQuery: ReturnType<typeof useCaddePageData>["countriesQuery"];
  allCitiesQuery: ReturnType<typeof useCaddePageData>["allCitiesQuery"];
  hasNewPosts: boolean;
  resetNewPosts: () => void;
  setSearchParams: (next: URLSearchParams | string) => void;
};

export const CaddeFeedView = ({
  composerState, engagement, feedState, layout, filters, updateFilters,
  scrollToComposer, feedQuery, countriesQuery, allCitiesQuery, hasNewPosts,
  resetNewPosts, setSearchParams,
}: CaddeFeedViewProps) => {
  const { session, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { composer, defaultComposerLocationLabel, postMutation, setComposer } = composerState;
  const {
    commentDrafts, commentMutation, commentTextareaRef, commentsQuery, expandedComments,
    expandedCommentPostId, insertCommentEmoji, openReactionsPostId, reactionCloseTimerRef,
    reactionMutation, reactionOpenedByHoverRef, reactionPointerDownRef, reportMutation,
    setCommentDrafts, setExpandedCommentPostId, setOpenReactionsPostId, shareMutation,
    syncCommentSelection,
  } = engagement;
  const {
    canWiden, feedItems, feedWithSponsor, newPostCount, newestLoadedAt, widenedCount,
    widenedPage, widenTarget,
  } = feedState;
  const {
    cafeLocationLabel, clockTarget, hasGeoSelection, interestLabelByKey, isColdStart,
    sparseContentHint,
  } = layout;

  return (
        <section className="order-1 space-y-5 lg:order-none">

          {session ? (
            <CaddeComposer
              value={composer}
              onChange={setComposer}
              onSubmit={() => postMutation.mutate()}
              isSubmitting={postMutation.isPending}
              countries={countriesQuery.data ?? []}
              cities={allCitiesQuery.data ?? []}
              defaultLocationLabel={defaultComposerLocationLabel}
              onError={(message) => toast({ title: "Ek eklenemedi", description: message, variant: "destructive" })}
            />
          ) : (
            <Card id="cadde-composer" className="scroll-mt-24 border-slate-200 bg-white/95">
              <CardContent className="p-5">
                <div className="rounded-lg border border-dashed border-orange-200 bg-orange-50 p-5">
                  <p className="text-sm leading-relaxed text-slate-700">
                    Ziyaretçiler akışı görebilir. Paylaşım, yorum ve reaksiyon için{" "}
                    <Link to="/login" className="font-semibold text-orange-700 underline">giriş yap</Link>.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Y1: zil kimlik şeridinden buraya taşındı — sayfadaki tek işlevsel öge oydu,
              şeridin geri kalanı kopya ve dekordu. Slot isteğe bağlı, o yüzden aynı
              bileşeni kullanan /cadde/cafe ve /cadde/carsi etkilenmez. */}
          <CaddeFeedScopeBar
            scope={filters.scope}
            hashtag={filters.hashtag}
            clockTarget={clockTarget}
            notificationsSlot={<NotificationsBell />}
            onScopeChange={(scope) => updateFilters({ scope })}
            onClearHashtag={() => updateFilters({ hashtag: "" })}
          />

          <div className="space-y-4">
            {newPostCount > 0 ? (
              <div className="flex justify-center">
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-full shadow"
                  onClick={async () => {
                    // m16: chip tıklamayla ANINDA söner — eski taban anahtarındaki sayaç
                    // sıfırlanır; feed yenilenince taban (max createdAt) ilerler ve yeni
                    // queryKey temiz sayımla başlar. Eski anahtarı yeniden fetch etmek
                    // bayat pozitif sayıyı geri getiriyordu — kaldırıldı.
                    queryClient.setQueryData(["cadde", "new-posts-since", newestLoadedAt], 0);
                    await queryClient.invalidateQueries({ queryKey: caddeQueryKeys.feedRoot });
                  }}
                >
                  {newPostCount} yeni paylaşım — yenile
                </Button>
              </div>
            ) : null}

            {feedWithSponsor.map((item, itemIndex) =>
              item.kind === "promotion" ? (
                <SponsoredFeedCard key={`promo-${item.promotion.campaignId}-${itemIndex}`} promotion={item.promotion} />
              ) : item.kind === "sponsor" ? (
                <Card key={item.sponsor.id} className="cadde-sponsored">
                  <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                      {/* "Sponsorlu" bir KİMLİK etiketi — kartın ne olduğunu söyler,
                          değişen bir hâl değil. Turuncu dolgu onu akıştaki en ağır
                          rozet yapıyordu; reklam içeriğinin en yüksek görsel ağırlığa
                          sahip olması yanlış sinyaldi. */}
                      <CaddeBadge tone="kimlik">{item.sponsor.badgeText ?? "Sponsorlu"}</CaddeBadge>
                      <h3 className="text-lg font-semibold text-slate-900">{item.sponsor.title}</h3>
                      <p className="text-sm text-slate-700">{item.sponsor.description}</p>
                    </div>
                    <Button asChild variant="outline" className="cadde-secondary-action rounded-lg">
                      <Link to={item.sponsor.ctaUrl}>{item.sponsor.ctaLabel}</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (() => {
                const isCommentsExpanded = expandedCommentPostId === item.post.id;
                const visibleComments = isCommentsExpanded ? expandedComments : [];
                const shareCount = item.post.shareCount ?? 0;

                return (
                <Card
                  key={item.post.id}
                  data-testid="cadde-feed-card"
                  className="cadde-card cadde-card--cadde overflow-hidden rounded-lg"
                >
                  <CardContent className="space-y-4 p-5 sm:p-6">
                    {/* m18 forum hiyerarşisi: konu (varsa) büyük ve EN ÜSTTE, yazar küçük,
                        altında ülke•şehir•tarih. m17: tip rozeti ("soru"/"ilan") kaldırıldı. */}
                    <div className="space-y-1">
                      {item.post.title ? (
                        <h3 className="text-lg font-semibold leading-snug text-slate-950">{item.post.title}</h3>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-slate-700">{item.post.authorName}</p>
                        {/* Rol = KİMLİK (kim yazdı), Sabit = DURUM (değişen hâl),
                            Köprü = KATEGORİ (gönderinin türü). Eskiden üçü de farklı
                            ağırlıktaydı ve "Sabit" en ağır stildeyken en az bilgi taşıyordu. */}
                        {item.post.authorRole ? <CaddeBadge tone="kimlik">{item.post.authorRole}</CaddeBadge> : null}
                        {item.post.pinned ? <CaddeBadge tone="durum" intent="neutral">Sabit</CaddeBadge> : null}
                        {item.post.isBridge ? <CaddeBadge tone="kategori">Köprü</CaddeBadge> : null}
                      </div>
                      <p className="text-xs text-slate-500">
                        {[item.post.country, item.post.city].filter(Boolean).join(" • ") || "Global"} • {formatDateTime(item.post.createdAt)}
                      </p>
                    </div>

                    <CaddePostBody body={item.post.body} mentions={item.post.mentions} />

                    <CaddeMediaGallery media={item.post.media} contextLabel={item.post.authorName} />

                    {/* Küratörlü etiketler (ranking'i besler) ve serbest hashtag'ler ayrı görünür:
                        ilki rozet, ikincisi tıklanabilir mavi link. */}
                    {item.post.interests.length > 0 || item.post.hashtags.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {item.post.interests.map((key) => (
                          <CaddeBadge key={key} tone="kategori" className="text-xs">
                            {interestLabelByKey.get(key) ?? key}
                          </CaddeBadge>
                        ))}
                        {item.post.hashtags.map((hashtag) => (
                          <Link
                            key={hashtag.tag}
                            to={`/cadde?etiket=${encodeURIComponent(hashtag.tag)}`}
                            className="text-xs font-medium text-sky-700 hover:underline"
                          >
                            #{hashtag.displayTag}
                          </Link>
                        ))}
                      </div>
                    ) : null}

                    {/* 05.08.2026 kullanıcı kararı: eylem şeridi SEMBOL + SAYI'ya indi,
                        etiketler hover'daki ipucuna taşındı. Yedi buton yan yana metinli
                        durunca şerit iki satıra taşıyor ve paylaşımın kendisiyle görsel
                        olarak yarışıyordu.

                        Metin GÖRÜNMEZ oldu, ERİŞİLEBİLİR olmaya devam ediyor: her butonda
                        `aria-label` var (ekran okuyucu ve testler onu okur), ipucu yalnız
                        görsel katman.

                        DİKKAT — erişilebilir adlar bilerek AYNEN korundu, "düzeltilmedi":
                        tepki ve paylaş butonlarında zaten aria-label vardı ("Beğendim (1)",
                        "Paylaş (0)"). Yorum butonunda YOKTU, adı görünür metninden
                        geliyordu; metin kalkınca adsız kalmasın diye eklendi ve eski metnin
                        birebir aynısı yazıldı ("3 yorum" / "Yorum yaz"). Daha düzenli
                        görünen "Yorumlar (3)" biçimi denendi ve GERİ ALINDI — bu adı
                        değiştirmek hem ekran okuyucu davranışını hem de ona bağlı testi
                        sessizce değiştiriyor. Buradaki adları değiştirmek istersen testleri
                        de birlikte güncelle.

                        TooltipProvider bilinçli olarak BURADA, sayfanın içinde. App.tsx
                        kökte zaten bir tane sağlıyor ama CaddePage testlerde doğrudan
                        (App olmadan) render ediliyor — provider'sız Radix Tooltip hata
                        fırlatır. İç içe provider zararsızdır ve DOM'a düğüm basmaz. */}
                    <TooltipProvider delayDuration={200}>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* 05.09.2026 revizyon 55a55bdf ("Like destek vs pop over hoover olsun"):
                          beş tepki butonu artık HER ZAMAN yan yana durmuyor — tek bir "Beğen"
                          tetiğinin arkasında, üzerine gelince / odaklanınca / tıklanınca açılan
                          bir kartta toplanıyor. Tepki verme davranışı ve sayaçlar (optimistic
                          `applyReactionToFeedPages`) AYNEN korundu; değişen yalnız görünürlük.

                          NEDEN `src/components/ui/hover-card.tsx` (Radix HoverCard) KULLANILMADI —
                          bu bilinçli bir ret, eksik değil; geri çevirmeden önce oku:
                          1) Radix HoverCard'ın içerik bileşeni HER render'da içindeki tüm
                             odaklanabilir düğümlere `tabindex="-1"` yazar
                             (`node_modules/@radix-ui/react-hover-card/dist/index.mjs` →
                             `getTabbableNodes(...).forEach(n => n.setAttribute("tabindex","-1"))`).
                             Beş tepki BUTONU oraya konsaydı klavyeyle hiç ulaşılamazdı —
                             WCAG 2.1.1 ihlali. Radix'in kendi dokümanı da HoverCard'ı
                             "etkileşimli olmayan önizleme" için tanımlar.
                          2) Aynı bileşenin Trigger'ı `onTouchStart` üzerinde `preventDefault()`
                             çağırır; dokunmatikte tıklama fallback'i de güvenilmez olurdu.
                          Bu yüzden kart burada SATIR İÇİ (portalsız) bir disclosure olarak
                          yazıldı: DOM sırası = sekme sırası, butonlar tabIndex'ini korur.

                          Açma yolları: (1) fare ile üzerine gelme — `pointerType === "mouse"`
                          ile sınırlı, çünkü dokunmatikte tap ÖNCE mouseenter üretir ve hemen
                          ardından gelen click paneli kapatıp dokunmatiği tamamen kırardı;
                          (2) klavye odağı; (3) tıklama — dokunmatiğin tek yolu.
                          Kapanma: fare ayrılması, Esc, tetiğe yeniden tıklama, başka bir
                          postun kartını açma.

                          `reactionOpenedByHoverRef` ne işe yarar: masaüstünde sıra
                          pointerenter (panel AÇILIR) → pointerdown → click. Click düz bir
                          toggle olsaydı fareyle tetiğe tıklayan kullanıcı paneli kendi
                          açtığı anda kapatırdı. Bu yüzden fareyle açılmış paneldeki İLK
                          tıklama yutulur; ikinci tıklama normal toggle'dır. Dokunmatikte
                          hover hiç olmadığı için bayrak kapalıdır ve ilk tap paneli açar. */}
                      {(() => {
                        const isReactionsOpen = openReactionsPostId === item.post.id;
                        const viewerReaction =
                          REACTION_META.find((reaction) => item.post.viewerReactions.includes(reaction.key)) ?? null;
                        const TriggerIcon = viewerReaction?.icon ?? ThumbsUp;
                        const totalReactions = item.post.totalReactionCount ?? 0;
                        const reactionsPanelId = `cadde-reactions-${item.post.id}`;
                        const cancelScheduledClose = () => {
                          if (reactionCloseTimerRef.current === null) return;
                          window.clearTimeout(reactionCloseTimerRef.current);
                          reactionCloseTimerRef.current = null;
                        };
                        const forgetThisPost = () =>
                          setOpenReactionsPostId((current) => (current === item.post.id ? null : current));
                        const openReactions = () => {
                          cancelScheduledClose();
                          setOpenReactionsPostId(item.post.id);
                        };
                        const closeReactions = () => {
                          cancelScheduledClose();
                          forgetThisPost();
                        };
                        // Fare ayrılışı GECİKMELİ kapatır (bkz. CADDE_REACTION_CLOSE_DELAY_MS);
                        // karta girmek bekleyen kapanışı iptal eder.
                        const scheduleReactionsClose = () => {
                          cancelScheduledClose();
                          reactionCloseTimerRef.current = window.setTimeout(() => {
                            reactionCloseTimerRef.current = null;
                            forgetThisPost();
                          }, CADDE_REACTION_CLOSE_DELAY_MS);
                        };

                        return (
                          <div
                            className="relative"
                            onPointerEnter={(event) => {
                              if (event.pointerType !== "mouse") return;
                              reactionOpenedByHoverRef.current = !isReactionsOpen;
                              openReactions();
                            }}
                            onPointerLeave={(event) => {
                              if (event.pointerType !== "mouse") return;
                              reactionOpenedByHoverRef.current = false;
                              scheduleReactionsClose();
                            }}
                            onKeyDown={(event) => {
                              if (event.key !== "Escape" || !isReactionsOpen) return;
                              event.stopPropagation();
                              closeReactions();
                            }}
                          >
                            <Button
                              type="button"
                              data-testid="cadde-reaction-trigger"
                              variant={viewerReaction ? "default" : "outline"}
                              size="sm"
                              aria-label={`Beğen (${totalReactions})`}
                              aria-expanded={isReactionsOpen}
                              aria-controls={reactionsPanelId}
                              onPointerDown={() => {
                                reactionPointerDownRef.current = true;
                              }}
                              onFocus={() => {
                                // İşaretçi kaynaklı odak paneli AÇMAZ. Sıra pointerdown →
                                // focus → click olduğu için odak açsaydı hemen ardından gelen
                                // click onu kapatır, dokunmatikte panel hiç açılamazdı.
                                if (reactionPointerDownRef.current) {
                                  reactionPointerDownRef.current = false;
                                  return;
                                }
                                openReactions();
                              }}
                              onClick={() => {
                                reactionPointerDownRef.current = false;
                                // Fareyle zaten açılmış paneli ilk tıklama kapatmaz.
                                // (Bekleyen kapanış varsa iptal edilir; yoksa tıklama
                                // sonrası zamanlayıcı paneli arkadan kapatırdı.)
                                if (reactionOpenedByHoverRef.current) {
                                  reactionOpenedByHoverRef.current = false;
                                  cancelScheduledClose();
                                  return;
                                }
                                if (isReactionsOpen) closeReactions();
                                else openReactions();
                              }}
                              className={`min-h-10 rounded-full px-3 ${
                                viewerReaction ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-white/80"
                              }`}
                            >
                              {/* "fill-current" (Kalp'e özel dolgu efekti) K1 ile
                                  kaldırıldı — hiçbir hayatta kalan tepkinin dolgulu
                                  görünmesi gerekmiyor. */}
                              <TriggerIcon className="h-4 w-4" />
                              {/* H1 (m155): sıfır sayaç GÖRSEL olarak gizlenir — boş bir
                                  akışta her kartta bağıran "0" kalkar. Yukarıdaki
                                  aria-label AYNEN duruyor: ekran okuyucu sayıyı okumaya
                                  devam eder, bilgi kaybı yok. */}
                              {totalReactions > 0 ? (
                                <span
                                  className={`ml-1.5 text-xs ${viewerReaction ? "text-white/80" : "text-muted-foreground"}`}
                                >
                                  {totalReactions}
                                </span>
                              ) : null}
                            </Button>

                            {isReactionsOpen ? (
                              // Dış sarmalayıcının `pb-2`'si tetikle kart arasındaki boşluğu
                              // KENDİ kutusuyla kapatır: fare geçerken pointerleave tetiklenmez.
                              <div className="absolute bottom-full left-0 z-30 pb-2">
                                <div
                                  id={reactionsPanelId}
                                  data-testid="cadde-reaction-panel"
                                  role="group"
                                  aria-label="Tepkini seç"
                                  className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-lg"
                                >
                                  {REACTION_META.map((reaction) => {
                                    const Icon = reaction.icon;
                                    const active = item.post.viewerReactions.includes(reaction.key);
                                    const count = item.post.reactionCounts[reaction.key] ?? 0;
                                    return (
                                      <Button
                                        key={reaction.key}
                                        type="button"
                                        variant={active ? "default" : "ghost"}
                                        size="sm"
                                        // Erişilebilir ad ESKİSİYLE BİREBİR AYNI ("Beğendim (1)"):
                                        // ekran okuyucu davranışı ve ona bağlı testler değişmesin.
                                        aria-label={`${reaction.label} (${count})`}
                                        aria-pressed={active}
                                        onClick={() => {
                                          if (!session) {
                                            navigate("/login");
                                            return;
                                          }
                                          reactionMutation.mutate({ postId: item.post.id, reactionType: reaction.key });
                                        }}
                                        className={`min-h-10 rounded-full px-2.5 ${
                                          active ? "bg-slate-900 text-white hover:bg-slate-800" : ""
                                        }`}
                                      >
                                        <Icon className="h-4 w-4" />
                                        {/* Sıfır sayaç görsel olarak gizli; hemen
                                            yukarıdaki aria-label sayıyı taşımayı
                                            SÜRDÜRÜR (testler oradan okuyor). */}
                                        {count > 0 ? (
                                          <span
                                            className={`ml-1 text-xs ${active ? "text-white/80" : "text-muted-foreground"}`}
                                          >
                                            {count}
                                          </span>
                                        ) : null}
                                      </Button>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        );
                      })()}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            data-testid="cadde-comment-toggle"
                            aria-label={
                              item.post.commentCount > 0
                                ? `${item.post.commentCount} yorum`
                                : "Yorum yaz"
                            }
                            className="min-h-10 rounded-full px-3"
                            onClick={() =>
                              setExpandedCommentPostId((current) => (current === item.post.id ? null : item.post.id))
                            }
                          >
                            <MessageCircle className="h-4 w-4" />
                            {/* Sıfırken sayı basılmaz; aria-label zaten 0 iken
                                "Yorum yaz" diyor, ekran okuyucu bilgi kaybetmez. */}
                            {item.post.commentCount > 0 ? (
                              <span className="ml-1.5 text-xs text-muted-foreground">{item.post.commentCount}</span>
                            ) : null}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {item.post.commentCount > 0 ? "Yorumlar" : "Yorum yaz"}
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            aria-label={`Paylaş (${shareCount})`}
                            className="min-h-10 rounded-full bg-white/80 px-3"
                            disabled={shareMutation.isPending}
                            onClick={() => {
                              if (!session) {
                                navigate("/login");
                                return;
                              }
                              shareMutation.mutate({ postId: item.post.id, title: item.post.title, body: item.post.body });
                            }}
                          >
                            <Share2 className="h-4 w-4" />
                            {/* Tepki ve yorumla aynı kural: sıfır sayaç gizli, aria-label
                                ("Paylaş (0)") sayıyı taşımayı sürdürür. Bunu dışarıda
                                bırakmak tutarsız olurdu — kartta tek başına "0" kalırdı. */}
                            {shareCount > 0 ? (
                              <span className="ml-1.5 text-xs text-muted-foreground">{shareCount}</span>
                            ) : null}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Paylaş</TooltipContent>
                      </Tooltip>
                      {session && item.post.authorUserId !== user?.id ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="min-h-10 text-slate-500 hover:text-red-600"
                              onClick={() => reportMutation.mutate(item.post.id)}
                              disabled={reportMutation.isPending}
                              aria-label="Paylaşımı şikayet et"
                            >
                              <Flag className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Şikayet et</TooltipContent>
                        </Tooltip>
                      ) : null}
                      {/* A11c: kendi gönderisinde şikayet yerine üç nokta menüsü
                          (sil + onay diyaloğu). Yetkinin gerçek denetimi DB'de
                          (delete_cadde_post_v1) — buradaki koşul yalnız görünürlük. */}
                      {session && item.post.authorUserId === user?.id ? (
                        <CaddePostMenu postId={item.post.id} />
                      ) : null}
                    </div>
                    </TooltipProvider>

                    <Separator />

                    <div
                      data-testid="cadde-comment-panel"
                      className="rounded-lg border border-slate-200/90 bg-slate-50/80 p-3"
                    >
                      <div className="space-y-2">
                        {visibleComments.map((comment) => (
                          <div key={comment.id} data-testid="cadde-comment-card" className="rounded-lg border border-slate-200/80 bg-white px-3 py-2.5">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              <p className="text-sm font-semibold text-slate-900">{comment.authorName}</p>
                              <p className="text-xs text-slate-500">{formatDateTime(comment.createdAt)}</p>
                            </div>
                            <p className="mt-0.5 text-sm leading-5 text-slate-700">{comment.body}</p>
                          </div>
                        ))}

                        {isCommentsExpanded && commentsQuery.isLoading ? (
                          <p className="text-sm text-slate-500">Yorumlar yükleniyor...</p>
                        ) : null}

                        {isCommentsExpanded ? (
                          session ? (
                            <div className="space-y-3">
                              {!commentsQuery.isLoading && visibleComments.length === 0 ? (
                                <p className="text-sm text-slate-500">İlk yorumu sen bırak ve konuşmayı başlat.</p>
                              ) : null}
                              {commentsQuery.hasNextPage ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => void commentsQuery.fetchNextPage()}
                                  disabled={commentsQuery.isFetchingNextPage}
                                >
                                  {commentsQuery.isFetchingNextPage ? "Yükleniyor..." : "Devamını yükle"}
                                </Button>
                              ) : null}
                              <div className="flex flex-col gap-2 sm:flex-row">
                                <div className="flex min-w-0 flex-1 items-end gap-2">
                                  <Textarea
                                    ref={commentTextareaRef}
                                    value={commentDrafts[item.post.id] ?? ""}
                                    onChange={(event) => {
                                      syncCommentSelection(item.post.id, event);
                                      setCommentDrafts((current) => ({ ...current, [item.post.id]: event.target.value }));
                                    }}
                                    onClick={(event) => syncCommentSelection(item.post.id, event)}
                                    onKeyUp={(event) => syncCommentSelection(item.post.id, event)}
                                    onSelect={(event) => syncCommentSelection(item.post.id, event)}
                                    placeholder="Yorum yaz"
                                    rows={2}
                                    className="min-h-[64px] bg-white"
                                  />
                                  <CaddeEmojiPickerButton onSelect={(emoji) => insertCommentEmoji(item.post.id, emoji)} className="mb-0.5" />
                                </div>
                                <Button
                                  className="cadde-secondary-action self-end whitespace-nowrap sm:min-w-[112px]"
                                  onClick={() => {
                                    commentMutation.mutate({ postId: item.post.id, body: commentDrafts[item.post.id] ?? "" });
                                  }}
                                >
                                  <Send className="mr-1.5 h-4 w-4" />
                                  Gönder
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-lg border border-dashed border-orange-200 bg-white px-4 py-4 text-sm text-slate-600">
                              Yorum yazmak için <Link to="/login" className="font-semibold text-orange-700 underline">giriş yap</Link>.
                            </div>
                          )
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })(),
            )}

            {/* Hata ≠ içerik yok. listCaddeFeed eskiden hatayı yutup boş sayfa dönüyordu,
                bu yüzden RLS reddi/RPC hatası ekranda "akış sessiz" gibi görünüyordu.
                Artık fırlatıyor; buradaki kart o durumu AYRI yüzeyde ve kurtarma yoluyla
                gösterir. Boş-durum kartı da isError'a bakar, ikisi asla birlikte çıkmaz. */}

            {/* m89: Yeni paylaşım geldiğinde "Yeni paylaşımlar var" butonu */}
            {hasNewPosts && !feedQuery.isFetching ? (
              <Card className="cadde-card border-emerald-200 bg-emerald-50">
                <CardContent className="p-4 text-center">
                  <p className="text-sm font-medium text-emerald-900">
                    Yeni paylaşımlar var
                  </p>
                  <Button
                    variant="outline"
                    className="cadde-secondary-action mt-2 rounded-lg"
                    onClick={() => {
                      void feedQuery.refetch();
                      resetNewPosts();
                    }}
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    Yenile
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            {feedQuery.isError ? (
              <CaddeLoadErrorCard
                testId="cadde-feed-error-state"
                title="Akış yüklenemedi."
                onRetry={() => void feedQuery.refetch()}
                isRetrying={feedQuery.isFetching}
              />
            ) : null}

            {!feedQuery.isLoading && !feedQuery.isError && filters.mode === "real" && feedItems.length === 0 ? (
              <Card
                data-testid="cadde-feed-empty-state"
                className="cadde-empty border-dashed"
              >
                {/* Soğuk başlangıç: kart eskiden üç paragraf METİNDİ ve kullanıcıya ne
                    yapabileceğini ANLATIP yapmasını zorlaştırıyordu. ux `empty-states`
                    kuralı "yardımcı mesaj VE eylem" diyor. Birincil eylem her zaman
                    paylaşım; ikincil eylem akışın neden boş olduğuna göre değişir —
                    filtre daraltıyorsa filtreyi temizler, daraltmıyorsa kapsamı genişletir. */}
                <CardContent className="p-8 text-center text-slate-500">
                  <p className="text-base font-semibold text-slate-900">
                    {canWiden
                      ? `${cafeLocationLabel ?? "Bu akış"} için henüz paylaşım yok.`
                      : "Bu akış henüz sessiz."}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    İlk paylaşımı sen yapabilirsin — bir soru, bir duyuru ya da şehrinden kısa bir not yeter.
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    {/* Genişletme birincil eylem olur: dolu bir alternatif, boş bir davetten
                        iyidir. Sayı yoklamadan gelir — SIFIR yeni ağ isteği (yoklama zaten
                        koştu) ve tıklayınca anahtar eşleştiği için üçüncü bir istek de gitmez. */}
                    {canWiden ? (
                      <Button
                        data-testid="cadde-widen-feed"
                        onClick={() => setSearchParams(serializeCaddeFilters(widenTarget!.next))}
                        variant="outline"
                        className="cadde-secondary-action rounded-lg"
                      >
                        {widenTarget!.label} akışındaki{" "}
                        {describeCaddeWidenCount(widenedCount, Boolean(widenedPage?.nextPage))} → gör
                      </Button>
                    ) : null}
                    {session ? (
                      <Button
                        onClick={scrollToComposer}
                        variant={canWiden ? "outline" : "default"}
                        className={
                          canWiden
                            ? "rounded-lg border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                            : "cadde-secondary-action rounded-lg"
                        }
                      >
                        İlk paylaşımı yap
                        <Megaphone className={`ml-1.5 h-4 w-4 ${canWiden ? "text-orange-500" : "text-orange-200"}`} />
                      </Button>
                    ) : (
                      <Button asChild className="cadde-primary-action rounded-lg">
                        <Link to="/login">Giriş yap ve ilk paylaşımı yap</Link>
                      </Button>
                    )}
                    {/* Genişletme varken üçüncü buton çizilmez — karar felci. Filtre paneli
                        o durumda zaten açıktır (hasNarrowingFilter true → isColdStart false),
                        temizleme oradan yapılabilir. */}
                    {canWiden ? null : hasGeoSelection ? (
                      <Button
                        variant="outline"
                        className="cadde-secondary-action rounded-lg"
                        onClick={() => updateFilters({ countries: [], cities: [] })}
                      >
                        Filtreleri temizle
                      </Button>
                    ) : filters.bridge ? null : (
                      <Button
                        variant="outline"
                        className="cadde-secondary-action rounded-lg"
                        onClick={() => updateFilters({ bridge: true })}
                      >
                        Köprü modunu aç
                      </Button>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-slate-500">{sparseContentHint}</p>
                </CardContent>
              </Card>
            ) : null}

            {feedQuery.hasNextPage ? (
              <div className="flex justify-center">
                <Button variant="outline" className="cadde-secondary-action" onClick={() => feedQuery.fetchNextPage()} disabled={feedQuery.isFetchingNextPage}>
                  {feedQuery.isFetchingNextPage ? "Yükleniyor..." : "Daha Fazla Yükle"}
                </Button>
              </div>
            ) : null}
          </div>
        </section>
  );
};

