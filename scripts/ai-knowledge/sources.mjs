// Bilgi tabanı kaynak kayıt defteri.
//
// YENİ VERİ SETİ EKLEMENİN TEK NOKTASI BURASI:
//   1. Bir `load(client)` fonksiyonu yaz — `{ externalId, title, url, text }` dizisi döndürsün.
//   2. `KNOWLEDGE_SOURCES` dizisine bir satır ekle.
// Şema DEĞİŞMEZ, ingest komutu AYNI kalır. Ertelenen kaynaklar için bkz.
// docs/kalanlar/2026-09-21-site-geneli-ai-bot-kalan-isler.md (K1 dokümanlar, K6 diğerleri).

import { fetchAllRows } from "./client.mjs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { markdownToPlainText, htmlToPlainText, collapseWhitespace } from "./text-extract.mjs";

const DOCS_ROOT = "docs";

/** New documentation is admin-only unless it is deliberately placed in guides. */
export function classifyDocumentationPath(relativePath) {
  const normalized = relativePath.replace(/\\/g, "/");
  if (normalized.startsWith("docs/exports/blog-md/")) return null;
  return normalized.startsWith("docs/guides/") ? "member" : "admin";
}

async function loadDocumentationDocuments(audience) {
  const paths = await readdir(DOCS_ROOT, { recursive: true });
  const documents = await Promise.all(
    paths
      .filter((entry) => /\.(md|html)$/i.test(entry))
      .map(async (entry) => {
        const relativePath = path.join(DOCS_ROOT, entry).replace(/\\/g, "/");
        if (classifyDocumentationPath(relativePath) !== audience) return null;
        const raw = await readFile(relativePath, "utf8");
        const text = entry.toLowerCase().endsWith(".html") ? htmlToPlainText(raw) : markdownToPlainText(raw);
        if (!text) return null;
        return {
          externalId: relativePath,
          title: path.basename(entry, path.extname(entry)).replace(/[-_]/g, " "),
          url: null,
          text,
        };
      }),
  );
  return documents.filter(Boolean);
}

/**
 * Yer tutucu (placeholder) katalog kaydı mı?
 *
 * ⚠️ BUNLAR BOTA VERİLMEZ. 21 Eylül'de ölçüldü: dizinde görünen 249 katalog
 * kaydının **76'sı** (%31) `[PLACEHOLDER]` ön ekli sahte kayıt. Semantik arama
 * bunları GERÇEKLERDEN DAHA İYİ eşleştiriyor çünkü başlıkları kategorinin tam
 * adı oluyor: "şehir elçisi kim?" sorgusunun en iyi eşleşmesi 0.202 mesafeyle
 * `[PLACEHOLDER] Şehir Elçisi` idi. Bot bu kaydı gerçek bir kişi gibi önerirdi.
 *
 * Dizinin kendisinde ne yapılacağı ayrı bir ÜRÜN kararıdır (elensin mi,
 * işaretlensin mi, yayından mı kalksın) — bkz.
 * docs/kalanlar/2026-09-21-demo-icerik-ve-katalog-gorunurlugu.md. Burada
 * verilen karar yalnız botun korpusunu ilgilendirir ve o karardan bağımsızdır.
 */
export function isPlaceholderTitle(title) {
  return /^\s*\[PLACEHOLDER\]/i.test(String(title ?? ""));
}

/**
 * Katalog kayıtları — dizindeki kişi, kurum, hizmet, dernek.
 *
 * `catalog_search_documents` okunur, `catalog_items` DEĞİL: o tabloda arama metni
 * zaten toplanmış durumda (başlık + açıklama + kategori + etiket + hizmet + konum),
 * üstelik `catalog_rebuild_search_document` trigger'ları onu güncel tutuyor.
 * Aynı birleştirmeyi burada tekrar yazmak ikinci bir gerçek kaynağı olurdu.
 *
 * ⚠️ GÖRÜNÜRLÜK FİLTRESİ `search_directory_catalog` İLE AYNI OLMAK ZORUNDA:
 * yayımlanmamış ya da gizli bir kayıt dizinde çıkmıyorsa botun ağzından da çıkmamalı.
 */
