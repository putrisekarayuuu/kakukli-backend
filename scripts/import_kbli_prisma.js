const XLSX = require('xlsx');
const { Pool } = require('pg');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const EXCEL_FILE = path.join(__dirname, '..', 'Hasil_Mapping_Korespondensi_KBLI_2025.xlsx');

async function importKBLIData() {
  console.log('🚀 Starting KBLI data import...\n');

  // Read Excel file
  console.log('📖 Reading Excel file...');
  const workbook = XLSX.readFile(EXCEL_FILE);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  console.log(`📊 Found ${data.length} rows to import\n`);

  if (data.length === 0) {
    console.log('⚠️  No data found in Excel file');
    return;
  }

  console.log(`⚠️  This will insert ${data.length} rows into the database.`);

  // Import using direct SQL for performance
  let successCount = 0;
  let errorCount = 0;
  const batchSize = 500;

  console.log(`\n📥 Importing data in batches of ${batchSize}...`);

  const client = await pool.connect();
  try {
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(data.length / batchSize);

      process.stdout.write(`\rProcessing batch ${batchNumber}/${totalBatches}...`);

      // Build VALUES clause for batch insert
      const values = [];
      const placeholders = [];
      let paramIndex = 1;

      for (const row of batch) {
        const namaUsaha = row['Nama Usaha'] || null;
        const statusPerusahaan = row['Status Perusahaan'] || null;
        const statusHasilGc = row['Status Hasil GC'] || null;
        const kbli2020 = row['KBLI 2020'] ? String(row['KBLI 2020']) : null;
        const kbli2025 = row['KBLI 2025'] ? String(row['KBLI 2025']) : null;
        const korespondensi = row['Korespondensi'] || null;

        placeholders.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5})`);
        values.push(namaUsaha, statusPerusahaan, statusHasilGc, kbli2020, kbli2025, korespondensi);
        paramIndex += 6;
      }

      const sql = `
        INSERT INTO kbli_mapping (nama_usaha, status_perusahaan, status_hasil_gc, kbli_2020, kbli_2025, korespondensi)
        VALUES ${placeholders.join(', ')}
      `;

      try {
        await client.query(sql, values);
        successCount += batch.length;
      } catch (err) {
        console.error(`\n❌ Error in batch ${batchNumber}:`, err.message);
        errorCount += batch.length;
      }
    }

    console.log('\n');
    console.log('✅ Import completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✓  Success: ${successCount} rows`);
    console.log(`✗  Errors:  ${errorCount} rows`);
    console.log(`📊 Total:   ${data.length} rows`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (err) {
    console.error('\n❌ Fatal error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

importKBLIData().catch((e) => {
  console.error('Unhandled error:', e);
  process.exit(1);
});
