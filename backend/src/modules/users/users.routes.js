const express = require('express');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require('./users.controller');

const { authenticateToken, requireRole } = require('../../middleware/auth');
const { authorize } = require('../../platform/security/authorize');

const { auditLogger } = require('../../middleware/auditLogger');
const joiValidate = require('../../middleware/joiValidate');
const { createUser: createUserSchema, updateUser: updateUserSchema } = require('../../validation/commonSchemas');

const router = express.Router();

router.use(authenticateToken);

router.get('/', requireRole('admin', 'doctor', 'staff', 'sub_admin'), authorize('users.view'), getAllUsers);
router.get('/:id', requireRole('admin', 'doctor', 'staff', 'sub_admin'), authorize('users.view'), getUserById);

router.post('/', requireRole('admin', 'doctor'), authorize('users.create'), joiValidate(createUserSchema), auditLogger('USER'), createUser);
router.put('/:id', requireRole('admin'), authorize('users.edit'), joiValidate(updateUserSchema), auditLogger('USER'), updateUser);
router.delete('/:id', requireRole('admin'), authorize('users.delete'), auditLogger('USER'), deleteUser);

module.exports = router;
