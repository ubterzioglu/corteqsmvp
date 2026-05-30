export interface MockAuthor {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

export interface MockPost {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  mini_images?: string[];
  country: string | null;
  city: string | null;
  author_role: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
}

export const mockAuthors: Record<string, MockAuthor> = {
  "user-1": { id: "user-1", full_name: "Ahmet Yılmaz", avatar_url: null },
  "user-2": { id: "user-2", full_name: "Maria Schmidt", avatar_url: null },
  "user-3": { id: "user-3", full_name: "Raj Patel", avatar_url: null },
  "user-4": { id: "user-4", full_name: "Dr. Elif Kaya", avatar_url: null },
  "user-5": { id: "user-5", full_name: "Chen Wei", avatar_url: null },
  "user-6": { id: "user-6", full_name: "Business Berlin GmbH", avatar_url: null },
  // Berlin IT Cafe — hardcore IT karakterleri
  "it-1": { id: "it-1", full_name: "Kerem Aydın · Staff SWE @ N26", avatar_url: null },
  "it-2": { id: "it-2", full_name: "Selin Kaya · SRE @ Zalando", avatar_url: null },
  "it-3": { id: "it-3", full_name: "Burak Demir · Platform Eng @ Trade Republic", avatar_url: null },
  "it-4": { id: "it-4", full_name: "Ayşe Yıldız · ML Eng @ HuggingFace BER", avatar_url: null },
  "it-5": { id: "it-5", full_name: "Mert Çelik · Rust/Backend Freelancer", avatar_url: null },
  "it-6": { id: "it-6", full_name: "Emre Şahin · Principal @ Delivery Hero", avatar_url: null },
  "it-7": { id: "it-7", full_name: "Zeynep Arslan · DevSecOps Lead", avatar_url: null },
};

// Berlin IT Cafe ☕ — hardcore IT sohbeti (mock)
export const mockCafeITPosts: MockPost[] = [
  {
    id: "it-post-1",
    user_id: "it-1",
    content:
      "☕ Bugün prod'da ilginç bir incident yaşadık: Postgres'te `pg_stat_activity` sürekli 3k+ idle-in-transaction connection gösteriyordu. Sebep: PgBouncer transaction pooling + Spring `@Transactional(readOnly=true)` ama prepared statement cache açık. Çözüm: `prepareThreshold=0` ve pool_mode=session → pool=transaction'a geri döndük ama prepared statements'ı kapattık. p99 latency 480ms → 70ms. Kimse bana bir daha 'ORM kara kutu değil' demesin.",
    image_url: null,
    country: "Almanya",
    city: "Berlin",
    author_role: "user",
    like_count: 84,
    comment_count: 27,
    created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  },
  {
    id: "it-post-2",
    user_id: "it-2",
    content:
      "Hot take: Kubernetes'te HPA + KEDA kombinasyonu olmadan event-driven workload ölçeklemek 2026'da masochism. Bizim Kafka consumer'lar lag bazlı KEDA ScaledObject ile ölçekleniyor, CPU bazlı HPA scale-down'a karışmasın diye `behavior.scaleDown.stabilizationWindowSeconds=600`. AWS faturası %38 düştü. PR linki commentlerde.",
    image_url:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=900&q=80",
    country: "Almanya",
    city: "Berlin",
    author_role: "user",
    like_count: 142,
    comment_count: 41,
    created_at: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
  },
  {
    id: "it-post-3",
    user_id: "it-3",
    content:
      "gRPC streaming vs SSE tartışması yine açıldı. Bizim broker tarafında 200k concurrent client için gRPC bidirectional stream → HTTP/2 multiplexing avantajı kayboluyor çünkü her client'a ayrı stream açıyorsun. SSE + nginx + Redis pubsub bizde memory'de 4× daha verimli çıktı. WebTransport olgunlaşana kadar `text/event-stream` underrated.",
    image_url: null,
    country: "Almanya",
    city: "Berlin",
    author_role: "user",
    like_count: 67,
    comment_count: 33,
    created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: "it-post-4",
    user_id: "it-4",
    content:
      "🤖 Llama-3.1 70B'yi 8×H100'de vLLM ile serve ediyoruz, paged-attention + speculative decoding (draft model: Llama-3.2-1B) → 2.3× throughput. Ama EU AI Act compliance için her inference'ı log'lamak zorundayız, bu da S3'e ~12TB/gün. Sizde benzer GDPR + observability dengesini nasıl kuruyorsunuz? OpenTelemetry + Tempo yetiyor mu?",
    image_url: null,
    country: "Almanya",
    city: "Berlin",
    author_role: "user",
    like_count: 96,
    comment_count: 28,
    created_at: new Date(Date.now() - 1000 * 60 * 51).toISOString(),
  },
  {
    id: "it-post-5",
    user_id: "it-5",
    content:
      "Rust'ta `tokio::select!` ile cancellation safety'yi yanlış anlayan ekipler için PSA: bir `async fn` içinde state mutate ediyorsan ve future drop edilirse, partial state ile kalırsın. `tokio_util::sync::CancellationToken` + explicit checkpoint pattern hayat kurtarıyor. Bu hafta bir startup'ın ödeme servisinde tam olarak bu yüzden double-charge bug'ı buldum 🙃",
    image_url: null,
    country: "Almanya",
    city: "Berlin",
    author_role: "user",
    like_count: 118,
    comment_count: 19,
    created_at: new Date(Date.now() - 1000 * 60 * 68).toISOString(),
  },
  {
    id: "it-post-6",
    user_id: "it-6",
    content:
      "Monorepo migration update: 14 servisi Bazel + remote cache (BuildBuddy) ile birleştirdik. CI süresi 28dk → 4dk. Ama Bazel'in Go support'u hâlâ 2nd-class — `gazelle` her PR'da BUILD dosyalarını rewrite ediyor, devs kızıyor. Nx-style hybrid (Turborepo for TS, Bazel for JVM/Go) deneyen var mı? Mainstage'e çıkmadan önce ground truth lazım.",
    image_url: null,
    country: "Almanya",
    city: "Berlin",
    author_role: "user",
    like_count: 54,
    comment_count: 22,
    created_at: new Date(Date.now() - 1000 * 60 * 84).toISOString(),
  },
  {
    id: "it-post-7",
    user_id: "it-7",
    content:
      "🔐 Supply-chain saldırılarına karşı: SLSA Level 3 + Sigstore (cosign) + in-toto attestations zincirini Argo Workflows üzerine kurduk. Kicker: OPA Gatekeeper policy → sadece imzalı + provenance'lı image'lar cluster'a girebiliyor. NPM'de `eslint-config` typosquatting saldırısını bu hafta bu pipeline yakaladı. Setup gist'i drop edebilirim, isteyen 👇",
    image_url: null,
    country: "Almanya",
    city: "Berlin",
    author_role: "user",
    like_count: 201,
    comment_count: 47,
    created_at: new Date(Date.now() - 1000 * 60 * 102).toISOString(),
  },
  {
    id: "it-post-8",
    user_id: "it-1",
    content:
      "Cuma akşamı Kreuzberg'te `c-base`'de gayri-resmi system design jam: bu hafta konu 'Rate limiting at planet scale'. Token bucket vs leaky bucket vs sliding window log — kendi prod implementasyonunuzu getirin, whiteboard'ta yırtarız. Bira benden, redis instance'ı sizden 🍺",
    image_url:
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=900&q=80",
    country: "Almanya",
    city: "Berlin",
    author_role: "user",
    like_count: 73,
    comment_count: 14,
    created_at: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
  },
  // ── Geriye doğru 72 saatlik sohbet arşivi ──
  {
    id: "it-post-9",
    user_id: "it-2",
    content:
      "Dün gece prod'da Datadog APM trace'lerinde garip bir N+1 yakaladım: Hibernate `@OneToMany` lazy fetch + Jackson serializer triggering loop. `@JsonIgnore` + DTO projection ile çözdüm ama gerçek soru: 2026'da hâlâ neden default fetch=LAZY üstüne reflection serialization yapıyoruz? Spring Modulith dünyaya gerçekten lazım mı?",
    image_url: null,
    country: "Almanya",
    city: "Berlin",
    author_role: "user",
    like_count: 58,
    comment_count: 21,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: "it-post-10",
    user_id: "it-4",
    content:
      "🧠 Embedding model benchmark: bge-m3 vs e5-mistral-7b vs Cohere embed-v3. Türkçe + İngilizce karışık corpus'ta (Berlin diaspora forumu) MTEB-TR skorları: bge-m3 0.71, e5-mistral 0.74, Cohere 0.78 — ama Cohere API maliyeti 12× daha yüksek. Self-hosted için sweet spot e5-mistral-7b + GTX A6000.",
    image_url: null,
    country: "Almanya",
    city: "Berlin",
    author_role: "user",
    like_count: 89,
    comment_count: 17,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 11).toISOString(),
  },
  {
    id: "it-post-11",
    user_id: "it-3",
    content:
      "Trade Republic'te yeni event sourcing setup: Kafka + Debezium CDC → Flink stateful aggregations → ClickHouse cold storage. Throughput 1.2M event/s, p99 lag <800ms. En zor kısım: GDPR right-to-be-forgotten event log üzerinde tombstone pattern + crypto-shredding. Bunu yapan başka fintech var mı BER'de?",
    image_url: null,
    country: "Almanya",
    city: "Berlin",
    author_role: "user",
    like_count: 134,
    comment_count: 38,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  },
  {
    id: "it-post-12",
    user_id: "it-5",
    content:
      "PSA: `cargo audit` + `cargo deny` CI'da zorunlu yapın. Geçen hafta bir startup'ın `actix-web` 3.x bağımlılığında 2 yıllık known CVE buldum, hâlâ patch'lenmemiş. Rust güvenli dil ama supply chain hâlâ insan hatası 🙃",
    image_url: null,
    country: "Almanya",
    city: "Berlin",
    author_role: "user",
    like_count: 47,
    comment_count: 9,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "it-post-13",
    user_id: "it-6",
    content:
      "Delivery Hero post-mortem (anonim): 14 dakikalık global outage. Root cause: bir SRE'nin `kubectl drain` komutu cluster autoscaler ile race condition'a girdi ve 3 AZ'ın hepsindeki ingress controller pod'larını aynı anda evict etti. Lesson: PDB (PodDisruptionBudget) `maxUnavailable: 1` her zaman, hatta junior dev için de.",
    image_url: null,
    country: "Almanya",
    city: "Berlin",
    author_role: "user",
    like_count: 212,
    comment_count: 54,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
  },
  {
    id: "it-post-14",
    user_id: "it-7",
    content:
      "🔐 Zero Trust deep dive: BeyondCorp benzeri internal app proxy kurarken Cloudflare Access vs Pomerium vs Pangolin denedim. Pomerium'un OPA integration'ı + per-route policy en esnek geldi. Cloudflare daha turnkey ama policy-as-code esnekliği yok. Pangolin OSS + self-hosted için sürpriz iyi.",
    image_url: null,
    country: "Almanya",
    city: "Berlin",
    author_role: "user",
    like_count: 76,
    comment_count: 23,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 38).toISOString(),
  },
  {
    id: "it-post-15",
    user_id: "it-1",
    content:
      "Hot take #2: Microservices değil, 'right-sized services'. N26'da 12 ana domain → 12 servis. Her servisin bir tech lead'i, bir on-call rotation'ı, bir DB'si. Daha fazla bölmek = daha fazla coordination overhead. Conway's Law tam tersini söylüyor olsa da 200 servisi olan startup'ları görüyorum, içim cız ediyor.",
    image_url: null,
    country: "Almanya",
    city: "Berlin",
    author_role: "user",
    like_count: 168,
    comment_count: 42,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 46).toISOString(),
  },
  {
    id: "it-post-16",
    user_id: "it-2",
    content:
      "Zalando SRE oncall haftası bitti, 73 alert, 4 incident, 1 prod deploy rollback. Pattern: en çok alert kapanan saat 03:00-05:00 CET — Asia traffic spike + bizim batch jobs çakışıyor. Çözüm geliyor: cross-region traffic shaping. Kim daha kötü oncall yaşadı? 😅",
    image_url: null,
    country: "Almanya",
    city: "Berlin",
    author_role: "user",
    like_count: 64,
    comment_count: 31,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 54).toISOString(),
  },
  {
    id: "it-post-17",
    user_id: "it-4",
    content:
      "RAG pipeline'da chunking strategy karşılaştırması (Türkçe legal docs üzerinde): fixed 512 token vs semantic chunking (LangChain) vs hierarchical (LlamaIndex). MRR@10 sonuçları: fixed 0.42, semantic 0.58, hierarchical 0.67. Hierarchical'in retrieval latency'si 2.3× daha yüksek ama production-ready için değer.",
    image_url: null,
    country: "Almanya",
    city: "Berlin",
    author_role: "user",
    like_count: 92,
    comment_count: 18,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString(),
  },
  {
    id: "it-post-18",
    user_id: "it-3",
    content:
      "Pazartesi sabahı, kahve sıfır, prod database migration. 47M row üzerinde `ALTER TABLE ... ADD COLUMN ... DEFAULT ...`. PG14'te metadata-only operation olduğunu unutup `pt-online-schema-change` ile 6 saat bekledik. RTFM önemli, özellikle Pazartesi 🙃",
    image_url: null,
    country: "Almanya",
    city: "Berlin",
    author_role: "user",
    like_count: 119,
    comment_count: 27,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 68).toISOString(),
  },
  {
    id: "it-post-19",
    user_id: "it-6",
    content:
      "📚 Kitap önerisi: 'Designing Data-Intensive Applications' (Kleppmann) — 2026'da hâlâ gold standard. Yeni 2nd edition draft'ı GitHub'da: streaming systems chapter'ı genişletilmiş, RAFT/Paxos pratik örnekleri eklenmiş. Berlin'de okuma grubu kuruyorum, isteyen DM 📖",
    image_url: null,
    country: "Almanya",
    city: "Berlin",
    author_role: "user",
    like_count: 156,
    comment_count: 33,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
];

