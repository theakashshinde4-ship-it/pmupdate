/**
 * Diagnosis Controller
 * Handles diagnosis search and suggestions
 */

const { getDb } = require('../config/db');
const { sendSuccess, sendError, sendValidationError } = require('../utils/responseHelper');

/**
 * Search diagnoses by term
 * GET /api/diagnoses/search?q=fever&limit=20&offset=0
 */
exports.searchDiagnoses = async (req, res) => {
  try {
    const { q, limit = 20, offset = 0 } = req.query;

    if (!q || q.trim().length < 2) {
      return sendValidationError(res, 'Search term must be at least 2 characters');
    }

    const db = getDb();
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const offsetNum = Math.max(parseInt(offset) || 0, 0);

    try {
      // Use ICD service directly instead of stored procedure
      const { searchICDAll } = require('../services/icdService');
      const results = await searchICDAll(q, { limit: limitNum, offset: offsetNum });
      
      const diagnoses = results.items || [];

      return sendSuccess(res, {
        diagnoses,
        limit: limitNum,
        offset: offsetNum,
        total: diagnoses.length
      }, 'Diagnoses search completed');
    } catch (serviceError) {
      // Fallback to direct ICD-10 query
      console.warn('ICD service failed, using fallback query:', serviceError.message);
      
      const searchTerm = `%${q}%`;
      const [diagnoses] = await db.execute(
        `SELECT 
          icd_code,
          primary_description as diagnosis_name,
          secondary_description,
          short_description,
          chapter_code,
          usage_count
        FROM icd_codes
        WHERE LOWER(primary_description) LIKE LOWER(?)
          OR LOWER(secondary_description) LIKE LOWER(?)
          OR LOWER(short_description) LIKE LOWER(?)
        ORDER BY usage_count DESC, primary_description ASC
        LIMIT ${limitNum} OFFSET ${offsetNum}`,
        [searchTerm, searchTerm, searchTerm]
      );

      return sendSuccess(res, {
        diagnoses,
        limit: limitNum,
        offset: offsetNum,
        total: diagnoses.length
      }, 'Diagnoses search completed (fallback)');
    }
  } catch (error) {
    console.error('Error searching diagnoses:', error);
    return sendError(res, error.message || 'Failed to search diagnoses', 500, error.message);
  }
};

/**
 * Get diagnosis suggestions based on symptoms
 * GET /api/diagnoses/suggest-by-symptoms?symptoms=fever,cough&limit=20
 */
exports.suggestBySymptoms = async (req, res) => {
  try {
    const { symptoms, limit = 20 } = req.query;

    if (!symptoms) {
      return sendValidationError(res, 'Symptoms parameter is required');
    }

    const db = getDb();
    const limitNum = Math.min(parseInt(limit) || 20, 50);

    try {
      // Use stored procedure
      const [results] = await db.execute(
        'CALL sp_get_diagnosis_by_symptoms(?, ?)',
        [symptoms, limitNum]
      );

      const diagnoses = results[0] || [];

      return sendSuccess(res, {
        diagnoses,
        total: diagnoses.length
      }, 'Diagnosis suggestions retrieved');
    } catch (procError) {
      // Fallback if stored procedure doesn't exist
      console.warn('Stored procedure failed, using fallback query:', procError.message);
      
      // Parse symptoms
      const symptomList = String(symptoms)
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);

      if (symptomList.length === 0) {
        return sendSuccess(res, { diagnoses: [], total: 0 }, 'No symptoms provided');
      }

      // Query for medications that treat these symptoms, then get associated diagnoses
      let diagnosisQuery = `
        SELECT DISTINCT
          dm.icd_code,
          dm.diagnosis_name,
          COUNT(DISTINCT dm.medication_name) as medication_count,
          AVG(dm.recommendation_priority) as avg_priority
        FROM diagnosis_medication_mapping dm
        WHERE dm.medication_name IN (
          SELECT DISTINCT sm.medication_name
          FROM symptom_medication_mapping sm
          WHERE LOWER(sm.symptom_name) LIKE ?`;

      const params = [`%${symptomList[0]}%`];

      // Add OR conditions for additional symptoms
      for (let i = 1; i < symptomList.length; i++) {
        diagnosisQuery += ` OR LOWER(sm.symptom_name) LIKE ?`;
        params.push(`%${symptomList[i]}%`);
      }

      diagnosisQuery += `
        )
        GROUP BY dm.icd_code, dm.diagnosis_name
        ORDER BY medication_count DESC, avg_priority ASC
        LIMIT ?`;

      params.push(limitNum);

      const [diagnoses] = await db.execute(diagnosisQuery, params);

      return sendSuccess(res, {
        diagnoses: diagnoses || [],
        total: (diagnoses || []).length
      }, 'Diagnosis suggestions retrieved (fallback)');
    }
  } catch (error) {
    console.error('Error getting diagnosis suggestions:', error);
    return sendError(res, error.message || 'Failed to get diagnosis suggestions', 500, error.message);
  }
};

