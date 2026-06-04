import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { Link, NavLink, Outlet, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { Check, ChevronDown, CircleHelp, Download, Layers3, Menu, Plus, Share2 } from "lucide-react";
import logo from "../../../newlogo.png";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  adminPanelDocNavItems,
  adminPanelNavItems,
  communityNavItems,
  dataNavItems,
  externalAdminNavItems,
  newMemberSystemNavItems,
  otherActionNavItems,
  otherRecordNavItems,
  primaryAdminNavItems,
  workspaceAdminNavItems,
} from "@/components/admin/admin-navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { userIsAdmin } from "@/lib/admin";
import { advisorProfileSections } from "@/lib/resource-links";

type AdminOutletContext = {
  session: Session;
  onLogout: () => Promise<void>;
};

export function useAdminOutletContext() {
  return useOutletContext<AdminOutletContext>();
}

const linkClass = ({
  isActive,
  variant = "default",
}: {
  isActive: boolean;
  variant?: "default" | "home" | "command-center" | "members";
}) => {
  if (variant === "home") {
    return `rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
      isActive
        ? "bg-[#4285F4] text-white"
        : "bg-[#E8F0FE] text-[#174EA6] hover:bg-[#D2E3FC]"
    }`;
  }

  if (variant === "command-center") {
    return `rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
      isActive
        ? "bg-[#EA4335] text-white"
        : "bg-[#FCE8E6] text-[#C5221F] hover:bg-[#FAD2CF]"
    }`;
  }

  if (variant === "members") {
    return `rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
      isActive
        ? "bg-[#34A853] text-white"
        : "bg-[#E6F4EA] text-[#137333] hover:bg-[#CEEAD6]"
    }`;
  }

  return `rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
  }`;
};

