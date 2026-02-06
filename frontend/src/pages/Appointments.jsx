import { useState, useEffect } from 'react';
import HeaderBar from '../components/HeaderBar';
import BookAppointmentModal from '../components/appointments/BookAppointmentModal';
import EditAppointmentModal from '../components/appointments/EditAppointmentModal';
import { useApiClient } from '../api/client';
import { FiPlus, FiCalendar, FiUser, FiClock, FiRepeat, FiSend, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { openWhatsApp } from '../utils/whatsapp';

export default function Appointments() {
  const api = useApiClient();
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointments, setSelectedAppointments] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [followUpPatients, setFollowUpPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [activeTab, setActiveTab] = useState('appointments'); // 'appointments' or 'followup'
  const [appointmentTypeFilter, setAppointmentTypeFilter] = useState('all'); // 'all', 'offline', or 'online'

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      // Fetch appointments and show pending (not started) even if they are old/overdue
      const res = await api.get(`/api/appointments?limit=500`);
      const allAppointments = res.data?.data?.appointments || res.data?.appointments || [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const pending = allAppointments
        .filter((apt) => {
          const status = (apt.status || '').toLowerCase();
          const started = Boolean(apt.visit_started_at);
          const ended = Boolean(apt.visit_ended_at);
          if (ended) return false;
          if (status === 'completed' || status === 'cancelled' || status === 'no-show') return false;
          if (started) return false;
          return status === 'scheduled' || status === 'confirmed' || status === 'in-progress';
        })
        .sort((a, b) => {
          const aDate = new Date(a.appointment_date);
          const bDate = new Date(b.appointment_date);
          aDate.setHours(0, 0, 0, 0);
          bDate.setHours(0, 0, 0, 0);

          const aGroup = aDate < today ? 0 : aDate > today ? 2 : 1;
          const bGroup = bDate < today ? 0 : bDate > today ? 2 : 1;
          if (aGroup !== bGroup) return aGroup - bGroup;

          const dateCompare = aDate - bDate;
          if (dateCompare !== 0) return dateCompare;

          const aTime = (a.appointment_time || '').split(':');
          const bTime = (b.appointment_time || '').split(':');
          const aMinutes = (parseInt(aTime[0]) || 0) * 60 + (parseInt(aTime[1]) || 0);
          const bMinutes = (parseInt(bTime[0]) || 0) * 60 + (parseInt(bTime[1]) || 0);
          return aMinutes - bMinutes;
        });

      setAppointments(pending);
      // Reset selection when appointments change
      setSelectedAppointments([]);
      setSelectAll(false);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'appointments') {
      fetchAppointments();
    }
  }, [activeTab]);

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const fetchFollowUpPatients = async () => {
    setLoading(true);
    try {
      console.log('Fetching follow-ups from /api/appointments/followups');
      const res = await api.get('/api/appointments/followups');
      console.log('Follow-ups response:', res.data);
      const followUps = res.data?.data?.followups || res.data?.followups || [];
      console.log('Follow-ups count:', followUps.length);
      setFollowUpPatients(followUps);
    } catch (error) {
      console.error('Failed to fetch follow-up patients:', error);
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'followup') {
      fetchFollowUpPatients();
    }
  }, [activeTab]);

  const handleEditAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setShowEditModal(true);
  };

  // Handle individual appointment selection
  const handleSelectAppointment = (appointmentId) => {
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
      setSelectedAppointments(appointments.map(a => a.id));
    }
    setSelectAll(!selectAll);
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedAppointments.length === 0) {
      alert('No appointments selected');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedAppointments.length} appointment(s)?`)) {
      return;
    }

    try {
      // Delete all selected appointments
      await Promise.all(
        selectedAppointments.map(id => api.delete(`/api/appointments/${id}`))
      );
      
      alert(`Successfully deleted ${selectedAppointments.length} appointment(s)`);
      setSelectedAppointments([]);
      setSelectAll(false);
      fetchAppointments();
    } catch (error) {
      console.error('Failed to delete appointments:', error);
      alert('Failed to delete some appointments');
    }
  };

  // Handle single appointment delete
  const handleDeleteAppointment = async (appointment) => {
    if (!window.confirm(`Are you sure you want to delete appointment for ${appointment.patient_name || 'this patient'}?`)) {
      return;
    }

    try {
      await api.delete(`/api/appointments/${appointment.id}`);
      alert('Appointment deleted successfully');
      fetchAppointments();
    } catch (error) {
      console.error('Failed to delete appointment:', error);
      alert('Failed to delete appointment: ' + (error.response?.data?.error || error.message));
    }
  };

  const sendWhatsAppAppointment = (appointment) => {
    const phone = appointment.patient_phone || appointment.contact;
    if (!phone) {
      alert('Patient phone number not available');
      return;
    }

    const appointmentDate = new Date(appointment.appointment_date);
    const formattedDate = appointmentDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const time = formatTime(appointment.appointment_time || appointment.slot_time);

    const message = `Hello ${appointment.patient_name},\n\nThis is a reminder about your appointment scheduled for:\n\n📅 Date: ${formattedDate}\n⏰ Time: ${time}\n👨‍⚕️ Doctor: Dr. ${appointment.doctor_name}\n\nPlease arrive 10 minutes early. If you need to reschedule, please contact us.\n\nThank you!\nOm Clinic And Diagnostic Center`;

    openWhatsApp(phone, message);
  };

  const sendWhatsAppFollowUp = (patient) => {
    const phone = patient.contact || patient.phone || patient.patient_phone;
    if (!phone) {
      alert('Patient phone number not available');
      return;
    }

    const followUpDate = new Date(patient.followup_date);
    const formattedFollowUpDate = followUpDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    const message = `Hello ${patient.patient_name},\n\nThis is a reminder about your follow-up appointment scheduled for ${formattedFollowUpDate} with Dr. ${patient.doctor_name}.\n\nPlease confirm your availability or let us know if you need to reschedule.\n\nThank you!`;

    openWhatsApp(phone, message);
  };

  return (
    <div className="space-y-6">
      <HeaderBar title="Appointments" />

      <div className="bg-white border rounded shadow-sm p-6">
        {/* Tabs */}
        <div className="border-b mb-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('appointments')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition ${
                activeTab === 'appointments'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <FiCalendar />
              Appointments
            </button>
            <button
              onClick={() => setActiveTab('followup')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition ${
                activeTab === 'followup'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <FiRepeat />
              Follow-up ({followUpPatients.length})
            </button>
          </div>
        </div>

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Upcoming Appointments</h2>
              <div className="flex gap-2">
                {selectedAppointments.length > 0 && (
                  <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded px-3 py-2">
                    <span className="text-sm text-blue-800">
                      {selectedAppointments.length} selected
                    </span>
                    <button
                      onClick={handleBulkDelete}
                      className="px-2 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Delete Selected
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAppointments([]);
                        setSelectAll(false);
                      }}
                      className="px-2 py-1 bg-slate-600 text-white text-sm rounded hover:bg-slate-700"
                    >
                      Clear
                    </button>
                  </div>
                )}
                <button
                  onClick={() => setShowBookModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
                >
                  <FiPlus />
                  Book Appointment
                </button>
              </div>
            </div>

            {/* Appointment Type Filter Tabs */}
            <div className="flex gap-2 mb-6 border-b">
              <button
                onClick={() => setAppointmentTypeFilter('all')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                  appointmentTypeFilter === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                All Appointments
              </button>
              <button
                onClick={() => setAppointmentTypeFilter('offline')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                  appointmentTypeFilter === 'offline'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Offline
              </button>
              <button
                onClick={() => setAppointmentTypeFilter('online')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                  appointmentTypeFilter === 'online'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Online
              </button>
            </div>

            {loading ? (
              <div className="px-4 py-8 text-center text-slate-500">
                Loading appointments...
              </div>
            ) : (() => {
                // Filter appointments by arrival type
                const filteredAppointments = appointmentTypeFilter === 'all'
                  ? appointments
                  : appointmentTypeFilter === 'online'
                    ? appointments.filter(apt => apt.arrival_type === 'online')
                    : appointments.filter(apt => apt.arrival_type !== 'online');

                return filteredAppointments.length === 0 ? (
                  <div className="px-4 py-8 text-center text-slate-500">
                    {appointmentTypeFilter === 'all'
                      ? 'No upcoming appointments. Click "Book Appointment" to add one.'
                      : `No ${appointmentTypeFilter} appointments found.`}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {(() => {
                      // Group appointments by date
                      const groupedByDate = filteredAppointments.reduce((groups, appointment) => {
                    const date = appointment.appointment_date;
                    if (!groups[date]) {
                      groups[date] = [];
                    }
                    groups[date].push(appointment);
                    return groups;
                  }, {});

                  return Object.entries(groupedByDate).map(([date, dateAppointments]) => {
                    const dateObj = new Date(date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);

                    let dateLabel;
                    if (dateObj.toDateString() === today.toDateString()) {
                      dateLabel = 'Today';
                    } else if (dateObj.toDateString() === tomorrow.toDateString()) {
                      dateLabel = 'Tomorrow';
                    } else {
                      dateLabel = dateObj.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      });
                    }

                    return (
                      <div key={date} className="border rounded-lg overflow-hidden">
                        <div className="bg-primary/10 px-4 py-3 border-b">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectAll}
                              onChange={handleSelectAll}
                              className="rounded border-slate-300"
                            />
                            <FiCalendar className="text-primary" />
                            <h3 className="font-semibold text-primary">{dateLabel}</h3>
                            <span className="ml-auto text-sm text-slate-600">
                              {dateAppointments.length} appointment{dateAppointments.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>

                        <div className="divide-y divide-slate-200">
                          {dateAppointments.map((appointment) => (
                            <div key={appointment.id} className="px-4 py-4 hover:bg-slate-50 transition">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedAppointments.includes(appointment.id)}
                                    onChange={() => handleSelectAppointment(appointment.id)}
                                    className="rounded border-slate-300 mt-1"
                                  />
                                </div>
                                <div className="flex-1 grid grid-cols-4 gap-4">
                                  <div>
                                    <div className="text-xs text-slate-500 mb-1">PATIENT</div>
                                    <div className="flex items-center gap-2">
                                      <FiUser className="text-slate-400" size={14} />
                                      <span className="font-medium text-sm">{appointment.patient_name}</span>
                                    </div>
                                    {appointment.patient_phone && (
                                      <div className="text-xs text-slate-500 mt-1 font-mono">
                                        {appointment.patient_phone}
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <div className="text-xs text-slate-500 mb-1">DOCTOR</div>
                                    <div className="text-sm">Dr. {appointment.doctor_name}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-slate-500 mb-1">TIME</div>
                                    <div className="flex items-center gap-2">
                                      <FiClock className="text-slate-400" size={14} />
                                      <span className="text-sm font-medium">
                                        {formatTime(appointment.slot_time || appointment.appointment_time)}
                                      </span>
                                    </div>
                                    {/* Appointment Type Badge */}
                                    {appointment.arrival_type && (
                                      <div className="mt-1">
                                        <span className={`inline-block px-2 py-0.5 text-xs rounded ${
                                          appointment.arrival_type === 'online'
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'bg-blue-100 text-blue-700'
                                        }`}>
                                          {appointment.arrival_type === 'online' ? '💻 Online' : '🏥 Offline'}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <div className="text-xs text-slate-500 mb-1">STATUS</div>
                                    <span className={`inline-block px-2 py-1 text-xs rounded ${
                                      appointment.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                      appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                                      appointment.status === 'completed' ? 'bg-slate-100 text-slate-700' :
                                      'bg-orange-100 text-orange-700'
                                    }`}>
                                      {appointment.status}
                                    </span>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEditAppointment(appointment)}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition"
                                    title="Edit Appointment"
                                  >
                                    <FiEdit2 size={12} />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => sendWhatsAppAppointment(appointment)}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100 transition"
                                    title="Send WhatsApp Reminder"
                                  >
                                    <FiSend size={12} />
                                    WhatsApp
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAppointment(appointment)}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition"
                                    title="Delete Appointment"
                                  >
                                    <FiTrash2 size={12} />
                                    Delete
                                  </button>
                                </div>
                              </div>
                              {appointment.reason_for_visit && (
                                <div className="mt-2 text-xs text-slate-600">
                                  Reason: {appointment.reason_for_visit}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  });
                    })()}
                  </div>
                );
              })()}
          </>
        )}


        {/* Follow-up Tab */}
        {activeTab === 'followup' && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Patients Needing Follow-up</h2>
              <p className="text-sm text-slate-600">
                Patients with scheduled follow-up appointments from prescriptions
              </p>
            </div>

            <div className="border rounded overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">PATIENT</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">LAST VISIT</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">FOLLOW-UP DATE</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">DAYS UNTIL</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">DOCTOR</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">REASON</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">CONTACT</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-slate-500">
                        Loading follow-up patients...
                      </td>
                    </tr>
                  ) : followUpPatients.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-slate-500">
                        No patients need follow-up at this time.
                      </td>
                    </tr>
                  ) : (
                    followUpPatients.map((patient) => {
                      const originalAppointmentDate = new Date(patient.original_appointment_date);
                      const followUpDate = new Date(patient.followup_date);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      followUpDate.setHours(0, 0, 0, 0);

                      const daysUntil = Math.floor((followUpDate - today) / (1000 * 60 * 60 * 24));
                      const isOverdue = daysUntil < 0;
                      const isDueToday = daysUntil === 0;
                      const isUrgent = daysUntil > 0 && daysUntil <= 3;

                      return (
                        <tr key={patient.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <FiUser className="text-slate-400" />
                              <span className="font-medium">{patient.patient_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {originalAppointmentDate.toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">
                            {followUpDate.toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                              isOverdue ? 'bg-red-100 text-red-800' :
                              isDueToday ? 'bg-orange-100 text-orange-800' :
                              isUrgent ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {isOverdue ? `${Math.abs(daysUntil)} days overdue` :
                               isDueToday ? 'Due today' :
                               `${daysUntil} days`}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">Dr. {patient.doctor_name}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {patient.reason || patient.reason_for_visit || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm font-mono text-xs">
                            {patient.contact || patient.phone || patient.patient_phone || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <button
                              onClick={() => sendWhatsAppFollowUp(patient)}
                              className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition"
                            >
                              <FiSend className="w-3 h-3" />
                              Send WhatsApp
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <BookAppointmentModal
        isOpen={showBookModal}
        onClose={() => setShowBookModal(false)}
        onSuccess={fetchAppointments}
      />

      <EditAppointmentModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
        onSuccess={fetchAppointments}
      />
    </div>
  );
}
