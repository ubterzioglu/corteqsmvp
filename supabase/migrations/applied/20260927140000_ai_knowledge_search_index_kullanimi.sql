-- ============================================================
-- Purpose: `ai_knowledge_search` HNSW indeksini KULLANMIYORDU; her arama
--          ai_knowledge_documents'in TAMAMINI (4.794 satır / 30 MB içerik +
--          vektör) sıralı tarıyordu.
--
--          Kök neden tek satırdı: mesafe hesabı WHERE yan tümcesindeydi
--            and (d.embedding <=> p_embedding) <= p_max_distance
--          HNSW indeksi YALNIZ `ORDER BY <=> ... LIMIT n` desenini hızlandırır.
--          Mesafe bir filtre koşulu olarak yazılınca planlayıcı her satır için
--          mesafeyi hesaplamak zorunda kalır ve indeksi tamamen atlar.
--
--          Ölçüm (25-27 Eylül, canlı):
--            - idx_ai_knowledge_documents_embedding: 36 MB, idx_scan = 0 (HİÇ)
--            - ai_knowledge_documents: 62 sıralı tarama, 74.237 satır okundu
--            - ai_knowledge_search: 26 çağrı, ortalama 703 ms, en uzun 2.429 ms
--          EXPLAIN kanıtı: mevcut desen "Seq Scan", bu desen
--          "Index Scan using idx_ai_knowledge_documents_embedding".
--
--          NEDEN CADDE'Yİ ETKİLİYOR: örnek 426 MB bellekle en küçük katmanda
--          (compute add-on yok). Her bot araması ~30 MB'ı belleğe çekip önbelleği
--          tahliye ediyor; aynı anda çalışan list_cadde_feed_v1 (normalde 278 ms)
--          diske düşüp 7.195 ms'ye çıkıyor ve 8 sn'lik statement_timeout sınırına
--          dayanıyor. 25 Eylül'de iki kez aştı (client_error_reports).
--
-- Sonuç kümesi DEĞİŞMEZ: mesafeye göre artan sırada olduğumuz için "önce filtrele
-- sonra ilk N" ile "önce ilk N sonra filtrele" aynı satırları döndürür. En yakın
-- N kaydın hepsi eşiğin üstündeyse N+1. kayıt zaten daha uzaktır.
--
-- Risk:    Düşük. İmza, yetki ve dönüş tipi aynı; yalnız gövde yeniden yazıldı.
-- Rollback: mesafe koşulunu yeniden WHERE'e taşı (performans geri gider).
-- ============================================================

BEGIN;

-- ⚠️ İmza, volatilite ve search_path CANLIDAKİYLE BİREBİR AYNI olmalı; en ufak
-- fark CREATE OR REPLACE yerine İKİNCİ BİR AŞIRI YÜKLEME yaratır ve PostgREST
-- ikisi arasında karar veremez. Canlıdan okunan hâli: (vector, text[], integer,
-- double precision) · VOLATILE · SECURITY DEFINER · search_path=public.
CREATE OR REPLACE FUNCTION public.ai_knowledge_search(
  p_embedding vector,
  p_audiences text[] DEFAULT NULL,
  p_limit integer DEFAULT 8,
  p_max_distance double precision DEFAULT 0.65
)
 RETURNS TABLE(source_key text, title text, url text, content text, distance double precision)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_limit int := least(greatest(coalesce(p_limit, 8), 1), 30);
begin
  -- Kitle filtresi RPC'nin İÇİNDE kalır: istemciden gelen rol iddiasına güvenilmez.
  if auth.role() <> 'service_role' then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_embedding is null then
    return;
  end if;

  -- ⚠️ Mesafe eşiğini bu alt sorgunun İÇİNE TAŞIMAYIN. Burada `order by ... limit`
  -- deseni bozulmadan durduğu için HNSW indeksi kullanılabiliyor; eşik koşulu
  -- WHERE'e girdiği anda planlayıcı sıralı taramaya döner (ölçüldü: 4.794 satır).
  return query
  select s.source_key, s.title, s.url, s.content, s.distance
  from (
    select
      d.source_key,
      d.title,
      d.url,
      d.content,
      (d.embedding <=> p_embedding)::double precision as distance
    from public.ai_knowledge_documents d
    where d.embedding is not null
      and d.audience = any (coalesce(p_audiences, array['public', 'member']))
    order by d.embedding <=> p_embedding
    limit v_limit
  ) s
  where s.distance <= coalesce(p_max_distance, 0.65);
end;
$function$;

COMMENT ON FUNCTION public.ai_knowledge_search(vector, text[], integer, double precision) IS
  'Bilgi tabanı semantik arama. Mesafe eşiği ALT SORGUNUN DIŞINDA uygulanır — WHERE''e taşınırsa HNSW indeksi devre dışı kalır (27.09 ölçümü: idx_scan 0, sıralı tarama).';

COMMIT;
