const legacyPermissionController = require('../../controllers/permissionController');

module.exports = {
  getAllPermissions: legacyPermissionController.getAllPermissions,
  getUserPermissions: legacyPermissionController.getUserPermissions
};
