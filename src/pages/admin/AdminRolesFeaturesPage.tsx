import { useEffect, useMemo, useState } from "react";

import AdminPageGuideAccordion, { type AdminPageGuideSection } from "@/components/admin/AdminPageGuideAccordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { setFeatureGlobalStateAsAdmin, setRoleFeatureFlagAsAdmin } from "@/lib/admin";
import { getFeatureMeta } from "@/lib/features";
import { ChevronDown } from "lucide-react";

type RoleRow = {
  id: string;
  key: string;
  label: string;
  sort_order: number;
  is_active: boolean;
};

type FeatureCatalogRow = {
  key: string;
  label: string;
  description: string | null;
  scope_role: string;
  is_active_globally: boolean;
};

type RoleFeatureFlagRow = {
  role_id: string;
  feature_key: string;
  is_enabled: boolean;
};

type FeatureDetail = {
  summary: string;
  effect: string;
  adminHint: string;
};

const DASHBOARD_FEATURE_COPY: Record<string, FeatureDetail> = {
  "dashboard.tab_profil_ayarlari": {
    summary: "Kullanıcının dashboard içindeki profil ayarları sekmesini görmesini sağlar.",
    effect: "Açık olduğunda profil bilgileri, görünürlük ve kişisel ayarlarla ilgili alanlara erişebilir.",
    adminHint: "Dashboard kullanan tüm temel roller için genelde açık tutulur.",
  },
  "dashboard.tab_mesaj_kutusu": {
    summary: "Kullanıcının dashboard üzerinden mesaj kutusuna erişmesini sağlar.",
    effect: "Açık olduğunda gelen mesajları görebilir ve ilgili mesajlaşma akışlarını kullanabilir.",
    adminHint: "Mesajlaşma deneyimi aktif olan roller için açık tutulması beklenir.",
  },
  "dashboard.tab_takip_ettiklerim": {
    summary: "Kullanıcının takip ettiği kişi veya bağlantıları dashboard içinde görmesini sağlar.",
    effect: "Açık olduğunda takip listesi ve ilişkili takip akışları erişilebilir olur.",
    adminHint: "Topluluk ilişkileri önemliyse bu sekmenin açık olması faydalıdır.",
  },
  "dashboard.tab_etkinlikler": {
    summary: "Kullanıcının dashboard içindeki etkinlikler sekmesine erişmesini sağlar.",
    effect: "Açık olduğunda katıldığı veya yönettiği etkinliklerle ilgili ekranlara ulaşabilir.",
    adminHint: "Etkinlik akışını kullanan roller için varsayılan olarak açık olabilir.",
  },
  "dashboard.tab_whatsapp": {
    summary: "Kullanıcının dashboard üzerinden WhatsApp ile ilgili sekmeye erişmesini sağlar.",
    effect: "Açık olduğunda WhatsApp grup veya bağlantı modülleri dashboard içinde görünür.",
    adminHint: "Henüz sınırlı kullanılan bir alan ise sadece hazır rollerde açılmalıdır.",
  },
  "dashboard.tab_analitik": {
    summary: "Kullanıcının dashboard içindeki analitik ve performans özetlerini görmesini sağlar.",
    effect: "Açık olduğunda rolüne uygun metrikler, performans veya görünürlük verileri gösterilebilir.",
    adminHint: "Daha çok consultant, business veya içerik üreten roller için anlamlıdır.",
  },
  "dashboard.admin_onizleme_modu": {
    summary: "Adminin kullanıcı dashboard deneyimini önizleme amaçlı açmasını sağlar.",
    effect: "Açık olduğunda admin tarafında kontrollü bir önizleme veya test modu kullanılabilir.",
    adminHint: "Normal kullanıcı rollerinde değil, yalnızca operasyon ihtiyacı olan hesaplarda açık tutulmalıdır.",
  },
};

