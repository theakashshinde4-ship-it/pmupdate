/**
 * Symptoms Routes
 * Searches symptoms from:
 *  - snomed_clinical_findings (finding_type='Symptom') - clinical findings
 *  - symptom_medication_mapping - symptoms with medications
 */

const express = require('express');
const router = express.Router();
const { getDb } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

/**
 * Search symptoms from ALL sources
 * GET /api/symptoms/search?q=fever&limit=20
 */
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q, limit = 20, offset = 0 } = req.query;

    if (!q || q.trim().length < 1) {
      return res.json({ symptoms: [] });
    }

    const db = getDb();
    const mysql = require('mysql2');
    const searchTerm = q.trim().toLowerCase();
    const like = `%${searchTerm}%`;
    const startsWith = `${searchTerm}%`;
    const limitNum = Math.min(parseInt(limit) || 20, 50);

    // 1. Search symptom_medication_mapping (highest priority - has medication data)
    let mappingResults = [];
    try {
      const [rows] = await db.query(
        `SELECT
          symptom_name as symptom,
          MIN(severity_level) as severity_level,
          MIN(recommendation_priority) as recommendation_priority,
          COUNT(*) as medication_count
        FROM symptom_medication_mapping
        WHERE LOWER(symptom_name) LIKE ${mysql.escape(like)}
        GROUP BY symptom_name
        ORDER BY medication_count DESC
        LIMIT 10`
      );
      mappingResults = rows;
    } catch (e) {
      console.error('Mapping search error:', e.message);
    }

    // 2. Search snomed_clinical_findings for Symptom type
    let snomedResults = [];
    try {
      const [rows] = await db.query(
        `SELECT clinical_term, finding_type, snomed_id, icd_code
        FROM snomed_clinical_findings
        WHERE (finding_type = 'Symptom' OR finding_type = 'Sign' OR finding_type = 'Finding')
          AND LOWER(clinical_term) LIKE ${mysql.escape(like)}
          AND is_active = 1
        ORDER BY
          CASE WHEN finding_type = 'Symptom' THEN 0 WHEN finding_type = 'Sign' THEN 1 ELSE 2 END,
          LENGTH(clinical_term)
        LIMIT ${limitNum}`
      );
      snomedResults = rows;
    } catch (e) {
      console.error('SNOMED clinical findings search error:', e.message);
    }

    // 3. Also search from ICD codes descriptions for symptoms
    let icdSymptoms = [];
    try {
      const [rows] = await db.query(
        `SELECT DISTINCT primary_description as symptom, icd_code
        FROM icd_codes
        WHERE (icd_code LIKE 'R%' OR chapter_code = 'R')
          AND LOWER(primary_description) LIKE ${mysql.escape(like)}
        ORDER BY LENGTH(primary_description)
        LIMIT 10`
      );
      icdSymptoms = rows;
    } catch (e) {
      console.error('ICD symptoms search error:', e.message);
    }

    // Combine results with dedup
    const seen = new Set();
    const symptoms = [];

    // Add mapping results first (they have medication data)
    for (const r of mappingResults) {
      const key = (r.symptom || '').toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        symptoms.push({
          symptom: r.symptom,
          source: 'mapping',
          medication_count: r.medication_count,
          severity_level: r.severity_level
        });
      }
    }

    // Add SNOMED clinical findings
    for (const r of snomedResults) {
      const key = (r.clinical_term || '').toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        symptoms.push({
          symptom: r.clinical_term,
          source: 'snomed',
          finding_type: r.finding_type,
          snomed_id: r.snomed_id,
          icd_code: r.icd_code
        });
      }
    }

    // Add ICD symptom codes (Chapter R)
    for (const r of icdSymptoms) {
      const key = (r.symptom || '').toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        symptoms.push({
          symptom: r.symptom,
          source: 'icd',
          icd_code: r.icd_code
        });
      }
    }

    res.json({
      symptoms: symptoms.slice(0, limitNum),
      total: symptoms.length,
      query: q
    });
  } catch (error) {
    console.error('Search symptoms error:', error);
    res.status(500).json({
      error: 'Failed to search symptoms',
      details: error.message
    });
  }
});

/**
 * Get medications for a specific symptom
 * GET /api/symptoms/:symptom/medications?limit=20
 */
router.get('/:symptom/medications', authenticateToken, async (req, res) => {
  try {
    let { symptom } = req.params;
    const { limit = 20 } = req.query;

    if (!symptom) {
      return res.status(400).json({ error: 'Symptom is required' });
    }

    symptom = decodeURIComponent(symptom);
    const db = getDb();
    const limitNum = Math.min(parseInt(limit) || 20, 100);

    const [medications] = await db.query(
      `SELECT
        medication_name as name,
        dosage_form as form,
        strength,
        frequency,
        duration,
        severity_level,
        recommendation_priority,
        evidence_based,
        notes
      FROM symptom_medication_mapping
      WHERE LOWER(symptom_name) = LOWER(?)
      ORDER BY recommendation_priority ASC, medication_name ASC
      LIMIT ${limitNum}`,
      [symptom]
    );

    res.json({
      symptom,
      medications: medications || [],
      count: medications ? medications.length : 0
    });
  } catch (error) {
    console.error('Get medications by symptom error:', error);
    res.status(500).json({
      error: 'Failed to get medications',
      details: error.message
    });
  }
});

/**
 * Get related diagnoses for a symptom
 * GET /api/symptoms/:symptom/related?limit=10
 */
router.get('/:symptom/related', authenticateToken, async (req, res) => {
  try {
    let { symptom } = req.params;
    const { limit = 10 } = req.query;

    if (!symptom) {
      return res.status(400).json({ error: 'Symptom is required' });
    }

    symptom = decodeURIComponent(symptom);
    const db = getDb();
    const mysql = require('mysql2');
    const limitNum = Math.min(parseInt(limit) || 10, 50);
    const searchTerm = `%${symptom}%`;

    const [relatedDiagnoses] = await db.query(
      `SELECT
        icd_code as code,
        primary_description as diagnosis,
        secondary_description as description
      FROM icd_codes
      WHERE LOWER(primary_description) LIKE ${mysql.escape(searchTerm.toLowerCase())}
        OR LOWER(secondary_description) LIKE ${mysql.escape(searchTerm.toLowerCase())}
      LIMIT ${limitNum}`
    );

    res.json({
      symptom,
      related_diagnoses: relatedDiagnoses || [],
      count: relatedDiagnoses ? relatedDiagnoses.length : 0
    });
  } catch (error) {
    console.error('Get related symptoms error:', error);
    res.status(500).json({
      error: 'Failed to get related data',
      details: error.message
    });
  }
});

module.exports = router;
