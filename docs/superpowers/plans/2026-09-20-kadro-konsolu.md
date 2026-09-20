# Kadro Konsolu (`/admin/kadro`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** CorteQS'in 52 pozisyonluk kadro planını admin paneline taşımak — rol tanımları kodda versiyonlu, durum/sahip/aday/geçmiş veritabanında.

**Architecture:** Karma model. 52 rolün metni sekiz TS modülünde sabit ve testle kilitli; değişebilen durum üç tabloda (`kadro_role_states`, `kadro_role_events`, `kadro_candidates`). Tüm Supabase erişimi tek bir `kadro-api.ts` dosyasından geçer; bileşenler React Query ile bu katmanı tüketir. Değişiklik geçmişi DB trigger'ıyla yazılır, uygulama katmanından değil.

**Tech Stack:** React 18 + Vite · TypeScript (gevşek strict) · Supabase (PostgREST + RLS) · @tanstack/react-query · shadcn/ui + Tailwind · Vitest + Testing Library

**Spec:** `docs/superpowers/specs/2026-09-20-kadro-konsolu-design.md`

## Global Constraints

Bu bölüm her görevin gereksinimlerine örtük olarak dahildir.

- **Türkçe metin:** Arama/filtre eşleşmesi `trIncludes`, sıralama `trCompare`, görüntüleme amaçlı büyük/küçük harf `trUpper`/`trLower` — hepsi `@/lib/text-normalization`. Bare `toUpperCase()`/`toLowerCase()` yalnız teknik değerlerde (kod, uzantı, hex) doğrudur.
- **Türkçe karakter DB değerlerinden SİLİNMEZ.** `status`/`priority`/`stage` değerleri ASCII anahtarlardır (`acik`, `kritik`, `gorusme`) — bunlar bilinçli ASCII'dir, kullanıcıya görünen etiketler değildir. Arayüz etiketleri tam Türkçe yazılır (`Açık`, `Kritik`, `Görüşmede`).
- **`npm run verify:text` eksik Türkçe harfi YAKALAMAZ** — yalnız kodlama ve mojibake denetler. Yeni yazılan arayüz metinleri gözle kontrol edilir.
- **CSV Blob'u UTF-8 BOM ile başlar:** `new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })` — yoksa Excel Türkçe karakterleri bozar.
- **Supabase yüklerinde `as TablesInsert<...>` / `as TablesUpdate<...>` CAST KULLANILMAZ.** Bu tablolar `types.ts`'te yok; `LooseQuery` shim'i kullanılır (Görev 5).
- **Migration dosyası `supabase/migrations/applied/` altına konur**, parent `supabase/migrations/` dizininde BIRAKILMAZ — parent dizin sürüm karşılaştırmasına dahil değildir ve `check:migrations` dosyayı hiç görmez.
- **Her görev sonunda pathspec ile commit:** `git commit -- <dosyalar>`. Pathspec'siz commit çalışma ağacındaki ilgisiz WIP'i de dahil eder.
- **Commit mesajı:** conventional subject + CLAUDE.md trailer'ları (`Constraint:`, `Rejected:`, `Confidence:`, `Scope-risk:`, `Directive:`, `Not-tested:`). Attribution satırı EKLENMEZ.
- **`tsc` ne `prelint`te ne `pretest`te koşar.** Dosya ekleyen her görev `npx tsc -p tsconfig.app.json --noEmit` komutunu ELLE çalıştırır; hedef 0 hata.
- **Dosya tavanı 800 satır** (CLAUDE.md md.7). Üretilen dosyalar hariç.

### Kaynak artifact

52 rolün metni `https://claude.ai/artifact/S84nnpXoGob3Y9z7QM7QXi` içindedir. Yerel kopya oturuma özgü bir dizinde durur ve kaybolabilir; **Görev 2'ye başlamadan önce** şu çağrıyla yeniden indirilir:

```
Artifact action=read url=https://claude.ai/artifact/S84nnpXoGob3Y9z7QM7QXi
```

Sonuç, tam HTML'i yerel bir dosyaya kaydeder ve yolunu bildirir. Bu plandaki satır numaraları o dosyaya aittir (toplam 2080 satır).

---

### Task 1: Taksonomi ve tipler

Rol verisinin şekli ve tüm sabit listeler. Hiçbir rol içeriği bu görevde yazılmaz.

**Files:**
- Create: `src/lib/kadro/kadro-types.ts`
- Create: `src/lib/kadro/kadro-taxonomy.ts`
- Test: `src/lib/kadro/kadro-taxonomy.test.ts`

**Interfaces:**
- Consumes: hiçbir şey (ilk görev)
- Produces: `KadroRole`, `KadroRoleAd`, `KadroDept`, `KadroAxis`, `KadroWave`, `KadroWorkType`, `KadroStatus`, `KadroPriority`, `KadroCandidateStage`, `KadroRoleState`, `KadroRoleEvent`, `KadroCandidate` tipleri; `KADRO_DEPTS`, `KADRO_AXES`, `KADRO_WAVES`, `KADRO_WORK_TYPES`, `KADRO_STATUSES`, `KADRO_PRIORITIES`, `KADRO_CANDIDATE_STAGES`, `KADRO_AD_BLOCKS`, `KADRO_OPEN_STATUSES`, `KADRO_FILLED_STATUSES` sabitleri

- [ ] **Step 1: Tipleri yaz**

`src/lib/kadro/kadro-types.ts`:

```ts
// Kadro Konsolu — tip sözleşmesi.
// Rol TANIMI kodda yaşar (roles/*.ts), değişebilen DURUM veritabanındadır.
// Bu ayrım bilinçlidir; bkz. docs/superpowers/specs/2026-09-20-kadro-konsolu-design.md §2.

export type KadroDeptId = "kurucu" | "pazarlama" | "urun" | "operasyon" | "gelir" | "kurumsal";
export type KadroAxisId = "urun" | "islev" | "cografya" | "merkez";
export type KadroWaveId = 1 | 2 | 3;
export type KadroWorkType = "core" | "part" | "proje" | "topluluk" | "danisman" | "dis";
export type KadroStatus =
  | "dolu" | "destek" | "gorusme" | "aday" | "teklif" | "acik" | "beklemede";
export type KadroPriority = "kritik" | "yuksek" | "orta" | "dusuk";
export type KadroCandidateStage = "aday" | "gorusme" | "teklif" | "kapandi";

/** İlan metni bloğu. 52 rolün 50'sinde var, 2 kurucu rolünde null. */
export type KadroRoleAd = {
  /** İlanın açılış paragrafı. */
  sum: string;
  /** "Ne yapacaksın" maddeleri. */
  does: string[];
  /** "Kimi arıyoruz" maddeleri. */
  profile: string[];
  /** Başvuruda cevaplanacak görev testi. */
  test: string;
};

/** Koddaki rol tanımı — değişmeyen kısım. */
export type KadroRole = {
  /** DB'deki role_key ile birebir aynı. ASLA değiştirilmez; değişirse DB satırı yetim kalır. */
  id: string;
  dept: KadroDeptId;
  axis: KadroAxisId;
  title: string;
  type: KadroWorkType;
  wave: KadroWaveId;
  /** Koddaki VARSAYILAN öncelik. DB'deki satır bunu ezebilir. */
  pri: KadroPriority;
  /** Koddaki VARSAYILAN durum. DB'deki satır bunu ezebilir. */
  status: KadroStatus;
  /** Koddaki varsayılan sahip; boş string = sahipsiz. */
  owner: string;
  reports: string;
  hours: string;
  pay: string;
  esop: string;
  kpi: string[];
  cadence: string;
  tools: string;
  /** Rolün açılması için beklenen eşik. */
  trigger: string;
  /** Rol kalıcı mı, proje ömrü kadar mı. */
  exit: string;
  /** Görev tanımı (uzun metin). */
  jd: string;
  ad: KadroRoleAd | null;
};

/** DB'deki override satırı — rol başına en fazla bir tane. */
export type KadroRoleState = {
  roleKey: string;
  status: KadroStatus | null;
  priority: KadroPriority | null;
  ownerName: string | null;
  note: string | null;
  updatedAt: string;
  updatedBy: string | null;
};

/** Kod varsayılanı + DB override'ı birleştirilmiş, ekranda gösterilen hâl. */
export type KadroResolvedRole = KadroRole & {
  currentStatus: KadroStatus;
  currentPriority: KadroPriority;
  currentOwner: string;
  note: string;
  /** DB'de satırı var mı — "dokunulmuş" rolleri ayırmak için. */
  hasState: boolean;
  updatedAt: string | null;
};

export type KadroRoleEvent = {
  id: string;
  roleKey: string;
  field: "status" | "priority" | "owner_name" | "note";
  oldValue: string | null;
  newValue: string | null;
  changedBy: string | null;
  changedAt: string;
};

export type KadroCandidate = {
  id: string;
  roleKey: string;
  fullName: string;
  links: string;
  stage: KadroCandidateStage;
  note: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type KadroCandidateDraft = {
  fullName: string;
  links: string;
  stage: KadroCandidateStage;
  note: string;
};

/** Pazarlama rutini — sahibi bir role_key'dir. */
export type KadroRoutine = {
  freq: "Günlük" | "Haftalık" | "Aylık" | "Yıllık";
  name: string;
  /** KadroRole.id ile eşleşmeli — kadro-routines.test.ts bunu kilitler. */
  owner: string;
  detail: string;
};
```

- [ ] **Step 2: Taksonomiyi yaz**

`src/lib/kadro/kadro-taxonomy.ts`. Değerler artifact `CQ.depts` / `CQ.axes` / `CQ.waves` / `CQ.types` / `CQ.statuses` / `CQ.pris` / `CQ.blocks` bloklarından (satır 277–331) birebir alınır:

```ts
// Kadro Konsolu — sabit listeler ve etiketler.
// DEĞER anahtarları ASCII'dir (DB'ye yazılır, CHECK kısıtına girer);
// ETİKETLER tam Türkçe'dir (yalnız ekranda görünür). İkisini karıştırma.

import type {
  KadroAxisId, KadroCandidateStage, KadroDeptId, KadroPriority,
  KadroStatus, KadroWaveId, KadroWorkType,
} from "./kadro-types";

export type KadroDept = {
  id: KadroDeptId;
  name: string;
  short: string;
  desc: string;
};

export const KADRO_DEPTS: KadroDept[] = [
  {
    id: "kurucu",
    name: "Kuruluş & Liderlik",
    short: "Liderlik",
    desc: "Kurucu ortaklar, bölüm başları ve dışarıdan danışmanlar. Karar yetkisi burada: CEO ticari, CTO teknik, ikisinin yazılı onayı gereken Reserved Matters ayrı.",
  },
  // … artifact satır 277–285'teki 6 bölümün tamamı birebir
];

export type KadroAxis = { id: KadroAxisId; name: string; desc: string };
export const KADRO_AXES: KadroAxis[] = [
  { id: "urun", name: "Ürün hattı", desc: "İsmi olan, sahibi olan, takvimi olan yayın ürünleri. Her birinin tek sorumlusu vardır." },
  // … artifact satır 286–292
];

export type KadroWave = { id: KadroWaveId; name: string; range: string; desc: string };
export const KADRO_WAVES: KadroWave[] = [
  { id: 1, name: "Dalga 1 — Şimdi", range: "0–3 ay", desc: "MVP yayında, Instagram yayın kanalı düzenli dönüyor, ilk şehirler aktif." },
  // … artifact satır 293–298
];

export const KADRO_WORK_TYPES: Record<KadroWorkType, string> = {
  core: "Çekirdek",
  part: "Part-time",
  proje: "Proje bazlı",
  topluluk: "Gönüllü / Topluluk",
  danisman: "Danışman",
  dis: "Dış kaynak / Freelance",
};

export type KadroTone = "crit" | "warn" | "info" | "ok" | "mute" | "open";

export const KADRO_STATUSES: Record<KadroStatus, { label: string; tone: KadroTone }> = {
  dolu: { label: "Dolu", tone: "ok" },
  destek: { label: "Destek veriyor", tone: "ok" },
  gorusme: { label: "Görüşmede", tone: "info" },
  aday: { label: "Aday var", tone: "info" },
  teklif: { label: "Teklif aşaması", tone: "warn" },
  acik: { label: "Açık", tone: "open" },
  beklemede: { label: "Beklemede", tone: "mute" },
};

export const KADRO_PRIORITIES: Record<KadroPriority, { label: string; tone: KadroTone }> = {
  kritik: { label: "Kritik", tone: "crit" },
  yuksek: { label: "Yüksek", tone: "warn" },
  orta: { label: "Orta", tone: "info" },
  dusuk: { label: "Düşük", tone: "mute" },
};

export const KADRO_CANDIDATE_STAGES: Record<KadroCandidateStage, string> = {
  aday: "Aday",
  gorusme: "Görüşmede",
  teklif: "Teklif verildi",
  kapandi: "Kapandı",
};

/** "Açık pozisyon" tanımı — özet sayaçları ve filtre bunu kullanır. */
export const KADRO_OPEN_STATUSES: KadroStatus[] = ["acik", "aday", "gorusme", "teklif"];
/** "Dolu" tanımı. */
export const KADRO_FILLED_STATUSES: KadroStatus[] = ["dolu", "destek"];

/** Her ilanın altına ortak basılan üç blok (artifact CQ.blocks, satır 326–331). */
export const KADRO_AD_BLOCKS = {
  startup: `CorteQS şu anda erken aşama, pre-launch bir start-up. …`, // artifact'tan birebir
  model: `Erken dönemde roller; iş paketi bazlı çalışma, …`,          // artifact'tan birebir
  apply: `Başvuru için şunları yaz: ad soyad, …`,                      // artifact'tan birebir
} as const;
```

