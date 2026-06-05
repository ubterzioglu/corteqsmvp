import { readFile } from "node:fs/promises";

export function slugify(value) {
  return String(value ?? "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 96);
}

export function normalizeHeader(value) {
  return slugify(value).replace(/-/g, "_");
}

export function parseDelimitedLine(line, delimiter = ";") {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
}

export function parseCsv(content, delimiter = ";") {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) return [];

  const headers = parseDelimitedLine(lines[0], delimiter);
  const normalizedHeaders = headers.map(normalizeHeader);

  return lines.slice(1).map((line, index) => {
    const cells = parseDelimitedLine(line, delimiter);
    const values = {};
    headers.forEach((header, cellIndex) => {
      values[header] = cells[cellIndex] ?? "";
      values[normalizedHeaders[cellIndex]] = cells[cellIndex] ?? "";
    });

    return {
      rowNumber: index + 2,
      values,
    };
  });
}

export async function loadRoleMap(mapPath) {
  return JSON.parse(await readFile(mapPath, "utf8"));
}

export function resolveRoleConfig(roleMap, roleKey) {
  const config = roleMap.roles?.[roleKey];
  if (!config) {
    throw new Error(`CSV import role map bulunamadı: ${roleKey}`);
  }

  return {
    ...config,
    roleKey,
    titleColumns: config.titleColumns ?? null,
    defaultLanguages: config.defaultLanguages ?? ["tr"],
  };
}

