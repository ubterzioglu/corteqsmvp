// AuthProvider KARAKTERIZASYON testi (A04a).
//
// Amac: AuthProvider'in BUGUNKU davranisini kilitlemek. A04b'de iki dogrudan
// Supabase sorgusu (`user_profile_attributes` ve `user_role_assignments`)
// `src/lib/auth-api.ts` katmanina tasinacak; bu dosya tasimanin davranisi
// degistirmedigini kanitlar. Mock Supabase ISTEMCISINE kuruludur, provider'in
// ic yapisina degil — bu yuzden sorgular bir API modulune tasindiginda testler
// aynen gecmelidir. Gecmiyorsa davranis degismis demektir.
//
// Kilitlenen sozlesme (CLAUDE.md "Authentication & Roles"):
//   session · user · isLoading · profile · accountType · onboardingCompleted ·
//   signOut · refreshProfile
// `loading` diye bir alan YOKTUR. Silinen eski shim'in kattigi tek sey buydu;
// geri gelmesi sessizce yanlis "yukleniyor" durumlari uretir.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

type QueryCall = {
  table: string;
  select?: string;
  eqColumn?: string;
  eqValue?: string;
  inColumn?: string;
  inValues?: readonly string[];
  maybeSingle?: boolean;
};

const {
  fromMock,
  getSessionMock,
  onAuthStateChangeMock,
  signOutMock,
  unsubscribeMock,
  queryCalls,
  responses,
} = vi.hoisted(() => ({
  fromMock: vi.fn(),
  getSessionMock: vi.fn(),
  onAuthStateChangeMock: vi.fn(),
  signOutMock: vi.fn(),
  unsubscribeMock: vi.fn(),
  queryCalls: [] as QueryCall[],
  responses: {
    attributes: { data: [] as unknown[] },
    role: { data: null as unknown },
  },
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: getSessionMock,
      onAuthStateChange: onAuthStateChangeMock,
      signOut: signOutMock,
    },
    from: fromMock,
  },
}));

import { AuthProvider } from "@/components/auth/AuthProvider";
import { useAuth } from "@/components/auth/useAuth";

/** Sozlesme yuzeyini ve turetilmis alanlari ekrana doken sonda bilesen. */
const AuthProbe = () => {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="keys">{Object.keys(auth).sort().join(",")}</span>
      <span data-testid="isLoading">{String(auth.isLoading)}</span>
      <span data-testid="hasUser">{String(Boolean(auth.user))}</span>
      <span data-testid="accountType">{String(auth.accountType)}</span>
      <span data-testid="onboarding">{String(auth.onboardingCompleted)}</span>
      <span data-testid="fullName">{String(auth.profile?.full_name ?? null)}</span>
      <span data-testid="avatar">{String(auth.profile?.avatar_url ?? null)}</span>
      <span data-testid="phone">{String(auth.profile?.phone ?? null)}</span>
      <button type="button" onClick={() => void auth.signOut()}>
        cikis
      </button>
    </div>
  );
};

const SESSION = {
  user: { id: "user-1" },
} as never;

const attributeRow = (key: string, value: string | null) => ({
  value_text: value,
  afs_attributes: { key },
});

const renderProvider = () =>
  render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  queryCalls.length = 0;
  responses.attributes = { data: [] };
  responses.role = { data: null };

  onAuthStateChangeMock.mockReturnValue({
    data: { subscription: { unsubscribe: unsubscribeMock } },
  });
  getSessionMock.mockResolvedValue({ data: { session: null } });
  signOutMock.mockResolvedValue({ error: null });

  fromMock.mockImplementation((table: string) => {
    const call: QueryCall = { table };
    queryCalls.push(call);

    const builder = {
      select: (columns: string) => {
        call.select = columns;
        return builder;
      },
      eq: (column: string, value: string) => {
        call.eqColumn = column;
        call.eqValue = value;
        return builder;
      },
      in: (column: string, values: readonly string[]) => {
        call.inColumn = column;
        call.inValues = values;
        return Promise.resolve(responses.attributes);
      },
      maybeSingle: () => {
        call.maybeSingle = true;
        return Promise.resolve(responses.role);
      },
    };

    return builder;
  });
});

describe("AuthProvider — sozlesme yuzeyi", () => {
  it("tam olarak sekiz alan sunar ve `loading` alani YOKTUR", async () => {
    renderProvider();

    await waitFor(() => expect(screen.getByTestId("isLoading")).toHaveTextContent("false"));

    expect(screen.getByTestId("keys")).toHaveTextContent(
      "accountType,isLoading,onboardingCompleted,profile,refreshProfile,session,signOut,user",
    );
  });

  it("baslangicta isLoading true, oturum cozulunce false olur", async () => {
    let resolveSession: (value: { data: { session: null } }) => void = () => {};
    getSessionMock.mockReturnValue(
      new Promise<{ data: { session: null } }>((resolve) => {
        resolveSession = resolve;
      }),
    );

    renderProvider();
    expect(screen.getByTestId("isLoading")).toHaveTextContent("true");

    resolveSession({ data: { session: null } });
    await waitFor(() => expect(screen.getByTestId("isLoading")).toHaveTextContent("false"));
  });
});

