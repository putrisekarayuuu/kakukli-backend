/**
 * Setup Database Tables and Seed Dummy Data (Non-Interactive)
 * 
 * Usage:
 *   node scripts/setup_database.js
 */

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcrypt');
const XLSX = require('xlsx');
const path = require('path');
const { Client } = require('pg');

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 Database Setup & Seed Script');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Setup database connection - Direct connection to Supabase
  const connectionString = "postgresql://postgres:skripsifalana1234@db.jddmfqfmtulsxpofbpir.supabase.co:5432/postgres";
  
  console.log('Connecting to Supabase database...');
  console.log(`Connection string: ${connectionString.split('@')[1]}\n`); // Hide password
  
  const sqlClient = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false } // Required for Supabase connection
  });
  await sqlClient.connect();
  console.log('✅ Connected to Supabase database\n');

  const adapter = new PrismaPg(sqlClient);
  const prisma = new PrismaClient({ adapter });

  try {
    // Step 1: Create tables
    console.log('📋 Step 1: Creating database tables...\n');

    console.log('Creating users table...');
    await sqlClient.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Users table created\n');

    console.log('Creating kbli_mapping table...');
    await sqlClient.query(`
      CREATE TABLE IF NOT EXISTS kbli_mapping (
        id SERIAL PRIMARY KEY,
        nama_usaha TEXT,
        status_perusahaan TEXT,
        status_hasil_gc TEXT,
        kbli_2020 VARCHAR(50),
        kbli_2025 VARCHAR(50),
        korespondensi VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ kbli_mapping table created\n');

    console.log('Creating indexes...');
    await sqlClient.query(`
      CREATE INDEX IF NOT EXISTS idx_kbli_2020 ON kbli_mapping(kbli_2020);
      CREATE INDEX IF NOT EXISTS idx_kbli_2025 ON kbli_mapping(kbli_2025);
      CREATE INDEX IF NOT EXISTS idx_korespondensi ON kbli_mapping(korespondensi);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `);
    console.log('✅ Indexes created\n');

    // Step 2: Seed dummy users
    console.log('👤 Step 2: Seeding dummy users...\n');

    const users = [
      { username: 'admin', password: 'admin123', is_active: true },
      { username: 'testuser', password: 'test123', is_active: true },
      { username: 'demo', password: 'demo123', is_active: true },
      { username: 'john', password: 'john123', is_active: true },
      { username: 'jane', password: 'jane123', is_active: true },
    ];

    let created = 0;
    let skipped = 0;

    for (const user of users) {
      try {
        const existing = await sqlClient.query(
          'SELECT id FROM users WHERE username = $1',
          [user.username]
        );

        if (existing.rows.length > 0) {
          console.log(`⏭️  User "${user.username}" already exists`);
          skipped++;
          continue;
        }

        const hashedPassword = await bcrypt.hash(user.password, 10);

        await sqlClient.query(
          `INSERT INTO users (username, password_hash, is_active) 
           VALUES ($1, $2, $3)`,
          [user.username, hashedPassword, user.is_active]
        );

        console.log(`✅ Created user: ${user.username} (password: ${user.password})`);
        created++;
      } catch (error) {
        console.error(`❌ Error creating user ${user.username}:`, error.message);
      }
    }

    console.log(`\n✅ Users seeded: ${created} created, ${skipped} skipped\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 User Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    users.forEach((u) => {
      console.log(`  Username: ${u.username}`);
      console.log(`  Password: ${u.password}`);
      console.log('');
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Step 3: Import KBLI data
    console.log('📊 Step 3: Importing KBLI data from Excel...\n');

    const excelFile = path.join(__dirname, '..', 'Hasil_Mapping_Korespondensi_KBLI_2025.xlsx');
    const workbook = XLSX.readFile(excelFile);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📊 Found ${data.length} rows to import\n`);

    let successCount = 0;
    let errorCount = 0;
    const batchSize = 500;

    console.log(`Importing data in batches of ${batchSize}...`);

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(data.length / batchSize);

      process.stdout.write(`\rProcessing batch ${batchNumber}/${totalBatches}...`);

      try {
        for (const row of batch) {
          await sqlClient.query(
            `INSERT INTO kbli_mapping (nama_usaha, status_perusahaan, status_hasil_gc, kbli_2020, kbli_2025, korespondensi)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              row['Nama Usaha'] || null,
              row['Status Perusahaan'] || null,
              row['Status Hasil GC'] || null,
              String(row['KBLI 2020'] || ''),
              String(row['KBLI 2025'] || ''),
              row['Korespondensi'] || null,
            ]
          );
          successCount++;
        }
      } catch (error) {
        errorCount += batch.length;
      }
    }

    console.log('\n');
    console.log('✅ KBLI data import completed');
    console.log(`✓  Success: ${successCount} rows`);
    console.log(`✗  Errors:  ${errorCount} rows`);
    console.log(`📊 Total:   ${data.length} rows\n`);

    // Summary
    const userCount = await sqlClient.query('SELECT COUNT(*) FROM users');
    const kbliCount = await sqlClient.query('SELECT COUNT(*) FROM kbli_mapping');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Setup Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📊 Database Summary:');
    console.log(`  Users: ${userCount.rows[0].count}`);
    console.log(`  KBLI Records: ${kbliCount.rows[0].count}`);
    console.log('');

    console.log('🌐 Next Steps:');
    console.log('  1. Start server: npm run dev');
    console.log('  2. Swagger UI: http://localhost:3000/api-docs');
    console.log('  3. Login with: admin / admin123');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error during setup:', error.message);
    throw error;
  } finally {
    await sqlClient.end();
  }
}

main().catch(console.error);
