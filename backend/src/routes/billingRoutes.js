const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get billing data
router.get('/', async (req, res) => {
  try {
    const { query } = require('../config/db');
    
    // Get recent bills
    const bills = await query(`
      SELECT 
        b.id,
        b.bill_number,
        b.total_amount,
        b.amount_paid as paid_amount,
        b.payment_status as status,
        b.created_at,
        p.name as patient_name,
        p.phone as patient_phone
      FROM bills b
      LEFT JOIN patients p ON b.patient_id = p.id
      ORDER BY b.created_at DESC
      LIMIT 50
    `);
    
    // Get billing stats
    const stats = await query(`
      SELECT 
        COUNT(*) as total_bills,
        SUM(total_amount) as total_revenue,
        SUM(amount_paid) as total_paid,
        SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid_bills,
        SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as pending_bills
      FROM bills
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);
    
    res.json({
      bills,
      stats: stats[0] || {
        total_bills: 0,
        total_revenue: 0,
        total_paid: 0,
        paid_bills: 0,
        pending_bills: 0
      }
    });
  } catch (error) {
    console.error('Error fetching billing data:', error);
    res.status(500).json({ error: 'Failed to fetch billing data' });
  }
});

// Get billing receipts
router.get('/receipts', async (req, res) => {
  try {
    const { query } = require('../config/db');
    
    const receipts = await query(`
      SELECT 
        r.id,
        r.receipt_number,
        r.amount,
        r.payment_method,
        r.notes,
        r.created_at,
        b.bill_number,
        p.name as patient_name
      FROM receipts r
      LEFT JOIN bills b ON r.bill_id = b.id
      LEFT JOIN patients p ON b.patient_id = p.id
      ORDER BY r.created_at DESC
      LIMIT 50
    `);
    
    res.json({ receipts });
  } catch (error) {
    console.error('Error fetching receipts:', error);
    res.status(500).json({ error: 'Failed to fetch receipts' });
  }
});

module.exports = router;
