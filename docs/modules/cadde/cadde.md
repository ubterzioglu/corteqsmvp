# CorteQS Cadde MVP — Codex Development Document

## 0. Document Purpose

This document describes the first MVP implementation of the **CorteQS Cadde** system based on the provided UI screenshot.

The goal is to give Codex / AI coding agents a clear, implementation-ready specification for building the MVP as a custom product, not as a third-party community SaaS.

CorteQS Cadde is a **city-based diaspora social feed + community discovery + billboard marketplace** experience. It is not a classic forum. It combines:

- global Turkish diaspora feed
- country and city-based filtering
- active cafe / room concept
- user posts and reactions
- people discovery
- premium billboard cards
- consultant / business / event promotion
- future marketplace and networking features

---

## 1. Product Summary

### Product Name

**CorteQS Cadde**

### Core Concept

CorteQS Cadde is the main social discovery area of CorteQS. Users can enter a global or city-specific feed, discover diaspora members, join temporary cafe rooms, view sponsored listings, and interact with posts.

The MVP should focus on creating a working, clean, extendable version of the screenshot.

### One-Sentence Product Definition

CorteQS Cadde is a location-aware diaspora feed where users can discover people, cities, cafes, events, consultants, businesses, and opportunities inside the global Turkish network.

---

## 2. MVP Scope

### Included in MVP

The first MVP must include:

1. Public landing-like Cadde page
2. Header navigation
3. Left location/filter/sidebar
4. World city time chips
5. Active cafes module
6. Main Diaspora Cadde feed
7. Login-gated post creation message
8. Feed posts with reactions
9. Sponsored feed banner
10. Right billboard cards
11. Demo/real content switch
12. Country/city filter UI
13. Basic Supabase-backed data structure
14. Admin-seeded demo content
15. Responsive layout

### Excluded from MVP

These are intentionally excluded from the first MVP:

- real payment integration
- Stripe checkout
- complex ad bidding
- advanced direct messaging
- full cafe audio/video rooms
- AI matchmaking
- complex recommendation engine
- enterprise SSO
- mobile app
- native push notifications
- full marketplace transactions
- real-time chat inside cafes

---

## 3. Target Users

### 3.1 Visitor

A visitor can:

- view public Cadde layout
- see demo feed posts
- see active cafes
- see billboard cards
- select country/city filters
- see login/register prompts
- not create posts
- not react to posts
- not join restricted cafes

### 3.2 Registered Member

A registered member can:

- create posts
- react to posts
- comment on posts
- select country/city
- tag country/city in posts
- join free cafes
- create limited cafes
- appear in people discovery
- manage basic profile

### 3.3 Premium / Verified Member

A premium or verified member can later:

- create longer cafes
- get higher visibility
- appear in highlighted search results
- submit billboard requests
- create events or offers

For MVP, premium can be represented as a boolean field but not fully monetized.

### 3.4 Business / Consultant / Event Owner

A business, consultant, or event owner can later:

- create billboard cards
- publish coupons
- publish appointment CTAs
- publish event CTAs
- track card clicks

For MVP, these cards can be seeded/admin-managed.

### 3.5 Admin

Admin can:

- manage users
- manage posts
- manage cafe rooms
- manage billboard cards
- manage demo/real content
- hide/delete inappropriate content
- approve sponsored content

---

## 4. Screenshot-Based Layout

The MVP page consists of 4 main visual zones:

```text
┌──────────────────────────────────────────────────────────────┐
│ Header / Navbar                                               │
├───────────────┬─────────────────────────────┬────────────────┤
│ Left Sidebar  │ Main Feed Area              │ Right Billboard │
│               │                             │                │
│ Location      │ World Time Chips            │ Premium Cards   │
│ Cafe List     │ Active Cafes                │ Consultant      │
│ People Search │ Diaspora Cadde Feed         │ Restaurant      │
│               │ Sponsored Feed Banner       │ Event           │
└───────────────┴─────────────────────────────┴────────────────┘
```

---

## 5. Header / Navbar Specification

### 5.1 Visual Elements

