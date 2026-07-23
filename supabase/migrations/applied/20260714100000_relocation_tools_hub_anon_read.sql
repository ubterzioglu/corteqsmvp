-- Relocation Tools hub (/tools) artık login'siz erişilebilir; araç kartlarını
-- göstermek için relocation_tools tablosuna anon select izni ekleniyor.
-- Tek tek araç sayfaları (/tools/:toolSlug) hâlâ RequireAuth altında; soru
-- havuzu (relocation_tool_questions) authenticated-only kalıyor.
-- Sözleşme: docs/10tool/00-ortak-mimari-ve-agent-talimatlari.md §"RLS".

drop policy if exists relocation_tools_read on public.relocation_tools;
create policy relocation_tools_read on public.relocation_tools
  for select to anon, authenticated using (is_active);