/**
 * Get medications for a specific diagnosis
 * GET /api/diagnoses/:icd_code/medications?age=30&weight=70&limit=20
 */
exports.getMedicationsForDiagnosis = async (req, res) => {
  try {
    const { icd_code } = req.params;
    const { age, weight, limit = 20 } = req.query;

    if (!icd_code) {
      return sendValidationError(res, 'ICD code is required');
    }

    const db = getDb();
    const limitNum = Math.min(parseInt(limit) || 20, 50);

    const [medications] = await db.execute(
      `SELECT 
        dm.icd_code,
        dm.diagnosis_name,
        dm.medication_name,
        dm.generic_name,
        dm.dosage_form,
        dm.strength,
        dm.frequency,
        dm.duration,
        dm.line_of_therapy,
        dm.evidence_level,
        dm.indication,
        dm.contraindications_notes,
        dr.standard_dosage,
        dr.max_daily_dose,
        CASE 
          WHEN ? IS NOT NULL AND dr.dose_per_kg IS NOT NULL 
          THEN ROUND(? * dr.dose_per_kg, 2)
          ELSE dr.standard_dosage
        END as adjusted_dosage,
        m.usage_count
      FROM diagnosis_medication_mapping dm
      LEFT JOIN dosage_references dr 
        ON LOWER(dr.medication_name) = LOWER(dm.medication_name)
      LEFT JOIN medicines m ON LOWER(m.name) = LOWER(dm.medication_name)
      WHERE dm.icd_code = ?
      ORDER BY 
        FIELD(dm.line_of_therapy, 'First-line', 'Second-line', 'Third-line', 'Adjunct'),
        m.usage_count DESC
      LIMIT ?`,
      [weight, weight, icd_code, limitNum]
    );

    return sendSuccess(res, {
      icd_code,
      medications: medications || [],
      total: (medications || []).length
    }, 'Medications for diagnosis retrieved');
  } catch (error) {
    console.error('Error getting medications for diagnosis:', error);
    return sendError(res, error.message || 'Failed to get medications', 500, error.message);
  }
};

/**
 * Get complete diagnosis details
 * GET /api/diagnoses/:icd_code
 */
exports.getDiagnosisDetails = async (req, res) => {
  try {
    const { icd_code } = req.params;

    if (!icd_code) {
      return sendValidationError(res, 'ICD code is required');
    }

    const db = getDb();

    const [diagnosis] = await db.execute(
      `SELECT 
        ic.id,
        ic.icd_code,
        ic.primary_description,
        ic.secondary_description,
        ic.short_description,
        ic.chapter_code,
        ic.group_code,
        ic.status,
        ic.billable,
        ic.usage_count,
        ic.created_at,
        ic.updated_at
      FROM icd_codes ic
      WHERE ic.icd_code = ?`,
      [icd_code]
    );

    if (!diagnosis || diagnosis.length === 0) {
      return sendError(res, 'Diagnosis not found', 404);
    }

    // Get associated medications
    const [medications] = await db.execute(
      `SELECT medication_name, frequency, duration, line_of_therapy
       FROM diagnosis_medication_mapping
       WHERE icd_code = ?
       LIMIT 20`,
      [icd_code]
    );

    // Get related symptoms
    const [symptoms] = await db.execute(
      `SELECT DISTINCT sm.symptom_name
       FROM symptom_medication_mapping sm
       WHERE sm.medication_name IN (
         SELECT medication_name FROM diagnosis_medication_mapping WHERE icd_code = ?
       )
       LIMIT 20`,
      [icd_code]
    );

    return sendSuccess(res, {
      diagnosis: diagnosis[0],
      medications: medications || [],
      related_symptoms: symptoms || []
    }, 'Diagnosis details retrieved');
  } catch (error) {
    console.error('Error getting diagnosis details:', error);
    return sendError(res, error.message || 'Failed to get diagnosis details', 500, error.message);
  }
};
