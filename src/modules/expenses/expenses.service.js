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
    loanId,
    receiptUrl,
    createdBy,
    salaryMonth,
    salaryPaymentType,
  } = expenseData;

  // Validate: category must be either a default or an existing custom category
  const isDefaultCategory = Object.values(EXPENSE_CATEGORIES).includes(category);
  if (!isDefaultCategory) {
    const customCat = await prisma.customExpenseCategory.findUnique({
      where: { name: category },
    });
    if (!customCat || !customCat.isActive) {
      const error = new Error('Invalid expense category');
      error.statusCode = 400;
      throw error;
    }
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

  // If category is LOAN_REPAYMENT, loanId is required
  if (category === EXPENSE_CATEGORIES.LOAN_REPAYMENT && !loanId) {
    const error = new Error('Loan ID is required for loan repayment expenses');
    error.statusCode = 400;
    throw error;
  }

  // For LOAN_REPAYMENT: create the loan payment record on the fly, then link the expense
  if (category === EXPENSE_CATEGORIES.LOAN_REPAYMENT) {
    return await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUnique({ where: { id: loanId } });
      if (!loan) {
        const error = new Error('Loan not found');
        error.statusCode = 404;
        throw error;
      }

      // Create the loan payment record
      const loanPayment = await tx.loanPayment.create({
        data: {
          loanId,
          amountPaid: amount,
          paymentDate: new Date(date),
          notes: description || null,
          createdBy,
        },
      });

      // Update loan remaining balance (parseFloat handles Prisma Decimal → number)
      const newRemainingBalance = Math.max(0, parseFloat(loan.remainingBalance.toString()) - parseFloat(amount.toString()));
      await tx.loan.update({
        where: { id: loanId },
        data: {
          remainingBalance: newRemainingBalance,
          status: newRemainingBalance <= 0 ? 'PAID_OFF' : 'ACTIVE',
        },
      });

      // Create the expense linked to the new loan payment
      const expense = await tx.expenseRecord.create({
        data: {
          category,
          amount,
          date: new Date(date),
          paymentMethod,
          description,
          loanPaymentId: loanPayment.id,
          receiptUrl,
          createdBy,
        },
        include: {
          ship: true,
          employee: true,
          loanPayment: { include: { loan: true } },
          creator: { select: { id: true, name: true, email: true } },
        },
      });

      return expense;
    });
  }

  // Create regular expense (including custom categories)
  const expense = await prisma.expenseRecord.create({
    data: {
      ...(shipId && { shipId }),
      category,
      amount,
      date: new Date(date),
      paymentMethod,
      description,
      employeeId,
      receiptUrl,
      createdBy,
      salaryMonth: salaryMonth ? new Date(`${salaryMonth}-01`) : null,
      salaryPaymentType: salaryPaymentType || null,
    },
    include: {
      ship: true,
      employee: true,
      loanPayment: { include: { loan: true } },
      creator: { select: { id: true, name: true, email: true } },
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
      loanPayment: { include: { loan: true } },
      creator: { select: { id: true, name: true, email: true } },
    },
    orderBy: { date: 'desc' },
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
      loanPayment: { include: { loan: true } },
      creator: { select: { id: true, name: true, email: true } },
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
    salaryMonth,
    salaryPaymentType,
  } = updateData;

  // Validate category if provided — allow both default and custom
  if (category) {
    const isDefault = Object.values(EXPENSE_CATEGORIES).includes(category);
    if (!isDefault) {
      const customCat = await prisma.customExpenseCategory.findUnique({
        where: { name: category },
      });
      if (!customCat || !customCat.isActive) {
        const error = new Error('Invalid expense category');
        error.statusCode = 400;
        throw error;
      }
    }
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
      ...(salaryMonth && { salaryMonth: new Date(salaryMonth) }),
      ...(salaryPaymentType && { salaryPaymentType }),
    },
    include: {
      ship: true,
      employee: true,
      loanPayment: { include: { loan: true } },
      creator: { select: { id: true, name: true, email: true } },
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

  await prisma.expenseRecord.delete({ where: { id } });
};

const getExpenseCategories = async () => {
  const defaultCategories = Object.values(EXPENSE_CATEGORIES).map((cat) => ({
    name: cat,
    label: cat.replace(/_/g, ' '),
    isDefault: true,
  }));

  const customCategories = await prisma.customExpenseCategory.findMany({
    where: { isActive: true },
    select: {
      name: true,
      label: true,
      color: true,
      fade: true,
      border: true,
      id: true,
      isActive: true,
    },
  });

  return [...defaultCategories, ...customCategories];
};

const createCustomCategory = async (categoryData) => {
  const { name, label, color, fade, border, createdBy } = categoryData;

  if (Object.values(EXPENSE_CATEGORIES).includes(name)) {
    const error = new Error('This category name already exists as a default category');
    error.statusCode = 400;
    throw error;
  }

  const existing = await prisma.customExpenseCategory.findUnique({
    where: { name },
  });

  if (existing) {
    const error = new Error('Custom category with this name already exists');
    error.statusCode = 400;
    throw error;
  }

  const newCategory = await prisma.customExpenseCategory.create({
    data: {
      name,
      label,
      color: color || '#7C3AED',
      fade: fade || '#F5F3FF',
      border: border || '#DDD6FE',
      createdBy,
      isActive: true,
    },
  });

  return newCategory;
};

const getCustomCategories = async () => {
  return await prisma.customExpenseCategory.findMany({
    where: { isActive: true },
    include: {
      creator: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseCategories,
  createCustomCategory,
  getCustomCategories,
};