import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Send, Save, MapPin, DollarSign, CheckSquare, Briefcase, GraduationCap, Home, Users, FileText, BookOpen, Star, ExternalLink, Download, Plus, Gift, Info } from "lucide-react";
import WelcomePackOrderForm from "@/components/WelcomePackOrderForm";
import { Link, useNavigate } from "react-router-dom";
import { useRelocationResearches, type RelocationResearch } from "@/hooks/useRelocationResearches";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SurveyData {
  targetCountry: string;
  targetCity: string;
  familyStatus: string;
  spouseWorking: string;
  spouseProfession: string;
  userExperience: string;
  spouseExperience: string;
  childrenCount: number;
  childrenAges: string;
  profession: string;
  currentCountry: string;
  wantsMentor: string;
}

const COUNTRIES = [
  "Almanya", "Hollanda", "İngiltere", "Fransa", "ABD", "Kanada", "Avustralya",
  "İsviçre", "Avusturya", "Belçika", "İsveç", "Norveç", "Danimarka"
];

const RelocationEngine = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const { save: saveResearch, getById } = useRelocationResearches();
  const [currentResearchId, setCurrentResearchId] = useState<string | null>(null);
  const [step, setStep] = useState<"survey" | "engine">("survey");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("checklist");
  const [savedDocs, setSavedDocs] = useState<{ title: string; content: string; type: "checklist" | "chat" | "report"; date: string }[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [survey, setSurvey] = useState<SurveyData>({
    targetCountry: "",
    targetCity: "",
    familyStatus: "single",
    spouseWorking: "no",
    spouseProfession: "",
    userExperience: "",
    spouseExperience: "",
    childrenCount: 0,
    childrenAges: "",
    profession: "",
    currentCountry: "Türkiye",
    wantsMentor: "no",
  });

  // Mock relocation data based on survey
  const [relocationData, setRelocationData] = useState<any>(null);

  // Load existing research from URL param
  useEffect(() => {
    const researchId = searchParams.get("research");
    if (researchId) {
      const existing = getById(researchId);
      if (existing) {
        setCurrentResearchId(existing.id);
        setSurvey({
          targetCountry: existing.targetCountry,
          targetCity: existing.targetCity,
          familyStatus: existing.familyStatus,
          spouseWorking: existing.spouseWorking,
          spouseProfession: existing.spouseProfession,
          userExperience: existing.userExperience,
          spouseExperience: existing.spouseExperience,
          childrenCount: existing.childrenCount,
          childrenAges: existing.childrenAges,
          profession: existing.profession,
          currentCountry: existing.currentCountry,
          wantsMentor: "no",
        });
        setMessages(existing.chatMessages);
        setSavedDocs(existing.savedDocs);
        // We need to generate relocation data and go to engine
        setStep("engine");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const COUNTRY_REQUIRED_DOCS: Record<string, { doc: string; category: string; note: string; done: boolean }[]> = {
    Almanya: [
      { doc: "Pasaport (min. 6 ay geçerli)", category: "Kimlik", note: "Orijinal + 2 fotokopi", done: false },
      { doc: "Doğum Belgesi (Birth Certificate)", category: "Kimlik", note: "Apostil tasdikli, yeminli tercüme", done: false },
      { doc: "Evlilik Cüzdanı / Nikah Belgesi", category: "Kimlik", note: "Apostil tasdikli, yeminli tercüme", done: false },
      { doc: "Diploma & Transkript", category: "Eğitim", note: "Apostil tasdikli, yeminli tercüme + Anabin kaydı", done: false },
      { doc: "Dil Belgesi (B1/B2 Almanca veya İngilizce)", category: "Eğitim", note: "Goethe/TestDaF/IELTS/TOEFL", done: false },
      { doc: "IELTS / TOEFL Sonuç Belgesi", category: "Eğitim", note: "İngilizce yeterliliği gerekiyorsa", done: false },
      { doc: "Ehliyet (Sürücü Belgesi)", category: "Resmi", note: "Uluslararası ehliyet + Türk ehliyet tercümesi", done: false },
      { doc: "Sabıka Kaydı (Adli Sicil)", category: "Resmi", note: "Apostil tasdikli, son 3 ay içinde alınmış", done: false },
      { doc: "İş Sözleşmesi / İşveren Mektubu", category: "İş", note: "Vize başvurusu için orijinal", done: false },
      { doc: "Sağlık Raporu / Aşı Kartı", category: "Sağlık", note: "Bazı vizeler için gerekli", done: false },
      { doc: "Biyometrik Fotoğraflar (4 adet)", category: "Kimlik", note: "Son 6 ay, beyaz fon", done: false },
      { doc: "Banka Hesap Dökümü (son 3 ay)", category: "Mali", note: "Yeterli bakiye kanıtı", done: false },
      { doc: "Kira Sözleşmesi / Konaklama Kanıtı", category: "Konut", note: "Varsa önceden ayarlanmış", done: false },
      { doc: "Vekaletname (gerekiyorsa)", category: "Resmi", note: "Noter tasdikli", done: false },
      { doc: "Çocuk Nüfus Kayıt Örneği", category: "Kimlik", note: "Apostil tasdikli (çocuklu aileler)", done: false },
    ],
    Hollanda: [
      { doc: "Pasaport (min. 6 ay geçerli)", category: "Kimlik", note: "Orijinal + 2 fotokopi", done: false },
      { doc: "Doğum Belgesi (Birth Certificate)", category: "Kimlik", note: "Apostil tasdikli, yeminli tercüme (İngilizce/Hollandaca)", done: false },
      { doc: "Evlilik Cüzdanı / Nikah Belgesi", category: "Kimlik", note: "Apostil tasdikli, yeminli tercüme", done: false },
      { doc: "Diploma & Transkript", category: "Eğitim", note: "Apostil tasdikli + Nuffic denklik", done: false },
      { doc: "IELTS / TOEFL Sonuç Belgesi", category: "Eğitim", note: "İngilizce pozisyonlar için gerekli", done: false },
      { doc: "Ehliyet", category: "Resmi", note: "AB dışı ehliyet 185 gün geçerli, sonra değişim gerekir", done: false },
      { doc: "Sabıka Kaydı (VOG)", category: "Resmi", note: "Apostil tasdikli, legalize", done: false },
      { doc: "İş Sözleşmesi / Sponsor Mektubu", category: "İş", note: "MVV/TWV başvurusu için zorunlu", done: false },
      { doc: "Sağlık Sigortası Belgesi", category: "Sağlık", note: "Hollanda'da zorunlu basisverzekering", done: false },
      { doc: "Biyometrik Fotoğraflar (4 adet)", category: "Kimlik", note: "IND standartlarına uygun", done: false },
      { doc: "Banka Hesap Dökümü", category: "Mali", note: "Mali yeterlilik kanıtı", done: false },
      { doc: "Vekaletname (gerekiyorsa)", category: "Resmi", note: "Noter tasdikli", done: false },
    ],
    İngiltere: [
      { doc: "Pasaport (geçerli)", category: "Kimlik", note: "Orijinal + fotokopi", done: false },
      { doc: "Doğum Belgesi", category: "Kimlik", note: "Apostil tasdikli, yeminli İngilizce tercüme", done: false },
      { doc: "Evlilik Belgesi", category: "Kimlik", note: "Apostil tasdikli, yeminli İngilizce tercüme", done: false },
      { doc: "Diploma & Transkript", category: "Eğitim", note: "NARIC/ENIC denklik + yeminli tercüme", done: false },
      { doc: "IELTS / TOEFL / PTE Sonuç Belgesi", category: "Eğitim", note: "UKVI onaylı IELTS tercih edilir", done: false },
      { doc: "Ehliyet", category: "Resmi", note: "12 ay geçerli, sonra UK ehliyet gerekli", done: false },
      { doc: "Sabıka Kaydı (ACRO Police Certificate)", category: "Resmi", note: "Apostil tasdikli", done: false },
      { doc: "İş Teklif Mektubu / CoS", category: "İş", note: "Certificate of Sponsorship zorunlu", done: false },
      { doc: "TB Test Sonucu", category: "Sağlık", note: "Bazı ülke vatandaşları için zorunlu", done: false },
      { doc: "Banka Hesap Dökümü", category: "Mali", note: "Yeterli bakiye kanıtı (min. 28 gün)", done: false },
      { doc: "Biyometrik Fotoğraflar", category: "Kimlik", note: "UK standartlarına uygun", done: false },
    ],
    Fransa: [
      { doc: "Pasaport (min. 3 ay geçerli)", category: "Kimlik", note: "Orijinal + 2 fotokopi", done: false },
      { doc: "Doğum Belgesi (Acte de Naissance)", category: "Kimlik", note: "Apostil + yeminli Fransızca tercüme", done: false },
      { doc: "Evlilik Belgesi", category: "Kimlik", note: "Apostil + yeminli Fransızca tercüme", done: false },
      { doc: "Diploma & Transkript", category: "Eğitim", note: "ENIC-NARIC France denklik + tercüme", done: false },
      { doc: "Fransızca Dil Belgesi (DELF/DALF)", category: "Eğitim", note: "B1 minimum çoğu vize için", done: false },
      { doc: "Ehliyet", category: "Resmi", note: "1 yıl geçerli, sonra değişim gerekli", done: false },
      { doc: "Sabıka Kaydı", category: "Resmi", note: "Apostil tasdikli, son 3 ay", done: false },
      { doc: "İş Sözleşmesi", category: "İş", note: "Vize başvurusu için zorunlu", done: false },
      { doc: "Sağlık Sigortası", category: "Sağlık", note: "Geçici süre için gerekli", done: false },
      { doc: "Banka Hesap Dökümü", category: "Mali", note: "Mali yeterlilik", done: false },
    ],
    ABD: [
      { doc: "Pasaport (min. 6 ay geçerli)", category: "Kimlik", note: "Orijinal", done: false },
      { doc: "Doğum Belgesi", category: "Kimlik", note: "Apostil tasdikli, yeminli İngilizce tercüme", done: false },
      { doc: "Evlilik Belgesi", category: "Kimlik", note: "Apostil tasdikli, yeminli İngilizce tercüme", done: false },
      { doc: "Diploma & Transkript", category: "Eğitim", note: "WES/ECE credential evaluation", done: false },
      { doc: "TOEFL / IELTS Sonuç Belgesi", category: "Eğitim", note: "Çoğu vize kategorisi için gerekli", done: false },
      { doc: "Ehliyet", category: "Resmi", note: "Eyalete göre değişir, genelde 90 gün geçerli", done: false },
      { doc: "Sabıka Kaydı (Police Clearance)", category: "Resmi", note: "Apostil tasdikli", done: false },
      { doc: "İş Teklif Mektubu / I-797 Onay", category: "İş", note: "H-1B, L-1 vb. için sponsor gerekli", done: false },
      { doc: "Sağlık Muayene Raporu (I-693)", category: "Sağlık", note: "Yetkili doktor (Civil Surgeon) tarafından", done: false },
      { doc: "Banka Hesap Dökümü", category: "Mali", note: "Sponsor veya kişisel yeterlilik kanıtı", done: false },
      { doc: "DS-160 Formu", category: "Resmi", note: "Online doldurulup yazdırılacak", done: false },
      { doc: "Biyometrik Fotoğraflar (US standart)", category: "Kimlik", note: "5x5 cm, beyaz fon", done: false },
    ],
    Kanada: [
      { doc: "Pasaport (geçerli)", category: "Kimlik", note: "Orijinal + fotokopi", done: false },
      { doc: "Doğum Belgesi", category: "Kimlik", note: "Apostil + yeminli İngilizce/Fransızca tercüme", done: false },
      { doc: "Evlilik Belgesi", category: "Kimlik", note: "Apostil + yeminli tercüme", done: false },
      { doc: "Diploma & Transkript", category: "Eğitim", note: "WES credential evaluation zorunlu", done: false },
      { doc: "IELTS General / CELPIP / TEF", category: "Eğitim", note: "Express Entry için CLB 7 minimum", done: false },
      { doc: "Ehliyet", category: "Resmi", note: "Eyalete göre 60-90 gün, sonra değişim", done: false },
      { doc: "Sabıka Kaydı (Police Clearance)", category: "Resmi", note: "Apostil tasdikli", done: false },
      { doc: "İş Teklif Mektubu / LMIA", category: "İş", note: "Varsa Express Entry puanı artırır", done: false },
      { doc: "Sağlık Muayene (IME)", category: "Sağlık", note: "Yetkili panel physician tarafından", done: false },
      { doc: "Banka Hesap Dökümü", category: "Mali", note: "Yerleşim fonu kanıtı (POF)", done: false },
      { doc: "Biyometrik Fotoğraflar", category: "Kimlik", note: "IRCC standartlarına uygun", done: false },
    ],
    Avustralya: [
      { doc: "Pasaport (geçerli)", category: "Kimlik", note: "Orijinal + fotokopi", done: false },
      { doc: "Doğum Belgesi", category: "Kimlik", note: "Apostil + yeminli İngilizce tercüme", done: false },
      { doc: "Evlilik Belgesi", category: "Kimlik", note: "Apostil + yeminli İngilizce tercüme", done: false },
      { doc: "Diploma & Transkript", category: "Eğitim", note: "AEI-NOOSR / VETASSESS denklik", done: false },
      { doc: "IELTS Academic / PTE Academic", category: "Eğitim", note: "Skilled visa için min. 6.0 her bölüm", done: false },
      { doc: "Ehliyet", category: "Resmi", note: "Eyalete göre 3-6 ay, sonra değişim", done: false },
      { doc: "Sabıka Kaydı (AFP Check)", category: "Resmi", note: "Apostil + yeminli tercüme", done: false },
      { doc: "Skills Assessment", category: "İş", note: "Mesleğe göre ilgili kuruluş değerlendirmesi", done: false },
      { doc: "Sağlık Muayene", category: "Sağlık", note: "Bupa Medical Visa Services panel doktoru", done: false },
      { doc: "Banka Hesap Dökümü", category: "Mali", note: "Yerleşim fonu kanıtı", done: false },
    ],
  };

  // Default docs for countries not specifically listed
  const DEFAULT_DOCS: { doc: string; category: string; note: string; done: boolean }[] = [
    { doc: "Pasaport (min. 6 ay geçerli)", category: "Kimlik", note: "Orijinal + 2 fotokopi", done: false },
    { doc: "Doğum Belgesi (Birth Certificate)", category: "Kimlik", note: "Apostil/noter tasdikli, yeminli tercüme", done: false },
    { doc: "Evlilik Belgesi (Marriage Certificate)", category: "Kimlik", note: "Apostil/noter tasdikli, yeminli tercüme", done: false },
    { doc: "Diploma & Transkript", category: "Eğitim", note: "Apostil tasdikli + denklik başvurusu", done: false },
    { doc: "IELTS / TOEFL Sonuç Belgesi", category: "Eğitim", note: "Dil yeterliliği kanıtı", done: false },
    { doc: "Ehliyet (Sürücü Belgesi)", category: "Resmi", note: "Uluslararası ehliyet + tercüme", done: false },
    { doc: "Sabıka Kaydı (Adli Sicil)", category: "Resmi", note: "Apostil tasdikli, son 3 ay", done: false },
    { doc: "İş Sözleşmesi / Teklif Mektubu", category: "İş", note: "Vize başvurusu için", done: false },
    { doc: "Sağlık Raporu / Aşı Kartı", category: "Sağlık", note: "Hedef ülke gereksinimlerine göre", done: false },
    { doc: "Banka Hesap Dökümü (son 3 ay)", category: "Mali", note: "Mali yeterlilik kanıtı", done: false },
    { doc: "Biyometrik Fotoğraflar", category: "Kimlik", note: "Son 6 ay, ülke standartlarına uygun", done: false },
    { doc: "Vekaletname (gerekiyorsa)", category: "Resmi", note: "Noter tasdikli", done: false },
  ];

  const generateRelocationData = () => {
    const countryData: Record<string, any> = {
      Almanya: {
        avgSalary: "€3,500 - €5,500/ay (brüt)",
        rent: "€800 - €1,500/ay",
        groceries: "€300 - €500/ay",
        transport: "€80 - €120/ay",
        insurance: "€200 - €400/ay",
        utilities: "€200 - €350/ay",
        childcare: "€250 - €400/çocuk/ay",
        totalMonthly: "€1,800 - €3,200/ay",
        movingBudget: "€3,000 - €8,000",
        checklist: [
          { item: "Vize başvurusu", cost: "€75-100", done: false },
          { item: "Pasaport yenileme", cost: "₺2,500", done: false },
          { item: "Diploma denklik (Anabin)", cost: "€200", done: false },
          { item: "Dil belgesi (B1/B2)", cost: "€250", done: false },
          { item: "Sağlık sigortası", cost: "€200/ay", done: false },
          { item: "Ev depozito (3 ay kira)", cost: "€2,400-4,500", done: false },
          { item: "Uçak bileti", cost: "€300-600", done: false },
          { item: "İlk ay yaşam masrafları", cost: "€2,000-3,000", done: false },
          { item: "Belediye kaydı (Anmeldung)", cost: "Ücretsiz", done: false },
          { item: "Banka hesabı açma", cost: "Ücretsiz", done: false },
          { item: "Vergi numarası (Steuer-ID)", cost: "Ücretsiz", done: false },
          { item: "Çocuk okul kaydı", cost: "Ücretsiz (devlet)", done: false },
        ],
        schools: ["Berlin International School", "Munich International School", "Frankfurt International School"],
      },
      Hollanda: {
        avgSalary: "€3,200 - €5,000/ay (brüt)",
        rent: "€1,000 - €1,800/ay",
        groceries: "€250 - €450/ay",
        transport: "€90 - €130/ay",
        insurance: "€130 - €180/ay",
        utilities: "€150 - €300/ay",
        childcare: "€300 - €500/çocuk/ay",
        totalMonthly: "€2,000 - €3,500/ay",
        movingBudget: "€4,000 - €10,000",
        checklist: [
          { item: "MVV vize başvurusu", cost: "€210", done: false },
          { item: "30% ruling başvurusu", cost: "Ücretsiz", done: false },
          { item: "BSN numarası alma", cost: "Ücretsiz", done: false },
          { item: "Sağlık sigortası", cost: "€130/ay", done: false },
          { item: "Ev kiralama depozito", cost: "€2,000-3,600", done: false },
          { item: "Uçak bileti", cost: "€200-400", done: false },
          { item: "İlk ay yaşam masrafları", cost: "€2,500-3,500", done: false },
          { item: "Belediye kaydı (Gemeente)", cost: "Ücretsiz", done: false },
          { item: "DigiD başvurusu", cost: "Ücretsiz", done: false },
          { item: "Banka hesabı açma", cost: "Ücretsiz", done: false },
        ],
        schools: ["International School of Amsterdam", "Rotterdam International Secondary School"],
      },
    };

    const data = countryData[survey.targetCountry] || countryData["Almanya"];

    // Add required docs
    data.requiredDocs = COUNTRY_REQUIRED_DOCS[survey.targetCountry] || DEFAULT_DOCS;

    if (survey.familyStatus === "family") {
      data.totalMonthly = data.totalMonthly.replace(/€[\d,]+/g, (m: string) => {
        const num = parseInt(m.replace(/[€,]/g, ""));
        return `€${(num * 1.6).toLocaleString()}`;
      });
    }

    return data;
  };

  // Generate data when loading from existing research
  useEffect(() => {
    if (step === "engine" && !relocationData && survey.targetCountry) {
      const data = generateRelocationData();
      // Restore checklist state if loading from saved research
      const researchId = searchParams.get("research");
      if (researchId) {
        const existing = getById(researchId);
        if (existing?.checklistState) {
          data.checklist = existing.checklistState;
        }
        if (existing?.requiredDocsState) {
          data.requiredDocs = existing.requiredDocsState;
        }
      }
      setRelocationData(data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, survey.targetCountry]);

  const handleSurveySubmit = () => {
    if (!survey.targetCountry || !survey.profession) return;
    const data = generateRelocationData();
    setRelocationData(data);
    setStep("engine");

    const researchId = crypto.randomUUID();
    setCurrentResearchId(researchId);

    const welcomeMsg: Message = {
      role: "assistant",
      content: `🏠 **${survey.targetCountry}'ya Taşınma Planınız Hazır!**\n\nMerhaba! ${survey.targetCountry}${survey.targetCity ? ` (${survey.targetCity})` : ""}'ya taşınma sürecinizde size yardımcı olacağım.\n\n**Profiliniz:**\n- 👤 ${survey.familyStatus === "single" ? "Yalnız" : "Aile"}\n- 💼 Meslek: ${survey.profession}\n${survey.familyStatus === "family" ? `- 👶 Çocuk: ${survey.childrenCount} (${survey.childrenAges})\n- 💑 Eş çalışacak mı: ${survey.spouseWorking === "yes" ? "Evet" : "Hayır"}` : ""}\n\nSağ taraftaki panelden checklist, yaşam masrafları ve iş fırsatlarını inceleyebilirsiniz. Sorularınızı buradan yazabilirsiniz!`
    };
    setMessages([welcomeMsg]);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: input };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/relocation-chat`;

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          surveyData: survey,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Hata: ${resp.status}`);
      }

      if (!resp.body) throw new Error("Stream başlatılamadı");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      console.error("Relocation chat error:", e);
      toast({
        title: "AI Hatası",
        description: e.message || "Bir hata oluştu",
        variant: "destructive",
      });
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "⚠️ Üzgünüm, şu an yanıt veremedim. Lütfen tekrar deneyin."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveToProfile = (content: string) => {
    setSavedDocs(prev => [...prev, { title: `💬 Sohbet Notu`, content: content.slice(0, 200), type: "chat" as const, date: new Date().toLocaleDateString("tr-TR") }]);
  };

  // Save survey + report on engine start
  const saveSurveyReport = useCallback(() => {
    const reportTitle = `📊 Taşınma Raporu — ${survey.targetCountry}${survey.targetCity ? ` / ${survey.targetCity}` : ""}`;
    const surveyTitle = `📋 Anket Verileri — ${survey.targetCountry}${survey.targetCity ? ` / ${survey.targetCity}` : ""}`;
    const surveyContent = `Hedef: ${survey.targetCountry} ${survey.targetCity || ""}\nMeslek: ${survey.profession}\nAile: ${survey.familyStatus}\nTecrübe: ${survey.userExperience}`;
    const reportContent = `Tahmini bütçe: ${relocationData?.movingBudget || "—"}\nAylık masraf: ${relocationData?.totalMonthly || "—"}\nMaaş aralığı: ${relocationData?.avgSalary || "—"}`;
    setSavedDocs(prev => {
      if (prev.some(d => d.type === "report")) return prev;
      return [
        ...prev,
        { title: surveyTitle, content: surveyContent, type: "report" as const, date: new Date().toLocaleDateString("tr-TR") },
        { title: reportTitle, content: reportContent, type: "report" as const, date: new Date().toLocaleDateString("tr-TR") },
      ];
    });
  }, [survey, relocationData]);

  useEffect(() => {
    if (step === "engine" && relocationData) {
      saveSurveyReport();
    }
  }, [step, relocationData, saveSurveyReport]);

  // Auto-save research to localStorage whenever state changes
  useEffect(() => {
    if (step !== "engine" || !currentResearchId || !survey.targetCountry) return;

    const cityLabel = survey.targetCity || survey.targetCountry;
    const title = `${cityLabel} Araştırması`;

    const research: RelocationResearch = {
      id: currentResearchId,
      title,
      targetCountry: survey.targetCountry,
      targetCity: survey.targetCity,
      profession: survey.profession,
      familyStatus: survey.familyStatus,
      spouseWorking: survey.spouseWorking,
      spouseProfession: survey.spouseProfession,
      userExperience: survey.userExperience,
      spouseExperience: survey.spouseExperience,
      childrenCount: survey.childrenCount,
      childrenAges: survey.childrenAges,
      currentCountry: survey.currentCountry,
      chatMessages: messages,
      savedDocs,
      checklistState: relocationData?.checklist || null,
      requiredDocsState: relocationData?.requiredDocs || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveResearch(research);
  }, [step, currentResearchId, messages, savedDocs, relocationData, survey, saveResearch]);

  if (step === "survey") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
      <div className="container mx-auto px-4 py-4 max-w-2xl flex-1 overflow-y-auto">
          <div className="text-center mb-4">
            <span className="text-3xl mb-1 block">🌍</span>
            <h1 className="text-2xl font-extrabold text-foreground mb-1">
              Relocation <span className="text-primary">Engine</span>
            </h1>
            <p className="text-sm text-muted-foreground font-body">
              Taşınma planınızı oluşturmak için birkaç soruya cevap verin
            </p>
          </div>

          <Card className="border-border shadow-lg">
            <CardContent className="pt-4 space-y-4">
              {/* Target Country */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">🎯 Hedef Ülke *</Label>
                <Select value={survey.targetCountry} onValueChange={(v) => setSurvey(p => ({ ...p, targetCountry: v }))}>
                  <SelectTrigger><SelectValue placeholder="Ülke seçin" /></SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Target City */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">🏙️ Hedef Şehir</Label>
                <Input
                  placeholder="Örn: Berlin, Amsterdam, Londra"
                  value={survey.targetCity}
                  onChange={(e) => setSurvey(p => ({ ...p, targetCity: e.target.value }))}
                />
              </div>

              {/* Family Status */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">👥 Aile Durumu *</Label>
                <RadioGroup value={survey.familyStatus} onValueChange={(v) => setSurvey(p => ({ ...p, familyStatus: v }))}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="single" id="single" />
                    <Label htmlFor="single">Yalnız gidiyorum</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="couple" id="couple" />
                    <Label htmlFor="couple">Eşimle birlikte</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="family" id="family" />
                    <Label htmlFor="family">Ailemle birlikte (çocuklu)</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Spouse working */}
              {(survey.familyStatus === "couple" || survey.familyStatus === "family") && (
                <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                  <Label className="text-sm font-semibold">💼 Eşiniz de çalışacak mı?</Label>
                  <RadioGroup value={survey.spouseWorking} onValueChange={(v) => setSurvey(p => ({ ...p, spouseWorking: v }))}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="sp-yes" />
                      <Label htmlFor="sp-yes">Evet</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="sp-no" />
                      <Label htmlFor="sp-no">Hayır</Label>
                    </div>
                  </RadioGroup>

                  {survey.spouseWorking === "yes" && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">💼 Eşinizin Mesleği</Label>
                      <Input
                        placeholder="Örn: Hemşire, Mimar, Pazarlamacı"
                        value={survey.spouseProfession}
                        onChange={(e) => setSurvey(p => ({ ...p, spouseProfession: e.target.value }))}
                      />
                      <Label className="text-sm font-semibold">📅 Eşinizin Toplam İş Tecrübesi (yıl)</Label>
                      <Select value={survey.spouseExperience} onValueChange={(v) => setSurvey(p => ({ ...p, spouseExperience: v }))}>
                        <SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger>
                        <SelectContent>
                          {["0-2 yıl", "3-5 yıl", "6-10 yıl", "10+ yıl"].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              {/* Children */}
              {survey.familyStatus === "family" && (
                <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                  <Label className="text-sm font-semibold">👶 Çocuk sayısı</Label>
                  <Select value={String(survey.childrenCount)} onValueChange={(v) => setSurvey(p => ({ ...p, childrenCount: parseInt(v) }))}>
                    <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Label className="text-sm font-semibold">Yaşları</Label>
                  <Input
                    placeholder="Örn: 3, 7"
                    value={survey.childrenAges}
                    onChange={(e) => setSurvey(p => ({ ...p, childrenAges: e.target.value }))}
                  />
                </div>
              )}

              {/* Profession */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">💼 Mesleğiniz *</Label>
                <Input
                  placeholder="Örn: Yazılım Mühendisi, Doktor, Öğretmen"
                  value={survey.profession}
                  onChange={(e) => setSurvey(p => ({ ...p, profession: e.target.value }))}
                />
              </div>

              {/* User Experience */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">📅 Toplam İş Tecrübeniz</Label>
                <Select value={survey.userExperience} onValueChange={(v) => setSurvey(p => ({ ...p, userExperience: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger>
                  <SelectContent>
                    {["0-2 yıl", "3-5 yıl", "6-10 yıl", "10+ yıl"].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Current Country */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">📍 Şu an bulunduğunuz ülke</Label>
                <Input
                  placeholder="Türkiye"
                  value={survey.currentCountry}
                  onChange={(e) => setSurvey(p => ({ ...p, currentCountry: e.target.value }))}
                />
              </div>

              {/* Mentor Question */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">🧭 Relokasyon Mentörü İster misiniz?</Label>
                <p className="text-xs text-muted-foreground">Taşınma sürecinizde sizi yönlendirecek deneyimli bir mentör atanabilir.</p>
                <RadioGroup
                  value={survey.wantsMentor || "no"}
                  onValueChange={(v) => setSurvey(p => ({ ...p, wantsMentor: v }))}
                  className="flex gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="paid" id="mentor-paid" />
                    <Label htmlFor="mentor-paid" className="text-sm cursor-pointer">💼 Ücretli</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent><p className="text-xs">Profilinize teklif gelir.</p></TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="volunteer" id="mentor-vol" />
                    <Label htmlFor="mentor-vol" className="text-sm cursor-pointer">🤝 Gönüllü</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent><p className="text-xs">Profilinize 1 günlük ücretsiz teklif gelir.</p></TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="no" id="mentor-no" />
                    <Label htmlFor="mentor-no" className="text-sm cursor-pointer">Hayır</Label>
                  </div>
                </RadioGroup>
              </div>

              <Button
                onClick={handleSurveySubmit}
                disabled={!survey.targetCountry || !survey.profession}
                className="w-full"
                variant="hero"
                size="lg"
              >
                🚀 Relocation Planımı Oluştur
              </Button>

              {/* Welcome Pack CTA */}
              <div className="mt-4 p-4 bg-gradient-to-r from-primary/10 via-turquoise/10 to-primary/5 rounded-xl border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-5 w-5 text-primary" />
                  <span className="font-semibold text-sm">Hoşgeldin Paketi de oluştur!</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Uçak bileti, havaalanı transferi ve araç kiralama için hemen teklif al.
                </p>
                <WelcomePackOrderForm
                  defaultCountry={survey.targetCountry}
                  defaultCity={survey.targetCity}
                  defaultAdults={survey.familyStatus === "single" ? 1 : 2}
                  defaultChildren={survey.childrenCount}
                  trigger={
                    <Button variant="outline" size="sm" className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10">
                      <Gift className="h-3.5 w-3.5" /> 🎉 Hoşgeldin Paketi Oluştur
                    </Button>
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Chat Panel */}
        <div className="w-[380px] min-w-[340px] border-r border-border flex flex-col bg-card">
          <div className="p-4 border-b border-border bg-primary/5">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌍</span>
              <div>
                <h2 className="text-sm font-bold text-foreground">Relocation Engine</h2>
                <p className="text-xs text-muted-foreground">{survey.targetCountry} {survey.targetCity && `• ${survey.targetCity}`}</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                }`}>
                  <div className="whitespace-pre-line">{msg.content}</div>
                  {msg.role === "assistant" && (
                    <button
                      onClick={() => saveToProfile(msg.content)}
                      className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Save className="h-3 w-3" /> Profilde sakla
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Soru sorun... Örn: Kira ne kadar?"
                className="text-sm"
              />
              <Button size="icon" onClick={handleSendMessage} disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {["Kira fiyatları", "İş fırsatları", "Okul seçenekleri", "Vize süreci"].map(q => (
                <button
                  key={q}
                  onClick={() => { setInput(q); }}
                  className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Canvas */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-extrabold text-foreground">
                🌍 {survey.targetCountry} Taşınma Planı
              </h1>
              <Badge variant="secondary" className="text-xs">
                {survey.familyStatus === "single" ? "Yalnız" : survey.familyStatus === "couple" ? "Çift" : "Aile"}
              </Badge>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6 flex-wrap h-auto gap-1">
                <TabsTrigger value="checklist" className="gap-1.5"><CheckSquare className="h-3.5 w-3.5" /> Checklist</TabsTrigger>
                <TabsTrigger value="documents" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Gerekli Belgeler</TabsTrigger>
                <TabsTrigger value="costs" className="gap-1.5"><DollarSign className="h-3.5 w-3.5" /> Yaşam Masrafları</TabsTrigger>
                <TabsTrigger value="jobs" className="gap-1.5"><Briefcase className="h-3.5 w-3.5" /> İş & İşletmeler</TabsTrigger>
                {survey.familyStatus === "family" && survey.childrenCount > 0 && (
                  <TabsTrigger value="schools" className="gap-1.5"><GraduationCap className="h-3.5 w-3.5" /> Okullar</TabsTrigger>
                )}
                <TabsTrigger value="welcome-pack" className="gap-1.5"><Gift className="h-3.5 w-3.5" /> Hoşgeldin Paketi</TabsTrigger>
                <TabsTrigger value="saved" className="gap-1.5"><Save className="h-3.5 w-3.5" /> Dökümanlarım</TabsTrigger>
              </TabsList>

              {/* Toolbar: Research title + actions */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-foreground truncate max-w-[50%]">
                  📂 {survey.targetCity || survey.targetCountry} Araştırmanız
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => {
                      navigate("/relocation");
                      window.location.reload();
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" /> Yeni Araştırma
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10"
                    onClick={() => {
                      const checklistSummary = relocationData?.checklist?.map((c: any) => `${c.done ? "✅" : "⬜"} ${c.item} — ${c.cost}`).join("\n") || "";
                      const surveyContent = `Hedef: ${survey.targetCountry} ${survey.targetCity || ""}\nMeslek: ${survey.profession}\nAile: ${survey.familyStatus}\nTecrübe: ${survey.userExperience}`;
                      const costsContent = `Maaş: ${relocationData?.avgSalary || "—"}\nKira: ${relocationData?.rent || "—"}\nMarket: ${relocationData?.groceries || "—"}\nUlaşım: ${relocationData?.transport || "—"}\nSigorta: ${relocationData?.insurance || "—"}\nToplam: ${relocationData?.totalMonthly || "—"}\nTaşınma bütçesi: ${relocationData?.movingBudget || "—"}`;
                      const chatContent = messages.filter(m => m.role === "assistant").map(m => m.content).join("\n\n---\n\n");
                      const fullReport = `📋 ANKET\n${surveyContent}\n\n💰 MALİYETLER\n${costsContent}\n\n✅ CHECKLİST\n${checklistSummary}\n\n💬 SOHBET GEÇMİŞİ\n${chatContent}`;
                      const docTitle = `📊 Tam Rapor — ${survey.targetCountry}${survey.targetCity ? ` / ${survey.targetCity}` : ""} — ${new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`;
                      setSavedDocs(prev => [...prev, { title: docTitle, content: fullReport, type: "report" as const, date: new Date().toLocaleDateString("tr-TR") }]);
                      toast({ title: "Kaydedildi! 📁", description: "Tüm rapor dökümanlarınıza eklendi." });
                    }}
                  >
                    <Download className="h-3.5 w-3.5" /> Dökümanlara Kaydet
                  </Button>
                </div>
              </div>

              {/* CHECKLIST TAB */}
              <TabsContent value="checklist" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckSquare className="h-5 w-5 text-primary" />
                      Taşınma Checklist'i
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {relocationData?.checklist?.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={item.done}
                            onCheckedChange={(checked) => {
                              setRelocationData((prev: any) => ({
                                ...prev,
                                checklist: prev.checklist.map((c: any, ci: number) =>
                                  ci === i ? { ...c, done: !!checked } : c
                                )
                              }));
                            }}
                          />
                          <span className={`text-sm ${item.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {item.item}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">{item.cost}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">💰</span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Tahmini Taşınma Bütçesi</p>
                        <p className="text-xl font-extrabold text-primary">{relocationData?.movingBudget}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* REQUIRED DOCUMENTS TAB */}
              <TabsContent value="documents" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      📄 {survey.targetCountry} İçin Gerekli Belgeler
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Apostil, noter tasdiki ve yeminli tercüme gereksinimlerini kontrol edin. Hazırladıklarınızı işaretleyin.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(() => {
                      const docs = relocationData?.requiredDocs || [];
                      const categories = [...new Set(docs.map((d: any) => d.category))] as string[];
                      return categories.map((cat: string) => (
                        <div key={cat} className="mb-4">
                          <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                            {cat === "Kimlik" && "🪪"}
                            {cat === "Eğitim" && "🎓"}
                            {cat === "Resmi" && "🏛️"}
                            {cat === "İş" && "💼"}
                            {cat === "Sağlık" && "🏥"}
                            {cat === "Mali" && "💰"}
                            {cat === "Konut" && "🏠"}
                            {cat}
                          </h3>
                          <div className="space-y-2">
                            {docs
                              .map((d: any, idx: number) => ({ ...d, _idx: idx }))
                              .filter((d: any) => d.category === cat)
                              .map((item: any) => (
                                <div
                                  key={item._idx}
                                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                >
                                  <Checkbox
                                    checked={item.done}
                                    onCheckedChange={(checked) => {
                                      setRelocationData((prev: any) => ({
                                        ...prev,
                                        requiredDocs: prev.requiredDocs.map((d: any, i: number) =>
                                          i === item._idx ? { ...d, done: !!checked } : d
                                        ),
                                      }));
                                    }}
                                    className="mt-0.5"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <span className={`text-sm font-medium ${item.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                      {item.doc}
                                    </span>
                                    <p className="text-xs text-muted-foreground mt-0.5">{item.note}</p>
                                  </div>
                                  {item.done && (
                                    <Badge className="bg-success/10 text-success border-success/20 text-xs shrink-0">✓ Hazır</Badge>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </CardContent>
                </Card>

                {/* Progress summary */}
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📋</span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Belge Hazırlık Durumu</p>
                          <p className="text-xs text-muted-foreground">
                            {relocationData?.requiredDocs?.filter((d: any) => d.done).length || 0} / {relocationData?.requiredDocs?.length || 0} belge hazır
                          </p>
                        </div>
                      </div>
                      <div className="text-xl font-extrabold text-primary">
                        %{Math.round(((relocationData?.requiredDocs?.filter((d: any) => d.done).length || 0) / (relocationData?.requiredDocs?.length || 1)) * 100)}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20">
                  <CardContent className="pt-6">
                    <div className="flex gap-3">
                      <span className="text-lg shrink-0">⚠️</span>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p className="font-semibold text-foreground text-sm">Önemli Notlar</p>
                        <p>• Apostil tasdiki için Valilik veya Kaymakamlık'a başvurun</p>
                        <p>• Yeminli tercümeler noter onaylı olmalıdır</p>
                        <p>• Bazı belgeler son 3-6 ay içinde alınmış olmalıdır</p>
                        <p>• Konsolosluk randevusu öncesinde tüm belgeleri hazır bulundurun</p>
                        <p>• Her belgenin en az 2 fotokopisini yanınızda taşıyın</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* COSTS TAB */}
              <TabsContent value="costs" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      Aylık Yaşam Masrafları Dökümü
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { icon: "🏠", label: "Kira", value: relocationData?.rent },
                        { icon: "🛒", label: "Market/Gıda", value: relocationData?.groceries },
                        { icon: "🚇", label: "Ulaşım", value: relocationData?.transport },
                        { icon: "🏥", label: "Sağlık Sigortası", value: relocationData?.insurance },
                        { icon: "💡", label: "Faturalar", value: relocationData?.utilities },
                        ...(survey.familyStatus === "family" ? [{ icon: "👶", label: "Çocuk Bakım/Okul", value: relocationData?.childcare }] : []),
                      ].map((row, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <span className="text-sm text-foreground flex items-center gap-2">
                            <span>{row.icon}</span> {row.label}
                          </span>
                          <span className="text-sm font-semibold text-foreground">{row.value}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <span className="text-sm font-bold text-foreground">📊 Toplam Aylık</span>
                        <span className="text-lg font-extrabold text-primary">{relocationData?.totalMonthly}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Income Estimates */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-success" />
                      Tahmini Gelir Aralığı
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/20">
                      <div>
                        <p className="text-sm font-semibold text-foreground">👤 {survey.profession}</p>
                        <p className="text-xs text-muted-foreground">{survey.userExperience || "Tecrübe belirtilmedi"}</p>
                      </div>
                      <span className="text-lg font-extrabold text-success">{relocationData?.avgSalary}</span>
                    </div>
                    {survey.spouseWorking === "yes" && survey.spouseProfession && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-turquoise/5 border border-turquoise/20">
                        <div>
                          <p className="text-sm font-semibold text-foreground">👤 {survey.spouseProfession} (Eş)</p>
                          <p className="text-xs text-muted-foreground">{survey.spouseExperience || "Tecrübe belirtilmedi"}</p>
                        </div>
                        <span className="text-lg font-extrabold text-turquoise">€2,800 - €4,200/ay</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <span className="text-sm font-bold text-foreground">💰 Toplam Hane Geliri (tahmini)</span>
                      <span className="text-xl font-extrabold text-primary">
                        {survey.spouseWorking === "yes" ? "€6,300 - €9,700/ay" : relocationData?.avgSalary}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* JOBS TAB */}
              <TabsContent value="jobs" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      {survey.profession} - İlgili İş Fırsatları
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { title: `Senior ${survey.profession}`, company: "TechCorp GmbH", location: survey.targetCountry, salary: "€55,000-75,000/yıl" },
                      { title: `${survey.profession} (m/w/d)`, company: "InnovateTech", location: survey.targetCountry, salary: "€48,000-65,000/yıl" },
                      { title: `Lead ${survey.profession}`, company: "Digital Solutions AG", location: survey.targetCountry, salary: "€70,000-90,000/yıl" },
                    ].map((job, i) => (
                      <div key={i} className="p-4 rounded-lg border border-border hover:border-primary/30 transition-colors">
                        <h4 className="font-semibold text-foreground text-sm">{job.title}</h4>
                        <p className="text-xs text-muted-foreground">{job.company} • {job.location}</p>
                        <Badge className="mt-2 bg-success/10 text-success text-xs">{job.salary}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {survey.spouseWorking === "yes" && survey.spouseProfession && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">💼 {survey.spouseProfession} - Eş İçin İlanlar</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {[
                        { title: `${survey.spouseProfession}`, company: "HealthPlus GmbH", salary: "€40,000-55,000/yıl" },
                        { title: `Senior ${survey.spouseProfession}`, company: "CareTech AG", salary: "€50,000-65,000/yıl" },
                      ].map((job, i) => (
                        <div key={i} className="p-4 rounded-lg border border-border hover:border-turquoise/30 transition-colors">
                          <h4 className="font-semibold text-foreground text-sm">{job.title}</h4>
                          <p className="text-xs text-muted-foreground">{job.company} • {survey.targetCountry}</p>
                          <Badge className="mt-2 bg-turquoise/10 text-turquoise text-xs">{job.salary}</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Bölgedeki Danışmanlar */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">🧑‍💼 Bölgedeki Danışmanlar</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { name: "Mehmet Yılmaz", type: "Vize & Göçmenlik", rating: 4.8, avatar: "🛂" },
                      { name: "Ayşe Demir", type: "Gayrimenkul", rating: 4.9, avatar: "🏠" },
                      { name: "Can Öztürk", type: "Taşınma & Relokasyon", rating: 4.7, avatar: "📦" },
                      { name: "Zeynep Kaya", type: "Eğitim & Okul Danışmanı", rating: 4.6, avatar: "🎓" },
                    ].map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{c.avatar}</span>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.type}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">⭐ {c.rating}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* İş & Mesleki Dernekler */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">🏛️ İş & Mesleki Kuruluşlar</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { name: `Türk-${survey.targetCountry === "Almanya" ? "Alman" : survey.targetCountry} Ticaret Odası`, members: 1250, type: "İş Örgütü" },
                      { name: `${survey.targetCountry} Türk İşadamları Derneği`, members: 890, type: "Dernek" },
                      { name: `Türk Mühendisler Birliği - ${survey.targetCountry}`, members: 430, type: "Mesleki" },
                    ].map((a, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{a.name}</p>
                          <p className="text-xs text-muted-foreground">{a.type} • {a.members} üye</p>
                        </div>
                        <Button variant="outline" size="sm" className="text-xs">Detay →</Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* WhatsApp & Alumni Grupları */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">💬 WhatsApp & Alumni Grupları</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { name: `${survey.targetCountry} Türkler`, members: 2500, type: "whatsapp", icon: "💬" },
                      { name: `${survey.targetCity || survey.targetCountry} İş Arayanlar`, members: 890, type: "whatsapp", icon: "💼" },
                      { name: `Boğaziçi Alumni - ${survey.targetCountry}`, members: 340, type: "alumni", icon: "🎓" },
                      { name: `ODTÜ Mezunlar - ${survey.targetCountry}`, members: 280, type: "alumni", icon: "🎓" },
                      { name: `İTÜ ${survey.targetCountry} Grubu`, members: 195, type: "alumni", icon: "🎓" },
                    ].map((g, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{g.icon}</span>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{g.name}</p>
                            <p className="text-xs text-muted-foreground">{g.members} üye</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">{g.type === "alumni" ? "Alumni" : "WhatsApp"}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">🏢 Corteqs'teki İşletmeler</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {survey.targetCountry}'daki Türk işletmelerini ve çalışan arayan şirketleri keşfedin.
                    </p>
                    <Button variant="outline" className="mt-3" size="sm" onClick={() => window.location.href = "/businesses"}>
                      İşletmeleri Görüntüle →
                    </Button>
                  </CardContent>
                </Card>

                {/* Blog Yazıları */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      📝 Blog Yazıları — {survey.targetCountry}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { id: "1", title: `${survey.targetCountry}'da İş Bulma Rehberi 2026`, author: "Selin Aydın", avatar: "✍️", date: "12 Mar 2026", reads: "3.2K", bloggerId: "1" },
                      { id: "2", title: `${survey.targetCity || survey.targetCountry}'da Yaşam Maliyetleri: Gerçek Rakamlar`, author: "Emre Koç", avatar: "📊", date: "8 Mar 2026", reads: "2.8K", bloggerId: "2" },
                      { id: "3", title: `${survey.targetCountry}'ya Taşınırken Yaptığım 5 Hata`, author: "Deniz Özkan", avatar: "🎯", date: "1 Mar 2026", reads: "5.1K", bloggerId: "3" },
                      { id: "4", title: `${survey.targetCountry} Vize Süreci: Adım Adım Anlatım`, author: "Burcu Şahin", avatar: "🛂", date: "25 Şub 2026", reads: "4.5K", bloggerId: "4" },
                    ].map((post) => (
                      <Link key={post.id} to={`/blogger/${post.bloggerId}`} className="block p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/50 transition-all">
                        <div className="flex items-start gap-3">
                          <span className="text-lg mt-0.5">{post.avatar}</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-foreground hover:text-primary transition-colors">{post.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">{post.author}</span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">{post.date}</span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">{post.reads} okunma</span>
                            </div>
                          </div>
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1" />
                        </div>
                      </Link>
                    ))}
                    <Link to="/bloggers">
                      <Button variant="outline" size="sm" className="w-full mt-2">Tüm Blog Yazılarını Gör →</Button>
                    </Link>
                  </CardContent>
                </Card>

                {/* Vloggerlar */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Star className="h-5 w-5 text-gold" />
                      🎥 Vlogger & Bloggerlar — {survey.targetCountry}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { id: "1", name: "Elif Güneş", niche: `${survey.targetCountry}'da Yaşam`, followers: "45K", platform: "YouTube", avatar: "🎬", rating: 4.9 },
                      { id: "2", name: "Murat Avcı", niche: "Göçmenlik & Vize", followers: "32K", platform: "Instagram", avatar: "📸", rating: 4.8 },
                      { id: "3", name: "Zehra Yıldız", niche: `${survey.targetCity || survey.targetCountry} Gastronomi`, followers: "28K", platform: "TikTok", avatar: "🍽️", rating: 4.7 },
                      { id: "4", name: "Ali Demir", niche: "Kariyer & İş Hayatı", followers: "51K", platform: "YouTube", avatar: "💼", rating: 4.9 },
                    ].map((inf) => (
                      <Link key={inf.id} to={`/blogger/${inf.id}`} className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-gold/30 hover:bg-muted/50 transition-all">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{inf.avatar}</span>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{inf.name}</p>
                            <p className="text-xs text-muted-foreground">{inf.niche} • {inf.platform}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{inf.followers}</Badge>
                          <Badge variant="outline" className="text-xs bg-gold/10 text-gold border-gold/20">⭐ {inf.rating}</Badge>
                        </div>
                      </Link>
                    ))}
                    <Link to="/bloggers">
                      <Button variant="outline" size="sm" className="w-full mt-2">Tüm Vloggerları Gör →</Button>
                    </Link>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SCHOOLS TAB */}
              <TabsContent value="schools" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      Okul & Eğitim Seçenekleri
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {relocationData?.schools?.map((school: string, i: number) => (
                      <div key={i} className="p-3 rounded-lg bg-muted/50 flex items-center gap-3">
                        <span className="text-lg">🎓</span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{school}</p>
                          <p className="text-xs text-muted-foreground">Uluslararası okul • İngilizce eğitim</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Eğitim Danışmanları */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">🧑‍🏫 Eğitim Danışmanları</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {[
                      { name: "Dr. Elif Arslan", specialty: "Uluslararası okul danışmanlığı", rating: 4.9 },
                      { name: "Burak Şen", specialty: "Üniversite kabul & denklik", rating: 4.7 },
                    ].map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.specialty}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">⭐ {c.rating}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>

              </TabsContent>

              {/* WELCOME PACK TAB */}
              <TabsContent value="welcome-pack" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Gift className="h-5 w-5 text-primary" />
                      Hoşgeldin Paketi
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Yeni şehrinize varışınızı kolaylaştıracak hizmetleri tek bir pakette toplayın.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <WelcomePackOrderForm
                      trigger={
                        <Button variant="hero" size="lg" className="w-full gap-2">
                          <Gift className="h-5 w-5" />
                          🎁 Hoşgeldin Paketi Oluştur
                        </Button>
                      }
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SAVED DOCS TAB */}
              <TabsContent value="saved" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Relocation Dökümanlarım
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {savedDocs.length === 0 ? (
                      <div className="text-center py-8">
                        <span className="text-4xl mb-3 block">📁</span>
                        <p className="text-sm text-muted-foreground">
                          Henüz kayıtlı döküman yok.<br />
                          Sohbetteki mesajlarda "Profilde sakla" butonunu kullanarak buraya kaydedin.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {savedDocs.map((doc, i) => (
                          <div key={i} className="p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
                            <div className="flex items-start gap-3">
                              <span className="text-lg shrink-0">
                                {doc.type === "report" ? "📊" : doc.type === "checklist" ? "📋" : "💬"}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground">{doc.title}</p>
                                <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line line-clamp-3">{doc.content}</p>
                                <p className="text-xs text-muted-foreground/60 mt-2">{doc.date}</p>
                              </div>
                              <Badge variant="outline" className="text-xs shrink-0">
                                {doc.type === "report" ? "Rapor" : doc.type === "checklist" ? "Checklist" : "Not"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelocationEngine;
