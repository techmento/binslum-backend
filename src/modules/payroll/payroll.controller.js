const { apiResponse } = require('../../utils/apiResponse');
const payrollService = require('./payroll.service');

const createPayroll = async (req, res) => {
  const payroll = await payrollService.createPayroll(req.body, req.user.id);
  return apiResponse.success(res, 'Payroll created successfully', payroll, 201);
};

const getPayrolls = async (req, res) => {
  const { page = 1, limit = 10, ...query } = req.query;
  const skip = (page - 1) * limit;

  const { payrolls, total } = await payrollService.getPayrolls({
    ...query,
    limit: parseInt(limit),
    skip: parseInt(skip),
  });

  return apiResponse.success(res, 'Payrolls retrieved successfully', {
    payrolls,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
};

const getPayrollById = async (req, res) => {
  const payroll = await payrollService.getPayrollById(req.params.id);
  return apiResponse.success(res, 'Payroll retrieved successfully', payroll);
};

const updatePayroll = async (req, res) => {
  const payroll = await payrollService.updatePayroll(req.params.id, req.body, req.user.id);
  return apiResponse.success(res, 'Payroll updated successfully', payroll);
};

const processPayroll = async (req, res) => {
  const payroll = await payrollService.processPayroll(req.params.id, req.user.id);
  return apiResponse.success(res, 'Payroll processed successfully', payroll);
};

const deletePayroll = async (req, res) => {
  await payrollService.deletePayroll(req.params.id, req.user.id);
  return apiResponse.success(res, 'Payroll deleted successfully');
};

module.exports = {
  createPayroll,
  getPayrolls,
  getPayrollById,
  updatePayroll,
  processPayroll,
  deletePayroll,
};