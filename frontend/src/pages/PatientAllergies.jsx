import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApiClient } from '../api/client';
import { useToast } from '../hooks/useToast';

const categories = ['drug', 'food', 'substance', 'other'];
const severities = ['mild', 'moderate', 'severe'];

export default function PatientAllergies() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const api = useApiClient();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [activeOnly, setActiveOnly] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    patient_id: patientId,
    category: 'drug',
    allergen_name: '',
    snomed_concept_id: '',
    reaction: '',
    severity: '',
    notes: '',
    is_active: 1,
  });

  const title = useMemo(() => `Allergies • Patient #${patientId}`, [patientId]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/allergies/${patientId}`, { params: { active: activeOnly ? 1 : 0 } });
      setItems(Array.isArray(res.data?.items) ? res.data.items : []);
    } catch (e) {
      addToast('Failed to load allergies', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [patientId, activeOnly]);

  const resetForm = () => {
    setEditId(null);
    setForm({ patient_id: patientId, category: 'drug', allergen_name: '', snomed_concept_id: '', reaction: '', severity: '', notes: '', is_active: 1 });
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (!form.allergen_name?.trim()) {
        addToast('Allergen name is required', 'error');
        return;
      }
      if (editId) {
        await api.patch(`/api/allergies/${editId}`, {
          category: form.category,
          allergen_name: form.allergen_name,
          snomed_concept_id: form.snomed_concept_id ? Number(form.snomed_concept_id) : null,
          reaction: form.reaction,
          severity: form.severity,
          notes: form.notes,
          is_active: form.is_active,
        });
        addToast('Allergy updated', 'success');
      } else {
        await api.post('/api/allergies', {
          patient_id: Number(patientId),
          category: form.category,
          allergen_name: form.allergen_name,
          snomed_concept_id: form.snomed_concept_id ? Number(form.snomed_concept_id) : null,
          reaction: form.reaction,
          severity: form.severity,
          notes: form.notes,
          is_active: form.is_active,
        });
        addToast('Allergy added', 'success');
      }
      setShowForm(false);
      resetForm();
      load();
    } catch (e) {
      addToast('Save failed', 'error');
    }
  };

  const edit = (row) => {
    setEditId(row.id);
    setForm({
      patient_id: patientId,
      category: row.category || 'drug',
      allergen_name: row.allergen_name || '',
      snomed_concept_id: row.snomed_concept_id || '',
      reaction: row.reaction || '',
      severity: row.severity || '',
      notes: row.notes || '',
      is_active: row.is_active ? 1 : 0,
    });
    setShowForm(true);
  };

  const toggleActive = async (row) => {
    try {
      await api.patch(`/api/allergies/${row.id}`, { is_active: row.is_active ? 0 : 1 });
      addToast(row.is_active ? 'Allergy deactivated' : 'Allergy activated', 'success');
      load();
    } catch (e) {
      addToast('Update failed', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{title}</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm flex items-center gap-1">
            <input type="checkbox" className="rounded" checked={activeOnly} onChange={(e)=>setActiveOnly(e.target.checked)} />
            Active only
          </label>
          <button className="px-3 py-2 bg-primary text-white rounded hover:bg-primary/90 text-sm" onClick={() => { resetForm(); setShowForm(true); }}>+ Add Allergy</button>
          <Link to={`/patient-overview/${patientId}`} className="px-3 py-2 border rounded text-sm hover:bg-slate-50">Back to Patient</Link>
        </div>
      </div>

      <div className="bg-white border rounded shadow-sm">
        <div className="grid grid-cols-6 gap-2 px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-600">
          <span>Category</span>
          <span>Allergen</span>
          <span>Reaction</span>
          <span>Severity</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
        {loading ? (
          <div className="px-3 py-4 text-sm text-slate-500">Loading...</div>
        ) : items.length === 0 ? (
          <div className="px-3 py-4 text-sm text-slate-500">No allergies found</div>
        ) : (
          items.map((row) => (
            <div key={row.id} className="grid grid-cols-6 gap-2 px-3 py-2 border-t text-sm items-center">
              <span className="capitalize">{row.category}</span>
              <div>
                <div className="font-medium">{row.allergen_name}</div>
                {row.snomed_concept_id && (
                  <div className="text-xs text-slate-500">SNOMED: {row.snomed_concept_id}</div>
                )}
              </div>
              <span>{row.reaction || '-'}</span>
              <span className="capitalize">{row.severity || '-'}</span>
              <span>
                <span className={`px-2 py-0.5 rounded text-xs ${row.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                  {row.is_active ? 'Active' : 'Inactive'}
                </span>
              </span>
              <div className="flex items-center gap-2">
                <button className="px-2 py-1 border rounded text-xs hover:bg-slate-50" onClick={() => edit(row)}>Edit</button>
                <button className="px-2 py-1 border rounded text-xs hover:bg-slate-50" onClick={() => toggleActive(row)}>
                  {row.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded shadow-lg w-full max-w-xl">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h3 className="font-semibold">{editId ? 'Edit Allergy' : 'Add Allergy'}</h3>
              <button className="text-slate-500 hover:text-slate-700" onClick={()=>setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={submit} className="p-4 space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                  <select className="w-full px-3 py-2 border rounded" value={form.category} onChange={(e)=>setForm({...form, category:e.target.value})}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Allergen Name *</label>
                  <input className="w-full px-3 py-2 border rounded" value={form.allergen_name} onChange={(e)=>setForm({...form, allergen_name:e.target.value})} placeholder="e.g., Amoxicillin" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">SNOMED Concept ID</label>
                  <input className="w-full px-3 py-2 border rounded" value={form.snomed_concept_id} onChange={(e)=>setForm({...form, snomed_concept_id:e.target.value})} placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reaction</label>
                  <input className="w-full px-3 py-2 border rounded" value={form.reaction} onChange={(e)=>setForm({...form, reaction:e.target.value})} placeholder="e.g., Rash, Nausea" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Severity</label>
                  <select className="w-full px-3 py-2 border rounded" value={form.severity} onChange={(e)=>setForm({...form, severity:e.target.value})}>
                    <option value="">Select</option>
                    {severities.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Active</label>
                  <select className="w-full px-3 py-2 border rounded" value={form.is_active} onChange={(e)=>setForm({...form, is_active:Number(e.target.value)})}>
                    <option value={1}>Yes</option>
                    <option value={0}>No</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea className="w-full px-3 py-2 border rounded min-h-[80px]" value={form.notes} onChange={(e)=>setForm({...form, notes:e.target.value})} placeholder="Additional information (optional)" />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button type="button" className="px-3 py-2 border rounded text-sm hover:bg-slate-50" onClick={()=>setShowForm(false)}>Cancel</button>
                <button type="submit" className="px-3 py-2 bg-primary text-white rounded hover:bg-primary/90 text-sm">{editId ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
