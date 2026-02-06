import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';

/**
 * WEEK 2 REFACTORING: PrescriptionNotesAndAdvice Component
 * Extracted from PrescriptionPad (originally ~300 lines)
 * 
 * Responsibilities:
 * - Display patient diagnosis and chief complaint
 * - Add prescription notes
 * - Select/add medical advice in multiple languages
 * - Display selected advice
 */

const predefinedAdvice = {
  en: [
    'Plenty of liquids',
    'Steaming and gargling',
    'Rest well',
    'Avoid spicy food',
    'Take medicines on time',
    'Follow up if symptoms persist',
    'Avoid strenuous activities',
    'Sleep adequately'
  ],
  hi: [
    'खूब सारे तरल पदार्थ लें',
    'भाप और गरारे करें',
    'अच्छे से आराम करें',
    'मसालेदार भोजन से बचें',
    'समय पर दवाई लें',
    'लक्षण बने रहने पर फॉलो-अप करें',
    'कठोर गतिविधियों से बचें',
    'पर्याप्त नींद लें'
  ],
  mr: [
    'भरपूर द्रव पदार्थ घ्या',
    'वाफ आणि गरारे करा',
    'चांगली विश्रांती घ्या',
    'मसालेदार अन्न टाळा',
    'वेळेवर औषध घ्या',
    'लक्षणे कायम राहिल्यास फॉलो-अप करा',
    'कठोर व्यायाम टाळा',
    'पुरेशी झोप घ्या'
  ]
};

const PrescriptionNotesAndAdvice = ({
  diagnosis = '',
  chiefComplaint = '',
  notes = '',
  selectedAdvice = [],
  adviceLanguage = 'en',
  onDiagnosisChange,
  onNotesChange,
  onAdviceToggle,
  onLanguageChange,
  onAddCustomAdvice
}) => {
  const [customAdviceInput, setCustomAdviceInput] = useState('');

  const handleAddCustomAdvice = () => {
    if (customAdviceInput.trim()) {
      onAddCustomAdvice(customAdviceInput);
      setCustomAdviceInput('');
    }
  };

  const toggleAdvice = (advice) => {
    onAdviceToggle(advice);
  };

  const isAdviceSelected = (advice) => {
    return selectedAdvice.includes(advice);
  };

  return (
    <div className="notes-advice-section">
      <div className="section-header">
        <h3>Diagnosis, Notes & Advice</h3>
      </div>

      {/* Chief Complaint Display */}
      {chiefComplaint && (
        <div className="chief-complaint-display">
          <label>Chief Complaint</label>
          <div className="display-value">{chiefComplaint}</div>
        </div>
      )}

      {/* Diagnosis */}
      <div className="form-group">
        <label htmlFor="diagnosis">Diagnosis (ICD-10/11)</label>
        <input
          id="diagnosis"
          type="text"
          value={diagnosis}
          onChange={(e) => onDiagnosisChange(e.target.value)}
          placeholder="Enter diagnosis code or description"
          maxLength="200"
        />
        <small>{diagnosis.length}/200</small>
      </div>

      {/* Prescription Notes */}
      <div className="form-group">
        <label htmlFor="notes">Additional Notes</label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Any special instructions or notes for the patient..."
          maxLength="500"
          rows="3"
        />
        <small>{notes.length}/500</small>
      </div>

      {/* Advice Section */}
      <div className="advice-section">
        <div className="advice-header">
          <label>Medical Advice</label>
          <select 
            value={adviceLanguage}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="language-selector"
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
            <option value="mr">मराठी</option>
          </select>
        </div>

        {/* Predefined Advice Buttons */}
        <div className="predefined-advice">
          {predefinedAdvice[adviceLanguage].map((advice, idx) => (
            <button
              key={idx}
              onClick={() => toggleAdvice(advice)}
              className={`advice-btn ${isAdviceSelected(advice) ? 'selected' : ''}`}
            >
              {advice}
              {isAdviceSelected(advice) && <span className="checkmark">✓</span>}
            </button>
          ))}
        </div>

        {/* Custom Advice Input */}
        <div className="custom-advice">
          <input
            type="text"
            value={customAdviceInput}
            onChange={(e) => setCustomAdviceInput(e.target.value)}
            placeholder="Add custom advice..."
            onKeyPress={(e) => e.key === 'Enter' && handleAddCustomAdvice()}
            maxLength="100"
          />
          <button onClick={handleAddCustomAdvice} className="btn-add">Add</button>
        </div>

        {/* Selected Advice List */}
        {selectedAdvice.length > 0 && (
          <div className="selected-advice-list">
            <label>Selected Advice</label>
            <div className="advice-tags">
              {selectedAdvice.map((advice, idx) => (
                <div key={idx} className="advice-tag">
                  {advice}
                  <button
                    onClick={() => toggleAdvice(advice)}
                    className="remove-tag"
                  >
                    <FiX size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescriptionNotesAndAdvice;
