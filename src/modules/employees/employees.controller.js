const { sendSuccess, sendError } = require('../../utils/apiResponse');
const { HTTP_STATUS } = require('../../config/constants');
const employeesService = require('./employees.service');

const createEmployee = async (req, res, next) => {
  try {
    const employee = await employeesService.createEmployee(req.body);
    sendSuccess(res, employee, 'Employee created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

const getEmployees = async (req, res, next) => {
  try {
    const query = {
      shipId: req.query.shipId,
      search: req.query.search,
      limit: parseInt(req.query.limit) || 20,
      skip: (parseInt(req.query.page) - 1) * parseInt(req.query.limit) || 0,
    };

    const result = await employeesService.getEmployees(query);
    sendSuccess(res, result, 'Employees retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employee = await employeesService.getEmployeeById(id);
    sendSuccess(res, employee, 'Employee retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employee = await employeesService.updateEmployee(id, req.body);
    sendSuccess(res, employee, 'Employee updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    await employeesService.deleteEmployee(id);
    sendSuccess(res, null, 'Employee deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getEmployeesByShip = async (req, res, next) => {
  try {
    const { shipId } = req.params;
    const employees = await employeesService.getEmployeesByShip(shipId);
    sendSuccess(res, employees, 'Employees retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getEmployeesByShip,
};