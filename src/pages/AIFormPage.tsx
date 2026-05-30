import corteqsLogo from "../../newlogo.png";
import ChatBot from "@/components/chat/ChatBot";
import heroNetworkLight from "@/assets/hero-network-light.jpg";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

export default function AIFormPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main id="main">
        <div className="relative mt-8 h-60 overflow-hidden sm:mt-10 sm:h-64 md:mt-12 md:h-72">
          <img src={heroNetworkLight} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/95" />
          <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-2xl px-6 pb-8 pt-12 text-center sm:pb-10 md:pt-16">
            <Link to="/" className="inline-flex justify-center">
              <img src={corteqsLogo} alt="CorteQS Logo" className="mb-5 h-20 w-auto sm:h-24 md:h-28" />
            </Link>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Yapay Zeka Destekli Asistan
              </span>
            </div>
            <h1 className="mb-3 text-2xl font-bold leading-tight text-foreground md:text-4xl">
              Sorularını Sor! <span className="text-accent">Kaydını Bırak!</span>
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
              Aynı sohbet içinde önce CorteQS hakkında bilgi alabilir, hazır olduğunda kayıt akışına geçebilirsin.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3">
              <span className="text-sm text-muted-foreground">
                Sohbet yerine klasik form mu istiyorsun?
              </span>
              <Link
                to="/form"
                className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-background/85 px-4 py-2.5 text-sm font-semibold text-primary shadow-sm transition-all hover:border-primary hover:bg-primary/5"
              >
                Ben Form Dolduracağım
              </Link>
            </div>
          </div>
        </div>
        <ChatBot
          classicFormMode="route"
          classicFormHref="/form"
          classicFormLayout="stacked"
          shellVariant="plain"
          showIntro={false}
        />
      </main>
    </div>
  );
}
