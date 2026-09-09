-- 13 Mayıs "WhatsApp grubu ekleme" todo paketini TOP 10 HOT FIX listesine taşır
-- ve her maddenin altına 6'şar soru yazar (anlaşılan aralık madde başına 5-10).
--
-- NEDEN BU BEŞ MADDE: Komuta Merkezi'nde AÇIK todo'lar arasında priority 9 +
-- urgent olan tam olarak bu beşi var (ölçüldü, hepsi sort_order 13018, hepsi
-- "WhatsApp grubu ekleme politikasını netleştir" maddesinin bölünmesi).
-- Liste tavanı 10 AÇIK madde; hâlihazırda 4 açık madde var, 4+5 = 9, bir slot boş.
--
-- ⚠️ ÖLÇÜM BAŞTA VARSAYIMI ÇÜRÜTTÜ: bu beş madde "yapılacak iş" gibi yazılmış ama
-- kod onları geçmiş. Grup ekleme özelliği CANLIDA çalışıyor — /addcom production'da
-- 200 dönüyor, ana sayfa hero'sundan link veriliyor, üye giriş yapıp grup
-- gönderebiliyor, gönderi admin onayına düşüyor, reddedilirse gerekçe yazılabiliyor,
-- moderasyon ekranı /admin/whatsapp-landings admin menüsünde. "Grup yöneticisiyim /
-- sadece üyeyim" ayrımı da formda var. Sorular bu yüzden "yapalım mı" değil,
-- "hazır olanı nasıl kullanacağız / hangi kararı veriyorsun" biçiminde yazıldı.
--
-- Ölçülen gerçek kusurlar (sorular bunlara dayanıyor):
--   * 10 grubun 10'unda city = 'Genel' -> şehir bilgisi fiilen yok
--   * country serbest metin: 'GCC', 'Global', 'GCC-Global', 'EU+MENA', 'KATAR' ve
--     bir satırda ülke alanına ŞEHİR yazılmış ('İstanbul')
--   * 10 grubun 10'unda member_approved = false -> "Üye onaylı!" rozeti canlıda
--     bugüne kadar HİÇ görünmemiş (alan var, hiç kullanılmamış)
--   * whatsapp_join_requests 0 satır -> bugüne kadar tek bir katılma talebi yok
--   * 10 grubun 1'inde (METU QATAR) whatsapp_link YOK -> sayfası açılır, katılınamaz
--   * member_count 10 grubun 1'inde dolu; whatsapp_message_templates boş
--   * yazılı kural metni hiçbir yerde yok; /addcom sitemap'te de yok
--
-- Kaynak todo'lar SİLİNMEZ/arşivlenmez: bu depoda bir maddenin hem todo listesinde
-- hem panoda durması yerleşik desen (bkz. WS3 + Komuta Merkezi 14 gruplanmış todo).
-- Arşivleme ayrı ve geri alınması zor bir karar, kullanıcı istemeden yapılmaz.
--
-- Idempotent: başlık zaten varsa ne madde ne yorum tekrar eklenir.

do $mig$
declare
  entry record;
  v_id uuid;
  v_open_count integer;
  v_inserted integer := 0;
  v_comments integer := 0;
begin
  for entry in
    select *
    from (
      values
        (
          1,
          'GRUP EKLEME POLİTİKASI',
          'WhatsApp grubu ekleme özelliği için platform politikası yaz. Grup admini olmayanların gönderisinin de moderasyona düşeceğini netleştir. Yayına alınacak gruplarda kalite ve güvenlik kriterlerini belirle. · Kaynak: 13 Mayıs toplantı todo paketi',
          $q$DURUM (10 Eylül'de bakıldı): Bu madde 13 Mayıs'tan kalmış ve kod onu geçmiş. Grup ekleme özelliği CANLIDA çalışıyor: /addcom adresi açık (canlıda denedim, açılıyor), ana sayfadaki bölümden link veriliyor, üye giriş yapıp grup gönderebiliyor, gönderi admin onayına düşüyor ve onaylanmadan görünmüyor, reddedilirse gerekçe yazılabiliyor. "Grup yöneticisiyim" / "sadece üyeyim" ayrımı da formda zaten var. Yani teknik taraf hazır. Eksik olan tek şey: kullanıcıya gösterilecek YAZILI kural metni hiçbir yerde yok. Bugün listede 10 grup var ve hepsi bizim iki hesabımızdan eklenmiş; dışarıdan gelen tek bir başvuru yok.

SORULAR:

1) Bir grubun listeye alınması için asgari şart ne olsun? (örnek: en az şu kadar üye, Türkçe konuşuluyor olsun, satış/spam grubu olmasın) Üç maddeyle söylersen kural metnini ona göre yazarım.

2) Hangi gruplar KESİN alınmaz? (siyaset, dini cemaat, kazanç vaadi/MLM, yetişkin içerik, sadece iş ilanı atılan gruplar...) Bu sınırı sen çizmelisin, ben tahmin etmemeliyim.

3) Grup yöneticisi olmayan bir üye o grubu ekleyebilir mi? Bugün sistem soruyor ama ikisine de izin veriyor. Böyle kalsın mı, yoksa sadece grup yöneticisi ekleyebilsin mi?

