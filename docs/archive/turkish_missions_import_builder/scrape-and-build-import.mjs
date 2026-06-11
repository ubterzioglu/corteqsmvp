import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const ROOT_URL = "https://www.mfa.gov.tr/yurtdisi-teskilati.tr.mfa";
const APPOINTMENT_URL = "https://www.konsolosluk.gov.tr/";
const MISSIONS_SCRIPT_URL = "https://www.mfa.gov.tr/site_media/assets/content/temsilcilikler/temsilcilikler.tr.js";
const OUT_DIR = path.resolve("output");
const envInt = (name, fallback) => {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : fallback;
};
const MAX_DIRECT_SITES = envInt("MAX_DIRECT_SITES", 800);
const MAX_AJAX_PAGES = envInt("MAX_AJAX_PAGES", 800);
const TIMEOUT_MS = envInt("TIMEOUT_MS", 35000);
const EXTRA_WAIT_MS = envInt("EXTRA_WAIT_MS", 4000);
const ALLOWED_MISSION_TYPES = new Set([
  "embassy",
  "consulate_general",
  "consulate",
  "consular_office",
]);

const missions = new Map();
const units = new Map();
const relations = new Map();
const ajaxUrls = new Set();
const directContactUrls = new Set();
const visited = new Set();
const changedMissionSourceUrls = new Set();
const errors = [];
const discoveredSourceUrls = new Set();

const nowIso = () => new Date().toISOString();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const compact = (value) => (value ?? "").replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();
const oneLine = (value) => compact(value).replace(/\n+/g, " ").trim();
const escapeSql = (value) => value === null || value === undefined ? "NULL" : `'${String(value).replaceAll("'", "''")}'`;
const jsonSql = (value) => `${escapeSql(JSON.stringify(value ?? null))}::jsonb`;
const sha1 = (value) => crypto.createHash("sha1").update(String(value)).digest("hex");
const unique = (arr) => [...new Set((arr ?? []).map(oneLine).filter(Boolean))];
const roundScore = (value) => Math.max(0, Math.min(100, Math.round(value)));
const missionTypeFromDirectoryLabel = (value) => {
  const normalized = oneLine(value).toLocaleLowerCase("tr-TR");
  if (normalized.includes("büyükelçilik")) return "embassy";
  if (normalized.includes("başkonsolosluk")) return "consulate_general";
  if (normalized.includes("konsolosluk bürosu")) return "consular_office";
  if (normalized.includes("konsolosluk ajanlığı")) return "consular_office";
  if (normalized.includes("konsolosluk")) return "consulate";
  if (normalized.includes("daimi temsilcilik")) return "permanent_mission";
  return "other_mission";
};

const COUNTRY_CODE_ALIASES = new Map([
  ["abd", "US"], ["amerika birlesik devletleri", "US"], ["amerika birlesik devleti", "US"], ["united states", "US"], ["united states of america", "US"], ["u s a", "US"], ["usa", "US"],
  ["almanya", "DE"], ["federal almanya cumhuriyeti", "DE"], ["germany", "DE"], ["deutschland", "DE"],
  ["fransa", "FR"], ["france", "FR"],
  ["ingiltere", "GB"], ["birlesik krallik", "GB"], ["united kingdom", "GB"], ["great britain", "GB"], ["uk", "GB"],
  ["hollanda", "NL"], ["netherlands", "NL"], ["nederland", "NL"],
  ["belcika", "BE"], ["belgium", "BE"], ["belgique", "BE"],
  ["isvicre", "CH"], ["switzerland", "CH"], ["schweiz", "CH"], ["suisse", "CH"],
  ["avusturya", "AT"], ["austria", "AT"], ["osterreich", "AT"],
  ["italya", "IT"], ["italy", "IT"], ["italia", "IT"],
  ["ispanya", "ES"], ["spain", "ES"], ["espana", "ES"],
  ["portekiz", "PT"], ["portugal", "PT"],
  ["isvec", "SE"], ["sweden", "SE"], ["sverige", "SE"],
  ["norvec", "NO"], ["norway", "NO"], ["norge", "NO"],
  ["danimarka", "DK"], ["denmark", "DK"], ["danmark", "DK"],
  ["finlandiya", "FI"], ["finland", "FI"], ["suomi", "FI"],
  ["polonya", "PL"], ["poland", "PL"], ["polska", "PL"],
  ["cekya", "CZ"], ["cek cumhuriyeti", "CZ"], ["czech republic", "CZ"], ["czechia", "CZ"],
  ["macaristan", "HU"], ["hungary", "HU"], ["magyarorszag", "HU"],
  ["romanya", "RO"], ["romania", "RO"],
  ["bulgaristan", "BG"], ["bulgaria", "BG"],
  ["yunanistan", "GR"], ["greece", "GR"], ["hellas", "GR"],
  ["rusya", "RU"], ["rusya federasyonu", "RU"], ["russia", "RU"], ["russian federation", "RU"],
  ["ukrayna", "UA"], ["ukraine", "UA"],
  ["azerbaycan", "AZ"], ["azerbaijan", "AZ"],
  ["gurcistan", "GE"], ["georgia", "GE"], ["sakartvelo", "GE"],
  ["kazakistan", "KZ"], ["kazakhstan", "KZ"],
  ["kirgizistan", "KG"], ["kyrgyzstan", "KG"],
  ["ozbekistan", "UZ"], ["uzbekistan", "UZ"],
  ["turkmenistan", "TM"], ["turkmenistan", "TM"],
  ["tacikistan", "TJ"], ["tajikistan", "TJ"],
  ["iran", "IR"], ["irak", "IQ"], ["iraq", "IQ"], ["suriye", "SY"], ["syria", "SY"],
  ["israil", "IL"], ["israel", "IL"], ["filistin", "PS"], ["palestine", "PS"], ["urdun", "JO"], ["jordan", "JO"], ["lubnan", "LB"], ["lebanon", "LB"],
  ["suudi arabistan", "SA"], ["saudi arabia", "SA"], ["birlesik arap emirlikleri", "AE"], ["united arab emirates", "AE"], ["katar", "QA"], ["qatar", "QA"], ["kuveyt", "KW"], ["kuwait", "KW"], ["bahreyn", "BH"], ["bahrain", "BH"], ["umman", "OM"], ["oman", "OM"], ["yemen", "YE"],
  ["misir", "EG"], ["egypt", "EG"], ["cezayir", "DZ"], ["algeria", "DZ"], ["tunus", "TN"], ["tunisia", "TN"], ["libya", "LY"], ["fas", "MA"], ["morocco", "MA"], ["sudan", "SD"], ["somali", "SO"], ["nijerya", "NG"], ["nigeria", "NG"], ["guney afrika", "ZA"], ["south africa", "ZA"], ["senegal", "SN"], ["kenya", "KE"], ["etiyopya", "ET"], ["ghana", "GH"], ["gana", "GH"],
  ["cin", "CN"], ["halk cumhuriyeti cin", "CN"], ["china", "CN"], ["japonya", "JP"], ["japan", "JP"], ["guney kore", "KR"], ["south korea", "KR"], ["kore cumhuriyeti", "KR"], ["hindistan", "IN"], ["india", "IN"], ["pakistan", "PK"], ["banglades", "BD"], ["bangladesh", "BD"], ["endonezya", "ID"], ["indonesia", "ID"], ["malezya", "MY"], ["malaysia", "MY"], ["singapur", "SG"], ["singapore", "SG"], ["tayland", "TH"], ["thailand", "TH"], ["vietnam", "VN"], ["filipinler", "PH"], ["philippines", "PH"],
  ["avustralya", "AU"], ["australia", "AU"], ["yeni zelanda", "NZ"], ["new zealand", "NZ"],
  ["kanada", "CA"], ["canada", "CA"], ["meksika", "MX"], ["mexico", "MX"], ["brezilya", "BR"], ["brazil", "BR"], ["arjantin", "AR"], ["argentina", "AR"], ["kolombiya", "CO"], ["colombia", "CO"], ["venezuela", "VE"], ["sili", "CL"], ["chile", "CL"], ["peru", "PE"], ["kuba", "CU"], ["cuba", "CU"],
  ["irlanda", "IE"], ["ireland", "IE"], ["sirbistan", "RS"], ["serbia", "RS"], ["bosna hersek", "BA"], ["bosnia and herzegovina", "BA"], ["hirvatistan", "HR"], ["croatia", "HR"], ["slovenya", "SI"], ["slovenia", "SI"], ["slovakya", "SK"], ["slovakia", "SK"], ["litvanya", "LT"], ["lithuania", "LT"], ["letonya", "LV"], ["latvia", "LV"], ["estonya", "EE"], ["estonia", "EE"]
]);

