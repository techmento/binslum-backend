const prisma = require('../../config/database');
const { SHIP_STATUS } = require('../../config/constants');

const createShip = async (shipData) => {
  const { name, registrationNumber, status, description } = shipData;

  // Check if registration number already exists
  const existingShip = await prisma.ship.findUnique({
    where: { registrationNumber },
  });

  if (existingShip) {
    const error = new Error('Ship with this registration number already exists');
    error.statusCode = 409;
    throw error;
  }

  const ship = await prisma.ship.create({
    data: {
      name,
      registrationNumber,
      status: status || SHIP_STATUS.ACTIVE,
      description,
    },
  });

  return ship;
};

const getAllShips = async (query) => {
  const whereClause = {};

  if (query.status) {
    whereClause.status = query.status;
  }

  if (query.search) {
    whereClause.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { registrationNumber: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const total = await prisma.ship.count({ where: whereClause });

  const ships = await prisma.ship.findMany({
    where: whereClause,
    include: {
      _count: {
        select: {
          employees: true,
          incomeRecords: true,
          expenseRecords: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: query.limit,
    skip: query.skip,
  });

  return { ships, total };
};

const getShipById = async (shipId) => {
  const ship = await prisma.ship.findUnique({
    where: { id: shipId },
    include: {
      employees: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          role: true,
          baseSalary: true,
        },
      },
      _count: {
        select: {
          incomeRecords: true,
          expenseRecords: true,
        },
      },
    },
  });

  if (!ship) {
    const error = new Error('Ship not found');
    error.statusCode = 404;
    throw error;
  }

  return ship;
};

const updateShip = async (shipId, updateData) => {
  const existingShip = await prisma.ship.findUnique({
    where: { id: shipId },
  });

  if (!existingShip) {
    const error = new Error('Ship not found');
    error.statusCode = 404;
    throw error;
  }

  // Check registration number uniqueness if being updated
  if (updateData.registrationNumber && updateData.registrationNumber !== existingShip.registrationNumber) {
    const duplicateShip = await prisma.ship.findUnique({
      where: { registrationNumber: updateData.registrationNumber },
    });

    if (duplicateShip) {
      const error = new Error('Ship with this registration number already exists');
      error.statusCode = 409;
      throw error;
    }
  }

  const ship = await prisma.ship.update({
    where: { id: shipId },
    data: {
      name: updateData.name,
      registrationNumber: updateData.registrationNumber,
      status: updateData.status,
      description: updateData.description,
    },
  });

  return ship;
};

const deleteShip = async (shipId) => {
  const existingShip = await prisma.ship.findUnique({
    where: { id: shipId },
    include: {
      _count: {
        select: {
          employees: true,
          incomeRecords: true,
          expenseRecords: true,
        },
      },
    },
  });

  if (!existingShip) {
    const error = new Error('Ship not found');
    error.statusCode = 404;
    throw error;
  }

  // Check if ship has associated records
  if (existingShip._count.employees > 0 || existingShip._count.incomeRecords > 0 || existingShip._count.expenseRecords > 0) {
    const error = new Error('Cannot delete ship with associated records. Deactivate it instead.');
    error.statusCode = 400;
    throw error;
  }

  await prisma.ship.delete({
    where: { id: shipId },
  });
};

const getShipStats = async (shipId) => {
  const ship = await prisma.ship.findUnique({
    where: { id: shipId },
    include: {
      _count: {
        select: {
          employees: true,
          incomeRecords: true,
          expenseRecords: true,
        },
      },
    },
  });

  if (!ship) {
    const error = new Error('Ship not found');
    error.statusCode = 404;
    throw error;
  }

  // Calculate total income and expenses for the ship
  const incomeResult = await prisma.incomeRecord.aggregate({
    where: { shipId },
    _sum: { amount: true },
  });

  const expenseResult = await prisma.expenseRecord.aggregate({
    where: { shipId },
    _sum: { amount: true },
  });

  const totalIncome = incomeResult._sum.amount || 0;
  const totalExpenses = expenseResult._sum.amount || 0;
  const profit = totalIncome - totalExpenses;

  return {
    ship: {
      id: ship.id,
      name: ship.name,
      registrationNumber: ship.registrationNumber,
      status: ship.status,
    },
    stats: {
      totalEmployees: ship._count.employees,
      totalIncomeRecords: ship._count.incomeRecords,
      totalExpenseRecords: ship._count.expenseRecords,
      totalIncome,
      totalExpenses,
      profit,
    },
  };
};

module.exports = {
  createShip,
  getAllShips,
  getShipById,
  updateShip,
  deleteShip,
  getShipStats,
};