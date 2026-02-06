const express = require('express');
const {
  sendEmailNotification,
  sendWhatsAppNotification,
  sendSMSNotification,
  sendReceiptNotification,
  listNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');
const joiValidate = require('../middleware/joiValidate');
const { createNotification } = require('../validation/commonSchemas');

const router = express.Router();

router.get('/', authenticateToken, listNotifications);
router.patch('/read-all', authenticateToken, markAllNotificationsAsRead);
router.patch('/:id/read', authenticateToken, markNotificationAsRead);
router.post('/email', authenticateToken, joiValidate(createNotification), sendEmailNotification);
router.post('/whatsapp', authenticateToken, joiValidate(createNotification), sendWhatsAppNotification);
router.post('/sms', authenticateToken, joiValidate(createNotification), sendSMSNotification);
router.post('/receipt', authenticateToken, joiValidate(createNotification), sendReceiptNotification);

module.exports = router;
