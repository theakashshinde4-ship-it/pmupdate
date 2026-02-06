/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User login
 *     description: Authenticate user with username and password. Returns JWT token for subsequent requests.
 *     operationId: loginUser
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             username: dr_smith
 *             password: SecurePassword123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many login attempts (rate limited)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Too many login attempts from this IP
 *     security: []
 *
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User registration
 *     description: Register a new user account. Requires admin credentials or invitation.
 *     operationId: registerUser
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: dr_johnson
 *               email:
 *                 type: string
 *                 format: email
 *                 example: dr.johnson@hospital.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: SecurePass123!
 *               role:
 *                 type: string
 *                 enum: [doctor, nurse, admin, pharmacist]
 *                 example: doctor
 *               specialization:
 *                 type: string
 *                 example: Cardiology
 *             required: [username, email, password, role]
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many registration attempts (rate limited)
 *     security: []
 */

/**
 * @swagger
 * /api/csrf-token:
 *   get:
 *     tags:
 *       - Security
 *     summary: Get CSRF token
 *     description: Retrieve a CSRF token required for POST, PUT, and PATCH requests. This is a stateless endpoint and does not require authentication.
 *     operationId: getCSRFToken
 *     responses:
 *       200:
 *         description: CSRF token retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CSRFTokenResponse'
 *     security: []
 */

