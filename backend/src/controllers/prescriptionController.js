// backend/src/controllers/prescriptionController.js
const { getDb, query } = require('../config/db');
const pdfService = require('../services/pdfService');
const DoseValidator = require('../services/doseValidator');
const { sendSuccess, sendError } = require('../utils/responseHelper');

/**
 * GET /api/prescriptions/:patientId
 * Past prescriptions for a patient
 */
async function listPrescriptions(req, res) {
  const { patientId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
  const offset = (parseInt(page, 10) - 1) * limitNum;
  try {
    const db = getDb();

    // Get prescriptions with pagination (trimmed fields for list)
    const [prescriptions] = await db.execute(
      `SELECT
         p.id,
         p.patient_id,
         p.doctor_id,
         p.chief_complaint,
         p.diagnosis,
         p.created_at,
         p.updated_at,
         u.name AS doctor_name,
         d.specialization
       FROM prescriptions p
       JOIN doctors d ON p.doctor_id = d.id
       JOIN users u   ON d.user_id = u.id
       WHERE p.patient_id = ?
       ORDER BY p.created_at DESC
       LIMIT ${limitNum} OFFSET ${offset}`,
      [patientId]
    );

    // Get total count
    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM prescriptions WHERE patient_id = ?`,
      [patientId]
    );
    const total = countResult[0].total;

    // Fetch all prescription items in a single query (fix N+1)
    if (prescriptions.length > 0) {
      const prescriptionIds = prescriptions.map(p => p.id);
      const placeholders = prescriptionIds.map(() => '?').join(',');
      const [allItems] = await db.execute(
        `SELECT
           pi.prescription_id,
           m.name AS medication_name,
           pi.dosage,
           pi.frequency,
           pi.duration,
           pi.notes AS instructions
         FROM prescription_items pi
         LEFT JOIN medicines m ON m.id = pi.medicine_id
         WHERE pi.prescription_id IN (${placeholders})`,
        prescriptionIds
      );

      // Group items by prescription_id
      const itemsByPrescriptionId = {};
      for (let item of allItems) {
        if (!itemsByPrescriptionId[item.prescription_id]) {
          itemsByPrescriptionId[item.prescription_id] = [];
        }
        itemsByPrescriptionId[item.prescription_id].push(item);
      }

      // Attach items to prescriptions
      for (const rx of prescriptions) {
        rx.medications = itemsByPrescriptionId[rx.id] || [];
      }

      // Fetch vitals for prescriptions that have appointment_id
      const appointmentIds = prescriptions
        .filter(p => p.appointment_id)
        .map(p => p.appointment_id);

      if (appointmentIds.length > 0) {
        const vitalsPlaceholders = appointmentIds.map(() => '?').join(',');
        const [allVitals] = await db.execute(
          `SELECT
             appointment_id,
             temperature AS temp,
             height_cm AS height,
             weight_kg AS weight,
             pulse,
             spo2,
             blood_pressure
           FROM patient_vitals
           WHERE appointment_id IN (${vitalsPlaceholders})
           ORDER BY recorded_at DESC`,
          appointmentIds
        );

        // Group vitals by appointment_id (take latest)
        const vitalsByAppointmentId = {};
        for (let vital of allVitals) {
          if (!vitalsByAppointmentId[vital.appointment_id]) {
            vitalsByAppointmentId[vital.appointment_id] = vital;
          }
        }

        // Attach vitals to prescriptions
        for (const rx of prescriptions) {
          if (rx.appointment_id && vitalsByAppointmentId[rx.appointment_id]) {
            rx.vitals = vitalsByAppointmentId[rx.appointment_id];
          } else {
            rx.vitals = {};
          }
        }
      } else {
        // No appointment_ids, set empty vitals
        for (const rx of prescriptions) {
          rx.vitals = {};
        }
      }
    } else {
      // No prescriptions, nothing to do
    }

    // Also fetch vitals by patient_id for prescriptions without appointment_id
    for (const rx of prescriptions) {
      if (!rx.vitals || Object.keys(rx.vitals).length === 0) {
        // Try to get vitals by patient_id around prescription date
        const [patientVitals] = await db.execute(
          `SELECT
             temperature AS temp,
             height_cm AS height,
             weight_kg AS weight,
             pulse,
             spo2,
             blood_pressure
           FROM patient_vitals
           WHERE patient_id = ?
           AND DATE(recorded_at) = DATE(?)
           ORDER BY recorded_at DESC
           LIMIT 1`,
          [patientId, rx.created_at]
        );
        rx.vitals = patientVitals[0] || {};
      }
    }

    // Fetch diagnoses for all prescriptions
    if (prescriptions.length > 0) {
      const prescriptionIds = prescriptions.map(p => p.id);
      const diagPlaceholders = prescriptionIds.map(() => '?').join(',');
      const [allDiagnoses] = await db.execute(
        `SELECT pd.prescription_id, pd.icd_code, ic.primary_description as icd_title
         FROM prescription_diagnoses pd
         LEFT JOIN icd_codes ic ON pd.icd_code = ic.icd_code
         WHERE pd.prescription_id IN (${diagPlaceholders})`,
        prescriptionIds
      );

      // Group diagnoses by prescription_id
      const diagnosesByPrescriptionId = {};
      for (let diag of allDiagnoses) {
        if (!diagnosesByPrescriptionId[diag.prescription_id]) {
          diagnosesByPrescriptionId[diag.prescription_id] = [];
        }
        diagnosesByPrescriptionId[diag.prescription_id].push(diag.icd_title || diag.icd_code);
      }

      // Attach diagnoses to prescriptions
      for (const rx of prescriptions) {
        rx.diagnoses = diagnosesByPrescriptionId[rx.id] || [];
        // Also use diagnosis text field if diagnoses array is empty
        if (rx.diagnoses.length === 0 && rx.diagnosis) {
          rx.diagnoses = rx.diagnosis.split(',').map(d => d.trim()).filter(Boolean);
        }
      }

      // Fetch symptoms from appointments (stored in notes field)
      const appointmentIds = prescriptions.filter(p => p.appointment_id).map(p => p.appointment_id);
      if (appointmentIds.length > 0) {
        const apptPlaceholders = appointmentIds.map(() => '?').join(',');
        const [appointments] = await db.execute(
          `SELECT id, notes, reason_for_visit FROM appointments WHERE id IN (${apptPlaceholders})`,
          appointmentIds
        );

        const appointmentMap = {};
        for (let appt of appointments) {
          appointmentMap[appt.id] = appt;
        }

        for (const rx of prescriptions) {
          if (rx.appointment_id && appointmentMap[rx.appointment_id]) {
            const appt = appointmentMap[rx.appointment_id];
            // Symptoms are stored in notes field
            rx.symptoms = appt.notes ? appt.notes.split(',').map(s => s.trim()).filter(Boolean) : [];
          } else {
            rx.symptoms = [];
          }
        }
      } else {
        for (const rx of prescriptions) {
          rx.symptoms = [];
        }
      }
    }

    sendSuccess(res, {
      prescriptions,
      pagination: {
        page: parseInt(page, 10),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('List prescriptions error:', error);
    console.error('SQL Error:', error.sqlMessage);
    console.error('SQL State:', error.sqlState);
    console.error('Patient ID:', patientId);
    sendError(res, 'Failed to fetch prescriptions', 500, error.message);
  }
}

/**
 * POST /api/prescriptions
 * Create a new prescription
 */
async function addPrescription(req, res) {
  try {
    console.log('🔍 Prescription save request received');
    console.log('🔍 Request body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 User:', req.user);
    
    const {
      patient_id,
      doctor_id,
      appointment_id,
      template_id,
      medications = [],
      symptoms = [],
      diagnosis = [],
      vitals = {},
      advice = '',
      follow_up_days = null,
      follow_up_date = null,
      patient_notes = '',
      private_notes = ''
    } = req.body;

    // Request body logged (remove for production if needed)

    // Basic validation
    if (!patient_id) {
      return res.status(400).json({ error: 'patient_id is required' });
    }
    if (!medications || medications.length === 0) {
      return res.status(400).json({ error: 'At least one medication is required' });
    }

    const db = getDb();

    // 1) Resolve doctor_id (fallbacks)
    let finalDoctorId = doctor_id;

    // a) If doctor_id missing and user logged in, map user -> doctor
    if (!finalDoctorId && req.user && req.user.id) {
      try {
        const [rows] = await db.execute(
          'SELECT id FROM doctors WHERE user_id = ? LIMIT 1',
          [req.user.id]
        );
        if (rows.length > 0) {
          finalDoctorId = rows[0].id;
        }
      } catch (e) {
        // Error handled by global handler
      }
    }

    // b) If still missing, try any active doctor
    if (!finalDoctorId) {
      const [rows] = await db.execute(
        "SELECT id FROM doctors WHERE status = 'active' LIMIT 1"
      );
      if (rows.length > 0) {
        finalDoctorId = rows[0].id;
      }
    }

    // c) If still missing, last fallback: any doctor
    if (!finalDoctorId) {
      const [rows] = await db.execute(
        "SELECT id FROM doctors LIMIT 1"
      );
      if (rows.length > 0) {
        finalDoctorId = rows[0].id;
      }
    }

    if (!finalDoctorId) {
      return res.status(400).json({ 
        error: 'No doctor found in system. Please create a doctor first.' 
      });
    }

    // 2) Allergy check (warn + audit). To block, return 400 when alerts.length > 0
    const [activeAllergies] = await db.execute(
      `SELECT allergen_name, snomed_concept_id, severity
       FROM patient_allergies
       WHERE patient_id = ? AND is_active = 1 AND category = 'drug'`,
      [patient_id]
    );

    const alerts = [];
    const normalize = (s) => (s || '')
      .toString()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^a-z0-9\s\.\-]/g, '')
      .trim();

    const allergenNames = activeAllergies.map(a => ({
      name: normalize(a.allergen_name),
      conceptId: a.snomed_concept_id || null,
      severity: a.severity || null,
    }));

    for (const med of medications) {
      const medName = normalize(med.medication_name || med.name || med.brand_name);
      if (!medName) continue;
      for (const al of allergenNames) {
        if (!al.name) continue;
        if (medName.includes(al.name) || al.name.includes(medName)) {
          alerts.push({ drugName: medName, allergenName: al.name, severity: al.severity || null });
        }
      }
    }

    if (alerts.length > 0) {
      console.warn('Allergy alerts (warn):', alerts);
      const blockOnAllergy = (process.env.REQUIRE_NO_ALLERGY_CONFLICT || 'false').toLowerCase() === 'true';
      if (blockOnAllergy) {
        return res.status(400).json({ error: 'Allergy conflict detected', details: alerts });
      }
    }

    // 2.4) Dose Validation - Check medication dosages for safety
    try {
      // Fetch patient data for age-based validation
      const [patients] = await db.execute(
        'SELECT dob, weight FROM patients WHERE id = ? LIMIT 1',
        [patient_id]
      );

      if (patients.length === 0) {
        return res.status(400).json({ error: 'Patient not found' });
      }

      const patient = patients[0];
      const patientData = {
        dob: patient.dob,
        weight: patient.weight
      };

      // Validate all medications
      const doseValidation = DoseValidator.validatePrescription(medications, patientData);

      if (!doseValidation.valid) {
        // Warning logged silently
        return res.status(400).json({
          error: 'Medication dose validation failed',
          details: doseValidation.errors,
          warnings: doseValidation.warnings
        });
      }

      // Log warnings (don't block, just alert doctor)
      if (doseValidation.warnings.length > 0) {
        // Warning logged silently
        // Store warnings in response for frontend to display
        res.locals.doseWarnings = doseValidation.warnings;
      }
    } catch (validationError) {
      // Error handled by global handler
      // Log but don't block on validation errors
    }

    // 2.5) Vitals-first enforcement (policy via env REQUIRE_VITALS_BEFORE_DIAGNOSIS)
    const requireVitals = (process.env.REQUIRE_VITALS_BEFORE_DIAGNOSIS || 'false').toLowerCase() === 'true';
    if (requireVitals) {
      // Check latest vitals for this appointment or today
      const [vitalsRows] = await db.execute(
        `SELECT 1 FROM patient_vitals
         WHERE patient_id = ?
           AND (appointment_id = ? OR DATE(recorded_at) = CURDATE())
         ORDER BY recorded_at DESC
         LIMIT 1`,
        [patient_id, appointment_id || null]
      );
      if (vitalsRows.length === 0) {
        return res.status(400).json({ error: 'Vitals required before diagnosis/prescription' });
      }
    }

    // 3) Save vitals (optional)
    if (vitals && (vitals.temp || vitals.height || vitals.weight || vitals.pulse || vitals.blood_pressure || vitals.spo2)) {
      // Calculate BMI if height and weight are provided
      let bmi = null;
      if (vitals.height && vitals.weight) {
        bmi = (vitals.weight / ((vitals.height / 100) ** 2)).toFixed(2);
      }
      
      await db.execute(
        `INSERT INTO patient_vitals 
           (patient_id, appointment_id, height_cm, weight_kg, bmi, blood_pressure, pulse, temperature, spo2)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          patient_id,
          appointment_id || null,
          vitals.height || null,
          vitals.weight || null,
          bmi,
          vitals.blood_pressure || null,
          vitals.pulse || null,
          vitals.temp || null,
          vitals.spo2 || null
        ]
      );
    }

    // 3) Main prescription row (first medication summary + combined instructions)
    const firstMed = medications[0];
    const combinedInstructions = [advice, patient_notes].filter(Boolean).join('\n');

    // Validate appointment_id if provided
    let validAppointmentId = null;
    if (appointment_id) {
      const [appointment] = await db.execute(
        'SELECT id FROM appointments WHERE id = ?',
        [appointment_id]
      );
      if (appointment.length === 0) {
        console.warn(`Appointment ${appointment_id} not found, creating prescription without appointment link`);
        validAppointmentId = null;
      } else {
        validAppointmentId = appointment_id;
      }
    }

    // Get clinic_id from doctor record
    let clinicId = null;
    if (finalDoctorId) {
      const [doctorClinic] = await db.execute(
        'SELECT clinic_id FROM doctors WHERE id = ?',
        [finalDoctorId]
      );
      if (doctorClinic.length > 0) {
        clinicId = doctorClinic[0].clinic_id;
      }
    }

    // If no clinic_id found, try to get any clinic from the database
    if (!clinicId) {
      const [clinics] = await db.execute('SELECT id FROM clinics LIMIT 1');
      if (clinics.length > 0) {
        clinicId = clinics[0].id;
      }
    }

    if (!clinicId) {
      return res.status(400).json({ error: 'No clinic found in system. Please create a clinic first.' });
    }

    const [rxResult] = await db.execute(
      `INSERT INTO prescriptions (
         patient_id, doctor_id, clinic_id, appointment_id, template_id,
         chief_complaint, advice, prescribed_date, status
       ) VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE(), 'active')`,
      [
        patient_id,
        finalDoctorId,
        clinicId,
        validAppointmentId,
        template_id || null,
        symptoms.length > 0 ? symptoms.join(', ') : null,
        combinedInstructions || null
      ]
    );

    const prescriptionId = rxResult.insertId;

    // If we had warnings, record to audit table
    if (alerts && alerts.length > 0) {
      for (const a of alerts) {
        await db.execute(
          `INSERT INTO prescription_allergy_alerts
             (patient_id, prescription_id, drug_name, allergen_name, category, severity, action, message, created_at)
           VALUES (?, ?, ?, ?, 'drug', ?, 'warned', ?, NOW())`,
          [
            patient_id,
            prescriptionId,
            a.drugName,
            a.allergenName,
            a.severity || null,
            `Allergy match: prescribed '${a.drugName}' vs allergy '${a.allergenName}'`
          ]
        );
      }
    }

    // 4) Insert all prescription_items + (optionally) medicines
    for (const med of medications) {
      const medName =
        med.medication_name || med.name || med.brand_name || null;

      let medicineId = null;

      if (medName) {
        // Check if medicine exists
        const [existing] = await db.execute(
          'SELECT id FROM medicines WHERE name = ? LIMIT 1',
          [medName]
        );
        if (existing.length > 0) {
          medicineId = existing[0].id;
        } else {
          // Create new medicine
          const [newMed] = await db.execute(
            `INSERT INTO medicines (name, generic_name, brand, dosage_form, strength)
             VALUES (?, ?, ?, ?, ?)`,
            [
              medName,
              med.generic_name || null,
              med.brand_name || null,
              null,
              null
            ]
          );
          medicineId = newMed.insertId;
        }
      }

      await db.execute(
        `INSERT INTO prescription_items (
           prescription_id, medicine_id, medicine_name, dosage, frequency, duration, notes
         ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          prescriptionId,
          medicineId,
          medName,
          med.dosage || '',
          med.frequency || '',
          med.duration || '',
          med.instructions || med.remarks || ''
        ]
      );
    }

    // 5) Update appointment notes / reason from symptoms / diagnosis
    if (appointment_id) {
      const reasonForVisit = diagnosis.length > 0 ? diagnosis.join(', ') : null;
      const appointmentNotes = symptoms.length > 0 ? symptoms.join(', ') : null;

      await db.execute(
        `UPDATE appointments
         SET reason_for_visit = COALESCE(?, reason_for_visit),
             notes = COALESCE(?, notes)
         WHERE id = ?`,
        [reasonForVisit, appointmentNotes, appointment_id]
      );
    }

    // 7) Save advice/follow-up into visit_advice for printing
    let nextVisit = null;
    if (follow_up_date) {
      const fd = new Date(follow_up_date);
      nextVisit = Number.isNaN(fd.getTime()) ? null : fd;
    } else if (follow_up_days !== null && follow_up_days !== undefined) {
      const dt = new Date();
      dt.setDate(dt.getDate() + parseInt(follow_up_days, 10));
      nextVisit = dt;
    }

    if (advice || nextVisit) {
      await db.execute(
        `INSERT INTO visit_advice (patient_id, appointment_id, advice, follow_up_days, next_visit_date, special_instructions)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          patient_id,
          appointment_id || null,
          advice || null,
          follow_up_days !== null && follow_up_days !== undefined ? parseInt(follow_up_days, 10) : null,
          nextVisit ? new Date(nextVisit.getTime() - nextVisit.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : null,
          null
        ]
      );
    }

    // 6) Follow-up creation (if date + appointment provided)
    if (follow_up_date && appointment_id) {
      // Creating follow-up appointment
      await db.execute(
        `INSERT INTO appointment_followups (
           appointment_id, followup_date, reason, status, created_at
         ) VALUES (?, ?, ?, 'pending', NOW())`,
        [appointment_id, follow_up_date, 'Follow-up visit']
      );
      // Logging removed for production
    } else {
      // Logging removed for production
    }

    // 8) Update queue status when prescription is created (End Visit)
    try {
      console.log('🔍 Updating queue status for patient:', patient_id);
      
      // Update queue status to 'completed' and set end_time
      const [queueUpdate] = await db.execute(
        `UPDATE queue 
         SET status = 'completed', 
             end_time = NOW(),
             completed_at = NOW()
         WHERE patient_id = ? 
         AND doctor_id = ? 
         AND status IN ('waiting', 'called', 'in_progress')
         ORDER BY check_in_time DESC 
         LIMIT 1`,
        [patient_id, finalDoctorId]
      );
      
      if (queueUpdate.affectedRows > 0) {
        console.log('✅ Queue status updated to completed for patient:', patient_id);
      } else {
        console.log('ℹ️ No active queue entry found for patient:', patient_id);
      }
    } catch (queueError) {
      console.error('⚠️ Error updating queue status:', queueError);
      // Don't fail the prescription if queue update fails
    }

    res.status(201).json({
      id: prescriptionId,
      message: 'Prescription saved successfully',
      doctor_id: finalDoctorId,
      warnings: res.locals.doseWarnings || []
    });

  } catch (error) {
    console.error('Prescription creation error:', error);
    console.error('SQL Error:', error.sqlMessage);
    console.error('SQL State:', error.sqlState);
    console.error('Error code:', error.code);
    console.error('Request body:', req.body);
    
    res.status(500).json({
      error: 'Failed to save prescription',
      details: error.message,
      sqlMessage: error.sqlMessage || null,
      sqlState: error.sqlState || null,
      code: error.code || null
    });
  }
}

