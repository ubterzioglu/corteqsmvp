# Directory & Search UX Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Anasayfadan yapılan arama doğrudan `/directory?q=...` sayfasına yönlendirsin; Directory sayfası hem görsel olarak hem layout olarak ana sayfa ve bireysel kullanıcı profiliyle uyumlu olsun; tüm katalog öğeleri bireysel profil gibi gösteriliyor olsun; kullanıcı profilleri aranabilir ve tıklanabilir hale gelsin; auth duvarı sadece gerekli yerlerde kalsın.

**Architecture:**
- `DiasporaSearchBar` arama sonuçlarını inline göstermek yerine `/directory?q=...` adresine navigate eder.
- `DirectoryPage` layout'u ana sayfanın `landing-ambient` arka planını ve `IndividualPublicView`'ın kart stilini referans alarak yeniden tasarlanır.
- `DirectoryCatalogItemPage` ve `DirectoryProfilePage` her ikisi de aynı `ProfileHeroCard` wrapper bileşenini kullanarak bireysel profil görünümüne kavuşur.
- `/directory/profile/:userId` rotasındaki `RequireAuth` kaldırılır (public view için auth gerekmez).
- Bir test kullanıcısının `user_profiles.profile_visible = true` yapılarak dizinde görünür hale getirilmesi için Supabase migrations veya admin script yazılır.

**Tech Stack:** React + TypeScript + React Router DOM, shadcn/ui, Tailwind CSS, Supabase, Vite

---

## File Map

| Dosya | İşlem | Sorumluluk |
|-------|-------|-----------|
| `src/components/DiasporaSearchBar.tsx` | Modify | `handleSearch` inline sonuç yerine `/directory?q=` navigate et |
| `src/pages/DirectoryPage.tsx` | Modify | Layout yenile: ambient BG, row-based results, filter pills |
| `src/components/directory/DirectorySearchBar.tsx` | Create | Directory'ye özel arama barı (DiasporaSearchBar stilinde) |
| `src/components/directory/DirectoryFilters.tsx` | Create | Rol/ülke/şehir buton-pill filtreleri |
| `src/components/directory/DirectoryResultRow.tsx` | Create | Tek satır sonuç bileşeni (profil + katalog öğesi ortak) |
| `src/components/directory/ProfileHeroCard.tsx` | Create | Hem DirectoryCatalogItemPage hem DirectoryProfilePage için ortak hero header bileşeni |
| `src/pages/DirectoryProfilePage.tsx` | Modify | RequireAuth kaldır, `ProfileHeroCard` kullan |
| `src/pages/DirectoryCatalogItemPage.tsx` | Modify | `ProfileHeroCard` kullan, bireysel profil layoutuna uyar |
| `src/App.tsx` | Modify | `/directory/profile/:userId` rotasından `RequireAuth` kaldır |
| `supabase/migrations/20260605_make_test_user_public.sql` | Create | Test kullanıcısını public/aranabilir yap |

---

## Task 1: DiasporaSearchBar — Inline Sonuçları Kaldır, Directory'ye Yönlendir

**Files:**
- Modify: `src/components/DiasporaSearchBar.tsx`

**Mevcut durum:** `handleSearch` Supabase'den veri çekip inline `results` state'e yazar, sonuçlar arama barının altında render edilir. Kullanıcı tıklayınca `/directory`'e gider ama q parametresi olmadan, bu yüzden Directory sayfası boş açılır.

**Hedef:** `handleSearch` tetiklendiğinde `navigate("/directory?q=" + encodeURIComponent(query))` yapsın ve inline sonuçlar tamamen kaldırılsın.

- [ ] **Step 1: Failing test yaz**

`src/components/DiasporaSearchBar.test.tsx` oluştur:

```typescript
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import DiasporaSearchBar from "./DiasporaSearchBar";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});
vi.mock("@/contexts/DiasporaContext", () => ({
  useDiaspora: () => ({ selectedCountry: "all" }),
}));

describe("DiasporaSearchBar navigation", () => {
  it("navigates to /directory?q=... on search submit instead of showing inline results", async () => {
    render(
      <MemoryRouter>
        <DiasporaSearchBar />
      </MemoryRouter>,
    );
    const input = screen.getByPlaceholderText(/ne arıyorsun/i);
    fireEvent.change(input, { target: { value: "danışman" } });
    fireEvent.click(screen.getByRole("button", { name: /ara/i }));
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/directory?q=dan%C4%B1%C5%9Fman");
    });
  });

  it("does NOT render inline search results after searching", async () => {
    render(
      <MemoryRouter>
        <DiasporaSearchBar />
      </MemoryRouter>,
    );
    const input = screen.getByPlaceholderText(/ne arıyorsun/i);
    fireEvent.change(input, { target: { value: "vize" } });
    fireEvent.click(screen.getByRole("button", { name: /ara/i }));
    await waitFor(() => {
      expect(screen.queryByText(/sonuç bulunamadı/i)).not.toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Testi çalıştır — FAIL beklenir**

```bash
npm run test -- src/components/DiasporaSearchBar.test.tsx
```

Beklenen: "navigates to /directory..." testi FAIL (navigate henüz çağrılmıyor)

- [ ] **Step 3: DiasporaSearchBar'ı güncelle**

`src/components/DiasporaSearchBar.tsx` içinde:

1. `results`, `loading`, `hasSearched` state'lerini kaldır
2. `searchDiaspora` import'unu kaldır (artık kullanılmıyor)
3. `runSearch` ve `handleSearch` fonksiyonlarını şunla değiştir:

```typescript
const handleSearch = () => {
  const trimmed = query.trim();
  if (!trimmed) return;
  navigate(`/directory?q=${encodeURIComponent(trimmed)}`);
};
```

4. `handleQuickSearch` fonksiyonunu şunla değiştir:

```typescript
const handleQuickSearch = (term: string) => {
  setQuery(term);
  navigate(`/directory?q=${encodeURIComponent(term)}`);
};
```

5. `handleKeyDown` içindeki `void handleSearch()` → `handleSearch()` yap (artık async değil)

6. JSX'ten şu blokları tamamen sil:
   - `{loading && ...}` bloğu (AI aranıyor spinner)
   - `{!loading && hasSearched && results.length > 0 && ...}` bloğu (results map)
   - `{!loading && hasSearched && results.length === 0 && ...}` bloğu (sonuç bulunamadı)

7. `button` üzerindeki `disabled={loading || !query.trim()}` → `disabled={!query.trim()}` yap

8. Kullanılmayan `Loader2` import'unu kaldır

- [ ] **Step 4: Testi çalıştır — PASS beklenir**

```bash
npm run test -- src/components/DiasporaSearchBar.test.tsx
```

Beklenen: Her iki test PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/DiasporaSearchBar.tsx src/components/DiasporaSearchBar.test.tsx
git commit -m "feat: redirect diaspora search to /directory?q= instead of inline results"
```

