import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import EnhancedSidebar from './EnhancedSidebar';
import EnhancedHeaderBar from './EnhancedHeaderBar';
import { useRoleBasedAccess } from './RoleBasedAccess';

export default function EnhancedMainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { canAccessRoute } = useRoleBasedAccess();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-72 bg-dark text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <EnhancedSidebar onClose={closeSidebar} />
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
        ></div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <EnhancedHeaderBar 
          title="Patient Management System" 
          onToggleSidebar={toggleSidebar}
        />
        
        <main className="flex-1 overflow-auto">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
