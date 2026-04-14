/**
 * Setup Database Tables and Seed Dummy Data
 * 
 * This script:
 * 1. Creates database tables manually using SQL
 * 2. Seeds dummy user data
 * 3. Imports KBLI data from Excel
 * 
 * Usage:
 *   node scripts/setup_and_seed.js
 */

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcrypt');
const XLSX = require('xlsx');
const path = require('path');
const readline = require('readline');
const { Client } = require('pg');

// Setup direct database connection
const connectionString = process.env.DATABASE_URL || "postgresql://postgres:skripsifalana1234@db.jddmfqfmtulsxpofbpir.supabase.co:5432/postgres";
const client = new Client({ connectionString });

const adapter = new PrismaPg(client);
const prisma = new PrismaClient({ adapter });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Step 1: Create tables manually using raw SQL
 */
async function createTables() {
  console.log('\n📋 Step 1: Creating database tables...\n');

  try {
    // Create users table
    console.log('Creating users table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Users table created');

    // Create kbli_mapping table
    console.log('\nCreating kbli_mapping table...');
    await prisma.$executeRawUnsafe(`
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
    console.log('✅ kbli_mapping table created');

    // Create indexes
    console.log('\nCreating indexes...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_kbli_2020 ON kbli_mapping(kbli_2020);
      CREATE INDEX IF NOT EXISTS idx_kbli_2025 ON kbli_mapping(kbli_2025);
      CREATE INDEX IF NOT EXISTS idx_korespondensi ON kbli_mapping(korespondensi);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `);
    console.log('✅ Indexes created');

    console.log('\n✅ All tables created successfully!\n');
  } catch (error) {
    if (error.code === '23505') {
      console.log('ℹ️  Tables already exist, skipping...\n');
    } else {
      console.error('❌ Error creating tables:', error.message);
      throw error;
    }
  }
}

/**
 * Step 2: Seed dummy user data
 */
async function seedUsers() {
  console.log('\n👤 Step 2: Seeding dummy users...\n');

  const users = [
    {
      username: 'admin',
      password: 'admin123',
      is_active: true,
    },
    {
      username: 'testuser',
      password: 'test123',
      is_active: true,
    },
    {
      username: 'demo',
      password: 'demo123',
      is_active: true,
    },
    {
      username: 'john',
      password: 'john123',
      is_active: true,
    },
    {
      username: 'jane',
      password: 'jane123',
      is_active: true,
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const user of users) {
    try {
      // Check if user exists
      const existing = await prisma.user.findUnique({
        where: { username: user.username },
      });

      if (existing) {
        console.log(`⏭️  User "${user.username}" already exists`);
        skipped++;
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(user.password, 10);

      // Create user
      await prisma.user.create({
        data: {
          username: user.username,
          password_hash: hashedPassword,
          is_active: user.is_active,
        },
      });

      console.log(`✅ Created user: ${user.username} (password: ${user.password})`);
      created++;
    } catch (error) {
      console.error(`❌ Error creating user ${user.username}:`, error.message);
    }
  }

  console.log(`\n✅ Users seeded: ${created} created, ${skipped} skipped\n`);

  console.log('📝 User Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  users.forEach((u) => {
    console.log(`  Username: ${u.username}`);
    console.log(`  Password: ${u.password}`);
    console.log('');
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Step 3: Import KBLI data from Excel
 */
async function importKBLIData() {
  console.log('\n📊 Step 3: Importing KBLI data from Excel...\n');

  const excelFile = path.join(__dirname, '..', 'Hasil_Mapping_Korespondensi_KBLI_2025.xlsx');

  // Read Excel file
  console.log('Reading Excel file...');
  const workbook = XLSX.readFile(excelFile);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet);

  console.log(`📊 Found ${data.length} rows to import\n`);

  if (data.length === 0) {
    console.log('⚠️  No data found in Excel file');
    return;
  }

  // Import in batches
  let successCount = 0;
  let errorCount = 0;
  const batchSize = 100;

  console.log(`Importing data in batches of ${batchSize}...`);

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(data.length / batchSize);

    process.stdout.write(`\rProcessing batch ${batchNumber}/${totalBatches}...`);

    try {
      await prisma.$transaction(
        batch.map((row) =>
          prisma.kbli_mapping.create({
            data: {
              nama_usaha: row['Nama Usaha'] || null,
              status_perusahaan: row['Status Perusahaan'] || null,
              status_hasil_gc: row['Status Hasil GC'] || null,
              kbli_2020: String(row['KBLI 2020'] || ''),
              kbli_2025: String(row['KBLI 2025'] || ''),
              korespondensi: row['Korespondensi'] || null,
            },
          })
        )
      );
      successCount += batch.length;
    } catch (error) {
      errorCount += batch.length;
    }
  }

  console.log('\n');
  console.log('✅ KBLI data import completed');
  console.log(`✓  Success: ${successCount} rows`);
  console.log(`✗  Errors:  ${errorCount} rows`);
  console.log(`📊 Total:   ${data.length} rows\n`);
}

/**
 * Main function
 */
async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 Database Setup & Seed Script');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('This script will:');
  console.log('1. Create database tables (users, kbli_mapping)');
  console.log('2. Seed 5 dummy users with passwords');
  console.log('3. Import 32,636 KBLI records from Excel');
  console.log('');

  const confirmed = await askQuestion('Do you want to continue? (y/n): ');

  if (!confirmed) {
    console.log('❌ Script cancelled');
    return;
  }

  try {
    // Step 1: Create tables
    await createTables();

    // Step 2: Seed users
    await seedUsers();

    // Step 3: Import KBLI data
    const importData = await askQuestion(
      '\nImport KBLI data from Excel? (This may take a few minutes) (y/n): '
    );

    if (importData) {
      await importKBLIData();
    }

    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Setup Complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test connection
    const userCount = await prisma.user.count();
    const kbliCount = await prisma.kbli_mapping.count();

    console.log('📊 Database Summary:');
    console.log(`  Users: ${userCount}`);
    console.log(`  KBLI Records: ${kbliCount}`);
    console.log('');

    console.log('🌐 API Endpoints:');
    console.log('  Swagger UI: http://localhost:3000/api-docs');
    console.log('  Auth Login: http://localhost:3000/api/auth/login');
    console.log('  KBLI List:  http://localhost:3000/api/kbli');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error during setup:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

main();