async function loadCatalogDocuments(client) {
  const [rows, items, roles] = await Promise.all([
    fetchAllRows(() =>
      client
        .from("catalog_search_documents")
        .select("item_id, title, search_text, city, country_code, filter_data")
        .order("item_id"),
    ),
    // Rol bilgisi `catalog_search_documents`'ta YOKTUR; ayrıca okunup birleştirilir.
    // İki küçük tablo (647 + 78 satır) — canlı sunucu 1 GB RAM altında olduğu için
    // satır-başına fonksiyon çalıştıran bir JOIN yerine istemcide eşleştiriliyor.
    fetchAllRows(() => client.from("catalog_items").select("id, platform_role_key").order("id")),
    fetchAllRows(() =>
      client.from("roles").select("key, label, is_directory_visible").order("key"),
    ),
  ]);

  const roleByKey = new Map(roles.map((role) => [role.key, role]));
  const roleKeyByItemId = new Map(items.map((item) => [item.id, item.platform_role_key]));

  return rows
    .filter((row) => {
      if (isPlaceholderTitle(row.title)) return false;

      const filters = row.filter_data ?? {};
      if (filters.status !== "published") return false;
      if (filters.visibility !== "public" && filters.visibility !== "unlisted") return false;

      // ⚠️ YÖNETİCİ/TEST HESABI ELEMESİ — dizinin B20 koşulunun karşılığı.
      // 21 Eylül'de ölçüldü: yalnız status+visibility ile filtrelendiğinde korpusa
      // `is_directory_visible=false` olan **5 kayıt** sızıyordu (2 Süper Admin +
      // 3 Experimental test hesabı). Dizin bunları gizlerken bot servis ediyordu.
      // Rolü çözülemeyen kayıt da ELENİR: görünürlüğü kanıtlanamayan kaydı
      // göstermektense göstermemek doğrudur.
      const role = roleByKey.get(roleKeyByItemId.get(row.item_id));
      return role?.is_directory_visible === true;
    })
    .map((row) => {
      const role = roleByKey.get(roleKeyByItemId.get(row.item_id));
      // Rol etiketi metne EKLENİR. `catalog_search_documents.search_text` onu
      // içermez; 21 Eylül ölçümünde "şehir elçisi kim?" sorgusu korpusta o ifadeyi
      // taşıyan TEK BİR kayıt bulamadı (en iyi eşleşme 0.391 ile alakasız bir
      // kişiydi). Rol etiketi kullanıcıların aradığı asıl kelimedir.
      const location = [row.city, row.country_code].filter(Boolean).join(", ");
      const text = collapseWhitespace(
        [
          row.title,
          role?.label ? `Rol: ${role.label}` : "",
          location ? `Konum: ${location}` : "",
          row.search_text,
        ]
          .filter(Boolean)
          .join("\n\n"),
      );

      return {
        externalId: row.item_id,
        title: row.title,
        url: `/directory/${row.item_id}`,
        text,
      };
    })
    .filter((document) => document.text.length > 0);
}

const ADMIN_MENU_CATALOG_PATH = "docs/agent/admin-menu.json";

/**
 * Yönetici menüsü kataloğundan ÖĞE BAŞINA BİR belge üretir (tek blob DEĞİL):
 * semantik aramanın "üyeler menüde nerede" gibi bir soruda tek kayda
 * kilitlenmesi gerekir; 88 öğelik dev tek belge her soruya bulanık eşleşirdi.
 *
 * Saf fonksiyon (fs yok) — test dosyadan bağımsız kurabilirdi. Metin,
 * kullanıcının yazacağı kelimeleri taşır: etiket, "menüde N. sıra", grup adı,
 * sayfa yolu, açıklama, diğer adlar. Numara UYDURULMAZ: katalog
 * `npm run ingest:admin-menu` ile koddan üretilir (N03 bayatlama kapanı).
 *
 * @param {{ items?: unknown[] }} catalog
 * @returns {Array<{ externalId: string, title: string, url: string | null, text: string }>}
 */
export function buildAdminMenuDocuments(catalog) {
  const items = Array.isArray(catalog?.items) ? catalog.items : [];
  const byId = new Map(items.map((item) => [item?.id, item]));

  return items.map((item) => buildAdminMenuDocument(item, items, byId)).filter(Boolean);
}

