import { useState, useEffect } from 'react';
import { FiShield, FiLock, FiUnlock, FiAlertTriangle, FiCheckCircle, FiXCircle } from 'react-icons/fi';

// Role hierarchy and permissions
const ROLE_HIERARCHY = {
  admin: 4,
  subadmin: 3,
  doctor: 2,
  staff: 1
};

const PERMISSIONS = {
  // Patient Management
  patients: {
    view: ['admin', 'subadmin', 'doctor', 'staff'],
    create: ['admin', 'subadmin', 'staff'],
    edit: ['admin', 'subadmin', 'doctor'],
    delete: ['admin'],
    export: ['admin', 'subadmin']
  },
  
  // Appointments
  appointments: {
    view: ['admin', 'subadmin', 'doctor', 'staff'],
    create: ['admin', 'subadmin', 'staff'],
    edit: ['admin', 'subadmin', 'doctor'],
    delete: ['admin'],
    manage_schedule: ['admin', 'subadmin', 'doctor']
  },
  
  // Clinical Data
  clinical: {
    view: ['admin', 'subadmin', 'doctor'],
    create: ['admin', 'subadmin', 'doctor'],
    edit: ['admin', 'subadmin', 'doctor'],
    delete: ['admin'],
    prescribe: ['admin', 'subadmin', 'doctor']
  },
  
  // Prescriptions
  prescriptions: {
    view: ['admin', 'subadmin', 'doctor'],
    create: ['admin', 'subadmin', 'doctor'],
    edit: ['admin', 'subadmin', 'doctor'],
    delete: ['admin'],
    dispense: ['admin', 'subadmin', 'staff']
  },
  
  // Billing
  billing: {
    view: ['admin', 'subadmin', 'staff'],
    create: ['admin', 'subadmin', 'staff'],
    edit: ['admin', 'subadmin'],
    delete: ['admin'],
    refund: ['admin', 'subadmin'],
    reports: ['admin', 'subadmin']
  },
  
  // Analytics
  analytics: {
    view: ['admin', 'subadmin'],
    create: ['admin', 'subadmin'],
    export: ['admin', 'subadmin'],
    financial: ['admin', 'subadmin'],
    clinical: ['admin', 'subadmin', 'doctor']
  },
  
  // User Management
  users: {
    view: ['admin'],
    create: ['admin'],
    edit: ['admin'],
    delete: ['admin'],
    manage_roles: ['admin'],
    reset_password: ['admin']
  },
  
  // System Settings
  settings: {
    view: ['admin'],
    edit: ['admin'],
    backup: ['admin'],
    system_config: ['admin'],
    clinic_info: ['admin', 'subadmin']
  },
  
  // Labs
  labs: {
    view: ['admin', 'subadmin', 'doctor'],
    create: ['admin', 'subadmin', 'doctor'],
    edit: ['admin', 'subadmin', 'doctor'],
    delete: ['admin'],
    approve: ['admin', 'subadmin', 'doctor']
  },
  
  // ABHA Integration
  abha: {
    view: ['admin', 'subadmin', 'doctor', 'staff'],
    create: ['admin', 'subadmin', 'staff'],
    edit: ['admin', 'subadmin', 'doctor'],
    link: ['admin', 'subadmin', 'staff'],
    verify: ['admin', 'subadmin', 'doctor']
  }
};

// Custom hook for role-based access control
export function useRoleBasedAccess() {
  const [userRole, setUserRole] = useState('staff');
  const [permissions, setPermissions] = useState({});

  useEffect(() => {
    // Get user role from auth context or localStorage
    const role = localStorage.getItem('userRole') || 'staff';
    setUserRole(role);
    
    // Calculate user permissions
    const userPermissions = {};
    Object.keys(PERMISSIONS).forEach(module => {
      userPermissions[module] = {};
      Object.keys(PERMISSIONS[module]).forEach(action => {
        userPermissions[module][action] = PERMISSIONS[module][action].includes(role);
      });
    });
    setPermissions(userPermissions);
  }, []);

  // Check if user has permission for specific action
  const hasPermission = (module, action) => {
    return permissions[module]?.[action] || false;
  };

  // Check if user can access a route
  const canAccessRoute = (route) => {
    const routePermissions = {
      '/patients': hasPermission('patients', 'view'),
      '/appointments': hasPermission('appointments', 'view'),
      '/clinical': hasPermission('clinical', 'view'),
      '/prescriptions': hasPermission('prescriptions', 'view'),
      '/billing': hasPermission('billing', 'view'),
      '/analytics': hasPermission('analytics', 'view'),
      '/users': hasPermission('users', 'view'),
      '/settings': hasPermission('settings', 'view'),
      '/labs': hasPermission('labs', 'view'),
      '/abha': hasPermission('abha', 'view'),
      '/doctor-dashboard': ['admin', 'subadmin', 'doctor'].includes(userRole),
      '/staff-dashboard': ['admin', 'staff', 'subadmin'].includes(userRole),
      '/queue': ['admin', 'staff', 'subadmin', 'doctor'].includes(userRole)
    };
    
    return routePermissions[route] || false;
  };

  // Get accessible routes for current user
  const getAccessibleRoutes = () => {
    const allRoutes = [
      { path: '/doctor-dashboard', label: 'Doctor Dashboard', icon: 'home' },
      { path: '/staff-dashboard', label: 'Staff Dashboard', icon: 'users' },
      { path: '/queue', label: 'Queue', icon: 'clock' },
      { path: '/patients', label: 'Patients', icon: 'users' },
      { path: '/appointments', label: 'Appointments', icon: 'calendar' },
      { path: '/clinical', label: 'Clinical', icon: 'clipboard' },
      { path: '/prescriptions', label: 'Prescriptions', icon: 'book' },
      { path: '/billing', label: 'Billing', icon: 'dollar-sign' },
      { path: '/analytics', label: 'Analytics', icon: 'bar-chart' },
      { path: '/labs', label: 'Labs', icon: 'database' },
      { path: '/abha', label: 'ABHA', icon: 'activity' },
      { path: '/users', label: 'User Management', icon: 'user' },
      { path: '/settings', label: 'Settings', icon: 'settings' }
    ];

    return allRoutes.filter(route => canAccessRoute(route.path));
  };

  return {
    userRole,
    permissions,
    hasPermission,
    canAccessRoute,
    getAccessibleRoutes,
    ROLE_HIERARCHY
  };
}

