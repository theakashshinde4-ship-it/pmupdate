import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  FiHome,
  FiUsers,
  FiClock,
  FiCalendar,
  FiDollarSign,
  FiFileText,
  FiBarChart2,
  FiSettings,
  FiUser,
  FiActivity,
  FiLogOut,
  FiChevronDown,
  FiChevronUp
} from 'react-icons/fi';

export default function SimplifiedSidebar({ onClose }) {
  const { user, logout } = useAuth();
  const userRole = user?.role || 'staff';

  const [showMore, setShowMore] = useState(false);

  // Role-based navigation items
  const getNavigationItems = () => {
    const commonItems = [
      { label: 'Dashboard', icon: <FiHome />, to: '/dashboard' },
      { label: 'Queue', icon: <FiClock />, to: '/queue' },
      { label: 'Patients', icon: <FiUsers />, to: '/patients' },
      { label: 'Appointments', icon: <FiCalendar />, to: '/appointments' }
    ];

    const doctorItems = [
      ...commonItems,
      { label: 'Prescriptions', icon: <FiFileText />, to: '/prescriptions' },
      { label: 'Clinical Notes', icon: <FiActivity />, to: '/clinical' },
      { label: 'Settings', icon: <FiSettings />, to: '/doctor-settings' }
    ];

    const staffItems = [
      ...commonItems,
      { label: 'Billing', icon: <FiDollarSign />, to: '/billing' },
      { label: 'Payments', icon: <FiDollarSign />, to: '/payments' },
      { label: 'Reports', icon: <FiBarChart2 />, to: '/reports' }
    ];

    const adminItems = [
      ...commonItems,
      { label: 'Analytics', icon: <FiBarChart2 />, to: '/analytics' },
      { label: 'User Management', icon: <FiUser />, to: '/user-management' },
      { label: 'Doctor Management', icon: <FiUsers />, to: '/doctor-management' },
      { label: 'System Settings', icon: <FiSettings />, to: '/settings' }
    ];

    switch (userRole) {
      case 'doctor':
        return doctorItems;
      case 'staff':
        return staffItems;
      case 'admin':
        return adminItems;
      default:
        return commonItems;
    }
  };

  const navigationItems = getNavigationItems();

  const getRoleColor = () => {
    switch (userRole) {
      case 'doctor':
        return 'from-blue-600 to-blue-800';
      case 'staff':
        return 'from-green-600 to-green-800';
      case 'admin':
        return 'from-purple-600 to-purple-800';
      default:
        return 'from-gray-600 to-gray-800';
    }
  };

  const getRoleLabel = () => {
    switch (userRole) {
      case 'doctor':
        return '👨‍⚕️ Doctor';
      case 'staff':
        return '👥 Staff';
      case 'admin':
        return '👑 Admin';
      default:
        return '👤 User';
    }
  };

  return (
    <div className="h-full bg-white shadow-lg flex flex-col">
      {/* Header */}
      <div className={`bg-gradient-to-r ${getRoleColor()} text-white p-6`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <FiHome className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Om Hospital</h1>
              <p className="text-sm opacity-90">{getRoleLabel()}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-white hover:bg-white/20 p-2 rounded"
          >
            ✕
          </button>
        </div>
        <div className="text-sm opacity-90">
          Welcome, {user?.name || 'User'}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <span className="w-5 h-5">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            {user?.email || 'user@hospital.com'}
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            userRole === 'doctor' ? 'bg-blue-100 text-blue-800' :
            userRole === 'staff' ? 'bg-green-100 text-green-800' :
            userRole === 'admin' ? 'bg-purple-100 text-purple-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {userRole?.toUpperCase() || 'USER'}
          </div>
        </div>
        
        <button
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
        >
          <FiLogOut className="w-4 h-4" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}