const FEATURE_DETAILS: Record<string, FeatureDetail> = {
  "individual.about": {
    summary: "Bireysel profilin Hakkında veya kısa tanıtım alanını görünür kılar.",
    effect: "Açık olduğunda kullanıcının biyografi, kısa tanıtım ve kişisel özet içeriği ilgili modülde gösterilebilir.",
    adminHint: "Bireysel profilin temel anlatısı olduğu için çoğu senaryoda açık tutulur.",
  },
  "individual.service_requests": {
    summary: "Bireysel kullanıcının hizmet talepleri veya ihtiyaç alanını gösterir.",
    effect: "Açık olduğunda kullanıcının hangi konuda destek aradığı veya talep bıraktığı alanlar görünür hale gelir.",
    adminHint: "Talep toplama akışı aktif değilse kapalı kalabilir; aktifse bireysel kullanıcı için anlamlıdır.",
  },
  "individual.events": {
    summary: "Bireysel kullanıcı için etkinlik modülünü görünür kılar.",
    effect: "Açık olduğunda kullanıcının katıldığı, takip ettiği veya ilişkilendirildiği etkinlik alanları gösterilebilir.",
    adminHint: "Topluluk katılımını artırmak için çoğu bireysel kullanıcıda açık olması faydalıdır.",
  },
  "individual.follows": {
    summary: "Bireysel kullanıcının takip ettiği kişi veya yapıların görünmesini sağlar.",
    effect: "Açık olduğunda takip ilişkileri, bağlantılar veya takip listesi modül içinde sunulabilir.",
    adminHint: "Sosyal ağ hissi isteniyorsa açık tutulur; daha sade deneyimde kapatılabilir.",
  },
  "individual.whatsapp": {
    summary: "Bireysel profil içindeki WhatsApp veya grup bağlantısı alanını açar.",
    effect: "Açık olduğunda kullanıcıya ait WhatsApp/grup modülü ilgili yerde görüntülenebilir.",
    adminHint: "İletişim gizliliği önemliyse dikkatli açılmalı; her kullanıcı için zorunlu değildir.",
  },
  "individual.messages": {
    summary: "Bireysel kullanıcıya mesajlaşma modülü erişimi verir.",
    effect: "Açık olduğunda kullanıcı mesaj kutusu, konuşmalar veya bire bir iletişim akışlarını kullanabilir.",
    adminHint: "Platform içi iletişim aktifse açık tutulur; henüz devrede değilse kapalı bırakılabilir.",
  },
  "individual.activity": {
    summary: "Bireysel kullanıcının son aktivitelerini veya akışını görünür kılar.",
    effect: "Açık olduğunda profil veya panel içinde son hareketler ve etkinlik geçmişi sunulabilir.",
    adminHint: "Canlı topluluk hissi için faydalıdır; boş görünüm riski varsa kontrollü açılabilir.",
  },
  "individual.cv_request": {
    summary: "Bireysel kullanıcı için CV talebi veya özgeçmiş paylaşım modülünü açar.",
    effect: "Açık olduğunda diğer kullanıcılar ya da ilgili taraflar CV isteme akışına erişebilir.",
    adminHint: "Özellikle profesyonel görünürlük beklenen bireysel kullanıcılar için değerlidir.",
  },
  "admin.requires_approval": {
    summary: "Kullanıcının ilgili işlemi tek başına tamamlaması yerine admin onay akışına düşmesini sağlar.",
    effect: "Açık olduğunda rolün bazı değişiklikleri doğrudan uygulanmaz; önce onay bekler.",
    adminHint: "Daha kontrollü ilerlemesi gereken roller için açık tutulur.",
  },
  "city.manage": {
    summary: "Kullanıcıya şehir bazlı yönetim veya moderasyon alanlarına erişim verme hazırlığıdır.",
    effect: "Açıldığında şehir yönetimiyle ilgili akışlar bu rol için kullanılabilir hale gelir.",
    adminHint: "Şu an daha sınırlı bir alan olduğu için sadece gerçekten yetkili roller için açılmalı.",
  },
  "contact.receive": {
    summary: "Kullanıcının platform üzerinden gelen iletişim veya iş birliği taleplerini almasını sağlar.",
    effect: "Açık olduğunda profil veya ilgili kart üzerinden kullanıcıya temas kurulabilir.",
    adminHint: "İletişim almak istemeyen ya da hazır olmayan roller için kapalı bırakılabilir.",
  },
  "contact.show_whatsapp": {
    summary: "Kullanıcının WhatsApp bilgisini görünür hale getirme yetkisidir.",
    effect: "Açık olduğunda kullanıcı iletişim bilgisini daha doğrudan paylaşabilir.",
    adminHint: "Mahremiyet açısından her rolde açık olmak zorunda değildir.",
  },
  "content.create": {
    summary: "Kullanıcının içerik, post veya paylaşım oluşturma akışına girmesini sağlar.",
    effect: "Açık olduğunda bu rol içerik üretmeye başlayabilir.",
    adminHint: "Toplulukta aktif içerik üretmesi beklenen roller için açık tutulur.",
  },
  "content.edit_own": {
    summary: "Kullanıcının kendi oluşturduğu içerikleri sonradan düzenleyebilmesini sağlar.",
    effect: "Açık olduğunda kendi postlarını güncelleyebilir veya iyileştirebilir.",
    adminHint: "İçerik üreten roller için genelde `İçerik Oluştur` ile birlikte değerlendirilir.",
  },
  "directory.visible": {
    summary: "Kullanıcının public directory içinde listelenebilmesini kontrol eder.",
    effect: "Açık olduğunda profil arama ve listeleme alanlarında görünür olabilir.",
    adminHint: "Directory görünürlüğü ürün içinde keşfedilme açısından kritik bir ayardır.",
  },
  "directory.featured": {
    summary: "Kullanıcının directory içinde öne çıkarılmış şekilde gösterilmesini sağlar.",
    effect: "Açık olduğunda standart listelenmeden daha görünür bir sunum mümkün olur.",
    adminHint: "Her rol için açık tutulması gerekmez; daha seçilmiş kullanım içindir.",
  },
  "events.create": {
    summary: "Kullanıcının etkinlik oluşturma akışına erişebilmesini sağlar.",
    effect: "Açık olduğunda bu rol yeni etkinlik başlatabilir veya yayınlayabilir.",
    adminHint: "Operasyonel yük doğurabileceği için sınırlı açılması daha güvenlidir.",
  },
  "offers.create": {
    summary: "Kullanıcının teklif, hizmet veya iş fırsatı oluşturmasını sağlar.",
    effect: "Açık olduğunda rol yeni teklif kayıtları açabilir.",
    adminHint: "Ticari veya profesyonel roller için anlamlıdır; herkese açık olması gerekmez.",
  },
  "profile.edit_own": {
    summary: "Kullanıcının kendi profil alanlarını düzenleme yetkisidir.",
    effect: "Açık olduğunda kullanıcı temel profil bilgilerini güncelleyebilir.",
    adminHint: "Genel olarak çoğu rolde açık olur; kapatılması daha kısıtlayıcı bir tercih olur.",
  },
  "profile.edit_public": {
    summary: "Kullanıcının dışarıdan görünen public profil alanlarını yönetmesini sağlar.",
    effect: "Açık olduğunda görünür metinler, açıklamalar ve benzeri alanlar düzenlenebilir.",
    adminHint: "Kamusal görünüm üzerindeki kontrol bu feature ile verilir.",
  },
  "profile.view_own": {
    summary: "Kullanıcının kendi profil ekranını açıp görebilmesini sağlar.",
    effect: "Açık olduğunda kullanıcı profilini görüntüleyebilir.",
    adminHint: "Temel bir erişim olduğu için çoğu rolde açık tutulur.",
  },
  "referral.create": {
    summary: "Kullanıcının referral başlatma veya referral üretme akışına erişmesini sağlar.",
    effect: "Açık olduğunda referral mekanizmasını kullanabilir.",
    adminHint: "Her rol için gerekli olmayabilir; büyüme veya topluluk katkısı beklenen rollerde daha anlamlıdır.",
  },
};