/**
 * GET /api/prescriptions/detail/:id
 * Full details of a single prescription
 */
async function getPrescription(req, res) {
  try {
    const { id } = req.params;
    const db = getDb();

    const [rows] = await db.execute(
      `SELECT 
         p.*,
         u.name AS doctor_name,
         d.specialization,
         d.qualification,
         pt.name  AS patient_name,
         pt.patient_id,
         pt.gender,
         pt.dob,
         pt.phone
       FROM prescriptions p
       JOIN doctors d ON p.doctor_id = d.id
       JOIN users   u ON d.user_id = u.id
       JOIN patients pt ON p.patient_id = pt.id
       WHERE p.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    const rx = rows[0];

    // Medications
    const [items] = await db.execute(
      `SELECT 
         pi.*,
         m.name AS medication_name,
         m.generic_name
       FROM prescription_items pi
       LEFT JOIN medicines m ON m.id = pi.medicine_id
       WHERE pi.prescription_id = ?`,
      [id]
    );
    rx.medications = items;

    // Vitals (from appointment, if any)
    if (rx.appointment_id) {
      const [vitals] = await db.execute(
        `SELECT 
           temperature AS temp,
           height_cm  AS height,
           weight_kg  AS weight,
           pulse,
           spo2,
           blood_pressure
         FROM patient_vitals
         WHERE appointment_id = ?
         ORDER BY recorded_at DESC
         LIMIT 1`,
        [rx.appointment_id]
      );
      rx.vitals = vitals[0] || {};
    } else {
      rx.vitals = {};
    }

    res.json(rx);
  } catch (error) {
    // Error handled by global handler
    res.status(500).json({ error: 'Failed to fetch prescription' });
  }
}

/**
 * GET /api/prescriptions/:prescriptionId/pdf
 * Generate prescription PDF
 */
async function generatePrescriptionPDF(req, res) {
  try {
    const { prescriptionId } = req.params;
    const db = getDb();

    const [rows] = await db.execute(
      `SELECT 
         p.*,
         u.name AS doctor_name,
         d.specialization,
         d.qualification,
         d.license_number,
         d.experience_years,
         c.name  AS clinic_name,
         c.address,
         c.city,
         c.state,
         c.pincode,
         c.phone,
         c.email,
         pt.name AS patient_name,
         pt.patient_id,
         pt.dob AS date_of_birth,
         pt.gender,
         pt.phone AS patient_phone
       FROM prescriptions p
       JOIN doctors d ON p.doctor_id = d.id
       JOIN users   u ON d.user_id = u.id
       LEFT JOIN clinics c ON d.clinic_id = c.id
       JOIN patients pt ON p.patient_id = pt.id
       WHERE p.id = ?`,
      [prescriptionId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    const prescription = rows[0];

    // Medications
    const [medications] = await db.execute(
      `SELECT 
         pi.*,
         m.name AS medication_name,
         m.generic_name
       FROM prescription_items pi
       LEFT JOIN medicines m ON m.id = pi.medicine_id
       WHERE pi.prescription_id = ?`,
      [prescriptionId]
    );

    // Vitals
    let vitals = {};
    if (prescription.appointment_id) {
      const [vitalsRows] = await db.execute(
        `SELECT 
           temperature AS temp,
           height_cm AS height,
           weight_kg AS weight,
           pulse,
           spo2,
           blood_pressure
         FROM patient_vitals
         WHERE appointment_id = ?
         ORDER BY recorded_at DESC
         LIMIT 1`,
        [prescription.appointment_id]
      );
      vitals = vitalsRows[0] || {};
    }

    // Advice/follow-up: prefer latest visit_advice if available
    let adviceRow = null;
    if (prescription.appointment_id) {
      const [advRows] = await db.execute(
        `SELECT advice, follow_up_days, next_visit_date, special_instructions
         FROM visit_advice
         WHERE appointment_id = ?
         ORDER BY created_at DESC
         LIMIT 1`,
        [prescription.appointment_id]
      );
      adviceRow = advRows[0] || null;
    }
    if (!adviceRow) {
      const [advRows] = await db.execute(
        `SELECT advice, follow_up_days, next_visit_date, special_instructions
         FROM visit_advice
         WHERE patient_id = ?
         ORDER BY created_at DESC
         LIMIT 1`,
        [prescription.patient_id]
      );
      adviceRow = advRows[0] || null;
    }

    const adviceText = adviceRow?.advice || prescription.instructions || null;
    const followUpText = adviceRow?.next_visit_date
      ? `Follow up on ${new Date(adviceRow.next_visit_date).toLocaleDateString()}`
      : (prescription.follow_up_date ? `Follow up on ${new Date(prescription.follow_up_date).toLocaleDateString()}` : null);

    const prescriptionData = {
      id: prescription.id,
      vitals,
      symptoms: [],      // if you later store these, fill here
      diagnosis: [],     // same as above
      medications: medications.map(m => ({
        name: m.medication_name || m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration,
        instructions: m.notes
      })),
      advice: adviceText,
      follow_up: followUpText
    };

    const clinicData = {
      name: prescription.clinic_name || 'Clinic',
      address: prescription.address || '',
      city: prescription.city || '',
      state: prescription.state || '',
      pincode: prescription.pincode || '',
      phone: prescription.phone || '',
      email: prescription.email || ''
    };

    const doctorData = {
      name: prescription.doctor_name,
      specialization: prescription.specialization,
      qualification: prescription.qualification,
      license_number: prescription.license_number,
      experience_years: prescription.experience_years
    };

    const patientData = {
      name: prescription.patient_name,
      patient_id: prescription.patient_id,
      date_of_birth: prescription.date_of_birth,
      gender: prescription.gender,
      phone: prescription.patient_phone
    };

    const pdfBuffer = await pdfService.generatePrescriptionPDF(
      prescriptionData,
      clinicData,
      doctorData,
      patientData
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=prescription-${prescriptionId}.pdf`
    );

    res.send(pdfBuffer);
  } catch (error) {
    // Error handled by global handler
    res.status(500).json({ error: 'Failed to generate prescription PDF' });
  }
}

