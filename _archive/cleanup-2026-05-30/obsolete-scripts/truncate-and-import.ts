import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

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

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL!;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function truncateAndImport() {
  try {
    // Delete all existing records
    console.log('🗑️ Mevcut kayıtlar siliniyor...');
    const { error: deleteErr } = await supabase
      .from('resource_entries')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteErr) {
      console.error('❌ Silme hatası:', deleteErr);
      return;
    }

    const { count } = await supabase
      .from('resource_entries')
      .select('*', { count: 'exact', head: true });

    console.log(`✅ Tablo temizlendi. Kalan: ${count}`);
  } catch (error) {
    console.error('❌ Hata:', error);
  }
}

truncateAndImport();
