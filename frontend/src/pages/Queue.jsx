import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import HeaderBar from '../components/HeaderBar';
import { useApiClient } from '../api/client';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../context/AuthContext';
import AddPatientModal from '../components/AddPatientModal';
import { openWhatsApp } from '../utils/whatsapp';
import { getSelectedDoctorId, isAdmin } from '../utils/doctorUtils';

const summaryCards = [
  { key: 'today', label: 'Today (24h)', count: 0 },
  { key: 'followups', label: 'Follow ups', count: 0 },
  { key: 'completed', label: 'Completed', count: 0 },
  { key: 'upcoming', label: 'Upcoming', count: 0 },
  { key: 'others', label: 'Others', count: 0 }
];

export default function Queue() {
  const api = useApiClient();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  
  // State
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointments, setSelectedAppointments] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState(summaryCards);
  const [filters, setFilters] = useState({
    dateRange: '',
    visitType: '',
    tags: '',
    paymentStatus: '',
    status: '',
    isFollowUp: false,
    month: '',
    year: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('default');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [openMenuId, setOpenMenuId] = useState(null);
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickAbha, setQuickAbha] = useState('');
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInLoadingId, setCheckInLoadingId] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showQuickRegisterModal, setShowQuickRegisterModal] = useState(false);
  const [quickRegisterForm, setQuickRegisterForm] = useState({
    name: '',
    phone: '',
    consultation_fee: 500
  });
  const [showConfigure, setShowConfigure] = useState(false);
  const [quickSearchResults, setQuickSearchResults] = useState([]);
  const [quickSearchLoading, setQuickSearchLoading] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);

  // Safely resolve patient DB primary key from multiple possible fields
  const resolvePatientDbId = useCallback((apt) => {
    const candidate = apt?.patient_db_id || apt?.patient_table_id || apt?.patientId || apt?.patient_id || null;
    return candidate != null ? String(candidate) : null;
  }, []);

  // Fetch appointments from API
  const fetchAppointments = useCallback(async (extraParams = {}) => {
    setLoading(true);
    setError('');
    try {
      // Build query params
      const params = {
        _t: Date.now() // Cache buster
      };

      // If admin user and has selected a doctor, filter by that doctor's appointments
      if (isAdmin(user)) {
        const selectedDoctorId = getSelectedDoctorId();
        if (selectedDoctorId) {
          params.doctor_id = selectedDoctorId;
        }
      }

      // Fetch both appointments and queue entries
      const [appointmentsRes, queueRes] = await Promise.all([
        api.get('/api/appointments', { 
          params: { ...params, ...extraParams },
          headers: { 'Cache-Control': 'no-cache' }
        }),
        api.get('/api/queue/today', { // Fetch today's queue
          headers: { 'Cache-Control': 'no-cache' }
        }).catch(() => ({ data: [] })) // Queue API might fail, don't break the flow
      ]);
      
      const appointmentsData = appointmentsRes.data.data?.appointments || [];
      const queueData = queueRes.data || [];
      
      // Combine appointments and queue entries
      const combinedData = [];
      
      // Add appointments
      appointmentsData.forEach(apt => {
        combinedData.push({
          ...apt,
          source: 'appointment',
          in_queue: queueData.some(q => q.appointment_id === apt.id)
        });
      });
      
      // Add walk-in patients from queue (those without appointments)
      queueData.forEach(queueItem => {
        if (!queueItem.appointment_id) {
          // Use queue_id or id - whichever is available
          const queueId = queueItem.queue_id || queueItem.id;
          combinedData.push({
            ...queueItem,
            source: 'walkin',
            id: queueId,
            queue_id: queueId, // Store queue_id for reference
            patient_id: queueItem.patient_id,
            patient_name: queueItem.name || queueItem.patient_name, // Ensure patient_name is set
            uhid: queueItem.patient_id, // Use patient_id as uhid for search
            phone: queueItem.phone, // Ensure phone is available for search
            appointment_date: queueItem.check_in_time?.split('T')[0] || new Date().toISOString().split('T')[0],
            appointment_time: queueItem.check_in_time?.split('T')[1]?.substring(0, 5) || new Date().toTimeString().split(' ')[0].substring(0, 5),
            status: queueItem.status || 'waiting',
            reason_for_visit: 'Walk-in',
            in_queue: true
          });
        }
      });
      
      // Sort by check-in time and appointment time
      combinedData.sort((a, b) => {
        const timeA = a.check_in_time || `${a.appointment_date} ${a.appointment_time}`;
        const timeB = b.check_in_time || `${b.appointment_date} ${b.appointment_time}`;
        return new Date(timeA) - new Date(timeB);
      });
      
      setAppointments(combinedData);
      calculateStats(combinedData);
      // Reset selection when appointments change
      setSelectedAppointments([]);
      setSelectAll(false);
    } catch (err) {
      console.error('Fetch appointments error:', err);
      setError(err.response?.data?.error || 'Unable to load appointments');
    } finally {
      setLoading(false);
    }
  }, [api, filters, search, page, limit]);

  // Handle individual appointment selection
  const handleSelectAppointment = (appointmentId) => {
    console.log('Selecting appointment with ID:', appointmentId);
    
    if (!appointmentId) {
      console.warn('Attempted to select appointment with undefined ID');
      return;
    }
    
    setSelectedAppointments(prev => 
      prev.includes(appointmentId) 
        ? prev.filter(id => id !== appointmentId)
        : [...prev, appointmentId]
    );
  };

  // Handle select all appointments
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedAppointments([]);
    } else {
      console.log('All appointments data:', filteredAppointments);
      const validIds = filteredAppointments
        .map(apt => apt.id || apt.queue_id || apt.appointment_id) // Get best available ID
        .filter(id => id); // Only select entries with valid IDs
      console.log('Valid IDs to select:', validIds);
      setSelectedAppointments(validIds);
    }
    setSelectAll(!selectAll);
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedAppointments.length === 0) {
      addToast('No patients selected', 'warning');
      return;
    }

    if (!window.confirm(`Are you sure you want to remove ${selectedAppointments.length} patient(s) from the queue?`)) {
      return;
    }

    try {
      console.log('Attempting to remove patients:', selectedAppointments);
      
      // Delete all selected appointments/queue items
      const deletePromises = selectedAppointments.map(async (id) => {
        if (!id) {
          console.log('Skipping undefined ID');
          return null;
        }

        // Find the appointment by any of its IDs
        const appointment = filteredAppointments.find(a =>
          a.id === id || a.queue_id === id || a.appointment_id === id
        );
        console.log('Processing appointment:', appointment);

        if (appointment?.source === 'walkin' || appointment?.queue_id) {
          // For walk-in or queue entries, delete from queue
          const queueId = appointment?.queue_id || id;
          console.log('Deleting from queue:', queueId);
          const response = await api.delete(`/api/queue/${queueId}`);
          console.log('Queue delete response:', response);
          return response;
        } else {
          console.log('Deleting appointment:', id);
          const response = await api.delete(`/api/appointments/${id}`);
          console.log('Appointment delete response:', response);
          return response;
        }
      }).filter(Boolean); // Remove null promises
      
      if (deletePromises.length > 0) {
        const results = await Promise.all(deletePromises);
        console.log('All delete results:', results);
        addToast(`Successfully removed ${deletePromises.length} patient(s) from queue`, 'success');
        
        // Add a small delay before refreshing to ensure backend processes the deletion
        setTimeout(() => {
          fetchAppointments();
        }, 500);
      } else {
        addToast('No valid patients to remove', 'warning');
      }
      
      setSelectedAppointments([]);
      setSelectAll(false);
    } catch (error) {
      console.error('Failed to remove patients:', error);
      console.error('Error details:', error.response?.data || error.message);
      addToast(`Failed to remove patients: ${error.response?.data?.error || error.message}`, 'error');
    }
  };

  // Calculate statistics
  const calculateStats = useCallback((appointmentsData) => {
    const today = new Date().toISOString().split('T')[0];
    const newStats = summaryCards.map(card => ({ ...card, count: 0 }));

    appointmentsData.forEach(apt => {
      const aptDate = apt.appointment_date;
      const status = apt.status;

      // Today's appointments
      if (aptDate === today) {
        newStats[0].count++;
      }

      // Follow-ups
      if (apt.is_follow_up || apt.reason_for_visit?.toLowerCase().includes('follow')) {
        newStats[1].count++;
      }

      // Completed
      if (status === 'completed') {
        newStats[2].count++;
      }

      // Upcoming (future dates)
      if (aptDate > today && status !== 'completed' && status !== 'cancelled') {
        newStats[3].count++;
      }

      // Others (past dates, not completed)
      if (aptDate < today && status !== 'completed') {
        newStats[4].count++;
      }
    });

    setStats(newStats);
  }, []);

  // Update appointment status
  const updateAppointmentStatus = useCallback(async (appointmentId, newStatus, apt) => {
    // Determine the best ID to use
    const effectiveId = appointmentId || apt?.id || apt?.queue_id || apt?.appointment_id;

    // Guard against undefined appointment ID
    if (!effectiveId) {
      console.warn('Cannot update status: no valid ID found', apt);
      addToast('Cannot update status: Invalid appointment ID', 'error');
      return;
    }

    try {
      // For walk-in patients or queue entries, update queue status
      const isWalkIn = apt?.source === 'walkin' || (apt?.queue_id && !apt?.appointment_id);

      if (isWalkIn) {
        const queueId = apt?.queue_id || effectiveId;
        await api.patch(`/api/queue/${queueId}/status`, { status: newStatus });
      } else {
        // Try appointment update first
        try {
          await api.patch(`/api/appointments/${effectiveId}/status`, { status: newStatus });
        } catch (appointmentError) {
          // If appointment update fails (404/400), try queue update as fallback
          if (appointmentError.response?.status === 404 || appointmentError.response?.status === 400) {
            console.log('Appointment update failed, trying queue update...');
            // Try with queue_id if available, otherwise use the original ID
            const queueId = apt?.queue_id || effectiveId;
            await api.patch(`/api/queue/${queueId}/status`, { status: newStatus });
          } else {
            throw appointmentError;
          }
        }
      }

      setAppointments(prev => {
        const updated = prev.map(a =>
          (a.id === effectiveId || a.queue_id === effectiveId || a.appointment_id === effectiveId)
            ? { ...a, status: newStatus }
            : a
        );
        calculateStats(updated);
        return updated;
      });

      addToast(`Status updated to ${newStatus}`, 'success');

      // Auto-navigate to create receipt when appointment is completed
      if (newStatus === 'completed' && apt) {
        setTimeout(() => {
          const pid = resolvePatientDbId(apt);
          if (!pid) return;
          // Only include appointment ID if it's a valid appointment (not walk-in)
          const appointmentParam = apt.source !== 'walkin' && apt.id ? `&appointment=${apt.id}` : '';
          navigate(`/receipts?patient=${pid}${appointmentParam}&quick=true`);
        }, 1000); // Wait 1 second to show the success message
      }
    } catch (err) {
      console.error('Update status error:', err);
      addToast(err.response?.data?.error || 'Failed to update status', 'error');
    }
  }, [api, addToast, calculateStats, navigate]);

  // Update payment status
  const updatePaymentStatus = useCallback(async (appointmentId, newPaymentStatus) => {
    // Guard against undefined appointment ID
    if (!appointmentId) {
      console.warn('Cannot update payment status: appointment ID is undefined');
      addToast('Cannot update payment: No bill found. Please create a receipt first.', 'error');
      return;
    }

    try {
      // Prefer updating the bill directly if we have a bill_id for the appointment
      const apt = appointments.find(a => a.id === appointmentId) || {};
      if (apt.bill_id) {
        await api.patch(`/api/bills/${apt.bill_id}/status`, { payment_status: newPaymentStatus });
      } else {
        // Fallback to appointment endpoint which will try to find latest bill
        await api.patch(`/api/appointments/${appointmentId}/payment`, { payment_status: newPaymentStatus });
      }

      setAppointments(prev =>
        prev.map(a =>
          a.id === appointmentId ? { ...a, payment_status: newPaymentStatus } : a
        )
      );

      addToast(`Payment status updated to ${newPaymentStatus}`, 'success');
    } catch (err) {
      console.error('Update payment status error:', err);
      // Show user-friendly message for NO_BILL_FOUND
      if (err.response?.data?.code === 'NO_BILL_FOUND') {
        addToast('No receipt found. Please create a receipt first.', 'error');
      } else {
        addToast(err.response?.data?.error || 'Failed to update payment status', 'error');
      }
    }
  }, [api, addToast, appointments]);

  // Navigate to patient overview - FIXED to use patient_db_id
  const handleVisitPatient = useCallback((apt) => {
    // Prefer DB primary key id for navigation; fall back to available keys
    let patientDbId = apt.patient_db_id || apt.patient_table_id || apt.patientId || apt.patient_id || null;
    const uhid = apt.uhid || apt.patient_code || apt.patient_uhid || apt.patient_identifier || apt.patient_id;

    // Normalize to string for storage + navigation
    if (patientDbId && typeof patientDbId !== 'string') {
      patientDbId = String(patientDbId);
    }

    // If still missing, notify but avoid throwing; keep user in context
    if (!patientDbId) {
      addToast('Patient ID missing in appointment. Trying UHID link instead.', 'error');
      console.warn('Missing patient_db_id in appointment; keys:', {
        id: apt?.id,
        patient_db_id: apt?.patient_db_id,
        patient_table_id: apt?.patient_table_id,
        patientId: apt?.patientId,
        patient_id: apt?.patient_id,
        uhid: apt?.uhid
      });
      return;
    }

    // Store appointment context for prescription and other pages
    const appointmentContext = {
      appointmentId: apt.id,
      patientId: patientDbId,
      patientName: apt.patient_name,
      uhid: uhid,
      visitReason: apt.reason_for_visit,
      appointmentDate: apt.appointment_date,
      appointmentTime: apt.appointment_time,
      doctorId: apt.doctor_id,
      doctorName: apt.doctor_name,
      clinicId: apt.clinic_id,
      clinicName: apt.clinic_name,
      status: apt.status
    };

    sessionStorage.setItem('currentAppointment', JSON.stringify(appointmentContext));
    sessionStorage.setItem('selectedPatientId', patientDbId);

    // Navigate to patient overview
    navigate(`/patient-overview/${patientDbId}`);
  }, [navigate, addToast]);

  // Helper function to format date in Indian format
  const formatIndianDate = (dateString) => {
    if (!dateString) return 'TBD';

    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${dayName}, ${day} ${month} ${year}`;
  };

  // Helper function to format time in 12-hour format
  const formatIndianTime = (timeString) => {
    if (!timeString) return 'TBD';

    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;

    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Handle WhatsApp click
  const handleWhatsApp = useCallback((apt) => {
    const phone = apt.contact || apt.phone || apt.patient_phone;

    if (!phone) {
      addToast('Patient phone number not available', 'error');
      return;
    }

    const formattedDate = formatIndianDate(apt.appointment_date);
    const formattedTime = formatIndianTime(apt.appointment_time);

    const message = `Hello ${apt.patient_name},

Your appointment is confirmed.

📅 Date: ${formattedDate}
⏰ Time: ${formattedTime}
${apt.doctor_name ? `👨‍⚕️ Doctor: ${apt.doctor_name}` : ''}
${apt.clinic_name ? `🏥 Clinic: ${apt.clinic_name}` : ''}

Thank you!`;

    openWhatsApp(phone, message);
  }, [addToast]);

  // Quick walk-in check-in
  const handleQuickCheckIn = useCallback(async () => {
    if (!quickName || !quickPhone) {
      addToast('Please enter name and phone', 'error');
      return;
    }

    setCheckInLoading(true);
    try {
      let patientId = null;
      
      // 1) First search for existing patient by phone number
      try {
        const searchRes = await api.get(`/api/patients?search=${quickPhone}&limit=1`);
        const existingPatients = searchRes.data?.data?.patients || [];
        
        if (existingPatients.length > 0) {
          patientId = existingPatients[0].id;
          console.log('Found existing patient:', existingPatients[0].name);
        }
      } catch (searchError) {
        console.log('Patient search failed, will create new patient');
      }

      // 2) If patient not found, create new patient
      if (!patientId) {
        const createPayload = {
          name: quickName,
          phone: quickPhone,
          abha_number: quickAbha || null,
          gender: 'M', // Default gender
          clinic_id: 2
        };
        const createRes = await api.post('/api/patients', createPayload);
        patientId = createRes?.data?.id || createRes?.data?.patient?.id;

        if (!patientId) {
          throw new Error('Patient creation failed: missing ID');
        }
        console.log('Created new patient with ID:', patientId);
      }

      // 3) Add patient to queue
      await api.post('/api/queue', { 
        patient_id: patientId,
        doctor_id: user?.doctor_id || 2 // Use logged-in doctor's ID or default
      });

      addToast('Checked in successfully', 'success');
      setQuickName('');
      setQuickPhone('');
      setQuickAbha('');
      fetchAppointments();
    } catch (err) {
      console.error('Quick check-in error:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to check-in';
      addToast(msg, 'error');
    } finally {
      setCheckInLoading(false);
    }
  }, [quickName, quickPhone, quickAbha, api, addToast, fetchAppointments]);

  // Handle search result click - directly add to queue
  const handleSearchResultClick = useCallback(async (patient) => {
    try {
      setCheckInLoading(true);
      
      // Add patient directly to queue
      await api.post('/api/queue', { 
        patient_id: patient.id,
        doctor_id: user?.doctor_id || 2 // Use logged-in doctor's ID
      });

      addToast(`${patient.name} added to queue!`, 'success');
      setQuickName('');
      setQuickPhone('');
      setQuickSearchResults([]);
      fetchAppointments(); // Refresh queue
    } catch (error) {
      console.error('Queue addition error:', error);
      addToast('Failed to add to queue', 'error');
    } finally {
      setCheckInLoading(false);
    }
  }, [api, addToast, user, fetchAppointments]);

  // Real-time patient search for Quick Check-in
  const handleQuickSearch = useCallback(async (searchTerm, searchType) => {
    if (!searchTerm || searchTerm.length < 2) {
      setQuickSearchResults([]);
      return;
    }

    setQuickSearchLoading(true);
    try {
      console.log('🔍 Searching patients:', searchTerm);
      const searchRes = await api.get(`/api/patients?search=${searchTerm}&limit=5`);
      const patients = searchRes.data?.data?.patients || [];
      
      console.log('🔍 Search results:', patients.length, 'patients found');
      console.log('🔍 Patients data:', patients);
      setQuickSearchResults(patients);
    } catch (error) {
      console.log('🔍 Search failed:', error);
      setQuickSearchResults([]);
    } finally {
      setQuickSearchLoading(false);
    }
  }, [api]);

  // Handle input changes for real-time search
  const handleQuickNameChange = useCallback((e) => {
    const name = e.target.value;
    setQuickName(name);
    handleQuickSearch(name, 'name');
  }, [handleQuickSearch]);

  const handleQuickPhoneChange = useCallback((e) => {
    const phone = e.target.value;
    setQuickPhone(phone);
    handleQuickSearch(phone, 'phone');
  }, [handleQuickSearch]);

  // Check-in for an existing appointment
  const checkInForAppointment = useCallback(async (apt) => {
    if (!apt || !apt.id) return;
    setCheckInLoadingId(apt.id);
    try {
      // Prefer DB primary key fields provided by backend for queue insertion
      const candidateId = apt.patient_db_id || apt.patient_table_id || apt.patientId || apt.patient_id || null;

      // Validate that we have a numeric DB ID for queue.patient_id (FK to patients.id)
      const patientId = typeof candidateId === 'string' ? parseInt(candidateId, 10) : candidateId;
      if (!patientId || Number.isNaN(patientId)) {
        throw new Error('Patient ID not found for check-in');
      }

      await api.post('/api/queue', { appointment_id: apt.id, patient_id: patientId });
      addToast('Appointment checked in', 'success');
      fetchAppointments();
    } catch (err) {
      console.error('Appointment check-in error:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to check-in';
      addToast(msg, 'error');
    } finally {
      setCheckInLoadingId(null);
    }
  }, [api, addToast, fetchAppointments]);

  // Apply filters and search
  const applyFilters = useCallback(() => {
    let filtered = [...appointments];

    // Default filter: show today's appointments + yesterday's remaining (not completed) + today's offline
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // If month/year filter is set, apply that instead of default date filter
    if (filters.month && filters.year) {
      const filterMonth = parseInt(filters.month);
      const filterYear = parseInt(filters.year);
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate.getMonth() + 1 === filterMonth && aptDate.getFullYear() === filterYear;
      });
    }
    // Only apply default date filter if no specific date range, month/year, or status filter is set
    else if (!filters.dateRange && !filters.status) {
      filtered = filtered.filter(apt => {
        const aptDate = (apt.appointment_date || '').split('T')[0].split(' ')[0];
        const status = apt.status?.toLowerCase();

        // Today's appointments (all including completed)
        if (aptDate === today) return true;

        // Yesterday's remaining (not completed/cancelled)
        if (aptDate === yesterday && status !== 'completed' && status !== 'cancelled') return true;

        return false;
      });
    }
    // When status filter is "completed", show today's completed by default
    else if (filters.status === 'completed' && !filters.dateRange && !filters.month) {
      filtered = filtered.filter(apt => {
        const aptDate = (apt.appointment_date || '').split('T')[0].split(' ')[0];
        return aptDate === today && apt.status === 'completed';
      });
    }

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase().trim();
      filtered = filtered.filter(apt => {
        // Check multiple fields including queue-specific ones
        return apt.patient_name?.toLowerCase().includes(searchLower) ||
               String(apt.patient_id || '').toLowerCase().includes(searchLower) ||
               apt.uhid?.toLowerCase().includes(searchLower) ||
               apt.contact?.includes(search) ||
               apt.phone?.includes(search) ||
               apt.reason_for_visit?.toLowerCase().includes(searchLower) ||
               apt.doctor_name?.toLowerCase().includes(searchLower) ||
               apt.name?.toLowerCase().includes(searchLower) || // Queue items might have 'name' field
               apt.chief_complaint?.toLowerCase().includes(searchLower) || // Queue items have chief_complaint
               apt.email?.toLowerCase().includes(searchLower); // Queue items have email
      });
    }

    // Date range filter
    if (filters.dateRange) {
      if (filters.dateRange.includes(' to ')) {
        const [startDate, endDate] = filters.dateRange.split(' to ');
        if (startDate && endDate) {
          filtered = filtered.filter(apt => {
            const aptDate = apt.appointment_date;
            const aptDateStr = (aptDate instanceof Date ? aptDate.toISOString() : aptDate).split('T')[0].split(' ')[0];
            return aptDateStr >= startDate && aptDateStr <= endDate;
          });
        }
      } else {
        filtered = filtered.filter(apt => apt.appointment_date === filters.dateRange);
      }
    }

    // Visit type filter
    if (filters.visitType) {
      filtered = filtered.filter(apt =>
        apt.reason_for_visit?.toLowerCase().includes(filters.visitType.toLowerCase())
      );
    }

    // Tags filter
    if (filters.tags) {
      filtered = filtered.filter(apt =>
        apt.tags?.toLowerCase().includes(filters.tags.toLowerCase())
      );
    }

    // Payment status filter
    if (filters.paymentStatus) {
      filtered = filtered.filter(apt => apt.payment_status === filters.paymentStatus);
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(apt => apt.status === filters.status);
    }

    // Follow-up filter
    if (filters.isFollowUp) {
      filtered = filtered.filter(apt => apt.is_follow_up || apt.reason_for_visit?.toLowerCase().includes('follow'));
    }

    // Sort by VIP status first, then date and time
    filtered.sort((a, b) => {
      // VIP patients first (is_vip = 1 comes before 0)
      const vipCompare = (b.is_vip ? 1 : 0) - (a.is_vip ? 1 : 0);
      if (vipCompare !== 0) return vipCompare;
      
      // Then by appointment date (same day)
      const dateCompare = new Date(b.appointment_date) - new Date(a.appointment_date);
      if (dateCompare !== 0) return dateCompare;
      
      // If same date, sort by time (earlier time first)
      if (a.appointment_time && b.appointment_time) {
        return a.appointment_time.localeCompare(b.appointment_time);
      }
      return 0;
    });

    // Pagination
    const total = filtered.length;
    const pages = Math.ceil(total / limit) || 1;
    setPagination({ total, pages });

    const startIndex = (page - 1) * limit;
    const paginatedData = filtered.slice(startIndex, startIndex + limit);

    setFilteredAppointments(paginatedData);
  }, [appointments, search, filters, page, limit]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      dateRange: '',
      visitType: '',
      tags: '',
      paymentStatus: '',
      status: '',
      isFollowUp: false,
      month: '',
      year: ''
    });
    setSearch('');
    setPage(1);
    fetchAppointments(); // Refresh to get default view
  }, [fetchAppointments]);

  // Quick date filter handler
  const handleQuickDateFilter = useCallback((value) => {
    const today = new Date();
    let dateFilter = '';

    switch (value) {
      case 'today':
        dateFilter = today.toISOString().split('T')[0];
        break;
      case 'upcoming':
        // Next 7 days (excluding today)
        {
          const upcomingStart = new Date(today);
          upcomingStart.setDate(upcomingStart.getDate() + 1);
          const upcomingEnd = new Date(today);
          upcomingEnd.setDate(upcomingEnd.getDate() + 7);
          dateFilter = `${upcomingStart.toISOString().split('T')[0]} to ${upcomingEnd.toISOString().split('T')[0]}`;
        }
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        dateFilter = yesterday.toISOString().split('T')[0];
        break;
      case 'tomorrow':
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateFilter = tomorrow.toISOString().split('T')[0];
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFilter = `${weekAgo.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}`;
        break;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        dateFilter = `${monthAgo.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}`;
        break;
      default:
        dateFilter = '';
    }

    setFilters(prev => ({ ...prev, dateRange: dateFilter, status: '' }));
    setPage(1);

    // If the filter is a date range from -> to, also request matching appointments from server
    if (dateFilter.includes(' to ')) {
      const [start, end] = dateFilter.split(' to ');
      fetchAppointments({ start_date: start, end_date: end });
    } else if (dateFilter) {
      // single-date filter
      fetchAppointments({ date: dateFilter });
    } else {
      // no filter => default fetch
      fetchAppointments();
    }
  }, []);

  // Get status badge styling
  const getStatusBadgeClass = useCallback((status) => {
    const classes = {
      'scheduled': 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'no-show': 'bg-gray-100 text-gray-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }, []);

  // Get payment status badge styling
  const getPaymentBadgeClass = useCallback((status) => {
    const classes = {
      'completed': 'bg-green-100 text-green-800',
      'paid': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'failed': 'bg-red-100 text-red-800',
      'refunded': 'bg-purple-100 text-purple-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }, []);

  // Format date for display
  const formatDate = useCallback((dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }, []);

  // Format time for display
  const formatTime = useCallback((timeString) => {
    if (!timeString) return '-';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }, []);

  // Calculate pending amount
  const getPendingAmount = (apt) => {
    if (apt.amount_due != null) return parseFloat(apt.amount_due) || 0;
    const totalAmount = parseFloat(apt.total_amount ?? apt.bill_total ?? 0);
    const paidAmount = parseFloat(apt.amount_paid ?? apt.amount ?? 0);
    return Math.max(0, totalAmount - paidAmount);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const handlePatientAdded = useCallback(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Quick Register Handler for Staff
  const handleQuickRegister = useCallback(async () => {
    if (!quickRegisterForm.name || !quickRegisterForm.phone) {
      addToast('Name and phone are required', 'error');
      return;
    }

    setLoading(true);
    try {
      // First create the patient
      const patientResponse = await api.post('/api/patients', {
        patient_id: `P${Date.now()}${Math.floor(Math.random() * 1000)}`,
        name: quickRegisterForm.name,
        phone: quickRegisterForm.phone,
        gender: 'U', // Unknown by default
        clinic_id: user?.clinic_id || 2, // Required field
        registered_date: new Date().toISOString().split('T')[0]
      });

      const patient = patientResponse.data.patient || patientResponse.data;

      // Then create an appointment for walk-in
      const appointmentResponse = await api.post('/api/appointments', {
        patient_id: patient.id,
        doctor_id: user?.role === 'doctor' ? user.id : null, // If staff, assign to available doctor or null
        clinic_id: user?.clinic_id || 2,
        appointment_date: new Date().toISOString().split('T')[0],
        appointment_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
        arrival_type: 'walk-in',
        consultation_type: 'new',
        appointment_type: 'offline',
        status: 'scheduled',
        consultation_fee: quickRegisterForm.consultation_fee,
        payment_status: 'pending',
        amount_paid: 0
      });

      // Create bill for consultation fee
      await api.post('/api/bills', {
        patient_id: patient.id,
        appointment_id: appointmentResponse.data.id,
        total_amount: quickRegisterForm.consultation_fee,
        amount_paid: 0,
        payment_status: 'pending',
        payment_method: 'cash',
        service_name: 'Consultation',
        bill_date: new Date().toISOString().split('T')[0]
      });

      addToast('Patient registered successfully with consultation fee', 'success');
      setShowQuickRegisterModal(false);
      setQuickRegisterForm({ name: '', phone: '', consultation_fee: 500 });
      fetchAppointments(); // Refresh the queue
    } catch (error) {
      console.error('Quick register error:', error);
      addToast(error.response?.data?.error || 'Failed to register patient', 'error');
    } finally {
      setLoading(false);
    }
  }, [api, addToast, quickRegisterForm, user, fetchAppointments]);

  // Effects
  useEffect(() => {
    fetchAppointments();
  }, []); // Remove fetchAppointments dependency to prevent infinite loop

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId !== null) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  useEffect(() => {
    applyFilters();
  }, [appointments, search, filters, page, limit]); // Use actual dependencies instead of applyFilters

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, filters]);

  return (
    <div className="space-y-4">
      <HeaderBar title="Queue" />

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">📱 Share Appointment Link</h3>
              <button 
                type="button"
                onClick={() => setShowQRModal(false)} 
                className="text-gray-400 hover:text-gray-600 text-2xl transition active:scale-[0.98]"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4 text-center">
              {(() => {
                // Direct link to booking page with doctor param
                const doctorId = user?.id || 1;
                const link = `${window.location.origin}/book-appointment?doctor=${doctorId}`;
                const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(link)}`;
                return (
                  <>
                    <p className="text-sm text-gray-600 mb-4">Patients can scan this QR code to book an appointment</p>
                    <img src={qrSrc} alt="Booking QR" className="mx-auto border rounded-lg" />
                    <p className="text-xs text-gray-500 break-all mt-3">{link}</p>
                    <div className="grid grid-cols-3 gap-2 pt-4">
                      <button
                        type="button"
                        onClick={async () => { 
                          await navigator.clipboard.writeText(link); 
                          addToast('Link copied!', 'success'); 
                        }}
                        className="px-3 py-2 text-sm border rounded-lg hover:bg-blue-50 font-medium flex flex-col items-center gap-1 transition active:scale-[0.98]"
                      >
                        <span className="text-lg">📋</span>
                        Copy
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const msg = `Book your appointment using this link: ${link}`;
                          const wa = `https://wa.me/?text=${encodeURIComponent(msg)}`;
                          window.open(wa, '_blank');
                        }}
                        className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex flex-col items-center gap-1 transition active:scale-[0.98]"
                      >
                        <span className="text-lg">💬</span>
                        Share
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const canvas = document.querySelector('img[alt="Booking QR"]');
                          if (canvas) {
                            const link = document.createElement('a');
                            link.href = canvas.src;
                            link.download = 'appointment_qr.png';
                            link.click();
                            addToast('QR code downloaded!', 'success');
                          }
                        }}
                        className="px-3 py-2 text-sm border rounded-lg hover:bg-purple-50 font-medium flex flex-col items-center gap-1 transition active:scale-[0.98]"
                      >
                        <span className="text-lg">⬇️</span>
                        Download
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {stats.map((card) => (
          <div 
            key={card.key} 
            className={`p-3 bg-white rounded shadow-sm border relative group cursor-pointer hover:shadow-md transition ${
              filters.status === card.key ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => {
              if (card.key === 'today') {
                handleQuickDateFilter('today');
              } else if (card.key === 'completed') {
                // Show today's completed appointments
                const today = new Date().toISOString().split('T')[0];
                setFilters(prev => ({ ...prev, status: 'completed', isFollowUp: false, month: '', year: '', dateRange: '' }));
                fetchAppointments({ date: today, status: 'completed' });
                setPage(1);
              } else if (card.key === 'upcoming') {
                handleQuickDateFilter('upcoming');
              } else if (card.key === 'followups') {
                // Set follow-up filter
                setFilters(prev => ({ ...prev, isFollowUp: true, status: '' }));
                setPage(1);
              } else if (card.key === 'others') {
                // Show past incomplete appointments
                setFilters(prev => ({ ...prev, status: '', isFollowUp: false }));
                const today = new Date();
                const monthAgo = new Date(today);
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                fetchAppointments({ start_date: monthAgo.toISOString().split('T')[0], end_date: today.toISOString().split('T')[0] });
                setPage(1);
              }
            }}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">{card.label}</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fetchAppointments();
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded transition active:scale-[0.98]"
                title="Refresh"
              >
                <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <p className="text-2xl font-semibold mt-1">{card.count}</p>
          </div>
        ))}
      </section>

      {/* Main Content */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Queue Table */}
        <div className="lg:col-span-3 bg-white rounded shadow-sm border p-4">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold">Active Queue</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2 text-sm border rounded hover:bg-slate-50 flex items-center gap-1 transition active:scale-[0.98] ${
                  showFilters ? 'bg-slate-100' : ''
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
                {Object.values(filters).some(f => f) && (
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                )}
              </button>
              
              <button
                type="button"
                onClick={fetchAppointments}
                disabled={loading}
                className="px-3 py-2 text-sm border rounded hover:bg-slate-50 flex items-center gap-1 disabled:opacity-50 transition active:scale-[0.98]"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              
              <button
                type="button"
                onClick={() => setShowAddPatientModal(true)}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1 transition active:scale-[0.98]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Patient
              </button>

              <button
                type="button"
                onClick={() => {
                  setFilters(prev => ({
                    ...prev,
                    payment_status: 'pending',
                    status: ''
                  }));
                  setPage(1);
                }}
                className="px-3 py-2 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 flex items-center gap-1 transition active:scale-[0.98]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                Payment Pending
              </button>
              
              <button
                type="button"
                onClick={() => {
                  const newMode = viewMode === 'default' ? 'compact' : 'default';
                  setViewMode(newMode);
                  addToast(`Switched to ${newMode} view`, 'info');
                }}
                className="px-3 py-2 text-sm border rounded hover:bg-slate-50 flex items-center gap-1 transition active:scale-[0.98]"
              >
                {viewMode === 'default' ? ' Compact' : ' Table'}
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mb-4 p-4 bg-slate-50 rounded-lg space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Date</label>
                  <input
                    id="filter-date"
                    name="filter-date"
                    type="date"
                    value={filters.dateRange.includes(' to ') ? '' : filters.dateRange}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFilters(prev => ({ 
                        ...prev, 
                        dateRange: value 
                      }));
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Select date"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Quick Filter</label>
                  <select
                    id="filter-quick"
                    name="filter-quick"
                    value=""
                    onChange={(e) => handleQuickDateFilter(e.target.value)}
                    className="w-full px-3 py-2 border rounded text-sm"
                  >
                    <option value="">Select...</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="tomorrow">Tomorrow</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Visit Type</label>
                  <input
                    id="filter-visit-type"
                    name="filter-visit-type"
                    type="text"
                    placeholder="e.g., Follow-up"
                    value={filters.visitType}
                    onChange={(e) => setFilters(prev => ({ ...prev, visitType: e.target.value }))}
                    className="w-full px-3 py-2 border rounded text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Status</label>
                  <select
                    id="filter-status"
                    name="filter-status"
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border rounded text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no-show">No Show</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Payment</label>
                  <select
                    id="filter-payment"
                    name="filter-payment"
                    value={filters.paymentStatus}
                    onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
                    className="w-full px-3 py-2 border rounded text-sm"
                  >
                    <option value="">All Payments</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Tags</label>
                  <input
                    id="filter-tags"
                    name="filter-tags"
                    type="text"
                    placeholder="Search tags..."
                    value={filters.tags}
                    onChange={(e) => setFilters(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-3 py-2 border rounded text-sm"
                  />
                </div>
              </div>

              {/* Month/Year Filter for Historical Data */}
              <div className="border-t pt-4 mt-2">
                <label className="block text-xs text-slate-500 mb-2 font-medium">View Past Appointments</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Month</label>
                    <select
                      id="filter-month"
                      name="filter-month"
                      value={filters.month}
                      onChange={(e) => {
                        const month = e.target.value;
                        const year = filters.year || new Date().getFullYear().toString();
                        setFilters(prev => ({ ...prev, month, year, dateRange: '' }));
                        if (month && year) {
                          // Fetch appointments for selected month/year
                          const startDate = `${year}-${month.padStart(2, '0')}-01`;
                          const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
                          const endDate = `${year}-${month.padStart(2, '0')}-${lastDay}`;
                          fetchAppointments({ start_date: startDate, end_date: endDate });
                        }
                        setPage(1);
                      }}
                      className="w-full px-3 py-2 border rounded text-sm"
                    >
                      <option value="">Select Month</option>
                      <option value="1">January</option>
                      <option value="2">February</option>
                      <option value="3">March</option>
                      <option value="4">April</option>
                      <option value="5">May</option>
                      <option value="6">June</option>
                      <option value="7">July</option>
                      <option value="8">August</option>
                      <option value="9">September</option>
                      <option value="10">October</option>
                      <option value="11">November</option>
                      <option value="12">December</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Year</label>
                    <select
                      id="filter-year"
                      name="filter-year"
                      value={filters.year}
                      onChange={(e) => {
                        const year = e.target.value;
                        const month = filters.month || (new Date().getMonth() + 1).toString();
                        setFilters(prev => ({ ...prev, year, month, dateRange: '' }));
                        if (month && year) {
                          const startDate = `${year}-${month.padStart(2, '0')}-01`;
                          const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
                          const endDate = `${year}-${month.padStart(2, '0')}-${lastDay}`;
                          fetchAppointments({ start_date: startDate, end_date: endDate });
                        }
                        setPage(1);
                      }}
                      className="w-full px-3 py-2 border rounded text-sm"
                    >
                      <option value="">Select Year</option>
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return <option key={year} value={year}>{year}</option>;
                      })}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        if (filters.month && filters.year) {
                          const startDate = `${filters.year}-${filters.month.padStart(2, '0')}-01`;
                          const lastDay = new Date(parseInt(filters.year), parseInt(filters.month), 0).getDate();
                          const endDate = `${filters.year}-${filters.month.padStart(2, '0')}-${lastDay}`;
                          fetchAppointments({ start_date: startDate, end_date: endDate });
                        }
                      }}
                      disabled={!filters.month || !filters.year}
                      className="w-full px-3 py-2 text-sm bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Apply
                    </button>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setFilters(prev => ({ ...prev, month: '', year: '' }));
                        fetchAppointments();
                      }}
                      className="w-full px-3 py-2 text-sm border rounded hover:bg-slate-50 transition"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 text-sm border rounded hover:bg-white transition"
                >
                  Clear All Filters
                </button>
                {filters.dateRange && (
                  <span className="text-xs text-slate-500">
                    Showing: {filters.dateRange}
                  </span>
                )}
                {filters.month && filters.year && (
                  <span className="text-xs text-slate-500">
                    Showing: {['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][parseInt(filters.month)]} {filters.year}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                id="queue-search"
                name="queue-search"
                type="text"
                placeholder="Search by patient name, UHID, phone, doctor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedAppointments.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex items-center justify-between">
              <span className="text-sm text-blue-800">
                {selectedAppointments.length} patient{selectedAppointments.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
                >
                  Remove Selected
                </button>
                <button
                  onClick={() => {
                    setSelectedAppointments([]);
                    setSelectAll(false);
                  }}
                  className="px-3 py-1 bg-slate-600 text-white text-sm rounded hover:bg-slate-700 transition"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {/* Default Table View */}
          {viewMode === 'default' && (
            <div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 min-w-[1200px] bg-gradient-to-r from-slate-50 to-slate-100 text-xs font-semibold text-slate-700 px-4 py-4 border-b border-slate-200">
                    <div className="col-span-1 flex items-center">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="rounded border-slate-300"
                      />
                    </div>
                    <span className="col-span-3 flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2a3 3 0 00-5.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2a3 3 0 00-5.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      PATIENT
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      UHID
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      DOCTOR
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      DATE
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      TIME
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h2m2 10a2 2 0 002-2m2-2V7m0 10a2 2 0 002-2M7 7h10" />
                      </svg>
                      PAYMENT
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      STATUS
                    </span>
                    <span className="col-span-2 text-center flex items-center justify-center gap-1">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c-.94 1.543-.826 3.31 2.37 2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      ACTIONS
                    </span>
                  </div>
                  
                  {/* Loading State */}
                  {loading && (
                    <div className="p-8 text-center">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
                      <p className="text-sm text-slate-500">Loading appointments...</p>
                    </div>
                  )}
                  
                  {/* Error State */}
                  {error && !loading && (
                    <div className="p-6 text-center bg-red-50">
                      <svg className="w-12 h-12 text-red-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-red-600 font-medium">{error}</p>
                      <button 
                        onClick={fetchAppointments}
                        className="mt-3 text-sm text-red-600 underline hover:no-underline"
                      >
                        Try again
                      </button>
                    </div>
                  )}
                  
                  {/* Table Body */}
                  {!loading && !error && (
                    <div className="divide-y">
                      {filteredAppointments.length === 0 ? (
                        <div className="p-8 text-center">
                          <svg className="w-16 h-16 text-slate-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-slate-500 font-medium">No appointments found</p>
                          <p className="text-sm text-slate-400 mt-1">
                            {search || Object.values(filters).some(f => f) 
                              ? 'Try adjusting your search or filters' 
                              : 'No appointments scheduled yet'}
                          </p>
                        </div>
                      ) : (
                        filteredAppointments.map((apt) => (
                          <div 
                            key={`${apt.source}-${apt.id}-${apt.patient_id}`} 
                            className={`grid grid-cols-12 min-w-[1200px] items-center px-4 py-3 text-sm hover:bg-slate-50 transition ${
                              apt.status === 'completed' ? 'bg-green-50/50' : ''
                            } ${apt.status === 'cancelled' ? 'bg-red-50/50 opacity-75' : ''}`}
                          >
                            {/* Checkbox */}
                            <div className="col-span-1 flex items-center">
                              {(() => {
                                // Get the best available ID for this entry
                                const entryId = apt.id || apt.queue_id || apt.appointment_id;
                                return (
                                  <input
                                    type="checkbox"
                                    checked={selectedAppointments.includes(entryId)}
                                    onChange={() => {
                                      console.log('Checkbox clicked for:', apt);
                                      console.log('Using ID:', entryId);
                                      if (entryId) {
                                        handleSelectAppointment(entryId);
                                      } else {
                                        console.warn('No valid ID found for entry');
                                      }
                                    }}
                                    disabled={!entryId}
                                    className="rounded border-slate-300 disabled:opacity-50"
                                  />
                                );
                              })()}
                            </div>
                            
                            {/* Patient Info */}
                            <div className="col-span-3 flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                                {apt.patient_name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1">
                                  <p className="font-medium truncate">{apt.patient_name || 'Unknown'}</p>
                                  {apt.is_vip && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] bg-yellow-100 text-yellow-800 rounded font-semibold whitespace-nowrap flex-shrink-0" title={apt.vip_tier ? `VIP - ${apt.vip_tier}` : 'VIP'}>
                                      👑 VIP{apt.vip_tier ? ` (${apt.vip_tier})` : ''}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 mt-0.5">
                                  {apt.status === 'completed' && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] bg-green-600 text-white rounded">
                                      ✓
                                    </span>
                                  )}
                                  {apt.is_follow_up && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] bg-orange-100 text-orange-700 rounded">
                                      Follow-up
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 truncate">{apt.contact || apt.phone || '-'}</p>
                              </div>
                            </div>
                            
                                                        
                            {/* UHID */}
                            <span className="text-xs font-mono text-slate-600 truncate pr-4" title={apt.uhid || apt.patient_id || '-'}>
                              {apt.uhid || apt.patient_id || '-'}
                            </span>

                            {/* Doctor & Clinic */}
                            <div className="text-xs truncate pr-4" title={`${apt.doctor_name || '-'}${apt.clinic_name ? ' • ' + apt.clinic_name : ''}`}>
                              <div className="font-medium">{apt.doctor_name || '-'}</div>
                              {apt.clinic_name && <div className="text-slate-500">{apt.clinic_name}</div>}
                            </div>
                            
                            {/* Date */}
                            <span className="text-xs">
                              {formatDate(apt.appointment_date)}
                            </span>
                            
                            {/* Time */}
                            <span className="text-xs">
                              {formatTime(apt.appointment_time)}
                            </span>
                            
                            {/* Payment Status Dropdown + Pending Amount */}
                            <div className="space-y-1">
                              <select
                                name={`payment-status-${apt.id}`}
                                className={`px-2 py-1 text-xs border rounded cursor-pointer ${getPaymentBadgeClass(apt.payment_status)}`}
                                value={apt.payment_status || 'pending'}
                                onChange={(e) => updatePaymentStatus(apt.id, e.target.value)}
                              >
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="partial">Partial</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                              {apt.payment_status !== 'paid' && Number(getPendingAmount(apt)) > 0 && (
                                <div className="text-[11px] font-semibold text-red-700 bg-red-100 inline-flex px-1.5 py-0.5 rounded">
                                  Pending {formatCurrency(getPendingAmount(apt))}
                                </div>
                              )}
                            </div>
                            
                            {/* Status Dropdown */}
                            <div>
                              <select
                                name={`apt-status-${apt.id}`}
                                className={`px-2 py-1 text-xs border rounded cursor-pointer ${getStatusBadgeClass(apt.status)}`}
                                value={apt.status || 'scheduled'}
                                onChange={(e) => updateAppointmentStatus(apt.id, e.target.value, apt)}
                              >
                                <option value="scheduled">Scheduled</option>
                                <option value="in-progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="no-show">No Show</option>
                              </select>
                            </div>
                            
                            {/* Actions */}
                            <div className="col-span-2 flex items-center justify-center gap-2">
                              {/* WhatsApp Button */}
                              <button
                                onClick={() => handleWhatsApp(apt)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                title="Send WhatsApp message"
                              >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                </svg>
                              </button>
                              
                              {/* Check-in Button */}
                              <button
                                onClick={() => checkInForAppointment(apt)}
                                disabled={checkInLoadingId === apt.id}
                                className="p-2 text-primary hover:bg-primary/10 rounded-lg transition"
                                title="Check-in"
                              >
                                {checkInLoadingId === apt.id ? (
                                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M9 12l2 2 4-4" />
                                  </svg>
                                )}
                              </button>

                              {/* Visit Button - Only for Doctors */}
                            {user?.role === 'doctor' && (
                              <button
                                onClick={() => handleVisitPatient(apt)}
                                className="px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium"
                              >
                                Visit
                              </button>
                            )}
                              
                              {/* More Options */}
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(openMenuId === apt.id ? null : apt.id);
                                  }}
                                  className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                  </svg>
                                </button>
                                {openMenuId === apt.id && (
                                  <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-50"
                                  >
                                    <button
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        {
                                          const pid = resolvePatientDbId(apt);
                                          if (!pid) return;
                                          navigate(`/patient-overview/${pid}`);
                                        }
                                      }}
                                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 rounded-t-lg transition-colors border-b border-slate-100"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                      <span className="font-medium">View Patient</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        // Store appointment context for prescription page
                                        {
                                          const pid = resolvePatientDbId(apt);
                                          if (!pid) return;
                                          sessionStorage.setItem('currentAppointment', JSON.stringify({
                                            appointmentId: apt.id,
                                            patientId: pid,
                                            patientName: apt.patient_name
                                          }));
                                          navigate(`/orders/${pid}`);
                                        }
                                      }}
                                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-green-50 hover:text-green-700 flex items-center gap-3 transition-colors border-b border-slate-100"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      <span className="font-medium">New Prescription</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        {
                                          const pid = resolvePatientDbId(apt);
                                          if (!pid) return;
                                          navigate(`/receipts?patient=${pid}&appointment=${apt.id}&quick=true&amount=0`);
                                        }
                                      }}
                                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-purple-50 hover:text-purple-700 flex items-center gap-3 rounded-b-lg transition-colors"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                      </svg>
                                      <span className="font-medium">Create Bill</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Pagination */}
              {pagination.total > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-4 border-t">
                  <div className="text-sm text-slate-600">
                    Showing{' '}
                    <span className="font-semibold">{Math.min((page - 1) * limit + 1, pagination.total)}</span>
                    {' '}to{' '}
                    <span className="font-semibold">{Math.min(page * limit, pagination.total)}</span>
                    {' '}of{' '}
                    <span className="font-semibold">{pagination.total}</span> appointments
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                      className="p-2 border rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="First page"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-2 text-sm border rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    {/* Page Numbers */}
                    <div className="hidden sm:flex gap-1">
                      {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                        let pageNum;
                        if (pagination.pages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= pagination.pages - 2) {
                          pageNum = pagination.pages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`w-8 h-8 text-sm rounded ${
                              page === pageNum 
                                ? 'bg-primary text-white' 
                                : 'border hover:bg-slate-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <span className="sm:hidden text-sm">
                      {page} / {pagination.pages}
                    </span>
                    
                    <button
                      onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                      disabled={page >= pagination.pages}
                      className="px-3 py-2 text-sm border rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                    
                    <button
                      onClick={() => setPage(pagination.pages)}
                      disabled={page >= pagination.pages}
                      className="p-2 border rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Last page"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Compact Card View */}
          {viewMode === 'compact' && (
            <div className="space-y-3">
              {loading && (
                <div className="p-8 text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-sm text-slate-500 mt-3">Loading...</p>
                </div>
              )}
              
              {error && !loading && (
                <div className="p-6 text-center bg-red-50 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                  <button onClick={fetchAppointments} className="mt-2 text-sm underline">Retry</button>
                </div>
              )}
              
              {!loading && !error && (
                <>
                  {filteredAppointments.length === 0 ? (
                    <div className="p-8 text-center border-2 border-dashed rounded-lg">
                      <p className="text-slate-500">No appointments found</p>
                    </div>
                  ) : (
                    filteredAppointments.map((apt) => (
                      <div 
                        key={apt.id} 
                        className={`border rounded-lg p-4 hover:shadow-md transition ${
                          apt.status === 'completed' ? 'bg-green-50 border-green-200' : 
                          apt.status === 'cancelled' ? 'bg-red-50 border-red-200 opacity-75' : 
                          'bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {/* Patient Header */}
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-medium text-lg flex-shrink-0">
                                {apt.patient_name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold text-base">{apt.patient_name}</p>
                                  {apt.is_vip && (
                                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full font-semibold" title={apt.vip_tier ? `VIP - ${apt.vip_tier}` : 'VIP'}>
                                      👑 VIP{apt.vip_tier ? ` (${apt.vip_tier})` : ''}
                                    </span>
                                  )}
                                  {apt.status === 'completed' && (
                                    <span className="px-2 py-0.5 text-xs bg-green-600 text-white rounded-full">
                                      ✓ Completed
                                    </span>
                                  )}
                                  {apt.is_follow_up && (
                                    <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded">
                                      Follow-up
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-slate-500">
                                  {apt.uhid || apt.patient_id} • {formatDate(apt.appointment_date)} {formatTime(apt.appointment_time)}
                                </p>
                              </div>
                            </div>
                            
                            {/* Details Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                                            <div>
                                <span className="text-slate-500 text-xs block">Contact</span>
                                <p className="font-medium">{apt.contact || apt.phone || '-'}</p>
                              </div>
                              <div>
                                <span className="text-slate-500 text-xs block">Doctor</span>
                                <p className="font-medium truncate">{apt.doctor_name || '-'}{apt.clinic_name ? ` • ${apt.clinic_name}` : ''}</p>
                              </div>
                              <div>
                                <span className="text-slate-500 text-xs block">Payment</span>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`inline-flex items-center px-2 py-0.5 text-xs rounded ${getPaymentBadgeClass(apt.payment_status)}`}>
                                    {apt.payment_status || 'pending'}{apt.amount > 0 ? ` • Paid ₹${apt.amount}` : ''}
                                  </span>
                                  {apt.payment_status !== 'paid' && Number(getPendingAmount(apt)) > 0 && (
                                    <span className="inline-flex items-center px-2 py-0.5 text-xs rounded bg-red-100 text-red-700 font-semibold">
                                      ⚠️ Pending ₹{getPendingAmount(apt).toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            <select
                              className={`px-3 py-1.5 text-xs border rounded ${getStatusBadgeClass(apt.status)}`}
                              value={apt.status || 'scheduled'}
                              onChange={(e) => updateAppointmentStatus(apt.id, e.target.value, apt)}
                            >
                              <option value="scheduled">Scheduled</option>
                              <option value="in-progress">In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="cancelled">Cancelled</option>
                              <option value="no-show">No Show</option>
                            </select>
                            
                            {/* Start Visit Button - Only for Doctors */}
                            {user?.role === 'doctor' && (
                              <button
                                onClick={() => handleVisitPatient(apt)}
                                className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition font-medium"
                              >
                                Start Visit
                              </button>
                            )}
                            
                            {/* Collect Fee Button - Only for Staff */}
                            {user?.role === 'staff' && apt.payment_status === 'pending' && (
                              <button
                                onClick={() => {
                                  // Navigate to Payments page with this appointment
                                  navigate(`/payments?appointment=${apt.id}`);
                                }}
                                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                              >
                                Collect Fee
                              </button>
                            )}
                            <button
                              onClick={() => checkInForAppointment(apt)}
                              disabled={checkInLoadingId === apt.id}
                              className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-50 transition font-medium"
                            >
                              {checkInLoadingId === apt.id ? 'Checking in…' : 'Check-in'}
                            </button>
                            
                            {/* Direct Action Buttons */}
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  const pid = resolvePatientDbId(apt);
                                  if (!pid) return;
                                  navigate(`/receipts?patient=${pid}&appointment=${apt.id}&quick=true`);
                                }}
                                className="flex-1 px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition font-medium"
                                title="Create Bill"
                              >
                                💰 Bill
                              </button>
                              <button
                                onClick={() => {
                                  const pid = resolvePatientDbId(apt);
                                  if (!pid) return;
                                  navigate(`/patient-overview/${pid}`);
                                }}
                                className="flex-1 px-3 py-1.5 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition font-medium"
                                title="View Patient"
                              >
                                👁️ Patient
                              </button>
                              <button
                                onClick={() => {
                                  const newStatus = apt.payment_status === 'pending' ? 'paid' : 'pending';
                                  updatePaymentStatus(apt.id, newStatus);
                                }}
                                className="flex-1 px-3 py-1.5 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 transition font-medium"
                                title="Update Payment"
                              >
                                💳 Payment
                              </button>
                            </div>
                            
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleWhatsApp(apt)}
                                className="flex-1 px-3 py-1.5 text-xs border border-green-500 text-green-600 rounded hover:bg-green-50 transition"
                              >
                                WhatsApp
                              </button>
                              <button
                                onClick={() => {
                                  {
                                    const pid = resolvePatientDbId(apt);
                                    if (!pid) return;
                                    sessionStorage.setItem('currentAppointment', JSON.stringify({
                                      appointmentId: apt.id,
                                      patientId: pid,
                                      patientName: apt.patient_name
                                    }));
                                    navigate(`/orders/${pid}`);
                                  }
                                }}
                                className="flex-1 px-3 py-1.5 text-xs border rounded hover:bg-slate-50 transition"
                              >
                                Rx
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  
                  {/* Compact Pagination */}
                  {pagination.total > 0 && (
                    <div className="flex items-center justify-between gap-3 pt-4 border-t">
                      <span className="text-sm text-slate-600">
                        Page {page} of {pagination.pages} ({pagination.total} total)
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="px-3 py-2 text-sm border rounded hover:bg-slate-50 disabled:opacity-50"
                        >
                          ← Prev
                        </button>
                        <button
                          onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                          disabled={page >= pagination.pages}
                          className="px-3 py-2 text-sm border rounded hover:bg-slate-50 disabled:opacity-50"
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="bg-white rounded shadow-sm border p-4 space-y-4 h-fit">
          {/* Doctor Info */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-2xl">
              👨‍⚕️
            </div>
            <div>
              <span className="inline-flex items-center px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full mb-1">
                🟢 Online
              </span>
              <p className="font-semibold">Dr. {user?.name || 'Doctor'}</p>
              <p className="text-sm text-slate-500">{user?.role === 'doctor' ? (user?.specialization || 'General Physician') : user?.role}</p>
              {user?.clinic_name && (
                <p className="text-xs text-slate-400 mt-0.5 font-medium">📍 {user.clinic_name}</p>
              )}
            </div>
          </div>
          
          <hr />

          {/* QR Code Share Button */}
          <button
            onClick={() => setShowQRModal(true)}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <span className="text-lg">📱</span>
            Share QR Code
          </button>
          
          {/* Quick Register Button - Only for Staff */}
          {user?.role === 'staff' && (
            <button
              onClick={() => setShowQuickRegisterModal(true)}
              className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              <span className="text-lg">👤</span>
              Quick Register Patient
            </button>
          )}
          
          <hr />
          <div className="space-y-2">
            <p className="text-sm font-medium">Quick Actions</p>
            {/* Quick Check-in for walk-ins */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 mb-3 relative border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-900">Quick Check-in</p>
                  <p className="text-xs text-blue-600">Search & add to queue</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    id="quick-name"
                    name="quick-name"
                    type="text"
                    placeholder="Patient name or phone"
                    value={quickName}
                    onChange={(e) => {
                      setQuickName(e.target.value);
                      handleQuickSearch(e.target.value, 'name');
                    }}
                    className="w-full pl-10 pr-3 py-2.5 border border-blue-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                </div>
                
                {/* Search Results Dropdown */}
                {quickSearchLoading && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-blue-200 rounded-lg shadow-lg z-50 p-4 mt-1">
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span className="text-sm text-slate-500">Searching patients...</span>
                    </div>
                  </div>
                )}
                
                {quickSearchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-blue-200 rounded-lg shadow-lg z-50 max-h-56 overflow-y-auto mt-1">
                    <div className="p-3 bg-blue-50 border-b border-blue-200">
                      <p className="text-xs font-medium text-blue-700">
                        📋 {quickSearchResults.length} patients found
                      </p>
                    </div>
                    {quickSearchResults.map((patient, index) => (
                      <div
                        key={patient.id}
                        className={`p-3 hover:bg-blue-50 cursor-pointer border-b border-blue-100 last:border-b-0 transition-colors ${
                          index === 0 ? 'border-t-0' : ''
                        }`}
                        onClick={() => handleSearchResultClick(patient)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-medium text-blue-600">
                                  {patient.name?.charAt(0)?.toUpperCase() || '?'}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-slate-900 truncate">{patient.name}</p>
                            </div>
                            <div className="ml-8 space-y-1">
                              <div className="flex items-center gap-4 text-xs text-slate-600">
                                <span className="flex items-center gap-1">
                                  📱 {patient.phone}
                                </span>
                                <span className="flex items-center gap-1">
                                  🆔 {patient.patient_id}
                                </span>
                              </div>
                              {patient.email && (
                                <div className="text-xs text-slate-500">
                                  ✉️ {patient.email}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 ml-2">
                            <span className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full font-medium whitespace-nowrap">
                              ➕ Add to Queue
                            </span>
                            <span className="text-xs text-slate-400">
                              Click to check-in
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Patients */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-slate-500 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Recent Patients</p>
                  <p className="text-xs text-slate-600">Last 24 hours</p>
                </div>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {appointments.slice(0, 5).map((apt) => (
                  <div key={apt.id} className="p-2 bg-white rounded border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-slate-600">
                          {apt.patient_name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-900 truncate">{apt.patient_name}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>🕐 {apt.appointment_time?.substring(0, 5) || 'N/A'}</span>
                          {apt.status && (
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                              apt.status === 'completed' ? 'bg-green-100 text-green-700' :
                              apt.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                              apt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {apt.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {appointments.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-xs text-slate-500">No recent patients</p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => navigate('/appointments')}
              className="w-full px-4 py-2.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Appointment
            </button>

            <button
              onClick={() => {
                navigate('/patients');
                // Small delay to ensure page loads, then scroll to form
                setTimeout(() => {
                  const form = document.getElementById('add-patient-form');
                  if (form) {
                    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    const firstInput = form.querySelector('input');
                    if (firstInput) firstInput.focus();
                  }
                }, 100);
              }}
              className="w-full px-4 py-2.5 text-sm border border-primary text-primary rounded-lg hover:bg-primary/5 transition flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Register Patient
            </button>
            
            <button 
              onClick={() => navigate('/patients')}
              className="w-full px-4 py-2.5 text-sm border rounded-lg hover:bg-slate-50 transition"
            >
              View All Patients →
            </button>
          </div>
          
        </aside>
      </section>

      {/* Add Patient Modal */}
      <AddPatientModal 
        isOpen={showAddPatientModal} 
        onClose={() => setShowAddPatientModal(false)} 
        onSuccess={handlePatientAdded}
      />

      {/* Quick Register Modal for Staff */}
      {showQuickRegisterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Quick Register Patient</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient Name *
                </label>
                <input
                  type="text"
                  value={quickRegisterForm.name}
                  onChange={(e) => setQuickRegisterForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter patient name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={quickRegisterForm.phone}
                  onChange={(e) => setQuickRegisterForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter phone number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Consultation Fee
                </label>
                <input
                  type="number"
                  value={quickRegisterForm.consultation_fee}
                  onChange={(e) => setQuickRegisterForm(prev => ({ ...prev, consultation_fee: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Consultation fee"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleQuickRegister}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Registering...' : 'Register & Create Bill'}
              </button>
              <button
                onClick={() => {
                  setShowQuickRegisterModal(false);
                  setQuickRegisterForm({ name: '', phone: '', consultation_fee: 500 });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}