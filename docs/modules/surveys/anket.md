# CorteQS Landing – `/anket` Modülü Teknik Dokümantasyonu

Bu doküman, mevcut `corteqs_landing` projesine `/anket` modülünün uçtan uca eklenmesi için hazırlanmıştır.

Mevcut proje yapısı:

- React + Vite + TypeScript tabanlı SPA
- Supabase Postgres + Auth + Storage + Edge Functions
- Public route yapısı `PublicLayout` altında
- Admin route yapısı `/admin` ve `AdminLayout` altında
- Admin yetki kontrolü `admin_users` ve `public.is_admin(auth.uid())` yapısı ile sağlanıyor

Amaç:

- Public tarafta `/anket` sayfası açmak
- Admin panelinden anket oluşturmak
- Anketleri admin onayı/yayınlama sonrası public tarafta göstermek
- Kullanıcı cevaplarını toplamak
- Cevapları admin panelinden görüntülemek
- Public kullanıcıların cevapları görmesini engellemek
- Güvenli, sade ve genişletilebilir bir MVP çıkarmak

---

## 1. Modül Özeti

Yeni modül adı:

```txt
Surveys / Anketler
```

Public kullanıcı akışı:

```txt
/anket
→ Yayındaki anketleri listeler.

/anket/:slug
→ Tek anketi gösterir.
→ Kullanıcı cevapları doldurur.
→ Cevap submit edilir.

/anket/tesekkurler
→ Başarılı gönderim sonrası teşekkür ekranı.
```

Admin kullanıcı akışı:

```txt
/admin/surveys
→ Tüm anketleri listeler.

/admin/surveys/new
→ Yeni anket oluşturur.

/admin/surveys/:id/edit
→ Anket bilgilerini ve soruları düzenler.

/admin/surveys/:id/responses
→ Anket cevaplarını gösterir.
```

---

## 2. MVP Kapsamı

İlk sürümde yapılacaklar:

- Anket oluşturma
- Anket düzenleme
- Soru ekleme
- Soru silme
- Soru sıralama
- Anketi yayınlama
- Anketi kapatma
- Public tarafta aktif anketleri listeleme
- Public tarafta anket cevaplama
- Admin tarafta cevapları görüntüleme
- Basic spam/rate-limit koruması
- RLS ile veri güvenliği

İlk sürümde yapılmayacaklar:

- Conditional logic
- File upload
- Matrix question
- Public sonuç gösterimi
- Gelişmiş grafik dashboard
- Çok dilli anket sistemi
- Kullanıcı login zorunluluğu

---

## 3. Public Route Yapısı

`src/App.tsx` içine public route olarak eklenecek:

```tsx
<Route path="/anket" element={<SurveysPage />} />
<Route path="/anket/:slug" element={<SurveyDetailPage />} />
<Route path="/anket/tesekkurler" element={<SurveyThankYouPage />} />
```

Dikkat:

`/anket/tesekkurler` route'u `/anket/:slug` route'undan önce tanımlanmalı veya router davranışına göre çakışma engellenmeli.

Önerilen sıra:

```tsx
<Route path="/anket" element={<SurveysPage />} />
<Route path="/anket/tesekkurler" element={<SurveyThankYouPage />} />
<Route path="/anket/:slug" element={<SurveyDetailPage />} />
```

---

## 4. Admin Route Yapısı

`src/App.tsx` içinde `AdminLayout` altına eklenecek:

```tsx
<Route path="/admin/surveys" element={<AdminSurveysPage />} />
<Route path="/admin/surveys/new" element={<AdminSurveyCreatePage />} />
<Route path="/admin/surveys/:id/edit" element={<AdminSurveyEditPage />} />
<Route path="/admin/surveys/:id/responses" element={<AdminSurveyResponsesPage />} />
```

---

## 5. Dosya Yapısı

Önerilen dosya yapısı:

