/**
 * Patient Module - Model
 * Represents the Patient entity
 * 
 * Documents:
 * - What fields a Patient has
 * - What methods operate on a Patient
 * - Validation rules
 * - Business logic specific to Patient entity
 */
class PatientModel {
  constructor(data) {
    this.id = data.id;
    this.patient_id = data.patient_id; // Unique public identifier
    this.name = data.name;
    this.email = data.email;
    this.phone = data.phone;
    this.blood_group = data.blood_group;
    this.date_of_birth = data.date_of_birth;
    this.gender = data.gender;
    this.city = data.city;
    this.state = data.state;
    this.address = data.address;
    this.emergency_contact_name = data.emergency_contact_name;
    this.emergency_contact_phone = data.emergency_contact_phone;
    this.primary_doctor_id = data.primary_doctor_id;
    this.clinic_id = data.clinic_id;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
    this.deleted_at = data.deleted_at;
    this.created_by = data.created_by;
    this.updated_by = data.updated_by;
  }

  /**
   * Check if patient data is valid
   */
  isValid() {
    return this.name && this.email && this.phone;
  }

  /**
   * Check if patient is deleted (soft delete)
   */
  isDeleted() {
    return !!this.deleted_at;
  }

  /**
   * Get patient age from date of birth
   */
  getAge() {
    if (!this.date_of_birth) return null;
    
    const today = new Date();
    const birthDate = new Date(this.date_of_birth);
    let age = today.getFullYear() - birthDate.getFullYear();
    
    const monthDifference = today.getMonth() - birthDate.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Get patient initials
   */
  getInitials() {
    return this.name
      ?.split(' ')
      .map(n => n[0]?.toUpperCase())
      .join('') || '';
  }

  /**
   * Format patient for display
   */
  toString() {
    return `${this.name} (${this.patient_id})`;
  }

  /**
   * Check if patient has contact information
   */
  hasCompleteInfo() {
    return this.name && this.email && this.phone && this.date_of_birth && this.blood_group;
  }

  /**
   * Get patient status
   */
  getStatus() {
    if (this.isDeleted()) return 'DELETED';
    return 'ACTIVE';
  }
}

module.exports = PatientModel;
