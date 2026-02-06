import PropTypes from 'prop-types';

export default function VitalBadge({ icon, label, value, unit, alert = false }) {
  return (
    <div className={`
      inline-flex items-center gap-2 px-3 py-2 rounded-lg border
      ${alert
        ? 'bg-red-50 border-red-300 text-red-800'
        : 'bg-gray-50 border-gray-200 text-gray-700'
      }
    `}>
      {icon && <span className="text-lg">{icon}</span>}
      <div className="flex flex-col">
        <span className="text-xs font-medium opacity-70">{label}</span>
        <span className="text-sm font-bold">
          {value}
          {unit && <span className="text-xs font-normal ml-1">{unit}</span>}
        </span>
      </div>
    </div>
  );
}

VitalBadge.propTypes = {
  icon: PropTypes.node,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  unit: PropTypes.string,
  alert: PropTypes.bool
};
