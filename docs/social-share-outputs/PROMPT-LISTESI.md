# Social Share Vault — Görsel Üretim Prompt Listesi

Kaynak: `/admin/social-share-vault` (Admin Panel V2). Bu doküman, o sayfadaki 4 sekmenin
(**Araç Tanıtımları**, **Diaspora Postları**, **Test Araçları**, **Burak**) içinde tanımlı
her kalem için hazırlanmış, metinsiz (no-text) ChatGPT/görsel üretim promptlarının tam
listesidir. Toplam **288 prompt**.

## Nasıl kullanılır

1. Aşağıdaki her promptu olduğu gibi (İngilizce) bir görsel üretim aracına (ör. ChatGPT
   görsel üretimi, DALL-E, Midjourney vb.) yapıştırıp kare (1:1, 1024×1024) görsel üret.
2. Üretilen görseli, o promptun **hemen üstünde yazan dosya adıyla** kaydet.
3. Tüm dosyaları `docs/social-share-outputs/<sekme>/` klasörüne at (sekme = tools / diaspora / tests / burak).
4. Dosya adı zaten kaynak koddaki gerçek `id` alanına dayandığı için, klasördeki dosyaları
   gördüğümde hangi admin sekmesindeki hangi kaleme ait olduğunu otomatik anlayıp eşleştirebilirim
   — ek açıklama yapmana gerek kalmaz.

## Dosya adlandırma kuralı

```
<id>_p<promptNo>.png              → tek varyantlı kalemler (Araç Tanıtımları, Diaspora Postları)
<id>_v<varyantNo>_p<promptNo>.png  → çok varyantlı kalemler (Test Araçları, Burak — 3 varyant: v1/v2/v3)
```

- `id`: kaynak koddaki gerçek kimlik (ör. `tool-1`, `post-23`, `test-tool-4`, `burak-tool-7`) — dosya
  genelinde benzersizdir, tek başına eşleştirme için yeterlidir.
- `promptNo`: o kalemin/varyantın 1. veya 2. görsel promptu (`p1` / `p2`).
- `varyantNo`: sadece Test Araçları ve Burak sekmelerinde var — 3 metin varyantından (A/B/C) hangisi (`v1`/`v2`/`v3`).

## Kaynak dosyalar ve kalem sayıları

| Sekme (tab) | Kaynak dosya | Kalem sayısı | Varyant/kalem | Prompt/varyant | Toplam görsel |
|---|---|---|---|---|---|
| Araç Tanıtımları (`tools`) | `src/lib/admin-shell/social-share-vault.ts` | 10 | 1 | 2 | 20 |
| Diaspora Postları (`diaspora`) | `src/lib/admin-shell/social-diaspora-posts.ts` | 68 | 1 | 2 | 136 |
| Test Araçları (`tests`) | `src/lib/admin-shell/social-test-tools.ts` | 10 | 3 | 2 | 60 |
| Burak (`burak`) | `src/lib/admin-shell/burak-share-tools.ts` | 12 | 3 | 2 | 72 |

---


## Araç Tanıtımları (`tools`) — 10 kalem

### 01. Dizin / Katalog Arama `(tool-1)`

**Dosya adı: `tool-1_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream-colored world globe rendered in soft rounded geometry, with a friendly oversized magnifying glass made of glossy teal glass hovering above it and gently highlighting a cluster of small rounded location-pin shapes in orange, blue, indigo, pink and yellow scattered across the globe's surface; the globe and magnifier are perfectly centered and sit safely inside a square 1:1 frame at a recommended 1024x1024 resolution, with generous padding so nothing touches or crosses the edges; soft cinematic studio lighting casts smooth gradients and gentle shadows across the warm cream background, giving the scene subtle depth and a polished, professional SaaS product-illustration feel; the composition reads clearly even at small thumbnail size thanks to a single bold visual hierarchy (globe plus magnifier) with no secondary clutter; the mood is optimistic, inclusive and welcoming; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, and no watermark anywhere in the image.
```

**Dosya adı: `tool-1_p2.png`**

```
A premium modern editorial 3D illustration of a friendly rounded teal search-bar shape floating at the center of a warm cream square canvas, with several small glossy silhouette busts in orange, blue, indigo, pink and yellow gently emerging from behind it like a diverse crowd being discovered, arranged in a balanced circular composition around the search shape; every figure and the search bar itself sit comfortably inside the square 1:1 frame at 1024x1024 recommended size, well clear of all four edges; soft cinematic lighting produces smooth gradients and rounded, friendly forms with subtle depth, giving a polished and inclusive technology-brand aesthetic suitable for both a small website card and a large hero banner; the overall shape reads instantly at thumbnail scale; the tone is professional, optimistic and community-oriented; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 02. AI Eşleştirme `(tool-2)`

**Dosya adı: `tool-2_p1.png`**

```
A premium modern editorial 3D illustration of two smooth rounded puzzle-piece forms, one in teal and one in warm orange, gently floating toward each other at the exact center of a warm cream square canvas, with a soft glowing indigo spark forming in the small gap between them to suggest an intelligent match; delicate blue, pink and yellow particle dots drift around the pieces like gentle data signals, all kept well within the square 1:1 frame at 1024x1024 recommended size so nothing touches the edges; soft cinematic lighting creates smooth gradients and rounded, friendly volumes with subtle depth, producing a polished, optimistic SaaS-technology look that reads clearly at thumbnail size and works equally well as a website card or hero image; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `tool-2_p2.png`**

```
A premium modern editorial 3D illustration of a friendly rounded teal orb with a soft glowing indigo core, representing a helpful intelligence, centered on a warm cream square background, gently scanning a balanced circular arrangement of small rounded profile-card shapes in orange, blue, pink and yellow floating around it like petals, with one card lifted slightly and haloed in soft golden-orange light to show it is the best match; every element stays safely inside the square 1:1 frame at 1024x1024 recommended resolution with clear margin from all sides; smooth gradients, soft cinematic lighting and rounded forms give the scene gentle depth and a professional, inclusive, optimistic technology-brand mood that stays legible at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 03. Profil / İlgi Alanı Editörü `(tool-3)`

**Dosya adı: `tool-3_p1.png`**

```
A premium modern editorial 3D illustration of a rounded teal profile-card shape at the center of a warm cream square canvas, blooming outward like a flower into six soft glossy petal shapes colored orange, blue, indigo, pink, yellow and a lighter teal, each petal representing a different personal interest, arranged in a perfectly balanced circular composition; the whole bloom is centered and comfortably contained within the square 1:1 frame at 1024x1024 recommended size, with ample space before any edge; soft cinematic lighting produces smooth gradients, gentle shadows and subtle depth across the rounded forms, giving a polished, friendly, professional technology-brand aesthetic that stays instantly readable at small thumbnail scale; the mood is warm, personal and optimistic; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `tool-3_p2.png`**

```
A premium modern editorial 3D illustration of a smooth rounded oval mirror shape standing upright at the center of a warm cream square background, reflecting a simplified glossy teal avatar silhouette, surrounded by small orbiting rounded interest-icons in orange, blue, indigo, pink and yellow gently circling the mirror like satellites in a balanced radial layout; every shape sits safely within the square 1:1 frame at 1024x1024 recommended resolution, well clear of all four borders; soft cinematic lighting creates smooth gradients and rounded, friendly volumes with subtle depth, producing an inclusive, optimistic and polished SaaS-illustration feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 04. Cadde Feed `(tool-4)`

**Dosya adı: `tool-4_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream square canvas with a soft rounded teal city-skyline silhouette gently rising from the bottom, smoothly transforming above it into a vertical stack of three rounded feed-card shapes colored orange, indigo and pink, all centered along a single balanced vertical axis; the skyline and cards are scaled to sit entirely within the square 1:1 frame at 1024x1024 recommended size with clear breathing room from every edge; soft cinematic lighting creates smooth gradients and gentle highlights across the rounded forms, adding subtle depth and a polished, optimistic, community-oriented SaaS aesthetic that remains legible at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `tool-4_p2.png`**

```
A premium modern editorial 3D illustration of a glossy teal location-pin shape standing at the center of a warm cream square background, with soft rounded content-card shapes in orange, blue, pink and yellow flowing outward from it in a gentle balanced spiral, like a personalized stream of local updates; every card and the pin stay comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the edges; smooth gradients and soft cinematic lighting give the rounded shapes subtle depth and a warm, polished, professional feel suited to both a small card and a large hero image; the mood is lively yet calm and inclusive; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 05. Cadde Profil Kapısı `(tool-5)`

**Dosya adı: `tool-5_p1.png`**

```
A premium modern editorial 3D illustration of a smooth rounded teal doorway shape standing centered on a warm cream square canvas, its frosted glass-like surface glowing softly at the edges in orange and pink, with a gentle rounded location-pin key shape floating just in front of it, about to unlock the door; behind the glass, softly blurred rounded community shapes in blue, indigo and yellow hint at a warm gathering waiting inside; the whole scene sits safely within the square 1:1 frame at 1024x1024 recommended size, well away from all edges; soft cinematic lighting produces smooth gradients and subtle depth across the rounded forms, giving a trustworthy, polished, optimistic technology-brand feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `tool-5_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded teal shield shape centered on a warm cream square background, gently overlapping with a small glossy location-pin shape in orange to symbolize a verified neighborhood, surrounded by a balanced circle of softly blurred rounded figure silhouettes in blue, indigo, pink and yellow that grow sharper and clearer toward the center; every shape is scaled to remain fully inside the square 1:1 frame at 1024x1024 recommended resolution with generous margin from the border; smooth gradients and soft cinematic lighting add subtle depth and a reassuring, professional, inclusive mood that stays legible at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 06. Cadde Köprü `(tool-6)`

**Dosya adı: `tool-6_p1.png`**

```
A premium modern editorial 3D illustration of two soft rounded landmass shapes on a warm cream square canvas, one tinted warm orange and the other cool teal, connected by a glossy rounded bridge arc in indigo stretching between them at the center of the frame, with a few small rounded bird shapes in pink and yellow gently crossing above the bridge; the entire composition is centered and scaled to stay fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting creates smooth gradients and gentle shadows across the rounded forms, giving a warm, hopeful, polished technology-brand feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `tool-6_p2.png`**

```
A premium modern editorial 3D illustration of two soft rounded glossy hand shapes, one teal and one warm orange, reaching toward each other across a gentle gap at the center of a warm cream square background, with a delicate arc of small glowing message-bubble shapes in indigo, pink and yellow floating along the space between them like a bridge of conversation; every element is comfortably centered and contained within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a warm, optimistic, inclusive mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 07. Cadde Cafe `(tool-7)`

**Dosya adı: `tool-7_p1.png`**

```
A premium modern editorial 3D illustration of a small rounded cafe-table shape at the center of a warm cream square canvas, with two glossy rounded cup shapes on top gently releasing soft curling steam rendered as smooth teal ribbons, surrounded by a balanced ring of small floating rounded speech-bubble shapes in orange, indigo, pink and yellow; a thin circular light ring, like a gentle countdown glow, softly frames the whole table; every shape stays fully inside the square 1:1 frame at 1024x1024 recommended size, with clear margin on all sides; soft cinematic lighting produces smooth gradients and subtle depth, giving a cozy, polished, optimistic technology-brand feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `tool-7_p2.png`**

```
A premium modern editorial 3D illustration of a cluster of soft rounded speech-bubble shapes in teal, orange, indigo, pink and yellow gathered closely together like embers around a warm glow at the center of a cream square background, with one bubble slightly larger and centered to anchor the balanced circular composition; the cluster is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the edges; smooth gradients and soft cinematic lighting create subtle depth and a warm, friendly, polished mood suited to both a small card and a large hero image; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 08. Cadde Çarşı `(tool-8)`

**Dosya adı: `tool-8_p1.png`**

```
A premium modern editorial 3D illustration of a balanced row of small rounded market-stall shapes on a warm cream square canvas, each stall a soft glossy card in a different accent color — orange, blue, indigo, pink and yellow — arranged symmetrically around a central teal stall that is slightly larger and highlighted; simple rounded abstract goods shapes rest on each stall without any readable detail; the whole marketplace scene is centered and scaled to stay fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting creates smooth gradients and gentle shadows across the rounded forms, giving a lively yet polished, trustworthy, professional feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `tool-8_p2.png`**

```
A premium modern editorial 3D illustration of two soft rounded glossy hand shapes, one teal and one warm orange, passing a small rounded gift-box parcel shape between them at the exact center of a warm cream square background, with faint rounded phone-screen outlines behind each hand suggesting a digital handoff, and a few small floating rounded sparkle accents in indigo, pink and yellow around the parcel; every shape is comfortably centered and contained within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a warm, trustworthy, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 09. Cadde Tanıtım `(tool-9)`

**Dosya adı: `tool-9_p1.png`**

```
A premium modern editorial 3D illustration of a single soft rounded storefront-card shape in warm orange lifted gently above a cluster of smaller rounded cream and teal cards, centered on a warm cream square canvas, with a soft glowing spotlight cone in golden-yellow light shining down on the lifted card from above; small sparkle accents in pink and indigo drift around it in a balanced radial pattern; the whole scene stays fully within the square 1:1 frame at 1024x1024 recommended size, with clear breathing room from every edge; soft cinematic lighting produces smooth gradients and subtle depth, giving a confident, polished, optimistic small-business feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `tool-9_p2.png`**

```
A premium modern editorial 3D illustration of a smooth rounded megaphone shape in teal at the center of a warm cream square background, gently radiating soft rounded wave-arcs in orange, blue, pink and yellow outward in a balanced symmetrical pattern, with a few tiny rounded rooftop shapes below hinting at a city neighborhood being reached; every element is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting create subtle depth and an energetic yet professional, optimistic mood suited to both a small card and a large hero image; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 10. Cadde Şikâyet / Moderasyon `(tool-10)`

**Dosya adı: `tool-10_p1.png`**

```
A premium modern editorial 3D illustration of a soft rounded shield shape in teal hovering protectively above a balanced circular cluster of small rounded figure-silhouette shapes in orange, blue, indigo, pink and yellow, centered on a warm cream square canvas, with a few gentle golden-light rays filtering softly from behind the shield onto the community below; the whole composition is scaled to stay fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting creates smooth gradients and subtle depth across the rounded forms, giving a safe, reassuring, polished technology-brand feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `tool-10_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded balance-scale shape rendered entirely in smooth glossy teal light at the center of a warm cream square background, perfectly level, with small rounded orb shapes in orange, indigo, pink and yellow resting gently on either side to suggest fairness and calm oversight; the scale is centered and comfortably contained within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a calm, trustworthy, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

## Diaspora Postları (`diaspora`) — 68 kalem

### 01. Köprüdeki o koku `(post-1)`

**Dosya adı: `post-1_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream square canvas centered on a single softly rounded teal window-frame shape, behind whose glass a glowing golden-orange horizon line hints gently at a distant skyline without depicting any real monument or literal cityscape, with a small rounded steaming teacup shape in indigo resting on the sill and soft wisps of steam curling upward rendered as delicate pink and yellow ribbons; the entire composition stays centered and comfortably inside a square 1:1 frame at 1024x1024 recommended size, with generous clearance from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving a warm, nostalgic, polished editorial-illustration feel that reads clearly at small thumbnail size; the mood is tender and wistful yet hopeful; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-1_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded heart-shaped locket floating at the center of a warm cream square background, its glossy teal surface gently ajar to reveal a warm glow of orange and golden light spilling out like a captured memory, encircled by a thin balanced ring of small rounded wave-shapes in blue, indigo, pink and yellow suggesting distance being crossed; every element sits safely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting create subtle depth and a warm, sentimental, optimistic mood suited to both a small card and a large hero image; the scene reads instantly at thumbnail scale; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 02. Annenin sesi `(post-2)`

**Dosya adı: `post-2_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream square canvas with a soft rounded teal phone-shape standing upright at the center, its screen glowing with a gentle orange-to-pink gradient like a warm voice being carried, with two small rounded chair-silhouettes in indigo and yellow placed symmetrically on either side to suggest a shared moment across distance; the whole scene stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a warm, intimate, polished editorial-illustration feel that reads clearly at small thumbnail size; the mood is tender and reassuring; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-2_p2.png`**

```
A premium modern editorial 3D illustration of two soft rounded glossy sound-wave arcs, one teal and one warm orange, curving toward each other and gently overlapping at the center of a warm cream square background, surrounded by small floating rounded heart-shapes in pink, indigo and yellow drifting in a balanced circular pattern to represent a caring voice reaching across distance; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, well clear of all four edges; smooth gradients and soft cinematic lighting add subtle depth and a warm, comforting, optimistic mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 03. Aynı ay `(post-3)`

**Dosya adı: `post-3_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream square canvas split gently down the middle by a soft glowing vertical seam of golden-orange light, with two identical smooth rounded moon-orb shapes in teal floating symmetrically on either side, each haloed by a thin ring of small pinwheel-colored stars in blue, indigo, pink and yellow; both orbs are centered along the frame's horizontal axis and stay fully inside the square 1:1 frame at 1024x1024 recommended size, with generous margin from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a calm, unifying, polished editorial-illustration feel that reads clearly at small thumbnail size; the mood is quiet, warm and connective; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-3_p2.png`**

