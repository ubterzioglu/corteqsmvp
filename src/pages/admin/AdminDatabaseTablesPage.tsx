import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Database } from "lucide-react";
import { useState } from "react";

interface TableInfo {
  name: string;
  description: string;
  purpose: string;
  rowCount: number;
  rls: boolean;
  group: string;
}

const DB_TABLES: TableInfo[] = [
  // Auth & Kullanıcı
  // (user_roles legacy enum tablosu 20260609020000 ile kaldırıldı — veri user_role_assignments'a taşındı.)
  { name: "user_role_assignments", description: "Rol Atamaları", purpose: "Kullanıcı–rol bağlantı tablosu. Admin yetkisi buradaki Admin_ prefix'li rollerle belirlenir.", rowCount: 14, rls: true, group: "Auth & Kullanıcı" },
  { name: "user_feature_overrides", description: "Feature Override", purpose: "Belirli kullanıcılar için özellik bayraklarını geçersiz kılar.", rowCount: 59, rls: true, group: "Auth & Kullanıcı" },
  { name: "user_profile_attributes", description: "Profil Nitelikleri", purpose: "Kullanıcı profillerine bağlı özel nitelik değerleri.", rowCount: 28, rls: true, group: "Auth & Kullanıcı" },
  { name: "user_cvs", description: "Kullanıcı CV'leri", purpose: "Yüklenen CV dosyalarının meta verilerini tutar.", rowCount: 3, rls: true, group: "Auth & Kullanıcı" },
  { name: "user_connections", description: "Kullanıcı Bağlantıları", purpose: "Kullanıcılar arası bağlantı/arkadaşlık kayıtları.", rowCount: 0, rls: true, group: "Auth & Kullanıcı" },
  { name: "user_follows", description: "Takip Kayıtları", purpose: "Kullanıcıların birbirini takip etme ilişkileri.", rowCount: 1, rls: true, group: "Auth & Kullanıcı" },
  { name: "user_taxonomy_selections", description: "Taksonomi Seçimleri", purpose: "Kullanıcıların seçtiği taksonomi/kategori tercihleri.", rowCount: 0, rls: true, group: "Auth & Kullanıcı" },
  { name: "phone_verifications", description: "Telefon Doğrulama", purpose: "Telefon numarası doğrulama kayıtları.", rowCount: 0, rls: true, group: "Auth & Kullanıcı" },
  { name: "profile_views", description: "Profil Görüntülemeleri", purpose: "Hangi profilin kim tarafından görüntülendiğini loglar.", rowCount: 0, rls: true, group: "Auth & Kullanıcı" },
  { name: "profile_onboarding_imports", description: "Onboarding İçe Aktarma", purpose: "Kullanıcı kayıt sürecinde içe aktarılan profil verileri.", rowCount: 0, rls: true, group: "Auth & Kullanıcı" },

  // Katalog (Dizin)
  { name: "catalog_items", description: "Katalog Kayıtları", purpose: "Ana dizin kayıtları (bireyler, şirketler, kuruluşlar vb.).", rowCount: 530, rls: true, group: "Katalog" },
  { name: "catalog_categories", description: "Katalog Kategorileri", purpose: "Katalog kayıtlarını gruplandıran kategori ağacı.", rowCount: 88, rls: true, group: "Katalog" },
  { name: "catalog_item_types", description: "Kayıt Tipleri", purpose: "Katalog kayıt tiplerini tanımlar (şirket, birey vb.).", rowCount: 91, rls: true, group: "Katalog" },
  { name: "catalog_item_categories", description: "Kayıt–Kategori", purpose: "Katalog kayıtları ile kategoriler arasındaki çoktan-çoğa ilişki.", rowCount: 517, rls: true, group: "Katalog" },
  { name: "catalog_item_contacts", description: "Kayıt İletişim Bilgileri", purpose: "E-posta, telefon gibi iletişim bilgilerini saklar.", rowCount: 296, rls: true, group: "Katalog" },
  { name: "catalog_item_links", description: "Kayıt Linkleri", purpose: "Web sitesi, sosyal medya ve diğer harici linkler.", rowCount: 484, rls: true, group: "Katalog" },
  { name: "catalog_item_locations", description: "Kayıt Konumları", purpose: "Katalog kayıtlarının coğrafi konum bilgileri.", rowCount: 516, rls: true, group: "Katalog" },
  { name: "catalog_item_media", description: "Kayıt Medya", purpose: "Fotoğraf, logo ve diğer medya dosyası referansları.", rowCount: 257, rls: true, group: "Katalog" },
  { name: "catalog_item_services", description: "Kayıt Hizmetleri", purpose: "Kayıtların sunduğu hizmetlerin listesi.", rowCount: 17, rls: true, group: "Katalog" },
  { name: "catalog_item_tags", description: "Kayıt Etiketleri", purpose: "Serbest etiket (tag) ilişkilendirmeleri.", rowCount: 30, rls: true, group: "Katalog" },
  { name: "catalog_item_languages", description: "Kayıt Dilleri", purpose: "Kayıtların desteklediği diller.", rowCount: 20, rls: true, group: "Katalog" },
  { name: "catalog_item_memberships", description: "Üyelik İlişkileri", purpose: "Kayıtların üye olduğu organizasyonlar.", rowCount: 38, rls: true, group: "Katalog" },
  { name: "catalog_item_attributes", description: "Kayıt Nitelikleri", purpose: "Kayıtlara eklenen özel nitelik değerleri.", rowCount: 4, rls: true, group: "Katalog" },
  { name: "catalog_item_attribute_overrides", description: "Nitelik Geçersiz Kılma", purpose: "Kayıt bazında nitelik kurallarını geçersiz kılar.", rowCount: 0, rls: true, group: "Katalog" },
  { name: "catalog_item_feature_overrides", description: "Feature Geçersiz Kılma", purpose: "Kayıt bazında özellik bayraklarını geçersiz kılar.", rowCount: 0, rls: true, group: "Katalog" },
  { name: "catalog_item_section_overrides", description: "Bölüm Geçersiz Kılma", purpose: "Kayıt bazında profil bölümü görünürlüğünü geçersiz kılar.", rowCount: 0, rls: true, group: "Katalog" },
  { name: "catalog_item_favorites", description: "Favori Kayıtlar", purpose: "Kullanıcıların favorilere eklediği katalog kayıtları.", rowCount: 0, rls: true, group: "Katalog" },
  { name: "catalog_item_reports", description: "Kayıt Şikayetleri", purpose: "Kullanıcı tarafından bildirilen içerik şikayetleri.", rowCount: 0, rls: true, group: "Katalog" },
  { name: "catalog_item_reviews", description: "Kayıt Yorumları", purpose: "Katalog kayıtlarına yapılan değerlendirme ve yorumlar.", rowCount: 0, rls: true, group: "Katalog" },
  { name: "catalog_item_relations", description: "Kayıt İlişkileri", purpose: "Katalog kayıtları arasındaki özel ilişkiler.", rowCount: 0, rls: true, group: "Katalog" },
  { name: "catalog_item_verification_records", description: "Doğrulama Kayıtları", purpose: "Katalog kayıtlarının doğrulanma geçmişi.", rowCount: 0, rls: true, group: "Katalog" },
  { name: "catalog_claim_requests", description: "Sahiplik Talepleri", purpose: "Kullanıcıların bir katalog kaydının sahibi olduğunu talep etmesi.", rowCount: 1, rls: true, group: "Katalog" },
  { name: "catalog_search_documents", description: "Arama Dokümanları", purpose: "Tam metin araması için optimize edilmiş tablo.", rowCount: 530, rls: true, group: "Katalog" },
  { name: "catalog_audit_logs", description: "Katalog Audit Logları", purpose: "Katalog üzerindeki değişikliklerin denetim kaydı.", rowCount: 1, rls: true, group: "Katalog" },
  { name: "source_records", description: "Kaynak Kayıtlar", purpose: "Dış kaynaklardan içe aktarılan ham kayıtlar.", rowCount: 516, rls: true, group: "Katalog" },
  { name: "duplicate_candidates", description: "Mükerrer Adaylar", purpose: "Olası mükerrer katalog kayıtlarını işaretler.", rowCount: 0, rls: true, group: "Katalog" },
  { name: "merge_history", description: "Birleştirme Geçmişi", purpose: "Birleştirilen kayıtların geçmişini saklar.", rowCount: 0, rls: true, group: "Katalog" },

  // Profil Detayları
  { name: "organization_details", description: "Organizasyon Detayları", purpose: "Şirket/kuruluş tipindeki kayıtların genişletilmiş bilgileri.", rowCount: 482, rls: true, group: "Profil Detayları" },
  { name: "individual_profile_details", description: "Bireysel Profil Detayları", purpose: "Bireysel profillerin genişletilmiş bilgileri.", rowCount: 9, rls: true, group: "Profil Detayları" },
  { name: "person_profile_details", description: "Kişi Profil Detayları", purpose: "Kişi tipindeki kayıtların detay bilgileri.", rowCount: 14, rls: true, group: "Profil Detayları" },
  { name: "business_details", description: "İşletme Detayları", purpose: "İşletme tipindeki kayıtların genişletilmiş bilgileri.", rowCount: 0, rls: true, group: "Profil Detayları" },
  { name: "event_details", description: "Etkinlik Detayları", purpose: "Etkinlik tipindeki kayıtların genişletilmiş bilgileri.", rowCount: 0, rls: true, group: "Profil Detayları" },
  { name: "job_posting_details", description: "İş İlanı Detayları", purpose: "İş ilanı kayıtlarının detayları.", rowCount: 0, rls: true, group: "Profil Detayları" },
  { name: "marketplace_listing_details", description: "Pazar Yeri İlanları", purpose: "Pazar yeri tipindeki kayıtların detayları.", rowCount: 0, rls: true, group: "Profil Detayları" },
  { name: "community_group_details", description: "Topluluk Grup Detayları", purpose: "WhatsApp/topluluk gruplarının genişletilmiş bilgileri.", rowCount: 10, rls: true, group: "Profil Detayları" },
  { name: "independent_profiles", description: "Bağımsız Profiller", purpose: "Auth kullanıcısına bağlı olmayan bağımsız profil kayıtları.", rowCount: 241, rls: true, group: "Profil Detayları" },
  { name: "entity_metadata", description: "Varlık Meta Verileri", purpose: "Katalog kayıtlarına ek meta veri alanları.", rowCount: 78, rls: true, group: "Profil Detayları" },

  // Rol & Yetki Sistemi
  { name: "roles", description: "Roller", purpose: "Sistemdeki tüm rollerin tanım listesi.", rowCount: 82, rls: true, group: "Rol & Yetki" },
  { name: "feature_catalog", description: "Özellik Kataloğu", purpose: "Sistemdeki tüm özellik bayraklarının tanımları.", rowCount: 42, rls: true, group: "Rol & Yetki" },
  { name: "feature_definitions", description: "Özellik Tanımları", purpose: "Özellik bayraklarının detaylı tanımları.", rowCount: 20, rls: true, group: "Rol & Yetki" },
  { name: "attribute_catalog", description: "Nitelik Kataloğu", purpose: "Profillere eklenebilecek niteliklerin tanım listesi.", rowCount: 33, rls: true, group: "Rol & Yetki" },
  { name: "profile_section_catalog", description: "Profil Bölüm Kataloğu", purpose: "Profil sayfasındaki bölümlerin tanım listesi.", rowCount: 7, rls: true, group: "Rol & Yetki" },
  { name: "role_feature_flags", description: "Rol–Özellik Bayrakları", purpose: "Her role hangi özelliklerin atanacağını belirler.", rowCount: 2487, rls: true, group: "Rol & Yetki" },
  { name: "_member_backup_20260609", description: "Üye Yedeği", purpose: "Migration öncesi 124 üyenin tam yedek tablosu. Güvenlik ağı — silinmez.", rowCount: 124, rls: false, group: "Sistem" },
  { name: "role_attribute_rules", description: "Rol Nitelik Kuralları", purpose: "Role göre nitelik görünürlük ve zorunluluk kuralları.", rowCount: 1977, rls: true, group: "Rol & Yetki" },
  { name: "role_profile_section_rules", description: "Rol Profil Bölüm Kuralları", purpose: "Role göre profil bölümü görünürlük kuralları.", rowCount: 574, rls: true, group: "Rol & Yetki" },
  { name: "role_taxonomy_rules", description: "Rol Taksonomi Kuralları", purpose: "Role göre taksonomi seçim kuralları.", rowCount: 2, rls: true, group: "Rol & Yetki" },
  { name: "item_type_features", description: "Tip–Özellik İlişkisi", purpose: "Kayıt tipine göre hangi özelliklerin geçerli olduğu.", rowCount: 64, rls: true, group: "Rol & Yetki" },
  { name: "item_type_feature_defaults", description: "Tip Özellik Varsayılanları", purpose: "Kayıt tipine göre özellik varsayılan değerleri.", rowCount: 7, rls: true, group: "Rol & Yetki" },
  { name: "item_type_attribute_rules", description: "Tip Nitelik Kuralları", purpose: "Kayıt tipine göre nitelik kuralları.", rowCount: 11, rls: true, group: "Rol & Yetki" },

  // Referral
  { name: "referral_codes", description: "Referral Kodları", purpose: "Kullanıcı davet/referral kodlarını saklar.", rowCount: 46, rls: true, group: "Referral" },
  { name: "referral_code_usages", description: "Kod Kullanımları", purpose: "Referral kodlarının kaç kez ve kim tarafından kullanıldığı.", rowCount: 39, rls: true, group: "Referral" },
  { name: "referral_groups", description: "Referral Grupları", purpose: "Referral kodlarını gruplandıran kategoriler.", rowCount: 30, rls: true, group: "Referral" },
  { name: "referral_sources", description: "Referral Kaynakları", purpose: "Kullanıcının sisteme nereden geldiğini tanımlar.", rowCount: 14, rls: true, group: "Referral" },
  { name: "referral_types", description: "Referral Tipleri", purpose: "Referral işleminin tipini tanımlar.", rowCount: 8, rls: true, group: "Referral" },
  { name: "referral_codes_legacy", description: "Eski Referral Kodları", purpose: "Eski sistemden aktarılan referral kodları.", rowCount: 2, rls: true, group: "Referral" },

  // WhatsApp & Topluluk
  { name: "whatsapp_landings", description: "WhatsApp Landing'ler", purpose: "WhatsApp topluluk davet sayfalarının konfigürasyonları.", rowCount: 10, rls: true, group: "WhatsApp & Topluluk" },
  { name: "whatsapp_landing_editors", description: "Landing Editörleri", purpose: "WhatsApp landing sayfalarını düzenleme yetkisi olan kullanıcılar.", rowCount: 1, rls: true, group: "WhatsApp & Topluluk" },
  { name: "whatsapp_join_requests", description: "Katılma Talepleri", purpose: "WhatsApp grubuna katılmak isteyen kullanıcıların talepleri.", rowCount: 0, rls: true, group: "WhatsApp & Topluluk" },
  { name: "wa_messages", description: "WA Mesajları", purpose: "WhatsApp üzerinden alınan mesajların kaydı.", rowCount: 278, rls: true, group: "WhatsApp & Topluluk" },
  { name: "wa_tasks", description: "WA Görevleri", purpose: "WhatsApp mesajlarından oluşturulan görevler.", rowCount: 2, rls: true, group: "WhatsApp & Topluluk" },
  { name: "wa_users", description: "WA Kullanıcıları", purpose: "WhatsApp botla etkileşime giren kullanıcıların kaydı.", rowCount: 31, rls: true, group: "WhatsApp & Topluluk" },

  // Muhasebe
  { name: "incomes", description: "Gelirler", purpose: "Muhasebe modülünde gelir kayıtları.", rowCount: 0, rls: true, group: "Muhasebe" },
  { name: "expenses", description: "Giderler", purpose: "Muhasebe modülünde gider kayıtları.", rowCount: 27, rls: true, group: "Muhasebe" },

  // Cadde
  { name: "cadde_posts", description: "Cadde Gönderileri", purpose: "Cadde modülündeki kullanıcı gönderileri.", rowCount: 3, rls: true, group: "Cadde" },
  { name: "cadde_post_comments", description: "Cadde Yorumları", purpose: "Cadde gönderilerine yapılan yorumlar.", rowCount: 0, rls: true, group: "Cadde" },
  { name: "cadde_post_reactions", description: "Cadde Reaksiyonları", purpose: "Cadde gönderilerine verilen tepkiler (beğeni vb.).", rowCount: 0, rls: true, group: "Cadde" },
  { name: "cadde_cafes", description: "Cadde Kafeler", purpose: "Cadde modülündeki kafe/mekan kayıtları.", rowCount: 2, rls: true, group: "Cadde" },
  { name: "cadde_cafe_members", description: "Kafe Üyeleri", purpose: "Kafe/mekanlara üye olan kullanıcılar.", rowCount: 0, rls: true, group: "Cadde" },
  { name: "cadde_cities", description: "Cadde Şehirleri", purpose: "Cadde modülünde desteklenen şehirler.", rowCount: 6, rls: true, group: "Cadde" },
  { name: "cadde_countries", description: "Cadde Ülkeleri", purpose: "Cadde modülünde desteklenen ülkeler.", rowCount: 5, rls: true, group: "Cadde" },
  { name: "cadde_billboard_cards", description: "Billboard Kartları", purpose: "Cadde sayfasında gösterilen reklam/duyuru kartları.", rowCount: 2, rls: true, group: "Cadde" },
  { name: "cadde_sponsored_placements", description: "Sponsorlu Yerleşimler", purpose: "Cadde modülündeki sponsorlu içerik yerleşimleri.", rowCount: 1, rls: true, group: "Cadde" },
  { name: "cafe_memberships", description: "Kafe Üyelikleri", purpose: "Kullanıcıların kafe üyelik kayıtları.", rowCount: 0, rls: true, group: "Cadde" },
  { name: "cafes", description: "Kafeler", purpose: "Genel kafe/mekan kayıt tablosu.", rowCount: 0, rls: true, group: "Cadde" },

  // Anket & Başvurular
  { name: "surveys", description: "Anketler", purpose: "Oluşturulan anket şablonları.", rowCount: 1, rls: true, group: "Anket & Başvurular" },
  { name: "survey_questions", description: "Anket Soruları", purpose: "Anketlere ait soru listesi.", rowCount: 6, rls: true, group: "Anket & Başvurular" },
  { name: "survey_responses", description: "Anket Yanıtları", purpose: "Kullanıcıların ankete verdiği yanıt oturumları.", rowCount: 13, rls: true, group: "Anket & Başvurular" },
  { name: "survey_answers", description: "Anket Cevapları", purpose: "Tekil soru cevapları (response'a bağlı).", rowCount: 12, rls: true, group: "Anket & Başvurular" },
  { name: "submissions", description: "Form Gönderimleri", purpose: "Genel form gönderim kayıtları (lansman, iletişim vb.).", rowCount: 135, rls: true, group: "Anket & Başvurular" },
  { name: "lansman_registrations", description: "Lansman Kayıtları", purpose: "Lansman sayfasından yapılan ön kayıt başvuruları.", rowCount: 2, rls: true, group: "Anket & Başvurular" },
  { name: "approval_requests", description: "Onay Talepleri", purpose: "Admin onayı bekleyen işlem talepleri.", rowCount: 1, rls: true, group: "Anket & Başvurular" },
  { name: "interest_registrations", description: "İlgi Kayıtları", purpose: "Henüz aktif olmayan özelliklere ilgi bildiren kullanıcılar.", rowCount: 0, rls: true, group: "Anket & Başvurular" },
  { name: "contact_messages", description: "İletişim Mesajları", purpose: "Sitedeki iletişim formu aracılığıyla gönderilen mesajlar.", rowCount: 0, rls: true, group: "Anket & Başvurular" },
  { name: "city_ambassador_applications", description: "Şehir Temsilcisi Başvuruları", purpose: "Şehir temsilcisi olmak isteyen kullanıcıların başvuruları.", rowCount: 0, rls: true, group: "Anket & Başvurular" },
  { name: "founding_1000_signups", description: "Kurucu 1000 Kayıtları", purpose: "İlk 1000 kurucu üye kayıt başvuruları.", rowCount: 0, rls: true, group: "Anket & Başvurular" },

  // İçerik & Yayın
  { name: "marquee_items", description: "Haber Bandı", purpose: "Sitenin üst kısmındaki kayan haber bandı içerikleri.", rowCount: 9, rls: true, group: "İçerik & Yayın" },
  { name: "news_posts", description: "Haber Gönderileri", purpose: "Site içi haber ve güncel içerikler.", rowCount: 10, rls: true, group: "İçerik & Yayın" },
  { name: "may19_campaign_submissions", description: "19 Mayıs Kampanya", purpose: "19 Mayıs kampanyasına yapılan katılım gönderimleri.", rowCount: 6, rls: true, group: "İçerik & Yayın" },
  { name: "may19_submissions", description: "19 Mayıs Gönderimleri", purpose: "19 Mayıs etkinliğine ait diğer gönderimler.", rowCount: 0, rls: true, group: "İçerik & Yayın" },
  { name: "feed_posts", description: "Feed Gönderileri", purpose: "Kullanıcı akışında gösterilen içerik gönderileri.", rowCount: 0, rls: true, group: "İçerik & Yayın" },
  { name: "feed_likes", description: "Feed Beğenileri", purpose: "Feed gönderilerine yapılan beğeniler.", rowCount: 0, rls: true, group: "İçerik & Yayın" },
  { name: "generated_posts", description: "Üretilen Gönderiler", purpose: "AI veya otomasyon ile üretilen içerik gönderileri.", rowCount: 0, rls: true, group: "İçerik & Yayın" },
  { name: "site_settings", description: "Site Ayarları", purpose: "Genel site konfigürasyon değerlerini saklar (singleton).", rowCount: 1, rls: true, group: "İçerik & Yayın" },
  { name: "social_media_links", description: "Sosyal Medya Linkleri", purpose: "Sitenin sosyal medya hesabı linkleri.", rowCount: 4, rls: true, group: "İçerik & Yayın" },

  // Workspace & Operasyon
  { name: "command_center_items", description: "Command Center Öğeleri", purpose: "Admin command center'daki görev ve not öğeleri.", rowCount: 647, rls: true, group: "Workspace & Operasyon" },
  { name: "command_center_legacy_map", description: "CC Legacy Haritası", purpose: "Eski CC yapısından yeni yapıya geçiş eşleme tablosu.", rowCount: 592, rls: true, group: "Workspace & Operasyon" },
  { name: "meeting_notes", description: "Toplantı Notları", purpose: "Admin workspace'deki toplantı notları.", rowCount: 470, rls: true, group: "Workspace & Operasyon" },
  { name: "mvp_items", description: "MVP Öğeleri", purpose: "MVP listesindeki görevler ve özellikler.", rowCount: 188, rls: true, group: "Workspace & Operasyon" },
  { name: "todo_items", description: "Yapılacaklar", purpose: "Admin workspace yapılacaklar listesi öğeleri.", rowCount: 122, rls: true, group: "Workspace & Operasyon" },
  { name: "todos", description: "Todo Listesi", purpose: "Genel todo tablosu.", rowCount: 0, rls: true, group: "Workspace & Operasyon" },
  { name: "gorevler", description: "Görevler", purpose: "Türkçe görev takip tablosu.", rowCount: 9, rls: true, group: "Workspace & Operasyon" },
  { name: "draft_notlar", description: "Taslak Notlar", purpose: "Kaydedilmemiş/taslak notlar.", rowCount: 2, rls: true, group: "Workspace & Operasyon" },
  { name: "resource_entries", description: "Kaynak Girişleri", purpose: "Admin workspace'deki dosya ve link kaynakları.", rowCount: 221, rls: true, group: "Workspace & Operasyon" },
  { name: "links", description: "Linkler", purpose: "Genel link yönetim tablosu.", rowCount: 45, rls: true, group: "Workspace & Operasyon" },
  { name: "arge_links", description: "ARGE Linkleri", purpose: "ARGE bölümüne ait link kaynakları.", rowCount: 2, rls: true, group: "Workspace & Operasyon" },
  { name: "arge_cards", description: "ARGE Kartları", purpose: "ARGE dashboard kartları.", rowCount: 0, rls: true, group: "Workspace & Operasyon" },
  { name: "arge_files", description: "ARGE Dosyaları", purpose: "ARGE bölümüne ait dosya referansları.", rowCount: 0, rls: true, group: "Workspace & Operasyon" },
  { name: "doc_categories", description: "Döküman Kategorileri", purpose: "Admin panel dökümanlarının kategori yapısı.", rowCount: 1, rls: true, group: "Workspace & Operasyon" },

  // Sosyal Medya & Danışman
  { name: "advisor_details", description: "Danışman Detayları", purpose: "Danışman tipindeki profillerin ek bilgileri.", rowCount: 10, rls: true, group: "Sosyal Medya & Danışman" },
  { name: "advisor_social_media_links", description: "Danışman SM Linkleri", purpose: "Danışmanlara ait sosyal medya linkleri.", rowCount: 58, rls: true, group: "Sosyal Medya & Danışman" },
  { name: "consultant_categories", description: "Danışman Kategorileri", purpose: "Danışman profillerinin kategori sınıflandırması.", rowCount: 0, rls: true, group: "Sosyal Medya & Danışman" },
  { name: "consultant_social_media_links", description: "Danışman/Consultant SM", purpose: "Consultant tipindeki profillerin sosyal medya linkleri.", rowCount: 0, rls: true, group: "Sosyal Medya & Danışman" },
  { name: "influencer_social_media_links", description: "Influencer SM Linkleri", purpose: "Influencer tipindeki profillerin sosyal medya linkleri.", rowCount: 58, rls: true, group: "Sosyal Medya & Danışman" },
  { name: "contributor_social_media_links", description: "Katkı Sağlayan SM", purpose: "Contributor tipindeki profillerin sosyal medya linkleri.", rowCount: 0, rls: true, group: "Sosyal Medya & Danışman" },

  // Taksonomi
  { name: "taxonomy_groups", description: "Taksonomi Grupları", purpose: "Taksonomi seçeneklerini gruplandıran üst kategoriler.", rowCount: 2, rls: true, group: "Taksonomi" },
  { name: "taxonomy_options", description: "Taksonomi Seçenekleri", purpose: "Kullanıcıların seçebileceği taksonomi değerleri.", rowCount: 11, rls: true, group: "Taksonomi" },

  // Etkinlik & İş
  { name: "events", description: "Etkinlikler", purpose: "Platform etkinliklerinin genel listesi.", rowCount: 0, rls: true, group: "Etkinlik & İş" },
  { name: "job_listings", description: "İş İlanları", purpose: "Platformda yayınlanan iş ilanları.", rowCount: 0, rls: true, group: "Etkinlik & İş" },
  { name: "job_applications", description: "İş Başvuruları", purpose: "İş ilanlarına yapılan başvurular.", rowCount: 0, rls: true, group: "Etkinlik & İş" },
  { name: "service_requests", description: "Hizmet Talepleri", purpose: "Kullanıcıların platform üzerinden yaptığı hizmet talepleri.", rowCount: 0, rls: true, group: "Etkinlik & İş" },
  { name: "service_proposals", description: "Hizmet Teklifleri", purpose: "Hizmet taleplerine verilen teklifler.", rowCount: 0, rls: true, group: "Etkinlik & İş" },
  { name: "coupon_purchases", description: "Kupon Satın Alma", purpose: "Platform kuponlarının satın alım kayıtları.", rowCount: 0, rls: true, group: "Etkinlik & İş" },
  { name: "welcome_pack_orders", description: "Karşılama Paketi Siparişleri", purpose: "Yeni üyelere gönderilen karşılama paketi siparişleri.", rowCount: 0, rls: true, group: "Etkinlik & İş" },
  { name: "welcome_pack_proposals", description: "Karşılama Paketi Teklifleri", purpose: "Karşılama paketi içerik teklifleri.", rowCount: 0, rls: true, group: "Etkinlik & İş" },
  { name: "matches", description: "Eşleşmeler", purpose: "Kullanıcılar arası eşleştirme kayıtları.", rowCount: 0, rls: true, group: "Etkinlik & İş" },
  { name: "contacts", description: "Kişiler", purpose: "Platform dışı kişi/iletişim bilgisi kayıtları.", rowCount: 0, rls: true, group: "Etkinlik & İş" },

  // Mesajlaşma & Bildirim
  { name: "messages", description: "Mesajlar", purpose: "Platform içi mesajlaşma kayıtları.", rowCount: 0, rls: true, group: "Mesajlaşma & Bildirim" },
  { name: "direct_messages", description: "Direkt Mesajlar", purpose: "Kullanıcılar arası birebir mesajlaşma.", rowCount: 0, rls: true, group: "Mesajlaşma & Bildirim" },
  { name: "notifications", description: "Bildirimler", purpose: "Kullanıcılara gönderilen uygulama bildirimleri.", rowCount: 0, rls: true, group: "Mesajlaşma & Bildirim" },

  // Türk Misyonları
  { name: "turkish_missions", description: "Türk Misyonları", purpose: "Yurt dışındaki Türk diplomatik temsilciliklerinin listesi.", rowCount: 241, rls: true, group: "Türk Misyonları" },
  { name: "turkish_mission_units", description: "Misyon Birimleri", purpose: "Türk misyonlarına bağlı birimler (vb. konsolosluk).", rowCount: 34, rls: true, group: "Türk Misyonları" },
  { name: "turkish_mission_relations", description: "Misyon İlişkileri", purpose: "Misyon kayıtları ile katalog kayıtları arasındaki ilişkiler.", rowCount: 5, rls: true, group: "Türk Misyonları" },

  // Diaspora & Coğrafya
  { name: "geo_cities", description: "Coğrafi Şehirler", purpose: "Dünya geneli şehir veri tabanı (PostGIS uyumlu).", rowCount: 76990, rls: true, group: "Coğrafya & Diaspora" },
  { name: "geo_countries", description: "Coğrafi Ülkeler", purpose: "Dünya geneli ülke veri tabanı.", rowCount: 251, rls: true, group: "Coğrafya & Diaspora" },
  { name: "diaspora_instagram_accounts", description: "Diaspora Instagram", purpose: "Diaspora ilgili Instagram hesaplarının kaydı.", rowCount: 57, rls: true, group: "Coğrafya & Diaspora" },
  { name: "diaspora_city_scan_queue", description: "Şehir Tarama Kuyruğu", purpose: "Instagram şehir tarama işlemleri için kuyruk tablosu.", rowCount: 10, rls: true, group: "Coğrafya & Diaspora" },
  { name: "diaspora_scan_runs", description: "Tarama Çalıştırmaları", purpose: "Diaspora tarama işlemlerinin çalıştırma logları.", rowCount: 14, rls: true, group: "Coğrafya & Diaspora" },
  { name: "spatial_ref_sys", description: "Uzamsal Referans Sistemi", purpose: "PostGIS eklentisinin koordinat referans sistemi tablosu. Sistem tablosu, RLS kasıtlı kapalı.", rowCount: 8500, rls: false, group: "Coğrafya & Diaspora" },

  // Sistem & RAG
  { name: "admin_audit_logs", description: "Admin Audit Logları", purpose: "Admin paneli üzerindeki tüm değişikliklerin denetim kaydı.", rowCount: 41, rls: true, group: "Sistem" },
  { name: "edge_rate_limits", description: "Edge Rate Limitleri", purpose: "Edge function'lar için istek hız sınırı kayıtları.", rowCount: 6, rls: true, group: "Sistem" },
  { name: "moderation_queue", description: "Moderasyon Kuyruğu", purpose: "İçerik moderasyonu bekleyen öğeler.", rowCount: 0, rls: true, group: "Sistem" },
  { name: "rag_documents", description: "RAG Dokümanları", purpose: "AI asistan için vektör arama dokümanları.", rowCount: 17, rls: true, group: "Sistem" },
];

