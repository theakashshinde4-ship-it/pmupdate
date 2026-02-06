import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import useDragAndDrop from '../hooks/useDragAndDrop';
import StatCard from '../components/StatCard';
import ActionButton from '../components/ActionButton';
import QueueColumn from '../components/QueueColumn';
import MyGenieWidget from '../components/MyGenieWidget';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState({
    waiting: [],
    in_progress: [],
    completed: []
  });
  const [stats, setStats] = useState({
    today_total: 0,
    waiting: 0,
    completed: 0,
    avg_wait_time: 0
  });

  // Fetch queue data
  const fetchQueue = async () => {
    try {
      const response = await api.get('/api/queue/today');
      const queueData = response.data;

      // Organize by status
      const organized = {
        waiting: queueData.filter(p => p.status === 'waiting'),
        in_progress: queueData.filter(p => p.status === 'in_progress'),
        completed: queueData.filter(p => p.status === 'completed')
      };

      setQueue(organized);

      // Calculate stats
      setStats({
        today_total: queueData.length,
        waiting: organized.waiting.length,
        completed: organized.completed.length,
        avg_wait_time: calculateAvgWaitTime(organized.completed)
      });

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch queue:', error);
      if (typeof showToast === 'function') showToast('Failed to load queue data', 'error');
      setLoading(false);
    }
  };

  // Calculate average wait time
  const calculateAvgWaitTime = (completedPatients) => {
    if (completedPatients.length === 0) return 0;
    const total = completedPatients.reduce((sum, p) => sum + (p.waiting_time || 0), 0);
    return Math.round(total / completedPatients.length);
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, []);

  // Add Patient inline modal/form state
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: '', phone: '', dob: '', gender: 'M' });
  const [addingPatient, setAddingPatient] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleCreateAndQueue = async () => {
    if (!newPatient.name) return;
    setAddingPatient(true);
    try {
      const res = await api.post('/api/patients', {
        name: newPatient.name,
        phone: newPatient.phone,
        dob: newPatient.dob || null,
        gender: newPatient.gender || null
      });
      const created = res.data;
      const patientDbId = created.id;

      // Add to queue
      await api.post('/api/queue', { patient_id: patientDbId });
      if (typeof showToast === 'function') showToast('Patient added and queued', 'success');
      setShowAddPatient(false);
      setNewPatient({ name: '', phone: '', dob: '', gender: 'M' });
      fetchQueue();
    } catch (err) {
      console.error('Failed to add patient and queue:', err);
      if (typeof showToast === 'function') showToast('Failed to add patient', 'error');
    } finally {
      setAddingPatient(false);
    }
  };

  const handleSearchPatients = async () => {
    if (!searchQuery) return;
    setSearching(true);
    try {
      const res = await api.get(`/api/patients?search=${encodeURIComponent(searchQuery)}`);
      setSearchResults(res.data || []);
    } catch (err) {
      console.error('Patient search failed', err);
      if (typeof showToast === 'function') showToast('Patient search failed', 'error');
    } finally {
      setSearching(false);
    }
  };

  const handleAddExistingToQueue = async (patient) => {
    const patientId = patient.id || patient.patient_id || patient.patientId;
    if (!patientId) return;
    try {
      await api.post('/api/queue', { patient_id: patientId });
      if (typeof showToast === 'function') showToast('Patient added to queue', 'success');
      setShowAddPatient(false);
      setSearchQuery('');
      setSearchResults([]);
      fetchQueue();
    } catch (err) {
      console.error('Failed to add existing patient to queue', err);
      if (typeof showToast === 'function') showToast('Failed to add patient to queue', 'error');
    }
  };

  // Handle patient click
  const handlePatientClick = (patient) => {
    navigate(`/patient-overview/${patient.patient_id}`);
  };

  // Handle drag and drop
  const { draggedItem, handleDragStart, handleDragEnd, handleDrop, handleDragOver } = useDragAndDrop({
    onDrop: async (item, targetStatus) => {
      try {
        await api.patch(`/api/queue/${item.id}/status`, { status: targetStatus });
        if (typeof showToast === 'function') showToast(`Patient moved to ${targetStatus}`, 'success');
        fetchQueue();
      } catch (error) {
        console.error('Failed to update status:', error);
        if (typeof showToast === 'function') showToast('Failed to update patient status', 'error');
      }
    }
  });

  // Handle Start Next Patient
  const handleStartNext = async () => {
    if (queue.waiting.length === 0) {
      if (typeof showToast === 'function') showToast('No patients in queue', 'info');
      return;
    }

    const nextPatient = queue.waiting[0];
    try {
      await api.patch(`/api/queue/${nextPatient.id}/status`, { status: 'in_progress' });
      if (typeof showToast === 'function') showToast('Patient called', 'success');
      fetchQueue();
      navigate(`/prescription-pad/${nextPatient.patient_id}`);
    } catch (error) {
      console.error('Failed to start patient:', error);
      if (typeof showToast === 'function') showToast('Failed to call patient', 'error');
    }
  };

  // Handle Walk-in
  const handleWalkIn = () => {
    navigate('/patients?action=new');
  };

  // Handle Quick Rx
  const handleQuickRx = () => {
    navigate('/patients?action=search');
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {getGreeting()}, Dr. {user?.name || 'Doctor'}
        </h1>
        <p className="text-gray-600">Here's what's happening today</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon="📊"
          label="Total Today"
          value={stats.today_total}
          color="blue"
        />
        <StatCard
          icon="⏳"
          label="Waiting"
          value={stats.waiting}
          color="orange"
        />
        <StatCard
          icon="✅"
          label="Completed"
          value={stats.completed}
          color="green"
        />
        <StatCard
          icon="⏱️"
          label="Avg Wait Time"
          value={stats.avg_wait_time}
          subtext="minutes"
          color="purple"
        />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <ActionButton
          icon="▶️"
          label="Start Next Patient"
          description={queue.waiting.length > 0 ? `Token #${queue.waiting[0].token_number}` : 'No patients waiting'}
          onClick={handleStartNext}
          variant="primary"
          disabled={queue.waiting.length === 0}
        />
        <ActionButton
          icon="🚶"
          label="Walk-in Patient"
          description="Register new patient"
          onClick={handleWalkIn}
          variant="secondary"
        />
        <ActionButton
          icon="📝"
          label="Quick Prescription"
          description="Find existing patient"
          onClick={handleQuickRx}
          variant="secondary"
        />
      </div>

      {/* My Genie Quick Widget */}
      <div className="mb-8">
        <MyGenieWidget
          symptoms={[]}
          patientId={null}
          age={null}
          gender={null}
          language="en"
          onApply={() => { /* optional: handle suggestion apply */ }}
        />
      </div>

      {/* Kanban Queue */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        <QueueColumn
          title="Waiting"
          patients={queue.waiting}
          color="blue"
          icon="⏳"
          status="waiting"
          onPatientClick={handlePatientClick}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          draggedItem={draggedItem}
        />
        <QueueColumn
          title="In Progress"
          patients={queue.in_progress}
          color="orange"
          icon="🩺"
          status="in_progress"
          onPatientClick={handlePatientClick}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          draggedItem={draggedItem}
        />
        <QueueColumn
          title="Completed"
          patients={queue.completed}
          color="green"
          icon="✅"
          status="completed"
          onPatientClick={handlePatientClick}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          draggedItem={draggedItem}
        />
      </div>
    </div>
    {showAddPatient && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-3">Add Patient (Walk-in)</h3>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                placeholder="Search existing patients by name or phone"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-2 border rounded"
              />
              <button onClick={handleSearchPatients} className="px-3 py-2 bg-slate-100 border rounded" disabled={searching}>
                {searching ? 'Searching…' : 'Search'}
              </button>
            </div>

            {searchResults && searchResults.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-auto border rounded p-2 bg-slate-50">
                {searchResults.map((p) => (
                  <div key={p.id || p.patient_id || p.patientId} className="flex items-center justify-between p-2 bg-white rounded">
                    <div>
                      <div className="font-medium">{p.name || p.full_name}</div>
                      <div className="text-xs text-slate-500">{p.phone || p.mobile || '-'}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleAddExistingToQueue(p)} className="px-3 py-1 bg-primary text-white rounded">Add to Queue</button>
                      <button onClick={() => navigate(`/patient-overview/${p.id || p.patient_id || p.patientId}`)} className="px-3 py-1 border rounded">Open</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t"></div>

            <input
              value={newPatient.name}
              onChange={(e) => setNewPatient(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Full name"
              className="w-full px-3 py-2 border rounded"
            />
            <input
              value={newPatient.phone}
              onChange={(e) => setNewPatient(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="Phone"
              className="w-full px-3 py-2 border rounded"
            />
            <div className="flex gap-2">
              <input
                type="date"
                value={newPatient.dob}
                onChange={(e) => setNewPatient(prev => ({ ...prev, dob: e.target.value }))}
                className="px-3 py-2 border rounded w-1/2"
              />
              <select
                value={newPatient.gender}
                onChange={(e) => setNewPatient(prev => ({ ...prev, gender: e.target.value }))}
                className="px-3 py-2 border rounded w-1/2"
              >
                <option value="M">M</option>
                <option value="F">F</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setShowAddPatient(false)} className="px-3 py-2 border rounded">Cancel</button>
            <button onClick={handleCreateAndQueue} disabled={addingPatient} className="px-3 py-2 bg-primary text-white rounded">{addingPatient ? 'Adding…' : 'Add & Queue'}</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
