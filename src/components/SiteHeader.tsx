import { Link } from "react-router-dom";
import logo from "../../newlogo.png";

export default function SiteHeader() {
  return (
    <div className="sticky top-0 z-50 border-b border-orange-100/90 bg-[linear-gradient(180deg,#fffdf9_0%,#fff8f0_100%)] backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3 lg:px-6">
        <div className="flex flex-col items-center gap-4 md:flex-row md:flex-wrap md:items-center md:justify-between">
          <Link
            to="/"
            className="inline-flex w-full shrink-0 items-center justify-center gap-3 text-center transition-transform duration-200 hover:-translate-y-0.5 md:w-fit md:justify-start md:text-left"
          >
            <div className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-white shadow-[0_14px_30px_rgba(15,23,42,0.16)] ring-1 ring-slate-100">
              <img
                src={logo}
                alt="CorteQS"
                className="h-[50px] w-[50px] rounded-full object-contain"
              />
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="text-[1.35rem] font-black tracking-[0.22em] text-slate-900 sm:text-[1.55rem]">
                CorteQS
              </div>
              <span
                aria-hidden="true"
                className="h-8 w-px bg-slate-300/85"
              />
              <div className="max-w-[11rem] text-[1rem] font-semibold tracking-[0.02em] text-slate-800 sm:max-w-none sm:text-[1.05rem]">
                Global Türk Diaspora Network
              </div>
            </div>
          </Link>

          <div className="min-w-0 w-full md:flex-1">
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center md:justify-end md:text-right">
              <p className="text-sm font-semibold tracking-[0.03em] text-slate-800 sm:text-base">
                Türk Diasporasını Birleştiren Platform
              </p>
              <span
                aria-hidden="true"
                className="hidden h-5 w-px bg-slate-300/80 sm:block"
              />
              <Link
                to="/founders"
                onClick={() => window.scrollTo({ top: 0, behavior: "auto" })}
                className="text-sm font-semibold text-primary transition-colors hover:text-accent sm:text-base"
              >
                Biz kimiz?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
