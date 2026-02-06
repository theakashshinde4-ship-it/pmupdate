/**
 * Medications Controller (schema-aligned)
 *
 * Rewritten to use actual schema tables:
 *  - medicines
 *  - dosage_references
 *  - icd_medication_mapping
 *  - symptom_medication_mapping
 *  - prescription_items
 */

const { getDb } = require('../config/db');

/**
 * Helper: pick one best dosage record for given med name/form/strength
 */
async function pickBestDosage(db, name, form, strength) {
  const [rows] = await db.execute(
    `SELECT standard_dosage, max_daily_dose, recommended_frequency, recommended_duration,
            route_of_administration, notes
       FROM dosage_references
      WHERE medication_name = ?
        AND (dosage_form = ? OR ? IS NULL)
        AND (strength = ? OR ? IS NULL)
      ORDER BY FIELD(age_group,'Adult','All','Adolescent','Geriatric','Child','Infant','Neonate') ASC,
               evidence_level ASC
      LIMIT 1`,
    [name, form, form, strength, strength]
  );
  return rows && rows[0] ? rows[0] : null;
}

/**
 * Search medications by name or generic
 * GET /api/medications/search?q=paracetamol&limit=20
 */
exports.searchMedications = async (req, res) => {
  try {
    const { q, limit = 20, offset = 0, category } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ medications: [] });
    }

    const db = getDb();
    const searchTermLike = `%${q}%`;
    const limitNum = Math.min(parseInt(limit) || 20, 100);
    const offsetNum = Math.max(parseInt(offset) || 0, 0);

    let query = `
      SELECT 
        m.id,
        m.name,
        m.generic_name AS generic,
        m.brand,
        m.strength,
        m.dosage_form AS form,
        m.default_dosage,
        m.default_frequency,
        m.default_duration,
        m.default_route,
        m.category,
        m.therapeutic_class,
        m.is_active
      FROM medicines m
      WHERE m.is_active = 1
        AND (
          m.name LIKE ? OR m.generic_name LIKE ? OR m.brand LIKE ?
        )`;

    const params = [searchTermLike, searchTermLike, searchTermLike];

    if (category) {
      query += ` AND (m.category = ? OR m.therapeutic_class = ?)`;
      params.push(category, category);
    }

    query += `
      ORDER BY CASE WHEN m.name LIKE ? THEN 0 ELSE 1 END,
               m.usage_count DESC,
               LENGTH(m.name) ASC
      LIMIT ? OFFSET ?`;
    params.push(searchTermLike, searchTermLike, searchTermLike, searchTermLike, limitNum, offsetNum);

    const [medications] = await db.execute(query, params);

    // total count
    let countQuery = `
      SELECT COUNT(*) AS total
      FROM medicines m
      WHERE m.is_active = 1
        AND (m.name LIKE ? OR m.generic_name LIKE ? OR m.brand LIKE ?)`;
    const countParams = [searchTermLike, searchTermLike, searchTermLike];
    if (category) {
      countQuery += ` AND (m.category = ? OR m.therapeutic_class = ?)`;
      countParams.push(category, category);
    }
    const [countResult] = await db.execute(countQuery, countParams);

    res.json({
      medications,
      total: countResult[0]?.total || 0,
      limit: limitNum,
      offset: offsetNum,
      hasMore: offsetNum + limitNum < (countResult[0]?.total || 0)
    });
  } catch (error) {
    console.error('Search medications error:', error);
    res.status(500).json({ 
      error: 'Failed to search medications',
      details: error.message 
    });
  }
};

/**
 * Get medications by diagnosis (ICD code)
 * GET /api/medications/by-diagnosis?icd_code=I10&limit=10
 */
exports.getMedicationsByDiagnosis = async (req, res) => {
  try {
    const { icd_code, limit = 10 } = req.query;
    if (!icd_code) return res.status(400).json({ error: 'ICD code is required' });

    const db = getDb();
    const limitNum = Math.min(parseInt(limit) || 10, 50);

    const [medications] = await db.execute(
      `SELECT DISTINCT
         m.medication_name           AS name,
         m.generic_name              AS generic,
         m.dosage_form               AS form,
         m.strength                  AS strength,
         m.recommended_frequency     AS frequency,
         m.recommended_duration      AS duration,
         m.recommended_route         AS route,
         m.evidence_level            AS evidence_level,
         dr.standard_dosage          AS dosage,
         dr.max_daily_dose           AS max_dose
       FROM icd_medication_mapping m
       LEFT JOIN dosage_references dr
         ON dr.medication_name = m.medication_name
        AND (dr.dosage_form = m.dosage_form OR m.dosage_form IS NULL)
        AND (dr.strength = m.strength OR m.strength IS NULL)
       WHERE m.icd_code = ?
       ORDER BY m.is_first_line DESC, m.priority ASC, m.medication_name ASC
       LIMIT ?`,
      [icd_code, limitNum]
    );

    res.json({ icd_code, medications, count: medications.length });
  } catch (error) {
    console.error('Get medications by diagnosis error:', error);
    res.status(500).json({ error: 'Failed to get medications', details: error.message });
  }
};

