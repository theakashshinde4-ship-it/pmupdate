const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get clinical data
router.get('/', async (req, res) => {
  try {
    const { query } = require('../config/db');
    
    // Get recent clinical records
    const [clinicalRecords] = await query(`
      SELECT
        mr.id,
        mr.patient_id,
        mr.doctor_id,
        mr.record_title as chief_complaint,
        mr.description as diagnosis,
        mr.created_at,
        p.name as patient_name,
        p.phone as patient_phone,
        u.name as doctor_name
      FROM medical_records mr
      LEFT JOIN patients p ON mr.patient_id = p.id
      LEFT JOIN doctors d ON mr.doctor_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      ORDER BY mr.created_at DESC
      LIMIT 50
    `);
    
    // Get clinical stats
    const [stats] = await query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT patient_id) as unique_patients,
        COUNT(DISTINCT doctor_id) as active_doctors
      FROM medical_records
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);
    
    res.json({
      clinicalRecords,
      stats: stats[0] || {
        total_records: 0,
        unique_patients: 0,
        active_doctors: 0
      }
    });
  } catch (error) {
    console.error('Error fetching clinical data:', error);
    res.status(500).json({ error: 'Failed to fetch clinical data' });
  }
});

// Get clinical record by ID
router.get('/:id', async (req, res) => {
  try {
    const { query } = require('../config/db');
    const { id } = req.params;
    
    const [records] = await query(`
      SELECT
        mr.record_title as chief_complaint,
        mr.description as diagnosis,
        mr.created_at,
        p.name as patient_name,
        p.phone as patient_phone,
        p.age,
        p.gender,
        u.name as doctor_name
      FROM medical_records mr
      LEFT JOIN patients p ON mr.patient_id = p.id
      LEFT JOIN doctors d ON mr.doctor_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      WHERE mr.id = ?
    `, [id]);
    
    if (records.length === 0) {
      return res.status(404).json({ error: 'Clinical record not found' });
    }
    
    res.json({ record: records[0] });
  } catch (error) {
    console.error('Error fetching clinical record:', error);
    res.status(500).json({ error: 'Failed to fetch clinical record' });
  }
});

module.exports = router;