// Permission check component
export function PermissionCheck({ module, action, children, fallback = null }) {
  const { hasPermission } = useRoleBasedAccess();

  if (hasPermission(module, action)) {
    return children;
  }

  return fallback || (
    <div className="flex items-center justify-center p-8 text-gray-500">
      <FiLock className="mr-2" />
      <span>You don't have permission to access this feature.</span>
    </div>
  );
}

// Role-based access guard for routes
export function RoleGuard({ requiredRole, children, fallback = null }) {
  const { userRole, ROLE_HIERARCHY } = useRoleBasedAccess();

  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;

  if (userLevel >= requiredLevel) {
    return children;
  }

  return fallback || (
    <div className="flex flex-col items-center justify-center p-8 text-gray-500">
      <FiShield className="text-4xl mb-4" />
      <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
      <p>You don't have sufficient privileges to access this page.</p>
    </div>
  );
}

// Permission badge component
export function PermissionBadge({ module, action }) {
  const { hasPermission } = useRoleBasedAccess();

  const hasAccess = hasPermission(module, action);

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
      hasAccess 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800'
    }`}>
      {hasAccess ? (
        <>
          <FiUnlock className="mr-1" size={12} />
          Allowed
        </>
      ) : (
        <>
          <FiLock className="mr-1" size={12} />
          Restricted
        </>
      )}
    </span>
  );
}

// Role indicator component
export function RoleIndicator({ role, size = 'sm' }) {
  const getRoleInfo = (role) => {
    switch (role) {
      case 'admin':
        return { label: 'Admin', color: 'purple', icon: FiShield };
      case 'subadmin':
        return { label: 'Sub Admin', color: 'indigo', icon: FiShield };
      case 'doctor':
        return { label: 'Doctor', color: 'blue', icon: FiShield };
      case 'staff':
        return { label: 'Staff', color: 'gray', icon: FiShield };
      default:
        return { label: 'Unknown', color: 'gray', icon: FiAlertTriangle };
    }
  };

  const roleInfo = getRoleInfo(role);
  const Icon = roleInfo.icon;
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-${roleInfo.color}-100 text-${roleInfo.color}-800 ${sizeClasses[size]}`}>
      <Icon size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />
      {roleInfo.label}
    </span>
  );
}

// Access control summary component
export function AccessControlSummary() {
  const { userRole, permissions } = useRoleBasedAccess();

  const getPermissionStats = () => {
    let totalPermissions = 0;
    let grantedPermissions = 0;

    Object.values(permissions).forEach(module => {
      Object.values(module).forEach(hasAccess => {
        totalPermissions++;
        if (hasAccess) grantedPermissions++;
      });
    });

    return { total: totalPermissions, granted: grantedPermissions };
  };

  const stats = getPermissionStats();
  const accessPercentage = Math.round((stats.granted / stats.total) * 100);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Access Control Summary</h3>
        <RoleIndicator role={userRole} />
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Access Level</span>
            <span>{accessPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                accessPercentage >= 80 ? 'bg-green-500' :
                accessPercentage >= 60 ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${accessPercentage}%` }}
            ></div>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p>You have access to {stats.granted} out of {stats.total} available permissions.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <FiCheckCircle className="text-green-500" />
            <span>{stats.granted} Granted</span>
          </div>
          <div className="flex items-center gap-2">
            <FiXCircle className="text-red-500" />
            <span>{stats.total - stats.granted} Restricted</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default useRoleBasedAccess;
