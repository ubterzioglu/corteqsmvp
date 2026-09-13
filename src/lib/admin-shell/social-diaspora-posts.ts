// Admin Panel V2 — Diaspora LinkedIn + Instagram + Reddit Postları (statik tek kaynak).
// /admin/social-share-vault sayfasının "Diaspora Postları" sekmesi bu listeden
// beslenir. 68 kayıt; her biri için 2 metinsiz ChatGPT görsel promptu (İngilizce,
// square 1:1 / no-text kuralları promptun içine gömülü), 1 hazır Türkçe LinkedIn
// postu, 1 hazır Türkçe Instagram postu ve 1 hazır Türkçe Reddit postu (daha az
// satış dili, kişisel anekdot/soru ile açılan tartışma tonu — subreddit
// kurallarına göre editlenmesi gerekebilir). Her post ücretsiz kayıt çağrısı, web +
// WhatsApp linki ve CorteQS kapanışıyla biter (Reddit postu hariç — o bare URL'le biter).
// post-51..68 (2026-07-18): site özellikleri (Cadde, Çarşı, Radar, Blog, Referans) +
// genel diaspora temaları (ikinci kuşak, uzaktan çalışma, yalnızlık, dil kaybı) eklendi.
//
// Kayıtlar `social-diaspora-posts/` altındaki parça dosyalarda tutulur; bu dosya
// yalnız onları görünüm sırasına göre birleştirir. İçerik düzenlemesi ilgili parça
// dosyasından yapılır. Metinler temiz UTF-8 Türkçe + gerçek tırnak + emoji olarak
// tutulur; HTML-entity / mojibake KULLANILMAZ. Yeni post eklerken `id`/`order`
// benzersiz olmalı ve `theme` union'dan seçilmeli (yeni tema eklersen
// `social-diaspora-posts/theme-labels.ts` içindeki haritaya da ekle).

import type { DiasporaPost, DiasporaPostTheme } from "./social-diaspora-posts/types";
import { DIASPORA_POSTS_01_13 } from "./social-diaspora-posts/posts-01-13";
import { DIASPORA_POSTS_14_26 } from "./social-diaspora-posts/posts-14-26";
import { DIASPORA_POSTS_27_38 } from "./social-diaspora-posts/posts-27-38";
import { DIASPORA_POSTS_39_50 } from "./social-diaspora-posts/posts-39-50";
import { DIASPORA_POSTS_51_60 } from "./social-diaspora-posts/posts-51-60";
import { DIASPORA_POSTS_61_68 } from "./social-diaspora-posts/posts-61-68";

export type { DiasporaPostTheme, DiasporaPost };
export { DIASPORA_THEME_LABELS } from "./social-diaspora-posts/theme-labels";

export const DIASPORA_POSTS: DiasporaPost[] = [
  ...DIASPORA_POSTS_01_13,
  ...DIASPORA_POSTS_14_26,
  ...DIASPORA_POSTS_27_38,
  ...DIASPORA_POSTS_39_50,
  ...DIASPORA_POSTS_51_60,
  ...DIASPORA_POSTS_61_68,
];