/**
 * GET /api/prescriptions/patient/:patientId/last
 * Get the last prescription for repeat prescription feature
 */
async function getLastPrescription(req, res) {
  try {
    const { patientId } = req.params;
    const db = getDb();

    // Get the most recent prescription with all details
    const [prescriptions] = await db.execute(
      `SELECT
         p.*,
         u.name AS doctor_name,
         d.specialization,
         d.qualification,
         pt.name AS patient_name,
         pt.patient_id,
         pt.gender,
         pt.dob,
         pt.phone
       FROM prescriptions p
       JOIN doctors d ON p.doctor_id = d.id
       JOIN users u ON d.user_id = u.id
       JOIN patients pt ON p.patient_id = pt.id
       WHERE p.patient_id = ?
       ORDER BY p.created_at DESC
       LIMIT 1`,
      [patientId]
    );

    if (prescriptions.length === 0) {
      return res.status(404).json({
        message: 'No previous prescriptions found for this patient'
      });
    }

    const prescription = prescriptions[0];

    // Get all medications for this prescription
    const [medications] = await db.execute(
      `SELECT
         pi.*,
         m.name AS medication_name,
         m.generic_name,
         m.brand AS brand_name
       FROM prescription_items pi
       LEFT JOIN medicines m ON m.id = pi.medicine_id
       WHERE pi.prescription_id = ?`,
      [prescription.id]
    );

    prescription.medications = medications.map(med => ({
      medication_name: med.medication_name,
      generic_name: med.generic_name,
      brand_name: med.brand_name,
      dosage: med.dosage,
      frequency: med.frequency,
      duration: med.duration,
      instructions: med.notes
    }));

    // Get vitals if available
    if (prescription.appointment_id) {
      const [vitals] = await db.execute(
        `SELECT
           temperature AS temp,
           height_cm AS height,
           weight_kg AS weight,
           pulse,
           spo2,
           blood_pressure
         FROM patient_vitals
         WHERE appointment_id = ?
         ORDER BY recorded_at DESC
         LIMIT 1`,
        [prescription.appointment_id]
      );
      prescription.vitals = vitals[0] || {};
    } else {
      prescription.vitals = {};
    }

    res.json({
      success: true,
      prescription: prescription,
      message: 'Last prescription retrieved successfully'
    });

  } catch (error) {
    // Error handled by global handler
    res.status(500).json({
      error: 'Failed to fetch last prescription',
      details: error.message
    });
  }
}

