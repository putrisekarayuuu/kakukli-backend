const XLSX = require("xlsx");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

function generatePassword(length = 16) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";

  let password = "";

  for (let i = 0; i < length; i++) {
    password += chars[
      crypto.randomInt(chars.length)
    ];
  }

  return password;
}

async function main() {
  const workbook = XLSX.readFile(
    "D:/BPS_2101/PENGOLAHAN/kakukli-data/laskarbps_user_list.xlsx"
  );

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);

  const result = [];

  for (const row of data) {
    const password = generatePassword();

    const password_hash = await bcrypt.hash(
      password,
      10
    );

    result.push({
      ...row,
      password,
      password_hash,
      is_active: true,
    });
  }

  const newSheet = XLSX.utils.json_to_sheet(result);

  const newWorkbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    newWorkbook,
    newSheet,
    "Users"
  );

  XLSX.writeFile(
    newWorkbook,
    "D:/BPS_2101/PENGOLAHAN/kakukli-data/laskarbps_user_list_with_password.xlsx"
  );

  console.log(
    `✅ Berhasil generate ${result.length} user`
  );
}

main().catch(console.error);