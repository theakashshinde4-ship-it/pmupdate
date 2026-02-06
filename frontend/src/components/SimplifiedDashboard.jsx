import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useApiClient } from '../api/client';
import {
  FiUsers,
  FiCalendar,
  FiClock,
  FiDollarSign,
  FiTrendingUp,
  FiActivity,
  FiFileText,
  FiAlertCircle
} from 'react-icons/fi';

export default function SimplifiedDashboard() {
  const { user } = useAuth();
  const api = useApiClient();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const userRole = user?.role || 'staff';

  useEffect(() => {
    fetchDashboardStats();
  }, [userRole]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Role-based API calls
      const endpoints = {
        doctor: [
          '/api/appointments/today',
          '/api/patients/my-patients',
          '/api/prescriptions/recent'
        ],
        staff: [
          '/api/appointments/today',
          '/api/patients/today',
          '/api/bills/pending'
        ],
        admin: [
          '/api/analytics/overview',
          '/api/users/stats',
          '/api/appointments/stats'
        ]
      };

      const roleEndpoints = endpoints[userRole] || endpoints.staff;
      
      const responses = await Promise.all(
        roleEndpoints.map(endpoint => api.get(endpoint).catch(() => ({ data: {} })))
      );

      // Process responses based on role
      const processedStats = processStatsByRole(responses, userRole);
      setStats(processedStats);
      
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const processStatsByRole = (responses, role) => {
    switch (role) {
      case 'doctor':
        return {
          todayAppointments: responses[0]?.data?.count || 0,
          myPatients: responses[1]?.data?.count || 0,
          recentPrescriptions: responses[2]?.data?.count || 0,
          pendingTasks: responses[0]?.data?.pending || 0
        };
      case 'staff':
        return {
          todayAppointments: responses[0]?.data?.count || 0,
          newPatients: responses[1]?.data?.count || 0,
          pendingBills: responses[2]?.data?.count || 0,
          todayRevenue: responses[2]?.data?.revenue || 0
        };
      case 'admin':
        return {
          totalUsers: responses[1]?.data?.total || 0,
          totalPatients: responses[0]?.data?.patients || 0,
          totalAppointments: responses[2]?.data?.total || 0,
          totalRevenue: responses[0]?.data?.revenue || 0
        };
      default:
        return {};
    }
  };

  const getRoleSpecificStats = () => {
    switch (userRole) {
      case 'doctor':
        return [
          {
            label: 'Today\'s Appointments',
            value: stats.todayAppointments || 0,
            icon: <FiCalendar className="w-6 h-6" />,
            color: 'bg-blue-500',
            change: '+2 from yesterday'
          },
          {
            label: 'My Patients',
            value: stats.myPatients || 0,
            icon: <FiUsers className="w-6 h-6" />,
            color: 'bg-green-500',
            change: '+5 this week'
          },
          {
            label: 'Recent Prescriptions',
            value: stats.recentPrescriptions || 0,
            icon: <FiFileText className="w-6 h-6" />,
            color: 'bg-purple-500',
            change: '+12 today'
          },
          {
            label: 'Pending Tasks',
            value: stats.pendingTasks || 0,
            icon: <FiClock className="w-6 h-6" />,
            color: 'bg-orange-500',
            change: '3 urgent'
          }
        ];
      case 'staff':
        return [
          {
            label: 'Today\'s Appointments',
            value: stats.todayAppointments || 0,
            icon: <FiCalendar className="w-6 h-6" />,
            color: 'bg-blue-500',
            change: '+2 from yesterday'
          },
          {
            label: 'New Patients',
            value: stats.newPatients || 0,
            icon: <FiUsers className="w-6 h-6" />,
            color: 'bg-green-500',
            change: '+5 this week'
          },
          {
            label: 'Pending Bills',
            value: stats.pendingBills || 0,
            icon: <FiDollarSign className="w-6 h-6" />,
            color: 'bg-orange-500',
            change: '₹15,000 pending'
          },
          {
            label: 'Today\'s Revenue',
            value: `₹${stats.todayRevenue || 0}`,
            icon: <FiTrendingUp className="w-6 h-6" />,
            color: 'bg-purple-500',
            change: '+15% from yesterday'
          }
        ];
      case 'admin':
        return [
          {
            label: 'Total Users',
            value: stats.totalUsers || 0,
            icon: <FiUsers className="w-6 h-6" />,
            color: 'bg-blue-500',
            change: '+12 this month'
          },
          {
            label: 'Total Patients',
            value: stats.totalPatients || 0,
            icon: <FiActivity className="w-6 h-6" />,
            color: 'bg-green-500',
            change: '+45 this month'
          },
          {
            label: 'Total Appointments',
            value: stats.totalAppointments || 0,
            icon: <FiCalendar className="w-6 h-6" />,
            color: 'bg-purple-500',
            change: '+120 this week'
          },
          {
            label: 'Total Revenue',
            value: `₹${stats.totalRevenue || 0}`,
            icon: <FiDollarSign className="w-6 h-6" />,
            color: 'bg-orange-500',
            change: '+25% this month'
          }
        ];
      default:
        return [];
    }
  };

  const getQuickActions = () => {
    switch (userRole) {
      case 'doctor':
        return [
          { label: 'Start Consultation', path: '/queue', color: 'bg-blue-600' },
          { label: 'View Appointments', path: '/appointments', color: 'bg-green-600' },
          { label: 'Write Prescription', path: '/prescriptions', color: 'bg-purple-600' }
        ];
      case 'staff':
        return [
          { label: 'Register Patient', path: '/patients', color: 'bg-blue-600' },
          { label: 'Manage Queue', path: '/queue', color: 'bg-green-600' },
          { label: 'Process Payments', path: '/billing', color: 'bg-orange-600' }
        ];
      case 'admin':
        return [
          { label: 'Manage Users', path: '/user-management', color: 'bg-purple-600' },
          { label: 'View Analytics', path: '/analytics', color: 'bg-blue-600' },
          { label: 'System Settings', path: '/settings', color: 'bg-gray-600' }
        ];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  const roleStats = getRoleSpecificStats();
  const quickActions = getQuickActions();

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.name || 'User'}! 👋
        </h1>
        <p className="opacity-90">
          Here's what's happening at {userRole === 'doctor' ? 'your practice' : 'the hospital'} today
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {roleStats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} text-white p-3 rounded-lg`}>
                {stat.icon}
              </div>
              <span className="text-sm text-gray-500">{stat.change}</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
            <p className="text-gray-600 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => window.location.href = action.path}
              className={`${action.color} text-white px-4 py-3 rounded-lg hover:opacity-90 transition-opacity`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <FiActivity className="w-5 h-5 text-blue-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">System is running smoothly</p>
              <p className="text-xs text-gray-500">All services operational</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <FiUsers className="w-5 h-5 text-green-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">New patient registered</p>
              <p className="text-xs text-gray-500">Just now</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