describe("AuthProvider — oturum yokken", () => {
  it("profil bos kalir ve hicbir tablo sorgulanmaz", async () => {
    renderProvider();

    await waitFor(() => expect(screen.getByTestId("isLoading")).toHaveTextContent("false"));

    expect(screen.getByTestId("hasUser")).toHaveTextContent("false");
    expect(screen.getByTestId("accountType")).toHaveTextContent("null");
    expect(screen.getByTestId("onboarding")).toHaveTextContent("false");
    expect(queryCalls).toHaveLength(0);
  });
});

describe("AuthProvider — oturum varken profil kurulumu", () => {
  beforeEach(() => {
    getSessionMock.mockResolvedValue({ data: { session: SESSION } });
    responses.attributes = {
      data: [
        attributeRow("full_name", "Ayse Yilmaz"),
        attributeRow("avatar_url", "https://example.test/a.png"),
        attributeRow("phone", "+905551112233"),
      ],
    };
    responses.role = { data: { roles: { key: "User_DiasporaMember" } } };
  });

  it("iki tabloyu da dogru sutun ve anahtarlarla okur", async () => {
    renderProvider();

    await waitFor(() => expect(queryCalls).toHaveLength(2));

    const attrs = queryCalls.find((call) => call.table === "user_profile_attributes");
    expect(attrs).toBeDefined();
    expect(attrs?.select).toBe("value_text, afs_attributes!inner(key)");
    expect(attrs?.eqColumn).toBe("user_id");
    expect(attrs?.eqValue).toBe("user-1");
    // Join'li filtre: nokta notasyonu bozulursa profil sessizce bos doner.
    expect(attrs?.inColumn).toBe("afs_attributes.key");
    expect(attrs?.inValues).toEqual(["full_name", "avatar_url", "phone"]);

    const role = queryCalls.find((call) => call.table === "user_role_assignments");
    expect(role).toBeDefined();
    expect(role?.select).toBe("roles!inner(key)");
    expect(role?.eqColumn).toBe("user_id");
    expect(role?.eqValue).toBe("user-1");
    // Kullanici basina TEK rol vardir (user_role_assignments PK'si user_id).
    expect(role?.maybeSingle).toBe(true);
  });

  it("nitelikleri profile esler ve rolu accountType yapar", async () => {
    renderProvider();

    await waitFor(() => expect(screen.getByTestId("fullName")).toHaveTextContent("Ayse Yilmaz"));

    expect(screen.getByTestId("avatar")).toHaveTextContent("https://example.test/a.png");
    expect(screen.getByTestId("phone")).toHaveTextContent("+905551112233");
    expect(screen.getByTestId("accountType")).toHaveTextContent("User_DiasporaMember");
  });

  it("onboardingCompleted DOGRUDAN full_name varligindan turer", async () => {
    renderProvider();
    await waitFor(() => expect(screen.getByTestId("onboarding")).toHaveTextContent("true"));
  });

  it("full_name bossa onboardingCompleted false kalir", async () => {
    responses.attributes = { data: [attributeRow("phone", "+905551112233")] };

    renderProvider();

    await waitFor(() => expect(screen.getByTestId("phone")).toHaveTextContent("+905551112233"));
    expect(screen.getByTestId("onboarding")).toHaveTextContent("false");
    expect(screen.getByTestId("fullName")).toHaveTextContent("null");
  });

  it("rol satiri yoksa accountType null olur ama profil yine kurulur", async () => {
    responses.role = { data: null };

    renderProvider();

    await waitFor(() => expect(screen.getByTestId("fullName")).toHaveTextContent("Ayse Yilmaz"));
    expect(screen.getByTestId("accountType")).toHaveTextContent("null");
  });
});

describe("AuthProvider — cikis ve abonelik", () => {
  it("signOut Supabase'i cagirir ve profili temizler", async () => {
    getSessionMock.mockResolvedValue({ data: { session: SESSION } });
    responses.attributes = { data: [attributeRow("full_name", "Ayse Yilmaz")] };
    responses.role = { data: { roles: { key: "User_DiasporaMember" } } };

    renderProvider();
    await waitFor(() => expect(screen.getByTestId("fullName")).toHaveTextContent("Ayse Yilmaz"));

    await userEvent.click(screen.getByRole("button", { name: "cikis" }));

    expect(signOutMock).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByTestId("fullName")).toHaveTextContent("null"));
    expect(screen.getByTestId("accountType")).toHaveTextContent("null");
  });

  it("auth durum aboneligini kurar ve unmount'ta birakir", async () => {
    const { unmount } = renderProvider();

    await waitFor(() => expect(screen.getByTestId("isLoading")).toHaveTextContent("false"));
    expect(onAuthStateChangeMock).toHaveBeenCalledTimes(1);

    unmount();
    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
  });
});
