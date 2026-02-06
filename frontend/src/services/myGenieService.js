// =====================================================
// MY GENIE SERVICE
// Frontend API client for AI medical assistant
// =====================================================

const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Analyze symptoms and get diagnosis suggestions
 * @param {Object} data - Analysis parameters
 * @returns {Promise<Object>} Suggestions from AI
 */
export const analyzeSymptoms = async (data) => {
  try {
    const response = await fetch(`${API_BASE}/api/my-genie/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;

  } catch (error) {
    console.error('Error analyzing symptoms:', error);
    throw error;
  }
};

/**
 * Get analysis history for a patient
 * @param {number} patientId - Patient ID
 * @param {number} limit - Number of results (default 10)
 * @returns {Promise<Array>} Analysis history
 */
export const getAnalysisHistory = async (patientId, limit = 10) => {
  try {
    const response = await fetch(
      `${API_BASE}/api/my-genie/history/${patientId}?limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;

  } catch (error) {
    console.error('Error fetching analysis history:', error);
    throw error;
  }
};

/**
 * Apply suggestion to prescription
 * @param {number} suggestionId - Suggestion ID
 * @param {number} prescriptionId - Prescription ID
 * @returns {Promise<Object>} Result
 */
export const applySuggestion = async (suggestionId, prescriptionId) => {
  try {
    const response = await fetch(
      `${API_BASE}/api/my-genie/apply/${suggestionId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ prescription_id: prescriptionId })
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('Error applying suggestion:', error);
    throw error;
  }
};

/**
 * Get suggestion details
 * @param {number} suggestionId - Suggestion ID
 * @returns {Promise<Object>} Suggestion details
 */
export const getSuggestionDetails = async (suggestionId) => {
  try {
    const response = await fetch(
      `${API_BASE}/api/my-genie/suggestion/${suggestionId}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data;

  } catch (error) {
    console.error('Error fetching suggestion details:', error);
    throw error;
  }
};
