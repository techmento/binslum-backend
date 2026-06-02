const { sendSuccess, sendError } = require('../../utils/apiResponse');
const { HTTP_STATUS } = require('../../config/constants');
const reportsService = require('./reports.service');

const getProfitLossReport = async (req, res, next) => {
  try {
    const query = {
      shipId: req.query.shipId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const report = await reportsService.getProfitLossReport(query);
    sendSuccess(res, report, 'Profit & Loss report generated successfully');
  } catch (error) {
    next(error);
  }
};

const getShipPerformanceReport = async (req, res, next) => {
  try {
    const query = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const report = await reportsService.getShipPerformanceReport(query);
    sendSuccess(res, report, 'Ship performance report generated successfully');
  } catch (error) {
    next(error);
  }
};

const getExpenseAnalysisReport = async (req, res, next) => {
  try {
    const query = {
      shipId: req.query.shipId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      category: req.query.category,
    };

    const report = await reportsService.getExpenseAnalysisReport(query);
    sendSuccess(res, report, 'Expense analysis report generated successfully');
  } catch (error) {
    next(error);
  }
};

const getIncomeAnalysisReport = async (req, res, next) => {
  try {
    const query = {
      shipId: req.query.shipId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      type: req.query.type,
    };

    const report = await reportsService.getIncomeAnalysisReport(query);
    sendSuccess(res, report, 'Income analysis report generated successfully');
  } catch (error) {
    next(error);
  }
};

const getLoanReport = async (req, res, next) => {
  try {
    const report = await reportsService.getLoanReport();
    sendSuccess(res, report, 'Loan report generated successfully');
  } catch (error) {
    next(error);
  }
};

const getFinancialSummary = async (req, res, next) => {
  try {
    const report = await reportsService.getFinancialSummary({
      period:    req.query.period || 'ytd',
      year:      req.query.year   ? parseInt(req.query.year)  : new Date().getFullYear(),
      month:     req.query.month  ? parseInt(req.query.month) : new Date().getMonth() + 1,
      shipId:    req.query.shipId || null,
      startDate: req.query.startDate,
      endDate:   req.query.endDate,
    });
    sendSuccess(res, report, 'Financial summary generated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfitLossReport,
  getShipPerformanceReport,
  getExpenseAnalysisReport,
  getIncomeAnalysisReport,
  getLoanReport,
  getFinancialSummary,
};