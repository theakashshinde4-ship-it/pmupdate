import { useEffect, useState } from 'react';
import { useApiClient } from '../api/client';
import { useToast } from '../hooks/useToast';
import HeaderBar from '../components/HeaderBar';

export default function ABHADashboard() {
  const api = useApiClient();
  const { addToast } = useToast();

  const [abhaData, setAbhaData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState('today');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [hfrId, setHfrId] = useState('');
  const [editingHfrId, setEditingHfrId] = useState(false);
  const [newHfrId, setNewHfrId] = useState('');

  // Fetch ABHA data
  useEffect(() => {
    fetchABHAData();
  }, [dateFilter, customDateRange]);

  const fetchABHAData = async () => {
    try {
      setLoading(true);

      let params = {};

      if (dateFilter === 'custom') {
        params.startDate = customDateRange.startDate;
        params.endDate = customDateRange.endDate;
      } else {
        params.filter = dateFilter;
      }

      const res = await api.get('/api/abha/dashboard', { params });

      setAbhaData({
        hfr_id: res.data.hfr_id || 'Not Set',
        total_patients: res.data.total_patients || 0,
        linked_patients: res.data.linked_patients || 0,
        consent_requests: res.data.consent_requests || 0,
        pending_uploads: res.data.pending_uploads || 0,
        last_updated: res.data.last_updated || new Date().toISOString()
      });

      setHfrId(res.data.hfr_id || '');
    } catch (err) {
      addToast('Failed to fetch ABHA data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Update HFR ID
  const handleUpdateHfrId = async () => {
    if (!newHfrId.trim()) {
      addToast('Please enter HFR ID', 'warning');
      return;
    }

    try {
      await api.patch('/api/abha/hfr-id', { hfr_id: newHfrId });
      setHfrId(newHfrId);
      setEditingHfrId(false);
      addToast('HFR ID updated successfully', 'success');
      fetchABHAData();
    } catch (err) {
      addToast('Failed to update HFR ID', 'error');
    }
  };

  // Copy HFR ID
  const handleCopyHfrId = () => {
    if (hfrId) {
      navigator.clipboard.writeText(hfrId);
      addToast('HFR ID copied to clipboard', 'success');
    }
  };

  // Export data
  const handleExportData = () => {
    const csvContent = `ABHA Dashboard Report
Generated: ${new Date().toLocaleString()}

HFR ID: ${hfrId}
Total Patients: ${abhaData?.total_patients || 0}
Linked Patients: ${abhaData?.linked_patients || 0}
Consent Requests: ${abhaData?.consent_requests || 0}
Pending Uploads: ${abhaData?.pending_uploads || 0}

Linking Rate: ${abhaData?.total_patients > 0 ? ((abhaData.linked_patients / abhaData.total_patients) * 100).toFixed(2) : 0}%`;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(csvContent));
    element.setAttribute('download', `abha_report_${new Date().toISOString().split('T')[0]}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    addToast('Report exported successfully', 'success');
  };

  const linkingRate = abhaData?.total_patients > 0
    ? ((abhaData.linked_patients / abhaData.total_patients) * 100).toFixed(2)
    : 0;

  return (
    <div className="space-y-4">
      <HeaderBar title="ABHA Dashboard" />

      {/* HFR ID Section */}
      <div className="bg-white rounded shadow-sm border p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">ABHA HFR ID</h2>
          <button
            onClick={() => setEditingHfrId(!editingHfrId)}
            className="px-3 py-1 text-sm border rounded hover:bg-slate-50"
          >
            {editingHfrId ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editingHfrId ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={newHfrId}
              onChange={(e) => setNewHfrId(e.target.value)}
              placeholder="Enter HFR ID"
              className="flex-1 px-3 py-2 border rounded"
            />
            <button
              onClick={handleUpdateHfrId}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition"
            >
              Save
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded">
            <div className="flex-1">
              <p className="text-sm text-slate-600">Current HFR ID</p>
              <p className="text-lg font-mono font-semibold">{hfrId || 'Not Set'}</p>
            </div>
            <button
              onClick={handleCopyHfrId}
              disabled={!hfrId}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition disabled:opacity-50 text-sm"
            >
              Copy
            </button>
          </div>
        )}
      </div>

      {/* Date Filters */}
      <div className="bg-white rounded shadow-sm border p-4">
        <h2 className="text-lg font-semibold mb-4">Date Filters</h2>

        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { value: 'today', label: 'Today' },
            { value: 'yesterday', label: 'Yesterday' },
            { value: 'weekly', label: 'This Week' },
            { value: 'monthly', label: 'This Month' },
            { value: 'custom', label: 'Custom Range' }
          ].map(filter => (
            <button
              key={filter.value}
              onClick={() => setDateFilter(filter.value)}
              className={`px-4 py-2 rounded text-sm font-medium transition ${
                dateFilter === filter.value
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {dateFilter === 'custom' && (
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm text-slate-600 mb-1">Start Date</label>
              <input
                type="date"
                value={customDateRange.startDate}
                onChange={(e) => setCustomDateRange({ ...customDateRange, startDate: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-slate-600 mb-1">End Date</label>
              <input
                type="date"
                value={customDateRange.endDate}
                onChange={(e) => setCustomDateRange({ ...customDateRange, endDate: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>
        )}
      </div>

      {/* Metrics */}
      {loading ? (
        <div className="text-center py-8 text-slate-500">Loading ABHA data...</div>
      ) : abhaData ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Patients */}
            <div className="bg-white rounded shadow-sm border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Patients</p>
                  <p className="text-3xl font-bold text-primary mt-1">{abhaData.total_patients}</p>
                </div>
                <div className="text-4xl">👥</div>
              </div>
            </div>

            {/* Linked Patients */}
            <div className="bg-white rounded shadow-sm border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Linked Patients</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{abhaData.linked_patients}</p>
                  <p className="text-xs text-slate-500 mt-1">{linkingRate}% linked</p>
                </div>
                <div className="text-4xl">🔗</div>
              </div>
            </div>

            {/* Consent Requests */}
            <div className="bg-white rounded shadow-sm border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Consent Requests</p>
                  <p className="text-3xl font-bold text-orange-600 mt-1">{abhaData.consent_requests}</p>
                </div>
                <div className="text-4xl">📋</div>
              </div>
            </div>

            {/* Pending Uploads */}
            <div className="bg-white rounded shadow-sm border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Pending Uploads</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">{abhaData.pending_uploads}</p>
                </div>
                <div className="text-4xl">⏳</div>
              </div>
            </div>
          </div>

          {/* Linking Progress */}
          <div className="bg-white rounded shadow-sm border p-4">
            <h3 className="font-semibold mb-3">ABHA Linking Progress</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Linked: {abhaData.linked_patients} / {abhaData.total_patients}</span>
                <span className="font-semibold">{linkingRate}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-full transition-all duration-300"
                  style={{ width: `${linkingRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={fetchABHAData}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>

            <button
              onClick={handleExportData}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Report
            </button>
          </div>

          {/* Last Updated */}
          <div className="text-xs text-slate-500 text-center">
            Last updated: {new Date(abhaData.last_updated).toLocaleString()}
          </div>
        </>
      ) : null}
    </div>
  );
}
