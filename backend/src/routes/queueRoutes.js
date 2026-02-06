const express = require('express');
const {
  getTodayQueue,
  updateQueueStatus,
  addToQueue,
  getQueueStats,
  removeFromQueue
} = require('../controllers/queueController');

const { authenticateToken } = require('../middleware/auth');
const joiValidate = require('../middleware/joiValidate');
const { createQueueEntry, updateQueueEntry } = require('../validation/commonSchemas');

const router = express.Router();

// Make queue creation and today endpoint public for testing
router.post('/', joiValidate(createQueueEntry), addToQueue);
router.get('/today', getTodayQueue);

// All other routes require authentication
router.use(authenticateToken);

// Get queue statistics
router.get('/stats', getQueueStats);

// Update queue status
router.patch('/:id/status', joiValidate(updateQueueEntry), updateQueueStatus);

// Remove from queue
router.delete('/:id', removeFromQueue);

module.exports = router;