const humanizeFeatureKey = (featureKey: string) => {
  return featureKey
    .split(".")
    .map((segment) =>
      segment
        .split("_")
        .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
        .join(" "),
    )
    .join(" / ");
};

const getFallbackFeatureDescription = (feature: FeatureCatalogRow) => {
  const featureKey = feature.key.trim();

  if (featureKey.startsWith("dashboard.tab_")) {
    return "Kullanıcının ilgili dashboard sekmesini görmesini ve kullanmasını kontrol eder";
  }

  if (featureKey === "dashboard.admin_onizleme_modu") {
    return "Admin tarafında dashboard önizleme moduna erişimi kontrol eder";
  }

  if (featureKey.startsWith("individual.")) {
    return "Bireysel kullanıcı deneyimindeki ilgili modülün görünürlüğünü ve erişimini kontrol eder";
  }

  if (featureKey.startsWith("profile.")) {
    return "Profil tarafındaki ilgili yetki veya görünürlük alanını kontrol eder";
  }

  if (featureKey.startsWith("directory.")) {
    return "Directory içinde görünürlük ve öne çıkarma davranışını kontrol eder";
  }

  if (featureKey.startsWith("contact.")) {
    return "İletişim ve kullanıcıya erişim akışlarını kontrol eder";
  }

  if (featureKey.startsWith("content.")) {
    return "İçerik üretimi ve içerik yönetimi yetkisini kontrol eder";
  }

  if (featureKey.startsWith("events.")) {
    return "Etkinlik ile ilgili oluşturma veya erişim yetkisini kontrol eder";
  }

  if (featureKey.startsWith("offers.")) {
    return "Teklif veya hizmet oluşturma akışına erişimi kontrol eder";
  }

  if (featureKey.startsWith("referral.")) {
    return "Referral akışını başlatma veya yönetme yetkisini kontrol eder";
  }

  if (featureKey.startsWith("city.")) {
    return "Şehir bazlı yönetim ve yerel operasyon erişimini kontrol eder";
  }

  if (featureKey.startsWith("admin.")) {
    return "Admin onayı veya operasyon kontrolü gerektiren akışı tanımlar";
  }

  return `${feature.label || humanizeFeatureKey(featureKey)} için erişim davranışını kontrol eder`;
};

