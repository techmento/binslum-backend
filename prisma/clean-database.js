const { PrismaClient } = require('@prisma/client');
const bcryptjs = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Starting database cleanup...');

  try {
    // Delete in reverse order of dependencies
    console.log('Deleting PayrollEntry records...');
    await prisma.payrollEntry.deleteMany({});

    console.log('Deleting Payroll records...');
    await prisma.payroll.deleteMany({});

    console.log('Deleting ExpenseRecord records...');
    await prisma.expenseRecord.deleteMany({});

    console.log('Deleting LoanPayment records...');
    await prisma.loanPayment.deleteMany({});

    console.log('Deleting Loan records...');
    await prisma.loan.deleteMany({});

    console.log('Deleting IncomeRecord records...');
    await prisma.incomeRecord.deleteMany({});

    console.log('Deleting Employee records...');
    await prisma.employee.deleteMany({});

    console.log('Deleting Ship records...');
    await prisma.ship.deleteMany({});

    console.log('Deleting non-admin User records...');
    await prisma.user.deleteMany({
      where: {
        email: {
          not: 'admin@ffms.com',
        },
      },
    });

    // Ensure admin user exists with default credentials
    console.log('Setting up admin user...');
    const hashedPassword = await bcryptjs.hash('Admin@123', 12);

    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@ffms.com' },
      update: {
        name: 'System Administrator',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      },
      create: {
        name: 'System Administrator',
        email: 'admin@ffms.com',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      },
    });

    console.log('✅ Database cleaned successfully!');
    console.log('📝 Admin credentials:');
    console.log(`   Email: ${adminUser.email}`);
    console.log('   Password: Admin@123');
  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
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