```txt
src/
  pages/
    SurveysPage.tsx
    SurveyDetailPage.tsx
    SurveyThankYouPage.tsx

    admin/
      surveys/
        AdminSurveysPage.tsx
        AdminSurveyCreatePage.tsx
        AdminSurveyEditPage.tsx
        AdminSurveyResponsesPage.tsx

  components/
    surveys/
      SurveyCard.tsx
      SurveyFormRenderer.tsx
      SurveyQuestionRenderer.tsx
      SurveyEmptyState.tsx
      SurveySuccessMessage.tsx

    admin/
      surveys/
        SurveyBuilder.tsx
        SurveyQuestionEditor.tsx
        SurveyResponsesTable.tsx
        SurveyResponseDetail.tsx
        SurveyStatusBadge.tsx

  lib/
    surveys.ts
    survey-responses.ts
    survey-validation.ts

supabase/
  migrations/
    YYYYMMDDHHMMSS_create_surveys_module.sql

  functions/
    submit-survey-response/
      index.ts
```

---

## 6. Veri Modeli

Anketleri mevcut `submissions` tablosuna eklemek yerine ayrı tablolar kullanılmalı.

Sebep:

- Anket yapısı farklıdır.
- Bir anketin birden fazla sorusu vardır.
- Bir response içinde birden fazla answer vardır.
- Admin raporlama daha kolay olur.
- İleride grafik, export ve analiz eklemek daha temiz olur.

---

## 7. Supabase Migration

Yeni migration dosyası oluştur:

```txt
supabase/migrations/YYYYMMDDHHMMSS_create_surveys_module.sql
```

Migration içeriği:

```sql
create extension if not exists pgcrypto;

create table if not exists public.surveys (
  id uuid primary key default gen_random_uuid(),

  slug text not null unique,
  title text not null,
  description text,

  status text not null default 'draft'
    check (status in ('draft', 'published', 'closed', 'archived')),

  is_featured boolean not null default false,

  starts_at timestamptz,
  ends_at timestamptz,

  allow_anonymous boolean not null default true,
  allow_multiple_submissions boolean not null default false,

  created_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),

  published_at timestamptz,
  closed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.survey_questions (
  id uuid primary key default gen_random_uuid(),

  survey_id uuid not null references public.surveys(id) on delete cascade,

  type text not null
    check (type in (
      'short_text',
      'long_text',
      'single_choice',
      'multiple_choice',
      'rating',
      'yes_no',
      'email'
    )),

  question text not null,
  description text,
  placeholder text,

  options jsonb not null default '[]'::jsonb,
  validation jsonb not null default '{}'::jsonb,

  is_required boolean not null default false,
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.survey_responses (
  id uuid primary key default gen_random_uuid(),

  survey_id uuid not null references public.surveys(id) on delete cascade,

  respondent_user_id uuid references auth.users(id),
  respondent_name text,
  respondent_email text,
  contact_opt_in boolean not null default false,

  status text not null default 'submitted'
    check (status in ('submitted', 'reviewed', 'archived')),

  ip_hash text,
  user_agent text,

  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.survey_answers (
  id uuid primary key default gen_random_uuid(),

  response_id uuid not null references public.survey_responses(id) on delete cascade,
  question_id uuid not null references public.survey_questions(id) on delete cascade,

  answer_value jsonb not null,

  created_at timestamptz not null default now()
);

create index if not exists idx_surveys_status on public.surveys(status);
create index if not exists idx_surveys_slug on public.surveys(slug);
create index if not exists idx_survey_questions_survey_id on public.survey_questions(survey_id);
create index if not exists idx_survey_questions_sort_order on public.survey_questions(sort_order);
create index if not exists idx_survey_responses_survey_id on public.survey_responses(survey_id);
create index if not exists idx_survey_answers_response_id on public.survey_answers(response_id);
create index if not exists idx_survey_answers_question_id on public.survey_answers(question_id);
```

---

## 8. Updated At Trigger

Projede mevcut ortak `updated_at` trigger fonksiyonu varsa onu kullan.

Yoksa:

```sql
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_surveys_updated_at on public.surveys;
create trigger set_surveys_updated_at
before update on public.surveys
for each row
execute function public.set_updated_at();

drop trigger if exists set_survey_questions_updated_at on public.survey_questions;
create trigger set_survey_questions_updated_at
before update on public.survey_questions
for each row
execute function public.set_updated_at();
```