function slugify(value) {
  return oneLine(value)
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("ı", "i")
    .replaceAll("ş", "s")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180) || `mission-${sha1(value).slice(0, 12)}`;
}

function normalizeSearchText(value) {
  return oneLine(value)
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("ı", "i")
    .replaceAll("ş", "s")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(value, baseUrl = ROOT_URL) {
  try {
    const u = new URL(value, baseUrl);
    u.hash = "";
    if (u.hostname === "www.mfa.gov.tr" || u.hostname.endsWith(".mfa.gov.tr")) {
      u.protocol = "https:";
    }
    return u.href.replace(/\/$/, "");
  } catch {
    return null;
  }
}

function normalizeContactUrl(value) {
  const u = normalizeUrl(value);
  if (!u) return null;
  try {
    const parsed = new URL(u);
    if (!parsed.hostname.endsWith(".mfa.gov.tr")) return null;
    if (parsed.hostname === "www.mfa.gov.tr") return null;
    return `${parsed.protocol}//${parsed.hostname}/Mission/Contact`;
  } catch {
    return null;
  }
}

function isOfficialMfaUrl(value) {
  try {
    const u = new URL(value);
    return u.hostname === "www.mfa.gov.tr" || u.hostname.endsWith(".mfa.gov.tr");
  } catch {
    return false;
  }
}

function looksLikeMissionName(text) {
  const s = oneLine(text).toLocaleLowerCase("tr-TR");
  return /(büyükelçili|başkonsoloslu|konsoloslu|fahri|daimi temsilcili|embassy|consulate|generalkonsulat|botschaft|ambassade|consulado|consulat|permanent mission)/i.test(s);
}

function missionType(name) {
  const s = oneLine(name).toLocaleLowerCase("tr-TR");
  if (/fahri.*başkonsolos|honorary consulate general|honorary consul general/i.test(s)) return "honorary_consulate_general";
  if (/fahri.*konsolos|honorary consulate|honorarkonsulat|consulado honorário|consulat honoraire/i.test(s)) return "honorary_consulate";
  if (/daimi temsilcilik|permanent mission|ständige vertretung|représentation permanente/i.test(s)) return "permanent_mission";
  if (/başkonsolos|consulate general|generalkonsulat|consulado general|consulat général/i.test(s)) return "consulate_general";
  if (/konsolosluk ofisi|consular office/i.test(s)) return "consular_office";
  if (/konsolos|consulate|konsulat|consulado|consulat/i.test(s)) return "consulate";
  if (/büyükelçi|embassy|botschaft|ambassade|embajada/i.test(s)) return "embassy";
  return "other_mission";
}

function shouldKeepMissionType(value) {
  return ALLOWED_MISSION_TYPES.has(value);
}

function unitType(name) {
  const s = oneLine(name).toLocaleLowerCase("tr-TR");
  if (/fahri|honorary|honorar|honorário|honoraire/i.test(s)) return "honorary_consulate";
  if (/ticaret|commercial|trade|handel/i.test(s)) return "trade";
  if (/eğitim|education|erziehung|enseignement/i.test(s)) return "education";
  if (/çalışma|labour|labor|arbeit|social security|soziale/i.test(s)) return "labour_social_security";
  if (/din|religious|religion|diyanet/i.test(s)) return "religious_affairs";
  if (/asker|military|armed forces|silahlı|militaire/i.test(s)) return "military";
  if (/basın|press|iletişim|information|communication/i.test(s)) return "press_communication";
  if (/kültür|culture|tourism|tanıtma|tourismus/i.test(s)) return "culture_tourism";
  if (/aile|family/i.test(s)) return "family_social_policy";
  if (/hazine|maliye|finance|treasury|economic/i.test(s)) return "finance_economic";
  if (/içişleri|interior/i.test(s)) return "interior";
  return "attached_unit";
}

function extractUrls(text, baseUrl = ROOT_URL) {
  const found = new Set();
  const patterns = [
    /https?:\/\/[^\s"'<>\\)]+/gi,
    /(?:https?:\/\/)?[a-z0-9.-]+\.mfa\.gov\.tr(?:\/[^\s"'<>\\)]*)?/gi,
    /\/ajax\.[a-z.]+\?[^\s"'<>\\)]+/gi
  ];
  for (const pattern of patterns) {
    for (const raw of String(text ?? "").match(pattern) ?? []) {
      const cleaned = raw.replace(/[),.;]+$/g, "");
      const url = normalizeUrl(cleaned.startsWith("/") ? cleaned : cleaned, baseUrl);
      if (url) found.add(url);
    }
  }
  return [...found];
}

function extractEmails(text) {
  return unique(String(text ?? "").match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? []);
}

function extractPhones(text) {
  const matches = String(text ?? "").match(/(?:\+|00)?\d[\d()\-./ ]{5,}\d/g) ?? [];
  return unique(matches.map((v) => v.replace(/\s+/g, " ").trim()).filter((v) => /\d{6}/.test(v.replace(/\D/g, ""))));
}

function extractWebsites(text) {
  return unique((String(text ?? "").match(/https?:\/\/[^\s"'<>]+/gi) ?? []).map((x) => x.replace(/[),.;]+$/g, "")));
}

function findField(text, labels, stopLabels = []) {
  const src = compact(text);
  const labelAlt = labels.map(escapeRegex).join("|");
  const stops = [
    ...stopLabels,
    "Address", "Adres", "Posta adresi", "Postanschrift", "Adresse", "Morada",
    "Telephone", "Telefon", "T:", "Tel", "E-mail", "E-posta", "E-Mail",
    "Fax", "Faks", "F:", "Web", "W:", "Website", "Jurisdiction", "Görev bölgesi",
    "Nöbetçi", "Emergency", "Sentinel", "Acil Durum", "Working Hours", "ÇALIŞMA SAATLERİ",
    "Bağlı Birimler", "Sub Divisions", "Referate", "Connected Missions"
  ].map(escapeRegex).join("|");
  const re = new RegExp(`(?:^|\\n)\\s*(?:${labelAlt})\\s*[:\\-]?\\s*\\n?([\\s\\S]*?)(?=\\n\\s*(?:${stops})\\s*[:\\-]?\\s*(?:\\n|$)|$)`, "i");
  const m = src.match(re);
  return m ? oneLine(m[1]) : null;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function guessCity(name, address) {
  const src = `${name ?? ""} ${address ?? ""}`;
  const nameMatch = oneLine(name).match(/^(.+?)\s+(?:Büyükelçiliği|Başkonsolosluğu|Konsolosluğu|Fahri|Embassy|Turkish|Consulate|Generalkonsulat|Botschaft|Ambassade|Consulado)/i);
  if (nameMatch && nameMatch[1].length < 45) return oneLine(nameMatch[1]);
  const parts = oneLine(address).split(/[,/]/).map((x) => x.trim()).filter(Boolean);
  return parts.length ? parts[parts.length - 1].slice(0, 100) : null;
}

function guessCountry(name, bodyText, address) {
  const sources = [bodyText, address, name].map(oneLine).filter(Boolean);
  const countryLine = compact(bodyText).split("\n").map(oneLine).find((line) =>
    line.length > 1 && line.length < 80 && !looksLikeMissionName(line) &&
    !/(address|adres|telephone|telefon|fax|email|web|connected|bağlı|working|çalışma)/i.test(line)
  );
  return countryLine || sources.at(-1)?.split(/[,/]/).at(-1)?.trim() || null;
}

function inferCountryCode(country) {
  const normalized = normalizeSearchText(country);
  if (!normalized) return null;
  if (/^[a-z]{2}$/i.test(normalized)) return normalized.toUpperCase();
  return COUNTRY_CODE_ALIASES.get(normalized) || null;
}

function parseStructuredWorkingHours(text) {
  const src = oneLine(text);
  if (!src) return {};
  const normalized = src
    .replace(/–|—/g, "-")
    .replace(/\bto\b/gi, "-")
    .replace(/\bve\b/gi, ",");
  const structured = {};
  const dayGroups = [
    { key: "monday_friday", pattern: /(?:pazartesi\s*-\s*cuma|monday\s*-\s*friday|mon(?:day)?\s*-\s*fri(?:day)?)/i },
    { key: "monday_thursday", pattern: /(?:pazartesi\s*-\s*persembe|monday\s*-\s*thursday|mon(?:day)?\s*-\s*thu(?:rsday)?)/i },
    { key: "friday", pattern: /(?:cuma|friday|fri(?:day)?)/i },
    { key: "weekdays", pattern: /(?:hafta ici|weekdays?)/i },
    { key: "saturday", pattern: /(?:cumartesi|saturday|sat(?:urday)?)/i },
    { key: "sunday", pattern: /(?:pazar|sunday|sun(?:day)?)/i }
  ];

  for (const group of dayGroups) {
    const match = normalized.match(new RegExp(`${group.pattern.source}[^\\d]{0,20}(\\d{1,2}[.:]\\d{2})\\s*-\\s*(\\d{1,2}[.:]\\d{2})`, "i"));
    if (match) {
      structured[group.key] = {
        opens: match[1].replace(".", ":"),
        closes: match[2].replace(".", ":")
      };
    }
  }

  const lunchMatch = normalized.match(/(?:ogle arasi|öğle arası|lunch break|pause dejeuner)[^\d]{0,20}(\d{1,2}[.:]\d{2})\s*-\s*(\d{1,2}[.:]\d{2})/i);
  if (lunchMatch) {
    structured.lunch_break = {
      starts: lunchMatch[1].replace(".", ":"),
      ends: lunchMatch[2].replace(".", ":")
    };
  }

  if (/(kapali|closed|geschlossen|ferme)/i.test(normalized)) {
    structured.contains_closed_note = true;
  }

  return structured;
}

function computeCompletenessScore(record) {
  let score = 0;
  if (record.address) score += 20;
  if (record.phones?.length) score += 18;
  if (record.emails?.length) score += 18;
  if (record.website_url) score += 10;
  if (record.jurisdiction) score += 10;
  if (record.emergency_phones?.length) score += 8;
  if (record.working_hours) score += 8;
  if (Object.keys(record.office_hours_structured ?? {}).length) score += 4;
  if (record.country) score += 2;
  if (record.city) score += 2;
  return roundScore(score);
}

function computeParserConfidence(record) {
  let score = 35;
  if (record.address) score += 12;
  if (record.phones?.length) score += 12;
  if (record.emails?.length) score += 12;
  if (record.website_url) score += 8;
  if (record.jurisdiction) score += 6;
  if (record.working_hours) score += 5;
  if (Object.keys(record.office_hours_structured ?? {}).length) score += 5;
  if (record.verification_status === "official_source_scraped") score += 5;
  if (record.verification_status === "official_source_limited_fields") score -= 20;
  if (record.status === "needs_review") score -= 15;
  return roundScore(score);
}

function computeSourceHash(record) {
  return sha1(JSON.stringify({
    mission_name: record.mission_name,
    country: record.country,
    city: record.city,
    address: record.address,
    phones: record.phones,
    emails: record.emails,
    faxes: record.faxes,
    emergency_phones: record.emergency_phones,
    website_url: record.website_url,
    jurisdiction: record.jurisdiction,
    working_hours: record.working_hours,
    office_hours_structured: record.office_hours_structured,
    consular_call_center: record.consular_call_center,
    verification_status: record.verification_status,
    raw_snapshot: record.raw_snapshot?.body_text ?? record.raw_snapshot
  }));
}

function finalizeMissionRecord(record) {
  const normalizedMissionName = normalizeSearchText(record.mission_name);
  const normalizedCity = normalizeSearchText(record.city);
  const officeHoursStructured = record.office_hours_structured ?? parseStructuredWorkingHours(record.working_hours);
  const normalizedRecord = {
    ...record,
    country_code: record.country_code ?? inferCountryCode(record.country),
    city_normalized: normalizedCity || null,
    mission_name_normalized: normalizedMissionName || null,
    office_hours_structured: officeHoursStructured,
    last_verified_at: record.last_verified_at ?? nowIso()
  };
  normalizedRecord.data_completeness_score = computeCompletenessScore(normalizedRecord);
  normalizedRecord.parser_confidence = computeParserConfidence(normalizedRecord);
  normalizedRecord.source_hash = computeSourceHash(normalizedRecord);
  normalizedRecord.contact_fields = {
    ...(normalizedRecord.contact_fields ?? {}),
    normalized_city: normalizedRecord.city_normalized,
    normalized_mission_name: normalizedRecord.mission_name_normalized,
    country_code_inferred: normalizedRecord.country_code,
    has_structured_working_hours: Object.keys(normalizedRecord.office_hours_structured ?? {}).length > 0
  };
  return normalizedRecord;
}

function parseMainFromText(text, sourceUrl, title = null) {
  const src = compact(text);
  const lines = src.split("\n").map(oneLine).filter(Boolean);
  const heading = title || lines.find(looksLikeMissionName) || "Turkish Overseas Mission";
  const address = findField(src, ["Posta adresi", "Postanschrift", "Address", "Adres", "Adresse", "Morada"]);
  const phoneText = findField(src, ["Telephone", "Telefon", "Tel", "T"]);
  const faxText = findField(src, ["Fax", "Faks", "F"]);
  const emailText = findField(src, ["E-mail", "E-posta", "E-Mail", "e-Mail", "Email"]);
  const emergencyText = findField(src, [
    "Nöbetçi / Acil Durum Telefonu", "Nöbetçi Telefonu", "Sentinel / Emergency Phone",
    "Emergency Phone", "Acil Durum Telefonu", "For Emergency"
  ]);
  const jurisdiction = findField(src, ["Jurisdiction", "Jurisdiction:", "Görev bölgesi", "Görev Bölgesi", "Zuständigskeitgebiet", "Zuständigkeitsgebiet"]);
  const webText = findField(src, ["Web", "Website", "W"]);
  const workingHours = extractWorkingHours(src);
  const callCenter = extractCallCenter(src);
  const officeHoursStructured = parseStructuredWorkingHours(workingHours);

  const websites = unique([
    ...(webText ? extractWebsites(webText) : []),
    ...extractWebsites(src).filter((u) => {
      try { return new URL(u).hostname.endsWith(".mfa.gov.tr"); } catch { return false; }
    })
  ]);

  const source = normalizeUrl(sourceUrl) || sourceUrl;
  const slugBase = `${heading}-${source}`;
  const record = {
    slug: slugify(slugBase),
    country: guessCountry(heading, src, address),
    city: guessCity(heading, address),
    mission_name: oneLine(heading),
    mission_type: missionType(heading),
    parent_mission_slug: null,
    address,
    phones: unique([...(phoneText ? extractPhones(phoneText) : []), ...extractPhones(phoneText ?? "")]),
    emails: unique([...(emailText ? extractEmails(emailText) : []), ...extractEmails(emailText ?? "")]),
    faxes: unique(faxText ? extractPhones(faxText) : []),
    emergency_phones: unique(emergencyText ? extractPhones(emergencyText) : []),
    website_url: websites.find((u) => u.includes(".mfa.gov.tr")) || websites[0] || null,
    appointment_url: APPOINTMENT_URL,
    jurisdiction,
    working_hours: workingHours,
    office_hours_structured: officeHoursStructured,
    consular_call_center: callCenter,
    status: "active",
    verification_status: "official_source_scraped",
    source_url: source,
    scraped_at: nowIso(),
    contact_fields: {
      websites,
      detected_emails: extractEmails(src),
      detected_phones: extractPhones(src).slice(0, 80)
    },
    raw_snapshot: {
      source_url: source,
      page_title: title,
      body_text: src.slice(0, 120000)
    }
  };
  if (!record.address && !record.emails.length && !record.phones.length) {
    record.status = "needs_review";
    record.verification_status = "official_source_limited_fields";
  }
  return finalizeMissionRecord(record);
}

function extractWorkingHours(text) {
  const m = compact(text).match(/(?:ÇALIŞMA SAATLERİ|WORKING HOURS|ÖFFNUNGSZEITEN|HEURES DE TRAVAIL|HORÁRIO DE FUNCIONAMENTO)[\s\S]{0,500}/i);
  return m ? oneLine(m[0]).slice(0, 600) : null;
}

function extractCallCenter(text) {
  const m = compact(text).match(/(?:KONSOLOSLUK ÇAĞRI MERKEZİ|CONSULAR CALL CENTER|KONSULAT ANRUFZENTRUM)[\s\S]{0,120}/i);
  return m ? oneLine(m[0]).slice(0, 180) : null;
}

function extractUnitBlocks(text) {
  const src = compact(text);
  const marker = src.search(/(?:Bağlı Birimler|Sub Divisions|Referate|Connected Missions)/i);
  if (marker < 0) return [];
  const tail = src.slice(marker);
  const stop = tail.search(/\n(?:×|Contacting the Representative|Acil Durumda Temsilciliğe|Write to us|Bize yazın|Schreiben Sie uns)\b/i);
  const content = stop > 0 ? tail.slice(0, stop) : tail.slice(0, 30000);
  const lines = content.split("\n").map(oneLine).filter(Boolean);
  const blocks = [];
  let current = null;

  const isField = (line) => /^(?:Address|Adres|Adresse|Morada|Telephone|Telefon|T:|Fax|Faks|F:|E-mail|E-posta|E:|Web|W:|Jurisdiction|Görev bölgesi)/i.test(line);
  const likelyHeading = (line) =>
    line.length < 180 &&
    !isField(line) &&
    !/^(?:Bağlı Birimler|Sub Divisions|Referate|Connected Missions)$/i.test(line) &&
    (/(müşavir|ataşe|attach|office|abteilung|honorary|fahri|consulat|konsolos|counsellor|counselor|referat|subdivision)/i.test(line));

  for (const line of lines.slice(1)) {
    if (likelyHeading(line)) {
      if (current) blocks.push(current);
      current = { title: line, lines: [] };
      continue;
    }
    if (current) current.lines.push(line);
  }
  if (current) blocks.push(current);
  return blocks.filter((b) => b.lines.length || looksLikeMissionName(b.title));
}

function unitFromBlock(block, mission, sourceUrl) {
  const body = compact(block.lines.join("\n"));
  const address = findField(body, ["Address", "Adres", "Adresse", "Morada"]);
  const phones = unique(extractPhones(findField(body, ["Telephone", "Telefon", "T"]) ?? body));
  const faxes = unique(extractPhones(findField(body, ["Fax", "Faks", "F"]) ?? ""));
  const emails = unique(extractEmails(body));
  const websites = unique(extractWebsites(body));
  const jurisdiction = findField(body, ["Jurisdiction", "Görev bölgesi"]);
  const title = oneLine(block.title);
  return {
    source_key: sha1(`${mission.slug}|${title}|${address ?? ""}|${sourceUrl}`),
    mission_slug: mission.slug,
    unit_name: title,
    unit_type: unitType(`${title} ${body}`),
    address,
    phones,
    emails,
    faxes,
    websites,
    jurisdiction,
    source_url: sourceUrl,
    scraped_at: nowIso(),
    raw_snapshot: { title, body_text: body }
  };
}

function honoraryMissionFromUnit(unit, parentMission) {
  const body = oneLine(unit.raw_snapshot?.body_text);
  if (unit.unit_type !== "honorary_consulate" && !/(fahri|honorary|honorar|honorário|honoraire)/i.test(`${unit.unit_name} ${body}`)) return null;
  const candidateName =
    body.match(/([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜ .-]{2,80}\s+FAHRİ\s+(?:BAŞ)?KONSOLOSLUĞU)/i)?.[1] ||
    body.match(/(Honorary Consulate(?: General)?(?: of Turkey)?(?: in [A-Za-zÀ-ÿ .-]+)?)/i)?.[1] ||
    unit.unit_name;
  const sourceUrl = `${parentMission.source_url}#honorary-${unit.source_key.slice(0, 12)}`;
  return {
    slug: slugify(`${candidateName}-${sourceUrl}`),
    country: parentMission.country,
    country_code: parentMission.country_code,
    city: guessCity(candidateName, unit.address),
    mission_name: oneLine(candidateName),
    mission_type: /başkonsolos|consulate general/i.test(candidateName) ? "honorary_consulate_general" : "honorary_consulate",
    parent_mission_slug: parentMission.slug,
    address: unit.address,
    phones: unit.phones,
    emails: unit.emails,
    faxes: unit.faxes,
    emergency_phones: [],
    website_url: unit.websites[0] || null,
    appointment_url: APPOINTMENT_URL,
    jurisdiction: unit.jurisdiction,
    working_hours: null,
    office_hours_structured: {},
    consular_call_center: null,
    status: "active",
    verification_status: "official_source_scraped_parent_contact_page",
    source_url: sourceUrl,
    scraped_at: nowIso(),
    contact_fields: {},
    raw_snapshot: {
      parent_source_url: parentMission.source_url,
      unit_snapshot: unit.raw_snapshot
    }
  };
}

function mergeMission(existing, incoming) {
  if (!existing) return finalizeMissionRecord(incoming);
  const prefer = (a, b) => {
    if (b === null || b === undefined || b === "") return a;
    if (a === null || a === undefined || a === "") return b;
    return String(b).length > String(a).length ? b : a;
  };
  const merged = {
    ...existing,
    ...incoming,
    country: prefer(existing.country, incoming.country),
    country_code: incoming.country_code || existing.country_code,
    city: prefer(existing.city, incoming.city),
    city_normalized: incoming.city_normalized || existing.city_normalized,
    mission_name: prefer(existing.mission_name, incoming.mission_name),
    mission_name_normalized: incoming.mission_name_normalized || existing.mission_name_normalized,
    mission_type: existing.mission_type !== "other_mission" ? existing.mission_type : incoming.mission_type,
    parent_mission_slug: incoming.parent_mission_slug || existing.parent_mission_slug,
    address: prefer(existing.address, incoming.address),
    phones: unique([...existing.phones, ...incoming.phones]),
    emails: unique([...existing.emails, ...incoming.emails]),
    faxes: unique([...existing.faxes, ...incoming.faxes]),
    emergency_phones: unique([...existing.emergency_phones, ...incoming.emergency_phones]),
    website_url: incoming.website_url || existing.website_url,
    appointment_url: APPOINTMENT_URL,
    jurisdiction: prefer(existing.jurisdiction, incoming.jurisdiction),
    working_hours: prefer(existing.working_hours, incoming.working_hours),
    office_hours_structured: Object.keys(incoming.office_hours_structured ?? {}).length
      ? incoming.office_hours_structured
      : (existing.office_hours_structured ?? {}),
    consular_call_center: prefer(existing.consular_call_center, incoming.consular_call_center),
    parser_confidence: Math.max(existing.parser_confidence ?? 0, incoming.parser_confidence ?? 0),
    data_completeness_score: Math.max(existing.data_completeness_score ?? 0, incoming.data_completeness_score ?? 0),
    status: incoming.status === "active" ? "active" : existing.status,
    verification_status: incoming.status === "active" ? incoming.verification_status : existing.verification_status,
    source_hash: incoming.source_hash || existing.source_hash,
    source_url: existing.source_url,
    scraped_at: nowIso(),
    last_verified_at: nowIso(),
    contact_fields: { ...(existing.contact_fields ?? {}), ...(incoming.contact_fields ?? {}) },
    raw_snapshot: {
      ...(existing.raw_snapshot ?? {}),
      supplemental_snapshots: [
        ...((existing.raw_snapshot ?? {}).supplemental_snapshots ?? []),
        incoming.raw_snapshot
      ].slice(-10)
    }
  };
  return finalizeMissionRecord(merged);
}

function addMission(record) {
  if (!record?.source_url || !record?.mission_name) return null;
  if (!shouldKeepMissionType(record.mission_type)) return null;
  const sourceKey = normalizeUrl(record.source_url) || record.source_url;
  record.source_url = sourceKey;
  const previous = missions.get(sourceKey);
  const previousHash = previous?.source_hash ?? null;
  const merged = mergeMission(previous, record);
  if (previousHash && merged.source_hash && previousHash !== merged.source_hash) {
    changedMissionSourceUrls.add(sourceKey);
  }
  missions.set(sourceKey, merged);
  discoveredSourceUrls.add(sourceKey);
  return merged;
}

function addUnit(unit) {
  if (!unit?.source_key) return;
  units.set(unit.source_key, unit);
}

function addRelation(parent, child, type = "connected_mission", sourceUrl = parent.source_url) {
  if (!parent?.slug || !child?.slug || parent.slug === child.slug) return;
  const sourceKey = sha1(`${parent.slug}|${child.slug}|${type}`);
  relations.set(sourceKey, {
    source_key: sourceKey,
    parent_mission_slug: parent.slug,
    child_mission_slug: child.slug,
    relation_type: type,
    source_url: sourceUrl,
    scraped_at: nowIso()
  });
}

async function safeText(response) {
  try { return await response.text(); } catch { return ""; }
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36 TurkishMissionsDataBuilder/1.0"
    }
  });
  if (!response.ok) {
    throw new Error(`Fetch failed for ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

function parseDirectoryScript(rawScript) {
  const trimmed = rawScript.trim();
  const match = trimmed.match(/var\s+temsilcilikler\s*=\s*(\[[\s\S]*\])\s*;?\s*$/);
  if (!match) {
    throw new Error("Could not parse official missions directory script.");
  }
  return JSON.parse(match[1]);
}

async function harvestUrlsFromText(text, baseUrl = ROOT_URL) {
  for (const url of extractUrls(text, baseUrl)) {
    if (!isOfficialMfaUrl(url)) continue;
    if (/\/ajax\.[^?]+\?/i.test(url)) ajaxUrls.add(url);
    const contact = normalizeContactUrl(url);
    if (contact) directContactUrls.add(contact);
  }
}

async function harvestFromPage(page, sourceUrl) {
  if (page.isClosed()) {
    errors.push({ stage: "harvest_page_closed", sourceUrl, message: "Page was already closed before harvest." });
    return { html: "", bodyText: "", links: [] };
  }

  const html = await page.content().catch((err) => {
    errors.push({ stage: "harvest_content", sourceUrl, message: String(err) });
    return "";
  });
  const bodyText = await page.locator("body").innerText().catch(() => "");
  await harvestUrlsFromText(`${html}\n${bodyText}`, sourceUrl);
  const links = await page.locator("a").evaluateAll((els) =>
    els.map((a) => ({ href: a.href, text: (a.textContent || "").trim() })).filter((x) => x.href)
  ).catch(() => []);
  for (const link of links) {
    await harvestUrlsFromText(link.href, sourceUrl);
  }
  return { html, bodyText, links };
}

async function loadCentralList() {
  const scriptText = await fetchText(MISSIONS_SCRIPT_URL);
  const directoryRows = parseDirectoryScript(scriptText);
  for (const row of directoryRows) {
    const missionUrl = normalizeUrl(row.url);
    const contactUrl = missionUrl ? normalizeContactUrl(missionUrl) : null;
    const missionType = missionTypeFromDirectoryLabel(row.misyonTurAdi);
    if (!shouldKeepMissionType(missionType)) {
      continue;
    }
    if (contactUrl) {
      directContactUrls.add(contactUrl);
    }

    addMission(finalizeMissionRecord({
      slug: slugify(`${row.misyonAdi}-${missionUrl || row.webKey || row.misyonId}`),
      country: row.ulkeAd ?? null,
      country_code: row.ulkeKod ? String(row.ulkeKod).slice(0, 2).toUpperCase() : inferCountryCode(row.ulkeAd),
      city: guessCity(row.misyonAdi, null),
      mission_name: oneLine(row.misyonAdi),
      mission_type: missionType,
      parent_mission_slug: null,
      address: null,
      phones: [],
      emails: [],
      faxes: [],
      emergency_phones: [],
      website_url: missionUrl,
      appointment_url: APPOINTMENT_URL,
      jurisdiction: null,
      working_hours: null,
      office_hours_structured: {},
      consular_call_center: null,
      status: "needs_review",
      verification_status: "official_directory_seed",
      source_url: contactUrl || missionUrl || `${ROOT_URL}#mission-${row.misyonId}`,
      scraped_at: nowIso(),
      last_verified_at: nowIso(),
      contact_fields: {
        directory_mission_id: row.misyonId,
        directory_mission_type_label: row.misyonTurAdi,
        directory_country_id: row.ulkeId,
        directory_web_key: row.webKey || null,
      },
      raw_snapshot: row,
    }));
  }
}

async function parseAjaxPages(context) {
  const page = await context.newPage();
  let count = 0;
  for (const url of [...ajaxUrls]) {
    if (count >= MAX_AJAX_PAGES) break;
    count += 1;
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS });
      await sleep(250);
      const { bodyText } = await harvestFromPage(page, url);
      const title = await page.locator("h1,h2").first().innerText().catch(() => null);
      const mission = addMission(parseMainFromText(bodyText, url, title));
      if (!mission) continue;
      for (const block of extractUnitBlocks(bodyText)) {
        const unit = unitFromBlock(block, mission, url);
        addUnit(unit);
        const honorary = honoraryMissionFromUnit(unit, mission);
        if (honorary) {
          const child = addMission(honorary);
          addRelation(mission, child, "honorary_consulate", url);
        }
      }
      if (mission.website_url) {
        const contact = normalizeContactUrl(mission.website_url);
        if (contact) directContactUrls.add(contact);
      }
    } catch (err) {
      errors.push({ stage: "parse_ajax", url, message: String(err) });
    }
  }
  await page.close();
}

async function parseDirectContactPages(context) {
  const page = await context.newPage();
  const queue = [...directContactUrls];
  let cursor = 0;

  while (cursor < queue.length && cursor < MAX_DIRECT_SITES) {
    const url = queue[cursor++];
    if (visited.has(url)) continue;
    visited.add(url);
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: TIMEOUT_MS });
      await sleep(450);
      const { bodyText, links } = await harvestFromPage(page, url);
      const title = await page.locator("h3").first().innerText().catch(() => null);
      const record = parseMainFromText(bodyText, url, title);
      const mission = addMission(record);
      if (!mission) continue;

      for (const block of extractUnitBlocks(bodyText)) {
        const unit = unitFromBlock(block, mission, url);
        addUnit(unit);
        const honorary = honoraryMissionFromUnit(unit, mission);
        if (honorary) {
          const child = addMission(honorary);
          addRelation(mission, child, "honorary_consulate", url);
        }
      }

      for (const link of links) {
        const contact = normalizeContactUrl(link.href);
        if (!contact || visited.has(contact)) continue;
        if (!queue.includes(contact)) queue.push(contact);

        if (looksLikeMissionName(link.text)) {
          const childRecord = {
            slug: slugify(`${link.text}-${contact}`),
            country: mission.country,
            country_code: mission.country_code,
            city: guessCity(link.text, null),
            mission_name: oneLine(link.text),
            mission_type: missionType(link.text),
            parent_mission_slug: mission.slug,
            address: null,
            phones: [],
            emails: [],
            faxes: [],
            emergency_phones: [],
            website_url: contact.replace(/\/Mission\/Contact$/i, ""),
            appointment_url: APPOINTMENT_URL,
            jurisdiction: null,
            working_hours: null,
            office_hours_structured: {},
            consular_call_center: null,
            status: "needs_review",
            verification_status: "official_source_discovered_link",
            source_url: contact,
            scraped_at: nowIso(),
            contact_fields: {},
            raw_snapshot: { parent_source_url: url, discovered_from_link_text: link.text }
          };
          const child = addMission(childRecord);
          addRelation(mission, child, "connected_mission", url);
        }
      }

      // Sidebar honorary mission names sometimes have no dedicated link.
      const sidebarHonoraries = unique(
        (bodyText.match(/[A-ZÇĞİÖŞÜa-zçğıöşüÀ-ÿ .'-]{2,80}\s+(?:Fahri\s+(?:Baş)?Konsolosluğu|Honorary Consulate(?: General)?(?: Of Turkey)?(?: In [A-Za-zÀ-ÿ .'-]+)?)/gi) ?? [])
      );
      for (const name of sidebarHonoraries) {
        const sourceUrl = `${url}#sidebar-honorary-${slugify(name)}`;
        const child = addMission({
          slug: slugify(`${name}-${sourceUrl}`),
          country: mission.country,
          country_code: mission.country_code,
          city: guessCity(name, null),
          mission_name: oneLine(name),
          mission_type: missionType(name),
          parent_mission_slug: mission.slug,
          address: null,
          phones: [],
          emails: [],
          faxes: [],
          emergency_phones: [],
          website_url: null,
          appointment_url: APPOINTMENT_URL,
          jurisdiction: null,
          working_hours: null,
          office_hours_structured: {},
          consular_call_center: null,
          status: "needs_review",
          verification_status: "official_source_sidebar_name_only",
          source_url: sourceUrl,
          scraped_at: nowIso(),
          contact_fields: {},
          raw_snapshot: { parent_source_url: url, discovered_sidebar_name: name }
        });
        addRelation(mission, child, "honorary_consulate", url);
      }
    } catch (err) {
      errors.push({ stage: "parse_contact", url, message: String(err) });
    }
  }
  await page.close();
}

