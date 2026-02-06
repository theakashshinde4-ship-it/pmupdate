/**
 * Medicine Search & Suggestions API
 * Searches from:
 *  - medicines table (51 entries, doctor-specific ranking)
 *  - snomed_medications (47K+ entries)
 *  - dosage_references (98 entries with full dosage info)
 */

const express = require('express');
const router = express.Router();
const { getDb } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

/**
 * Search medicines with intelligent ranking from ALL sources
 * GET /api/medicines/search?q=paracetamol&limit=20
 */
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    const userId = req.user?.id;

    if (!q || q.trim().length < 1) {
      return res.json({ medicines: [] });
    }

    const db = getDb();
    const mysql = require('mysql2');
    const searchTerm = q.trim().toLowerCase();
    const like = `%${searchTerm}%`;
    const startsWith = `${searchTerm}%`;
    const limitNum = Math.min(parseInt(limit) || 20, 50);

    // 1. Search local medicines table (highest priority - has doctor usage data)
    let localMeds = [];
    try {
      const [rows] = await db.query(
        `SELECT
          m.id, m.name, m.generic_name, m.strength, m.dosage_form, m.brand,
          m.usage_count as global_usage,
          COALESCE(fu.usage_count, 0) as doctor_usage,
          'local' as source
        FROM medicines m
        LEFT JOIN frequently_used fu ON m.id = fu.item_id
          AND fu.user_id = ${mysql.escape(userId)}
          AND fu.item_type = 'medicine'
        WHERE m.is_active = 1
          AND (m.name LIKE ${mysql.escape(like)} OR m.generic_name LIKE ${mysql.escape(like)})
        ORDER BY
          CASE WHEN fu.usage_count IS NOT NULL THEN 0 ELSE 1 END,
          fu.usage_count DESC,
          CASE WHEN m.name LIKE ${mysql.escape(startsWith)} THEN 0 ELSE 1 END,
          LENGTH(m.name) ASC
        LIMIT 10`
      );
      localMeds = rows;
    } catch (e) {
      console.error('Local medicine search error:', e.message);
    }

    // 2. Search dosage_references (has full dosage info)
    let dosageMeds = [];
    try {
      const [rows] = await db.query(
        `SELECT DISTINCT
          medication_name as name, dosage_form, strength,
          standard_dosage, recommended_frequency, recommended_duration,
          route_of_administration, active_ingredient as generic_name,
          'dosage_ref' as source
        FROM dosage_references
        WHERE LOWER(medication_name) LIKE ${mysql.escape(like)}
          OR LOWER(active_ingredient) LIKE ${mysql.escape(like)}
        ORDER BY
          CASE WHEN LOWER(medication_name) LIKE ${mysql.escape(startsWith)} THEN 0 ELSE 1 END,
          LENGTH(medication_name)
        LIMIT 10`
      );
      dosageMeds = rows;
    } catch (e) {
      console.error('Dosage references search error:', e.message);
    }

    // 3. Search snomed_medications (largest dataset)
    let snomedMeds = [];
    try {
      const [rows] = await db.query(
        `SELECT
          snomed_id, medication_name as name, brand_name as brand,
          substance_name as generic_name, dose_form as dosage_form,
          CONCAT(COALESCE(strength_value,''), ' ', COALESCE(strength_unit,'')) as strength,
          route_of_administration,
          'snomed' as source
        FROM snomed_medications
        WHERE is_active = 1 AND (
          LOWER(medication_name) LIKE ${mysql.escape(like)}
          OR LOWER(brand_name) LIKE ${mysql.escape(like)}
          OR LOWER(substance_name) LIKE ${mysql.escape(like)}
        )
        ORDER BY
          CASE WHEN LOWER(medication_name) LIKE ${mysql.escape(startsWith)} THEN 0 ELSE 1 END,
          LENGTH(medication_name)
        LIMIT ${limitNum}`
      );
      snomedMeds = rows;
    } catch (e) {
      console.error('SNOMED medication search error:', e.message);
    }

    // Combine and dedup
    const seen = new Set();
    const medicines = [];

    // Local first (doctor-specific)
    for (const m of localMeds) {
      const key = (m.name || '').toLowerCase().trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        medicines.push(m);
      }
    }

    // Dosage refs second (has dosage data)
    for (const m of dosageMeds) {
      const key = (m.name || '').toLowerCase().trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        medicines.push(m);
      }
    }

    // SNOMED last (largest dataset)
    for (const m of snomedMeds) {
      const key = (m.name || '').toLowerCase().trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        medicines.push(m);
      }
    }

    res.json({
      medicines: medicines.slice(0, limitNum),
      total: medicines.length,
      query: q
    });

  } catch (error) {
    console.error('Medicine search error:', error);
    res.status(500).json({
      error: 'Failed to search medicines',
      details: error.message
    });
  }
});

/**
 * Get dosage info for a medicine by name
 * GET /api/medicines/dosage?name=Paracetamol
 */