const AdminLayout = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [newMemberMenuOpen, setNewMemberMenuOpen] = useState(false);
  const [communityMenuOpen, setCommunityMenuOpen] = useState(false);
  const [dataMenuOpen, setDataMenuOpen] = useState(false);
  const [advisorMenuOpen, setAdvisorMenuOpen] = useState(false);
  const [adminPanelMenuOpen, setAdminPanelMenuOpen] = useState(false);
  const inactiveNavItems = [
    { to: "/admin/may19/ani", label: "19 Mayıs Anı" },
    { to: "/admin/may19/kelime", label: "19 Mayıs Fikir" },
  ] as const;

  const syncSession = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);
    setAuthenticated(Boolean(nextSession));
    setCheckingAccess(true);

    if (!nextSession?.user) {
      setIsAdmin(false);
      setCheckingAccess(false);
      return;
    }

    try {
      const allowed = await userIsAdmin(nextSession.user.id);
      setIsAdmin(allowed);
    } catch (error) {
      console.error(error);
      setIsAdmin(false);
      toast({
        title: "Admin erişimi doğrulanamadı",
        description: "Yetki kontrolü sırasında bir sorun oluştu.",
        variant: "destructive",
      });
    } finally {
      setCheckingAccess(false);
    }
  }, [toast]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void syncSession(nextSession);
    });

    void supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      void syncSession(initialSession);
    });

    return () => data.subscription.unsubscribe();
  }, [syncSession]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Giriş başarısız", description: error.message, variant: "destructive" });
    }
    setAuthLoading(false);
  };

  const handlePasswordReset = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast({
        title: "E-posta gerekli",
        description: "Sıfırlama bağlantısı için önce e-posta adresinizi girin.",
        variant: "destructive",
      });
      return;
    }

    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetLoading(false);

    if (error) {
      toast({
        title: "Sıfırlama isteği alınamadı",
        description: "Lütfen daha sonra tekrar deneyin.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "İstek alındı",
      description: "Bu e-posta kayıtlıysa sıfırlama bağlantısı gönderilecek.",
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthenticated(false);
    setIsAdmin(false);
    setSession(null);
  };

  const globalActions = useMemo(
    () => [
      {
        label: "Yeni kayıt ekle",
        icon: Plus,
        onClick: () => navigate("/admin/members?action=create-member"),
      },
      {
        label: "Referral oluştur",
        icon: Share2,
        onClick: () => navigate("/admin/referral?action=create"),
      },
      {
        label: "Export / Import",
        icon: Download,
        onClick: () => navigate("/admin/members?action=import-export"),
      },
      {
        label: "Toplu işlem",
        icon: Layers3,
        onClick: () => navigate("/admin/members?action=bulk"),
      },
    ],
    [navigate],
  );

  const advisorMenuActive =
    location.pathname.startsWith("/admin/advisors/") ||
    otherRecordNavItems.some((item) => location.pathname === item.to) ||
    inactiveNavItems.some((item) => location.pathname === item.to);
  const communityMenuActive = communityNavItems.some((item) => location.pathname === item.to);
  const dataMenuActive = dataNavItems.some((item) => location.pathname === item.to);
  const newMemberMenuActive =
    location.pathname.startsWith("/admin/new-member") ||
    location.pathname === "/admin/roller-taslak" ||
    location.pathname === "/admin/members";
  const adminPanelMenuActive = adminPanelNavItems.some((item) => location.pathname === item.to);
  const isRouteActive = (to: string) => location.pathname === to;
  const mobileMainLinks = [
    { to: "/admin/workspace/command-center", label: "CC" },
    { to: "/admin/members", label: "Üye Takibi" },
    { to: "/admin/new-member/guide", label: "Genel Kullanım Kılavuzu" },
    { to: "/admin/new-member/kategori-rol-feature-rehberi", label: "Kategori / Rol / Feature HTML" },
    { to: "/admin/new-member/users-roles", label: "Loginli Kullanıcılar & Roller" },
    { to: "/admin/new-member/roles-features", label: "Roller & Featurelar" },
    { to: "/admin/new-member/attributes", label: "Attribute Yönetimi" },
    { to: "/admin/new-member/profile-sections", label: "Profile Sections" },
    { to: "/admin/new-member/taxonomy", label: "Taxonomy Yönetimi" },
    { to: "/admin/new-member/overrides", label: "Feature Override" },
    { to: "/admin/referral", label: "Ref Kod" },
    { to: "/admin/approvals", label: "Approval Queue" },
    { to: "/admin/audit-logs", label: "Audit Logs" },
    { to: "/admin/surveys", label: "Anketler" },
    { to: "/admin/whatsapp-landings", label: "Topluluklar" },
    { to: "/admin/whatsapp-landings/editors", label: "Topluluk Editörleri" },
    { to: "/admin/whatsapp-landings/guide", label: "Topluluk Kullanma Kılavuzu" },
    { to: "/admin/consulates", label: "Diplomatik Profiller" },
    { to: "/admin/data", label: "Data: Kataloglar" },
    { to: "/admin/cadde", label: "Cadde" },
    { to: "/admin/may19/kelime", label: "19 Mayıs Kelime" },
    { to: "/admin/may19/ani", label: "19 Mayıs Anı" },
    { to: "/admin/muhasebe", label: "Muhasebe" },
    { to: "/admin/marquee", label: "Haber Bandı" },
    { to: "/admin/social-media", label: "Sosyal Medya" },
    { to: "/admin/about", label: "Güncellemeler" },
    { to: "/admin/workspace/resources", label: "Dosyalar ve Linkler" },
    { to: "/admin/workspace/mvp", label: "MVP Listesi" },
  ] as const;
  const headerWorkspaceNavItems = workspaceAdminNavItems.filter((item) => item.key !== "workspace-home");

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Admin Giriş</CardTitle>
            <CardDescription>Kayıtlara erişmek için yetkili hesabınızla giriş yapın.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input type="email" placeholder="E-posta" value={email} onChange={(event) => setEmail(event.target.value)} required />
              <Input
                type="password"
                placeholder="Şifre"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <Button type="submit" disabled={authLoading} className="w-full">
                {authLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
              </Button>
              <button
                type="button"
                onClick={() => void handlePasswordReset()}
                disabled={resetLoading}
                className="w-full text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-60"
              >
                {resetLoading ? "Gönderiliyor..." : "Şifremi unuttum"}
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (checkingAccess) {
    return <div className="flex min-h-screen items-center justify-center bg-background">Yetki kontrol ediliyor...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Bu hesabın admin yetkisi yok</CardTitle>
            <CardDescription>
              Supabase üzerindeki <code>admin_users</code> tablosuna kullanıcı kimliği eklenmeden kayıtlara erişemezsiniz.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              Giriş yapan kullanıcı: <span className="font-medium text-foreground">{session?.user.email}</span>
            </div>
            <Button variant="outline" onClick={handleLogout}>Çıkış Yap</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <a
                href="https://mvp.corteqs.net"
                target="_blank"
                rel="noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background p-1.5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
                aria-label="CorteQS ana siteye git"
              >
                <img src={logo} alt="CorteQS" className="h-full w-full object-contain" />
              </a>
              <h1 className="text-lg font-bold text-foreground">CorteQS Admin</h1>
            </div>
            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" aria-label="Admin menüsünü aç">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[86vw] max-w-sm overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Admin Menü</SheetTitle>
                  </SheetHeader>
                  <div className="mt-5 space-y-2">
                    {mobileMainLinks.map((item) => (
                      <SheetClose asChild key={item.to}>
                        <Link
                          to={item.to}
                          className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                            location.pathname === item.to
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground hover:bg-muted"
                          }`}
                        >
                          {item.label}
                        </Link>
                      </SheetClose>
                    ))}
                    <button
                      type="button"
                      onClick={() => void handleLogout()}
                      className="block w-full rounded-md px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
                    >
                      Çıkış
                    </button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            <nav className="hidden flex-wrap items-center gap-1 lg:flex">
                <div className="flex items-center">
                  <span aria-hidden="true" className="mx-1 h-4 w-px bg-border" />
                  <NavLink
                    to="/admin/workspace/command-center"
                    className={({ isActive }) => linkClass({ isActive, variant: "command-center" })}
                  >
                    CC
                  </NavLink>
                </div>
              <div className="flex items-center">
                <span aria-hidden="true" className="mx-1 h-4 w-px bg-border" />
                <DropdownMenu open={newMemberMenuOpen} onOpenChange={setNewMemberMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <div
                      onMouseEnter={() => setNewMemberMenuOpen(true)}
                      onMouseLeave={() => setNewMemberMenuOpen(false)}
                    >
                      <button
                        type="button"
                        className={`${linkClass({ isActive: newMemberMenuActive, variant: "members" })} inline-flex items-center gap-1`}
                      >
                        Üyeler
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-56"
                    onMouseEnter={() => setNewMemberMenuOpen(true)}
                    onMouseLeave={() => setNewMemberMenuOpen(false)}
                  >
                    {newMemberSystemNavItems.map((item) => {
                      const isActive = isRouteActive(item.to);

                      return (
                        <DropdownMenuItem key={item.to} asChild>
                          <Link to={item.to} className="flex items-center justify-between gap-3">
                            <span>{item.label}</span>
                            {isActive ? <Check className="h-4 w-4 text-primary" /> : null}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
                {primaryAdminNavItems.map((item) => (
                  <div key={item.to} className="flex items-center">
                    <span aria-hidden="true" className="mx-1 h-4 w-px bg-border" />
                    <NavLink to={item.to} className={({ isActive }) => linkClass({ isActive })}>
                      {item.label}
                    </NavLink>
                  </div>
                ))}
              <div className="flex items-center">
                <span aria-hidden="true" className="mx-1 h-4 w-px bg-border" />
                <DropdownMenu open={communityMenuOpen} onOpenChange={setCommunityMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <div
                      onMouseEnter={() => setCommunityMenuOpen(true)}
                      onMouseLeave={() => setCommunityMenuOpen(false)}
                    >
                      <button
                        type="button"
                        className={`${linkClass({ isActive: communityMenuActive, variant: "members" })} inline-flex items-center gap-1`}
                      >
                        Topluluklar
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-56"
                    onMouseEnter={() => setCommunityMenuOpen(true)}
                    onMouseLeave={() => setCommunityMenuOpen(false)}
                  >
                    {communityNavItems.map((item) => {
                      const isActive = location.pathname === item.to;

                      return (
                        <DropdownMenuItem key={item.to} asChild>
                          <Link to={item.to} className="flex items-center justify-between gap-3">
                            <span>{item.label}</span>
                            {isActive ? <Check className="h-4 w-4 text-primary" /> : null}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center">
                <span aria-hidden="true" className="mx-1 h-4 w-px bg-border" />
                <DropdownMenu open={dataMenuOpen} onOpenChange={setDataMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <div
                      onMouseEnter={() => setDataMenuOpen(true)}
                      onMouseLeave={() => setDataMenuOpen(false)}
                    >
                      <button
                        type="button"
                        className={`${linkClass({ isActive: dataMenuActive })} inline-flex items-center gap-1`}
                      >
                        Data
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-56"
                    onMouseEnter={() => setDataMenuOpen(true)}
                    onMouseLeave={() => setDataMenuOpen(false)}
                  >
                    {dataNavItems.map((item) => {
                      const isActive = location.pathname === item.to;

                      return (
                        <DropdownMenuItem key={item.to} asChild>
                          <Link to={item.to} className="flex items-center justify-between gap-3">
                            <span>{item.label}</span>
                            {isActive ? <Check className="h-4 w-4 text-primary" /> : null}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center">
                <span aria-hidden="true" className="mx-1 h-4 w-px bg-border" />
                <DropdownMenu open={advisorMenuOpen} onOpenChange={setAdvisorMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <div
                      onMouseEnter={() => setAdvisorMenuOpen(true)}
                      onMouseLeave={() => setAdvisorMenuOpen(false)}
                    >
                      <button
                        type="button"
                        className={`${linkClass({ isActive: advisorMenuActive })} inline-flex items-center gap-1`}
                      >
                        Diğer Kayıtlar
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-56"
                    onMouseEnter={() => setAdvisorMenuOpen(true)}
                    onMouseLeave={() => setAdvisorMenuOpen(false)}
                  >
                    {otherRecordNavItems.map((item) => {
                      const isActive = location.pathname === item.to;

                      return (
                        <DropdownMenuItem key={item.to} asChild>
                          <Link to={item.to} className="flex items-center justify-between gap-3">
                            <span>{item.label}</span>
                            {isActive ? <Check className="h-4 w-4 text-primary" /> : null}
                          </Link>
                        </DropdownMenuItem>
                        );
                      })}
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Inaktif</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="max-h-[260px] w-56 overflow-y-auto">
                        {inactiveNavItems.map((item) => {
                          const isActive = location.pathname === item.to;

                          return (
                            <DropdownMenuItem key={item.to} asChild>
                              <Link to={item.to} className="flex items-center justify-between gap-3">
                                <span>{item.label}</span>
                                {isActive ? <Check className="h-4 w-4 text-primary" /> : null}
                              </Link>
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Sosyal Link Profilleri</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-56">
                        {advisorProfileSections.map((section) => {
                          const href = `/admin/advisors/${section.key}`;
                          const isActive = location.pathname === href;

                          return (
                            <DropdownMenuItem key={section.key} asChild>
                              <Link to={href} className="flex items-center justify-between gap-3">
                                <span>{section.label}</span>
                                {isActive ? <Check className="h-4 w-4 text-primary" /> : null}
                              </Link>
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center">
                <span aria-hidden="true" className="mx-1 h-4 w-px bg-border" />
                <DropdownMenu open={adminPanelMenuOpen} onOpenChange={setAdminPanelMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <div
                      onMouseEnter={() => setAdminPanelMenuOpen(true)}
                      onMouseLeave={() => setAdminPanelMenuOpen(false)}
                    >
                      <button
                        type="button"
                        className={`${linkClass({ isActive: adminPanelMenuActive })} inline-flex items-center gap-1`}
                      >
                        Dashboard
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="max-h-[70vh] w-72 overflow-y-auto"
                    onMouseEnter={() => setAdminPanelMenuOpen(true)}
                    onMouseLeave={() => setAdminPanelMenuOpen(false)}
                  >
                    {headerWorkspaceNavItems.map((item) => (
                      <DropdownMenuItem key={item.key} asChild>
                        <Link to={item.to} className="flex items-center justify-between gap-3">
                          <span>{item.label}</span>
                          {location.pathname === item.to ? <Check className="h-4 w-4 text-primary" /> : null}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Diğer Dokümanlar</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="max-h-[60vh] w-72 overflow-y-auto">
                        {adminPanelDocNavItems.map((item) => (
                          <DropdownMenuItem key={item.key} asChild>
                            <Link to={item.to} className="flex items-center justify-between gap-3">
                              <span>{item.label}</span>
                              {location.pathname === item.to ? <Check className="h-4 w-4 text-primary" /> : null}
                            </Link>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>Dış Bağlantılar</DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-56">
                        {externalAdminNavItems.map((item) => (
                          <DropdownMenuItem key={item.href} asChild>
                            <a href={item.href} target="_blank" rel="noreferrer" className="flex items-center gap-3">
                              <item.icon className="h-4 w-4" />
                              <span>{item.label}</span>
                            </a>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {location.pathname.startsWith("/admin/referral/sources") && (
                <Link to="/admin/referral" className="rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted">
                  {"<- Referral"}
                </Link>
              )}
              {location.pathname.startsWith("/admin/referral/groups") && (
                <Link to="/admin/referral" className="rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted">
                  {"<- Referral"}
                </Link>
              )}
              {location.pathname.startsWith("/admin/referral/types") && (
                <Link to="/admin/referral" className="rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted">
                  {"<- Referral"}
                </Link>
              )}
              <div className="flex items-center">
                <span aria-hidden="true" className="mx-1 h-4 w-px bg-border" />
                <NavLink to="/admin/help" className={({ isActive }) => linkClass({ isActive })} title="Yardım">
                  <CircleHelp className="h-3.5 w-3.5" />
                </NavLink>
              </div>
              <div className="flex items-center">
                <span aria-hidden="true" className="mx-1 h-4 w-px bg-border" />
                <button onClick={() => void handleLogout()} className={linkClass({ isActive: false })}>
                  Çıkış
                </button>
              </div>
            </nav>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        {location.pathname === "/admin/members" ? (
          <div className="mb-5 flex flex-wrap items-center justify-end gap-2">
            {globalActions.map((action) => (
              <Button key={action.label} variant="outline" size="sm" onClick={action.onClick}>
                <action.icon className="h-4 w-4" />
                {action.label}
              </Button>
            ))}
          </div>
        ) : null}
        {session && <Outlet context={{ session, onLogout: handleLogout }} />}
      </main>
    </div>
  );
};

export default AdminLayout;
