import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, ArrowLeft } from 'lucide-react';
import { useNotifications } from '../context/AppContext';
import NotificationPanel from './NotificationPanel';

export function TopBar({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount = 0 } = useNotifications();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isSubpage =
    (location.pathname.startsWith('/pigs/') && location.pathname !== '/pigs') ||
    location.pathname === '/pigs/add' ||
    location.pathname === '/batches/add';

  const getPageTitle = (pathname) => {
    if (pathname === '/') return 'Dashboard';
    if (pathname === '/pigs/add') return 'Add Pig';
    if (pathname === '/pigs') return 'Pig Inventory';
    if (pathname.startsWith('/pigs/')) return 'Pig Profile';
    if (pathname.startsWith('/batches')) return 'Batches';
    if (pathname.startsWith('/feed')) return 'Feed Calculator';
    if (pathname.startsWith('/finance')) return 'Finance';
    if (pathname.startsWith('/profit')) return 'Profit Calculator';
    if (pathname.startsWith('/tasks')) return 'Tasks & Health';
    return 'PorkPro';
  };

  const title = getPageTitle(location.pathname);

  return (
    <header className="h-16 bg-white border-b border-gray-200/90 px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-30">
      {/* Left side: Mobile Back / Menu Toggle & Page Title */}
      <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
        {isSubpage ? (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="lg:hidden p-2 -ml-1 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors active:scale-95"
            aria-label="Back to previous page"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors focus:outline-none active:scale-95"
            aria-label="Open sidebar menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight truncate">
          {title}
        </h1>
      </div>

      {/* Right side: Search, Sync Badge, Notifications, Avatar */}
      <div className="flex items-center gap-2.5 sm:gap-4 flex-shrink-0">
        {/* Sync badge (Industry standard: Porcitec / PigCHAMP) */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-bold text-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>DA Live</span>
        </div>

        {/* Global Search (Hidden on Mobile) */}
        <div className="relative hidden md:block w-60 lg:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pigs, batches, tags..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all text-gray-800 placeholder:text-gray-400 font-medium"
          />
        </div>

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className={`relative p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:scale-95 transition-all focus:outline-none ${
              isNotifOpen ? 'bg-gray-100 text-gray-900' : ''
            }`}
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-xs animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <NotificationPanel
            isOpen={isNotifOpen}
            onClose={() => setIsNotifOpen(false)}
          />
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-gray-200">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center ring-2 ring-emerald-500/30 shadow-xs select-none">
            JW
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-semibold text-gray-800 leading-tight">Jin-Woo</p>
            <p className="text-[11px] text-gray-400 leading-tight">Farm Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