---

## Task 2: DirectorySearchBar Bileşeni — DiasporaSearchBar Stilinde

**Files:**
- Create: `src/components/directory/DirectorySearchBar.tsx`
- Test: `src/components/directory/DirectorySearchBar.test.tsx`

**Hedef:** Directory sayfasının üst kısmında, DiasporaSearchBar ile aynı görsel stilde (cam efektli, `🔍` ikonlu) bir arama barı. URL search params'ı günceller.

- [ ] **Step 1: Failing test yaz**

`src/components/directory/DirectorySearchBar.test.tsx`:

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";
import DirectorySearchBar from "./DirectorySearchBar";

const mockSetSearchParams = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useSearchParams: () => [new URLSearchParams(), mockSetSearchParams],
  };
});

describe("DirectorySearchBar", () => {
  it("renders search input with placeholder", () => {
    render(
      <MemoryRouter>
        <DirectorySearchBar value="" onChange={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.getByPlaceholderText(/ara/i)).toBeInTheDocument();
  });

  it("calls onChange when input changes", () => {
    const onChangeMock = vi.fn();
    render(
      <MemoryRouter>
        <DirectorySearchBar value="" onChange={onChangeMock} />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByPlaceholderText(/ara/i), { target: { value: "test" } });
    expect(onChangeMock).toHaveBeenCalledWith("test");
  });
});
```

- [ ] **Step 2: Testi çalıştır — FAIL beklenir**

```bash
npm run test -- src/components/directory/DirectorySearchBar.test.tsx
```

Beklenen: FAIL (dosya yok)

- [ ] **Step 3: Bileşeni yaz**

`src/components/directory/DirectorySearchBar.tsx` oluştur:

```typescript
import { Search, X } from "lucide-react";

interface DirectorySearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const DirectorySearchBar = ({
  value,
  onChange,
  placeholder = "İsim, bio veya role özel alan ara...",
}: DirectorySearchBarProps) => {
  return (
    <div className="relative flex items-center rounded-2xl border border-white/70 bg-white/70 shadow-[0_22px_45px_-28px_rgba(15,23,42,0.26)] px-4 py-3 gap-3 backdrop-blur-xl">
      <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Aramayı temizle"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default DirectorySearchBar;
```

- [ ] **Step 4: Testi çalıştır — PASS beklenir**

```bash
npm run test -- src/components/directory/DirectorySearchBar.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add src/components/directory/DirectorySearchBar.tsx src/components/directory/DirectorySearchBar.test.tsx
git commit -m "feat: add DirectorySearchBar component with diaspora-style glass UI"
```

---

## Task 3: DirectoryFilters — Butonlu Filtreler (DiasporaSearchBar pill stilinde)

**Files:**
- Create: `src/components/directory/DirectoryFilters.tsx`
- Test: `src/components/directory/DirectoryFilters.test.tsx`

**Hedef:** Rol, Ülke, Şehir ve Featured filtreleri pill/buton şeklinde, ana sayfadaki quick-pill'lerin stilini referans alarak gösterilsin. Tüm filtreler tek satırda `flex-wrap` ile dizilsin.

- [ ] **Step 1: Failing test yaz**

`src/components/directory/DirectoryFilters.test.tsx`:

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import DirectoryFilters from "./DirectoryFilters";
import type { DirectoryRoleOption } from "@/lib/catalog-directory";

const mockRoles: DirectoryRoleOption[] = [
  { key: "danisman", label: "Danışman" },
  { key: "isletme", label: "İşletme" },
];

describe("DirectoryFilters", () => {
  it("renders role options as buttons", () => {
    render(
      <DirectoryFilters
        roleOptions={mockRoles}
        roleFilter="all"
        onRoleChange={vi.fn()}
        availableCountries={[]}
        availableCities={[]}
        countryFilter=""
        cityFilter=""
        featuredOnly={false}
        onCountryChange={vi.fn()}
        onCityChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Danışman")).toBeInTheDocument();
    expect(screen.getByText("İşletme")).toBeInTheDocument();
  });

  it("calls onRoleChange when role pill clicked", () => {
    const onRoleChange = vi.fn();
    render(
      <DirectoryFilters
        roleOptions={mockRoles}
        roleFilter="all"
        onRoleChange={onRoleChange}
        availableCountries={[]}
        availableCities={[]}
        countryFilter=""
        cityFilter=""
        featuredOnly={false}
        onCountryChange={vi.fn()}
        onCityChange={vi.fn()}
        onFeaturedChange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Danışman"));
    expect(onRoleChange).toHaveBeenCalledWith("danisman");
  });
});
```

- [ ] **Step 2: Testi çalıştır — FAIL beklenir**

```bash
npm run test -- src/components/directory/DirectoryFilters.test.tsx
```

- [ ] **Step 3: Bileşeni yaz**

`src/components/directory/DirectoryFilters.tsx` oluştur:

```typescript
import { cn } from "@/lib/utils";
import type { DirectoryRoleOption } from "@/lib/catalog-directory";
import SearchableCountrySelect from "@/components/SearchableCountrySelect";
import SearchableCitySelect from "@/components/SearchableCitySelect";

interface DirectoryFiltersProps {
  roleOptions: DirectoryRoleOption[];
  roleFilter: string;
  onRoleChange: (role: string) => void;
  availableCountries: string[];
  availableCities: string[];
  countryFilter: string;
  cityFilter: string;
  featuredOnly: boolean;
  onCountryChange: (v: string) => void;
  onCityChange: (v: string) => void;
  onFeaturedChange: (v: boolean) => void;
}

const pillBase =
  "inline-flex items-center justify-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 cursor-pointer";

const pillActive = "border-primary/60 bg-primary text-primary-foreground shadow-sm";
const pillInactive =
  "border-border/60 bg-white/60 text-foreground/80 hover:bg-white/90 backdrop-blur-sm";

const DirectoryFilters = ({
  roleOptions,
  roleFilter,
  onRoleChange,
  availableCountries,
  availableCities,
  countryFilter,
  cityFilter,
  featuredOnly,
  onCountryChange,
  onCityChange,
  onFeaturedChange,
}: DirectoryFiltersProps) => {
  return (
    <div className="space-y-3">
      {/* Role pills */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onRoleChange("all")}
          className={cn(pillBase, roleFilter === "all" ? pillActive : pillInactive)}
        >
          Tümü
        </button>
        {roleOptions.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onRoleChange(option.key)}
            className={cn(pillBase, roleFilter === option.key ? pillActive : pillInactive)}
          >
            {option.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onFeaturedChange(!featuredOnly)}
          className={cn(pillBase, featuredOnly ? pillActive : pillInactive)}
        >
          ⭐ Featured
        </button>
      </div>

      {/* Country + City selects */}
      <div className="flex flex-wrap gap-2">
        <SearchableCountrySelect
          value={countryFilter || "all"}
          onChange={(v) => onCountryChange(v || "all")}
          countries={["all", ...availableCountries]}
          placeholder="Ülke"
          size="sm"
          allowClear={false}
        />
        <SearchableCitySelect
          value={cityFilter || "all"}
          onChange={(v) => onCityChange(v || "all")}
          cities={["all", ...availableCities]}
          placeholder="Şehir"
          size="sm"
          allowClear={false}
        />
      </div>
    </div>
  );
};

export default DirectoryFilters;
```

- [ ] **Step 4: Testi çalıştır — PASS beklenir**

```bash
npm run test -- src/components/directory/DirectoryFilters.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add src/components/directory/DirectoryFilters.tsx src/components/directory/DirectoryFilters.test.tsx
git commit -m "feat: add DirectoryFilters with role pill buttons"
```

---

## Task 4: DirectoryResultRow — Satır Satır Sonuç Bileşeni

**Files:**
- Create: `src/components/directory/DirectoryResultRow.tsx`
- Test: `src/components/directory/DirectoryResultRow.test.tsx`

**Hedef:** Mevcut grid card yerine tek satır halinde sonuç göster (avatar/logo + isim + rol + lokasyon + badge'ler + sağda ok). Her satır tıklanabilir link.

- [ ] **Step 1: Failing test yaz**

`src/components/directory/DirectoryResultRow.test.tsx`:

```typescript
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DirectoryResultRow from "./DirectoryResultRow";
import type { UnifiedDirectoryRow } from "@/lib/catalog-directory";

const mockUserRow: UnifiedDirectoryRow = {
  recordType: "user_profile",
  id: "user-123",
  href: "/directory/profile/user-123",
  title: "Ahmet Yılmaz",
  roleKey: "danisman",
  roleLabel: "Danışman",
  description: "Göçmenlik hukuku uzmanı",
  country: "Almanya",
  city: "Berlin",
  imageUrl: null,
  specialLabel: null,
  specialValue: null,
  isFeatured: true,
  isVerified: false,
  isClaimable: false,
};

describe("DirectoryResultRow", () => {
  it("renders name, role and location", () => {
    render(
      <MemoryRouter>
        <DirectoryResultRow row={mockUserRow} />
      </MemoryRouter>,
    );
    expect(screen.getByText("Ahmet Yılmaz")).toBeInTheDocument();
    expect(screen.getByText("Danışman")).toBeInTheDocument();
    expect(screen.getByText(/Berlin/)).toBeInTheDocument();
  });

  it("renders Featured badge when isFeatured", () => {
    render(
      <MemoryRouter>
        <DirectoryResultRow row={mockUserRow} />
      </MemoryRouter>,
    );
    expect(screen.getByText("Featured")).toBeInTheDocument();
  });

  it("renders link to the correct href", () => {
    render(
      <MemoryRouter>
        <DirectoryResultRow row={mockUserRow} />
      </MemoryRouter>,
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/directory/profile/user-123");
  });
});
```

- [ ] **Step 2: Testi çalıştır — FAIL beklenir**

```bash
npm run test -- src/components/directory/DirectoryResultRow.test.tsx
```

- [ ] **Step 3: Bileşeni yaz**

`src/components/directory/DirectoryResultRow.tsx` oluştur:

```typescript
import { Link } from "react-router-dom";
import { ArrowUpRight, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { UnifiedDirectoryRow } from "@/lib/catalog-directory";

interface DirectoryResultRowProps {
  row: UnifiedDirectoryRow;
}

const DirectoryResultRow = ({ row }: DirectoryResultRowProps) => {
  const initials = row.title.slice(0, 2).toUpperCase();
  const locationLabel = [row.city, row.country].filter(Boolean).join(" • ");

  return (
    <Link
      to={row.href}
      className="group flex items-center gap-4 rounded-2xl border border-border bg-white/80 px-5 py-4 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* Avatar / Logo */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[14px] border bg-gradient-to-br from-primary/20 to-primary/5 text-sm font-bold text-primary">
        {row.imageUrl ? (
          <img src={row.imageUrl} alt={row.title} className="h-full w-full object-cover" />
        ) : (
          initials
        )}
      </div>

      {/* Main content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-foreground">{row.title}</span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            {row.roleLabel}
          </span>
          {row.isFeatured ? <Badge className="text-[10px] px-2 py-0">Featured</Badge> : null}
          {row.isVerified ? (
            <Badge variant="outline" className="text-[10px] px-2 py-0">
              Onaylı
            </Badge>
          ) : null}
          {row.recordType === "catalog_item" ? (
            <Badge variant="secondary" className="text-[10px] px-2 py-0">
              Claimable
            </Badge>
          ) : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {row.description ? (
            <span className="line-clamp-1">{row.description}</span>
          ) : null}
          {locationLabel ? (
            <span className="flex items-center gap-1 shrink-0">
              <MapPin className="h-3 w-3" /> {locationLabel}
            </span>
          ) : null}
        </div>
        {row.specialLabel && row.specialValue ? (
          <p className="mt-1 text-xs">
            <span className="font-medium text-foreground">{row.specialLabel}:</span>{" "}
            <span className="text-muted-foreground">{row.specialValue}</span>
          </p>
        ) : null}
      </div>

      <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </Link>
  );
};

export default DirectoryResultRow;
```

- [ ] **Step 4: Testi çalıştır — PASS beklenir**

```bash
npm run test -- src/components/directory/DirectoryResultRow.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add src/components/directory/DirectoryResultRow.tsx src/components/directory/DirectoryResultRow.test.tsx
git commit -m "feat: add DirectoryResultRow list-style result item"
```

---

## Task 5: DirectoryPage Yeniden Tasarım

**Files:**
- Modify: `src/pages/DirectoryPage.tsx`
- Modify (tests): `src/pages/DirectoryPage.test.tsx`

**Hedef:**
1. Ana sayfanın `landing-ambient` arka planını kullan
2. `DirectorySearchBar` + `DirectoryFilters` bileşenlerini kullan
3. Sonuçlar `DirectoryResultRow` satırları olarak render edilsin (grid yerine)
4. Sayfa başında başlık+açıklama bloğu IndividualPublicView stiline benzer şekilde
5. URL'den gelen `?q=` parametresi `searchText` state'ini seed'lesin (redirect'ten doğru çalışsın)

- [ ] **Step 1: Mevcut testi güncelle**

`src/pages/DirectoryPage.test.tsx` dosyasını aç ve `grid gap-4` içeren test assertion'larını `DirectoryResultRow` bileşenine göre güncelle. Mevcut "Okan Demirtaş" gibi isimler test'te hâlâ çalışmalı:

```typescript
// Mevcut test'te grid assert'lerini kaldır, row link assert'lerini ekle:
it("renders rows as list items with links", async () => {
  // ... (mevcut mock setup'ı koru)
  const links = await screen.findAllByRole("link");
  expect(links.length).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Testi çalıştır — mevcut test pass, yeni test FAIL**

```bash
npm run test -- src/pages/DirectoryPage.test.tsx
```

- [ ] **Step 3: DirectoryPage'i yeniden yaz**

`src/pages/DirectoryPage.tsx` içeriğini şunla değiştir:

```typescript
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import DirectorySearchBar from "@/components/directory/DirectorySearchBar";
import DirectoryFilters from "@/components/directory/DirectoryFilters";
import DirectoryResultRow from "@/components/directory/DirectoryResultRow";
import {
  listDirectoryRoleOptions,
  listUnifiedDirectoryRows,
  type DirectoryRoleOption,
  type UnifiedDirectoryRow,
} from "@/lib/catalog-directory";

const DirectoryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState<UnifiedDirectoryRow[]>([]);
  const [roleOptions, setRoleOptions] = useState<DirectoryRoleOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const searchText = searchParams.get("q") ?? "";
  const roleFilter = searchParams.get("role") ?? "all";
  const countryFilter = searchParams.get("country") ?? "";
  const cityFilter = searchParams.get("city") ?? "";
  const featuredOnly = searchParams.get("featured") === "1";

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const [nextRows, nextRoles] = await Promise.all([
          listUnifiedDirectoryRows({ searchText, roleFilter, countryFilter, cityFilter, featuredOnly }),
          listDirectoryRoleOptions(),
        ]);
        if (!isMounted) return;
        setRows(nextRows);
        setRoleOptions(nextRoles);
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(error instanceof Error ? error.message : "Bilinmeyen hata");
        setRows([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [cityFilter, countryFilter, featuredOnly, roleFilter, searchText]);

  const availableCountries = useMemo(
    () => Array.from(new Set(rows.map((r) => r.country).filter(Boolean))) as string[],
    [rows],
  );
  const availableCities = useMemo(
    () => Array.from(new Set(rows.map((r) => r.city).filter(Boolean))) as string[],
    [rows],
  );

  const updateFilter = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === "all") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next);
  };

  return (
    <div className="landing-ambient min-h-screen">
      <div className="landing-ambient-orb landing-ambient-orb-one" aria-hidden="true" />
      <div className="landing-ambient-orb landing-ambient-orb-two" aria-hidden="true" />
      <main className="relative isolate mx-auto w-full max-w-4xl px-4 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            CorteQS <span className="text-gradient-primary">Directory</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Onaylı profilleri rol, ülke ve şehre göre keşfet
          </p>
        </div>

        {/* Search bar */}
        <div className="mb-4 max-w-2xl mx-auto">
          <DirectorySearchBar
            value={searchText}
            onChange={(v) => updateFilter("q", v || null)}
          />
        </div>

        {/* Filters */}
        <div className="mb-6">
          <DirectoryFilters
            roleOptions={roleOptions}
            roleFilter={roleFilter}
            onRoleChange={(v) => updateFilter("role", v)}
            availableCountries={availableCountries}
            availableCities={availableCities}
            countryFilter={countryFilter}
            cityFilter={cityFilter}
            featuredOnly={featuredOnly}
            onCountryChange={(v) => updateFilter("country", v)}
            onCityChange={(v) => updateFilter("city", v)}
            onFeaturedChange={(v) => updateFilter("featured", v ? "1" : null)}
          />
        </div>

        {/* Results */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Directory yükleniyor...</p>
        ) : null}
        {errorMessage ? (
          <p className="text-sm text-destructive text-center py-4">Directory alınamadı: {errorMessage}</p>
        ) : null}

        {!isLoading && !errorMessage ? (
          <div className="space-y-3">
            {rows.length > 0 ? (
              rows.map((row) => (
                <DirectoryResultRow key={`${row.recordType}-${row.id}`} row={row} />
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Filtrelerine uygun görünür profil bulunamadı.
              </p>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default DirectoryPage;
```

- [ ] **Step 4: Testi çalıştır — PASS beklenir**

```bash
npm run test -- src/pages/DirectoryPage.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/DirectoryPage.tsx src/pages/DirectoryPage.test.tsx
git commit -m "feat: redesign DirectoryPage with ambient layout, search bar, pill filters and row results"
```

---

## Task 6: ProfileHeroCard — Katalog ve Profil Sayfaları için Ortak Hero Bileşeni

**Files:**
- Create: `src/components/directory/ProfileHeroCard.tsx`
- Test: `src/components/directory/ProfileHeroCard.test.tsx`

**Hedef:** `IndividualPublicView`'ın header stiline benzer; avatar, isim, rol, lokasyon, badge'ler, opsiyonel claim butonu. Hem `DirectoryCatalogItemPage` hem `DirectoryProfilePage` (generic/non-individual) kullanır.

- [ ] **Step 1: Failing test yaz**

`src/components/directory/ProfileHeroCard.test.tsx`:

```typescript
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ProfileHeroCard from "./ProfileHeroCard";

describe("ProfileHeroCard", () => {
  it("renders title and subtitle", () => {
    render(
      <MemoryRouter>
        <ProfileHeroCard
          title="Örnek Danışmanlık"
          subtitle="Göçmenlik Hukuku"
          roleLabel="Danışman"
          locationLabel="Berlin • Almanya"
          imageUrl={null}
          badges={[{ label: "Onaylı", variant: "outline" }]}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("Örnek Danışmanlık")).toBeInTheDocument();
    expect(screen.getByText("Göçmenlik Hukuku")).toBeInTheDocument();
    expect(screen.getByText("Danışman")).toBeInTheDocument();
    expect(screen.getByText("Onaylı")).toBeInTheDocument();
  });

  it("renders avatar initials when no imageUrl", () => {
    render(
      <MemoryRouter>
        <ProfileHeroCard
          title="Ahmet Test"
          subtitle={null}
          roleLabel={null}
          locationLabel={null}
          imageUrl={null}
          badges={[]}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("AH")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Testi çalıştır — FAIL beklenir**

```bash
npm run test -- src/components/directory/ProfileHeroCard.test.tsx
```

- [ ] **Step 3: Bileşeni yaz**

`src/components/directory/ProfileHeroCard.tsx` oluştur:

```typescript
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ReactNode } from "react";

type BadgeSpec = {
  label: string;
  variant?: "default" | "secondary" | "outline" | "destructive";
};

interface ProfileHeroCardProps {
  title: string;
  subtitle: string | null;
  roleLabel: string | null;
  locationLabel: string | null;
  imageUrl: string | null;
  badges: BadgeSpec[];
  actions?: ReactNode;
  children?: ReactNode;
}

const ProfileHeroCard = ({
  title,
  subtitle,
  roleLabel,
  locationLabel,
  imageUrl,
  badges,
  actions,
  children,
}: ProfileHeroCardProps) => {
  const initials = title.slice(0, 2).toUpperCase();

  return (
    <section className="overflow-hidden rounded-[28px] border border-border bg-card shadow-card">
      {/* Header — matches IndividualPublicView gradient */}
      <div className="border-b border-border bg-[radial-gradient(circle_at_top_left,rgba(18,164,196,0.18),transparent_38%),linear-gradient(135deg,rgba(15,23,42,0.04),rgba(15,23,42,0))] px-5 py-5 md:px-7 md:py-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[24px] border bg-gradient-to-br from-primary/20 to-primary/5 text-2xl font-bold text-primary shadow-lg md:h-24 md:w-24 md:text-3xl">
            {imageUrl ? (
              <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>

          <div className="min-w-0 flex-1">
            {/* Badges */}
            {badges.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-3">
                {badges.map((badge) => (
                  <Badge key={badge.label} variant={badge.variant ?? "secondary"}>
                    {badge.label}
                  </Badge>
                ))}
              </div>
            ) : null}

            {/* Title */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                {title}
              </h1>
              {roleLabel ? (
                <span className="rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                  {roleLabel}
                </span>
              ) : null}
            </div>

            {/* Subtitle */}
            {subtitle ? (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            ) : null}

            {/* Location */}
            {locationLabel ? (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> {locationLabel}
              </p>
            ) : null}

            {/* Actions slot */}
            {actions ? <div className="mt-4">{actions}</div> : null}
          </div>
        </div>
      </div>

      {/* Content slot */}
      {children ? <div className="p-5 md:p-6 space-y-6">{children}</div> : null}
    </section>
  );
};

export default ProfileHeroCard;
```

- [ ] **Step 4: Testi çalıştır — PASS beklenir**

```bash
npm run test -- src/components/directory/ProfileHeroCard.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add src/components/directory/ProfileHeroCard.tsx src/components/directory/ProfileHeroCard.test.tsx
git commit -m "feat: add ProfileHeroCard shared hero header for catalog and profile detail pages"
```

---

## Task 7: DirectoryCatalogItemPage — ProfileHeroCard ile Yeniden Düzenle

**Files:**
- Modify: `src/pages/DirectoryCatalogItemPage.tsx`

**Hedef:** Mevcut `Card` + `CardHeader` yapısını `ProfileHeroCard` ile değiştir. İçerik alanları (services, contacts) `ProfileHeroCard`'ın `children` prop'unda kalsın. Claim butonu `actions` prop'unda geçirilsin. Görünüm bireysel profil sayfasıyla aynı hissettirsin.

- [ ] **Step 1: Testi güncelle**

`src/pages/DirectoryCatalogItemPage.tsx` için ayrı bir test dosyası yoksa, `DirectoryProfilePage.test.tsx` pattern'ini baz alarak temel bir test yaz ya da mevcut sayfanın manuel testini belirt. Bu task için manuel doğrulama yeterlidir — backend değiştirilmiyor.

- [ ] **Step 2: Sayfayı güncelle**

`src/pages/DirectoryCatalogItemPage.tsx` dosyasında:

1. `ProfileHeroCard` import et:
```typescript
import ProfileHeroCard from "@/components/directory/ProfileHeroCard";
```

2. Mevcut `{item ? ( <Card ...> <CardHeader>...</CardHeader> <CardContent>...` bloğunu şunla değiştir:

```typescript
{item ? (
  <ProfileHeroCard
    title={item.title}
    subtitle={item.headline ?? null}
    roleLabel={roleLabel ?? null}
    locationLabel={locationLabel || null}
    imageUrl={null}
    badges={[
      ...(roleLabel ? [{ label: roleLabel, variant: "secondary" as const }] : []),
      ...categories.map((c) => ({ label: c.name, variant: "outline" as const })),
      item.verification_status === "claimed"
        ? { label: "Claimed", variant: "default" as const }
        : { label: "Claimable", variant: "outline" as const },
    ]}
    actions={
      canClaim && !authLoading ? (
        user ? (
          <button
            onClick={() => void submitClaim()}
            disabled={claimStatus !== "idle"}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          >
            {claimStatus === "submitted"
              ? "Talep Gönderildi"
              : claimStatus === "submitting"
                ? "Gönderiliyor..."
                : "Bu Sayfayı Düzenlemek İstiyorum"}
          </button>
        ) : (
          <a
            href={loginHref}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Düzenleme Yetkisi İçin Giriş Yap
          </a>
        )
      ) : null
    }
  >
    {/* İçerik */}
    {claimError ? <p className="text-sm text-destructive">Claim talebi gönderilemedi: {claimError}</p> : null}
    {claimStatus === "submitted" ? (
      <p className="text-sm text-emerald-700">Düzenleme yetkisi talebiniz admin onayına gönderildi.</p>
    ) : null}

    <div className="space-y-2 text-sm text-muted-foreground">
      <p>{item.short_description ?? item.long_description ?? "Açıklama eklenmedi."}</p>
      {canClaim ? (
        <p>Bu katalog kaydının sahibiyseniz düzenlemek için başvurabilirsiniz.</p>
      ) : null}
      {primaryLocation?.address_line ? <p>{primaryLocation.address_line}</p> : null}
    </div>

    {item.catalog_item_contacts?.length ? (
      <section className="space-y-2">
        <h2 className="text-base font-semibold">İletişim</h2>
        <div className="grid gap-2 text-sm text-muted-foreground">
          {item.catalog_item_contacts.map((contact) => (
            <p key={`${contact.contact_type}-${contact.contact_value}`}>
              <span className="font-medium text-foreground">{contact.label ?? contact.contact_type}:</span>{" "}
              {contact.contact_type === "website" || contact.contact_type === "appointment_url" ? (
                <a className="text-primary underline-offset-4 hover:underline" href={contact.contact_value} target="_blank" rel="noreferrer">
                  {contact.contact_value}
                </a>
              ) : (
                contact.contact_value
              )}
            </p>
          ))}
        </div>
      </section>
    ) : null}

    {item.catalog_item_services?.length ? (
      <section className="space-y-2">
        <h2 className="text-base font-semibold">Hizmetler</h2>
        <div className="flex flex-wrap gap-2">
          {item.catalog_item_services.map((service) => (
            <Badge key={service.service_name} variant="outline">
              {service.service_name}
            </Badge>
          ))}
        </div>
      </section>
    ) : null}
  </ProfileHeroCard>
) : null}
```

3. Kullanılmayan `Card`, `CardContent`, `CardDescription`, `CardHeader`, `CardTitle`, `Button` import'larını kaldır (Button Link yerine `<a>` kullanıldı)

- [ ] **Step 3: Lint kontrolü**

```bash
npm run lint -- src/pages/DirectoryCatalogItemPage.tsx
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/DirectoryCatalogItemPage.tsx
git commit -m "feat: use ProfileHeroCard layout in DirectoryCatalogItemPage"
```

---

## Task 8: DirectoryProfilePage — Auth Duvarını Kaldır, ProfileHeroCard Kullan

**Files:**
- Modify: `src/pages/DirectoryProfilePage.tsx`
- Modify: `src/App.tsx`

**Hedef:**
1. `/directory/profile/:userId` rotasından `RequireAuth` kaldır (public erişim)
2. Generic (non-individual) profil view'ını `ProfileHeroCard` ile sarmala
3. Individual profil (`IndividualPublicView`) zaten iyi görünüyor, ona dokunma

**ÖNEMLİ:** Backend RLS policy'leri (`get_public_profile_sections`) zaten public erişimi kontrol ediyor. Auth kaldırmak sadece frontend duvarını kaldırıyor, backend güvenliğini etkilemiyor.

- [ ] **Step 1: App.tsx'te RequireAuth kaldır**

`src/App.tsx` içinde şu bloğu bul (satır ~173-179):

```typescript
<Route
  path="/directory/profile/:userId"
  element={
    <RequireAuth>
      <DirectoryProfilePage />
    </RequireAuth>
  }
```

Şununla değiştir:

```typescript
<Route
  path="/directory/profile/:userId"
  element={<DirectoryProfilePage />}
```

- [ ] **Step 2: DirectoryProfilePage'de generic section view'ı ProfileHeroCard ile güncelle**

`src/pages/DirectoryProfilePage.tsx` içinde `ProfileHeroCard` import et:

```typescript
import ProfileHeroCard from "@/components/directory/ProfileHeroCard";
```

Mevcut generic profil bloğunu (`{!isIndividualLoading && !individualDetails && !isSectionsLoading ? ( <Card ...>` ) şunla değiştir:

```typescript
{!isIndividualLoading && !individualDetails && !isSectionsLoading ? (
  <ProfileHeroCard
    title={String(displayName ?? "Profil")}
    subtitle={locationLabel || null}
    roleLabel={primaryLabel}
    locationLabel={locationLabel || null}
    imageUrl={imageUrl}
    badges={taxonomyLabels.map((label) => ({ label, variant: "outline" as const }))}
  >
    {sectionsError ? (
      <p className="text-sm text-destructive">Profil alınamadı: {sectionsError}</p>
    ) : null}
    {!sectionsError && sections.length === 0 ? (
      <p className="text-sm text-muted-foreground">
        Bu profil görünür değil veya yayınlanmış public section içermiyor.
      </p>
    ) : null}
    {!sectionsError && sections.length > 0 ? (
      <PublicProfileSummaryView model={genericProfileModel} />
    ) : null}
  </ProfileHeroCard>
) : null}
```

Kullanılmayan `Card`, `CardContent`, `CardDescription`, `CardHeader`, `CardTitle` import'larını kaldır.

- [ ] **Step 3: Mevcut testi çalıştır**

```bash
npm run test -- src/pages/DirectoryProfilePage.test.tsx
```

Beklenen: Mevcut testler PASS (sadece layout değişti, logic aynı)

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/pages/DirectoryProfilePage.tsx
git commit -m "feat: remove auth wall from profile public view, apply ProfileHeroCard layout"
```

---

## Task 9: Test Kullanıcısını Public Yapma — Supabase Migration

**Files:**
- Create: `supabase/migrations/20260605000000_make_test_user_public.sql`

**Hedef:** Loginli test kullanıcılarından birini `profile_visible = true` + `visibility = 'public'` yaparak arama ve profil görüntüleme testini mümkün kıl. Bu migration production'a gitmemeli; sadece staging veya test ortamı için bir örnek migration.

**ÖNEMLİ:** Gerçek kullanıcı UUID'sini `VITE_TEST_PUBLIC_USER_ID` env variable'ı üzerinden belirle ya da migration'ı elle çalıştır. Migration'ı `supabase db push` ile uygula.

- [ ] **Step 1: Migration dosyası yaz**

`supabase/migrations/20260605000000_make_test_user_public.sql`:

```sql
-- Make a specific user's profile publicly visible for directory search testing.
-- Replace the UUID below with the actual test user's ID before applying.
-- Run: supabase db push (staging only — do NOT run on production without verification)

DO $$
DECLARE
  v_test_user_id uuid := '00000000-0000-0000-0000-000000000000'; -- REPLACE with real user UUID
BEGIN
  UPDATE user_profiles
  SET
    profile_visible = true,
    visibility = 'public'
  WHERE user_id = v_test_user_id;

  IF NOT FOUND THEN
    RAISE WARNING 'Test user % not found in user_profiles', v_test_user_id;
  END IF;
END;
$$;
```

- [ ] **Step 2: Gerçek kullanıcı UUID'sini bul**

```bash
-- Admin panelinde veya Supabase dashboard'ında:
-- Authentication > Users listesinden bir test kullanıcısının UUID'sini al
-- Ya da: supabase/migrations/ klasöründeki mevcut seed dosyalarına bak
```

- [ ] **Step 3: Migration'ı uygula (staging)**

```bash
supabase db push
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260605000000_make_test_user_public.sql
git commit -m "chore: add migration to make test user publicly visible in directory"
```

---

## Task 10: Smoke Test — Tüm Akışı Manuel Doğrula

Bu task kod yazmaz, sadece mvp.corteqs.net üzerinde veya local `npm run dev` ile doğrular.

**Test Senaryoları:**

- [ ] **Senaryo 1: Anasayfa → Directory yönlendirmesi**
  1. `https://mvp.corteqs.net/` aç
  2. "Diasporada Ara" bölümüne gir, "danışman" yaz ve Ara'ya bas
  3. Beklenen: `/directory?q=danışman` sayfasına navigate edilmeli
  4. Inline sonuçlar anasayfada çıkmamalı

- [ ] **Senaryo 2: Directory arama sonuçları**
  1. `/directory?q=test` adresine git
  2. Beklenen: Sonuçlar satır satır (liste), grid değil
  3. Her satır tıklanabilir, doğru profile gidiyor

- [ ] **Senaryo 3: Filtreler**
  1. `/directory` aç
  2. Rol pill'lerine tıkla (ör. "Danışman")
  3. Beklenen: URL güncellenir `/directory?role=danisman`, sonuçlar filtre alır

- [ ] **Senaryo 4: Profil sayfası — auth olmadan erişim**
  1. Logout durumunda `/directory/profile/<public-user-id>` adresine git
  2. Beklenen: Login ekranına yönlendirilmemeli, profil görüntülenmeli

- [ ] **Senaryo 5: Katalog öğesi sayfası**
  1. `/directory/catalog/<slug>` adresine git
  2. Beklenen: ProfileHeroCard stilinde hero header (avatar initials, title, rol badge, lokasyon)

- [ ] **Senaryo 6: Anasayfa quick pill**
  1. Anasayfada "Şehir Elçine Ulaş" pill'ine tıkla
  2. Beklenen: `/directory`'e navigate eder

---

## Self-Review Sonuçları

### Spec Coverage

| Gereksinim | Task |
|-----------|------|
| Anasayfadan arama → /directory?q= navigate | Task 1 |
| Inline sonuçlar kaldırılsın | Task 1 |
| Directory layout ana sayfa layoutuna benzesin | Task 5 |
| Arama sonuçları satır satır | Task 4 + Task 5 |
| Directory'de genel search bar | Task 2 |
| Filtreler butonlu pill | Task 3 |
| Tüm rollere tıklandığında bireysel profil layoutu | Task 6 + Task 7 + Task 8 |
| Katalog itemleri profil gibi görünsün | Task 7 |
| DirectoryProfilePage auth duvarı kaldırılsın | Task 8 |
| Test kullanıcısı public yapılsın | Task 9 |
| Tüm akış doğrulaması | Task 10 |

### Kritik Kontroller

- **Backend değiştirilmiyor:** `listUnifiedDirectoryRows`, `search_catalog` RPC, `get_public_profile_sections` RPC — hiçbiri değiştirilmiyor
- **RLS güvenliği:** `RequireAuth` kaldırmak güvenlik açığı oluşturmuyor çünkü backend RLS'i zaten public olmayan profilleri filtreliyor
- **Individual profile:** `IndividualPublicView` dokunulmadan kalıyor — zaten iyi görünüyor
- **Mevcut test'ler:** `DirectoryPage.test.tsx` ve `DirectoryProfilePage.test.tsx` güncellenerek koruluyor
- **DiasporaSearchBar test:** `searchDiaspora` mock'u gerektiren testler artık gerekmiyor — navigate mock yeterli
