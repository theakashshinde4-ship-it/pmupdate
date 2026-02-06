const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { joiValidate } = require('../middleware/joiValidate');
const { getDb } = require('../config/db');

const router = express.Router();

// Search symptoms from SNOMED CT
router.get('/symptoms/search', authenticateToken, async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const db = getDb();
    
    // Search in SNOMED concepts for clinical findings and symptoms
    const [symptoms] = await db.execute(`
      SELECT snomed_id, preferred_term 
      FROM snomed_concepts 
      WHERE preferred_term LIKE ? 
      AND (preferred_term LIKE '%symptom%' OR preferred_term LIKE '%pain%' OR preferred_term LIKE '%fever%' OR preferred_term LIKE '%cough%' OR preferred_term LIKE '%headache%')
      ORDER BY preferred_term
      LIMIT ${parseInt(limit, 10)}
    `, [`%${q}%`]);

    res.json({
      success: true,
      data: symptoms.map(s => ({
        id: s.snomed_id,
        name: s.preferred_term,
        type: 'symptom',
        source: 'snomed'
      }))
    });
  } catch (error) {
    console.error('Error searching symptoms:', error);
    res.status(500).json({ error: 'Failed to search symptoms' });
  }
});

// Get diagnosis suggestions based on symptoms
router.post('/diagnosis/suggestions', authenticateToken, async (req, res) => {
  try {
    const { symptoms } = req.body;
    
    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({ error: 'Symptoms array is required' });
    }

    const db = getDb();
    
    // Get ICD codes based on symptom patterns
    let whereClause = '';
    let params = [];
    
    symptoms.forEach((symptom, index) => {
      if (index === 0) {
        whereClause += `primary_description LIKE ?`;
      } else {
        whereClause += ` OR primary_description LIKE ?`;
      }
      params.push(`%${symptom}%`);
    });
    
    const [diagnoses] = await db.execute(`
      SELECT DISTINCT 
        icd_code, 
        primary_description, 
        short_description
      FROM icd_codes 
      WHERE ${whereClause}
      ORDER BY primary_description
      LIMIT 15
    `, params);

    // Also get ICD-11 codes
    let whereClause11 = '';
    let params11 = [];
    
    symptoms.forEach((symptom, index) => {
      if (index === 0) {
        whereClause11 += `preferred_label LIKE ?`;
      } else {
        whereClause11 += ` OR preferred_label LIKE ?`;
      }
      params11.push(`%${symptom}%`);
    });
    
    const [icd11Diagnoses] = await db.execute(`
      SELECT DISTINCT 
        icd11_code, 
        preferred_label,
        short_definition
      FROM icd11_codes 
      WHERE ${whereClause11}
      ORDER BY preferred_label
      LIMIT 10
    `, params11);

    res.json({
      success: true,
      data: {
        icd10: diagnoses.map(d => ({
          code: d.icd_code,
          description: d.primary_description,
          shortDescription: d.short_description,
          type: 'icd10'
        })),
        icd11: icd11Diagnoses.map(d => ({
          code: d.icd11_code,
          description: d.preferred_label,
          shortDescription: d.short_definition,
          type: 'icd11'
        }))
      }
    });
  } catch (error) {
    console.error('Error getting diagnosis suggestions:', error);
    res.status(500).json({ error: 'Failed to get diagnosis suggestions' });
  }
});

