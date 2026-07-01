# Relocation Tools — Soru Bankası (Tüm Araçlar)

Bu doküman, ortak "relocation tools" motorunu (`relocation_tools` + `relocation_tool_questions`
tabloları, `relocation_tool_start_session`/`save_answer`/`complete_session` RPC'leri) kullanan
tüm araçların soru bankasını, migration dosyalarındaki (tek doğru kaynak — source of truth) INSERT
ifadelerinden birebir çıkarır. `src/lib/relocation-tools-config.ts` içindeki `TOOL_CONFIGS` şu an
boş olduğundan buna güvenilmemiştir. Üretim tarihi: **2026-07-01**.

**Kapsam:** 11 tam DB-driven araç (soru bankası `relocation_tool_questions`'ta), 1 şema-only
migration (`20260626120000_relocation_tools_core.sql` — motorun kendisi, hiçbir araç seed'i içermez),
ve 5 standalone (DB dışı) Almanya aracı (`src/lib/germany-standalone-tools.ts`) — bunlardan 4'ü
hiç soru sorusu barındırmaz (deterministik hesaplayıcı/karar ağacı/soru havuzu), biri
(`vatandaslik_testi_almanya`) 656 satırlık ayrı bir BAMF soru havuzu tablosu kullanır (ortak motorun
`relocation_tool_questions` şemasında DEĞİL).

---

## İçindekiler

1. [Ülke Seçimi — `country_match`](#1-ülke-seçimi--country_match)
2. [Meslek/Maaş Karşılaştırma — `profession_salary`](#2-meslekmaaş-karşılaştırma--profession_salary)
3. [Taşınma Hazırlık Skoru — `relocation_readiness`](#3-taşınma-hazırlık-skoru--relocation_readiness)
4. [Şehir Eşleştirme — `city_match`](#4-şehir-eşleştirme--city_match)
5. [Diaspora Ağı Eşleştirme — `diaspora_matchmaker`](#5-diaspora-ağı-eşleştirme--diaspora_matchmaker)
6. [Yurtdışı Kariyer Yolu — `career_path_abroad`](#6-yurtdışı-kariyer-yolu--career_path_abroad)
7. [Expat Yaşam Tarzı Persona — `expat_lifestyle_persona`](#7-expat-yaşam-tarzı-persona--expat_lifestyle_persona)
8. [İlk 90 Gün Planlayıcı — `first_90_days_planner`](#8-ilk-90-gün-planlayıcı--first_90_days_planner)
9. [Öncelikli Taşınma Sorunu — `top_relocation_challenge`](#9-öncelikli-taşınma-sorunu--top_relocation_challenge)
10. [İş Bulma Olasılığı — `job_finding_probability`](#10-i̇ş-bulma-olasılığı--job_finding_probability)
11. [Diaspora Ağı Eşleştirme (bkz. #5)](#5-diaspora-ağı-eşleştirme--diaspora_matchmaker)
12. [Banka Seçimi (Almanya) — `banka_secim_almanya`](#12-banka-seçimi-almanya--banka_secim_almanya)
13. [Sigorta Seçimi (Almanya) — `sigorta_secim_almanya`](#13-sigorta-seçimi-almanya--sigorta_secim_almanya)
14. [Maaş Hesaplama (Almanya) — standalone, soru yok](#14-almanya-standalone-araçlar-soru-bankası-yok)
15. [Vize Seçimi (Almanya) — standalone, soru yok](#14-almanya-standalone-araçlar-soru-bankası-yok)
16. [Vatandaşlık Testi (Almanya) — standalone, ayrı soru havuzu](#15-vatandaşlık-testi-almanya--vatandaslik_testi_almanya-standalone-ayrı-şema)
17. [Para Transferi (Almanya) — standalone, soru yok](#14-almanya-standalone-araçlar-soru-bankası-yok)
18. [StepStone Maaş Karşılaştırma (Almanya) — standalone, soru yok](#14-almanya-standalone-araçlar-soru-bankası-yok)

---

## 1. Ülke Seçimi — `country_match`

Kaynak: `supabase/migrations/20260626180000_relocation_tool_country_match.sql`

- **Slug:** `ulke-secimi` · **Kategori:** `relocation_assessment` · **result_kind:** `ranked_list`
- **Soru sayısı:** quick 7 · detailed +11 (toplam 18)

| Sıra | Soru Anahtarı | Mod | Bölüm | Soru (Türkçe) | Yanıt Tipi | Seçenekler | Zorunlu |
|---|---|---|---|---|---|---|---|
| 1 | motivation | both | plan | Tek taşınma motivasyonun ne? | single | Kariyer, Eğitim, Aile, Güvenlik, Yaşam tarzı, Topluluk, Uzaktan çalışma | Evet |
| 2 | monthly_budget | both | budget | Aylık yaşam bütçen nedir? (Yaklaşık, EUR) | currency | — | Evet |
| 3 | profession_field | both | career | Mesleğin veya ana uzmanlık alanın? | profession | — | Evet |
| 4 | work_mode | both | career | Yurt dışında çalışma planın nasıl? | single | Yerel iş, Uzaktan, Önce eğitim/sonra iş, Girişimci, Kararsız | Evet |
| 5 | visa_assets | both | visa | Vize/oturum açısından güçlü varlıkların var mı? (çoklu) | multi | AB pasaportu, Ata bağı/vatandaşlık hakkı, Öğrenci kabulü, İş teklifi, Yok | Evet |
| 6 | community_importance | both | community | Türk/diaspora topluluğu senin için ne kadar önemli? (1=düşük, 5=yüksek) | scale | — | Evet |
| 7 | deal_breakers | both | plan | Kesin istemediğin koşullar? (çoklu) | multi | Yüksek maliyet, İngilizce yetmiyor, Zayıf sağlık, Düşük güvenlik, Topluluk yok, Zor vize | Hayır |
| 8 | target_region | detailed | plan | Hangi bölgelere açıksın? (çoklu) | multi | AB/AEA, Birleşik Krallık, Kuzey Amerika, Körfez, Asya-Pasifik, Fark etmez | Hayır |
| 9 | setup_budget | detailed | budget | İlk kurulum için ayırabileceğin maksimum bütçe? (Depozito/uçuş/evrak, EUR) | currency | — | Hayır |
| 10 | language_profile | detailed | language | İngilizce dışında bir dil biliyor musun / öğrenmeye açık mısın? | single | Sadece İngilizce, Yeni dil öğrenmeye açığım, Birden fazla dil biliyorum | Hayır |
| 11 | bureaucracy_tolerance | detailed | visa | Bürokrasi ve bekleme süresine toleransın? (1=düşük, 5=yüksek) | scale | — | Hayır |
| 12 | family_needs | detailed | family | Aile, çocuk, okul veya evcil hayvan ihtiyaçların var mı? (çoklu) | multi | Çocuk, Okul, Eş işi, Evcil hayvan, Yok | Hayır |
| 13 | healthcare_priority | detailed | qol | Sağlık sistemine erişim önceliğin? (1=düşük, 5=yüksek) | scale | — | Hayır |
| 14 | safety_priority | detailed | qol | Güvenlik ve siyasi istikrar önceliğin? (1=düşük, 5=yüksek) | scale | — | Hayır |
| 15 | inclusion_priority | detailed | qol | Kapsayıcılık / haklar / sosyal özgürlükler ne kadar önemli? (1=düşük, 5=yüksek) | scale | — | Hayır |
| 16 | climate_preference | detailed | lifestyle | İklim tercihin? | single | Ilıman, Soğuk, Sıcak, Akdeniz, Fark etmez | Hayır |
| 17 | move_window | detailed | plan | Ne zaman taşınmak istiyorsun? | single | 0-3 ay, 3-6 ay, 6-12 ay, Daha sonra | Hayır |
| 18 | risk_tolerance | detailed | plan | Belirsizlik ve yeniden başlama riskine toleransın? (1=düşük, 5=yüksek) | scale | — | Hayır |

---

## 2. Meslek/Maaş Karşılaştırma — `profession_salary`

Kaynak: `supabase/migrations/20260626190000_relocation_tool_profession_salary.sql`

- **Slug:** `meslek-maas-karsilastirma` · **Kategori:** `relocation_assessment` · **result_kind:** `comparison`
- **Soru sayısı:** quick 5 · detailed +7 (toplam 12)

| Sıra | Soru Anahtarı | Mod | Bölüm | Soru (Türkçe) | Yanıt Tipi | Seçenekler | Zorunlu |
|---|---|---|---|---|---|---|---|
| 1 | profession_title | both | career | Mesleğin / rolün nedir? | single | Yazılım Mühendisi, İnşaat Mühendisi, Hemşire, Muhasebeci, Öğretmen | Evet |
| 2 | seniority | both | career | Kıdem seviyen? | single | Junior, Orta, Senior, Lead, Yönetici | Evet |
| 3 | years_experience | both | career | Kaç yıl ilgili deneyimin var? (0-40) | number | — | Evet |
| 4 | target_countries | both | plan | Hangi ülkeleri karşılaştırmak istiyorsun? (ISO kodları, virgülle; boş=hepsi) | country | — | Evet |
| 5 | household_cost_context | both | budget | Alım gücü hesabı için hane tipin? | single | Tek kişi, Çift, Çocuklu aile | Evet |
| 6 | education_level | detailed | career | En yüksek eğitim seviyen? | single | Lise, Meslek okulu, Lisans, Yüksek lisans, Doktora | Hayır |
| 7 | specialization | detailed | career | Uzmanlık/branş alanların? (çoklu) | multi | Backend/Sistem, Veri/Yapay Zeka, Klinik, Yönetim, Diğer | Hayır |
| 8 | certifications | detailed | career | Uluslararası geçerli sertifikan var mı? (çoklu) | multi | AWS/Cloud, PMP, Tıbbi lisans, Yok | Hayır |
| 9 | regulated_profession | detailed | legal | Mesleğin hedef ülkede lisans/denkliğe tabi mi? | single | Evet, Hayır, Emin değilim | Hayır |
| 10 | salary_preference | detailed | budget | Maaşı nasıl görmek istersin? | single | Brüt yıllık, Net aylık, İkisi de | Hayır |
| 11 | current_salary_optional | detailed | budget | Mevcut net maaşını karşılaştırmaya dahil edelim mi? (opsiyonel, EUR/ay) | currency | — | Hayır |
| 12 | target_cities | detailed | plan | Belirli şehirleri dahil edelim mi? (opsiyonel) | text | — | Hayır |

---

## 3. Taşınma Hazırlık Skoru — `relocation_readiness`

Kaynak: `supabase/migrations/20260626150000_relocation_tool_readiness.sql`

- **Slug:** `tasinma-hazirlik-skoru` · **Kategori:** `relocation_assessment` · **result_kind:** `score`
- **Soru sayısı:** quick 6 · detailed +9 (toplam 15)

| Sıra | Soru Anahtarı | Mod | Bölüm | Soru (Türkçe) | Yanıt Tipi | Seçenekler | Zorunlu |
|---|---|---|---|---|---|---|---|
| 1 | target_known | both | plan | Hedef ülke/şehir belli mi? | single | Evet, şehir belli · Ülke belli, şehir değil · Henüz net değil | Evet |
| 2 | savings_months | both | finance | Kaç aylık yaşam gideri birikimin var? | single | 6 ay ve üzeri · 3-5 ay · 1-2 ay · Yok | Evet |
| 3 | passport_validity | both | legal | Pasaport ve temel kimlik evrakların güncel mi? | single | Evet, güncel · Yakında doluyor · Hayır | Evet |
| 4 | language_level | both | language | Hedef ülke iş/yaşam dili seviyen? (0=hiç, 5=ileri) | scale | — | Evet |
| 5 | housing_first_month | both | housing | İlk ay konaklama planın var mı? | single | Hazır/garanti · Birkaç seçenek var · Yok | Evet |
| 6 | job_income_plan | both | job | İlk 3 ay gelir/iş planın var mı? | single | İş teklifim var · Uzaktan gelirim var · Sadece birikim · Plan yok | Evet |
| 7 | debt_pressure | detailed | finance | Kısa vadede taşınmayı zorlayacak borç/ödeme baskın var mı? (1=yüksek baskı, 5=baskı yok) | scale | — | Hayır |
| 8 | visa_route | detailed | legal | Hedef ülke için net bir vize/oturum rotan var mı? | single | Evet, net · Araştırıyorum · Hayır | Hayır |
| 9 | diploma_docs | detailed | legal | Diploma, transkript, referans ve iş belgelerin hazır mı? | single | Hazır · Kısmen · Hayır | Hayır |
| 10 | health_insurance | detailed | support | Sağlık sigortası / erişim planın var mı? | single | Evet · Araştırıyorum · Hayır | Hayır |
| 11 | support_network | detailed | support | Hedef yerde tanıdık/topluluk desteğin var mı? | single | Güçlü · Zayıf · Yok | Hayır |
| 12 | family_alignment | detailed | housing | Eş/çocuk/aile kararları net mi? | single | Geçerli değil · Net/uyumlu · Kısmen · Anlaşmazlık var | Hayır |
| 13 | emergency_plan | detailed | support | Acil durumda iletişim ve dönüş planın var mı? | single | Evet · Kısmen · Hayır | Hayır |
| 14 | adaptability | detailed | support | Belirsizlik ve kültürel uyuma hazır hissediyor musun? (1=düşük, 5=yüksek) | scale | — | Hayır |
| 15 | timeline_realism | detailed | housing | Taşınma takvimin gerçekçi mi? (1=gerçekçi değil, 5=çok gerçekçi) | scale | — | Hayır |

---

## 4. Şehir Eşleştirme — `city_match`

Kaynak: `supabase/migrations/20260626160000_relocation_tool_city_match.sql`

- **Slug:** `sehir-eslestirme` · **Kategori:** `relocation_assessment` · **result_kind:** `ranked_list`
- **Soru sayısı:** quick 7 · detailed +9 (toplam 16)

| Sıra | Soru Anahtarı | Mod | Bölüm | Soru (Türkçe) | Yanıt Tipi | Seçenekler | Zorunlu |
|---|---|---|---|---|---|---|---|
| 1 | target_countries | both | plan | Hangi ülke(ler)de şehir arıyorsun? (ISO kodu, virgülle) | country | — | Evet |
| 2 | city_size | both | lifestyle | Şehir ölçeği tercihin? | single | Metropol, Büyük şehir, Orta ölçek, Küçük şehir, Fark etmez | Evet |
| 3 | rent_budget | both | budget | Aylık kira/konut bütçen? (yaklaşık, EUR) | currency | — | Evet |
| 4 | industry_hub | both | job | Meslek alanın için güçlü bir sektör ekosistemi ister misin? (1=önemsiz, 5=çok önemli) | scale | — | Evet |
| 5 | community_need | both | community | Türk/diaspora topluluğu şehir seçiminde ne kadar önemli? (1=düşük, 5=yüksek) | scale | — | Evet |
| 6 | safety_family | both | safety | Güvenlik, okul ve aile dostu ortam önceliğin? (1=düşük, 5=yüksek) | scale | — | Evet |
| 7 | airport_access | both | mobility | Türkiye'ye uçuş erişimi önemli mi? (1=düşük, 5=yüksek) | scale | — | Evet |
| 8 | commute_tolerance | detailed | mobility | Günlük ulaşım toleransın? | single | 15 dk, 30 dk, 60 dk, Esnek | Hayır |
| 9 | nightlife_culture | detailed | lifestyle | Kültür, etkinlik, gece hayatı önceliğin? (1=düşük, 5=yüksek) | scale | — | Hayır |
| 10 | quiet_preference | detailed | lifestyle | Sessiz/sakin yaşam senin için önemli mi? (1=düşük, 5=yüksek) | scale | — | Hayır |
| 11 | climate | detailed | lifestyle | Şehir iklimi tercihin? | single | Ilıman, Soğuk, Sıcak, Kıyı, Fark etmez | Hayır |
| 12 | language_comfort | detailed | lifestyle | Yerel dili bilmeden şehirde başlama konforu ne kadar önemli? (1=düşük, 5=yüksek) | scale | — | Hayır |
| 13 | housing_priority | detailed | budget | Konut bulunabilirliği maliyetten daha önemli mi? (1=maliyet, 5=bulunabilirlik) | scale | — | Hayır |
| 14 | healthcare_priority | detailed | safety | Sağlık erişimi önceliğin? (1=düşük, 5=yüksek) | scale | — | Hayır |
| 15 | deal_breakers | detailed | plan | Şehir için kırmızı çizgilerin? (çoklu) | multi | Çok pahalı, İş yok, Topluluk yok, Güvensiz, Ulaşım kötü | Hayır |
| 16 | preferred_examples | detailed | lifestyle | Sevdiğin şehir tiplerine örnek ver (opsiyonel) | text | — | Hayır |

---

## 5. Diaspora Ağı Eşleştirme — `diaspora_matchmaker`

Kaynak: `supabase/migrations/20260626220000_relocation_tool_diaspora_matchmaker.sql`

- **Slug:** `diaspora-ag-eslestirme` · **Kategori:** `relocation_assessment` · **result_kind:** `match_list`
- **Soru sayısı:** quick 8 · detailed +8 (toplam 16)
- **Not (gizlilik):** onay (consent) yoksa havuza girilmez ve hiçbir veri kaydedilmez; isim/iletişim asla payload'da yer almaz.

| Sıra | Soru Anahtarı | Mod | Bölüm | Soru (Türkçe) | Yanıt Tipi | Seçenekler | Zorunlu |
|---|---|---|---|---|---|---|---|
| 1 | consent_match_visibility | both | consent | Eşleşme havuzunda görünmeyi kabul ediyor musun? | consent | — | Evet |
| 2 | profile_status | both | profile | Durumun ne? | single | Planlıyorum, Yeni taşındım, Yerleşik, Mentor, Kurum/topluluk | Evet |
| 3 | target_location | both | geo | Hedef ülke/şehir? (ISO kodu) | country | — | Evet |
| 4 | profession_field | both | field | Meslek/sektör alanın? (serbest etiket) | profession | — | Evet |
| 5 | needs | both | match | Hangi konularda yardıma ihtiyacın var? (çoklu) | multi | İş, Konut, Vize, Dil, Okul, Topluluk, Sağlık | Evet |
| 6 | offers | both | match | Hangi konularda destek verebilirsin? (çoklu) | multi | Mentorluk, CV inceleme, Yerel ipuçları, Konut yönlendirme, Dil pratiği | Evet |
| 7 | languages | both | match | Hangi dillerde iletişim kurabilirsin? (çoklu) | multi | Türkçe, İngilizce, Almanca, Fransızca, Felemenkçe | Evet |
| 8 | contact_style | both | match | İlk temas tercihin? | single | Mesaj, Sanal kahve, Grup etkinliği, Anonim tanışma | Evet |
| 9 | current_location | detailed | geo | Şu an neredesin? (ISO kodu) | country | — | Hayır |
| 10 | availability | detailed | match | Görüşme uygunluğun? | single | Hafta içi, Akşamlar, Hafta sonu, Sadece asenkron | Hayır |
| 11 | mentor_capacity | detailed | match | Ayda kaç kişiye destek verebilirsin? (mentor/yerleşik için) | number | — | Hayır |
| 12 | intro_text | detailed | profile | Karşı tarafa gösterilecek kısa tanıtım (max 280 karakter) | text | — | Hayır |
| 13 | sensitive_hide | detailed | consent | Gizlemek istediğin alanlar (çoklu) | multi | Şehir, Meslek, Gerçek ad, İşveren | Hayır |
| 14 | trust_signals | detailed | profile | Profil doğrulama sinyalleri (çoklu) | multi | Tamamlanmış profil, Katalog talebi, Telefon doğrulanmış | Hayır |
| 15 | blocking_topics | detailed | consent | Eşleşmek istemediğin konu/tipler (çoklu) | multi | Satış, Hukuki tavsiye, İşe alım, Yok | Hayır |
| 16 | timezone | detailed | match | Saat dilimi / uygun saat (opsiyonel) | text | — | Hayır |

---

## 6. Yurtdışı Kariyer Yolu — `career_path_abroad`

Kaynak: `supabase/migrations/20260626200000_relocation_tool_career_path.sql`

- **Slug:** `yurtdisi-kariyer-yolu` · **Kategori:** `relocation_assessment` · **result_kind:** `persona`
- **Soru sayısı:** quick 7 · detailed +8 (toplam 15)

| Sıra | Soru Anahtarı | Mod | Bölüm | Soru (Türkçe) | Yanıt Tipi | Seçenekler | Zorunlu |
|---|---|---|---|---|---|---|---|
| 1 | current_field | both | career | Şu anki alanın / bölümün / mesleğin? (serbest metin) | profession | — | Evet |
| 2 | favorite_work | both | interest | En çok hangi iş tipinden enerji alırsın? (çoklu) | multi | Analiz, İnşa/üretme, İnsanlarla çalışma, Araştırma, Operasyon, Satış, Öğretme | Evet |
| 3 | core_skills | both | skills | Güçlü becerilerin? (çoklu) | multi | Teknik, İletişim, Dil, Liderlik, El/zanaat, Sağlık, Finans | Evet |
| 4 | study_willingness | both | interest | Yurt dışında yeniden eğitim/sertifika almaya açık mısın? (1=düşük, 5=yüksek) | scale | — | Evet |
| 5 | risk_appetite | both | interest | Kariyerde yeniden başlama riskine toleransın? (1=düşük, 5=yüksek) | scale | — | Evet |
| 6 | work_environment | both | interest | Çalışma ortamı tercihin? | single | Startup, Kurumsal, Akademik, Kamu, Freelance, Saha | Evet |
| 7 | salary_vs_stability | both | interest | Maaş mı istikrar mı? (1=istikrar, 5=maaş) | scale | — | Evet |
| 8 | regulated_barrier | detailed | legal | Alanında lisans/denklik bariyeri var mı? | single | Evet, Hayır, Emin değilim | Hayır |
| 9 | language_level | detailed | skills | İş dilinde seviyen? (0=hiç, 5=ileri) | scale | — | Hayır |
| 10 | portfolio_signal | detailed | skills | Portföy, yayın, proje veya referansların var mı? | single | Güçlü, Kısmen, Yok | Hayır |
| 11 | entrepreneurship | detailed | interest | Girişimcilik/freelance çalışma ilgisi? (1=düşük, 5=yüksek) | scale | — | Hayır |
| 12 | research_interest | detailed | interest | Araştırma/akademi ilgisi? (1=düşük, 5=yüksek) | scale | — | Hayır |
| 13 | hands_on_interest | detailed | interest | Pratik/mesleki uygulama ilgisi? (1=düşük, 5=yüksek) | scale | — | Hayır |
| 14 | people_helping | detailed | interest | İnsanlara doğrudan destek veren rollere ilgin? (1=düşük, 5=yüksek) | scale | — | Hayır |
| 15 | timeline | detailed | plan | Kariyer dönüşümü için zaman ufkun? | single | 0-3 ay, 3-12 ay, 1-2 yıl, 2 yıldan uzak | Hayır |

---

## 7. Expat Yaşam Tarzı Persona — `expat_lifestyle_persona`

Kaynak: `supabase/migrations/20260626130000_relocation_tool_expat_persona.sql`

- **Slug:** `expat-yasam-tarzi-persona` · **Kategori:** `relocation_assessment` · **result_kind:** `persona`
- **Soru sayısı:** quick 8 · detailed +2 (toplam 10)

| Sıra | Soru Anahtarı | Mod | Bölüm | Soru (Türkçe) | Yanıt Tipi | Seçenekler | Zorunlu |
|---|---|---|---|---|---|---|---|
| 1 | weekend_style | both | lifestyle | Yeni bir şehirde ilk hafta sonu ne yaparsın? | single | Networking etkinliğine giderim, Müze/şehir turu yaparım, Doğaya/yürüyüşe çıkarım, Aileyle pazar/market gezerim, Sakin bir kafede vakit geçiririm | Evet |
| 2 | social_energy | both | lifestyle | Yeni insanlarla tanışmak sana nasıl gelir? (1=zorlayıcı, 5=enerji verici) | scale | — | Evet |
| 3 | planning_style | both | lifestyle | Planlı mısın spontane mi? (1=planlı, 5=spontane) | scale | — | Evet |
| 4 | local_language | both | lifestyle | Yerel dili yanlış yaparak konuşmayı dener misin? (1=denemem, 5=hep denerim) | scale | — | Evet |
| 5 | community_need | both | lifestyle | Kendi kültüründen insanlarla bağ kurma ihtiyacın? (1=düşük, 5=yüksek) | scale | — | Evet |
| 6 | comfort_zone | both | lifestyle | Konfor alanından çıkma isteğin? (1=düşük, 5=yüksek) | scale | — | Evet |
| 7 | career_focus | both | lifestyle | Taşınmada kariyer/network odağın? (1=düşük, 5=yüksek) | scale | — | Evet |
| 8 | family_rhythm | both | lifestyle | Aile ve rutin odaklı yaşam sana ne kadar uygun? (1=düşük, 5=yüksek) | scale | — | Evet |
| 9 | city_vs_nature | detailed | lifestyle | Büyük şehir mi doğa/sakinlik mi? (1=doğa, 5=şehir) | scale | — | Hayır |
| 10 | sharing | detailed | lifestyle | Sonucunu toplulukla paylaşmak ister misin? | single | Evet, Hayır | Hayır |

---

## 8. İlk 90 Gün Planlayıcı — `first_90_days_planner`

Kaynak: `supabase/migrations/20260626170000_relocation_tool_first_90_days.sql`

- **Slug:** `ilk-90-gun-planlayici` · **Kategori:** `relocation_assessment` · **result_kind:** `checklist`
- **Soru sayısı:** quick 12 · detailed +8 (toplam 20)

| Sıra | Soru Anahtarı | Mod | Bölüm | Soru (Türkçe) | Yanıt Tipi | Seçenekler | Zorunlu |
|---|---|---|---|---|---|---|---|
| 1 | destination | both | plan | Hedef ülke/şehir? (ISO ülke kodu veya şehir) | country | — | Evet |
| 2 | arrival_date | both | plan | Tahmini varış tarihin? | date | — | Evet |
| 3 | visa_status | both | legal | Vize/oturum durumun? | single | Onaylı, Başvurdum, Araştırıyorum, Gerekmiyor, Yok | Evet |
| 4 | housing_status | both | housing | İlk konaklama durumun? | single | Hazır, Geçici, Arıyorum, Yok | Evet |
| 5 | health_insurance | both | health | Sağlık sigortası planın? | single | Aktif, İşveren sağlıyor, Alacağım, Yok | Evet |
| 6 | banking | both | finance | Yerel banka/ödeme çözümü planın? | single | Hazır, Araştırıyorum, Yok | Evet |
| 7 | phone_internet | both | logistics | Telefon/internet planın? | single | Hazır, Geçici, Yok | Evet |
| 8 | address_registration_known | both | legal | Adres/belediye kaydı gerekliliğini biliyor musun? | single | Evet, Hayır, Geçerli değil | Evet |
| 9 | documents_ready | both | legal | Belgelerinin dijital/fiziksel kopyaları hazır mı? | single | Evet, Kısmen, Hayır | Evet |
| 10 | emergency_contacts | both | logistics | Acil iletişimleri kaydettin mi? | single | Evet, Hayır | Evet |
| 11 | transport | both | logistics | İlk hafta ulaşım planın? | single | Toplu taşıma, Araç, Taksi, Yok | Evet |
| 12 | job_start | both | work | İş/okul başlangıç tarihin belli mi? | single | Evet, Hayır, Geçerli değil | Evet |
| 13 | children_school | detailed | family | Çocuk okul/kayıt ihtiyacı var mı? | single | Evet, Hayır | Hayır |
| 14 | pets | detailed | family | Evcil hayvan taşınması var mı? | single | Evet, Hayır | Hayır |
| 15 | language_course | detailed | integration | Dil kursu/entegrasyon programı ihtiyacın var mı? | single | Evet, Hayır, Emin değilim | Hayır |
| 16 | community_intro | detailed | integration | İlk ay topluluk/mentor desteği ister misin? | single | Evet, Hayır | Hayır |
| 17 | tax_social_security | detailed | legal | Vergi/sosyal güvenlik adımlarını biliyor musun? | single | Evet, Hayır, Geçerli değil | Hayır |
| 18 | credential_recognition | detailed | work | Mesleki denklik/lisans adımı gerekiyor mu? | single | Evet, Hayır, Emin değilim | Hayır |
| 19 | driving_license | detailed | logistics | Ehliyet dönüşümü/araç ihtiyacı var mı? | single | Evet, Hayır | Hayır |
| 20 | notification_consent | detailed | integration | Görev hatırlatmaları almak ister misin? (e-posta/uygulama içi) | consent | — | Hayır |

---

## 9. Öncelikli Taşınma Sorunu — `top_relocation_challenge`

Kaynak: `supabase/migrations/20260626140000_relocation_tool_top_challenge.sql`

- **Slug:** `oncelikli-tasinma-sorunu` · **Kategori:** `relocation_assessment` · **result_kind:** `score`
- **Soru sayısı:** quick 5 · detailed +4 (toplam 9)

| Sıra | Soru Anahtarı | Mod | Bölüm | Soru (Türkçe) | Yanıt Tipi | Seçenekler | Zorunlu |
|---|---|---|---|---|---|---|---|
| 1 | stressors | both | challenge | Şu an en çok ne zorlayıcı geliyor? (çoklu) | multi | Vize/oturum, İş/gelir, Dil, Konut, Finans/bütçe, Evrak/bürokrasi, Yalnızlık/topluluk, Diploma/okul denkliği, Sağlık | Evet |
| 2 | urgency | both | challenge | Taşınma ne kadar yakın? | single | 0-1 ay, 1-3 ay, 3-6 ay, 6 aydan uzak | Evet |
| 3 | blocked_progress | both | challenge | Hangi alan ilerlemeyi gerçekten durduruyor? (çoklu) | multi | (stressors ile aynı 9 seçenek) | Evet |
| 4 | confidence | both | challenge | Genel güven seviyen? (1=düşük/yüksek risk, 5=yüksek) | scale | — | Evet |
| 5 | help_needed | both | challenge | Dış destek almak istediğin alanlar? (çoklu) | multi | Mentor, Hukuki/vize danışmanı, İşe alım/kariyer, Konut, Dil | Hayır |
| 6 | documents_state | detailed | challenge | Evrak/vize tarafında durum? | single | Net/hazır, Kısmen hazır, Kafam karışık | Hayır |
| 7 | income_state | detailed | challenge | Gelir/iş tarafında durum? | single | Garanti/işim var, Arıyorum, Henüz başlamadım | Hayır |
| 8 | support_state | detailed | challenge | Destek ağı durumun? | single | Güçlü, Zayıf, Yok | Hayır |
| 9 | health_family_complexity | detailed | challenge | Sağlık/aile/okul gibi ek karmaşıklık var mı? (çoklu) | multi | Çocuk, Süreklilik gerektiren sağlık erişimi, Evcil hayvan, Yaşlı bakımı, Yok | Hayır |

---

## 10. İş Bulma Olasılığı — `job_finding_probability`

Kaynak: `supabase/migrations/20260626210000_relocation_tool_job_probability.sql`

- **Slug:** `is-bulma-olasiligi` · **Kategori:** `relocation_assessment` · **result_kind:** `score`
- **Soru sayısı:** quick 7 · detailed +9 (toplam 16)

| Sıra | Soru Anahtarı | Mod | Bölüm | Soru (Türkçe) | Yanıt Tipi | Seçenekler | Zorunlu |
|---|---|---|---|---|---|---|---|
| 1 | profession_title | both | career | Hedeflediğin iş/rol nedir? | single | Yazılım Mühendisi, İnşaat Mühendisi, Hemşire, Muhasebeci, Öğretmen | Evet |
| 2 | target_country | both | plan | Hangi ülkede iş arıyorsun? (tek ISO kodu) | country | — | Evet |
| 3 | years_experience | both | career | İlgili deneyim yılın? (0-40) | number | — | Evet |
| 4 | seniority | both | career | Kıdem seviyen? | single | Junior, Orta, Senior, Lead, Yönetici | Evet |
| 5 | language_level | both | skills | İş dilindeki seviyen? (0=hiç, 5=ileri) | scale | — | Evet |
| 6 | work_authorization | both | legal | Çalışma izni/vize açısından durumun? | single | Çalışma iznim var, Uygunum (kolay), Sponsor gerek, Bilmiyorum | Evet |
| 7 | network | both | network | Hedef ülkede profesyonel bağlantın var mı? | single | Güçlü, Zayıf, Yok | Evet |
| 8 | education_level | detailed | career | Eğitim seviyen? | single | Meslek okulu, Lisans, Yüksek lisans, Doktora, Diğer | Hayır |
| 9 | english_level | detailed | skills | İngilizce seviyen? (0=hiç, 5=ileri) | scale | — | Hayır |
| 10 | regulated_profession | detailed | legal | Mesleğin denklik/lisans gerektiriyor mu? | single | Evet, Hayır, Emin değilim | Hayır |
| 11 | credential_status | detailed | legal | Denklik/sertifika durumun? | single | Tanınmış, Sürüyor, Gerekmiyor, Yok | Hayır |
| 12 | portfolio_cv | detailed | skills | CV/LinkedIn/portföyün hedef ülkeye uygun mu? | single | Hazır, Kısmen, Hayır | Hayır |
| 13 | applications | detailed | network | Son 30 günde kaç başvuru yaptın? (0-200) | number | — | Hayır |
| 14 | interviews | detailed | network | Son 90 günde mülakat aldın mı? | single | Birden fazla, Bir, Yok | Hayır |
| 15 | salary_flexibility | detailed | plan | Maaş/rol esnekliğin? (1=düşük, 5=yüksek) | scale | — | Hayır |
| 16 | remote_option | detailed | plan | Remote/hybrid/sponsor seçeneklerine açıksın? (çoklu) | multi | Remote, Hybrid, Sponsor relocation, Sadece yerel | Hayır |

---

## 12. Banka Seçimi (Almanya) — `banka_secim_almanya`

Kaynak: `supabase/migrations/20260630100000_relocation_tool_banka_secim_almanya.sql`
(Kaynak referans: ref101/almanya101 `banka-secim` — profil sinyali skorlama motoruna port edildi)

- **Slug:** `banka-secim-almanya` · **Kategori:** `germany_tools` · **result_kind:** `ranked_list`
- **Soru sayısı:** mode=`both` (tek modlu; quick=detailed=20)
- Her seçenek "value" bir ref101 option key'i; `scoring.add` alanında o seçeneğin 8 profil sinyaline
  (DIGITAL/DIRECT/LOCAL/EXPAT/INVEST/CRYPTO/LOW_COST/BRANCH) katkısı saklanır (aşağıdaki tabloda özetlenmemiştir,
  bkz. migration dosyası).

| Sıra | Soru Anahtarı | Mod | Bölüm | Soru (Türkçe) | Yanıt Tipi | Seçenekler | Zorunlu |
|---|---|---|---|---|---|---|---|
| 1 | q1 | both | profil | Almanya'da ne zamandır yaşıyorsun? | single | Yeni geldim (0–1 yıl), 1–5 yıl, 5+ yıl | Evet |
| 2 | q2 | both | profil | Almanca seviyen nasıl? | single | Zayıf/İngilizce tercih, Orta, İyi/çok iyi | Evet |
| 3 | q3 | both | profil | Yaşadığın yer daha çok…? | single | Büyük şehir merkezi, Banliyö, Küçük şehir/kasaba | Evet |
| 4 | q4 | both | sube | Şubeye gitme ihtiyacın olur mu? | single | Asla, Nadiren, Evet önemli | Evet |
| 5 | q5 | both | masraf | En çok hangisi canını sıkar? | single | Yüksek ücretler, Kötü mobil uygulama, Ulaşılamayan destek | Evet |
| 6 | q6 | both | masraf | Aylık hesap ücreti konusunda yaklaşımın? | single | Asla, Makul olursa, Sorun değil | Evet |
| 7 | q7 | both | masraf | SEPA havale/transfer sıklığın? | single | Çok sık, Ara sıra, Nadiren | Evet |
| 8 | q8 | both | sube | Nakit kullanımı senin için…? | single | Neredeyse hiç, Bazen, Sık sık | Evet |
| 9 | q9 | both | sube | ATM yakınlığı/erişimi önemli mi? | single | Değil, Evet ama fark etmez, Evet yakın olsun | Evet |
| 10 | q10 | both | kart | Kart tercihinde hangisi ağır basıyor? | single | Sadece debit, Debit + kredi, Klasik (Girocard vb.) | Evet |
| 11 | q11 | both | yatirim | Borsa/ETF yatırımı yapıyor musun? | single | Evet aktif, Ara sıra, Hayır | Evet |
| 12 | q12 | both | yatirim | Yatırımda senin için en önemli şey? | single | Düşük komisyon, Banka güvencesi, Mobil kolaylık | Evet |
| 13 | q13 | both | kripto | Kripto ile ilişkin nedir? | single | Aktif alım-satım, Merak ediyorum, Hiç ilgim yok | Evet |
| 14 | q14 | both | kripto | Kripto nerede dursun istersin? | single | Bankada/uygulamada, Ayrı platform, Hiç gerek yok | Evet |
| 15 | q15 | both | kullanim | Finansı tek uygulamada mı yönetmek istersin? | single | Evet tek uygulama, Fark etmez, Ayrı olsun | Evet |
| 16 | q16 | both | kullanim | Banka seçerken en önemli kriter hangisi? | single | Güven & köklülük, Hız & teknoloji, Dengeli olsun | Evet |
| 17 | q17 | both | destek | Müşteri hizmetlerine erişim beklentin? | single | Çok önemli, Orta, Hiç önemli değil | Evet |
| 18 | q18 | both | destek | Hesabın bloke/kapanma riski seni ne kadar gerer? | single | Evet çok gerer, Biraz, Hayır | Evet |
| 19 | q19 | both | destek | Banka değiştirmeye ne kadar açıksın? | single | Çok açık, Gerekirse, Zor | Evet |
| 20 | q20 | both | genel | İdeal banka senin için hangisi? | single | Masrafsız & mobil, Dengeli & güvenli, Şubeli & klasik | Evet |

Skorlama, cevaplardan toplanan 8 profil sinyalini 19 bankanın (N26, Revolut, ING, DKB, Sparkasse,
Volksbank/Raiffeisenbank, Commerzbank, Deutsche Bank, Trade Republic, C24, comdirect, Consorsbank,
Targobank, Postbank, HypoVereinsbank, Santander, bunq, Tomorrow, Wise) ağırlık matrisiyle çarpıp top-3'ü döndürür.

---

## 13. Sigorta Seçimi (Almanya) — `sigorta_secim_almanya`

Kaynak: `supabase/migrations/20260630110000_relocation_tool_sigorta_secim_almanya.sql`
(Kaynak referans: ref101/almanya101 `sigorta-secim`)

- **Slug:** `sigorta-secim-almanya` · **Kategori:** `germany_tools` · **result_kind:** `ranked_list`
- **Soru sayısı:** mode=`both` (tek modlu; quick=detailed=20)
- `scoring.add`, her cevabın 12 sigorta tipine (HEALTH/LIABILITY/CAR/HOUSEHOLD/LEGAL/BU/LIFE/DENTAL/
  ACCIDENT/TRAVEL/BUILDING/PET_LIAB) katkısını taşır; RPC bu toplamı `mustAt`/`shouldAt` eşikleriyle
  "Önce Al / Güçlü Öneri / Opsiyonel" bandına çevirir.

| Sıra | Soru Anahtarı | Mod | Bölüm | Soru (Türkçe) | Yanıt Tipi | Seçenekler | Zorunlu |
|---|---|---|---|---|---|---|---|
| 1 | q1 | both | genel | Almanya'da ikamet edip resmi kayıt (Anmeldung) yapacak mısın? | single | Evet, Hayır | Evet |
| 2 | q2 | both | calisma | Çalışan mısın? (mini-job dışı düzenli iş) | single | Evet çalışanım, Serbest/şirket (freelance), Öğrenciyim, Diğer/şu an çalışmıyorum | Evet |
| 3 | q3 | both | aile | Aileni (eş/çocuk) da kapsayan bir yapı gerekir mi? | single | Evet, Hayır | Evet |
| 4 | q4 | both | arac | Araba kullanıyor musun veya Almanya'da araba almayı planlıyor musun? | single | Evet, Hayır | Evet |
| 5 | q5 | both | ev | Evde pahalı eşyaların var mı? (laptop/TV/kamera vb.) | single | Evet, Hayır | Evet |
| 6 | q6 | both | ev | Kiracı mısın, ev sahibi mi olacaksın? | single | Kiracı, Ev sahibi, Henüz belli değil | Evet |
| 7 | q7 | both | aile | Çocukların var mı? | single | Evet, Hayır | Evet |
| 8 | q8 | both | gunluk | Düzenli olarak bisiklet/e-scooter kullanıyor musun? | single | Evet, Hayır | Evet |
| 9 | q9 | both | seyahat | Sık seyahat ediyor musun? (AB içi/dışı) | single | Evet sık, Ara sıra, Nadiren | Evet |
| 10 | q10 | both | sorumluluk | Başkasına zarar verme riskin yüksek mi? (çocuk, evcil hayvan, yoğun sosyal hayat) | single | Evet, Hayır | Evet |
| 11 | q11 | both | gelir | Gelirin kesilmesi seni ciddi zorlar mı? (tek gelir, az birikim, kredi) | single | Evet, Hayır | Evet |
| 12 | q12 | both | hukuk | Hukuki ihtilaf yaşama ihtimalin var mı? (iş/ev/komşu/taşınma) | single | Evet, Hayır | Evet |
| 13 | q13 | both | dis | Diş masrafları seni düşündürüyor mu? (ortodonti, implant vb.) | single | Evet, Hayır | Evet |
| 14 | q14 | both | kaza | Riskli/hobisel aktivitelerin var mı? (dağ sporu, motor, ekstrem spor) | single | Evet, Hayır | Evet |
| 15 | q15 | both | hayvan | Evcil hayvanın var mı? (özellikle köpek) | single | Köpek, Kedi, Yok | Evet |
| 16 | q16 | both | calisma | Tehlikeli bir işte/ortamda mı çalışıyorsun? (inşaat, yüksekten çalışma vb.) | single | Evet, Hayır | Evet |
| 17 | q17 | both | gelir | Kredi veya büyük borcun var mı? (konut, taşıt vb.) | single | Evet, Hayır | Evet |
| 18 | q18 | both | konut | Riskli bir bölgede (sel, fırtına vb.) mı yaşıyorsun? | single | Evet, Hayır | Evet |
| 19 | q19 | both | arac | Günlük olarak başka araç kullanıyor musun? (motor, büyük taşıt vb.) | single | Evet, Hayır | Evet |
| 20 | q20 | both | konut | Evde yangın veya su baskını riski var mı? (eski tesisat, fırtına riski) | single | Evet, Hayır | Evet |

Sigorta tipi kataloğu (RPC içinde gömülü, `title`/`base`/`mustAt`/`shouldAt`): Sağlık
(Krankenversicherung), Özel Sorumluluk (Privathaftpflicht), Araç (Kfz-Haftpflicht), Ev Eşyası
(Hausrat), Hukuk Koruma (Rechtsschutz), Çalışamazlık/Gelir Koruma (Berufsunfähigkeit), Risk Hayat
(Risikolebensversicherung), Diş Tamamlayıcı (Zahnzusatz), Kaza (Unfallversicherung), Seyahat Sağlık
(Auslandsreise-KV), Konut Bina (Wohngebäude), Evcil Hayvan Sorumluluk (Tierhalterhaftpflicht).

---

## 14. Almanya Standalone Araçları (Soru Bankası Yok)

Bu 4 araç `relocation_tools` tablosunda yalnızca **hub kartı** için bir satıra sahiptir; migration'ları
soru seed'i veya skor RPC'si İÇERMEZ (`quick_question_count`/`detailed_question_count` = 0, 0).
Sayfa gövdesi `src/lib/germany-standalone-tools.ts` registry'sinden yüklenen kendi React
bileşenleridir — deterministik hesaplayıcı veya dallanmalı karar ağacı, ortak oturum/cevap motoruna
girmez. Bu nedenle "soru bankası" bu araçlar için DB'de yoktur (arayüz kendi iç mantığında sorular
sorabilir, ancak bunlar `relocation_tool_questions` şemasında saklanmaz).

| Araç Anahtarı | Slug | Başlık | Bileşen |
|---|---|---|---|
| `maas_hesaplama_almanya` | `maas-hesaplama-almanya` | Maaş Hesaplama (Almanya) | `MaasHesaplamaToolPage` (`src/lib/germany-salary`) |
| `vize_secim_almanya` | `vize-secim-almanya` | Vize Seçimi (Almanya) | `VizeSecimToolPage` (`src/lib/germany-vize-data`) |
| `para_transferi_almanya` | `para-transferi-almanya` | Para Transferi (Almanya) | `ParaTransferiToolPage` (`src/lib/germany-transfer`) |
| `stepstone_karsilastirma_almanya` | `stepstone-karsilastirma-almanya` | StepStone Maaş Karşılaştırma (Almanya) | `StepstoneKarsilastirmaToolPage` (`src/lib/germany-stepstone`) |

Kaynak migration'lar: `20260630120000_relocation_tool_maas_hesaplama_almanya.sql`,
`20260630130000_relocation_tool_vize_secim_almanya.sql`,
`20260701101000_relocation_tool_para_transferi_almanya.sql`,
`20260701110000_relocation_tool_stepstone_karsilastirma_almanya.sql`.

---

## 15. Vatandaşlık Testi (Almanya) — `vatandaslik_testi_almanya` (standalone, ayrı şema)

Kaynak: `supabase/migrations/20260630140000_relocation_tool_vatandaslik_testi_almanya.sql`

- **Slug:** `vatandaslik-testi-almanya` · **Kategori:** `germany_tools` · **result_kind:** `score` (CHECK için; kullanılmaz)
- **requires_auth:** false (herkese açık — sorular kamuya açık BAMF havuzu)
- Bu araç ortak motorun `relocation_tool_questions` şemasını KULLANMAZ. Kendi tablosu vardır:
  **`public.germany_citizenship_questions`** — resmi BAMF Einbürgerungstest soru havuzunun tamamı
  (id 1–656 aralığında, **656 soru satırı**), her biri şu alanlarla:
  - `soru_almanca` / `soru_turkce` (Almanca + Türkçe metin)
  - `secenekler` (jsonb `{a,b,c,d}` 4 şık)
  - `dogru_cevap` (`a`|`b`|`c`|`d`)
  - `eyalet` (`Genel` = ortak/genel havuz, veya 16 eyaletten biri — ör. Baden-Württemberg,
    Schleswig-Holstein, Thüringen — eyalete özel sorular)
  - `image_url` (opsiyonel; bazı sorular görsel armadan/harita eşleştirmesi içerir)
- Sayfa gövdesi: `VatandaslikTestiToolPage` — genel soru havuzu pratiği, 33 soru/60 dk deneme
  sınavı simülasyonu ve eyalet bazlı soru filtreleme sunar.
- **Bu doküman kapsamında tek tek 656 soru listelenmemiştir** (hacim nedeniyle) — tam liste için
  migration dosyasına veya canlı `germany_citizenship_questions` tablosuna bakın. Örnek soru formatı:

  > **Soru Almanca:** "Was ist die Hauptstadt von Deutschland?"
  > **Soru Türkçe:** "Almanya'nın başkenti neresidir?"
  > **Şıklar:** a) Hamburg b) München c) Berlin d) Köln — **Doğru:** c — **Eyalet:** Genel

---

## Özet Tablo

| # | Araç Anahtarı | Slug | Kategori | result_kind | Soru Sayısı (quick/detailed) |
|---|---|---|---|---|---|
| 1 | country_match | ulke-secimi | relocation_assessment | ranked_list | 7 / 18 |
| 2 | profession_salary | meslek-maas-karsilastirma | relocation_assessment | comparison | 5 / 12 |
| 3 | relocation_readiness | tasinma-hazirlik-skoru | relocation_assessment | score | 6 / 15 |
| 4 | city_match | sehir-eslestirme | relocation_assessment | ranked_list | 7 / 16 |
| 5 | diaspora_matchmaker | diaspora-ag-eslestirme | relocation_assessment | match_list | 8 / 16 |
| 6 | career_path_abroad | yurtdisi-kariyer-yolu | relocation_assessment | persona | 7 / 15 |
| 7 | expat_lifestyle_persona | expat-yasam-tarzi-persona | relocation_assessment | persona | 8 / 10 |
| 8 | first_90_days_planner | ilk-90-gun-planlayici | relocation_assessment | checklist | 12 / 20 |
| 9 | top_relocation_challenge | oncelikli-tasinma-sorunu | relocation_assessment | score | 5 / 9 |
| 10 | job_finding_probability | is-bulma-olasiligi | relocation_assessment | score | 7 / 16 |
| 11 | banka_secim_almanya | banka-secim-almanya | germany_tools | ranked_list | 20 / 20 |
| 12 | sigorta_secim_almanya | sigorta-secim-almanya | germany_tools | ranked_list | 20 / 20 |
| 13 | maas_hesaplama_almanya | maas-hesaplama-almanya | germany_tools | score (standalone) | 0 / 0 |
| 14 | vize_secim_almanya | vize-secim-almanya | germany_tools | score (standalone) | 0 / 0 |
| 15 | vatandaslik_testi_almanya | vatandaslik-testi-almanya | germany_tools | score (standalone, 656 satırlık ayrı soru havuzu) | 0 / 0 |
| 16 | para_transferi_almanya | para-transferi-almanya | germany_tools | comparison (standalone) | 0 / 0 |
| 17 | stepstone_karsilastirma_almanya | stepstone-karsilastirma-almanya | germany_tools | comparison (standalone) | 0 / 0 |

**Toplam:** 17 araç kaydı `relocation_tools` tablosunda (+1 şema-only motor migration'ı, hiç araç
seed'i içermez). Bunlardan **12 tanesi** gerçek soru bankasına sahip (`relocation_tool_questions`,
toplam **187 soru satırı**: 10 genel araç 147 satır [18+12+15+16+16+15+10+20+9+16] + 2 Almanya
aracı 40 satır [banka 20 + sigorta 20]). Kalan 5 Almanya aracı standalone'dur (soru bankası yok
veya ortak şemanın dışında ayrı bir soru havuzu tablosu kullanır — vatandaşlık testi 656 satır).
