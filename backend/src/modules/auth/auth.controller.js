const legacyAuthController = require('../../controllers/authController');

module.exports = {
  login: legacyAuthController.login,
  register: legacyAuthController.register,
  verifyToken: legacyAuthController.verifyToken,
  refreshToken: legacyAuthController.refreshToken,
  logout: legacyAuthController.logout,
  verifyCredentials: legacyAuthController.verifyCredentials
};
