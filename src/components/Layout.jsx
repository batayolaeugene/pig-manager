import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Warehouse, Plus, ClipboardList, Receipt, Scale } from 'lucide-react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import QuickActionSheet from './QuickActionSheet';
import QuickWeighModal from './QuickWeighModal';

const MOBILE_TABS = [
  { label: 'Home', path: '/', icon: LayoutDashboard },
  { label: 'Pigs', path: '/pigs', icon: Warehouse },
  { label: 'Action', path: '#quick-action', icon: Plus, isCenter: true },
  { label: 'Tasks', path: '/tasks', icon: ClipboardList },
  { label: 'Finance', path: '/finance', icon: Receipt },
];

export function Layout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [quickWeighPigId, setQuickWeighPigId] = useState(null);
  const [isQuickWeighOpen, setIsQuickWeighOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Listen for custom global events to open quick weigh modal
  useEffect(() => {
    const handleOpenWeigh = (e) => {
      setQuickWeighPigId(e.detail?.pigId || null);
      setIsQuickWeighOpen(true);
    };

    window.addEventListener('porkpro:open-weigh', handleOpenWeigh);
    return () => window.removeEventListener('porkpro:open-weigh', handleOpenWeigh);
  }, []);

  const isTabActive = (path) => {
    if (path === '/') return location.pathname === '/';
    if (path.startsWith('#')) return false;
    return location.pathname.startsWith(path);
  };

  const handleTabClick = (tab) => {
    if (tab.isCenter) {
      setIsQuickActionOpen(true);
    } else {
      navigate(tab.path);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onMenuClick={() => setIsMobileSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-3.5 sm:p-6 lg:p-8 pb-24 lg:pb-8 scrollbar-thin">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation Bar (Field Optimized & Glove Friendly) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200/80 z-40 safe-area-bottom shadow-lg">
          <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
            {MOBILE_TABS.map((tab) => {
              const active = isTabActive(tab.path);
              const Icon = tab.icon;

              if (tab.isCenter) {
                return (
                  <button
                    key={tab.label}
                    type="button"
                    onClick={() => handleTabClick(tab)}
                    className="flex flex-col items-center justify-center -mt-5 focus:outline-none group active:scale-95 transition-transform"
                    aria-label="Quick Actions"
                  >
                    <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-brand-600/35 border-3 border-white text-white">
                      <Icon className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <span className="text-[10px] font-bold text-brand-700 mt-1">Actions</span>
                  </button>
                );
              }

              return (
                <button
                  key={tab.path}
                  type="button"
                  onClick={() => handleTabClick(tab)}
                  className={`flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-xl transition-all ${
                    active ? 'text-brand-600 font-bold' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                  <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>
                    {tab.label}
                  </span>
                  {active && <div className="w-1.5 h-1.5 rounded-full bg-brand-600 -mt-0.5" />}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Global Quick Action Sheet Modal */}
        <QuickActionSheet
          isOpen={isQuickActionOpen}
          onClose={() => setIsQuickActionOpen(false)}
          onOpenQuickWeigh={() => setIsQuickWeighOpen(true)}
        />

        {/* Global Quick Weigh Modal */}
        <QuickWeighModal
          isOpen={isQuickWeighOpen}
          onClose={() => {
            setIsQuickWeighOpen(false);
            setQuickWeighPigId(null);
          }}
          defaultPigId={quickWeighPigId}
        />
      </div>
    </div>
  );
}

export default Layout;