function buildAdminMenuDocument(item, items, byId) {
  if (!item?.id || !item.label || !item.number) return null;
  const parent = item.parentId ? byId.get(item.parentId) ?? null : null;
  const children = items.filter((entry) => entry?.parentId === item.id);

  const paragraphs = [
    `"${item.label}" sayfası yönetici sol menüsünde ${item.number}. sırada,` +
      ` "${item.groupLabel}" grubunda yer alır.`,
  ];
  if (parent) paragraphs.push(`Üst menü öğesi: ${parent.number}. ${parent.label}.`);
  if (children.length > 0) {
    paragraphs.push(
      `Bu öğe bir alt menü açar: ${children.map((child) => `${child.number}. ${child.label}`).join(" · ")}.`,
    );
  }
  if (item.to) paragraphs.push(`Sayfa yolu: ${item.to}`);
  if (item.href) paragraphs.push(`Dış bağlantı (siteden ayrılır): ${item.href}`);
  if (item.description) paragraphs.push(`Açıklama: ${item.description}`);
  const aliases = (item.aliases ?? []).filter((alias) => alias && alias !== item.label);
  if (aliases.length > 0) paragraphs.push(`Diğer adlar: ${aliases.join(", ")}`);
  if (item.isInactive) paragraphs.push("Durum: pasif (taslak) — menüde görünür ama henüz kullanımda değil.");

  return {
    externalId: item.id,
    title: item.label,
    // N06 ile birlikte "Kaynaklar" bloğu tıklanabilir link versin diye:
    // iç sayfa `to`, dış bağlantı `href`.
    url: item.to ?? item.href ?? null,
    text: paragraphs.join("\n\n"),
  };
}

/** Üretilen kataloğu diskten okur — `ingest:admin-menu` güncel tutar. */
async function loadAdminMenuDocuments() {
  const raw = await readFile(ADMIN_MENU_CATALOG_PATH, "utf8");
  return buildAdminMenuDocuments(JSON.parse(raw));
}

/** Blog yazıları — yayımlanmış olanlar. */
async function loadBlogDocuments(client) {
  const rows = await fetchAllRows(() =>
    client
      .from("blog_posts")
      .select("slug, title, excerpt, content_markdown, country_label, category_label, published")
      .eq("published", true)
      .order("slug"),
  );

  return rows
    .map((row) => {
      const header = [row.country_label, row.category_label].filter(Boolean).join(" · ");
      const body = markdownToPlainText(row.content_markdown ?? "");
      const text = collapseWhitespace(
        [row.title, header, row.excerpt, body].filter(Boolean).join("\n\n"),
      );

      return {
        externalId: row.slug,
        title: row.title,
        url: `/blog/${row.slug}`,
        text,
      };
    })
    .filter((document) => document.text.length > 0);
}

/**
 * Kayıt defteri.
 *
 * `audience` neden böyle:
 * - `catalog` → **member**: dizin girişe kapalı (`search_directory_catalog` anonim
 *   çağrıda `42501` fırlatır). Botun dizinden daha cömert olmaması gerekir.
 * - `blog` → **public**: blog zaten herkese açık bir sayfa.
 * MVP'de bot yalnız üyeye açık olduğu için ikisi de servis edilir; ayrım ileride
 * bot ziyaretçiye açılırsa ya da iç belgeler eklenirse (K1) anlam kazanır.
 */
export const KNOWLEDGE_SOURCES = [
  {
    key: "catalog",
    label: "Katalog",
    audience: "member",
    load: loadCatalogDocuments,
  },
  {
    key: "blog",
    label: "Blog",
    audience: "public",
    load: loadBlogDocuments,
  },
  {
    key: "docs-member",
    label: "Üye rehberleri",
    audience: "member",
    load: () => loadDocumentationDocuments("member"),
  },
  {
    key: "docs-admin",
    label: "Yönetici dokümanları",
    audience: "admin",
    load: () => loadDocumentationDocuments("admin"),
  },
  {
    // `admin-menu` → **admin**: menü sıra numaraları yalnız yöneticiye anlamlı;
    // üye hesabına servis edilirse bot olmayan bir sayfayı tarif eder (N07 kabulü:
    // üye aynı soruyu sorunca menü kaydı GELMEMELİ).
    key: "admin-menu",
    label: "Yönetici menüsü",
    audience: "admin",
    load: () => loadAdminMenuDocuments(),
  },
];

export function findSource(key) {
  return KNOWLEDGE_SOURCES.find((source) => source.key === key) ?? null;
}

export function sourceKeys() {
  return KNOWLEDGE_SOURCES.map((source) => source.key);
}
