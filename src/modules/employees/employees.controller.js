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

const addDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      const e = new Error('Document file is required'); e.statusCode = 400; throw e;
    }
    const { name } = req.body;
    if (!name?.trim()) {
      const e = new Error('Document name is required'); e.statusCode = 400; throw e;
    }
    const doc = await employeesService.addDocument(req.params.id, {
      name: name.trim(),
      fileUrl: `/uploads/${req.file.filename}`,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedBy: req.user.id,
    });
    sendSuccess(res, doc, 'Document uploaded successfully', HTTP_STATUS.CREATED);
  } catch (error) { next(error); }
};

const deleteDocument = async (req, res, next) => {
  try {
    await employeesService.deleteDocument(req.params.documentId);
    sendSuccess(res, null, 'Document deleted successfully');
  } catch (error) { next(error); }
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