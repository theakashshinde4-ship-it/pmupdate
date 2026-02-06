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
  FiChevronUp
} from 'react-icons/fi';

// Primary items (always visible)
const primaryNavItems = [
  { label: 'Dashboard', icon: <FiHome />, to: '/doctor-dashboard', primary: true },
  { label: 'Staff Dashboard', icon: <FiUsers />, to: '/staff-dashboard', primary: true, staffOnly: true },
  { label: 'Queue', icon: <FiClock />, to: '/queue', primary: true },
  { label: 'Patients', icon: <FiUsers />, to: '/patients', primary: true },
  { label: 'Appointments', icon: <FiCalendar />, to: '/appointments', primary: true }
];

// Secondary items (collapsible in Doctor Mode)
const secondaryNavItems = [
  { label: 'Billing', icon: <FiDollarSign />, to: '/billing' },
    { label: 'Clinical', icon: <FiClipboard />, to: '/clinical' },
  { label: 'Analytics', icon: <FiBarChart2 />, to: '/analytics' },
  { label: 'ABHA', icon: <FiActivity />, to: '/abha', badge: 'New' },
  { label: 'Doctor Settings', icon: <FiClock />, to: '/doctor-settings', doctorOnly: true },
  { label: 'Doctor Management', icon: <FiUsers />, to: '/doctor-management', adminOnly: true },
  { label: 'User Management', icon: <FiUser />, to: '/user-management', adminOnly: true },
  { label: 'Doctor Export', icon: <FiDownload />, to: '/doctor-export', adminOnly: true },
  { label: 'Settings', icon: <FiSettings />, to: '/settings' }
];

export default function Sidebar({ onClose }) {
  const { user } = useAuth();
  const userRole = user?.role || 'staff';

  // Doctor Mode state (stored in localStorage)
  const [doctorMode, setDoctorMode] = useState(() => {
    return localStorage.getItem('doctorMode') === 'true';
  });

  // Show more items state
  const [showMore, setShowMore] = useState(false);

  // Toggle Doctor Mode
  const toggleDoctorMode = () => {
    const newMode = !doctorMode;
    setDoctorMode(newMode);
    localStorage.setItem('doctorMode', newMode.toString());
    if (newMode) {
      setShowMore(false); // Collapse when entering doctor mode
    }
  };

  // Filter items based on user role
  const filterByRole = (items) => {
    return items.filter(item => {
      if (item.adminOnly && userRole !== 'admin') {
        return false;
      }
      if (item.doctorOnly && userRole !== 'doctor') {
        return false;
      }
      if (item.staffOnly && userRole === 'doctor') {
        return false;
      }
      return true;
    });
  };

  const filteredPrimaryItems = filterByRole(primaryNavItems);
  const filteredSecondaryItems = filterByRole(secondaryNavItems);

  return (
    <aside className="w-64 bg-dark text-white flex flex-col h-full">
      {/* Mobile close button */}
      <div className="lg:hidden p-4 flex items-center justify-between border-b border-blue-900">
        <div className="font-semibold">Om Hospital</div>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-blue-800/50"
        >
          <FiX size={20} />
        </button>
      </div>

      {/* Desktop header */}
      <div className="hidden lg:block p-4 border-b border-blue-900">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Om Hospital</div>
          <span className="text-xs bg-primary px-2 py-1 rounded">PRO</span>
        </div>
      </div>

      {/* Doctor Mode Toggle */}
      <div className="p-3 border-b border-blue-900">
        <button
          onClick={toggleDoctorMode}
          className={`w-full flex items-center justify-between px-3 py-2 rounded transition-colors ${
            doctorMode
              ? 'bg-blue-500 text-white'
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

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {/* Primary Navigation Items */}
        {filteredPrimaryItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-3 rounded cursor-pointer transition-colors ${
                isActive ? 'bg-primary text-white' : 'hover:bg-blue-800/50'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm font-semibold">{item.label}</span>
            </div>
            {item.badge && (
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}

        {/* Secondary Navigation Items (Collapsed in Doctor Mode) */}
        {!doctorMode && (
          <>
            <div className="pt-2 pb-1 border-t border-blue-800/50 mt-2">
              <span className="px-3 text-xs text-white/50 font-semibold">
                MORE
              </span>
            </div>
            {filteredSecondaryItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors ${
                    isActive ? 'bg-primary text-white' : 'hover:bg-blue-800/50'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <span>{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </>
        )}

        {/* Show More Button (Only in Doctor Mode) */}
        {doctorMode && (
          <button
            onClick={() => setShowMore(!showMore)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded hover:bg-blue-800/50 transition-colors mt-2"
          >
            <span className="text-xs font-medium">
              {showMore ? 'Show Less' : 'Show More'}
            </span>
            {showMore ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
          </button>
        )}

        {/* Expanded Secondary Items (In Doctor Mode when Show More is clicked) */}
        {doctorMode && showMore && (
          <div className="space-y-1 pt-2 border-t border-blue-800/50">
            {filteredSecondaryItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors ${
                    isActive ? 'bg-primary text-white' : 'hover:bg-blue-800/50'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <span>{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      <div className="p-3 flex items-center justify-center border-t border-blue-900">
        <button className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary/80 transition-colors">
          <FiMessageSquare />
        </button>
      </div>
    </aside>
  );
}

