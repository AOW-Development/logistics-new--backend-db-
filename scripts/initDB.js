// scripts/initDB.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const env = require('../Config/env.js');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database initialization...');

  // Check if admin already exists
  const existingAdmin = await prisma.admin.findFirst();
  
  if (existingAdmin) {
    console.log('Admin already exists, skipping creation.');
    return;
  }

  // Create initial admin
  const hashedPassword = await bcrypt.hash(env.ADMIN_PASSWORD, 12);
  
  await prisma.admin.create({
    data: {
      username: env.ADMIN_USERNAME,
      email: env.ADMIN_EMAIL,
      password: hashedPassword,
      role: 'super_admin'
    }
  });

  console.log('Initial admin created successfully:');
  console.log(`Username: ${env.ADMIN_USERNAME}`);
  console.log(`Password: ${env.ADMIN_PASSWORD}`);
  console.log('Please change the password after first login!');
}

main()
  .catch((e) => {
    console.error('Error during database initialization:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });