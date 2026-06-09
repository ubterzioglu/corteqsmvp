# RolesGo Referans Katalogları

> Kaynak: `/admin/new-member/guide#rol-listesi` sayfasının "Referans Katalogları" bölümü.
> Veri canlı veritabanından çekildi (`roles`, `attribute_catalog`, `feature_catalog`, `profile_section_catalog`, `entity_metadata`).
> Üretim tarihi: 2026-06-09

## İçindekiler

- [Tüm Roller (82)](#tüm-roller-82)
- [Attribute Kataloğu (55)](#attribute-kataloğu-55)
- [Feature Kataloğu (42)](#feature-kataloğu-42)
- [Bölüm Kataloğu — Sections (7)](#bölüm-kataloğu--sections-7)

### Kural Açıklamaları (Legend)

| Kısaltma | Anlam |
|---|---|
| A | Aktif |
| F | Feature |
| Z | Zorunlu |
| P | Public |
| D | Düzenler |
| G | Global / Gizler |
| O | Onay |
| R | Rol |
| S | Sıra |

---

## Tüm Roller (82)

### Legacy (Eski Sistem) — 6 rol

| Etiket | Anahtar (key) |
|---|---|
| Bireysel Kullanıcı | `bireysel` |
| Danışman | `danisman` |
| İşletme | `isletme` |
| Kuruluş / Dernek | `kurulus-dernek` |
| Blogger / Vlogger / YouTuber | `blogger-vlogger-youtuber` |
| Şehir Elçisi | `sehir-elcisi` |

### Kullanıcı — 5 rol

| Etiket | Anahtar (key) |
|---|---|
| Standart Kullanıcı | `User_Standard` |
| Diaspora Üyesi | `User_DiasporaMember` |
| Destekçi | `User_Contributor` |
| Şehir Elçisi | `User_CityAmbassador` |
| Blogger / Vlogger | `User_BloggerVlogger` |

### Admin — 3 rol

| Etiket | Anahtar (key) |
|---|---|
| İçerik Moderatörü | `Admin_ContentModerator` |
| Platform Yöneticisi | `Admin_PlatformAdmin` |
| Süper Admin | `Admin_SuperAdmin` |

### Danışman — 11 rol

| Etiket | Anahtar (key) |
|---|---|
| Gayrimenkul Danışmanı | `Consultant_RealEstate` |
| Vize & Göçmenlik Danışmanı | `Consultant_VisaImmigration` |
| Şirket Kuruluşu & İş Danışmanı | `Consultant_BusinessSetupWork` |
| Hukuk & Vergi Danışmanı | `Consultant_LawTax` |
| Marka & Patent Danışmanı | `Consultant_TrademarkPatent` |
| Finansal Danışman | `Consultant_Financial` |
| Yaşam & Relocation Danışmanı | `Consultant_LifeRelocation` |
| Aile & Çocuk Danışmanı | `Consultant_FamilyChildren` |
| Psikolog & Koç | `Consultant_PsychologistCoach` |
| Eğitim Danışmanı | `Consultant_Education` |
| Pratik Hayat Danışmanı | `Consultant_PracticalLife` |

### Kuruluş — 8 rol

| Etiket | Anahtar (key) |
|---|---|
| Dernek / Vakıf | `Organization_AssociationFoundation` |
| Oda / Konsey | `Organization_ChamberCouncil` |
| Akademik Birim | `Organization_AcademicUnit` |
| Eğitim Kuruluşu | `Organization_EducationInstitution` |
| Türk Medya Kuruluşu | `Organization_TurkishMedia` |
| Büyükelçilik / Konsolosluk | `Organization_EmbassyConsulate` |
| Sağlık Kuruluşu | `Organization_HealthcareInstitution` |
| Dijital Topluluk | `Organization_DigitalCommunity` |

### İşletme — 24 rol

| Etiket | Anahtar (key) |
|---|---|
| Restoran / Cafe | `Business_RestaurantCafe` |
| Market / Bakkal | `Business_MarketGrocery` |
| Fırın / Pastane | `Business_BakeryPatisserie` |
| Kuaför / Güzellik Merkezi | `Business_HairdresserBeauty` |
| Berber | `Business_Barber` |
| Sağlık Merkezi / Klinik | `Business_HealthcareClinic` |
| Eczane | `Business_Pharmacy` |
| Hukuk Bürosu | `Business_LawOffice` |
| Muhasebe / Finans Ofisi | `Business_AccountingFinance` |
| Gayrimenkul Ofisi | `Business_RealEstateOffice` |
| Seyahat Acentesi | `Business_TravelAgency` |
| Otel / Konaklama | `Business_HotelAccommodation` |
| Eğitim Kurumu | `Business_EducationInstitution` |
| Dil Okulu | `Business_LanguageSchool` |
| IT / Yazılım Şirketi | `Business_ITSoftware` |
| Tasarım / Reklam Ajansı | `Business_DesignAdvertising` |
| İnşaat / Tadilat Firması | `Business_ConstructionRenovation` |
| Nakliye / Lojistik Firması | `Business_TransportLogistics` |
| Otomotiv İşletmesi | `Business_Automotive` |
| Spor Salonu | `Business_Gym` |
| Çocuk / Aile İşletmesi | `Business_ChildrenFamily` |
| Sigorta Şirketi / Acentesi | `Business_Insurance` |
| Perakende / Mağaza | `Business_RetailStore` |
| E-Ticaret İşletmesi | `Business_ECommerce` |
| Toptan Ticaret İşletmesi | `Business_Wholesale` |

### Sağlık — 7 rol

| Etiket | Anahtar (key) |
|---|---|
| Doktor | `Healthcare_Doctor` |
| Diş Hekimi | `Healthcare_Dentist` |
| Psikolog | `Healthcare_Psychologist` |
| Hastane | `Healthcare_Hospital` |
| Klinik | `Healthcare_Clinic` |
| Eczane | `Healthcare_Pharmacy` |
| Randevu Veren Sağlık Kuruluşu | `Healthcare_AppointmentProvider` |

### Etkinlik — 3 rol

| Etiket | Anahtar (key) |
|---|---|
| Etkinlik Organizatörü | `Event_Organizer` |
| Etkinlik Mekânı | `Event_Venue` |
| Etkinlik Sponsoru | `Event_Sponsor` |

### İş — 4 rol

| Etiket | Anahtar (key) |
|---|---|
| İşveren | `Job_Employer` |
| İşe Alım Uzmanı / Recruiter | `Job_Recruiter` |
| İş Arayan | `Job_Candidate` |
| İş Bulma Kurumu / Ajans | `Job_Agency` |

### Topluluk — 5 rol

| Etiket | Anahtar (key) |
|---|---|
| Topluluk Yöneticisi | `Community_GroupAdmin` |
| WhatsApp Grup Yöneticisi | `Community_WhatsAppAdmin` |
| Telegram Grup Yöneticisi | `Community_TelegramAdmin` |
| Discord Topluluk Yöneticisi | `Community_DiscordAdmin` |
| Sosyal Medya Topluluk Yöneticisi | `Community_SocialMediaAdmin` |

### Marketplace — 5 rol

| Etiket | Anahtar (key) |
|---|---|
| Bireysel İlan Sahibi | `Marketplace_IndividualSeller` |
| Kurumsal Satıcı | `Marketplace_BusinessSeller` |
| Hizmet Sağlayıcı | `Marketplace_ServiceProvider` |
| Ders / Kurs Sağlayıcısı | `Marketplace_CourseProvider` |
| Ev / Oda İlanı Sahibi | `Marketplace_Landlord` |

---

## Attribute Kataloğu (55)

| Etiket | Anahtar (key) | Veri Tipi | Açıklama |
|---|---|---|---|
| Profil Fotoğrafı | `avatar_url` | url | — |
| Gorunen Isim | `full_name` | text | Profilin gorunen ismi |
| Ulke | `country` | text | Profilin ulkesi |
| Telefon | `phone` | phone | — |
| Sehir | `city` | text | Profilin sehri |
| Meslek | `profession` | text | — |
| Profil Gorseli | `profile_photo_url` | url | Profil veya logo gorseli |
| Okul | `school` | text | — |
| Adres | `address` | textarea | — |
| Kisa Aciklama | `bio_short` | textarea | Kisa profil aciklamasi |
| Haritada Göster | `show_on_map` | boolean | — |
| CV | `cv_path` | url | — |
| CV Adı | `cv_name` | text | — |
| Sunum | `presentation_path` | url | — |
| Sunum Adı | `presentation_name` | text | — |
| İşletme Adı | `business_name` | text | — |
| Sektör | `business_sector` | text | — |
| İşletme Websitesi | `business_website` | url | — |
| İşletme Açıklaması | `business_description` | textarea | — |
| Gönüllü Mentor | `is_volunteer_mentor` | boolean | — |
| Mentor Konuları | `mentor_topics` | text | — |
| Haftalık Mentor Saati | `mentor_weekly_hours` | text | — |
| Ilgi Alanlari | `interests` | textarea | Bireysel kullanicinin ilgi alanlari |
| Doğrulanmış | `is_verified` | boolean | — |
| Uzmanlik Alani | `expertise_area` | text | Consultant ana uzmanlik alani |
| Eleman Arıyor | `hiring_mode` | boolean | — |
| Isletme Kategorisi | `business_category` | text | Isletmenin faaliyet kategorisi |
| Telefon Doğrulandı | `phone_verified` | boolean | — |
| Kurulus Turu | `organization_type` | text | Kurulus tipi |
| Ana Platform | `main_platform` | text | Influencer ana platformu |
| Sorumlu Sehir | `ambassador_city` | text | Elcinin sorumlu oldugu sehir |
| LinkedIn URL | `linkedin_url` | url | Public LinkedIn profil linki |
| İşletme / Kuruluş | `business_or_organization` | text | Kullanıcının ilişkilendirdiği işletme veya kuruluş bilgisi. |
| Instagram | `instagram_url` | url | Public Instagram profil veya hesap linki |
| Facebook | `facebook_url` | url | Public Facebook sayfa veya profil linki |
| İştigal / İlgi Sahası | `interest_focus` | text | Kullanıcının iştigal veya ilgi sahası. |
| Referral Kodu | `referral_code` | text | Kullanıcıyla ilişkilendirilmiş referral kodu. |
| YouTube | `youtube_url` | url | Public YouTube kanal veya video linki |
| Bizi nereden buldunuz? | `referral_source` | select | Kullanıcının CorteQS ile ilk temas kaynağı. |
| TikTok | `tiktok_url` | url | Public TikTok profil linki |
| X (Twitter) | `x_url` | url | Public X veya Twitter profil linki |
| Reddit | `reddit_url` | url | Public Reddit profil veya subreddit linki |
| İş Arıyorum Badge'i | `job_seeking_opt_in` | boolean | Profilinde iş aradığını belirten rozet tercih kaydı |
| Yakında Taşınacağım | `moving_soon_opt_in` | boolean | Yakında taşınacağını belirten rozet tercih kaydı |
| Gönüllü Mentörlük | `volunteer_mentorship_opt_in` | boolean | Gönüllü mentörlük görünürlüğü tercih kaydı |
| CV / Özgeçmiş | `cv_doc` | json | Profil sahibinin yüklediği özel CV dosyası |
| Website | `website_url` | url | Public website veya landing adresi |
| Sunum / Tanıtım | `presentation_doc` | json | Profil sahibinin yüklediği özel sunum veya tanıtım dosyası |
| Servis Bölgeleri | `service_regions` | textarea | Hizmet verilen şehir, ülke veya bölgeler |
| Fiziksel Adres | `physical_address` | textarea | Ofis veya işletme fiziksel adresi |
| Harita Linki | `map_link` | url | Google Maps veya yön tarifi linki |
| Kuruluş Yılı | `founded_year` | text | Startup veya işletme kuruluş yılı |
| Gayrimenkul Medya Linkleri | `real_estate_media_urls` | textarea | Gayrimenkul danışmanlığı için görsel veya video linkleri |

---

## Feature Kataloğu (42)

| Etiket | Anahtar (key) | Global Durum | Açıklama |
|---|---|---|---|
| Admin Onayi Gerektirir | `admin.requires_approval` | Global Aktif | Islem admin onayina tabi |
| Cadde Erişimi | `cadde.access` | Global Aktif | Kullanıcının CorteQS Cadde sayfasına erişmesini sağlar. |
| Sehir Yonetimi | `city.manage` | Global Aktif | Sehir bazli yonetim |
| Iletisim Talebi Al | `contact.receive` | Global Aktif | Iletisim talebi alma |
| WhatsApp Goster | `contact.show_whatsapp` | Global Aktif | WhatsApp bilgisini gosterme |
| Icerik Olustur | `content.create` | Global Aktif | Icerik/post olusturma |
| Icerik Duzenle | `content.edit_own` | Global Aktif | Kendi icerigini duzenleme |
| Dashboard: Admin Önizleme Modu | `dashboard.admin_onizleme_modu` | Pasif | Admin için önizleme modu |
| Dashboard: Analitik | `dashboard.tab_analitik` | Global Aktif | Analitik tabına erişim |
| Dashboard: Etkinlikler | `dashboard.tab_etkinlikler` | Global Aktif | Etkinlikler tabına erişim |
| Dashboard: Mesaj Kutusu | `dashboard.tab_mesaj_kutusu` | Global Aktif | Mesaj kutusu tabına erişim |
| Dashboard: Profil Ayarları | `dashboard.tab_profil_ayarlari` | Global Aktif | Profil ayarları tabına erişim |
| Dashboard: Takip Ettiklerim | `dashboard.tab_takip_ettiklerim` | Global Aktif | Takip listesi tabına erişim |
| Dashboard: WhatsApp | `dashboard.tab_whatsapp` | Global Aktif | WhatsApp tabına erişim |
| One Cikarilmis Profil | `directory.featured` | Global Aktif | One cikarilmis listing |
| Directory Gorunurlugu | `directory.visible` | Global Aktif | Public directory gorunurlugu |
| Etkinlik Olustur | `events.create` | Global Aktif | Etkinlik olusturma |
| External Links | `external_links` | Global Aktif | Public website and social links |
| Favorites | `favorites` | Global Aktif | Saved items for signed-in users |
| Hakkında | `individual.about` | Global Aktif | Bireysel kullanıcı hakkında/özet modülü |
| Aktivite | `individual.activity` | Global Aktif | Bireysel aktivite akışı modülü |
| CV Talebi | `individual.cv_request` | Global Aktif | Bireysel CV talebi modülü |
| Etkinlikler | `individual.events` | Global Aktif | Bireysel etkinlikler modülü |
| Takipler | `individual.follows` | Global Aktif | Bireysel takip edilenler modülü |
| İş Arıyorum Badge'i | `individual.job_seeking_badge` | Global Aktif | Profilde İş Arıyorum etiketi görünür. |
| Mesajlar | `individual.messages` | Global Aktif | Bireysel mesajlar modülü |
| Yakında Taşınacağım | `individual.moving_soon_badge` | Global Aktif | Taşınma planını rozet ve filtre akışlarında görünür kılar. |
| Hizmet Talepleri | `individual.service_requests` | Global Aktif | Bireysel hizmet talepleri modülü |
| Gönüllü Mentörlük | `individual.volunteer_mentorship` | Global Aktif | Profil üzerinden gönüllü mentör görünürlüğünü açar. |
| WhatsApp | `individual.whatsapp` | Global Aktif | Bireysel WhatsApp modülü |
| Media Gallery | `media_gallery` | Global Aktif | Public media attachments |
| Teklif Olustur | `offers.create` | Global Aktif | Hizmet/teklif olusturma |
| CV Yükleme | `profile.cv_upload` | Global Aktif | Kullanıcının profiline CV / özgeçmiş dosyası yüklemesini sağlar. |
| Profilimi Duzenle | `profile.edit_own` | Global Aktif | Kendi profilini duzenleme |
| Public Profil Alanlari | `profile.edit_public` | Global Aktif | Public alanlarini duzenleme |
| LinkedIn Kartı | `profile.linkedin_card` | Global Aktif | Kullanıcının LinkedIn kartını profilinde yönetmesini sağlar. |
| Sunum Yükleme | `profile.presentation_upload` | Global Aktif | Kullanıcının profiline sunum / tanıtım dosyası yüklemesini sağlar. |
| Profilimi Goruntule | `profile.view_own` | Global Aktif | Kendi profilini goruntuleme |
| Web Sitesi Kartı | `profile.website_card` | Global Aktif | Kullanıcının web sitesi kartını profilinde yönetmesini sağlar. |
| Referral Olustur | `referral.create` | Global Aktif | Referral olusturma |
| Verification Badge | `verification_badge` | Global Aktif | Verified or official source markers |
| Atanmış Topluluk Landing Düzenleme | `whatsapp_landing.edit_assigned` | Global Aktif | Kullanıcının admin tarafından atandığı topluluk landing kayıtlarını düzenlemesini sağlar. |

---

## Bölüm Kataloğu — Sections (7)

| Etiket | Anahtar (key) | Alan (section_area) | Açıklama |
|---|---|---|---|
| İsim / Kuruluş Adı | `preview.isim_kurulus_adi` | preview_card | Public ön kart ana başlığı |
| Konum | `preview.konum` | preview_card | Şehir ve ülke konumu |
| Profil / Logo Görseli | `preview.profil_logo_gorseli` | preview_card | Public profil görseli |
| Kategori / Sektör Etiketi | `preview.kategori_sektor_etiketi` | preview_card | Rol özel alanı veya taxonomy etiketleri |
| Hakkında | `detail.hakkinda_bio` | detail_card | Public kısa açıklama |
| Uzmanlık / Alt Tip Etiketleri | `detail.taxonomy_etiketleri` | detail_card | Taxonomy etiketleri |
| İletişim Linkleri | `detail.iletisim_linkleri` | detail_card | Public website ve sosyal medya linkleri |
