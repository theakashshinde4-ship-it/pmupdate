import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import EnhancedLogin from './pages/EnhancedLogin';
import UniversalOTPLogin from './pages/UniversalOTPLogin';
import DoctorOTPLogin from './pages/DoctorOTPLogin';
import Landing from './pages/Landing';
import BookAppointment from './pages/BookAppointment';
import { useAuth } from './hooks/useAuth';
import RequireRole from './components/RequireRole';
import EnhancedErrorBoundary from './components/EnhancedErrorBoundary';

// Lazy load all pages
const Queue = lazy(() => import('./pages/Queue'));
const Patients = lazy(() => import('./pages/Patients'));
const PrescriptionPad = lazy(() => import('./pages/PrescriptionPad'));
const Payments = lazy(() => import('./pages/Payments'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Abha = lazy(() => import('./pages/Abha'));
const WhatsNew = lazy(() => import('./pages/WhatsNew'));
const LabInvestigations = lazy(() => import('./pages/LabInvestigations'));
const PatientOverview = lazy(() => import('./pages/PatientOverview'));
const RxTemplateConfig = lazy(() => import('./pages/RxTemplateConfig'));
const PadConfiguration = lazy(() => import('./pages/PadConfiguration'));
const PrescriptionPreview = lazy(() => import('./pages/PrescriptionPreview'));
const Receipts = lazy(() => import('./pages/Receipts'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const AppointmentIntents = lazy(() => import('./pages/AppointmentIntents'));
const AuditLogs = lazy(() => import('./pages/AuditLogs'));
const ClinicManagement = lazy(() => import('./pages/ClinicManagement'));
const RoleManagement = lazy(() => import('./pages/RoleManagement'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const BackupRestore = lazy(() => import('./pages/BackupRestore'));
const DoctorExport = lazy(() => import('./pages/DoctorExport'));
const FamilyHistory = lazy(() => import('./pages/FamilyHistory'));
const PatientAllergies = lazy(() => import('./pages/PatientAllergies'));
const LabTemplates = lazy(() => import('./pages/LabTemplates'));
const Insurance = lazy(() => import('./pages/Insurance'));
const MedicalCertificates = lazy(() => import('./pages/MedicalCertificates'));
const ReceiptTemplates = lazy(() => import('./pages/ReceiptTemplates'));
const SymptomsTemplates = lazy(() => import('./pages/SymptomsTemplates'));
const DoctorSettings = lazy(() => import('./pages/DoctorSettings'));
const DoctorManagement = lazy(() => import('./pages/DoctorManagement'));

// New grouped pages
const Appointments = lazy(() => import('./pages/Appointments'));
const Billing = lazy(() => import('./pages/Billing'));
const Prescriptions = lazy(() => import('./pages/Prescriptions'));
const Clinical = lazy(() => import('./pages/Clinical'));
const Settings = lazy(() => import('./pages/Settings'));

// Doctor-first UI
const DoctorDashboard = lazy(() => import('./pages/DoctorDashboard'));
const StaffDashboard = lazy(() => import('./pages/StaffDashboard'));

// OPD Management Pages
const ReceptionDashboard = lazy(() => import('./pages/ReceptionDashboard'));
const DoctorConsultation = lazy(() => import('./pages/DoctorConsultation'));
const BillingDashboard = lazy(() => import('./pages/BillingDashboard'));
const PrintPrescription = lazy(() => import('./pages/PrintPrescription'));

// QR Code Booking
const QRCodeBooking = lazy(() => import('./pages/QRCodeBooking'));
const DoctorQRManagement = lazy(() => import('./pages/DoctorQRCode'));

function App() {
  const { token } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/enhanced-login" element={<EnhancedLogin />} />
      <Route path="/universal-otp-login" element={<UniversalOTPLogin />} />
      <Route path="/doctor-otp-login" element={<DoctorOTPLogin />} />
      <Route path="/book-appointment" element={<BookAppointment />} />
      <Route path="/qr/:doctorId" element={<QRCodeBooking />} />
      
      {/* Protected routes */}
      {token ? (
        <>
          <Route path="/doctor-dashboard" element={
            <MainLayout>
              <EnhancedErrorBoundary>
                <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                  <DoctorDashboard />
                </Suspense>
              </EnhancedErrorBoundary>
            </MainLayout>
          } />
          <Route path="/staff-dashboard" element={
            <MainLayout>
              <EnhancedErrorBoundary>
                <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                  <StaffDashboard />
                </Suspense>
              </EnhancedErrorBoundary>
            </MainLayout>
          } />
          <Route path="/queue" element={
            <MainLayout>
              <EnhancedErrorBoundary>
                <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                  <Queue />
                </Suspense>
              </EnhancedErrorBoundary>
            </MainLayout>
          } />
          <Route path="/patients" element={
            <MainLayout>
              <EnhancedErrorBoundary>
                <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                  <Patients />
                </Suspense>
              </EnhancedErrorBoundary>
            </MainLayout>
          } />
          <Route path="/appointments" element={
            <MainLayout>
              <EnhancedErrorBoundary>
                <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                  <Appointments />
                </Suspense>
              </EnhancedErrorBoundary>
            </MainLayout>
          } />
          <Route path="/orders" element={
            <MainLayout>
              <EnhancedErrorBoundary>
                <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                  <PrescriptionPad />
                </Suspense>
              </EnhancedErrorBoundary>
            </MainLayout>
          } />
          <Route path="/orders/:patientId" element={
            <MainLayout>
              <EnhancedErrorBoundary>
                <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                  <PrescriptionPad />
                </Suspense>
              </EnhancedErrorBoundary>
            </MainLayout>
          } />
          <Route path="/payments" element={
            <MainLayout>
              <EnhancedErrorBoundary>
                <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                  <Payments />
                </Suspense>
              </EnhancedErrorBoundary>
            </MainLayout>
          } />
          <Route path="/receipts" element={
            <MainLayout>
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                <Receipts />
              </Suspense>
            </MainLayout>
          } />
          <Route path="/prescription-preview" element={
            <MainLayout>
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                <PrescriptionPreview />
              </Suspense>
            </MainLayout>
          } />
          <Route path="/prescription-preview/:patientId" element={
            <MainLayout>
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                <PrescriptionPreview />
              </Suspense>
            </MainLayout>
          } />
          <Route
            path="/analytics"
            element={
              <MainLayout>
                <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                  <RequireRole allowed={['admin', 'doctor']}>
                    <Analytics />
                  </RequireRole>
                </Suspense>
              </MainLayout>
            }
          />
          <Route path="/abha" element={
            <MainLayout>
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                <Abha />
              </Suspense>
            </MainLayout>
          } />
          <Route path="/whats-new" element={
            <MainLayout>
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                <WhatsNew />
              </Suspense>
            </MainLayout>
          } />
          <Route path="/lab-investigations" element={
            <MainLayout>
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                <LabInvestigations />
              </Suspense>
            </MainLayout>
          } />
          <Route path="/patient-overview" element={
            <MainLayout>
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                <PatientOverview />
              </Suspense>
            </MainLayout>
          } />
          <Route path="/patient-overview/:id" element={
            <MainLayout>
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                <PatientOverview />
              </Suspense>
            </MainLayout>
          } />
          <Route path="/rx-template" element={
            <MainLayout>
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                <RxTemplateConfig />
              </Suspense>
            </MainLayout>
          } />
          <Route
            path="/pad-configuration"
            element={
              <MainLayout>
                <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                  <RequireRole allowed={['admin', 'doctor']}>
                    <PadConfiguration />
                  </RequireRole>
                </Suspense>
              </MainLayout>
            }
          />
          <Route path="/profile" element={
            <MainLayout>
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                <UserProfile />
              </Suspense>
            </MainLayout>
          } />
          <Route path="/appointment-intents" element={
            <MainLayout>
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                <AppointmentIntents />
              </Suspense>
            </MainLayout>
          } />
          <Route path="/audit-logs" element={
            <MainLayout>
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                <AuditLogs />
              </Suspense>
            </MainLayout>
          } />
          <Route path="/clinics" element={
            <MainLayout>
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                <ClinicManagement />
              </Suspense>
            </MainLayout>
          } />
          <Route path="/doctor-management" element={
            <MainLayout>
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                <RequireRole allowed={['admin']}>
                  <DoctorManagement />
                </RequireRole>
              </Suspense>
            </MainLayout>
          } />
          <Route path="/user-management" element={
            <MainLayout>
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                <UserManagement />
              </Suspense>
            </MainLayout>
          } />
          <Route path="/backup" element={
            <MainLayout>
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                <BackupRestore />
              </Suspense>
            </MainLayout>
          } />
          <Route path="/doctor-export" element={
            <MainLayout>
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                <DoctorExport />
              </Suspense>
            </MainLayout>
          } />
          <Route path="/family-history/:patientId" element={
            <MainLayout>
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                <FamilyHistory />
              </Suspense>
            </MainLayout>
          } />
          <Route path="/allergies/:patientId" element={
            <MainLayout>
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                <PatientAllergies />
              </Suspense>
            </MainLayout>
          } />
          <Route path="/lab-templates" element={
            <MainLayout>
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                <LabTemplates />
              </Suspense>
            </MainLayout>
          } />
          <Route path="/insurance/:patientId" element={
            <MainLayout>
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                <Insurance />
              </Suspense>
            </MainLayout>
          } />
          <Route path="/medical-certificates" element={
            <MainLayout>
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                <MedicalCertificates />
              </Suspense>
            </MainLayout>
          } />
          <Route path="/receipt-templates" element={
            <MainLayout>
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                <ReceiptTemplates />
              </Suspense>
            </MainLayout>
          } />
          <Route path="/symptoms-templates" element={
            <MainLayout>
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                <SymptomsTemplates />
              </Suspense>
            </MainLayout>
          } />
          <Route path="/doctor-settings" element={
            <MainLayout>
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                <RequireRole allowedRoles={['doctor']}>
                  <DoctorSettings />
                </RequireRole>
              </Suspense>
            </MainLayout>
          } />
          
          {/* OPD Management Routes */}
          <Route path="/reception-dashboard" element={
            <MainLayout>
              <EnhancedErrorBoundary>
                <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                  <ReceptionDashboard />
                </Suspense>
              </EnhancedErrorBoundary>
            </MainLayout>
          } />
          <Route path="/doctor-consultation/:visitId" element={
            <MainLayout>
              <EnhancedErrorBoundary>
                <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                  <DoctorConsultation />
                </Suspense>
              </EnhancedErrorBoundary>
            </MainLayout>
          } />
          <Route path="/billing-dashboard" element={
            <MainLayout>
              <EnhancedErrorBoundary>
                <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                  <BillingDashboard />
                </Suspense>
              </EnhancedErrorBoundary>
            </MainLayout>
          } />
          <Route path="/print-prescription/:prescriptionId" element={
            <PrintPrescription />
          } />
          <Route path="/doctor-qr-management" element={
            <MainLayout>
              <EnhancedErrorBoundary>
                <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                  <DoctorQRManagement />
                </Suspense>
              </EnhancedErrorBoundary>
            </MainLayout>
          } />
          
          {/* New grouped pages */}
          <Route path="/billing" element={
            <MainLayout>
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                <Billing />
              </Suspense>
            </MainLayout>
          } />
          <Route path="/prescriptions" element={
            <MainLayout>
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                <Prescriptions />
              </Suspense>
            </MainLayout>
          } />
          <Route path="/clinical" element={
            <MainLayout>
              <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                <Clinical />
              </Suspense>
            </MainLayout>
          } />
          <Route path="/settings" element={
            <MainLayout>
              <EnhancedErrorBoundary>
                <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="text-lg">Loading...</div></div>}>
                  <Settings />
                </Suspense>
              </EnhancedErrorBoundary>
            </MainLayout>
          } />
          <Route path="*" element={<Navigate to="/queue" replace />} />
        </>
      ) : (
        <Route path="*" element={<Navigate to="/" replace />} />
      )}
    </Routes>
  );
}

export default App;
