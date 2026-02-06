const express = require('express');
const {
  listMedicalCertificates,
  getMedicalCertificate,
  createMedicalCertificate,
  updateMedicalCertificate,
  deleteMedicalCertificate,
  listCertificateTemplates,
  getCertificateTemplate,
  createCertificateTemplate,
  updateCertificateTemplate,
  deleteCertificateTemplate
} = require('../controllers/medicalCertificateController');
const { authenticateToken } = require('../middleware/auth');
const joiValidate = require('../middleware/joiValidate');
const { createMedicalCertificate: createMedicalCertificateSchema, updateMedicalCertificate: updateMedicalCertificateSchema } = require('../validation/commonSchemas');

const router = express.Router();

// Medical certificate routes
router.get('/', authenticateToken, listMedicalCertificates);
router.get('/:id', authenticateToken, getMedicalCertificate);
router.post('/', authenticateToken, joiValidate(createMedicalCertificateSchema), createMedicalCertificate);
router.put('/:id', authenticateToken, joiValidate(updateMedicalCertificateSchema), updateMedicalCertificate);
router.delete('/:id', authenticateToken, deleteMedicalCertificate);

// Certificate template routes
router.get('/templates/list', authenticateToken, listCertificateTemplates);
router.get('/templates/:id', authenticateToken, getCertificateTemplate);
router.post('/templates', authenticateToken, createCertificateTemplate);
router.put('/templates/:id', authenticateToken, updateCertificateTemplate);
router.delete('/templates/:id', authenticateToken, deleteCertificateTemplate);

module.exports = router;
