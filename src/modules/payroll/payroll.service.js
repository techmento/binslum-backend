const prisma = require('../../config/database');

const createPayroll = async (payrollData, userId) => {
  const { periodStart, periodEnd, notes } = payrollData;

  // Get all active employees
  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    include: { ship: true },
  });

  // Calculate payroll entries with proper Decimal handling
  const entries = employees.map(employee => {
    const baseSalary = parseFloat(employee.baseSalary);
    const allowances = parseFloat(employee.allowances);
    const deductions = parseFloat(employee.deductions);
    const taxRate = parseFloat(employee.taxRate);

    const grossPay = baseSalary + allowances - deductions;
    const taxAmount = grossPay * (taxRate / 100);
    const netPay = grossPay - taxAmount;

    return {
      employeeId: employee.id,
      baseSalary,
      allowances,
      deductions,
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      grossPay: parseFloat(grossPay.toFixed(2)),
      netPay: parseFloat(netPay.toFixed(2)),
    };
  });

  // Calculate totals
  const totalGross = parseFloat(entries.reduce((sum, entry) => sum + entry.grossPay, 0).toFixed(2));
  const totalDeductions = parseFloat(entries.reduce((sum, entry) => sum + entry.deductions + entry.taxAmount, 0).toFixed(2));
  const totalNet = parseFloat(entries.reduce((sum, entry) => sum + entry.netPay, 0).toFixed(2));

  try {
    // Create payroll
    const createdPayroll = await prisma.payroll.create({
      data: {
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        totalGross,
        totalDeductions,
        totalNet,
        notes: notes || null,
        createdBy: userId,
      },
    });

    // Create payroll entries
    if (entries.length > 0) {
      await prisma.payrollEntry.createMany({
        data: entries.map(entry => ({
          payrollId: createdPayroll.id,
          ...entry,
        })),
      });
    }

    // Fetch complete payroll with relations
    const payroll = await prisma.payroll.findUnique({
      where: { id: createdPayroll.id },
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
  } catch (error) {
    console.error('Error creating payroll:', error);
    throw error;
  }
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