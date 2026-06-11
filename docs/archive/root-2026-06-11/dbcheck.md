# CorteQS — Supabase Database Clean-Up, Architecture and Governance Master Prompt

Bu görevde kıdemli bir PostgreSQL Database Architect, Supabase Specialist, Data Model Reviewer ve Application Security Engineer gibi davran.

Repo:

```text
https://github.com/corteqssocial-web/corfin-mvp
```

Amaç:

CorteQS projesinin Supabase veritabanı yapısını ayrıntılı biçimde incelemek, karışıklık oluşturan paralel sistemleri belirlemek, tablo ve RPC değerlerine daha rahat ulaşılmasını sağlamak, veritabanı katmanında clean-code standartları oluşturmak ve güvenli bir sadeleştirme planı hazırlamak.

Bu görev doğrudan canlı veritabanını değiştirme görevi değildir.

---

# 0. Kritik Güvenlik Kuralı

Bu çalışma **READ-ONLY DATABASE AUDIT + DRAFT MIGRATION PLAN** görevidir.

Kesinlikle yapma:

```text
- Canlı Supabase veritabanına write işlemi gönderme
- Migration çalıştırma
- supabase db push çalıştırma
- Remote schema değiştirme
- Tablo silme
- Kolon silme
- RPC silme
- View silme
- Trigger silme
- Policy silme
- Index silme
- Constraint silme
- Data update çalıştırma
- Seed çalıştırma
- Remote function deploy etme
- Service-role key değerini ekrana yazma
- Secret değerlerini rapora yazma
```

Yalnızca aşağıdaki işlemler yapılabilir:

```text
- Repo dosyalarını okuma
- supabase/migrations geçmişini inceleme
- Frontend ve backend kodunda tablo/RPC kullanımını arama
- Mevcut Supabase CLI sürümünü ve desteklenen komutları help üzerinden doğrulama
- Bağlı veritabanında yalnızca metadata okuma
- Read-only lint veya advisor çıktısını okuma
- Read-only schema dump oluşturma
- Lokal rapor üretme
- Lokal SQL taslakları üretme
```

Remote Supabase erişimi yoksa hata verme. Repo içindeki migration geçmişine dayalı analiz yap ve remote doğrulama gerektiren noktaları açıkça belirt.

---

# 1. Repo Gerçekliğini Önce Anla

İlk olarak aşağıdaki alanları incele:

```text
AGENT_CONTEXT.md
package.json
src/
src/lib/
src/hooks/
src/components/
src/pages/
src/integrations/supabase/
supabase/
supabase/migrations/
supabase/functions/
scripts/
docs/
server.mjs
vite.config.ts
```

`AGENT_CONTEXT.md` mevcutsa başlangıç bağlamı olarak kullan; fakat içindeki bilgileri kesin gerçek kabul etme. Repo ve remote metadata ile çapraz doğrula.

Özellikle şu kod kullanımlarını ara:

```text
supabase.from(
supabase.rpc(
supabase.auth.
.from("
.rpc("
create table
alter table
create view
create materialized view
create function
create or replace function
security definer
security invoker
set search_path
create policy
alter table
enable row level security
create index
create unique index
references
foreign key
create trigger
drop table
drop function
drop view
drop policy
drop index
```

---

# 2. Mevcut Proje Bağlamını Dikkate Al

CorteQS içinde eski ve yeni sistemlerin paralel yaşadığı alanlar olabilir.

Aşağıdaki nesneleri özellikle incele:

## 2.1 Profil ve Auth Alanı

```text
profiles
user_profiles_v2
user_role_assignments
user_profile_attributes
user_feature_overrides
user_taxonomy_selections
public.admin_users
roles
```

Şu sorulara cevap ver:

```text
- profiles ve user_profiles_v2 halen birlikte aktif mi?
- İki tablo arasında veri tekrarı var mı?
- Hangisi canonical source of truth?
- public.admin_users halen aktif mi?
- Admin kontrolü artık user_role_assignments + roles üzerinden mi çalışıyor?
- Eski tablo yalnızca backward compatibility amacıyla mı tutuluyor?
- Auth user ile profil tabloları arasındaki ilişki net mi?
- Kullanıcının tek rolü mü yoksa birden fazla rolü mü olabilir?
- Role assignment için unique constraint yeterli mi?
```

## 2.2 Catalog ve Directory Alanı