The header includes:

- CorteQS logo on the left
- navigation links in the center
- login/register actions on the right
- thin colorful gradient line under the header

### 5.2 Navigation Items

Required header links:

```text
Cadde
İş
Sosyal
Harita
Giriş Yap
Kayıt Ol
```

### 5.3 Behavior

- `Cadde` points to the current feed page.
- `İş` can be a dropdown placeholder in MVP.
- `Sosyal` can be a dropdown placeholder in MVP.
- `Harita` can route to `/map` or `globe.corteqs.net` later.
- `Giriş Yap` opens login page/modal.
- `Kayıt Ol` opens registration page/modal.
- On mobile, navigation collapses into a hamburger or simplified top bar.

### 5.4 Suggested Routes

```text
/cadde
/login
/register
/map
/business
/social
```

---

## 6. Left Sidebar Specification

The left sidebar contains location controls, cafe list, and people discovery entry.

### 6.1 Location Card

Visible title:

```text
Konum
```

Elements:

- Primary button: `Caddeye Çık →`
- Subtitle: `global akış`
- Toggle: `Gerçek` / `Demo`
- Helper text: `Gerçek: kullanıcı paylaşımları`
- Country selector: `Ülke`
- City selector: `Şehir`
- Bridge button: `🇹🇷 Köprü`
- Helper text:
  - `Köprü: TR-Diaspora arasında Taşınanlar / İş Yapanlar / Mentor Arayanlar için ortak akış.`

### 6.2 Demo / Real Toggle

MVP behavior:

- `Demo` shows seeded demo content.
- `Gerçek` shows real Supabase content.
- If real content is empty, show an empty state.
- Visitors can toggle but cannot post unless logged in.

Suggested state:

```ts
type FeedMode = "demo" | "real";
```

### 6.3 Country / City Filter

Country selector:

- default: all countries
- options should come from `countries` table

City selector:

- disabled until country is selected, or shows all cities if no country
- options should come from `cities` table

Filtering effect:

- Feed posts are filtered by selected country/city.
- Cafe list is filtered by selected country/city.
- People discovery link carries filter params.

Example URL:

```text
/cadde?mode=real&country=DE&city=Berlin
```

### 6.4 Bridge Mode

Bridge mode is a special cross-feed mode for Turkey ↔ diaspora connection.

MVP behavior:

- Button toggles `bridge=true`
- Feed shows posts tagged with bridge mode
- Copy can say:
  - `TR-Diaspora Köprüsü`
  - `Taşınma, iş, mentorluk ve bağlantılar için ortak akış`

Example URL:

```text
/cadde?bridge=true
```

---

## 7. Cafe Module Specification

The cafe module is a temporary room / mini-community concept.

### 7.1 Left Cafe Card

Visible title:

```text
Cafe'ler
```

Text:

```text
Aktif cafe'ler — açılış 2 saat, Premium 4 saat.
Katılım limitsiz; günde en fazla 3 cafe açabilirsin.
```

Elements:

- active cafe count badge
- search input: `Ülke, şehir veya cafe ara...`
- active cafe item
- CTA: `Kendi cafe'ni aç →`
- CTA: `Kategori hesabı aç →`

### 7.2 Active Cafe Item

Example item from screenshot:

```text
Berlin IT Cafe
Berlin
24/40
1s 23dk
Demo badge
```

Required fields:

- cafe name
- country
- city
- category
- participant count
- participant limit
- remaining time
- demo/real status
- visibility status

### 7.3 Main Active Cafes Row

In the main feed area, show circular cafe shortcuts:

- Add Cafe circle with plus icon
- Active cafe circle with cup icon
- Cafe name under circle
- Remaining time under name

Example:

```text
+ Cafe'ni Ekle
☕ Berlin IT
1s 23dk
```

### 7.4 MVP Cafe Behavior

MVP must support:

- list active cafes
- create cafe modal for logged-in users
- visitors see login prompt
- cafe expires after defined time
- no real chat/video needed in MVP
- clicking cafe can open a basic cafe detail page

### 7.5 Cafe Duration Rules

