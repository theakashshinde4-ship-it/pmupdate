/**
 * Suggestion Controller
 * Comprehensive suggestion system for symptoms, diagnoses, and medications
 */

const { getDb } = require('../config/db');

/**
 * Get comprehensive suggestions for a symptom
 * POST /api/suggestions/symptom-based
 * Body: { symptoms: [], patient_id?, age?, gender?, patient_weight?, allergies?: [] }
 */
exports.getSymptomBasedSuggestions = async (req, res) => {
  try {
    const {
      symptoms = [],
      patient_id,
      age,
      gender,
      patient_weight,
      allergies = [],
      limit = 15
    } = req.body;

    if (!symptoms || symptoms.length === 0) {
      return res.status(400).json({ error: 'Symptoms array is required' });
    }

    const db = getDb();
    const limitNum = Math.min(parseInt(limit) || 15, 50);

    // Normalize symptoms
    const symptomList = Array.isArray(symptoms)
      ? symptoms.map(s => (typeof s === 'string' ? s.trim().toLowerCase() : s))
      : [symptoms].map(s => (typeof s === 'string' ? s.trim().toLowerCase() : s));

    // Get all suggestions for each symptom
    const allDiagnoses = [];
    const allMedications = [];

    let spUnavailable = false;

    for (const symptom of symptomList) {
      try {
        // Use stored procedure for complete suggestion
        const [results] = await db.execute(
          'CALL sp_get_complete_prescription_suggestion(?, ?, ?, ?)',
          [symptom, age || null, patient_weight || null, limitNum]
        );

        if (results && Array.isArray(results)) {
          // Separate diagnoses and medications
          results.forEach(row => {
            if (row.result_type === 'diagnosis' && row.icd_code) {
              if (!allDiagnoses.find(d => d.icd_code === row.icd_code)) {
                allDiagnoses.push({
                  icd_code: row.icd_code,
                  diagnosis_name: row.diagnosis_name,
                  evidence_score: 1
                });
              }
            } else if (row.result_type === 'medication' && row.medication_name) {
              allMedications.push(row);
            }
          });
        }
      } catch (e) {
        if (e && (e.code === 'ER_SP_DOES_NOT_EXIST' || /sp_get_complete_prescription_suggestion/i.test(e.message || ''))) {
          spUnavailable = true;
          break;
        }
        console.warn(`Error getting suggestions for symptom "${symptom}":`, e.message);
      }
    }

    if (spUnavailable) {
      // Fallback to table-driven suggestions (no stored procedure dependency)
      const fallbackDiagnoses = await getDiagnosesBySymptoms(db, symptomList, limitNum);
      const fallbackMeds = await getMedicationsBySymptoms(db, symptomList, limitNum);

      // Merge & rank
      const mergedMeds = mergeMedications([fallbackMeds]);
      const filtered = filterByAllergies(mergedMeds, allergies);
      const ranked = rankMedications(filtered);

      return res.json({
        symptoms: symptomList,
        diagnoses: (fallbackDiagnoses || []).slice(0, limitNum),
        medications: ranked.slice(0, limitNum),
        total: {
          diagnoses: (fallbackDiagnoses || []).length,
          medications: ranked.length
        }
      });
    }

    // Merge and deduplicate medications
    const uniqueMedications = mergeMedications([allMedications]);

    // Filter allergies if provided
    const filteredMedications = filterByAllergies(uniqueMedications, allergies);

    // Rank by priority
    const rankedMedications = rankMedications(filteredMedications);

    res.json({
      symptoms: symptomList,
      diagnoses: allDiagnoses.slice(0, limitNum),
      medications: rankedMedications.slice(0, limitNum),
      total: {
        diagnoses: allDiagnoses.length,
        medications: rankedMedications.length
      }
    });
  } catch (error) {
    console.error('Error getting symptom-based suggestions:', error);
    res.status(500).json({
      error: 'Failed to get suggestions',
      details: error.message
    });
  }
};

/**
 * Get medications and dosages for a diagnosis
 * GET /api/suggestions/diagnosis/:icd_code
 */