function rowsBySlug() {
  return [...missions.values()].sort((a, b) => a.slug.localeCompare(b.slug));
}

function unitRows() {
  return [...units.values()].filter((u) => missionsBySlug().has(u.mission_slug))
    .sort((a, b) => `${a.mission_slug}|${a.unit_name}`.localeCompare(`${b.mission_slug}|${b.unit_name}`));
}

function relationRows() {
  const slugSet = missionsBySlug();
  return [...relations.values()].filter((r) => slugSet.has(r.parent_mission_slug) && slugSet.has(r.child_mission_slug))
    .sort((a, b) => `${a.parent_mission_slug}|${a.child_mission_slug}`.localeCompare(`${b.parent_mission_slug}|${b.child_mission_slug}`));
}

function missionsBySlug() {
  return new Map(rowsBySlug().map((m) => [m.slug, m]));
}

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const s = typeof value === "string" ? value : JSON.stringify(value);
  return `"${s.replaceAll('"', '""')}"`;
}

function toCsv(rows, columns) {
  return [
    columns.map(csvEscape).join(","),
    ...rows.map((row) => columns.map((c) => csvEscape(row[c])).join(","))
  ].join("\n") + "\n";
}

function missionUpsertSql(m) {
  return `insert into public.turkish_missions (
  slug, country, country_code, city, city_normalized, mission_name, mission_name_normalized,
  mission_type, parent_mission_slug, address,
  phones, emails, faxes, emergency_phones, website_url, appointment_url,
  jurisdiction, working_hours, office_hours_structured, consular_call_center,
  parser_confidence, data_completeness_score, status, verification_status,
  source_hash, source_url, scraped_at, last_verified_at, contact_fields, raw_snapshot
) values (
  ${escapeSql(m.slug)}, ${escapeSql(m.country)}, ${escapeSql(m.country_code)}, ${escapeSql(m.city)},
  ${escapeSql(m.city_normalized)}, ${escapeSql(m.mission_name)}, ${escapeSql(m.mission_name_normalized)},
  ${escapeSql(m.mission_type)}, ${escapeSql(m.parent_mission_slug)}, ${escapeSql(m.address)},
  ${jsonSql(m.phones)}, ${jsonSql(m.emails)}, ${jsonSql(m.faxes)}, ${jsonSql(m.emergency_phones)},
  ${escapeSql(m.website_url)}, ${escapeSql(m.appointment_url)}, ${escapeSql(m.jurisdiction)},
  ${escapeSql(m.working_hours)}, ${jsonSql(m.office_hours_structured)}, ${escapeSql(m.consular_call_center)},
  ${m.parser_confidence ?? 0}, ${m.data_completeness_score ?? 0}, ${escapeSql(m.status)},
  ${escapeSql(m.verification_status)}, ${escapeSql(m.source_hash)}, ${escapeSql(m.source_url)},
  ${escapeSql(m.scraped_at)}::timestamptz, ${escapeSql(m.last_verified_at)}::timestamptz,
  ${jsonSql(m.contact_fields)}, ${jsonSql(m.raw_snapshot)}
)
on conflict (source_url) do update set
  slug = excluded.slug,
  country = excluded.country,
  country_code = excluded.country_code,
  city = excluded.city,
  city_normalized = excluded.city_normalized,
  mission_name = excluded.mission_name,
  mission_name_normalized = excluded.mission_name_normalized,
  mission_type = excluded.mission_type,
  parent_mission_slug = excluded.parent_mission_slug,
  address = excluded.address,
  phones = excluded.phones,
  emails = excluded.emails,
  faxes = excluded.faxes,
  emergency_phones = excluded.emergency_phones,
  website_url = excluded.website_url,
  appointment_url = excluded.appointment_url,
  jurisdiction = excluded.jurisdiction,
  working_hours = excluded.working_hours,
  office_hours_structured = excluded.office_hours_structured,
  consular_call_center = excluded.consular_call_center,
  parser_confidence = excluded.parser_confidence,
  data_completeness_score = excluded.data_completeness_score,
  status = excluded.status,
  verification_status = excluded.verification_status,
  source_hash = excluded.source_hash,
  scraped_at = excluded.scraped_at,
  last_verified_at = excluded.last_verified_at,
  contact_fields = excluded.contact_fields,
  raw_snapshot = excluded.raw_snapshot;`;
}