```text
Free member: 2 hours
Premium member: 4 hours
Daily cafe creation limit: 3
```

### 7.6 Suggested Cafe Routes

```text
/cadde/cafes
/cadde/cafes/new
/cadde/cafes/[slug]
```

---

## 8. World Time Chips

The top of the main area includes colorful city time chips.

### 8.1 Cities in Screenshot

Initial time chips:

```text
San Fran
New York
Londra
Berlin
İstanbul
Dubai
Astana
Şanghay
Tokyo
Sydney
```

### 8.2 MVP Behavior

- Show current local time for each configured city.
- Time updates every minute on client.
- Each chip has a gradient background.
- Clicking a chip filters the feed by that city where possible.
- If city is not available in database, no filtering is applied yet.

### 8.3 Data Model

Cities should include:

```text
name
country_code
timezone
emoji_or_flag
display_order
is_time_chip
```

### 8.4 Example Time Calculation

Use browser JavaScript:

```ts
new Intl.DateTimeFormat("tr-TR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: city.timezone
}).format(new Date())
```

---

## 9. Main Feed: Diaspora Cadde

### 9.1 Section Header

Visible title:

```text
Diaspora Cadde
```

Subtitle:

```text
Sol panelden kıta, ülke veya şehir seç. Akışın anında daralır.
Paylaşırken @Şehir veya @Ülke etiketleyebilirsin.
```

### 9.2 Login-Gated Post Composer

If user is not logged in, show a wide rounded card:

```text
Feed'e paylaşım yapmak için giriş yapmalısınız.
```

If logged in, show composer:

- text area
- country/city tag selector
- bridge mode checkbox
- post type selector
- submit button

### 9.3 Post Card Fields

Each post card includes:

- avatar / initials
- author display name
- small badge or emoji
- relative time
- location tag
- post content
- reaction icons
- comment count
- share icon

Example screenshot content:

```text
Burak Akcakanat ✨ · 5 gün
@Avustralya

Selaaam arkadaşlar
♡ 0    💬 0    👍 😂 🎉
```

### 9.4 Supported Post Types

For MVP:

```ts
type PostType =
  | "general"
  | "question"
  | "help"
  | "job"
  | "housing"
  | "event"
  | "business"
  | "bridge";
```

### 9.5 Feed Sorting

MVP default:

```text
Newest first
```

Later:

```text
Hot
City relevant
Recommended
Premium boosted
```

### 9.6 Feed Filtering

Feed can be filtered by:

- mode: demo / real
- country
- city
- bridge mode
- post type
- author
- search query

---

## 10. Reactions and Comments

### 10.1 MVP Reactions

MVP should support:

```text
like
comment count
emoji quick reactions:
👍
😂
🎉
```

Optional:

```text
❤️
🙏
🚀
```

### 10.2 Visitor Behavior

Visitor clicking reaction:

- open login modal
- do not mutate data

### 10.3 Registered User Behavior

Registered users can:

- add/remove their reaction
- write comments
- delete their own comments

### 10.4 MVP Comment UI

For MVP, comments can open in an expandable area under the post:

- comment input
- latest 3 comments
- “show more” placeholder

---

## 11. Sponsored Feed Banner

The feed includes a large sponsored banner inside the post stream.

### 11.1 Example From Screenshot

```text
Sponsorlu
TÜRK HAVA YOLLARI

Diasporaya özel: %20 indirim TR
Vatana dönüş biletlerinde Miles&Smiles üyelerine ekstra mil.

Keşfet
```

### 11.2 MVP Behavior

- Display seeded sponsored banner after every N posts.
- CTA button opens `target_url`.
- Track impressions and clicks if possible.
- Admin-managed in later version.

### 11.3 Sponsored Banner Types

```ts
type SponsoredPlacement = "feed_banner" | "right_billboard";
```

---

## 12. Right Billboard Module

The right column is a monetization and discovery area.

### 12.1 Billboard Header

Visible title:

```text
BILLBOARD
```

### 12.2 Card Types

MVP supports three card types:

```text
consultant
business
event
```

