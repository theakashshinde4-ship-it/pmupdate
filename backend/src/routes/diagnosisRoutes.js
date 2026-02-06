/**
 * Diagnosis Routes
 * API endpoints for searching diagnoses and their related medications
 */

const express = require('express');
const router = express.Router();
const { getDb } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

/**
 * Search diagnoses by name or ICD code
 * GET /api/diagnoses/search?q=fever&limit=20
 */
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q, limit = 20, offset = 0 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ diagnoses: [] });
    }

    const db = getDb();
    const searchTerm = `%${q.toLowerCase()}%`;
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const offsetNum = Math.max(parseInt(offset) || 0, 0);

    // Search ICD-10 + ICD-11 local (if available)
    const params = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, limitNum, offsetNum];
    let diagnoses = [];
    let total = 0;

    try {
      const query = `
        SELECT * FROM (
          SELECT DISTINCT
            icd_code AS code,
            primary_description AS diagnosis_name,
            secondary_description AS description,
            chapter_code,
            'icd10' AS version
          FROM icd_codes
          WHERE (LOWER(primary_description) LIKE ?
            OR LOWER(secondary_description) LIKE ?
            OR LOWER(icd_code) LIKE ?)

          UNION ALL

          SELECT DISTINCT
            icd11_code AS code,
            preferred_label AS diagnosis_name,
            short_definition AS description,
            chapter_code,
            'icd11' AS version
          FROM icd11_codes
          WHERE (LOWER(preferred_label) LIKE ?
            OR LOWER(full_title) LIKE ?
            OR LOWER(icd11_code) LIKE ?)
        ) x
        ORDER BY x.diagnosis_name ASC
        LIMIT ? OFFSET ?
      `;

      const [rows] = await db.execute(query, params);
      diagnoses = rows || [];

      const countQuery = `
        SELECT
          (
            SELECT COUNT(*)
            FROM icd_codes
            WHERE (LOWER(primary_description) LIKE ?
              OR LOWER(secondary_description) LIKE ?
              OR LOWER(icd_code) LIKE ?)
          )
          +
          (
            SELECT COUNT(*)
            FROM icd11_codes
            WHERE (LOWER(preferred_label) LIKE ?
              OR LOWER(full_title) LIKE ?
              OR LOWER(icd11_code) LIKE ?)
          ) AS total
      `;
      const [countResult] = await db.execute(countQuery, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]);
      total = countResult[0]?.total || 0;
    } catch (e) {
      // Fallback: ICD-11 local table may not exist
      const query = `
        SELECT DISTINCT
          icd_code as code,
          primary_description as diagnosis_name,
          secondary_description as description,
          chapter_code,
          'icd10' as version
        FROM icd_codes
        WHERE (LOWER(primary_description) LIKE ?
          OR LOWER(secondary_description) LIKE ?
          OR LOWER(icd_code) LIKE ?)
        ORDER BY primary_description ASC
        LIMIT ${limitNum} OFFSET ${offsetNum}
      `;
      const [rows] = await db.execute(query, [searchTerm, searchTerm, searchTerm]);
      diagnoses = rows || [];

      const countQuery = `
        SELECT COUNT(*) as total FROM icd_codes
        WHERE (LOWER(primary_description) LIKE ?
          OR LOWER(secondary_description) LIKE ?
          OR LOWER(icd_code) LIKE ?)
      `;
      const [countResult] = await db.execute(countQuery, [searchTerm, searchTerm, searchTerm]);
      total = countResult[0]?.total || 0;
    }

    res.json({
      diagnoses,
      total,
      limit: limitNum,
      offset: offsetNum,
      hasMore: offsetNum + limitNum < total
    });
  } catch (error) {
    console.error('Search diagnoses error:', error);
    res.status(500).json({
      error: 'Failed to search diagnoses',
      details: error.message
    });
  }
});

/**
 * Suggest diagnoses by symptoms
 * GET /api/diagnoses/suggest-by-symptoms?symptoms=fever,cough&limit=10
 * Strategy:
 *  - Use snomed_clinical_findings to map clinical terms -> icd_code
 *  - Use symptom_medication_mapping to infer relevant meds, then find ICDs in icd_medication_mapping with overlapping meds
 */
