const express = require('express');
const router = express.Router();
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middlewares/validate.middleware');
const authenticate = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/role.middleware');
const { upload } = require('../../middlewares/upload.middleware');
const employeesController = require('./employees.controller');
const { createEmployeeSchema, updateEmployeeSchema, employeeQuerySchema } = require('./employees.validation');

// All routes require authentication
router.use(authenticate);

// GET /api/employees - Get all employees (all authenticated roles)
router.get(
  '/',
  authorize(['ADMIN', 'ACCOUNTANT', 'MANAGER', 'VIEWER']),
  validate(employeeQuerySchema, 'query'),
  asyncHandler(employeesController.getEmployees)
);

// GET /api/employees/:id - Get employee by ID (ACCOUNTANT and above)
router.get(
  '/:id',
  authorize(['ADMIN', 'ACCOUNTANT']),
  asyncHandler(employeesController.getEmployeeById)
);

// GET /api/ships/:shipId/employees - Get employees by ship (ACCOUNTANT and above)
router.get(
  '/ships/:shipId',
  authorize(['ADMIN', 'ACCOUNTANT']),
  asyncHandler(employeesController.getEmployeesByShip)
);

// POST /api/employees - Create employee (ADMIN only)
router.post(
  '/',
  authorize(['ADMIN']),
  validate(createEmployeeSchema),
  asyncHandler(employeesController.createEmployee)
);

// PUT /api/employees/:id - Update employee (ADMIN only)
router.put(
  '/:id',
  authorize(['ADMIN']),
  validate(updateEmployeeSchema),
  asyncHandler(employeesController.updateEmployee)
);

// DELETE /api/employees/:id - Delete employee (ADMIN only)
router.delete(
  '/:id',
  authorize(['ADMIN']),
  asyncHandler(employeesController.deleteEmployee)
);

// POST /api/employees/:id/documents - Upload document
router.post(
  '/:id/documents',
  authorize(['ADMIN', 'ACCOUNTANT']),
  upload.single('file'),
  asyncHandler(employeesController.addDocument)
);

// DELETE /api/employees/:id/documents/:documentId - Delete document
router.delete(
  '/:id/documents/:documentId',
  authorize(['ADMIN']),
  asyncHandler(employeesController.deleteDocument)
);

module.exports = router;