### 12.3 Consultant Card Example

```text
Premium
Berk Kural
Almanya Vize & Oturum
4.9 · 218 müşteri
Görüşme Al
```

### 12.4 Business Card Example

```text
Premium
Anadolu Restaurant
Berlin · Türk Mutfağı
4.7
-15%
Kuponu Al
```

### 12.5 Event Card Example

```text
Featured
Avrupa Türk Girişimciler Zirvesi
Amsterdam · 24 Mayıs
+247 katılımcı
Bilet Al
```

### 12.6 Billboard CTA Footer

Visible text:

```text
Sen de buraya çıkmak ister misin? Premium ile öne çık →
```

### 12.7 MVP Behavior

- Billboard cards are read-only for visitors.
- CTA click opens login/register or external URL.
- Admin can seed and edit cards through database for MVP.
- No payment integration in first MVP.

---

## 13. People Discovery Card

Left sidebar includes a discovery CTA.

### 13.1 Text

```text
Diasporada İnsanları Ara
Ülke/şehir + meslek + iş arayan, taşınacak filtreleri ile tüm diasporayı keşfet.
Keşfet →
```

### 13.2 MVP Behavior

- Card links to `/people`
- `/people` can be a simple page or placeholder
- It should accept country/city query params from current filter

Example:

```text
/people?country=DE&city=Berlin
```

### 13.3 Future Filters

```text
country
city
profession
industry
looking_for_job
relocating
mentor_available
mentor_needed
business_owner
consultant
```

---

## 14. Data Model — Supabase / PostgreSQL

Use Supabase Postgres as main database.

### 14.1 Core Tables

Recommended MVP tables:

```text
profiles
countries
cities
feed_posts
post_reactions
post_comments
cafes
cafe_members
billboard_cards
sponsored_placements
reports
admin_audit_logs
```

---

## 15. Suggested SQL Schema

### 15.1 Profiles

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  username text unique,
  avatar_url text,
  country_code text,
  city_id uuid,
  profession text,
  role text not null default 'member',
  is_verified boolean not null default false,
  is_premium boolean not null default false,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 15.2 Countries

```sql
create table public.countries (
  code text primary key,
  name text not null,
  name_tr text,
  emoji text,
  display_order int default 999,
  is_active boolean not null default true
);
```

### 15.3 Cities

```sql
create table public.cities (
  id uuid primary key default gen_random_uuid(),
  country_code text not null references public.countries(code),
  name text not null,
  name_tr text,
  timezone text,
  lat numeric,
  lng numeric,
  is_active boolean not null default true,
  is_time_chip boolean not null default false,
  display_order int default 999,
  created_at timestamptz not null default now()
);
```

### 15.4 Feed Posts

```sql
create table public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete set null,
  author_display_name text,
  body text not null,
  post_type text not null default 'general',
  country_code text references public.countries(code),
  city_id uuid references public.cities(id),
  city_tag text,
  country_tag text,
  is_bridge boolean not null default false,
  is_sponsored boolean not null default false,
  is_demo boolean not null default false,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 15.5 Post Reactions

```sql
create table public.post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction_type text not null,
  created_at timestamptz not null default now(),
  unique(post_id, user_id, reaction_type)
);
```

### 15.6 Post Comments

```sql
create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null,
  status text not null default 'published',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 15.7 Cafes

```sql
create table public.cafes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  category text,
  country_code text references public.countries(code),
  city_id uuid references public.cities(id),
  owner_id uuid references public.profiles(id) on delete set null,
  participant_limit int not null default 40,
  current_participant_count int not null default 0,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  is_premium boolean not null default false,
  is_demo boolean not null default false,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
```

### 15.8 Cafe Members

```sql
create table public.cafe_members (
  id uuid primary key default gen_random_uuid(),
  cafe_id uuid not null references public.cafes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique(cafe_id, user_id)
);
```

### 15.9 Billboard Cards

