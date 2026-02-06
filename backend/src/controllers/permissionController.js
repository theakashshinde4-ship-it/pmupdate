const { getDb } = require('../config/db');

// Permission definitions
const PERMISSIONS = {
  // Patient permissions
  'patients.view': ['admin', 'doctor', 'staff', 'sub_admin'],
  'patients.create': ['admin', 'doctor', 'staff', 'sub_admin'],
  'patients.edit': ['admin', 'doctor', 'staff', 'sub_admin'],
  'patients.delete': ['admin', 'doctor', 'staff', 'sub_admin'],
  'patients.merge': ['admin', 'doctor', 'staff', 'sub_admin'],

  // Appointment permissions
  'appointments.view': ['admin', 'doctor', 'staff', 'sub_admin'],
  'appointments.create': ['admin', 'doctor', 'staff', 'sub_admin'],
  'appointments.edit': ['admin', 'doctor', 'staff', 'sub_admin'],
  'appointments.delete': ['admin', 'doctor', 'staff', 'sub_admin'],

  // Prescription permissions
  'prescriptions.view': ['admin', 'doctor', 'staff', 'sub_admin'],
  'prescriptions.create': ['admin', 'doctor', 'staff', 'sub_admin'],
  'prescriptions.edit': ['admin', 'doctor', 'staff', 'sub_admin'],
  'prescriptions.delete': ['admin', 'doctor', 'staff', 'sub_admin'],

  // Billing permissions
  'bills.view': ['admin', 'doctor', 'staff', 'sub_admin'],
  'bills.create': ['admin', 'doctor', 'staff', 'sub_admin'],
  'bills.edit': ['admin', 'doctor', 'staff', 'sub_admin'],
  'bills.delete': ['admin', 'doctor', 'staff', 'sub_admin'],

  // Analytics permissions
  'analytics.view': ['admin', 'doctor'],
  'analytics.export': ['admin'],

  // Lab permissions
  'labs.view': ['admin', 'doctor', 'staff'],
  'labs.create': ['admin', 'doctor'],
  'labs.edit': ['admin', 'doctor'],
  'labs.delete': ['admin'],

  // User management permissions
  'users.view': ['admin', 'doctor', 'staff', 'sub_admin'],
  'users.create': ['admin', 'doctor'],
  'users.edit': ['admin'],
  'users.delete': ['admin'],

  'permissions.view': ['admin'],
  'permissions.me': ['admin', 'doctor', 'staff', 'sub_admin'],

  // Clinic management permissions
  'clinics.view': ['admin'],
  'clinics.create': ['admin'],
  'clinics.edit': ['admin'],
  'clinics.delete': ['admin'],

  // Audit log permissions
  'audit.view': ['admin'],

  // Settings permissions
  'settings.view': ['admin', 'doctor'],
  'settings.edit': ['admin']
};

/**
 * Check if user has permission
 */
function hasPermission(userRole, permission) {
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) {
    return false;
  }
  return allowedRoles.includes(userRole);
}

/**
 * Get all permissions for a role
 */
function getRolePermissions(role) {
  const permissions = [];
  for (const [permission, roles] of Object.entries(PERMISSIONS)) {
    if (roles.includes(role)) {
      permissions.push(permission);
    }
  }
  return permissions;
}

/**
 * Get all permissions (for admin UI)
 */
async function getAllPermissions(req, res) {
  try {
    const permissions = Object.keys(PERMISSIONS).map(permission => ({
      permission,
      allowedRoles: PERMISSIONS[permission]
    }));

    res.json({ permissions });
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
}

/**
 * Get user permissions
 */
async function getUserPermissions(req, res) {
  try {
    const userRole = req.user?.role;
    if (!userRole) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const permissions = getRolePermissions(userRole);
    res.json({ 
      role: userRole,
      permissions 
    });
  } catch (error) {
    console.error('Get user permissions error:', error);
    res.status(500).json({ error: 'Failed to fetch user permissions' });
  }
}

/**
 * Check permission middleware
 */
function checkPermission(permission) {
  return (req, res, next) => {
    const userRole = req.user?.role;
    if (!userRole) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!hasPermission(userRole, permission)) {
      return res.status(403).json({ 
        error: 'Permission denied',
        message: `You do not have permission to ${permission}`
      });
    }

    next();
  };
}

module.exports = {
  hasPermission,
  getRolePermissions,
  getAllPermissions,
  getUserPermissions,
  checkPermission,
  PERMISSIONS
};

