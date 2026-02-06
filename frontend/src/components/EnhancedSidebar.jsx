import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  FiHome,
  FiUsers,
  FiClipboard,
  FiDollarSign,
  FiBarChart2,
  FiActivity,
  FiBook,
  FiSettings,
  FiBell,
  FiUser,
  FiGrid,
  FiMessageSquare,
  FiX,
  FiCalendar,
  FiShield,
  FiCloud,
  FiLayout,
  FiClock,
  FiDownload,
  FiZap,
  FiChevronDown,
  FiChevronUp,
  FiTrendingUp,
  FiFileText,
  FiMail,
  FiPhone,
  FiMapPin,
  FiStar,
  FiAward,
  FiTarget,
  FiBriefcase,
  FiTool,
  FiDatabase,
  FiLock,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';

// Enhanced role-based navigation items with better organization
const getNavigationItems = (userRole) => {
  const baseItems = [
    { 
      label: 'Dashboard', 
      icon: <FiHome />, 
      to: '/doctor-dashboard', 
      primary: true,
      description: 'Main dashboard overview',
      badge: null
    }
  ];

  const staffItems = [
    { 
      label: 'Staff Dashboard', 
      icon: <FiUsers />, 
      to: '/staff-dashboard', 
      primary: true,
      description: 'Patient queue management',
      badge: null,
      roles: ['admin', 'staff', 'subadmin']
    },
    { 
      label: 'Queue', 
      icon: <FiClock />, 
      to: '/queue', 
      primary: true,
      description: 'Patient appointment queue',
      badge: null
    },
    { 
      label: 'Patients', 
      icon: <FiUsers />, 
      to: '/patients', 
      primary: true,
      description: 'Patient records and management',
      badge: null
    },
    { 
      label: 'Appointments', 
      icon: <FiCalendar />, 
      to: '/appointments', 
      primary: true,
      description: 'Schedule and manage appointments',
      badge: null
    }
  ];

  const clinicalItems = [
    { 
      label: 'Clinical', 
      icon: <FiClipboard />, 
      to: '/clinical', 
      description: 'Clinical notes and examinations',
      badge: null,
      roles: ['admin', 'doctor', 'subadmin']
    },
    { 
      label: 'Prescriptions', 
      icon: <FiBook />, 
      to: '/prescriptions', 
      description: 'Medication prescriptions',
      badge: null,
      roles: ['admin', 'doctor', 'subadmin']
    },
    { 
      label: 'ABHA', 
      icon: <FiActivity />, 
      to: '/abha', 
      description: 'ABHA health ID integration',
      badge: 'New',
      roles: ['admin', 'doctor', 'staff', 'subadmin']
    },
    { 
      label: 'Labs', 
      icon: <FiDatabase />, 
      to: '/labs', 
      description: 'Laboratory investigations',
      badge: null,
      roles: ['admin', 'doctor', 'subadmin']
    }
  ];

  const billingItems = [
    { 
      label: 'Billing', 
      icon: <FiDollarSign />, 
      to: '/billing', 
      description: 'Payments and receipts',
      badge: null,
      roles: ['admin', 'staff', 'subadmin']
    },
    { 
      label: 'Analytics', 
      icon: <FiBarChart2 />, 
      to: '/analytics', 
      description: 'Business analytics and reports',
      badge: null,
      roles: ['admin', 'subadmin']
    }
  ];

  const adminItems = [
    { 
      label: 'User Management', 
      icon: <FiUser />, 
      to: '/user-management', 
      description: 'Manage system users',
      badge: null,
      roles: ['admin']
    },
    { 
      label: 'Doctor Management', 
      icon: <FiUsers />, 
      to: '/doctor-management', 
      description: 'Manage doctors and staff',
      badge: null,
      roles: ['admin']
    },
    { 
      label: 'Settings', 
      icon: <FiSettings />, 
      to: '/settings', 
      description: 'System configuration',
      badge: null,
      roles: ['admin']
    },
    { 
      label: 'Backup', 
      icon: <FiCloud />, 
      to: '/backup', 
      description: 'Data backup and restore',
      badge: null,
      roles: ['admin']
    }
  ];

  const doctorItems = [
    { 
      label: 'Doctor Settings', 
      icon: <FiTool />, 
      to: '/doctor-settings', 
      description: 'Personal doctor preferences',
      badge: null,
      roles: ['doctor']
    },
    { 
      label: 'My Schedule', 
      icon: <FiCalendar />, 
      to: '/doctor-schedule', 
      description: 'Personal appointment schedule',
      badge: null,
      roles: ['doctor']
    }
  ];

  // Combine all items
  const allItems = [
    ...baseItems,
    ...staffItems.filter(item => !item.roles || item.roles.includes(userRole)),
    ...clinicalItems.filter(item => !item.roles || item.roles.includes(userRole)),
    ...billingItems.filter(item => !item.roles || item.roles.includes(userRole)),
    ...adminItems.filter(item => !item.roles || item.roles.includes(userRole)),
    ...doctorItems.filter(item => !item.roles || item.roles.includes(userRole))
  ];

  return allItems;
};

