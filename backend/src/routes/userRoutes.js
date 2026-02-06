// src/routes/userRoutes.js
const express = require('express');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');

// ✅ SAHI IMPORT - Destructuring se dono middleware
const { authenticateToken, requireRole } = require('../middleware/auth');

const { auditLogger } = require('../middleware/auditLogger');
const joiValidate = require('../middleware/joiValidate');
const { createUser: createUserSchema, updateUser: updateUserSchema } = require('../validation/commonSchemas');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken); // Ab authenticateToken function hai!

// Get all users (admin, doctor, staff, and sub_admin can view)
router.get('/', requireRole('admin', 'doctor', 'staff', 'sub_admin'), getAllUsers);

// Get user by ID (admin, doctor, staff, and sub_admin can view)
router.get('/:id', requireRole('admin', 'doctor', 'staff', 'sub_admin'), getUserById);

// Create new user (admin and doctor can create staff)
router.post('/', requireRole('admin', 'doctor'), joiValidate(createUserSchema), auditLogger('USER'), createUser);

// Update user (admin only)
router.put('/:id', requireRole('admin'), joiValidate(updateUserSchema), auditLogger('USER'), updateUser);

// Delete user (admin only)
router.delete('/:id', requireRole('admin'), auditLogger('USER'), deleteUser);

module.exports = router;