/**
 * Get medications by symptom
 * GET /api/medications/by-symptom?symptom=fever&limit=10
 */
exports.getMedicationsBySymptom = async (req, res) => {
  try {
    const { symptom, limit = 10 } = req.query;
    if (!symptom) return res.status(400).json({ error: 'Symptom is required' });

    const db = getDb();
    const limitNum = Math.min(parseInt(limit) || 10, 50);

    const [medications] = await db.execute(
      `SELECT DISTINCT 
         smm.medication_name AS name,
         dr.dosage_form      AS form,
         dr.strength         AS strength,
         dr.recommended_frequency AS frequency,
         dr.recommended_duration  AS duration,
         dr.route_of_administration AS route,
         smm.severity_level,
         smm.recommendation_priority AS priority
       FROM symptom_medication_mapping smm
       LEFT JOIN dosage_references dr
         ON dr.medication_name = smm.medication_name
       WHERE LOWER(smm.symptom_name) = LOWER(?)
       ORDER BY smm.recommendation_priority ASC, smm.medication_name ASC
       LIMIT ?`,
      [symptom, limitNum]
    );

    res.json({ symptom, medications, count: medications.length });
  } catch (error) {
    console.error('Get medications by symptom error:', error);
    res.status(500).json({ error: 'Failed to get medications', details: error.message });
  }
};

/**
 * Get treatment protocol for specific condition (category)
 * GET /api/medications/protocol/:type
 */
exports.getMedicationProtocol = async (req, res) => {
  try {
    const { type } = req.params;
    if (!type) return res.status(400).json({ error: 'Protocol type is required' });

    const db = getDb();

    const [medications] = await db.execute(
      `SELECT DISTINCT
         dr.medication_name AS name,
         dr.dosage_form     AS form,
         dr.strength        AS strength,
         dr.route_of_administration AS route,
         dr.recommended_frequency AS frequency,
         dr.recommended_duration  AS duration,
         dr.standard_dosage       AS dosage,
         dr.max_daily_dose        AS max_dose,
         dr.notes,
         dr.therapeutic_category  AS category
       FROM dosage_references dr
       WHERE LOWER(dr.therapeutic_category) = LOWER(?) OR LOWER(dr.category) = LOWER(?)
       ORDER BY dr.medication_name ASC`,
      [type, type]
    );

    res.json({ protocol: type, medications, count: medications.length });
  } catch (error) {
    console.error('Get medication protocol error:', error);
    res.status(500).json({ error: 'Failed to get protocol medications', details: error.message });
  }
};

/**
 * Get recommended medications based on patient profile
 * GET /api/medications/recommended?age=30&gender=M&conditions=diabetes,hypertension
 */
exports.getRecommendedMedications = async (req, res) => {
  try {
    const { age, gender, conditions } = req.query;
    const db = getDb();

    const conditionList = conditions ? conditions.split(',').map(c => c.trim()).filter(Boolean) : [];

    let query = `SELECT DISTINCT
                   dr.medication_name AS name,
                   dr.dosage_form     AS form,
                   dr.strength        AS strength,
                   dr.recommended_frequency AS frequency,
                   dr.recommended_duration  AS duration,
                   dr.route_of_administration AS route,
                   dr.therapeutic_category    AS category
                 FROM dosage_references dr
                 WHERE 1=1`;
    const params = [];

    if (age) {
      const ageNum = parseInt(age);
      let ageGroup = 'Adult';
      if (ageNum < 2) ageGroup = 'Infant';
      else if (ageNum < 12) ageGroup = 'Child';
      else if (ageNum < 18) ageGroup = 'Adolescent';
      else if (ageNum > 60) ageGroup = 'Geriatric';
      query += ` AND (dr.age_group = ? OR dr.age_group = 'All' OR dr.age_group = 'General')`;
      params.push(ageGroup);
    }

    if (conditionList.length > 0) {
      const placeholders = conditionList.map(() => '?').join(',');
      query += ` AND dr.therapeutic_category IN (${placeholders})`;
      params.push(...conditionList);
    }

    query += ` ORDER BY dr.medication_name ASC LIMIT 50`;

    const [medications] = await db.execute(query, params);
    res.json({ medications, count: medications.length, filters: { age, gender, conditions: conditionList } });
  } catch (error) {
    console.error('Get recommended medications error:', error);
    res.status(500).json({ error: 'Failed to get recommended medications', details: error.message });
  }
};

