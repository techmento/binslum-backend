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

module.exports = {
  getProfitLossReport,
  getShipPerformanceReport,
  getExpenseAnalysisReport,
  getIncomeAnalysisReport,
  getLoanReport,
};