const prisma = require('../../config/database');

const d = (v) => parseFloat(v?.toString() || '0');

const computeStatus = (amountPaid, netSalary) => {
  const paid = d(amountPaid);
  const net  = d(netSalary);
  if (paid <= 0)        return 'UNPAID';
  if (paid >= net)      return 'PAID';
  return 'PARTIAL';
};

const salaryRecordInclude = {
  employee: { select: { id: true, name: true, role: true, baseSalary: true, allowances: true, deductions: true, shipId: true, ship: { select: { id: true, name: true } } } },
  payments:   { orderBy: { paymentDate: 'asc' } },
  bonuses:    { orderBy: { bonusDate: 'asc' } },
  deductions: { orderBy: { createdAt: 'asc' } },
  creator:    { select: { id: true, name: true, email: true } },
};

// ── Create salary record for a month ─────────────────────────────
const createSalaryRecord = async (data) => {
  const { employeeId, salaryYear, salaryMonth, notes, createdBy } = data;

  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee)       throw Object.assign(new Error('Employee not found'), { statusCode: 404 });
  if (!employee.isActive) throw Object.assign(new Error('Employee is not active'), { statusCode: 400 });

  // Duplicate check
  const existing = await prisma.salaryRecord.findUnique({
    where: { employeeId_salaryYear_salaryMonth: { employeeId, salaryYear: parseInt(salaryYear), salaryMonth: parseInt(salaryMonth) } },
  });
  if (existing) {
    const monthName = new Date(parseInt(salaryYear), parseInt(salaryMonth) - 1).toLocaleString('en-US', { month: 'long' });
    throw Object.assign(new Error(`Salary for this employee for ${monthName} ${salaryYear} already exists.`), { statusCode: 409 });
  }

  const grossSalary = d(employee.baseSalary) + d(employee.allowances);
  const totalDeductions = d(employee.deductions);
  const netSalary = grossSalary - totalDeductions;

  const record = await prisma.salaryRecord.create({
    data: {
      employeeId,
      salaryYear:      parseInt(salaryYear),
      salaryMonth:     parseInt(salaryMonth),
      grossSalary,
      totalDeductions,
      netSalary,
      amountPaid:      0,
      status:          'UNPAID',
      notes:           notes || null,
      createdBy,
    },
    include: salaryRecordInclude,
  });
  return record;
};

// ── Get salary records with filters ──────────────────────────────
const getSalaryRecords = async (query) => {
  const { employeeId, salaryYear, salaryMonth, status, search, page = 1, limit = 20 } = query;
  const where = {};

  if (employeeId)  where.employeeId = employeeId;
  if (salaryYear)  where.salaryYear  = parseInt(salaryYear);
  if (salaryMonth) where.salaryMonth = parseInt(salaryMonth);
  if (status)      where.status = status;
  if (search) {
    where.employee = { name: { contains: search, mode: 'insensitive' } };
  }

  const [records, total] = await Promise.all([
    prisma.salaryRecord.findMany({
      where,
      include: salaryRecordInclude,
      orderBy: [{ salaryYear: 'desc' }, { salaryMonth: 'desc' }, { createdAt: 'desc' }],
      skip:  (parseInt(page) - 1) * parseInt(limit),
      take:  parseInt(limit),
    }),
    prisma.salaryRecord.count({ where }),
  ]);

  return { records, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } };
};

// ── Get single salary record ──────────────────────────────────────
const getSalaryRecordById = async (id) => {
  const record = await prisma.salaryRecord.findUnique({ where: { id }, include: salaryRecordInclude });
  if (!record) throw Object.assign(new Error('Salary record not found'), { statusCode: 404 });
  return record;
};

// ── Add a payment to a salary record ─────────────────────────────
const addPayment = async (salaryRecordId, data) => {
  const { amount, paymentDate, paymentMethod, receiptUrl, notes, createdBy } = data;
  const payAmount = d(amount);

  const record = await prisma.salaryRecord.findUnique({ where: { id: salaryRecordId } });
  if (!record) throw Object.assign(new Error('Salary record not found'), { statusCode: 404 });
  if (record.status === 'PAID') throw Object.assign(new Error('Salary is already fully paid.'), { statusCode: 400 });

  const remaining = d(record.netSalary) - d(record.amountPaid);
  if (payAmount <= 0) throw Object.assign(new Error('Payment amount must be greater than zero.'), { statusCode: 400 });
  if (payAmount > remaining) throw Object.assign(new Error(`Payment exceeds the remaining balance of ${remaining.toLocaleString()}.`), { statusCode: 400 });

  const newAmountPaid = d(record.amountPaid) + payAmount;
  const newStatus = computeStatus(newAmountPaid, record.netSalary);

  return await prisma.$transaction(async (tx) => {
    const payment = await tx.salaryPayment.create({
      data: {
        salaryRecordId,
        amount: payAmount,
        paymentDate: new Date(paymentDate),
        paymentMethod,
        receiptUrl: receiptUrl || null,
        notes: notes || null,
        createdBy,
      },
    });
    const updated = await tx.salaryRecord.update({
      where: { id: salaryRecordId },
      data: { amountPaid: newAmountPaid, status: newStatus },
      include: salaryRecordInclude,
    });
    return { record: updated, payment };
  });
};

