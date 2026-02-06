const express = require('express');
const {
  getAllPermissions,
  getUserPermissions
} = require('./permissions.controller');
const { authenticateToken, requireRole } = require('../../middleware/auth');
const { authorize } = require('../../platform/security/authorize');

const router = express.Router();

router.get('/', authenticateToken, requireRole('admin'), authorize('permissions.view'), getAllPermissions);
router.get('/me', authenticateToken, authorize('permissions.me'), getUserPermissions);

module.exports = router;
