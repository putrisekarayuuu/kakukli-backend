require('dotenv').config();

const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = 'password123';
  const passwordHash = await bcrypt.hash(password, 10);

  for (let i = 1; i <= 10; i++) {
    const username = `dummymitra${i}`;

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      console.log(`⚠️  User "${username}" already exists, skipping.`);
      continue;
    }

    const user = await prisma.user.create({
      data: {
        username,
        password_hash: passwordHash,
        is_active: true,
      },
    });

    console.log(`✅ Created: ${username} (ID: ${user.id})`);
  }

  console.log(`\n🔑 Password for all accounts: ${password}\n`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});