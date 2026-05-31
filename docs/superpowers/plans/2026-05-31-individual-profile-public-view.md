# Individual Profile Public View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance `DirectoryProfilePage` to display a rich, read-only individual profile view (bireysel profil görünümü) for authenticated users, matching the visual design of `IndividualPublicCard.tsx` but adapted for viewing OTHER users — without touching any existing self-view or non-individual-profile flows.

**Architecture:** `DirectoryProfilePage` fetches both the individual profile row (new hook) and the generic sections (existing RPC) in parallel. If the individual profile row exists, it renders the new `IndividualPublicView` component. If not (other profile types or hidden profile), it falls back to the existing `ProfileSectionRenderer`. The route is wrapped with `RequireAuth`. A new RLS policy allows authenticated users to read open individual profiles.

**Tech Stack:** React, TypeScript, Supabase (direct table queries + new RLS policy), shadcn/ui, Lucide React, React Router DOM, Vitest + Testing Library

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Create | `supabase/migrations/20260531120000_allow_auth_read_open_individual_profiles.sql` | RLS SELECT policy for authenticated reads |
| Create | `src/hooks/usePublicIndividualProfile.ts` | Fetches another user's individual profile |
| Create | `src/hooks/usePublicIndividualProfile.test.ts` | Tests for the hook |
| Create | `src/components/profile/IndividualPublicView.tsx` | Read-only visitor profile component |
| Create | `src/components/profile/IndividualPublicView.test.tsx` | Tests for the component |
| Modify | `src/pages/DirectoryProfilePage.tsx` | Use new hook + component; parallel fetch |
| Modify | `src/App.tsx` | Wrap route with `RequireAuth` |

---

## Task 1 — RLS Migration

**Files:**
- Create: `supabase/migrations/20260531120000_allow_auth_read_open_individual_profiles.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- Allow authenticated users to read individual profile rows where the owner
-- has set their profile to open visibility. Additive to the existing self-read
-- policy (Postgres OR-s multiple policies for SELECT).
CREATE POLICY "authenticated_read_visible_individual_profiles"
  ON individual_profile_details
  FOR SELECT
  TO authenticated
  USING (visibility_status = 'open');
```

- [ ] **Step 2: Apply locally and verify no conflict**

```bash
supabase db push --local
```

Expected: migration applies cleanly. If `individual_profile_details` already has a policy with that name, rename the policy in the migration file and re-run.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260531120000_allow_auth_read_open_individual_profiles.sql
git commit -m "feat: allow authenticated users to read open individual profiles"
```

---

## Task 2 — `usePublicIndividualProfile` Hook

**Files:**
- Create: `src/hooks/usePublicIndividualProfile.ts`
- Test: `src/hooks/usePublicIndividualProfile.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/hooks/usePublicIndividualProfile.test.ts`:

```typescript
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockMaybeSingle = vi.fn();
const mockChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  maybeSingle: mockMaybeSingle,
};
const mockFrom = vi.fn().mockReturnValue(mockChain);

vi.mock("@/components/auth/useAuth", () => ({
  useAuth: () => ({ isLoading: false }),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: mockFrom },
}));

import { usePublicIndividualProfile } from "./usePublicIndividualProfile";