const guideSections: AdminPageGuideSection[] = [
  {
    title: "Bu ekran ne için kullanılır?",
    items: [
      "Bu ekran, hangi rolün hangi özelliği kullanabileceğini belirlediğin ana yetki ekranıdır.",
      "Satırlar feature'ları, sütunlar rolleri temsil eder. Böylece tek bakışta hangi rolün neye eriştiği görülür.",
      "Bir özellik kullanıcıda çalışmıyorsa veya gereksiz açık görünüyorsa çoğu zaman sebep bu matrix içindedir.",
      "Bu ekran yalnızca gerçek capability ve dashboard erişimlerini yönetir; profil kart parçaları ve taxonomy seçenekleri burada yönetilmez.",
    ],
  },
  {
    title: "Adım adım nasıl kullanılır?",
    items: [
      "1. Önce ilgili feature satırını bul. Satırın solunda feature adı, key'i ve kısa açıklaması görünür.",
      "2. Aynı satırdaki `Global` alanına bak. Burasi kapalıysa feature genel olarak çalışmaz.",
      "3. Feature herkeste çalışsın istiyorsan önce `Global` alanını aç.",
      "4. Sonra ilgili rol sütunundaki switch'i açarak sadece o role izin ver veya kapatarak rolü engelle.",
      "5. Scope badge'lerine bakarak feature'ın normalde hangi rol ailesi için tasarlandığını da kontrol et.",
      "6. Eğer sorun dashboard sekmesi değil profil görünümüyle ilgiliyse bu ekranda vakit kaybetmeden `Profile Sections` ekranına geç.",
    ],
  },
  {
    title: "Hangi durumda ne yapmalısın?",
    items: [
      "Sorun bir rolün tamamını etkiliyorsa düzeltmeyi burada yap.",
      "Sorun sadece tek kullanıcıdaysa burada matrixi bozma; `Feature Override` ekranına git.",
      "Global kapalı ama rol açık durumunda kullanıcı yine özelliği kullanamaz; önce global durumu çöz.",
      "Sorun alan zorunluluğu veya public görünürlük ise `Attribute Yönetimi`, sınıflandırma veya alt tip ise `Taxonomy Yönetimi` kullan.",
    ],
  },
  {
    title: "Kaydettikten sonra ne kontrol etmelisin?",
    items: [
      "Switch değişince toast mesajı geldi mi kontrol et.",
      "Yanlış rolü açmadığından emin olmak için aynı feature satırındaki diğer rol sütunlarına da hızlı bak.",
      "Bir kullanıcı yine farklı davranıyorsa o kullanıcı için override kaydı olup olmadığını ayrıca kontrol et.",
      "Yeni `dashboard.*` feature'larında, kullanıcı profil ekranındaki `Açık Dashboard Erişimleri` bölümünden sonucu karşılaştırabilirsin.",
    ],
  },
];

