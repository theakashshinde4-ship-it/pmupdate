const legacyUserController = require('../../controllers/userController');

module.exports = {
  getAllUsers: legacyUserController.getAllUsers,
  getUserById: legacyUserController.getUserById,
  createUser: legacyUserController.createUser,
  updateUser: legacyUserController.updateUser,
  deleteUser: legacyUserController.deleteUser
};
