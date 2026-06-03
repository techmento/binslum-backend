const prisma = require('../../config/database');
const { INCOME_TYPES } = require('../../config/constants');

const createIncome = async (incomeData) => {
  const { shipId, type, amount, date, description, createdBy } = incomeData;

  // Verify ship exists
  const ship = await prisma.ship.findUnique({
    where: { id: shipId },
  });

  if (!ship) {
    const error = new Error('Ship not found');
    error.statusCode = 404;
    throw error;
  }

  // Validate income type
  if (!Object.values(INCOME_TYPES).includes(type)) {
    const error = new Error('Invalid income type');
    error.statusCode = 400;
    throw error;
  }

  const income = await prisma.incomeRecord.create({
    data: {
      shipId,
      type,
      amount,
      date: new Date(date),
      description,
      createdBy,
    },
    include: {
      ship: {
        select: {
          id: true,
          name: true,
          registrationNumber: true,
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

  return income;
};

const getIncomes = async (query) => {
  const whereClause = {};

  if (query.shipId) {
    whereClause.shipId = query.shipId;
  }

  if (query.type) {
    whereClause.type = query.type;
  }

  if (query.startDate || query.endDate) {
    whereClause.date = {};
    if (query.startDate) whereClause.date.gte = new Date(query.startDate);
    if (query.endDate) whereClause.date.lte = new Date(query.endDate);
  }

  const total = await prisma.incomeRecord.count({ where: whereClause });

  const incomes = await prisma.incomeRecord.findMany({
    where: whereClause,
    include: {
      ship: {
        select: {
          id: true,
          name: true,
          registrationNumber: true,
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
    take: query.limit,
    skip: query.skip,
  });

  return { incomes, total };
};

const getIncomeById = async (incomeId) => {
  const income = await prisma.incomeRecord.findUnique({
    where: { id: incomeId },
    include: {
      ship: {
        select: {
          id: true,
          name: true,
          registrationNumber: true,
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

  if (!income) {
    const error = new Error('Income record not found');
    error.statusCode = 404;
    throw error;
  }

  return income;
};

const updateIncome = async (incomeId, updateData, userId) => {
  const existingIncome = await prisma.incomeRecord.findUnique({
    where: { id: incomeId },
  });

  if (!existingIncome) {
    const error = new Error('Income record not found');
    error.statusCode = 404;
    throw error;
  }

  const { type, amount, date, description } = updateData;

  // Validate income type if provided
  if (type && !Object.values(INCOME_TYPES).includes(type)) {
    const error = new Error('Invalid income type');
    error.statusCode = 400;
    throw error;
  }

  const income = await prisma.incomeRecord.update({
    where: { id: incomeId },
    data: {
      ...(type && { type }),
      ...(amount && { amount }),
      ...(date && { date: new Date(date) }),
      ...(description !== undefined && { description }),
    },
    include: {
      ship: {
        select: {
          id: true,
          name: true,
          registrationNumber: true,
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

  return income;
};

const deleteIncome = async (incomeId, userId) => {
  const existingIncome = await prisma.incomeRecord.findUnique({
    where: { id: incomeId },
  });

  if (!existingIncome) {
    const error = new Error('Income record not found');
    error.statusCode = 404;
    throw error;
  }

  await prisma.incomeRecord.delete({
    where: { id: incomeId },
  });
};

const getIncomeTypes = async () => {
  return Object.values(INCOME_TYPES);
};

const getIncomeSummary = async (query) => {
  const whereClause = {};

  if (query.shipId) {
    whereClause.shipId = query.shipId;
  }

  if (query.startDate || query.endDate) {
    whereClause.date = {};
    if (query.startDate) whereClause.date.gte = new Date(query.startDate);
    if (query.endDate) whereClause.date.lte = new Date(query.endDate);
  }

  const summary = await prisma.incomeRecord.groupBy({
    by: ['type'],
    where: whereClause,
    _sum: {
      amount: true,
    },
    _count: true,
  });

  const total = await prisma.incomeRecord.aggregate({
    where: whereClause,
    _sum: {
      amount: true,
    },
  });

  return {
    summary: summary.map(item => ({
      type: item.type,
      count: item._count,
      totalAmount: item._sum.amount || 0,
    })),
    totalAmount: total._sum.amount || 0,
  };
};

module.exports = {
  createIncome,
  getIncomes,
  getIncomeById,
  updateIncome,
  deleteIncome,
  getIncomeTypes,
  getIncomeSummary,
};