```
A premium modern editorial 3D illustration of a single soft rounded glossy teal moon-shape centered on a warm cream square background, with a delicate ribbon of light made of small rounded dots in orange, indigo, pink and yellow spiraling gently outward from it in a balanced circular pattern like ripples connecting distant places; every element sits safely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting create subtle depth and a serene, hopeful, inclusive mood suited to both a small card and a large hero image; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 04. İki dünya bir kalp `(post-4)`

**Dosya adı: `post-4_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream square canvas featuring a single soft rounded silhouette bust shape split cleanly down the middle, one half rendered in glossy teal with subtle geometric patterning and the other half in warm orange with subtle floral rounded patterning, seamlessly merging at the center seam which glows softly in indigo light; small accent dots in pink, blue and yellow float gently around the head in a balanced arc; the whole figure is centered and stays fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting creates smooth gradients and subtle depth, giving a thoughtful, unifying, polished editorial-illustration feel that reads clearly at small thumbnail size; the mood is confident and whole, not divided; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-4_p2.png`**

```
A premium modern editorial 3D illustration of two soft rounded overlapping circle shapes forming a Venn-diagram-like heart at the center of a warm cream square background, one circle glossy teal and the other warm orange, their overlapping middle glowing softly in blended pink-indigo light, surrounded by a few small rounded sparkle accents in blue and yellow in a balanced radial arrangement; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, well clear of all four edges; smooth gradients and soft cinematic lighting add subtle depth and a warm, harmonious, optimistic mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 05. Dedemin valizi `(post-5)`

**Dosya adı: `post-5_p1.png`**

```
A premium modern editorial 3D illustration of a small soft rounded vintage-style suitcase shape rendered in warm glossy orange resting at the center of a warm cream square canvas, its surface gently textured with rounded stitch-lines, with a single small rounded polaroid-like frame shape in teal and a smooth rounded smartphone silhouette in indigo placed neatly side by side on top of it; a few tiny sparkle accents in pink, blue and yellow float above in a balanced arc suggesting generations connecting; the whole scene stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a nostalgic yet forward-looking, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-5_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded family-tree silhouette made of simple glossy branch shapes in teal, growing from a small rounded suitcase-base shape in warm orange at the bottom center of a cream square background, with small rounded leaf-shapes in indigo, pink, blue and yellow blooming along the branches to represent later generations; the tree is centered and scaled to remain fully within the square 1:1 frame at 1024x1024 recommended resolution, with ample margin from every edge; smooth gradients and soft cinematic lighting create subtle depth and a warm, respectful, hopeful mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 06. İsmini doğru söyleyen biri `(post-6)`

**Dosya adı: `post-6_p1.png`**

```
A premium modern editorial 3D illustration of two soft rounded glossy hand shapes, one teal and one warm orange, meeting in a gentle handshake at the exact center of a warm cream square canvas, with a small warm golden-light spark glowing at the point of contact and a few tiny rounded speech-bubble shapes in indigo, pink and yellow floating nearby to suggest easy mutual understanding; the whole gesture is centered and stays fully within the square 1:1 frame at 1024x1024 recommended size, with generous clearance from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a warm, authentic, polished editorial-illustration feel that reads clearly at small thumbnail size; the mood is friendly and relieved; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-6_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy teal name-tag-like oval shape centered on a warm cream square background, gently glowing with a warm orange inner light and encircled by a balanced ring of small rounded smiling-face abstract shapes in indigo, pink, blue and yellow representing instant recognition and belonging; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, well clear of all four edges; smooth gradients and soft cinematic lighting add subtle depth and a warm, welcoming, optimistic mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 07. Almanya'da bir Türkiye `(post-7)`

**Dosya adı: `post-7_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream square canvas holding a soft rounded abstract landmass shape in glossy teal at the center, dotted with several small glowing rounded pin-shapes in warm orange pulsing gently over it like population hubs, connected by thin delicate arcs of light in indigo, pink, blue and yellow forming a balanced network; the whole shape stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a confident, data-driven yet warm, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-7_p2.png`**

```
A premium modern editorial 3D illustration of a large soft rounded glossy teal circle representing a population mass, centered on a warm cream square background, filled with many small rounded dot-shapes in orange, indigo, pink and yellow clustered densely yet playfully inside it like countless individuals forming one community, with a few dots gently drifting outward at the edge in a balanced radial pattern; the entire composition remains safely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting create subtle depth and an impressive, unified, optimistic mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 08. Avrupa'nın dört bir yanı `(post-8)`

**Dosya adı: `post-8_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream square canvas showing five small soft rounded glossy landmass shapes in teal arranged in a balanced arc around the center, each topped with a gently glowing rounded pin-shape in a different accent color — orange, indigo, pink and yellow — all linked by delicate curved threads of light forming a unified web; the whole arrangement stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a sophisticated, unified, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-8_p2.png`**

```
A premium modern editorial 3D illustration of a balanced circular constellation of small rounded glossy node-shapes in teal, orange, indigo, pink and yellow floating evenly spaced around a slightly larger central teal hub on a warm cream square background, connected by thin glowing threads of light radiating outward like a continental network; every node remains safely inside the square 1:1 frame at 1024x1024 recommended resolution, well clear of all edges; smooth gradients and soft cinematic lighting add subtle depth and a confident, collaborative, optimistic mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 09. Körfez'den Pasifik'e `(post-9)`

**Dosya adı: `post-9_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream square canvas showing a soft rounded stylized globe shape in glossy teal at the center, with three small glowing rounded location-pin shapes in orange, pink and indigo positioned at balanced points around its circumference, connected by gentle arcing flight-path lines rendered in soft yellow and blue light; the globe and all connecting arcs stay fully within the square 1:1 frame at 1024x1024 recommended size, with generous clearance from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving an aspirational, global, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-9_p2.png`**

```
A premium modern editorial 3D illustration of three small rounded glossy paper-airplane shapes in orange, indigo and pink gently gliding along balanced curved paths across a warm cream square background, each leaving a soft trailing glow, converging toward a central rounded teal starburst shape that represents a shared destination; every shape remains safely inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and an adventurous, hopeful, optimistic mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 10. Anne, su alabilir miyim? `(post-10)`

**Dosya adı: `post-10_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream square canvas centered on a soft rounded open-book shape rendered in glossy teal, with small rounded speech-bubble shapes in orange and pink gently floating above each page like a parent-and-child exchange, and a tiny rounded heart shape in indigo glowing softly between them; a few small star-accents in yellow and blue drift nearby in a balanced arrangement; the whole scene stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a tender, nurturing, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-10_p2.png`**

```
A premium modern editorial 3D illustration of two soft rounded glossy figure-silhouettes, one small and one larger, sitting closely together at the center of a warm cream square background, sharing a single glowing rounded speech-bubble shape in teal above them that gently splits into two smaller bubbles in orange and indigo, with soft sparkle accents in pink and yellow drifting around in a balanced arc; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, well clear of all four edges; smooth gradients and soft cinematic lighting add subtle depth and a warm, intimate, hopeful mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 11. Ninniden masala `(post-11)`

**Dosya adı: `post-11_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream square canvas featuring a soft rounded glossy storybook shape glowing gently from within with warm orange light, from which small rounded firefly-like light specks in teal, indigo, pink and yellow float upward in a balanced arc like little stories escaping into the air; the book stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a dreamy, nurturing, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-11_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded crescent-moon shape in glossy teal cradling a tiny rounded sleeping-figure silhouette at the center of a warm cream square background, surrounded by a gentle balanced ring of small floating rounded star-shapes in orange, indigo, pink and yellow like a lullaby made visible; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, well clear of all four edges; smooth gradients and soft cinematic lighting add subtle depth and a soothing, warm, hopeful mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 12. Annemin sarması `(post-12)`

**Dosya adı: `post-12_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream square canvas centered on a soft rounded glossy plate shape in teal, holding several small rounded roll-shaped forms in warm orange arranged in a neat spiral like stuffed grape leaves, with delicate steam rendered as smooth curling ribbons in pink and yellow rising above, and a small rounded napkin-fold accent in indigo beside the plate; the whole arrangement stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a warm, appetizing, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-12_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy heart-shape formed from a spiral of small rounded roll-shapes in warm orange and teal, centered on a warm cream square background, with a few floating rounded steam-wisp accents in pink, indigo and yellow drifting gently above in a balanced arc to suggest a home-cooked meal made with love; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, well clear of all four edges; smooth gradients and soft cinematic lighting add subtle depth and a warm, nostalgic, comforting mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 13. Bir simit, bir çay `(post-13)`

**Dosya adı: `post-13_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream square canvas featuring a soft rounded glossy ring-shape in warm orange dotted with tiny rounded seed-like textures to evoke a sesame bread ring, placed beside a small rounded tulip-shaped glass silhouette in teal filled with a warm gradient, both resting on a softly reflective surface; a few small steam-wisp accents in pink and yellow curl gently above in a balanced composition; the whole scene stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a cozy, nostalgic, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-13_p2.png`**

```
A premium modern editorial 3D illustration of a small rounded glossy teal tulip-shaped glass at the center of a warm cream square background, gently overlapping with a soft rounded ring-shape in warm orange, both haloed by a soft morning-light glow with small sparkle accents in indigo, pink and yellow drifting around in a balanced arc; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, well clear of all four edges; smooth gradients and soft cinematic lighting add subtle depth and a warm, homely, comforting mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 14. Gurbette arife sabahı `(post-14)`

**Dosya adı: `post-14_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream square canvas featuring a soft rounded teal window-frame shape at the center through which a gentle sunrise gradient of orange and yellow light glows softly, with a small rounded silhouette figure shape in indigo standing quietly before it, and a few tiny rounded crescent-and-star accent shapes in pink floating softly nearby to suggest a quiet holiday morning; the whole scene stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a bittersweet, hopeful, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-14_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy sunrise-arc shape in warm orange rising gently behind a small rounded teal doorway silhouette at the center of a warm cream square background, with delicate light rays in pink, indigo and yellow fanning outward in a balanced symmetrical pattern; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, well clear of all four edges; smooth gradients and soft cinematic lighting add subtle depth and a tender, reflective, quietly festive mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 15. Baklava kokusu `(post-15)`

**Dosya adı: `post-15_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream square canvas centered on a soft rounded glossy tray shape in teal holding several small rounded diamond-cut forms in warm orange arranged in a neat grid to evoke a festive sweet, gently glistening with a soft syrup-like sheen, surrounded by a few small rounded lantern-shapes in indigo, pink and yellow glowing softly above in a balanced arc; the whole arrangement stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a festive, warm, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-15_p2.png`**

```
A premium modern editorial 3D illustration of a balanced circular arrangement of small rounded glossy lantern-shapes in teal, orange, indigo, pink and yellow floating gently above a warm cream square background, each softly glowing from within, with a single larger lantern centered slightly above the rest to anchor the composition and hint at a shared celebration; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, well clear of all four edges; smooth gradients and soft cinematic lighting add subtle depth and a joyful, warm, communal mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 16. Gurbette kına gecesi `(post-16)`

**Dosya adı: `post-16_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream square canvas centered on a soft rounded glossy ornamental tray shape in warm orange holding a small rounded candle-shape in teal with a gentle glowing flame rendered in soft yellow light, surrounded by delicate rounded fabric-fold shapes in indigo and pink draped symmetrically around it; a few tiny sparkle accents float nearby in a balanced arc; the whole arrangement stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a celebratory, elegant, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-16_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy hand-shape in warm orange with a small circular henna-pattern motif rendered as simple rounded dots rather than literal ornamentation, centered on a warm cream square background, encircled by a balanced ring of small floating rounded candle-flame shapes in teal, indigo, pink and yellow; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, well clear of all four edges; smooth gradients and soft cinematic lighting add subtle depth and a warm, joyful, traditional-yet-modern mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 17. Vadideki Türkler `(post-17)`

**Dosya adı: `post-17_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream square canvas featuring a soft rounded glossy mountain-peak-like shape in teal at the center, with a small rounded flag-less pennant shape in warm orange planted at its summit and a gentle upward beam of golden-yellow light radiating from the peak; a few small rounded ascending arrow or chevron shapes in indigo and pink float alongside in a balanced arrangement suggesting rising achievement; the whole scene stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a confident, aspirational, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-17_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy trophy-like abstract shape in warm orange centered on a warm cream square background, radiating a balanced circular burst of small rounded star-shapes in teal, indigo, pink and yellow outward in every direction; every shape remains safely inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting create subtle depth and a proud, energetic, optimistic mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 18. Garajdan dünyaya `(post-18)`

**Dosya adı: `post-18_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream square canvas featuring a small soft rounded glossy seedling shape in teal at the base center, gently growing upward into a stylized rounded tree silhouette whose branches end in small glowing orb-shapes in orange, indigo, pink and yellow arranged in a balanced radial pattern; the entire tree stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with generous clearance from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving an inspirational, entrepreneurial, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-18_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy garage-door-like rectangle shape in teal centered on a warm cream square background, gently opening to reveal a burst of small rounded glowing light shapes in orange, indigo, pink and yellow spilling outward in a balanced radial pattern like an idea taking flight; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, well clear of all four edges; smooth gradients and soft cinematic lighting add subtle depth and an optimistic, entrepreneurial, energetic mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 19. İlk hafta `(post-19)`

**Dosya adı: `post-19_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream square canvas featuring a small soft rounded glossy figure-silhouette in teal standing beside a small rounded suitcase-shape in warm orange at the center, facing a gentle upward path of small glowing rounded signpost-dot shapes in indigo, pink and yellow leading forward in a balanced diagonal arrangement; the whole scene stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a hopeful, determined, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-19_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy compass-shape in teal centered on a warm cream square background, its needle gently glowing in warm orange and pointing toward a small cluster of rounded welcoming figure-shapes in indigo, pink and yellow arranged in a balanced arc nearby; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, well clear of all four edges; smooth gradients and soft cinematic lighting add subtle depth and a reassuring, guided, optimistic mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 20. Şehir elçisi `(post-20)`

**Dosya adı: `post-20_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream square canvas featuring a small soft rounded glossy key-shape in warm orange being gently passed between two rounded hand-silhouettes, one teal and one indigo, at the center of the frame, with a soft warm glow radiating from the point of exchange and a few small rounded location-pin accents in pink and yellow floating nearby in a balanced arrangement; the whole scene stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a trustworthy, welcoming, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-20_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy lighthouse-like beacon shape in teal centered on a warm cream square background, gently casting a warm beam of orange light outward in a balanced fan shape toward a few small rounded figure-silhouettes in indigo, pink and yellow approaching from one side; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, well clear of all four edges; smooth gradients and soft cinematic lighting add subtle depth and a guiding, reassuring, warm mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 21. Mahallenin Türk esnafı `(post-21)`

**Dosya adı: `post-21_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream square canvas featuring a small soft rounded glossy storefront shape in teal at the center, its blank rounded awning glowing gently in warm orange, flanked by small rounded string-light dot shapes in indigo, pink and yellow strung symmetrically above in a balanced arc; the storefront stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a bustling, authentic, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-21_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy shopping-bag shape in warm orange centered on a warm cream square background, gently glowing from within, surrounded by a balanced ring of small rounded storefront-icon shapes in teal, indigo, pink and yellow representing a thriving neighborhood of small businesses; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, well clear of all four edges; smooth gradients and soft cinematic lighting add subtle depth and a lively, supportive, optimistic mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 22. Kendi işini kur `(post-22)`

**Dosya adı: `post-22_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream square canvas featuring a soft rounded glossy teal storefront-card shape at the center, being gently arranged by two small rounded hand-silhouettes in warm orange, with a subtle glowing rounded blank sign-shape above radiating soft indigo and pink light, and a few small rounded product-box accents in yellow arranged neatly nearby; the whole scene stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a determined, empowering, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-22_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy seedling shape in teal growing out of a small rounded briefcase-shape in warm orange at the center of a warm cream square background, with a few small rounded upward arrow-accents in indigo, pink and yellow floating nearby in a balanced arrangement to suggest new business growth; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, well clear of all four edges; smooth gradients and soft cinematic lighting add subtle depth and a confident, hopeful, entrepreneurial mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 23. Erasmus macerası `(post-23)`

**Dosya adı: `post-23_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream square canvas featuring a small cluster of soft rounded glossy backpack shapes in teal, orange and indigo arranged in a balanced walking-line composition at the center, with a few small rounded confetti-like light specks in pink and yellow drifting playfully around them; the whole group stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a youthful, adventurous, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-23_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy open-book shape in teal centered on a warm cream square background, transforming gently at one end into a small rounded airplane silhouette in warm orange lifting off, with a balanced trail of small rounded sparkle-dots in indigo, pink and yellow following behind; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, well clear of all four edges; smooth gradients and soft cinematic lighting add subtle depth and an excited, hopeful, youthful mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 24. İlk diploma, ilk gurbet `(post-24)`

**Dosya adı: `post-24_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream square canvas featuring a soft rounded glossy graduation-cap shape in teal resting atop a small neat stack of rounded book-shapes in warm orange at the center, with a tiny rounded tulip-shaped glass silhouette in indigo placed beside it, and a few small rounded bokeh-light accents in pink and yellow softly blurred in the background in a balanced arrangement; the whole scene stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving an ambitious, warm, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-24_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy diploma-scroll shape in warm orange tied with a simple rounded ribbon-bow in teal, centered on a warm cream square background, gently radiating a balanced circular halo of small rounded star-accents in indigo, pink, blue and yellow; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, well clear of all four edges; smooth gradients and soft cinematic lighting add subtle depth and a proud, hopeful, warm mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 25. Doğru kişi, doğru an `(post-25)`