4) Bir grup listeye girdikten sonra kim "sahibi" sayılır — ekleyen kişi mi, grup yöneticisi mi? Sonradan "bu benim grubum, düzenlemek istiyorum" diyen çıkarsa ne yapacağız?

5) Kural metni nerede görünsün: grup ekleme formunun içinde mi, ayrı bir "Topluluk Kuralları" sayfasında mı, ikisinde de mi?

6) Bir grup sonradan bozulursa (spam'e döndü, linki öldü) kim ne kadar sürede kaldıracak? Bunu bir kişiye bağlamazsak liste zamanla çürür.$q$
        ),
        (
          2,
          'GRUP ONAY AKIŞI',
          'Grup admini onayı gerekiyorsa bunun nasıl alınacağını tarif et. Açık davet linkli gruplar için basit onay akışı belirle. Kapalı gruplar için adminle manuel iletişim akışı belirle. · Kaynak: 13 Mayıs toplantı todo paketi',
          $q$DURUM (10 Eylül'de bakıldı): İki taraflı onay kodda ZATEN var — grup sayfasında "Admin onaylı!" ve "Üye onaylı!" diye iki ayrı rozet çizilebiliyor. Ama ölçtüm: 10 grubun 10'unda üye onayı alanı boş, yani "Üye onaylı!" rozeti canlıda bugüne kadar HİÇ görünmemiş. Alan var, hiç kullanılmamış. 8 grup admin onaylı, 2'si değil. Ayrıca katılma talebi tablosu tamamen boş: bugüne kadar kimse hiçbir gruba katılma talebi göndermemiş. Bir de şu var: 10 gruptan birinin (METU QATAR) hiç WhatsApp linki yok — sayfası açılıyor ama kullanıcı gruba katılamıyor.

SORULAR:

1) "Üye onayı" ne demek olsun? Alan var ama hiç kullanılmamış. (a) Gruba katılmış birinin "evet bu grup gerçek" demesi, (b) grup yöneticisinin onayı, (c) hiç kullanmayalım, kaldıralım — hangisi?

2) Açık davet linki olan gruplarda link çalışıyorsa admin onayı beklemeden yayına alalım mı, yoksa her grup mutlaka bizden onay geçsin mi?

3) Linki olmayan (kapalı) gruplar listede dursun mu? Bugün böyle bir grup var ve kullanıcı sayfaya girip katılamıyor. Kalsın mı, çıkarılsın mı, yoksa "kapalı grup" diye işaretlenip iletişim yolu mu gösterilsin?

4) Kapalı grupta yöneticiyle iletişimi kim kuracak — biz mi yazacağız, yoksa kullanıcı doğrudan yöneticiye mi yazsın? Bugün grup sayfasında yöneticinin e-postası VE telefonu herkese açık görünüyor; bu böyle kalsın mı?

5) Onay ne kadar sürede verilecek? Kullanıcı gönderince "admin onayından sonra görünecek" yazısını görüyor ama süre söylenmiyor. "En geç 48 saat" gibi bir söz verelim mi?

6) Bir grubu reddettiğimizde gerekçeyi gönderen kişiye bildirelim mi? Gerekçe alanı hazır ama bugün kimseye mail ya da bildirim gitmiyor — kişi neden reddedildiğini hiç öğrenmiyor.$q$
        ),
        (
          3,
          'GRUP FORMU ALANLARI',
          'Grup ekleme formundaki alanları Barış ile netleştir. · Kaynak: 13 Mayıs toplantı todo paketi',
          $q$DURUM (10 Eylül'de bakıldı): Form canlıda ve şu anda topluluk adı, kategori, ülke, şehir, tanıtım cümlesi, açıklama, katılım koşulları, WhatsApp linki, yönetici adı, yönetici iletişimi, kapak görseli, dil ve "grup yöneticisi miyim / sadece üyeyim" alanlarını soruyor. Yani alanlar eksik değil, fazla bile olabilir. Ölçtüğüm iki gerçek kusur: (1) 10 grubun 10'unda şehir "Genel" yazıyor — şehir alanı fiilen boş kalıyor; (2) ülke alanı serbest metin ve içine ne isterse yazılmış: "GCC", "Global", "GCC-Global", "EU+MENA", "KATAR" ve bir satırda ülke alanına ŞEHİR yazılmış ("İstanbul"). Bu yüzden "Berlin'deki gruplar" gibi bir filtre bugün kurulamıyor.

SORULAR:

1) Şehir ve ülke hazır listeden mi seçilsin, yazı yazılamasın mı? Bugün serbest metin ve bu yüzden 10 grubun hiçbirinde kullanılabilir şehir bilgisi yok.

2) Bir grup birden fazla şehre ya da ülkeye ait olabilir mi? Bugünkü kayıtlarda "GCC-Global", "EU+MENA" gibi değerler var — demek ki insanlar tek kutuya birden fazla yer yazmak istiyor.

