const { sendSuccess, sendError } = require('../../utils/apiResponse');
const { HTTP_STATUS } = require('../../config/constants');
const incomeService = require('./income.service');

const createIncome = async (req, res, next) => {
  try {
    const incomeData = {
      ...req.body,
      createdBy: req.user.id,
    };

    const income = await incomeService.createIncome(incomeData);
    sendSuccess(res, income, 'Income record created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

const getIncomes = async (req, res, next) => {
  try {
    const query = {
      shipId: req.query.shipId,
      type: req.query.type,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
    };
    query.skip = (query.page - 1) * query.limit;

    const result = await incomeService.getIncomes(query);
    sendSuccess(res, result, 'Income records retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getIncomeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const income = await incomeService.getIncomeById(id);
    sendSuccess(res, income, 'Income record retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateIncome = async (req, res, next) => {
  try {
    const { id } = req.params;
    const income = await incomeService.updateIncome(id, req.body, req.user.id);
    sendSuccess(res, income, 'Income record updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteIncome = async (req, res, next) => {
  try {
    const { id } = req.params;
    await incomeService.deleteIncome(id, req.user.id);
    sendSuccess(res, null, 'Income record deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getIncomeTypes = async (req, res, next) => {
  try {
    const types = await incomeService.getIncomeTypes();
    sendSuccess(res, types, 'Income types retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getIncomeSummary = async (req, res, next) => {
  try {
    const query = {
      shipId: req.query.shipId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    const summary = await incomeService.getIncomeSummary(query);
    sendSuccess(res, summary, 'Income summary retrieved successfully');
  } catch (error) {
    next(error);
  }
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