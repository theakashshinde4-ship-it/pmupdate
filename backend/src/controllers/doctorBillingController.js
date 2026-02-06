const { getDb } = require('../config/db');

// Get doctor's billing dashboard
exports.getDoctorBillingDashboard = async (req, res) => {
  try {
    const db = getDb();
    const doctorId = req.user.id;
    
    // Get unbilled visits (both skipped and regular)
    const [unbilledVisits] = await db.execute(`
      SELECT 
        q.id as queue_id,
        q.appointment_id,
        q.patient_id,
        q.completed_at,
        q.visit_status,
        p.patient_id as uhid,
        p.name as patient_name,
        p.phone,
        a.appointment_date,
        a.appointment_time,
        d.consultation_fee,
        CASE 
          WHEN q.visit_status = 'with_staff' THEN 'Pending with Staff'
          WHEN q.visit_status = 'unbilled' THEN 'Available for Billing'
          ELSE 'Ready for Billing'
        END as billing_status,
        TIMESTAMPDIFF(MINUTE, q.completed_at, NOW()) as wait_time_minutes
      FROM queue q
      LEFT JOIN appointments a ON q.appointment_id = a.id
      LEFT JOIN patients p ON q.patient_id = p.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      LEFT JOIN bills b ON b.appointment_id = q.appointment_id
      WHERE q.status = 'completed' 
        AND a.doctor_id = ?
        AND DATE(q.completed_at) = CURDATE()
        AND b.id IS NULL
      ORDER BY q.completed_at DESC
    `, [doctorId]);
    
    // Get billed payments (fully paid)
    const [billedPayments] = await db.execute(`
      SELECT 
        b.id,
        b.bill_number,
        b.bill_date,
        b.total_amount,
        b.amount_paid,
        b.payment_status,
        b.payment_method,
        p.patient_id as uhid,
        p.name as patient_name,
        p.phone,
        a.appointment_date,
        a.appointment_time
      FROM bills b
      LEFT JOIN appointments a ON b.appointment_id = a.id
      LEFT JOIN patients p ON b.patient_id = p.id
      WHERE a.doctor_id = ?
        AND b.payment_status = 'paid'
        AND DATE(b.bill_date) = CURDATE()
      ORDER BY b.bill_date DESC
    `, [doctorId]);
    
    // Get pending payments (partial or unpaid)
    const [pendingPayments] = await db.execute(`
      SELECT 
        b.id,
        b.bill_number,
        b.bill_date,
        b.total_amount,
        b.amount_paid,
        b.balance_due,
        b.payment_status,
        b.payment_method,
        p.patient_id as uhid,
        p.name as patient_name,
        p.phone,
        a.appointment_date,
        a.appointment_time
      FROM bills b
      LEFT JOIN appointments a ON b.appointment_id = a.id
      LEFT JOIN patients p ON b.patient_id = p.id
      WHERE a.doctor_id = ?
        AND b.payment_status IN ('pending', 'partial')
        AND DATE(b.bill_date) = CURDATE()
      ORDER BY b.bill_date DESC
    `, [doctorId]);
    
    // Calculate summary
    const totalCollected = billedPayments.reduce((sum, b) => sum + parseFloat(b.amount_paid || 0), 0);
    const totalOutstanding = pendingPayments.reduce((sum, b) => sum + parseFloat(b.balance_due || 0), 0);
    
    res.json({
      success: true,
      data: {
        unbilledVisits,
        billedPayments,
        pendingPayments,
        summary: {
          totalCollected,
          totalOutstanding,
          unbilledCount: unbilledVisits.length,
          billedCount: billedPayments.length,
          pendingCount: pendingPayments.length
        }
      }
    });
  } catch (error) {
    console.error('Get doctor billing dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch billing dashboard' });
  }
};

// Create bill from visit (for doctors - same logic as staff)
exports.createBillFromVisit = async (req, res) => {
  try {
    const { queue_id, services } = req.body;
    const db = getDb();
    
    // Check if bill already exists (first to bill wins)
    const [existingBill] = await db.execute(`
      SELECT b.id FROM bills b
      INNER JOIN queue q ON b.appointment_id = q.appointment_id
      WHERE q.id = ?
    `, [queue_id]);
    
    if (existingBill.length > 0) {
      return res.status(409).json({ 
        success: false, 
        error: 'Bill already created by another user',
        bill_id: existingBill[0].id
      });
    }
    
    // Get visit details
    const [visit] = await db.execute(`
      SELECT q.*, p.patient_id as uhid, a.doctor_id, d.consultation_fee, c.id as clinic_id
      FROM queue q
      LEFT JOIN appointments a ON q.appointment_id = a.id
      LEFT JOIN patients p ON q.patient_id = p.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      LEFT JOIN clinics c ON c.id = 2
      WHERE q.id = ?
    `, [queue_id]);
    
    if (visit.length === 0) {
      return res.status(404).json({ error: 'Visit not found' });
    }
    
    const v = visit[0];
    const billNumber = `BILL${Date.now()}`;
    const subtotal = services.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
    
    // Create bill with transaction to prevent race conditions
    await db.beginTransaction();
    
    try {
      // Double-check if bill exists (within transaction)
      const [doubleCheck] = await db.execute(`
        SELECT b.id FROM bills b
        INNER JOIN queue q ON b.appointment_id = q.appointment_id
        WHERE q.id = ?
      `, [queue_id]);
      
      if (doubleCheck.length > 0) {
        await db.rollback();
        return res.status(409).json({ 
          success: false, 
          error: 'Bill already created by another user',
          bill_id: doubleCheck[0].id
        });
      }
      
      // Create bill
      const [result] = await db.execute(`
        INSERT INTO bills (
          patient_id, appointment_id, clinic_id, doctor_id, bill_number,
          subtotal, total_amount, balance_due, payment_status, bill_date, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        v.patient_id, v.appointment_id, v.clinic_id, v.doctor_id, billNumber,
        subtotal, subtotal, subtotal, 'pending', new Date(), req.user.id
      ]);
      
      // Add bill items
      const billId = result.insertId;
      for (let i = 0; i < services.length; i++) {
        const service = services[i];
        await db.execute(`
          INSERT INTO bill_items (
            bill_id, service_name, quantity, unit_price, total_price
          ) VALUES (?, ?, ?, ?, ?)
        `, [
          billId, service.service_name, service.quantity || 1, 
          service.unit_price || 0, service.total || 0
        ]);
      }
      
      await db.commit();
      res.json({ success: true, bill_id: billId });
      
    } catch (error) {
      await db.rollback();
      throw error;
    }
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to create bill' });
  }
};