**Dosya adı: `post-25_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream square canvas featuring two soft rounded glossy puzzle-piece shapes, one teal and one warm orange, clicking together at the exact center, with a gentle golden-light spark glowing at the join and a few small rounded gear or node accents in indigo, pink and yellow floating nearby in a balanced arrangement to suggest professional connection; the whole composition stays centered and fully contained within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a clean, professional, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-25_p2.png`**

```
A premium modern editorial 3D illustration of a balanced circular arrangement of small rounded glossy hand-shapes in teal, orange, indigo, pink and yellow reaching toward a single glowing rounded handshake-point at the center of a warm cream square background, like a network converging at the right moment; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, well clear of all four edges; smooth gradients and soft cinematic lighting add subtle depth and a confident, timely, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 26. Bir tavsiye, bir kariyer `(post-26)`

**Dosya adı: `post-26_p1.png`**

```
A premium modern editorial 3D illustration of two smooth rounded figure shapes seated across a small rounded teal table from each other on a warm cream square canvas, one figure gently offering a glowing rounded lightbulb-shaped orb in golden-yellow light toward the other, with soft orange, indigo and pink accent shapes drifting around them in a balanced radial composition; both figures and the table stay comfortably centered and fully inside the square 1:1 frame at 1024x1024 recommended size, with generous margin from every edge; soft cinematic lighting creates smooth gradients and gentle shadows across the rounded forms, giving a warm, encouraging, polished professional feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `post-26_p2.png`**

```
A premium modern editorial 3D illustration of a rounded teal staircase made of soft glossy steps rising diagonally across a warm cream square background, with a small glowing golden-orange orb resting on the topmost step and a friendly rounded figure silhouette climbing from below, gently guided by a translucent indigo hand-shape reaching down from beside the staircase; pink and yellow sparkle accents drift near the top in a balanced composition; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the edges; smooth gradients and soft cinematic lighting add subtle depth and an optimistic, professional, encouraging mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 27. Kalabalıkta yalnızlık `(post-27)`

**Dosya adı: `post-27_p1.png`**

```
A premium modern editorial 3D illustration of a single small rounded teal figure silhouette standing alone at the center of a warm cream square canvas, surrounded by a loose ring of faint blurred cream-toned crowd-silhouette shapes fading softly toward the edges, with one small warm orange light-orb glowing gently in the distance behind the lone figure as a sign of hope; every shape remains fully inside the square 1:1 frame at 1024x1024 recommended size, well clear of all borders; soft cinematic lighting produces smooth gradients and subtle depth, giving a quiet, emotional yet ultimately hopeful and polished mood that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `post-27_p2.png`**

```
A premium modern editorial 3D illustration of a small rounded teal figure standing inside a soft translucent glass-like bubble at the center of a warm cream square background, with faint indigo and pink dotted outlines of other figures visible just outside the bubble, and one thin warm-yellow light thread gently connecting the bubble to a distant glowing orb, suggesting an invisible link waiting to form; the whole scene sits safely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the edges; smooth gradients and soft cinematic lighting add subtle depth and a wistful yet optimistic, polished mood suited to both a small card and a hero image; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 28. Buraya aitim `(post-28)`

**Dosya adı: `post-28_p1.png`**

```
A premium modern editorial 3D illustration of a balanced circle of small rounded glossy figure shapes in teal, orange, indigo, pink and yellow gathered closely around a small rounded warm-cream table at the center of a cream square canvas, with tiny rounded tea-glass shapes on the table glowing softly in golden light; the whole circular gathering is centered and scaled to stay fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle shadows across the rounded forms, giving a warm, joyful, polished, inclusive feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `post-28_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded teal house-shaped outline glowing gently at the center of a warm cream square background, with small rounded figure silhouettes in orange, blue, indigo and pink standing comfortably inside and around it like a family, and a warm golden-light halo surrounding the whole group; every shape is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting create subtle depth and a heartfelt, welcoming, professional mood suited to both a small card and a large hero image; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 29. Geri dönsem mi? `(post-29)`

**Dosya adı: `post-29_p1.png`**

```
A premium modern editorial 3D illustration of a soft rounded teal path forking into two smooth glossy trails on a warm cream square canvas, one trail leading toward a cluster of small rounded orange rooftop shapes and the other toward a cluster of small rounded indigo skyline shapes, with a single small rounded figure silhouette pausing thoughtfully at the fork where the paths meet; a gentle pink and yellow light glow softly marks the crossroad; every shape stays fully centered and inside the square 1:1 frame at 1024x1024 recommended size, with clear margin from every edge; soft cinematic lighting creates smooth gradients and subtle depth, giving a calm, contemplative, polished mood that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `post-29_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded compass shape rendered in glossy teal at the center of a warm cream square background, its needle gently wavering between two small glowing rounded markers, one in warm orange and one in indigo, with faint balanced rings of orange, pink and yellow light radiating outward to suggest careful deliberation; the compass and markers are scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a thoughtful, calm, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 30. İki vatan arası `(post-30)`

**Dosya adı: `post-30_p1.png`**

```
A premium modern editorial 3D illustration of a soft rounded heart shape split evenly down the middle on a warm cream square canvas, one half rendered in glossy teal with small rounded skyline shapes and the other half in warm orange with small rounded rooftop and hill shapes, joined seamlessly at the center by a thin glowing indigo seam of light, with a few small rounded bird shapes in pink and yellow gently flying across the seam; the whole heart is centered and scaled to stay fully within the square 1:1 frame at 1024x1024 recommended size, with clear margin from every edge; soft cinematic lighting creates smooth gradients and subtle depth, giving a warm, emotional, polished mood that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `post-30_p2.png`**

```
A premium modern editorial 3D illustration of two soft rounded landmass shapes, one teal and one warm orange, gently overlapping at the center of a warm cream square background like two halves of one whole, with a small glowing golden light-thread connecting their centers and a few rounded bird silhouettes in indigo and pink flying between them in a balanced arc; every shape is comfortably contained within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a warm, hopeful, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 31. Bir araya geldiğimizde `(post-31)`

**Dosya adı: `post-31_p1.png`**

```
A premium modern editorial 3D illustration of a balanced circular arrangement of small rounded glossy figure shapes in teal, orange, indigo, pink and yellow forming a lively gathering at the center of a warm cream square canvas, with a few soft rounded flag-shaped banners (plain, uncolored no pattern) fluttering gently above them and small confetti-like sparkle accents drifting around; the whole gathering is centered and scaled to stay fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle shadows across the rounded forms, giving a joyful, warm, polished, community-oriented feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `post-31_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded stage-platform shape in teal at the center of a warm cream square background, with small rounded dancing figure silhouettes in orange, indigo and pink arranged in a joyful circular formation on top, and a warm golden spotlight glow washing gently over the scene from above; every shape is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting create subtle depth and a festive, inclusive, polished mood suited to both a small card and a large hero image; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 32. Kültürümüz görünür olsun `(post-32)`

**Dosya adı: `post-32_p1.png`**

```
A premium modern editorial 3D illustration of a row of small rounded glossy market-stall shapes strung with soft glowing light-bulb garlands rendered as tiny rounded orange and yellow orbs, centered on a warm cream square canvas at dusk-inspired warm lighting, with small rounded steam-wisp shapes in teal rising gently from the stalls and a few pink and indigo sparkle accents floating above; the whole fair scene is scaled to stay fully within the square 1:1 frame at 1024x1024 recommended size, with clear margin from every edge; soft cinematic lighting creates smooth gradients and gentle glow, giving an energetic, festive, polished, culturally proud feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `post-32_p2.png`**

```
A premium modern editorial 3D illustration of a large soft rounded spotlight-circle shape in warm golden light at the center of a cream square background, revealing a balanced cluster of small rounded cultural-icon shapes in teal, orange, indigo and pink (simple abstract rounded forms suggesting music notes, a plate, a lantern) arranged like petals inside the light; every shape stays fully inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the edges; smooth gradients and soft cinematic lighting add subtle depth and a proud, vibrant, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 33. Taşınırken `(post-33)`

**Dosya adı: `post-33_p1.png`**

```
A premium modern editorial 3D illustration of a cluster of soft rounded glossy moving-box shapes stacked neatly at the center of a warm cream square canvas, one box in teal, others in orange, indigo and pink, with a small rounded armchair silhouette resting beside them and a gentle golden light-glow washing over the stack; the whole scene is centered and scaled to stay fully within the square 1:1 frame at 1024x1024 recommended size, with clear margin from every edge; soft cinematic lighting creates smooth gradients and gentle shadows across the rounded forms, giving a practical yet warm, polished, optimistic mood that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `post-33_p2.png`**

```
A premium modern editorial 3D illustration of two soft rounded glossy hand shapes, one teal and one warm orange, exchanging a small rounded armchair-shaped icon between them at the center of a cream square background, with a faint circular trust-badge glow in indigo forming behind the handoff and small yellow and pink sparkle accents nearby; every shape is comfortably centered and contained within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a trustworthy, practical, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 34. Sıfırdan yuva `(post-34)`

**Dosya adı: `post-34_p1.png`**

```
A premium modern editorial 3D illustration of a cozy soft rounded living-room scene at the center of a warm cream square canvas, featuring a small rounded teal sofa shape, a rounded orange shelf holding a simple rounded plant silhouette, and a small rounded rug shape below, all softly glowing under warm golden light; small pink and indigo sparkle accents drift gently above the scene; every element is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended size, with clear breathing room from every edge; soft cinematic lighting produces smooth gradients and subtle depth, giving a heartwarming, polished, optimistic home-building mood that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `post-34_p2.png`**

```
A premium modern editorial 3D illustration of a small rounded teal house-outline shape gradually filling with warm rounded furniture silhouettes in orange, indigo, pink and yellow floating gently into place inside it, centered on a warm cream square background, with a soft golden glow emanating from within the house as it comes together; every shape is comfortably contained within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a warm, hopeful, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 35. Cuma buluşması `(post-35)`

**Dosya adı: `post-35_p1.png`**

```
A premium modern editorial 3D illustration of a soft rounded dome-and-minaret silhouette shape rendered in gentle glossy teal, centered on a warm cream square canvas, with a balanced circle of small rounded figure silhouettes in orange, indigo, pink and yellow gathering peacefully around its base, and a warm golden-light halo glowing softly above the dome; every shape is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended size, with generous margin from every edge; soft cinematic lighting produces smooth gradients and subtle depth, giving a respectful, calm, polished, community-oriented mood that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `post-35_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded crescent-and-glow shape in warm golden light floating gently above a balanced circle of small rounded glossy figure silhouettes in teal, orange, indigo and pink standing together on a warm cream square background, evoking quiet togetherness; every element stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a peaceful, respectful, inclusive mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 36. Zor günde yanında `(post-36)`

**Dosya adı: `post-36_p1.png`**

```
A premium modern editorial 3D illustration of many soft rounded glossy hand shapes in teal, orange, indigo, pink and yellow reaching inward and joining together to form a supportive circle at the center of a warm cream square canvas, with a gentle warm golden-light glow radiating outward from the point where the hands meet; the whole circle of hands is centered and scaled to stay fully within the square 1:1 frame at 1024x1024 recommended size, with clear margin from every edge; soft cinematic lighting produces smooth gradients and subtle depth, giving a powerful, warm, polished, solidarity-driven mood that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `post-36_p2.png`**

```
A premium modern editorial 3D illustration of a single soft rounded teal hand shape gently cupping a small glowing golden-orange orb of light at the center of a warm cream square background, surrounded by a wider balanced ring of small rounded supportive hand silhouettes in indigo, pink and yellow reaching toward the center; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a reassuring, professional, warm mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 37. Gurbette milli maç `(post-37)`

**Dosya adı: `post-37_p1.png`**

```
A premium modern editorial 3D illustration of a balanced circular arrangement of small rounded glossy figure silhouettes in teal, orange, indigo, pink and yellow raising their rounded arms together like a cheering stadium crowd, centered on a warm cream square canvas, with a soft glowing golden-light burst radiating outward from the center like a celebrated goal moment; every shape stays fully inside the square 1:1 frame at 1024x1024 recommended size, with clear margin from every edge; soft cinematic lighting produces smooth gradients and subtle depth, giving an electric, joyful, polished, communal sports-passion mood that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `post-37_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy ball shape in teal flying through the air at the center of a warm cream square background, trailing a smooth arc of small rounded sparkle shapes in orange, indigo, pink and yellow, with a wide balanced ring of small rounded cheering figure silhouettes surrounding the scene like a stadium; every element is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and an energetic, festive, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 38. Aynı takım, aynı çatı `(post-38)`

**Dosya adı: `post-38_p1.png`**

```
A premium modern editorial 3D illustration of a small rounded glossy teal screen-shape at the center of a warm cream square canvas, with a balanced semicircle of small rounded glossy figure silhouettes in orange, indigo, pink and yellow gathered in front of it, arms raised together in celebration, and a few small rounded tea-glass shapes glowing warmly nearby; the whole scene is scaled to stay fully within the square 1:1 frame at 1024x1024 recommended size, with clear margin from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a lively, warm, polished, community-driven mood that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `post-38_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded circular rooftop-shape in teal at the center of a warm cream square background, sheltering a small balanced cluster of rounded figure silhouettes in orange, indigo, pink and yellow standing shoulder to shoulder underneath it like one family, with a gentle golden light glowing from within the shelter; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a warm, unifying, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 39. Görünmez ağı görünür kıl `(post-39)`

**Dosya adı: `post-39_p1.png`**

```
A premium modern editorial 3D illustration of a smooth rounded teal globe shape at the center of a warm cream square canvas, wrapped in a delicate glowing web of thin rounded connector-lines in orange, indigo, pink and yellow linking small softly pulsing node-orbs across its surface; the globe and its network stay comfortably centered and fully inside the square 1:1 frame at 1024x1024 recommended size, with generous margin from every edge; soft cinematic lighting creates smooth gradients and gentle glow across the rounded forms, giving a futuristic yet warm, polished, optimistic technology-brand feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `post-39_p2.png`**

```
A premium modern editorial 3D illustration of a balanced constellation of small rounded glossy node-orbs in teal, orange, indigo, pink and yellow connected by soft glowing thread-lines forming a gentle circular network pattern at the center of a warm cream square background, with one node pulsing slightly brighter to suggest active connection; every shape is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a modern, optimistic, professional technology mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 40. Tek aramada bul `(post-40)`

**Dosya adı: `post-40_p1.png`**

```
A premium modern editorial 3D illustration of a sleek rounded smartphone shape held upright at the center of a warm cream square canvas, its screen glowing softly with an abstract rounded search-bar shape in teal and small orbiting result-card shapes in orange, indigo, pink and yellow gently emerging above it; the phone and its glow stay comfortably centered and fully inside the square 1:1 frame at 1024x1024 recommended size, with clear margin from every edge; soft cinematic lighting creates smooth gradients and gentle highlights across the rounded forms, giving a clean, modern, polished technology-brand feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `post-40_p2.png`**

```
A premium modern editorial 3D illustration of a glossy rounded teal magnifying-glass shape hovering at the center of a warm cream square background, with a soft trail of small rounded profile-silhouette icons in orange, indigo, pink and yellow appearing to be drawn toward its lens in a balanced radial pattern; every shape is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and an efficient, optimistic, professional technology mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 41. Gurbette ebeveyn olmak `(post-41)`

**Dosya adı: `post-41_p1.png`**

```
A premium modern editorial 3D illustration of two soft rounded glossy parent-figure silhouettes in teal and orange gently pushing a small rounded stroller shape across a warm cream square canvas, with a tiny rounded pinwheel-toy shape in indigo, pink and yellow spinning playfully on the stroller and soft sunlight-inspired golden glow surrounding the scene; every shape stays fully centered and inside the square 1:1 frame at 1024x1024 recommended size, with clear margin from every edge; soft cinematic lighting creates smooth gradients and gentle shadows, giving a tender, warm, polished parenting mood that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `post-41_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded teal parent-figure silhouette holding hands with a small rounded child-figure silhouette at the center of a warm cream square background, surrounded by a loose balanced ring of small rounded supportive figure silhouettes in orange, indigo, pink and yellow standing nearby like a caring village; every element is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a warm, reassuring, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 42. Bir anne bir anneyi anlar `(post-42)`

**Dosya adı: `post-42_p1.png`**

```
A premium modern editorial 3D illustration of a balanced circle of small rounded glossy mother-figure silhouettes in teal, orange, indigo, pink and yellow sitting together on a warm cream square canvas, each gently holding or standing near a small rounded child-shape, with tiny rounded toy shapes scattered playfully between them and soft warm golden light washing over the gathering; the whole circle stays fully centered and inside the square 1:1 frame at 1024x1024 recommended size, with clear margin from every edge; soft cinematic lighting creates smooth gradients and gentle shadows, giving a warm, supportive, polished community mood that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `post-42_p2.png`**

