const { sendSuccess } = require('../../utils/apiResponse');
const { HTTP_STATUS } = require('../../config/constants');
const svc = require('./salary.service');

const createRecord  = async (req, res, next) => { try { const r = await svc.createSalaryRecord({ ...req.body, createdBy: req.user.id }); sendSuccess(res, r, 'Salary record created', HTTP_STATUS.CREATED); } catch(e) { next(e); } };
const getRecords    = async (req, res, next) => { try { const r = await svc.getSalaryRecords(req.query); sendSuccess(res, r, 'Salary records retrieved'); } catch(e) { next(e); } };
const getRecord     = async (req, res, next) => { try { const r = await svc.getSalaryRecordById(req.params.id); sendSuccess(res, r, 'Salary record retrieved'); } catch(e) { next(e); } };
const deleteRecord  = async (req, res, next) => { try { await svc.deleteSalaryRecord(req.params.id); sendSuccess(res, null, 'Salary record deleted'); } catch(e) { next(e); } };

const addPayment    = async (req, res, next) => { try { const r = await svc.addPayment(req.params.id, { ...req.body, receiptUrl: req.file ? `/uploads/${req.file.filename}` : null, createdBy: req.user.id }); sendSuccess(res, r, 'Payment recorded', HTTP_STATUS.CREATED); } catch(e) { next(e); } };
const deletePayment = async (req, res, next) => { try { const r = await svc.deletePayment(req.params.paymentId); sendSuccess(res, r, 'Payment reversed'); } catch(e) { next(e); } };

const addBonus      = async (req, res, next) => { try { const r = await svc.addBonus(req.params.id, { ...req.body, receiptUrl: req.file ? `/uploads/${req.file.filename}` : null, createdBy: req.user.id }); sendSuccess(res, r, 'Bonus recorded', HTTP_STATUS.CREATED); } catch(e) { next(e); } };
const addDeduction  = async (req, res, next) => { try { const r = await svc.addDeduction(req.params.id, { ...req.body, createdBy: req.user.id }); sendSuccess(res, r, 'Deduction recorded', HTTP_STATUS.CREATED); } catch(e) { next(e); } };

const getMonthlyAnalytics = async (req, res, next) => { try { const { year, month } = req.params; const r = await svc.getMonthlyAnalytics(year, month); sendSuccess(res, r, 'Analytics retrieved'); } catch(e) { next(e); } };
const getEmployeeHistory  = async (req, res, next) => { try { const r = await svc.getEmployeeHistory(req.params.employeeId); sendSuccess(res, r, 'History retrieved'); } catch(e) { next(e); } };
const getAvailableYears   = async (req, res, next) => { try { const r = await svc.getAvailableYears(); sendSuccess(res, r, 'Years retrieved'); } catch(e) { next(e); } };

module.exports = { createRecord, getRecords, getRecord, deleteRecord, addPayment, deletePayment, addBonus, addDeduction, getMonthlyAnalytics, getEmployeeHistory, getAvailableYears };