3) Şehri olmayan gruplar için ne yapalım — "Şehre bağlı değil" diye bir seçenek koyalım mı, yoksa şehir zorunlu mu olsun?

4) Hangi alanlar zorunlu olsun? Bugün üye sayısı 10 grubun sadece 1'inde dolu, kapak görseli de çoğunda yok. Bunlar zorunlu mu, isteğe bağlı mı?

5) Yöneticinin telefonunu grup sayfasında herkese göstermeye devam edelim mi? Şu an 10 grubun hepsinde yöneticinin e-postası ve telefonu açıkta. Sadece e-posta göstermek daha güvenli olur — hangisini istersin?

6) Formda "hangi platform" (WhatsApp / Telegram vb.) diye bir soru var ama bu bilgi düzgün bir alana değil, açıklama metninin içine etiket olarak gömülüyor. Platformu ayrı ve gerçek bir alan yapalım mı, yoksa sadece WhatsApp kalsın mı?$q$
        ),
        (
          4,
          'ŞEHİR GRUPLARINI TOPLAMA',
          'Contributorların kendi şehirlerindeki WhatsApp gruplarını bulmasını iste. · Kaynak: 13 Mayıs toplantı todo paketi',
          $q$DURUM (10 Eylül'de bakıldı): Bu bir ekip/içerik işi, kod işi değil — ve dayanacağı zemin hazır: form canlı, ekleme adresi /addcom, moderasyon ekranı da hazır. Ama ölçtüğüm iki şey bu işi bugün yapmanın anlamını düşürüyor: (1) şehir alanı 10 grubun 10'unda "Genel", yani "şehrindeki grubu ekle" dendiğinde bilgi hiçbir yere düzgün yazılmıyor — önce şehir alanının düzelmesi lazım (bkz. GRUP FORMU ALANLARI); (2) bugüne kadar dışarıdan gelen TEK bir grup başvurusu yok, 10 grubun tamamı bizim iki hesabımızdan eklenmiş. Yani bu çağrı sistemin ilk gerçek sınavı olacak.

SORULAR:

1) Kimlere soracağız? Elinde "contributor" diye bir liste var mı, yoksa önce o listeyi mi çıkaralım?

2) Hangi şehirlerle başlıyoruz? Belirli 4-5 şehirle mi (Berlin, Londra, Sydney, Dubai gibi), yoksa herkes kendi şehrini mi eklesin?

3) Kişi başına kaç grup isteyelim? "Bildiğin her grubu ekle" mi, "en iyi 3 grup" mu? Kalite ile adet arasındaki dengeyi sen kur.

4) Bunu nereden isteyeceğiz — WhatsApp'tan mı, e-postadan mı, yoksa ürün içinden bir davetle mi?

5) Grup ekleyen kişiye bir karşılık verelim mi? (adı grup sayfasında görünsün, rozet, teşekkür mesajı...) Karşılık yoksa gelen sayı düşük olur.

6) Bir hedef koyalım mı — örneğin "iki hafta içinde 30 grup"? Hedef yoksa bu maddenin bittiğini nasıl anlayacağız?$q$
        ),
        (
          5,
          'GRUP EKLEME ÇAĞRISI',
          '"Bildiğiniz faydalı WhatsApp gruplarını ekleyin" mesajını sosyal medya için hazırla. · Kaynak: 13 Mayıs toplantı todo paketi',
          $q$DURUM (10 Eylül'de bakıldı): Mesajın göndereceği yer hazır ve çalışıyor — /addcom canlıda, ana sayfadan link var, üye giriş yapıp grup gönderebiliyor. İki şeye dikkat: (1) yazılı kural metni henüz yok, yani çağrıyı yapıp başvuru gelmeye başlarsa neyi kabul neyi ret edeceğimiz yazılı olmayacak (bkz. GRUP EKLEME POLİTİKASI); (2) bu sayfa arama motorlarına bildirilmiyor (sitemap'te yok), yani çağrı sadece bizim paylaşımımız kadar duyulur, kendi kendine trafik getirmez.

SORULAR:

1) Mesajın vaadi ne olsun — "grubunu tanıt, üye kazan" (grup yöneticilerine sesleniyoruz) mu, "bildiğin faydalı grupları ekle, diaspora faydalansın" (herkese sesleniyoruz) mu? İkisi tamamen farklı metin olur.