```text
catalog_items
advisor_details
business_details
event_details
person_profile_details
catalog_item_attribute_overrides
catalog_item_feature_overrides
catalog_item_section_overrides
catalog_item_memberships
catalog_claim_requests
catalog_audit_logs
```

Şu sorulara cevap ver:

```text
- catalog_items gerçekten unified ana tablo mu?
- Detail tabloları doğru ilişkilendirilmiş mi?
- linked_profile_id veya benzeri auth bağlantıları tutarlı mı?
- Aynı gerçek dünya kaydı iki farklı tabloda duplicate olarak yaşayabilir mi?
- Claim akışındaki membership ilişkisi yeterince net mi?
- owner, editor ve viewer yetkileri constraint veya RLS ile güvence altında mı?
- Audit log kapsamı yeterli mi?
```

## 2.3 RolesGo, Attribute, Feature ve Section Alanı

```text
roles
attribute_catalog
role_attribute_rules
feature_catalog
role_feature_flags
profile_section_catalog
role_profile_section_rules
taxonomy_groups
taxonomy_options
role_taxonomy_rules
user_taxonomy_selections
```

Şu sorulara cevap ver:

```text
- Hangi tablolar aktif?
- Hangi tablolar legacy?
- Taxonomy runtime gerçekten kaldırıldı mı?
- Frontend halen taxonomy RPC değerlerini çağırıyor mu?
- Kaldırıldığı düşünülen yapıların halen trigger, view, RPC veya frontend referansı var mı?
- Feature override öncelik sırası açık mı?
- user override > role default > fallback yaklaşımı veritabanında tutarlı mı?
- Attribute ve section rule tablolarında duplicate veya çelişkili kayıt oluşabilir mi?
```

## 2.4 Diğer Modüller

```text
submissions
surveys
survey_questions
survey_responses
lansman_basvurular
referral_codes
referral_uses
referral_code_usages
marquee_items
workspace_resources
workspace_todos
workspace_meetings
geo_countries
geo_cities
expenses
incomes
v_muhasebe_kpi
v_muhasebe_by_person
v_muhasebe_by_category
v_muhasebe_cashflow_monthly
```

Kod ve migration geçmişinde bulunan gerçek nesne isimlerini esas al. Doküman ile repo farklıysa uyuşmazlığı raporla.

---

# 3. Supabase CLI Komutlarını Varsayma

Önce kurulu CLI komutlarını doğrula:

```powershell
npx supabase --version
npx supabase --help
npx supabase db --help
npx supabase migration --help
```

Read-only lint veya dump komutları destekleniyorsa kullanmadan önce ilgili help çıktısını kontrol et.

Remote write oluşturabilecek komutları çalıştırma.

İzin verilen yaklaşım:

```text
- Önce help çıktısını oku
- Komutun read-only olduğundan emin ol
- Secret değerlerini loglama
- Bağlı proje yoksa repo migration analiziyle devam et
- Remote bağlantı yoksa bunu rapora yaz
```

---

# 4. Çıktı Dosyaları

Aşağıdaki klasörü oluştur:

```text
docs/database-audit/YYYY-MM-DD/
```

Tarihi çalışma gününün tarihiyle değiştir.

Aşağıdaki dosyaları üret:

```text
docs/database-audit/YYYY-MM-DD/
├── corteqs-database-cleanup-audit.html
├── database-data-dictionary.md
├── database-object-inventory.csv
├── database-module-map.csv
├── database-rls-matrix.csv
├── database-rpc-inventory.csv
├── database-index-review.csv
├── database-legacy-candidates.csv
├── database-migration-roadmap.md
└── sql-drafts/
    ├── README.md
    ├── phase-01-documentation-only.sql
    ├── phase-02-safe-additive-indexes.sql
    ├── phase-03-safe-constraints-draft.sql
    ├── phase-04-rls-hardening-draft.sql
    ├── phase-05-rpc-hardening-draft.sql
    └── phase-06-legacy-retirement-draft.sql
```

Önemli:

```text
- SQL taslaklarını supabase/migrations/ altına koyma.
- SQL taslaklarını çalıştırma.
- Her SQL taslağının en üstüne DRAFT - DO NOT EXECUTE AUTOMATICALLY yaz.
- Her SQL önerisinin yanında risk, ön koşul ve rollback yaklaşımı yaz.
```

---

# 5. Database Object Inventory

Tüm veritabanı nesneleri için envanter çıkar.

## 5.1 Tablolar

Her tablo için şu alanları yaz:

