import React, { useState, useEffect } from 'react';
import { useApiClient } from '../contexts/ApiContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function PatientQueue() {
  const api = useApiClient();
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [activeTab, setActiveTab] = useState('existing');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [queue, setQueue] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Form states
  const [newPatient, setNewPatient] = useState({
    name: '',
    age: '',
    gender: '',
    phone: '',
    address: '',
    email: '',
    blood_group: ''
  });
  
  const [queueForm, setQueueForm] = useState({
    queue_date: new Date().toISOString().split('T')[0],
    visit_type: 'new_complaint',
    doctor_id: ''
  });

  useEffect(() => {
    fetchDoctors();
    fetchQueue();
  }, []);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchPatients();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchPatients = async () => {
    try {
      const res = await api.get(`/api/patient-queue/search-patients?query=${searchQuery}`);
      setSearchResults(res.data.patients || []);
    } catch (error) {
      console.error('Search patients error:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/api/patient-queue/doctors');
      setDoctors(res.data.doctors || []);
      if (res.data.doctors?.length > 0) {
        setQueueForm(prev => ({ ...prev, doctor_id: res.data.doctors[0].id }));
      }
    } catch (error) {
      console.error('Fetch doctors error:', error);
    }
  };

  const fetchQueue = async () => {
    try {
      const res = await api.get(`/api/patient-queue/queue?date=${queueForm.queue_date}`);
      setQueue(res.data.queue || []);
    } catch (error) {
      console.error('Fetch queue error:', error);
    }
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleNewPatientChange = (field, value) => {
    setNewPatient(prev => ({ ...prev, [field]: value }));
  };

  const handleQueueFormChange = (field, value) => {
    setQueueForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAddExistingPatient = () => {
    if (!selectedPatient) {
      addToast('Please select a patient', 'error');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleRegisterNewPatient = () => {
    // Validate new patient form
    if (!newPatient.name || !newPatient.age || !newPatient.gender || !newPatient.phone) {
      addToast('Please fill all required fields', 'error');
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmAddToQueue = async () => {
    setLoading(true);
    try {
      if (activeTab === 'existing') {
        // Add existing patient to queue
        const res = await api.post('/api/patient-queue/add-to-queue', {
          patient_id: selectedPatient.id,
          queue_date: queueForm.queue_date,
          visit_type: queueForm.visit_type,
          doctor_id: queueForm.doctor_id
        });
        
        addToast('Patient added to queue successfully', 'success');
      } else {
        // Register new patient and add to queue
        const res = await api.post('/api/patient-queue/register-and-queue', {
          ...newPatient,
          queue_date: queueForm.queue_date,
          visit_type: queueForm.visit_type,
          doctor_id: queueForm.doctor_id
        });
        
        addToast('Patient registered and added to queue successfully', 'success');
        setNewPatient({
          name: '',
          age: '',
          gender: '',
          phone: '',
          address: '',
          email: '',
          blood_group: ''
        });
      }
      
      setShowConfirmModal(false);
      setSelectedPatient(null);
      fetchQueue();
      
    } catch (error) {
      console.error('Add to queue error:', error);
      addToast(error.response?.data?.error || 'Failed to add patient to queue', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVisitTypeLabel = (type) => {
    switch (type) {
      case 'follow_up': return 'Follow-up';
      case 'new_complaint': return 'New Complaint';
      case 'regular_checkup': return 'Regular Checkup';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded shadow-sm p-6">
        <h2 className="text-2xl font-bold mb-6">Patient Queue Management</h2>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('existing')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'existing'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Add Existing Patient
            </button>
            <button
              onClick={() => setActiveTab('new')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'new'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Register New Patient
            </button>
          </nav>
        </div>

        {/* Queue Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Queue Date
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border rounded"
              value={queueForm.queue_date}
              onChange={(e) => {
                handleQueueFormChange('queue_date', e.target.value);
                fetchQueue();
              }}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visit Type
            </label>
            <select
              className="w-full px-3 py-2 border rounded"
              value={queueForm.visit_type}
              onChange={(e) => handleQueueFormChange('visit_type', e.target.value)}
            >
              <option value="follow_up">Follow-up</option>
              <option value="new_complaint">New Complaint</option>
              <option value="regular_checkup">Regular Checkup</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Doctor
            </label>
            <select
              className="w-full px-3 py-2 border rounded"
              value={queueForm.doctor_id}
              onChange={(e) => handleQueueFormChange('doctor_id', e.target.value)}
            >
              {doctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name} - {doctor.specialization}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Existing Patient Tab */}
        {activeTab === 'existing' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Patient (Name, Mobile, Patient ID)
              </label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Search by name, mobile number or patient ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border border-gray-200 rounded mt-1 max-h-60 overflow-y-auto">
                    {searchResults.map(patient => (
                      <div
                        key={patient.id}
                        className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b"
                        onClick={() => handlePatientSelect(patient)}
                      >
                        <div className="font-semibold">{patient.name}</div>
                        <div className="text-sm text-gray-600">
                          ID: {patient.uhid} | Phone: {patient.phone} | Age: {patient.age}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {selectedPatient && (
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <h4 className="font-semibold mb-2">Selected Patient</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>Name:</strong> {selectedPatient.name}</div>
                  <div><strong>ID:</strong> {selectedPatient.uhid}</div>
                  <div><strong>Phone:</strong> {selectedPatient.phone}</div>
                  <div><strong>Age/Gender:</strong> {selectedPatient.age}/{selectedPatient.gender === 'M' ? 'Male' : selectedPatient.gender === 'F' ? 'Female' : selectedPatient.gender === 'O' ? 'Other' : 'Unknown'}</div>
                </div>
                <button
                  onClick={handleAddExistingPatient}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Add to Queue
                </button>
              </div>
            )}
          </div>
        )}

        {/* New Patient Tab */}
        {activeTab === 'new' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded"
                  value={newPatient.name}
                  onChange={(e) => handleNewPatientChange('name', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age *
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border rounded"
                  value={newPatient.age}
                  onChange={(e) => handleNewPatientChange('age', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  className="w-full px-3 py-2 border rounded"
                  value={newPatient.gender}
                  onChange={(e) => handleNewPatientChange('gender', e.target.value)}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile *
                </label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border rounded"
                  value={newPatient.phone}
                  onChange={(e) => handleNewPatientChange('phone', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border rounded"
                  value={newPatient.email}
                  onChange={(e) => handleNewPatientChange('email', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blood Group
                </label>
                <select
                  className="w-full px-3 py-2 border rounded"
                  value={newPatient.blood_group}
                  onChange={(e) => handleNewPatientChange('blood_group', e.target.value)}
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                className="w-full px-3 py-2 border rounded"
                rows="3"
                value={newPatient.address}
                onChange={(e) => handleNewPatientChange('address', e.target.value)}
              />
            </div>
            
            <button
              onClick={handleRegisterNewPatient}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Save & Add to Queue
            </button>
          </div>
        )}
      </div>

      {/* Current Queue */}
      <div className="bg-white border rounded shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">
          Current Queue - {queueForm.queue_date}
        </h3>
        
        {queue.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No patients in queue for selected date
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-3 text-left">Token</th>
                  <th className="border p-3 text-left">Patient</th>
                  <th className="border p-3 text-left">ID</th>
                  <th className="border p-3 text-left">Phone</th>
                  <th className="border p-3 text-left">Visit Type</th>
                  <th className="border p-3 text-left">Doctor</th>
                  <th className="border p-3 text-left">Status</th>
                  <th className="border p-3 text-left">Wait Time</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="border p-3 font-semibold">{patient.token_number}</td>
                    <td className="border p-3">{patient.patient_name}</td>
                    <td className="border p-3">{patient.uhid}</td>
                    <td className="border p-3">{patient.phone}</td>
                    <td className="border p-3">{getVisitTypeLabel(patient.visit_type)}</td>
                    <td className="border p-3">{patient.doctor_name}</td>
                    <td className="border p-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(patient.status)}`}>
                        {patient.status}
                      </span>
                    </td>
                    <td className="border p-3">{patient.wait_time} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Confirm Add to Queue</h3>
            
            <div className="mb-4">
              <p><strong>Date:</strong> {queueForm.queue_date}</p>
              <p><strong>Visit Type:</strong> {getVisitTypeLabel(queueForm.visit_type)}</p>
              <p><strong>Doctor:</strong> {doctors.find(d => d.id === queueForm.doctor_id)?.name}</p>
              
              {activeTab === 'existing' && selectedPatient && (
                <div className="mt-3 p-3 bg-gray-50 rounded">
                  <p><strong>Patient:</strong> {selectedPatient.name}</p>
                  <p><strong>ID:</strong> {selectedPatient.uhid}</p>
                </div>
              )}
              
              {activeTab === 'new' && (
                <div className="mt-3 p-3 bg-gray-50 rounded">
                  <p><strong>New Patient:</strong> {newPatient.name}</p>
                  <p><strong>Phone:</strong> {newPatient.phone}</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={confirmAddToQueue}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