```sql
create table public.billboard_cards (
  id uuid primary key default gen_random_uuid(),
  card_type text not null,
  title text not null,
  subtitle text,
  description text,
  image_url text,
  icon_name text,
  badge_label text,
  rating numeric,
  rating_text text,
  discount_label text,
  location_label text,
  cta_label text not null,
  cta_url text,
  gradient_from text,
  gradient_to text,
  country_code text references public.countries(code),
  city_id uuid references public.cities(id),
  is_premium boolean not null default false,
  is_featured boolean not null default false,
  is_demo boolean not null default false,
  status text not null default 'active',
  display_order int default 999,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);
```

### 15.10 Sponsored Placements

```sql
create table public.sponsored_placements (
  id uuid primary key default gen_random_uuid(),
  placement_type text not null,
  sponsor_name text not null,
  title text not null,
  description text,
  icon_name text,
  cta_label text not null,
  cta_url text,
  gradient_from text,
  gradient_to text,
  is_demo boolean not null default false,
  status text not null default 'active',
  display_order int default 999,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);
```

---

## 16. RLS Policy Direction

Enable RLS on all user-facing tables.

### 16.1 Public Read

Public visitors can read:

```text
published feed_posts
active cafes
active billboard_cards
active sponsored_placements
active countries
active cities
```

### 16.2 Authenticated Write

Authenticated users can:

```text
insert feed_posts as themselves
insert post_reactions as themselves
insert post_comments as themselves
join cafes as themselves
create cafes if daily limit not exceeded
update their own profile
```

### 16.3 Admin Write

Admin role can:

```text
insert/update/delete all MVP content
moderate posts
change billboard status
change cafe status
```

For MVP, admin can be controlled with a `role` field in `profiles`.

---

## 17. Frontend Architecture

### 17.1 Recommended Stack

```text
Next.js App Router
React
TypeScript
Tailwind CSS
shadcn/ui
Supabase JS
TanStack Query
Zustand or React Context
Lucide Icons
date-fns
```

### 17.2 Suggested App Routes

```text
/
 /cadde
 /cadde/cafes
 /cadde/cafes/new
 /cadde/cafes/[slug]
 /people
 /login
 /register
 /admin
 /admin/posts
 /admin/cafes
 /admin/billboard
```

### 17.3 Suggested Component Structure

```text
src/
  app/
    cadde/
      page.tsx
      loading.tsx
      error.tsx
    people/
      page.tsx
    admin/
      page.tsx

  components/
    layout/
      SiteHeader.tsx
      GradientBar.tsx
      PageShell.tsx

    cadde/
      CaddePage.tsx
      LocationCard.tsx
      CafeSidebarCard.tsx
      PeopleDiscoveryCard.tsx
      WorldTimeChips.tsx
      ActiveCafeRow.tsx
      FeedHeader.tsx
      PostComposerGate.tsx
      PostComposer.tsx
      FeedList.tsx
      FeedPostCard.tsx
      SponsoredFeedBanner.tsx
      BillboardColumn.tsx
      BillboardCard.tsx

    ui/
      Button.tsx
      Card.tsx
      Badge.tsx
      Select.tsx
      Tabs.tsx
      Avatar.tsx
      Input.tsx

  lib/
    supabase/
      client.ts
      server.ts
      queries.ts
    hooks/
      useCaddeFilters.ts
      useWorldClock.ts
      useFeedPosts.ts
      useCafes.ts
      useBillboard.ts
    utils/
      time.ts
      cn.ts
      slugify.ts
```

---

## 18. State Management

### 18.1 Cadde Filter State

```ts
type CaddeFilters = {
  mode: "demo" | "real";
  countryCode?: string;
  cityId?: string;
  bridge?: boolean;
  query?: string;
};
```

### 18.2 URL Sync

Filter state should be reflected in query params:

```text
/cadde?mode=demo&country=DE&city=berlin&bridge=false
```

### 18.3 Default State

```ts
const defaultFilters = {
  mode: "demo",
  countryCode: undefined,
  cityId: undefined,
  bridge: false
};
```

---

## 19. API / Query Layer

Use Supabase queries directly for MVP. If server actions are preferred, wrap database calls in server functions.

