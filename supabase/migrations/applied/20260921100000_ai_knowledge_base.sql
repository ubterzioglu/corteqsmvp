-- Site geneli AI bot — bilgi tabanı (MVP, Adım 1).
-- Plan: docs/plans/2026-09-20-site-geneli-ai-bot-plani.md
-- Ertelenenler: docs/kalanlar/2026-09-21-site-geneli-ai-bot-kalan-isler.md
--
-- NEDEN YENİ BİR TABLO — `catalog_search_documents` kullanılamaz:
-- O tablonun `item_id` sütunu `catalog_items(id)` üzerine ZORUNLU FK'dir
-- (`on delete cascade`). Blog yazısı bir `catalog_items` satırı DEĞİLDİR, dolayısıyla
-- oraya YAZILAMAZ. 20 Eylül planı bunun mümkün olduğunu varsayıyordu; ölçülünce çürüdü.
--
-- TEK YÜZEY, BİLİNÇLİ: katalog metni de bu tabloya alınır (`source_key='catalog'`).
-- İki tabloyu `union` ile birleştiren bir arama denendi ve çıkarıldı — iki kuyruk,
-- iki indeks stratejisi ve iki görünürlük kuralı demekti. `catalog_search_documents`
-- kendi işine (dizin araması) bakar; bkz. kalan işler K2.
--
-- BOYUT 1536 ZORUNLUDUR: `catalog_search_documents.embedding` zaten `vector(1536)`
-- (migration 20260604110000). İki yüzeyin ileride aynı vektör uzayında buluşabilmesi
-- için bu tablo da 1536'dır. Gemini `gemini-embedding-001` bunu
-- `outputDimensionality: 1536` ile üretir — VARSAYILANI 3072'dir; parametre
-- verilmezse boyut tutmaz ve yazma anında patlar.

create extension if not exists vector;

create table if not exists public.ai_knowledge_documents (
  id uuid primary key default gen_random_uuid(),

  -- Kaynak kaydı: 'catalog', 'blog', ... Yeni veri seti eklemek = yeni bir source_key
  -- + scripts/ai-knowledge/sources/ altında bir modül. Şema değişmez.
  source_key text not null,

  -- Kaynak içinde KARARLI kimlik (katalog item_id'si, blog slug'ı). Yeniden
  -- çalıştırmada aynı kalmalı; (source_key, external_id, chunk_index) üçlüsü
  -- idempotency anahtarıdır.
  external_id text not null,
  chunk_index integer not null default 0,

  title text not null,
  url text,

  -- MVP'de her satır 'public' ya da 'member'. Sütun ŞİMDİDEN kondu ki `docs/`
  -- korpusu eklendiğinde (kalan işler K1) şema değişikliği gerekmesin — o iş tek
  -- modül + tek ingest çalıştırması olsun.
  audience text not null default 'member'
    check (audience in ('public', 'member', 'admin')),

  content text not null,

  -- İdempotency: içerik değişmediyse embedding KORUNUR, yeniden üretilmez.
  -- Bu sütun olmadan her ingest çalışması bütün korpusu yeniden ücretlendirirdi.
  content_hash text not null,

  embedding vector(1536),
  embedded_at timestamptz,

  -- Hata raporu: başarısız satır sessizce kaybolmaz, sebebi burada kalır.
  embed_error text,
  embed_attempts integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint ai_knowledge_documents_unique_chunk
    unique (source_key, external_id, chunk_index)
);

alter table public.ai_knowledge_documents enable row level security;

-- HNSW, ivfflat DEĞİL. ivfflat küme merkezlerini VAR OLAN satırlardan öğrenir;
-- boş tabloda kurulursa merkezler anlamsız kalır ve tablo dolduktan sonra
-- YENİDEN KURULMADIKÇA isabet düşük olur — üstelik hiçbir hata vermeden.
-- `catalog_search_documents` üzerindeki ivfflat indeksi (lists=100) tam olarak bu
-- durumda: 0 satır üzerinde kurulmuş. HNSW eğitim verisi istemez.
create index if not exists idx_ai_knowledge_documents_embedding
  on public.ai_knowledge_documents
  using hnsw (embedding vector_cosine_ops);

create index if not exists idx_ai_knowledge_documents_source
  on public.ai_knowledge_documents (source_key);

-- Kuyruk taraması: embedding'i olmayan satırlar. Kısmi indeks, korpus büyüdükçe
-- kuyruk sorgusunun tam tarama yapmasını engeller.
create index if not exists idx_ai_knowledge_documents_pending
  on public.ai_knowledge_documents (embed_attempts, updated_at)
  where embedding is null;

