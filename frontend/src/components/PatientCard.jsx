import PropTypes from 'prop-types';
import VIPBadge from './VIPBadge';
import VitalBadge from './VitalBadge';

export default function PatientCard({ patient, onClick, isDragging = false }) {
  const {
    id,
    name,
    age,
    gender,
    token_number,
    is_vip,
    vip_tier,
    waiting_time,
    chief_complaint,
    vitals
  } = patient;

  // Calculate waiting time color
  const getWaitingTimeColor = (minutes) => {
    if (minutes < 15) return 'text-green-600';
    if (minutes < 30) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-lg border-2 border-gray-200 p-4
        hover:border-blue-400 hover:shadow-md
        cursor-pointer transition-all duration-200
        ${isDragging ? 'opacity-50 scale-95' : ''}
        ${is_vip ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}
      `}
    >
      {/* Header - Token & VIP */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-blue-600">#{token_number}</span>
          {is_vip && <VIPBadge tier={vip_tier} />}
        </div>
        {waiting_time !== undefined && (
          <div className={`text-xs font-semibold ${getWaitingTimeColor(waiting_time)}`}>
            {waiting_time} min
          </div>
        )}
      </div>

      {/* Patient Info */}
      <div className="mb-3">
        <h3 className="font-bold text-lg text-gray-900 mb-1">{name}</h3>
        <div className="flex gap-3 text-sm text-gray-600">
          <span>{age}y</span>
          <span>•</span>
          <span>{gender === 'M' ? '♂️ Male' : gender === 'F' ? '♀️ Female' : gender}</span>
        </div>
      </div>

      {/* Chief Complaint */}
      {chief_complaint && (
        <div className="mb-3">
          <p className="text-sm text-gray-700 line-clamp-2">
            <span className="font-semibold">CC: </span>
            {chief_complaint}
          </p>
        </div>
      )}

      {/* Vitals */}
      {vitals && (
        <div className="flex flex-wrap gap-2">
          {vitals.bp && (
            <VitalBadge
              icon="💓"
              label="BP"
              value={vitals.bp}
              unit="mmHg"
              alert={vitals.bp_alert}
            />
          )}
          {vitals.temp && (
            <VitalBadge
              icon="🌡️"
              label="Temp"
              value={vitals.temp}
              unit="°F"
              alert={vitals.temp_alert}
            />
          )}
          {vitals.spo2 && (
            <VitalBadge
              icon="🫁"
              label="SpO2"
              value={vitals.spo2}
              unit="%"
              alert={vitals.spo2_alert}
            />
          )}
        </div>
      )}
    </div>
  );
}

PatientCard.propTypes = {
  patient: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    age: PropTypes.number,
    gender: PropTypes.string,
    token_number: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    is_vip: PropTypes.bool,
    vip_tier: PropTypes.string,
    waiting_time: PropTypes.number,
    chief_complaint: PropTypes.string,
    vitals: PropTypes.shape({
      bp: PropTypes.string,
      bp_alert: PropTypes.bool,
      temp: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      temp_alert: PropTypes.bool,
      spo2: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      spo2_alert: PropTypes.bool
    })
  }).isRequired,
  onClick: PropTypes.func,
  isDragging: PropTypes.bool
};