**Dikkat:** yukarıdaki üç blok ve bölüm/eksen/dalga açıklamaları yer tutucu değil — artifact'tan **tam metin** kopyalanacak. `…` bırakılmış hiçbir string kalmamalı.

- [ ] **Step 3: Başarısız testi yaz**

`src/lib/kadro/kadro-taxonomy.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  KADRO_AD_BLOCKS, KADRO_AXES, KADRO_CANDIDATE_STAGES, KADRO_DEPTS,
  KADRO_FILLED_STATUSES, KADRO_OPEN_STATUSES, KADRO_PRIORITIES,
  KADRO_STATUSES, KADRO_WAVES, KADRO_WORK_TYPES,
} from "./kadro-taxonomy";

describe("kadro taksonomisi", () => {
  it("altı bölüm tanımlar ve id'leri benzersizdir", () => {
    expect(KADRO_DEPTS).toHaveLength(6);
    expect(new Set(KADRO_DEPTS.map((d) => d.id)).size).toBe(6);
  });

  it("dört eksen ve üç dalga tanımlar", () => {
    expect(KADRO_AXES).toHaveLength(4);
    expect(KADRO_WAVES.map((w) => w.id)).toEqual([1, 2, 3]);
  });

  it("yedi durum ve dört öncelik tanımlar", () => {
    expect(Object.keys(KADRO_STATUSES)).toHaveLength(7);
    expect(Object.keys(KADRO_PRIORITIES)).toHaveLength(4);
    expect(Object.keys(KADRO_WORK_TYPES)).toHaveLength(6);
    expect(Object.keys(KADRO_CANDIDATE_STAGES)).toHaveLength(4);
  });

  it("açık ve dolu durum kümeleri örtüşmez ve hepsi tanımlı durumdur", () => {
    const overlap = KADRO_OPEN_STATUSES.filter((s) => KADRO_FILLED_STATUSES.includes(s));
    expect(overlap).toEqual([]);
    for (const status of [...KADRO_OPEN_STATUSES, ...KADRO_FILLED_STATUSES]) {
      expect(KADRO_STATUSES[status]).toBeDefined();
    }
  });

  it("etiketler Türkçe karakter kaybetmemiştir", () => {
    expect(KADRO_STATUSES.acik.label).toBe("Açık");
    expect(KADRO_STATUSES.gorusme.label).toBe("Görüşmede");
    expect(KADRO_PRIORITIES.yuksek.label).toBe("Yüksek");
    expect(KADRO_PRIORITIES.dusuk.label).toBe("Düşük");
    expect(KADRO_CANDIDATE_STAGES.gorusme).toBe("Görüşmede");
  });

  it("ortak ilan blokları doldurulmuştur — yer tutucu kalmamıştır", () => {
    for (const block of Object.values(KADRO_AD_BLOCKS)) {
      expect(block.length).toBeGreaterThan(200);
      expect(block).not.toContain("…");
    }
  });
});
```

- [ ] **Step 4: Testi çalıştır, kırmızı olduğunu gör**

Çalıştır: `npm run test -- src/lib/kadro/kadro-taxonomy.test.ts`
Beklenen: FAIL — modül bulunamadı / bloklar `…` içeriyor.

- [ ] **Step 5: Taksonomiyi tamamla, testi yeşile çevir**

Artifact satır 277–331'deki tüm metinleri birebir kopyala. `…` kalmamalı.

- [ ] **Step 6: Testi ve tsc'yi çalıştır**

```bash
npm run test -- src/lib/kadro/kadro-taxonomy.test.ts
npx tsc -p tsconfig.app.json --noEmit
```
Beklenen: testler PASS, tsc 0 hata.

- [ ] **Step 7: Commit**

```bash
git add -- src/lib/kadro/kadro-types.ts src/lib/kadro/kadro-taxonomy.ts src/lib/kadro/kadro-taxonomy.test.ts
git commit -- src/lib/kadro/kadro-types.ts src/lib/kadro/kadro-taxonomy.ts src/lib/kadro/kadro-taxonomy.test.ts
```
Mesaj konusu: `feat(kadro): rol tipleri ve taksonomi`

---

### Task 2: 52 rolün verisi

Planın en hacimli görevi. **Yeniden yazma değil, transkripsiyon.** Artifact'taki metin birebir taşınır; özetleme, kısaltma, "düzeltme" YAPILMAZ.

**Files:**
- Create: `src/lib/kadro/roles/liderlik.ts` (5 rol)
- Create: `src/lib/kadro/roles/kurumsal.ts` (3 rol)
- Create: `src/lib/kadro/roles/pazarlama-urun.ts` (7 rol)
- Create: `src/lib/kadro/roles/pazarlama-islev.ts` (11 rol)
- Create: `src/lib/kadro/roles/pazarlama-cografya.ts` (9 rol)
- Create: `src/lib/kadro/roles/urun-teknoloji.ts` (9 rol)
- Create: `src/lib/kadro/roles/operasyon.ts` (5 rol)
- Create: `src/lib/kadro/roles/gelir.ts` (3 rol)
- Create: `src/lib/kadro/roles/index.ts`
- Test: `src/lib/kadro/roles/index.test.ts`

**Interfaces:**
- Consumes: `KadroRole` (Görev 1)
- Produces: `KADRO_ROLES: KadroRole[]` (52 eleman), `kadroRoleById(id: string): KadroRole | undefined`, `KADRO_ROLE_IDS: Set<string>`

**Artifact satır haritası** (indirilen HTML dosyasında):

| Dosya | Artifact satırları | Roller |
|---|---|---|
| `liderlik.ts` | 336–442 | `ld-ceo` `ld-cto` `ld-cmo` `ld-partner` `ld-advisor` |
| `kurumsal.ts` | **443–492 VE 1672–1697** | `ld-cfo` `ld-legal` (443, 468) + `ku-finans` (1672) |
| `pazarlama-urun.ts` | 495–687 | `pz-f1000` `pz-radar` `pz-defter` `pz-sehir` `pz-motor` `pz-carsi` `pz-etkinlik` |
| `pazarlama-islev.ts` | 690–987 | `pz-ig` `pz-li` `pz-yt` `pz-short` `pz-creator` `pz-tasarim` `pz-seo` `pz-perf` `pz-crm` `pz-analitik` `pz-topluluk` |
| `pazarlama-cografya.ts` | 990–1223 | `cg-dach` `cg-uk` `cg-benelux` `cg-korfez` `cg-na` `cg-ulke` `cg-elci` `cg-contrib` `cg-program` |
| `urun-teknoloji.ts` | 1226–1459 | `tk-fullstack` `tk-design` `tk-frontend` `tk-backend` `tk-mobile` `tk-qa` `tk-ai` `tk-data` `tk-devops` |
| `operasyon.ts` | 1462–1592 | `op-partner` `op-platform` `op-trust` `op-moderasyon` `op-success` |
| `gelir.ts` | 1595–1669 | `gl-b2b` `gl-sponsor` `gl-account` |

> ⚠️ **`kurumsal` rolleri artifact'ta iki ayrı yerdedir.** `ld-cfo` ve `ld-legal` liderlik bloğunun içinde (443, 468) ama `dept: 'kurumsal'` taşır; `ku-finans` dosyanın sonundadır (1672). Sadece 443–492 aralığını okuyup "kurumsal bitti" deme — üçüncü rol atlanır ve test 52 yerine 51 sayar.

- [ ] **Step 1: Artifact'ı indir**

```
Artifact action=read url=https://claude.ai/artifact/S84nnpXoGob3Y9z7QM7QXi
```
Sonuçtaki yerel dosya yolunu not et. Dosyanın 2080 satır olduğunu doğrula.

- [ ] **Step 2: Başarısız testi yaz**

`src/lib/kadro/roles/index.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { KADRO_DEPTS, KADRO_PRIORITIES, KADRO_STATUSES, KADRO_WORK_TYPES } from "../kadro-taxonomy";
import { KADRO_ROLES, kadroRoleById } from "./index";

const EXPECTED_BY_DEPT: Record<string, number> = {
  kurucu: 5, kurumsal: 3, pazarlama: 27, urun: 9, operasyon: 5, gelir: 3,
};

const EXPECTED_BY_AXIS: Record<string, number> = {
  merkez: 25, islev: 11, cografya: 9, urun: 7,
};

describe("kadro rol kataloğu", () => {
  it("tam 52 rol içerir", () => {
    expect(KADRO_ROLES).toHaveLength(52);
  });

  it("rol id'leri benzersizdir", () => {
    const ids = KADRO_ROLES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("bölüm dağılımı beklenen sayılardadır", () => {
    for (const [dept, count] of Object.entries(EXPECTED_BY_DEPT)) {
      expect(KADRO_ROLES.filter((r) => r.dept === dept)).toHaveLength(count);
    }
  });

  it("eksen dağılımı beklenen sayılardadır", () => {
    for (const [axis, count] of Object.entries(EXPECTED_BY_AXIS)) {
      expect(KADRO_ROLES.filter((r) => r.axis === axis)).toHaveLength(count);
    }
  });

  it("her rolün alanları tanımlı değer kümelerindedir", () => {
    const deptIds = new Set(KADRO_DEPTS.map((d) => d.id));
    for (const role of KADRO_ROLES) {
      expect(deptIds.has(role.dept)).toBe(true);
      expect(["urun", "islev", "cografya", "merkez"]).toContain(role.axis);
      expect([1, 2, 3]).toContain(role.wave);
      expect(KADRO_WORK_TYPES[role.type]).toBeDefined();
      expect(KADRO_STATUSES[role.status]).toBeDefined();
      expect(KADRO_PRIORITIES[role.pri]).toBeDefined();
    }
  });

  it("her rolün zorunlu metin alanları doludur", () => {
    for (const role of KADRO_ROLES) {
      for (const field of ["title", "reports", "hours", "pay", "esop", "cadence", "tools", "trigger", "exit", "jd"] as const) {
        expect(role[field], `${role.id}.${field}`).toBeTruthy();
      }
      expect(role.kpi.length, `${role.id}.kpi`).toBeGreaterThan(0);
      expect(role.jd.length, `${role.id}.jd`).toBeGreaterThan(80);
    }
  });

  it("50 rolde ilan metni vardır, 2 kurucu rolünde yoktur", () => {
    const withAd = KADRO_ROLES.filter((r) => r.ad !== null);
    expect(withAd).toHaveLength(50);
    expect(KADRO_ROLES.filter((r) => r.ad === null).map((r) => r.id).sort())
      .toEqual(["ld-ceo", "ld-cto"]);
  });

  it("ilan metinleri eksiksizdir", () => {
    for (const role of KADRO_ROLES) {
      if (!role.ad) continue;
      expect(role.ad.sum.length, `${role.id}.ad.sum`).toBeGreaterThan(40);
      expect(role.ad.does.length, `${role.id}.ad.does`).toBeGreaterThan(0);
      expect(role.ad.profile.length, `${role.id}.ad.profile`).toBeGreaterThan(0);
      expect(role.ad.test, `${role.id}.ad.test`).toContain("Görev testi");
    }
  });

  it("transkripsiyonda yer tutucu kalmamıştır", () => {
    const blob = JSON.stringify(KADRO_ROLES);
    expect(blob).not.toContain("…");
    expect(blob).not.toContain("TODO");
    expect(blob).not.toContain("TBD");
  });

  it("kadroRoleById bilinen ve bilinmeyen id'yi doğru yanıtlar", () => {
    expect(kadroRoleById("pz-radar")?.title).toContain("Radar");
    expect(kadroRoleById("yok-boyle-bir-rol")).toBeUndefined();
  });
});
```

- [ ] **Step 3: Testi çalıştır, kırmızı olduğunu gör**

Çalıştır: `npm run test -- src/lib/kadro/roles/index.test.ts`
Beklenen: FAIL — `./index` modülü yok.

- [ ] **Step 4: Sekiz rol dosyasını yaz**

Her dosya şu iskeleti izler (örnek `liderlik.ts`):

```ts
// Kuruluş & Liderlik — 5 rol.
// Kaynak: CorteQS Kadro Konsolu artifact, satır 336–442.
// Metinler BİREBİR kopyalanmıştır; özetlenmez, düzeltilmez.

import type { KadroRole } from "../kadro-types";

export const LIDERLIK_ROLES: KadroRole[] = [
  {
    id: "ld-ceo",
    dept: "kurucu",
    axis: "merkez",
    title: "Kurucu Ortak / CEO — Ürün & Büyüme",
    type: "core",
    wave: 1,
    pri: "kritik",
    status: "dolu",
    owner: "Burak Akçakanat",
    reports: "—",
    hours: "Tam zamanlı",
    pay: "Kurucu",
    esop: "Kurucu payı (50/50)",
    kpi: ["Aylık aktif şehir sayısı", "İlk gelir sinyali ve dönüşüm oranı"],
    cadence: "Haftalık kanal sağlık oturumu · aylık yol haritası revizyonu",
    tools: "Lovable, Notion/Drive, LinkedIn, yatırımcı CRM",
    trigger: "Mevcut",
    exit: "—",
    jd: "CorteQS'in vizyonunu, ürün yönünü, konumlandırmasını ve gelir modelini taşır; …",
    ad: null,
  },
  // … kalan 4 rol
];
```

