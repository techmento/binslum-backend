const prisma = require('../../config/database');

const createPayroll = async (payrollData, userId) => {
  const { periodStart, periodEnd, notes } = payrollData;

  // Get all active employees
  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    include: { ship: true },
  });

  // Calculate payroll entries
  const entries = employees.map(employee => {
    const grossPay = employee.baseSalary + employee.allowances - employee.deductions;
    const taxAmount = grossPay * (employee.taxRate / 100);
    const netPay = grossPay - taxAmount;

    return {
      employeeId: employee.id,
      baseSalary: employee.baseSalary,
      allowances: employee.allowances,
      deductions: employee.deductions,
      taxAmount,
      grossPay,
      netPay,
    };
  });

  // Calculate totals
  const totalGross = entries.reduce((sum, entry) => sum + entry.grossPay, 0);
  const totalDeductions = entries.reduce((sum, entry) => sum + entry.deductions + entry.taxAmount, 0);
  const totalNet = entries.reduce((sum, entry) => sum + entry.netPay, 0);

  // Create payroll with entries in transaction
  const payroll = await prisma.$transaction(async (tx) => {
    const payroll = await tx.payroll.create({
      data: {
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        totalGross,
        totalDeductions,
        totalNet,
        notes,
        createdBy: userId,
        entries: {
          create: entries,
        },
      },
      include: {
        entries: {
          include: {
            employee: {
              include: {
                ship: true,
              },
            },
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return payroll;
  });

  return payroll;
};

const getPayrolls = async (query) => {
  const whereClause = {};

  if (query.status) {
    whereClause.status = query.status;
  }

  const total = await prisma.payroll.count({ where: whereClause });

  const payrolls = await prisma.payroll.findMany({
    where: whereClause,
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          entries: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: query.limit,
    skip: query.skip,
  });

  return { payrolls, total };
};

const getPayrollById = async (payrollId) => {
  const payroll = await prisma.payroll.findUnique({
    where: { id: payrollId },
    include: {
      entries: {
        include: {
          employee: {
            include: {
              ship: true,
            },
          },
        },
        orderBy: {
          employee: {
            name: 'asc',
          },
        },
      },
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!payroll) {
    const error = new Error('Payroll not found');
    error.statusCode = 404;
    throw error;
  }

  return payroll;
};

const updatePayroll = async (payrollId, updateData, userId) => {
  const existingPayroll = await prisma.payroll.findUnique({
    where: { id: payrollId },
  });

  if (!existingPayroll) {
    const error = new Error('Payroll not found');
    error.statusCode = 404;
    throw error;
  }

  if (existingPayroll.status !== 'DRAFT') {
    const error = new Error('Only draft payrolls can be updated');
    error.statusCode = 400;
    throw error;
  }

  const { notes } = updateData;

  const payroll = await prisma.payroll.update({
    where: { id: payrollId },
    data: {
      ...(notes !== undefined && { notes }),
    },
    include: {
      entries: {
        include: {
          employee: {
            include: {
              ship: true,
            },
          },
        },
      },
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return payroll;
};

const processPayroll = async (payrollId, userId) => {
  const payroll = await prisma.payroll.findUnique({
    where: { id: payrollId },
    include: {
      entries: {
        include: {
          employee: true,
        },
      },
    },
  });

  if (!payroll) {
    const error = new Error('Payroll not found');
    error.statusCode = 404;
    throw error;
  }

  if (payroll.status !== 'DRAFT') {
    const error = new Error('Payroll is already processed');
    error.statusCode = 400;
    throw error;
  }

  // Process payroll: create expense records for each entry
  await prisma.$transaction(async (tx) => {
    // Update payroll status
    await tx.payroll.update({
      where: { id: payrollId },
      data: { status: 'PROCESSED' },
    });

    // Create expense records for each payroll entry
    for (const entry of payroll.entries) {
      await tx.expenseRecord.create({
        data: {
          shipId: entry.employee.shipId,
          category: 'SALARY',
          amount: entry.netPay,
          date: payroll.periodEnd,
          paymentMethod: 'BANK_TRANSFER', // Default payment method
          description: `Salary payment for ${entry.employee.name} - ${payroll.periodStart.toISOString().split('T')[0]} to ${payroll.periodEnd.toISOString().split('T')[0]}`,
          employeeId: entry.employeeId,
          createdBy: userId,
        },
      });
    }
  });

  // Return updated payroll
  return getPayrollById(payrollId);
};

const deletePayroll = async (payrollId, userId) => {
  const existingPayroll = await prisma.payroll.findUnique({
    where: { id: payrollId },
  });

  if (!existingPayroll) {
    const error = new Error('Payroll not found');
    error.statusCode = 404;
    throw error;
  }

  if (existingPayroll.status !== 'DRAFT') {
    const error = new Error('Only draft payrolls can be deleted');
    error.statusCode = 400;
    throw error;
  }

  await prisma.payroll.delete({
    where: { id: payrollId },
  });
};

module.exports = {
  createPayroll,
  getPayrolls,
  getPayrollById,
  updatePayroll,
  processPayroll,
  deletePayroll,
};