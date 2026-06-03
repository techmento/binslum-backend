const parseDateRange = (query) => {
  const dateRange = {};

  if (query.start_date) {
    dateRange.gte = new Date(query.start_date);
    if (isNaN(dateRange.gte.getTime())) {
      throw new Error('Invalid start_date format. Use YYYY-MM-DD');
    }
  }

  if (query.end_date) {
    dateRange.lte = new Date(query.end_date);
    // Set time to end of day
    dateRange.lte.setHours(23, 59, 59, 999);
    if (isNaN(dateRange.lte.getTime())) {
      throw new Error('Invalid end_date format. Use YYYY-MM-DD');
    }
  }

  return dateRange;
};

const getMonthBoundaries = (year, month) => {
  // Start of month at 00:00:00
  const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);

  // End of month at 23:59:59
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  return { startDate, endDate };
};

const formatDate = (date) => {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  return date.toISOString().split('T')[0];
};

const getDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  return { gte: start, lte: end };
};

module.exports = {
  parseDateRange,
  getMonthBoundaries,
  formatDate,
  getDateRange,
};