exports.getDiagnosisMedicationsAndDosages = async (req, res) => {
  try {
    const { icd_code } = req.params;
    const { patient_id, age, gender, weight, limit = 20 } = req.query;

    if (!icd_code) {
      return res.status(400).json({ error: 'ICD code is required' });
    }

    const db = getDb();
    const limitNum = Math.min(parseInt(limit) || 20, 50);

    // Get medications for this diagnosis with medicine master data in single query (no N+1)
    const [enrichedMeds] = await db.execute(
      `SELECT DISTINCT
         m.medication_name as name,
         m.generic_name,
         m.dosage_form as form,
         m.strength,
         m.is_first_line,
         m.priority,
         m.evidence_level,
         m.indication,
         m.contraindications_notes as contraindications,
         d.standard_dosage,
         d.max_daily_dose,
         d.recommended_frequency as frequency,
         d.recommended_duration as duration,
         d.route_of_administration as route,
         d.age_group,
         d.is_weight_based,
         d.dose_per_kg,
         med.id as medicine_id,
         med.usage_count,
         med.last_used_at
       FROM diagnosis_medication_mapping m
       LEFT JOIN dosage_references d
         ON LOWER(d.medication_name) = LOWER(m.medication_name)
        AND (d.dosage_form = m.dosage_form OR d.dosage_form IS NULL)
        AND (d.strength = m.strength OR d.strength IS NULL)
       LEFT JOIN medicines med ON LOWER(med.name) = LOWER(m.medication_name)
       WHERE m.icd_code = ?
       ORDER BY m.is_first_line DESC, m.priority ASC, m.medication_name ASC
       LIMIT ?`,
      [icd_code, limitNum]
    );

    // Map results and calculate adjusted dosage
    const mappedMeds = enrichedMeds.map(med => ({
      ...med,
      medicine_id: med.medicine_id || null,
      usage_count: med.usage_count || 0,
      last_used_at: med.last_used_at,
      adjusted_dosage: calculateAdjustedDosage(med, { age, gender, weight })
    }));

    res.json({
      icd_code,
      medications: mappedMeds,
      count: mappedMeds.length
    });
  } catch (error) {
    console.error('Error getting diagnosis medications:', error);
    res.status(500).json({
      error: 'Failed to get medications',
      details: error.message
    });
  }
};

/**
 * Get complete prescription suggestion
 * POST /api/suggestions/prescription
 * Body: { symptoms: [], diagnoses: [], patient_id, age, gender, weight }
 */
exports.getPrescriptionSuggestion = async (req, res) => {
  try {
    const {
      symptoms = [],
      diagnoses = [],
      patient_id,
      age,
      gender,
      weight,
      allergies = [],
      limit = 20
    } = req.body;

    const db = getDb();
    const limitNum = Math.min(parseInt(limit) || 20, 50);

    // Get medications from both symptoms and diagnoses
    const medsBySymptom = symptoms.length > 0
      ? await getMedicationsBySymptoms(db, symptoms, limitNum)
      : [];

    const medsByDiagnosis = diagnoses.length > 0
      ? await getMedicationsByDiagnoses(db, diagnoses, limitNum)
      : [];

    // Merge and deduplicate
    const allMeds = mergeMedications([medsBySymptom, medsByDiagnosis]);

    // Enrich with dosage
    const medsWithDosage = await enrichWithDosage(
      db,
      allMeds,
      { age, gender, weight }
    );

    // Filter allergies
    const filteredMeds = filterByAllergies(medsWithDosage, allergies);

    // Rank
    const rankedMeds = rankMedications(filteredMeds).slice(0, limitNum);

    res.json({
      symptoms,
      diagnoses,
      medications: rankedMeds,
      prescription_ready: true,
      ready_to_add: rankedMeds.length > 0
    });
  } catch (error) {
    console.error('Error getting prescription suggestion:', error);
    res.status(500).json({
      error: 'Failed to generate prescription suggestion',
      details: error.message
    });
  }
};

// ============================================
// Helper Functions
// ============================================

