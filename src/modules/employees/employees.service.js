const prisma = require('../../config/database');

const empInclude = {
  ship: { select: { id: true, name: true, registrationNumber: true } },
  documents: { orderBy: { createdAt: 'desc' } },
};

const createEmployee = async (employeeData) => {
  const { shipId, name, role, phone, baseSalary, allowances = 0, deductions = 0, taxRate = 0 } = employeeData;

  // Verify ship exists if provided
  if (shipId) {
    const ship = await prisma.ship.findUnique({ where: { id: shipId } });
    if (!ship) {
      const error = new Error('Ship not found');
      error.statusCode = 404;
      throw error;
    }
  }

  const employee = await prisma.employee.create({
    data: { shipId: shipId || null, name, role, phone: phone || null, baseSalary, allowances, deductions, taxRate, isActive: true },
    include: empInclude,
  });

  return employee;
};

const getEmployees = async (query) => {
  const whereClause = { isActive: true };

  if (query.shipId === 'OFFICE') {
    whereClause.shipId = null;
  } else if (query.shipId) {
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
    include: empInclude,
    orderBy: { createdAt: 'desc' },
    take: query.limit,
    skip: query.skip,
  });

  return { employees, total };
};

const getEmployeeById = async (employeeId) => {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: empInclude,
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
    const ship = await prisma.ship.findUnique({ where: { id: updateData.shipId } });
    if (!ship) {
      const error = new Error('Ship not found');
      error.statusCode = 404;
      throw error;
    }
  }

  const employee = await prisma.employee.update({
    where: { id: employeeId },
    data: {
      ...(updateData.shipId !== undefined && { shipId: updateData.shipId || null }),
      ...(updateData.name      !== undefined && { name: updateData.name }),
      ...(updateData.role      !== undefined && { role: updateData.role }),
      ...(updateData.phone     !== undefined && { phone: updateData.phone || null }),
      ...(updateData.baseSalary !== undefined && { baseSalary: updateData.baseSalary }),
      ...(updateData.allowances !== undefined && { allowances: updateData.allowances }),
      ...(updateData.deductions !== undefined && { deductions: updateData.deductions }),
      ...(updateData.taxRate    !== undefined && { taxRate: updateData.taxRate }),
      ...(updateData.isActive   !== undefined && { isActive: updateData.isActive }),
    },
    include: empInclude,
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

const addDocument = async (employeeId, { name, fileUrl, fileType, fileSize, uploadedBy }) => {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) throw Object.assign(new Error('Employee not found'), { statusCode: 404 });

  return prisma.employeeDocument.create({
    data: { employeeId, name, fileUrl, fileType: fileType || null, fileSize: fileSize || null, uploadedBy },
  });
};

const deleteDocument = async (documentId) => {
  const doc = await prisma.employeeDocument.findUnique({ where: { id: documentId } });
  if (!doc) throw Object.assign(new Error('Document not found'), { statusCode: 404 });
  await prisma.employeeDocument.delete({ where: { id: documentId } });
};

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getEmployeesByShip,
  addDocument,
  deleteDocument,
};