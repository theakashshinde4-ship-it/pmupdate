const { getDb } = require('../config/db');

/**
 * Get smart medicine suggestions based on diagnosis, symptoms, and patient history
 * GET /api/smart-prescription/suggestions?patientId=&diagnosis=&symptoms=&age=&weight=
 */
const getSmartSuggestions = async (req, res) => {
  try {
    const { patientId, diagnosis, symptoms, age, weight } = req.query;
    const db = getDb();

    const suggestions = {
      medicines: [],
      injections: [],
      diagnoses: [],
      investigations: [],
      frequentlyUsed: [],
      interactions: []
    };

    // Comprehensive symptom mapping for all sections
    const symptomMapping = {
      'Dizziness': ['dizziness', 'vertigo', 'lightheadedness'],
      'Fatigue': ['weakness', 'fatigue', 'exhaustion', 'tiredness', 'asthenia'],
      'Weakness': ['weakness', 'asthenia', 'muscle weakness'],
      'Tired': ['fatigue', 'tiredness', 'exhaustion'],
      'Exhausted': ['fatigue', 'exhaustion', 'tiredness'],
      'Nausea': ['nausea', 'vomiting', 'queasiness'],
      'Vomiting': ['vomiting', 'nausea', 'emesis'],
      'Headache': ['headache', 'migraine', 'cephalgia', 'head pain'],
      'Head Pain': ['headache', 'cephalgia', 'head pain'],
      'Migraine': ['migraine', 'headache', 'vascular headache'],
      'Fever': ['fever', 'pyrexia', 'temperature', 'hyperthermia'],
      'Temperature': ['fever', 'pyrexia', 'hyperthermia'],
      'Cough': ['cough', 'tussis', 'dry cough', 'productive cough'],
      'Cold': ['cold', 'rhinitis', 'nasal congestion', 'upper respiratory infection'],
      'Pain': ['pain', 'ache', 'discomfort', 'painful'],
      'Body Ache': ['body ache', 'myalgia', 'muscle pain', 'arthralgia'],
      'Chest Pain': ['chest pain', 'angina', 'thoracic pain', 'cardiac pain'],
      'Breathlessness': ['breathlessness', 'dyspnea', 'shortness of breath'],
      'Abdominal Pain': ['abdominal pain', 'stomach pain', 'abdominal discomfort']
    };

    // 1. Get frequently used medicines for this patient
    if (patientId) {
      try {
        const [freqMeds] = await db.execute(
          `SELECT m.name, m.brand, m.strength, COUNT(*) as usage_count, MAX(fu.last_used) as last_used
           FROM medicines m
           JOIN frequently_used fu ON m.name = fu.item_name
           WHERE fu.user_id = ? AND fu.item_type = 'medicine'
           GROUP BY m.id, m.name, m.brand, m.strength
           ORDER BY usage_count DESC, last_used DESC
           LIMIT 10`,
          [req.user?.id]
        ).catch(err => {
          console.error('Smart suggestions frequently_used query error:', err);
          throw err;
        });
        suggestions.frequentlyUsed = freqMeds;
      } catch (e) {
        console.warn('Error fetching frequently used medicines:', e.message);
      }
    }

    // 2. Enhanced diagnosis-based suggestions using ICD-11, ICD, and SNOMED
    if (diagnosis) {
      const diagnosisCodes = Array.isArray(diagnosis) ? diagnosis : diagnosis.split(',').map(d => d.trim());
      
      for (const code of diagnosisCodes) {
        try {
          // Try ICD-11 mapping first with correct column names
          const [icd11Meds] = await db.execute(
            `SELECT m.name, m.brand, m.strength, m.dosage_form, imm.recommended_frequency, imm.recommended_duration, imm.priority, imm.evidence_level, imm.is_first_line
             FROM medicines m
             JOIN icd11_medication_mapping imm ON m.name = imm.medication_name
             WHERE imm.icd11_code = ?
             ORDER BY imm.is_first_line DESC, imm.priority ASC, imm.evidence_level ASC
             LIMIT 8`,
            [code]
          ).catch(err => {
            console.error(`Smart suggestions ICD-11 query error for ${code}:`, err);
            throw err;
          });
          
          if (icd11Meds.length > 0) {
            suggestions.medicines.push(...icd11Meds.map(m => ({ 
              ...m, 
              instructions: m.instructions || 'Take as prescribed by doctor',
              source: 'icd11',
              evidence_level: m.evidence_level || 'C'
            })));
          } else {
            // Fallback to ICD mapping with correct column names
            const [icdMeds] = await db.execute(
              `SELECT m.name, m.brand, m.strength, m.dosage_form
               FROM medicines m
               JOIN icd_medication_mapping imm ON m.name = imm.medication_name
               WHERE imm.icd_code = ?
               LIMIT 8`,
              [code]
            ).catch(err => {
              console.error(`Smart suggestions ICD query error for ${code}:`, err);
              throw err;
            });
            suggestions.medicines.push(...icdMeds.map(m => ({ 
              ...m, 
              instructions: 'Take as prescribed by doctor',
              source: 'icd10' 
            })));
          }
        } catch (e) {
          console.warn(`Error fetching medicines for diagnosis ${code}:`, e.message);
        }
      }
    }

    // 3. Enhanced symptom-based suggestions using all available data
    if (symptoms) {
      const symptomList = Array.isArray(symptoms) ? symptoms : symptoms.split(',').map(s => s.trim());
      
      for (const symptom of symptomList) {
        const mappedSymptoms = symptomMapping[symptom] || [symptom.toLowerCase()];
        
        for (const mappedSymptom of mappedSymptoms) {
          try {
            // 3a. Basic symptom_medication_mapping
            const [symptomMeds] = await db.execute(
              `SELECT m.name, m.brand, m.strength, smm.dosage_form, smm.frequency, smm.duration, smm.instructions, smm.is_first_line, smm.recommendation_priority
               FROM medicines m
               JOIN symptom_medication_mapping smm ON m.name = smm.medication_name
               WHERE LOWER(smm.symptom_name) = LOWER(?)
               ORDER BY smm.is_first_line DESC, smm.recommendation_priority ASC
               LIMIT 5`,
              [mappedSymptom]
            );
            
            if (symptomMeds.length > 0) {
              suggestions.medicines.push(...symptomMeds.map(m => ({ 
                ...m, 
                instructions: m.instructions || 'Take as prescribed by doctor',
                source: 'symptom',
                original_symptom: symptom
              })));
            }
          } catch (e) {
            console.warn(`Error fetching medicines for symptom ${symptom} (mapped: ${mappedSymptom}):`, e.message);
          }
        }
      }
    }

    // 4. Add SNOMED CT based diagnosis suggestions
    if (diagnosis) {
      try {
        const diagnosisCodes = Array.isArray(diagnosis) ? diagnosis : diagnosis.split(',').map(d => d.trim());
        
        for (const code of diagnosisCodes) {
          // Get SNOMED concepts for diagnosis
          const [snomedDiags] = await db.execute(
            `SELECT sc.snomed_id, sc.preferred_term, sc.fsn, sc.usage_count
             FROM snomed_concepts sc
             WHERE sc.snomed_id = ? OR sc.preferred_term LIKE ? OR sc.fsn LIKE ?
             ORDER BY sc.usage_count DESC
             LIMIT 3`,
            [code, `%${code}%`, `%${code}%`]
          );
          
          if (snomedDiags.length > 0) {
            suggestions.diagnoses.push(...snomedDiags.map(d => ({
              snomed_id: d.snomed_id,
              term: d.preferred_term || d.fsn,
              usage_count: d.usage_count,
              source: 'snomed'
            })));
          }
        }
      } catch (e) {
        console.warn('Error fetching SNOMED diagnoses:', e.message);
      }
    }

    // 5. Enhanced dosage suggestions using dosage_references table
    if (age || weight) {
      try {
        const patientAge = parseInt(age) || 0;
        const patientWeight = parseFloat(weight) || 0;
        const ageGroup = patientAge < 18 ? 'Pediatric' : patientAge > 65 ? 'Geriatric' : 'Adult';
        
        // Get dosage-adjusted medicines from dosage_references
        const [dosageRefMeds] = await db.execute(
          `SELECT DISTINCT dr.medication_name, dr.active_ingredient, dr.dosage_form, dr.strength, 
                  dr.standard_dosage, dr.max_daily_dose, dr.recommended_frequency, dr.recommended_duration,
                  dr.age_group, dr.is_weight_based, dr.dose_per_kg, dr.renal_adjustment_needed, dr.hepatic_adjustment_needed,
                  dr.special_instructions, dr.contraindications, dr.side_effects, dr.drug_interactions,
                  dr.pregnancy_category, dr.lactation_safety, dr.evidence_level, dr.therapeutic_category,
                  dr.atc_code, dr.snomed_id, dr.icd_code
           FROM dosage_references dr
           WHERE (dr.age_group = ? OR dr.age_group = 'All')
           ORDER BY dr.evidence_level ASC, dr.age_group = ? DESC
           LIMIT 15`,
          [ageGroup, ageGroup]
        );
        
        if (dosageRefMeds.length > 0) {
          suggestions.medicines.push(...dosageRefMeds.map(m => ({
            name: m.medication_name,
            brand: m.active_ingredient,
            strength: m.strength,
            dosage_form: m.dosage_form,
            source: 'dosage_reference',
            dosage_info: {
              age_group: m.age_group,
              standard_dosage: m.standard_dosage,
              max_daily_dose: m.max_daily_dose,
              frequency: m.recommended_frequency,
              duration: m.recommended_duration,
              is_weight_based: m.is_weight_based,
              dose_per_kg: m.dose_per_kg,
              renal_adjustment_needed: m.renal_adjustment_needed,
              hepatic_adjustment_needed: m.hepatic_adjustment_needed,
              special_instructions: m.special_instructions,
              contraindications: m.contraindications,
              side_effects: m.side_effects,
              drug_interactions: m.drug_interactions,
              pregnancy_category: m.pregnancy_category,
              lactation_safety: m.lactation_safety,
              evidence_level: m.evidence_level,
              therapeutic_category: m.therapeutic_category,
              atc_code: m.atc_code,
              snomed_id: m.snomed_id,
              icd_code: m.icd_code
            }
          })));
        }
      } catch (e) {
        console.warn('Error fetching dosage reference medicines:', e.message);
      }
    }

    // 6. Add SNOMED medications for comprehensive coverage
    try {
      const [snomedMeds] = await db.execute(
        `SELECT DISTINCT sm.medication_name, sm.brand_name, sm.substance_name, sm.dose_form, 
                sm.strength_value, sm.strength_unit, sm.route_of_administration, sm.atc_code,
                sm.therapeutic_class, sm.pharmacological_class
         FROM snomed_medications sm
         WHERE sm.is_active = 1
         ORDER BY sm.therapeutic_class ASC
         LIMIT 20`
      );
      
      if (snomedMeds.length > 0) {
        suggestions.medicines.push(...snomedMeds.map(m => ({
          name: m.medication_name,
          brand: m.brand_name,
          strength: m.strength_value ? `${m.strength_value} ${m.strength_unit}` : null,
          dosage_form: m.dose_form,
          source: 'snomed_medication',
          snomed_info: {
            substance_name: m.substance_name,
            route_of_administration: m.route_of_administration,
            atc_code: m.atc_code,
            therapeutic_class: m.therapeutic_class,
            pharmacological_class: m.pharmacological_class
          }
        })));
      }
    } catch (e) {
      console.warn('Error fetching SNOMED medications:', e.message);
    }

    // 7. Remove duplicates and sort by relevance
    const uniqueMeds = [];
    const seen = new Set();
    
    // Enhanced priority system
    const priorityOrder = {
      'frequently_used': 7,
      'icd11': 6,
      'icd10': 5,
      'symptom': 4,
      'dosage_reference': 3,
      'snomed_medication': 2,
      'diagnosis': 1
    };
    
    const allMeds = suggestions.medicines.map(m => ({ 
      ...m, 
      priority: priorityOrder[m.source] || 0 
    }));

    for (const med of allMeds) {
      const key = med.name + (med.strength || '');
      if (!seen.has(key)) {
        seen.add(key);
        uniqueMeds.push(med);
      }
    }

    // Sort by priority and then by recommendation priority/evidence level
    uniqueMeds.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      
      // Secondary sort by evidence level if available
      if (a.evidence_level && b.evidence_level) {
        const evidenceOrder = { 'A': 4, 'B': 3, 'C': 2, 'D': 1, 'Expert': 0 };
        return (evidenceOrder[b.evidence_level] || 0) - (evidenceOrder[a.evidence_level] || 0);
      }
      
      return (a.recommendation_priority || 10) - (b.recommendation_priority || 10);
    });

    suggestions.medicines = uniqueMeds.slice(0, 25);

    // 8. Get injection suggestions
    if (symptoms) {
      const symptomList = Array.isArray(symptoms) ? symptoms : symptoms.split(',').map(s => s.trim());
      
      for (const symptom of symptomList) {
        const mappedSymptoms = symptomMapping[symptom] || [symptom.toLowerCase()];
        
        for (const mappedSymptom of mappedSymptoms) {
          try {
            const [symptomInjections] = await db.execute(
              `SELECT si.injection_name, si.generic_name, si.dose, si.route, si.timing, si.instructions, si.is_first_line, si.recommendation_priority
               FROM symptom_injection_mapping si
               WHERE LOWER(si.symptom_name) = LOWER(?)
               ORDER BY si.is_first_line DESC, si.recommendation_priority ASC
               LIMIT 3`,
              [mappedSymptom]
            );
            suggestions.injections.push(...symptomInjections.map(m => ({ 
              ...m, 
              instructions: m.instructions || 'Administer as per standard protocol',
              source: 'symptom' 
            })));
          } catch (e) {
            console.warn(`Error fetching injections for symptom ${symptom}:`, e.message);
          }
        }
      }
    }

    res.json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error('Error in getSmartSuggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch smart suggestions'
    });
  }
};