// ── Add a bonus to a salary record ───────────────────────────────
const addBonus = async (salaryRecordId, data) => {
  const { amount, reason, bonusDate, paymentMethod, receiptUrl, createdBy } = data;
  const record = await prisma.salaryRecord.findUnique({ where: { id: salaryRecordId } });
  if (!record) throw Object.assign(new Error('Salary record not found'), { statusCode: 404 });
  if (d(amount) <= 0) throw Object.assign(new Error('Bonus amount must be greater than zero.'), { statusCode: 400 });

  const bonus = await prisma.salaryBonus.create({
    data: {
      salaryRecordId,
      amount: d(amount),
      reason,
      bonusDate: new Date(bonusDate),
      paymentMethod,
      receiptUrl: receiptUrl || null,
      createdBy,
    },
  });
  return { bonus, record: await prisma.salaryRecord.findUnique({ where: { id: salaryRecordId }, include: salaryRecordInclude }) };
};

// ── Add a deduction to a salary record ───────────────────────────
const addDeduction = async (salaryRecordId, data) => {
  const { amount, reason, notes, deductionDate, createdBy } = data;
  const deductAmount = d(amount);

  const record = await prisma.salaryRecord.findUnique({ where: { id: salaryRecordId } });
  if (!record) throw Object.assign(new Error('Salary record not found'), { statusCode: 404 });
  if (record.status === 'PAID') throw Object.assign(new Error('Cannot add deduction to a fully paid salary.'), { statusCode: 400 });
  if (deductAmount <= 0) throw Object.assign(new Error('Deduction amount must be greater than zero.'), { statusCode: 400 });

  return await prisma.$transaction(async (tx) => {
    const deduction = await tx.salaryDeduction.create({
      data: { salaryRecordId, amount: deductAmount, reason, notes: notes || null, deductionDate: new Date(deductionDate), createdBy },
    });
    const newTotalDeductions = d(record.totalDeductions) + deductAmount;
    const newNetSalary = d(record.grossSalary) - newTotalDeductions;
    const newStatus = computeStatus(record.amountPaid, newNetSalary);

    const updated = await tx.salaryRecord.update({
      where: { id: salaryRecordId },
      data: { totalDeductions: newTotalDeductions, netSalary: newNetSalary, status: newStatus },
      include: salaryRecordInclude,
    });
    return { record: updated, deduction };
  });
};

// ── Delete a payment (reverse it) ────────────────────────────────
const deletePayment = async (paymentId) => {
  const payment = await prisma.salaryPayment.findUnique({ where: { id: paymentId } });
  if (!payment) throw Object.assign(new Error('Payment not found'), { statusCode: 404 });

  return await prisma.$transaction(async (tx) => {
    await tx.salaryPayment.delete({ where: { id: paymentId } });
    const record = await tx.salaryRecord.findUnique({ where: { id: payment.salaryRecordId }, include: { payments: true } });
    const newAmountPaid = record.payments.reduce((s, p) => s + d(p.amount), 0);
    const newStatus = computeStatus(newAmountPaid, record.netSalary);
    return await tx.salaryRecord.update({
      where: { id: payment.salaryRecordId },
      data: { amountPaid: newAmountPaid, status: newStatus },
      include: salaryRecordInclude,
    });
  });
};

// ── Delete a salary record ────────────────────────────────────────
const deleteSalaryRecord = async (id) => {
  const record = await prisma.salaryRecord.findUnique({ where: { id } });
  if (!record) throw Object.assign(new Error('Salary record not found'), { statusCode: 404 });
  await prisma.salaryRecord.delete({ where: { id } }); // cascades payments/bonuses/deductions
};

// ── Monthly analytics ─────────────────────────────────────────────
const getMonthlyAnalytics = async (salaryYear, salaryMonth) => {
  const where = { salaryYear: parseInt(salaryYear), salaryMonth: parseInt(salaryMonth) };
  const records = await prisma.salaryRecord.findMany({ where, include: { employee: { select: { id: true, name: true, role: true } } } });

  const total      = records.length;
  const paid       = records.filter(r => r.status === 'PAID').length;
  const partial    = records.filter(r => r.status === 'PARTIAL').length;
  const unpaid     = records.filter(r => r.status === 'UNPAID').length;
  const totalNet   = records.reduce((s, r) => s + d(r.netSalary), 0);
  const totalPaid  = records.reduce((s, r) => s + d(r.amountPaid), 0);
  const remaining  = totalNet - totalPaid;

  const bonuses = await prisma.salaryBonus.findMany({
    where: { salaryRecord: { salaryYear: parseInt(salaryYear), salaryMonth: parseInt(salaryMonth) } },
  });
  const totalBonuses = bonuses.reduce((s, b) => s + d(b.amount), 0);

  return { salaryYear: parseInt(salaryYear), salaryMonth: parseInt(salaryMonth), total, paid, partial, unpaid, totalNet, totalPaid, remaining, totalBonuses, records };
};

// ── Employee salary history ───────────────────────────────────────
const getEmployeeHistory = async (employeeId) => {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { ship: { select: { id: true, name: true } } },
  });
  if (!employee) throw Object.assign(new Error('Employee not found'), { statusCode: 404 });

  const records = await prisma.salaryRecord.findMany({
    where: { employeeId },
    include: salaryRecordInclude,
    orderBy: [{ salaryYear: 'desc' }, { salaryMonth: 'desc' }],
  });

  return { employee, records };
};

// ── Available years for filter ────────────────────────────────────
const getAvailableYears = async () => {
  const result = await prisma.salaryRecord.findMany({
    distinct: ['salaryYear'],
    select: { salaryYear: true },
    orderBy: { salaryYear: 'desc' },
  });
  return result.map(r => r.salaryYear);
};

module.exports = {
  createSalaryRecord, getSalaryRecords, getSalaryRecordById,
  addPayment, addBonus, addDeduction,
  deletePayment, deleteSalaryRecord,
  getMonthlyAnalytics, getEmployeeHistory, getAvailableYears,
};
