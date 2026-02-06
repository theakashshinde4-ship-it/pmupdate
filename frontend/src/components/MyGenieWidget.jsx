import React, { lazy, Suspense, useState } from 'react';
import './MyGenieWidget.css';

const MyGenie = lazy(() => import('./MyGenie'));

export default function MyGenieWidget({ symptoms, patientId, age, gender, language, onApply }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mygenie-widget">
      <div className="widget-header">
        <div>
          <h4>My Genie Quick Analysis</h4>
          <p className="muted">Run a quick AI analysis without leaving the dashboard</p>
        </div>
        <div className="widget-actions">
          <button className="btn-open" onClick={() => setOpen(true)}>Open</button>
        </div>
      </div>

      <div className="widget-body">
        <Suspense fallback={<div className="loader">Loading My Genie...</div>}>
          <MyGenie
            symptoms={symptoms}
            patientId={patientId}
            age={age}
            gender={gender}
            language={language}
            onApplySuggestions={onApply}
          />
        </Suspense>
      </div>

      {open && (
        <div className="mygenie-modal fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-backdrop absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="modal-content relative bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">My Genie</h3>
              <button className="text-gray-600" onClick={() => setOpen(false)}>Close</button>
            </div>
            <Suspense fallback={<div className="loader">Loading My Genie...</div>}>
              <MyGenie
                symptoms={symptoms}
                patientId={patientId}
                age={age}
                gender={gender}
                language={language}
                onApplySuggestions={(s) => {
                  if (typeof onApply === 'function') onApply(s);
                  // Close after apply to speed up workflow
                  setOpen(false);
                }}
              />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}