/**
 * Get medication alternatives (brands and generics)
 * GET /api/medications/:id/alternatives
 */
exports.getMedicationAlternatives = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    // Get the original medicine
    const [origRows] = await db.execute(
      `SELECT id, name, generic_name, strength, dosage_form FROM medicines WHERE id = ? LIMIT 1`,
      [id]
    );
    if (!origRows || origRows.length === 0) {
      return res.status(404).json({ error: 'Medication not found' });
    }
    const med = origRows[0];

    // Find alternatives by same generic and strength/form
    const [alternatives] = await db.execute(
      `SELECT id, name, brand, generic_name, strength, dosage_form AS form
         FROM medicines
        WHERE is_active = 1
          AND id <> ?
          AND ((generic_name IS NOT NULL AND generic_name = ?) OR (name <> ?))
          AND (strength = ? OR ? IS NULL)
          AND (dosage_form = ? OR ? IS NULL)
        ORDER BY name ASC
        LIMIT 10`,
      [id, med.generic_name, med.name, med.strength, med.strength, med.dosage_form, med.dosage_form]
    );

    res.json({
      original: med,
      alternatives: alternatives || []
    });
  } catch (error) {
    console.error('Get alternatives error:', error);
    res.status(500).json({ error: 'Failed to get alternatives', details: error.message });
  }
};

/**
 * Get recent medications for a patient
 * GET /api/medications/patient/:patientId/recent
 */
exports.getPatientRecentMedications = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { limit = 10 } = req.query;
    const db = getDb();
    const limitNum = Math.min(parseInt(limit) || 10, 50);

    const [medications] = await db.execute(
      `SELECT DISTINCT
         m.name,
         m.brand,
         m.generic_name AS generic,
         m.strength,
         m.dosage_form AS form,
         pi.dosage,
         pi.frequency,
         COUNT(*) AS usage_count,
         MAX(pi.created_at) AS last_used
       FROM prescription_items pi
       JOIN medicines m ON pi.medicine_id = m.id
       WHERE pi.prescription_id IN (SELECT id FROM prescriptions WHERE patient_id = ?)
       GROUP BY m.id
       ORDER BY last_used DESC, usage_count DESC
       LIMIT ?`,
      [patientId, limitNum]
    );

    res.json({ patientId, medications, count: medications.length });
  } catch (error) {
    console.error('Get patient recent medications error:', error);
    res.status(500).json({ error: 'Failed to get patient medications', details: error.message });
  }
};

/**
 * Get medication details
 * GET /api/medications/:id
 */
exports.getMedicationDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const [rows] = await db.execute(
      `SELECT 
         m.id,
         m.name,
         m.brand,
         m.generic_name AS generic,
         m.strength,
         m.dosage_form AS form,
         m.default_dosage,
         m.default_frequency,
         m.default_duration,
         m.default_route,
         m.category,
         m.therapeutic_class,
         m.is_active,
         m.created_at,
         m.updated_at
       FROM medicines m
       WHERE m.id = ?
       LIMIT 1`,
      [id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Medication not found' });
    }

    const med = rows[0];
    const dose = await pickBestDosage(db, med.name, med.form, med.strength);

    res.json({
      id: med.id,
      name: med.name,
      brand: med.brand,
      generic: med.generic,
      strength: med.strength,
      form: med.form,
      route: dose?.route_of_administration || med.default_route,
      frequency: dose?.recommended_frequency || med.default_frequency,
      duration: dose?.recommended_duration || med.default_duration,
      dosage: dose?.standard_dosage || med.default_dosage,
      max_dose: dose?.max_daily_dose || null,
      category: med.category,
      therapeutic_class: med.therapeutic_class,
      is_active: med.is_active,
      created_at: med.created_at,
      updated_at: med.updated_at,
      notes: dose?.notes || null
    });
  } catch (error) {
    console.error('Get medication details error:', error);
    res.status(500).json({ error: 'Failed to get medication details', details: error.message });
  }
};

/**
 * Get all medication categories
 * GET /api/medications/categories
 */
exports.getMedicationCategories = async (req, res) => {
  try {
    const db = getDb();
    const [categories] = await db.execute(
      `SELECT category, COUNT(*) AS count
         FROM medicines
        WHERE is_active = 1 AND category IS NOT NULL AND category <> ''
        GROUP BY category
        ORDER BY category ASC`
    );
    res.json({ categories, count: categories.length });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories', details: error.message });
  }
};
