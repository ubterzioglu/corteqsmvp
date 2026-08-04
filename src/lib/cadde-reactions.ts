// Reaksiyon optimistic update'i — 04.08.2026 canlı denetimi bulgusu.
//
// Eskiden tek bir emoji tıklaması `invalidateCadde()` çağırıyordu: feedRoot + cafesRoot
// birlikte invalidate ediliyor, yüklü TÜM feed sayfaları yeniden çekiliyordu. Sayfa başına
// 1 RPC + 3 ek sorgu olduğu için n sayfa yüklüyken maliyet n×4 round-trip'ti ve kullanıcı
// kendi tıklamasının sonucunu ancak ağ turu bitince görüyordu — sayfanın "ölü" hissinin
// en büyük tek sebebi buydu.
//
// Buradaki fonksiyonlar SAF ve immutable: React Query önbelleğini yerinde değiştirmez,
// yeni nesne döner (bkz. proje immutability kuralı). Mutasyon hata verirse çağıran taraf
// anlık görüntüyü geri yazar.

import type { CaddeFeedPage, CaddePost, CaddeReactionType } from "./cadde-types";

/**
 * Tek postun görüntüleyen-reaksiyonunu çevirir ve sayaçları buna göre düzeltir.
 * Sayaçlar 0'ın altına düşemez: sunucu ile yerel durum ayrışmışsa (ör. başka sekmede
 * geri alınmış bir reaksiyon) eksi sayı göstermek yerine 0'da durur.
 */
export function toggleViewerReaction(post: CaddePost, reactionType: CaddeReactionType): CaddePost {
  const hadReaction = post.viewerReactions.includes(reactionType);
  const delta = hadReaction ? -1 : 1;
  const currentCount = post.reactionCounts[reactionType] ?? 0;

  return {
    ...post,
    viewerReactions: hadReaction
      ? post.viewerReactions.filter((existing) => existing !== reactionType)
      : [...post.viewerReactions, reactionType],
    reactionCounts: {
      ...post.reactionCounts,
      [reactionType]: Math.max(0, currentCount + delta),
    },
    totalReactionCount: Math.max(0, post.totalReactionCount + delta),
  };
}

type InfiniteFeedData = {
  pages: CaddeFeedPage[];
  pageParams: unknown[];
};

/**
 * useInfiniteQuery önbelleğinin TÜM sayfalarında ilgili postu çevirir.
 * Postu içermeyen sayfalar referans olarak korunur — gereksiz yeniden render olmaz.
 */
export function applyReactionToFeedPages<T extends InfiniteFeedData>(
  data: T | undefined,
  postId: string,
  reactionType: CaddeReactionType,
): T | undefined {
  if (!data) return data;

  return {
    ...data,
    pages: data.pages.map((page) => {
      if (!page.items.some((item) => item.id === postId)) return page;
      return {
        ...page,
        items: page.items.map((item) =>
          item.id === postId ? toggleViewerReaction(item, reactionType) : item,
        ),
      };
    }),
  };
}
