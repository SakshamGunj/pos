import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink } from 'react-router-dom';
import TableSelectionPage from './pages/TableSelectionPage';
import OrderPage from './pages/OrderPage';
import KitchenDisplayPage from './pages/KitchenDisplayPage';
import SettingsPage from './pages/SettingsPage';
import CouponsAndGiftsPage from './pages/CouponsAndGiftsPage';
import OrdersPage from './pages/OrdersPage';
import KDSPage from './pages/KDSPage';
import CRMPage from './pages/CRMPage';
import MenuManagementPage from './pages/MenuManagementPage';
import InventoryPage from './pages/InventoryPage';
import FinancePage from './pages/FinancePage';
import SessionStartPage from './pages/SessionStartPage';
import { NotificationProvider } from './contexts/NotificationContext';
import { useSession, SessionProvider } from './contexts/SessionContext';
import SessionStatus from './components/SessionStatus';
import { Squares2X2Icon, ClipboardDocumentListIcon, Cog6ToothIcon, HomeIcon, ListBulletIcon, FireIcon, UserGroupIcon, BookOpenIcon, TicketIcon, ArrowLeftOnRectangleIcon, CubeIcon, BanknotesIcon } from '@heroicons/react/24/outline';

// Component to display current time that updates every second
const CurrentTimeDisplay: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<string>(
    new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  );
  
  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      );
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  return <span className="font-mono font-medium">{currentTime}</span>;
};

// Enhanced Navbar with gradient and better font
const Navbar = () => {
  // Create a responsive navbar with dropdown for mobile
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [sessionTime, setSessionTime] = useState('00:00');
  
  // Get session context outside the effect
  const sessionContext = useSession();

  // Update session timer every second for real-time display
  React.useEffect(() => {
    const updateSessionTime = () => {
      let sessionStartTime;
      
      if (sessionContext?.currentSession?.startTime) {
        // If we have a current session from context, use its start time
        const startTime = sessionContext.currentSession.startTime;
        sessionStartTime = startTime instanceof Date ? startTime : new Date(startTime);
      } else {
        // Fallback to localStorage
        const sessionStartTimeStr = localStorage.getItem('sessionStartTime');
        if (sessionStartTimeStr) {
          sessionStartTime = new Date(sessionStartTimeStr);
        }
      }
      
      if (sessionStartTime) {
        const now = new Date();
        const diffMs = now.getTime() - sessionStartTime.getTime();
        
        // Calculate hours, minutes, and seconds
        const diffSecs = Math.floor(diffMs / 1000);
        const hours = Math.floor(diffSecs / 3600);
        const mins = Math.floor((diffSecs % 3600) / 60);
        const secs = diffSecs % 60;
        
        // Format as HH:MM:SS
        setSessionTime(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    };

    updateSessionTime();
    // Update every second for a real-time timer
    const interval = setInterval(updateSessionTime, 1000);
    return () => clearInterval(interval);
  }, [sessionContext]);
  
  // Group 1: Main navigation items
  const mainNavItems = [
    { to: "/tables", text: "Tables", icon: Squares2X2Icon },
    { to: "/orders", text: "Orders", icon: ListBulletIcon },
    { to: "/kds", text: "KDS", icon: FireIcon },
    { to: "/kitchen", text: "Kitchen", icon: ClipboardDocumentListIcon },
    { to: "/menu", text: "Menu", icon: BookOpenIcon },
    { to: "/inventory", text: "Inventory", icon: CubeIcon },
  ];

  // Group 2: Secondary navigation items
  const secondaryNavItems = [
    { to: "/crm", text: "CRM", icon: UserGroupIcon },
    { to: "/finance", text: "Finance", icon: BanknotesIcon },
    { to: "/coupons-gifts", text: "Coupons", icon: TicketIcon },
    { to: "/settings", text: "Settings", icon: Cog6ToothIcon },
  ];
  
  // All nav items for mobile view
  const allNavItems = [...mainNavItems, ...secondaryNavItems];
  
  return (
    <nav className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 shadow-lg sticky top-0 z-50">
      {/* Top row with logo and session info */}
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/tables" className="flex items-center space-x-2 text-xl font-extrabold tracking-tight">
              <HomeIcon className="h-6 w-6 text-white" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-indigo-200 font-sans">Aries POS</span>
            </Link>
          </div>
          
          {/* Session Status and Time */}
          <div className="flex items-center">
            <div className="hidden sm:flex items-center space-x-2 text-white text-sm">
              <div className="flex flex-col items-center bg-white/10 px-3 py-1 rounded-md">
                <span className="text-xs text-indigo-100">Current Time</span>
                <CurrentTimeDisplay />
              </div>
              <div className="flex flex-col items-center bg-white/20 px-3 py-1 rounded-md">
                <span className="text-xs text-indigo-100">Session Duration</span>
                <span className="font-mono font-medium">{sessionTime}</span>
              </div>
            </div>
            <SessionStatus />
          </div>
          
          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-white/10 focus:outline-none"
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Bottom row with navigation items - desktop only */}
      <div className="hidden lg:block border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center">
            {/* Main nav items */}
            <div className="flex items-center space-x-2">
              {mainNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => 
                    `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out ` +
                    (isActive 
                      ? 'bg-white/20 text-white font-semibold backdrop-blur-sm shadow-sm' 
                      : 'text-indigo-100 hover:bg-white/10 hover:text-white')
                  }
                >
                  <item.icon className="h-5 w-5 mr-1" />
                  <span>{item.text}</span>
                </NavLink>
              ))}
            </div>
            
            {/* Visual separator */}
            <div className="h-6 mx-4 border-l border-white/20"></div>
            
            {/* Secondary nav items */}
            <div className="flex items-center space-x-2 ml-auto">
              {secondaryNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => 
                    `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out ` +
                    (isActive 
                      ? 'bg-white/20 text-white font-semibold backdrop-blur-sm shadow-sm' 
                      : 'text-indigo-100 hover:bg-white/10 hover:text-white')
                  }
                >
                  <item.icon className="h-5 w-5 mr-1" />
                  <span>{item.text}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-indigo-700 shadow-inner">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 max-h-[calc(100vh-4rem)] overflow-y-auto">
            {allNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) => 
                  `flex items-center px-3 py-2 rounded-md text-base font-medium ` +
                  (isActive 
                    ? 'bg-white/20 text-white font-semibold' 
                    : 'text-indigo-100 hover:bg-white/10 hover:text-white')
                }
              >
                <item.icon className="h-5 w-5 mr-3" />
                <span>{item.text}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

