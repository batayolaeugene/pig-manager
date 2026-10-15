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

        {/* Mobile Bottom Navigation Bar (Field Ergonomics & Thumb Zone) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200/90 z-40 pb-[max(0.25rem,env(safe-area-inset-bottom))] shadow-xl">
          <div className="flex items-center justify-around h-16 px-1 max-w-lg mx-auto">
            {MOBILE_TABS.map((tab) => {
              const active = isTabActive(tab.path);
              const Icon = tab.icon;

              if (tab.isCenter) {
                return (
                  <button
                    key={tab.label}
                    type="button"
                    onClick={() => handleTabClick(tab)}
                    className="flex flex-col items-center justify-center -mt-6 focus:outline-none group active:scale-90 transition-transform"
                    aria-label="Quick Actions"
                  >
                    <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-600/35 border-4 border-white text-white group-hover:scale-105 transition-transform">
                      <Icon className="w-7 h-7 stroke-[2.8]" />
                    </div>
                    <span className="text-[10px] font-extrabold text-emerald-800 mt-0.5">Quick Actions</span>
                  </button>
                );
              }

              return (
                <button
                  key={tab.path}
                  type="button"
                  onClick={() => handleTabClick(tab)}
                  className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-2xl active:scale-95 transition-all ${
                    active ? 'text-emerald-700 font-extrabold' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5] text-emerald-600' : 'stroke-[1.8]'}`} />
                  <span className={`text-[10px] tracking-tight ${active ? 'font-extrabold text-emerald-800' : 'font-medium'}`}>
                    {tab.label}
                  </span>
                  {active && <div className="w-1 h-1 rounded-full bg-emerald-600 -mt-0.5" />}
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