/**
 * Get diagnoses based on symptoms
 */
async function getDiagnosesBySymptoms(db, symptoms, limit) {
  if (symptoms.length === 0) return [];

  // Try to match against snomed_clinical_findings first
  const placeholders = symptoms.map(() => '?').join(',');
  const likeClauses = symptoms.map(() => 'LOWER(clinical_term) LIKE LOWER(?)').join(' OR ');
  const likeParams = symptoms.map(s => `%${s}%`);

  try {
    const [icdFromFindings] = await db.execute(
      `SELECT DISTINCT icd_code, COUNT(*) AS hits, clinical_term
         FROM snomed_clinical_findings
        WHERE icd_code IS NOT NULL AND (${likeClauses})
        GROUP BY icd_code
        ORDER BY hits DESC
        LIMIT ?`,
      [...likeParams, limit]
    );

    // Get ICD labels
    if (icdFromFindings.length > 0) {
      const codes = icdFromFindings.map(r => r.icd_code);
      const placeholders2 = codes.map(() => '?').join(',');
      const [labels] = await db.execute(
        `SELECT icd_code, primary_description as diagnosis_name
           FROM icd_codes
          WHERE icd_code IN (${placeholders2})`,
        codes
      );
      const labelMap = new Map(labels.map(l => [l.icd_code, l.diagnosis_name]));
      return icdFromFindings.map(r => ({
        icd_code: r.icd_code,
        diagnosis_name: labelMap.get(r.icd_code) || r.icd_code,
        evidence_score: r.hits
      }));
    }
  } catch (e) {
    console.warn('Error querying SNOMED findings:', e);
  }

  return [];
}

/**
 * Get medications directly from symptoms
 */
async function getMedicationsBySymptoms(db, symptoms, limit) {
  if (symptoms.length === 0) return [];

  const placeholders = symptoms.map(() => 'LOWER(symptom_name) = LOWER(?)').join(' OR ');
  try {
    const [meds] = await db.execute(
      `SELECT DISTINCT
         medication_name as name,
         brand_name as brand,
         dosage_form as form,
         strength,
         frequency,
         duration,
         severity_level,
         recommendation_priority as priority,
         evidence_based
       FROM symptom_medication_mapping
       WHERE (${placeholders})
       ORDER BY recommendation_priority ASC, medication_name ASC
       LIMIT ?`,
      [...symptoms, limit]
    );
    return meds || [];
  } catch (e) {
    console.warn('Error getting meds by symptoms:', e);
    return [];
  }
}

/**
 * Get medications for diagnoses
 */
async function getMedicationsByDiagnoses(db, icdCodes, limit) {
  if (!icdCodes || icdCodes.length === 0) return [];

  const placeholders = icdCodes.map(() => '?').join(',');
  try {
    const [meds] = await db.execute(
      `SELECT DISTINCT
         medication_name as name,
         dosage_form as form,
         strength,
         frequency,
         duration,
         is_first_line,
         priority,
         evidence_level,
         indication
       FROM diagnosis_medication_mapping
       WHERE icd_code IN (${placeholders})
       ORDER BY is_first_line DESC, priority ASC, medication_name ASC
       LIMIT ?`,
      [...icdCodes, limit]
    );
    return meds || [];
  } catch (e) {
    console.warn('Error getting meds by diagnoses:', e);
    return [];
  }
}

/**
 * Merge and deduplicate medications
 */
function mergeMedications(medArrays) {
  const merged = new Map();

  for (const medArray of medArrays) {
    if (!Array.isArray(medArray)) continue;
    for (const med of medArray) {
      const key = (med.name || '').toLowerCase();
      if (!merged.has(key)) {
        merged.set(key, med);
      } else {
        // Merge with existing (prefer more specific info)
        const existing = merged.get(key);
        merged.set(key, {
          ...existing,
          ...med,
          form: med.form || existing.form,
          strength: med.strength || existing.strength,
          frequency: med.frequency || existing.frequency
        });
      }
    }
  }

  return Array.from(merged.values());
}

/**
 * Enrich medications with dosage information
 */