export default function EnhancedSidebar({ onClose }) {
  const { user } = useAuth();
  const userRole = user?.role || 'staff';

  // Doctor Mode state (stored in localStorage)
  const [doctorMode, setDoctorMode] = useState(() => {
    return localStorage.getItem('doctorMode') === 'true';
  });

  // Show more items state
  const [showMore, setShowMore] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    primary: true,
    clinical: false,
    billing: false,
    admin: false
  });

  // Get navigation items based on user role
  const navigationItems = getNavigationItems(userRole);

  // Group items by category
  const primaryItems = navigationItems.filter(item => item.primary);
  const secondaryItems = navigationItems.filter(item => !item.primary);

  // Toggle Doctor Mode
  const toggleDoctorMode = () => {
    const newMode = !doctorMode;
    setDoctorMode(newMode);
    localStorage.setItem('doctorMode', newMode.toString());
    if (newMode) {
      setShowMore(false); // Collapse when entering doctor mode
    }
  };

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Get role-based styling
  const getRoleColor = () => {
    switch (userRole) {
      case 'admin': return 'bg-purple-600';
      case 'doctor': return 'bg-blue-600';
      case 'subadmin': return 'bg-indigo-600';
      default: return 'bg-gray-600';
    }
  };

  const getRoleBadge = () => {
    switch (userRole) {
      case 'admin': return 'ADMIN';
      case 'doctor': return 'DR';
      case 'subadmin': return 'SUB';
      default: return 'STAFF';
    }
  };

  return (
    <aside className="w-72 bg-dark text-white flex flex-col h-full shadow-xl">
      {/* Mobile close button */}
      <div className="lg:hidden p-4 flex items-center justify-between border-b border-blue-900">
        <div className="font-semibold text-lg">Om Hospital</div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-blue-800/50 transition-colors"
        >
          <FiX size={20} />
        </button>
      </div>

      {/* Desktop header with user info */}
      <div className="hidden lg:block p-4 border-b border-blue-900">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold text-lg">Om Hospital</div>
          <span className="text-xs bg-primary px-2 py-1 rounded-full">PRO</span>
        </div>
        
        {/* User info card */}
        <div className={`${getRoleColor()} rounded-lg p-3 text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <FiUser size={16} />
              </div>
              <div>
                <div className="text-sm font-medium">{user?.name || 'User'}</div>
                <div className="text-xs opacity-80">{getRoleBadge()}</div>
              </div>
            </div>
            <FiShield size={16} className="opacity-60" />
          </div>
        </div>
      </div>

      {/* Doctor Mode Toggle */}
      <div className="p-3 border-b border-blue-900">
        <button
          onClick={toggleDoctorMode}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
            doctorMode
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-blue-800/30 hover:bg-blue-800/50'
          }`}
        >
          <div className="flex items-center gap-2">
            <FiZap size={18} />
            <span className="text-sm font-semibold">Doctor Mode</span>
          </div>
          <div
            className={`w-10 h-5 rounded-full relative transition-colors ${
              doctorMode ? 'bg-white/30' : 'bg-white/10'
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                doctorMode ? 'left-5' : 'left-0.5'
              }`}
            ></div>
          </div>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
        {/* Primary Navigation */}
        <div className="space-y-1">
          {primaryItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                  isActive 
                    ? 'bg-primary text-white shadow-md' 
                    : 'hover:bg-blue-800/50 text-gray-200 hover:text-white'
                }`
              }
              title={item.description}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg group-hover:scale-110 transition-transform">{item.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{item.label}</div>
                  {item.description && (
                    <div className="text-xs opacity-70 hidden lg:block">{item.description}</div>
                  )}
                </div>
              </div>
              {item.badge && (
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full animate-pulse">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        {/* Secondary Navigation */}
        {!doctorMode && (
          <>
            <div className="pt-2 pb-1 border-t border-blue-800/50 mt-2">
              <span className="px-3 text-xs text-white/50 font-semibold uppercase tracking-wider">
                More Options
              </span>
            </div>
            <div className="space-y-1">
              {secondaryItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all ${
                      isActive 
                        ? 'bg-primary text-white shadow-md' 
                        : 'hover:bg-blue-800/50 text-gray-200 hover:text-white'
                    }`
                  }
                  title={item.description}
                >
                  <div className="flex items-center gap-3">
                    <span className="group-hover:scale-110 transition-transform">{item.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{item.label}</div>
                      {item.description && (
                        <div className="text-xs opacity-70 hidden lg:block">{item.description}</div>
                      )}
                    </div>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </>
        )}

        {/* Show More Button (Doctor Mode) */}
        {doctorMode && (
          <button
            onClick={() => setShowMore(!showMore)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-800/50 transition-all mt-2"
          >
            <span className="text-xs font-medium">
              {showMore ? 'Show Less' : 'Show More'}
            </span>
            {showMore ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
          </button>
        )}

        {/* Expanded Secondary Items (Doctor Mode) */}
        {doctorMode && showMore && (
          <div className="space-y-1 pt-2 border-t border-blue-800/50">
            {secondaryItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all ${
                    isActive 
                      ? 'bg-primary text-white shadow-md' 
                      : 'hover:bg-blue-800/50 text-gray-200 hover:text-white'
                  }`
                }
                title={item.description}
              >
                <div className="flex items-center gap-3">
                  <span className="group-hover:scale-110 transition-transform">{item.icon}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{item.label}</div>
                    {item.description && (
                      <div className="text-xs opacity-70 hidden lg:block">{item.description}</div>
                    )}
                  </div>
                </div>
                {item.badge && (
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* Footer with quick actions */}
      <div className="p-3 border-t border-blue-900">
        <div className="flex items-center justify-around">
          <button className="w-10 h-10 rounded-full bg-primary/20 hover:bg-primary/30 flex items-center justify-center transition-colors" title="Messages">
            <FiMessageSquare size={16} />
          </button>
          <button className="w-10 h-10 rounded-full bg-primary/20 hover:bg-primary/30 flex items-center justify-center transition-colors" title="Notifications">
            <FiBell size={16} />
          </button>
          <button className="w-10 h-10 rounded-full bg-primary/20 hover:bg-primary/30 flex items-center justify-center transition-colors" title="Support">
            <FiPhone size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