function unitUpsertSql(u) {
  return `insert into public.turkish_mission_units (
  source_key, mission_slug, unit_name, unit_type, address, phones, emails, faxes,
  websites, jurisdiction, source_url, scraped_at, raw_snapshot
) values (
  ${escapeSql(u.source_key)}, ${escapeSql(u.mission_slug)}, ${escapeSql(u.unit_name)}, ${escapeSql(u.unit_type)},
  ${escapeSql(u.address)}, ${jsonSql(u.phones)}, ${jsonSql(u.emails)}, ${jsonSql(u.faxes)},
  ${jsonSql(u.websites)}, ${escapeSql(u.jurisdiction)}, ${escapeSql(u.source_url)},
  ${escapeSql(u.scraped_at)}::timestamptz, ${jsonSql(u.raw_snapshot)}
)
on conflict (source_key) do update set
  mission_slug = excluded.mission_slug,
  unit_name = excluded.unit_name,
  unit_type = excluded.unit_type,
  address = excluded.address,
  phones = excluded.phones,
  emails = excluded.emails,
  faxes = excluded.faxes,
  websites = excluded.websites,
  jurisdiction = excluded.jurisdiction,
  source_url = excluded.source_url,
  scraped_at = excluded.scraped_at,
  raw_snapshot = excluded.raw_snapshot;`;
}

