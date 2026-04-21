// const { sendSuccess, sendError } = require('../../utils/apiResponse');
// const payrollService = require('./payroll.service');

// const createPayroll = async (req, res) => {
//   const payroll = await payrollService.createPayroll(req.body, req.user.id);
//   return sendSuccess(res, 'Payroll created successfully', payroll, 201);
// };

// const getPayrolls = async (req, res) => {
//   const { page = 1, limit = 10, ...query } = req.query;
//   const skip = (page - 1) * limit;

//   const { payrolls, total } = await payrollService.getPayrolls({
//     ...query,
//     limit: parseInt(limit),
//     skip: parseInt(skip),
//   });

//   return sendSuccess(res, 'Payrolls retrieved successfully', {
//     payrolls,
//     pagination: {
//       page: parseInt(page),
//       limit: parseInt(limit),
//       total,
//       pages: Math.ceil(total / limit),
//     },
//   });
// };

// const getPayrollById = async (req, res) => {
//   const payroll = await payrollService.getPayrollById(req.params.id);
//   return sendSuccess(res, 'Payroll retrieved successfully', payroll);
// };

// const updatePayroll = async (req, res) => {
//   const payroll = await payrollService.updatePayroll(req.params.id, req.body, req.user.id);
//   return sendSuccess(res, 'Payroll updated successfully', payroll);
// };

// const processPayroll = async (req, res) => {
//   const payroll = await payrollService.processPayroll(req.params.id, req.user.id);
//   return sendSuccess(res, 'Payroll processed successfully', payroll);
// };

// const deletePayroll = async (req, res) => {
//   await payrollService.deletePayroll(req.params.id, req.user.id);
//   return sendSuccess(res, 'Payroll deleted successfully');
// };

// module.exports = {
//   createPayroll,
//   getPayrolls,
//   getPayrollById,
//   updatePayroll,
//   processPayroll,
//   deletePayroll,
// };















const { sendSuccess, sendError } = require('../../utils/apiResponse');
const payrollService = require('./payroll.service');

const createPayroll = async (req, res) => {
  const payroll = await payrollService.createPayroll(req.body, req.user.id);
  return sendSuccess(res, payroll, 'Payroll created successfully', 201);
};

const getPayrolls = async (req, res) => {
  const { page = 1, limit = 10, ...query } = req.query;
  const skip = (page - 1) * limit;

  const { payrolls, total } = await payrollService.getPayrolls({
    ...query,
    limit: parseInt(limit),
    skip: parseInt(skip),
  });

  return sendSuccess(
    res,
    {
      payrolls,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    },
    'Payrolls retrieved successfully'
  );
};

const getPayrollById = async (req, res) => {
  const payroll = await payrollService.getPayrollById(req.params.id);
  return sendSuccess(res, payroll, 'Payroll retrieved successfully');
};

const updatePayroll = async (req, res) => {
  const payroll = await payrollService.updatePayroll(req.params.id, req.body, req.user.id);
  return sendSuccess(res, payroll, 'Payroll updated successfully');
};

const processPayroll = async (req, res) => {
  const payroll = await payrollService.processPayroll(req.params.id, req.user.id);
  return sendSuccess(res, payroll, 'Payroll processed successfully');
};

const deletePayroll = async (req, res) => {
  await payrollService.deletePayroll(req.params.id, req.user.id);
  return sendSuccess(res, null, 'Payroll deleted successfully');
};

module.exports = {
  createPayroll,
  getPayrolls,
  getPayrollById,
  updatePayroll,
  processPayroll,
  deletePayroll,
};