const prisma = require('../../config/database');
const { LOAN_STATUS } = require('../../config/constants');

const createLoan = async (loanData) => {
  const { bankName, totalAmount, monthlyPayment, startDate, description, createdBy } = loanData;

  const loan = await prisma.loan.create({
    data: {
      bankName,
      totalAmount,
      monthlyPayment,
      remainingBalance: totalAmount,
      startDate: new Date(startDate),
      status: LOAN_STATUS.ACTIVE,
      description,
      createdBy,
    },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      payments: {
        orderBy: {
          paymentDate: 'desc',
        },
        take: 5,
      },
      _count: {
        select: {
          payments: true,
        },
      },
    },
  });

  return loan;
};

const getLoans = async (query) => {
  const whereClause = {};

  if (query.status) {
    whereClause.status = query.status;
  }

  if (query.search) {
    whereClause.OR = [
      { bankName: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const total = await prisma.loan.count({ where: whereClause });

  const loans = await prisma.loan.findMany({
    where: whereClause,
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      payments: {
        orderBy: {
          paymentDate: 'desc',
        },
        take: 3,
      },
      _count: {
        select: {
          payments: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: query.limit,
    skip: query.skip,
  });

  return { loans, total };
};

const getLoanById = async (loanId) => {
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      payments: {
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          paymentDate: 'desc',
        },
      },
      _count: {
        select: {
          payments: true,
        },
      },
    },
  });

  if (!loan) {
    const error = new Error('Loan not found');
    error.statusCode = 404;
    throw error;
  }

  return loan;
};

const updateLoan = async (loanId, updateData, userId) => {
  const existingLoan = await prisma.loan.findUnique({
    where: { id: loanId },
  });

  if (!existingLoan) {
    const error = new Error('Loan not found');
    error.statusCode = 404;
    throw error;
  }

  const { bankName, totalAmount, monthlyPayment, startDate, description } = updateData;

  const loan = await prisma.loan.update({
    where: { id: loanId },
    data: {
      ...(bankName && { bankName }),
      ...(totalAmount && { totalAmount }),
      ...(monthlyPayment && { monthlyPayment }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(description !== undefined && { description }),
    },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      payments: {
        orderBy: {
          paymentDate: 'desc',
        },
        take: 5,
      },
      _count: {
        select: {
          payments: true,
        },
      },
    },
  });

  return loan;
};

const deleteLoan = async (loanId, userId) => {
  const existingLoan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: {
      _count: {
        select: {
          payments: true,
        },
      },
    },
  });

  if (!existingLoan) {
    const error = new Error('Loan not found');
    error.statusCode = 404;
    throw error;
  }

  // Check if loan has payments
  if (existingLoan._count.payments > 0) {
    const error = new Error('Cannot delete loan with associated payments');
    error.statusCode = 400;
    throw error;
  }

  await prisma.loan.delete({
    where: { id: loanId },
  });
};

const createLoanPayment = async (paymentData) => {
  const { loanId, amountPaid, paymentDate, notes, createdBy } = paymentData;

  // Get the loan
  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
  });

  if (!loan) {
    const error = new Error('Loan not found');
    error.statusCode = 404;
    throw error;
  }

  if (loan.status === LOAN_STATUS.PAID_OFF) {
    const error = new Error('Loan is already paid off');
    error.statusCode = 400;
    throw error;
  }

  // Use transaction to create payment and update loan balance
  const result = await prisma.$transaction(async (tx) => {
    // Create payment
    const payment = await tx.loanPayment.create({
      data: {
        loanId,
        amountPaid,
        paymentDate: new Date(paymentDate),
        notes,
        createdBy,
      },
      include: {
        loan: true,
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
    const newRemainingBalance = loan.remainingBalance - amountPaid;
    const newStatus = newRemainingBalance <= 0 ? LOAN_STATUS.PAID_OFF : LOAN_STATUS.ACTIVE;

    await tx.loan.update({
      where: { id: loanId },
      data: {
        remainingBalance: Math.max(0, newRemainingBalance),
        status: newStatus,
      },
    });

    return payment;
  });

  return result;
};

const getLoanPayments = async (loanId, query) => {
  const payments = await prisma.loanPayment.findMany({
    where: { loanId },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      paymentDate: 'desc',
    },
    take: query.limit,
    skip: query.skip,
  });

  const total = await prisma.loanPayment.count({ where: { loanId } });

  return { payments, total };
};

const getLoanSummary = async () => {
  const loans = await prisma.loan.findMany({
    where: { status: LOAN_STATUS.ACTIVE },
    select: {
      id: true,
      bankName: true,
      totalAmount: true,
      remainingBalance: true,
      monthlyPayment: true,
    },
  });

  const totalBorrowed = loans.reduce((sum, loan) => sum + loan.totalAmount, 0);
  const totalRemaining = loans.reduce((sum, loan) => sum + loan.remainingBalance, 0);
  const totalPaid = totalBorrowed - totalRemaining;

  return {
    activeLoans: loans.length,
    totalBorrowed,
    totalPaid,
    totalRemaining,
    loans: loans.map(loan => ({
      id: loan.id,
      bankName: loan.bankName,
      remainingBalance: loan.remainingBalance,
      monthlyPayment: loan.monthlyPayment,
    })),
  };
};

module.exports = {
  createLoan,
  getLoans,
  getLoanById,
  updateLoan,
  deleteLoan,
  createLoanPayment,
  getLoanPayments,
  getLoanSummary,
};