// Import Google Fonts in index.html or add this to your CSS
// @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');

// Main App Layout
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-base-100 font-sans">
      <Navbar />
      <main className="container mx-auto px-0 py-0 sm:px-4 sm:py-4 mt-2">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <NotificationProvider>
      <SessionProvider>
        <Router>
          <Routes>
            {/* Session Start Page (Root) */}
            <Route path="/" element={<SessionStartPage />} />
            
            {/* Main App Routes (Protected by Session) */}
            <Route path="/tables" element={<AppLayout><TableSelectionPage /></AppLayout>} />
            <Route path="/order/:tableId" element={<AppLayout><OrderPage /></AppLayout>} />
            <Route path="/kds" element={<AppLayout><KDSPage /></AppLayout>} />
            <Route path="/orders" element={<AppLayout><OrdersPage /></AppLayout>} />
            <Route path="/crm" element={<AppLayout><CRMPage /></AppLayout>} />
            <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />
            <Route path="/kitchen" element={<AppLayout><KitchenDisplayPage /></AppLayout>} />
            <Route path="/menu" element={<AppLayout><MenuManagementPage /></AppLayout>} />
            <Route path="/inventory" element={<AppLayout><InventoryPage /></AppLayout>} />
            <Route path="/finance" element={<AppLayout><FinancePage /></AppLayout>} />
            <Route path="/coupons-gifts" element={<AppLayout><CouponsAndGiftsPage /></AppLayout>} />
            
            {/* Fallback for any other route, redirect to session start */}
            <Route path="*" element={<SessionStartPage />} /> 
          </Routes>
        </Router>
      </SessionProvider>
    </NotificationProvider>
  );
}

export default App; 