async function enrichWithDosage(db, medications, patientInfo = {}) {
  return Promise.all(
    medications.map(async (med) => {
      try {
        const [dosageRows] = await db.execute(
          `SELECT
             standard_dosage,
             max_daily_dose,
             recommended_frequency,
             recommended_duration,
             route_of_administration,
             age_group,
             is_weight_based,
             dose_per_kg,
             pregnancy_category,
             lactation_safety
           FROM dosage_references
           WHERE LOWER(medication_name) = LOWER(?)
           LIMIT 1`,
          [med.name]
        );

        if (dosageRows.length > 0) {
          const dosage = dosageRows[0];
          const adjusted = calculateAdjustedDosage(dosage, patientInfo);

          return {
            ...med,
            standard_dosage: dosage.standard_dosage,
            max_daily_dose: dosage.max_daily_dose,
            recommended_frequency: dosage.recommended_frequency || med.frequency,
            recommended_duration: dosage.recommended_duration || med.duration,
            route: dosage.route_of_administration || 'Oral',
            age_group: dosage.age_group,
            adjusted_dosage: adjusted,
            pregnancy_category: dosage.pregnancy_category,
            lactation_safe: dosage.lactation_safety
          };
        }
      } catch (e) {
        console.warn(`Error enriching ${med.name} with dosage:`, e);
      }

      return med;
    })
  );
}

/**
 * Calculate adjusted dosage based on patient age/weight
 */
function calculateAdjustedDosage(dosageInfo, patientInfo = {}) {
  if (!dosageInfo) return null;

  const { age, gender, weight } = patientInfo;

  // If weight-based
  if (dosageInfo.is_weight_based && dosageInfo.dose_per_kg && weight) {
    const adjustedDose = (parseFloat(dosageInfo.dose_per_kg) * parseFloat(weight)).toFixed(2);
    return `${adjustedDose}mg`;
  }

  // If age-based
  if (age && dosageInfo.standard_dosage) {
    if (age < 1) {
      return `1/4 of ${dosageInfo.standard_dosage}`;
    } else if (age < 5) {
      return `1/2 of ${dosageInfo.standard_dosage}`;
    } else if (age >= 18) {
      return dosageInfo.standard_dosage;
    }
  }

  return dosageInfo.standard_dosage;
}

/**
 * Filter medications based on allergies
 */
function filterByAllergies(medications, allergies = []) {
  if (!allergies || allergies.length === 0) return medications;

  const allergyNames = allergies.map(a => (typeof a === 'string' ? a.toLowerCase() : a.allergen_name?.toLowerCase()));

  return medications.filter(med => {
    const medName = (med.name || '').toLowerCase();
    const medBrand = (med.brand || '').toLowerCase();

    return !allergyNames.some(
      allergen =>
        medName.includes(allergen) ||
        allergen.includes(medName) ||
        medBrand.includes(allergen)
    );
  });
}

/**
 * Rank medications by priority
 */
function rankMedications(medications) {
  return medications.sort((a, b) => {
    // First-line drugs first
    const aFirstLine = a.is_first_line ? 1 : 0;
    const bFirstLine = b.is_first_line ? 1 : 0;
    if (aFirstLine !== bFirstLine) return bFirstLine - aFirstLine;

    // Then by priority
    const aPriority = a.priority || a.recommendation_priority || 100;
    const bPriority = b.priority || b.recommendation_priority || 100;
    if (aPriority !== bPriority) return aPriority - bPriority;

    // Then by evidence
    const aEvidence = getEvidenceScore(a.evidence_level);
    const bEvidence = getEvidenceScore(b.evidence_level);
    if (aEvidence !== bEvidence) return bEvidence - aEvidence;

    // Then alphabetically
    return (a.name || '').localeCompare(b.name || '');
  });
}

/**
 * Convert evidence level to numeric score
 */
function getEvidenceScore(level) {
  const scores = {
    'A': 5,
    'B': 4,
    'C': 3,
    'D': 2,
    'Expert': 1
  };
  return scores[level] || 0;
}

module.exports = exports;
