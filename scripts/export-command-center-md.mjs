/**
 * Command Center items'ı veritabanından çekip 100'er maddelik MD dosyalarına böler.
 * Sıralama: en eskiden yeniye (created_at ASC).
 * Kullanım: node scripts/export-command-center-md.mjs
 *
 * Gerekli: SUPABASE_SERVICE_ROLE_KEY (ortam değişkeni veya `.env.local`).
 * Anahtar ASLA bu dosyaya gömülmez — service role anahtarı RLS'i tamamen
 * devre dışı bırakır ve depoya girerse iptal edilmesi gerekir.
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const result = {};
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!match) continue;
    result[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
  return result;
}

const fileEnv = parseEnvFile(join(ROOT, '.env.local'));

const SUPABASE_URL =
  process.env.SUPABASE_URL || fileEnv.SUPABASE_URL || fileEnv.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || fileEnv.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    '[export-command-center-md] SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli.\n' +
      'Ortam değişkeni olarak verin ya da `.env.local` dosyasına yazın.'
  );
  process.exit(1);
}

const PAGE_SIZE = 1000; // PostgREST max per request
const MD_BATCH = 100;
const OUTPUT_DIR = join(ROOT, 'docs', 'commandcenter');

async function fetchAllItems() {
  const items = [];
  let offset = 0;

  while (true) {
    const rangeEnd = offset + PAGE_SIZE - 1;
    const url = `${SUPABASE_URL}/rest/v1/command_center_items?select=id,item_type,title,detail,category_label,assignee,status,priority,due_date,urgent,legacy_source_type,legacy_source_code,legacy_source_date_label,legacy_source_category,legacy_source_title,sort_order,archived_at,deleted_at,created_at,updated_at&order=created_at.asc&offset=${offset}&limit=${PAGE_SIZE}`;

    const res = await fetch(url, {
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }

    const batch = await res.json();
    items.push(...batch);
    console.log(`  Fetched ${batch.length} rows (offset ${offset}, total ${items.length})`);

    if (batch.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return items;
}

function escapeMd(text) {
  if (!text) return '';
  return text
    .replace(/\|/g, '\\|')
    .replace(/\n/g, '<br>');
}

function formatDate(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('tr-TR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    });
  } catch { return d; }
}

function itemToRow(item, idx) {
  const status = item.status || '—';
  const assignee = item.assignee || '—';
  const priority = item.priority ?? '—';
  const urgent = item.urgent ? '🔴' : '';
  const dueDate = formatDate(item.due_date);
  const category = item.category_label || '—';
  const source = item.legacy_source_code || '—';
  const sourceDate = item.legacy_source_date_label || '—';
  const sourceCat = item.legacy_source_category || '—';
  const type = item.item_type === 'meeting_note' ? '📋 Toplantı' : '✅ Todo';
  const archived = item.archived_at ? '📦' : '';
  const deleted = item.deleted_at ? '🗑️' : '';

  return {
    num: idx,
    type,
    title: item.title || '—',
    detail: item.detail || '',
    status,
    assignee,
    priority: `${priority}${urgent ? ' ' + urgent : ''}`,
    dueDate,
    category,
    source,
    sourceDate,
    sourceCat,
    createdAt: formatDate(item.created_at),
    archived,
    deleted,
    flags: [archived, deleted].filter(Boolean).join(' ') || '—',
  };
}

function buildMd(rows, fileIndex, totalFiles) {
  const first = rows[0].num;
  const last = rows[rows.length - 1].num;
  const lines = [];

  lines.push(`# Command Center — Bölüm ${fileIndex}/${totalFiles} (Madde ${first}–${last})`);
  lines.push('');
  lines.push(`> Toplam ${rows.length} madde · Sıralama: en eskiden yeniye (created_at ASC)`);
  lines.push(`> Oluşturulma: ${new Date().toLocaleString('tr-TR')}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  for (const r of rows) {
    lines.push(`## ${r.num}. ${r.title}`);
    lines.push('');
    lines.push(`| Alan | Değer |`);
    lines.push(`|------|-------|`);
    lines.push(`| **Tür** | ${r.type} |`);
    lines.push(`| **Durum** | ${r.status} |`);
    lines.push(`| **Atanan** | ${r.assignee} |`);
    lines.push(`| **Öncelik** | ${r.priority} |`);
    lines.push(`| **Son Tarih** | ${r.dueDate} |`);
    lines.push(`| **Kategori** | ${r.category} |`);
    lines.push(`| **Kaynak** | ${r.source} |`);
    lines.push(`| **Kaynak Tarih** | ${r.sourceDate} |`);
    lines.push(`| **Kaynak Kategori** | ${r.sourceCat} |`);
    lines.push(`| **Oluşturulma** | ${r.createdAt} |`);
    lines.push(`| **Durum Bayrak** | ${r.flags} |`);
    lines.push('');

    if (r.detail && r.detail.trim()) {
      lines.push('**Detay:**');
      lines.push('');
      lines.push(r.detail);
      lines.push('');
    }

    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

async function main() {
  console.log('Fetching all command_center_items from Supabase...');
  const items = await fetchAllItems();
  console.log(`Total items fetched: ${items.length}`);

  mkdirSync(OUTPUT_DIR, { recursive: true });

  const totalFiles = Math.ceil(items.length / MD_BATCH);
  console.log(`Splitting into ${totalFiles} MD files (${MD_BATCH} items each)...`);

  for (let i = 0; i < items.length; i += MD_BATCH) {
    const batch = items.slice(i, i + MD_BATCH);
    const fileIndex = Math.floor(i / MD_BATCH) + 1;
    const paddedIndex = String(fileIndex).padStart(2, '0');
    const rows = batch.map((item, idx) => itemToRow(item, i + idx + 1));
    const md = buildMd(rows, fileIndex, totalFiles);
    const filename = `command-center-${paddedIndex}.md`;
    const filepath = join(OUTPUT_DIR, filename);
    writeFileSync(filepath, md, 'utf-8');
    console.log(`  Written ${filepath} (${rows.length} items)`);
  }

  console.log(`\nDone! ${totalFiles} files written to ${OUTPUT_DIR}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