2) Hangi kanallardan çıkacak? (Instagram gönderi, story, LinkedIn, WhatsApp grupları, e-posta) Kanal başına metnin uzunluğu ve tonu değişiyor.

3) Görsel işi kimde? Elimizde hazır bir paylaşım görseli şablonu var; onu mu kullanalım, yoksa yeni bir görsel mi çizilsin?

4) Çağrıda hangi adresi verelim — doğrudan corteqs.net/addcom mu, daha kısa bir yönlendirme mi? (Bilgi olsun: /addwa ve /whatsapp-groups adresleri de buraya yönleniyor.)

5) Kural metni hazır olmadan çağrıyı yapalım mı? Yaparsak "neden reddettiniz" sorusuna yazılı bir cevabımız olmayacak. Önce kuralı yazmak mı, ikisini paralel götürmek mi?

6) Ne zaman çıkalım ve tek seferlik mi olsun? Bir gönderi mi, yoksa haftada bir tekrarlanan bir hatırlatma serisi mi?$q$
        )
    ) as t(ord, title, detail, comment_body)
    order by ord
  loop
    select id into v_id
    from public.command_center_hot_fixes
    where title = entry.title and deleted_at is null;

    if v_id is null then
      insert into public.command_center_hot_fixes
        (title, detail, category_label, assignee, status, priority, urgent, sort_order)
      values
        (entry.title, entry.detail, 'Topluluk, Referral & Onboarding', 'Burak',
         'Baslanmadi', 9, true, entry.ord * 10)
      returning id into v_id;

      v_inserted := v_inserted + 1;
    end if;

    if not exists (
      select 1 from public.command_center_hot_fix_comments
      where hot_fix_id = v_id and deleted_at is null
    ) then
      insert into public.command_center_hot_fix_comments (hot_fix_id, author_name, body)
      values (v_id, 'Barış (sorular)', entry.comment_body);

      v_comments := v_comments + 1;
    end if;
  end loop;

  -- Tavan doğrulaması: trigger 10'da patlar; burada sessizce aşılmadığını da kanıtla.
  select count(*) into v_open_count
  from public.command_center_hot_fixes
  where deleted_at is null and archived_at is null and status <> 'Tamamlandi';

  if v_open_count > 10 then
    raise exception 'HOT_FIX_TAVAN: acik madde sayisi % (en fazla 10 olmali)', v_open_count;
  end if;

  raise notice 'hot fix: % yeni madde, % yeni yorum, acik madde sayisi %',
    v_inserted, v_comments, v_open_count;
end
$mig$;

-- Doğrulama: her AÇIK maddenin altında en az bir yorum olmalı ve her yorumda
-- 5-10 numaralı soru bulunmalı (anlaşılan aralık). Soru sayısı satır başındaki
-- "N)" kalıplarıyla sayılır.
do $check$
declare
  v_bad text;
  v_soru integer;
  rec record;
begin
  select string_agg(h.title, ', ') into v_bad
  from public.command_center_hot_fixes h
  where h.deleted_at is null and h.archived_at is null and h.status <> 'Tamamlandi'
    and not exists (
      select 1 from public.command_center_hot_fix_comments c
      where c.hot_fix_id = h.id and c.deleted_at is null
    );

  if v_bad is not null then
    raise exception 'YORUMSUZ ACIL MADDE: %', v_bad;
  end if;

  for rec in
    select h.title, c.body
    from public.command_center_hot_fixes h
    join public.command_center_hot_fix_comments c
      on c.hot_fix_id = h.id and c.deleted_at is null
    where h.deleted_at is null and h.archived_at is null and h.status <> 'Tamamlandi'
  loop
    select count(*) into v_soru
    from regexp_matches(rec.body, '(^|\n)\s*\d+\)', 'g');

    if v_soru < 5 or v_soru > 10 then
      raise exception 'SORU SAYISI ARALIK DISI: % maddesinde % soru var (5-10 olmali)',
        rec.title, v_soru;
    end if;
  end loop;
end
$check$;