router.get('/suggest-by-symptoms', authenticateToken, async (req, res) => {
  try {
    const { symptoms = '', limit = 10 } = req.query;
    const tokens = symptoms.split(',').map(s => s.trim()).filter(Boolean);

    if (tokens.length === 0) {
      return res.json({ diagnoses: [], total: 0 });
    }

    const db = getDb();
    const limitNum = Math.min(parseInt(limit) || 10, 50);

    // 1) ICD from snomed_clinical_findings
    const placeholders = tokens.map(() => '?').join(',');
    const likeClauses = tokens.map(() => 'LOWER(clinical_term) LIKE LOWER(?)').join(' OR ');
    const likeParams = tokens.map(t => `%${t}%`);

    const [icdFromFindings] = await db.execute(
      `SELECT icd_code, COUNT(*) AS hits
         FROM snomed_clinical_findings
        WHERE icd_code IS NOT NULL AND (${likeClauses})
        GROUP BY icd_code
        ORDER BY hits DESC
        LIMIT ${limitNum}`,
      likeParams
    );

    // 2) ICD via meds overlap: symptoms -> meds -> ICD meds mapping
    const [medsFromSymptoms] = await db.execute(
      `SELECT DISTINCT medication_name
         FROM symptom_medication_mapping
        WHERE ${tokens.map(() => 'LOWER(symptom_name) = LOWER(?)').join(' OR ')}`,
      tokens
    );
    const medNames = medsFromSymptoms.map(m => m.medication_name);

    let icdFromMeds = [];
    if (medNames.length > 0) {
      const medPlace = medNames.map(() => '?').join(',');
      const [rows] = await db.execute(
        `SELECT icd_code, COUNT(*) AS hits
           FROM icd_medication_mapping
          WHERE medication_name IN (${medPlace})
          GROUP BY icd_code
          ORDER BY hits DESC
          LIMIT ${limitNum}`,
        medNames
      );
      icdFromMeds = rows;
    }

    // Combine and rank
    const score = new Map();
    for (const r of icdFromFindings) {
      if (!r.icd_code) continue;
      score.set(r.icd_code, (score.get(r.icd_code) || 0) + r.hits * 2);
    }
    for (const r of icdFromMeds) {
      if (!r.icd_code) continue;
      score.set(r.icd_code, (score.get(r.icd_code) || 0) + r.hits);
    }

    const ranked = Array.from(score.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limitNum)
      .map(([icd_code, weight]) => ({ icd_code, weight }));

    // Fetch ICD labels
    let diagnoses = [];
    if (ranked.length > 0) {
      const codes = ranked.map(r => r.icd_code);
      const placeholders2 = codes.map(() => '?').join(',');
      const [labels] = await db.execute(
        `SELECT icd_code, primary_description
           FROM icd_codes
          WHERE icd_code IN (${placeholders2})`,
        codes
      );
      const labelMap = new Map(labels.map(l => [l.icd_code, l.primary_description]));
      diagnoses = ranked.map(r => ({
        icd_code: r.icd_code,
        diagnosis_name: labelMap.get(r.icd_code) || r.icd_code,
        score: r.weight
      }));
    }

    res.json({ diagnoses, total: diagnoses.length, symptoms: tokens });
  } catch (error) {
    console.error('Suggest diagnoses error:', error);
    res.status(500).json({ error: 'Failed to suggest diagnoses', details: error.message });
  }
});

/**
 * Get medications for a specific diagnosis (ICD code)
 * GET /api/diagnoses/:icd_code/medications?limit=20
 */
