import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiX, FiTag, FiSave } from 'react-icons/fi';
import { useApiClient } from '../api/client';
import { useToast } from '../hooks/useToast';

/**
 * Advanced Patient Filtering & Search
 * Filter patients by diagnosis, medicine, date range, age, compliance, tags
 */
const AdvancedPatientFilter = () => {
  const api = useApiClient();
  const { addToast } = useToast();

  const [filters, setFilters] = useState({
    searchQuery: '',
    diagnoses: [],
    medicines: [],
    dateFrom: '',
    dateTo: '',
    ageFrom: 0,
    ageTo: 150,
    tags: [],
    compliance: 'all' // all, high, low, pending
  });

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedSearches, setSavedSearches] = useState([
    { id: 1, name: 'All Migraine Patients', filters: { diagnoses: ['Migraine'] } },
    { id: 2, name: 'All BP Patients', filters: { diagnoses: ['Hypertension'] } },
    { id: 3, name: 'High Compliance', filters: { compliance: 'high' } }
  ]);

  const [availableTags, setAvailableTags] = useState([
    { id: 1, name: 'VIP', color: 'bg-purple-100 text-purple-700' },
    { id: 2, name: 'Complex Case', color: 'bg-red-100 text-red-700' },
    { id: 3, name: 'Good Compliance', color: 'bg-green-100 text-green-700' },
    { id: 4, name: 'Needs Follow-up', color: 'bg-orange-100 text-orange-700' },
    { id: 5, name: 'New Patient', color: 'bg-blue-100 text-blue-700' }
  ]);

  const allDiagnoses = ['URTI', 'Migraine', 'Hypertension', 'Diabetes', 'Gastritis', 'Asthma', 'Anemia'];
  const allMedicines = ['Paracetamol', 'Amoxicillin', 'Ibuprofen', 'Omeprazole', 'Amlodipine', 'Metformin'];

  useEffect(() => {
    applyFilters();
  }, [filters]);

  const applyFilters = async () => {
    try {
      setLoading(true);
      // In real implementation, would call API with filters
      // For now, use mock data
      setMockPatients();
    } catch (error) {
      console.error('Error applying filters:', error);
      addToast('Failed to filter patients', 'error');
    } finally {
      setLoading(false);
    }
  };

  const setMockPatients = () => {
    const mockData = [
      {
        id: 1,
        name: 'John Doe',
        age: 45,
        phone: '9876543210',
        diagnosis: ['Hypertension', 'Diabetes'],
        lastVisit: '2026-01-20',
        compliance: 'high',
        tags: ['VIP', 'Good Compliance']
      },
      {
        id: 2,
        name: 'Jane Smith',
        age: 32,
        phone: '9876543211',
        diagnosis: ['Migraine'],
        lastVisit: '2026-01-18',
        compliance: 'high',
        tags: ['New Patient']
      },
      {
        id: 3,
        name: 'Robert Johnson',
        age: 58,
        phone: '9876543212',
        diagnosis: ['Hypertension'],
        lastVisit: '2026-01-15',
        compliance: 'pending',
        tags: ['Needs Follow-up']
      },
      {
        id: 4,
        name: 'Emma Wilson',
        age: 28,
        phone: '9876543213',
        diagnosis: ['URTI', 'Gastritis'],
        lastVisit: '2026-01-10',
        compliance: 'low',
        tags: ['Complex Case']
      },
      {
        id: 5,
        name: 'Michael Brown',
        age: 65,
        phone: '9876543214',
        diagnosis: ['Diabetes', 'Hypertension'],
        lastVisit: '2026-01-20',
        compliance: 'high',
        tags: ['VIP']
      }
    ];

    // Apply filters
    let filtered = mockData;

    if (filters.searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        p.phone.includes(filters.searchQuery)
      );
    }

    if (filters.diagnoses.length > 0) {
      filtered = filtered.filter(p =>
        filters.diagnoses.some(d => p.diagnosis.includes(d))
      );
    }

    if (filters.ageFrom || filters.ageTo) {
      filtered = filtered.filter(p => p.age >= filters.ageFrom && p.age <= filters.ageTo);
    }

    if (filters.tags.length > 0) {
      filtered = filtered.filter(p =>
        filters.tags.some(t => p.tags.includes(t))
      );
    }

    if (filters.compliance !== 'all') {
      filtered = filtered.filter(p => p.compliance === filters.compliance);
    }

    setPatients(filtered);
  };

  const toggleDiagnosis = (diagnosis) => {
    setFilters({
      ...filters,
      diagnoses: filters.diagnoses.includes(diagnosis)
        ? filters.diagnoses.filter(d => d !== diagnosis)
        : [...filters.diagnoses, diagnosis]
    });
  };

  const toggleTag = (tag) => {
    setFilters({
      ...filters,
      tags: filters.tags.includes(tag)
        ? filters.tags.filter(t => t !== tag)
        : [...filters.tags, tag]
    });
  };

  const applySavedSearch = (search) => {
    setFilters({ ...filters, ...search.filters });
    addToast(`Applied search: ${search.name}`, 'success');
  };

  const saveCurrentSearch = () => {
    const name = prompt('Enter name for this search:');
    if (name) {
      setSavedSearches([...savedSearches, {
        id: Date.now(),
        name,
        filters: { ...filters }
      }]);
      addToast(`Search "${name}" saved successfully`, 'success');
    }
  };

  const clearFilters = () => {
    setFilters({
      searchQuery: '',
      diagnoses: [],
      medicines: [],
      dateFrom: '',
      dateTo: '',
      ageFrom: 0,
      ageTo: 150,
      tags: [],
      compliance: 'all'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <FiFilter size={32} />
            Patient Finder
          </h1>
          <p className="text-gray-600">Find and filter patients by various criteria</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Filters</h2>
                {(filters.searchQuery || filters.diagnoses.length || filters.tags.length) && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <FiX size={16} /> Clear
                  </button>
                )}
              </div>

              {/* Search Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Name/Phone</label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={filters.searchQuery}
                    onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Search..."
                  />
                </div>
              </div>

              {/* Diagnoses Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Diagnoses</label>
                <div className="space-y-2">
                  {allDiagnoses.map(diagnosis => (
                    <label key={diagnosis} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.diagnoses.includes(diagnosis)}
                        onChange={() => toggleDiagnosis(diagnosis)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">{diagnosis}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Age Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Age Range</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="0"
                    max="150"
                    value={filters.ageFrom}
                    onChange={(e) => setFilters({ ...filters, ageFrom: parseInt(e.target.value) })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="From"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    min="0"
                    max="150"
                    value={filters.ageTo}
                    onChange={(e) => setFilters({ ...filters, ageTo: parseInt(e.target.value) })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    placeholder="To"
                  />
                </div>
              </div>

              {/* Compliance Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Compliance</label>
                <select
                  value={filters.compliance}
                  onChange={(e) => setFilters({ ...filters, compliance: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="high">High</option>
                  <option value="low">Low</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              {/* Tags Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <div className="space-y-2">
                  {availableTags.map(tag => (
                    <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.tags.includes(tag.name)}
                        onChange={() => toggleTag(tag.name)}
                        className="rounded"
                      />
                      <span className={`text-xs px-2 py-1 rounded ${tag.color}`}>{tag.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Save Search Button */}
              <button
                onClick={saveCurrentSearch}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2"
              >
                <FiSave size={16} /> Save Search
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Saved Searches */}
            {savedSearches.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Quick Searches</h3>
                <div className="flex flex-wrap gap-2">
                  {savedSearches.map(search => (
                    <button
                      key={search.id}
                      onClick={() => applySavedSearch(search)}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium"
                    >
                      {search.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Results */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Results ({patients.length} patients)
              </h3>

              {loading ? (
                <div className="text-center text-gray-500 py-8">Loading...</div>
              ) : patients.length > 0 ? (
                <div className="space-y-3">
                  {patients.map(patient => (
                    <div key={patient.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{patient.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Age: {patient.age} • Phone: {patient.phone} • Last Visit: {patient.lastVisit}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {patient.diagnosis.map(dx => (
                              <span key={dx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                {dx}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {patient.tags.map(tag => {
                            const tagDef = availableTags.find(t => t.name === tag);
                            return (
                              <span key={tag} className={`px-2 py-1 rounded text-xs font-medium ${tagDef?.color}`}>
                                {tag}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <FiSearch size={32} className="mx-auto mb-2 text-gray-400" />
                  <p>No patients found matching your criteria</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedPatientFilter;
