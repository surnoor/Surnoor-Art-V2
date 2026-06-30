import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const {
  VITE_AIRTABLE_TOKEN,
  VITE_AIRTABLE_BASE_ID,
  VITE_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_ACCESS_KEY_ID,
  CLOUDFLARE_SECRET_ACCESS_KEY,
  CLOUDFLARE_BUCKET_NAME,
  CLOUDFLARE_R2_PUBLIC_URL
} = process.env;

// Validate environment variables
const missingVars = [];
if (!VITE_AIRTABLE_TOKEN) missingVars.push('VITE_AIRTABLE_TOKEN');
if (!VITE_AIRTABLE_BASE_ID) missingVars.push('VITE_AIRTABLE_BASE_ID');
if (!VITE_SUPABASE_URL) missingVars.push('VITE_SUPABASE_URL');
if (!SUPABASE_SERVICE_ROLE_KEY) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
if (!CLOUDFLARE_ACCOUNT_ID) missingVars.push('CLOUDFLARE_ACCOUNT_ID');
if (!CLOUDFLARE_ACCESS_KEY_ID) missingVars.push('CLOUDFLARE_ACCESS_KEY_ID');
if (!CLOUDFLARE_SECRET_ACCESS_KEY) missingVars.push('CLOUDFLARE_SECRET_ACCESS_KEY');
if (!CLOUDFLARE_BUCKET_NAME) missingVars.push('CLOUDFLARE_BUCKET_NAME');
if (!CLOUDFLARE_R2_PUBLIC_URL) missingVars.push('CLOUDFLARE_R2_PUBLIC_URL');

if (missingVars.length > 0) {
  console.error('❌ Missing environment variables in .env.local:', missingVars.join(', '));
  process.exit(1);
}

// Initialize Supabase Client (using Service Role key to bypass RLS)
const supabase = createClient(VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Initialize Cloudflare R2 Client (via S3 SDK)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: CLOUDFLARE_SECRET_ACCESS_KEY,
  },
});

// Helper: Download file from URL and upload to R2
async function uploadImageToR2(url, filename) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    await r2Client.send(new PutObjectCommand({
      Bucket: CLOUDFLARE_BUCKET_NAME,
      Key: filename,
      Body: buffer,
      ContentType: contentType,
    }));

    const cleanBaseUrl = CLOUDFLARE_R2_PUBLIC_URL.replace(/\/$/, '');
    return `${cleanBaseUrl}/${filename}`;
  } catch (error) {
    console.error(`❌ Failed to upload image ${filename} to R2:`, error.message);
    return null;
  }
}

