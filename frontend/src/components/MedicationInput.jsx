/**
 * MedicationInput Component
 * Smart medication autocomplete with suggestions from database
 * 
 * Features:
 * - Real-time search from medications database
 * - Dosage suggestions
 * - Frequency templates
 * - Brand alternatives
 * - Allergy warnings
 * - Recently used medications
 */

import React, { useState, useCallback, useMemo } from 'react';
import { FiSearch, FiX, FiChevronDown } from 'react-icons/fi';
import { useApiClient } from '../api/client';
import './MedicationInput.css';

const MedicationInput = ({
  onAddMedication,
  existingMedications = [],
  patientAllergies = [],
  recentMedications = []
}) => {
  const api = useApiClient();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Once daily');
  const [duration, setDuration] = useState('');
  const [instructions, setInstructions] = useState('');

  const frequencyOptions = [
    'Once daily',
    'Twice daily',
    'Thrice daily',
    'Every 4 hours',
    'Every 6 hours',
    'Every 8 hours',
    'Every 12 hours',
    'As needed',
    'At bedtime'
  ];

  const durationOptions = [
    '3 days',
    '5 days',
    '7 days',
    '10 days',
    '14 days',
    '30 days',
    '60 days',
    'Till relief',
    'As prescribed'
  ];

  // Search medications from API
  const searchMedications = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await api.get('/api/medications/search', {
        params: { q: query, limit: 15 }
      });

      const meds = response.data.medications || [];
      
      // Filter out duplicates and existing medications
      const existingNames = existingMedications.map(m => 
        `${m.name}|${m.dosage}`.toLowerCase()
      );

      const filtered = meds.filter(med => {
        const key = `${med.name}|${med.form}`.toLowerCase();
        return !existingNames.includes(key);
      });

      setSuggestions(filtered);
    } catch (error) {
      console.error('Search error:', error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, [api, existingMedications]);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      searchMedications(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchMedications]);

  // Check for allergy conflicts
  const allergyConflicts = useMemo(() => {
    if (!selectedMedication) return [];

    const normalize = (str) => str?.toLowerCase().replace(/\s+/g, '') || '';
    const medName = normalize(selectedMedication.name);
    const medBrand = normalize(selectedMedication.brand);

    return patientAllergies.filter(allergy => {
      const allergyName = normalize(allergy.allergen_name);
      return medName.includes(allergyName) || allergyName.includes(medName) ||
             medBrand.includes(allergyName) || allergyName.includes(medBrand);
    });
  }, [selectedMedication, patientAllergies]);

  // Select medication from dropdown
  const handleSelectMedication = (med) => {
    setSelectedMedication(med);
    setSearchQuery(med.name);
    setDosage(med.strength || '');
    setFrequency(med.frequency || 'Once daily');
    setShowDropdown(false);
  };

  // Add medication to prescription
  const handleAddMedication = () => {
    if (!selectedMedication) {
      alert('Please select a medication');
      return;
    }

    if (allergyConflicts.length > 0) {
      const confirm = window.confirm(
        `⚠️ Allergy warning!\n\n${allergyConflicts.map(a => a.allergen_name).join(', ')}\n\nContinue anyway?`
      );
      if (!confirm) return;
    }

    const medication = {
      id: selectedMedication.id,
      name: selectedMedication.name,
      brand: selectedMedication.brand,
      composition: selectedMedication.composition,
      dosage: dosage || selectedMedication.strength,
      frequency,
      duration,
      instructions,
      form: selectedMedication.form
    };

    onAddMedication(medication);

    // Reset form
    setSelectedMedication(null);
    setSearchQuery('');
    setDosage('');
    setFrequency('Once daily');
    setDuration('');
    setInstructions('');
    setSuggestions([]);
  };

  // Get medication alternatives
  const handleGetAlternatives = async () => {
    if (!selectedMedication) return;

    try {
      const response = await api.get(`/api/medications/${selectedMedication.id}/alternatives`);
      setSuggestions(response.data.alternatives || []);
    } catch (error) {
      console.error('Error getting alternatives:', error);
    }
  };

  return (
    <div className="medication-input-component">
      <div className="med-input-container">
        {/* Search Field */}
        <div className="search-field">
          <FiSearch className="search-icon" />
          <input
            type="text"
            id="medication-search"
            name="medication_search"
            placeholder="Search medication by name (e.g., Paracetamol, Amoxicillin)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            className="medication-search-input"
          />
          {isSearching && <span className="search-spinner">⏳</span>}
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSuggestions([]);
              }}
              className="clear-button"
            >
              <FiX />
            </button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showDropdown && (
          <div className="suggestions-dropdown">
            {isSearching && <div className="loading">Searching medications...</div>}

            {suggestions.length > 0 ? (
              <div className="suggestions-list">
                {suggestions.map((med, idx) => (
                  <button
                    key={`${med.id || idx}`}
                    type="button"
                    onClick={() => handleSelectMedication(med)}
                    className={`suggestion-item ${selectedMedication?.id === med.id ? 'selected' : ''}`}
                  >
                    <div className="med-name-brand">
                      <strong>{med.name}</strong>
                      {med.brand && <span className="brand">({med.brand})</span>}
                    </div>
                    <div className="med-details">
                      {med.composition && <span>{med.composition}</span>}
                      {med.strength && <span className="strength">{med.strength}</span>}
                      {med.category && <span className="category">{med.category}</span>}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              !isSearching && searchQuery.length >= 2 && (
                <div className="no-results">
                  No medications found for "{searchQuery}"
                </div>
              )
            )}

            {/* Recently Used */}
            {!searchQuery && recentMedications.length > 0 && (
              <div className="recently-used">
                <div className="section-title">Recently Used</div>
                {recentMedications.slice(0, 5).map((med, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSearchQuery(med.name);
                      handleSelectMedication(med);
                    }}
                    className="suggestion-item recent"
                  >
                    <strong>{med.name}</strong>
                    <small>{med.usage_count} times</small>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Selected Medication Details */}
        {selectedMedication && (
          <div className="selected-medication">
            <div className="med-header">
              <div>
                <h4>{selectedMedication.name}</h4>
                <p>{selectedMedication.composition || selectedMedication.category}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedMedication(null);
                  setSearchQuery('');
                }}
                className="btn-deselect"
              >
                <FiX />
              </button>
            </div>

            {/* Allergy Warning */}
            {allergyConflicts.length > 0 && (
              <div className="allergy-warning">
                <strong>⚠️ Allergy Alert!</strong>
                <p>{allergyConflicts.map(a => a.allergen_name).join(', ')}</p>
              </div>
            )}

            {/* Dosage & Frequency */}
            <div className="med-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Strength/Dosage</label>
                  <input
                    type="text"
                    id="medication-dosage"
                    name="medication_dosage"
                    placeholder={selectedMedication.strength || 'e.g., 500mg'}
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label>Frequency</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="form-control"
                  >
                    {frequencyOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="form-control"
                  >
                    <option value="">Select duration</option>
                    {durationOptions.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Special Instructions</label>
                <input
                  type="text"
                  id="medication-instructions"
                  name="medication_instructions"
                  placeholder="e.g., Take with food, After meals"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="form-control"
                />
              </div>

              {/* Action Buttons */}
              <div className="form-actions">
                <button
                  type="button"
                  onClick={handleAddMedication}
                  className="btn btn-primary"
                >
                  ✓ Add to Prescription
                </button>
                <button
                  type="button"
                  onClick={handleGetAlternatives}
                  className="btn btn-secondary"
                  title="Show alternative brands and generics"
                >
                  🔄 Alternatives
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicationInput;