/**
 * Check for drug interactions
 * POST /api/smart-prescription/check-interactions
 * Body: { medicines: [{ name, composition }] }
 */
const checkDrugInteractions = async (req, res) => {
  try {
    const { medicines } = req.body;
    
    if (!medicines || !Array.isArray(medicines)) {
      return res.status(400).json({
        success: false,
        error: 'Medicines array is required'
      });
    }

    const db = getDb();
    const interactions = [];
    const warnings = [];

    // Check pairwise interactions
    for (let i = 0; i < medicines.length; i++) {
      for (let j = i + 1; j < medicines.length; j++) {
        const med1 = medicines[i];
        const med2 = medicines[j];

        try {
          const [interactionRows] = await db.execute(
            `SELECT severity, description, recommendation
             FROM drug_interactions
             WHERE (medicine1 = ? AND medicine2 = ?) OR (medicine1 = ? AND medicine2 = ?)`,
            [med1.name, med2.name, med2.name, med1.name]
          );

          if (interactionRows.length > 0) {
            interactions.push({
              medicine1: med1.name,
              medicine2: med2.name,
              ...interactionRows[0]
            });
          }
        } catch (e) {
          console.warn('Error checking drug interactions:', e.message);
        }
      }
    }

    // Check for common warnings (e.g., pediatric, pregnancy, renal)
    for (const med of medicines) {
      try {
        const [warningRows] = await db.execute(
          `SELECT warning_type, message, action
           FROM medicine_warnings
           WHERE medicine_name = ?`,
          [med.name]
        );

        warnings.push(...warningRows.map(w => ({ ...w, medicine: med.name })));
      } catch (e) {
        console.warn('Error checking medicine warnings:', e.message);
      }
    }

    res.json({
      success: true,
      data: {
        interactions,
        warnings,
        totalInteractions: interactions.length,
        totalWarnings: warnings.length
      }
    });

  } catch (error) {
    console.error('Error in checkDrugInteractions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check drug interactions'
    });
  }
};

