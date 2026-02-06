// =====================================================
// MY GENIE COMPONENT
// AI-Powered Medical Assistant UI
// =====================================================

import React, { useState, useCallback } from 'react';
import { FiLoader, FiCheck, FiAlertCircle, FiCopy } from 'react-icons/fi';
import { analyzeSymptoms, getAnalysisHistory } from '../services/myGenieService';
import './MyGenie.css';

export default function MyGenie({ 
  symptoms = [], 
  patientId, 
  age, 
  gender, 
  medicalHistory = [],
  allergies = [],
  language = 'en',
  onApplySuggestions 
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [error, setError] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Analyze symptoms using My Genie AI
  const handleAnalyzeSymptoms = useCallback(async () => {
    if (!symptoms || symptoms.length === 0) {
      setError('Please add at least one symptom');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const analysis = await analyzeSymptoms({
        symptoms,
        patient_id: patientId,
        age,
        gender,
        medical_history: medicalHistory,
        allergies,
        language
      });

      setSuggestions(analysis);
    } catch (err) {
      setError(err.message || 'Failed to analyze symptoms');
      console.error('Analysis error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [symptoms, patientId, age, gender, medicalHistory, allergies, language]);

  // Load analysis history
  const handleLoadHistory = useCallback(async () => {
    if (!patientId) return;

    setLoadingHistory(true);
    try {
      const data = await getAnalysisHistory(patientId);
      setHistory(data || []);
      setShowHistory(true);
    } catch (err) {
      setError('Failed to load history');
    } finally {
      setLoadingHistory(false);
    }
  }, [patientId]);

  // Copy suggestion to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  // Translate language name
  const getLanguageName = (code) => {
    const langs = {
      en: 'English',
      hi: 'हिंदी',
      mr: 'मराठी'
    };
    return langs[code] || code;
  };

  return (
    <div className="my-genie-container">
      <div className="genie-header">
        <h2>🧠 My Genie - AI Medical Assistant</h2>
        <p>AI-powered diagnosis suggestions based on symptoms</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="genie-error">
          <FiAlertCircle /> {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Analysis Button */}
      <div className="genie-controls">
        <button
          className="btn-analyze"
          onClick={handleAnalyzeSymptoms}
          disabled={isLoading || !symptoms || symptoms.length === 0}
        >
          {isLoading ? (
            <>
              <FiLoader className="spinner" /> Analyzing...
            </>
          ) : (
            '🔍 Analyze Symptoms'
          )}
        </button>

        {patientId && (
          <button
            className="btn-history"
            onClick={handleLoadHistory}
            disabled={loadingHistory}
          >
            {loadingHistory ? 'Loading...' : '📋 View History'}
          </button>
        )}
      </div>

      {/* Suggestions Display */}
      {suggestions && !showHistory && (
        <div className="genie-suggestions">
          <div className="suggestion-section">
            <h3>📋 Possible Diagnoses</h3>
            <div className="diagnosis-list">
              {suggestions.diagnoses && suggestions.diagnoses.length > 0 ? (
                suggestions.diagnoses.map((diagnosis, idx) => (
                  <div key={idx} className="diagnosis-item">
                    <span className="diagnosis-icon">
                      {idx === 0 && '🔴'}
                      {idx === 1 && '🟠'}
                      {idx === 2 && '🟡'}
                      {idx === 3 && '🟢'}
                    </span>
                    <span className="diagnosis-text">{diagnosis}</span>
                    <button
                      className="btn-copy"
                      onClick={() => copyToClipboard(diagnosis)}
                      title="Copy to clipboard"
                    >
                      <FiCopy />
                    </button>
                  </div>
                ))
              ) : (
                <p className="no-data">No diagnoses suggested</p>
              )}
            </div>
          </div>

          <div className="suggestion-section">
            <h3>💊 Recommended Medicines</h3>
            <div className="medicine-list">
              {suggestions.medicines && suggestions.medicines.length > 0 ? (
                suggestions.medicines.map((medicine, idx) => (
                  <div key={idx} className="medicine-item">
                    <div className="medicine-header">
                      <span className="medicine-icon">💊</span>
                      <span className="medicine-text">{medicine}</span>
                    </div>
                    <button
                      className="btn-copy"
                      onClick={() => copyToClipboard(medicine)}
                      title="Copy to clipboard"
                    >
                      <FiCopy />
                    </button>
                  </div>
                ))
              ) : (
                <p className="no-data">No medicines recommended</p>
              )}
            </div>
          </div>

          <div className="suggestion-section">
            <h3>🔬 Diagnostic Tests</h3>
            <div className="tests-list">
              {suggestions.tests && suggestions.tests.length > 0 ? (
                suggestions.tests.map((test, idx) => (
                  <div key={idx} className="test-item">
                    <span className="test-icon">🧪</span>
                    <span className="test-text">{test}</span>
                  </div>
                ))
              ) : (
                <p className="no-data">No tests recommended</p>
              )}
            </div>
          </div>

          <div className="suggestion-section">
            <h3>💡 General Advice</h3>
            <div className="advice-list">
              {suggestions.advice && suggestions.advice.length > 0 ? (
                suggestions.advice.map((advice, idx) => (
                  <div key={idx} className="advice-item">
                    <span className="advice-icon">✓</span>
                    <span className="advice-text">{advice}</span>
                  </div>
                ))
              ) : (
                <p className="no-data">No advice provided</p>
              )}
            </div>
          </div>

          {suggestions.followup && (
            <div className="suggestion-section">
              <h3>📅 Follow-up</h3>
              <p className="followup-text">{suggestions.followup}</p>
            </div>
          )}

          <div className="suggestion-footer">
            <p className="disclaimer">
              ⚠️ This is an AI-powered clinical decision support tool. 
              Please verify all suggestions with your medical knowledge and patient history.
            </p>
            {onApplySuggestions && (
              <button
                className="btn-apply"
                onClick={() => {
                  try {
                    // Call parent callback
                    onApplySuggestions(suggestions);

                    // Also call global bridge if available, normalize payload
                    const payload = {
                      symptoms: symptoms || [],
                      diagnoses: suggestions.diagnoses || [],
                      medications: (suggestions.medicines || []).map(m => ({ name: m })),
                      advice: Array.isArray(suggestions.advice) ? suggestions.advice.join('\n') : (suggestions.advice || ''),
                      followup: suggestions.followup || null
                    };

                    if (typeof window !== 'undefined' && window.applyMyGenieSuggestion) {
                      try {
                        window.applyMyGenieSuggestion(payload);
                      } catch (e) {
                        console.error('applyMyGenieSuggestion bridge failed', e);
                      }
                    }
                  } catch (e) {
                    console.error('Failed to apply suggestions', e);
                  }
                }}
              >
                ✓ Apply to Prescription
              </button>
            )}
          </div>
        </div>
      )}

      {/* History Display */}
      {showHistory && history.length > 0 && (
        <div className="genie-history">
          <div className="history-header">
            <h3>📋 Analysis History</h3>
            <button
              className="btn-close"
              onClick={() => setShowHistory(false)}
            >
              ✕
            </button>
          </div>
          <div className="history-list">
            {history.map((item, idx) => (
              <div key={idx} className="history-item">
                <div className="history-date">
                  {new Date(item.created_at).toLocaleDateString()}
                </div>
                <div className="history-content">
                  {item.analysis_result ? (
                    <pre className="history-data">
                      {typeof item.analysis_result === 'string'
                        ? item.analysis_result
                        : JSON.stringify(item.analysis_result, null, 2)}
                    </pre>
                  ) : (
                    <p>No data available</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showHistory && history.length === 0 && (
        <div className="no-history">
          <p>No analysis history found</p>
          <button
            className="btn-close"
            onClick={() => setShowHistory(false)}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
