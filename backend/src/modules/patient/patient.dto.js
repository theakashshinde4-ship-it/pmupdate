/**
 * Patient Module - DTO (Data Transfer Object)
 * Transforms patient data between entity and response formats
 * 
 * Benefits:
 * - Prevents leaking sensitive data (passwords, internal notes, etc.)
 * - Decouples API contract from database schema
 * - Allows different response formats for different endpoints
 * - Single source of truth for response shape
 */
class PatientDTO {
  /**
   * Transform patient entity to API response
   */
  static toResponse(patient) {
    if (!patient) return null;

    return {
      id: patient.id,
      patient_id: patient.patient_id, // Unique public identifier
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      date_of_birth: patient.date_of_birth,
      gender: patient.gender,
      blood_group: patient.blood_group,
      city: patient.city,
      state: patient.state,
      address: patient.address,
      emergency_contact_name: patient.emergency_contact_name,
      emergency_contact_phone: patient.emergency_contact_phone,
      primary_doctor_id: patient.primary_doctor_id,
      clinic_id: patient.clinic_id,
      created_at: patient.created_at,
      updated_at: patient.updated_at
      // NEVER return:
      // - created_by
      // - updated_by
      // - deleted_at (soft deletes should be transparent)
      // - internal_notes
      // - medical_history (separate endpoint)
    };
  }

  /**
   * Transform multiple patients to list response
   */
  static toListResponse(patients) {
    if (!Array.isArray(patients)) return [];
    return patients.map(p => PatientDTO.toResponse(p));
  }

  /**
   * Transform request to database format
   */
  static toDatabase(patientData, options = {}) {
    return {
      name: patientData.name,
      email: patientData.email?.toLowerCase(),
      phone: patientData.phone?.replace(/\D/g, ''), // Remove non-digits
      blood_group: patientData.blood_group,
      date_of_birth: patientData.date_of_birth,
      gender: patientData.gender?.toLowerCase(),
      city: patientData.city?.trim(),
      state: patientData.state?.trim(),
      address: patientData.address?.trim(),
      emergency_contact_name: patientData.emergency_contact_name?.trim(),
      emergency_contact_phone: patientData.emergency_contact_phone?.replace(/\D/g, ''),
      ...(options.includeMetadata && {
        updated_at: new Date(),
        updated_by: options.userId
      })
    };
  }

  /**
   * Transform patient to minimal response (list view)
   */
  static toMinimalResponse(patient) {
    if (!patient) return null;

    return {
      id: patient.id,
      patient_id: patient.patient_id,
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      blood_group: patient.blood_group,
      created_at: patient.created_at
    };
  }

  /**
   * Transform patient to detailed response (detail view)
   */
  static toDetailedResponse(patient, additionalData = {}) {
    if (!patient) return null;

    return {
      ...PatientDTO.toResponse(patient),
      // Additional fields that are expensive to fetch
      ...(additionalData.appointments && {
        appointments_count: additionalData.appointments.length,
        latest_appointment: additionalData.appointments[0]
      }),
      ...(additionalData.prescriptions && {
        prescriptions_count: additionalData.prescriptions.length
      }),
      ...(additionalData.medical_history && {
        medical_history: additionalData.medical_history
      })
    };
  }

  /**
   * Validate patient object shape (runtime type checking)
   */
  static validate(patient) {
    const required = ['id', 'name', 'email', 'phone'];
    return required.every(field => field in patient);
  }
}

module.exports = PatientDTO;