```text
Schema
Table Name
Tahmini Modül
Canonical mı?
Legacy adayı mı?
Primary Key
Foreign Keys
Unique Constraints
Check Constraints
RLS Enabled mı?
Policy Sayısı
Frontend Referans Sayısı
RPC Referans Sayısı
Migration Referans Sayısı
Tahmini Veri Hassasiyeti
Durum
Öneri
```

Durum değerleri:

```text
ACTIVE_CORE
ACTIVE_MODULE
ACTIVE_COMPATIBILITY
LEGACY_REVIEW
DUPLICATE_REVIEW
RETIREMENT_CANDIDATE
UNKNOWN_MANUAL_REVIEW
```

## 5.2 View ve Materialized View Değerleri

Her view için:

```text
Schema
View Name
Kaynak Tablolar
Frontend Kullanımı
RPC Kullanımı
security_invoker Tanımlı mı?
Anon Erişimi Var mı?
Authenticated Erişimi Var mı?
RLS Bypass Riski
Durum
Öneri
```

## 5.3 RPC ve Function Değerleri

Her function veya RPC için:

```text
Schema
Function Name
Parametreler
Return Type
Dil
Security Invoker / Definer
search_path
Execute Yetkileri
Kullanılan Tablolar
Frontend Çağrısı Var mı?
Başka RPC Tarafından Çağrılıyor mu?
Admin Yetkisi Gerekli mi?
Legacy Adayı mı?
Risk
Öneri
```

## 5.4 Trigger Değerleri

Her trigger için:

```text
Trigger Name
Table
Event
Timing
Function
Amaç
Aktif Kullanım
Duplicate Risk
Legacy Risk
Öneri
```

## 5.5 Index Değerleri

Her index için:

```text
Schema
Table
Index Name
Kolonlar
Unique mi?
Constraint Tarafından Üretilmiş mi?
Foreign Key Desteği mi?
RLS Policy Desteği mi?
Query Desteği mi?
Duplicate Adayı mı?
Unused Adayı mı?
Risk
Öneri
```

Bir index değerini kullanılmıyor diye doğrudan silme önerisi verme. Trafik ve query plan verisi olmadan yalnızca `Manuel doğrulama gerekli` olarak işaretle.

---

# 6. Naming Convention ve Kolay Erişim Standardı

Mevcut isimleri zorla değiştirme.

Önce mevcut isimlendirme eğilimlerini çıkar:

```text
- snake_case kullanımı
- Türkçe ve İngilizce isim karışımı
- Tekil ve çoğul tablo isimleri
- id kolon standardı
- foreign key kolon standardı
- created_at ve updated_at standardı
- status kolonları
- audit kolonları
- RPC prefix değerleri
- admin RPC prefix değerleri
- view prefix değerleri
- junction table isimleri
```

Ardından yalnızca **yeni oluşturulacak nesneler** için naming convention rehberi oluştur.

Önerilen rehber bölümleri:

```text
1. Schema isimlendirme standardı
2. Tablo isimlendirme standardı
3. Primary key standardı
4. Foreign key standardı
5. Timestamp standardı
6. Status standardı
7. Soft-delete standardı
8. Audit kolon standardı
9. RPC standardı
10. View standardı
11. Trigger standardı
12. Index standardı
13. Constraint standardı
14. Policy standardı
15. Migration dosya standardı
```

Mevcut nesneleri topluca rename etme önerisi verme. Rename gerekiyorsa compatibility window, view alias, RPC wrapper ve frontend geçiş planı oluştur.

---

# 7. Modül Haritası Hazırla

Veritabanı nesnelerini modül bazında gruplandır.

Önerilen sınıflandırma:

```text
AUTH_PROFILE
ROLESGO
FEATURES
ATTRIBUTES
SECTIONS
TAXONOMY_LEGACY
CATALOG
DIRECTORY
CLAIMS
ADMIN
SURVEYS
LANSMMAN
REFERRAL
WHATSAPP_COMMUNITIES
CADDE
WORKSPACE
MUHASEBE
GEO
SYSTEM
UNKNOWN
```

Her modül için:

```text
- Aktif tablolar
- Aktif view değerleri
- Aktif RPC değerleri
- Trigger değerleri
- İlgili frontend dosyaları
- İlgili migration dosyaları
- Legacy adayları
- Belirsizlikler
```

oluştur.

---

# 8. RLS Audit

Exposed schema içindeki her tabloyu kontrol et.

Her tablo için şu erişim matrisini üret:

