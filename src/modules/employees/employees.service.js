const prisma = require('../../config/database');

const createEmployee = async (employeeData) => {
  const { shipId, name, role, baseSalary, allowances = 0, deductions = 0, taxRate = 0 } = employeeData;

  // Verify ship exists
  const ship = await prisma.ship.findUnique({
    where: { id: shipId },
  });

  if (!ship) {
    const error = new Error('Ship not found');
    error.statusCode = 404;
    throw error;
  }

  const employee = await prisma.employee.create({
    data: {
      shipId,
      name,
      role,
      baseSalary,
      allowances,
      deductions,
      taxRate,
      isActive: true,
    },
    include: {
      ship: {
        select: {
          id: true,
          name: true,
          registrationNumber: true,
        },
      },
    },
  });

  return employee;
};

const getEmployees = async (query) => {
  const whereClause = { isActive: true };

  if (query.shipId) {
    whereClause.shipId = query.shipId;
  }

  if (query.search) {
    whereClause.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { role: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const total = await prisma.employee.count({ where: whereClause });

  const employees = await prisma.employee.findMany({
    where: whereClause,
    include: {
      ship: {
        select: {
          id: true,
          name: true,
          registrationNumber: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: query.limit,
    skip: query.skip,
  });

  return { employees, total };
};

const getEmployeeById = async (employeeId) => {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      ship: {
        select: {
          id: true,
          name: true,
          registrationNumber: true,
        },
      },
    },
  });

  if (!employee) {
    const error = new Error('Employee not found');
    error.statusCode = 404;
    throw error;
  }

  return employee;
};

const updateEmployee = async (employeeId, updateData) => {
  const existingEmployee = await prisma.employee.findUnique({
    where: { id: employeeId },
  });

  if (!existingEmployee) {
    const error = new Error('Employee not found');
    error.statusCode = 404;
    throw error;
  }

  // Verify ship exists if being updated
  if (updateData.shipId) {
    const ship = await prisma.ship.findUnique({
      where: { id: updateData.shipId },
    });

    if (!ship) {
      const error = new Error('Ship not found');
      error.statusCode = 404;
      throw error;
    }
  }

  const employee = await prisma.employee.update({
    where: { id: employeeId },
    data: {
      shipId: updateData.shipId,
      name: updateData.name,
      role: updateData.role,
      baseSalary: updateData.baseSalary,
      allowances: updateData.allowances,
      deductions: updateData.deductions,
      taxRate: updateData.taxRate,
      isActive: updateData.isActive,
    },
    include: {
      ship: {
        select: {
          id: true,
          name: true,
          registrationNumber: true,
        },
      },
    },
  });

  return employee;
};

const deleteEmployee = async (employeeId) => {
  const existingEmployee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      _count: {
        select: {
          expenseRecords: true,
        },
      },
    },
  });

  if (!existingEmployee) {
    const error = new Error('Employee not found');
    error.statusCode = 404;
    throw error;
  }

  // Check if employee has associated expense records
  if (existingEmployee._count.expenseRecords > 0) {
    const error = new Error('Cannot delete employee with associated expense records. Deactivate instead.');
    error.statusCode = 400;
    throw error;
  }

  await prisma.employee.delete({
    where: { id: employeeId },
  });
};

const getEmployeesByShip = async (shipId) => {
  const employees = await prisma.employee.findMany({
    where: {
      shipId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      role: true,
      baseSalary: true,
    },
    orderBy: { name: 'asc' },
  });

  return employees;
};

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getEmployeesByShip,
};