router.get('/dosage', authenticateToken, async (req, res) => {
  try {
    const { name } = req.query;
    if (!name || name.trim().length < 1) {
      return res.json({ dosage: null });
    }

    const db = getDb();
    const mysql = require('mysql2');
    const searchName = name.trim().toLowerCase();

    // Search dosage_references for exact or close match
    const [rows] = await db.query(
      `SELECT
        medication_name, active_ingredient, dosage_form, strength,
        standard_dosage, max_daily_dose, recommended_frequency, recommended_duration,
        route_of_administration, special_instructions, contraindications, side_effects,
        drug_interactions, age_group, pregnancy_category, category
      FROM dosage_references
      WHERE LOWER(medication_name) LIKE ${mysql.escape('%' + searchName + '%')}
        OR LOWER(active_ingredient) LIKE ${mysql.escape('%' + searchName + '%')}
      ORDER BY
        CASE WHEN LOWER(medication_name) = ${mysql.escape(searchName)} THEN 0
             WHEN LOWER(medication_name) LIKE ${mysql.escape(searchName + '%')} THEN 1
             ELSE 2 END
      LIMIT 5`
    );

    res.json({
      dosage: rows.length > 0 ? rows[0] : null,
      alternatives: rows.slice(1),
      count: rows.length
    });
  } catch (error) {
    console.error('Dosage lookup error:', error);
    res.status(500).json({ error: 'Failed to get dosage info' });
  }
});

/**
 * Get medicines suggested for a diagnosis (ICD code)
 * GET /api/medicines/for-diagnosis/:icd_code?limit=8
 */
router.get('/for-diagnosis/:icd_code', authenticateToken, async (req, res) => {
  try {
    const { icd_code } = req.params;
    const { limit = 8 } = req.query;
    const userId = req.user?.id;

    if (!icd_code) {
      return res.status(400).json({ error: 'ICD code required' });
    }

    const db = getDb();
    const limitNum = Math.min(parseInt(limit) || 8, 20);

    const [medicines] = await db.execute(
      `SELECT
        dmm.id, dmm.medicine_id, dmm.medicine_name,
        dmm.default_dosage, dmm.default_frequency, dmm.default_duration,
        dmm.priority, dmm.usage_count,
        m.strength, m.dosage_form,
        CASE WHEN dmm.doctor_id = ? THEN 'custom' ELSE 'standard' END as mapping_type
      FROM diagnosis_medicine_mapping dmm
      LEFT JOIN medicines m ON dmm.medicine_id = m.id
      WHERE dmm.icd_code = ?
        AND (dmm.doctor_id = ? OR dmm.doctor_id IS NULL)
      ORDER BY
        CASE WHEN dmm.doctor_id = ? THEN 0 ELSE 1 END,
        dmm.priority DESC,
        dmm.usage_count DESC
      LIMIT ?`,
      [userId, icd_code, userId, userId, limitNum]
    );

    res.json({ medicines, total: medicines.length, icd_code });
  } catch (error) {
    console.error('Diagnosis medicines error:', error);
    res.status(500).json({ error: 'Failed to get diagnosis medicines' });
  }
});

/**
 * Get doctor's frequently used medicines
 * GET /api/medicines/frequent?limit=12
 */
router.get('/frequent', authenticateToken, async (req, res) => {
  try {
    const { limit = 12 } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const db = getDb();
    const limitNum = Math.min(parseInt(limit) || 12, 50);

    const [medicines] = await db.query(
      `SELECT
        fu.item_id as medicine_id,
        fu.item_name as medicine_name,
        fu.usage_count,
        fu.last_used,
        m.strength, m.dosage_form, m.generic_name
      FROM frequently_used fu
      LEFT JOIN medicines m ON fu.item_id = m.id
      WHERE fu.user_id = ? AND fu.item_type = 'medicine'
      ORDER BY fu.usage_count DESC, fu.last_used DESC
      LIMIT ${limitNum}`,
      [userId]
    );

    res.json({ medicines, total: medicines.length });
  } catch (error) {
    console.error('Frequent medicines error:', error);
    res.status(500).json({ error: 'Failed to get frequent medicines' });
  }
});

/**
 * Get medicine defaults by ID
 * GET /api/medicines/:id/defaults
 */
router.get('/:id/defaults', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const [[med]] = await db.execute(
      `SELECT name, generic_name, strength, dosage_form FROM medicines WHERE id = ?`,
      [id]
    );

    if (!med) {
      return res.json({ defaults: {} });
    }

    // Try dosage_references for this medicine
    const mysql = require('mysql2');
    const [dosageRows] = await db.query(
      `SELECT standard_dosage, recommended_frequency, recommended_duration, route_of_administration
       FROM dosage_references
       WHERE LOWER(medication_name) LIKE ${mysql.escape('%' + med.name.toLowerCase() + '%')}
         OR LOWER(active_ingredient) LIKE ${mysql.escape('%' + (med.generic_name || '').toLowerCase() + '%')}
       LIMIT 1`
    );

    const dosage = dosageRows[0] || {};

    res.json({
      defaults: {
        dosage: dosage.standard_dosage || med.strength || '',
        frequency: dosage.recommended_frequency || '1-0-1',
        duration: dosage.recommended_duration || '7 days',
        route: dosage.route_of_administration || ''
      }
    });
  } catch (error) {
    console.error('Medicine defaults error:', error);
    res.json({ defaults: {} });
  }
});

/**
 * Get recent medicines for patient
 * GET /api/medicines/patient/:patientId/recent
 */
router.get('/patient/:patientId/recent', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { limit = 10 } = req.query;
    const db = getDb();
    const limitNum = Math.min(parseInt(limit) || 10, 50);

    // Try to get from prescription history
    try {
      const [meds] = await db.query(
        `SELECT DISTINCT medication_name as name, dosage, frequency, duration
         FROM prescription_medications
         WHERE prescription_id IN (
           SELECT id FROM prescriptions WHERE patient_id = ? ORDER BY created_at DESC LIMIT 10
         )
         LIMIT ${limitNum}`,
        [patientId]
      );
      return res.json({ medications: meds });
    } catch (e) {
      return res.json({ medications: [] });
    }
  } catch (error) {
    console.error('Patient recent meds error:', error);
    res.json({ medications: [] });
  }
});

module.exports = router;
