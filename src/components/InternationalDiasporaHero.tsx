import { useState } from "react";
import { Globe, Sparkles, Rocket, Handshake, FileText, Users, Briefcase, Building2, HeartHandshake, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useDiaspora, type DiasporaKey } from "@/contexts/DiasporaContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, X, CheckCircle2 } from "lucide-react";
import multiculturalHero from "@/assets/multicultural-diaspora-hero.jpg";

type Copy = {
  badge: string;
  title: string;
  highlight: string;
  tagline: string;
  subtitle: string;
  // Two value sections
  oneRoofTitle: string;
  oneRoofBody: string;
  oneRoofPills: string[];
  solidarityTitle: string;
  solidarityBody: string;
  solidarityPills: string[];
  formTitle: string;
  formIntro: string;
  cta1: string;
  cta2: string;
  interestLabel: string;
  options: { value: string; label: string }[];
  uploadHint: string;
  submit: string;
  success: string;
  thanks: string;
  groupedNote: string;
  // form labels
  fullName: string;
  email: string;
  phone: string;
  phonePlaceholder: string;
  country: string;
  city: string;
  organization: string;
  links: string;
  message: string;
  documents: string;
  selectedIntent: string;
  required: string;
  maxFiles: string;
  fileTooLarge: string;
  somethingWrong: string;
  langCode: DiasporaKey;
};

