/**
 * User Roles and Permissions Enum
 */
const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  STAFF: 'staff',
  PATIENT: 'patient',
  RECEPTIONIST: 'receptionist'
};

const ROLE_PERMISSIONS = {
  super_admin: [
    'manage_users',
    'manage_clinics',
    'manage_doctors',
    'manage_permissions',
    'view_analytics',
    'manage_settings',
    'create_reports',
    'manage_backups',
    'manage_compliance'
  ],
  admin: [
    'manage_doctors',
    'manage_staff',
    'view_patients',
    'manage_appointments',
    'view_analytics',
    'create_reports',
    'manage_clinic_settings'
  ],
  doctor: [
    'view_own_patients',
    'create_prescription',
    'view_appointments',
    'manage_own_profile',
    'view_own_analytics'
  ],
  staff: [
    'manage_appointments',
    'manage_queue',
    'create_bills',
    'view_patients'
  ],
  receptionist: [
    'manage_appointments',
    'manage_queue',
    'view_patients',
    'create_patient'
  ],
  patient: [
    'view_own_records',
    'view_appointments',
    'download_prescriptions'
  ]
};

module.exports = {
  ROLES,
  ROLE_PERMISSIONS
};
