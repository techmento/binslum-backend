const { sendSuccess, sendError } = require('../../utils/apiResponse');
const { HTTP_STATUS } = require('../../config/constants');
const shipsService = require('./ships.service');

const createShip = async (req, res, next) => {
  try {
    const ship = await shipsService.createShip(req.body);
    sendSuccess(res, ship, 'Ship created successfully', HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

const getAllShips = async (req, res, next) => {
  try {
    const query = {
      status: req.query.status,
      search: req.query.search,
      limit: parseInt(req.query.limit) || 20,
      skip: (parseInt(req.query.page) - 1) * parseInt(req.query.limit) || 0,
    };

    const result = await shipsService.getAllShips(query);
    sendSuccess(res, result, 'Ships retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getShipById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ship = await shipsService.getShipById(id);
    sendSuccess(res, ship, 'Ship retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateShip = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ship = await shipsService.updateShip(id, req.body);
    sendSuccess(res, ship, 'Ship updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteShip = async (req, res, next) => {
  try {
    const { id } = req.params;
    await shipsService.deleteShip(id);
    sendSuccess(res, null, 'Ship deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getShipStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const stats = await shipsService.getShipStats(id);
    sendSuccess(res, stats, 'Ship statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createShip,
  getAllShips,
  getShipById,
  updateShip,
  deleteShip,
  getShipStats,
};