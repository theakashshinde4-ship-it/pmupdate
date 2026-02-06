import React, { useState, useEffect } from 'react';
import { FiCalendar, FiClipboard, FiTrendingUp, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { useApiClient } from '../api/client';
import { useToast } from '../hooks/useToast';

/**
 * Patient Timeline - View complete patient history
 * Shows: all prescriptions, diagnoses, medicines, notes in chronological order
 */
const PatientTimeline = ({ patientId }) => {
  const api = useApiClient();
  const { addToast } = useToast();

  const [timeline, setTimeline] = useState([]);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (patientId) {
      fetchPatientTimeline();
    }
  }, [patientId]);

  const fetchPatientTimeline = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/patients/${patientId}/timeline`);
      setTimeline(response.data.timeline || []);
      setPatient(response.data.patient || {});
    } catch (error) {
      console.error('Error fetching timeline:', error);
      addToast('Failed to load patient timeline', 'error');
      setMockTimeline();
    } finally {
      setLoading(false);
    }
  };

  const setMockTimeline = () => {
    setPatient({
      name: 'John Doe',
      age: 45,
      phone: '9876543210',
      email: 'john@example.com'
    });

    setTimeline([
      {
        id: 1,
        date: '2026-01-20',
        type: 'prescription',
        title: 'Prescription: URTI',
        description: 'Patient presents with fever, cough, sore throat',
        medicines: [
          { name: 'Amoxicillin', dosage: '500mg', frequency: '1-1-1', duration: '5 days' },
          { name: 'Cetirizine', dosage: '10mg', frequency: '0-0-1', duration: '5 days' }
        ],
        doctorNotes: 'Viral infection, rest recommended',
        followUp: '5 days',
        status: 'active'
      },
      {
        id: 2,
        date: '2026-01-15',
        type: 'follow-up',
        title: 'Follow-up: Migraine',
        description: 'Patient reports improved symptoms',
        feedback: 'Medicine worked well, no side effects',
        status: 'completed'
      },
      {
        id: 3,
        date: '2026-01-10',
        type: 'prescription',
        title: 'Prescription: Migraine',
        description: 'Patient reports severe headaches since 3 days',
        medicines: [
          { name: 'Ibuprofen', dosage: '400mg', frequency: '1-0-1', duration: '7 days' },
          { name: 'Metoclopramide', dosage: '10mg', frequency: '1-1-1', duration: '7 days' }
        ],
        doctorNotes: 'Chronic migraine, needs investigation if continues',
        followUp: '7 days',
        status: 'completed'
      },
      {
        id: 4,
        date: '2026-01-05',
        type: 'diagnosis',
        title: 'Diagnosed: Hypertension',
        description: 'BP readings consistently high',
        findings: 'BP: 150/95 mmHg, no symptoms',
        status: 'ongoing'
      },
      {
        id: 5,
        date: '2025-12-28',
        type: 'prescription',
        title: 'Prescription: Hypertension',
        description: 'Patient on new antihypertensive',
        medicines: [
          { name: 'Amlodipine', dosage: '5mg', frequency: '1-0-0', duration: 'Continued' }
        ],
        doctorNotes: 'Start with lower dose, monitor BP',
        followUp: '14 days',
        status: 'active'
      }
    ]);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'prescription':
        return <FiClipboard className="text-blue-600" size={20} />;
      case 'follow-up':
        return <FiCheckCircle className="text-green-600" size={20} />;
      case 'diagnosis':
        return <FiAlertCircle className="text-orange-600" size={20} />;
      default:
        return <FiCalendar className="text-gray-600" size={20} />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'prescription':
        return 'border-l-blue-500';
      case 'follow-up':
        return 'border-l-green-500';
      case 'diagnosis':
        return 'border-l-orange-500';
      default:
        return 'border-l-gray-500';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading patient timeline...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Patient Header */}
        {patient && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{patient.name}</h1>
                <div className="flex items-center gap-4 mt-2 text-gray-600">
                  <span>Age: {patient.age} years</span>
                  <span>•</span>
                  <span>Phone: {patient.phone}</span>
                  <span>•</span>
                  <span>Email: {patient.email}</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 p-4 rounded-lg">
                <FiTrendingUp className="text-purple-600" size={32} />
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200 grid md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Visits</p>
                <p className="text-2xl font-bold text-gray-900">{timeline.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Issues</p>
                <p className="text-2xl font-bold text-gray-900">
                  {timeline.filter(t => t.status === 'active').length}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Visit</p>
                <p className="text-2xl font-bold text-gray-900">{timeline.length > 0 ? formatDate(timeline[0].date) : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Medicines</p>
                <p className="text-2xl font-bold text-gray-900">
                  {timeline.reduce((sum, t) => sum + (t.medicines?.length || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Patient Timeline</h2>

          {timeline.map((item, index) => (
            <div
              key={item.id}
              className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${getTypeColor(item.type)}`}
            >
              {/* Timeline Header */}
              <div className="flex items-start justify-between cursor-pointer" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                <div className="flex items-start gap-4 flex-1">
                  <div className="mt-1">{getTypeIcon(item.type)}</div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-1">{formatDate(item.date)}</p>
                    <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    item.status === 'active' ? 'bg-blue-100 text-blue-700' :
                    item.status === 'completed' ? 'bg-green-100 text-green-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Timeline Details (Expanded) */}
              {expandedId === item.id && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  {/* Medicines Section */}
                  {item.medicines && item.medicines.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <FiClipboard size={18} /> Medicines Prescribed
                      </h4>
                      <div className="space-y-2">
                        {item.medicines.map((med, idx) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                            <p className="font-medium text-gray-900">{med.name}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {med.dosage} • {med.frequency} • {med.duration}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Doctor Notes */}
                  {item.doctorNotes && (
                    <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-600 mb-2 font-semibold">Doctor's Notes:</p>
                      <p className="text-gray-700">{item.doctorNotes}</p>
                    </div>
                  )}

                  {/* Follow-up */}
                  {item.followUp && (
                    <div className="mb-6 bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-sm text-gray-600 mb-2 font-semibold">Follow-up:</p>
                      <p className="text-gray-700">{item.followUp}</p>
                    </div>
                  )}

                  {/* Patient Feedback (for follow-ups) */}
                  {item.feedback && (
                    <div className="mb-6 bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <p className="text-sm text-gray-600 mb-2 font-semibold">Patient Feedback:</p>
                      <p className="text-gray-700">{item.feedback}</p>
                    </div>
                  )}

                  {/* Findings (for diagnoses) */}
                  {item.findings && (
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <p className="text-sm text-gray-600 mb-2 font-semibold">Findings:</p>
                      <p className="text-gray-700">{item.findings}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Collapse Indicator */}
              {expandedId === item.id && (
                <div className="mt-4 text-center">
                  <button className="text-sm text-gray-600 hover:text-gray-900 font-medium">
                    ▼ Collapse
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {timeline.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FiCalendar size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No timeline data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientTimeline;