comment on table public.ai_knowledge_documents is
  'Site geneli AI asistanının bilgi tabanı. Kaynaklar source_key ile ayrılır (catalog, blog, ...). Yeni kaynak eklemek sema degisikligi gerektirmez.';
comment on column public.ai_knowledge_documents.audience is
  'public | member | admin. Ic belgeler eklendiginde admin ile isaretlenir ve siradan uyeye servis EDILMEZ.';
comment on column public.ai_knowledge_documents.content_hash is
  'md5(content). Degismediyse embedding korunur — yeniden ucretlendirme olmaz.';

-- ---------------------------------------------------------------------------
-- Yazma yüzeyi (yalnız service_role)
-- ---------------------------------------------------------------------------

-- İçerik aynıysa embedding'e DOKUNMAZ. Bu fonksiyonun tamamı idempotency sözüdür:
-- ingest script'i her çalıştığında bütün korpusu gönderebilir, yalnız değişenler
-- yeniden embed'lenir. Dönen `action` çağırana ne olduğunu söyler.
create or replace function public.ai_knowledge_upsert_document(
  p_source_key text,
  p_external_id text,
  p_chunk_index integer,
  p_title text,
  p_url text,
  p_audience text,
  p_content text
)
returns table (document_id uuid, action text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hash text := md5(p_content);
  v_existing record;
begin
  if auth.role() <> 'service_role' then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select id, content_hash into v_existing
  from public.ai_knowledge_documents
  where source_key = p_source_key
    and external_id = p_external_id
    and chunk_index = coalesce(p_chunk_index, 0);

  if v_existing.id is null then
    insert into public.ai_knowledge_documents (
      source_key, external_id, chunk_index, title, url, audience, content, content_hash
    )
    values (
      p_source_key, p_external_id, coalesce(p_chunk_index, 0),
      p_title, p_url, coalesce(p_audience, 'member'), p_content, v_hash
    )
    returning id into document_id;

    action := 'inserted';
    return next;
    return;
  end if;

  if v_existing.content_hash = v_hash then
    -- İçerik aynı. Üst veri (başlık/URL/kitle) yine de tazelenir; embedding KORUNUR.
    update public.ai_knowledge_documents
    set title = p_title,
        url = p_url,
        audience = coalesce(p_audience, audience),
        updated_at = now()
    where id = v_existing.id
      and (title is distinct from p_title
        or url is distinct from p_url
        or audience is distinct from coalesce(p_audience, audience));

    document_id := v_existing.id;
    action := 'unchanged';
    return next;
    return;
  end if;

  -- İçerik değişti → embedding GEÇERSİZ. Null'a çekilmesi satırı kuyruğa geri koyar.
  update public.ai_knowledge_documents
  set title = p_title,
      url = p_url,
      audience = coalesce(p_audience, audience),
      content = p_content,
      content_hash = v_hash,
      embedding = null,
      embedded_at = null,
      embed_error = null,
      embed_attempts = 0,
      updated_at = now()
  where id = v_existing.id;

  document_id := v_existing.id;
  action := 'updated';
  return next;
end;
$$;

-- Kaynaktan SİLİNMİŞ kayıtları temizler. `p_keep_external_ids` o kaynağın bu
-- çalıştırmada görülen bütün kimlikleridir; listede olmayan satır kaynakta artık
-- yoktur. Bu olmadan silinen bir blog yazısı bota sonsuza dek yanıt vermeye devam eder.
create or replace function public.ai_knowledge_prune_source(
  p_source_key text,
  p_keep_external_ids text[]
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  if auth.role() <> 'service_role' then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  -- Boş liste tüm kaynağı silmek anlamına gelir; bu neredeyse her zaman bir ingest
  -- hatasıdır (kaynak okunamadı). Veri kaybı ile hatayı ayırt eden tek fren budur.
  if p_keep_external_ids is null or array_length(p_keep_external_ids, 1) is null then
    raise exception 'ai_knowledge_prune_source: bos kimlik listesi reddedildi (kaynak: %)', p_source_key
      using errcode = '22023';
  end if;

  with removed as (
    delete from public.ai_knowledge_documents
    where source_key = p_source_key
      and not (external_id = any (p_keep_external_ids))
    returning 1
  )
  select count(*)::integer into v_deleted from removed;

  return v_deleted;
end;
$$;

create or replace function public.ai_knowledge_set_embedding(
  p_document_id uuid,
  p_embedding vector(1536)
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.ai_knowledge_documents
  set embedding = p_embedding,
      embedded_at = now(),
      embed_error = null,
      updated_at = now()
  where id = p_document_id;
end;
$$;

create or replace function public.ai_knowledge_mark_embed_error(
  p_document_id uuid,
  p_error text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.ai_knowledge_documents
  set embed_error = left(coalesce(p_error, 'bilinmeyen hata'), 500),
      embed_attempts = embed_attempts + 1,
      updated_at = now()
  where id = p_document_id;
end;
$$;

-- `p_max_attempts`: sürekli patlayan bir satır kuyruğu sonsuza dek tıkamasın.
create or replace function public.ai_knowledge_pending_documents(
  p_limit integer default 100,
  p_max_attempts integer default 3
)
returns table (
  document_id uuid,
  source_key text,
  external_id text,
  chunk_index integer,
  title text,
  content text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select d.id, d.source_key, d.external_id, d.chunk_index, d.title, d.content
  from public.ai_knowledge_documents d
  where d.embedding is null
    and d.embed_attempts < greatest(coalesce(p_max_attempts, 3), 1)
  order by d.embed_attempts, d.updated_at
  limit greatest(coalesce(p_limit, 100), 1);
end;
$$;

-- ---------------------------------------------------------------------------
-- Okuma yüzeyi
-- ---------------------------------------------------------------------------

-- KİTLE FİLTRESİ BURADA UYGULANIR, istemcide değil. Fonksiyon `service_role`
-- dışına grant'lı DEĞİLDİR; edge fonksiyonu kullanıcının rolünü kendi doğrulayıp
-- `p_audiences` dizisini kurar. MVP'de her satır public/member olduğu için varsayılan
-- yeterlidir, ama iç belgeler eklendiğinde (K1) bu sözleşme değişmez.
--
-- `p_max_distance`: kosinüs mesafesi. Eşiğin üstündeki sonuç "alakasız" sayılır ve
-- DÖNMEZ — bota alakasız bağlam vermek uydurmayı teşvik eder, boş bağlam vermekten
-- daha zararlıdır.
create or replace function public.ai_knowledge_search(
  p_embedding vector(1536),
  p_audiences text[] default array['public', 'member'],
  p_limit integer default 8,
  p_max_distance double precision default 0.65
)
returns table (
  source_key text,
  title text,
  url text,
  content text,
  distance double precision
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_embedding is null then
    return;
  end if;

  return query
  select
    d.source_key,
    d.title,
    d.url,
    d.content,
    (d.embedding <=> p_embedding)::double precision
  from public.ai_knowledge_documents d
  where d.embedding is not null
    and d.audience = any (coalesce(p_audiences, array['public', 'member']))
    and (d.embedding <=> p_embedding) <= coalesce(p_max_distance, 0.65)
  order by d.embedding <=> p_embedding
  limit least(greatest(coalesce(p_limit, 8), 1), 30);
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS ve yetkiler
-- ---------------------------------------------------------------------------

-- Doğrudan tablo okuması YOK — bot bu satırlara yalnız security-definer arama
-- RPC'si üzerinden erişir, böylece kitle filtresi atlanamaz. Moderatöre select
-- verilir ki durum panelden düz sorguyla okunabilsin (ayrı bir stats RPC'si
-- bilinçli olarak yazılmadı).
drop policy if exists "ai_knowledge_documents_moderator_read" on public.ai_knowledge_documents;
create policy "ai_knowledge_documents_moderator_read"
on public.ai_knowledge_documents
for select
to authenticated
using (public.is_moderator(auth.uid()));

drop policy if exists "ai_knowledge_documents_service_role_all" on public.ai_knowledge_documents;
create policy "ai_knowledge_documents_service_role_all"
on public.ai_knowledge_documents
for all
to service_role
using (true)
with check (true);

grant select on public.ai_knowledge_documents to authenticated;
grant select, insert, update, delete on public.ai_knowledge_documents to service_role;

revoke all on function public.ai_knowledge_upsert_document(text, text, integer, text, text, text, text) from public;
revoke all on function public.ai_knowledge_prune_source(text, text[]) from public;
revoke all on function public.ai_knowledge_set_embedding(uuid, vector) from public;
revoke all on function public.ai_knowledge_mark_embed_error(uuid, text) from public;
revoke all on function public.ai_knowledge_pending_documents(integer, integer) from public;
revoke all on function public.ai_knowledge_search(vector, text[], integer, double precision) from public;

grant execute on function public.ai_knowledge_upsert_document(text, text, integer, text, text, text, text) to service_role;
grant execute on function public.ai_knowledge_prune_source(text, text[]) to service_role;
grant execute on function public.ai_knowledge_set_embedding(uuid, vector) to service_role;
grant execute on function public.ai_knowledge_mark_embed_error(uuid, text) to service_role;
grant execute on function public.ai_knowledge_pending_documents(integer, integer) to service_role;
grant execute on function public.ai_knowledge_search(vector, text[], integer, double precision) to service_role;
