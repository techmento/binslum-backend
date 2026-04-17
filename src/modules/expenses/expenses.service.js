const prisma = require('../../config/database');
const { EXPENSE_CATEGORIES, PAYMENT_METHODS } = require('../../config/constants');

const createExpense = async (expenseData) => {
  const {
    shipId,
    category,
    amount,
    date,
    paymentMethod,
    description,
    employeeId,
    loanPaymentId,
    receiptUrl,
    createdBy,
  } = expenseData;

  // Validate category
  if (!Object.values(EXPENSE_CATEGORIES).includes(category)) {
    const error = new Error('Invalid expense category');
    error.statusCode = 400;
    throw error;
  }

  // Validate payment method
  if (!Object.values(PAYMENT_METHODS).includes(paymentMethod)) {
    const error = new Error('Invalid payment method');
    error.statusCode = 400;
    throw error;
  }

  // If category is SALARY, employeeId is required
  if (category === EXPENSE_CATEGORIES.SALARY && !employeeId) {
    const error = new Error('Employee ID is required for salary expenses');
    error.statusCode = 400;
    throw error;
  }

  // If category is LOAN_REPAYMENT, loanPaymentId is required
  if (category === EXPENSE_CATEGORIES.LOAN_REPAYMENT && !loanPaymentId) {
    const error = new Error('Loan payment ID is required for loan repayment expenses');
    error.statusCode = 400;
    throw error;
  }

  // Use transaction for loan repayment to update remaining balance
  if (category === EXPENSE_CATEGORIES.LOAN_REPAYMENT && loanPaymentId) {
    return await prisma.$transaction(async (tx) => {
      // Get the loan payment
      const loanPayment = await tx.loanPayment.findUnique({
        where: { id: loanPaymentId },
        include: { loan: true },
      });

      if (!loanPayment) {
        const error = new Error('Loan payment not found');
        error.statusCode = 404;
        throw error;
      }

      // Create expense record
      const expense = await tx.expenseRecord.create({
        data: {
          shipId,
          category,
          amount,
          date: new Date(date),
          paymentMethod,
          description,
          loanPaymentId,
          receiptUrl,
          createdBy,
        },
        include: {
          ship: true,
          employee: true,
          loanPayment: {
            include: {
              loan: true,
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

      // Update loan remaining balance
      const newRemainingBalance = loanPayment.loan.remainingBalance - amount;

      await tx.loan.update({
        where: { id: loanPayment.loan.id },
        data: {
          remainingBalance: newRemainingBalance,
          status: newRemainingBalance <= 0 ? 'PAID_OFF' : 'ACTIVE',
        },
      });

      return expense;
    });
  }

  // Create regular expense
  const expense = await prisma.expenseRecord.create({
    data: {
      shipId,
      category,
      amount,
      date: new Date(date),
      paymentMethod,
      description,
      employeeId,
      receiptUrl,
      createdBy,
    },
    include: {
      ship: true,
      employee: true,
      loanPayment: {
        include: {
          loan: true,
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

  return expense;
};

const getExpenses = async (filters) => {
  const {
    shipId,
    category,
    startDate,
    endDate,
    paymentMethod,
    page = 1,
    limit = 10,
  } = filters;

  const where = {};

  if (shipId) where.shipId = shipId;
  if (category) where.category = category;
  if (paymentMethod) where.paymentMethod = paymentMethod;

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const expenses = await prisma.expenseRecord.findMany({
    where,
    include: {
      ship: true,
      employee: true,
      loanPayment: {
        include: {
          loan: true,
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
    orderBy: {
      date: 'desc',
    },
    skip: (page - 1) * limit,
    take: parseInt(limit),
  });

  const total = await prisma.expenseRecord.count({ where });

  return {
    expenses,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

const getExpenseById = async (id) => {
  const expense = await prisma.expenseRecord.findUnique({
    where: { id },
    include: {
      ship: true,
      employee: true,
      loanPayment: {
        include: {
          loan: true,
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

  if (!expense) {
    const error = new Error('Expense record not found');
    error.statusCode = 404;
    throw error;
  }

  return expense;
};

const updateExpense = async (id, updateData, userId) => {
  const existingExpense = await prisma.expenseRecord.findUnique({
    where: { id },
  });

  if (!existingExpense) {
    const error = new Error('Expense record not found');
    error.statusCode = 404;
    throw error;
  }

  const {
    category,
    amount,
    date,
    paymentMethod,
    description,
    employeeId,
    receiptUrl,
  } = updateData;

  // Validate category if provided
  if (category && !Object.values(EXPENSE_CATEGORIES).includes(category)) {
    const error = new Error('Invalid expense category');
    error.statusCode = 400;
    throw error;
  }

  // Validate payment method if provided
  if (paymentMethod && !Object.values(PAYMENT_METHODS).includes(paymentMethod)) {
    const error = new Error('Invalid payment method');
    error.statusCode = 400;
    throw error;
  }

  // If category is SALARY, employeeId is required
  if (category === EXPENSE_CATEGORIES.SALARY && !employeeId) {
    const error = new Error('Employee ID is required for salary expenses');
    error.statusCode = 400;
    throw error;
  }

  const expense = await prisma.expenseRecord.update({
    where: { id },
    data: {
      ...(category && { category }),
      ...(amount && { amount }),
      ...(date && { date: new Date(date) }),
      ...(paymentMethod && { paymentMethod }),
      ...(description !== undefined && { description }),
      ...(employeeId !== undefined && { employeeId }),
      ...(receiptUrl !== undefined && { receiptUrl }),
    },
    include: {
      ship: true,
      employee: true,
      loanPayment: {
        include: {
          loan: true,
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

  return expense;
};

const deleteExpense = async (id, userId) => {
  const existingExpense = await prisma.expenseRecord.findUnique({
    where: { id },
  });

  if (!existingExpense) {
    const error = new Error('Expense record not found');
    error.statusCode = 404;
    throw error;
  }

  await prisma.expenseRecord.delete({
    where: { id },
  });
};

const getExpenseCategories = async () => {
  return Object.values(EXPENSE_CATEGORIES);
};

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseCategories,
};