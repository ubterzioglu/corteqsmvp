begin;

-- Seed 76 platform roles from platform-rolleri.md.
-- Additive only: existing 6 roles (bireysel, danisman, isletme, kurulus-dernek,
-- blogger-vlogger-youtuber, sehir-elcisi) are untouched — their sort_order (10-60)
-- keeps them at the top. New roles use sort_order 1000+ blocked by family.
-- No existing users are remapped; role assignment is a manual admin action.

insert into public.roles (key, label, sort_order, is_active)
values
  -- User family (1000+)
  ('User_Standard',          'Standart Kullanıcı',                        1000, true),
  ('User_DiasporaMember',    'Diaspora Üyesi',                            1010, true),
  ('User_Contributor',       'Destekçi',                                  1020, true),
  ('User_CityAmbassador',    'Şehir Elçisi',                              1030, true),
  ('User_BloggerVlogger',    'Blogger / Vlogger',                         1040, true),

  -- Admin family (1100+)
  ('Admin_ContentModerator', 'İçerik Moderatörü',                         1100, true),
  ('Admin_PlatformAdmin',    'Platform Yöneticisi',                       1110, true),
  ('Admin_SuperAdmin',       'Süper Admin',                               1120, true),

  -- Consultant family (1200+)
  ('Consultant_RealEstate',         'Gayrimenkul Danışmanı',              1200, true),
  ('Consultant_VisaImmigration',    'Vize & Göçmenlik Danışmanı',         1210, true),
  ('Consultant_BusinessSetupWork',  'Şirket Kuruluşu & İş Danışmanı',    1220, true),
  ('Consultant_LawTax',             'Hukuk & Vergi Danışmanı',            1230, true),
  ('Consultant_TrademarkPatent',    'Marka & Patent Danışmanı',           1240, true),
  ('Consultant_Financial',          'Finansal Danışman',                  1250, true),
  ('Consultant_LifeRelocation',     'Yaşam & Relocation Danışmanı',       1260, true),
  ('Consultant_FamilyChildren',     'Aile & Çocuk Danışmanı',             1270, true),
  ('Consultant_PsychologistCoach',  'Psikolog & Koç',                     1280, true),
  ('Consultant_Education',          'Eğitim Danışmanı',                   1290, true),
  ('Consultant_PracticalLife',      'Pratik Hayat Danışmanı',             1300, true),

  -- Organization family (1400+)
  ('Organization_AssociationFoundation', 'Dernek / Vakıf',                1400, true),
  ('Organization_ChamberCouncil',        'Oda / Konsey',                  1410, true),
  ('Organization_AcademicUnit',          'Akademik Birim',                1420, true),
  ('Organization_EducationInstitution',  'Eğitim Kuruluşu',               1430, true),
  ('Organization_TurkishMedia',          'Türk Medya Kuruluşu',           1440, true),
  ('Organization_EmbassyConsulate',      'Büyükelçilik / Konsolosluk',    1450, true),
  ('Organization_HealthcareInstitution', 'Sağlık Kuruluşu',               1460, true),
  ('Organization_DigitalCommunity',      'Dijital Topluluk',              1470, true),

  -- Business family (1600+)
  ('Business_RestaurantCafe',        'Restoran / Cafe',                   1600, true),
  ('Business_MarketGrocery',         'Market / Bakkal',                   1610, true),
  ('Business_BakeryPatisserie',      'Fırın / Pastane',                   1620, true),
  ('Business_HairdresserBeauty',     'Kuaför / Güzellik Merkezi',         1630, true),
  ('Business_Barber',                'Berber',                            1640, true),
  ('Business_HealthcareClinic',      'Sağlık Merkezi / Klinik',           1650, true),
  ('Business_Pharmacy',              'Eczane',                            1660, true),
  ('Business_LawOffice',             'Hukuk Bürosu',                      1670, true),
  ('Business_AccountingFinance',     'Muhasebe / Finans Ofisi',           1680, true),
  ('Business_RealEstateOffice',      'Gayrimenkul Ofisi',                 1690, true),
  ('Business_TravelAgency',          'Seyahat Acentesi',                  1700, true),
  ('Business_HotelAccommodation',    'Otel / Konaklama',                  1710, true),
  ('Business_EducationInstitution',  'Eğitim Kurumu',                     1720, true),
  ('Business_LanguageSchool',        'Dil Okulu',                         1730, true),
  ('Business_ITSoftware',            'IT / Yazılım Şirketi',              1740, true),
  ('Business_DesignAdvertising',     'Tasarım / Reklam Ajansı',           1750, true),
  ('Business_ConstructionRenovation','İnşaat / Tadilat Firması',          1760, true),
  ('Business_TransportLogistics',    'Nakliye / Lojistik Firması',        1770, true),
  ('Business_Automotive',            'Otomotiv İşletmesi',                1780, true),
  ('Business_Gym',                   'Spor Salonu',                       1790, true),
  ('Business_ChildrenFamily',        'Çocuk / Aile İşletmesi',            1800, true),
  ('Business_Insurance',             'Sigorta Şirketi / Acentesi',        1810, true),
  ('Business_RetailStore',           'Perakende / Mağaza',                1820, true),
  ('Business_ECommerce',             'E-Ticaret İşletmesi',               1830, true),
  ('Business_Wholesale',             'Toptan Ticaret İşletmesi',          1840, true),

  -- Healthcare family (2000+)
  ('Healthcare_Doctor',               'Doktor',                           2000, true),
  ('Healthcare_Dentist',              'Diş Hekimi',                       2010, true),
  ('Healthcare_Psychologist',         'Psikolog',                         2020, true),
  ('Healthcare_Hospital',             'Hastane',                          2030, true),
  ('Healthcare_Clinic',               'Klinik',                           2040, true),
  ('Healthcare_Pharmacy',             'Eczane',                           2050, true),
  ('Healthcare_AppointmentProvider',  'Randevu Veren Sağlık Kuruluşu',   2060, true),

  -- Event family (2100+)
  ('Event_Organizer', 'Etkinlik Organizatörü',                            2100, true),
  ('Event_Venue',     'Etkinlik Mekânı',                                  2110, true),
  ('Event_Sponsor',   'Etkinlik Sponsoru',                                2120, true),

  -- Job family (2200+)
  ('Job_Employer',   'İşveren',                                           2200, true),
  ('Job_Recruiter',  'İşe Alım Uzmanı / Recruiter',                       2210, true),
  ('Job_Candidate',  'İş Arayan',                                         2220, true),
  ('Job_Agency',     'İş Bulma Kurumu / Ajans',                           2230, true),

  -- Community family (2300+)
  ('Community_GroupAdmin',        'Topluluk Yöneticisi',                  2300, true),
  ('Community_WhatsAppAdmin',     'WhatsApp Grup Yöneticisi',             2310, true),
  ('Community_TelegramAdmin',     'Telegram Grup Yöneticisi',             2320, true),
  ('Community_DiscordAdmin',      'Discord Topluluk Yöneticisi',          2330, true),
  ('Community_SocialMediaAdmin',  'Sosyal Medya Topluluk Yöneticisi',     2340, true),

  -- Marketplace family (2400+)
  ('Marketplace_IndividualSeller', 'Bireysel İlan Sahibi',                2400, true),
  ('Marketplace_BusinessSeller',   'Kurumsal Satıcı',                     2410, true),
  ('Marketplace_ServiceProvider',  'Hizmet Sağlayıcı',                   2420, true),
  ('Marketplace_CourseProvider',   'Ders / Kurs Sağlayıcısı',             2430, true),
  ('Marketplace_Landlord',         'Ev / Oda İlanı Sahibi',               2440, true)

on conflict (key) do update
  set
    label      = excluded.label,
    sort_order = excluded.sort_order,
    is_active  = true,
    updated_at = now()
  where
    public.roles.label      is distinct from excluded.label
    or public.roles.sort_order is distinct from excluded.sort_order
    or public.roles.is_active  is distinct from true;

commit;