const COPY: Record<Exclude<DiasporaKey, "tr">, Copy> = {
  in: {
    badge: "भारतीय डायस्पोरा — इन्फ्रास्ट्रक्चर मांग सक्रिय",
    title: "हमें ज़बरदस्त मांग मिल रही है ",
    highlight: "भारतीय वैश्विक डायस्पोरा से",
    subtitle:
      "एक छत के नीचे — आपके डायस्पोरा के सलाहकार, व्यवसाय और संगठन। एक सामाजिक और आर्थिक एकजुटता इंजन।",
    tagline: "एक डायस्पोरा। एक मंच। एक एकजुटता इंजन।",
    oneRoofTitle: "एक छत के नीचे आपका पूरा डायस्पोरा",
    oneRoofBody:
      "सलाहकार, व्यवसाय, संगठन, स्कूल, इवेंट्स और WhatsApp समुदाय — सब कुछ एक ही जगह, सत्यापित और खोजने योग्य।",
    oneRoofPills: ["सलाहकार", "व्यवसाय", "संगठन", "इवेंट्स", "WhatsApp"],
    solidarityTitle: "सामाजिक + आर्थिक एकजुटता इंजन",
    solidarityBody:
      "सहायता पाएं, ग्राहक खोजें, साझेदार खोजें, स्थानीय रूप से खर्च करें — डायस्पोरा को मजबूत करें और एक-दूसरे की मदद करें।",
    solidarityPills: ["रेफरल", "B2B", "मेंटरशिप", "रिलोकेशन", "निवेश"],
    formTitle: "भारतीय डायस्पोरा — अर्ली एक्सेस रजिस्ट्रेशन",
    formIntro:
      "अपने दस्तावेज़, डेक या LinkedIn लिंक अपलोड करें। बताएं कि आप निवेश व साझेदारी के लिए हैं या सामान्य पहुँच के लिए।",
    cta1: "निवेश व साझेदारी",
    cta2: "सामान्य रजिस्ट्रेशन",
    interestLabel: "आप क्यों जुड़ रहे हैं?",
    options: [
      { value: "investment_partnership", label: "निवेश व साझेदारी" },
      { value: "founder_startup", label: "संस्थापक / स्टार्टअप" },
      { value: "professional", label: "पेशेवर / नौकरी की तलाश" },
      { value: "student", label: "छात्र" },
      { value: "general", label: "सामान्य रजिस्ट्रेशन" },
    ],
    uploadHint: "डेक / CV / वन-पेजर अपलोड करें (PDF, PPTX, DOCX — अधिकतम 10MB)",
    submit: "रजिस्ट्रेशन पूरा करें",
    success: "रजिस्ट्रेशन प्राप्त हुआ। हम जल्द ही आपसे संपर्क करेंगे।",
    thanks: "धन्यवाद!",
    groupedNote: "रजिस्ट्रेशन देश व डायस्पोरा अनुसार वर्गीकृत हैं",
    fullName: "पूरा नाम *",
    email: "ईमेल *",
    phone: "फ़ोन (देश कोड के साथ)",
    phonePlaceholder: "+91 ...",
    country: "देश",
    city: "शहर",
    organization: "कंपनी / संगठन (वैकल्पिक)",
    links: "लिंक (LinkedIn, वेबसाइट, डेक URL)",
    message: "संदेश / आप क्या ढूंढ रहे हैं",
    documents: "दस्तावेज़",
    selectedIntent: "चयनित उद्देश्य:",
    required: "नाम और ईमेल आवश्यक हैं",
    maxFiles: "अधिकतम 5 फ़ाइलें",
    fileTooLarge: "फ़ाइल बहुत बड़ी है",
    somethingWrong: "कुछ गलत हो गया",
    langCode: "in",
  },
  cn: {
    badge: "华人海外社群 — 基础设施需求上线",
    title: "我们看到了来自 ",
    highlight: "全球华人海外社群的强劲需求",
    subtitle:
      "同一个屋檐下 — 您所在海外社群的顾问、企业与组织,一个社会与经济互助引擎。",
    tagline: "一个社群。一个平台。一个互助引擎。",
    oneRoofTitle: "海外社群的一切尽在一处",
    oneRoofBody:
      "顾问、企业、组织、学校、活动与微信/WhatsApp 社群 — 全部经过认证、可搜索、汇聚一处。",
    oneRoofPills: ["顾问", "企业", "组织", "活动", "群组"],
    solidarityTitle: "社会 + 经济互助引擎",
    solidarityBody:
      "获得帮助、寻找客户、寻找合伙人、本地消费 — 强化海外社群,互相支持。",
    solidarityPills: ["推荐", "B2B", "导师", "搬迁", "投资"],
    formTitle: "华人海外社群 — 早期访问注册",
    formIntro:
      "上传您的资料、商业计划书或 CV。请告诉我们您是为投资合作还是一般注册而来。",
    cta1: "投资与合作",
    cta2: "一般注册",
    interestLabel: "您为什么加入?",
    options: [
      { value: "investment_partnership", label: "投资与合作" },
      { value: "founder_startup", label: "创始人 / 创业公司" },
      { value: "professional", label: "专业人士 / 求职者" },
      { value: "student", label: "学生" },
      { value: "general", label: "一般注册" },
    ],
    uploadHint: "上传商业计划书 / CV / 简介 (PDF, PPTX, DOCX — 最大 10MB)",
    submit: "完成注册",
    success: "已收到您的注册,我们会尽快与您联系。",
    thanks: "谢谢!",
    groupedNote: "注册按国家与社群分组",
    fullName: "全名 *",
    email: "邮箱 *",
    phone: "电话(含国家代码)",
    phonePlaceholder: "+86 ...",
    country: "国家",
    city: "城市",
    organization: "公司 / 机构(可选)",
    links: "链接 (LinkedIn、网站、计划书 URL)",
    message: "留言 / 您在寻找什么",
    documents: "文件",
    selectedIntent: "已选意向:",
    required: "姓名与邮箱为必填项",
    maxFiles: "最多 5 个文件",
    fileTooLarge: "文件过大",
    somethingWrong: "出错了",
    langCode: "cn",
  },
  ph: {
    badge: "Filipino Diaspora — Bukas na ang Demand sa Imprastruktura",
    title: "Lumalaking demand mula sa ",
    highlight: "Filipino global diaspora",
    subtitle:
      "Sa ilalim ng iisang bubong — mga consultant, negosyo at organisasyon ng iyong diaspora. Isang makina ng social at economic solidarity.",
    tagline: "Isang diaspora. Isang plataporma. Isang solidarity engine.",
    oneRoofTitle: "Buong diaspora mo, sa iisang bubong",
    oneRoofBody:
      "Mga consultant, negosyo, organisasyon, paaralan, event at WhatsApp community — verified, mahahanap, lahat sa isang lugar.",
    oneRoofPills: ["Consultants", "Negosyo", "Organisasyon", "Events", "WhatsApp"],
    solidarityTitle: "Social + Economic Solidarity Engine",
    solidarityBody:
      "Humingi ng tulong, maghanap ng kliyente, maghanap ng kasosyo, gumastos sa loob ng komunidad — palakasin ang diaspora at magtulungan.",
    solidarityPills: ["Referral", "B2B", "Mentorship", "Relocation", "Investment"],
    formTitle: "Filipino Diaspora — Early Access Registration",
    formIntro:
      "I-upload ang iyong mga dokumento o links. Sabihin sa amin kung para sa investment & partnership o general registration.",
    cta1: "Investment at Partnership",
    cta2: "General na Pagpaparehistro",
    interestLabel: "Bakit ka sumasali?",
    options: [
      { value: "investment_partnership", label: "Investment at Partnership" },
      { value: "founder_startup", label: "Founder / Startup" },
      { value: "professional", label: "Propesyonal / Naghahanap ng trabaho" },
      { value: "student", label: "Estudyante" },
      { value: "general", label: "General na Pagpaparehistro" },
    ],
    uploadHint: "Mag-upload ng deck / CV / one-pager (PDF, PPTX, DOCX — max 10MB)",
    submit: "Tapusin ang Pagpaparehistro",
    success: "Natanggap ang iyong pagpaparehistro. Makikipag-ugnayan kami sa lalong madaling panahon.",
    thanks: "Salamat!",
    groupedNote: "Ang mga rehistro ay nakaayos ayon sa bansa at diaspora",
    fullName: "Buong pangalan *",
    email: "Email *",
    phone: "Telepono (may country code)",
    phonePlaceholder: "+63 ...",
    country: "Bansa",
    city: "Lungsod",
    organization: "Kumpanya / Organisasyon (opsyonal)",
    links: "Mga link (LinkedIn, website, deck URL)",
    message: "Mensahe / ano ang hinahanap mo",
    documents: "Mga dokumento",
    selectedIntent: "Napiling layunin:",
    required: "Kailangan ang pangalan at email",
    maxFiles: "Maximum 5 files",
    fileTooLarge: "Masyadong malaki ang file",
    somethingWrong: "May nangyaring mali",
    langCode: "ph",
  },
};

