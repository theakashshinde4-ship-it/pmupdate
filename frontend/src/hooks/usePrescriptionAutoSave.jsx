import { useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import useToast from './useToast';

/**
 * Auto-save prescription draft every 30 seconds
 *
 * Usage:
 * const { saveDraft, loadDraft, clearDraft } = usePrescriptionAutoSave({
 *   patientId: 123,
 *   formData: prescriptionData,
 *   enabled: true
 * });
 */
export default function usePrescriptionAutoSave({
  patientId,
  doctorId,
  formData,
  enabled = true,
  interval = 30000 // 30 seconds
}) {
  const { showToast } = useToast();
  const lastSavedRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  const isSavingRef = useRef(false);

  // Save draft to backend
  const saveDraft = useCallback(async (data = formData) => {
    if (!patientId || !data || isSavingRef.current) {
      return;
    }

    try {
      isSavingRef.current = true;

      const draftData = {
        patient_id: patientId,
        doctor_id: doctorId,
        chief_complaint: data.chiefComplaint || data.chief_complaint,
        diagnosis: data.diagnosis,
        medications: data.medications || data.items || [],
        investigations: data.investigations || data.labs || [],
        advice: data.advice,
        follow_up_date: data.followUpDate || data.follow_up_date,
        notes: data.notes
      };

      await api.post('/api/prescriptions/draft', draftData);

      lastSavedRef.current = new Date();
      console.log('Draft auto-saved at', lastSavedRef.current.toLocaleTimeString());

      // Silent save - no toast notification to avoid annoying user
      // showToast('Draft saved', 'success');
    } catch (error) {
      console.error('Auto-save failed:', error);
      // Only show error if it's not a network issue
      if (error.response?.status !== 401) {
        // showToast('Failed to auto-save draft', 'error');
      }
    } finally {
      isSavingRef.current = false;
    }
  }, [patientId, doctorId, formData, showToast]);

  // Load draft from backend
  const loadDraft = useCallback(async () => {
    if (!patientId) {
      return null;
    }

    try {
      const params = { patient_id: patientId };
      if (doctorId) {
        params.doctor_id = doctorId;
      }

      const response = await api.get('/api/prescriptions/draft', { params });

      if (response.data?.draft) {
        console.log('Draft loaded:', response.data.draft);
        showToast('Previous draft loaded', 'info');
        return response.data.draft;
      }

      return null;
    } catch (error) {
      console.error('Failed to load draft:', error);
      return null;
    }
  }, [patientId, doctorId, showToast]);

  // Clear draft from backend
  const clearDraft = useCallback(async (draftId) => {
    if (!draftId) {
      return;
    }

    try {
      await api.delete(`/api/prescriptions/draft/${draftId}`);
      console.log('Draft cleared');
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  }, []);

  // Auto-save effect
  useEffect(() => {
    if (!enabled || !patientId) {
      return;
    }

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
    }

    // Set up auto-save interval
    autoSaveTimerRef.current = setInterval(() => {
      saveDraft();
    }, interval);

    // Cleanup
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [enabled, patientId, interval, saveDraft]);

  // Save on unmount (when leaving page)
  useEffect(() => {
    return () => {
      if (enabled && patientId && formData) {
        // Final save before unmounting
        saveDraft(formData);
      }
    };
  }, []); // Empty deps - only run on unmount

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    lastSaved: lastSavedRef.current
  };
}