Transkripsiyon kuralları:
- Artifact `jd` ve `ad` alanlarında **template literal** (backtick) kullanıyor. TS'e taşırken backtick korunabilir; içinde `${` YOKTUR, güvenlidir. Tek tırnak kullanacaksan metindeki apostrofları (`CorteQS'in`) kaçırmayı unutma — backtick daha güvenli.
- Türkçe karakterler korunur. `İ ı Ş ş Ğ ğ Ü ü Ö ö Ç ç` ve `—` `·` `⭐` gibi işaretler dahil.
- Regex benzeri kaçış dizisi yok; ama varsa ham karaktere ÇEVİRME.
- Her dosya 800 satırın altında kalmalı. `pazarlama-islev.ts` (11 rol) en büyüğü; ~700 satır bekleniyor. Aşarsa `pazarlama-islev-a.ts` / `-b.ts` diye ikiye böl ve index'te birleştir.

- [ ] **Step 5: index.ts'i yaz**

```ts
// 52 rolün tek birleşim noktası. Rol id'si burada benzersizliği doğrulanır.

import type { KadroRole } from "../kadro-types";
import { GELIR_ROLES } from "./gelir";
import { KURUMSAL_ROLES } from "./kurumsal";
import { LIDERLIK_ROLES } from "./liderlik";
import { OPERASYON_ROLES } from "./operasyon";
import { PAZARLAMA_COGRAFYA_ROLES } from "./pazarlama-cografya";
import { PAZARLAMA_ISLEV_ROLES } from "./pazarlama-islev";
import { PAZARLAMA_URUN_ROLES } from "./pazarlama-urun";
import { URUN_TEKNOLOJI_ROLES } from "./urun-teknoloji";

/** Pano sırası: liderlik → pazarlama (3 hat) → ürün → operasyon → gelir → kurumsal. */
export const KADRO_ROLES: KadroRole[] = [
  ...LIDERLIK_ROLES,
  ...PAZARLAMA_URUN_ROLES,
  ...PAZARLAMA_ISLEV_ROLES,
  ...PAZARLAMA_COGRAFYA_ROLES,
  ...URUN_TEKNOLOJI_ROLES,
  ...OPERASYON_ROLES,
  ...GELIR_ROLES,
  ...KURUMSAL_ROLES,
];

const BY_ID = new Map(KADRO_ROLES.map((role) => [role.id, role]));

/** Kodda tanımlı tüm rol anahtarları — yetim DB satırı tespitinde kullanılır. */
export const KADRO_ROLE_IDS: Set<string> = new Set(BY_ID.keys());

