const prisma = require('../../config/database');

const getProfitLossReport = async (query) => {
  const { shipId, startDate, endDate } = query;

  const whereClause = {};
  if (shipId) whereClause.shipId = shipId;
  if (startDate || endDate) {
    whereClause.date = {};
    if (startDate) whereClause.date.gte = new Date(startDate);
    if (endDate) whereClause.date.lte = new Date(endDate);
  }

  // Get income summary
  const incomeResult = await prisma.incomeRecord.aggregate({
    where: whereClause,
    _sum: { amount: true },
  });

  // Get expense summary
  const expenseResult = await prisma.expenseRecord.aggregate({
    where: whereClause,
    _sum: { amount: true },
  });

  const totalIncome = incomeResult._sum.amount || 0;
  const totalExpenses = expenseResult._sum.amount || 0;
  const netProfit = totalIncome - totalExpenses;

  // Get income breakdown by type
  const incomeBreakdown = await prisma.incomeRecord.groupBy({
    by: ['type'],
    where: whereClause,
    _sum: { amount: true },
    _count: true,
  });

  // Get expense breakdown by category
  const expenseBreakdown = await prisma.expenseRecord.groupBy({
    by: ['category'],
    where: whereClause,
    _sum: { amount: true },
    _count: true,
  });

  return {
    period: {
      startDate: startDate || null,
      endDate: endDate || null,
    },
    summary: {
      totalIncome,
      totalExpenses,
      netProfit,
      profitMargin: totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0,
    },
    incomeBreakdown: incomeBreakdown.map(item => ({
      type: item.type,
      count: item._count,
      amount: item._sum.amount || 0,
    })),
    expenseBreakdown: expenseBreakdown.map(item => ({
      category: item.category,
      count: item._count,
      amount: item._sum.amount || 0,
    })),
  };
};

const getShipPerformanceReport = async (query) => {
  const { startDate, endDate } = query;

  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.date = {};
    if (startDate) dateFilter.date.gte = new Date(startDate);
    if (endDate) dateFilter.date.lte = new Date(endDate);
  }

  const ships = await prisma.ship.findMany({
    include: {
      _count: {
        select: {
          incomeRecords: true,
          expenseRecords: true,
          employees: true,
        },
      },
    },
  });

  const shipReports = await Promise.all(
    ships.map(async (ship) => {
      const incomeResult = await prisma.incomeRecord.aggregate({
        where: { shipId: ship.id, ...dateFilter },
        _sum: { amount: true },
      });

      const expenseResult = await prisma.expenseRecord.aggregate({
        where: { shipId: ship.id, ...dateFilter },
        _sum: { amount: true },
      });

      const totalIncome = incomeResult._sum.amount || 0;
      const totalExpenses = expenseResult._sum.amount || 0;
      const netProfit = totalIncome - totalExpenses;

      return {
        ship: {
          id: ship.id,
          name: ship.name,
          registrationNumber: ship.registrationNumber,
          status: ship.status,
        },
        performance: {
          totalIncome,
          totalExpenses,
          netProfit,
          profitMargin: totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0,
          incomeRecords: ship._count.incomeRecords,
          expenseRecords: ship._count.expenseRecords,
          activeEmployees: ship._count.employees,
        },
      };
    })
  );

  // Sort by net profit descending
  shipReports.sort((a, b) => b.performance.netProfit - a.performance.netProfit);

  return {
    period: {
      startDate: startDate || null,
      endDate: endDate || null,
    },
    ships: shipReports,
    summary: {
      totalShips: ships.length,
      activeShips: ships.filter(s => s.status === 'ACTIVE').length,
      totalIncome: shipReports.reduce((sum, s) => sum + s.performance.totalIncome, 0),
      totalExpenses: shipReports.reduce((sum, s) => sum + s.performance.totalExpenses, 0),
      totalProfit: shipReports.reduce((sum, s) => sum + s.performance.netProfit, 0),
    },
  };
};