```
A premium modern editorial 3D illustration of two soft rounded glossy mother-figure silhouettes, one teal and one warm orange, sitting close together sharing a small rounded tea-cup shape between them at the center of a cream square background, with gentle indigo, pink and yellow heart-shaped sparkle accents floating softly above them; every shape is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a warm, reassuring, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 43. Yaz geldi, yollar açıldı `(post-43)`

**Dosya adı: `post-43_p1.png`**

```
A premium modern editorial 3D illustration of a small rounded glossy teal car shape driving along a soft winding rounded road at the center of a warm cream square canvas, packed with tiny rounded luggage shapes in orange and pink on its roof, heading toward a cluster of small rounded coastal-hill shapes in indigo and yellow glowing with warm golden sunset light; every shape stays fully centered and inside the square 1:1 frame at 1024x1024 recommended size, with clear margin from every edge; soft cinematic lighting creates smooth gradients and gentle shadows, giving a joyful, warm, polished summer-journey mood that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `post-43_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded suitcase shape in teal standing open at the center of a warm cream square background, with small rounded sun-ray shapes in golden-orange radiating gently behind it and tiny rounded seashell and wave-shaped accents in indigo, pink and yellow scattered nearby; every element is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a joyful, anticipatory, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 44. Sılaya selam `(post-44)`

**Dosya adı: `post-44_p1.png`**

```
A premium modern editorial 3D illustration of a soft rounded airplane-window shape at the center of a warm cream square canvas, framing a gentle glimpse of small rounded coastline-hill shapes in teal and orange bathed in warm golden sunrise light, with soft rounded cloud-puff shapes in indigo, pink and yellow drifting around the window frame; the whole scene stays fully centered and inside the square 1:1 frame at 1024x1024 recommended size, with clear margin from every edge; soft cinematic lighting creates smooth gradients and gentle glow, giving an emotional, warm, polished homecoming mood that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `post-44_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded heart-shaped cloud floating at the center of a warm cream square background, glowing gently in golden-orange light, with a small rounded airplane silhouette in teal passing just beneath it and faint indigo, pink and yellow light-ray accents radiating outward; every shape is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a tender, nostalgic, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 45. Güvenle al, güvenle sat `(post-45)`

**Dosya adı: `post-45_p1.png`**

```
A premium modern editorial 3D illustration of a neat balanced flat-lay arrangement of small rounded glossy object shapes (a simple rounded chair silhouette, a rounded book stack, a rounded electronics-box shape) in teal, orange, indigo, pink and yellow spaced evenly across a warm cream square canvas, with a small rounded trust-badge glow in golden light hovering above the center; every shape stays fully inside the square 1:1 frame at 1024x1024 recommended size, with clear margin from every edge; soft cinematic lighting creates smooth gradients and gentle shadows, giving a clean, trustworthy, polished marketplace mood that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `post-45_p2.png`**

```
A premium modern editorial 3D illustration of two soft rounded glossy hand shapes, one teal and one warm orange, exchanging a small glowing rounded shield-shaped trust badge at the center of a cream square background, with faint indigo, pink and yellow sparkle accents drifting around the handoff; every shape is comfortably centered and contained within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a reassuring, professional, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 46. Şehrinin nabzı `(post-46)`

**Dosya adı: `post-46_p1.png`**

```
A premium modern editorial 3D illustration of a stylized cluster of small rounded glossy rooftop shapes forming a friendly skyline at the bottom of a warm cream square canvas, with small rounded feed-card shapes in orange, indigo, pink and yellow gently floating upward above the rooftops like a lively activity stream, and soft golden light connecting the cards to a small pulsing teal notification-dot at the top; every shape stays fully centered and inside the square 1:1 frame at 1024x1024 recommended size, with clear margin from every edge; soft cinematic lighting creates smooth gradients and gentle glow, giving a dynamic, warm, polished, community-feed mood that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `post-46_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded teal heartbeat-pulse line looping gently through a small stylized skyline made of rounded rooftop shapes in orange, indigo and pink, centered on a warm cream square background, with small yellow sparkle accents marking each pulse peak; every element is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a lively, local, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 47. Gurbetin güçlü kadınları `(post-47)`

**Dosya adı: `post-47_p1.png`**

```
A premium modern editorial 3D illustration of a single confident soft rounded glossy female figure silhouette in teal standing centered on a warm cream square canvas, looking forward with quiet strength, softly rim-lit with warm golden light along her edges, surrounded by a balanced ring of small rounded sparkle accents in orange, indigo, pink and yellow; the figure stays fully centered and inside the square 1:1 frame at 1024x1024 recommended size, with clear margin from every edge; soft cinematic lighting creates smooth gradients and gentle glow, giving an empowering, warm, polished mood that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `post-47_p2.png`**

```
A premium modern editorial 3D illustration of a balanced circle of small rounded glossy female figure silhouettes in teal, orange, indigo, pink and yellow standing shoulder to shoulder at the center of a warm cream square background, each softly glowing with a shared warm golden light connecting them like a support network; every shape is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and an empowering, inclusive, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 48. İlk kuşağın hatırı `(post-48)`

**Dosya adı: `post-48_p1.png`**

```
A premium modern editorial 3D illustration of a pair of soft rounded glossy elderly hand shapes in warm orange gently holding a small rounded tea-glass shape and a small rounded photograph-frame shape at the center of a warm cream square canvas, with a faint respectful teal glow surrounding the hands and soft pink and yellow memory-sparkle accents drifting nearby; every shape stays fully centered and inside the square 1:1 frame at 1024x1024 recommended size, with clear margin from every edge; soft cinematic lighting creates smooth gradients and gentle warmth, giving a nostalgic, respectful, polished mood that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `post-48_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded tree-shape rendered in glossy teal at the center of a warm cream square background, its roots glowing gently in warm golden light and its branches holding small rounded leaf-shapes in orange, indigo, pink and yellow, symbolizing generations connected to shared roots; every element is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a respectful, warm, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 49. Bir dizin değil, yaşayan bir ağ `(post-49)`

**Dosya adı: `post-49_p1.png`**

```
A premium modern editorial 3D illustration of a breathtaking balanced network of small rounded glossy people-icon nodes in teal, orange, indigo, pink and yellow interconnected by thin glowing lines forming a gentle globe-like sphere shape at the center of a warm cream square canvas, with a few main hub-nodes pulsing softly brighter in warm golden light; the whole network stays fully centered and inside the square 1:1 frame at 1024x1024 recommended size, with clear margin from every edge; soft cinematic lighting creates smooth gradients and gentle glow, giving a bold, inspirational, polished, living-network mood that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `post-49_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded teal tree-of-life shape at the center of a warm cream square background, its branches ending in small glowing rounded node-orbs in orange, indigo, pink and yellow that pulse gently like a living network, with soft golden light flowing through the trunk to every branch; every shape is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and an inspirational, unifying, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 50. Sen de bu ağın parçası ol `(post-50)`

**Dosya adı: `post-50_p1.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy teal hand shape reaching gently toward a glowing rounded network-sphere shape at the center of a warm cream square canvas, the sphere lighting up in warm golden-orange with small rounded connection-lines in indigo, pink and yellow radiating outward upon the touch; the whole scene stays fully centered and inside the square 1:1 frame at 1024x1024 recommended size, with clear margin from every edge; soft cinematic lighting creates smooth gradients and gentle glow, giving an uplifting, warm, polished, inviting call-to-action mood that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `post-50_p2.png`**

```
A premium modern editorial 3D illustration of a balanced circle of small rounded glossy figure silhouettes in teal, orange, indigo, pink and yellow standing evenly spaced around a glowing warm golden-light core at the center of a cream square background, each figure connected to the core by a thin soft light-thread, with one figure gesturing warmly toward an open spot in the circle as if inviting someone new to join; every shape is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and an inviting, optimistic, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 51. Cadde'de bugün ne konuşuluyor `(post-51)`

**Dosya adı: `post-51_p1.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy teal street-shape winding gently across a warm cream square canvas, lined with small rounded glowing window shapes in orange, indigo, pink and yellow like a friendly evening street coming alive with conversation, all fully centered and contained within the square 1:1 frame at 1024x1024 recommended size with generous margin from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a warm, communal, polished editorial-illustration feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-51_p2.png`**

```
A premium modern editorial 3D illustration of several small rounded glossy speech-bubble shapes in teal, orange, indigo and pink floating in a relaxed cluster above a warm cream square background, gently overlapping like an ongoing lively conversation, with soft golden-yellow light glowing from the center of the cluster; every shape stays safely inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the edges; smooth gradients and soft cinematic lighting add subtle depth and an inviting, social, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 52. Çarşı: birbirimizden alışveriş `(post-52)`

**Dosya adı: `post-52_p1.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy teal storefront-arch shape at the center of a warm cream square canvas, with small rounded glowing product-box shapes in orange, indigo, pink and yellow arranged in a gentle row beneath it like a friendly little marketplace, everything comfortably centered and inside the square 1:1 frame at 1024x1024 recommended size, clear of all edges; soft cinematic lighting produces smooth gradients and gentle depth, giving a warm, entrepreneurial, polished editorial-illustration feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-52_p2.png`**

```
A premium modern editorial 3D illustration of a balanced circular arrangement of small rounded glossy handshake-shapes and shopping-bag shapes in teal, orange, indigo, pink and yellow orbiting a soft warm golden-light core at the center of a cream square background, suggesting trusted trade between neighbors; every shape stays safely within the square 1:1 frame at 1024x1024 recommended resolution with generous clearance from the borders; smooth gradients and soft cinematic lighting add subtle depth and an optimistic, communal, polished mood; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 53. Diaspora haberlerini tek yerde takip et `(post-53)`

**Dosya adı: `post-53_p1.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy teal radar-dish shape at the center of a warm cream square canvas, gently sweeping a warm golden-orange beam across a scattering of small rounded news-card shapes in indigo, pink and yellow around it; the whole composition stays centered and fully inside the square 1:1 frame at 1024x1024 recommended size with clear margin from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving an alert, informative, polished editorial-illustration feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-53_p2.png`**

```
A premium modern editorial 3D illustration of concentric soft rounded glossy ring-shapes in teal, radiating outward like calm radar pulses from a warm glowing golden core at the exact center of a cream square background, with a few small rounded pin-shapes in orange, indigo and pink resting along the outer rings to suggest detected updates; every element sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a calm, trustworthy, polished technology mood; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 54. Ülke rehberleri: ilk elden bilgi `(post-54)`

**Dosya adı: `post-54_p1.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy teal open-book shape at the center of a warm cream square canvas, its pages glowing with a gentle warm gradient of orange and golden light, surrounded by small rounded location-pin shapes in indigo, pink and yellow floating like chapters about different places; the whole scene stays fully centered and contained within the square 1:1 frame at 1024x1024 recommended size, clear of all edges; soft cinematic lighting produces smooth gradients and gentle depth, giving a warm, informative, polished editorial-illustration feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-54_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy compass shape resting on a stack of small rounded page-shapes in teal, orange and indigo at the center of a warm cream square background, with a gentle golden-light glow rising from the pages like helpful guidance; every element sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the edges; smooth gradients and soft cinematic lighting add subtle depth and a trustworthy, welcoming, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 55. Tanıdığını davet et, birlikte büyüyün `(post-55)`

**Dosya adı: `post-55_p1.png`**

```
A premium modern editorial 3D illustration of two soft rounded glossy figure-silhouettes, one teal and one warm orange, standing close together at the center of a warm cream square canvas with a small rounded gift-box shape glowing in golden light held between them, surrounded by a few small rounded star-shapes in indigo, pink and yellow drifting gently upward to celebrate the moment; the whole scene stays centered and fully inside the square 1:1 frame at 1024x1024 recommended size with clear margin from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a warm, celebratory, polished editorial-illustration feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-55_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy chain-link shape made of two interlocking rounded loops, one teal and one warm orange, glowing gently at the center of a cream square background, with small rounded confetti-shapes in indigo, pink and yellow scattered lightly around it in a balanced pattern; every shape stays safely inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and an inviting, rewarding, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 56. Bulunduğun şehirde kariyer fırsatı `(post-56)`

**Dosya adı: `post-56_p1.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy teal briefcase shape at the center of a warm cream square canvas, its lid gently opening to release a warm golden-orange glow with small rounded upward-arrow shapes in indigo, pink and yellow rising from it like career growth; the whole composition stays centered and fully inside the square 1:1 frame at 1024x1024 recommended size with generous clearance from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving an ambitious, optimistic, polished editorial-illustration feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-56_p2.png`**

```
A premium modern editorial 3D illustration of a balanced staircase made of small rounded glossy step-shapes in teal, orange, indigo, pink and yellow ascending gently toward a soft glowing golden light at the top, centered on a warm cream square background; every step stays safely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and an aspirational, encouraging, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 57. Nerede olursan ol, kariyerin seninle `(post-57)`

**Dosya adı: `post-57_p1.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy teal laptop shape floating at the center of a warm cream square canvas, its screen glowing with a gentle warm orange-to-pink gradient, with small rounded location-pin shapes in indigo and yellow scattered lightly around it to suggest working from anywhere; the whole scene stays fully centered and contained within the square 1:1 frame at 1024x1024 recommended size, clear of every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a modern, flexible, polished editorial-illustration feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-57_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy globe shape at the center of a cream square background with a small warm orange glowing dot resting comfortably on its surface, connected by a thin soft light-thread to a small rounded laptop-shape floating just above it, suggesting remote work tethered gently to home; every element sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a calm, modern, polished mood; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 58. Kalabalık bir şehirde yalnız olmak `(post-58)`

**Dosya adı: `post-58_p1.png`**

```
A premium modern editorial 3D illustration of a single small rounded glossy teal figure-silhouette standing at the center of a warm cream square canvas, surrounded by a soft blurred cluster of small rounded building-shapes in muted indigo and grey, with one gentle warm golden-orange light beam reaching toward the figure from the edge of the frame like a quiet invitation; the whole composition stays centered and fully inside the square 1:1 frame at 1024x1024 recommended size with generous margin from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a reflective yet hopeful, polished editorial-illustration feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-58_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy teal figure-silhouette slowly turning toward a small warm cluster of rounded figure-shapes in orange, indigo, pink and yellow gathered a short distance away on a cream square background, a thin soft golden-light path connecting them; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a gentle, reassuring, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 59. İkinci kuşağın kimlik arayışı `(post-59)`

**Dosya adı: `post-59_p1.png`**

```
A premium modern editorial 3D illustration of two soft rounded glossy figure-silhouettes of different sizes, a smaller warm orange one and a larger teal one, standing side by side at the center of a warm cream square canvas, with a thin soft golden-light thread connecting their hearts and a few small rounded cultural-symbol-neutral shapes (rounded stars and simple geometric motifs) in indigo, pink and yellow floating gently between them; the whole scene stays fully centered and contained within the square 1:1 frame at 1024x1024 recommended size, clear of every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a warm, intergenerational, polished editorial-illustration feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-59_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy tree shape with two branches, one reaching toward a warm orange glow and one toward a cool teal glow, centered on a cream square background, its roots rendered as small rounded glossy shapes in indigo and yellow; every element sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a rooted, hopeful, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 60. Ana dilini kaybetme korkusu `(post-60)`

**Dosya adı: `post-60_p1.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy teal speech-bubble shape at the center of a warm cream square canvas, slowly fading at one edge into soft translucent mist while the rest glows warmly in orange and golden light, with a few small rounded letter-like abstract shapes (non-readable, purely decorative rounded marks) in indigo, pink and yellow drifting gently around it; the whole composition stays centered and fully inside the square 1:1 frame at 1024x1024 recommended size with generous clearance from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a tender, reflective, polished editorial-illustration feel that reads clearly at small thumbnail size; absolutely no real text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-60_p2.png`**

```
A premium modern editorial 3D illustration of two soft rounded glossy speech-bubble shapes, one warm orange and one teal, gently overlapping at the center of a cream square background with a soft golden-light glow where they meet, surrounded by a light scatter of small rounded abstract decorative marks in indigo, pink and yellow; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a warm, connective, polished mood; no real text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 61. Memlekete dönüş sonrası boşluk `(post-61)`

**Dosya adı: `post-61_p1.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy teal suitcase shape at the center of a warm cream square canvas, half open with a warm golden-orange glow spilling softly out like a fading memory, and a single small rounded airplane-shape in indigo drawn faintly departing toward the edge of the frame; the whole scene stays fully centered and contained within the square 1:1 frame at 1024x1024 recommended size, clear of every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a bittersweet, reflective, polished editorial-illustration feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-61_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy calendar-page shape at the center of a cream square background, one corner gently curling upward and glowing warm orange like time passing, with a small rounded heart-shape in pink resting quietly beside it; every element sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a tender, nostalgic, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 62. Küçük işletmeni diasporaya duyur `(post-62)`