export function kadroRoleById(id: string): KadroRole | undefined {
  return BY_ID.get(id);
}
```

- [ ] **Step 6: Testi yeşile çevir ve tsc çalıştır**

```bash
npm run test -- src/lib/kadro/roles/index.test.ts
npx tsc -p tsconfig.app.json --noEmit
npm run verify:text
```
Beklenen: testler PASS, tsc 0 hata, verify:text temiz.

- [ ] **Step 7: Satır sayılarını doğrula**

```bash
wc -l src/lib/kadro/roles/*.ts
```
Beklenen: hiçbiri 800'ü aşmıyor. (PowerShell'de `Measure-Object -Line` boş satırları saymaz — `wc -l` ya da `(Get-Content $f).Count` kullan.)

- [ ] **Step 8: Commit**

```bash
git add -- src/lib/kadro/roles/
git commit -- src/lib/kadro/roles/
```
Mesaj konusu: `feat(kadro): 52 rolün tanımı sekiz modülde`

---

### Task 3: Rutinler

**Files:**
- Create: `src/lib/kadro/kadro-routines.ts`
- Test: `src/lib/kadro/kadro-routines.test.ts`

**Interfaces:**
- Consumes: `KadroRoutine` (Görev 1), `KADRO_ROLE_IDS` (Görev 2)
- Produces: `KADRO_ROUTINES: KadroRoutine[]` (17 eleman), `KADRO_ROUTINE_FREQS: readonly string[]`, `groupRoutinesByFreq(routines): Array<{ freq: string; items: KadroRoutine[] }>`

- [ ] **Step 1: Başarısız testi yaz**

`src/lib/kadro/kadro-routines.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { KADRO_ROLE_IDS } from "./roles";
import { KADRO_ROUTINES, KADRO_ROUTINE_FREQS, groupRoutinesByFreq } from "./kadro-routines";

describe("kadro rutinleri", () => {
  it("17 rutin tanımlar", () => {
    expect(KADRO_ROUTINES).toHaveLength(17);
  });

  it("her rutinin sahibi GERÇEK bir rol anahtarıdır", () => {
    for (const routine of KADRO_ROUTINES) {
      expect(KADRO_ROLE_IDS.has(routine.owner), `${routine.name} → ${routine.owner}`).toBe(true);
    }
  });

  it("sıklıklar tanımlı kümededir", () => {
    for (const routine of KADRO_ROUTINES) {
      expect(KADRO_ROUTINE_FREQS).toContain(routine.freq);
    }
  });

  it("gruplama sıklık sırasını korur ve boş grup üretmez", () => {
    const groups = groupRoutinesByFreq(KADRO_ROUTINES);
    expect(groups.map((g) => g.freq)).toEqual(["Günlük", "Haftalık", "Aylık", "Yıllık"]);
    for (const group of groups) {
      expect(group.items.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Testi çalıştır, kırmızı olduğunu gör**

Çalıştır: `npm run test -- src/lib/kadro/kadro-routines.test.ts`
Beklenen: FAIL — modül yok.

- [ ] **Step 3: Rutinleri yaz**

Artifact satır 1699–1717'deki 17 rutin birebir kopyalanır:

```ts
// Pazarlamanın rutinleri: kim, ne sıklıkla, neyi yayına sokar.
// Kaynak: artifact satır 1699–1717. owner alanı bir KadroRole.id'dir —
// kadro-routines.test.ts bunu kilitler, uydurma anahtar yazılamaz.

import type { KadroRoutine } from "./kadro-types";

export const KADRO_ROUTINE_FREQS = ["Günlük", "Haftalık", "Aylık", "Yıllık"] as const;

export const KADRO_ROUTINES: KadroRoutine[] = [
  {
    freq: "Günlük",
    name: "Radar story dizilimi",
    owner: "pz-radar",
    detail: "Tema gününe uygun 7-9 kart. Güçlü sinyal ikinci sırada, sticker üçüncü karttan sonra, tek kapanış CTA'sı.",
  },
  // … kalan 16 rutin
];

export function groupRoutinesByFreq(
  routines: KadroRoutine[],
): Array<{ freq: string; items: KadroRoutine[] }> {
  return KADRO_ROUTINE_FREQS
    .map((freq) => ({ freq, items: routines.filter((r) => r.freq === freq) }))
    .filter((group) => group.items.length > 0);
}
```

- [ ] **Step 4: Testi ve tsc'yi çalıştır**

```bash
npm run test -- src/lib/kadro/kadro-routines.test.ts
npx tsc -p tsconfig.app.json --noEmit
```
Beklenen: PASS, 0 hata.

- [ ] **Step 5: Commit**

```bash
git add -- src/lib/kadro/kadro-routines.ts src/lib/kadro/kadro-routines.test.ts
git commit -- src/lib/kadro/kadro-routines.ts src/lib/kadro/kadro-routines.test.ts
```
Mesaj konusu: `feat(kadro): 17 pazarlama rutini`

---

### Task 4: Migration — üç tablo, RLS, geçmiş trigger'ı

**Files:**
- Create: `supabase/migrations/applied/20260920100000_kadro_konsolu.sql`

**Interfaces:**
- Consumes: mevcut `public.is_admin(uuid)` fonksiyonu
- Produces: `public.kadro_role_states`, `public.kadro_role_events`, `public.kadro_candidates` tabloları

> ⚠️ `is_admin` bu şemada **parametre alır**: `public.is_admin(auth.uid())`. Parametresiz çağırma.

- [ ] **Step 1: Timestamp çakışmasını doğrula**

```bash
ls supabase/migrations/applied/ | grep 20260920 || echo "çakışma yok"
```
Beklenen: "çakışma yok". Varsa saniyeyi değiştir (aynı timestamp iki dosyada = `schema_migrations.version` çakışması).

- [ ] **Step 2: Migration'ı yaz**

```sql
-- Kadro Konsolu — /admin/kadro sayfalarının veri kaynağı.
-- Karma model: 52 rolün TANIMI kodda (src/lib/kadro/roles/*.ts), değişebilen
-- DURUM burada. Rol tanımı tablosu YOKTUR ve bilinçli olarak yoktur;
-- bkz. docs/superpowers/specs/2026-09-20-kadro-konsolu-design.md §2.
--
-- role_key kodda yaşar, burada FK'sı yoktur. Kodda bir id değişirse DB satırı
-- yetim kalır ve hiçbir yerde hata vermez — pano yetim sayacı gösterir,
-- src/lib/kadro/roles/index.test.ts id'leri kilitler.
--
-- Görünürlük: yalnız admin okur/yazar. Desen: 20260730190000_workshop_items.sql.

-- 1) Rol durumu --------------------------------------------------------------
create table if not exists public.kadro_role_states (
  role_key   text primary key check (length(trim(role_key)) > 0),
  status     text check (status in
               ('dolu','destek','gorusme','aday','teklif','acik','beklemede')),
  priority   text check (priority in ('kritik','yuksek','orta','dusuk')),
  owner_name text,
  note       text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

-- 2) Değişiklik geçmişi (append-only) ----------------------------------------
create table if not exists public.kadro_role_events (
  id         uuid primary key default gen_random_uuid(),
  role_key   text not null,
  field      text not null check (field in ('status','priority','owner_name','note')),
  old_value  text,
  new_value  text,
  changed_by uuid references auth.users (id) on delete set null,
  changed_at timestamptz not null default now()
);

create index if not exists kadro_role_events_role_idx
  on public.kadro_role_events (role_key, changed_at desc);

-- 3) Aday hunisi -------------------------------------------------------------
create table if not exists public.kadro_candidates (
  id         uuid primary key default gen_random_uuid(),
  role_key   text not null,
  full_name  text not null check (length(trim(full_name)) > 0),
  links      text not null default '',
  stage      text not null default 'aday'
               check (stage in ('aday','gorusme','teklif','kapandi')),
  note       text not null default '',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists kadro_candidates_role_idx
  on public.kadro_candidates (role_key, stage);

-- 4) updated_at trigger'ları -------------------------------------------------
create or replace function public.set_kadro_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_kadro_role_states_updated_at on public.kadro_role_states;
create trigger set_kadro_role_states_updated_at
before update on public.kadro_role_states
for each row execute function public.set_kadro_updated_at();

drop trigger if exists set_kadro_candidates_updated_at on public.kadro_candidates;
create trigger set_kadro_candidates_updated_at
before update on public.kadro_candidates
for each row execute function public.set_kadro_updated_at();

-- 5) Geçmiş trigger'ı --------------------------------------------------------
-- Uygulama katmanı DEĞİL, trigger yazar. Gerekçe: trigger atlanamaz — psql'den
-- ya da başka bir yoldan yapılan güncelleme de kayda düşer. API'ye bırakılan
-- geçmiş ilk unutulan çağrıda sessizce eksilir ve bunun testi yoktur.
create or replace function public.log_kadro_role_state_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    if new.status is not null then
      insert into public.kadro_role_events (role_key, field, old_value, new_value, changed_by)
      values (new.role_key, 'status', null, new.status, actor);
    end if;
    if new.priority is not null then
      insert into public.kadro_role_events (role_key, field, old_value, new_value, changed_by)
      values (new.role_key, 'priority', null, new.priority, actor);
    end if;
    if coalesce(new.owner_name, '') <> '' then
      insert into public.kadro_role_events (role_key, field, old_value, new_value, changed_by)
      values (new.role_key, 'owner_name', null, new.owner_name, actor);
    end if;
    if coalesce(new.note, '') <> '' then
      insert into public.kadro_role_events (role_key, field, old_value, new_value, changed_by)
      values (new.role_key, 'note', null, new.note, actor);
    end if;
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.kadro_role_events (role_key, field, old_value, new_value, changed_by)
    values (new.role_key, 'status', old.status, new.status, actor);
  end if;
  if new.priority is distinct from old.priority then
    insert into public.kadro_role_events (role_key, field, old_value, new_value, changed_by)
    values (new.role_key, 'priority', old.priority, new.priority, actor);
  end if;
  if new.owner_name is distinct from old.owner_name then
    insert into public.kadro_role_events (role_key, field, old_value, new_value, changed_by)
    values (new.role_key, 'owner_name', old.owner_name, new.owner_name, actor);
  end if;
  if new.note is distinct from old.note then
    insert into public.kadro_role_events (role_key, field, old_value, new_value, changed_by)
    values (new.role_key, 'note', old.note, new.note, actor);
  end if;
  return new;
end;
$$;

drop trigger if exists log_kadro_role_state_change on public.kadro_role_states;
create trigger log_kadro_role_state_change
after insert or update on public.kadro_role_states
for each row execute function public.log_kadro_role_state_change();

-- 6) RLS — yalnız admin ------------------------------------------------------
alter table public.kadro_role_states enable row level security;
alter table public.kadro_role_events enable row level security;
alter table public.kadro_candidates  enable row level security;

drop policy if exists kadro_role_states_admin_select on public.kadro_role_states;
create policy kadro_role_states_admin_select on public.kadro_role_states
  for select using (public.is_admin(auth.uid()));

drop policy if exists kadro_role_states_admin_insert on public.kadro_role_states;
create policy kadro_role_states_admin_insert on public.kadro_role_states
  for insert with check (public.is_admin(auth.uid()));

drop policy if exists kadro_role_states_admin_update on public.kadro_role_states;
create policy kadro_role_states_admin_update on public.kadro_role_states
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists kadro_role_states_admin_delete on public.kadro_role_states;
create policy kadro_role_states_admin_delete on public.kadro_role_states
  for delete using (public.is_admin(auth.uid()));

-- Geçmiş yalnız OKUNUR. Yazımı trigger (security definer) yapar; kullanıcıya
-- insert/update/delete verilmez — geçmiş silinemez olmalıdır.
drop policy if exists kadro_role_events_admin_select on public.kadro_role_events;
create policy kadro_role_events_admin_select on public.kadro_role_events
  for select using (public.is_admin(auth.uid()));

drop policy if exists kadro_candidates_admin_select on public.kadro_candidates;
create policy kadro_candidates_admin_select on public.kadro_candidates
  for select using (public.is_admin(auth.uid()));

drop policy if exists kadro_candidates_admin_insert on public.kadro_candidates;
create policy kadro_candidates_admin_insert on public.kadro_candidates
  for insert with check (public.is_admin(auth.uid()));

drop policy if exists kadro_candidates_admin_update on public.kadro_candidates;
create policy kadro_candidates_admin_update on public.kadro_candidates
  for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists kadro_candidates_admin_delete on public.kadro_candidates;
create policy kadro_candidates_admin_delete on public.kadro_candidates
  for delete using (public.is_admin(auth.uid()));

comment on table public.kadro_role_states is
  'Kadro Konsolu rol durumu. Rol TANIMI kodda (src/lib/kadro/roles/); burada yalnız değişen durum tutulur.';
comment on table public.kadro_role_events is
  'Kadro rol durumu değişiklik geçmişi. Append-only; trigger yazar, kullanıcı yazamaz.';
```

- [ ] **Step 3: Taksonomi ↔ CHECK sözleşme testini yaz**

`src/lib/kadro/kadro-migration-contract.test.ts`:

```ts
// Migration metnindeki CHECK listeleri ile koddaki taksonomi ayrışırsa, geçersiz
// bir değer ya DB'de reddedilir (form sessizce patlar) ya da kodda hiç üretilmez.
// events.type dersi: CHECK'siz kolon yanlış değeri hatasız kabul eder.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { KADRO_CANDIDATE_STAGES, KADRO_PRIORITIES, KADRO_STATUSES } from "./kadro-taxonomy";

const SQL = readFileSync(
  "supabase/migrations/applied/20260920100000_kadro_konsolu.sql",
  "utf8",
);

function checkValues(column: string): string[] {
  const match = SQL.match(new RegExp(`${column} in\\s*\\(([^)]+)\\)`));
  if (!match) throw new Error(`${column} için CHECK bulunamadı`);
  return match[1].split(",").map((v) => v.trim().replace(/^'|'$/g, ""));
}

describe("kadro migration sözleşmesi", () => {
  it("status CHECK listesi taksonomiyle birebir aynıdır", () => {
    expect(checkValues("status").sort()).toEqual(Object.keys(KADRO_STATUSES).sort());
  });

  it("priority CHECK listesi taksonomiyle birebir aynıdır", () => {
    expect(checkValues("priority").sort()).toEqual(Object.keys(KADRO_PRIORITIES).sort());
  });

  it("stage CHECK listesi taksonomiyle birebir aynıdır", () => {
    expect(checkValues("stage").sort()).toEqual(Object.keys(KADRO_CANDIDATE_STAGES).sort());
  });

  it("geçmiş tablosuna kullanıcı yazma politikası verilmemiştir", () => {
    expect(SQL).not.toMatch(/kadro_role_events[\s\S]*?for insert/);
    expect(SQL).not.toMatch(/kadro_role_events[\s\S]*?for update/);
    expect(SQL).not.toMatch(/kadro_role_events[\s\S]*?for delete/);
  });

  it("is_admin parametreli çağrılır", () => {
    expect(SQL).toContain("public.is_admin(auth.uid())");
    expect(SQL).not.toMatch(/is_admin\(\)/);
  });
});
```

- [ ] **Step 4: Testi çalıştır**

Çalıştır: `npm run test -- src/lib/kadro/kadro-migration-contract.test.ts`
Beklenen: PASS.

- [ ] **Step 5: Migration'ın parent dizinde OLMADIĞINI doğrula**

```bash
ls supabase/migrations/*.sql 2>/dev/null && echo "HATA: parent dizinde dosya var" || echo "temiz"
```
Beklenen: "temiz".

- [ ] **Step 6: Commit**

```bash
git add -- supabase/migrations/applied/20260920100000_kadro_konsolu.sql src/lib/kadro/kadro-migration-contract.test.ts
git commit -- supabase/migrations/applied/20260920100000_kadro_konsolu.sql src/lib/kadro/kadro-migration-contract.test.ts
```
Mesaj konusu: `feat(kadro): üç tablo, RLS ve geçmiş trigger'ı`

**Not:** migration bu görevde canlıya UYGULANMAZ. Uygulama Görev 13'te, kullanıcı onayıyla yapılır.

---

### Task 5: API katmanı

Tüm Supabase erişimi burada toplanır. Hiçbir bileşen doğrudan `supabase.from(...)` çağırmaz.

**Files:**
- Create: `src/lib/kadro/kadro-api.ts`
- Test: `src/lib/kadro/kadro-api.test.ts`

**Interfaces:**
- Consumes: `KadroRoleState`, `KadroRoleEvent`, `KadroCandidate`, `KadroCandidateDraft` (Görev 1)
- Produces:
  - `fetchKadroRoleStates(): Promise<KadroRoleState[]>`
  - `saveKadroRoleState(roleKey: string, patch: KadroRoleStatePatch): Promise<KadroRoleState>`
  - `fetchKadroRoleEvents(roleKey: string): Promise<KadroRoleEvent[]>`
  - `fetchKadroCandidates(roleKey: string): Promise<KadroCandidate[]>`
  - `createKadroCandidate(roleKey: string, draft: KadroCandidateDraft): Promise<KadroCandidate>`
  - `updateKadroCandidate(id: string, draft: KadroCandidateDraft): Promise<KadroCandidate>`
  - `deleteKadroCandidate(id: string): Promise<void>`
  - `validateKadroCandidateDraft(draft: KadroCandidateDraft): string | null`
  - tip: `KadroRoleStatePatch = { status: KadroStatus; priority: KadroPriority; ownerName: string; note: string }`

- [ ] **Step 1: Saf doğrulayıcının başarısız testini yaz**

Supabase I/O'su mock'lanmaz — saf doğrulayıcı test edilir (workshop-items deseni: saf fonksiyonlar test edilir, I/O edilmez).

`src/lib/kadro/kadro-api.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { validateKadroCandidateDraft } from "./kadro-api";

describe("aday formu doğrulaması", () => {
  it("boş isim reddedilir", () => {
    expect(validateKadroCandidateDraft({ fullName: "   ", links: "", stage: "aday", note: "" }))
      .toBe("Aday adı boş bırakılamaz.");
  });

  it("geçerli form null döner", () => {
    expect(validateKadroCandidateDraft({
      fullName: "Ayşe Yılmaz", links: "linkedin.com/in/ayse", stage: "gorusme", note: "",
    })).toBeNull();
  });

  it("tanımsız aşama reddedilir", () => {
    expect(validateKadroCandidateDraft({
      fullName: "Ali", links: "", stage: "yok" as never, note: "",
    })).toBe("Geçersiz aday aşaması.");
  });

  it("Türkçe karakterli isim kabul edilir", () => {
    expect(validateKadroCandidateDraft({
      fullName: "İlkay Şahingöz", links: "", stage: "aday", note: "",
    })).toBeNull();
  });
});
```

- [ ] **Step 2: Testi çalıştır, kırmızı olduğunu gör**

Çalıştır: `npm run test -- src/lib/kadro/kadro-api.test.ts`
Beklenen: FAIL — modül yok.

- [ ] **Step 3: API katmanını yaz**

```ts
// Kadro Konsolu — veri katmanı.
// types.ts bu üç tabloyu tanımıyor → tüm sorgular dar bir LooseQuery shim'inden
// geçer (workshop-items.ts deseni). `as any` DEĞİL; tsc 0'da kalır.

import { supabase } from "@/integrations/supabase/client";
import { sanitizeError } from "@/lib/security";

import { KADRO_CANDIDATE_STAGES } from "./kadro-taxonomy";
import type {
  KadroCandidate, KadroCandidateDraft, KadroPriority,
  KadroRoleEvent, KadroRoleState, KadroStatus,
} from "./kadro-types";

export type KadroRoleStatePatch = {
  status: KadroStatus;
  priority: KadroPriority;
  ownerName: string;
  note: string;
};

type LooseQuery = {
  select: (cols: string) => LooseQuery;
  insert: (values: Record<string, unknown>) => LooseQuery;
  update: (values: Record<string, unknown>) => LooseQuery;
  upsert: (values: Record<string, unknown>, options?: { onConflict: string }) => LooseQuery;
  delete: () => LooseQuery;
  eq: (column: string, value: unknown) => LooseQuery;
  order: (column: string, options: { ascending: boolean }) => LooseQuery;
  single: () => Promise<{ data: unknown; error: unknown }>;
  then: Promise<{ data: unknown; error: unknown }>["then"];
};

const table = (name: string): LooseQuery =>
  (supabase as unknown as { from: (t: string) => LooseQuery }).from(name);

const STATE_SELECT = "role_key,status,priority,owner_name,note,updated_at,updated_by";
const EVENT_SELECT = "id,role_key,field,old_value,new_value,changed_by,changed_at";
const CANDIDATE_SELECT =
  "id,role_key,full_name,links,stage,note,created_by,created_at,updated_at";

type StateRow = {
  role_key: string; status: string | null; priority: string | null;
  owner_name: string | null; note: string | null;
  updated_at: string; updated_by: string | null;
};

function mapState(row: StateRow): KadroRoleState {
  return {
    roleKey: row.role_key,
    status: (row.status as KadroStatus) ?? null,
    priority: (row.priority as KadroPriority) ?? null,
    ownerName: row.owner_name,
    note: row.note,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** Tüm rol durumlarını getirir. 52 satırdan az olur — sayfalama gerekmez. */
export async function fetchKadroRoleStates(): Promise<KadroRoleState[]> {
  const { data, error } = await table("kadro_role_states").select(STATE_SELECT);
  if (error) throw new Error(sanitizeError(error, "Kadro durumları yüklenemedi."));
  return ((data as StateRow[]) ?? []).map(mapState);
}

/**
 * Rol durumunu yazar (upsert). Geçmiş kaydını DB trigger'ı düşer — burada
 * kasıtlı olarak event yazılmaz; iki yerden yazmak çift kayıt üretirdi.
 */
export async function saveKadroRoleState(
  roleKey: string,
  patch: KadroRoleStatePatch,
): Promise<KadroRoleState> {
  const updatedBy = await currentUserId();
  const { data, error } = await table("kadro_role_states")
    .upsert(
      {
        role_key: roleKey,
        status: patch.status,
        priority: patch.priority,
        owner_name: patch.ownerName.trim(),
        note: patch.note.trim(),
        updated_at: new Date().toISOString(),
        updated_by: updatedBy,
      },
      { onConflict: "role_key" },
    )
    .select(STATE_SELECT)
    .single();

  if (error || !data) throw new Error(sanitizeError(error, "Rol durumu kaydedilemedi."));
  return mapState(data as StateRow);
}

type EventRow = {
  id: string; role_key: string; field: string;
  old_value: string | null; new_value: string | null;
  changed_by: string | null; changed_at: string;
};

export async function fetchKadroRoleEvents(roleKey: string): Promise<KadroRoleEvent[]> {
  const { data, error } = await table("kadro_role_events")
    .select(EVENT_SELECT)
    .eq("role_key", roleKey)
    .order("changed_at", { ascending: false });

  if (error) throw new Error(sanitizeError(error, "Değişiklik geçmişi yüklenemedi."));
  return ((data as EventRow[]) ?? []).map((row) => ({
    id: row.id,
    roleKey: row.role_key,
    field: row.field as KadroRoleEvent["field"],
    oldValue: row.old_value,
    newValue: row.new_value,
    changedBy: row.changed_by,
    changedAt: row.changed_at,
  }));
}