### 19.1 Required Query Functions

```ts
getCountries()
getCities(countryCode?: string)
getTimeChipCities()
getFeedPosts(filters)
createFeedPost(input)
togglePostReaction(postId, reactionType)
getPostComments(postId)
createPostComment(postId, body)
getActiveCafes(filters)
createCafe(input)
joinCafe(cafeId)
getBillboardCards(filters)
getSponsoredPlacements()
```

### 19.2 Feed Query Rules

- `status = published`
- `is_demo = true` if demo mode
- `is_demo = false` if real mode
- filter by `country_code` if selected
- filter by `city_id` if selected
- filter by `is_bridge = true` if bridge mode enabled
- order by `created_at desc`

---

## 20. Responsive Design

### 20.1 Desktop

Desktop layout:

```text
left sidebar: 260px
main feed: flexible, max 760px
right billboard: 280px
gap: 24px
```

### 20.2 Tablet

Tablet behavior:

- left sidebar collapses above feed or becomes drawer
- right billboard moves below feed
- time chips remain horizontal scroll

### 20.3 Mobile

Mobile behavior:

- header simplified
- filters in bottom sheet or top filter button
- cafes row horizontal scroll
- feed full width
- billboard cards appear after several posts
- people discovery appears as feed card

---

## 21. UI / Visual Direction

### 21.1 General Style

The screenshot uses:

- clean white/off-white background
- rounded cards
- light shadows
- orange primary CTA
- blue/green/purple gradients
- small badges
- soft borders
- modern SaaS/community look

### 21.2 Suggested CSS Variables

Approximate tokens:

```css
:root {
  --cq-bg: #faf8f5;
  --cq-card: #ffffff;
  --cq-border: #e9e2dc;
  --cq-text: #2f3440;
  --cq-muted: #7b8190;
  --cq-primary: #f45a2c;
  --cq-primary-dark: #e4471b;
  --cq-blue: #20a8ff;
  --cq-green: #25c7a0;
  --cq-purple: #9b4dff;
  --cq-pink: #ff3d7f;
  --cq-radius-card: 18px;
}
```

### 21.3 Important UI Details

- The page should feel spacious.
- Keep card borders subtle.
- Do not overuse heavy shadows.
- Use orange for primary actions.
- Use gradient only for highlights, chips, and billboards.
- Keep billboard cards visually attractive but not too aggressive.
- Use icons consistently.
- Keep text short and readable.

---

## 22. Seed Data Requirements

For MVP, seed enough demo data to make the page look alive.

### 22.1 Countries

```text
Türkiye
Germany
United Kingdom
United States
Netherlands
United Arab Emirates
Japan
Australia
China
Kazakhstan
```

### 22.2 Cities

```text
Istanbul
Berlin
London
New York
San Francisco
Dubai
Amsterdam
Tokyo
Sydney
Shanghai
Astana
```

### 22.3 Demo Posts

Create 8–12 demo posts with:

- different countries
- different cities
- different post types
- bridge examples
- Turkish diaspora tone
- short friendly messages

### 22.4 Demo Cafes

Create 2–4 demo cafes:

```text
Berlin IT Cafe
Londra Yeni Gelenler
Amsterdam Girişimciler
Dubai Networking
```

### 22.5 Demo Billboard Cards

Create at least:

```text
1 consultant card
1 restaurant/business card
1 event card
```

### 22.6 Demo Sponsored Banner

Create one sponsored feed banner similar to:

```text
Diasporaya özel: %20 indirim TR
```

---

## 23. Admin MVP

The MVP admin panel can be basic.

### 23.1 Required Admin Pages

```text
/admin
/admin/posts
/admin/cafes
/admin/billboard
/admin/sponsored
/admin/countries
/admin/cities
```

### 23.2 Admin Actions

Admin can:

- create/update/delete billboard cards
- create/update/delete sponsored banners
- hide/unhide posts
- close cafes
- create countries/cities
- toggle demo/real status

### 23.3 Admin Implementation Shortcut

For first MVP, admin CRUD can be simple table-based pages.

