import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const updates = [
  "26 Nisan 2026: WhatsApp bot kaynaklı kayıtları `submissions` tablosu ile birleştiren migration eklendi; `source_type` ve `source_external_id` alanları üzerinden form, chatbot ve WA kayıtları ayrıştırılabilir hale geldi.",
  "26 Nisan 2026: Admin üyeler ekranı `Form`, `Chatbot` ve `WA Bot` kaynaklarını ayrı etiket ve sayaçlarla göstermeye başladı; filtreleme ve toplam sayılar `source_type` bazlı çalışıyor.",
  "26 Nisan 2026: Chat akışından gelen kayıtların `source_type = chatbot` ve `referral_source = ai-chat` ile kaydedilmesi netleştirildi; eski kayıtlar için de geriye dönük uyumluluk korundu.",
  "24 Nisan 2026: Muhasebe modülü eklendi; dashboard, gelirler, giderler ve nakit akışı sayfaları ile birlikte ilgili Supabase migration ve tipler projeye dahil edildi.",
  "24 Nisan 2026: Admin paneline kaynak linkleri ve advisor linkleri yönetimi eklendi; iletişim kanalı takibi ve profil ayrıştırma desteği genişletildi.",
  "24 Nisan 2026: Diaspora içerik akışı için marquee altyapısı kuruldu; admin tarafında yönetim ekranı ve detail sayfası ile birlikte yeni içerik modeli tanımlandı.",
  "24 Nisan 2026: Landing page içinde yeni içerik bölümleri, video destekli alanlar ve Founding 1000 / yarışma sayfalarında görsel-SEO odaklı güncellemeler yapıldı.",
  "23 Nisan 2026: Referral code alanı normalize edildi; kaynak, grup ve tip bazlı referral yönetimi ile doğrulama akışı güçlendirildi.",
  "23 Nisan 2026: Form gönderimlerinde iletişim kanal durumu alanları (`telefon`, `WhatsApp`, `Instagram`, `mail`) üyeler tablosuna ve admin ekranına eklendi.",
  "23 Nisan 2026: Arayüz tarafında hero, şehir ve elçi kartlarındaki pill/badge taşmaları düzeltilerek daha dengeli ve okunabilir bir görünüm sağlandı.",
  "22 Nisan 2026: Admin referral ekranına üretilen kodlar için accordion liste yapısı eklendi ve referral silme politikaları/veri güvenliği tarafı sıkılaştırıldı.",
  "22 Nisan 2026: WhatsApp davet bağlantıları ve kayıt akışındaki bazı yönlendirme metinleri güncellendi; chat register ve bildirim fonksiyonları bu akışa göre uyumlandı.",
];

const AdminAboutPage = () => (
  <Card>
    <CardHeader>
      <CardTitle>Son 5 Günde Yapılan Değişiklikler</CardTitle>
      <CardDescription>21 Nisan 2026 - 26 Nisan 2026 arasında repoda yapılan başlıca ürün, admin ve veri modeli güncellemeleri.</CardDescription>
    </CardHeader>
    <CardContent>
      <ul className="space-y-3 text-sm text-muted-foreground list-disc pl-5">
        {updates.map((update) => (
          <li key={update}>{update}</li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

export default AdminAboutPage;