**Dosya adı: `post-62_p1.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy teal shop-sign shape at the center of a warm cream square canvas, glowing warmly with orange and golden light, with small rounded megaphone-like shapes in indigo, pink and yellow gently radiating soft sound-wave arcs outward to suggest visibility spreading; the whole composition stays centered and fully inside the square 1:1 frame at 1024x1024 recommended size with generous margin from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving an encouraging, entrepreneurial, polished editorial-illustration feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-62_p2.png`**

```
A premium modern editorial 3D illustration of a small rounded glossy storefront shape in teal at the center of a cream square background, with a soft warm golden-light beam expanding outward in a gentle cone toward a scatter of small rounded figure-silhouettes in orange, indigo, pink and yellow representing potential customers; every shape stays safely inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and an optimistic, growth-oriented, polished mood; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 63. Yurt dışında öğrenci olmak `(post-63)`

**Dosya adı: `post-63_p1.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy teal graduation-cap shape at the center of a warm cream square canvas, gently tilted with a warm golden-orange glow rising from it like fresh ambition, surrounded by a few small rounded book-shapes in indigo, pink and yellow arranged in a loose circle; the whole scene stays fully centered and contained within the square 1:1 frame at 1024x1024 recommended size, clear of every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a hopeful, youthful, polished editorial-illustration feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-63_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy backpack shape in teal resting at the center of a cream square background, with a small rounded compass-shape in warm orange glowing gently on top of it, and a few small rounded paper-airplane shapes in indigo, pink and yellow drifting upward around it to suggest new beginnings; every element sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and an optimistic, adventurous, polished mood; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 64. Bir adım önde olanın deneyimi `(post-64)`

**Dosya adı: `post-64_p1.png`**

```
A premium modern editorial 3D illustration of two soft rounded glossy figure-silhouettes standing on gently different height platforms, a taller teal figure extending a warm golden-orange light-hand down to a smaller orange figure reaching up, centered on a warm cream square canvas; the whole composition stays centered and fully inside the square 1:1 frame at 1024x1024 recommended size with generous clearance from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a supportive, encouraging, polished editorial-illustration feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-64_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy lantern shape in warm orange floating above a smaller rounded figure-silhouette in teal on a cream square background, casting a gentle golden-light path forward for the figure to follow; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a guiding, warm, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 65. Şehrindeki bir sonraki buluşma `(post-65)`

**Dosya adı: `post-65_p1.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy teal calendar-pin shape glowing warmly at the center of a warm cream square canvas, with several small rounded glossy figure-silhouettes in orange, indigo, pink and yellow gathered in a loose friendly cluster beneath it as if arriving for a gathering; the whole scene stays fully centered and contained within the square 1:1 frame at 1024x1024 recommended size, clear of every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a lively, communal, polished editorial-illustration feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-65_p2.png`**

```
A premium modern editorial 3D illustration of a balanced circle of small rounded glossy figure-silhouettes in teal, orange, indigo, pink and yellow standing around a soft glowing warm golden-light gathering point at the center of a cream square background, as if meeting up in person; every shape stays safely inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a warm, social, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 66. Gurbette kadın olmak, gurbette güçlenmek `(post-66)`

**Dosya adı: `post-66_p1.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy warm orange figure-silhouette standing confidently at the center of a warm cream square canvas, gently haloed by a ring of small rounded glossy support-shapes in teal, indigo, pink and yellow forming a protective circle around her; the whole composition stays centered and fully inside the square 1:1 frame at 1024x1024 recommended size with generous margin from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving an empowering, warm, polished editorial-illustration feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-66_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy flower shape made of small rounded petal-forms in teal, orange, indigo, pink and yellow blooming outward from a warm golden-light center on a cream square background, suggesting collective strength growing together; every shape stays safely inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and an empowering, warm, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 67. Şehrinin gönüllü temsilcisi ol `(post-67)`

**Dosya adı: `post-67_p1.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy teal figure-silhouette standing proudly at the center of a warm cream square canvas holding a small rounded glowing flag-shape (plain, no emblem) in warm orange, with a few small rounded location-pin shapes in indigo, pink and yellow arranged loosely around as if marking a territory of welcome; the whole scene stays fully centered and contained within the square 1:1 frame at 1024x1024 recommended size, clear of every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a proud, welcoming, polished editorial-illustration feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-67_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy compass-star shape in warm orange at the center of a cream square background, radiating a few thin soft golden-light beams toward small rounded building-silhouettes in teal, indigo and pink arranged around it like a welcoming host pointing the way; every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a proud, hospitable, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 68. 251 ülke, tek bir ağ `(post-68)`

**Dosya adı: `post-68_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream-colored world globe rendered in soft rounded geometry at the center of a warm cream square canvas, with hundreds of tiny soft glowing dot-shapes in teal, orange, indigo, pink and yellow scattered evenly across its surface like a vast connected network, a few thin soft light-threads linking nearby dots together; the globe is perfectly centered and sits safely inside the square 1:1 frame at 1024x1024 recommended resolution, with generous padding so nothing touches or crosses the edges; soft cinematic studio lighting casts smooth gradients and gentle shadows, giving the scene a grand, unifying, polished feel that reads clearly at small thumbnail size; the mood is ambitious, warm and inclusive; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `post-68_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy network-sphere shape glowing warmly at the exact center of a cream square canvas, with dozens of thin soft light-threads radiating outward to small rounded glossy location-pin shapes in teal, orange, indigo, pink and yellow scattered in a balanced pattern across the frame; every element stays fully within the square 1:1 frame at 1024x1024 recommended size, well clear of all four edges; smooth gradients and soft cinematic lighting produce subtle depth and a grand, optimistic, polished technology-brand mood that stays legible at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

## Test Araçları (`tests`) — 10 kalem

### 01. Hangi Ülke Sana Uygun? `(test-tool-1)`

**Varyant 1 (v1):**

**Dosya adı: `test-tool-1_v1_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream-colored globe rendered in smooth rounded geometry at the exact center of a square 1:1 frame recommended at 1024x1024 pixels, with several small glossy rounded location-pin shapes in teal, orange, indigo and yellow scattered across its surface and one pin gently glowing brighter than the rest to suggest a best match, soft cinematic lighting casting smooth gradients and gentle depth across the warm cream background, the composition centered and balanced with generous margin so no pin or edge of the globe touches the frame border, clear single visual hierarchy that reads instantly at thumbnail size, a hopeful and optimistic professional SaaS aesthetic suitable for both a website card and a hero banner, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `test-tool-1_v1_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded teal compass needle floating above a stylized cluster of rounded landmass shapes rendered in orange, indigo, pink and yellow on a warm cream square background, the needle tip haloed in gentle golden light as it settles toward one landmass to suggest a decision being made, the whole scene scaled and centered so every shape sits safely inside the square 1:1 frame at 1024x1024 recommended resolution with clear space before all four edges, smooth gradients and soft cinematic lighting adding subtle depth to the rounded friendly forms, a calm decision-making mood balanced with an optimistic and inclusive tone that remains legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 2 (v2):**

**Dosya adı: `test-tool-1_v2_p1.png`**

```
A premium modern editorial 3D illustration of a smooth rounded radar-scan arc sweeping in soft teal light across a warm cream square background dotted with small glossy rounded shapes in orange, blue, pink and yellow representing candidate destinations, one shape lighting up with a warm golden glow as the sweep passes over it to mark the match, the entire scene centered and comfortably contained inside the square 1:1 frame at 1024x1024 recommended size with ample clearance from every edge, soft cinematic lighting producing gentle gradients and subtle depth, an inclusive and optimistic technology-brand feel that stays clear at small thumbnail scale, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `test-tool-1_v2_p2.png`**

```
A premium modern editorial 3D illustration of three softly rounded lifestyle vignette cards in orange, indigo and teal floating in a balanced triangular arrangement around a central glowing cream sphere at the middle of a square 1:1 canvas recommended at 1024x1024 pixels, each card hinting at a different way of life through simple rounded silhouette shapes (a skyline, a small house, a sunny coastline) without any fine detail, the whole composition scaled with generous margin so nothing touches the frame border, smooth gradients and soft cinematic lighting giving gentle depth and a polished, friendly SaaS aesthetic that reads instantly at thumbnail size, a warm and welcoming mood, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 3 (v3):**

**Dosya adı: `test-tool-1_v3_p1.png`**

```
A premium modern editorial 3D illustration of a central glowing cream-and-teal globe surrounded by a balanced ring of small rounded lifestyle icon-cards in orange, blue, pink and yellow (a tiny house, a leaf, a sun, a briefcase, all simplified without detail) floating like petals around it on a warm cream square background, the whole bloom perfectly centered inside the square 1:1 frame at 1024x1024 recommended size with clear space from all four edges, soft cinematic lighting creating smooth gradients and gentle shadows for subtle depth, a rich yet uncluttered composition that reads clearly at thumbnail size, an optimistic and exploratory mood, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `test-tool-1_v3_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded decision-tree shape made of glowing teal branches spreading from a single trunk toward several small orange, indigo, pink and yellow destination orbs at a warm cream square canvas, one orb slightly larger and haloed in gentle light to mark the top recommendation, the whole tree scaled and centered so every branch and orb stays fully inside the square 1:1 frame at 1024x1024 recommended resolution without touching the border, smooth gradients and soft cinematic lighting adding subtle depth to the rounded friendly forms, a clear and strategic yet warm mood that remains legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 02. Mesleğin Dünyada Ne Kazandırıyor? `(test-tool-2)`

**Varyant 1 (v1):**

**Dosya adı: `test-tool-2_v1_p1.png`**

```
A premium modern editorial 3D illustration of a balanced row of smooth rounded glossy column shapes of varying heights in teal, orange, indigo and yellow rising from a warm cream square base at the center of a square 1:1 frame recommended at 1024x1024 pixels, the tallest column softly haloed in golden light to draw the eye, each column scaled so its top and sides stay well clear of the frame border, soft cinematic lighting creating smooth gradients and gentle shadows for subtle depth, a clean single visual hierarchy that reads instantly at thumbnail size, a confident and optimistic professional mood suited to both a website card and hero image, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `test-tool-2_v1_p2.png`**

```
A premium modern editorial 3D illustration of a smooth rounded balance scale rendered in glossy teal light at the center of a warm cream square background, one pan holding a small glowing rounded coin-stack shape in golden-orange and the other holding a tiny rounded house shape in indigo to suggest weighing pay against cost of living, the scale perfectly level and centered with clear margin from every edge of the square 1:1 frame at 1024x1024 recommended resolution, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a thoughtful and balanced mood that remains legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 2 (v2):**

**Dosya adı: `test-tool-2_v2_p1.png`**

```
A premium modern editorial 3D illustration of a smooth rounded glossy purchasing-power gauge shaped like a soft arc, filled with warm teal light rising toward a bright zone, small rounded icon-shapes of a coin and a tiny house in orange and indigo resting at either end of the arc on a warm cream square background, the whole gauge centered and scaled to sit safely inside the square 1:1 frame at 1024x1024 recommended size with clear space from all edges, soft cinematic lighting producing smooth gradients and subtle depth, a clear and reassuring financial-clarity mood that reads well at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `test-tool-2_v2_p2.png`**

```
A premium modern editorial 3D illustration of a glossy rounded wallet shape in teal at the center of a warm cream square canvas, gently opening to release a soft glowing cascade of small rounded coin shapes in orange, yellow and pink that arc upward and settle around it in a balanced circular pattern, every coin and the wallet itself kept comfortably inside the square 1:1 frame at 1024x1024 recommended resolution without touching the border, smooth gradients and soft cinematic lighting giving gentle depth and a polished, optimistic financial mood that stays legible at small thumbnail scale, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 3 (v3):**

**Dosya adı: `test-tool-2_v3_p1.png`**

```
A premium modern editorial 3D illustration of a smooth rounded glossy briefcase in teal at the center of a warm cream square background, with soft glowing pathways in orange, indigo and pink branching out from it toward several small rounded skyline silhouettes of varying brightness, the brightest skyline haloed in warm golden light to indicate the top opportunity, the entire scene scaled and centered so all paths and skylines remain fully within the square 1:1 frame at 1024x1024 recommended size with generous edge clearance, smooth gradients and soft cinematic lighting adding subtle depth, an ambitious and hopeful career-growth mood legible at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `test-tool-2_v3_p2.png`**

```
A premium modern editorial 3D illustration of a rounded glossy globe made of soft teal glass sitting on a warm cream square canvas, with a gentle ring of small rounded coin-stack shapes in orange, yellow and pink orbiting around its equator at varying heights to represent differing pay levels by region, the globe and every orbiting shape centered and scaled to remain safely inside the square 1:1 frame at 1024x1024 recommended resolution, soft cinematic lighting casting smooth gradients and gentle shadows for subtle depth, a worldly and optimistic professional mood that reads clearly at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 03. Yurt Dışına Taşınmaya Hazır mısın? `(test-tool-3)`

**Varyant 1 (v1):**

**Dosya adı: `test-tool-3_v1_p1.png`**

```
A premium modern editorial 3D illustration of a smooth rounded glossy readiness gauge shaped like a speedometer arc, filling with warm teal light toward a bright golden zone, small rounded icon shapes of a suitcase, a document and a speech bubble in orange, indigo and pink arranged evenly around the gauge on a warm cream square background, the whole composition centered and scaled to sit safely inside the square 1:1 frame at 1024x1024 recommended size with clear margin from every edge, soft cinematic lighting producing smooth gradients and subtle depth, a motivating self-assessment mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `test-tool-3_v1_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy suitcase in teal standing open at the center of a warm cream square canvas, with small rounded checkmark shapes in orange, yellow and pink gently floating up out of it like confirmations, arranged in a balanced radial pattern above the suitcase, every element scaled to remain comfortably inside the square 1:1 frame at 1024x1024 recommended resolution without touching the border, smooth gradients and soft cinematic lighting adding gentle depth to the rounded friendly forms, a reassuring and prepared mood that stays legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 2 (v2):**

**Dosya adı: `test-tool-3_v2_p1.png`**

```
A premium modern editorial 3D illustration of a smooth rounded glossy checklist made of soft glowing checkmark shapes in teal, orange and yellow floating above a partially packed open suitcase rendered in warm cream and indigo tones at the center of a square 1:1 frame recommended at 1024x1024 pixels, the checkmarks arranged in a tidy balanced column with clear space above and to the sides so nothing touches the frame edge, soft cinematic lighting creating smooth gradients and gentle shadows for subtle depth, an organized and confident preparation mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `test-tool-3_v2_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy scale balancing a small glowing courage-flame shape in orange on one side and a stack of rounded document shapes in teal on the other, centered on a warm cream square background, perfectly level to suggest weighing bravery against practical readiness, the whole scale scaled and centered so it remains fully inside the square 1:1 frame at 1024x1024 recommended resolution with generous margin from the border, smooth gradients and soft cinematic lighting adding subtle depth to the rounded forms, a thoughtful and encouraging mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 3 (v3):**

**Dosya adı: `test-tool-3_v3_p1.png`**

```
A premium modern editorial 3D illustration of a soft rounded silhouette figure in glossy teal standing confidently at a glowing doorway of golden-orange light on a warm cream square background, one foot stepping from a dim indigo room into a bright path lined with small rounded milestone dots, the entire scene centered and scaled so the figure and doorway stay fully inside the square 1:1 frame at 1024x1024 recommended size with clear space from all edges, soft cinematic lighting producing smooth gradients and gentle depth, a hopeful and courageous mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `test-tool-3_v3_p2.png`**

```
A premium modern editorial 3D illustration of four small rounded glowing pillar shapes in teal, orange, indigo and pink standing evenly spaced on a warm cream square canvas, each pillar topped with a simple rounded icon (a coin, a speech bubble, a handshake, a heart) representing different readiness dimensions, one pillar slightly taller and haloed in golden light to show relative strength, the whole row centered and scaled to remain safely inside the square 1:1 frame at 1024x1024 recommended resolution without touching the border, smooth gradients and soft cinematic lighting adding subtle depth, a balanced and encouraging self-assessment mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 04. Hangi Şehir Sana Daha Uygun? `(test-tool-4)`

**Varyant 1 (v1):**

**Dosya adı: `test-tool-4_v1_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream square map dotted with several small rounded glowing city-marker shapes in teal, orange, indigo and pink connected by soft light lines, one marker pulsing brighter with a golden halo to show the best match, all markers and connecting lines centered and scaled to stay fully within the square 1:1 frame at 1024x1024 recommended size with clear space from every edge, soft cinematic lighting producing smooth gradients and subtle depth, a clear single visual hierarchy that reads instantly at thumbnail size, an optimistic city-discovery mood, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `test-tool-4_v1_p2.png`**

```
A premium modern editorial 3D illustration of three soft rounded glossy city-skyline silhouettes in teal, orange and indigo of slightly varying heights standing side by side on a warm cream square canvas, arranged on a gentle rounded podium shape with the tallest skyline centered and haloed in warm golden light, the whole scene scaled and centered so every skyline and podium edge stays safely inside the square 1:1 frame at 1024x1024 recommended resolution, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a celebratory ranking mood that reads clearly at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 2 (v2):**

