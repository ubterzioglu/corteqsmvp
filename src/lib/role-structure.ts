// A5 · Rol yapısı veri modülü (Excel'den üretildi — ELLE DEĞİŞTİRİLMEZ)
//
// Kaynak: CorteQS_Rol_Tablosu_v2.xlsx → "Yeni Rol Yapısı" sayfası
// Üretim betiği: scripts/generate-role-structure.mjs
//
// ⚠️ Bu dosyayı ELLE düzenleme. Excel değiştiğinde betiği yeniden çalıştır:
//   node scripts/generate-role-structure.mjs

export type RoleDurum = "onaylandi" | "oneri";

export interface RoleStructureEntry {
  anaRol: string;
  altRol: string;
  uzmanlik: string;
  yeniKod: string;
  eskiKod: string;
  durum: RoleDurum;
}

/**
 * Rol yapısı: 7 ana rol, 49 alt rol, 19 ÖNERİ.
 * Excel'den üretildi — elle değiştirilmez.
 */
export const ROLE_STRUCTURE: readonly RoleStructureEntry[] = [
  {
    "anaRol": "Bireysel Kullanıcı",
    "altRol": "Bireysel Kullanıcı (varsayılan)",
    "uzmanlik": "",
    "yeniKod": "bireysel",
    "eskiKod": "",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Şehir Elçisi",
    "altRol": "Şehir Elçisi",
    "uzmanlik": "Networking & Etkinlik",
    "yeniKod": "ambassador.sehir_elcisi.networking_etkinlik",
    "eskiKod": "consultant.ambassador.networking_etkinlik",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Şehir Elçisi",
    "altRol": "Şehir Elçisi",
    "uzmanlik": "Yeni Gelenler & Welcome",
    "yeniKod": "ambassador.sehir_elcisi.yeni_gelenler_welcome",
    "eskiKod": "consultant.ambassador.yeni_gelenler_welcome",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Şehir Elçisi",
    "altRol": "Şehir Elçisi",
    "uzmanlik": "İşletme & Ticari Bağlantılar",
    "yeniKod": "ambassador.sehir_elcisi.isletme_ticari_baglantilar",
    "eskiKod": "consultant.ambassador.isletme_ticari_baglantilar",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Şehir Elçisi",
    "altRol": "Şehir Elçisi",
    "uzmanlik": "Kültür & Sanat",
    "yeniKod": "ambassador.sehir_elcisi.kultur_sanat",
    "eskiKod": "consultant.ambassador.kultur_sanat",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Şehir Elçisi",
    "altRol": "Şehir Elçisi",
    "uzmanlik": "Aile & Çocuk Toplulukları",
    "yeniKod": "ambassador.sehir_elcisi.aile_cocuk_topluluklari",
    "eskiKod": "consultant.ambassador.aile_cocuk_topluluklari",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Şehir Elçisi",
    "altRol": "Şehir Elçisi",
    "uzmanlik": "Öğrenci & Akademik",
    "yeniKod": "ambassador.sehir_elcisi.ogrenci_akademik",
    "eskiKod": "consultant.ambassador.ogrenci_akademik",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Şehir Elçisi",
    "altRol": "Şehir Elçisi",
    "uzmanlik": "Sağlık & Wellbeing",
    "yeniKod": "ambassador.sehir_elcisi.saglik_wellbeing",
    "eskiKod": "consultant.ambassador.saglik_wellbeing",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Şehir Elçisi",
    "altRol": "Şehir Elçisi",
    "uzmanlik": "Spor & Outdoor",
    "yeniKod": "ambassador.sehir_elcisi.spor_outdoor",
    "eskiKod": "consultant.ambassador.spor_outdoor",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Gayrimenkul",
    "uzmanlik": "Ev kiralama",
    "yeniKod": "consultant.gayrimenkul.ev_kiralama",
    "eskiKod": "consultant.gayrimenkul.ev_kiralama",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Gayrimenkul",
    "uzmanlik": "Ev satın alma",
    "yeniKod": "consultant.gayrimenkul.ev_satin_alma",
    "eskiKod": "consultant.gayrimenkul.ev_satin_alma",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Gayrimenkul",
    "uzmanlik": "Ticari gayrimenkul",
    "yeniKod": "consultant.gayrimenkul.ticari_gayrimenkul",
    "eskiKod": "consultant.gayrimenkul.ticari_gayrimenkul",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Gayrimenkul",
    "uzmanlik": "Yatırım danışmanlığı",
    "yeniKod": "consultant.gayrimenkul.yatirim_danismanligi",
    "eskiKod": "consultant.gayrimenkul.yatirim_danismanligi",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Gayrimenkul",
    "uzmanlik": "Mortgage / kredi",
    "yeniKod": "consultant.gayrimenkul.mortgage_kredi",
    "eskiKod": "consultant.gayrimenkul.mortgage_kredi",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Gayrimenkul",
    "uzmanlik": "Relocation housing",
    "yeniKod": "consultant.gayrimenkul.relocation_housing",
    "eskiKod": "consultant.gayrimenkul.relocation_housing",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Vize & Göçmenlik",
    "uzmanlik": "Öğrenci vizesi",
    "yeniKod": "consultant.vize_gocmenlik.ogrenci_vizesi",
    "eskiKod": "consultant.vize_gocmenlik.ogrenci_vizesi",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Vize & Göçmenlik",
    "uzmanlik": "Çalışma vizesi",
    "yeniKod": "consultant.vize_gocmenlik.calisma_vizesi",
    "eskiKod": "consultant.vize_gocmenlik.calisma_vizesi",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Vize & Göçmenlik",
    "uzmanlik": "Blue Card",
    "yeniKod": "consultant.vize_gocmenlik.blue_card",
    "eskiKod": "consultant.vize_gocmenlik.blue_card",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Vize & Göçmenlik",
    "uzmanlik": "Oturum & PR",
    "yeniKod": "consultant.vize_gocmenlik.oturum_pr",
    "eskiKod": "consultant.vize_gocmenlik.oturum_pr",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Vize & Göçmenlik",
    "uzmanlik": "Vatandaşlık",
    "yeniKod": "consultant.vize_gocmenlik.vatandaslik",
    "eskiKod": "consultant.vize_gocmenlik.vatandaslik",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Vize & Göçmenlik",
    "uzmanlik": "Aile birleşimi",
    "yeniKod": "consultant.vize_gocmenlik.aile_birlesimi",
    "eskiKod": "consultant.vize_gocmenlik.aile_birlesimi",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Vize & Göçmenlik",
    "uzmanlik": "İltica / asylum",
    "yeniKod": "consultant.vize_gocmenlik.iltica_asylum",
    "eskiKod": "consultant.vize_gocmenlik.iltica_asylum",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Vize & Göçmenlik",
    "uzmanlik": "Golden Visa",
    "yeniKod": "consultant.vize_gocmenlik.golden_visa",
    "eskiKod": "consultant.vize_gocmenlik.golden_visa",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Şirket Kuruluşu & İş",
    "uzmanlik": "Şirket kuruluş",
    "yeniKod": "consultant.sirket_is.sirket_kurulus",
    "eskiKod": "consultant.sirket_is.sirket_kurulus",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Şirket Kuruluşu & İş",
    "uzmanlik": "Freelance / self-employed",
    "yeniKod": "consultant.sirket_is.freelance_self_employed",
    "eskiKod": "consultant.sirket_is.freelance_self_employed",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Şirket Kuruluşu & İş",
    "uzmanlik": "Startup danışmanlığı",
    "yeniKod": "consultant.sirket_is.startup_danismanligi",
    "eskiKod": "consultant.sirket_is.startup_danismanligi",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Şirket Kuruluşu & İş",
    "uzmanlik": "İş geliştirme",
    "yeniKod": "consultant.sirket_is.is_gelistirme",
    "eskiKod": "consultant.sirket_is.is_gelistirme",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Şirket Kuruluşu & İş",
    "uzmanlik": "Yerel iş bulma",
    "yeniKod": "consultant.sirket_is.yerel_is_bulma",
    "eskiKod": "consultant.sirket_is.yerel_is_bulma",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Şirket Kuruluşu & İş",
    "uzmanlik": "CV / interview koçluğu",
    "yeniKod": "consultant.sirket_is.cv_interview_koclugu",
    "eskiKod": "consultant.sirket_is.cv_interview_koclugu",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Şirket Kuruluşu & İş",
    "uzmanlik": "Networking",
    "yeniKod": "consultant.sirket_is.networking",
    "eskiKod": "consultant.sirket_is.networking",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Şirket Kuruluşu & İş",
    "uzmanlik": "Free Zone",
    "yeniKod": "consultant.sirket_is.free_zone",
    "eskiKod": "consultant.sirket_is.free_zone",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Hukuk & Vergi",
    "uzmanlik": "Bireysel vergi",
    "yeniKod": "consultant.hukuk_vergi.bireysel_vergi",
    "eskiKod": "consultant.hukuk_vergi.bireysel_vergi",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Hukuk & Vergi",
    "uzmanlik": "Şirket vergisi",
    "yeniKod": "consultant.hukuk_vergi.sirket_vergisi",
    "eskiKod": "consultant.hukuk_vergi.sirket_vergisi",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Hukuk & Vergi",
    "uzmanlik": "Uluslararası vergi",
    "yeniKod": "consultant.hukuk_vergi.uluslararasi_vergi",
    "eskiKod": "consultant.hukuk_vergi.uluslararasi_vergi",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Hukuk & Vergi",
    "uzmanlik": "Göçmen hukuku",
    "yeniKod": "consultant.hukuk_vergi.gocmen_hukuku",
    "eskiKod": "consultant.hukuk_vergi.gocmen_hukuku",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Hukuk & Vergi",
    "uzmanlik": "İş hukuku",
    "yeniKod": "consultant.hukuk_vergi.is_hukuku",
    "eskiKod": "consultant.hukuk_vergi.is_hukuku",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Hukuk & Vergi",
    "uzmanlik": "Sözleşme hukuku",
    "yeniKod": "consultant.hukuk_vergi.sozlesme_hukuku",
    "eskiKod": "consultant.hukuk_vergi.sozlesme_hukuku",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Hukuk & Vergi",
    "uzmanlik": "Şirket kuruluş hukuku",
    "yeniKod": "consultant.hukuk_vergi.sirket_kurulus_hukuku",
    "eskiKod": "consultant.hukuk_vergi.sirket_kurulus_hukuku",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Hukuk & Vergi",
    "uzmanlik": "Marka tescil & takip",
    "yeniKod": "consultant.hukuk_vergi.marka_tescil_takip",
    "eskiKod": "consultant.marka_patent.marka_tescil_takip",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Hukuk & Vergi",
    "uzmanlik": "Patent başvuru & koruma",
    "yeniKod": "consultant.hukuk_vergi.patent_basvuru_koruma",
    "eskiKod": "consultant.marka_patent.patent_basvuru_koruma",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Hukuk & Vergi",
    "uzmanlik": "Fikri mülkiyet danışmanlığı",
    "yeniKod": "consultant.hukuk_vergi.fikri_mulkiyet_danismanligi",
    "eskiKod": "consultant.marka_patent.fikri_mulkiyet_danismanligi",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Hukuk & Vergi",
    "uzmanlik": "Tasarım tescil",
    "yeniKod": "consultant.hukuk_vergi.tasarim_tescil",
    "eskiKod": "consultant.marka_patent.tasarim_tescil",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Hukuk & Vergi",
    "uzmanlik": "Lisanslama & franchising hukuku",
    "yeniKod": "consultant.hukuk_vergi.lisanslama_franchising_hukuku",
    "eskiKod": "consultant.marka_patent.lisanslama_franchising_hukuku",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Finansal",
    "uzmanlik": "Banka hesabı açma",
    "yeniKod": "consultant.finansal.banka_hesabi_acma",
    "eskiKod": "consultant.finansal.banka_hesabi_acma",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Finansal",
    "uzmanlik": "Kredi & finansman",
    "yeniKod": "consultant.finansal.kredi_finansman",
    "eskiKod": "consultant.finansal.kredi_finansman",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Finansal",
    "uzmanlik": "Yatırım danışmanlığı",
    "yeniKod": "consultant.finansal.yatirim_danismanligi",
    "eskiKod": "consultant.finansal.yatirim_danismanligi",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Finansal",
    "uzmanlik": "Sigorta danışmanlığı",
    "yeniKod": "consultant.finansal.sigorta_danismanligi",
    "eskiKod": "consultant.finansal.sigorta_danismanligi",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Finansal",
    "uzmanlik": "Emeklilik planlama",
    "yeniKod": "consultant.finansal.emeklilik_planlama",
    "eskiKod": "consultant.finansal.emeklilik_planlama",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Finansal",
    "uzmanlik": "Bütçe yönetimi",
    "yeniKod": "consultant.finansal.butce_yonetimi",
    "eskiKod": "consultant.finansal.butce_yonetimi",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Yaşam & Relocation",
    "uzmanlik": "Şehre adaptasyon",
    "yeniKod": "consultant.yasam_relocation.sehre_adaptasyon",
    "eskiKod": "consultant.yasam_relocation.sehre_adaptasyon",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Yaşam & Relocation",
    "uzmanlik": "Kültürel entegrasyon",
    "yeniKod": "consultant.yasam_relocation.kulturel_entegrasyon",
    "eskiKod": "consultant.yasam_relocation.kulturel_entegrasyon",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Yaşam & Relocation",
    "uzmanlik": "Dil okulları",
    "yeniKod": "consultant.yasam_relocation.dil_okullari",
    "eskiKod": "consultant.yasam_relocation.dil_okullari",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Yaşam & Relocation",
    "uzmanlik": "Günlük yaşam rehberi",
    "yeniKod": "consultant.yasam_relocation.gunluk_yasam_rehberi",
    "eskiKod": "consultant.yasam_relocation.gunluk_yasam_rehberi",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Yaşam & Relocation",
    "uzmanlik": "Bürokratik işlemler",
    "yeniKod": "consultant.yasam_relocation.burokratik_islemler",
    "eskiKod": "consultant.yasam_relocation.burokratik_islemler",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Yaşam & Relocation",
    "uzmanlik": "Taşınma planlama",
    "yeniKod": "consultant.yasam_relocation.tasinma_planlama",
    "eskiKod": "consultant.yasam_relocation.tasinma_planlama",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Yaşam & Relocation",
    "uzmanlik": "Doktor & Diş",
    "yeniKod": "consultant.yasam_relocation.doktor_dis",
    "eskiKod": "consultant.yasam_relocation.doktor_dis",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Yaşam & Relocation",
    "uzmanlik": "Taşımacılık",
    "yeniKod": "consultant.yasam_relocation.tasimacilik",
    "eskiKod": "consultant.yasam_relocation.tasimacilik",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Aile & Çocuk",
    "uzmanlik": "Okul seçimi",
    "yeniKod": "consultant.aile_cocuk.okul_secimi",
    "eskiKod": "consultant.aile_cocuk.okul_secimi",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Aile & Çocuk",
    "uzmanlik": "Kreş / daycare",
    "yeniKod": "consultant.aile_cocuk.kres_daycare",
    "eskiKod": "consultant.aile_cocuk.kres_daycare",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Aile & Çocuk",
    "uzmanlik": "Playdate & sosyal çevre",
    "yeniKod": "consultant.aile_cocuk.playdate_sosyal_cevre",
    "eskiKod": "consultant.aile_cocuk.playdate_sosyal_cevre",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Aile & Çocuk",
    "uzmanlik": "Aile taşınma",
    "yeniKod": "consultant.aile_cocuk.aile_tasinma",
    "eskiKod": "consultant.aile_cocuk.aile_tasinma",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Psikolog & Koç",
    "uzmanlik": "Psikolog / terapi",
    "yeniKod": "consultant.wellbeing.psikolog_terapi",
    "eskiKod": "consultant.wellbeing.psikolog_terapi",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Psikolog & Koç",
    "uzmanlik": "Koçluk",
    "yeniKod": "consultant.wellbeing.kocluk",
    "eskiKod": "consultant.wellbeing.kocluk",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Psikolog & Koç",
    "uzmanlik": "Göçmen psikolojisi",
    "yeniKod": "consultant.wellbeing.gocmen_psikolojisi",
    "eskiKod": "consultant.wellbeing.gocmen_psikolojisi",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Psikolog & Koç",
    "uzmanlik": "Stres & adaptasyon",
    "yeniKod": "consultant.wellbeing.stres_adaptasyon",
    "eskiKod": "consultant.wellbeing.stres_adaptasyon",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Eğitim",
    "uzmanlik": "Üniversite başvuruları",
    "yeniKod": "consultant.egitim.universite_basvurulari",
    "eskiKod": "consultant.egitim.universite_basvurulari",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Eğitim",
    "uzmanlik": "Denklik işlemleri",
    "yeniKod": "consultant.egitim.denklik_islemleri",
    "eskiKod": "consultant.egitim.denklik_islemleri",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Eğitim",
    "uzmanlik": "Burs danışmanlığı",
    "yeniKod": "consultant.egitim.burs_danismanligi",
    "eskiKod": "consultant.egitim.burs_danismanligi",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Eğitim",
    "uzmanlik": "Kariyer yönlendirme",
    "yeniKod": "consultant.egitim.kariyer_yonlendirme",
    "eskiKod": "consultant.egitim.kariyer_yonlendirme",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Eğitim",
    "uzmanlik": "Staj",
    "yeniKod": "consultant.egitim.staj",
    "eskiKod": "consultant.egitim.staj",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Pratik Hayat",
    "uzmanlik": "Araç alım / kiralama",
    "yeniKod": "consultant.pratik_hayat.arac_alim_kiralama",
    "eskiKod": "consultant.pratik_hayat.arac_alim_kiralama",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Pratik Hayat",
    "uzmanlik": "Ehliyet dönüşümü",
    "yeniKod": "consultant.pratik_hayat.ehliyet_donusumu",
    "eskiKod": "consultant.pratik_hayat.ehliyet_donusumu",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Pratik Hayat",
    "uzmanlik": "Telefon / internet setup",
    "yeniKod": "consultant.pratik_hayat.telefon_internet_setup",
    "eskiKod": "consultant.pratik_hayat.telefon_internet_setup",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Pratik Hayat",
    "uzmanlik": "Abonelik işlemleri",
    "yeniKod": "consultant.pratik_hayat.abonelik_islemleri",
    "eskiKod": "consultant.pratik_hayat.abonelik_islemleri",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Medya & İçerik",
    "uzmanlik": "Fotoğraf çekimi",
    "yeniKod": "consultant.medya_icerik.fotograf_cekimi",
    "eskiKod": "consultant.medya_icerik.fotograf_cekimi",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Medya & İçerik",
    "uzmanlik": "Video çekimi & prodüksiyon",
    "yeniKod": "consultant.medya_icerik.video_cekimi_produksiyon",
    "eskiKod": "consultant.medya_icerik.video_cekimi_produksiyon",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Medya & İçerik",
    "uzmanlik": "Sosyal medya ajansı",
    "yeniKod": "consultant.medya_icerik.sosyal_medya_ajansi",
    "eskiKod": "consultant.medya_icerik.sosyal_medya_ajansi",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Medya & İçerik",
    "uzmanlik": "Sosyal medya danışmanlığı",
    "yeniKod": "consultant.medya_icerik.sosyal_medya_danismanligi",
    "eskiKod": "consultant.medya_icerik.sosyal_medya_danismanligi",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Doktor",
    "uzmanlik": "Aile Hekimi / Genel Pratisyen",
    "yeniKod": "consultant.doktor.aile_hekimi_genel_pratisyen",
    "eskiKod": "consultant.doktor (chip)",
    "durum": "oneri"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Doktor",
    "uzmanlik": "Dahiliye",
    "yeniKod": "consultant.doktor.dahiliye",
    "eskiKod": "consultant.doktor (chip)",
    "durum": "oneri"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Doktor",
    "uzmanlik": "Çocuk Sağlığı (Pediatri)",
    "yeniKod": "consultant.doktor.cocuk_sagligi_pediatri",
    "eskiKod": "consultant.doktor (chip)",
    "durum": "oneri"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Doktor",
    "uzmanlik": "Kadın Doğum",
    "yeniKod": "consultant.doktor.kadin_dogum",
    "eskiKod": "consultant.doktor (chip)",
    "durum": "oneri"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Doktor",
    "uzmanlik": "Dermatoloji",
    "yeniKod": "consultant.doktor.dermatoloji",
    "eskiKod": "consultant.doktor (chip)",
    "durum": "oneri"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Doktor",
    "uzmanlik": "Diğer Uzmanlık",
    "yeniKod": "consultant.doktor.diger_uzmanlik",
    "eskiKod": "consultant.doktor (chip)",
    "durum": "oneri"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Diş Hekimi",
    "uzmanlik": "Genel Diş Hekimliği",
    "yeniKod": "consultant.dis_hekimi.genel_dis_hekimligi",
    "eskiKod": "consultant.doktor (chip)",
    "durum": "oneri"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Diş Hekimi",
    "uzmanlik": "Ortodonti",
    "yeniKod": "consultant.dis_hekimi.ortodonti",
    "eskiKod": "consultant.doktor (chip)",
    "durum": "oneri"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Diş Hekimi",
    "uzmanlik": "İmplant & Cerrahi",
    "yeniKod": "consultant.dis_hekimi.implant_cerrahi",
    "eskiKod": "consultant.doktor (chip)",
    "durum": "oneri"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Diş Hekimi",
    "uzmanlik": "Estetik Diş Hekimliği",
    "yeniKod": "consultant.dis_hekimi.estetik_dis_hekimligi",
    "eskiKod": "consultant.doktor (chip)",
    "durum": "oneri"
  },
  {
    "anaRol": "Danışman",
    "altRol": "Diş Hekimi",
    "uzmanlik": "Çocuk Diş Hekimliği",
    "yeniKod": "consultant.dis_hekimi.cocuk_dis_hekimligi",
    "eskiKod": "consultant.doktor (chip)",
    "durum": "oneri"
  },
  {
    "anaRol": "Danışman",
    "altRol": "İK Profesyonelleri",
    "uzmanlik": "İşe Alım / Recruiter",
    "yeniKod": "consultant.ik.ise_alim_recruiter",
    "eskiKod": "consultant.ik (chip)",
    "durum": "oneri"
  },
  {
    "anaRol": "Danışman",
    "altRol": "İK Profesyonelleri",
    "uzmanlik": "Headhunting",
    "yeniKod": "consultant.ik.headhunting",
    "eskiKod": "consultant.ik (chip)",
    "durum": "oneri"
  },
  {
    "anaRol": "Danışman",
    "altRol": "İK Profesyonelleri",
    "uzmanlik": "Bordro & Özlük",
    "yeniKod": "consultant.ik.bordro_ozluk",
    "eskiKod": "consultant.ik (chip)",
    "durum": "oneri"
  },
  {
    "anaRol": "Danışman",
    "altRol": "İK Profesyonelleri",
    "uzmanlik": "İK Danışmanlığı",
    "yeniKod": "consultant.ik.ik_danismanligi",
    "eskiKod": "consultant.ik (chip)",
    "durum": "oneri"
  },
  {
    "anaRol": "Danışman",
    "altRol": "İK Profesyonelleri",
    "uzmanlik": "Kariyer Koçluğu",
    "yeniKod": "consultant.ik.kariyer_koclugu",
    "eskiKod": "consultant.ik (chip)",
    "durum": "oneri"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Gastronomi",
    "uzmanlik": "Restoran (Çocuk Dostu)",
    "yeniKod": "business.gastronomi.restoran_cocuk_dostu",
    "eskiKod": "business.gastronomi.restoran_cocuk_dostu",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Gastronomi",
    "uzmanlik": "Restoran",
    "yeniKod": "business.gastronomi.restoran",
    "eskiKod": "business.gastronomi.restoran",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Gastronomi",
    "uzmanlik": "Cafe",
    "yeniKod": "business.gastronomi.cafe",
    "eskiKod": "business.gastronomi.cafe",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Gastronomi",
    "uzmanlik": "Türk Mutfağı",
    "yeniKod": "business.gastronomi.turk_mutfagi",
    "eskiKod": "business.gastronomi.turk_mutfagi",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Gastronomi",
    "uzmanlik": "Fine Dining",
    "yeniKod": "business.gastronomi.fine_dining",
    "eskiKod": "business.gastronomi.fine_dining",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Gastronomi",
    "uzmanlik": "Fast Food",
    "yeniKod": "business.gastronomi.fast_food",
    "eskiKod": "business.gastronomi.fast_food",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Gastronomi",
    "uzmanlik": "Catering",
    "yeniKod": "business.gastronomi.catering",
    "eskiKod": "business.gastronomi.catering",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Gastronomi",
    "uzmanlik": "Gece Hayatı / Bar",
    "yeniKod": "business.gastronomi.gece_hayati_bar",
    "eskiKod": "business.gastronomi.gece_hayati_bar",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Gastronomi",
    "uzmanlik": "Fırın / Pastane",
    "yeniKod": "business.gastronomi.firin_pastane",
    "eskiKod": "",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Gayrimenkul & Yaşam",
    "uzmanlik": "Emlak Ofisleri",
    "yeniKod": "business.gayrimenkul.emlak_ofisleri",
    "eskiKod": "business.gayrimenkul.emlak_ofisleri",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Gayrimenkul & Yaşam",
    "uzmanlik": "Relocation Firmaları",
    "yeniKod": "business.gayrimenkul.relocation_firmalari",
    "eskiKod": "business.gayrimenkul.relocation_firmalari",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Gayrimenkul & Yaşam",
    "uzmanlik": "Mobilya / Ev Eşyası",
    "yeniKod": "business.gayrimenkul.mobilya_ev_esyasi",
    "eskiKod": "business.gayrimenkul.mobilya_ev_esyasi",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Gayrimenkul & Yaşam",
    "uzmanlik": "Temizlik Hizmetleri",
    "yeniKod": "business.gayrimenkul.temizlik_hizmetleri",
    "eskiKod": "business.gayrimenkul.temizlik_hizmetleri",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Ulaşım & Lojistik",
    "uzmanlik": "Taşınma / Nakliye",
    "yeniKod": "business.ulasim_lojistik.tasinma_nakliye",
    "eskiKod": "business.gayrimenkul.tasinma_nakliye",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Ulaşım & Lojistik",
    "uzmanlik": "Araç Kiralama",
    "yeniKod": "business.ulasim_lojistik.arac_kiralama",
    "eskiKod": "business.ulasim.arac_kiralama",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Ulaşım & Lojistik",
    "uzmanlik": "Araç Satış",
    "yeniKod": "business.ulasim_lojistik.arac_satis",
    "eskiKod": "business.ulasim.arac_satis",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Ulaşım & Lojistik",
    "uzmanlik": "Lojistik Firmaları",
    "yeniKod": "business.ulasim_lojistik.lojistik_firmalari",
    "eskiKod": "business.ulasim.lojistik_firmalari",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Ulaşım & Lojistik",
    "uzmanlik": "Kurye",
    "yeniKod": "business.ulasim_lojistik.kurye",
    "eskiKod": "business.ulasim.kurye",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Ulaşım & Lojistik",
    "uzmanlik": "İthalat / İhracat",
    "yeniKod": "business.ulasim_lojistik.ithalat_ihracat",
    "eskiKod": "business.lojistik_ticaret.ithalat_ihracat",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Ulaşım & Lojistik",
    "uzmanlik": "Depolama",
    "yeniKod": "business.ulasim_lojistik.depolama",
    "eskiKod": "business.lojistik_ticaret.depolama",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Ulaşım & Lojistik",
    "uzmanlik": "Kargo",
    "yeniKod": "business.ulasim_lojistik.kargo",
    "eskiKod": "business.lojistik_ticaret.kargo",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Profesyonel Hizmetler",
    "uzmanlik": "Hukuk Büroları",
    "yeniKod": "business.profesyonel.hukuk_burolari",
    "eskiKod": "business.profesyonel.hukuk_burolari",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Profesyonel Hizmetler",
    "uzmanlik": "Muhasebe / Mali Müşavir",
    "yeniKod": "business.profesyonel.muhasebe_mali_musavir",
    "eskiKod": "business.profesyonel.muhasebe_mali_musavir",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Profesyonel Hizmetler",
    "uzmanlik": "Danışmanlık Şirketleri",
    "yeniKod": "business.profesyonel.danismanlik_sirketleri",
    "eskiKod": "business.profesyonel.danismanlik_sirketleri",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Profesyonel Hizmetler",
    "uzmanlik": "HR / İşe Alım",
    "yeniKod": "business.profesyonel.hr_ise_alim",
    "eskiKod": "business.profesyonel.hr_ise_alim",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Profesyonel Hizmetler",
    "uzmanlik": "Eğitim Danışmanlık Firmaları",
    "yeniKod": "business.profesyonel.egitim_danismanlik_firmalari",
    "eskiKod": "business.egitim.danismanlik_firmalari",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Perakende & E-Ticaret",
    "uzmanlik": "Market / Gıda",
    "yeniKod": "business.perakende.market_gida",
    "eskiKod": "business.perakende.market_gida",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Perakende & E-Ticaret",
    "uzmanlik": "Türk Ürünleri",
    "yeniKod": "business.perakende.turk_urunleri",
    "eskiKod": "business.perakende.turk_urunleri",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Perakende & E-Ticaret",
    "uzmanlik": "Online Shop",
    "yeniKod": "business.perakende.online_shop",
    "eskiKod": "business.perakende.online_shop",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Perakende & E-Ticaret",
    "uzmanlik": "Moda / Butik",
    "yeniKod": "business.perakende.moda_butik",
    "eskiKod": "business.perakende.moda_butik",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Perakende & E-Ticaret",
    "uzmanlik": "Elektronik",
    "yeniKod": "business.perakende.elektronik",
    "eskiKod": "business.perakende.elektronik",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Sağlık & Wellbeing",
    "uzmanlik": "Klinikler",
    "yeniKod": "business.saglik.klinikler",
    "eskiKod": "business.saglik.klinikler + association.hastane.klinik",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Sağlık & Wellbeing",
    "uzmanlik": "Diş",
    "yeniKod": "business.saglik.dis",
    "eskiKod": "business.saglik.dis",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Sağlık & Wellbeing",
    "uzmanlik": "Estetik",
    "yeniKod": "business.saglik.estetik",
    "eskiKod": "business.saglik.estetik",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Sağlık & Wellbeing",
    "uzmanlik": "Spor / Fitness",
    "yeniKod": "business.saglik.spor_fitness",
    "eskiKod": "business.saglik.spor_fitness",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Sağlık & Wellbeing",
    "uzmanlik": "Muayenehane",
    "yeniKod": "business.saglik.muayenehane",
    "eskiKod": "association.hastane.muayenehane",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Sağlık & Wellbeing",
    "uzmanlik": "Eczane",
    "yeniKod": "business.saglik.eczane",
    "eskiKod": "association.hastane.eczane",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Sağlık & Wellbeing",
    "uzmanlik": "Özel Hastane",
    "yeniKod": "business.saglik.ozel_hastane",
    "eskiKod": "association.hastane.hastane",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Eğitim",
    "uzmanlik": "Dil Okulları",
    "yeniKod": "business.egitim.dil_okullari",
    "eskiKod": "business.egitim.dil_okullari",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Eğitim",
    "uzmanlik": "Eğitim Kurumları",
    "yeniKod": "business.egitim.egitim_kurumlari",
    "eskiKod": "business.egitim.egitim_kurumlari",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Eğitim",
    "uzmanlik": "Çocuk Eğitim Merkezleri",
    "yeniKod": "business.egitim.cocuk_egitim_merkezleri",
    "eskiKod": "business.egitim.cocuk_egitim_merkezleri",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Eğitim",
    "uzmanlik": "Kurs Merkezi",
    "yeniKod": "business.egitim.kurs_merkezi",
    "eskiKod": "association.egitim.kurs_merkezi",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Aile & Çocuk",
    "uzmanlik": "Kreş",
    "yeniKod": "business.aile.kres",
    "eskiKod": "business.aile.kres",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Aile & Çocuk",
    "uzmanlik": "Çocuk Aktiviteleri",
    "yeniKod": "business.aile.cocuk_aktiviteleri",
    "eskiKod": "business.aile.cocuk_aktiviteleri",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Aile & Çocuk",
    "uzmanlik": "Oyun Alanları",
    "yeniKod": "business.aile.oyun_alanlari",
    "eskiKod": "business.aile.oyun_alanlari",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Aile & Çocuk",
    "uzmanlik": "Aile Danışmanlığı",
    "yeniKod": "business.aile.aile_danismanligi",
    "eskiKod": "business.aile.aile_danismanligi",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Turizm & Seyahat",
    "uzmanlik": "Seyahat Acenteleri",
    "yeniKod": "business.turizm.seyahat_acenteleri",
    "eskiKod": "business.turizm.seyahat_acenteleri",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Turizm & Seyahat",
    "uzmanlik": "Oteller",
    "yeniKod": "business.turizm.oteller",
    "eskiKod": "business.turizm.oteller",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Turizm & Seyahat",
    "uzmanlik": "Kısa Dönem Konaklama",
    "yeniKod": "business.turizm.kisa_donem_konaklama",
    "eskiKod": "business.turizm.kisa_donem_konaklama",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Turizm & Seyahat",
    "uzmanlik": "Tur Organizasyonları",
    "yeniKod": "business.turizm.tur_organizasyonlari",
    "eskiKod": "business.turizm.tur_organizasyonlari",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "İnşaat & Hizmet",
    "uzmanlik": "İnşaat Firmaları",
    "yeniKod": "business.insaat.insaat_firmalari",
    "eskiKod": "business.insaat.insaat_firmalari",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "İnşaat & Hizmet",
    "uzmanlik": "Tadilat",
    "yeniKod": "business.insaat.tadilat",
    "eskiKod": "business.insaat.tadilat",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "İnşaat & Hizmet",
    "uzmanlik": "Ustalar (Elektrik, Tesisat)",
    "yeniKod": "business.insaat.ustalar_elektrik_tesisat",
    "eskiKod": "business.insaat.ustalar_elektrik_tesisat",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Teknoloji",
    "uzmanlik": "Yazılım Şirketleri",
    "yeniKod": "business.teknoloji.yazilim_sirketleri",
    "eskiKod": "business.teknoloji.yazilim_sirketleri",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Teknoloji",
    "uzmanlik": "IT Destek",
    "yeniKod": "business.teknoloji.it_destek",
    "eskiKod": "business.teknoloji.it_destek",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Medya & İçerik",
    "uzmanlik": "Ajanslar",
    "yeniKod": "business.medya.ajanslar",
    "eskiKod": "business.medya.ajanslar",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Medya & İçerik",
    "uzmanlik": "Sosyal Medya",
    "yeniKod": "business.medya.sosyal_medya",
    "eskiKod": "business.medya.sosyal_medya",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Medya & İçerik",
    "uzmanlik": "Prodüksiyon",
    "yeniKod": "business.medya.produksiyon",
    "eskiKod": "business.medya.produksiyon",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Medya & İçerik",
    "uzmanlik": "Reklam",
    "yeniKod": "business.medya.reklam",
    "eskiKod": "business.medya.reklam",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Finans",
    "uzmanlik": "Bankalar",
    "yeniKod": "business.finans.bankalar",
    "eskiKod": "business.finans.bankalar",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Finans",
    "uzmanlik": "Sigorta",
    "yeniKod": "business.finans.sigorta",
    "eskiKod": "business.finans.sigorta",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Güzellik & Bakım",
    "uzmanlik": "Kuaför",
    "yeniKod": "business.guzellik.kuafor",
    "eskiKod": "",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Güzellik & Bakım",
    "uzmanlik": "Berber",
    "yeniKod": "business.guzellik.berber",
    "eskiKod": "",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Güzellik & Bakım",
    "uzmanlik": "Güzellik Merkezi",
    "yeniKod": "business.guzellik.guzellik_merkezi",
    "eskiKod": "",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Güzellik & Bakım",
    "uzmanlik": "Manikür / Pedikür",
    "yeniKod": "business.guzellik.manikur_pedikur",
    "eskiKod": "",
    "durum": "oneri"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Güzellik & Bakım",
    "uzmanlik": "Spa & Masaj",
    "yeniKod": "business.guzellik.spa_masaj",
    "eskiKod": "",
    "durum": "oneri"
  },
  {
    "anaRol": "İşletme",
    "altRol": "Güzellik & Bakım",
    "uzmanlik": "Makyaj / Kalıcı Makyaj",
    "yeniKod": "business.guzellik.makyaj_kalici_makyaj",
    "eskiKod": "",
    "durum": "oneri"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Girişimciler",
    "uzmanlik": "Pre-Seed / Idea",
    "yeniKod": "venture_hub.girisimci.pre_seed_idea",
    "eskiKod": "venture_hub.girisimci.pre_seed_idea",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Girişimciler",
    "uzmanlik": "MVP / Prototip",
    "yeniKod": "venture_hub.girisimci.mvp_prototip",
    "eskiKod": "venture_hub.girisimci.mvp_prototip",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Girişimciler",
    "uzmanlik": "Seed Aşaması",
    "yeniKod": "venture_hub.girisimci.seed_asamasi",
    "eskiKod": "venture_hub.girisimci.seed_asamasi",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Girişimciler",
    "uzmanlik": "Series A+",
    "yeniKod": "venture_hub.girisimci.series_a",
    "eskiKod": "venture_hub.girisimci.series_a",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Girişimciler",
    "uzmanlik": "Bootstrapped",
    "yeniKod": "venture_hub.girisimci.bootstrapped",
    "eskiKod": "venture_hub.girisimci.bootstrapped",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Girişimciler",
    "uzmanlik": "Solo Founder",
    "yeniKod": "venture_hub.girisimci.solo_founder",
    "eskiKod": "venture_hub.girisimci.solo_founder",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Girişimciler",
    "uzmanlik": "Co-founder Arıyorum",
    "yeniKod": "venture_hub.girisimci.co_founder_ariyorum",
    "eskiKod": "venture_hub.girisimci.co_founder_ariyorum",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Melek Yatırımcılar",
    "uzmanlik": "Pre-Seed (≤€25K)",
    "yeniKod": "venture_hub.melek.pre_seed_25k",
    "eskiKod": "venture_hub.melek.pre_seed_25k",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Melek Yatırımcılar",
    "uzmanlik": "Seed (€25K–€100K)",
    "yeniKod": "venture_hub.melek.seed_25k_100k",
    "eskiKod": "venture_hub.melek.seed_25k100k",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Melek Yatırımcılar",
    "uzmanlik": "Follow-on Investor",
    "yeniKod": "venture_hub.melek.follow_on_investor",
    "eskiKod": "venture_hub.melek.follow_on_investor",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Melek Yatırımcılar",
    "uzmanlik": "Syndicate Lead",
    "yeniKod": "venture_hub.melek.syndicate_lead",
    "eskiKod": "venture_hub.melek.syndicate_lead",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Melek Yatırımcılar",
    "uzmanlik": "Sector Agnostic",
    "yeniKod": "venture_hub.melek.sector_agnostic",
    "eskiKod": "venture_hub.melek.sector_agnostic",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Melek Yatırımcılar",
    "uzmanlik": "Vertical Specialist",
    "yeniKod": "venture_hub.melek.vertical_specialist",
    "eskiKod": "venture_hub.melek.vertical_specialist",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "VC & Fonlar",
    "uzmanlik": "Pre-Seed Fund",
    "yeniKod": "venture_hub.vc.pre_seed_fund",
    "eskiKod": "venture_hub.vc.pre_seed_fund",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "VC & Fonlar",
    "uzmanlik": "Seed Fund",
    "yeniKod": "venture_hub.vc.seed_fund",
    "eskiKod": "venture_hub.vc.seed_fund",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "VC & Fonlar",
    "uzmanlik": "Series A Fund",
    "yeniKod": "venture_hub.vc.series_a_fund",
    "eskiKod": "venture_hub.vc.series_a_fund",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "VC & Fonlar",
    "uzmanlik": "Series B+ Fund",
    "yeniKod": "venture_hub.vc.series_b_fund",
    "eskiKod": "venture_hub.vc.series_b_fund",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "VC & Fonlar",
    "uzmanlik": "Growth / Late Stage",
    "yeniKod": "venture_hub.vc.growth_late_stage",
    "eskiKod": "venture_hub.vc.growth_late_stage",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "VC & Fonlar",
    "uzmanlik": "Sector-Focused (FinTech/Health/AI)",
    "yeniKod": "venture_hub.vc.sector_focused_fintech_health_ai",
    "eskiKod": "venture_hub.vc.sector_focused_fintech_health_ai",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "VC & Fonlar",
    "uzmanlik": "Corporate VC",
    "yeniKod": "venture_hub.vc.corporate_vc",
    "eskiKod": "venture_hub.vc.corporate_vc",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "VC & Fonlar",
    "uzmanlik": "Private Equity",
    "yeniKod": "venture_hub.vc.private_equity",
    "eskiKod": "business.yatirim.private_equity",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "VC & Fonlar",
    "uzmanlik": "Family Office",
    "yeniKod": "venture_hub.vc.family_office",
    "eskiKod": "business.yatirim.family_office",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Kuluçka & Hızlandırıcılar",
    "uzmanlik": "Akselatör Programı",
    "yeniKod": "venture_hub.kulucka.akselator_programi",
    "eskiKod": "venture_hub.kulucka.akselator_programi",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Kuluçka & Hızlandırıcılar",
    "uzmanlik": "İnkübatör",
    "yeniKod": "venture_hub.kulucka.inkubator",
    "eskiKod": "venture_hub.kulucka.inkubator",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Kuluçka & Hızlandırıcılar",
    "uzmanlik": "Teknopark",
    "yeniKod": "venture_hub.kulucka.teknopark",
    "eskiKod": "venture_hub.kulucka.teknopark",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Kuluçka & Hızlandırıcılar",
    "uzmanlik": "Üniversite Programı",
    "yeniKod": "venture_hub.kulucka.universite_programi",
    "eskiKod": "venture_hub.kulucka.universite_programi",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Kuluçka & Hızlandırıcılar",
    "uzmanlik": "Soft-Landing Programı",
    "yeniKod": "venture_hub.kulucka.soft_landing_programi",
    "eskiKod": "venture_hub.kulucka.soft_landing_programi",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Kuluçka & Hızlandırıcılar",
    "uzmanlik": "Vertical Accelerator",
    "yeniKod": "venture_hub.kulucka.vertical_accelerator",
    "eskiKod": "venture_hub.kulucka.vertical_accelerator",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Kuluçka & Hızlandırıcılar",
    "uzmanlik": "Co-working / Hub",
    "yeniKod": "venture_hub.kulucka.co_working_hub",
    "eskiKod": "business.yatirim.co_working_hub",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Mentorlar",
    "uzmanlik": "Growth & Marketing",
    "yeniKod": "venture_hub.mentor.growth_marketing",
    "eskiKod": "venture_hub.mentor.growth_marketing",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Mentorlar",
    "uzmanlik": "Ürün & Tasarım",
    "yeniKod": "venture_hub.mentor.urun_tasarim",
    "eskiKod": "venture_hub.mentor.urun_tasarim",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Mentorlar",
    "uzmanlik": "Teknoloji & Mühendislik",
    "yeniKod": "venture_hub.mentor.teknoloji_muhendislik",
    "eskiKod": "venture_hub.mentor.teknoloji_muhendislik",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Mentorlar",
    "uzmanlik": "Satış & İş Geliştirme",
    "yeniKod": "venture_hub.mentor.satis_is_gelistirme",
    "eskiKod": "venture_hub.mentor.satis_is_gelistirme",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Mentorlar",
    "uzmanlik": "Fundraising & Strateji",
    "yeniKod": "venture_hub.mentor.fundraising_strateji",
    "eskiKod": "venture_hub.mentor.fundraising_strateji",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Mentorlar",
    "uzmanlik": "Operasyon & İK",
    "yeniKod": "venture_hub.mentor.operasyon_ik",
    "eskiKod": "venture_hub.mentor.operasyon_ik",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Mentorlar",
    "uzmanlik": "Uluslararasılaşma",
    "yeniKod": "venture_hub.mentor.uluslararasilasma",
    "eskiKod": "venture_hub.mentor.uluslararasilasma",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Mentorlar",
    "uzmanlik": "Fractional CTO / CMO / CFO",
    "yeniKod": "venture_hub.mentor.fractional_cto_cmo_cfo",
    "eskiKod": "consultant.girisim_mentor",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Startup Servisleri",
    "uzmanlik": "Hukuk & KVKK",
    "yeniKod": "venture_hub.servis.hukuk_kvkk",
    "eskiKod": "venture_hub.servis.hukuk_kvkk",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Startup Servisleri",
    "uzmanlik": "Muhasebe & Vergi",
    "yeniKod": "venture_hub.servis.muhasebe_vergi",
    "eskiKod": "venture_hub.servis.muhasebe_vergi",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Startup Servisleri",
    "uzmanlik": "Pazarlama & İçerik",
    "yeniKod": "venture_hub.servis.pazarlama_icerik",
    "eskiKod": "venture_hub.servis.pazarlama_icerik",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Startup Servisleri",
    "uzmanlik": "Dev Shop / Yazılım Geliştirme",
    "yeniKod": "venture_hub.servis.dev_shop_yazilim_gelistirme",
    "eskiKod": "venture_hub.servis.dev_shop_yazilim_gelistirme",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Startup Servisleri",
    "uzmanlik": "Tasarım & Branding",
    "yeniKod": "venture_hub.servis.tasarim_branding",
    "eskiKod": "venture_hub.servis.tasarim_branding",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Startup Servisleri",
    "uzmanlik": "PR & İletişim",
    "yeniKod": "venture_hub.servis.pr_iletisim",
    "eskiKod": "venture_hub.servis.pr_iletisim",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Startup Servisleri",
    "uzmanlik": "HR / Recruitment",
    "yeniKod": "venture_hub.servis.hr_recruitment",
    "eskiKod": "venture_hub.servis.hr_recruitment",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Startup Servisleri",
    "uzmanlik": "Fintech & Yatırım Platformu",
    "yeniKod": "venture_hub.servis.fintech_yatirim_platformu",
    "eskiKod": "business.yatirim.fintech_yatirim_platformu",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Fon & Hibeler",
    "uzmanlik": "EU Horizon / EIC",
    "yeniKod": "venture_hub.fon.eu_horizon_eic",
    "eskiKod": "venture_hub.fon.eu_horizon_eic",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Fon & Hibeler",
    "uzmanlik": "Devlet Hibesi (TR)",
    "yeniKod": "venture_hub.fon.devlet_hibesi_tr",
    "eskiKod": "venture_hub.fon.devlet_hibesi_tr",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Fon & Hibeler",
    "uzmanlik": "Bölgesel Fonlar",
    "yeniKod": "venture_hub.fon.bolgesel_fonlar",
    "eskiKod": "venture_hub.fon.bolgesel_fonlar",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Fon & Hibeler",
    "uzmanlik": "Yarışma & Ödüller",
    "yeniKod": "venture_hub.fon.yarisma_oduller",
    "eskiKod": "venture_hub.fon.yarisma_oduller",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Fon & Hibeler",
    "uzmanlik": "Crowdfunding",
    "yeniKod": "venture_hub.fon.crowdfunding",
    "eskiKod": "venture_hub.fon.crowdfunding",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Fon & Hibeler",
    "uzmanlik": "Impact / ESG Fonu",
    "yeniKod": "venture_hub.fon.impact_esg_fonu",
    "eskiKod": "venture_hub.fon.impact_esg_fonu",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Corporate Innovation",
    "uzmanlik": "CVC (Corporate VC)",
    "yeniKod": "venture_hub.corp.cvc_corporate_vc",
    "eskiKod": "venture_hub.corp.cvc_corporate_vc",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Corporate Innovation",
    "uzmanlik": "Venture Client / POC",
    "yeniKod": "venture_hub.corp.venture_client_poc",
    "eskiKod": "venture_hub.corp.venture_client_poc",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Corporate Innovation",
    "uzmanlik": "Open Innovation",
    "yeniKod": "venture_hub.corp.open_innovation",
    "eskiKod": "venture_hub.corp.open_innovation",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Corporate Innovation",
    "uzmanlik": "Stratejik Ortaklık",
    "yeniKod": "venture_hub.corp.stratejik_ortaklik",
    "eskiKod": "venture_hub.corp.stratejik_ortaklik",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Corporate Innovation",
    "uzmanlik": "M&A",
    "yeniKod": "venture_hub.corp.m_a",
    "eskiKod": "venture_hub.corp.m_a",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Corporate Innovation",
    "uzmanlik": "Innovation Lab",
    "yeniKod": "venture_hub.corp.innovation_lab",
    "eskiKod": "venture_hub.corp.innovation_lab",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Startup Scout'lar",
    "uzmanlik": "VC Scout",
    "yeniKod": "venture_hub.scout.vc_scout",
    "eskiKod": "venture_hub.scout.vc_scout",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Startup Scout'lar",
    "uzmanlik": "Angel Network Scout",
    "yeniKod": "venture_hub.scout.angel_network_scout",
    "eskiKod": "venture_hub.scout.angel_network_scout",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Startup Scout'lar",
    "uzmanlik": "Sektör Scout (FinTech/Health/AI)",
    "yeniKod": "venture_hub.scout.sektor_scout_fintech_health_ai",
    "eskiKod": "venture_hub.scout.sektor_scout_fintech_health_ai",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Startup Scout'lar",
    "uzmanlik": "Coğrafi Scout (MENA/EU/US)",
    "yeniKod": "venture_hub.scout.cografi_scout_mena_eu_us",
    "eskiKod": "venture_hub.scout.cografi_scout_mena_eu_us",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Venture Hub",
    "altRol": "Startup Scout'lar",
    "uzmanlik": "M&A Scout",
    "yeniKod": "venture_hub.scout.m_a_scout",
    "eskiKod": "venture_hub.scout.m_a_scout",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Kuruluş",
    "altRol": "Büyükelçilik & Konsolosluk",
    "uzmanlik": "Büyükelçilik",
    "yeniKod": "association.diplomatik.buyukelcilik",
    "eskiKod": "association.diplomatik.buyukelcilik",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Kuruluş",
    "altRol": "Büyükelçilik & Konsolosluk",
    "uzmanlik": "Konsolosluk",
    "yeniKod": "association.diplomatik.konsolosluk",
    "eskiKod": "association.diplomatik.konsolosluk",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Kuruluş",
    "altRol": "Büyükelçilik & Konsolosluk",
    "uzmanlik": "Ataşelik",
    "yeniKod": "association.diplomatik.ataselik",
    "eskiKod": "association.diplomatik.ataselik",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Kuruluş",
    "altRol": "Büyükelçilik & Konsolosluk",
    "uzmanlik": "Kültür Merkezi",
    "yeniKod": "association.diplomatik.kultur_merkezi",
    "eskiKod": "association.diplomatik.kultur_merkezi",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Kuruluş",
    "altRol": "Dernekler & Vakıflar",
    "uzmanlik": "Dernek",
    "yeniKod": "association.dernek.dernek",
    "eskiKod": "association.dernek.dernek",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Kuruluş",
    "altRol": "Dernekler & Vakıflar",
    "uzmanlik": "Vakıf",
    "yeniKod": "association.dernek.vakif",
    "eskiKod": "association.dernek.vakif",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Kuruluş",
    "altRol": "Dernekler & Vakıflar",
    "uzmanlik": "İş Örgütü",
    "yeniKod": "association.dernek.is_orgutu",
    "eskiKod": "association.dernek.is_orgutu",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Kuruluş",
    "altRol": "Dernekler & Vakıflar",
    "uzmanlik": "Sosyal Örgüt",
    "yeniKod": "association.dernek.sosyal_orgut",
    "eskiKod": "association.dernek.sosyal_orgut",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Kuruluş",
    "altRol": "Dernekler & Vakıflar",
    "uzmanlik": "Diğer",
    "yeniKod": "association.dernek.diger",
    "eskiKod": "association.dernek.diger",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Kuruluş",
    "altRol": "Odalar & Konseyler",
    "uzmanlik": "Ticaret Odası",
    "yeniKod": "association.oda.ticaret_odasi",
    "eskiKod": "association.oda.ticaret_odasi",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Kuruluş",
    "altRol": "Odalar & Konseyler",
    "uzmanlik": "Sanayi Odası",
    "yeniKod": "association.oda.sanayi_odasi",
    "eskiKod": "association.oda.sanayi_odasi",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Kuruluş",
    "altRol": "Odalar & Konseyler",
    "uzmanlik": "İş Konseyi",
    "yeniKod": "association.oda.is_konseyi",
    "eskiKod": "association.oda.is_konseyi",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Kuruluş",
    "altRol": "Odalar & Konseyler",
    "uzmanlik": "Meslek Odası",
    "yeniKod": "association.oda.meslek_odasi",
    "eskiKod": "association.oda.meslek_odasi",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Kuruluş",
    "altRol": "Akademik Birimler",
    "uzmanlik": "Üniversite",
    "yeniKod": "association.akademik.universite",
    "eskiKod": "association.akademik.universite",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Kuruluş",
    "altRol": "Akademik Birimler",
    "uzmanlik": "Araştırma Merkezi",
    "yeniKod": "association.akademik.arastirma_merkezi",
    "eskiKod": "association.akademik.arastirma_merkezi",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Kuruluş",
    "altRol": "Akademik Birimler",
    "uzmanlik": "Akademik Dernek",
    "yeniKod": "association.akademik.akademik_dernek",
    "eskiKod": "association.akademik.akademik_dernek",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Kuruluş",
    "altRol": "Akademik Birimler",
    "uzmanlik": "Öğrenci Birliği",
    "yeniKod": "association.akademik.ogrenci_birligi",
    "eskiKod": "association.akademik.ogrenci_birligi",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Kuruluş",
    "altRol": "Eğitim Kuruluşları",
    "uzmanlik": "Okul",
    "yeniKod": "association.egitim.okul",
    "eskiKod": "association.egitim.okul",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Kuruluş",
    "altRol": "Eğitim Kuruluşları",
    "uzmanlik": "Anaokulu",
    "yeniKod": "association.egitim.anaokulu",
    "eskiKod": "association.egitim.anaokulu",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Kuruluş",
    "altRol": "Eğitim Kuruluşları",
    "uzmanlik": "Türkçe Dil Okulu",
    "yeniKod": "association.egitim.turkce_dil_okulu",
    "eskiKod": "association.egitim.turkce_dil_okulu",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Kuruluş",
    "altRol": "Türk / Diaspora Medya Kuruluşları",
    "uzmanlik": "TV Kanalı",
    "yeniKod": "association.medya.tv_kanali",
    "eskiKod": "association.medya.tv_kanali",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Kuruluş",
    "altRol": "Türk / Diaspora Medya Kuruluşları",
    "uzmanlik": "Radyo",
    "yeniKod": "association.medya.radyo",
    "eskiKod": "association.medya.radyo",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Kuruluş",
    "altRol": "Türk / Diaspora Medya Kuruluşları",
    "uzmanlik": "Gazete / Dergi",
    "yeniKod": "association.medya.gazete_dergi",
    "eskiKod": "association.medya.gazete_dergi",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Kuruluş",
    "altRol": "Türk / Diaspora Medya Kuruluşları",
    "uzmanlik": "Online Medya",
    "yeniKod": "association.medya.online_medya",
    "eskiKod": "association.medya.online_medya",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Kuruluş",
    "altRol": "Türk / Diaspora Medya Kuruluşları",
    "uzmanlik": "Podcast",
    "yeniKod": "association.medya.podcast",
    "eskiKod": "association.medya.podcast",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Kuruluş",
    "altRol": "Dijital Topluluk Yöneticisi",
    "uzmanlik": "WhatsApp Grubu",
    "yeniKod": "association.dijital.whatsapp_grubu",
    "eskiKod": "association.dijital.whatsapp_grubu",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Kuruluş",
    "altRol": "Dijital Topluluk Yöneticisi",
    "uzmanlik": "Telegram Grubu",
    "yeniKod": "association.dijital.telegram_grubu",
    "eskiKod": "association.dijital.telegram_grubu",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Kuruluş",
    "altRol": "Dijital Topluluk Yöneticisi",
    "uzmanlik": "Discord Topluluğu",
    "yeniKod": "association.dijital.discord_toplulugu",
    "eskiKod": "association.dijital.discord_toplulugu",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Kuruluş",
    "altRol": "Dijital Topluluk Yöneticisi",
    "uzmanlik": "Facebook Grubu",
    "yeniKod": "association.dijital.facebook_grubu",
    "eskiKod": "association.dijital.facebook_grubu",
    "durum": "onaylandi"
  },
  {
    "anaRol": "Kuruluş",
    "altRol": "Dijital Topluluk Yöneticisi",
    "uzmanlik": "Online Topluluk",
    "yeniKod": "association.dijital.online_topluluk",
    "eskiKod": "association.dijital.online_topluluk",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İçerik Üretici",
    "altRol": "Blogger",
    "uzmanlik": "",
    "yeniKod": "blogger.blogger",
    "eskiKod": "blogger.blogger",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İçerik Üretici",
    "altRol": "Vlogger",
    "uzmanlik": "",
    "yeniKod": "blogger.vlogger",
    "eskiKod": "blogger.influencer",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İçerik Üretici",
    "altRol": "YouTuber",
    "uzmanlik": "",
    "yeniKod": "blogger.youtuber",
    "eskiKod": "blogger.youtuber",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İçerik Üretici",
    "altRol": "TikToker",
    "uzmanlik": "",
    "yeniKod": "blogger.tiktoker",
    "eskiKod": "blogger.format_ek.tiktoker",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İçerik Üretici",
    "altRol": "Podcaster",
    "uzmanlik": "",
    "yeniKod": "blogger.podcaster",
    "eskiKod": "blogger.format_ek.podcaster",
    "durum": "onaylandi"
  },
  {
    "anaRol": "İçerik Üretici",
    "altRol": "Yazar",
    "uzmanlik": "",
    "yeniKod": "blogger.yazar",
    "eskiKod": "blogger.format_ek.yazar",
    "durum": "onaylandi"
  }
];

/** Ana rol listesi (benzersiz, sıralı). */
export const ANA_ROLLER: readonly string[] = [
  ...new Set(ROLE_STRUCTURE.map((r) => r.anaRol)),
].sort();

/** Yalnız onaylanmış roller (durum !== "oneri"). */
export const ONAYLANMIS_ROLLER: readonly RoleStructureEntry[] = ROLE_STRUCTURE.filter(
  (r) => r.durum === "onaylandi"
);

/** Yalnız ÖNERİ roller (yayına alınmaz). */
export const ONERI_ROLLER: readonly RoleStructureEntry[] = ROLE_STRUCTURE.filter(
  (r) => r.durum === "oneri"
);

/** Yeni kod → entry eşlemesi. */
export const ROLE_BY_YENI_KOD: Readonly<Record<string, RoleStructureEntry>> = Object.fromEntries(
  ROLE_STRUCTURE.map((r) => [r.yeniKod, r])
);

/** Eski dropdown → yeni kod eşlemesi (boş olmayanlar). */
export const ESKI_YENI_ESLEME: Readonly<Record<string, string>> = Object.fromEntries(
  ROLE_STRUCTURE.filter((r) => r.eskiKod).map((r) => [r.eskiKod, r.yeniKod])
);
