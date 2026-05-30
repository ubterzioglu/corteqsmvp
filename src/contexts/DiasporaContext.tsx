import { createContext, useContext, useState, ReactNode } from "react";
import { allCountries } from "@/data/countryCities";

export type DiasporaKey = "tr" | "in" | "cn" | "ph";

export interface DiasporaOption {
  key: DiasporaKey;
  flag: string;
  label: string;
  nativeLabel: string;
}

export const diasporaOptions: DiasporaOption[] = [
  { key: "tr", flag: "🇹🇷", label: "Türk Diasporası", nativeLabel: "Türkçe" },
  { key: "in", flag: "🇮🇳", label: "Indian Diaspora", nativeLabel: "हिन्दी" },
  { key: "cn", flag: "🇨🇳", label: "Chinese Diaspora", nativeLabel: "中文" },
  { key: "ph", flag: "🇵🇭", label: "Filipino Diaspora", nativeLabel: "Filipino" },
];

export const countryList = allCountries;

export const diasporaTranslations: Record<DiasporaKey, {
  nav: { consultants: string; organizations: string; businesses: string; groups: string; events: string; map: string; profile: string; login: string; signup: string; more: string; dashboard: string; logout: string; media: string; vblogger: string; registerDiaspora: string; registerDiasporaDesc: string; selectDiaspora: string; selectCountry: string; allCountries: string };
  hero: { badge: string; title: string; titleHighlight: string; titleEnd: string; subtitle: string; cta1: string; cta2: string; stat1: string; stat2: string; stat3: string };
}> = {
  tr: {
    nav: { consultants: "Danışmanlar", organizations: "Kuruluşlar", businesses: "İşletmeler", groups: "Chat Grupları", events: "Etkinlikler", map: "Harita", profile: "Kullanıcılar", login: "Giriş Yap", signup: "Kayıt Ol", more: "Daha Fazla", dashboard: "Dashboard", logout: "Çıkış", media: "MEDYA", vblogger: "V/Blogger", registerDiaspora: "Register Diaspora", registerDiasporaDesc: "Request your community", selectDiaspora: "Diaspora Seçin", selectCountry: "Ülke Seçin", allCountries: "Tüm Ülkeler" },
    hero: { badge: "Türk Diaspora Ağı", title: "Gittiğin ülkede ", titleHighlight: "organize bir ağ", titleEnd: " seni bekliyor", subtitle: "Danışmanlar, dernekler, etkinlikler ve AI destekli araçlarla diasporadaki yaşamınızı kolaylaştırın.", cta1: "Hemen Başla", cta2: "Danışman Ol", stat1: "45+ Ülke", stat2: "500+ Danışman", stat3: "200+ Dernek" },
  },
  in: {
    nav: { consultants: "सलाहकार", organizations: "संगठन", businesses: "व्यवसाय", groups: "चैट समूह", events: "कार्यक्रम", map: "नक्शा", profile: "प्रोफ़ाइल", login: "लॉगिन", signup: "साइनअप", more: "और", dashboard: "डैशबोर्ड", logout: "लॉगआउट", media: "मीडिया", vblogger: "V/ब्लॉगर", registerDiaspora: "डायस्पोरा रजिस्टर करें", registerDiasporaDesc: "अपना समुदाय रिक्वेस्ट करें", selectDiaspora: "डायस्पोरा चुनें", selectCountry: "देश चुनें", allCountries: "सभी देश" },
    hero: { badge: "भारतीय डायस्पोरा नेटवर्क", title: "जहाँ भी जाओ, ", titleHighlight: "एक संगठित नेटवर्क", titleEnd: " तुम्हारा इंतज़ार कर रहा है", subtitle: "सलाहकार, संगठन, कार्यक्रम और AI-संचालित उपकरणों के साथ प्रवासी जीवन को आसान बनाएं।", cta1: "शुरू करें", cta2: "सलाहकार बनें", stat1: "45+ देश", stat2: "500+ सलाहकार", stat3: "200+ संगठन" },
  },
  cn: {
    nav: { consultants: "顾问", organizations: "组织", businesses: "商家", groups: "聊天群", events: "活动", map: "地图", profile: "我的", login: "登录", signup: "注册", more: "更多", dashboard: "控制台", logout: "退出", media: "媒体", vblogger: "V/博主", registerDiaspora: "注册社群", registerDiasporaDesc: "请求您的社群", selectDiaspora: "选择社群", selectCountry: "选择国家", allCountries: "所有国家" },
    hero: { badge: "华人海外网络", title: "无论你去哪个国家,", titleHighlight: "一个有组织的网络", titleEnd: "正在等待你", subtitle: "通过顾问、社团、活动和AI工具,让海外生活更轻松。", cta1: "立即开始", cta2: "成为顾问", stat1: "45+ 国家", stat2: "500+ 顾问", stat3: "200+ 社团" },
  },
  ph: {
    nav: { consultants: "Consultants", organizations: "Organisasyon", businesses: "Negosyo", groups: "Chat Groups", events: "Mga Event", map: "Mapa", profile: "Profile", login: "Login", signup: "Sign Up", more: "Higit Pa", dashboard: "Dashboard", logout: "Mag-logout", media: "Midya", vblogger: "V/Blogger", registerDiaspora: "Magparehistro ng Diaspora", registerDiasporaDesc: "Hilingin ang iyong komunidad", selectDiaspora: "Pumili ng Diaspora", selectCountry: "Pumili ng Bansa", allCountries: "Lahat ng Bansa" },
    hero: { badge: "Filipino Diaspora Network", title: "Saan ka man pumunta, ", titleHighlight: "isang organisadong network", titleEnd: " ang naghihintay sa iyo", subtitle: "Gawing mas madali ang buhay sa ibang bansa gamit ang mga consultant, organisasyon, event at AI tools.", cta1: "Magsimula", cta2: "Maging Consultant", stat1: "45+ Bansa", stat2: "500+ Consultant", stat3: "200+ Organisasyon" },
  },
};

interface DiasporaContextType {
  diaspora: DiasporaKey;
  setDiaspora: (key: DiasporaKey) => void;
  t: typeof diasporaTranslations["tr"];
  currentOption: DiasporaOption;
  selectedCountry: string;
  setSelectedCountry: (country: string) => void;
}

const DiasporaContext = createContext<DiasporaContextType | undefined>(undefined);

export const DiasporaProvider = ({ children }: { children: ReactNode }) => {
  const [diaspora, setDiaspora] = useState<DiasporaKey>("tr");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const t = diasporaTranslations[diaspora];
  const currentOption = diasporaOptions.find((o) => o.key === diaspora)!;

  return (
    <DiasporaContext.Provider value={{ diaspora, setDiaspora, t, currentOption, selectedCountry, setSelectedCountry }}>
      {children}
    </DiasporaContext.Provider>
  );
};

export const useDiaspora = () => {
  const ctx = useContext(DiasporaContext);
  if (!ctx) throw new Error("useDiaspora must be used within DiasporaProvider");
  return ctx;
};
