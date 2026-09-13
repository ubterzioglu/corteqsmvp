import type { ReactNode } from "react";

export type GuideSection = {
  key: string;
  title: string;
  accentClassName: string;
  content: ReactNode;
};

/** "Yardım & Kılavuzlar" kartındaki statik akordeon içerikleri. */
export const PROFILE_GUIDE_SECTIONS: GuideSection[] = [
  {
    key: "guide-common",
    title: "Ortak Profil Alanları Kullanım Kılavuzu",
    accentClassName: "bg-[radial-gradient(circle_at_top_left,rgba(66,133,244,0.12),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.9),rgba(243,248,255,0.84))]",
    content: (
      <div className="space-y-2 text-xs text-muted-foreground">
        <p><strong className="text-foreground">Görünen İsim:</strong> Rehberde ve profil kartında gösterilecek adınız. Değişiklikler anında yansır.</p>
        <p><strong className="text-foreground">Ülke / Şehir:</strong> Konum bilgileriniz. Harita ve filtreleme için kullanılır. Görünürlük ayarını değiştirebilirsiniz.</p>
        <p><strong className="text-foreground">Profil Fotoğrafı:</strong> Yüklediğiniz görsel avatar ve public profil önizlemesinde birlikte kullanılır.</p>
        <p><strong className="text-foreground">Kısa Biyografi:</strong> Kendinizi tanıtan 1-2 cümlelik özet. Rehber listelemelerinde görünür.</p>
        <p><strong className="text-foreground">Görünürlük Ayarı:</strong> Her alan için <em>Görünür</em> veya <em>Gizli</em> seçebilirsiniz.</p>
        <p><strong className="text-foreground">Onay Süreci:</strong> Bazı alanlarda değişiklik yapıldığında admin onayı gerekir. Bu alanlar "Onaylı" etiketi ile işaretlenir.</p>
      </div>
    ),
  },
  {
    key: "guide-role",
    title: "Rolüne Özel Alanlar Kullanım Kılavuzu",
    accentClassName: "bg-[radial-gradient(circle_at_top_right,rgba(251,188,5,0.13),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(66,133,244,0.1),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,251,238,0.86))]",
    content: (
      <div className="space-y-2 text-xs text-muted-foreground">
        <p>Rolüne özel alanlar, aktif rolüne göre dinamik olarak belirlenir. Örneğin <strong className="text-foreground">Şehir Elçisi</strong> rolünde şehir bilgisi, <strong className="text-foreground">Influencer</strong> rolünde ana platform gibi alanlar görünebilir.</p>
        <p>Bu alanların bir kısmı admin onayı gerektirebilir. Onay gerektiren alanlarda değişiklik yapıldığında "Beklemede" durumu görünür ve admin onaylayana kadar public gösterilmez.</p>
        <p>Her alan için görünürlük ayarını değiştirebilirsin: <em>Görünür</em> veya <em>Gizli</em>. Referral alanları her zaman private tutulur.</p>
      </div>
    ),
  },
  {
    key: "guide-role-application",
    title: "Rol Başvurusu Kılavuzu",
    accentClassName: "bg-[radial-gradient(circle_at_top_left,rgba(52,168,83,0.13),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.9),rgba(241,248,242,0.86))]",
    content: (
      <div className="space-y-2 text-xs text-muted-foreground">
        <p>Her üyenin aynı anda sadece <strong className="text-foreground">bir aktif rolü</strong> olabilir. Açılır menüdeki roller güncel rol kataloğundan gelir; mevcut rolünüzden farklı bir role başvurmak için seçim yapın.</p>
        <p><strong className="text-foreground">Başvuru süreci:</strong> Başvurunuz admin onay kuyruğuna eklenir. Onaylanırsa yeni rolünüz aktifleşir ve eski rolünüz kaldırılır.</p>
        <p><strong className="text-foreground">Açıklama alanı:</strong> Başvurunuzu destekleyen kısa bir metin yazın. Bu not admin değerlendirmesinde kullanılır.</p>
        <p><strong className="text-foreground">Mevcut rolünüz:</strong> Profil kartındaki "Rol" etiketi mevcut aktif rolünüzü gösterir. Başvuru onaylanana kadar mevcut rolünüz değişmez.</p>
      </div>
    ),
  },
  {
    key: "guide-features",
    title: "Özellik Talepleri Kılavuzu",
    accentClassName: "bg-[radial-gradient(circle_at_top_right,rgba(251,188,5,0.15),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(234,67,53,0.08),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,249,232,0.88))]",
    content: (
      <div className="space-y-2 text-xs text-muted-foreground">
        <p><strong className="text-foreground">Rehber Görünürlüğü:</strong> Profilinizin halka açık rehberde görünmesini sağlar. Onaylandıktan sonra diğer üyeler sizi bulabilir.</p>
        <p><strong className="text-foreground">Öne Çıkarılmış Profil:</strong> Profil kartınız rehberde öne çıkarılır. Daha fazla görünürlük sağlar.</p>
        <p><strong className="text-foreground">WhatsApp Yayınlama:</strong> WhatsApp numaranızın profil kartınızda public olarak gösterilmesi için onay gerekir.</p>
        <p><strong className="text-foreground">Etkinlik Oluşturma:</strong> Platformda etkinlik yayınlama yetkisi talep edin.</p>
        <p><strong className="text-foreground">Teklif / Hizmet Oluşturma:</strong> Hizmet veya ürün tekliflerinizi yayınlama erişimi talep edin.</p>
        <p><strong className="text-foreground">Referral Oluşturma:</strong> Davet kodu oluşturarak yeni üye kazandırma erişimi talep edin.</p>
        <p><strong className="text-foreground">Talep Durumu:</strong> Her talebiniz admin onay sürecinden geçer. "Beklemede" etiketi göründüğünde talebiniz kuyruktadır.</p>
      </div>
    ),
  },
  {
    key: "guide-pending",
    title: "Bekleyen Talepler Kılavuzu",
    accentClassName: "bg-[radial-gradient(circle_at_top_left,rgba(234,67,53,0.1),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(66,133,244,0.08),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,249,250,0.88))]",
    content: (
      <div className="space-y-2 text-xs text-muted-foreground">
        <p>Bu bölümde admin onayı bekleyen tüm talepleriniz listelenir. Talep türü ve oluşturulma tarihi bilgileri gösterilir.</p>
        <p><strong className="text-foreground">Rol değişikliği talepleri:</strong> Yeni rol başvurusu yapıldığında burada görünür. Onaylanana veya reddedilene kadar bekler.</p>
        <p><strong className="text-foreground">Feature talepleri:</strong> Kapalı özellikler için erişim talebinde bulunduğunuzda burada listelenir.</p>
        <p><strong className="text-foreground">Profil alanı değişiklikleri:</strong> Admin onayı gerektiren alanlarda yapılan güncellemeler burada takip edilir.</p>
        <p>Talepler genellikle 1-3 iş günü içinde değerlendirilir. Sorularınız için admin ekibiyle iletişime geçebilirsiniz.</p>
      </div>
    ),
  },
];