export const mockPosts: MockPost[] = [
  {
    id: "post-1",
    user_id: "user-6",
    content:
      "🇩🇪 Berlin'de yeni şubemizi açtık! Türkçe konuşan personelimizle hafta içi 09:00-18:00 arası hizmetinizdeyiz. İlk 100 müşterimize %20 indirim!",
    image_url: null,
    mini_images: [
      "https://images.unsplash.com/photo-1599946347371-68c8f294a9f5?w=300&q=80",
      "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=300&q=80",
      "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=300&q=80",
    ],
    country: "Almanya",
    city: "Berlin",
    author_role: "business",
    like_count: 24,
    comment_count: 5,
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: "post-2",
    user_id: "user-4",
    content:
      "📢 Göçmenlik hukuku danışmanlığı için randevularımız Mayıs ayı için açıldı. Özellikle çalışma vizesi ve oturum izni süreçlerinde destek sağlıyorum. Detaylar profilimde!",
    image_url: null,
    country: "Hollanda",
    city: "Amsterdam",
    author_role: "consultant",
    like_count: 56,
    comment_count: 12,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: "post-3",
    user_id: "user-1",
    content:
      "Yeni taşındığım Frankfurt'ta kütüphane kartı nasıl alınır biraz karışık geldi. Evraklar: pasaport, ikametgah belgesi ve adres kaydı. 10 dakikada hallettim, tavsiyem sabah erken gidin sıra olmuyor.",
    image_url:
      "https://images.unsplash.com/photo-1568667256549-0942163f7736?w=800&q=80",
    country: "Almanya",
    city: "Frankfurt",
    author_role: "user",
    like_count: 18,
    comment_count: 7,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    id: "post-4",
    user_id: "user-2",
    content:
      "Münih'teki Türk pazarı bu Pazar kurulacak. Ev yapımı baklava, börek ve turşu standları olacak. Herkesi bekleriz! 🥧",
    image_url: null,
    mini_images: [
      "https://images.unsplash.com/photo-1555939594-58d8cb6a9c2e?w=300&q=80",
      "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&q=80",
    ],
    country: "Almanya",
    city: "Münih",
    author_role: "ambassador",
    like_count: 89,
    comment_count: 23,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
  },
  {
    id: "post-5",
    user_id: "user-5",
    content:
      "Singapur'da iş görüşmesi yaptım. İngilizce yeterlilik seviyesi beklediğimden yüksek çıktı. Teknik mülakat 3 saat sürdü. Tavsiyem: LeetCode medium seviyeye kadar çalışın.",
    image_url: null,
    country: "Singapur",
    city: "Singapur",
    author_role: "user",
    like_count: 42,
    comment_count: 15,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "post-6",
    user_id: "user-3",
    content:
      "Londra'da NHS kayıt süreci güncellendi. Artık online başvuru zorunlu. Bölgenizdeki GP practice'i NHS sitesinden bulup kaydolmanız gerekiyor. Adım adım rehber hazırladım, DM ile paylaşabilirim.",
    image_url:
      "https://images.unsplash.com/photo-1584536290625-84e2d2ffab6e?w=800&q=80",
    country: "İngiltere",
    city: "Londra",
    author_role: "consultant",
    like_count: 133,
    comment_count: 31,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
  },
  {
    id: "post-7",
    user_id: "user-1",
    content:
      "Stockholm'de kış hazırlığı başladı. Lastik değişim randevuları dolmaya başladı, bu hafta sonu öncesinde ayırtmanızı öneririm.",
    image_url: null,
    country: "İsveç",
    city: "Stockholm",
    author_role: "user",
    like_count: 7,
    comment_count: 2,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
  },
  {
    id: "post-8",
    user_id: "user-6",
    content:
      "🇳🇱 Amsterdam merkezli lojistik firmamız Türkiye-Almanya hattında yeni anlaşmalar yaptı. Taşımacılık sektöründeki arkadaşlar DM atabilir, özel fiyatlar sunuyoruz.",
    image_url:
      "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&q=80",
    country: "Hollanda",
    city: "Amsterdam",
    author_role: "business",
    like_count: 31,
    comment_count: 8,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: "post-9",
    user_id: "user-2",
    content:
      "Zürih'te Türkçe kitap takas etkinliği düzenliyoruz. 15 Mayıs Pazar, Seepark'ta buluşuyoruz. Getirdiğiniz kadar götürürsünüz! 📚",
    image_url: null,
    mini_images: [
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=300&q=80",
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=300&q=80",
      "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300&q=80",
      "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=300&q=80",
    ],
    country: "İsviçre",
    city: "Zürih",
    author_role: "ambassador",
    like_count: 64,
    comment_count: 18,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 52).toISOString(),
  },
  {
    id: "post-10",
    user_id: "user-4",
    content:
      "AB vatandaşı olmayanlar için Hollanda'da serbest meslek kurma süreci: 1) KVK kaydı 2) Vergi numarası (BSN zaten olmalı) 3) Sigorta seçimi. Toplam maliyet yaklaşık 150-200 EUR. 1 haftada kuruluyor.",
    image_url: null,
    country: "Hollanda",
    city: "Rotterdam",
    author_role: "consultant",
    like_count: 92,
    comment_count: 14,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString(),
  },
  {
    id: "post-11",
    user_id: "user-3",
    content:
      "Toronto'da kiralık ev arayanlar için tüyolar: Facebook Marketplace yerine Kijiji ve PadMapper daha güncel listeler sunuyor. SCAM uyarısı: hiçbir emlakçı E-transfer ödemesi istemez.",
    image_url: null,
    country: "Kanada",
    city: "Toronto",
    author_role: "user",
    like_count: 77,
    comment_count: 22,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  {
    id: "post-12",
    user_id: "user-5",
    content:
      "Tokyo'da dil okulu kayıtları Nisan dönemi için son 2 hafta. En az 6 aylık kursa kaydolana öğrenci vizesi hızlandırılmış. Detayları paylaşabilirim.",
    image_url:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
    country: "Japonya",
    city: "Tokyo",
    author_role: "user",
    like_count: 45,
    comment_count: 9,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 80).toISOString(),
  },
];
