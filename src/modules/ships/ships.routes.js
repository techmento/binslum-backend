const express = require('express');
const router = express.Router();
const asyncHandler = require('../../utils/asyncHandler');
const validate = require('../../middlewares/validate.middleware');
const authenticate = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/role.middleware');
const shipsController = require('./ships.controller');
const { createShipSchema, updateShipSchema, shipQuerySchema } = require('./ships.validation');

// All routes require authentication
router.use(authenticate);

// GET /api/ships - Get all ships (MANAGER and above)
router.get(
  '/',
  authorize(['ADMIN', 'ACCOUNTANT', 'MANAGER', 'VIEWER']),
  validate(shipQuerySchema, 'query'),
  asyncHandler(shipsController.getAllShips)
);

// GET /api/ships/:id - Get ship by ID (MANAGER and above)
router.get(
  '/:id',
  authorize(['ADMIN', 'ACCOUNTANT', 'MANAGER', 'VIEWER']),
  asyncHandler(shipsController.getShipById)
);

// GET /api/ships/:id/stats - Get ship statistics (MANAGER and above)
router.get(
  '/:id/stats',
  authorize(['ADMIN', 'ACCOUNTANT', 'MANAGER', 'VIEWER']),
  asyncHandler(shipsController.getShipStats)
);

// POST /api/ships - Create ship (ADMIN only)
router.post(
  '/',
  authorize(['ADMIN']),
  validate(createShipSchema),
  asyncHandler(shipsController.createShip)
);

// PUT /api/ships/:id - Update ship (ADMIN only)
router.put(
  '/:id',
  authorize(['ADMIN']),
  validate(updateShipSchema),
  asyncHandler(shipsController.updateShip)
);

// DELETE /api/ships/:id - Delete ship (ADMIN only)
router.delete(
  '/:id',
  authorize(['ADMIN']),
  asyncHandler(shipsController.deleteShip)
);

module.exports = router;
