import { 
  FiArrowUp, 
  FiArrowDown, 
  FiTrendingUp, 
  FiTrendingDown, 
  FiMoreHorizontal,
  FiCalendar,
  FiClock,
  FiUsers,
  FiDollarSign,
  FiActivity,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo
} from 'react-icons/fi';

export default function EnhancedCard({ 
  children, 
  title, 
  subtitle, 
  icon,
  trend,
  trendValue,
  footer,
  className = '',
  hover = true,
  loading = false,
  error = null,
  badge = null,
  actions = null
}) {
  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend) {
      case 'up':
        return <FiArrowUp className="text-green-500" />;
      case 'down':
        return <FiArrowDown className="text-red-500" />;
      case 'stable':
        return <FiTrendingUp className="text-blue-500" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    if (!trend) return '';
    
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'stable':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-8 bg-gray-200 rounded w-8"></div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-red-200 p-6 ${className}`}>
        <div className="flex items-center text-red-600">
          <FiAlertCircle className="mr-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''} ${className}`}>
      {/* Header */}
      {(title || icon || actions) && (
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                  {icon}
                </div>
              )}
              <div>
                {title && (
                  <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                )}
                {subtitle && (
                  <p className="text-sm text-gray-500">{subtitle}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {badge && (
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
                  {badge.label}
                </span>
              )}
              {actions && (
                <div className="relative">
                  <button
                    onClick={actions.onClick}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title={actions.title}
                  >
                    <FiMoreHorizontal size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-6 pb-4">
        {children}
      </div>

      {/* Trend indicator */}
      {trend && (
        <div className="px-6 pb-4">
          <div className={`flex items-center gap-2 text-sm ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{trendValue}</span>
            <span className="text-gray-500">vs last period</span>
          </div>
        </div>
      )}

      {/* Footer */}
      {footer && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
}

// Stat card component
export function StatCard({ 
  title, 
  value, 
  icon, 
  trend, 
  trendValue, 
  subtitle,
  color = 'blue',
  loading = false,
  error = null
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    indigo: 'bg-indigo-50 text-indigo-600'
  };

  return (
    <EnhancedCard
      title={title}
      subtitle={subtitle}
      icon={icon}
      trend={trend}
      trendValue={trendValue}
      loading={loading}
      error={error}
      className="h-full"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-2xl font-bold text-gray-900">{value}</div>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </EnhancedCard>
  );
}

// Activity card component
export function ActivityCard({ 
  title, 
  activities = [],
  loading = false,
  error = null,
  maxItems = 5
}) {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'appointment':
        return <FiCalendar className="text-blue-500" />;
      case 'patient':
        return <FiUsers className="text-green-500" />;
      case 'payment':
        return <FiDollarSign className="text-yellow-500" />;
      case 'clinical':
        return <FiActivity className="text-purple-500" />;
      case 'completed':
        return <FiCheckCircle className="text-green-500" />;
      default:
        return <FiInfo className="text-gray-500" />;
    }
  };

  return (
    <EnhancedCard
      title={title}
      loading={loading}
      error={error}
      className="h-full"
    >
      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No recent activity
          </div>
        ) : (
          activities.slice(0, maxItems).map((activity, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="mt-1">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{activity.title}</p>
                <p className="text-xs text-gray-500">{activity.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {activity.time}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
      
      {activities.length > maxItems && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button className="text-sm text-blue-600 hover:text-blue-800">
            View all activities
          </button>
        </div>
      )}
    </EnhancedCard>
  );
}

// Quick action card component
export function QuickActionCard({ 
  title, 
  description, 
  icon, 
  onClick, 
  color = 'blue',
  disabled = false
}) {
  const colorClasses = {
    blue: 'bg-blue-500 hover:bg-blue-600',
    green: 'bg-green-500 hover:bg-green-600',
    red: 'bg-red-500 hover:bg-red-600',
    yellow: 'bg-yellow-500 hover:bg-yellow-600',
    purple: 'bg-purple-500 hover:bg-purple-600',
    indigo: 'bg-indigo-500 hover:bg-indigo-600'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full p-6 rounded-lg text-white transition-colors ${colorClasses[color]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className="flex flex-col items-center text-center">
        <div className="mb-3">
          {icon}
        </div>
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm opacity-90">{description}</p>
      </div>
    </button>
  );
}

// List card component
export function ListCard({ 
  title, 
  items = [], 
  loading = false,
  error = null,
  emptyMessage = 'No items found',
  onItemClick = null,
  maxItems = 10
}) {
  return (
    <EnhancedCard
      title={title}
      loading={loading}
      error={error}
      className="h-full"
    >
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            {emptyMessage}
          </div>
        ) : (
          items.slice(0, maxItems).map((item, index) => (
            <div
              key={index}
              onClick={() => onItemClick && onItemClick(item)}
              className={`p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors ${onItemClick ? 'cursor-pointer' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.title}
                  </p>
                  {item.subtitle && (
                    <p className="text-xs text-gray-500 truncate">
                      {item.subtitle}
                    </p>
                  )}
                </div>
                {item.badge && (
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.badge.className}`}>
                    {item.badge.label}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      {items.length > maxItems && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button className="text-sm text-blue-600 hover:text-blue-800">
            View all {items.length} items
          </button>
        </div>
      )}
    </EnhancedCard>
  );
}