**Dosya adı: `test-tool-4_v2_p1.png`**

```
A premium modern editorial 3D illustration of a smooth rounded glossy magnifying glass in teal glass hovering over a cluster of small rounded neighborhood shapes in orange, indigo, pink and yellow arranged on a warm cream square background, each tiny shape topped with an even simpler icon (a briefcase, a leaf, a sun, a handshake) representing different city qualities, the magnifier and cluster centered and scaled to remain fully inside the square 1:1 frame at 1024x1024 recommended size with generous edge clearance, soft cinematic lighting producing smooth gradients and subtle depth, a curious and analytical mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `test-tool-4_v2_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy map shape unrolling gently across a warm cream square canvas, dotted with a handful of small glowing rounded pins in teal, orange and pink, with delicate light trails connecting the pins to a single central figure silhouette rendered in indigo standing at the middle, the whole scene scaled and centered so every pin, trail and the figure stay safely inside the square 1:1 frame at 1024x1024 recommended resolution without touching the border, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a guiding and reassuring mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 3 (v3):**

**Dosya adı: `test-tool-4_v3_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream square canvas showing a soft rounded glowing spotlight cone in golden-yellow light illuminating one neighborhood cluster of small rounded building shapes in teal and orange while several dimmer clusters in indigo and pink fade softly around it, the composition centered and scaled so every cluster stays fully within the square 1:1 frame at 1024x1024 recommended size with clear margin from all edges, soft cinematic lighting producing smooth gradients and subtle depth, a clarifying and confident mood that reads well at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `test-tool-4_v3_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy weighing scale in teal balancing two small rounded city-block shapes, one in orange and one in indigo, on a warm cream square background, tiny floating icon-dots in pink and yellow (representing job, climate, community and cost factors) drifting evenly around the scale, the whole scene centered and scaled to remain safely inside the square 1:1 frame at 1024x1024 recommended resolution without touching the border, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a careful and thoughtful comparison mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 05. Diaspora Ağı Eşleştirme `(test-tool-5)`

**Varyant 1 (v1):**

**Dosya adı: `test-tool-5_v1_p1.png`**

```
A premium modern editorial 3D illustration of two smooth rounded glossy profile-orb shapes, one in teal and one in warm orange, connected by a gentle glowing indigo line at the center of a warm cream square background, small complementary puzzle-notch details on facing sides of the orbs suggesting a perfect fit, the whole pair centered and scaled so nothing touches the square 1:1 frame border at 1024x1024 recommended size, soft cinematic lighting producing smooth gradients and subtle depth, a warm and trustworthy connection mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `test-tool-5_v1_p2.png`**

```
A premium modern editorial 3D illustration of a balanced constellation of small rounded glossy figure-silhouette nodes in teal, orange, indigo, pink and yellow scattered across a warm cream square canvas, with soft glowing light threads forming between the two most compatible nodes near the center while other threads stay faint, every node and thread scaled to remain fully inside the square 1:1 frame at 1024x1024 recommended resolution with generous edge clearance, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a community-matchmaking mood that is optimistic and inclusive, legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 2 (v2):**

**Dosya adı: `test-tool-5_v2_p1.png`**

```
A premium modern editorial 3D illustration of a balanced radial network of small rounded glossy people-icon shapes in teal, orange, indigo, pink and yellow arranged evenly around a warm cream square canvas center, with soft bright light lines forming between the most compatible pairs and fainter lines linking the rest, the whole network centered and scaled to sit safely inside the square 1:1 frame at 1024x1024 recommended size with clear margin from all edges, soft cinematic lighting producing smooth gradients and subtle depth, an inclusive and lively matchmaking mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `test-tool-5_v2_p2.png`**

```
A premium modern editorial 3D illustration of two soft rounded glossy speech-bubble shapes, one in teal and one in orange, drifting toward each other above a warm cream square background with small glowing particle sparks in indigo, pink and yellow rising between them to suggest an instant connection, the bubbles and sparks centered and scaled so nothing crosses the square 1:1 frame border at 1024x1024 recommended resolution, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a warm, efficient and modern connection mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 3 (v3):**

**Dosya adı: `test-tool-5_v3_p1.png`**

```
A premium modern editorial 3D illustration of two soft rounded glossy hand shapes, one teal representing a newcomer and one warm orange representing an experienced mentor, reaching toward a small glowing handshake point at the exact center of a warm cream square background, with a faint rounded city-skyline silhouette in indigo behind them, everything scaled and centered so no shape touches the square 1:1 frame border at 1024x1024 recommended size, soft cinematic lighting producing smooth gradients and subtle depth, a supportive and hopeful mentorship mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `test-tool-5_v3_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy bridge arc in teal connecting two small rounded platforms, one holding a simple orange figure shape representing someone needing help and the other holding a simple indigo figure shape representing someone offering help, set on a warm cream square canvas, small pink and yellow light particles drifting gently across the bridge, the whole scene centered and scaled to remain fully inside the square 1:1 frame at 1024x1024 recommended resolution with generous edge clearance, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a warm reciprocal-support mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 06. Yurt Dışında Hangi Kariyer Sana Uygun? `(test-tool-6)`

**Varyant 1 (v1):**

**Dosya adı: `test-tool-6_v1_p1.png`**

```
A premium modern editorial 3D illustration of several smooth rounded glossy career pathways in teal, orange and indigo branching outward from a single bright point at the center of a warm cream square background toward small rounded icon shapes (a graduation cap, a laptop, a lightbulb) each softly glowing, the whole branching form centered and scaled so every path and icon stays fully inside the square 1:1 frame at 1024x1024 recommended size with clear margin from all edges, soft cinematic lighting producing smooth gradients and subtle depth, a hopeful direction-finding mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `test-tool-6_v1_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy compass shape in teal at the center of a warm cream square canvas, its needle pointing toward one of three small rounded persona-icon shapes in orange, indigo and pink (representing academic, tech and entrepreneurial paths) arranged in a balanced arc around it, the compass and every icon scaled to remain safely inside the square 1:1 frame at 1024x1024 recommended resolution without touching the border, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a clear and confident path-finding mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 2 (v2):**

**Dosya adı: `test-tool-6_v2_p1.png`**

```
A premium modern editorial 3D illustration of a smooth rounded glossy compass needle in teal glowing softly as it swings toward one of several small rounded professional-persona shapes in orange, indigo, pink and yellow arranged in a balanced circle on a warm cream square background, one persona shape haloed brighter to show the match, the entire scene centered and scaled to sit fully inside the square 1:1 frame at 1024x1024 recommended size with generous edge clearance, soft cinematic lighting producing smooth gradients and subtle depth, a decisive and encouraging mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `test-tool-6_v2_p2.png`**

```
A premium modern editorial 3D illustration of a smooth rounded glossy signpost shape in teal standing at the center of a warm cream square canvas, with several small rounded arrow-shapes in orange, indigo, pink and yellow pointing outward toward different simple destination icons, one arrow softly haloed in golden light to mark the recommended route, everything scaled and centered so no arrow or icon touches the square 1:1 frame border at 1024x1024 recommended resolution, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a clear wayfinding mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 3 (v3):**

**Dosya adı: `test-tool-6_v3_p1.png`**

```
A premium modern editorial 3D illustration of a smooth rounded glossy staircase in teal rising diagonally across a warm cream square canvas toward a bright golden horizon glow at the top corner, small rounded milestone-dots in orange, indigo and pink placed evenly along each step, the whole staircase scaled and centered so its base and top stay well within the square 1:1 frame at 1024x1024 recommended size with clear space from every edge, soft cinematic lighting producing smooth gradients and gentle shadows for subtle depth, an ambitious growth-oriented mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `test-tool-6_v3_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy tree shape in teal at the center of a warm cream square background, its branches ending in small rounded fruit-like orbs colored orange, indigo, pink and yellow each representing a different career outcome, one orb glowing brighter with warm golden light to mark the recommended path, the whole tree scaled and centered to remain fully inside the square 1:1 frame at 1024x1024 recommended resolution without touching the border, smooth gradients and soft cinematic lighting adding subtle depth to the rounded forms, a nurturing and growth-focused mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 07. Yurt Dışı Yaşam Tarzın Ne? `(test-tool-7)`

**Varyant 1 (v1):**

**Dosya adı: `test-tool-7_v1_p1.png`**

```
A premium modern editorial 3D illustration of a playful balanced arrangement of small rounded glossy persona-badge shapes in teal, orange, indigo, pink and yellow floating with tiny sparkle accents on a warm cream square background, each badge topped with a simple friendly symbol (a globe, a coffee cup, a compass) without fine detail, one badge slightly larger and centered as the featured result, the whole cluster scaled so nothing touches the square 1:1 frame border at 1024x1024 recommended size, soft cinematic lighting producing smooth gradients and subtle depth, a fun and shareable personality-quiz mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `test-tool-7_v1_p2.png`**

```
A premium modern editorial 3D illustration of a vibrant rounded glossy character silhouette in teal standing at the center of a warm cream square canvas, surrounded by a joyful swirl of small rounded lifestyle icon-shapes in orange, indigo, pink and yellow (a coffee cup, an airplane, a city light, a book) orbiting gently around it, everything scaled and centered so no icon crosses the square 1:1 frame border at 1024x1024 recommended resolution, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a playful and energetic self-expression mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 2 (v2):**

**Dosya adı: `test-tool-7_v2_p1.png`**

```
A premium modern editorial 3D illustration of a smooth rounded glossy spinning-wheel shape divided into colorful teal, orange, indigo, pink and yellow segments at the center of a warm cream square canvas, a small glowing pointer resting on one bright segment to reveal the result, gentle motion-blur light trails around the wheel's rim, the whole wheel centered and scaled to sit fully inside the square 1:1 frame at 1024x1024 recommended size with clear margin from all edges, soft cinematic lighting producing smooth gradients and subtle depth, a playful gamified-quiz mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `test-tool-7_v2_p2.png`**

```
A premium modern editorial 3D illustration of a joyful cluster of small rounded glossy lifestyle-scene cards in teal, orange, indigo and pink (hinting at nightlife, a quiet cafe, a solo trip, a cozy home through simple rounded shapes without detail) fanned out like a hand of cards on a warm cream square background, one card lifted forward and haloed in golden light as the chosen result, everything scaled and centered so no card touches the square 1:1 frame border at 1024x1024 recommended resolution, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a fun and expressive lifestyle-quiz mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 3 (v3):**

**Dosya adı: `test-tool-7_v3_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream square canvas centered on a smooth rounded glossy roulette-style wheel in teal, orange, indigo, pink and yellow segments, a soft golden light pointer landing precisely on one segment, small sparkle particles drifting around the rim in a balanced circular pattern, the whole wheel scaled and centered to remain fully inside the square 1:1 frame at 1024x1024 recommended size with generous edge clearance, soft cinematic lighting producing smooth gradients and subtle depth, a lighthearted celebratory quiz mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `test-tool-7_v3_p2.png`**

```
A premium modern editorial 3D illustration of three small rounded glossy persona-figure silhouettes in teal, orange and indigo standing together in the same simplified city-block setting on a warm cream square background, each figure subtly different in pose and each surrounded by a faint personal glow of a different accent color (pink, yellow, blue) to show three ways of experiencing the same place, everything scaled and centered so no figure touches the square 1:1 frame border at 1024x1024 recommended resolution, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a relatable and inclusive lifestyle-diversity mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 08. İlk 90 Gün Planlayıcı `(test-tool-8)`

**Varyant 1 (v1):**

**Dosya adı: `test-tool-8_v1_p1.png`**

```
A premium modern editorial 3D illustration of a smooth rounded glossy timeline ribbon in teal curving gently across a warm cream square canvas, dotted with small rounded milestone shapes in orange, indigo and pink each topped with a tiny simple icon (a house key, a bank card, a speech bubble), the ribbon centered and scaled so its full curve stays within the square 1:1 frame at 1024x1024 recommended size with clear margin from every edge, soft cinematic lighting producing smooth gradients and subtle depth, an organized and encouraging planning mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `test-tool-8_v1_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy stack of checklist-card shapes in teal, orange and indigo fanned slightly on a warm cream square background, small glowing checkmark shapes in yellow and pink appearing above the top cards as if being ticked off one by one, everything scaled and centered so no card touches the square 1:1 frame border at 1024x1024 recommended resolution, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a productive and actionable planning mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 2 (v2):**

**Dosya adı: `test-tool-8_v2_p1.png`**

```
A premium modern editorial 3D illustration of a smooth rounded glossy accordion-style stack of checklist-card shapes in teal, orange, indigo and pink standing upright on a warm cream square canvas, small glowing checkmark shapes in golden-yellow appearing one at a time above the cards as if being ticked off in sequence, the whole stack centered and scaled to remain fully inside the square 1:1 frame at 1024x1024 recommended size with clear space from every edge, soft cinematic lighting producing smooth gradients and subtle depth, a calm and organized progress mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `test-tool-8_v2_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy calendar shape rendered in warm cream and teal at the center of a square 1:1 canvas recommended at 1024x1024 pixels, its first few weeks gently highlighted with a warm golden glow and small rounded checkmark shapes in orange and pink appearing across those highlighted days, the whole calendar scaled and centered so it stays fully within the frame with generous edge clearance, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a hopeful first-days roadmap mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 3 (v3):**

**Dosya adı: `test-tool-8_v3_p1.png`**

```
A premium modern editorial 3D illustration of a smooth rounded glossy calendar shape made of light standing at the center of a warm cream square background, its first few weeks gently highlighted in soft teal glow, small rounded checkmark shapes in orange, indigo and yellow appearing across the highlighted days in a tidy sequence, the whole calendar centered and scaled so it stays fully inside the square 1:1 frame at 1024x1024 recommended size with clear margin from every edge, soft cinematic lighting producing smooth gradients and subtle depth, a structured and reassuring roadmap mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `test-tool-8_v3_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy path made of stepping-stone shapes in teal, orange, indigo and pink winding gently across a warm cream square canvas from a small house-icon shape toward a bright glowing horizon, each stone slightly larger than the last to suggest steady progress, the entire path centered and scaled to remain fully within the square 1:1 frame at 1024x1024 recommended resolution without touching the border, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a step-by-step, stress-free settling-in mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 09. Önce Hangi Soruna Odaklanmalısın? `(test-tool-9)`

**Varyant 1 (v1):**

**Dosya adı: `test-tool-9_v1_p1.png`**

```
A premium modern editorial 3D illustration of a smooth rounded glossy radar-scan shape in teal light sweeping across a warm cream square background dotted with several small dimmer rounded obstacle-icon shapes (a document, a speech bubble, a briefcase, a house) in indigo, pink and yellow, with one icon pinpointed and haloed in bright golden light to mark the single biggest obstacle, the whole scene centered and scaled to remain fully inside the square 1:1 frame at 1024x1024 recommended size with clear margin from every edge, soft cinematic lighting producing smooth gradients and subtle depth, a clarifying focus-finding mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `test-tool-9_v1_p2.png`**

```
A premium modern editorial 3D illustration of a tangled cluster of soft rounded glowing thread shapes in orange, indigo, pink and yellow at the center of a warm cream square canvas, with one bright teal thread being gently pulled free and straightened above the tangle, everything scaled and centered so no thread touches the square 1:1 frame border at 1024x1024 recommended resolution, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a satisfying prioritization mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 2 (v2):**

**Dosya adı: `test-tool-9_v2_p1.png`**

```
A premium modern editorial 3D illustration of a smooth rounded glossy knot of tangled light-threads in indigo, pink and yellow at the center of a warm cream square background, with one glowing teal thread being carefully lifted out and untangled first while the rest remain gently coiled, the whole composition centered and scaled so nothing touches the square 1:1 frame border at 1024x1024 recommended size, soft cinematic lighting producing smooth gradients and subtle depth, a relieving and clarifying mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `test-tool-9_v2_p2.png`**

```
A premium modern editorial 3D illustration of a small rounded glossy figure silhouette in teal standing at a crossroads of several soft glowing paths in orange, indigo, pink and yellow on a warm cream square canvas, one path lit brighter with warm golden light to indicate the priority direction, everything scaled and centered so no path extends beyond the square 1:1 frame at 1024x1024 recommended resolution, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a decisive and calming prioritization mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 3 (v3):**

**Dosya adı: `test-tool-9_v3_p1.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy spotlight cone in golden light shining down onto a single small rounded obstacle-icon shape in teal on a warm cream square canvas, while several other similar obstacle-icon shapes in indigo, pink and yellow fade softly into the background around it, everything scaled and centered so no icon touches the square 1:1 frame border at 1024x1024 recommended size, soft cinematic lighting producing smooth gradients and subtle depth, a sharply clarifying top-priority mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `test-tool-9_v3_p2.png`**

```
A premium modern editorial 3D illustration of a smooth rounded glossy target/bullseye shape rendered in teal and orange rings at the center of a warm cream square background, a single small glowing arrow in indigo landing precisely in the center ring, faint rounded silhouette icons of other lesser obstacles arranged loosely outside the target, the whole scene centered and scaled to remain fully inside the square 1:1 frame at 1024x1024 recommended resolution with generous edge clearance, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a focused and motivating clarity mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 10. Yurt Dışında İş Bulma Şansın? `(test-tool-10)`

