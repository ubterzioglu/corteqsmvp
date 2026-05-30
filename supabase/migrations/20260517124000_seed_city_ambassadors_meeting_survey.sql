update public.surveys
set slug = '7392846150'
where slug = 'sehir-elcileri-toplanti-anketi-13052026';

update public.surveys
set slug = '7392846150'
where slug = 'anket-4829173506';

update public.surveys
set slug = '7392846150'
where slug = 'anket-20260517';

insert into public.surveys (
  slug,
  title,
  description,
  status,
  starts_at,
  allow_anonymous,
  allow_multiple_submissions,
  is_featured,
  published_at
)
values (
  '7392846150',
  'Şehir Elçileri Toplantı Anketi',
  '13.05.2026 toplantısı sonrası CorteQS vizyonu, katkı motivasyonu ve toplantı katılımı geri bildirim anketi.',
  'published',
  '2026-05-13T00:00:00+00',
  true,
  true,
  true,
  now()
)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  status = excluded.status,
  starts_at = excluded.starts_at,
  allow_anonymous = excluded.allow_anonymous,
  allow_multiple_submissions = excluded.allow_multiple_submissions,
  is_featured = excluded.is_featured,
  published_at = excluded.published_at,
  updated_at = now();

with target_survey as (
  select id from public.surveys where slug = '7392846150'
), removed as (
  delete from public.survey_questions
  where survey_id = (select id from target_survey)
)
insert into public.survey_questions (
  survey_id,
  type,
  question,
  description,
  options,
  is_required,
  sort_order
)
select
  (select id from target_survey),
  q.type,
  q.question,
  q.description,
  q.options::jsonb,
  q.is_required,
  q.sort_order
from (
  values
    (
      'single_choice',
      'CorteQS ile ilgili anlatılanlar, vizyon ve çalışma şekli hakkında görüşünüz nedir?',
      null,
      '["Çok benlik değil","İlgilenebilirim ama daha detay öğrenmem gerek","Beni heyecanlandırdı, karşılık görürsem fayda yaratacağıma inanıyorum"]',
      true,
      0
    ),
    (
      'single_choice',
      'Bir önceki soruya B veya C yanıtı verdiyseniz: Şehrinizdeki işletmeler, danışmanlar ve kuruluşların CorteQS''e katılımı ile online/offline etkinlikler için ne kadar zaman ayırabilirsiniz?',
      'Bir önceki soruya A yanıtı verdiyseniz bu soruyu yine de genel niyetinize göre yanıtlayabilirsiniz.',
      '["Boş vakitlerimde","Yarı zamanlı bununla ilgilenebilirim; etkinlikler düzenleyebilir, CorteQS HQ toplantılarına katılırım","Gelir durumuna bağlı olarak tüm bunlara tam zamanımı ayırmayı düşünebilirim"]',
      true,
      1
    ),
    (
      'single_choice',
      'CorteQS Contributor''ları ile sosyal medya stratejisi yönetimi kapsamında, sosyal medyada kendinizi nasıl tanımlarsınız?',
      null,
      '["Aktifim","Fena değilim","Çok aktif sayılmam"]',
      true,
      2
    ),
    (
      'long_text',
      'Sosyal medya hesaplarınızı paylaşır mısınız?',
      'Örn: Instagram, LinkedIn, X, YouTube linkleri / kullanıcı adları',
      '[]',
      false,
      3
    ),
    (
      'single_choice',
      'Bir dahaki toplantıya katılacak mısınız?',
      null,
      '["Katılacağım","Katılmayacağım"]',
      true,
      4
    ),
    (
      'long_text',
      'Sorularınız / Önerileriniz',
      null,
      '[]',
      false,
      5
    )
) as q(type, question, description, options, is_required, sort_order);