// Get medicine suggestions based on diagnosis or symptoms
router.post('/medicines/suggestions', authenticateToken, async (req, res) => {
  try {
    const { symptoms, diagnosisCodes, diagnosisType } = req.body;
    
    const db = getDb();
    let medicines = [];
    
    // Get medicines based on symptoms
    if (symptoms && Array.isArray(symptoms) && symptoms.length > 0) {
      const [symptomMeds] = await db.execute(`
        SELECT DISTINCT 
          sm.medication_name,
          sm.brand_name,
          sm.strength_value,
          sm.strength_unit,
          sm.dose_form,
          sm.route_of_administration,
          smm.recommendation_priority,
          smm.frequency,
          smm.duration,
          smm.severity_level
        FROM snomed_medications sm
        LEFT JOIN symptom_medication_mapping smm ON sm.medication_name = smm.medication_name
        WHERE smm.symptom_name IN (${symptoms.map(() => '?').join(',')})
        ORDER BY smm.recommendation_priority ASC, sm.medication_name
        LIMIT 20
      `, symptoms);
      
      medicines.push(...symptomMeds.map(m => ({
        name: m.medication_name,
        brandName: m.brand_name,
        strength: m.strength_value ? `${m.strength_value} ${m.strength_unit}` : null,
        dosageForm: m.dose_form,
        route: m.route_of_administration,
        priority: m.recommendation_priority,
        frequency: m.frequency,
        duration: m.duration,
        severityLevel: m.severity_level,
        source: 'symptom_mapping'
      })));
    }
    
    // Get medicines based on ICD codes
    if (diagnosisCodes && Array.isArray(diagnosisCodes) && diagnosisCodes.length > 0) {
      const tableName = diagnosisType === 'icd11' ? 'icd11_medication_mapping' : 'icd_medication_mapping';
      const codeColumn = diagnosisType === 'icd11' ? 'icd11_code' : 'icd_code';
      
      const [diagnosisMeds] = await db.execute(`
        SELECT DISTINCT 
          sm.medication_name,
          sm.brand_name,
          sm.strength_value,
          sm.strength_unit,
          sm.dose_form,
          sm.route_of_administration,
          dm.recommended_frequency,
          dm.recommended_duration,
          dm.indication,
          dm.is_first_line,
          dm.priority
        FROM snomed_medications sm
        LEFT JOIN ${tableName} dm ON sm.medication_name = dm.medication_name
        WHERE dm.${codeColumn} IN (${diagnosisCodes.map(() => '?').join(',')})
        ORDER BY dm.is_first_line DESC, sm.medication_name
        LIMIT 20
      `, diagnosisCodes);
      
      medicines.push(...diagnosisMeds.map(m => ({
        name: m.medication_name,
        brandName: m.brand_name,
        strength: m.strength_value ? `${m.strength_value} ${m.strength_unit}` : null,
        dosageForm: m.dose_form,
        route: m.route_of_administration,
        isFirstLine: m.is_first_line,
        priority: m.priority,
        frequency: m.recommended_frequency,
        duration: m.recommended_duration,
        indication: m.indication,
        source: 'diagnosis_mapping'
      })));
    }
    
    // Remove duplicates and sort by priority
    const uniqueMedicines = medicines.filter((medicine, index, self) =>
      index === self.findIndex((m) => m.name === medicine.name)
    );
    
    uniqueMedicines.sort((a, b) => {
      if (a.isFirstLine && !b.isFirstLine) return -1;
      if (!a.isFirstLine && b.isFirstLine) return 1;
      if (a.priority && b.priority) return a.priority - b.priority;
      return 0;
    });

    res.json({
      success: true,
      data: uniqueMedicines.slice(0, 25)
    });
  } catch (error) {
    console.error('Error getting medicine suggestions:', error);
    res.status(500).json({ error: 'Failed to get medicine suggestions' });
  }
});

// Get dosage information for a specific medicine
router.get('/medicines/:medicineName/dosage', authenticateToken, async (req, res) => {
  try {
    const { medicineName } = req.params;
    
    const db = getDb();
    
    // Get dosage references
    const [dosageRefs] = await db.execute(`
      SELECT 
        medication_name,
        dosage_form,
        strength,
        recommended_frequency,
        recommended_duration,
        max_daily_dose,
        special_instructions
      FROM dosage_references 
      WHERE medication_name LIKE ?
      ORDER BY recommended_frequency
      LIMIT 5
    `, [`%${medicineName}%`]);

    // Get SNOMED medication details
    const [snomedMeds] = await db.execute(`
      SELECT 
        medication_name,
        brand_name,
        strength_value,
        strength_unit,
        dose_form,
        route_of_administration,
        therapeutic_class,
        schedule
      FROM snomed_medications 
      WHERE medication_name LIKE ?
      AND is_active = 1
      LIMIT 3
    `, [`%${medicineName}%`]);

    res.json({
      success: true,
      data: {
        dosageReferences: dosageRefs,
        medicationDetails: snomedMeds
      }
    });
  } catch (error) {
    console.error('Error getting dosage information:', error);
    res.status(500).json({ error: 'Failed to get dosage information' });
  }
});

// Search ICD codes directly
router.get('/icd/search', authenticateToken, async (req, res) => {
  try {
    const { q, type = 'icd10', limit = 20 } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const db = getDb();
    let results = [];

    if (type === 'icd10' || type === 'all') {
      const [icd10] = await db.execute(`
        SELECT icd_code, primary_description, short_description
        FROM icd_codes 
        WHERE primary_description LIKE ? OR icd_code LIKE ?
        ORDER BY primary_description
        LIMIT ${parseInt(limit, 10)}
      `, [`%${q}%`, `%${q}%`]);
      
      results.push(...icd10.map(d => ({
        code: d.icd_code,
        description: d.primary_description,
        shortDescription: d.short_description,
        type: 'icd10'
      })));
    }

    if (type === 'icd11' || type === 'all') {
      const [icd11] = await db.execute(`
        SELECT icd11_code, preferred_label, short_definition
        FROM icd11_codes 
        WHERE preferred_label LIKE ? OR icd11_code LIKE ?
        ORDER BY preferred_label
        LIMIT ${parseInt(limit, 10)}
      `, [`%${q}%`, `%${q}%`]);
      
      results.push(...icd11.map(d => ({
        code: d.icd11_code,
        description: d.preferred_label,
        shortDescription: d.short_definition,
        type: 'icd11'
      })));
    }

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error searching ICD codes:', error);
    res.status(500).json({ error: 'Failed to search ICD codes' });
  }
});

module.exports = router;