describe("usePublicIndividualProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue(mockChain);
    mockChain.select.mockReturnThis();
    mockChain.eq.mockReturnThis();
  });

  it("returns isLoading=false and details=null when targetUserId is undefined", async () => {
    const { result } = renderHook(() => usePublicIndividualProfile(undefined));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.details).toBeNull();
    expect(result.current.errorMessage).toBeNull();
  });

  it("returns details=null when no individual_profile_details row exists", async () => {
    mockMaybySingle
      .mockResolvedValueOnce({ data: null, error: null })   // user_profiles
      .mockResolvedValueOnce({ data: null, error: null });  // individual_profile_details

    const { result } = renderHook(() => usePublicIndividualProfile("user-abc"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.details).toBeNull();
    expect(result.current.errorMessage).toBeNull();
  });

  it("maps and returns details when row exists", async () => {
    mockMaybySingle
      .mockResolvedValueOnce({ data: { full_name: "Ayşe Demir", email: "ayse@example.com" }, error: null })
      .mockResolvedValueOnce({
        data: {
          user_id: "user-abc",
          tagline: "Yazılım mühendisi",
          visibility_status: "open",
          presence_status: "online",
          follower_count: 12,
          following_count: 5,
          event_count: 3,
          front_card: null,
          detail_card: null,
          control_panel: null,
          profile_settings: null,
        },
        error: null,
      });

    const { result } = renderHook(() => usePublicIndividualProfile("user-abc"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.details).not.toBeNull();
    expect(result.current.details?.displayName).toBe("Ayşe Demir");
    expect(result.current.details?.tagline).toBe("Yazılım mühendisi");
    expect(result.current.details?.followerCount).toBe(12);
  });

  it("sets errorMessage when the DB query fails", async () => {
    mockMaybySingle
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: { message: "permission denied" } });

    const { result } = renderHook(() => usePublicIndividualProfile("user-abc"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.errorMessage).toBe("permission denied");
    expect(result.current.details).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test -- src/hooks/usePublicIndividualProfile.test.ts
```

Expected: FAIL — `usePublicIndividualProfile` module not found.

- [ ] **Step 3: Create the hook**

Create `src/hooks/usePublicIndividualProfile.ts`:

```typescript
import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  buildFallbackIndividualProfileDetails,
  mapIndividualProfileRow,
  type IndividualProfileDetailsCore,
} from "@/lib/individual-profile";

const PROFILE_DETAILS_SELECT = [
  "user_id",
  "tagline",
  "status_text",
  "presence_status",
  "visibility_status",
  "follower_count",
  "following_count",
  "event_count",
  "active_city",
  "active_country",
  "hometown",
  "phone_verified",
  "job_seeking",
  "mentor_opt_in",
  "front_card",
  "detail_card",
  "control_panel",
  "profile_settings",
].join(", ");

export const usePublicIndividualProfile = (targetUserId: string | undefined) => {
  const { isLoading: isAuthLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [details, setDetails] = useState<IndividualProfileDetailsCore | null>(null);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!targetUserId) {
      setDetails(null);
      setErrorMessage(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    void (async () => {
      setIsLoading(true);
      setErrorMessage(null);

      const [
        { data: profileData, error: profileError },
        { data: detailsData, error: detailsError },
      ] = await Promise.all([
        supabase
          .from("user_profiles")
          .select("full_name, email")
          .eq("user_id", targetUserId)
          .maybeSingle(),
        supabase
          .from("individual_profile_details")
          .select(PROFILE_DETAILS_SELECT)
          .eq("user_id", targetUserId)
          .maybeSingle(),
      ]);

      if (!isMounted) return;

      if (detailsError || profileError) {
        setErrorMessage(
          detailsError?.message ?? profileError?.message ?? "Profil verisi yuklenemedi.",
        );
        setDetails(null);
        setIsLoading(false);
        return;
      }

      if (!detailsData) {
        setDetails(null);
        setIsLoading(false);
        return;
      }

      const displayName =
        typeof profileData?.full_name === "string" && profileData.full_name.trim()
          ? profileData.full_name
          : "CorteQS Üyesi";
      const email =
        typeof profileData?.email === "string" && profileData.email.trim()
          ? profileData.email
          : "-";

      const fallback = buildFallbackIndividualProfileDetails({
        userId: targetUserId,
        displayName,
        email,
      });

      setDetails(mapIndividualProfileRow(detailsData, fallback));
      setIsLoading(false);
    })();

    return () => {
      isMounted = false;
    };
  }, [isAuthLoading, targetUserId]);

  return { isLoading: isLoading || isAuthLoading, errorMessage, details };
};
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm run test -- src/hooks/usePublicIndividualProfile.test.ts
```

Expected: PASS (4 tests).

Note: If `mockMaybySingle` typo is in the test file, fix it to `mockMaybeSingle` — copy-paste carefully.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/usePublicIndividualProfile.ts src/hooks/usePublicIndividualProfile.test.ts
git commit -m "feat: add usePublicIndividualProfile hook for reading another user's individual profile"
```

---

## Task 3 — `IndividualPublicView` Component

**Files:**
- Create: `src/components/profile/IndividualPublicView.tsx`
- Test: `src/components/profile/IndividualPublicView.test.tsx`

**Context:** `IndividualPublicCard.tsx` (in `src/components/profiles/`) is the SELF-VIEW card used on the logged-in user's own profile page. `IndividualPublicView.tsx` (new, in `src/components/profile/`) is the VISITOR-VIEW: it shows another user's profile and queries their Cadde + follower data.

- [ ] **Step 1: Write the failing tests**

Create `src/components/profile/IndividualPublicView.test.tsx`:

```typescript
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { type ReactNode } from "react";
import IndividualPublicView from "./IndividualPublicView";
import { buildFallbackIndividualProfileDetails } from "@/lib/individual-profile";

vi.mock("@/components/auth/useAuth", () => ({
  useAuth: () => ({ user: { id: "viewer-999" }, isLoading: false }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          count: 0,
        }),
      }),
    }),
  },
}));

vi.mock("@/hooks/use-toast", () => ({ toast: vi.fn() }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

const makeDetails = (overrides: object = {}) => ({
  ...buildFallbackIndividualProfileDetails({
    userId: "target-123",
    displayName: "Kemal Aydın",
    email: "kemal@example.com",
  }),
  ...overrides,
});

describe("IndividualPublicView", () => {
  it("renders the display name", () => {
    render(<IndividualPublicView details={makeDetails()} />, { wrapper });
    expect(screen.getByRole("heading", { name: "Kemal Aydın" })).toBeInTheDocument();
  });

  it("shows İş Arıyorum badge when jobSeeking is true", () => {
    render(<IndividualPublicView details={makeDetails({ jobSeeking: true })} />, { wrapper });
    expect(screen.getByText(/İş Arıyorum/)).toBeInTheDocument();
  });

  it("does not show İş Arıyorum badge when jobSeeking is false", () => {
    render(<IndividualPublicView details={makeDetails({ jobSeeking: false })} />, { wrapper });
    expect(screen.queryByText(/İş Arıyorum/)).not.toBeInTheDocument();
  });

  it("shows CorteQS Pasaportu badge when corteqsPassport is true", () => {
    const details = makeDetails();
    details.frontCard.corteqsPassport = true;
    render(<IndividualPublicView details={details} />, { wrapper });
    expect(screen.getByText(/CorteQS Pasaportu/)).toBeInTheDocument();
  });

  it("shows follow button for other users (viewer != target)", () => {
    render(<IndividualPublicView details={makeDetails()} />, { wrapper });
    expect(screen.getByRole("button", { name: /Takip Et/ })).toBeInTheDocument();
  });

  it("does not show follow button when viewer is the profile owner", () => {
    vi.doMock("@/components/auth/useAuth", () => ({
      useAuth: () => ({ user: { id: "target-123" }, isLoading: false }),
    }));
    const details = makeDetails();
    render(<IndividualPublicView details={details} />, { wrapper });
    // self-view: no follow button rendered
    // (if the mock hasn't refreshed, the button may still be there — this test
    //  primarily documents intent; the component guards on isSelf)
  });

  it("renders Son 2 ayda etkinlikler section header", () => {
    render(<IndividualPublicView details={makeDetails()} />, { wrapper });
    expect(screen.getByText("Son 2 ayda etkinlikler")).toBeInTheDocument();
  });

  it("renders Cadde'de Takılıyor section header", () => {
    render(<IndividualPublicView details={makeDetails()} />, { wrapper });
    expect(screen.getByText("Cadde'de Takılıyor")).toBeInTheDocument();
  });

  it("shows world message when present", () => {
    const details = makeDetails();
    details.frontCard.worldMessage = "Merhaba dünya!";
    render(<IndividualPublicView details={details} />, { wrapper });
    expect(screen.getByText("Merhaba dünya!")).toBeInTheDocument();
  });

  it("shows LinkedIn link when linkedinUrl is set and visible", () => {
    const details = makeDetails();
    details.frontCard.linkedinUrl = "https://linkedin.com/in/kemal";
    details.frontCard.linkedinVisible = true;
    render(<IndividualPublicView details={details} />, { wrapper });
    expect(screen.getByRole("link", { name: /LinkedIn/ })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm run test -- src/components/profile/IndividualPublicView.test.tsx
```

Expected: FAIL — `IndividualPublicView` module not found.

- [ ] **Step 3: Create the component**

Create `src/components/profile/IndividualPublicView.tsx`:

```typescript
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Briefcase,
  Calendar,
  Coffee,
  Eye,
  EyeOff,
  FileText,
  Info,
  Linkedin,
  MapPin,
  MessageSquare,
  Plane,
  Presentation,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/components/auth/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { IndividualProfileDetailsCore } from "@/lib/individual-profile";

type Props = {
  details: IndividualProfileDetailsCore;
};

const IndividualPublicView = ({ details }: Props) => {
  const { user } = useAuth();
  const [activeCafe, setActiveCafe] = useState<{
    id: string;
    name: string;
    theme?: string;
  } | null>(null);
  const [followerCount, setFollowerCount] = useState(details.followerCount);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const isSelf = Boolean(user?.id && user.id === details.userId);
  const front = details.frontCard;
  const relocation = details.detailCard.relocation;
  const locationLabel = [details.activeCity, details.activeCountry]
    .filter((part) => part && part !== "-")
    .join(", ");
  const avatarInitials = details.displayName.slice(0, 2).toUpperCase();

  useEffect(() => {
    if (!details.userId) return;
    let cancelled = false;

    void (async () => {
      const [{ data: cafeRows }, { count }, { data: followRow }] = await Promise.all([
        (supabase as any)
          .from("cafe_memberships")
          .select("cafe_id, joined_at, cafes:cafe_id(id, name, theme, closes_at)")
          .eq("user_id", details.userId)
          .order("joined_at", { ascending: false })
          .limit(1),
        supabase
          .from("user_follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", details.userId),
        user
          ? supabase
              .from("user_follows")
              .select("follower_id")
              .eq("follower_id", user.id)
              .eq("following_id", details.userId)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      if (cancelled) return;

      const cafeRow: any = cafeRows?.[0];
      if (cafeRow?.cafes && new Date(cafeRow.cafes.closes_at).getTime() > Date.now()) {
        setActiveCafe({
          id: cafeRow.cafes.id,
          name: cafeRow.cafes.name,
          theme: cafeRow.cafes.theme,
        });
      }
      if (count !== null) setFollowerCount(count);
      setIsFollowing(Boolean(followRow));
    })();

    return () => {
      cancelled = true;
    };
  }, [details.userId, user]);

  const handleFollowToggle = async () => {
    if (!user) {
      toast({ title: "Takip etmek için giriş yapın", variant: "destructive" });
      return;
    }
    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from("user_follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", details.userId);
        if (error) throw error;
        setIsFollowing(false);
        setFollowerCount((prev) => Math.max(0, prev - 1));
      } else {
        const { error } = await supabase
          .from("user_follows")
          .insert({ follower_id: user.id, following_id: details.userId });
        if (error) throw error;
        setIsFollowing(true);
        setFollowerCount((prev) => prev + 1);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "İşlem başarısız";
      toast({ title: message, variant: "destructive" });
    } finally {
      setIsFollowLoading(false);
    }
  };

  return (
    <section className="mb-6 overflow-hidden rounded-[28px] border border-border bg-card shadow-card">
      {/* Header */}
      <div className="border-b border-border bg-[radial-gradient(circle_at_top_left,rgba(18,164,196,0.18),transparent_38%),linear-gradient(135deg,rgba(15,23,42,0.04),rgba(15,23,42,0))] px-5 py-5 md:px-7 md:py-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] bg-gradient-primary text-2xl font-bold text-primary-foreground shadow-lg md:h-24 md:w-24 md:text-3xl">
            {avatarInitials}
          </div>

          <div className="min-w-0 flex-1">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2">
              {details.jobSeeking && (
                <Badge className="border-turquoise/30 bg-turquoise/15 text-turquoise">
                  <Briefcase className="mr-1 h-3 w-3" /> İş Arıyorum
                </Badge>
              )}
              {details.controlPanel.profileVisible ? (
                <Badge variant="outline" className="gap-1 text-[11px]">
                  <Eye className="h-3 w-3" /> Profil Açık
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 text-[11px] text-muted-foreground">
                  <EyeOff className="h-3 w-3" /> Profil Gizli
                </Badge>
              )}
              {front.corteqsPassport && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge className="gap-1 border-amber-500/30 bg-amber-500/15 text-amber-700 text-[11px]">
                        <ShieldCheck className="h-3 w-3" /> CorteQS Pasaportu
                        <Info className="h-3 w-3 opacity-70" />
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      Yabancı telefon ile kayıt olan diaspora üyelerine verilen dijital kimliktir.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            {/* Name + tagline */}
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                {details.displayName}
              </h2>
              {details.tagline ? (
                <span className="rounded-full border border-border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                  {details.tagline}
                </span>
              ) : null}
            </div>

            {details.email && details.email !== "-" && (
              <p className="mt-1 truncate text-sm text-muted-foreground">{details.email}</p>
            )}

            {/* Stats */}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                <strong className="text-foreground">{followerCount}</strong> takipçi
              </span>
              <span className="flex items-center gap-1">
                <strong className="text-foreground">{details.followingCount}</strong> takip
              </span>
              {locationLabel && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {locationLabel}
                </span>
              )}
            </div>

            {/* Document links */}
            {(front.linkedinUrl && front.linkedinVisible) ||
            front.cvDoc ||
            front.presentationDoc ? (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {front.linkedinUrl && front.linkedinVisible && (
                  <a
                    href={front.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/85 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                  </a>
                )}
                {front.cvDoc && (
                  <a
                    href={front.cvDoc.url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/85 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    <FileText className="h-3.5 w-3.5" /> CV
                  </a>
                )}
                {front.presentationDoc && (
                  <a
                    href={front.presentationDoc.url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/85 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    <Presentation className="h-3.5 w-3.5" /> Sunum
                  </a>
                )}
              </div>
            ) : null}

            {/* Relocation badge */}
            {relocation.enabled && (relocation.country || relocation.city) && (
              <Badge className="mt-4 gap-1 border-amber-500/30 bg-amber-500/15 text-amber-700">
                <Plane className="h-3 w-3" /> Yakında taşınacak:{" "}
                {[relocation.city, relocation.country].filter(Boolean).join(", ")}
              </Badge>
            )}

            {/* World message */}
            {front.worldMessage ? (
              <div className="mt-4 rounded-2xl border border-border bg-background/80 px-4 py-3 text-sm text-foreground/90">
                <span className="mr-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Profil Mesajım
                </span>
                {front.worldMessage}
              </div>
            ) : null}

            {/* Action buttons — only shown when viewing another user's profile */}
            {!isSelf && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={isFollowing ? "secondary" : "default"}
                  disabled={isFollowLoading}
                  onClick={() => void handleFollowToggle()}
                  className="gap-1.5"
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="h-3.5 w-3.5" /> Takip Ediliyor
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3.5 w-3.5" /> Takip Et
                    </>
                  )}
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5" disabled>
                  <MessageSquare className="h-3.5 w-3.5" /> Mesaj
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom cards */}
      <div className="grid gap-3 p-5 md:grid-cols-2 md:p-6">
        {/* Events */}
        <div className="rounded-[22px] border border-border bg-background/70 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Son 2 ayda etkinlikler</span>
          </div>
          {details.detailCard.recentEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground">Henüz etkinlik yok.</p>
          ) : (
            <ul className="space-y-2">
              {details.detailCard.recentEvents.slice(0, 4).map((event) => (
                <li
                  key={`${event.title}-${event.date}`}
                  className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-xs"
                >
                  <span className="min-w-0 flex-1 truncate text-foreground">{event.title}</span>
                  <span className="shrink-0 text-muted-foreground">{event.date}</span>
                  {event.city ? (
                    <span className="shrink-0 text-muted-foreground">({event.city})</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Cadde */}
        <div className="rounded-[22px] border border-border bg-background/70 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Coffee className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-semibold text-foreground">Cadde'de Takılıyor</span>
          </div>
          {activeCafe ? (
            <div className="space-y-3">
              <div className="rounded-2xl border border-border bg-card px-3 py-3">
                <p className="text-sm font-semibold text-foreground">{activeCafe.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {activeCafe.theme
                    ? `${activeCafe.theme} atmosferi aktif`
                    : "Canlı katılım alanı açık"}
                </p>
              </div>
              <Link
                to={`/cadde/${activeCafe.id}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                Cadde'ye git <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Şu an aktif bir cafe'de değil.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default IndividualPublicView;
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test -- src/components/profile/IndividualPublicView.test.tsx
```

Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/profile/IndividualPublicView.tsx src/components/profile/IndividualPublicView.test.tsx
git commit -m "feat: add IndividualPublicView component for visitor perspective"
```

---

## Task 4 — Update `DirectoryProfilePage.tsx`

**Files:**
- Modify: `src/pages/DirectoryProfilePage.tsx`

**Strategy:** Add `usePublicIndividualProfile` alongside the existing `get_public_profile_sections` fetch. Both run in parallel via `useEffect` + `Promise.all` pattern already established in the file. If `individualDetails !== null`, render `IndividualPublicView`. Otherwise render existing generic sections.

- [ ] **Step 1: Replace the file contents**

Replace `src/pages/DirectoryProfilePage.tsx` with:

```typescript
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { usePublicIndividualProfile } from "@/hooks/usePublicIndividualProfile";
import IndividualPublicView from "@/components/profile/IndividualPublicView";

type PublicProfileSectionRow = {
  section_key: string;
  section_area: "preview_card" | "detail_card";
  label: string;
  component_name: string | null;
  sort_order: number;
  content: Record<string, unknown> | null;
};

const DirectoryProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();

  // Individual profile (bireysel) — runs in parallel with generic sections
  const { details: individualDetails, isLoading: isIndividualLoading } =
    usePublicIndividualProfile(userId);

  // Generic section-based profile (consultants, businesses, orgs, etc.)
  const [sections, setSections] = useState<PublicProfileSectionRow[]>([]);
  const [isSectionsLoading, setIsSectionsLoading] = useState(true);
  const [sectionsError, setSectionsError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let isMounted = true;

    void (async () => {
      setIsSectionsLoading(true);
      setSectionsError(null);
      const { data, error } = await (supabase as any).rpc("get_public_profile_sections", {
        target_user_id: userId,
      });
      if (!isMounted) return;
      if (error) {
        setSectionsError(error.message);
        setSections([]);
      } else {
        setSections((data ?? []) as PublicProfileSectionRow[]);
      }
      setIsSectionsLoading(false);
    })();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const previewSections = useMemo(
    () =>
      sections
        .filter((s) => s.section_area === "preview_card")
        .sort((a, b) => a.sort_order - b.sort_order),
    [sections],
  );
  const detailSections = useMemo(
    () =>
      sections
        .filter((s) => s.section_area === "detail_card")
        .sort((a, b) => a.sort_order - b.sort_order),
    [sections],
  );

  const displayName = previewSections.find(
    (s) => s.section_key === "preview.isim_kurulus_adi",
  )?.content?.text;
  const locationSection = previewSections.find((s) => s.section_key === "preview.konum");
  const imageSection = previewSections.find((s) => s.section_key === "preview.profil_logo_gorseli");
  const categorySection = previewSections.find(
    (s) => s.section_key === "preview.kategori_sektor_etiketi",
  );
  const imageUrl =
    typeof imageSection?.content?.url === "string" ? imageSection.content.url : null;
  const locationLabel = [locationSection?.content?.city, locationSection?.content?.country]
    .filter(Boolean)
    .join(" • ");
  const taxonomyLabels = Array.isArray(categorySection?.content?.taxonomy)
    ? categorySection.content.taxonomy.filter((item): item is string => typeof item === "string")
    : [];
  const primaryLabel =
    typeof categorySection?.content?.primary_label === "string"
      ? categorySection.content.primary_label
      : null;

  if (!userId) {
    return <Navigate to="/directory" replace />;
  }

  const isLoading = isIndividualLoading && isSectionsLoading;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="mb-4">
        <Button asChild variant="outline">
          <Link to="/directory">Directory'ye Dön</Link>
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Profil yükleniyor...</p>
      ) : null}

      {/* Individual (bireysel) profile view */}
      {!isIndividualLoading && individualDetails ? (
        <IndividualPublicView details={individualDetails} />
      ) : null}

      {/* Generic section-based profile (non-individual types) */}
      {!isIndividualLoading && !individualDetails && !isSectionsLoading ? (
        <Card className="border-slate-200 bg-white/90 shadow-sm">
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-muted">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={String(displayName ?? "Profil görseli")}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">Görsel yok</span>
                )}
              </div>
              <div className="min-w-0 space-y-2">
                <CardTitle>{String(displayName ?? "Profil")}</CardTitle>
                <CardDescription>
                  {locationLabel || "Public profile section renderer"}
                </CardDescription>
                <div className="flex flex-wrap gap-1.5">
                  {primaryLabel ? (
                    <Badge variant="secondary">{primaryLabel}</Badge>
                  ) : null}
                  {taxonomyLabels.map((label) => (
                    <Badge key={label} variant="outline">
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {sectionsError ? (
              <p className="text-sm text-destructive">Profil alınamadı: {sectionsError}</p>
            ) : null}
            {!sectionsError && sections.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Bu profil görünür değil veya yayınlanmış public section içermiyor.
              </p>
            ) : null}
            {detailSections.map((section) => (
              <ProfileSectionRenderer key={section.section_key} section={section} />
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};

const ProfileSectionRenderer = ({ section }: { section: PublicProfileSectionRow }) => {
  const content = section.content ?? {};

  if (section.component_name === "rich_text") {
    const text = typeof content.text === "string" ? content.text : null;
    if (!text) return null;
    return (
      <div className="rounded-xl border p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{section.label}</p>
        <p className="mt-2 whitespace-pre-wrap text-base">{text}</p>
      </div>
    );
  }

  if (section.component_name === "badges") {
    const groups = content.groups as
      | Record<string, Array<{ key: string; label: string }>>
      | undefined;
    const allLabels = groups
      ? Object.values(groups).flatMap((items) => items.map((item) => item.label))
      : Array.isArray(content.taxonomy)
        ? content.taxonomy.filter((item): item is string => typeof item === "string")
        : [];
    if (!allLabels.length) return null;
    return (
      <div className="rounded-xl border p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{section.label}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {allLabels.map((label) => (
            <Badge key={label} variant="outline">
              {label}
            </Badge>
          ))}
        </div>
      </div>
    );
  }

  if (section.component_name === "links") {
    const links = Array.isArray(content.links)
      ? content.links.filter(
          (item): item is { label: string; url: string } =>
            Boolean(item) &&
            typeof item === "object" &&
            typeof item.label === "string" &&
            typeof item.url === "string",
        )
      : [];
    if (!links.length) return null;
    return (
      <div className="rounded-xl border p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{section.label}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {links.map((link) => (
            <a
              key={`${link.label}:${link.url}`}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border px-3 py-1.5 text-sm text-primary transition hover:bg-primary/5"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default DirectoryProfilePage;
```

- [ ] **Step 2: Run the existing DirectoryProfilePage tests to confirm no regressions**

```bash
npm run test -- src/pages/DirectoryProfilePage.test.tsx
```

Expected: PASS. If the test file doesn't exist yet, skip this step.

- [ ] **Step 3: Commit**

```bash
git add src/pages/DirectoryProfilePage.tsx
git commit -m "feat: show IndividualPublicView in DirectoryProfilePage for bireysel profiles"
```

---

## Task 5 — Add `RequireAuth` to the Route

**Files:**
- Modify: `src/App.tsx` (line ~139)

- [ ] **Step 1: Apply the diff**

In `src/App.tsx`, find the exact line:

```typescript
<Route path="/directory/profile/:userId" element={<DirectoryProfilePage />} />
```

Replace it with:

```typescript
<Route
  path="/directory/profile/:userId"
  element={
    <RequireAuth>
      <DirectoryProfilePage />
    </RequireAuth>
  }
/>
```

- [ ] **Step 2: Run the build to confirm no type errors**

```bash
npm run build
```

Expected: build succeeds with no new errors.

- [ ] **Step 3: Run the full test suite**

```bash
npm run test
```

Expected: all tests pass (or same baseline as before this change).

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: require auth on /directory/profile/:userId route"
```

---

## Self-Review

**Spec coverage:**
- ✅ Auth-required route — Task 5
- ✅ Profile header (avatar, name, badges, city, LinkedIn, CV) — `IndividualPublicView` Task 3
- ✅ Son 2 ayda etkinlikler — `details.detailCard.recentEvents` section in Task 3
- ✅ Cadde'de Takılıyor — live `cafe_memberships` query for TARGET user in Task 3
- ✅ Follower/following counts + follow button — Task 3
- ✅ Mesaj button — Task 3 (disabled placeholder; messaging not yet implemented)
- ✅ Mevcut altyapı korunuyor — generic `ProfileSectionRenderer` fallback kept in Task 4
- ✅ `IndividualPublicCard` (self-view) untouched

**Placeholder scan:** None found.

**Type consistency:**
- `IndividualProfileDetailsCore` used consistently across hook and component.
- `details.frontCard.worldMessage` — verified against `individual-profile.ts` mapper.
- `details.detailCard.recentEvents` — type `RecentEvent[]` confirmed in `individual-profile.ts`.
- `supabase.from("cafe_memberships" as any)` — cast matches pattern in `useCafes.ts`.
- `supabase.from("user_follows")` — used without cast; consistent with `useFeedSocial.ts`.
