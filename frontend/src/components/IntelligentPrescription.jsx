import React, { useState, useEffect, useCallback } from 'react';
import { useApiClient } from '../api/client';
import { useToast } from '../hooks/useToast';

const IntelligentPrescription = ({ patientId, onPrescriptionUpdate }) => {
  const api = useApiClient();
  const { addToast } = useToast();
  
  const [symptoms, setSymptoms] = useState([]);
  const [diagnoses, setDiagnoses] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState([]);
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [symptomSearch, setSymptomSearch] = useState('');
  const [diagnosisSearch, setDiagnosisSearch] = useState('');
  const [medicineSearch, setMedicineSearch] = useState('');
  const [symptomSearchResults, setSymptomSearchResults] = useState([]);
  const [diagnosisSearchResults, setDiagnosisSearchResults] = useState([]);
  const [medicineSearchResults, setMedicineSearchResults] = useState([]);
  
  // Search symptoms
  const searchSymptoms = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSymptomSearchResults([]);
      return;
    }
    
    try {
      const response = await api.get(`/api/medical/symptoms/search?q=${encodeURIComponent(query)}&limit=10`);
      if (response.data.success) {
        setSymptomSearchResults(response.data.data);
      } else {
        setSymptomSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching symptoms:', error);
      setSymptomSearchResults([]);
    }
  }, [api]);

  // Search diagnosis
  const searchDiagnosis = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setDiagnosisSearchResults([]);
      return;
    }
    
    try {
      const response = await api.get(`/api/medical/icd/search?q=${encodeURIComponent(query)}&type=all&limit=10`);
      if (response.data.success) {
        setDiagnosisSearchResults(response.data.data);
      } else {
        setDiagnosisSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching diagnosis:', error);
      setDiagnosisSearchResults([]);
    }
  }, [api]);

  // Search medicines
  const searchMedicines = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setMedicineSearchResults([]);
      return;
    }
    
    try {
      const response = await api.get(`/api/medicines/search?q=${encodeURIComponent(query)}&limit=10`);
      if (response.data.medicines) {
        setMedicineSearchResults(response.data.medicines);
      } else {
        setMedicineSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching medicines:', error);
      setMedicineSearchResults([]);
    }
  }, [api]);

  // Handle search input changes
  useEffect(() => {
    const timer = setTimeout(() => {
      searchSymptoms(symptomSearch);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [symptomSearch, searchSymptoms]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchDiagnosis(diagnosisSearch);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [diagnosisSearch, searchDiagnosis]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchMedicines(medicineSearch);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [medicineSearch, searchMedicines]);
  
  // Get diagnosis suggestions based on symptoms
  const getDiagnosisSuggestions = useCallback(async () => {
    if (symptoms.length === 0) return;
    
    setLoading(true);
    try {
      const symptomNames = symptoms.map(s => s.name);
      const response = await api.post('/api/medical/diagnosis/suggestions', {
        symptoms: symptomNames
      });
      
      if (response.data.success) {
        const allDiagnoses = [
          ...(response.data.data.icd10 || []),
          ...(response.data.data.icd11 || [])
        ];
        setDiagnoses(allDiagnoses);
      }
    } catch (error) {
      console.error('Error getting diagnosis suggestions:', error);
      addToast('Failed to get diagnosis suggestions', 'error');
    } finally {
      setLoading(false);
    }
  }, [symptoms, api, addToast]);
  
  // Get medicine suggestions based on symptoms or diagnosis
  const getMedicineSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      let response;
      
      if (selectedDiagnosis.length > 0) {
        // Get medicines based on selected diagnosis
        const diagnosisCodes = selectedDiagnosis.map(d => d.code);
        const diagnosisType = selectedDiagnosis[0]?.type;
        
        response = await api.post('/api/medical/medicines/suggestions', {
          diagnosisCodes,
          diagnosisType
        });
      } else if (symptoms.length > 0) {
        // Get medicines based on symptoms
        const symptomNames = symptoms.map(s => s.name);
        response = await api.post('/api/medical/medicines/suggestions', {
          symptoms: symptomNames
        });
      } else {
        setMedicines([]);
        return;
      }
      
      if (response.data.success) {
        setMedicines(response.data.data);
      }
    } catch (error) {
      console.error('Error getting medicine suggestions:', error);
      addToast('Failed to get medicine suggestions', 'error');
    } finally {
      setLoading(false);
    }
  }, [symptoms, selectedDiagnosis, api, addToast]);
  
  // Get dosage information for a medicine
  const getDosageInfo = useCallback(async (medicineName) => {
    try {
      const response = await api.get(`/api/medical/medicines/${encodeURIComponent(medicineName)}/dosage`);
      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Error getting dosage info:', error);
      return null;
    }
  }, [api]);
  
  // Auto-trigger diagnosis suggestions when symptoms change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (symptoms.length > 0) {
        getDiagnosisSuggestions();
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [symptoms, getDiagnosisSuggestions]);
  
  // Auto-trigger medicine suggestions when diagnosis changes
  useEffect(() => {
    const timer = setTimeout(() => {
      getMedicineSuggestions();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [selectedDiagnosis, getMedicineSuggestions]);
  
  const addSymptom = (symptom) => {
    if (!symptoms.find(s => s.id === symptom.id)) {
      setSymptoms([...symptoms, symptom]);
    }
  };
  
  const removeSymptom = (symptomId) => {
    setSymptoms(symptoms.filter(s => s.id !== symptomId));
  };
  
  const addDiagnosis = (diagnosis) => {
    if (!selectedDiagnosis.find(d => d.code === diagnosis.code)) {
      setSelectedDiagnosis([...selectedDiagnosis, diagnosis]);
    }
  };
  
  const removeDiagnosis = (diagnosisCode) => {
    setSelectedDiagnosis(selectedDiagnosis.filter(d => d.code !== diagnosisCode));
  };
  
  const addMedicine = (medicine) => {
    if (!selectedMedicines.find(m => m.name === medicine.name)) {
      setSelectedMedicines([...selectedMedicines, { ...medicine, dosage: '', frequency: '', duration: '' }]);
    }
  };
  
  const removeMedicine = (medicineName) => {
    setSelectedMedicines(selectedMedicines.filter(m => m.name !== medicineName));
  };
  
  const updateMedicineDosage = async (medicineName, field, value) => {
    const updatedMedicines = selectedMedicines.map(m => 
      m.name === medicineName ? { ...m, [field]: value } : m
    );
    setSelectedMedicines(updatedMedicines);
  };
  
  const savePrescription = () => {
    const prescription = {
      patientId,
      symptoms,
      diagnoses: selectedDiagnosis,
      medicines: selectedMedicines,
      createdAt: new Date().toISOString()
    };
    
    onPrescriptionUpdate?.(prescription);
    addToast('Prescription saved successfully', 'success');
  };
  
  return (
    <div className="space-y-6">
      {/* Symptoms Section */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-lg font-semibold mb-4">🩺 Symptoms</h3>
        
        <div className="space-y-3">
          {/* Symptom Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search symptoms (e.g., fever, headache, cough)..."
              value={symptomSearch}
              onChange={(e) => setSymptomSearch(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {symptomSearch && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
                {symptomSearchResults.length > 0 ? (
                  <div className="p-2">
                    {symptomSearchResults.map(symptom => (
                      <div
                        key={symptom.id}
                        onClick={() => {
                          addSymptom(symptom);
                          setSymptomSearch('');
                          setSymptomSearchResults([]);
                        }}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer rounded"
                      >
                        {symptom.name}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-2 text-gray-500">No symptoms found</div>
                )}
              </div>
            )}
          </div>
          
          {/* Selected Symptoms */}
          {symptoms.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {symptoms.map(symptom => (
                <span
                  key={symptom.id}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {symptom.name}
                  <button
                    onClick={() => removeSymptom(symptom.id)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        
        {symptoms.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 AI is analyzing symptoms to suggest possible diagnoses...
            </p>
          </div>
        )}
      </div>
      
      {/* Diagnosis Section */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-lg font-semibold mb-4">🔍 Diagnosis Suggestions</h3>
        
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Analyzing symptoms...</p>
          </div>
        ) : diagnoses.length > 0 ? (
          <div className="space-y-3">
            {/* Diagnosis Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search ICD codes (e.g., diabetes, hypertension)..."
                value={diagnosisSearch}
                onChange={(e) => setDiagnosisSearch(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {diagnosisSearch && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto z-10">
                  {diagnosisSearchResults.length > 0 ? (
                    <div className="p-2">
                      {diagnosisSearchResults.map(diagnosis => (
                        <div
                          key={diagnosis.code}
                          onClick={() => {
                            addDiagnosis(diagnosis);
                            setDiagnosisSearch('');
                            setDiagnosisSearchResults([]);
                          }}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer rounded"
                        >
                          {diagnosis.title || diagnosis.primary_description}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-2 text-gray-500">No diagnoses found</div>
                  )}
                </div>
              )}
            </div>
            
            {/* AI Suggested Diagnoses */}
            <div className="space-y-2">
              <p className="text-sm text-gray-600">AI suggested based on symptoms:</p>
              {diagnoses.map(diagnosis => (
                <div
                  key={diagnosis.code}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedDiagnosis.find(d => d.code === diagnosis.code)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    if (selectedDiagnosis.find(d => d.code === diagnosis.code)) {
                      removeDiagnosis(diagnosis.code);
                    } else {
                      addDiagnosis(diagnosis);
                    }
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{diagnosis.description}</div>
                      <div className="text-sm text-gray-500">{diagnosis.code}</div>
                      {diagnosis.shortDescription && (
                        <div className="text-sm text-gray-600 mt-1">{diagnosis.shortDescription}</div>
                      )}
                    </div>
                    <div className="text-xs px-2 py-1 bg-gray-100 rounded">
                      {diagnosis.type}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Add symptoms to get diagnosis suggestions</p>
          </div>
        )}
      </div>
      
      {/* Medicines Section */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-lg font-semibold mb-4">💊 Medicine Suggestions</h3>
        
        {medicines.length > 0 ? (
          <div className="space-y-3">
            {medicines.map(medicine => (
              <div key={medicine.name} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold">{medicine.name}</h4>
                    {medicine.brandName && (
                      <p className="text-sm text-gray-600">Brand: {medicine.brandName}</p>
                    )}
                    {medicine.strength && (
                      <p className="text-sm text-gray-600">Strength: {medicine.strength}</p>
                    )}
                    {medicine.dosageForm && (
                      <p className="text-sm text-gray-600">Form: {medicine.dosageForm}</p>
                    )}
                  </div>
                  <button
                    onClick={() => addMedicine(medicine)}
                    className={`px-3 py-1 rounded text-sm ${
                      selectedMedicines.find(m => m.name === medicine.name)
                        ? 'bg-green-600 text-white'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {selectedMedicines.find(m => m.name === medicine.name) ? 'Added' : 'Add'}
                  </button>
                </div>
                
                {medicine.isFirstLine && (
                  <div className="mb-2">
                    <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      First-line treatment
                    </span>
                  </div>
                )}
                
                {medicine.indication && (
                  <p className="text-sm text-gray-600 mb-2">Indication: {medicine.indication}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Add diagnosis or symptoms to get medicine suggestions</p>
          </div>
        )}
      </div>
      
      {/* Selected Medicines */}
      {selectedMedicines.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-lg font-semibold mb-4">📋 Prescription</h3>
          
          <div className="space-y-4">
            {selectedMedicines.map(medicine => (
              <div key={medicine.name} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold">{medicine.name}</h4>
                    {medicine.brandName && (
                      <p className="text-sm text-gray-600">Brand: {medicine.brandName}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeMedicine(medicine.name)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                    <input
                      type="text"
                      placeholder="e.g., 500mg"
                      value={medicine.dosage || ''}
                      onChange={(e) => updateMedicineDosage(medicine.name, 'dosage', e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                    <select
                      value={medicine.frequency || ''}
                      onChange={(e) => updateMedicineDosage(medicine.name, 'frequency', e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select frequency</option>
                      <option value="Once daily">Once daily</option>
                      <option value="Twice daily">Twice daily</option>
                      <option value="Three times daily">Three times daily</option>
                      <option value="Four times daily">Four times daily</option>
                      <option value="As needed">As needed</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                    <input
                      type="text"
                      placeholder="e.g., 7 days"
                      value={medicine.duration || ''}
                      onChange={(e) => updateMedicineDosage(medicine.name, 'duration', e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={savePrescription}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Save Prescription
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntelligentPrescription;