---

## 9. RLS Politikaları

RLS aktif edilecek:

```sql
alter table public.surveys enable row level security;
alter table public.survey_questions enable row level security;
alter table public.survey_responses enable row level security;
alter table public.survey_answers enable row level security;
```

### 9.1 Surveys RLS

Public sadece yayınlanmış anketleri görebilir:

```sql
create policy "Public can read published surveys"
on public.surveys
for select
to anon, authenticated
using (
  status = 'published'
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at >= now())
);
```

Admin her şeyi görebilir:

```sql
create policy "Admins can read all surveys"
on public.surveys
for select
to authenticated
using (public.is_admin(auth.uid()));
```

Admin insert:

```sql
create policy "Admins can insert surveys"
on public.surveys
for insert
to authenticated
with check (public.is_admin(auth.uid()));
```

Admin update:

```sql
create policy "Admins can update surveys"
on public.surveys
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));
```

Admin delete:

```sql
create policy "Admins can delete surveys"
on public.surveys
for delete
to authenticated
using (public.is_admin(auth.uid()));
```

---

### 9.2 Survey Questions RLS

Public sadece published survey sorularını okuyabilir:

```sql
create policy "Public can read questions for published surveys"
on public.survey_questions
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.surveys s
    where s.id = survey_questions.survey_id
      and s.status = 'published'
      and (s.starts_at is null or s.starts_at <= now())
      and (s.ends_at is null or s.ends_at >= now())
  )
);
```

Admin yönetebilir:

```sql
create policy "Admins can manage survey questions"
on public.survey_questions
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));
```

---

### 9.3 Survey Responses RLS

Public doğrudan insert yapacaksa:

```sql
create policy "Public can insert responses for published surveys"
on public.survey_responses
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.surveys s
    where s.id = survey_responses.survey_id
      and s.status = 'published'
      and (s.starts_at is null or s.starts_at <= now())
      and (s.ends_at is null or s.ends_at >= now())
  )
);
```

Ama önerilen yapı Edge Function ile insert olduğu için public insert yerine function içinde service role kullanılabilir.

Admin cevapları okuyabilir:

```sql
create policy "Admins can read survey responses"
on public.survey_responses
for select
to authenticated
using (public.is_admin(auth.uid()));
```

Admin update:

```sql
create policy "Admins can update survey responses"
on public.survey_responses
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));
```

Admin delete:

```sql
create policy "Admins can delete survey responses"
on public.survey_responses
for delete
to authenticated
using (public.is_admin(auth.uid()));
```

---

### 9.4 Survey Answers RLS

Public doğrudan insert yapacaksa:

```sql
create policy "Public can insert survey answers"
on public.survey_answers
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.survey_responses r
    join public.surveys s on s.id = r.survey_id
    where r.id = survey_answers.response_id
      and s.status = 'published'
      and (s.starts_at is null or s.starts_at <= now())
      and (s.ends_at is null or s.ends_at >= now())
  )
);
```

Admin cevapları okuyabilir:

```sql
create policy "Admins can read survey answers"
on public.survey_answers
for select
to authenticated
using (public.is_admin(auth.uid()));
```

Admin delete:

```sql
create policy "Admins can delete survey answers"
on public.survey_answers
for delete
to authenticated
using (public.is_admin(auth.uid()));
```

---

## 10. Önerilen Submit Yöntemi: Edge Function

Cevap gönderimi için önerilen endpoint:

```txt
supabase/functions/submit-survey-response/index.ts
```

Frontend doğrudan tabloya yazmak yerine bu function'ı çağırmalı.

Avantajlar:

- Required question validation server tarafında yapılır.
- Draft/closed survey kontrolü yapılır.
- starts_at / ends_at kontrolü yapılır.
- Honeypot kontrolü yapılır.
- Rate-limit uygulanır.
- IP hash tutulur.
- Raw IP kaydedilmez.
- Body size kontrolü yapılabilir.
- Kötüye kullanım azaltılır.