function relationUpsertSql(r) {
  return `insert into public.turkish_mission_relations (
  source_key, parent_mission_slug, child_mission_slug, relation_type, source_url, scraped_at
) values (
  ${escapeSql(r.source_key)}, ${escapeSql(r.parent_mission_slug)}, ${escapeSql(r.child_mission_slug)},
  ${escapeSql(r.relation_type)}, ${escapeSql(r.source_url)}, ${escapeSql(r.scraped_at)}::timestamptz
)
on conflict (source_key) do update set
  parent_mission_slug = excluded.parent_mission_slug,
  child_mission_slug = excluded.child_mission_slug,
  relation_type = excluded.relation_type,
  source_url = excluded.source_url,
  scraped_at = excluded.scraped_at;`;
}

async function writeOutputs() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const missionRows = rowsBySlug();
  const attachedUnits = unitRows();
  const connectedRelations = relationRows();

  const sql = [
    "-- Generated by scrape-and-build-import.mjs",
    `-- Generated at: ${nowIso()}`,
    "-- Source: official MFA overseas mission and Mission/Contact pages",
    "begin;",
    ...missionRows.map(missionUpsertSql),
    ...attachedUnits.map(unitUpsertSql),
    ...connectedRelations.map(relationUpsertSql),
    "commit;",
    ""
  ].join("\n\n");

  await fs.writeFile(path.join(OUT_DIR, "turkish_missions_import.sql"), sql, "utf8");
  await fs.writeFile(path.join(OUT_DIR, "turkish_missions.json"), JSON.stringify({
    generated_at: nowIso(),
    source_root: ROOT_URL,
    missions: missionRows,
    units: attachedUnits,
    relations: connectedRelations
  }, null, 2), "utf8");

  await fs.writeFile(path.join(OUT_DIR, "turkish_missions.csv"), toCsv(missionRows, [
    "slug", "country", "country_code", "city", "city_normalized", "mission_name",
    "mission_name_normalized", "mission_type", "parent_mission_slug",
    "address", "phones", "emails", "faxes", "emergency_phones", "website_url",
    "appointment_url", "jurisdiction", "working_hours", "office_hours_structured",
    "consular_call_center", "parser_confidence", "data_completeness_score",
    "status", "verification_status", "source_hash", "source_url", "scraped_at",
    "last_verified_at", "contact_fields", "raw_snapshot"
  ]), "utf8");

  await fs.writeFile(path.join(OUT_DIR, "turkish_mission_units.csv"), toCsv(attachedUnits, [
    "source_key", "mission_slug", "unit_name", "unit_type", "address", "phones", "emails",
    "faxes", "websites", "jurisdiction", "source_url", "scraped_at", "raw_snapshot"
  ]), "utf8");

  await fs.writeFile(path.join(OUT_DIR, "turkish_mission_relations.csv"), toCsv(connectedRelations, [
    "source_key", "parent_mission_slug", "child_mission_slug", "relation_type", "source_url", "scraped_at"
  ]), "utf8");

  const report = {
    generated_at: nowIso(),
    source_root: ROOT_URL,
    ajax_urls_detected: ajaxUrls.size,
    direct_contact_pages_detected: directContactUrls.size,
    direct_contact_pages_visited: visited.size,
    mission_count: missionRows.length,
    mission_units_count: attachedUnits.length,
    mission_relations_count: connectedRelations.length,
    changed_records_count: changedMissionSourceUrls.size,
    low_confidence_count: missionRows.filter((m) => m.parser_confidence < 60).length,
    structured_working_hours_count: missionRows.filter((m) => Object.keys(m.office_hours_structured ?? {}).length > 0).length,
    needs_review_count: missionRows.filter((m) => m.status === "needs_review").length,
    critical_missing_fields: {
      missing_address_count: missionRows.filter((m) => !m.address).length,
      missing_phone_count: missionRows.filter((m) => !m.phones?.length).length,
      missing_email_count: missionRows.filter((m) => !m.emails?.length).length
    },
    needs_review: missionRows.filter((m) => m.status === "needs_review").map((m) => ({
      slug: m.slug,
      mission_name: m.mission_name,
      source_url: m.source_url,
      verification_status: m.verification_status,
      parser_confidence: m.parser_confidence,
      data_completeness_score: m.data_completeness_score
    })),
    errors
  };
  await fs.writeFile(path.join(OUT_DIR, "scrape_report.json"), JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify(report, null, 2));
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    locale: "tr-TR",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36 TurkishMissionsDataBuilder/1.0"
  });

  try {
    console.log(`Loading official MFA directory: ${ROOT_URL}`);
    await loadCentralList();

    console.log(`Detected AJAX pages: ${ajaxUrls.size}`);
    console.log(`Detected direct contact pages before AJAX crawl: ${directContactUrls.size}`);
    await parseAjaxPages(context);

    console.log(`Detected direct contact pages after AJAX crawl: ${directContactUrls.size}`);
    await parseDirectContactPages(context);

    console.log(`Writing output files...`);
    await writeOutputs();
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch(async (err) => {
  console.error(err);
  errors.push({ stage: "fatal", message: String(err), stack: err?.stack });
  try {
    await fs.mkdir(OUT_DIR, { recursive: true });
    await fs.writeFile(path.join(OUT_DIR, "fatal_error.json"), JSON.stringify({ generated_at: nowIso(), errors }, null, 2), "utf8");
  } catch {}
  process.exitCode = 1;
});