const GROUPS = [...new Set(DB_TABLES.map((t) => t.group))];

export default function AdminDatabaseTablesPage() {
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const filtered = DB_TABLES.filter((t) => {
    const matchesSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.purpose.toLowerCase().includes(search.toLowerCase());
    const matchesGroup = !activeGroup || t.group === activeGroup;
    return matchesSearch && matchesGroup;
  });

  const rlsOffCount = DB_TABLES.filter((t) => !t.rls).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Database className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Veritabanı Tabloları</h1>
          <p className="text-sm text-muted-foreground">
            Supabase projesi <code className="text-xs">injprdrsklkxgnaiixzh</code> — public şema tabloları
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Tablo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{DB_TABLES.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">RLS Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{DB_TABLES.length - rlsOffCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">RLS Kapalı</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-destructive">{rlsOffCount}</p>
            <p className="text-xs text-muted-foreground">spatial_ref_sys (PostGIS sistem tablosu)</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Tablo adı veya açıklama ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setActiveGroup(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              !activeGroup ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            Tümü
          </button>
          {GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => setActiveGroup(g === activeGroup ? null : g)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeGroup === g ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Tablo Adı</TableHead>
                <TableHead className="w-[160px]">Türkçe Adı</TableHead>
                <TableHead>Açıklama / Kullanım Amacı</TableHead>
                <TableHead className="w-[120px]">Grup</TableHead>
                <TableHead className="w-[90px] text-right">Satırlar</TableHead>
                <TableHead className="w-[80px] text-center">RLS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Sonuç bulunamadı.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((table) => (
                  <TableRow key={table.name}>
                    <TableCell className="font-mono text-xs font-medium">{table.name}</TableCell>
                    <TableCell className="text-sm font-medium">{table.description}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{table.purpose}</TableCell>
                    <TableCell>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {table.group}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {table.rowCount.toLocaleString("tr-TR")}
                    </TableCell>
                    <TableCell className="text-center">
                      {table.rls ? (
                        <Badge variant="outline" className="border-green-500 text-green-600">
                          Aktif
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Kapalı</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        * Satır sayıları sorgu anındaki değerlerdir. RLS kapalı tek tablo <code>spatial_ref_sys</code> olup PostGIS sistem tablosudur.
      </p>
    </div>
  );
}