---

## 11. Edge Function Payload

Frontend function'a şu payload'u göndermeli:

```json
{
  "surveySlug": "global-turk-agi-geri-bildirim",
  "respondent": {
    "name": "Umut Barış Terzioğlu",
    "email": "umut@example.com",
    "contactOptIn": true
  },
  "answers": [
    {
      "questionId": "uuid",
      "value": "CorteQS çok iyi ilerliyor."
    },
    {
      "questionId": "uuid",
      "value": ["events", "career", "city_groups"]
    },
    {
      "questionId": "uuid",
      "value": 5
    }
  ],
  "meta": {
    "startedAt": "2026-05-15T10:00:00.000Z",
    "honeypot": ""
  }
}
```

---

## 12. Edge Function Pseudo Kod

```ts
serve(async (req) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const payload = await req.json();

  validateBodySize(payload);
  validateHoneypot(payload.meta?.honeypot);
  validateMinimumSubmitTime(payload.meta?.startedAt);

  const survey = await getSurveyBySlug(payload.surveySlug);

  if (!survey) {
    return json({ error: "Survey not found" }, 404);
  }

  if (survey.status !== "published") {
    return json({ error: "Survey is not active" }, 403);
  }

  validateSurveyDateWindow(survey);

  const questions = await getQuestions(survey.id);

  validateRequiredAnswers(questions, payload.answers);
  validateAnswerTypes(questions, payload.answers);

  await checkRateLimit({
    surveyId: survey.id,
    ipHash,
  });

  const response = await insertSurveyResponse({
    surveyId: survey.id,
    respondent: payload.respondent,
    ipHash,
    userAgent,
  });

  await insertSurveyAnswers({
    responseId: response.id,
    answers: payload.answers,
  });

  return json({ ok: true, responseId: response.id });
});
```

---

## 13. Form Validasyonu

### short_text

```txt
- string olmalı
- max 300 karakter
- required ise boş olamaz
```

### long_text

```txt
- string olmalı
- max 3000 karakter
- required ise boş olamaz
```

### single_choice

```txt
- string olmalı
- value, question.options içinde bulunmalı
```

### multiple_choice

```txt
- array olmalı
- her value, question.options içinde bulunmalı
```

### rating

```txt
- number olmalı
- 1 ile 5 arasında olmalı
```

### yes_no

```txt
- boolean veya yes/no string olabilir
```

### email

```txt
- string olmalı
- geçerli email formatında olmalı
```

---

## 14. Public Sayfa Tasarımı

### `/anket`

Sayfa başlığı:

```txt
CorteQS Anketleri
```

Alt açıklama:

```txt
Topluluğumuzu birlikte geliştirmek için görüşlerini paylaş.
```

Kart içeriği:

```txt
- Anket başlığı
- Kısa açıklama
- Tahmini süre: 1-3 dk
- Durum: Aktif
- Buton: Ankete Katıl
```

Boş state:

```txt
Şu anda aktif anket bulunmuyor.
Yeni anketler yakında burada yayınlanacak.
```

---

## 15. Anket Detay Sayfası

`/anket/:slug` sayfasında:

```txt
- Anket başlığı
- Açıklama
- Sorular
- Opsiyonel iletişim alanı
- Submit butonu
```

Opsiyonel iletişim alanı:

```txt
Ad Soyad
E-posta
Benimle iletişime geçilebilir checkbox
```

Submit butonu:

```txt
Cevabımı Gönder
```

Başarılı gönderim sonrası:

```txt
/anket/tesekkurler
```

---

## 16. Teşekkür Sayfası

Başlık:

```txt
Teşekkürler!
```

Açıklama:

```txt
Cevabın başarıyla alındı. CorteQS topluluğunu birlikte geliştirmek için paylaştığın görüşler çok değerli.
```

Butonlar:

```txt
Ana Sayfaya Dön
Diğer Anketleri Gör
```

---

## 17. Admin Anket Listesi

`/admin/surveys` ekranı:

Kolonlar:

```txt
- Başlık
- Slug
- Status
- Cevap sayısı
- Yayın tarihi
- Oluşturma tarihi
- Aksiyonlar
```

Aksiyonlar:

```txt
- Düzenle
- Cevapları Gör
- Yayınla
- Kapat
- Arşivle
- Sil
```

Status badge renkleri:

```txt
draft      → gri
published  → yeşil
closed     → sarı
archived   → koyu gri
```

---

## 18. Admin Survey Builder

`/admin/surveys/new` ve `/admin/surveys/:id/edit` ekranlarında:

Anket genel bilgileri:

```txt
- Başlık
- Slug
- Açıklama
- Başlangıç tarihi
- Bitiş tarihi
- Anonymous cevaplara izin ver
- Multiple submissions izin ver
- Featured
```

Soru builder:

```txt
- Soru metni
- Açıklama
- Placeholder
- Soru tipi
- Required checkbox
- Options editor
- Sıralama
```

Options editor sadece şu tiplerde gösterilmeli:

```txt
single_choice
multiple_choice
```

Rating için opsiyon gerekmez. Varsayılan 1-5 kullanılabilir.

---

## 19. Admin Cevaplar Sayfası

`/admin/surveys/:id/responses`

Kolonlar:

```txt
- Gönderim tarihi
- Respondent name
- Respondent email
- Contact opt-in
- Status
- Aksiyon
```

Detay görünümü:

```txt
- Her soru
- Altında verilen cevap
- Kullanıcı bilgileri
- Submit tarihi
```

Opsiyonel:

```txt
- CSV export
- Response status: reviewed / archived
```

---

## 20. CSV Export İçin Basit Yaklaşım

İlk aşamada frontend tarafında export yapılabilir.

CSV kolonları:

```txt
response_id
submitted_at
respondent_name
respondent_email
contact_opt_in
question_1
question_2
question_3
...
```

Daha sonra Edge Function veya RPC ile daha sağlam export yapılabilir.

---

## 21. `src/lib/surveys.ts`

Örnek fonksiyonlar:

```ts
export async function getPublishedSurveys() {
  return supabase
    .from("surveys")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });
}

export async function getPublishedSurveyBySlug(slug: string) {
  return supabase
    .from("surveys")
    .select(`
      *,
      survey_questions (*)
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .single();
}

export async function getAdminSurveys() {
  return supabase
    .from("surveys")
    .select(`
      *,
      survey_responses (id)
    `)
    .order("created_at", { ascending: false });
}

export async function createSurvey(input: CreateSurveyInput) {
  return supabase
    .from("surveys")
    .insert(input)
    .select()
    .single();
}

export async function updateSurvey(id: string, input: UpdateSurveyInput) {
  return supabase
    .from("surveys")
    .update(input)
    .eq("id", id)
    .select()
    .single();
}