Do not over-engineer.

---

## 24. Authentication

Use Supabase Auth.

### 24.1 MVP Auth Methods

Required:

```text
email/password
magic link optional
Google login optional
```

### 24.2 Auth Redirects

- After login, redirect to `/cadde`
- After registration, create `profiles` row
- If profile incomplete, redirect to `/onboarding`

### 24.3 Onboarding Fields

MVP onboarding:

```text
display name
username
country
city
profession
interests
```

---

## 25. Onboarding

### 25.1 Goal

Collect minimum data needed for city-based diaspora discovery.

### 25.2 Steps

```text
Step 1: Basic profile
Step 2: Country and city
Step 3: Profession / interests
Step 4: Visibility preferences
```

### 25.3 Visibility Options

```text
public in people discovery
visible only to logged-in members
hidden
```

For MVP, default can be:

```text
visible only to logged-in members
```

---

## 26. Analytics / Tracking

MVP should track simple events where possible.

### 26.1 Events

```text
cadde_page_view
country_filter_changed
city_filter_changed
bridge_mode_enabled
post_created
reaction_added
comment_created
cafe_created
cafe_joined
billboard_clicked
sponsored_banner_clicked
register_clicked
login_clicked
```

### 26.2 Implementation

Start simple:

- Supabase table `analytics_events`
- or Umami if already available

Do not block MVP on advanced analytics.

---

## 27. Moderation

### 27.1 User Reports

MVP should include a small report action on posts.

Report reasons:

```text
spam
inappropriate
scam
harassment
wrong_category
other
```

### 27.2 Admin Moderation

Admin can set post status:

```text
published
hidden
deleted
under_review
```

### 27.3 Basic Abuse Prevention

MVP limits:

```text
max posts per user per day: 20
max comments per user per day: 100
max cafes per user per day: 3
```

---

## 28. Security Requirements

### 28.1 Required

- Supabase RLS enabled
- user can only edit own content
- visitor cannot mutate data
- admin-only access to admin pages
- validate all inputs
- escape/render text safely
- no raw HTML in posts
- rate limit critical actions if possible

### 28.2 Recommended

- server-side checks for cafe creation limits
- database constraints for reaction uniqueness
- status fields for soft moderation
- audit log for admin actions

---

## 29. Performance Requirements

### 29.1 MVP Targets

```text
Initial page load: under 3 seconds on normal connection
Feed query: max 20 posts per request
Billboard query: max 5 active cards
Cafe query: max 10 active cafes
```

### 29.2 Pagination

Feed should use:

```text
limit 20
cursor pagination by created_at
```

### 29.3 Indexes

Add indexes:

```sql
create index feed_posts_status_created_idx on public.feed_posts(status, created_at desc);
create index feed_posts_country_city_idx on public.feed_posts(country_code, city_id);
create index feed_posts_demo_idx on public.feed_posts(is_demo);
create index cafes_status_ends_idx on public.cafes(status, ends_at);
create index billboard_status_order_idx on public.billboard_cards(status, display_order);
```

---

## 30. MVP Acceptance Criteria

### 30.1 Page Layout

- Header appears correctly.
- Left sidebar appears on desktop.
- Main feed appears in center.
- Right billboard appears on desktop.
- Mobile layout does not break.

### 30.2 Filters

- Demo/real toggle changes visible data.
- Country filter updates feed and cafes.
- City filter updates feed and cafes.
- Bridge button filters bridge posts.

### 30.3 Feed

- Visitor can see feed.
- Visitor sees login gate for posting.
- Logged-in user can create a post.
- Posts show author, time, location, body, reactions, comments.
- Reactions work for logged-in users.
- Visitor reaction click opens login prompt.

### 30.4 Cafe

- Active cafes are listed.
- Expired cafes are not shown.
- Logged-in user can create cafe.
- User cannot create more than 3 cafes per day.
- Cafe duration follows free/premium rule.

### 30.5 Billboard

- Right billboard cards render.
- Consultant, business, and event card types render differently.
- CTA clicks are tracked or at least routed.
- Inactive cards are hidden.