function readFirst(row, candidates = []) {
  for (const candidate of candidates) {
    const normalized = normalizeHeader(candidate);
    const value = row.values[candidate] ?? row.values[normalized];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function splitList(value) {
  return String(value ?? "")
    .split(/[,|]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function normalizeUrl(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.includes(".")) return `https://${trimmed}`;
  return trimmed;
}

export function buildImportRecord(row, roleConfig, roleMap, options = {}) {
  const common = roleMap.commonColumns ?? {};
  const titleFromConfiguredColumns = roleConfig.titleColumns
    ? roleConfig.titleColumns.map((column) => readFirst(row, [column])).filter(Boolean).join(" ")
    : "";
  const title = titleFromConfiguredColumns || readFirst(row, common.title);

  if (!title) {
    throw new Error(`Satır ${row.rowNumber}: başlık/isim bulunamadı.`);
  }

  const phone = readFirst(row, common.phone);
  const email = readFirst(row, common.email);
  const website = normalizeUrl(readFirst(row, common.website));
  const city = options.defaults?.city ?? readFirst(row, common.city);
  const country = options.defaults?.country ?? readFirst(row, common.country);
  const region = options.defaults?.region ?? "";
  const address = readFirst(row, common.address);
  const descriptionFromCsv = readFirst(row, common.description);
  const serviceColumns = roleConfig.serviceColumns ?? common.services ?? [];
  const services = splitList(readFirst(row, serviceColumns));
  const specialtySummary = services.join(", ");
  const sourceKey = website || email || phone || title;
  const sourceLabel = options.sourceLabel ?? `${roleConfig.roleKey} CSV`;

  const description =
    descriptionFromCsv ||
    [title, city ? `${city} lokasyonunda` : null, roleConfig.label, specialtySummary ? `(${specialtySummary})` : null]
      .filter(Boolean)
      .join(" ");

  return {
    rowNumber: row.rowNumber,
    roleKey: roleConfig.roleKey,
    roleLabel: roleConfig.label,
    itemType: roleConfig.itemType,
    categorySlug: roleConfig.categorySlug,
    categoryName: roleConfig.categoryName,
    title,
    headline: specialtySummary || roleConfig.label,
    shortDescription: description,
    longDescription: `${description} Kaynak CSV importu ile sisteme eklenmiştir.`,
    slug: slugify([city, roleConfig.label, title].filter(Boolean).join(" ")),
    externalId: slugify(sourceKey),
    sourceUrl: website || null,
    platformRoleKey: roleConfig.roleKey,
    contacts: [
      phone ? { contact_type: "phone", contact_value: phone, label: "Telefon", is_primary: true } : null,
      email ? { contact_type: "email", contact_value: email, label: "E-posta", is_primary: !phone } : null,
      website ? { contact_type: website.includes("doctolib.") ? "appointment_url" : "website", contact_value: website, label: "Web Sitesi", is_primary: false } : null,
    ].filter(Boolean),
    location: {
      country_code: country,
      region,
      city,
      address_line: address || null,
    },
    languages: roleConfig.defaultLanguages,
    services,
    tags: [roleConfig.label, city, country].filter(Boolean),
    attributes: {
      import_source: options.sourceType,
      source_label: sourceLabel,
      platform_role_label: roleConfig.label,
      specialty_summary: specialtySummary || roleConfig.label,
      csv_row_number: row.rowNumber,
    },
    rawSnapshot: row.values,
  };
}

export function buildImportRecords(rows, roleConfig, roleMap, options = {}) {
  return rows.map((row) => buildImportRecord(row, roleConfig, roleMap, options));
}

export async function ensureCatalogCategory(supabase, record) {
  const { data: existing, error: existingError } = await supabase
    .from("catalog_categories")
    .select("id, module")
    .eq("slug", record.categorySlug)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing?.id) return existing.id;

  const { data, error } = await supabase
    .from("catalog_categories")
    .insert({
      module: record.itemType,
      slug: record.categorySlug,
      name: record.categoryName,
      description: `${record.categoryName} category for ${record.itemType}`,
      is_active: true,
      sort_order: 1000,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export async function upsertImportRecord(supabase, record, categoryId, sourceType) {
  const { data: itemId, error: itemError } = await supabase.rpc("catalog_upsert_source_item", {
    p_source_type: sourceType,
    p_external_id: record.externalId,
    p_item_type: record.itemType,
    p_slug: record.slug,
    p_title: record.title,
    p_headline: record.headline,
    p_short_description: record.shortDescription,
    p_long_description: record.longDescription,
    p_status: "published",
    p_visibility: "public",
    p_verification_status: "unverified",
    p_created_by_user_id: null,
    p_published_at: new Date().toISOString(),
    p_attributes: record.attributes,
    p_source_url: record.sourceUrl,
    p_raw_snapshot: record.rawSnapshot,
    p_platform_role_key: record.platformRoleKey,
  });

  if (itemError) throw itemError;
  const itemIdValue = typeof itemId === "string" ? itemId : String(itemId);

  const { error: resetError } = await supabase.rpc("catalog_reset_item_projection", {
    p_item_id: itemIdValue,
  });
  if (resetError) throw resetError;

  const { error: categoryError } = await supabase.from("catalog_item_categories").upsert(
    [{ item_id: itemIdValue, category_id: categoryId, is_primary: true }],
    { onConflict: "item_id,category_id" },
  );
  if (categoryError) throw categoryError;

  if (record.contacts.length > 0) {
    const { error } = await supabase.from("catalog_item_contacts").insert(
      record.contacts.map((contact, index) => ({
        item_id: itemIdValue,
        ...contact,
        is_public: true,
        sort_order: index * 10,
      })),
    );
    if (error) throw error;
  }

  const { error: locationError } = await supabase.from("catalog_item_locations").insert([
    {
      item_id: itemIdValue,
      ...record.location,
      postal_code: null,
      latitude: null,
      longitude: null,
      is_primary: true,
    },
  ]);
  if (locationError) throw locationError;

  if (record.languages.length > 0) {
    const { error } = await supabase.from("catalog_item_languages").upsert(
      record.languages.map((language, index) => ({
        item_id: itemIdValue,
        language_code: language,
        proficiency: index === 0 ? "native_or_fluent" : "professional",
        is_primary: index === 0,
      })),
      { onConflict: "item_id,language_code" },
    );
    if (error) throw error;
  }

  if (record.services.length > 0) {
    const { error } = await supabase.from("catalog_item_services").upsert(
      record.services.map((service, index) => ({
        item_id: itemIdValue,
        service_slug: slugify(service),
        service_name: service,
        description: null,
        is_public: true,
        sort_order: index * 10,
      })),
      { onConflict: "item_id,service_slug" },
    );
    if (error) throw error;
  }

  const tagRows = record.tags.map((tag) => ({
    item_id: itemIdValue,
    tag_slug: slugify(tag),
    tag_label: tag,
  }));
  if (tagRows.length > 0) {
    const { error } = await supabase.from("catalog_item_tags").upsert(tagRows, {
      onConflict: "item_id,tag_slug",
    });
    if (error) throw error;
  }

  await upsertExtensionRecord(supabase, itemIdValue, record);
  return itemIdValue;
}

async function upsertExtensionRecord(supabase, itemId, record) {
  if (record.itemType === "advisor") {
    const { error } = await supabase.from("advisor_details").upsert({
      item_id: itemId,
      consultation_modes: ["in_person"],
      languages: record.languages,
      supports_online_consultation: false,
      appointment_url: record.contacts.find((contact) => contact.contact_type === "appointment_url")?.contact_value ?? null,
    });
    if (error) throw error;
  }

  if (record.itemType === "business") {
    const { error } = await supabase.from("business_details").upsert({
      item_id: itemId,
      supports_online_booking: false,
      appointment_url: record.contacts.find((contact) => contact.contact_type === "appointment_url")?.contact_value ?? null,
    });
    if (error) throw error;
  }

  if (record.itemType === "organization") {
    const { error } = await supabase.from("organization_details").upsert({
      item_id: itemId,
      organization_kind: record.roleLabel,
      metadata: record.attributes,
    });
    if (error) throw error;
  }
}
