import PropTypes from 'prop-types';
import PatientCard from './PatientCard';

export default function QueueColumn({
  title,
  patients,
  color,
  icon,
  onPatientClick,
  status,
  onDragStart,
  onDragEnd,
  onDrop,
  onDragOver,
  draggedItem
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-300',
    orange: 'bg-orange-50 border-orange-300',
    green: 'bg-green-50 border-green-300'
  };

  const headerColorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    orange: 'bg-orange-100 text-orange-800',
    green: 'bg-green-100 text-green-800'
  };

  return (
    <div
      className={`flex-1 min-w-[320px] rounded-xl border-2 ${colorClasses[color]} p-4`}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop?.(e, status)}
    >
      {/* Column Header */}
      <div className={`flex items-center justify-between mb-4 px-3 py-2 rounded-lg ${headerColorClasses[color]}`}>
        <div className="flex items-center gap-2">
          {icon && <span className="text-xl">{icon}</span>}
          <h2 className="font-bold text-lg">{title}</h2>
        </div>
        <span className="text-sm font-bold bg-white px-2 py-1 rounded-full">
          {patients.length}
        </span>
      </div>

      {/* Patient Cards */}
      <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
        {patients.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No patients</p>
          </div>
        ) : (
          patients.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              onClick={() => onPatientClick?.(patient)}
              draggable
              onDragStart={() => onDragStart?.(patient)}
              onDragEnd={onDragEnd}
              isDragging={draggedItem?.id === patient.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

QueueColumn.propTypes = {
  title: PropTypes.string.isRequired,
  patients: PropTypes.arrayOf(PropTypes.object).isRequired,
  color: PropTypes.oneOf(['blue', 'orange', 'green']).isRequired,
  icon: PropTypes.node,
  onPatientClick: PropTypes.func,
  status: PropTypes.string,
  onDragStart: PropTypes.func,
  onDragEnd: PropTypes.func,
  onDrop: PropTypes.func,
  onDragOver: PropTypes.func,
  draggedItem: PropTypes.object
};
