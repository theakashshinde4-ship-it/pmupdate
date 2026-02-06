import React, { useState, useEffect } from 'react';
import { useApiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

/**
 * Doctor Selector Component
 * Shows doctor selection dropdown for admin users
 * Stores selected doctor in localStorage and context
 */
export default function DoctorSelector({ onDoctorSelect }) {
  const api = useApiClient();
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDoctors();
    // Load previously selected doctor from localStorage
    const savedDoctorId = localStorage.getItem('selectedDoctorId');
    if (savedDoctorId) {
      const savedDoctor = JSON.parse(localStorage.getItem('selectedDoctor'));
      setSelectedDoctor(savedDoctor);
      if (onDoctorSelect) {
        onDoctorSelect(savedDoctor);
      }
    }
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/doctors');
      setDoctors(res.data.doctors || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorChange = (e) => {
    const doctorId = e.target.value;
    const doctor = doctors.find(d => d.id === parseInt(doctorId));

    setSelectedDoctor(doctor);

    // Save to localStorage
    localStorage.setItem('selectedDoctorId', doctor.id);
    localStorage.setItem('selectedDoctor', JSON.stringify(doctor));

    // Callback to parent
    if (onDoctorSelect) {
      onDoctorSelect(doctor);
    }

    // Reload page to apply changes across all components
    window.location.reload();
  };

  // Only show for admin users
  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            👨‍⚕️ Select Doctor:
          </label>
          <select
            value={selectedDoctor?.id || ''}
            onChange={handleDoctorChange}
            disabled={loading}
            className="flex-1 max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Select a doctor --</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                Dr. {doctor.name} {doctor.specialization ? `(${doctor.specialization})` : ''}
              </option>
            ))}
          </select>

          {selectedDoctor && (
            <div className="text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-md">
              <span className="font-medium">Selected:</span> Dr. {selectedDoctor.name}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
