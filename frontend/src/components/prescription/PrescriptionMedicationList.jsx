import React, { useState } from 'react';
import { FiX, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useToast } from '../../hooks/useToast';

/**
 * WEEK 2 REFACTORING: PrescriptionMedicationList Component
 * Extracted from PrescriptionPad (originally ~500 lines)
 * 
 * Responsibilities:
 * - Display added medications in a table
 * - Edit dosage, frequency, duration
 * - Show dosage warnings/errors from validator
 * - Remove medications
 * - Validate inputs before saving
 */

const PrescriptionMedicationList = ({ 
  medications = [],
  onUpdateMedication,
  onRemoveMedication,
  validationWarnings = {}
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const { showToast } = useToast();

  const frequencyOptions = ['Once daily', 'Twice daily', 'Thrice daily', 'Four times daily', 'As needed'];
  const durationOptions = [1, 3, 5, 7, 10, 14, 21, 30];

  const handleEdit = (medication) => {
    setEditingId(medication.id);
    setEditData({
      dose: medication.dose,
      unit: medication.unit || 'mg',
      frequency: medication.frequency,
      duration: medication.duration,
      instructions: medication.instructions || ''
    });
  };

  const handleSaveEdit = (medicationId) => {
    // Validate dose
    const dose = parseFloat(editData.dose);
    if (isNaN(dose) || dose <= 0) {
      showToast('Invalid dose', 'error');
      return;
    }

    onUpdateMedication(medicationId, {
      dose: editData.dose,
      unit: editData.unit,
      frequency: editData.frequency,
      duration: editData.duration,
      instructions: editData.instructions
    });

    setEditingId(null);
    setEditData({});
    showToast('Medication updated', 'success');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const getWarnings = (medId) => {
    return validationWarnings[medId] || [];
  };

  if (medications.length === 0) {
    return (
      <div className="empty-medications">
        <p>No medications added yet. Search and select medications above.</p>
      </div>
    );
  }

  return (
    <div className="prescription-medications">
      <div className="medications-table-wrapper">
        <table className="medications-table">
          <thead>
            <tr>
              <th>Medication</th>
              <th>Dose</th>
              <th>Frequency</th>
              <th>Duration</th>
              <th>Instructions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {medications.map(med => (
              <React.Fragment key={med.id}>
                <tr className={editingId === med.id ? 'editing' : ''}>
                  <td className="med-name">
                    <div className="med-info">
                      <strong>{med.name}</strong>
                      <small>{med.strength}</small>
                    </div>
                  </td>
                  <td>
                    {editingId === med.id ? (
                      <div className="edit-dose">
                        <input
                          type="number"
                          value={editData.dose}
                          onChange={(e) => setEditData({...editData, dose: e.target.value})}
                          min="0"
                          step="0.1"
                        />
                        <select
                          value={editData.unit}
                          onChange={(e) => setEditData({...editData, unit: e.target.value})}
                        >
                          <option>mg</option>
                          <option>mcg</option>
                          <option>g</option>
                          <option>ml</option>
                          <option>units</option>
                        </select>
                      </div>
                    ) : (
                      <span>{med.dose} {med.unit || 'mg'}</span>
                    )}
                  </td>
                  <td>
                    {editingId === med.id ? (
                      <select
                        value={editData.frequency}
                        onChange={(e) => setEditData({...editData, frequency: e.target.value})}
                      >
                        {frequencyOptions.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    ) : (
                      <span>{med.frequency}</span>
                    )}
                  </td>
                  <td>
                    {editingId === med.id ? (
                      <select
                        value={editData.duration}
                        onChange={(e) => setEditData({...editData, duration: parseInt(e.target.value)})}
                      >
                        {durationOptions.map(d => (
                          <option key={d} value={d}>{d} days</option>
                        ))}
                      </select>
                    ) : (
                      <span>{med.duration} days</span>
                    )}
                  </td>
                  <td className="instructions">
                    {editingId === med.id ? (
                      <input
                        type="text"
                        value={editData.instructions}
                        onChange={(e) => setEditData({...editData, instructions: e.target.value})}
                        placeholder="Take after food..."
                        maxLength="100"
                      />
                    ) : (
                      <span>{med.instructions || '-'}</span>
                    )}
                  </td>
                  <td className="actions">
                    {editingId === med.id ? (
                      <div className="edit-actions">
                        <button onClick={() => handleSaveEdit(med.id)} className="btn-save">Save</button>
                        <button onClick={handleCancelEdit} className="btn-cancel">Cancel</button>
                      </div>
                    ) : (
                      <div className="action-buttons">
                        <button 
                          onClick={() => handleEdit(med)}
                          className="btn-icon edit"
                          title="Edit"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button 
                          onClick={() => onRemoveMedication(med.id)}
                          className="btn-icon delete"
                          title="Remove"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>

                {/* Warning Row */}
                {getWarnings(med.id).length > 0 && (
                  <tr className="warning-row">
                    <td colSpan="6">
                      <div className="warnings">
                        {getWarnings(med.id).map((warning, idx) => (
                          <div key={idx} className="warning-item">
                            ⚠️ {warning}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PrescriptionMedicationList;