**Varyant 1 (v1):**

**Dosya adı: `test-tool-10_v1_p1.png`**

```
A premium modern editorial 3D illustration of a smooth rounded glossy probability-gauge arc in teal filling toward a bright golden zone at the center of a warm cream square background, small rounded skill-icon shapes in orange, indigo and pink feeding gently into the gauge from below, the whole gauge centered and scaled to remain fully inside the square 1:1 frame at 1024x1024 recommended size with clear margin from every edge, soft cinematic lighting producing smooth gradients and subtle depth, a motivating and realistic mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `test-tool-10_v1_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy resume-silhouette shape in teal rising gently toward a bright open doorway of golden light at the center of a warm cream square canvas, small rounded skill-badge shapes in orange, indigo and pink floating alongside it as it rises, everything scaled and centered so no shape touches the square 1:1 frame border at 1024x1024 recommended resolution, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a hopeful getting-hired-abroad mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 2 (v2):**

**Dosya adı: `test-tool-10_v2_p1.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy resume-silhouette shape in teal glowing softly as it rises toward a bright open doorway made of warm golden light at the center of a warm cream square canvas, small rounded sparkle accents in orange, pink and indigo drifting around the doorway frame, the whole scene centered and scaled to remain fully inside the square 1:1 frame at 1024x1024 recommended size with generous edge clearance, soft cinematic lighting producing smooth gradients and subtle depth, an encouraging getting-hired mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `test-tool-10_v2_p2.png`**

```
A premium modern editorial 3D illustration of a smooth rounded glossy handshake shape formed of soft teal and orange light at the center of a warm cream square background, framed by a gentle arc of small rounded skill-icon shapes in indigo, pink and yellow representing different competencies, everything scaled and centered so no shape touches the square 1:1 frame border at 1024x1024 recommended resolution, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a confident and welcoming hiring mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 3 (v3):**

**Dosya adı: `test-tool-10_v3_p1.png`**

```
A premium modern editorial 3D illustration of a smooth rounded glossy bar-of-light shape in teal rising taller against a warm cream square background with a soft rounded city-skyline silhouette in orange and indigo behind it, the bar topped with a gentle golden glow to show a growing skill-versus-market match, everything scaled and centered so no shape touches the square 1:1 frame border at 1024x1024 recommended size, soft cinematic lighting producing smooth gradients and subtle depth, a motivating job-market mood that reads clearly at thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `test-tool-10_v3_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded glossy open door shape in teal standing at the center of a warm cream square canvas with warm golden light spilling through it, a small rounded figure silhouette in orange stepping confidently toward the light, framed by faint rounded skill-icon shapes in indigo, pink and yellow floating nearby, the whole scene scaled and centered to remain fully inside the square 1:1 frame at 1024x1024 recommended resolution with clear margin from every edge, smooth gradients and soft cinematic lighting adding gentle depth to the rounded forms, a motivating and optimistic career-opportunity mood legible at small thumbnail size, no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

## Burak (`burak`) — 12 kalem

### 01. Hangi Ülke Sana Uygun? `(burak-tool-1)`

**Varyant 1 (v1):**

**Dosya adı: `burak-tool-1_v1_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream-colored globe rendered in soft rounded geometry at the exact center of a square 1:1 canvas, with a single glossy teal location-pin gently descending toward one highlighted region while faint orange, indigo, pink and yellow glow rings mark other regions further away; the globe and pin are scaled to sit comfortably inside the frame at a recommended 1024x1024 resolution with generous padding so nothing touches or crosses the edges; soft cinematic lighting produces smooth gradients and gentle rounded shadows, giving the scene subtle depth and a polished, optimistic SaaS-illustration feel that stays legible at thumbnail size and works equally well as a website card or hero image; the mood is hopeful and aspirational; absolutely no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark anywhere in the image.
```

**Dosya adı: `burak-tool-1_v1_p2.png`**

```
A premium modern editorial 3D illustration of a friendly rounded teal compass shape floating at the center of a warm cream square background, its single glossy needle pointing toward a softly glowing orange landmass silhouette while three dimmer indigo, pink and yellow landmass silhouettes sit further out in a balanced circular arrangement; every shape stays fully within the square 1:1 frame at 1024x1024 recommended size, clear of all four edges; smooth gradients and soft cinematic lighting give the rounded forms subtle depth and a confident, inclusive, professional technology-brand mood that reads instantly at small thumbnail scale; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 2 (v2):**

**Dosya adı: `burak-tool-1_v2_p1.png`**

```
A premium modern editorial 3D illustration of a smooth rounded radar-dish shape in teal sweeping a soft beam of light across a warm cream square canvas dotted with small rounded landmass silhouettes in orange, blue, pink and yellow, with one landmass glowing brighter at the center where the beam currently rests; the entire composition is centered and scaled to remain fully inside the square 1:1 frame at 1024x1024 recommended size, well away from every edge; soft cinematic lighting creates smooth gradients and rounded, friendly volumes with subtle depth, producing a polished, decisive, optimistic technology-brand aesthetic that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `burak-tool-1_v2_p2.png`**

```
A premium modern editorial 3D illustration of three soft rounded suitcase shapes in orange, teal and indigo arranged in a gentle arc on a warm cream square background, each suitcase topped with a small glowing rounded flag-less pennant shape of a different accent color, with faint dotted travel-path arcs in pink and yellow connecting them toward a single glowing star marking the best match at the top center; every element stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a warm, decision-making, inclusive mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 3 (v3):**

**Dosya adı: `burak-tool-1_v3_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream square canvas showing a central glossy teal globe with three softly glowing rounded lifestyle-scene cards — a small career skyline in orange, a cozy rounded home shape in indigo, and a sunny coastline curve in pink — floating around it in a balanced circular arrangement, each connected to the globe by a thin glowing yellow thread; everything is scaled to stay fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving a warm, optimistic, polished SaaS-illustration feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `burak-tool-1_v3_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded scale-of-values shape in teal balancing gently at the center of a warm cream square background, with small glossy weight-orbs in orange, blue, indigo and pink resting on each side representing different life priorities, and a faint glowing globe silhouette softly visible behind the scale; the whole composition is centered and comfortably contained within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a calm, thoughtful, professional mood suited to both a small card and a large hero image; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 02. Mesleğin Dünyada Ne Kazandırıyor? `(burak-tool-2)`

**Varyant 1 (v1):**

**Dosya adı: `burak-tool-2_v1_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream square canvas featuring a gentle skyline made of rounded bar-shapes of varying heights in teal, orange, indigo, pink and yellow, resembling a soft cityscape of coin-stacks, centered and balanced with the tallest bar glowing brightest at the middle; the entire skyline is scaled to remain fully inside the square 1:1 frame at 1024x1024 recommended size, with clear breathing room from every edge; soft cinematic lighting creates smooth gradients and gentle shadows across the rounded forms, giving a confident, polished, optimistic professional-finance feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `burak-tool-2_v1_p2.png`**

```
A premium modern editorial 3D illustration of a smooth rounded briefcase shape in teal at the center of a warm cream square background, gently opening to release a soft upward spray of small glossy rounded coin shapes in orange, indigo, pink and yellow that arc symmetrically outward like a fountain; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a rewarding, professional, optimistic mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 2 (v2):**

**Dosya adı: `burak-tool-2_v2_p1.png`**

```
A premium modern editorial 3D illustration of a soft rounded teal balance-scale at the center of a warm cream square canvas, one side holding a small glossy stack of orange coin shapes and the other side holding a small rounded house silhouette in indigo, perfectly level to suggest fair comparison, with a few pink and yellow sparkle accents floating gently around the fulcrum; the whole scale is centered and scaled to stay fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and subtle depth, giving a thoughtful, polished, trustworthy financial-brand feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `burak-tool-2_v2_p2.png`**

```
A premium modern editorial 3D illustration of a rounded teal wallet shape resting on a warm cream square background, with a soft glowing orange coin gently sliding out and a small indigo house-shaped token beside it on a tiny weighing platform, both haloed by faint pink and yellow light rings to suggest purchasing-power comparison; every shape is comfortably centered and contained within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a calm, professional, reassuring mood suited to both a small card and a large hero image; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 3 (v3):**

**Dosya adı: `burak-tool-2_v3_p1.png`**

```
A premium modern editorial 3D illustration of a smooth rounded teal briefcase shape at the center of a warm cream square canvas, gently emitting several soft glowing pathways in orange, indigo, pink and yellow that branch outward toward small rounded city-skyline silhouettes of differing heights and brightness arranged in a balanced circular pattern; every shape stays fully within the square 1:1 frame at 1024x1024 recommended size, clear of all four edges; soft cinematic lighting creates smooth gradients and gentle shadows across the rounded forms, giving a confident, aspirational, polished professional feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `burak-tool-2_v3_p2.png`**

```
A premium modern editorial 3D illustration of a rounded teal passport-like booklet shape standing upright at the center of a warm cream square background, gently glowing at its edges, with small rounded value-orbs in orange, blue, pink and yellow orbiting around it at different heights to represent varying worth across places; the whole scene is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and an optimistic, professional, global mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 03. Yurt Dışına Taşınmaya Hazır mısın? `(burak-tool-3)`

**Varyant 1 (v1):**

**Dosya adı: `burak-tool-3_v1_p1.png`**

```
A premium modern editorial 3D illustration of a smooth rounded teal gauge-arc shape at the center of a warm cream square canvas, glowing progressively from soft yellow through orange toward a bright indigo peak to show a readiness level filling up, surrounded by small rounded icon-shapes of a suitcase, a document and a speech bubble in pink, blue and orange orbiting gently around it; the whole gauge is centered and scaled to stay fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and subtle depth, giving a confident, optimistic, polished self-assessment feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `burak-tool-3_v1_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded teal suitcase standing open at the center of a warm cream square background, with small glowing rounded checkmark shapes in orange, indigo, pink and yellow gently floating up and out of it like confirmations, arranged in a balanced upward arc; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a hopeful, prepared, professional mood suited to both a small card and a large hero image; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 2 (v2):**

**Dosya adı: `burak-tool-3_v2_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream square canvas showing a soft rounded teal suitcase lying open with its lid gently propped up, above which float several small glossy rounded checkmark shapes in orange, indigo, pink and yellow like a completed checklist, all balanced symmetrically over the suitcase; the entire composition is scaled to stay fully within the square 1:1 frame at 1024x1024 recommended size, with clear breathing room from every edge; soft cinematic lighting creates smooth gradients and gentle shadows across the rounded forms, giving an organized, reassuring, polished feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `burak-tool-3_v2_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded teal magnifying-glass shape hovering at the center of a warm cream square background, focused on a small glowing orange gauge-dial shape beneath it that reads as calm self-reflection, with faint indigo, pink and yellow light particles drifting around in a balanced radial pattern; every shape is comfortably centered and contained within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and an honest, thoughtful, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 3 (v3):**

**Dosya adı: `burak-tool-3_v3_p1.png`**

```
A premium modern editorial 3D illustration of a smooth rounded teal figure-silhouette standing confidently at a glowing rounded doorway shape at the center of a warm cream square canvas, one side of the doorway softly dim and the other bathed in warm orange and yellow light, with small indigo and pink sparkle accents drifting near the threshold; the whole scene is centered and scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and subtle depth, giving a confident, hopeful, polished technology-brand feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `burak-tool-3_v3_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded teal staircase shape rising gently across a warm cream square background toward a bright glowing orange horizon line, with small rounded milestone-orbs in indigo, pink and yellow marking each step in a balanced ascending pattern; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a determined, optimistic, professional mood suited to both a small card and a large hero image; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 04. Hangi Şehir Sana Daha Uygun? `(burak-tool-4)`

**Varyant 1 (v1):**

**Dosya adı: `burak-tool-4_v1_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream square canvas showing a soft rounded stylized map plane in pale teal, with three small glowing rounded city-marker shapes in orange, indigo and pink scattered across it, one marker pulsing brighter at the center as the best match, connected by thin glowing yellow lines to the others; the whole map is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving a confident, polished, optimistic technology-brand feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `burak-tool-4_v1_p2.png`**

```
A premium modern editorial 3D illustration of three soft rounded city-skyline silhouettes of varying heights in teal, orange and indigo standing side by side on a warm cream square background, each resting on a small glowing rounded podium-step, with the tallest skyline glowing brightest in the center and pink and yellow sparkle accents drifting above it; every shape is comfortably centered and contained within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a decisive, polished, inclusive mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 2 (v2):**

**Dosya adı: `burak-tool-4_v2_p1.png`**

```
A premium modern editorial 3D illustration of a soft rounded teal winner's podium at the center of a warm cream square canvas, holding three glowing rounded city-skyline silhouettes of differing brightness in orange, indigo and pink, the tallest and brightest skyline standing on the center step; small yellow sparkle accents float above the scene in a balanced arrangement; everything stays fully within the square 1:1 frame at 1024x1024 recommended size, clear of all four edges; soft cinematic lighting creates smooth gradients and gentle shadows across the rounded forms, giving a celebratory, polished, optimistic feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `burak-tool-4_v2_p2.png`**

```
A premium modern editorial 3D illustration of a smooth rounded teal ranking-ladder shape at the center of a warm cream square background, with three small glowing rounded city-silhouette tokens in orange, pink and yellow resting on its rungs at different heights, the top rung glowing brightest; every shape is scaled to remain entirely within the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a clear, decisive, professional mood suited to both a small card and a large hero image; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 3 (v3):**

**Dosya adı: `burak-tool-4_v3_p1.png`**

```
A premium modern editorial 3D illustration of a soft rounded teal magnifying glass hovering over a cluster of small glowing rounded neighborhood-block shapes on a warm cream square canvas, with tiny orbiting icon-shapes representing job, home, climate and community rendered as simple rounded orange, indigo, pink and yellow tokens circling above the focused area; the whole scene is centered and scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth, giving a detailed yet uncluttered, polished, optimistic feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `burak-tool-4_v3_p2.png`**

```
A premium modern editorial 3D illustration of two soft rounded neighborhood-block clusters, one warm orange and one cool teal, resting side by side on a warm cream square background, subtly different in shape and texture to suggest two distinct city characters, with a thin glowing indigo divider line between them and small pink and yellow sparkle accents scattered above; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a thoughtful, comparative, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 05. Diaspora Ağı Eşleştirme `(burak-tool-5)`

**Varyant 1 (v1):**

**Dosya adı: `burak-tool-5_v1_p1.png`**

```
A premium modern editorial 3D illustration of two soft rounded glossy profile-orb shapes, one teal and one warm orange, floating toward each other at the exact center of a warm cream square canvas, with a gentle glowing indigo puzzle-piece-shaped connector forming in the gap between them, and small pink and yellow sparkle accents drifting nearby in a balanced arrangement; both orbs and the connector stay fully within the square 1:1 frame at 1024x1024 recommended size, well clear of every edge; soft cinematic lighting creates smooth gradients and gentle shadows across the rounded forms, giving a warm, collaborative, polished technology-brand feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `burak-tool-5_v1_p2.png`**

```
A premium modern editorial 3D illustration of a balanced circular constellation of small rounded figure-silhouette shapes in teal, orange, indigo, pink and yellow connected by thin glowing lines on a warm cream square background, with two of the figures linked by a brighter, thicker golden-orange line to show the strongest match; the whole constellation is centered and scaled to remain fully inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and an inclusive, optimistic, professional mood suited to both a small card and a large hero image; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 2 (v2):**

**Dosya adı: `burak-tool-5_v2_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream square canvas showing a soft rounded teal handshake-shaped icon at the center, formed from two interlocking glossy rounded forms in orange and indigo, surrounded by a balanced ring of small floating rounded speech-bubble shapes in pink, blue and yellow representing shared conversations; everything is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving a warm, community-driven, polished feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `burak-tool-5_v2_p2.png`**

