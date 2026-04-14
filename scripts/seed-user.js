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
  const username = 'testuser';
  const password = 'password123';

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.log(`User "${username}" already exists.`);
    await prisma.$disconnect();
    await pool.end();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username,
      password_hash: passwordHash,
      is_active: true,
    },
  });

  console.log(`\n✅ Dummy user created successfully!`);
  console.log(`   Username: ${username}`);
  console.log(`   Password: ${password}`);
  console.log(`   User ID: ${user.id}\n`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
