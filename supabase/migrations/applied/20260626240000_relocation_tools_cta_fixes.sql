-- Relocation Tools — sonuç ekranı CTA düzeltmeleri (yalnız ctas çıktısı; skor mantığı DEĞİŞMEZ).
-- Sözleşme: docs/10tool/. Kaynak migration'lar (130000/140000/190000) prod'da immutable;
-- düzeltme yalnız bu yeni migration'da. RPC ADLARI değişmiyor → dispatcher (230000) aynen geçerli.
-- TS skor aynaları (relocation-tools-*.ts) etkilenmez (CTA metni/href TS'te yok).
--
-- Düzeltilen 3 nokta:
--  1) top_challenge      — iş-bulma aracına kırık slug 'yurtdisi-is-bulma-olasiligi' → 'is-bulma-olasiligi'
--  2) profession_salary  — aynı kırık slug → 'is-bulma-olasiligi'
--  3) expat_persona      — yanıltıcı CTA etiketi 'Profil Badge''i Olarak Kaydet' → 'Profilini Tamamla'
--     (gerçek badge yazma = consent + user_profile_attributes; ayrı iş.)
--
-- Yöntem: fonksiyon gövdesini elle kopyalamak yerine pg_get_functiondef ile mevcut tanımı alıp
-- yalnız ilgili stringleri replace ederek yeniden çalıştırır. Idempotent + kaynak-bağımsız;
-- string yoksa replace no-op'tur (önceden uygulanmışsa güvenli).

do $$
declare
  v_def text;
begin
  -- 1) top_relocation_challenge: kırık iş-bulma slug'ını düzelt.
  v_def := pg_get_functiondef('public.relocation_score_top_challenge_v1(uuid)'::regprocedure);
  v_def := replace(
    v_def,
    '/relocation/tools/yurtdisi-is-bulma-olasiligi',
    '/relocation/tools/is-bulma-olasiligi'
  );
  execute v_def;

  -- 2) profession_salary: kırık iş-bulma slug'ını düzelt.
  v_def := pg_get_functiondef('public.relocation_score_profession_salary_v1(uuid)'::regprocedure);
  v_def := replace(
    v_def,
    '/relocation/tools/yurtdisi-is-bulma-olasiligi',
    '/relocation/tools/is-bulma-olasiligi'
  );
  execute v_def;

  -- 3) expat_lifestyle_persona: yanıltıcı "Profil Badge'i Olarak Kaydet" etiketini dürüstleştir.
  -- DİKKAT: pg_get_functiondef çıktısında içteki apostrof KAÇIŞLI gelir ('' = tek apostrof),
  -- bu yüzden arama metninde apostrofu çift yazıyoruz (SQL literal'de '''' = ''). Aksi halde eşleşmez.
  v_def := pg_get_functiondef('public.relocation_score_expat_lifestyle_persona_v1(uuid)'::regprocedure);
  v_def := replace(
    v_def,
    'Profil Badge''''i Olarak Kaydet',
    'Profilini Tamamla'
  );
  execute v_def;
end;
$$;

-- Not: grant'lar pg_get_functiondef tanımının korunmasıyla değişmez; gene de garanti altına al.
grant execute on function public.relocation_score_top_challenge_v1(uuid) to authenticated;
grant execute on function public.relocation_score_profession_salary_v1(uuid) to authenticated;
grant execute on function public.relocation_score_expat_lifestyle_persona_v1(uuid) to authenticated;