const getExpenseAnalysisReport = async (query) => {
  const { shipId, startDate, endDate, category } = query;

  const whereClause = {};
  if (shipId) whereClause.shipId = shipId;
  if (category) whereClause.category = category;
  if (startDate || endDate) {
    whereClause.date = {};
    if (startDate) whereClause.date.gte = new Date(startDate);
    if (endDate) whereClause.date.lte = new Date(endDate);
  }

  // Get expenses grouped by category
  const categoryBreakdown = await prisma.expenseRecord.groupBy({
    by: ['category'],
    where: whereClause,
    _sum: { amount: true },
    _count: true,
  });

  // Get expenses grouped by ship
  const shipBreakdown = await prisma.expenseRecord.groupBy({
    by: ['shipId'],
    where: whereClause,
    _sum: { amount: true },
    _count: true,
    orderBy: { _sum: { amount: 'desc' } },
  });

  // Get ship details for ship breakdown
  const shipDetails = await prisma.ship.findMany({
    where: {
      id: { in: shipBreakdown.map(s => s.shipId) },
    },
    select: {
      id: true,
      name: true,
      registrationNumber: true,
    },
  });

  const shipMap = shipDetails.reduce((map, ship) => {
    map[ship.id] = ship;
    return map;
  }, {});

  // Get monthly trend (last 12 months)
  const monthlyTrend = await prisma.$queryRaw`
    SELECT
      DATE_TRUNC('month', date) as month,
      SUM(amount) as total_amount,
      COUNT(*) as record_count
    FROM expense_records
    WHERE ${startDate ? prisma.sql`date >= ${new Date(startDate)}` : prisma.sql`TRUE`}
      AND ${endDate ? prisma.sql`date <= ${new Date(endDate)}` : prisma.sql`TRUE`}
      ${shipId ? prisma.sql`AND ship_id = ${shipId}` : prisma.sql``}
    GROUP BY DATE_TRUNC('month', date)
    ORDER BY month DESC
    LIMIT 12
  `;

  const totalAmount = categoryBreakdown.reduce((sum, cat) => sum + (cat._sum.amount || 0), 0);

  return {
    period: {
      startDate: startDate || null,
      endDate: endDate || null,
    },
    summary: {
      totalExpenses: totalAmount,
      categoriesCount: categoryBreakdown.length,
      shipsCount: shipBreakdown.length,
    },
    categoryBreakdown: categoryBreakdown.map(cat => ({
      category: cat.category,
      count: cat._count,
      amount: cat._sum.amount || 0,
      percentage: totalAmount > 0 ? ((cat._sum.amount || 0) / totalAmount) * 100 : 0,
    })),
    shipBreakdown: shipBreakdown.map(ship => ({
      ship: shipMap[ship.shipId] || { id: ship.shipId },
      count: ship._count,
      amount: ship._sum.amount || 0,
    })),
    monthlyTrend: monthlyTrend.map(trend => ({
      month: trend.month,
      amount: parseFloat(trend.total_amount),
      count: parseInt(trend.record_count),
    })),
  };
};

const getIncomeAnalysisReport = async (query) => {
  const { shipId, startDate, endDate, type } = query;

  const whereClause = {};
  if (shipId) whereClause.shipId = shipId;
  if (type) whereClause.type = type;
  if (startDate || endDate) {
    whereClause.date = {};
    if (startDate) whereClause.date.gte = new Date(startDate);
    if (endDate) whereClause.date.lte = new Date(endDate);
  }

  // Get income grouped by type
  const typeBreakdown = await prisma.incomeRecord.groupBy({
    by: ['type'],
    where: whereClause,
    _sum: { amount: true },
    _count: true,
  });

  // Get income grouped by ship
  const shipBreakdown = await prisma.incomeRecord.groupBy({
    by: ['shipId'],
    where: whereClause,
    _sum: { amount: true },
    _count: true,
    orderBy: { _sum: { amount: 'desc' } },
  });

  // Get ship details for ship breakdown
  const shipDetails = await prisma.ship.findMany({
    where: {
      id: { in: shipBreakdown.map(s => s.shipId) },
    },
    select: {
      id: true,
      name: true,
      registrationNumber: true,
    },
  });

  const shipMap = shipDetails.reduce((map, ship) => {
    map[ship.id] = ship;
    return map;
  }, {});

  // Get monthly trend (last 12 months)
  const monthlyTrend = await prisma.$queryRaw`
    SELECT
      DATE_TRUNC('month', date) as month,
      SUM(amount) as total_amount,
      COUNT(*) as record_count
    FROM income_records
    WHERE ${startDate ? prisma.sql`date >= ${new Date(startDate)}` : prisma.sql`TRUE`}
      AND ${endDate ? prisma.sql`date <= ${new Date(endDate)}` : prisma.sql`TRUE`}
      ${shipId ? prisma.sql`AND ship_id = ${shipId}` : prisma.sql``}
    GROUP BY DATE_TRUNC('month', date)
    ORDER BY month DESC
    LIMIT 12
  `;

  const totalAmount = typeBreakdown.reduce((sum, type) => sum + (type._sum.amount || 0), 0);

  return {
    period: {
      startDate: startDate || null,
      endDate: endDate || null,
    },
    summary: {
      totalIncome: totalAmount,
      typesCount: typeBreakdown.length,
      shipsCount: shipBreakdown.length,
    },
    typeBreakdown: typeBreakdown.map(inc => ({
      type: inc.type,
      count: inc._count,
      amount: inc._sum.amount || 0,
      percentage: totalAmount > 0 ? ((inc._sum.amount || 0) / totalAmount) * 100 : 0,
    })),
    shipBreakdown: shipBreakdown.map(ship => ({
      ship: shipMap[ship.shipId] || { id: ship.shipId },
      count: ship._count,
      amount: ship._sum.amount || 0,
    })),
    monthlyTrend: monthlyTrend.map(trend => ({
      month: trend.month,
      amount: parseFloat(trend.total_amount),
      count: parseInt(trend.record_count),
    })),
  };
};