```
A premium modern editorial 3D illustration of a smooth rounded teal magnet shape at the center of a warm cream square background, gently drawing together several small glossy rounded figure-silhouettes in orange, indigo, pink and yellow from different directions in a balanced radial pull; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and an inclusive, optimistic, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 3 (v3):**

**Dosya adı: `burak-tool-5_v3_p1.png`**

```
A premium modern editorial 3D illustration of a soft rounded teal handshake shape rendered in glossy light at the center of a warm cream square canvas, joining a smaller rounded orange figure-silhouette on one side and a taller rounded indigo figure-silhouette on the other, with a faint rounded city-block backdrop in pink and yellow softly visible behind them; everything is centered and scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and subtle depth, giving a warm, supportive, polished feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `burak-tool-5_v3_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded teal bridge-arc shape connecting two small glossy rounded figure-silhouettes, one in orange and one in indigo, standing on either end on a warm cream square background, with gentle pink and yellow light particles flowing along the arc like shared knowledge passing between them; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a generous, hopeful, professional mood suited to both a small card and a large hero image; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 06. Yurt Dışında Hangi Kariyer Sana Uygun? `(burak-tool-6)`

**Varyant 1 (v1):**

**Dosya adı: `burak-tool-6_v1_p1.png`**

```
A premium modern editorial 3D illustration of a smooth rounded teal orb at the center of a warm cream square canvas, gently branching outward into several soft glowing pathways in orange, indigo, pink and yellow that lead toward small rounded icon-shapes representing a lab flask, a laptop, a lightbulb and a briefcase, arranged in a balanced radial pattern; everything is scaled to remain fully inside the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving a hopeful, exploratory, polished feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `burak-tool-6_v1_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded teal signpost shape at the center of a warm cream square background, with several small glowing rounded arrow-panels in orange, indigo, pink and yellow pointing in different directions, each topped with a simple rounded icon suggesting a different career path; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a clear, optimistic, professional mood suited to both a small card and a large hero image; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 2 (v2):**

**Dosya adı: `burak-tool-6_v2_p1.png`**

```
A premium modern editorial 3D illustration of a soft rounded teal compass shape at the center of a warm cream square canvas, its single glossy needle pointing toward one of several small glowing rounded persona-badge shapes in orange, indigo, pink and yellow arranged in a balanced arc around it; the whole compass and badges are scaled to stay fully within the square 1:1 frame at 1024x1024 recommended size, with clear breathing room from every edge; soft cinematic lighting creates smooth gradients and gentle shadows across the rounded forms, giving a confident, decisive, polished feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `burak-tool-6_v2_p2.png`**

```
A premium modern editorial 3D illustration of a smooth rounded teal telescope shape at the center of a warm cream square background, gently pointed toward a distant glowing orange horizon dotted with small rounded professional-path icons in indigo, pink and yellow; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a forward-looking, optimistic, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 3 (v3):**

**Dosya adı: `burak-tool-6_v3_p1.png`**

```
A premium modern editorial 3D illustration of a soft rounded teal staircase shape rising diagonally across a warm cream square canvas toward a bright glowing orange horizon, with small rounded milestone-glow dots in indigo, pink and yellow marking each step in a balanced ascending rhythm; everything is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle shadows across the rounded forms, giving an ambitious, hopeful, polished feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `burak-tool-6_v3_p2.png`**

```
A premium modern editorial 3D illustration of a smooth rounded teal rocket-like arc shape lifting gently from a warm cream square background toward a soft glowing orange and yellow sky-burst, with small rounded milestone-orbs in indigo and pink trailing behind it in a balanced upward curve; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and an energetic, optimistic, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 07. Yurt Dışı Yaşam Tarzın Ne? `(burak-tool-7)`

**Varyant 1 (v1):**

**Dosya adı: `burak-tool-7_v1_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream square canvas showing a playful balanced cluster of three soft rounded persona-badge shapes in teal, orange and pink, each topped with a tiny distinct rounded symbol (a globe, a cozy house, a compass) and gently surrounded by small sparkling yellow and indigo particle accents; everything is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving a fun, lighthearted, polished feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `burak-tool-7_v1_p2.png`**

```
A premium modern editorial 3D illustration of a smooth rounded teal spinning-wheel shape at the center of a warm cream square background, divided into soft colorful segments in orange, indigo, pink and yellow, with a single glossy pointer resting on one segment to reveal a personality result; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a playful, gamified, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 2 (v2):**

**Dosya adı: `burak-tool-7_v2_p1.png`**

```
A premium modern editorial 3D illustration of a vibrant soft rounded teal character-silhouette at the center of a warm cream square canvas, gently surrounded by small floating rounded lifestyle-icon shapes — a coffee cup, an airplane, a city-light glow and a stack of books — in orange, indigo, pink and yellow arranged in a joyful balanced swirl; everything is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving a cheerful, shareable, polished feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `burak-tool-7_v2_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded teal photo-frame shape at the center of a warm cream square background, containing a simplified glossy silhouette mid-motion, framed by small orbiting rounded mood-icons in orange, pink and yellow like a personality mosaic; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a fun, expressive, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 3 (v3):**

**Dosya adı: `burak-tool-7_v3_p1.png`**

```
A premium modern editorial 3D illustration of a smooth rounded teal spinning-wheel shape at the center of a warm cream square canvas, divided into soft colorful wedge segments in orange, indigo, pink and yellow, each wedge topped with a simple rounded persona-symbol, with a glossy light pointer landing precisely on one wedge; the whole wheel is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle shadows, giving a playful, celebratory, polished feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `burak-tool-7_v3_p2.png`**

```
A premium modern editorial 3D illustration of three soft rounded persona-badge shapes in teal, orange and pink standing in a gentle balanced row on a warm cream square background, each badge glowing with its own small distinct symbol, with playful yellow and indigo confetti-like sparkle accents drifting above them; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a lively, joyful, polished mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 08. İlk 90 Gün Planlayıcı `(burak-tool-8)`

**Varyant 1 (v1):**

**Dosya adı: `burak-tool-8_v1_p1.png`**

```
A premium modern editorial 3D illustration of a soft rounded teal ribbon shape curving gently across a warm cream square canvas like a timeline, with small glowing rounded milestone-dots in orange, indigo, pink and yellow spaced evenly along it, each topped with a tiny simple icon suggesting a house key, a bank card or a speech bubble; everything is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving an organized, hopeful, polished feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `burak-tool-8_v1_p2.png`**

```
A premium modern editorial 3D illustration of a smooth rounded teal calendar-block shape at the center of a warm cream square background, with the first few day-cells softly highlighted in orange and small glowing rounded checkmark shapes in indigo, pink and yellow appearing above them in a balanced arc; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a fresh-start, organized, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 2 (v2):**

**Dosya adı: `burak-tool-8_v2_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream square canvas showing a soft rounded accordion-like stack of teal, orange, indigo and pink checklist-card shapes, each card slightly fanned out, with small glowing yellow checkmark shapes appearing above the top cards as they are gently ticked off; everything is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving an actionable, satisfying, polished feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `burak-tool-8_v2_p2.png`**

```
A premium modern editorial 3D illustration of a smooth rounded teal clipboard shape at the center of a warm cream square background, holding several small glossy rounded task-tokens in orange, indigo, pink and yellow stacked neatly, with a soft glowing checkmark hovering above the top token; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a calm, organized, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 3 (v3):**

**Dosya adı: `burak-tool-8_v3_p1.png`**

```
A premium modern editorial 3D illustration of a smooth rounded teal calendar shape at the center of a warm cream square canvas, its first few week-blocks gently highlighted in soft orange glow, with small rounded checkmark shapes in indigo, pink and yellow appearing above the highlighted section in a balanced arc; the whole calendar stays fully within the square 1:1 frame at 1024x1024 recommended size, clear of all four edges; soft cinematic lighting creates smooth gradients and gentle shadows across the rounded forms, giving a fresh-start, structured, polished feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `burak-tool-8_v3_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded teal roadmap-path shape winding gently across a warm cream square background, dotted with small glowing rounded milestone-markers in orange, indigo, pink and yellow representing early tasks, leading toward a bright horizon glow at the top; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a step-by-step, reassuring, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 09. Önce Hangi Soruna Odaklanmalısın? `(burak-tool-9)`

**Varyant 1 (v1):**

**Dosya adı: `burak-tool-9_v1_p1.png`**

```
A premium modern editorial 3D illustration of a soft rounded teal radar-dish shape at the center of a warm cream square canvas, sweeping a beam of light across several small rounded obstacle-icon shapes (a visa stamp, a speech bubble, a briefcase, a house) in orange, indigo, pink and yellow, with one icon glowing distinctly brighter to show the single biggest priority; everything is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving a focused, clarifying, polished feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `burak-tool-9_v1_p2.png`**

```
A premium modern editorial 3D illustration of a smooth rounded teal target-ring shape at the center of a warm cream square background, with a single glossy orange dot resting precisely at its center while faint dimmer indigo, pink and yellow rings surround it further out; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a decisive, clear, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 2 (v2):**

**Dosya adı: `burak-tool-9_v2_p1.png`**

```
A premium modern editorial 3D illustration of a warm cream square canvas showing a soft rounded tangle of glowing teal, orange, indigo and pink thread-shapes, with one bright yellow thread gently being pulled free from the knot and straightening out toward the top of the frame; everything is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving a relieving, clarifying, polished feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `burak-tool-9_v2_p2.png`**

```
A premium modern editorial 3D illustration of a smooth rounded teal puzzle shape at the center of a warm cream square background, with most pieces still tangled together in soft indigo and pink, while a single glowing orange piece lifts cleanly above the rest to be placed first; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a focused, satisfying, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 3 (v3):**

**Dosya adı: `burak-tool-9_v3_p1.png`**

```
A premium modern editorial 3D illustration of a soft rounded teal spotlight cone gently shining down onto a single glowing orange hurdle-icon shape on a path across a warm cream square canvas, while several dimmer indigo, pink and yellow hurdle-icons fade into the background on either side; everything is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving a clear, purposeful, polished feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `burak-tool-9_v3_p2.png`**

```
A premium modern editorial 3D illustration of a smooth rounded teal lighthouse-beam shape at the center of a warm cream square background, sweeping across a small cluster of rounded obstacle-tokens in orange, indigo, pink and yellow and settling brightly on just one of them; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a guiding, confident, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 10. Yurt Dışında İş Bulma Şansın? `(burak-tool-10)`

**Varyant 1 (v1):**

**Dosya adı: `burak-tool-10_v1_p1.png`**

```
A premium modern editorial 3D illustration of a smooth rounded teal gauge-arc shape at the center of a warm cream square canvas, glowing progressively brighter from soft yellow through orange toward a vivid indigo peak to show a rising probability, with small rounded skill-icon shapes in pink and blue feeding gently into its base; everything is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving a motivating, confident, polished feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `burak-tool-10_v1_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded teal briefcase shape at the center of a warm cream square background, gently opening as a glowing orange upward arrow rises from within it toward a bright horizon glow, with small indigo, pink and yellow sparkle accents drifting around the arrow in a balanced arrangement; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and an encouraging, ambitious, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 2 (v2):**

**Dosya adı: `burak-tool-10_v2_p1.png`**

```
A premium modern editorial 3D illustration of a soft rounded teal resume-silhouette shape at the center of a warm cream square canvas, gently glowing as it rises toward a bright open rounded doorway shape in orange with warm light spilling through it, small indigo, pink and yellow sparkle accents drifting around the ascent; everything is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving a hopeful, encouraging, polished feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `burak-tool-10_v2_p2.png`**

```
A premium modern editorial 3D illustration of a smooth rounded teal key shape at the center of a warm cream square background, gently fitting into a glowing orange keyhole shaped like a briefcase outline, with small rounded sparkle accents in indigo, pink and yellow drifting around the moment of unlocking; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a hopeful, confident, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 3 (v3):**

**Dosya adı: `burak-tool-10_v3_p1.png`**

```
A premium modern editorial 3D illustration of a soft rounded teal bar-of-light shape rising taller and taller across a warm cream square canvas, representing a growing skill-versus-market match, with a small rounded city-skyline silhouette in orange softly visible behind it and indigo, pink and yellow sparkle accents celebrating the peak; everything is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving a motivating, energetic, polished feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `burak-tool-10_v3_p2.png`**

```
A premium modern editorial 3D illustration of a smooth rounded teal open-door shape at the center of a warm cream square background, warm orange light spilling out from it onto a small rounded figure-silhouette stepping through confidently, with indigo, pink and yellow sparkle accents celebrating the moment around the doorway; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a triumphant, motivational, professional mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 11. Almanya'da Sana Hangi Banka Uygun? `(burak-tool-11)`

**Varyant 1 (v1):**

**Dosya adı: `burak-tool-11_v1_p1.png`**

```
A premium modern editorial 3D illustration of a smooth rounded teal bank-card shape floating at the center of a warm cream square canvas above a simplified rounded skyline silhouette suggesting a German city, with three small glowing rounded bank-badge orbs in orange, indigo and pink ranked on a soft podium beside it, the tallest orb glowing brightest; everything is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving a trustworthy, decisive, polished financial feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `burak-tool-11_v1_p2.png`**

```
A premium modern editorial 3D illustration of a soft rounded teal smartphone shape at the center of a warm cream square background, displaying a simplified glowing rounded card-icon on its screen, surrounded by three small orbiting rounded coin-stack shapes in orange, indigo and pink of different heights representing ranked options; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a modern, reassuring, professional financial mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 2 (v2):**

**Dosya adı: `burak-tool-11_v2_p1.png`**

```
A premium modern editorial 3D illustration of a soft rounded teal balance-scale shape at the center of a warm cream square canvas, one side holding a small glossy stack of orange fee-coins and the other holding a clean glowing indigo mobile-app-icon shape, perfectly balanced, with small pink and yellow SEPA-style transfer-arrows gently flowing between them; everything is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving a thoughtful, value-conscious, polished financial feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `burak-tool-11_v2_p2.png`**

```
A premium modern editorial 3D illustration of a smooth rounded teal wallet shape at the center of a warm cream square background, gently releasing a stream of small glowing orange coins that curve upward into a rounded indigo piggy-bank shape, with pink and yellow sparkle accents marking savings growth; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a practical, reassuring, professional financial mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 3 (v3):**

**Dosya adı: `burak-tool-11_v3_p1.png`**

```
A premium modern editorial 3D illustration of a soft rounded teal decision-fork shape at the center of a warm cream square canvas, one path leading toward a glowing rounded orange traditional-branch-building silhouette and the other toward a sleek glowing indigo digital-bank orb, with small pink and yellow sparkle accents marking the choice point; everything is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving a clear, newcomer-friendly, polished financial feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `burak-tool-11_v3_p2.png`**

```
A premium modern editorial 3D illustration of a smooth rounded teal suitcase shape resting beside a glowing rounded orange bank-card shape on a warm cream square background, both connected by a soft dotted indigo path suggesting a newcomer's first financial step, with pink and yellow welcoming sparkle accents nearby; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a welcoming, guided, professional financial mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

### 12. Almanya'da Hangi Sigortalar Sana Şart? `(burak-tool-12)`

**Varyant 1 (v1):**

**Dosya adı: `burak-tool-12_v1_p1.png`**

```
A premium modern editorial 3D illustration of a soft rounded teal protective-shield shape at the center of a warm cream square canvas, gently surrounded by small floating rounded icon-shapes — a health cross, a car, a house, a tooth, a paw and an umbrella — in orange, indigo, pink and yellow, arranged in a balanced circular halo around the shield; everything is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving a reassuring, clear, polished financial-protection feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `burak-tool-12_v1_p2.png`**

```
A premium modern editorial 3D illustration of a smooth rounded teal umbrella shape opening at the center of a warm cream square background, sheltering a small cluster of rounded life-icon shapes — a house, a car outline and a health cross — in orange, indigo and pink beneath it, with soft yellow raindrop-like sparkle accents falling harmlessly around the edges of the umbrella; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a protective, calm, professional financial mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 2 (v2):**

**Dosya adı: `burak-tool-12_v2_p1.png`**

```
A premium modern editorial 3D illustration of a soft rounded teal checklist-card shape at the center of a warm cream square canvas, with several small glowing rounded insurance-type tokens in orange, indigo, pink and yellow sorted into three gentle tiers by height, the urgent tier glowing brightest at the top; everything is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving a clear, organized, polished financial feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `burak-tool-12_v2_p2.png`**

```
A premium modern editorial 3D illustration of a smooth rounded teal sorting-funnel shape at the center of a warm cream square background, with several small rounded insurance-icon tokens in orange, indigo, pink and yellow entering from the top and settling into three soft glowing tiers below labeled only by color and glow intensity; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a methodical, reassuring, professional financial mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Varyant 3 (v3):**

**Dosya adı: `burak-tool-12_v3_p1.png`**

```
A premium modern editorial 3D illustration of a soft rounded teal family-silhouette group at the center of a warm cream square canvas, sheltered beneath a large glowing rounded umbrella shape in orange, with a small rounded car-outline, house-shape and suitcase safely nestled beneath it in indigo, pink and yellow; everything is scaled to remain fully within the square 1:1 frame at 1024x1024 recommended size, with clear space from every edge; soft cinematic lighting produces smooth gradients and gentle depth across the rounded forms, giving a warm, protective, polished family-focused feel that reads clearly at small thumbnail size; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```

**Dosya adı: `burak-tool-12_v3_p2.png`**

```
A premium modern editorial 3D illustration of a smooth rounded teal shield shape at the center of a warm cream square background, gently overlapping with a small glossy rounded house-shape in orange and a car-outline in indigo tucked safely behind it, with pink and yellow protective glow rings radiating outward in a balanced pattern; every shape stays comfortably inside the square 1:1 frame at 1024x1024 recommended resolution, never touching the borders; smooth gradients and soft cinematic lighting add subtle depth and a secure, caring, professional financial mood suited to both a small card and a hero banner; no text, no letters, no readable numbers, no logos, no provider names, no brand names, no official seals, no watermark.
```