router.get('/:icd_code/medications', authenticateToken, async (req, res) => {
  try {
    const { icd_code } = req.params;
    const { limit = 20 } = req.query;

    if (!icd_code) {
      return res.status(400).json({ error: 'ICD code is required' });
    }

    const db = getDb();
    const limitNum = Math.min(parseInt(limit) || 20, 100);

    // Detect if this is ICD-11 code
    let isIcd11 = false;
    try {
      const [exists11] = await db.execute(
        'SELECT 1 FROM icd11_codes WHERE icd11_code = ? LIMIT 1',
        [icd_code]
      );
      isIcd11 = Array.isArray(exists11) && exists11.length > 0;
    } catch (e) {
      isIcd11 = false;
    }

    if (isIcd11) {
      const [rows] = await db.execute(
        `SELECT DISTINCT
           m.medication_name as name,
           m.dosage_form as form,
           m.strength,
           m.recommended_frequency as frequency,
           m.recommended_duration as duration,
           m.indication,
           m.evidence_level,
           m.guideline_source,
           m.is_first_line,
           m.priority,
           dr.standard_dosage,
           dr.max_daily_dose
         FROM icd11_medication_mapping m
         LEFT JOIN dosage_references dr
           ON dr.medication_name = m.medication_name
          AND (dr.dosage_form = m.dosage_form OR m.dosage_form IS NULL)
          AND (dr.strength = m.strength OR m.strength IS NULL)
         WHERE m.icd11_code = ?
         ORDER BY m.is_first_line DESC, m.priority ASC, m.medication_name ASC
         LIMIT ?`,
        [icd_code, limitNum]
      );

      return res.json({
        icd_code,
        medications: rows || [],
        count: rows ? rows.length : 0
      });
    }

    // Get medications from diagnosis_medication_mapping
    const query = `
      SELECT DISTINCT
        d.medication_name as name,
        d.dosage_form as form,
        d.strength,
        d.frequency,
        d.duration,
        d.indication,
        d.evidence_level,
        d.alternative_medications as alternatives
      FROM diagnosis_medication_mapping d
      WHERE d.icd_code = ?
      ORDER BY d.medication_name ASC
      LIMIT ${limitNum}
    `;

    const params = [icd_code];
    const [medications] = await db.execute(query, params);

    // Also get suggestions from dosage_references if mapping is empty
    let suggestedMeds = medications;
    if (medications.length === 0) {
      // Get from ICD-medication mapping
      const icdMedQuery = `
        SELECT DISTINCT
          m.medication_name as name,
          m.dosage_form as form,
          m.strength,
          m.recommended_frequency as frequency,
          m.recommended_duration as duration,
          m.notes as indication
        FROM dosage_references m
        WHERE m.icd_code = ?
        LIMIT ${limitNum}
      `;
      const [icdMeds] = await db.execute(icdMedQuery, [icd_code]);
      suggestedMeds = icdMeds;
    }

    res.json({
      icd_code,
      medications: suggestedMeds || [],
      count: suggestedMeds ? suggestedMeds.length : 0
    });
  } catch (error) {
    console.error('Get medications by diagnosis error:', error);
    res.status(500).json({
      error: 'Failed to get medications',
      details: error.message
    });
  }
});

/**
 * Get diagnosis details
 * GET /api/diagnoses/:icd_code
 */
router.get('/:icd_code', authenticateToken, async (req, res) => {
  try {
    const { icd_code } = req.params;

    if (!icd_code) {
      return res.status(400).json({ error: 'ICD code is required' });
    }

    const db = getDb();

    // Detect ICD-11
    let isIcd11 = false;
    try {
      const [exists11] = await db.execute(
        'SELECT 1 FROM icd11_codes WHERE icd11_code = ? LIMIT 1',
        [icd_code]
      );
      isIcd11 = Array.isArray(exists11) && exists11.length > 0;
    } catch (e) {
      isIcd11 = false;
    }

    if (isIcd11) {
      const [results] = await db.execute(
        `SELECT
           icd11_code as code,
           preferred_label as diagnosis_name,
           short_definition as description,
           chapter_code,
           block_code,
           linearization,
           classification_status,
           created_at
         FROM icd11_codes
         WHERE icd11_code = ?
         LIMIT 1`,
        [icd_code]
      );

      if (!results || results.length === 0) {
        return res.status(404).json({ error: 'Diagnosis not found' });
      }

      return res.json(results[0]);
    }

    const query = `
      SELECT
        icd_code as code,
        primary_description as diagnosis_name,
        secondary_description as description,
        chapter_code,
        group_code,
        code_type,
        created_at
      FROM icd_codes
      WHERE icd_code = ?
    `;

    const [results] = await db.execute(query, [icd_code]);

    if (results.length === 0) {
      return res.status(404).json({ error: 'Diagnosis not found' });
    }

    res.json(results[0]);
  } catch (error) {
    console.error('Get diagnosis error:', error);
    res.status(500).json({
      error: 'Failed to get diagnosis',
      details: error.message
    });
  }
});

module.exports = router;
