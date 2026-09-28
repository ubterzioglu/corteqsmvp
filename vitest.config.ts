import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    // Tam suite paralel yük altında 5 sn'lik varsayılan zaman aşımına takılıp flaky
    // kızarıyor (2026-07-30 ölçümü: eşzamanlı koşuda 40 test kırmızı, izole 21/21 yeşil;
    // dosya süreleri 1 sn -> 17-53 sn'ye çıkıyordu). Testlerin kendisi hızlı — sınır,
    // makine yükü payı bırakacak kadar gevşetildi.
    testTimeout: 15_000,
    // ⚠️ Eşzamanlılık TAVANI (2026-09-28 ölçümü). Yukarıdaki zaman aşımı gevşetmesi
    // sorunu tam kapatmadı: 15 sn sınırı ÇOK ÇEKİRDEKLİ makinede hâlâ aşılıyordu —
    // beş ayrı dosyada (CaddePage, commercial, CaddeComposer) tam koşuda tek test
    // düşüyor, aynı dosya İZOLE 48/48 ve 12 sn'de geçiyordu.
    //
    // Kök neden zaman aşımının kısalığı değil, AÇLIK: havuz sınırsız olduğu için
    // vitest çekirdek sayısı kadar işçi açıyor (bu makinede 28) ve her işçi kendi
    // jsdom ortamını kuruyor. Ölçüm: 356 dosyada `environment` toplamı 3.363 sn,
    // yani dosya başına ~9 sn yalnız ortam kurulumu. Testler yavaş değil, CPU
    // bekliyorlar ve 15 sn duvara toslayan sağlam testler kırmızı görünüyor.
    //
    // Oran kullanılıyor, sabit sayı değil: CI koşucuları 2-4 çekirdeklidir ve orada
    // bu ayar FİİLEN ETKİSİZDİR (zaten o kadar işçi açılır). Düzeltme yerel koşuyu
    // hedefler — CI bu oturumda her push'ta yeşildi, yani sorun CI'da değildi.
    maxWorkers: "50%",
    execArgv: ["--no-deprecation"],
    setupFiles: ["./src/test/setup.ts"],
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "scripts/**/*.test.mjs",
      "workers/service-finder/src/**/*.test.ts",
      // Edge Function'ların paylaşılan saf modülleri — Deno API'si
      // kullanmadıkları için Node/jsdom altında da koşarlar.
      "supabase/functions/_shared/**/*.test.ts",
    ],
  },
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
});
