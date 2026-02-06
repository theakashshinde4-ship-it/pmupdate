import PropTypes from 'prop-types';

export default function ActionButton({
  icon,
  label,
  description,
  onClick,
  variant = 'primary',
  disabled = false
}) {
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-700',
    secondary: 'bg-white hover:bg-gray-50 text-gray-800 border-gray-300',
    success: 'bg-green-600 hover:bg-green-700 text-white border-green-700'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        min-h-[88px] rounded-xl border-2 px-6 py-4
        flex items-center gap-4
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-95
        ${variantClasses[variant]}
        ${!disabled ? 'shadow-md hover:shadow-lg' : ''}
      `}
    >
      {icon && (
        <div className="text-4xl flex-shrink-0">
          {icon}
        </div>
      )}
      <div className="text-left flex-1">
        <div className="font-bold text-lg mb-1">{label}</div>
        {description && (
          <div className="text-sm opacity-90 font-normal">{description}</div>
        )}
      </div>
    </button>
  );
}

ActionButton.propTypes = {
  icon: PropTypes.node,
  label: PropTypes.string.isRequired,
  description: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'success']),
  disabled: PropTypes.bool
};