const AdminRolesFeaturesPage = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [features, setFeatures] = useState<FeatureCatalogRow[]>([]);
  const [flagMap, setFlagMap] = useState<Record<string, Record<string, boolean>>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      setIsLoading(true);
      setErrorMessage(null);

      const [rolesResult, featuresResult, flagsResult] = await Promise.all([
        supabase.from("roles").select("id, key, label, sort_order, is_active").eq("is_active", true).order("sort_order"),
        supabase.from("feature_catalog").select("key, label, description, scope_role, is_active_globally").order("key"),
        supabase.from("role_feature_flags").select("role_id, feature_key, is_enabled"),
      ]);

      if (!isMounted) return;

      if (rolesResult.error || featuresResult.error || flagsResult.error) {
        setErrorMessage(rolesResult.error?.message ?? featuresResult.error?.message ?? flagsResult.error?.message ?? "Bilinmeyen hata");
        setIsLoading(false);
        return;
      }

      const roleRows = (rolesResult.data ?? []) as RoleRow[];
      const featureRows = (featuresResult.data ?? []) as FeatureCatalogRow[];
      const nextFlagMap: Record<string, Record<string, boolean>> = {};
      for (const role of roleRows) {
        nextFlagMap[role.id] = {};
      }
      for (const row of (flagsResult.data ?? []) as RoleFeatureFlagRow[]) {
        if (!nextFlagMap[row.role_id]) nextFlagMap[row.role_id] = {};
        nextFlagMap[row.role_id][row.feature_key] = row.is_enabled;
      }

      setRoles(roleRows);
      setFeatures(featureRows);
      setFlagMap(nextFlagMap);
      setIsLoading(false);
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const roleByKey = useMemo(() => {
    return new Map(roles.map((role) => [role.key, role]));
  }, [roles]);

  const matrixFeatures = useMemo(() => {
    const uniqueByKey = new Map<string, FeatureCatalogRow>();
    for (const feature of features) {
      if (!uniqueByKey.has(feature.key)) {
        uniqueByKey.set(feature.key, feature);
      }
    }
    return Array.from(uniqueByKey.values());
  }, [features]);

  const getFeatureDetail = (feature: FeatureCatalogRow) => {
    const detailed = FEATURE_DETAILS[feature.key] ?? DASHBOARD_FEATURE_COPY[feature.key];
    const meta = getFeatureMeta(feature.key);
    const databaseDescription = feature.description?.trim();

    return {
      label: meta?.label ?? feature.label,
      shortDescription: meta?.description ?? databaseDescription ?? getFallbackFeatureDescription(feature),
      details: detailed,
    };
  };

  const handleRoleToggle = async (role: RoleRow, featureKey: string, nextEnabled: boolean) => {
    const previous = flagMap[role.id]?.[featureKey] ?? false;
    setFlagMap((current) => ({
      ...current,
      [role.id]: { ...(current[role.id] ?? {}), [featureKey]: nextEnabled },
    }));
    setSavingKey(`${role.id}:${featureKey}`);
    try {
      await setRoleFeatureFlagAsAdmin(role.key, featureKey, nextEnabled);
      toast({
        title: "Rol feature güncellendi",
        description: `${role.label} için ${featureKey} ${nextEnabled ? "açıldı" : "kapatıldı"}.`,
      });
    } catch (error) {
      setFlagMap((current) => ({
        ...current,
        [role.id]: { ...(current[role.id] ?? {}), [featureKey]: previous },
      }));
      toast({
        title: "Rol feature güncellenemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSavingKey(null);
    }
  };

  const handleGlobalToggle = async (featureKey: string, nextEnabled: boolean) => {
    const previousFeatures = features;
    setFeatures((current) =>
      current.map((feature) => (feature.key === featureKey ? { ...feature, is_active_globally: nextEnabled } : feature)),
    );
    setSavingKey(`global:${featureKey}`);
    try {
      await setFeatureGlobalStateAsAdmin(featureKey, nextEnabled);
      toast({
        title: "Global feature durumu güncellendi",
        description: `${featureKey} ${nextEnabled ? "global açık" : "global kapalı"} yapıldı.`,
      });
    } catch (error) {
      setFeatures(previousFeatures);
      toast({
        title: "Global state güncellenemedi",
        description: error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="space-y-4">
      <AdminPageGuideAccordion
        summary="Feature'ların global ve rol bazlı açık-kapalı durumunu aynı matrixten yönetmek için bu ekran kullanılır."
        sections={guideSections}
      />
      <Card>
        <CardHeader>
          <CardTitle>New Member System - Rol / Feature Matrix</CardTitle>
          <CardDescription>
            Satır bazında feature, sütun bazında rol görünümü. Global durum ve role göre açık/kapalı durumu aynı ekranda yönetilir.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <p className="text-sm text-muted-foreground">Feature matrisi yükleniyor...</p> : null}
          {errorMessage ? <p className="text-sm text-destructive">Veri alınamadı: {errorMessage}</p> : null}

          {!isLoading && !errorMessage ? (
            <div className="overflow-x-auto rounded-xl border">
              <table className="min-w-[1100px] w-full table-fixed text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="w-[400px] px-3 py-3 text-left font-medium">Feature</th>
                    <th className="w-[120px] px-3 py-3 text-left font-medium">Global</th>
                    {roles.map((role) => (
                      <th key={role.id} className="w-[130px] px-3 py-3 text-left font-medium">
                        {role.label}
                        <p className="text-[11px] font-normal text-muted-foreground">{role.key}</p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrixFeatures.map((feature, index) => (
                    <tr
                      key={feature.key}
                      className={`align-top transition-colors ${index === 0 ? "" : "border-t"} ${index % 2 === 0 ? "bg-white" : "bg-muted/10"} hover:bg-muted/20`}
                    >
                      <td className="px-3 py-3 align-top">
                        {(() => {
                          const featureDetail = getFeatureDetail(feature);

                          return (
                            <div className="space-y-2">
                              <div className="space-y-1">
                                <p className="leading-5 font-medium text-foreground">{featureDetail.label}</p>
                                <p className="break-all text-[11px] leading-4 text-muted-foreground">{feature.key}</p>
                                <p className="text-[12px] leading-5 text-slate-600">{featureDetail.shortDescription}</p>
                              </div>
                              {featureDetail.details ? (
                                <Collapsible className="pt-1">
                                  <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-lg border border-border/80 bg-background/80 px-3 py-2 text-left text-[11px] font-medium text-slate-700 transition hover:bg-muted/40">
                                    <span>Açıklamayı Göster</span>
                                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition group-data-[state=open]:rotate-180" />
                                  </CollapsibleTrigger>
                                  <CollapsibleContent className="mt-2 rounded-lg border border-muted bg-muted/20 p-3 text-[11px] leading-5 text-muted-foreground">
                                    <div className="space-y-2">
                                      <p><span className="font-medium text-slate-700">Özet:</span> {featureDetail.details.summary}</p>
                                      <p><span className="font-medium text-slate-700">Etkisi:</span> {featureDetail.details.effect}</p>
                                      <p><span className="font-medium text-slate-700">Not:</span> {featureDetail.details.adminHint}</p>
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              ) : null}
                            </div>
                          );
                        })()}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {Array.from(new Set(features.filter((item) => item.key === feature.key).map((item) => item.scope_role))).map((scopeRole) => (
                            <Badge key={scopeRole} variant="outline" className="px-2 py-0 text-[10px] leading-4">
                              {roleByKey.get(scopeRole)?.label ?? scopeRole}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={feature.is_active_globally}
                            disabled={savingKey === `global:${feature.key}`}
                            onCheckedChange={(checked) => void handleGlobalToggle(feature.key, checked)}
                          />
                          <Badge variant={feature.is_active_globally ? "secondary" : "outline"}>
                            {feature.is_active_globally ? "Açık" : "Kapalı"}
                          </Badge>
                        </div>
                      </td>
                      {roles.map((role) => (
                        <td key={`${feature.key}-${role.id}`} className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={flagMap[role.id]?.[feature.key] ?? false}
                              disabled={savingKey === `${role.id}:${feature.key}`}
                              onCheckedChange={(checked) => void handleRoleToggle(role, feature.key, checked)}
                            />
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRolesFeaturesPage;
