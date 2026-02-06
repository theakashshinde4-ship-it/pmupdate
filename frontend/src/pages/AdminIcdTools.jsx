import { useState } from 'react';
import HeaderBar from '../components/HeaderBar';
import { useApiClient } from '../api/client';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';

export default function AdminIcdTools() {
  const api = useApiClient();
  const { addToast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const refreshICD = async (version) => {
    try {
      setLoading(true);
      setLastResult(null);
      const res = await api.post('/api/icd/admin/refresh', null, { params: { version } });
      setLastResult(res.data);
      addToast(`Refreshed ${version.toUpperCase()} successfully`, 'success');
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Refresh failed';
      addToast(msg, 'error');
      setLastResult({ success: false, error: msg });
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      <HeaderBar title="ICD Admin Tools" />

      {!isAdmin && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
          You do not have admin permission to use these tools. Please login as an admin.
        </div>
      )}

      <div className="bg-white border rounded shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Refresh ICD Datasets</h2>
        <p className="text-sm text-slate-600 mb-4">
          Use these buttons to download the latest ICD-10 or ICD-11 datasets and upsert them into the database.
        </p>

        <div className="flex gap-3 mb-6">
          <button
            disabled={loading || !isAdmin}
            onClick={() => refreshICD('icd10')}
            className={`px-4 py-2 rounded text-white ${loading || !isAdmin ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading ? 'Refreshing...' : 'Refresh ICD-10'}
          </button>
          <button
            disabled={loading || !isAdmin}
            onClick={() => refreshICD('icd11')}
            className={`px-4 py-2 rounded text-white ${loading || !isAdmin ? 'bg-slate-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {loading ? 'Refreshing...' : 'Refresh ICD-11'}
          </button>
        </div>

        {lastResult && (
          <div className="border rounded p-4 bg-slate-50">
            <h3 className="font-semibold mb-2">Last Refresh Result</h3>
            {lastResult.success ? (
              <div className="text-sm text-slate-700 space-y-1">
                <div><span className="font-medium">Version:</span> {lastResult.version}</div>
                <div><span className="font-medium">Total in dataset:</span> {lastResult.count}</div>
                <div><span className="font-medium">Inserted:</span> {lastResult.inserted}</div>
                <div><span className="font-medium">Updated:</span> {lastResult.updated}</div>
                <div><span className="font-medium">Skipped:</span> {lastResult.skipped}</div>
                <div><span className="font-medium">Errors:</span> {lastResult.errors}</div>
              </div>
            ) : (
              <div className="text-sm text-red-700">
                {lastResult.error || 'Refresh failed'}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-slate-50 border rounded p-4 text-xs text-slate-600">
        <p className="mb-1 font-medium">Notes:</p>
        <ul className="list-disc ml-4 space-y-1">
          <li>Ensure ICD10_SOURCE_URL and ICD11_SOURCE_URL are set in backend environment variables.</li>
          <li>Large datasets may take a minute to process. Do not refresh the page while in progress.</li>
          <li>Only administrators can trigger ICD dataset refresh.</li>
        </ul>
      </div>
    </div>
  );
}
