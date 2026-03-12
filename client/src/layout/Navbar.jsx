import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, LineChart, FileText, UserPlus, Settings, MonitorPlay } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar() {
  const location = useLocation();

  if (location.pathname === '/student') {
    return null; // Hide totally on kiosk portal
  }

  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/attendance', label: 'Attendance', icon: CheckSquare },
    { to: '/track', label: 'Track', icon: LineChart },
    { to: '/report', label: 'Report', icon: FileText },
    { to: '/enroll', label: 'Enroll', icon: UserPlus },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo area */}
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                AM
              </div>
              <span className="font-semibold text-gray-900 tracking-tight">Attendance Manager</span>
            </div>

            {/* Navigation Tabs */}
            <div className="ml-10 flex space-x-1">
              {links.map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `inline-flex items-center px-4 py-2 mt-2 rounded-t-lg text-sm font-medium relative ${
                      isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <link.icon className="w-4 h-4 mr-2" />
                      {link.label}
                      {isActive && (
                        <motion.div
                          layoutId="nav-indicator"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                          initial={false}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
          
          <div className="flex items-center">
            <a 
              href="/student" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-lg transition-colors border border-emerald-100"
            >
              <MonitorPlay className="w-4 h-4" />
              Launch Student Portal
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
