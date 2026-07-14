import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, X } from "lucide-react";
import { useAuth } from "@/components/auth/useAuth";
import { listTools } from "@/lib/relocation-tools-api";
import { relocationToolsKeys } from "@/lib/relocation-tools-query-keys";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
const logo = "/newlogo.png";

// Mobilde tam başlık yerine kısa etiket gösterir ("Soru? — Kısa Ad" → "Kısa Ad").
function mobileToolLabel(titleTr: string): string {
  const parts = titleTr.split("—");
  return parts.length > 1 ? parts[parts.length - 1].trim() : titleTr;
}

export default function SiteHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);
  const toolsQuery = useQuery({
    queryKey: relocationToolsKeys.list(),
    queryFn: listTools,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="sticky top-0 z-50 border-b border-slate-200/80 bg-white backdrop-blur-sm">
      <div className="border-b border-amber-300/50 bg-white px-4 py-1.5 shadow-[inset_0_-1px_0_rgba(217,119,6,0.12)] sm:py-2">
        <p className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-[0.74rem] leading-snug text-slate-700 sm:text-[0.82rem]">
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-400/15 px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-amber-700">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
            </span>
            Açık Beta
          </span>
          <span>
            <span className="font-semibold text-slate-900">CorteQS açık beta yayında!</span>{" "}
            {/* Uzun açıklama mobilde gizli — bandın yüksekliğini düşük tutar */}
            <span className="hidden sm:inline">
              Platformu deneyebilir, görüş ve önerilerinizle gelişim sürecimize katkı
              sağlayabilirsiniz.
            </span>
          </span>
        </p>
      </div>
      {/* Yeni üst bar — beta uyarısının altında, eski header'ın üstünde; Profilim + Çıkış (sağ üst), beyaz zemin */}
      <div className="border-b border-slate-200/80 bg-white px-4 py-1.5">
        <div className="container mx-auto flex items-center justify-end gap-x-4 lg:px-6">
          {user ? (
            <>
              {/* Feedback Ver — geldiği sayfa state.from ile /feedback'e taşınır (page_path). */}
              <Link
                to="/feedback"
                state={{ from: `${location.pathname}${location.search}` }}
                className="text-sm font-semibold text-[#ee652b] transition-colors hover:text-[#d95520]"
              >
                Feedback Ver
              </Link>
              <span aria-hidden="true" className="h-4 w-px bg-slate-300/80" />
              <Link
                to="/profile"
                className="text-sm font-semibold text-[#34A853] transition-colors hover:text-[#2F9B4D]"
              >
                Profilim
              </Link>
              <span aria-hidden="true" className="h-4 w-px bg-slate-300/80" />
              <button
                type="button"
                onClick={handleSignOut}
                className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
              >
                Çıkış
              </button>
            </>
          ) : (
            <>
              {/* Masaüstü: mevcut popover dropdown (sm+) */}
              <DropdownMenu>
                <DropdownMenuTrigger className="hidden items-center gap-1 text-sm font-semibold text-[#1E3A8A] outline-none transition-colors hover:text-[#152c69] sm:inline-flex">
                  Araçlar
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="flex max-h-[75vh] w-[42rem] max-w-[90vw] flex-col overflow-hidden rounded-xl border-slate-200/80 p-2 shadow-xl"
                >
                  <div className="grid flex-1 grid-cols-2 gap-x-2 overflow-y-auto">
                    {toolsQuery.isLoading && (
                      <DropdownMenuItem disabled className="col-span-2 rounded-lg px-3 py-2.5">
                        Yükleniyor...
                      </DropdownMenuItem>
                    )}
                    {!toolsQuery.isLoading && (toolsQuery.data?.length ?? 0) === 0 && (
                      <DropdownMenuItem disabled className="col-span-2 rounded-lg px-3 py-2.5">
                        Henüz aktif araç yok
                      </DropdownMenuItem>
                    )}
                    {toolsQuery.data?.map((tool) => (
                      <DropdownMenuItem
                        key={tool.key}
                        asChild
                        className="rounded-lg border-b border-slate-100 px-3 py-2.5 last:border-b-0 focus:bg-slate-100"
                      >
                        <Link
                          to={`/tools/${tool.slug}`}
                          className="whitespace-normal text-sm font-medium leading-snug text-slate-800"
                        >
                          {tool.title_tr}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </div>
                  <DropdownMenuSeparator className="my-1 bg-slate-200" />
                  <DropdownMenuItem asChild className="rounded-lg px-3 py-2.5 focus:bg-slate-100">
                    <Link to="/tools" className="text-sm font-semibold text-[#1E3A8A]">
                      Tüm Araçları Gör
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobil: tam genişlik aç/kapa panel */}
              <button
                type="button"
                onClick={() => setIsMobileToolsOpen(true)}
                aria-expanded={isMobileToolsOpen}
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#1E3A8A] outline-none transition-colors hover:text-[#152c69] sm:hidden"
              >
                Araçlar
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <span aria-hidden="true" className="h-4 w-px bg-slate-300/80" />
              <Link
                to="/login?mode=login"
                className="text-sm font-semibold text-[#34A853] transition-colors hover:text-[#2F9B4D]"
              >
                Giriş Yap
              </Link>
              <span aria-hidden="true" className="h-4 w-px bg-slate-300/80" />
              <Link
                to="/login?mode=signup"
                className="text-sm font-semibold text-[#ee652b] transition-colors hover:text-[#d95520]"
              >
                Kayıt Ol
              </Link>
            </>
          )}
        </div>
      </div>
      <div className="container mx-auto px-4 py-2.5 lg:px-6 lg:py-3">
        <div className="flex flex-col items-center gap-3 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-4">
          <Link
            to="/"
            className="inline-flex w-full shrink-0 items-center justify-center gap-2.5 text-center transition-transform duration-200 hover:-translate-y-0.5 md:w-fit md:justify-start md:gap-3 md:text-left"
          >
            <div className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-white shadow-[0_14px_30px_rgba(15,23,42,0.16)] ring-1 ring-slate-100 sm:h-[58px] sm:w-[58px]">
              <img
                src={logo}
                alt="CorteQS"
                className="h-[40px] w-[40px] rounded-full object-contain sm:h-[50px] sm:w-[50px]"
              />
            </div>
            <div className="flex items-center gap-2 text-left sm:gap-3">
              <div className="text-[1.2rem] font-black tracking-[0.22em] text-slate-900 sm:text-[1.55rem]">
                CorteQS
              </div>
              {/* Ayraç + alt başlık mobilde gizli — kompakt sticky header */}
              <span
                aria-hidden="true"
                className="hidden h-8 w-px bg-slate-300/85 sm:block"
              />
              <div className="hidden max-w-[16rem] items-center gap-2 text-[1rem] font-semibold tracking-[0.02em] text-slate-800 sm:flex sm:max-w-none sm:text-[1.05rem]">
                <span>Global Türk Diaspora Network</span>
              </div>
            </div>
          </Link>

          <div className="min-w-0 w-full md:flex-1">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 text-center md:justify-end md:text-right">
              {/* Uzun slogan mobilde gizli — yalnızca sm+ ekranlarda */}
              <p className="hidden text-sm font-semibold tracking-[0.03em] text-slate-800 sm:block sm:text-base">
                Dünyadaki Türkleri Bir Araya Getiren Platform
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobil Araçlar paneli: tam ekran aç/kapa, kısa etiketler */}
      {isMobileToolsOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-white sm:hidden">
          <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3">
            <span className="text-base font-bold text-slate-900">Araçlar</span>
            <button
              type="button"
              onClick={() => setIsMobileToolsOpen(false)}
              aria-label="Kapat"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {toolsQuery.isLoading && (
              <p className="px-3 py-2.5 text-sm text-slate-500">Yükleniyor...</p>
            )}
            {!toolsQuery.isLoading && (toolsQuery.data?.length ?? 0) === 0 && (
              <p className="px-3 py-2.5 text-sm text-slate-500">Henüz aktif araç yok</p>
            )}
            {toolsQuery.data?.map((tool, index) => (
              <div key={tool.key}>
                <Link
                  to={`/tools/${tool.slug}`}
                  onClick={() => setIsMobileToolsOpen(false)}
                  className="block rounded-lg px-3 py-3 text-sm font-medium text-slate-800 transition-colors active:bg-slate-100"
                >
                  {mobileToolLabel(tool.title_tr)}
                </Link>
                {index < (toolsQuery.data?.length ?? 0) - 1 && (
                  <div className="mx-3 h-px bg-slate-100" />
                )}
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200/80 px-4 py-3">
            <Link
              to="/tools"
              onClick={() => setIsMobileToolsOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-center text-sm font-semibold text-[#1E3A8A]"
            >
              Tüm Araçları Gör
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