const InternationalDiasporaHero = () => {
  const { diaspora } = useDiaspora();
  const { toast } = useToast();
  const [intent, setIntent] = useState<"investment_partnership" | "general">("general");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", country: "", city: "",
    organization: "", interest_area: "general", links: "", message: "",
  });

  if (diaspora === "tr") return null;
  const c = COPY[diaspora as "in" | "cn" | "ph"];

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files || []);
    if (files.length + list.length > 5) {
      toast({ title: c.maxFiles, variant: "destructive" });
      return;
    }
    const big = list.find((f) => f.size > 10 * 1024 * 1024);
    if (big) {
      toast({ title: c.fileTooLarge, description: `${big.name} > 10MB`, variant: "destructive" });
      return;
    }
    setFiles((p) => [...p, ...list]);
  };

  const upload = async () => {
    const urls: string[] = [];
    for (const f of files) {
      const ext = f.name.split(".").pop() || "bin";
      const path = `diaspora_${c.langCode}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("interest-uploads").upload(path, f, { contentType: f.type });
      if (error) throw error;
      urls.push(path);
    }
    return urls;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast({ title: c.required, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const attachment_urls = await upload();
      const { error } = await supabase.from("interest_registrations").insert({
        category: "international",
        role: intent,
        name: form.name,
        email: form.email,
        phone: form.phone,
        country: form.country,
        city: form.city,
        organization: form.organization,
        interest_area: form.interest_area,
        supply_demand: form.message,
        heard_from: form.links,
        source: `diaspora_${c.langCode}`,
        attachment_urls,
        message: form.message,
      });
      if (error) throw error;
      setDone(true);
      toast({ title: c.thanks, description: c.success });
    } catch (err: any) {
      toast({ title: c.somethingWrong, description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* OPENING BANNER — multicultural hero, no national flags */}
      <section className="relative pt-16 min-h-[70vh] bg-gradient-hero overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-20 w-80 h-80 bg-turquoise/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-20 w-96 h-96 bg-primary/15 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 pt-20 pb-12 relative z-10 grid lg:grid-cols-2 gap-10 items-center">
          {/* Left — hero copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-400/15 border border-amber-400/30 mb-6 shadow-md">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-semibold text-amber-600">{c.badge}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4">
              {c.title}
              <span className="text-gradient-primary">{c.highlight}</span>
            </h1>
            <p className="text-base md:text-lg font-semibold text-foreground mb-3">{c.tagline}</p>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl mb-6 font-body">
              {c.subtitle}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={() => { setIntent("investment_partnership"); document.getElementById("intl-form")?.scrollIntoView({ behavior: "smooth" }); }}
                className="bg-amber-500 hover:bg-amber-600 text-white gap-2"
              >
                <Handshake className="h-4 w-4" /> {c.cta1}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => { setIntent("general"); document.getElementById("intl-form")?.scrollIntoView({ behavior: "smooth" }); }}
                className="gap-2"
              >
                <FileText className="h-4 w-4" /> {c.cta2}
              </Button>
            </div>
            <div className="flex items-center gap-2 mt-6 text-xs text-muted-foreground">
              <Globe className="h-4 w-4 text-turquoise" />
              <span>{c.groupedNote}</span>
            </div>
          </div>
          {/* Right — multicultural hero image (no national flags) */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-turquoise/20 via-amber-300/10 to-primary/20 rounded-3xl blur-2xl" />
            <img
              src={multiculturalHero}
              alt="Global multicultural diaspora community"
              width={1536}
              height={1024}
              className="relative rounded-3xl shadow-2xl border border-border w-full h-auto object-cover"
            />
          </div>
        </div>
      </section>

      {/* SECTION 1 — One Roof */}
      <section className="py-12 bg-card">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-8 items-center">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-turquoise/15 flex items-center justify-center shrink-0">
              <Users className="h-6 w-6 text-turquoise" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold mb-2">{c.oneRoofTitle}</h2>
              <p className="text-muted-foreground font-body">{c.oneRoofBody}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {c.oneRoofPills.map((p) => (
                  <span key={p} className="text-xs font-semibold bg-turquoise/10 text-turquoise border border-turquoise/30 px-2.5 py-1 rounded-full">{p}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { icon: Users, label: c.oneRoofPills[0] },
              { icon: Briefcase, label: c.oneRoofPills[1] },
              { icon: Building2, label: c.oneRoofPills[2] },
            ].map((it, i) => (
              <div key={i} className="rounded-xl border border-border p-4 bg-background">
                <it.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                <div className="text-xs font-semibold">{it.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2 — Solidarity engine */}
      <section className="py-12 bg-gradient-to-br from-amber-50/40 via-background to-turquoise/5 border-y border-border">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-8 items-center">
          <div className="order-2 md:order-1 grid grid-cols-3 gap-3 text-center">
            {[
              { icon: HeartHandshake, label: c.solidarityPills[0] },
              { icon: TrendingUp, label: c.solidarityPills[1] },
              { icon: Globe, label: c.solidarityPills[2] },
            ].map((it, i) => (
              <div key={i} className="rounded-xl border border-border p-4 bg-card">
                <it.icon className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                <div className="text-xs font-semibold">{it.label}</div>
              </div>
            ))}
          </div>
          <div className="order-1 md:order-2 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-400/20 flex items-center justify-center shrink-0">
              <HeartHandshake className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold mb-2">{c.solidarityTitle}</h2>
              <p className="text-muted-foreground font-body">{c.solidarityBody}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {c.solidarityPills.map((p) => (
                  <span key={p} className="text-xs font-semibold bg-amber-400/15 text-amber-700 border border-amber-400/40 px-2.5 py-1 rounded-full">{p}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* REGISTRATION FORM */}
      <section className="py-14">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* form card */}
        {/* Right — form */}
        <div id="intl-form" className="rounded-2xl border border-border bg-card p-6 shadow-card">
          {done ? (
            <div className="flex flex-col items-center text-center py-10 gap-3">
              <CheckCircle2 className="h-14 w-14 text-turquoise" />
              <h3 className="text-xl font-bold">{c.thanks}</h3>
              <p className="text-sm text-muted-foreground max-w-sm">{c.success}</p>
            </div>
          ) : (
            <>
              <h3 className="text-xl font-bold mb-1">{c.formTitle}</h3>
              <p className="text-xs text-muted-foreground mb-4">{c.formIntro}</p>
              <form onSubmit={submit} className="space-y-3">
                <div>
                  <Label>{c.interestLabel}</Label>
                  <Select value={form.interest_area} onValueChange={(v) => setForm({ ...form, interest_area: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {c.options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{c.fullName}</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{c.email}</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                  <div>
                    <Label>{c.phone}</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder={c.phonePlaceholder} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{c.country}</Label>
                    <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                  </div>
                  <div>
                    <Label>{c.city}</Label>
                    <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>{c.organization}</Label>
                  <Input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} />
                </div>
                <div>
                  <Label>{c.links}</Label>
                  <Input value={form.links} onChange={(e) => setForm({ ...form, links: e.target.value })} placeholder="https://..." />
                </div>
                <div>
                  <Label>{c.message}</Label>
                  <Textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                </div>
                <div>
                  <Label>{c.documents}</Label>
                  <label className="mt-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-turquoise/60 hover:bg-turquoise/5 transition-colors">
                    <Upload className="h-4 w-4 text-turquoise" />
                    <span className="text-xs text-muted-foreground">{c.uploadHint}</span>
                    <input type="file" multiple accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg" className="hidden" onChange={handleFiles} />
                  </label>
                  {files.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {files.map((f, i) => (
                        <li key={i} className="flex items-center justify-between text-xs bg-muted/50 px-2 py-1 rounded">
                          <span className="truncate">{f.name}</span>
                          <button type="button" onClick={() => setFiles((p) => p.filter((_, idx) => idx !== i))} className="text-destructive">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  {c.selectedIntent} <span className="font-semibold">{intent === "investment_partnership" ? c.cta1 : c.cta2}</span>
                </div>
                <Button type="submit" disabled={submitting} className="w-full" size="lg">
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Rocket className="h-4 w-4 mr-2" />}
                  {c.submit}
                </Button>
              </form>
            </>
          )}
        </div>
        </div>
      </section>
    </>
  );
};

export default InternationalDiasporaHero;
