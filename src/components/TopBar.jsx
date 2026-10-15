import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Bell, Search } from 'lucide-react';
import { useNotifications } from '../context/AppContext';
import NotificationPanel from './NotificationPanel';

export function TopBar({ onMenuClick }) {
  const location = useLocation();
  const { unreadCount = 0 } = useNotifications();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const getPageTitle = (pathname) => {
    if (pathname === '/') return 'Dashboard';
    if (pathname === '/pigs/add') return 'Add New Pig';
    if (pathname === '/pigs') return 'Pig Inventory';
    if (pathname.startsWith('/pigs/')) return 'Pig Details';
    if (pathname.startsWith('/batches')) return 'Batch Management';
    if (pathname.startsWith('/feed')) return 'Feed Calculator';
    if (pathname.startsWith('/finance')) return 'Finance';
    if (pathname.startsWith('/profit')) return 'Profit Calculator';
    if (pathname.startsWith('/tasks')) return 'Tasks & Schedule';
    return 'Farm Management';
  };

  const title = getPageTitle(location.pathname);

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between flex-shrink-0 z-30">
      {/* Left side: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h1>
      </div>

      {/* Right side: Search, Notifications, Avatar */}
      <div className="flex items-center gap-4">
        {/* Global Search (Hidden on Mobile) */}
        <div className="relative hidden md:block w-64 lg:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pigs, batches, tags..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white transition-all text-gray-800 placeholder:text-gray-400"
          />
        </div>

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className={`relative p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none ${
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
        <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
          <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-semibold text-xs flex items-center justify-center ring-2 ring-emerald-500/30 shadow-sm select-none">
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