const getLoanReport = async () => {
  const loans = await prisma.loan.findMany({
    include: {
      payments: {
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

  const activeLoans = loans.filter(loan => loan.status === 'ACTIVE');
  const paidOffLoans = loans.filter(loan => loan.status === 'PAID_OFF');

  const totalBorrowed = loans.reduce((sum, loan) => sum + loan.totalAmount, 0);
  const totalPaid = loans.reduce((sum, loan) => sum + (loan.totalAmount - loan.remainingBalance), 0);
  const totalRemaining = loans.reduce((sum, loan) => sum + loan.remainingBalance, 0);

  return {
    summary: {
      totalLoans: loans.length,
      activeLoans: activeLoans.length,
      paidOffLoans: paidOffLoans.length,
      totalBorrowed,
      totalPaid,
      totalRemaining,
    },
    loans: loans.map(loan => ({
      id: loan.id,
      bankName: loan.bankName,
      totalAmount: loan.totalAmount,
      remainingBalance: loan.remainingBalance,
      monthlyPayment: loan.monthlyPayment,
      status: loan.status,
      startDate: loan.startDate,
      paymentsCount: loan._count.payments,
      lastPayment: loan.payments[0] || null,
    })),
  };
};

const getFinancialSummary = async (query) => {
  const { period, year, month, shipId } = query;

  // Build date range from period selector
  let startDate, endDate;
  const now = new Date();

  if (period === 'month' && year && month) {
    startDate = new Date(year, month - 1, 1);
    endDate   = new Date(year, month, 0, 23, 59, 59);
  } else if (period === 'year' && year) {
    startDate = new Date(year, 0, 1);
    endDate   = new Date(year, 11, 31, 23, 59, 59);
  } else if (period === 'ytd') {
    startDate = new Date(now.getFullYear(), 0, 1);
    endDate   = now;
  } else if (period === 'q1') {
    startDate = new Date(now.getFullYear(), 0, 1);
    endDate   = new Date(now.getFullYear(), 2, 31, 23, 59, 59);
  } else if (period === 'q2') {
    startDate = new Date(now.getFullYear(), 3, 1);
    endDate   = new Date(now.getFullYear(), 5, 30, 23, 59, 59);
  } else if (period === 'q3') {
    startDate = new Date(now.getFullYear(), 6, 1);
    endDate   = new Date(now.getFullYear(), 8, 30, 23, 59, 59);
  } else if (period === 'q4') {
    startDate = new Date(now.getFullYear(), 9, 1);
    endDate   = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
  } else if (period === 'custom' && query.startDate && query.endDate) {
    startDate = new Date(query.startDate);
    endDate   = new Date(query.endDate);
  } else {
    // Default: current year
    startDate = new Date(now.getFullYear(), 0, 1);
    endDate   = now;
  }

  const dateWhere = { date: { gte: startDate, lte: endDate } };
  const baseWhere = shipId ? { ...dateWhere, shipId } : dateWhere;
  const expBaseWhere = shipId ? { ...dateWhere, shipId } : dateWhere;

  // ── Previous period (same length) for YoY/MoM comparison ──
  const periodMs = endDate - startDate;
  const prevStart = new Date(startDate - periodMs);
  const prevEnd   = new Date(startDate - 1);
  const prevDateWhere = { date: { gte: prevStart, lte: prevEnd } };
  const prevBaseWhere = shipId ? { ...prevDateWhere, shipId } : prevDateWhere;

  const [
    incomeAgg, expenseAgg,
    prevIncomeAgg, prevExpenseAgg,
    incomeByType, expenseByCategory,
    salaryAgg, loanAgg,
    shipIncome, shipExpense,
    loans,
  ] = await Promise.all([
    prisma.incomeRecord.aggregate({ where: baseWhere, _sum: { amount: true }, _count: true }),
    prisma.expenseRecord.aggregate({ where: expBaseWhere, _sum: { amount: true }, _count: true }),
    prisma.incomeRecord.aggregate({ where: prevBaseWhere, _sum: { amount: true } }),
    prisma.expenseRecord.aggregate({ where: prevBaseWhere, _sum: { amount: true } }),
    prisma.incomeRecord.groupBy({ by: ['type'], where: baseWhere, _sum: { amount: true }, _count: true }),
    prisma.expenseRecord.groupBy({ by: ['category'], where: expBaseWhere, _sum: { amount: true }, _count: true, orderBy: { _sum: { amount: 'desc' } } }),
    prisma.expenseRecord.aggregate({ where: { ...expBaseWhere, category: 'SALARY' }, _sum: { amount: true } }),
    prisma.expenseRecord.aggregate({ where: { ...expBaseWhere, category: 'LOAN_REPAYMENT' }, _sum: { amount: true } }),
    prisma.incomeRecord.groupBy({ by: ['shipId'], where: baseWhere, _sum: { amount: true } }),
    prisma.expenseRecord.groupBy({ by: ['shipId'], where: expBaseWhere, _sum: { amount: true } }),
    prisma.loan.findMany({ select: { id: true, bankName: true, totalAmount: true, remainingBalance: true, monthlyPayment: true, status: true } }),
  ]);

  // Monthly trend for the period — separate queries to avoid raw SQL interpolation issues
  const [trendIncome, trendExpense] = await Promise.all([
    prisma.incomeRecord.groupBy({
      by: ['date'],
      where: baseWhere,
      _sum: { amount: true },
    }),
    prisma.expenseRecord.groupBy({
      by: ['date'],
      where: expBaseWhere,
      _sum: { amount: true },
    }),
  ]);

  // Aggregate by month
  const monthMap = {};
  trendIncome.forEach(r => {
    const m = new Date(r.date).toISOString().substring(0, 7);
    if (!monthMap[m]) monthMap[m] = { month: m, income: 0, expense: 0 };
    monthMap[m].income += parseFloat(r._sum.amount?.toString() || '0');
  });
  trendExpense.forEach(r => {
    const m = new Date(r.date).toISOString().substring(0, 7);
    if (!monthMap[m]) monthMap[m] = { month: m, income: 0, expense: 0 };
    monthMap[m].expense += parseFloat(r._sum.amount?.toString() || '0');
  });
  const monthlyTrend = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));

  // Ship details lookup
  const allShips = await prisma.ship.findMany({ select: { id: true, name: true, registrationNumber: true, status: true } });
  const shipMap = Object.fromEntries(allShips.map(s => [s.id, s]));

  const totalIncome   = parseFloat(incomeAgg._sum.amount?.toString() || '0');
  const totalExpenses = parseFloat(expenseAgg._sum.amount?.toString() || '0');
  const netProfit     = totalIncome - totalExpenses;
  const prevIncome    = parseFloat(prevIncomeAgg._sum.amount?.toString() || '0');
  const prevExpenses  = parseFloat(prevExpenseAgg._sum.amount?.toString() || '0');
  const prevProfit    = prevIncome - prevExpenses;

  const pct = (curr, prev) =>
    prev === 0 ? null : Math.round(((curr - prev) / Math.abs(prev)) * 1000) / 10;

  // Outstanding loan obligations
  const activeLoans = loans.filter(l => l.status === 'ACTIVE');
  const totalLoanRemaining = activeLoans.reduce((s, l) => s + parseFloat(l.remainingBalance.toString()), 0);
  const totalLoanBorrowed  = loans.reduce((s, l) => s + parseFloat(l.totalAmount.toString()), 0);
  const totalLoanPaid      = loans.reduce((s, l) => s + parseFloat(l.totalAmount.toString()) - parseFloat(l.remainingBalance.toString()), 0);
  const monthlyLoanObligation = activeLoans.reduce((s, l) => s + parseFloat(l.monthlyPayment.toString()), 0);

  // Ship P&L matrix
  const incomeByShip  = Object.fromEntries(shipIncome.map(r => [r.shipId, parseFloat(r._sum.amount?.toString() || '0')]));
  const expenseByShip = Object.fromEntries(shipExpense.map(r => [r.shipId, parseFloat(r._sum.amount?.toString() || '0')]));
  const shipPnl = allShips.map(ship => ({
    ship,
    income:   incomeByShip[ship.id]  || 0,
    expenses: expenseByShip[ship.id] || 0,
    profit:   (incomeByShip[ship.id] || 0) - (expenseByShip[ship.id] || 0),
    margin:   (incomeByShip[ship.id] || 0) > 0
      ? (((incomeByShip[ship.id] || 0) - (expenseByShip[ship.id] || 0)) / (incomeByShip[ship.id] || 0)) * 100
      : 0,
  })).sort((a, b) => b.profit - a.profit);

  // Expense category detail
  const totalExp = expenseByCategory.reduce((s, c) => s + parseFloat(c._sum.amount?.toString() || '0'), 0);
  const expCategories = expenseByCategory.map(c => ({
    category:   c.category,
    count:      c._count,
    amount:     parseFloat(c._sum.amount?.toString() || '0'),
    percentage: totalExp > 0 ? Math.round((parseFloat(c._sum.amount?.toString() || '0') / totalExp) * 1000) / 10 : 0,
  }));

  // Income breakdown
  const incCategories = incomeByType.map(i => ({
    type:       i.type,
    count:      i._count,
    amount:     parseFloat(i._sum.amount?.toString() || '0'),
    percentage: totalIncome > 0 ? Math.round((parseFloat(i._sum.amount?.toString() || '0') / totalIncome) * 1000) / 10 : 0,
  }));

  return {
    period:  { startDate, endDate, label: period },
    summary: {
      totalIncome,
      totalExpenses,
      netProfit,
      profitMargin:   totalIncome > 0 ? Math.round((netProfit / totalIncome) * 1000) / 10 : 0,
      expenseRatio:   totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 1000) / 10 : 0,
      incomeCount:    incomeAgg._count,
      expenseCount:   expenseAgg._count,
      salaryExpenses: parseFloat(salaryAgg._sum.amount?.toString() || '0'),
      loanRepayments: parseFloat(loanAgg._sum.amount?.toString() || '0'),
      operatingExpenses: totalExpenses
        - parseFloat(salaryAgg._sum.amount?.toString() || '0')
        - parseFloat(loanAgg._sum.amount?.toString() || '0'),
    },
    comparison: {
      prevIncome,
      prevExpenses,
      prevProfit,
      incomePct:  pct(totalIncome, prevIncome),
      expensePct: pct(totalExpenses, prevExpenses),
      profitPct:  pct(netProfit, prevProfit),
    },
    loans: {
      total:             loans.length,
      active:            activeLoans.length,
      totalBorrowed:     totalLoanBorrowed,
      totalPaid:         totalLoanPaid,
      totalRemaining:    totalLoanRemaining,
      monthlyObligation: monthlyLoanObligation,
      debtToIncome:      totalIncome > 0 ? Math.round((totalLoanRemaining / totalIncome) * 1000) / 10 : null,
      items:             loans.map(l => ({
        ...l,
        totalAmount:      parseFloat(l.totalAmount.toString()),
        remainingBalance: parseFloat(l.remainingBalance.toString()),
        monthlyPayment:   parseFloat(l.monthlyPayment.toString()),
        paidPct: parseFloat(l.totalAmount.toString()) > 0
          ? Math.round(((parseFloat(l.totalAmount.toString()) - parseFloat(l.remainingBalance.toString())) / parseFloat(l.totalAmount.toString())) * 1000) / 10
          : 0,
      })),
    },
    incomeBreakdown:  incCategories,
    expenseBreakdown: expCategories,
    shipPnl,
    monthlyTrend: monthlyTrend.map(r => ({
      month:   r.month,
      income:  parseFloat(r.income.toString()),
      expense: parseFloat(r.expense.toString()),
      profit:  parseFloat(r.income.toString()) - parseFloat(r.expense.toString()),
    })),
  };
};

module.exports = {
  getProfitLossReport,
  getShipPerformanceReport,
  getExpenseAnalysisReport,
  getIncomeAnalysisReport,
  getLoanReport,
  getFinancialSummary,
};