/**
 * @swagger
 * /api/medications/search:
 *   get:
 *     tags:
 *       - Medications
 *     summary: Search medications
 *     description: Search for medications by name, SNOMED code, or active ingredient. Returns matches from 239,357+ medication database with real-time search (< 200ms).
 *     operationId: searchMedications
 *     parameters:
 *       - name: q
 *         in: query
 *         required: true
 *         description: Search query (medication name, SNOMED code, or ingredient)
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         example: paracetamol
 *       - name: limit
 *         in: query
 *         description: Maximum number of results to return
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         example: 10
 *       - name: offset
 *         in: query
 *         description: Pagination offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MedicationSearchResponse'
 *       400:
 *         description: Invalid search query
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /api/medications/{id}:
 *   get:
 *     tags:
 *       - Medications
 *     summary: Get medication details
 *     description: Retrieve detailed information about a specific medication including contraindications, side effects, and dosing guidelines.
 *     operationId: getMedicationById
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Medication ID or SNOMED code
 *         schema:
 *           oneOf:
 *             - type: integer
 *             - type: string
 *         example: 1
 *     responses:
 *       200:
 *         description: Medication details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Medication'
 *       404:
 *         description: Medication not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *
 * /api/medications/frequently-prescribed:
 *   get:
 *     tags:
 *       - Medications
 *     summary: Get frequently prescribed medications for patient
 *     description: Retrieve the most frequently prescribed medications for a specific patient, helping doctors quickly select common treatments.
 *     operationId: getFrequentlyPrescribed
 *     parameters:
 *       - name: patient_id
 *         in: query
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: List of frequently prescribed medications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 medications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Medication'
 *                 count:
 *                   type: integer
 *       404:
 *         description: Patient not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/patients:
 *   get:
 *     tags:
 *       - Patients
 *     summary: List all patients
 *     description: Retrieve a paginated list of all patients with basic information.
 *     operationId: listPatients
 *     parameters:
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 20
 *       - name: offset
 *         in: query
 *         schema:
 *           type: integer
 *           default: 0
 *       - name: search
 *         in: query
 *         description: Search by patient name or MRN
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of patients
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 patients:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Patient'
 *                 total:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *
 *   post:
 *     tags:
 *       - Patients
 *     summary: Create new patient
 *     description: Create a new patient record in the system.
 *     operationId: createPatient
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               patient_mrn:
 *                 type: string
 *                 example: PAT-2024-001
 *               patient_name:
 *                 type: string
 *                 example: John Doe
 *               age:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 150
 *                 example: 35
 *               gender:
 *                 type: string
 *                 enum: [M, F, Other]
 *                 example: M
 *               weight_kg:
 *                 type: number
 *                 example: 75.5
 *               phone:
 *                 type: string
 *                 example: +91-9876543210
 *               email:
 *                 type: string
 *                 format: email
 *               address:
 *                 type: string
 *             required: [patient_mrn, patient_name, age, gender]
 *     responses:
 *       201:
 *         description: Patient created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
 *       400:
 *         description: Invalid input
 *       409:
 *         description: Patient MRN already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *
 * /api/patients/{id}:
 *   get:
 *     tags:
 *       - Patients
 *     summary: Get patient details
 *     description: Retrieve complete details for a specific patient including demographics, medical history, and active prescriptions.
 *     operationId: getPatientById
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Patient details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 patient:
 *                   $ref: '#/components/schemas/Patient'
 *                 prescriptions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Prescription'
 *                 allergies:
 *                   type: array
 *                   items:
 *                     type: string
 *       404:
 *         description: Patient not found
 *       401:
 *         description: Unauthorized
 *
 *   put:
 *     tags:
 *       - Patients
 *     summary: Update patient
 *     description: Update patient demographics and information.
 *     operationId: updatePatient
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               patient_name:
 *                 type: string
 *               weight_kg:
 *                 type: number
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Patient updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Patient'
 *       404:
 *         description: Patient not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

/**
 * @swagger
 * /api/prescriptions:
 *   get:
 *     tags:
 *       - Prescriptions
 *     summary: List prescriptions
 *     description: Get prescriptions for a specific patient or all patients based on user role.
 *     operationId: listPrescriptions
 *     parameters:
 *       - name: patient_id
 *         in: query
 *         description: Filter by patient ID
 *         schema:
 *           type: integer
 *       - name: status
 *         in: query
 *         description: Filter by prescription status
 *         schema:
 *           type: string
 *           enum: [active, inactive, completed, cancelled]
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of prescriptions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 prescriptions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Prescription'
 *                 total:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *
 *   post:
 *     tags:
 *       - Prescriptions
 *     summary: Create prescription
 *     description: Create a new prescription for a patient. Performs automatic dose validation and medication safety checks before saving.
 *     operationId: createPrescription
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               patient_id:
 *                 type: integer
 *                 example: 1
 *               medication_id:
 *                 type: integer
 *                 example: 1
 *               dosage_mg:
 *                 type: number
 *                 example: 500
 *               frequency:
 *                 type: string
 *                 enum: [Once daily, Twice daily, Thrice daily, Every 4 hours, Every 6 hours, Every 8 hours, As needed]
 *                 example: Twice daily
 *               duration_days:
 *                 type: integer
 *                 enum: [1, 3, 5, 7, 10, 14, 21, 30]
 *                 example: 7
 *               instructions:
 *                 type: string
 *                 example: Take with food
 *               is_scheduled:
 *                 type: boolean
 *                 default: false
 *             required: [patient_id, medication_id, dosage_mg, frequency, duration_days]
 *     responses:
 *       201:
 *         description: Prescription created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Prescription'
 *       400:
 *         description: Invalid prescription data or dose validation failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Dose validation failed
 *                 details:
 *                   $ref: '#/components/schemas/DoseValidationResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *
 * /api/prescriptions/{id}:
 *   get:
 *     tags:
 *       - Prescriptions
 *     summary: Get prescription details
 *     description: Retrieve complete details for a specific prescription.
 *     operationId: getPrescriptionById
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Prescription details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Prescription'
 *       404:
 *         description: Prescription not found
 *       401:
 *         description: Unauthorized
 *
 *   put:
 *     tags:
 *       - Prescriptions
 *     summary: Update prescription
 *     description: Update prescription details. Validates dose changes against medication safety limits.
 *     operationId: updatePrescription
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dosage_mg:
 *                 type: number
 *               frequency:
 *                 type: string
 *               duration_days:
 *                 type: integer
 *               instructions:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive, completed, cancelled]
 *     responses:
 *       200:
 *         description: Prescription updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Prescription'
 *       404:
 *         description: Prescription not found
 *       401:
 *         description: Unauthorized
 *
 *   delete:
 *     tags:
 *       - Prescriptions
 *     summary: Delete prescription
 *     description: Cancel or delete a prescription.
 *     operationId: deletePrescription
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Prescription deleted successfully
 *       404:
 *         description: Prescription not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/prescriptions/validate-dose:
 *   post:
 *     tags:
 *       - Prescriptions
 *     summary: Validate prescription dose
 *     description: Validate a prescription dose for safety before saving. Checks against maximum daily limits, pediatric restrictions, and drug interactions.
 *     operationId: validateDose
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               medication_id:
 *                 type: integer
 *               dosage_mg:
 *                 type: number
 *               frequency:
 *                 type: string
 *               duration_days:
 *                 type: integer
 *               patient_id:
 *                 type: integer
 *               concurrent_medications:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: IDs of other medications patient is taking
 *             required: [medication_id, dosage_mg, frequency, duration_days, patient_id]
 *     responses:
 *       200:
 *         description: Validation result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DoseValidationResponse'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/queue:
 *   get:
 *     tags:
 *       - Queue/Appointments
 *     summary: Get queue status
 *     description: Get the current queue status for a specific doctor or clinic. Includes waiting patients and estimated wait times.
 *     operationId: getQueueStatus
 *     parameters:
 *       - name: doctor_id
 *         in: query
 *         schema:
 *           type: integer
 *       - name: clinic_id
 *         in: query
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Queue status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 doctor_id:
 *                   type: integer
 *                 queue_entries:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/QueueEntry'
 *                 total_waiting:
 *                   type: integer
 *                 average_wait_time_minutes:
 *                   type: integer
 *       401:
 *         description: Unauthorized
 *
 *   post:
 *     tags:
 *       - Queue/Appointments
 *     summary: Add patient to queue
 *     description: Add a patient to the doctor's queue. Automatically calculates position and estimated wait time.
 *     operationId: addToQueue
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               patient_id:
 *                 type: integer
 *               doctor_id:
 *                 type: integer
 *               consultation_notes:
 *                 type: string
 *             required: [patient_id, doctor_id]
 *     responses:
 *       201:
 *         description: Patient added to queue
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QueueEntry'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *
 * /api/queue/{id}:
 *   patch:
 *     tags:
 *       - Queue/Appointments
 *     summary: Update queue status
 *     description: Update the status of a queue entry (e.g., in consultation, completed, no-show). Uses optimistic locking to prevent race conditions.
 *     operationId: updateQueueStatus
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [waiting, in_consultation, completed, cancelled, no_show]
 *               consultation_notes:
 *                 type: string
 *               version:
 *                 type: integer
 *                 description: Current version for optimistic locking
 *             required: [status]
 *     responses:
 *       200:
 *         description: Queue status updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/QueueEntry'
 *       404:
 *         description: Queue entry not found
 *       409:
 *         description: Conflict - version mismatch (concurrent update detected)
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/snomed:
 *   get:
 *     tags:
 *       - SNOMED CT
 *     summary: Search SNOMED CT codes
 *     description: Search SNOMED CT International and India Extension codes for diagnosis, procedures, findings, and other clinical concepts. Supports multiple India-specific extensions.
 *     operationId: searchSNOMEDCT
 *     parameters:
 *       - name: q
 *         in: query
 *         required: true
 *         description: Search query (description or code)
 *         schema:
 *           type: string
 *           minLength: 1
 *         example: fever
 *       - name: ecl
 *         in: query
 *         description: SNOMED CT Expression Constraint Language query
 *         schema:
 *           type: string
 *         example: "< 404684003"
 *       - name: extension
 *         in: query
 *         description: Filter by India extension
 *         schema:
 *           type: string
 *           enum: [international, covid, ayush, drug, geography, patient-instructions]
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: SNOMED CT search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       code:
 *                         type: string
 *                       term:
 *                         type: string
 *                       fully_specified_name:
 *                         type: string
 *       400:
 *         description: Invalid search query
 *       401:
 *         description: Unauthorized
 *
 * /api/snomed/{code}:
 *   get:
 *     tags:
 *       - SNOMED CT
 *     summary: Get SNOMED CT concept details
 *     description: Retrieve detailed information about a specific SNOMED CT concept including relationships, parent concepts, and clinical notes.
 *     operationId: getSNOMEDConcept
 *     parameters:
 *       - name: code
 *         in: path
 *         required: true
 *         description: SNOMED CT concept code
 *         schema:
 *           type: string
 *         example: "80891009"
 *     responses:
 *       200:
 *         description: SNOMED CT concept details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: string
 *                 term:
 *                   type: string
 *                 fully_specified_name:
 *                   type: string
 *                 parents:
 *                   type: array
 *                   items:
 *                     type: object
 *                 children:
 *                   type: array
 *                   items:
 *                     type: object
 *                 is_leaf:
 *                   type: boolean
 *       404:
 *         description: Concept not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/logs/error:
 *   post:
 *     tags:
 *       - Logging
 *     summary: Log client-side error
 *     description: Submit client-side errors from frontend for server-side logging and monitoring.
 *     operationId: logClientError
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               stack:
 *                 type: string
 *               level:
 *                 type: string
 *                 enum: [error, warn, info, debug]
 *               context:
 *                 type: object
 *               url:
 *                 type: string
 *               user_agent:
 *                 type: string
 *             required: [message, level]
 *     responses:
 *       201:
 *         description: Error logged successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Error logged successfully
 *                 log_id:
 *                   type: string
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */

module.exports = {};
