const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Configuration
const EXCEL_FILE = path.join(__dirname, '..', 'Hasil_Mapping_Korespondensi_KBLI_2025.xlsx');
const OUTPUT_SQL = path.join(__dirname, '..', 'import_kbli_data.sql');
const TABLE_NAME = 'kbli_mapping'; // Change to your actual table name

/**
 * Read Excel file and generate SQL insert script
 */
function excelToSQL() {
  console.log('Reading Excel file...');
  
  // Read the Excel file
  const workbook = XLSX.readFile(EXCEL_FILE);
  const sheetName = workbook.SheetNames[0]; // Get first sheet
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  if (data.length === 0) {
    console.log('No data found in Excel file');
    return;
  }

  console.log(`Found ${data.length} rows (including header)`);
  
  // First row is header
  const headers = data[0];
  console.log('Headers:', headers);
  
  // Data rows (skip header row)
  const rows = data.slice(1);
  
  // Generate SQL
  let sql = `-- KBLI Mapping Data Import Script
-- Generated on: ${new Date().toISOString()}
-- Table: ${TABLE_NAME}

`;

  // Optional: Add DROP and CREATE table statement
  sql += `-- If you need to create the table first, uncomment the following:
/*
CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
    id SERIAL PRIMARY KEY,
${headers.map((h, i) => `    ${sanitizeColumnName(h)} TEXT`).join(',\n')},
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
*/

`;

  // Start transaction
  sql += `BEGIN TRANSACTION;

`;

  // Clear existing data (optional, comment out if not needed)
  sql += `-- Uncomment to clear existing data:
-- DELETE FROM ${TABLE_NAME};

`;

  // Generate INSERT statements
  let insertCount = 0;
  
  rows.forEach((row, index) => {
    // Skip empty rows
    if (row.length === 0 || row.every(cell => cell === null || cell === undefined || cell === '')) {
      return;
    }

    // Prepare values
    const values = row.map(cell => {
      if (cell === null || cell === undefined) {
        return 'NULL';
      }
      // Escape single quotes and wrap in quotes
      const escaped = String(cell).replace(/'/g, "''");
      return `'${escaped}'`;
    });

    // Pad values if row has fewer columns than headers
    while (values.length < headers.length) {
      values.push('NULL');
    }

    // Get column names
    const columns = headers.map(h => sanitizeColumnName(h));

    // Generate INSERT statement
    sql += `INSERT INTO ${TABLE_NAME} (${columns.join(', ')})
VALUES (${values.join(', ')});

`;

    insertCount++;
  });

  // Commit transaction
  sql += `COMMIT;

-- Import completed successfully
-- Total rows inserted: ${insertCount}
`;

  // Write SQL file
  fs.writeFileSync(OUTPUT_SQL, sql, 'utf8');
  
  console.log(`\n✅ SQL script generated successfully!`);
  console.log(`📁 Output file: ${OUTPUT_SQL}`);
  console.log(`📊 Total rows to insert: ${insertCount}`);
  console.log(`\nNext steps:`);
  console.log(`1. Review the generated SQL file: ${OUTPUT_SQL}`);
  console.log(`2. Update the table name and column types if needed`);
  console.log(`3. Run the SQL script on your database:`);
  console.log(`   psql -U <username> -d <database> -f ${OUTPUT_SQL}`);
}

/**
 * Sanitize column name to be SQL-safe
 */
function sanitizeColumnName(columnName) {
  if (!columnName) return 'column';
  
  return String(columnName)
    .trim()
    .replace(/\s+/g, '_')           // Replace spaces with underscores
    .replace(/[^a-zA-Z0-9_]/g, '')  // Remove special characters
    .toLowerCase();                  // Convert to lowercase
}

/**
 * Alternative: Generate a Node.js script that inserts data directly via Prisma
 */
function generatePrismaScript() {
  console.log('Reading Excel file for Prisma import...');
  
  const workbook = XLSX.readFile(EXCEL_FILE);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(`Found ${data.length} rows`);
  
  // Generate Prisma import script
  const prismaScript = `
// import_kbli_data.js
// Run with: node import_kbli_data.js

const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();

async function importData() {
  console.log('Starting KBLI data import...');
  
  // Read Excel file
  const workbook = XLSX.readFile(path.join(__dirname, 'Hasil_Mapping_Korespondensi_KBLI_2025.xlsx'));
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(\`Found \${data.length} rows to import\`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const row of data) {
    try {
      // TODO: Update this to match your Prisma model
      await prisma.${TABLE_NAME}.create({
        data: {
${Object.keys(data[0] || {}).map(key => `          ${sanitizeColumnName(key)}: row['${key}'],`).join('\n')}
        }
      });
      successCount++;
    } catch (error) {
      console.error(\`Error inserting row: \${error.message}\`);
      errorCount++;
    }
  }
  
  console.log(\`\\nImport completed!\`);
  console.log(\`✓ Success: \${successCount} rows\`);
  console.log(\`✗ Errors: \${errorCount} rows\`);
  
  await prisma.\$disconnect();
}

importData()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
`;

  const outputFile = path.join(__dirname, 'import_kbli_data.js');
  fs.writeFileSync(outputFile, prismaScript, 'utf8');
  
  console.log(`\n✅ Prisma import script generated: ${outputFile}`);
  console.log('\n⚠️  Before running, update the Prisma model name and fields in the script!');
}

// Run the conversion
try {
  excelToSQL();
  
  // Uncomment to also generate Prisma script:
  // generatePrismaScript();
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
