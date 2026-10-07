-- Otomatik üretildi: scripts/gen-seed.ts (kaynak: supabase/functions/_shared/engine/rules.ts)
-- Tekrar çalıştırılabilir: aynı pattern varsa atlanır.
insert into public.payment_cards (last4, label, bank, payment_method, owner, is_virtual, default_person) values
  ('6108', 'QNB Sanal (…6108)', 'QNB Finansbank', 'sanal_kart_burak', 'burak', true, 'ortak'),
  ('3286', 'QNB Asıl (…3286)', 'QNB Finansbank', 'kisisel_kart_burak', 'burak', false, 'ortak'),
  ('MAXI', 'Maximiles (İş Bankası)', 'İş Bankası', 'kisisel_kart_burak', 'burak', false, 'ortak')
on conflict (last4) do nothing;

insert into public.merchant_rules (pattern, merchant, category, person, is_tech, share_pct, priority, auto_commit)
select * from (values
  ('ANTHROPIC|CLAUDE', 'Anthropic Claude', 'yazilim_araclar', null, true, null::numeric, 10, true),
  ('CODEX', 'OpenAI Codex', 'yazilim_araclar', null, true, null::numeric, 9, false),
  ('OPENAI|CHATGPT|GPT BUSINESS', 'OpenAI ChatGPT', 'yazilim_araclar', null, true, null::numeric, 10, true),
  ('LOVABLE', 'Lovable', 'yazilim_araclar', null, true, null::numeric, 10, true),
  ('SUPABASE', 'Supabase', 'yazilim_araclar', null, true, null::numeric, 10, true),
  ('NEO4J|NEO 4 ?J', 'Neo4j', 'yazilim_araclar', null, true, null::numeric, 10, true),
  ('HIGGSFIELD|HIGSFIELD|HIGSSFIELD', 'Higgsfield', 'yazilim_araclar', null, true, null::numeric, 10, false),
  ('KLING', 'Kling AI', 'yazilim_araclar', null, true, null::numeric, 10, false),
  ('EMERGENT', 'Emergent', 'yazilim_araclar', null, true, null::numeric, 10, false),
  ('Z\.?AI\b|ZHIPU|BIGMODEL', 'Z.AI', 'yazilim_araclar', null, true, null::numeric, 10, false),
  ('GEMINI', 'Google Gemini', 'yazilim_araclar', null, true, null::numeric, 11, false),
  ('GOOGLE ?CLOUD|GCP|CLOUD\.GOOGLE', 'Google Cloud', 'yazilim_araclar', null, true, null::numeric, 11, false),
  ('GOOGLE ?ONE|GOOGLE STORAGE', 'Google One', 'yazilim_araclar', null, true, null::numeric, 12, false),
  ('GOOGLE ?PLAY', 'Google Play', 'yazilim_araclar', null, true, null::numeric, 13, false),
  ('GOOGLE ?(WORKSPACE|GSUITE)', 'Google Workspace', 'yazilim_araclar', null, true, null::numeric, 11, false),
  ('CANVA', 'Canva Pro', 'yazilim_araclar', null, true, null::numeric, 10, false),
  ('ZOOM', 'Zoom', 'yazilim_araclar', null, true, null::numeric, 10, true),
  ('GITHUB', 'GitHub', 'yazilim_araclar', null, true, null::numeric, 10, true),
  ('CURSOR', 'Cursor', 'yazilim_araclar', null, true, null::numeric, 10, false),
  ('VERCEL', 'Vercel', 'hosting_sunucu', null, true, null::numeric, 10, false),
  ('WHATSAPP|META ?(PLATFORMS|BUSINESS)', 'WhatsApp Business / Meta', 'yazilim_araclar', null, true, null::numeric, 12, false),
  ('DORUK BILISIM', 'Doruk Bilişim', 'yazilim_araclar', null, true, null::numeric, 10, false),
  ('APPLE\.COM|APPLE', 'Apple', 'yazilim_araclar', null, true, null::numeric, 20, false),
  ('LINKEDIN', 'LinkedIn Premium', 'pazarlama_reklam', null, true, null::numeric, 10, false),
  ('STRATO', 'Strato', 'hosting_sunucu', null, true, null::numeric, 10, true),
  ('ZOHO', 'Zoho Workplace', 'hosting_sunucu', null, true, null::numeric, 10, true),
  ('HOSTINGER|DIGITALOCEAN|HETZNER|\bAWS\b|AMAZON WEB SERVICES|CLOUDFLARE', 'Hosting', 'hosting_sunucu', null, true, null::numeric, 9, false),
  ('NAMECHEAP', 'Namecheap', 'alan_adi_ssl', null, true, null::numeric, 10, false),
  ('GODADDY', 'GoDaddy', 'alan_adi_ssl', null, true, null::numeric, 10, false),
  ('MYDOMAIN', 'MyDomain', 'alan_adi_ssl', null, true, null::numeric, 10, false),
  ('METUNIC', 'MetUnic', 'alan_adi_ssl', null, true, null::numeric, 10, false),
  ('SUPERCELL|STEAM|PLAYSTATION|NETFLIX|SPOTIFY|DISNEY', 'Kişisel eğlence', 'diger', null, false, null::numeric, 5, false),
  ('AMAZON(?! WEB)', 'Amazon', 'diger', null, true, null::numeric, 30, false),
  ('BSMV|KKDF|KART UCRETI|YILLIK UCRET|GECIKME|FAIZ|KOMISYON', 'Banka kesintisi', 'banka_komisyon', null, false, null::numeric, 1, false)
) as v(pattern, merchant, category, person, is_tech, share_pct, priority, auto_commit)
where not exists (select 1 from public.merchant_rules m where m.pattern = v.pattern);
