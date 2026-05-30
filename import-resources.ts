import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envLines = envContent.split('\n');
const env: Record<string, string> = {};

envLines.forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase URL veya Service Role Key bulunamadı');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split('\n');
  const headerLine = lines[0];
  const headers: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < headerLine.length; i++) {
    const char = headerLine[i];
    const nextChar = headerLine[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      headers.push(current.trim().replace(/^"(.*)"$/, '$1'));
      current = '';
    } else {
      current += char;
    }
  }
  headers.push(current.trim().replace(/^"(.*)"$/, '$1'));

  return lines.slice(1).map(line => {
    const values: string[] = [];
    let currentValue = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentValue += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue.trim().replace(/^"(.*)"$/, '$1'));
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim().replace(/^"(.*)"$/, '$1'));

    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    return obj;
  });
}

interface CsvRow {
  order_no: string;
  slug: string;
  bolum: string;
  alt_bolum: string;
  kayit_turu: string;
  ekleyen: string;
  baslik: string;
  aciklama: string;
  url: string;
  file_id: string;
  dosya_tipi: string;
  mime_type: string;
  gizlilik: string;
  public_import: string;
  import_onerisi: string;
  etiketler: string;
  source_path: string;
  status: string;
}

interface ResourceEntry {
  department: string;
  record_kind: string;
  added_by: string;
  title: string;
  description: string | null;
  url: string | null;
  storage_bucket: null;
  storage_path: null;
  file_name: null;
  person_first_name: null;
  person_last_name: null;
  person_role: null;
  linkedin_url: null;
  instagram_url: null;
  website_url: null;
  source_folder: string;
  source_subfolder: string | null;
  source_snapshot_date: null;
  import_batch: string;
}

function mapDepartment(csvDepartment: string): string {
  const mapping: Record<string, string> = {
    'Marketing': 'Genel',
    'Görseller': 'Genel',
    'Finans': 'Genel',
    'Global Outreach': 'Genel',
    'HR': 'İnsan Kaynakları',
    'İç Kullanım': 'Genel',
    'Proje Yönetimi': 'Genel',
    'ARGE': 'ARGE',
    'Teknoloji': 'Genel',
    'Platform Notları': 'Genel',
    'Cadde': 'Genel',
    'Güvenlik': 'Genel',
    'İş Geliştirme': 'Genel',
    'Hukuk & Uyum': 'Genel',
    'Founders Bio': 'Genel',
  };

  return mapping[csvDepartment] || 'Genel';
}

async function importResources() {
  try {
    const csvPath = path.join(process.cwd(), 'filesnew.csv');
    const fileContent = fs.readFileSync(csvPath, 'utf-8');

    const records = parseCSV(fileContent).filter(r => r.order_no) as any[];

    console.log(`📊 CSV'den ${records.length} kayıt okundu`);

    const importBatchId = new Date().toISOString().replace(/[:.]/g, '-');
    const seenUrls = new Set<string>();

    const entries: ResourceEntry[] = records.map((row) => {
      const url = row.url?.trim() || null;
      let finalUrl = url;

      if (url) {
        if (seenUrls.has(url)) {
          finalUrl = null; // Set duplicate URLs to null
        } else {
          seenUrls.add(url);
        }
      }

      return {
      department: mapDepartment(row.bolum || 'Genel'),
      record_kind: row.kayit_turu || 'Link',
      added_by: row.ekleyen || 'UBT',
      title: row.baslik?.trim() || 'Başlık yok',
      description: row.aciklama?.trim() || null,
      url: finalUrl,
      storage_bucket: null,
      storage_path: null,
      file_name: null,
      person_first_name: null,
      person_last_name: null,
      person_role: null,
      linkedin_url: null,
      instagram_url: null,
      website_url: null,
      source_folder: row.source_path || 'Google Drive',
      source_subfolder: row.alt_bolum?.trim() || null,
      source_snapshot_date: null,
      import_batch: importBatchId,
    };
    });

    // Batch insert (1000 at a time)
    const batchSize = 1000;
    let insertedCount = 0;

    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('resource_entries')
        .insert(batch);

      if (error) {
        console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} hata:`, error.message);
        continue;
      }

      insertedCount += batch.length;
      console.log(`✅ ${insertedCount}/${entries.length} kayıt yüklendi`);
    }

    console.log(`\n🎉 Import tamamlandı! ${insertedCount} kayıt eklendi.`);
    console.log(`📋 Import Batch ID: ${importBatchId}`);

  } catch (error) {
    console.error('❌ Import hatası:', error);
    process.exit(1);
  }
}

importResources();