```text
Table
anon SELECT
anon INSERT
anon UPDATE
anon DELETE
authenticated SELECT
authenticated INSERT
authenticated UPDATE
authenticated DELETE
admin davranışı
service_role davranışı
RLS enabled
Policy var mı?
USING koşulu
WITH CHECK koşulu
Risk
Öneri
```

Özellikle incele:

```text
- RLS kapalı public tablolar
- RLS açık fakat policy olmayan tablolar
- Policy var fakat RLS kapalı tablolar
- using(true) ile gereğinden geniş erişim
- with check eksikliği
- auth.uid() null kontrolü
- user_metadata tabanlı authorization
- Admin kontrolünün gerçekten güvenilir kaynağa dayanması
- Kullanıcının başka kullanıcıya ait role veya feature override yazabilmesi
- Catalog claim ve membership yetkileri
- Survey response erişimi
- Submissions kişisel veri erişimi
- Workspace admin verileri
- Muhasebe tabloları
- Public directory kişisel veri görünürlüğü
```

Policy performansı için kontrol et:

```text
- Policy içinde kullanılan user_id, owner_id ve benzeri kolonlarda index var mı?
- auth.uid() uygun yerlerde select wrapper ile değerlendirilebilir mi?
- Policy içinde gereksiz subquery veya join var mı?
```

---

# 9. Function ve RPC Audit

Özellikle şu RPC türlerini incele:

```text
get_current_user_features
admin_*
submit_catalog_claim_request
admin_approve_catalog_claim
admin_reject_catalog_claim
profile_*
catalog_*
directory_*
taxonomy_*
```

Her function için şu güvenlik kontrollerini yap:

```text
[ ] security invoker mı?
[ ] security definer gerekiyorsa gerekçesi var mı?
[ ] security definer ise search_path sabit mi?
[ ] Kullanılan tablolar schema prefix ile açıkça yazılmış mı?
[ ] Execute yetkileri gereğinden geniş mi?
[ ] public execute yetkisi gerçekten gerekli mi?
[ ] anon execute yetkisi gerçekten gerekli mi?
[ ] authenticated execute yetkisi gerçekten gerekli mi?
[ ] Admin fonksiyonu içinde admin kontrolü var mı?
[ ] Dynamic SQL kullanılıyor mu?
[ ] SQL injection riski var mı?
[ ] Actor user ID audit log içine yazılıyor mu?
[ ] Legacy function olabilir mi?
[ ] Frontend halen çağırıyor mu?
```

Kullanımı belirsiz RPC değerlerini doğrudan silme önerisi verme.

Durum değerleri:

```text
ACTIVE_REQUIRED
ACTIVE_HARDENING_REQUIRED
LEGACY_COMPATIBILITY
LEGACY_REVIEW
RETIREMENT_CANDIDATE
UNKNOWN_MANUAL_REVIEW
```

---

# 10. Constraint ve Veri Kalitesi Audit

Her tablo için kontrol et:

```text
- Primary key var mı?
- Foreign key var mı?
- Foreign key kolonunda index var mı?
- Unique constraint gerekli mi?
- Duplicate kayıt riski var mı?
- NOT NULL gerekli mi?
- status kolonları kontrollü mü?
- Check constraint gerekli mi?
- created_at var mı?
- updated_at var mı?
- updated_at trigger gerekli mi?
- Soft delete yaklaşımı tutarlı mı?
- on delete cascade bilinçli mi?
- on delete restrict daha güvenli olabilir mi?
- Orphan kayıt riski var mı?
```

Constraint ekleme önerilerini otomatik çalıştırma.

Her öneride şunları yaz:

```text
- Ön koşul sorgusu
- Duplicate veya invalid data kontrolü
- Önerilen constraint
- Veri temizliği gerekip gerekmediği
- Lock riski
- Rollback yaklaşımı
```

---

# 11. Index ve Performans Audit

Şunları kontrol et:

```text
- Foreign key kolonlarında eksik index
- RLS policy kolonlarında eksik index
- Sık filtrelenen kolonlar
- Sık join yapılan kolonlar
- Sık order by yapılan kolonlar
- Duplicate index
- Birbirini kapsayan index
- Muhtemel unused index
- JSONB kolonlarda uygun index ihtiyacı
- Directory search sorguları
- Multiword search sorguları
- Catalog lookup sorguları
- Geo city sorguları
- Referral code sorguları
- Claim queue sorguları
```

Bir index ekleme önerisinde şu alanları ver:

```text
Tablo
Kolonlar
Önerilen Index İsmi
Index Türü
Gerekçe
Kanıt
Beklenen Fayda
Write Maliyeti
Lock Riski
CREATE INDEX CONCURRENTLY uygun mu?
Rollback
```

Remote production üzerinde index oluşturma.

---

# 12. Legacy ve Duplicate Sistem Audit

Özellikle eski ve yeni sistemlerin birlikte yaşadığı alanları belirle.

Her aday için:

```text
Nesne
Tür
Eski Sistem
Yeni Sistem
Frontend Referansı
RPC Referansı
Migration Referansı
Aktif Veri Olabilir mi?
Silme Riski
Önerilen Geçiş Planı
```

Sınıflandırma:

```text
KEEP_ACTIVE
KEEP_COMPATIBILITY
MIGRATE_THEN_RETIRE
REVIEW_WITH_DATA_QUERY
SAFE_RETIREMENT_CANDIDATE
UNKNOWN
```

Özellikle şu ayrımları değerlendir:

```text
profiles ↔ user_profiles_v2
public.admin_users ↔ user_role_assignments + roles
taxonomy runtime ↔ AFS sonrası aktif yaklaşım
item overrides ↔ unified catalog yaklaşımı
eski directory tabloları ↔ catalog tabanlı directory
eski referral kullanım tabloları ↔ güncel referral kullanım tablosu
```

---

# 13. Migration Governance Standardı

Eski migration dosyalarını değiştirme, silme veya yeniden sıralama.

Yeni migration değerleri için rehber oluştur:

```text
YYYYMMDDHHMMSS_<module>_<purpose>.sql
```

Her migration için önerilen yapı:

```sql
-- Purpose:
-- Module:
-- Risk level:
-- Preconditions:
-- Rollback:
-- Data migration required:
-- Estimated lock impact:
-- Manual verification:
```

Migration ilkeleri:

```text
- Küçük ve tek amaçlı migration
- Additive-first yaklaşımı
- Rename öncesinde compatibility window
- Drop işleminden önce kullanım kanıtı
- Constraint öncesinde veri kalite sorgusu
- Index öncesinde duplicate ve kapsama kontrolü
- RLS değişikliğinde policy matrix testi
- RPC değişikliğinde execute privilege kontrolü
- Her destructive değişiklik için rollback planı
- Canlı sistemde tek seferde büyük temizlik yapmama
```

---

# 14. SQL Taslak Dosyaları

SQL taslaklarının tamamı şu uyarıyla başlamalı:

```sql
-- ============================================================
-- DRAFT ONLY - DO NOT EXECUTE AUTOMATICALLY
-- Human review, backup and staging verification are required.
-- ============================================================
```

Taslakları risk seviyesine göre ayır:

## Phase 01 — Documentation Only

Yalnızca yorum ve metadata önerileri.

## Phase 02 — Safe Additive Indexes

Yalnızca güçlü kanıt bulunan index önerileri.

Her index için ayrı blok oluştur ve varsayılan olarak yorum satırında bırak.

## Phase 03 — Safe Constraints Draft

Veri doğrulama sorgularıyla birlikte constraint önerileri.

Tüm DDL komutlarını varsayılan olarak yorum satırında bırak.

## Phase 04 — RLS Hardening Draft

Policy önerileri.

Mevcut policy değerlerini drop etme. Önce karşılaştırmalı öneri sun.

## Phase 05 — RPC Hardening Draft

search_path, execute privilege ve admin check önerileri.

Mevcut function değerlerini otomatik replace etme.

## Phase 06 — Legacy Retirement Draft

Yalnızca retirement candidate listesi ve kontrol sorguları.

Drop komutlarını çalıştırılabilir halde yazma. Yalnızca yorum olarak göster.

---

# 15. HTML Rapor

Şu dosyayı oluştur:

```text
docs/database-audit/YYYY-MM-DD/corteqs-database-cleanup-audit.html
```

Rapor bağımsız tek HTML dosyası olsun.

Harici CDN, harici JavaScript veya harici CSS kullanma.

Raporda şu bölümler olsun:

```text
1. Yönetici Özeti
2. Database Sağlık Skorları
3. Repo ve Remote Erişim Durumu
4. Database Object Envanteri
5. Modül Bazlı Database Haritası
6. Profil, Auth ve RolesGo Analizi
7. Catalog ve Directory Analizi
8. RLS Policy Matrisi
9. RPC ve Function Analizi
10. View ve Trigger Analizi
11. Constraint ve Veri Kalitesi Analizi
12. Index ve Performans Analizi
13. Legacy ve Duplicate Sistem Adayları
14. Migration Geçmişi Analizi
15. Naming Convention Rehberi
16. Migration Governance Standardı
17. SQL Taslakları Özeti
18. Önceliklendirilmiş Aksiyon Planı
19. Manuel Doğrulama Gereken Noktalar
20. Metodoloji ve Sınırlamalar
```