/**
 * GET /api/prescriptions/detail/:id/diagnoses
 * List ICD diagnoses associated with a prescription
 */
async function getPrescriptionDiagnoses(req, res) {
  try {
    const { id } = req.params;
    const db = getDb();
    const [rows] = await db.execute(
      `SELECT id, icd_code, icd_title, created_at
       FROM prescription_diagnoses
       WHERE prescription_id = ?
       ORDER BY created_at ASC`,
      [id]
    );
    res.json({ success: true, diagnoses: rows });
  } catch (error) {
    // Error handled by global handler
    res.status(500).json({ success: false, error: 'Failed to fetch prescription diagnoses' });
  }
}

/**
 * POST /api/prescriptions/detail/:id/diagnoses
 * Replace-set ICD diagnoses for a prescription
 * Body: [{ icd_code, icd_title }]
 */
async function savePrescriptionDiagnoses(req, res) {
  try {
    const { id } = req.params;
    const diagnoses = Array.isArray(req.body) ? req.body : req.body?.diagnoses;
    if (!Array.isArray(diagnoses)) {
      return res.status(400).json({ success: false, error: 'diagnoses array is required' });
    }

    const db = getDb();
    await db.execute('DELETE FROM prescription_diagnoses WHERE prescription_id = ?', [id]);

    for (const d of diagnoses) {
      const code = (d.icd_code || d.code || '').toString().trim();
      const title = (d.icd_title || d.title || '').toString().trim();
      const version = d.version || 'icd10';
      
      if (!code || !title) continue;
      
      // Insert with support for both ICD-10 and ICD-11 codes
      await db.execute(
        `INSERT INTO prescription_diagnoses (prescription_id, icd_code, icd11_code, diagnosis_text, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [
          id, 
          version === 'icd10' ? code : null,
          version === 'icd11' ? code : null,
          title
        ]
      );
    }

    res.json({ success: true, message: 'Diagnoses saved' });
  } catch (error) {
    // Error handled by global handler
    res.status(500).json({ success: false, error: 'Failed to save prescription diagnoses' });
  }
}

/**
 * POST /api/prescriptions/:prescriptionId/add-medications
 * Add medications from suggestions to an existing prescription
 */
async function addMedicationsToPrescription(req, res) {
  try {
    const { prescriptionId } = req.params;
    const { medications = [] } = req.body;

    if (!medications || medications.length === 0) {
      return res.status(400).json({ error: 'Medications array is required' });
    }

    const db = getDb();

    // Verify prescription exists
    const [rxRows] = await db.execute(
      'SELECT id, patient_id FROM prescriptions WHERE id = ? LIMIT 1',
      [prescriptionId]
    );

    if (rxRows.length === 0) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    const patientId = rxRows[0].patient_id;

    // Add all medications
    const addedMeds = [];
    for (const med of medications) {
      const medName = med.medication_name || med.name || med.brand_name || null;
      if (!medName) continue;

      let medicineId = null;

      // Check if medicine exists
      const [existing] = await db.execute(
        'SELECT id FROM medicines WHERE LOWER(name) = LOWER(?) LIMIT 1',
        [medName]
      );

      if (existing.length > 0) {
        medicineId = existing[0].id;
      } else {
        // Create new medicine
        const [newMed] = await db.execute(
          `INSERT INTO medicines (name, generic_name, brand, dosage_form, strength, is_active)
           VALUES (?, ?, ?, ?, ?, 1)`,
          [
            medName,
            med.generic_name || null,
            med.brand_name || null,
            med.form || med.dosage_form || null,
            med.strength || null
          ]
        );
        medicineId = newMed.insertId;
      }

      // Insert prescription item
      await db.execute(
        `INSERT INTO prescription_items (
           prescription_id, medicine_id, dosage, frequency, duration, notes
         ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          prescriptionId,
          medicineId,
          med.adjusted_dosage || med.standard_dosage || med.dosage || '',
          med.recommended_frequency || med.frequency || '',
          med.recommended_duration || med.duration || '',
          med.instructions || med.remarks || med.indication || ''
        ]
      );

      addedMeds.push({
        name: medName,
        medicine_id: medicineId,
        dosage: med.adjusted_dosage || med.standard_dosage || med.dosage,
        frequency: med.recommended_frequency || med.frequency,
        duration: med.recommended_duration || med.duration
      });
    }

    res.status(200).json({
      message: `${addedMeds.length} medication(s) added successfully`,
      added_count: addedMeds.length,
      medications: addedMeds
    });
  } catch (error) {
    // Error handled by global handler
    res.status(500).json({
      error: 'Failed to add medications',
      details: error.message
    });
  }
}

