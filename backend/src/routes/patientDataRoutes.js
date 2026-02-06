const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { imageOptimizationMiddleware } = require('../middleware/imageOptimizer');
const {
  listRecords,
  addRecord,
  listLabs,
  addLab,
  listVitals,
  addVital,
  listTimeline,
  upload
} = require('../controllers/patientDataController');
const joiValidate = require('../middleware/joiValidate');
const { addVitals, addLabRecord } = require('../validation/commonSchemas');

const router = express.Router();

router.get('/records/:patientId', authenticateToken, listRecords);
router.post('/records/:patientId', authenticateToken, upload, imageOptimizationMiddleware(), addRecord);
router.get('/labs/:patientId', authenticateToken, listLabs);
router.post('/labs/:patientId', authenticateToken, joiValidate(addLabRecord), addLab);
router.get('/vitals/:patientId', authenticateToken, listVitals);
router.post('/vitals/:patientId', authenticateToken, joiValidate(addVitals), addVital);
router.get('/timeline/:patientId', authenticateToken, listTimeline);

module.exports = router;
