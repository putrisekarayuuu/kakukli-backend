const xlsx = require('xlsx');
const fs = require('fs');

const workbook = xlsx.readFile(
  'D:/BPS_2101/PENGOLAHAN/kakukli-data/laskarbps_user_organik_list_with_password.xlsx'
);

const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(sheet);

console.log(`Found ${rows.length} rows`);

const values = rows.map((row) => {
  const username = String(row.username || '').replace(/'/g, "''");
  const passwordHash = String(row.password_hash || '').replace(/'/g, "''");

  return `('${username}', '${passwordHash}')`;
});

const sql = `INSERT INTO users (username, password_hash)
VALUES
${values.join(',\n')};`;

fs.writeFileSync('users_organik.txt', sql, 'utf8');

console.log(`✅ Generated ${rows.length} rows into users_organik.txt`);