const { sendSuccess, sendError } = require('../../utils/apiResponse');
const { HTTP_STATUS } = require('../../config/constants');
const loansService = require('./loans.service');

const createLoan = async (req, res, next) => {
  try {
    const loanData = {
      ...req.body,
      createdBy: req.user.id,
    };

    const loan = await loansService.createLoan(loanData);
    sendSuccess(res, loan, 'Loan created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

const getLoans = async (req, res, next) => {
  try {
    const query = {
      status: req.query.status,
      search: req.query.search,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
    };
    query.skip = (query.page - 1) * query.limit;

    const result = await loansService.getLoans(query);
    sendSuccess(res, result, 'Loans retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getLoanById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const loan = await loansService.getLoanById(id);
    sendSuccess(res, loan, 'Loan retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateLoan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const loan = await loansService.updateLoan(id, req.body, req.user.id);
    sendSuccess(res, loan, 'Loan updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteLoan = async (req, res, next) => {
  try {
    const { id } = req.params;
    await loansService.deleteLoan(id, req.user.id);
    sendSuccess(res, null, 'Loan deleted successfully');
  } catch (error) {
    next(error);
  }
};

const createLoanPayment = async (req, res, next) => {
  try {
    const paymentData = {
      ...req.body,
      createdBy: req.user.id,
    };

    const payment = await loansService.createLoanPayment(paymentData);
    sendSuccess(res, payment, 'Loan payment recorded successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

const getLoanPayments = async (req, res, next) => {
  try {
    const { loanId } = req.params;
    const query = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
    };
    query.skip = (query.page - 1) * query.limit;

    const result = await loansService.getLoanPayments(loanId, query);
    sendSuccess(res, result, 'Loan payments retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getLoanSummary = async (req, res, next) => {
  try {
    const summary = await loansService.getLoanSummary();
    sendSuccess(res, summary, 'Loan summary retrieved successfully');
  } catch (error) {
    next(error);
  }
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