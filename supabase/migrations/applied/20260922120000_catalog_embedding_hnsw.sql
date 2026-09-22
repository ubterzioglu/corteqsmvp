-- B21.2: Katalog embedding indeksi dolu tablo uzerinde HNSW olarak kurulur.
--
-- Canli olcum (2026-09-22):
--   catalog_search_documents: 647 toplam, 647 embedding, 0 bos, 15 MB
--   mevcut indeks: idx_catalog_search_documents_embedding (ivfflat, lists=100)
--
-- HNSW egitim verisi gerektirmez; katalog buyudukce ivfflat gibi yeniden
-- egitilmesi gerekmez. Tablo kucuk oldugu icin indeks runner'in transaction'i
-- icinde kurulur. CREATE basarisiz olursa DROP da ayni transaction ile geri alinir.
--
-- Geri alma gerekiyorsa yeni bir forward migration ile HNSW indeksi dusurulup
-- ayni adla ivfflat (vector_cosine_ops, lists=100) yeniden kurulmalidir.

drop index if exists public.idx_catalog_search_documents_embedding;

create index idx_catalog_search_documents_embedding
  on public.catalog_search_documents
  using hnsw (embedding vector_cosine_ops);

comment on index public.idx_catalog_search_documents_embedding is
  'B21.2: Dolu katalog embedding tablosu icin HNSW cosine indeksi.';
