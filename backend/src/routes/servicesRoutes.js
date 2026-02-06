const express = require('express');
const { getDb } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all services for a clinic
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { clinic_id } = req.query;
    const db = getDb();

    let query = `
      SELECT s.*, c.name as category_name 
      FROM services s 
      LEFT JOIN service_categories c ON s.category_id = c.id 
      WHERE s.is_active = 1
    `;
    const params = [];

    if (clinic_id) {
      query += ' AND s.clinic_id = ?';
      params.push(clinic_id);
    }

    query += ' ORDER BY s.name ASC';

    const [services] = await db.execute(query, params);

    res.json({
      success: true,
      services
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch services' 
    });
  }
});

// Get service by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const [services] = await db.execute(`
      SELECT s.*, c.name as category_name 
      FROM services s 
      LEFT JOIN service_categories c ON s.category_id = c.id 
      WHERE s.id = ? AND s.is_active = 1
    `, [id]);

    if (services.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Service not found' 
      });
    }

    res.json({
      success: true,
      service: services[0]
    });
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch service' 
    });
  }
});

module.exports = router;