HTML içinde:

```text
- Arama kutusu
- Modül filtresi
- Object-type filtresi
- Risk filtresi
- Status filtresi
- Katlanabilir detay alanları
- Print-friendly görünüm
- Tablo sayıları
- RPC sayıları
- View sayıları
- Trigger sayıları
- Policy sayıları
- Index sayıları
- Legacy aday sayısı
- Manuel doğrulama sayısı
```

olsun.

---

# 16. Sağlık Skorları

Her alana 0–100 arası temkinli skor ver:

```text
Schema Clarity
Naming Consistency
Relationship Integrity
Constraint Coverage
RLS Coverage
RPC Security
View Safety
Index Coverage
Migration Hygiene
Documentation Quality
Legacy Debt
Operational Readiness
```

Her skorun yanında kısa gerekçe yaz.

---

# 17. Önceliklendirilmiş Aksiyon Planı

Aksiyonları şu gruplara ayır:

```text
P0 — Güvenlik veya veri kaybı riski
P1 — İlk 7 gün
P2 — İlk 30 gün
P3 — Kontrollü sadeleştirme dönemi
P4 — Ürün veya mimari kararı gerekiyor
```

Her aksiyon için:

```text
Aksiyon ID
Başlık
Modül
Etkilenen Nesneler
Sorun
Kanıt
Risk
Önerilen Değişiklik
Migration Gerekli mi?
Frontend Değişikliği Gerekli mi?
Data Migration Gerekli mi?
Rollback
Tahmini Efor
Manuel Onay
```

yaz.

---

# 18. Final Kontrol

İşlem sonunda şunları doğrula:

```text
[ ] Remote Supabase üzerinde write işlemi çalıştırmadım.
[ ] supabase db push çalıştırmadım.
[ ] Migration çalıştırmadım.
[ ] Eski migration dosyalarını değiştirmedim.
[ ] supabase/migrations altına yeni aktif migration koymadım.
[ ] Tablo silmedim.
[ ] Kolon silmedim.
[ ] RPC silmedim.
[ ] View silmedim.
[ ] Trigger silmedim.
[ ] Policy silmedim.
[ ] Index silmedim.
[ ] Secret değerlerini rapora yazmadım.
[ ] SQL taslaklarını ayrı klasöre yazdım.
[ ] Her SQL taslağına DRAFT uyarısı ekledim.
[ ] Her destructive öneriyi yorum satırında bıraktım.
[ ] Legacy adaylarında frontend referanslarını kontrol ettim.
[ ] Legacy adaylarında RPC referanslarını kontrol ettim.
[ ] Legacy adaylarında migration referanslarını kontrol ettim.
[ ] Veri kaybı riski bulunan noktaları açıkça işaretledim.
```

Son olarak çalıştır:

```powershell
git status --short
git diff --stat
git diff --name-only
```

---

# 19. Bana Vereceğin Son Yanıt

Çalışma sonunda yalnızca kısa teslim özeti yaz:

```text
Supabase database clean-up audit tamamlandı.

Ana rapor:
docs/database-audit/YYYY-MM-DD/corteqs-database-cleanup-audit.html

Ek çıktılar:
- database-data-dictionary.md
- database-object-inventory.csv
- database-module-map.csv
- database-rls-matrix.csv
- database-rpc-inventory.csv
- database-index-review.csv
- database-legacy-candidates.csv
- database-migration-roadmap.md
- sql-drafts/

Özet:
- İncelenen tablo sayısı:
- İncelenen view sayısı:
- İncelenen RPC sayısı:
- İncelenen trigger sayısı:
- İncelenen policy sayısı:
- İncelenen index sayısı:
- Legacy adayı:
- Duplicate sistem adayı:
- P0 aksiyon:
- P1 aksiyon:
- Manuel doğrulama gereken konu:
- Remote metadata erişimi:
- Read-only lint sonucu:

Not:
Canlı Supabase veritabanında hiçbir değişiklik yapılmadı.
Migration çalıştırılmadı.
SQL taslakları yalnızca insan incelemesi için üretildi.
```