/**
 * Calculate dosage based on age and weight
 * GET /api/smart-prescription/calculate-dosage?medicineName=&age=&weight=&patientType=
 */
const calculateDosage = async (req, res) => {
  try {
    const { medicineName, age, weight, patientType = 'adult' } = req.query;
    
    if (!medicineName) {
      return res.status(400).json({
        success: false,
        error: 'Medicine name is required'
      });
    }

    const db = getDb();
    let dosage = '';

    // Pediatric dosage calculation
    if (patientType === 'pediatric' && age && weight) {
      try {
        const [pedRows] = await db.execute(
          `SELECT dose_per_kg, max_dose, frequency, instructions
           FROM pediatric_dosage
           WHERE medicine_name = ? AND min_age <= ? AND max_age >= ?
           LIMIT 1`,
          [medicineName, parseInt(age), parseInt(age)]
        );

        if (pedRows.length > 0) {
          const ped = pedRows[0];
          const calculatedDose = ped.dose_per_kg * parseFloat(weight);
          const finalDose = Math.min(calculatedDose, ped.max_dose || calculatedDose);
          
          dosage = `${finalDose.toFixed(1)}mg ${ped.frequency || '1-0-1'} - ${ped.instructions || 'After food'}`;
        }
      } catch (e) {
        console.warn('Error calculating pediatric dosage:', e.message);
      }
    }

    // Adult dosage with renal/hepatic adjustment
    if (!dosage) {
      try {
        const [adultRows] = await db.execute(
          `SELECT standard_dose, frequency, instructions, renal_adjustment, hepatic_adjustment
           FROM adult_dosage
           WHERE medicine_name = ?
           LIMIT 1`,
          [medicineName]
        );

        if (adultRows.length > 0) {
          const adult = adultRows[0];
          dosage = `${adult.standard_dose} ${adult.frequency || '1-0-1'} - ${adult.instructions || 'After food'}`;
          
          // Add adjustment notes if needed
          if (adult.renal_adjustment) {
            dosage += ` (Renal adjustment: ${adult.renal_adjustment})`;
          }
          if (adult.hepatic_adjustment) {
            dosage += ` (Hepatic adjustment: ${adult.hepatic_adjustment})`;
          }
        }
      } catch (e) {
        console.warn('Error calculating adult dosage:', e.message);
      }
    }

    // Fallback to standard dosage
    if (!dosage) {
      dosage = 'Standard dosage - Consult reference';
    }

    res.json({
      success: true,
      data: {
        medicine: medicineName,
        dosage,
        age: age ? parseInt(age) : null,
        weight: weight ? parseFloat(weight) : null,
        patientType
      }
    });

  } catch (error) {
    console.error('Error in calculateDosage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate dosage'
    });
  }
};

module.exports = {
  getSmartSuggestions,
  checkDrugInteractions,
  calculateDosage
};
