const { PrismaClient } = require('@prisma/client');
const bcryptjs = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  try {
    // Create default ADMIN user
    const hashedPassword = await bcryptjs.hash('Admin@123', 12);
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@ffms.com' },
      update: {},
      create: {
        name: 'System Administrator',
        email: 'admin@ffms.com',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      },
    });

    console.log('✅ Admin user created:', adminUser.email);

    // Create sample ship 1
    const ship1 = await prisma.ship.upsert({
      where: { registrationNumber: 'IMO-2024-001' },
      update: {},
      create: {
        name: 'Mariner Express',
        registrationNumber: 'IMO-2024-001',
        status: 'ACTIVE',
        description: 'Container ship for international cargo transport',
      },
    });

    console.log('✅ Ship 1 created:', ship1.name);

    // Create sample ship 2
    const ship2 = await prisma.ship.upsert({
      where: { registrationNumber: 'IMO-2024-002' },
      update: {},
      create: {
        name: 'Ocean Navigator',
        registrationNumber: 'IMO-2024-002',
        status: 'ACTIVE',
        description: 'General cargo vessel for regional routes',
      },
    });

    console.log('✅ Ship 2 created:', ship2.name);

    // Create sample employees
    const employee1 = await prisma.employee.create({
      data: {
        shipId: ship1.id,
        name: 'Captain John Smith',
        role: 'Captain',
        baseSalary: 8000,
        isActive: true,
      },
    });

    console.log('✅ Employee 1 created:', employee1.name);

    const employee2 = await prisma.employee.create({
      data: {
        shipId: ship1.id,
        name: 'Chief Engineer Mike Johnson',
        role: 'Chief Engineer',
        baseSalary: 6500,
        isActive: true,
      },
    });

    console.log('✅ Employee 2 created:', employee2.name);

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  });
