# SEO/GEO görevi — Qwen için devir (2026-10-05)

Hedef: corteqs.net için `geo-optimizer-skill` bulgularından **güvenli** olanları uygulamak.
Bu dosya kendi başına yeterlidir; önceki sohbeti bilmen gerekmez.

## Durum (Claude oturumunun bıraktığı yer)

- `geo audit --url https://corteqs.net` → **61/100** (foundation). Öncesi çıktısı: Claude oturumunun geçici dizininde; yeniden üretmek için aşağıdaki komutu çalıştır.
- Hiçbir dosya repoya yazılmadı, `seo-geo-fixes` dalı henüz YOK.
- Repo: `c:\temp_private\corteqs\corteqs_fin` (origin `ubterzioglu/corteqsmvp`). Vite + React, prod runtime nginx. Statik dizin: `public/`.
- Çalışma ağacında ~25 ilgisiz değişmiş dosya var. **Onlara dokunma, commit'e alma.**

## Windows tuzağı

`geo` cp1252 yüzünden çöker. Her komuttan önce:

```bash
export PYTHONUTF8=1 PYTHONIOENCODING=utf-8
```

## Yapılacaklar (sırayla)

1. **Dal aç:** `git switch -c seo-geo-fixes` (mevcut HEAD'den; değişmiş dosyalar olduğu gibi kalır).
2. **Aşağıdaki 3 yeni dosyayı oluştur** (hiçbiri mevcut değil; `ls public/ai public/.well-known` ile doğrula, mevcut dosyayı ASLA ezme):
   - `public/ai/summary.json`
   - `public/ai/faq.json`
   - `public/.well-known/ai.txt`
3. **Her dosya için diff/içeriği kullanıcıya göster, onay al, sonra yaz.**
4. **Yalnız bu 3 dosyayı commit et** (pathspec zorunlu):
   `git add public/ai/summary.json public/ai/faq.json public/.well-known/ai.txt`
   `git commit -m "feat(seo): AI kesif dosyalari (ai/summary.json, ai/faq.json, .well-known/ai.txt)" -- public/ai public/.well-known/ai.txt`
   Mesaj Türkçe/ASCII olabilir; repo konvansiyonu Türkçe commit mesajıdır. **Push etme.**
5. **Build doğrula:** `npm run build` → hata yok; sonra `dist/ai/summary.json`, `dist/ai/faq.json`, `dist/.well-known/ai.txt` var mı bak.
6. **nginx kontrolü:** `nginx.conf.template` içinde `/ai/` ve `/.well-known/` yollarının SPA fallback'ine ya da prerender'a DÜŞMEDİĞİNİ ve `.json` için `application/json` döndüğünü doğrula (metin okuyarak). Sorun varsa DEĞİŞTİRME, kullanıcıya bildir — nginx'te `add_header` kalıtılmaz (CLAUDE.md "Değişmez sözleşmeler" md.2).
7. **Deploy kullanıcıdadır.** Deploy sonrası:
   ```bash
   export PYTHONUTF8=1 PYTHONIOENCODING=utf-8
   geo audit --url https://corteqs.net
   curl -sI https://corteqs.net/ai/summary.json | head -5
   curl -sI https://corteqs.net/.well-known/ai.txt | head -5
   ```
   Önce (61) / sonra skorunu raporla. Beklenen artış mütevazı (+3–6); aracın "79" tahmini gerçekçi değil.

## Dosya içerikleri

### `public/ai/summary.json`

```json
{
  "name": "CorteQS",
  "alternateName": "CorteQS Diaspora Connect",
  "url": "https://corteqs.net",
  "description": "CorteQS, Türk diasporası için topluluk, danışman ve fırsatları bir araya getirir. Expat ağına katılın, şehir bazlı güvenilir bağlantılar kurun.",
  "inLanguage": "tr",
  "logo": "https://corteqs.net/logocorteqsbig.png",
  "contact": "info@corteqs.net",
  "sameAs": [
    "https://www.facebook.com/corteqs",
    "https://www.instagram.com/corteqssocial",
    "https://x.com/corteqsx",
    "https://www.linkedin.com/company/corteqs-global"
  ],
  "resources": {
    "llms": "https://corteqs.net/llms.txt",
    "faq": "https://corteqs.net/ai/faq.json",
    "sitemap": "https://corteqs.net/sitemap.xml"
  },
  "lastModified": "2026-10-05"
}
```

### `public/.well-known/ai.txt`

```
# CorteQS - AI kullanım politikası
# Tarama izinleri robots.txt ile aynıdır: https://corteqs.net/robots.txt

Site: https://corteqs.net
Contact: info@corteqs.net

# Arama, yanıt üretimi ve alıntılama (atıf yapılması beklenir)
Allow: /

# Kapsam dışı
Disallow: /admin

# AI için özet kaynaklar
Summary: https://corteqs.net/ai/summary.json
FAQ: https://corteqs.net/ai/faq.json
LLMs: https://corteqs.net/llms.txt
```

### `public/ai/faq.json` — ELLE YAZMA, `index.html`'den üret

12 soru-cevap, `index.html` içindeki ilk `application/ld+json` bloğunun `FAQPage` düğümünden birebir alınır
(Türkçe karakterler korunur; elle yazarsan harf düşer — `verify:text` bunu yakalamaz).

```bash
node -e '
const fs=require("fs");
const h=fs.readFileSync("index.html","utf8");
const m=h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
const f=JSON.parse(m[1])["@graph"].find(x=>x["@type"]==="FAQPage");
const out={name:"CorteQS SSS",url:"https://corteqs.net/",inLanguage:"tr",lastModified:"2026-10-05",
faqs:f.mainEntity.map(q=>({question:q.name,answer:q.acceptedAnswer.text}))};
fs.mkdirSync("public/ai",{recursive:true});
fs.writeFileSync("public/ai/faq.json",JSON.stringify(out,null,2)+"\n");
console.log(out.faqs.length,"faq");
'
```

Beklenen çıktı: `12 faq`. Sonra `node -e 'JSON.parse(require("fs").readFileSync("public/ai/faq.json","utf8"))'` ile geçerliliği doğrula.

## YAPMA listesi (bilinçli kararlar)

| Aracın önerisi | Neden yapılmıyor |
|---|---|
| `geo fix --apply` | Üretilen `summary.json` mojibake'li (Türkçe karakterler bozuk çıkıyor), `{{ISO_DATE}}` placeholder'ı bırakıyor, FAQ'ı İngilizce/jenerik yazıyor. |
| `index.html`'e sabit `<link rel="canonical">` | **YASAK.** Sabit canonical 97 Ahrefs bulgusuna yol açtı; canonical rota başına `useSeo` ile yazılır (`index.html` satır 13-30 yorumu, CLAUDE.md). |
| `robots.txt`, `llms.txt`, JSON-LD'yi yeniden üretmek | Zaten eksiksiz (28 bot izinli, 12 schema türü). Dokunma. |
| "164 ülke / 8,8 milyon" gibi rakamları yeni dosyalara koymak | CLAUDE.md bunu doğrulanamaz iddia olarak işaretliyor. |
| H1 / 300 kelime / "JS rendering 0 kelime" düzeltmeleri | Denetçinin user-agent'ı bot sayılmıyor; nginx botlara prerender sunuyor. Kod sorunu değil, ölçüm artefaktı. |
| RSS ekleme | Kapsam dışı; ayrı karar gerekir. |
| `index.html` HTML yorumlarını silmek | Kullanıcı bu turda İSTEMEDİ (yalnızca ai/ dosyaları + ai.txt onaylandı). Ayrı iş olarak önerilebilir: yorumları üretim derlemesinden çıkaran küçük bir Vite eklentisi. |

## Kurallar

- Mevcut işlevi bozma; emin değilsen kullanıcıya sor.
- Push etme. Başka dosyayı commit'e alma (`git add -A` / pathspec'siz `commit` YASAK — paralel değişiklikler var).
- Yeni dosyalar UTF-8 (BOM'suz) olmalı.
