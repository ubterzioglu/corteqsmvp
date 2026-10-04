// M21 · CaddeRecommendationCard — Cadde akışında Tavsiye modülü GÖRÜNÜRLÜĞÜ.
//
// 🔴 KARAR 2 KİLİDİ: bu kart yalnız görünürlük sağlar. Cadde'nin bant/skor
// SIRALAMASINA ve HEDEFLEME kurallarına BULAŞMAZ:
//   • Akış kompozisyonu (feed öğeleri + sponsor/promosyon yerleşimi) ve Cadde
//     sıralama kütüphanesi DEĞİŞMEZ — kart akış listesinin DIŞINDA, sabit konumda
//     (scope bar ile liste arası) çizilir; akış listesi map bloğuna girmez.
//   • Kendi react-query anahtarı (["recommendations","list"]) — cadde sorgularına
//     dokunmaz; hata/yavaşlık durumunda akışı ASLA bloklamaz (error → yalnız CTA).
//   • Kaynak kilidi: bu dosyada sıralama/kompozisyon modüllerinin ADI bile geçmez
//     (CaddeRecommendationCard.test.tsx "import yok" iddiası yorumları da tarar).
// 🔴 İLETİŞİM SIZDIRMAZ: satırlarda YALNIZ başlık + şehir gösterilir; talep
// GÖVDESİ (kullanıcının serbest metni — telefon/email içerebilir) kartta ÇİZİLMEZ.
// Test bunu kilitler (gövde metni DOM'a sızarsa test düşer).
import { Link } from "react-router-dom";
import { HeartHandshake } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRecommendations } from "@/hooks/use-recommendations";

export default function CaddeRecommendationCard() {
  // Küçük pencere: akış kolonunda yer kaplamasın diye en yeni 3 açık talep.
  const { data, isLoading, isError } = useRecommendations({ status: "open" }, { limit: 3 });
  const rows = (data ?? []).slice(0, 3);

  return (
    <Card data-testid="cadde-recommendation-card" className="cadde-card overflow-hidden rounded-lg">
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
        <HeartHandshake className="h-4 w-4 text-orange-500" aria-hidden="true" />
        <CardTitle className="text-base text-slate-950">Tavsiye İste</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-5 pt-0">
        <p className="text-sm text-slate-600">
          Güvenilir terzi, doktor, usta mı arıyorsun? Topluluktan tavsiye iste — eşleşen
          profesyoneller ve üyeler yanıtlasın.
        </p>

        {/* Liste YALNIZ başlık + şehir çizer; gövde (serbest metin) BİLEREK yok —
            iletişim bilgisi sızıntı yüzeyi açılmaz. Hata/boş durumda bu blok hiç
            çizilmez, kart CTA'ya düşer (akış asla bloklanmaz). */}
        {!isLoading && !isError && rows.length > 0 ? (
          <ul className="space-y-1.5">
            {rows.map((row) => (
              <li key={row.id}>
                <Link
                  to={`/tavsiye/${row.id}`}
                  className="block text-sm font-medium text-sky-700 hover:underline"
                >
                  {row.title}
                  {row.city ? <span className="ml-1.5 text-xs font-normal text-slate-500">{row.city}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        <Button asChild variant="outline" size="sm" className="cadde-secondary-action rounded-lg">
          <Link to="/tavsiye">Tüm tavsiyelere git</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
