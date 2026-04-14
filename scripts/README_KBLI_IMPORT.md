# KBLI Data Import Guide

This guide explains how to import KBLI mapping data from Excel to your PostgreSQL database.

## Files Created

1. **`scripts/generate_kbli_import.js`** - Generates SQL script from Excel
2. **`scripts/import_kbli_prisma.js`** - Direct import via Prisma (Recommended)
3. **`import_kbli_data.sql`** - Generated SQL insert script (32,636 rows)
4. **`prisma/schema.prisma`** - Updated with KbliMapping model

## Method 1: Direct Import via Prisma (Recommended)

### Step 1: Update Database Schema

The Prisma schema has been updated with the `KbliMapping` model. Apply it to your database:

```bash
# Generate Prisma client
npx prisma generate

# Create and run migration
npx prisma migrate dev --name add_kbli_mapping_table
```

### Step 2: Run the Import Script

```bash
node scripts/import_kbli_prisma.js
```

The script will:
- Read the Excel file automatically
- Show you the total rows to import
- Ask for confirmation
- Import data in batches of 100 for better performance
- Show success/error counts

**Features:**
- ✅ Batch processing for large datasets
- ✅ Error handling and retry logic
- ✅ Progress indicators
- ✅ User confirmation before import
- ✅ Detailed statistics after import

## Method 2: SQL Script Import

### Step 1: Generate SQL Script (Already Done)

```bash
node scripts/generate_kbli_import.js
```

This creates `import_kbli_data.sql` with all 32,636 INSERT statements.

### Step 2: Review and Customize SQL

Open `import_kbli_data.sql` and:
1. Update the table name if needed (currently `kbli_mapping`)
2. Adjust column types if necessary (currently all TEXT)
3. Decide whether to clear existing data (DELETE statement is commented out)

### Step 3: Create the Table

Uncomment and run the CREATE TABLE statement at the top of the SQL file:

```sql
CREATE TABLE IF NOT EXISTS kbli_mapping (
    id SERIAL PRIMARY KEY,
    nama_usaha TEXT,
    status_perusahaan TEXT,
    status_hasil_gc TEXT,
    kbli_2020 TEXT,
    kbli_2025 TEXT,
    korespondensi TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Step 4: Run the SQL Script

**Using psql (PostgreSQL CLI):**
```bash
psql -U your_username -d your_database -f import_kbli_data.sql
```

**Using Docker:**
```bash
docker exec -i your_postgres_container psql -U postgres -d your_database < import_kbli_data.sql
```

**Using pgAdmin:**
1. Open pgAdmin and connect to your database
2. Open Query Tool
3. Load `import_kbli_data.sql`
4. Execute the script

## Data Structure

The Excel file contains 32,636 rows with the following columns:

| Column | Description | Example |
|--------|-------------|---------|
| Nama Usaha | Business name | "POSYANDU CEMARA 2 KAMPUNG TENGAH" |
| Status Perusahaan | Company status | "Aktif" |
| Status Hasil GC | GC result status | "1. Ditemukan" |
| KBLI 2020 | KBLI code 2020 | "86903" |
| KBLI 2025 | KBLI code 2025 | "86910" |
| Korespondensi | Correspondence type | "one-to-many" |

## Sample Data

```
Nama Usaha: POSYANDU CEMARA 2 KAMPUNG TENGAH
Status Perusahaan: Aktif
Status Hasil GC: 1. Ditemukan
KBLI 2020: 86903
KBLI 2025: 86910
Korespondensi: one-to-many
```

## After Import

### Verify the Import

```sql
-- Check total count
SELECT COUNT(*) FROM kbli_mapping;

-- View sample data
SELECT * FROM kbli_mapping LIMIT 10;

-- Statistics by correspondence type
SELECT korespondensi, COUNT(*) as total
FROM kbli_mapping
GROUP BY korespondensi
ORDER BY total DESC;

-- Statistics by KBLI 2020
SELECT kbli_2020, COUNT(*) as total
FROM kbli_mapping
GROUP BY kbli_2020
ORDER BY total DESC
LIMIT 20;
```

### Add Indexes for Performance

```sql
CREATE INDEX idx_kbli_2020 ON kbli_mapping(kbli_2020);
CREATE INDEX idx_kbli_2025 ON kbli_mapping(kbli_2025);
CREATE INDEX idx_korespondensi ON kbli_mapping(korespondensi);
```

### Add API Endpoints (Optional)

Create `src/routes/kbli.js`:

```javascript
const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');

/**
 * @swagger
 * /api/kbli:
 *   get:
 *     summary: Get KBLI mappings
 *     tags: [KBLI]
 *     parameters:
 *       - in: query
 *         name: kbli_2020
 *         schema:
 *           type: string
 *         description: Filter by KBLI 2020 code
 *       - in: query
 *         name: korespondensi
 *         schema:
 *           type: string
 *         description: Filter by correspondence type
 *     responses:
 *       200:
 *         description: List of KBLI mappings
 */
router.get('/', async (req, res) => {
  const { kbli_2020, korespondensi, limit = 100, offset = 0 } = req.query;

  const where = {};
  if (kbli_2020) where.kbli_2020 = kbli_2020;
  if (korespondensi) where.korespondensi = korespondensi;

  const data = await prisma.kbli_mapping.findMany({
    where,
    take: parseInt(limit),
    skip: parseInt(offset),
    orderBy: { id: 'asc' },
  });

  const total = await prisma.kbli_mapping.count({ where });

  res.json({ data, total, limit: parseInt(limit), offset: parseInt(offset) });
});

module.exports = router;
```

Add to `src/index.js`:

```javascript
const kbliRoutes = require('./routes/kbli');
app.use('/api/kbli', kbliRoutes);
```

## Troubleshooting

### Error: Table does not exist
- Run the migration: `npx prisma migrate dev`
- Or manually create the table using the SQL in the generated file

### Error: Unique constraint violation
- Check for duplicate data in the Excel file
- The import script handles this by inserting row-by-row on error

### Error: Connection timeout
- Check your DATABASE_URL in .env
- Ensure PostgreSQL is running and accessible

### Import is slow
- The script uses batch processing (100 rows per batch)
- For faster import, increase batch size or use direct SQL method
- Consider removing indexes during import, then adding them after

## Need to Re-import?

**Option 1: Delete and re-import**
```sql
DELETE FROM kbli_mapping;
-- Then run import again
```

**Option 2: Truncate (faster for large tables)**
```sql
TRUNCATE TABLE kbli_mapping RESTART IDENTITY;
```

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL COPY Command](https://www.postgresql.org/docs/current/sql-copy.html) (for CSV imports)
- [XLSX Library Documentation](https://github.com/SheetJS/sheetjs)