export async function publishSurvey(id: string) {
  return supabase
    .from("surveys")
    .update({
      status: "published",
      published_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
}

export async function closeSurvey(id: string) {
  return supabase
    .from("surveys")
    .update({
      status: "closed",
      closed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
}
```

---

## 22. `src/lib/survey-responses.ts`

Örnek:

```ts
export async function submitSurveyResponse(payload: SubmitSurveyResponsePayload) {
  const { data, error } = await supabase.functions.invoke("submit-survey-response", {
    body: payload,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function getSurveyResponses(surveyId: string) {
  return supabase
    .from("survey_responses")
    .select(`
      *,
      survey_answers (
        *,
        survey_questions (*)
      )
    `)
    .eq("survey_id", surveyId)
    .order("submitted_at", { ascending: false });
}
```

---

## 23. Kötüye Kullanımı Azaltma

Mutlaka eklenmeli:

```txt
- Honeypot hidden field
- Minimum submit süresi
- Aynı IP hash + survey_id için kısa süreli rate-limit
- Max body size
- Max text length
- Required field server validation
- Public response select kapalı
- Raw IP saklama yok
- Admin dışında cevap görüntüleme yok
```

Minimum submit süresi:

```txt
Form açıldıktan sonra 3 saniyeden erken submit gelirse reddet.
```

Honeypot:

```txt
Görünmeyen bir input ekle.
Normal kullanıcı doldurmaz.
Bot doldurursa submit reddedilir.
```

Rate-limit:

```txt
Aynı IP hash + survey_id kombinasyonu 60 saniye içinde tekrar submit ederse reddedilebilir.
```

---

## 24. Veri Güvenliği

Dikkat edilmesi gerekenler:

```txt
- E-posta zorunlu olmamalı.
- İletişim izni ayrı checkbox olmalı.
- contact_opt_in false ise kullanıcıya pazarlama/iletişim yapılmamalı.
- Admin dışındaki kullanıcılar cevapları okuyamamalı.
- Public API response içinde survey_responses dönmemeli.
- Cevap export dosyası public storage'a koyulmamalı.
- Raw IP saklanmamalı.
- IP hash için server-side salt kullanılmalı.
```

---

## 25. Admin Menüye Ekleme

Admin sidebar/nav içinde yeni menü:

```txt
Anketler
```

Alt metin:

```txt
Topluluk geri bildirimleri ve cevaplar
```

Route:

```txt
/admin/surveys
```

Icon önerisi:

```txt
ClipboardList
```

`lucide-react` kullanılıyorsa:

```tsx
import { ClipboardList } from "lucide-react";
```

---

## 26. Public Menüye Ekleme

Ana navigasyona eklenebilir:

```txt
Anketler
```

Route:

```txt
/anket
```

Eğer navbar kalabalıksa footer veya CTA section içinde gösterilebilir.

---

## 27. Test Senaryoları

### Public testler

```txt
- /anket sayfası açılıyor.
- Published anketler listeleniyor.
- Draft anketler listelenmiyor.
- Closed anketler listelenmiyor.
- /anket/:slug published anketi açıyor.
- Required soru boşsa submit engelleniyor.
- Başarılı submit sonrası teşekkür sayfasına gidiyor.
- Draft survey slug direkt açılmaya çalışılırsa 404/uygun mesaj gösteriliyor.
```

### Admin testler

```txt
- Admin anket listesine erişebiliyor.
- Admin yeni anket oluşturabiliyor.
- Admin soru ekleyebiliyor.
- Admin soru silebiliyor.
- Admin anketi yayınlayabiliyor.
- Admin anketi kapatabiliyor.
- Admin cevapları görüntüleyebiliyor.
```

### Güvenlik testleri

```txt
- Public kullanıcı cevapları okuyamıyor.
- Public kullanıcı draft survey okuyamıyor.
- Public kullanıcı admin route'a giremiyor.
- Honeypot dolu gönderim reddediliyor.
- Çok hızlı submit reddediliyor.
- Geçersiz questionId reddediliyor.
- Required answer eksikse reddediliyor.
```

---

## 28. Küçük Küçük Implementasyon TODO'ları

### Paket 1 – Migration

```txt
[ ] surveys tablosunu oluştur
[ ] survey_questions tablosunu oluştur
[ ] survey_responses tablosunu oluştur
[ ] survey_answers tablosunu oluştur
[ ] indexleri ekle
[ ] updated_at trigger ekle
[ ] RLS'i aktif et
[ ] RLS policy'leri ekle
[ ] Migration'ı local Supabase üzerinde test et
```

### Paket 2 – TypeScript tipleri

```txt
[ ] Supabase types regenerate et
[ ] Survey type oluştur
[ ] SurveyQuestion type oluştur
[ ] SurveyResponse type oluştur
[ ] SurveyAnswer type oluştur
[ ] CreateSurveyInput type oluştur
[ ] SubmitSurveyResponsePayload type oluştur
```

### Paket 3 – Lib fonksiyonları

```txt
[ ] src/lib/surveys.ts oluştur
[ ] getPublishedSurveys fonksiyonunu yaz
[ ] getPublishedSurveyBySlug fonksiyonunu yaz
[ ] getAdminSurveys fonksiyonunu yaz
[ ] createSurvey fonksiyonunu yaz
[ ] updateSurvey fonksiyonunu yaz
[ ] publishSurvey fonksiyonunu yaz
[ ] closeSurvey fonksiyonunu yaz
[ ] archiveSurvey fonksiyonunu yaz
```

### Paket 4 – Public liste sayfası

```txt
[ ] SurveysPage.tsx oluştur
[ ] Published surveys query ekle
[ ] Loading state ekle
[ ] Empty state ekle
[ ] SurveyCard component oluştur
[ ] Ankete Katıl butonu ekle
[ ] Responsive tasarımı kontrol et
```

### Paket 5 – Public detay/form sayfası

```txt
[ ] SurveyDetailPage.tsx oluştur
[ ] slug parametresini oku
[ ] Survey + questions fetch et
[ ] SurveyFormRenderer oluştur
[ ] SurveyQuestionRenderer oluştur
[ ] Question type'a göre input render et
[ ] Required validation ekle
[ ] Submit butonu ekle
[ ] Başarılı submit sonrası /anket/tesekkurler yönlendir
```

### Paket 6 – Edge Function

```txt
[ ] submit-survey-response function oluştur
[ ] POST method kontrolü ekle
[ ] Payload parse et
[ ] Honeypot kontrolü ekle
[ ] Minimum submit süresi kontrolü ekle
[ ] Survey slug ile survey bul
[ ] Survey status kontrolü yap
[ ] starts_at / ends_at kontrolü yap
[ ] Soruları çek
[ ] Required answers validate et
[ ] Answer type validate et
[ ] IP hash oluştur
[ ] Basit rate-limit kontrolü yap
[ ] survey_responses insert et
[ ] survey_answers insert et
[ ] Success response dön
```

### Paket 7 – Admin liste sayfası

```txt
[ ] AdminSurveysPage.tsx oluştur
[ ] Tüm survey'leri fetch et
[ ] Status badge component oluştur
[ ] Yeni Anket butonu ekle
[ ] Düzenle aksiyonu ekle
[ ] Cevapları Gör aksiyonu ekle
[ ] Yayınla aksiyonu ekle
[ ] Kapat aksiyonu ekle
[ ] Arşivle aksiyonu ekle
```

### Paket 8 – Admin create/edit

```txt
[ ] AdminSurveyCreatePage.tsx oluştur
[ ] AdminSurveyEditPage.tsx oluştur
[ ] SurveyBuilder component oluştur
[ ] Genel bilgiler formu ekle
[ ] Soru ekleme alanı ekle
[ ] Soru tipi seçimi ekle
[ ] Required checkbox ekle
[ ] Options editor ekle
[ ] Soru sıralama ekle
[ ] Kaydet butonu ekle
```

### Paket 9 – Admin cevaplar

```txt
[ ] AdminSurveyResponsesPage.tsx oluştur
[ ] Survey bilgilerini fetch et
[ ] Responses fetch et
[ ] SurveyResponsesTable oluştur
[ ] Response detail görünümü oluştur
[ ] Her soru-cevap çiftini göster
[ ] Reviewed / archived status update ekle
[ ] Opsiyonel CSV export ekle
```

### Paket 10 – Final test

```txt
[ ] Public route'ları test et
[ ] Admin route'ları test et
[ ] RLS test et
[ ] Edge Function test et
[ ] Mobile görünümü test et
[ ] Build al
[ ] Lint çalıştır
[ ] Release verify çalıştır
```

---

## 29. Codex İçin Tek Parça Uygulama Prompt'u

```md
# Görev: CorteQS Landing projesine /anket modülü ekle

Mevcut proje React + Vite + TypeScript + Supabase yapısında çalışıyor. Public route’lar `PublicLayout`, admin route’lar `AdminLayout` altında yönetiliyor. Yeni bir anket modülü eklenecek.

## Amaç

Public tarafta `/anket` sayfası olacak. Sadece admin tarafından yayınlanmış/onaylanmış anketler görünecek. Kullanıcılar ankete cevap verecek. Cevaplar admin panelinden görüntülenecek.

## Public route’lar

- `/anket`: Aktif/published anket listesi
- `/anket/:slug`: Anket detay ve cevap formu
- `/anket/tesekkurler`: Başarılı submit sonrası teşekkür sayfası

## Admin route’lar

- `/admin/surveys`: Anket listesi
- `/admin/surveys/new`: Yeni anket oluşturma
- `/admin/surveys/:id/edit`: Anket düzenleme ve soru builder
- `/admin/surveys/:id/responses`: Cevapları görüntüleme

## Supabase tabloları

Şu tablolar için migration oluştur:

- `public.surveys`
- `public.survey_questions`
- `public.survey_responses`
- `public.survey_answers`

Survey status değerleri:

- `draft`
- `published`
- `closed`
- `archived`

Soru tipleri:

- `short_text`
- `long_text`
- `single_choice`
- `multiple_choice`
- `rating`
- `yes_no`
- `email`

## RLS

- Public sadece `published` status’lü survey kayıtlarını okuyabilsin.
- Public sadece published survey’ye ait soruları okuyabilsin.
- Public cevap insert edebilsin ama cevapları okuyamasın.
- Admin tüm survey/question/response/answer kayıtlarını okuyabilsin ve yönetebilsin.
- Admin kontrolü mevcut `public.is_admin(auth.uid())` fonksiyonuyla yapılmalı.

## Submit güvenliği

Tercihen `submit-survey-response` isimli Supabase Edge Function oluştur.

Function şunları yapmalı:

- Survey status kontrolü
- starts_at / ends_at kontrolü
- Required question validation
- Honeypot kontrolü
- Basit rate-limit kontrolü
- IP hash kaydı
- Cevapları `survey_responses` ve `survey_answers` tablolarına yazma

## UI

Public `/anket` sayfası modern, sade, premium görünsün.

Admin tarafında:

- Anket oluşturma formu
- Soru ekleme/silme/sıralama
- Yayınla/Kapat/Arşivle butonları
- Cevap listesi
- Cevap detay modalı veya detay alanı
- CSV export opsiyonel olabilir

## Dosya önerisi

- `src/pages/SurveysPage.tsx`
- `src/pages/SurveyDetailPage.tsx`
- `src/pages/SurveyThankYouPage.tsx`
- `src/pages/admin/surveys/AdminSurveysPage.tsx`
- `src/pages/admin/surveys/AdminSurveyCreatePage.tsx`
- `src/pages/admin/surveys/AdminSurveyEditPage.tsx`
- `src/pages/admin/surveys/AdminSurveyResponsesPage.tsx`
- `src/components/surveys/SurveyCard.tsx`
- `src/components/surveys/SurveyFormRenderer.tsx`
- `src/components/surveys/SurveyQuestionRenderer.tsx`
- `src/components/admin/surveys/SurveyBuilder.tsx`
- `src/components/admin/surveys/SurveyQuestionEditor.tsx`
- `src/components/admin/surveys/SurveyResponsesTable.tsx`
- `src/lib/surveys.ts`
- `src/lib/survey-responses.ts`

## Önemli

İlk sürümde conditional logic, file upload, matrix question gibi karmaşık özellikleri ekleme. Önce çalışan, güvenli, admin kontrollü MVP çıkar.

## Uygulama sırası

1. Supabase migration
2. RLS policy'leri
3. Supabase types regenerate
4. lib fonksiyonları
5. public `/anket` liste sayfası
6. public `/anket/:slug` detay/form sayfası
7. `submit-survey-response` Edge Function
8. admin `/admin/surveys` liste sayfası
9. admin create/edit survey builder
10. admin responses ekranı
11. test ve build doğrulama
```

---

## 30. Özet Karar

Bu özellik için en doğru MVP:

```txt
Anket oluşturma
+ Soru ekleme
+ Yayınlama
+ /anket public liste
+ /anket/:slug cevap formu
+ Edge Function ile güvenli submit
+ Admin panelinden cevap görüntüleme
```

İkinci fazda eklenebilir:

```txt
CSV export
Basit grafikler
Anket kopyalama
Anket sonuç özeti
AI ile cevap analizi
Conditional logic
Çok dilli anket
```
