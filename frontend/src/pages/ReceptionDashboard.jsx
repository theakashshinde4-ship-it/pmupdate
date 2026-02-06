import React, { useState, useEffect } from 'react';
import { FiUsers, FiClock, FiAlertCircle, FiTrendingUp, FiUserPlus, FiSearch } from 'react-icons/fi';
import api from '../services/api';

const ReceptionDashboard = () => {
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [registerForm, setRegisterForm] = useState({
    patientId: '',
    doctorId: '',
    appointmentType: 'OPD',
    priority: 'normal'
  });

  // Fetch queue data
  const fetchQueue = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedDoctor) params.append('doctorId', selectedDoctor);
      
      const res = await api.get(`/api/opd/queue?${params}`);
      if (res.data?.success) {
        setQueue(res.data.data.queue);
        setStats(res.data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching queue:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch doctors
  const fetchDoctors = async () => {
    try {
      const res = await api.get('/api/doctors');
      if (res.data?.doctors) {
        setDoctors(res.data.doctors);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  // Search patients
  const searchPatients = async (query) => {
    if (!query || query.length < 2) {
      setPatients([]);
      return;
    }

    try {
      const res = await api.get(`/api/patients?search=${query}`);
      setPatients(res.data.patients || []);
    } catch (error) {
      console.error('Error searching patients:', error);
    }
  };

  // Register patient
  const registerPatient = async () => {
    try {
      const res = await api.post('/api/opd/register', registerForm);
      if (res.data?.success) {
        alert(`Patient registered successfully!\nToken Number: ${res.data.data.tokenNumber}\nEstimated Wait Time: ${res.data.data.estimatedWaitTime} minutes`);
        setShowRegisterModal(false);
        setRegisterForm({ patientId: '', doctorId: '', appointmentType: 'OPD', priority: 'normal' });
        setSelectedPatient(null);
        fetchQueue();
      }
    } catch (error) {
      console.error('Error registering patient:', error);
      alert('Failed to register patient');
    }
  };

  // Start consultation
  const startConsultation = async (visitId) => {
    try {
      const res = await api.put(`/api/opd/start-consultation/${visitId}`);
      if (res.data?.success) {
        fetchQueue();
        alert('Consultation started');
      }
    } catch (error) {
      console.error('Error starting consultation:', error);
      alert('Failed to start consultation');
    }
  };

  useEffect(() => {
    fetchQueue();
    fetchDoctors();

    // Auto-refresh queue every 30 seconds
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, [selectedDoctor]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const timer = setTimeout(() => searchPatients(searchTerm), 500);
      return () => clearTimeout(timer);
    }
  }, [searchTerm]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'in_consultation': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'senior_citizen': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reception Dashboard</h1>
          <p className="text-gray-600">Manage patient queue and registrations</p>
        </div>
        <button
          onClick={() => setShowRegisterModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
        >
          <FiUserPlus />
          Register Patient
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Waiting</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalWaiting || 0}</p>
            </div>
            <FiUsers className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Consultation</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inConsultation || 0}</p>
            </div>
            <FiClock className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed Today</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed || 0}</p>
            </div>
            <FiTrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Wait Time</p>
              <p className="text-2xl font-bold text-gray-900">{Math.round(stats.averageWaitTime || 0)}m</p>
            </div>
            <FiAlertCircle className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow border mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Doctor</label>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">All Doctors</option>
              {doctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  Dr. {doctor.name} - {doctor.specialization}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Current Queue</h2>
          <p className="text-sm text-gray-600">Last updated: {new Date().toLocaleTimeString()}</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Token</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wait Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {queue.map((patient) => (
                <tr key={patient.visit_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-semibold text-lg">#{patient.token_number}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium">{patient.patient_name}</div>
                      <div className="text-sm text-gray-500">
                        {patient.age}y, {patient.gender} • {patient.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium">Dr. {patient.doctor_name}</div>
                      <div className="text-sm text-gray-500">{patient.specialization}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(patient.priority)}`}>
                      {patient.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(patient.status)}`}>
                      {patient.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm">{patient.waiting_time}m</span>
                  </td>
                  <td className="px-4 py-3">
                    {patient.status === 'waiting' && (
                      <button
                        onClick={() => startConsultation(patient.visit_id)}
                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                      >
                        Start Consultation
                      </button>
                    )}
                    {patient.status === 'in_consultation' && (
                      <span className="text-sm text-gray-500">In Progress...</span>
                    )}
                    {patient.status === 'completed' && (
                      <span className="text-sm text-green-600">Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {queue.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No patients in queue
            </div>
          )}
        </div>
      </div>

      {/* Register Patient Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Register Patient</h2>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search Patient *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Search by name or phone..."
                  />
                  {patients.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {patients.map((patient) => (
                        <button
                          key={patient.id}
                          onClick={() => {
                            setSelectedPatient(patient);
                            setRegisterForm(prev => ({ ...prev, patientId: patient.id }));
                            setSearchTerm(patient.name);
                            setPatients([]);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b"
                        >
                          <div className="font-medium">{patient.name}</div>
                          <div className="text-xs text-gray-500">{patient.phone} • {patient.age}y</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor *</label>
                <select
                  value={registerForm.doctorId}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, doctorId: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Select Doctor</option>
                  {doctors.map(doctor => (
                    <option key={doctor.id} value={doctor.id}>
                      Dr. {doctor.name} - {doctor.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Type</label>
                <select
                  value={registerForm.appointmentType}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, appointmentType: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="OPD">OPD</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={registerForm.priority}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="normal">Normal</option>
                  <option value="senior_citizen">Senior Citizen</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t">
              <button
                onClick={() => setShowRegisterModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={registerPatient}
                disabled={!registerForm.patientId || !registerForm.doctorId}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                Register Patient
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionDashboard;
