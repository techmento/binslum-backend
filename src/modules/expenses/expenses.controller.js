const { sendSuccess, sendError } = require('../../utils/apiResponse');
const { HTTP_STATUS } = require('../../config/constants');
const expenseService = require('./expenses.service');

const createExpense = async (req, res, next) => {
  try {
    // Check if receipt file is provided
    if (!req.file) {
      const error = new Error('Receipt file is required');
      error.statusCode = 400;
      throw error;
    }

    const expenseData = {
      ...req.body,
      createdBy: req.user.id,
      receiptUrl: `/uploads/${req.file.filename}`,
    };

    const expense = await expenseService.createExpense(expenseData);
    sendSuccess(res, expense, 'Expense record created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

const getExpenses = async (req, res, next) => {
  try {
    const filters = req.query;
    const expenses = await expenseService.getExpenses(filters);
    sendSuccess(res, expenses, 'Expense records retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getExpenseById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const expense = await expenseService.getExpenseById(id);
    sendSuccess(res, expense, 'Expense record retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      receiptUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
    };

    const expense = await expenseService.updateExpense(id, updateData, req.user.id);
    sendSuccess(res, expense, 'Expense record updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    await expenseService.deleteExpense(id, req.user.id);
    sendSuccess(res, null, 'Expense record deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getExpenseCategories = async (req, res, next) => {
  try {
    const categories = await expenseService.getExpenseCategories();
    sendSuccess(res, categories, 'Expense categories retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createCustomCategory = async (req, res, next) => {
  try {
    const { name, label, color, fade, border } = req.body;

    const categoryData = {
      name,
      label,
      color,
      fade,
      border,
      createdBy: req.user.id,
    };

    const newCategory = await expenseService.createCustomCategory(categoryData);
    sendSuccess(res, newCategory, 'Custom category created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

const getCustomCategories = async (req, res, next) => {
  try {
    const customCategories = await expenseService.getCustomCategories();
    sendSuccess(res, customCategories, 'Custom categories retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseCategories,
  createCustomCategory,
  getCustomCategories,
};