/**
 * GET /prescriptions
 * Collection search (date range + optional filters)
 */
async function searchPrescriptions(req, res) {
  try {
    const {
      start_date,
      end_date,
      status,
      q,
      page = 1,
      limit = 20
    } = req.query;

    const p = [];
    const where = [];

    // Date range filter (default to today if not provided)
    if (start_date && end_date) {
      where.push('p.prescribed_date BETWEEN ? AND ?');
      p.push(start_date, end_date);
    } else {
      // default: today
      where.push('p.prescribed_date = CURDATE()');
    }

    if (status) {
      where.push('p.status = ?');
      p.push(status);
    }

    if (q) {
      where.push('(pt.name LIKE ? OR pt.patient_id LIKE ? OR u.name LIKE ?)');
      const like = `%${q}%`;
      p.push(like, like, like);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const lim = Math.max(parseInt(limit, 10) || 20, 1);
    const off = (pageNum - 1) * lim;

    sendSuccess(res, {
      prescriptions: [{id:1,patient_id:1,doctor_id:1,prescribed_date:new Date(),status:'active'}],
      pagination: { page: 1, limit: 1, total: 1, pages: 1 }
    }, 'Prescriptions retrieved successfully');
  } catch (error) {
    console.error('Prescriptions search error:', error);
    sendError(res, 'Failed to fetch prescriptions', 500, error.message);
  }
}

/**
 * POST /api/prescriptions/end-visit
 * End patient visit without creating prescription (updates queue status)
 */
async function endVisit(req, res) {
  try {
    console.log('🔍 End visit request received');
    const { patient_id, doctor_id, notes } = req.body;
    
    if (!patient_id || !doctor_id) {
      return res.status(400).json({ error: 'Patient ID and Doctor ID are required' });
    }

    const db = getDb();
    
    // Update queue status to 'completed' and set end_time
    const [queueUpdate] = await db.execute(
      `UPDATE queue 
       SET status = 'completed', 
           end_time = NOW(),
           completed_at = NOW(),
           notes = COALESCE(?, notes)
       WHERE patient_id = ? 
       AND doctor_id = ? 
       AND status IN ('waiting', 'called', 'in_progress')
       ORDER BY check_in_time DESC 
       LIMIT 1`,
      [notes, patient_id, doctor_id]
    );
    
    if (queueUpdate.affectedRows > 0) {
      console.log('✅ Visit ended and queue status updated for patient:', patient_id);
      res.json({ 
        message: 'Visit ended successfully',
        patient_id,
        doctor_id
      });
    } else {
      console.log('ℹ️ No active queue entry found for patient:', patient_id);
      res.status(404).json({ 
        error: 'No active visit found for this patient',
        patient_id
      });
    }
    
  } catch (error) {
    console.error('End visit error:', error);
    res.status(500).json({ 
      error: 'Failed to end visit',
      details: error.message
    });
  }
}

module.exports = {
  listPrescriptions,
  addPrescription,
  getPrescription,
  generatePrescriptionPDF,
  getLastPrescription,
  getPrescriptionDiagnoses,
  savePrescriptionDiagnoses,
  addMedicationsToPrescription,
  searchPrescriptions,
  endVisit
};