### 30.6 Admin

- Admin can manage billboard cards.
- Admin can hide posts.
- Admin can close cafes.
- Non-admin cannot access admin pages.

---

## 31. Implementation Phases

### Phase 1 — Static UI Clone

Goal: Recreate screenshot as responsive static page.

Tasks:

```text
- Build /cadde route
- Build header
- Build left sidebar
- Build time chips
- Build active cafes row
- Build feed cards
- Build billboard cards
- Add responsive behavior
```

No database required yet.

### Phase 2 — Supabase Data Layer

Goal: Connect UI to Supabase.

Tasks:

```text
- Create tables
- Add seed data
- Create query functions
- Replace static data with Supabase data
- Add demo/real mode
- Add country/city filtering
```

### Phase 3 — Auth and Posting

Goal: Enable basic user participation.

Tasks:

```text
- Add Supabase Auth
- Create profile on signup
- Add post composer for logged-in users
- Add create post mutation
- Add reactions
- Add comments
```

### Phase 4 — Cafe MVP

Goal: Implement cafe creation and listing.

Tasks:

```text
- Add cafe table
- Add active cafe filtering
- Add create cafe modal
- Add duration rules
- Add daily limit
- Add cafe detail page
```

### Phase 5 — Billboard Admin

Goal: Make billboard/cards admin manageable.

Tasks:

```text
- Add billboard table
- Add sponsored placements table
- Build admin card CRUD
- Track CTA clicks
```

### Phase 6 — Polish and Launch Readiness

Goal: Prepare for real users.

Tasks:

```text
- Empty states
- Error states
- Loading skeletons
- Mobile fixes
- Basic moderation
- SEO metadata
- Privacy text
- Terms links
- Rate limits
```

---

## 32. Codex Task Prompt

Use this prompt for Codex:

```md
You are working on the CorteQS Cadde MVP.

Build a custom Next.js + Supabase community product based on the provided MVP document and screenshot.

The product is not a generic forum. It is a city-based Turkish diaspora social feed with:
- location filters
- demo/real mode
- active cafe rooms
- global city time chips
- main feed posts
- reactions/comments
- sponsored feed banner
- right-side billboard cards
- people discovery entry
- admin-manageable seeded content

First implement the static UI for `/cadde` as close as possible to the screenshot.
Then connect the page to Supabase using the schema from the MVP document.
Keep the code modular, typed, and easy to extend.

Use:
- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Supabase
- shadcn/ui if available
- Lucide icons

Do not add payment integration yet.
Do not add external community SaaS.
Do not over-engineer.
Focus on a clean MVP that can be extended.
```

---

## 33. Environment Variables

Suggested `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_CADDE_DEFAULT_MODE=demo
```

Optional later:

```env
RESEND_API_KEY=
UMAMI_WEBSITE_ID=
NEXT_PUBLIC_UMAMI_URL=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

---

## 34. Definition of Done

The MVP is done when:

```text
- /cadde visually matches the provided screenshot closely enough
- demo data renders without login
- real data can be rendered from Supabase
- country/city filtering works
- visitor login gate works
- logged-in users can create posts
- reactions and comments work
- active cafes render and expire correctly
- billboard cards render from database
- basic admin management exists
- page is responsive on desktop/tablet/mobile
- RLS policies prevent unauthorized writes
- seed script can recreate demo state
```

---

## 35. Final Product Direction

CorteQS Cadde should remain a custom CorteQS product.

Open-source community platforms such as HumHub, Discourse, Forem, Flarum, or NodeBB can be studied for inspiration, but they should not define the architecture.

The strategic decision:

```text
CorteQS Cadde = custom Next.js + Supabase product
Community SaaS = not used
Open-source community platforms = reference only
Infrastructure services = minimal and controlled
```

This keeps the product flexible for future CorteQS-specific features:

- diaspora profile graph
- verified consultants
- business marketplace
- city ambassadors
- premium billboard
- referral system
- AI-assisted people discovery
- country/city knowledge hubs
- event discovery
- WhatsApp community integration
- Globe integration