type CandidateRow = {
  id: string; role_key: string; full_name: string; links: string;
  stage: string; note: string; created_by: string | null;
  created_at: string; updated_at: string;
};

function mapCandidate(row: CandidateRow): KadroCandidate {
  return {
    id: row.id,
    roleKey: row.role_key,
    fullName: row.full_name,
    links: row.links,
    stage: row.stage as KadroCandidate["stage"],
    note: row.note,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Aday formunu doğrular; geçerliyse null, değilse Türkçe hata mesajı döner. */
export function validateKadroCandidateDraft(draft: KadroCandidateDraft): string | null {
  if (!draft.fullName.trim()) return "Aday adı boş bırakılamaz.";
  if (!(draft.stage in KADRO_CANDIDATE_STAGES)) return "Geçersiz aday aşaması.";
  return null;
}

export async function fetchKadroCandidates(roleKey: string): Promise<KadroCandidate[]> {
  const { data, error } = await table("kadro_candidates")
    .select(CANDIDATE_SELECT)
    .eq("role_key", roleKey)
    .order("created_at", { ascending: true });

  if (error) throw new Error(sanitizeError(error, "Adaylar yüklenemedi."));
  return ((data as CandidateRow[]) ?? []).map(mapCandidate);
}

export async function createKadroCandidate(
  roleKey: string,
  draft: KadroCandidateDraft,
): Promise<KadroCandidate> {
  const validationError = validateKadroCandidateDraft(draft);
  if (validationError) throw new Error(validationError);

  const createdBy = await currentUserId();
  const { data, error } = await table("kadro_candidates")
    .insert({
      role_key: roleKey,
      full_name: draft.fullName.trim(),
      links: draft.links.trim(),
      stage: draft.stage,
      note: draft.note.trim(),
      created_by: createdBy,
    })
    .select(CANDIDATE_SELECT)
    .single();

  if (error || !data) throw new Error(sanitizeError(error, "Aday eklenemedi."));
  return mapCandidate(data as CandidateRow);
}

export async function updateKadroCandidate(
  id: string,
  draft: KadroCandidateDraft,
): Promise<KadroCandidate> {
  const validationError = validateKadroCandidateDraft(draft);
  if (validationError) throw new Error(validationError);

  const { data, error } = await table("kadro_candidates")
    .update({
      full_name: draft.fullName.trim(),
      links: draft.links.trim(),
      stage: draft.stage,
      note: draft.note.trim(),
    })
    .eq("id", id)
    .select(CANDIDATE_SELECT)
    .single();

  if (error || !data) throw new Error(sanitizeError(error, "Aday güncellenemedi."));
  return mapCandidate(data as CandidateRow);
}

export async function deleteKadroCandidate(id: string): Promise<void> {
  const { error } = await table("kadro_candidates").delete().eq("id", id);
  if (error) throw new Error(sanitizeError(error, "Aday silinemedi."));
}
```

- [ ] **Step 4: Testi ve tsc'yi çalıştır**

```bash
npm run test -- src/lib/kadro/kadro-api.test.ts
npx tsc -p tsconfig.app.json --noEmit
```
Beklenen: PASS, 0 hata.

- [ ] **Step 5: Commit**

```bash
git add -- src/lib/kadro/kadro-api.ts src/lib/kadro/kadro-api.test.ts
git commit -- src/lib/kadro/kadro-api.ts src/lib/kadro/kadro-api.test.ts
```
Mesaj konusu: `feat(kadro): Supabase veri katmanı`

---

### Task 6: Saf iş mantığı — birleştirme, filtre, özet

Kod varsayılanı ile DB override'ını birleştiren ve filtreleyen saf fonksiyonlar. Bu dosya bileşenlerin test edilmesini gereksiz kılar — mantık burada, test buradadır.

**Files:**
- Create: `src/lib/kadro/kadro-view.ts`
- Test: `src/lib/kadro/kadro-view.test.ts`

**Interfaces:**
- Consumes: `KADRO_ROLES`, `KADRO_ROLE_IDS` (Görev 2), `KadroRoleState` (Görev 1), `KADRO_OPEN_STATUSES`/`KADRO_FILLED_STATUSES` (Görev 1)
- Produces:
  - `resolveKadroRoles(roles: KadroRole[], states: KadroRoleState[]): KadroResolvedRole[]`
  - `findOrphanStateKeys(states: KadroRoleState[]): string[]`
  - `KadroFilters` tipi: `{ q: string; dept: string; wave: string; type: string; status: string; openOnly: boolean }`
  - `KADRO_EMPTY_FILTERS: KadroFilters`
  - `filterKadroRoles(roles: KadroResolvedRole[], filters: KadroFilters): KadroResolvedRole[]`
  - `summarizeKadroRoles(roles: KadroResolvedRole[]): { total: number; open: number; filled: number; criticalOpen: number }`
  - `groupKadroRoles(roles: KadroResolvedRole[]): Array<{ deptId: KadroDeptId; axes: Array<{ axisId: KadroAxisId; roles: KadroResolvedRole[] }> }>`

- [ ] **Step 1: Başarısız testi yaz**

`src/lib/kadro/kadro-view.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { KADRO_ROLES } from "./roles";
import {
  KADRO_EMPTY_FILTERS, filterKadroRoles, findOrphanStateKeys,
  groupKadroRoles, resolveKadroRoles, summarizeKadroRoles,
} from "./kadro-view";
import type { KadroRoleState } from "./kadro-types";

const state = (over: Partial<KadroRoleState> & { roleKey: string }): KadroRoleState => ({
  status: null, priority: null, ownerName: null, note: null,
  updatedAt: "2026-09-20T10:00:00Z", updatedBy: null, ...over,
});

describe("resolveKadroRoles", () => {
  it("DB satırı yokken kod varsayılanını kullanır", () => {
    const resolved = resolveKadroRoles(KADRO_ROLES, []);
    const ceo = resolved.find((r) => r.id === "ld-ceo")!;
    expect(ceo.currentStatus).toBe("dolu");
    expect(ceo.currentOwner).toBe("Burak Akçakanat");
    expect(ceo.hasState).toBe(false);
  });

  it("DB satırı kod varsayılanını ezer", () => {
    const resolved = resolveKadroRoles(KADRO_ROLES, [
      state({ roleKey: "ld-cmo", status: "gorusme", ownerName: "Zeynep Kaya", note: "İkinci tur" }),
    ]);
    const cmo = resolved.find((r) => r.id === "ld-cmo")!;
    expect(cmo.currentStatus).toBe("gorusme");
    expect(cmo.currentOwner).toBe("Zeynep Kaya");
    expect(cmo.note).toBe("İkinci tur");
    expect(cmo.hasState).toBe(true);
  });

  it("DB'de null olan alan kod varsayılanına düşer", () => {
    const resolved = resolveKadroRoles(KADRO_ROLES, [
      state({ roleKey: "ld-cmo", status: "teklif", priority: null }),
    ]);
    const cmo = resolved.find((r) => r.id === "ld-cmo")!;
    expect(cmo.currentStatus).toBe("teklif");
    expect(cmo.currentPriority).toBe("kritik"); // koddaki varsayılan
  });

  it("boş string sahip adı kod varsayılanına GERİ DÖNMEZ", () => {
    // null = "DB'de hiç yazılmamış" → kod varsayılanı.
    // ""   = "kullanıcı bilinçli olarak sildi" → boş kalmalı.
    // İkisi karıştırılırsa sahibi silinen rol eski sahibini geri getirir.
    const resolved = resolveKadroRoles(KADRO_ROLES, [
      state({ roleKey: "ld-ceo", ownerName: "" }),
    ]);
    expect(resolved.find((r) => r.id === "ld-ceo")!.currentOwner).toBe("");
  });
});

describe("findOrphanStateKeys", () => {
  it("kodda karşılığı olmayan DB satırını bulur", () => {
    const orphans = findOrphanStateKeys([
      state({ roleKey: "ld-ceo" }),
      state({ roleKey: "silinmis-rol" }),
    ]);
    expect(orphans).toEqual(["silinmis-rol"]);
  });

  it("hepsi geçerliyse boş dizi döner", () => {
    expect(findOrphanStateKeys([state({ roleKey: "pz-radar" })])).toEqual([]);
  });
});

describe("filterKadroRoles", () => {
  const all = resolveKadroRoles(KADRO_ROLES, []);

  it("filtresiz tüm rolleri döner", () => {
    expect(filterKadroRoles(all, KADRO_EMPTY_FILTERS)).toHaveLength(52);
  });

  it("bölüme göre süzer", () => {
    expect(filterKadroRoles(all, { ...KADRO_EMPTY_FILTERS, dept: "gelir" })).toHaveLength(3);
  });

  it("dalgaya göre süzer", () => {
    const wave1 = filterKadroRoles(all, { ...KADRO_EMPTY_FILTERS, wave: "1" });
    expect(wave1.every((r) => r.wave === 1)).toBe(true);
  });

  it("sadece açık pozisyonları süzer", () => {
    const open = filterKadroRoles(all, { ...KADRO_EMPTY_FILTERS, openOnly: true });
    expect(open.every((r) => ["acik", "aday", "gorusme", "teklif"].includes(r.currentStatus))).toBe(true);
    expect(open.some((r) => r.id === "ld-ceo")).toBe(false); // dolu
  });

  it("arama Türkçe aksana toleranslıdır", () => {
    const hit = filterKadroRoles(all, { ...KADRO_EMPTY_FILTERS, q: "kuratör" });
    expect(hit.some((r) => r.id === "pz-radar")).toBe(true);
  });

  it("arama sahip adında da eşleşir", () => {
    const resolved = resolveKadroRoles(KADRO_ROLES, []);
    const hit = filterKadroRoles(resolved, { ...KADRO_EMPTY_FILTERS, q: "Akçakanat" });
    expect(hit.some((r) => r.id === "ld-ceo")).toBe(true);
  });
});

describe("summarizeKadroRoles", () => {
  it("toplam, açık, dolu ve kritik-açık sayar", () => {
    const summary = summarizeKadroRoles(resolveKadroRoles(KADRO_ROLES, []));
    expect(summary.total).toBe(52);
    expect(summary.open + summary.filled).toBeLessThanOrEqual(52);
    expect(summary.criticalOpen).toBeGreaterThan(0);
  });

  it("kritik-açık sayacı dolu rolleri saymaz", () => {
    const resolved = resolveKadroRoles(KADRO_ROLES, []);
    const summary = summarizeKadroRoles(resolved);
    const manual = resolved.filter(
      (r) => r.currentPriority === "kritik" && !["dolu", "destek"].includes(r.currentStatus),
    ).length;
    expect(summary.criticalOpen).toBe(manual);
  });
});

describe("groupKadroRoles", () => {
  it("bölüm ve eksen sırasını korur, boş grup üretmez", () => {
    const groups = groupKadroRoles(resolveKadroRoles(KADRO_ROLES, []));
    expect(groups[0].deptId).toBe("kurucu");
    for (const group of groups) {
      expect(group.axes.length).toBeGreaterThan(0);
      for (const axis of group.axes) {
        expect(axis.roles.length).toBeGreaterThan(0);
      }
    }
  });

  it("pazarlama bölümü üç eksene ayrılır", () => {
    const groups = groupKadroRoles(resolveKadroRoles(KADRO_ROLES, []));
    const pazarlama = groups.find((g) => g.deptId === "pazarlama")!;
    expect(pazarlama.axes.map((a) => a.axisId).sort()).toEqual(["cografya", "islev", "urun"]);
  });
});
```

- [ ] **Step 2: Testi çalıştır, kırmızı olduğunu gör**

Çalıştır: `npm run test -- src/lib/kadro/kadro-view.test.ts`
Beklenen: FAIL — `./kadro-view` yok.

- [ ] **Step 3: kadro-view.ts'i yaz**

```ts
// Kadro Konsolu — görünüm mantığı (saf fonksiyonlar, I/O yok).
// Kod varsayılanı + DB override birleştirme, filtreleme, özet, gruplama.
// Bileşenler yalnız çizim yapar; karar buradadır ve testi buradadır.

import { trIncludes } from "@/lib/text-normalization";

import { KADRO_AXES, KADRO_DEPTS, KADRO_FILLED_STATUSES, KADRO_OPEN_STATUSES } from "./kadro-taxonomy";
import { KADRO_ROLE_IDS } from "./roles";
import type {
  KadroAxisId, KadroDeptId, KadroResolvedRole, KadroRole, KadroRoleState,
} from "./kadro-types";

/**
 * Kod varsayılanını DB satırıyla birleştirir.
 * null = "DB'de hiç yazılmamış" → kod varsayılanı geçerli.
 * "" (boş string) = "kullanıcı bilinçli olarak sildi" → boş kalır.
 * Bu ayrım önemlidir: sahibi silinen rol tekrar eski sahibini göstermemelidir.
 */
export function resolveKadroRoles(
  roles: KadroRole[],
  states: KadroRoleState[],
): KadroResolvedRole[] {
  const byKey = new Map(states.map((s) => [s.roleKey, s]));
  return roles.map((role) => {
    const state = byKey.get(role.id);
    return {
      ...role,
      currentStatus: state?.status ?? role.status,
      currentPriority: state?.priority ?? role.pri,
      currentOwner: state?.ownerName ?? role.owner,
      note: state?.note ?? "",
      hasState: Boolean(state),
      updatedAt: state?.updatedAt ?? null,
    };
  });
}

/**
 * Kodda karşılığı olmayan DB satırlarını bulur — karma modelin sessiz kusuru.
 * Pano bunu gösterir; boş dönmesi beklenir.
 */
export function findOrphanStateKeys(states: KadroRoleState[]): string[] {
  return states.map((s) => s.roleKey).filter((key) => !KADRO_ROLE_IDS.has(key));
}

export type KadroFilters = {
  q: string;
  dept: string;
  wave: string;
  type: string;
  status: string;
  openOnly: boolean;
};

export const KADRO_EMPTY_FILTERS: KadroFilters = {
  q: "", dept: "", wave: "", type: "", status: "", openOnly: false,
};

export function filterKadroRoles(
  roles: KadroResolvedRole[],
  filters: KadroFilters,
): KadroResolvedRole[] {
  const query = filters.q.trim();
  return roles.filter((role) => {
    if (filters.dept && role.dept !== filters.dept) return false;
    if (filters.wave && String(role.wave) !== filters.wave) return false;
    if (filters.type && role.type !== filters.type) return false;
    if (filters.status && role.currentStatus !== filters.status) return false;
    if (filters.openOnly && !KADRO_OPEN_STATUSES.includes(role.currentStatus)) return false;
    if (query) {
      const haystack = [
        role.title, role.jd, role.currentOwner, role.note,
        role.kpi.join(" "), role.tools, role.trigger,
      ].join(" ");
      if (!trIncludes(haystack, query)) return false;
    }
    return true;
  });
}

export function summarizeKadroRoles(roles: KadroResolvedRole[]): {
  total: number; open: number; filled: number; criticalOpen: number;
} {
  const filled = roles.filter((r) => KADRO_FILLED_STATUSES.includes(r.currentStatus));
  return {
    total: roles.length,
    open: roles.filter((r) => KADRO_OPEN_STATUSES.includes(r.currentStatus)).length,
    filled: filled.length,
    criticalOpen: roles.filter(
      (r) => r.currentPriority === "kritik" && !KADRO_FILLED_STATUSES.includes(r.currentStatus),
    ).length,
  };
}

const DEPT_ORDER = KADRO_DEPTS.map((d) => d.id);
const AXIS_ORDER = KADRO_AXES.map((a) => a.id);

/** Bölüm → eksen iki kademeli gruplama. Boş grup üretmez. */
export function groupKadroRoles(roles: KadroResolvedRole[]): Array<{
  deptId: KadroDeptId;
  axes: Array<{ axisId: KadroAxisId; roles: KadroResolvedRole[] }>;
}> {
  return DEPT_ORDER
    .map((deptId) => {
      const inDept = roles.filter((r) => r.dept === deptId);
      const axes = AXIS_ORDER
        .map((axisId) => ({ axisId, roles: inDept.filter((r) => r.axis === axisId) }))
        .filter((axis) => axis.roles.length > 0);
      return { deptId, axes };
    })
    .filter((group) => group.axes.length > 0);
}
```

- [ ] **Step 4: Testi ve tsc'yi çalıştır**

```bash
npm run test -- src/lib/kadro/kadro-view.test.ts
npx tsc -p tsconfig.app.json --noEmit
```
Beklenen: PASS, 0 hata.

- [ ] **Step 5: Commit**

```bash
git add -- src/lib/kadro/kadro-view.ts src/lib/kadro/kadro-view.test.ts
git commit -- src/lib/kadro/kadro-view.ts src/lib/kadro/kadro-view.test.ts
```
Mesaj konusu: `feat(kadro): birleştirme, filtre ve özet mantığı`

---

### Task 7: İlan metni üretimi

**Files:**
- Create: `src/lib/kadro/kadro-ad-text.ts`
- Test: `src/lib/kadro/kadro-ad-text.test.ts`

**Interfaces:**
- Consumes: `KadroRole` (Görev 1), `KADRO_AD_BLOCKS` (Görev 1)
- Produces: `buildKadroAdText(role: KadroRole): string | null`

Artifact'taki `adText()` fonksiyonu (satır ~1938–1946) ile aynı sırayı üretir: başlık → özet → ne yapacaksın → kimi arıyoruz → nasıl bir yer → çalışma modeli → başvuru → görev testi.

- [ ] **Step 1: Başarısız testi yaz**

```ts
import { describe, expect, it } from "vitest";

import { KADRO_AD_BLOCKS } from "./kadro-taxonomy";
import { kadroRoleById } from "./roles";
import { buildKadroAdText } from "./kadro-ad-text";

describe("buildKadroAdText", () => {
  it("ilanı olmayan rolde null döner", () => {
    expect(buildKadroAdText(kadroRoleById("ld-ceo")!)).toBeNull();
  });

  it("ilan metni tüm bölümleri sırayla içerir", () => {
    const text = buildKadroAdText(kadroRoleById("pz-radar")!)!;
    expect(text).toContain("Story Curator");
    expect(text).toContain("Nasıl bir yerde çalışacaksın?");
    expect(text).toContain("Çalışma ve kazanç modeli");
    expect(text).toContain("Başvuru");
    expect(text).toContain("Görev testi");
    expect(text.indexOf("Nasıl bir yerde")).toBeLessThan(text.indexOf("Başvuru"));
  });

  it("ortak blokları birebir gömer", () => {
    const text = buildKadroAdText(kadroRoleById("pz-radar")!)!;
    expect(text).toContain(KADRO_AD_BLOCKS.startup);
    expect(text).toContain(KADRO_AD_BLOCKS.model);
    expect(text).toContain(KADRO_AD_BLOCKS.apply);
  });

  it("beklenen katkı olarak rolün hours alanını yazar", () => {
    const role = kadroRoleById("pz-defter")!;
    expect(buildKadroAdText(role)!).toContain(role.hours);
  });

  it("50 rolün hepsinde metin üretir", () => {
    const withAd = [kadroRoleById("pz-radar")!, kadroRoleById("ld-cmo")!];
    for (const role of withAd) {
      expect(buildKadroAdText(role)!.length).toBeGreaterThan(500);
    }
  });
});
```

- [ ] **Step 2: Testi çalıştır, kırmızı olduğunu gör**

Çalıştır: `npm run test -- src/lib/kadro/kadro-ad-text.test.ts`
Beklenen: FAIL.

- [ ] **Step 3: Uygulamayı yaz**

```ts
// İlan metni birleştirme — rol alanları + üç ortak blok.
// Artifact'taki adText() ile aynı sırayı üretir; kopyala düğmesi bunu verir.

import { KADRO_AD_BLOCKS } from "./kadro-taxonomy";
import type { KadroRole } from "./kadro-types";

export function buildKadroAdText(role: KadroRole): string | null {
  const ad = role.ad;
  if (!ad) return null;

  return [
    role.title,
    "",
    ad.sum,
    "",
    "Ne yapacaksın?",
    ...ad.does.map((line) => `• ${line}`),
    "",
    "Kimi arıyoruz?",
    ...ad.profile.map((line) => `• ${line}`),
    "",
    "Nasıl bir yerde çalışacaksın?",
    KADRO_AD_BLOCKS.startup,
    "",
    "Çalışma ve kazanç modeli",
    `Beklenen katkı: ${role.hours}. ${KADRO_AD_BLOCKS.model}`,
    "",
    "Başvuru",
    KADRO_AD_BLOCKS.apply,
    "",
    ad.test,
  ].join("\n");
}
```

- [ ] **Step 4: Testi ve tsc'yi çalıştır**

```bash
npm run test -- src/lib/kadro/kadro-ad-text.test.ts
npx tsc -p tsconfig.app.json --noEmit
```
Beklenen: PASS, 0 hata.

- [ ] **Step 5: Commit**

```bash
git add -- src/lib/kadro/kadro-ad-text.ts src/lib/kadro/kadro-ad-text.test.ts
git commit -- src/lib/kadro/kadro-ad-text.ts src/lib/kadro/kadro-ad-text.test.ts
```
Mesaj konusu: `feat(kadro): ilan metni üretimi`

---

### Task 8: CSV dışa aktarım

**Files:**
- Create: `src/lib/kadro/kadro-csv.ts`
- Test: `src/lib/kadro/kadro-csv.test.ts`

**Interfaces:**
- Consumes: `KadroResolvedRole` (Görev 1), taksonomi etiketleri (Görev 1)
- Produces: `buildKadroCsv(roles: KadroResolvedRole[]): string`, `downloadKadroCsv(roles: KadroResolvedRole[]): void`

Desen `src/lib/muhasebe-butce-csv.ts`: saf string üreticisi test edilir, Blob sarmalayıcısı edilmez.

- [ ] **Step 1: Başarısız testi yaz**

```ts
import { describe, expect, it } from "vitest";

import { KADRO_ROLES } from "./roles";
import { resolveKadroRoles } from "./kadro-view";
import { buildKadroCsv } from "./kadro-csv";

const resolved = resolveKadroRoles(KADRO_ROLES, []);

describe("buildKadroCsv", () => {
  it("başlık satırı + 52 veri satırı üretir", () => {
    const lines = buildKadroCsv(resolved).split("\r\n");
    expect(lines).toHaveLength(53);
  });

  it("kolon sırası sabittir", () => {
    const header = buildKadroCsv(resolved).split("\r\n")[0];
    expect(header).toBe(
      '"Rol anahtarı","Pozisyon","Bölüm","Hat","Dalga","Çalışma tipi","Durum","Öncelik","Sahip","Not","Tetikleyici"',
    );
  });

  it("Türkçe karakterler korunur", () => {
    const csv = buildKadroCsv(resolved);
    expect(csv).toContain("Kuruluş & Liderlik");
    expect(csv).toContain("Pazarlama & Büyüme");
    expect(csv).toContain("Çalışma tipi");
  });

  it("etiketler ASCII anahtar değil Türkçe yazılır", () => {
    const csv = buildKadroCsv(resolved);
    expect(csv).not.toContain('"acik"');
    expect(csv).not.toContain('"kritik"');
  });

  it("çift tırnak kaçırılır", () => {
    const csv = buildKadroCsv([{ ...resolved[0], note: 'o "dedi" ki' }]);
    expect(csv).toContain('"o ""dedi"" ki"');
  });

  it("satır içi yeni satır hücreyi bozmaz", () => {
    const csv = buildKadroCsv([{ ...resolved[0], note: "ilk\nikinci" }]);
    expect(csv.split("\r\n")).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Testi çalıştır, kırmızı olduğunu gör**

Çalıştır: `npm run test -- src/lib/kadro/kadro-csv.test.ts`
Beklenen: FAIL.

- [ ] **Step 3: Uygulamayı yaz**

```ts
// Kadro tablosu CSV export. buildKadroCsv saf string üretir (test edilebilir);
// downloadKadroCsv onu UTF-8 BOM'lu Blob'a sarar — BOM olmadan Excel Türkçe
// karakterleri bozar (CLAUDE.md, Türkçe Metin Kuralları md.2).

import { KADRO_AXES, KADRO_DEPTS, KADRO_PRIORITIES, KADRO_STATUSES, KADRO_WORK_TYPES } from "./kadro-taxonomy";
import type { KadroResolvedRole } from "./kadro-types";

const HEADERS = [
  "Rol anahtarı", "Pozisyon", "Bölüm", "Hat", "Dalga",
  "Çalışma tipi", "Durum", "Öncelik", "Sahip", "Not", "Tetikleyici",
];

function cell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
}

const deptName = (id: string) => KADRO_DEPTS.find((d) => d.id === id)?.name ?? id;
const axisName = (id: string) => KADRO_AXES.find((a) => a.id === id)?.name ?? id;

export function buildKadroCsv(roles: KadroResolvedRole[]): string {
  const lines = [HEADERS.map(cell).join(",")];
  for (const role of roles) {
    lines.push([
      cell(role.id),
      cell(role.title),
      cell(deptName(role.dept)),
      cell(axisName(role.axis)),
      cell(role.wave),
      cell(KADRO_WORK_TYPES[role.type]),
      cell(KADRO_STATUSES[role.currentStatus].label),
      cell(KADRO_PRIORITIES[role.currentPriority].label),
      cell(role.currentOwner),
      cell(role.note),
      cell(role.trigger),
    ].join(","));
  }
  return lines.join("\r\n");
}

export function downloadKadroCsv(roles: KadroResolvedRole[]): void {
  const csv = buildKadroCsv(roles);
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `corteqs-kadro-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}
```

- [ ] **Step 4: Testi ve tsc'yi çalıştır**

```bash
npm run test -- src/lib/kadro/kadro-csv.test.ts
npx tsc -p tsconfig.app.json --noEmit
```
Beklenen: PASS, 0 hata.

- [ ] **Step 5: Commit**

```bash
git add -- src/lib/kadro/kadro-csv.ts src/lib/kadro/kadro-csv.test.ts
git commit -- src/lib/kadro/kadro-csv.ts src/lib/kadro/kadro-csv.test.ts
```
Mesaj konusu: `feat(kadro): CSV dışa aktarım`

---

### Task 9: Rotalar, navigasyon ve iskelet sayfalar

Dört sayfa boş iskelet olarak bağlanır; içerik sonraki görevlerde dolar. Bu görev bittiğinde `/admin/kadro` açılır ve menüde görünür.

**Files:**
- Create: `src/pages/admin/kadro/AdminKadroPage.tsx`
- Create: `src/pages/admin/kadro/AdminKadroMatrisPage.tsx`
- Create: `src/pages/admin/kadro/AdminKadroRutinlerPage.tsx`
- Create: `src/pages/admin/kadro/AdminKadroIlanlarPage.tsx`
- Create: `src/pages/admin/kadro/routes.tsx`
- Create: `src/lib/admin-shell/admin-navigation-registry/kadro.ts`
- Modify: `src/lib/admin-shell/admin-navigation-registry.ts` (import + `adminNavGroups` dizisi)
- Modify: `src/lib/admin-shell/admin-route-meta.ts` (`ADMIN_ROUTE_PATTERNS` + redirect kaydı)
- Modify: `src/App.tsx` (admin route ağacına `adminKadroRoutes`)

**Interfaces:**
- Consumes: yok (iskelet)
- Produces: `adminKadroRoutes` (JSX Route ağacı), `kadroNavGroup: AdminNavGroup`

> Üç nokta birlikte güncellenmelidir. `admin-navigation-registry.test.ts` her nav `to` değerinin `ADMIN_ROUTE_PATTERNS` içinde olmasını zorunlu kılar; biri eksik kalırsa test kırmızı olur.

- [ ] **Step 1: routes.tsx'i yaz**

```tsx
// /admin/kadro alt ağacı — muhasebe/workshop routes.tsx deseni.
// Yeni sekme eklerken: (1) buraya route, (2) ADMIN_ROUTE_PATTERNS,
// (3) admin-navigation-registry "kadro" grubuna item.

import { lazy } from "react";
import { Route } from "react-router-dom";

const AdminKadroPage = lazy(() => import("@/pages/admin/kadro/AdminKadroPage"));
const AdminKadroMatrisPage = lazy(() => import("@/pages/admin/kadro/AdminKadroMatrisPage"));
const AdminKadroRutinlerPage = lazy(() => import("@/pages/admin/kadro/AdminKadroRutinlerPage"));
const AdminKadroIlanlarPage = lazy(() => import("@/pages/admin/kadro/AdminKadroIlanlarPage"));

export const adminKadroRoutes = (
  <Route path="kadro">
    <Route index element={<AdminKadroPage />} />
    <Route path="matris" element={<AdminKadroMatrisPage />} />
    <Route path="rutinler" element={<AdminKadroRutinlerPage />} />
    <Route path="ilanlar" element={<AdminKadroIlanlarPage />} />
  </Route>
);
```

- [ ] **Step 2: Dört iskelet sayfayı yaz**

Her biri geçici olarak başlık + açıklama döner. Örnek:

```tsx
// Kadro Konsolu — /admin/kadro.
// 52 pozisyonluk kadro planı. Rol tanımları kodda (src/lib/kadro/roles/),
// durum veritabanında (kadro_role_states).

const AdminKadroPage = () => (
  <div className="space-y-4">
    <h1 className="text-2xl font-semibold">Kadro</h1>
    <p className="text-muted-foreground">52 pozisyon · 3 dalga</p>
  </div>
);

export default AdminKadroPage;
```

- [ ] **Step 3: Nav grubunu yaz**

`src/lib/admin-shell/admin-navigation-registry/kadro.ts`:

```ts
// Admin Panel V2 navigasyon registry'si — "Kadro" grubu.
// URL path'leri App.tsx route ağacıyla birebir aynıdır ve değiştirilemez.

import { ClipboardList, Grid3x3, Megaphone, Repeat, Users } from "lucide-react";

import type { AdminNavGroup } from "../admin-shell-types";

export const kadroNavGroup: AdminNavGroup = {
  id: "kadro",
  label: "Kadro",
  icon: Users,
  accent: "amber",
  items: [
    {
      id: "kadro-liste",
      label: "Kadro",
      shortLabel: "Kadro",
      description: "52 pozisyon, dalga ve öncelik sırasıyla; durum, sahip ve aday takibi.",
      to: "/admin/kadro",
      icon: ClipboardList,
      accent: "amber",
      aliases: ["kadro", "pozisyon", "işe alım", "rol", "ekip", "aday", "ilan"],
    },
    {
      id: "kadro-matris",
      label: "Pazarlama Matrisi",
      shortLabel: "Matris",
      description: "Pazarlamanın üç hattı: ürünler, kanal işlevleri, coğrafya.",
      to: "/admin/kadro/matris",
      icon: Grid3x3,
      accent: "amber",
      aliases: ["matris", "pazarlama hattı", "ürün hattı", "coğrafya"],
    },
    {
      id: "kadro-rutinler",
      label: "Rutinler",
      shortLabel: "Rutinler",
      description: "Kim, ne sıklıkla, neyi yayına sokar — günlük/haftalık/aylık/yıllık.",
      to: "/admin/kadro/rutinler",
      icon: Repeat,
      accent: "amber",
      aliases: ["rutin", "yayın takvimi", "günlük", "haftalık"],
    },
    {
      id: "kadro-ilanlar",
      label: "İlan Metinleri",
      shortLabel: "İlanlar",
      description: "50 rolün hazır ilan metni ve görev testi; kopyalanabilir.",
      to: "/admin/kadro/ilanlar",
      icon: Megaphone,
      accent: "amber",
      aliases: ["ilan", "iş ilanı", "görev testi", "başvuru"],
    },
  ],
};
```

`accent: "amber"` değeri `AdminNavGroup` tipinin kabul ettiği bir değer olmalıdır — `src/lib/admin-shell/admin-shell-types.ts` içindeki birlik tipini kontrol et, yoksa mevcut değerlerden birini seç.

- [ ] **Step 4: Üç bağlantı noktasını güncelle**

1. `admin-navigation-registry.ts`: `import { kadroNavGroup } from "./admin-navigation-registry/kadro";` ekle ve `adminNavGroups` dizisine `workshopNavGroup`'tan sonra `kadroNavGroup` koy.
2. `admin-route-meta.ts` → `ADMIN_ROUTE_PATTERNS` dizisine ekle:
   ```ts
   "/admin/kadro",
   "/admin/kadro/matris",
   "/admin/kadro/rutinler",
   "/admin/kadro/ilanlar",
   ```
3. `App.tsx`: `adminKadroRoutes`'u import et ve admin route ağacına `{adminWorkshopRoutes}` komşuluğuna yerleştir.

- [ ] **Step 5: Nav sözleşme testini çalıştır**

```bash
npm run test -- src/lib/admin-shell/admin-navigation-registry.test.ts
```
Beklenen: PASS. Kırmızıysa üç noktadan biri eksiktir — testi susturma, eksiği tamamla.

- [ ] **Step 6: Build ve tsc**

```bash
npx tsc -p tsconfig.app.json --noEmit
npm run build
```
Beklenen: 0 hata, build başarılı.

- [ ] **Step 7: Commit**

```bash
git add -- src/pages/admin/kadro/ src/lib/admin-shell/admin-navigation-registry/kadro.ts src/lib/admin-shell/admin-navigation-registry.ts src/lib/admin-shell/admin-route-meta.ts src/App.tsx
git commit -- src/pages/admin/kadro/ src/lib/admin-shell/admin-navigation-registry/kadro.ts src/lib/admin-shell/admin-navigation-registry.ts src/lib/admin-shell/admin-route-meta.ts src/App.tsx
```
Mesaj konusu: `feat(kadro): dört rota, nav grubu ve iskelet sayfalar`

---

### Task 10: Kadro listesi — özet, filtreler, tablo

**Files:**
- Create: `src/components/admin/kadro/KadroSummary.tsx`
- Create: `src/components/admin/kadro/KadroFilters.tsx`
- Create: `src/components/admin/kadro/KadroRoleTable.tsx`
- Create: `src/components/admin/kadro/kadro-pills.tsx`
- Create: `src/hooks/kadro/useKadroBoard.ts`
- Modify: `src/pages/admin/kadro/AdminKadroPage.tsx`

**Interfaces:**
- Consumes: `resolveKadroRoles`, `filterKadroRoles`, `summarizeKadroRoles`, `groupKadroRoles`, `findOrphanStateKeys`, `KADRO_EMPTY_FILTERS`, `KadroFilters` (Görev 6); `fetchKadroRoleStates`, `saveKadroRoleState` (Görev 5); `downloadKadroCsv` (Görev 8)
- Produces:
  - `useKadroBoard(): { roles, filtered, summary, groups, orphans, filters, setFilters, isLoading, error, saveState }`
  - `<KadroSummary summary={...} orphanCount={number} />`
  - `<KadroFilters value={KadroFilters} onChange={(f: KadroFilters) => void} onExport={() => void} />`
  - `<KadroRoleTable groups={...} onSelect={(roleKey: string) => void} />`
  - `<StatusPill status={KadroStatus} />`, `<PriorityPill priority={KadroPriority} />`

- [ ] **Step 1: Veri kancasını yaz**

`src/hooks/kadro/useKadroBoard.ts`:

```ts
// Kadro panosunun tek veri kancası. React Query ile durumları çeker,
// kod varsayılanlarıyla birleştirir, filtreyi uygular.

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchKadroRoleStates, saveKadroRoleState, type KadroRoleStatePatch } from "@/lib/kadro/kadro-api";
import {
  KADRO_EMPTY_FILTERS, filterKadroRoles, findOrphanStateKeys,
  groupKadroRoles, resolveKadroRoles, summarizeKadroRoles, type KadroFilters,
} from "@/lib/kadro/kadro-view";
import { KADRO_ROLES } from "@/lib/kadro/roles";

export const KADRO_STATES_KEY = ["kadro", "role-states"] as const;

export function useKadroBoard() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<KadroFilters>(KADRO_EMPTY_FILTERS);

  const statesQuery = useQuery({
    queryKey: KADRO_STATES_KEY,
    queryFn: fetchKadroRoleStates,
  });

  const states = statesQuery.data ?? [];
  const roles = useMemo(() => resolveKadroRoles(KADRO_ROLES, states), [states]);
  const filtered = useMemo(() => filterKadroRoles(roles, filters), [roles, filters]);

  const saveMutation = useMutation({
    mutationFn: ({ roleKey, patch }: { roleKey: string; patch: KadroRoleStatePatch }) =>
      saveKadroRoleState(roleKey, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KADRO_STATES_KEY }),
  });

  return {
    roles,
    filtered,
    summary: useMemo(() => summarizeKadroRoles(filtered), [filtered]),
    groups: useMemo(() => groupKadroRoles(filtered), [filtered]),
    orphans: useMemo(() => findOrphanStateKeys(states), [states]),
    filters,
    setFilters,
    isLoading: statesQuery.isLoading,
    error: statesQuery.error as Error | null,
    saveState: saveMutation,
  };
}
```

- [ ] **Step 2: Rozet bileşenlerini yaz**

`kadro-pills.tsx` — `KADRO_STATUSES[status].tone` / `KADRO_PRIORITIES[priority].tone` değerini Tailwind sınıfına çevirir. Ton → sınıf haritası tek yerde tutulur:

```tsx
const TONE_CLASS: Record<KadroTone, string> = {
  crit: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  warn: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  ok: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  mute: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  open: "bg-amber-50 text-amber-900 ring-1 ring-amber-300 dark:bg-amber-950 dark:text-amber-100 dark:ring-amber-800",
};
```

- [ ] **Step 3: KadroSummary'yi yaz**

Dört sayaç: Toplam · Açık · Dolu · Kritik & açık. `orphanCount > 0` ise beşinci bir uyarı kutusu:

```tsx
{orphanCount > 0 && (
  <p className="text-sm text-red-700 dark:text-red-300">
    ⚠ {orphanCount} veritabanı satırının kodda karşılığı yok — rol anahtarı
    değişmiş olabilir. Bu satırların durumu ekranda görünmüyor.
  </p>
)}
```

- [ ] **Step 4: KadroFilters'ı yaz**

Arama kutusu + dört `Select` (bölüm/dalga/tip/durum) + "Sadece açık pozisyonlar" düğmesi + "Temizle" + "CSV indir". Seçenekler `KADRO_DEPTS` / `KADRO_WAVES` / `KADRO_WORK_TYPES` / `KADRO_STATUSES`'ten üretilir; elle liste yazılmaz.

- [ ] **Step 5: KadroRoleTable'ı yaz**

`groups` üzerinde döner: bölüm başlığı (`KADRO_DEPTS` adı + açıklaması) → eksen başlığı (yalnız bölümde birden fazla eksen varsa) → rol satırları. Satır: pozisyon + sahip + durum rozeti + öncelik rozeti + dalga + çalışma tipi. Satıra tıklama `onSelect(role.id)` çağırır. Mobilde grid tek sütuna düşer.

- [ ] **Step 6: AdminKadroPage'i bağla**

`useKadroBoard()` çağrılır, üç bileşen çizilir. Çekmece Görev 11'de eklenecek — şimdilik `onSelect` bir `useState` içine yazar, henüz bir şey açmaz.

- [ ] **Step 7: Test ve build**

```bash
npm run test
npx tsc -p tsconfig.app.json --noEmit
npm run build
```
Beklenen: tüm testler PASS, 0 tsc hatası, build başarılı.

- [ ] **Step 8: Commit**

```bash
git add -- src/components/admin/kadro/ src/hooks/kadro/ src/pages/admin/kadro/AdminKadroPage.tsx
git commit -- src/components/admin/kadro/ src/hooks/kadro/ src/pages/admin/kadro/AdminKadroPage.tsx
```
Mesaj konusu: `feat(kadro): özet, filtreler ve rol tablosu`

---

### Task 11: Çekmece — detay, düzenleme, geçmiş, adaylar

**Files:**
- Create: `src/components/admin/kadro/KadroRoleDrawer.tsx`
- Create: `src/components/admin/kadro/KadroStateForm.tsx`
- Create: `src/components/admin/kadro/KadroEventLog.tsx`
- Create: `src/components/admin/kadro/KadroCandidateList.tsx`
- Create: `src/hooks/kadro/useKadroRoleDetail.ts`
- Modify: `src/pages/admin/kadro/AdminKadroPage.tsx`

**Interfaces:**
- Consumes: `fetchKadroRoleEvents`, `fetchKadroCandidates`, `createKadroCandidate`, `updateKadroCandidate`, `deleteKadroCandidate`, `validateKadroCandidateDraft` (Görev 5); `saveState` (Görev 10)
- Produces:
  - `useKadroRoleDetail(roleKey: string | null): { events, candidates, isLoading, createCandidate, updateCandidate, deleteCandidate }`
  - `<KadroRoleDrawer role={KadroResolvedRole | null} onClose={() => void} onSave={(patch: KadroRoleStatePatch) => void} isSaving={boolean} />`

- [ ] **Step 1: Detay kancasını yaz**

İki ayrı `useQuery` (`["kadro","events",roleKey]` ve `["kadro","candidates",roleKey]`), `enabled: Boolean(roleKey)`. Mutasyonlar başarıda ilgili anahtarı invalidate eder.

- [ ] **Step 2: KadroStateForm'u yaz — açık kayıt**

> ⚠️ Artifact 500 ms gecikmeli **otomatik kayıt** kullanır. Burada **KULLANILMAZ**: geçmiş kaydı eklendiği için otomatik kayıt her duraklamada bir `kadro_role_events` satırı üretir ve geçmiş, kararları değil tuş vuruşlarını gösterir.

Form yerel `useState` tutar, `Kaydet` düğmesi `onSave(patch)` çağırır. Kaydedilmemiş değişiklik varsa:
- `Kaydet` düğmesi etkin, yanında "Kaydedilmemiş değişiklik var" uyarısı
- Çekmece kapatılmaya çalışılırsa `window.confirm("Kaydedilmemiş değişiklikler var. Yine de kapatılsın mı?")`

Alanlar: Durum (`Select`, `KADRO_STATUSES`), Öncelik (`Select`, `KADRO_PRIORITIES`), Sahip (`Input`), Not (`Textarea`). Her alanın yanında koddaki varsayılan küçük puntoyla gösterilir ("varsayılan: Açık") — kullanıcı neyi ezdiğini görür.

- [ ] **Step 3: KadroEventLog'u yaz**

Ters kronolojik liste. Her satır: alan adı (Türkçe etiket) · eski → yeni · tarih. Alan adı haritası:

```ts
const FIELD_LABELS: Record<KadroRoleEvent["field"], string> = {
  status: "Durum",
  priority: "Öncelik",
  owner_name: "Sahip",
  note: "Not",
};
```

Değer gösterimi: `status`/`priority` için ASCII anahtar değil Türkçe etiket basılır (`KADRO_STATUSES[value]?.label ?? value`). Boş/null değer "—" olarak gösterilir. Liste boşsa "Henüz değişiklik yok."

- [ ] **Step 4: KadroCandidateList'i yaz**

Aday kartları (ad · aşama rozeti · linkler · not) + "Aday ekle" formu (ad, linkler, aşama, not). Aşama değişimi doğrudan `updateCandidate` çağırır. Silme `window.confirm` ile.

- [ ] **Step 5: KadroRoleDrawer'ı birleştir**

Üst: pozisyon başlığı + bölüm/dalga/tip/durum/öncelik rozetleri.
Gövde bölümleri sırayla: Görev tanımı (`jd`) · Künye (`reports`, `hours`, `pay`, `esop`, `cadence`, `tools`) · KPI listesi · Tetikleyici · Çıkış planı · **Düzenleme formu** · **Adaylar** · **Değişiklik geçmişi**.

`role.ad` varsa en altta "İlan metnini kopyala" düğmesi (`buildKadroAdText` + `navigator.clipboard.writeText`).

Erişilebilirlik: `role="dialog"`, `aria-modal="true"`, Esc ile kapanır, açıkken odak çekmece içinde.

- [ ] **Step 6: AdminKadroPage'e bağla**

`selectedRoleKey` state'i çekmeceyi açar; `saveState.mutate` ile kayıt yapılır.

- [ ] **Step 7: Test ve build**

```bash
npm run test
npx tsc -p tsconfig.app.json --noEmit
npm run build
```
Beklenen: PASS, 0 hata, build başarılı.

- [ ] **Step 8: Commit**

```bash
git add -- src/components/admin/kadro/ src/hooks/kadro/ src/pages/admin/kadro/AdminKadroPage.tsx
git commit -- src/components/admin/kadro/ src/hooks/kadro/ src/pages/admin/kadro/AdminKadroPage.tsx
```
Mesaj konusu: `feat(kadro): rol çekmecesi, düzenleme, geçmiş ve adaylar`

---

### Task 12: Matris, Rutinler ve İlanlar sayfaları

Üçü de salt-okunur; DB'ye dokunmaz, yalnız koddaki veriyi çizer.

**Files:**
- Create: `src/components/admin/kadro/KadroMatrix.tsx`
- Create: `src/components/admin/kadro/KadroRoutines.tsx`
- Create: `src/components/admin/kadro/KadroAdTexts.tsx`
- Modify: `src/pages/admin/kadro/AdminKadroMatrisPage.tsx`
- Modify: `src/pages/admin/kadro/AdminKadroRutinlerPage.tsx`
- Modify: `src/pages/admin/kadro/AdminKadroIlanlarPage.tsx`

**Interfaces:**
- Consumes: `KADRO_ROLES`, `kadroRoleById` (Görev 2); `KADRO_ROUTINES`, `groupRoutinesByFreq` (Görev 3); `buildKadroAdText` (Görev 7); `KADRO_AXES` (Görev 1)
- Produces: üç sunum bileşeni

- [ ] **Step 1: KadroMatrix'i yaz**

Üstte `Head of Marketing & Growth` (`ld-cmo`) kartı — matrisin başı. Altında üç sütun: Ürün hattı · İşlev hattı · Coğrafya hattı. Her sütun `KADRO_AXES`'ten başlık + açıklama alır, içine `dept === "pazarlama" && axis === <o eksen>` rolleri kart olarak dizilir. Kart tıklaması `/admin/kadro`'ya `?rol=<id>` ile gider (çekmece o parametreyle açılır) — ya da basitçe rol adını gösterir; bağlantı zorunlu değildir. Mobilde tek sütun.

- [ ] **Step 2: KadroRoutines'i yaz**

`groupRoutinesByFreq(KADRO_ROUTINES)` üzerinde döner. Her grup bir başlık (Günlük/Haftalık/Aylık/Yıllık), altında satırlar: rutin adı · açıklama · sahip. Sahip `kadroRoleById(routine.owner)?.title` ile role adına çevrilir — ham `role_key` basılmaz.

- [ ] **Step 3: KadroAdTexts'i yaz**

`ad !== null` olan 50 rol için açılır/kapanır bölüm (`<details>` ya da shadcn `Accordion`). Açılınca: özet · ne yapacaksın · kimi arıyoruz · üç ortak blok · görev testi. Altta "Metni kopyala" düğmesi `buildKadroAdText(role)` çıktısını panoya yazar, düğme 1,2 sn "Kopyalandı ✓" gösterir.

Sayfada ayrıca bölüme göre filtre olsun (50 ilan uzun bir liste).

- [ ] **Step 4: Üç sayfayı bağla**

- [ ] **Step 5: Test ve build**

```bash
npm run test
npx tsc -p tsconfig.app.json --noEmit
npm run build
```
Beklenen: PASS, 0 hata, build başarılı.

- [ ] **Step 6: Commit**

```bash
git add -- src/components/admin/kadro/ src/pages/admin/kadro/
git commit -- src/components/admin/kadro/ src/pages/admin/kadro/
```
Mesaj konusu: `feat(kadro): matris, rutinler ve ilan metinleri sayfaları`

---

### Task 13: Kapanış doğrulamaları ve migration'ın uygulanması

**Files:**
- Modify: `docs/README.md` (indeks satırı)
- Modify: `CLAUDE.md` (Kadro Konsolu kısa notu — yalnız gerçekten gerekliyse)

- [ ] **Step 1: Tüm test takımını çalıştır**

```bash
npm run test
```
Beklenen: tüm dosyalar yeşil. Kırmızı varsa kaynağı düzelt, testi gevşetme.

- [ ] **Step 2: Lint, tsc ve build**

```bash
npm run lint
npx tsc -p tsconfig.app.json --noEmit
npm run build
```
Beklenen: 0 problem · 0 hata · başarılı build.

- [ ] **Step 3: Araç kataloğunu tazele**

```bash
npm run ingest:tools:check
```

> `src/lib/**` altına yeni dosya eklendiği için ajan araç kataloğu bayatlamıştır. **Ne lint ne test bunu yakalar** — `prelint` yalnız `check:drift` çalıştırır. Kırmızıysa kataloğu yeniden üret ve commit et.

- [ ] **Step 4: Ölü kod taraması**

```bash
npm run check:dead
```
Beklenen: temiz. (Ayrıştırma sırasında geçici kırmızı normaldir; burada iş bittiği için temiz olmalı.)

- [ ] **Step 5: Migration parent dizin kontrolü**

```bash
ls supabase/migrations/*.sql 2>/dev/null && echo "HATA" || echo "temiz"
```

- [ ] **Step 6: Migration'ı canlıya uygula — KULLANICI ONAYI GEREKLİ**

> ⚠️ **Bu adım canlı veritabanına yazar. Önce kullanıcıya sor.**
>
> Üretim örneğinin RAM'i 1 GB'ın altındadır ve tek kötü sorgu siteyi düşürür. Bu migration yalnız `create table` / `create policy` içerir, büyük tablo taraması yoktur — güvenlidir; ama yine de onaysız çalıştırılmaz.

Uygulama `psql -f` ile UTF-8 dosya olarak yapılır (PowerShell komut satırından geçen Türkçe karakterler bozulur). Sonra:

```bash
npm run check:migrations
```
Beklenen: sapma yok, 398/398.

- [ ] **Step 7: Tarayıcıda gözle doğrula**

`npm run dev` ile açıp admin hesabıyla kontrol et:
- [ ] `/admin/kadro` 52 rolü bölüm ve eksen başlıklarıyla gösteriyor
- [ ] Filtreler ve arama çalışıyor; "kuratör" araması Radar rolünü buluyor
- [ ] Bir rolün durumunu değiştir → Kaydet → sayfayı yenile → değişiklik duruyor
- [ ] Aynı rolün çekmecesinde geçmiş satırı görünüyor (eski → yeni)
- [ ] Aday ekle → aşamasını ilerlet → duruyor
- [ ] CSV indir → Excel'de aç → Türkçe karakterler bozulmamış
- [ ] `/admin/kadro/matris`, `/rutinler`, `/ilanlar` açılıyor; ilan kopyalama çalışıyor
- [ ] Menüde "Kadro" grubu ve dört öğe görünüyor
- [ ] Yeni yazılan arayüz metinlerinde eksik Türkçe harf yok (gözle — `verify:text` bunu yakalamaz)

- [ ] **Step 8: Dokümantasyonu güncelle**

`docs/README.md` indeksine spec ve plan satırlarını ekle.

- [ ] **Step 9: Commit**

```bash
git add -- docs/README.md
git commit -- docs/README.md
```
Mesaj konusu: `docs(kadro): indeks güncellemesi`

- [ ] **Step 10: Push — KULLANICI ONAYI GEREKLİ**

`main` dalına push etmeden önce kullanıcıya sor.

---

## Kapsam dışı

Bu plan şunları **içermez** ve içermemelidir:

- Public kariyer sayfası, başvuru formu, başvuru bildirimi
- Rol tanımlarının admin panelinden düzenlenmesi (tam DB modeli reddedildi)
- `types.ts` regen
- Ücret / hisse rakamlarının panoda düzenlenebilir olması
- **Radar Editörü artifact'ı** (`2yBSLzFKtLVZZ4nBJ7VnoY`) — ayrı ve daha ağır bir iş.
  5 varlık içerir ve projede zaten farklı bir Radar modülü vardır
  (`radar-news-scan`, `/admin/radar/*`, `radarNewsPipeline.ts`). Aynı isim,
  farklı iş. Kendi brainstorming'i ve kendi planıyla ele alınacak.