// Helper: Fetch all records from Airtable (handles pagination)
async function fetchAirtableRecords(tableName) {
  const records = [];
  let offset = '';
  
  do {
    const url = `https://api.airtable.com/v0/${VITE_AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}` + 
      (offset ? `?offset=${offset}` : '');
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${VITE_AIRTABLE_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${tableName} from Airtable: HTTP ${response.status}`);
    }

    const data = await response.json();
    records.push(...(data.records || []));
    offset = data.offset || '';
  } while (offset);

  return records;
}

// --- MIGRATION TASKS ---

async function migrateHeroSlideshow() {
  console.log('\n--- Migrating HeroSlideshow ---');
  const records = await fetchAirtableRecords('HeroSlideshow');
  console.log(`Found ${records.length} records in Airtable.`);

  for (const record of records) {
    const fields = record.fields;
    const imageAttachment = fields.Image?.[0];

    if (!imageAttachment) {
      console.log(`⚠️ Slide ${record.id} has no image, skipping.`);
      continue;
    }

    const { data: existing } = await supabase
      .from('HeroSlideshow')
      .select('id')
      .eq('id', record.id)
      .single();

    if (existing) {
      console.log(`⏩ Slide ${record.id} already exists in Supabase, skipping.`);
      continue;
    }

    console.log(`📸 Uploading image for slide ${record.id}...`);
    const fileExtension = imageAttachment.filename.split('.').pop() || 'jpg';
    const r2Filename = `hero_${imageAttachment.id}.${fileExtension}`;
    const r2Url = await uploadImageToR2(imageAttachment.url, r2Filename);

    if (!r2Url) continue;

    const { error } = await supabase.from('HeroSlideshow').insert({
      id: record.id,
      Image_url: r2Url,
      Active: fields.Active ?? true,
      Order: fields.Order ?? 0,
    });

    if (error) {
      console.error(`❌ Error inserting slide ${record.id}:`, error.message);
    } else {
      console.log(`✅ Slide ${record.id} migrated successfully!`);
    }
  }
}

async function migrateArchive() {
  console.log('\n--- Migrating Archive ---');
  const records = await fetchAirtableRecords('Archive');
  console.log(`Found ${records.length} records in Airtable.`);

  for (const record of records) {
    const fields = record.fields;
    
    // Skip records that don't have a Name (essential field)
    if (!fields.Name) {
      console.log(`⚠️ Record ${record.id} has no name, skipping.`);
      continue;
    }

    const { data: existing } = await supabase
      .from('Archive')
      .select('id')
      .eq('id', record.id)
      .single();

    if (existing) {
      console.log(`⏩ Archive record "${fields.Name}" (${record.id}) already exists in Supabase, skipping.`);
      continue;
    }

    console.log(`🎨 Migrating archive record: "${fields.Name}"...`);

    // 1. Process Main Image
    let imageUrl = null;
    let thumbnailUrl = null;
    let filmstripUrl = null;

    const mainImage = fields.Image?.[0];
    if (mainImage) {
      console.log(`   Uploading main image...`);
      const fileExtension = mainImage.filename.split('.').pop() || 'jpg';
      
      // Upload full size
      imageUrl = await uploadImageToR2(mainImage.url, `archive_${mainImage.id}.${fileExtension}`);
      
      // Upload large thumbnail as gallery thumbnail
      if (mainImage.thumbnails?.large?.url) {
        thumbnailUrl = await uploadImageToR2(mainImage.thumbnails.large.url, `archive_thumb_${mainImage.id}.${fileExtension}`);
      } else {
        thumbnailUrl = imageUrl;
      }

      // Upload small thumbnail as filmstrip
      if (mainImage.thumbnails?.small?.url) {
        filmstripUrl = await uploadImageToR2(mainImage.thumbnails.small.url, `archive_film_${mainImage.id}.${fileExtension}`);
      } else {
        filmstripUrl = thumbnailUrl || imageUrl;
      }
    }

    // 2. Process Additional Images
    const additionalImageUrls = [];
    const additionalImages = fields['Additional Images'] || [];
    for (const img of additionalImages) {
      console.log(`   Uploading additional image: ${img.filename}...`);
      const fileExtension = img.filename.split('.').pop() || 'jpg';
      const r2Url = await uploadImageToR2(img.url, `archive_add_${img.id}.${fileExtension}`);
      if (r2Url) additionalImageUrls.push(r2Url);
    }

    // 3. Map multi-select Series
    let seriesArray = [];
    if (Array.isArray(fields.Series)) {
      seriesArray = fields.Series;
    } else if (fields.Series) {
      seriesArray = [fields.Series];
    }

    // 4. Save to Supabase
    const { error } = await supabase.from('Archive').insert({
      id: record.id,
      Name: fields.Name,
      Medium: fields.Medium || null,
      Year: fields.Year != null ? String(fields.Year) : null,
      Dimensions: fields.Dimensions || null,
      Notes: fields.Notes || fields.Note || null,
      Image_url: imageUrl,
      Thumbnail_url: thumbnailUrl,
      Filmstrip_url: filmstripUrl,
      Status: fields.Status || 'Active',
      Category: fields.Category || null,
      Series: seriesArray,
      Substrate: fields.Substrate || null,
      Additional_Images: additionalImageUrls,
      ShowAtEvent: fields.ShowAtEvent ?? false,
      ArtSupplyPrint: fields.ArtSupplyPrint ?? false,
      Pinterest: fields.Pinterest ?? false,
      Featured: fields.Featured ?? false,
    });

    if (error) {
      console.error(`❌ Error inserting archive record "${fields.Name}":`, error.message);
    } else {
      console.log(`✅ Archive record "${fields.Name}" migrated successfully!`);
    }
  }
}

async function migrateInterests() {
  console.log('\n--- Migrating Interests ---');
  const records = await fetchAirtableRecords('Interests');
  console.log(`Found ${records.length} records in Airtable.`);

  for (const record of records) {
    const fields = record.fields;
    if (!fields.Email || !fields.Artwork) continue;

    // Check if duplicate entry exists (since we don't have unique IDs in Interests from Airtable)
    const { data: existing } = await supabase
      .from('Interests')
      .select('id')
      .eq('Email', fields.Email)
      .eq('Artwork', fields.Artwork)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`⏩ Interest from "${fields.Email}" for "${fields.Artwork}" already exists, skipping.`);
      continue;
    }

    const { error } = await supabase.from('Interests').insert({
      Artwork: fields.Artwork,
      Email: fields.Email,
    });

    if (error) {
      console.error(`❌ Error inserting interest:`, error.message);
    } else {
      console.log(`✅ Interest for "${fields.Artwork}" from "${fields.Email}" migrated.`);
    }
  }
}

async function migrateNewsletter() {
  console.log('\n--- Migrating Newsletter ---');
  const records = await fetchAirtableRecords('Newsletter');
  console.log(`Found ${records.length} records in Airtable.`);

  for (const record of records) {
    const fields = record.fields;
    if (!fields.Email) continue;

    const { data: existing } = await supabase
      .from('Newsletter')
      .select('id')
      .eq('Email', fields.Email)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`⏩ Newsletter subscription for "${fields.Email}" already exists, skipping.`);
      continue;
    }

    const { error } = await supabase.from('Newsletter').insert({
      Email: fields.Email,
    });

    if (error) {
      // If there's a unique constraint error, we can ignore it since it's already there
      if (error.code === '23505') {
        console.log(`⏩ Newsletter subscription for "${fields.Email}" already exists (database unique constraint), skipping.`);
      } else {
        console.error(`❌ Error inserting newsletter subscriber "${fields.Email}":`, error.message);
      }
    } else {
      console.log(`✅ Newsletter subscriber "${fields.Email}" migrated.`);
    }
  }
}

async function migrateSurvey() {
  console.log('\n--- Migrating Survey Responses ---');
  const records = await fetchAirtableRecords('Survey Responses');
  console.log(`Found ${records.length} records in Airtable.`);

  for (const record of records) {
    const fields = record.fields;

    // Use a simple heuristic to skip duplicates (same additional thoughts or requests)
    const { data: existing } = await supabase
      .from('Survey Responses')
      .select('id')
      .eq('Additional Thoughts', fields['Additional Thoughts'] || '')
      .eq('Requests', fields['Requests'] || '')
      .limit(1);

    if (existing && existing.length > 0 && (fields['Additional Thoughts'] || fields['Requests'])) {
      console.log(`⏩ Survey response seems to already exist, skipping.`);
      continue;
    }

    const { error } = await supabase.from('Survey Responses').insert({
      'Discovery Source': fields['Discovery Source'] || null,
      'Resonances': fields.Resonances || null,
      'Art as Dialogue': fields['Art as Dialogue'] || null,
      'Interaction Frequency': fields['Interaction Frequency'] || null,
      'Purchase Intent': fields['Purchase Intent'] || null,
      'Values': fields.Values || null,
      'Requests': fields.Requests || null,
      'Additional Thoughts': fields['Additional Thoughts'] || null,
    });

    if (error) {
      console.error(`❌ Error inserting survey response:`, error.message);
    } else {
      console.log(`✅ Survey response migrated.`);
    }
  }
}

// Main execution block
async function run() {
  try {
    console.log('🚀 Starting Migration: Airtable ➡️ Supabase + Cloudflare R2');
    
    try {
      await migrateHeroSlideshow();
    } catch (e) {
      console.warn(`⚠️ HeroSlideshow migration skipped: ${e.message}`);
    }

    try {
      await migrateArchive();
    } catch (e) {
      console.error(`❌ Archive migration failed: ${e.message}`);
    }

    try {
      await migrateInterests();
    } catch (e) {
      console.error(`❌ Interests migration failed: ${e.message}`);
    }

    try {
      await migrateNewsletter();
    } catch (e) {
      console.error(`❌ Newsletter migration failed: ${e.message}`);
    }

    try {
      await migrateSurvey();
    } catch (e) {
      console.error(`❌ Survey Responses migration failed: ${e.message}`);
    }

    console.log('\n🎉 MIGRATION PROCESS COMPLETED!');
  } catch (error) {
    console.error('\n❌ Migration failed with critical error:', error.message);
    process.exit(1);
  }
}

run();
