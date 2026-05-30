import { Globe, Flag, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { diasporaOptions } from "@/contexts/DiasporaContext";
import corteqsLogo from "@/assets/corteqs-logo.png";
import ContactDialog from "@/components/ContactDialog";

const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-xs">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <img src={corteqsLogo} alt="CorteQS" className="w-auto h-[3.75rem]" />
            </div>
            <p className="text-xs text-secondary-foreground/60 font-body leading-snug">
              Türk diasporasını birleştiren global platform.
            </p>
            <div className="flex gap-1.5 mt-2">
              {diasporaOptions.map((opt) => (
                <span key={opt.key} className="text-sm" title={opt.label}>{opt.flag}</span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-2 text-[11px] uppercase tracking-wider">Platform</h4>
            <ul className="space-y-1 text-xs text-secondary-foreground/60 font-body">
              <li><Link to="/consultants" className="hover:text-primary transition-colors">Danışmanlar</Link></li>
              <li><Link to="/associations" className="hover:text-primary transition-colors">Kuruluşlar</Link></li>
              <li><Link to="/businesses" className="hover:text-primary transition-colors">İşletmeler</Link></li>
              <li><Link to="/bloggers" className="hover:text-primary transition-colors">Blogger / Vlogger / YouTuber</Link></li>
              <li><Link to="/events" className="hover:text-primary transition-colors">Etkinlikler</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-2 text-[11px] uppercase tracking-wider">Topluluk</h4>
            <ul className="space-y-1 text-xs text-secondary-foreground/60 font-body">
              <li>
                <Link to="/city-ambassadors" className="hover:text-primary transition-colors flex items-center gap-1.5">
                  <Flag className="h-3.5 w-3.5" />Şehir Elçisi Ol
                </Link>
              </li>
              <li><Link to="/whatsapp-groups" className="hover:text-primary transition-colors">WhatsApp Grupları</Link></li>
              <li><Link to="/blog-contest" className="hover:text-primary transition-colors">Blog Yarışması</Link></li>
              <li><Link to="/map" className="hover:text-primary transition-colors">Harita</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-2 text-[11px] uppercase tracking-wider">Kurumsal</h4>
            <ul className="space-y-1 text-xs text-secondary-foreground/60 font-body">
              <li><a href="#" className="hover:text-primary transition-colors">Hakkımızda</a></li>
              <li><Link to="/pricing" className="hover:text-primary transition-colors">Fiyatlandırma</Link></li>
              <li><Link to="/founders-1000" className="hover:text-primary transition-colors">Founding 1000</Link></li>
              <li>
                <ContactDialog
                  trigger={<button className="hover:text-primary transition-colors text-left">İletişim</button>}
                />
              </li>
              <li><Link to="/kariyer" className="hover:text-primary transition-colors">Kariyer</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-2 text-[11px] uppercase tracking-wider">Yasal</h4>
            <ul className="space-y-1 text-xs text-secondary-foreground/60 font-body">
              <li><Link to="/legal/privacy" className="hover:text-primary transition-colors">Gizlilik Politikası</Link></li>
              <li><Link to="/legal/terms" className="hover:text-primary transition-colors">Kullanım Şartları</Link></li>
              <li><Link to="/legal/kvkk" className="hover:text-primary transition-colors">KVKK / GDPR / CCPA</Link></li>
              <li><Link to="/legal/cookies" className="hover:text-primary transition-colors">Çerez Politikası</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/10 mt-6 pt-4 text-center text-xs text-secondary-foreground/40 font-body space-y-1.5">
          <div>© 2026 CorteQS. Tüm hakları saklıdır.</div>
          <div>
            A{" "}
            <a
              href="https://www.qualtronsinclair.com/qs-networks"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-secondary-foreground/70 hover:text-primary transition-colors font-medium"
            >
              Qualtron Sinclair / UBT Venture
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
