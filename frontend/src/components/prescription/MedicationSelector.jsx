import React, { useState, useRef, useCallback } from 'react';
import { FiSearch, FiX, FiPlus } from 'react-icons/fi';
import { useToast } from '../../hooks/useToast';
import { useApiClient } from '../../api/client';

/**
 * WEEK 2 REFACTORING: MedicationSelector Component
 * Extracted from PrescriptionPad (originally ~400 lines)
 * 
 * Responsibilities:
 * - Search medications from 239K+ database
 * - Debounced search with autocomplete
 * - Display medication suggestions
 * - Select and add medications
 * - Show frequently prescribed
 */

const MedicationSelector = ({ 
  onMedicationSelected, 
  selectedMedications = [],
  doctorId = null 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [frequentlyPrescribed, setFrequentlyPrescribed] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef(null);
  const { api } = useApiClient();
  const { showToast } = useToast();

  // Debounced medication search
  const searchMedications = useCallback((query) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await api.get(`/api/medications/search`, {
          params: { q: query, limit: 10 }
        });
        setSuggestions(response.data || []);
        setShowSuggestions(true);
      } catch (error) {
        showToast('Failed to search medications', 'error');
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce
  }, [api, showToast]);

  // Fetch frequently prescribed medications
  React.useEffect(() => {
    const fetchFrequent = async () => {
      try {
        const response = await api.get(`/api/medications/frequently-prescribed`, {
          params: { doctorId, limit: 5 }
        });
        setFrequentlyPrescribed(response.data || []);
      } catch (error) {
        // Silently fail for frequently prescribed
        console.debug('Could not fetch frequently prescribed medications');
      }
    };

    fetchFrequent();
  }, [doctorId, api]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    searchMedications(value);
  };

  const handleSelectMedication = (medication) => {
    onMedicationSelected(medication);
    setSearchQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSelectFrequent = (medication) => {
    handleSelectMedication(medication);
  };

  const isAlreadySelected = (medId) => {
    return selectedMedications.some(m => m.id === medId);
  };

  return (
    <div className="medication-selector">
      <div className="search-container">
        <FiSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search medications (e.g., Paracetamol, Amoxicillin)..."
          value={searchQuery}
          onChange={handleSearch}
          onFocus={() => searchQuery && setShowSuggestions(true)}
          className="medication-search"
        />
        {searchQuery && (
          <button 
            onClick={() => {
              setSearchQuery('');
              setSuggestions([]);
            }}
            className="clear-btn"
          >
            <FiX />
          </button>
        )}
      </div>

      {/* Frequently Prescribed Pills */}
      {frequentlyPrescribed.length > 0 && !searchQuery && (
        <div className="frequently-prescribed">
          <label>Frequently Prescribed</label>
          <div className="pill-container">
            {frequentlyPrescribed.map(med => (
              <button
                key={med.id}
                onClick={() => handleSelectFrequent(med)}
                disabled={isAlreadySelected(med.id)}
                className="pill"
              >
                <FiPlus size={14} />
                {med.name} {med.strength}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {suggestions.map(med => (
            <div
              key={med.id}
              className={`suggestion-item ${isAlreadySelected(med.id) ? 'disabled' : ''}`}
              onClick={() => !isAlreadySelected(med.id) && handleSelectMedication(med)}
            >
              <div className="med-name">{med.name}</div>
              <div className="med-details">
                {med.strength} • {med.form}
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && <div className="loading">Searching...</div>}
      {showSuggestions && suggestions.length === 0 && !loading && searchQuery && (
        <div className="no-results">No medications found</div>
      )}
    </div>
  );
};

export default MedicationSelector;
