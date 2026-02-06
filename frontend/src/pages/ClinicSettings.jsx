import React, { useState, useEffect } from 'react';
import { FiSave, FiX, FiGlobe, FiSliders } from 'react-icons/fi';
import { useApiClient } from '../api/client';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';

/**
 * Clinic Settings & Doctor Preferences
 * Customize clinic info, doctor preferences, prescription defaults
 */
const ClinicSettings = () => {
  const api = useApiClient();
  const { addToast } = useToast();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('clinic'); // clinic, doctor, defaults
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Clinic Settings
  const [clinic, setClinic] = useState({
    name: 'My Clinic',
    address: '123 Main Street',
    city: 'Mumbai',
    phone: '9876543210',
    email: 'clinic@example.com',
    licenseNumber: 'MC12345',
    specialties: ['General', 'Internal Medicine'],
    hours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '14:00', closed: false },
      sunday: { open: '09:00', close: '18:00', closed: true }
    }
  });

  // Doctor Preferences
  const [preferences, setPreferences] = useState({
    language: 'en', // en, hi, mr
    theme: 'light',
    defaultFollowUpDays: 5,
    defaultAdvice: [
      'Rest well',
      'Take medicines on time',
      'Drink plenty of water',
      'Avoid spicy food'
    ],
    keyboardShortcutsEnabled: true,
    autoSaveEnabled: true,
    soundNotifications: true
  });

  // Prescription Defaults
  const [defaults, setDefaults] = useState({
    followUpDays: 5,
    defaultAdvice: 'Rest well, take medicines on time, drink plenty of water',
    defaultInvestigations: ['CBC', 'Lipid Profile'],
    defaultPrecautions: 'Avoid spicy food, alcohol, smoking',
    defaultDiet: 'Light diet, plenty of fluids',
    enableAutoSuggest: true,
    enableVoiceInput: true,
    enableDrugInteractionCheck: true
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // In real implementation, fetch from API
      // For now, use mock data
      addToast('Settings loaded successfully', 'success');
    } catch (error) {
      console.error('Error fetching settings:', error);
      addToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveClinicSettings = async () => {
    try {
      setSaving(true);
      // API call would go here
      // await api.put('/api/clinic-settings', clinic);
      addToast('Clinic settings saved successfully', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      addToast('Failed to save clinic settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveDoctorPreferences = async () => {
    try {
      setSaving(true);
      // API call would go here
      // await api.put('/api/doctor-preferences', preferences);
      addToast('Preferences saved successfully', 'success');
    } catch (error) {
      console.error('Error saving preferences:', error);
      addToast('Failed to save preferences', 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveDefaults = async () => {
    try {
      setSaving(true);
      // API call would go here
      // await api.put('/api/prescription-defaults', defaults);
      addToast('Prescription defaults saved successfully', 'success');
    } catch (error) {
      console.error('Error saving defaults:', error);
      addToast('Failed to save prescription defaults', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <FiSliders size={32} />
            Settings & Preferences
          </h1>
          <p className="text-gray-600">Customize your clinic and doctor preferences</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-white rounded-lg shadow-md p-2">
          {[
            { id: 'clinic', label: '🏥 Clinic Settings' },
            { id: 'doctor', label: '👨‍⚕️ Doctor Preferences' },
            { id: 'defaults', label: '📋 Prescription Defaults' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Clinic Settings Tab */}
        {activeTab === 'clinic' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Clinic Information</h2>

            <div className="space-y-4 mb-8">
              {/* Clinic Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Clinic Name *</label>
                <input
                  type="text"
                  value={clinic.name}
                  onChange={(e) => setClinic({ ...clinic, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your clinic name"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  value={clinic.address}
                  onChange={(e) => setClinic({ ...clinic, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Street address"
                />
              </div>

              {/* City */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    value={clinic.city}
                    onChange={(e) => setClinic({ ...clinic, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">License Number</label>
                  <input
                    type="text"
                    value={clinic.licenseNumber}
                    onChange={(e) => setClinic({ ...clinic, licenseNumber: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="License #"
                  />
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={clinic.phone}
                    onChange={(e) => setClinic({ ...clinic, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={clinic.email}
                    onChange={(e) => setClinic({ ...clinic, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Email"
                  />
                </div>
              </div>
            </div>

            {/* Clinic Hours */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Clinic Hours</h3>
              <div className="space-y-2">
                {Object.entries(clinic.hours).map(([day, hours]) => (
                  <div key={day} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <label className="w-20 font-medium text-gray-700 capitalize">{day}</label>
                    <input
                      type="time"
                      value={hours.open}
                      onChange={(e) =>
                        setClinic({
                          ...clinic,
                          hours: {
                            ...clinic.hours,
                            [day]: { ...hours, open: e.target.value }
                          }
                        })
                      }
                      disabled={hours.closed}
                      className="px-3 py-1 border border-gray-300 rounded disabled:bg-gray-200"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="time"
                      value={hours.close}
                      onChange={(e) =>
                        setClinic({
                          ...clinic,
                          hours: {
                            ...clinic.hours,
                            [day]: { ...hours, close: e.target.value }
                          }
                        })
                      }
                      disabled={hours.closed}
                      className="px-3 py-1 border border-gray-300 rounded disabled:bg-gray-200"
                    />
                    <label className="ml-auto flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={hours.closed}
                        onChange={(e) =>
                          setClinic({
                            ...clinic,
                            hours: {
                              ...clinic.hours,
                              [day]: { ...hours, closed: e.target.checked }
                            }
                          })
                        }
                        className="rounded"
                      />
                      <span className="text-sm text-gray-600">Closed</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => fetchSettings()}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Reset
              </button>
              <button
                onClick={saveClinicSettings}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <FiSave size={18} />
                Save Clinic Settings
              </button>
            </div>
          </div>
        )}

        {/* Doctor Preferences Tab */}
        {activeTab === 'doctor' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Doctor Preferences</h2>

            <div className="space-y-4 mb-8">
              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <FiGlobe size={18} /> Preferred Language
                </label>
                <select
                  value={preferences.language}
                  onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="mr">मराठी (Marathi)</option>
                </select>
              </div>

              {/* Theme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                <select
                  value={preferences.theme}
                  onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto (System)</option>
                </select>
              </div>

              {/* Default Follow-up Days */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Default Follow-up Days</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={preferences.defaultFollowUpDays}
                  onChange={(e) => setPreferences({ ...preferences, defaultFollowUpDays: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Feature Toggles */}
              <div className="space-y-3 border-t border-gray-200 pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.keyboardShortcutsEnabled}
                    onChange={(e) => setPreferences({ ...preferences, keyboardShortcutsEnabled: e.target.checked })}
                    className="rounded w-5 h-5"
                  />
                  <span className="text-gray-700">Enable Keyboard Shortcuts</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.autoSaveEnabled}
                    onChange={(e) => setPreferences({ ...preferences, autoSaveEnabled: e.target.checked })}
                    className="rounded w-5 h-5"
                  />
                  <span className="text-gray-700">Auto-save Prescriptions</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.soundNotifications}
                    onChange={(e) => setPreferences({ ...preferences, soundNotifications: e.target.checked })}
                    className="rounded w-5 h-5"
                  />
                  <span className="text-gray-700">Sound Notifications</span>
                </label>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => fetchSettings()}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Reset
              </button>
              <button
                onClick={saveDoctorPreferences}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <FiSave size={18} />
                Save Preferences
              </button>
            </div>
          </div>
        )}

        {/* Prescription Defaults Tab */}
        {activeTab === 'defaults' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Prescription Defaults</h2>

            <div className="space-y-4 mb-8">
              {/* Default Follow-up */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Default Follow-up Days</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={defaults.followUpDays}
                  onChange={(e) => setDefaults({ ...defaults, followUpDays: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Default Advice */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Default Advice</label>
                <textarea
                  value={defaults.defaultAdvice}
                  onChange={(e) => setDefaults({ ...defaults, defaultAdvice: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-24"
                  placeholder="Default advice for patients..."
                />
              </div>

              {/* Default Precautions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Default Precautions</label>
                <textarea
                  value={defaults.defaultPrecautions}
                  onChange={(e) => setDefaults({ ...defaults, defaultPrecautions: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-20"
                  placeholder="Default precautions..."
                />
              </div>

              {/* Default Diet */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Default Diet Advice</label>
                <textarea
                  value={defaults.defaultDiet}
                  onChange={(e) => setDefaults({ ...defaults, defaultDiet: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-20"
                  placeholder="Default diet recommendations..."
                />
              </div>

              {/* Feature Toggles */}
              <div className="space-y-3 border-t border-gray-200 pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={defaults.enableAutoSuggest}
                    onChange={(e) => setDefaults({ ...defaults, enableAutoSuggest: e.target.checked })}
                    className="rounded w-5 h-5"
                  />
                  <span className="text-gray-700">Enable Auto-Suggestions by Diagnosis</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={defaults.enableVoiceInput}
                    onChange={(e) => setDefaults({ ...defaults, enableVoiceInput: e.target.checked })}
                    className="rounded w-5 h-5"
                  />
                  <span className="text-gray-700">Enable Voice Input</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={defaults.enableDrugInteractionCheck}
                    onChange={(e) => setDefaults({ ...defaults, enableDrugInteractionCheck: e.target.checked })}
                    className="rounded w-5 h-5"
                  />
                  <span className="text-gray-700">Enable Drug Interaction Check</span>
                </label>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => fetchSettings()}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Reset
              </button>
              <button
                onClick={saveDefaults}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <FiSave size={18} />
                Save Defaults
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicSettings;
