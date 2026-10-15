import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, ArrowLeft, Settings } from 'lucide-react';
import { useNotifications } from '../context/AppContext';
import NotificationPanel from './NotificationPanel';
import { SettingsModal } from './SettingsModal';

export function TopBar({ onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount = 0 } = useNotifications();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isHome = location.pathname === '/';

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

  const getGreetingInfo = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return { text: 'Good morning', emoji: '☀️' };
    }
    if (hour >= 12 && hour < 18) {
      return { text: 'Good afternoon', emoji: '🌤️' };
    }
    return { text: 'Good evening', emoji: '🌙' };
  };

  const greeting = getGreetingInfo();

  return (
    <>
      <header
        className={`h-16 px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-30 transition-all ${
          isHome
            ? 'bg-[#f8f9fc] border-b-0 lg:bg-white lg:border-b lg:border-gray-200/90'
            : 'bg-white border-b border-gray-200/90'
        }`}
      >
        {/* Left side */}
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
          {isHome ? (
            /* Mobile Home Greeting (Matches exact screenshot layout) */
            <div className="flex items-center gap-2 lg:hidden">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {greeting.text}
              </h1>
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100/90 text-base shadow-2xs">
                {greeting.emoji}
              </span>
            </div>
          ) : (
            /* Subpage Navigation (Back button or Menu toggle) */
            <div className="flex items-center gap-2 lg:hidden">
              {isSubpage ? (
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="p-2 -ml-1 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors active:scale-95"
                  aria-label="Back to previous page"
                >
                  <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onMenuClick}
                  className="p-2 -ml-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors focus:outline-none active:scale-95"
                  aria-label="Open sidebar menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}
              <h1 className="text-lg font-extrabold text-gray-900 tracking-tight truncate">
                {title}
              </h1>
            </div>
          )}

          {/* Desktop Title & Menu */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              type="button"
              onClick={onMenuClick}
              className="p-2 -ml-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors focus:outline-none"
              aria-label="Toggle navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
              {title}
            </h1>
          </div>
        </div>

        {/* Right side: Mobile bell & settings OR Desktop search & profile */}
        <div className="flex items-center gap-2.5 sm:gap-4 flex-shrink-0">
          {/* Mobile Right Controls: Bell and Settings Circular Buttons */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsNotifOpen((prev) => !prev)}
                className="relative w-10 h-10 rounded-full bg-white border border-slate-200/90 shadow-xs flex items-center justify-center text-slate-700 active:scale-95 transition-all"
                aria-label="Notifications"
              >
                <span className="text-lg">🔔</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-xs ring-2 ring-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="w-10 h-10 rounded-full bg-white border border-slate-200/90 shadow-xs flex items-center justify-center text-slate-700 active:scale-95 transition-all"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>

          {/* Desktop Controls */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Sync badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-bold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>DA Live</span>
            </div>

            {/* Global Search */}
            <div className="relative w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pigs, batches, tags..."
                className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all text-gray-800 placeholder:text-gray-400 font-medium"
              />
            </div>

            {/* Desktop Notification Bell */}
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
                  <span className="absolute top-1 right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Desktop Settings Gear */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:scale-95 transition-all"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* User Avatar */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-extrabold text-xs flex items-center justify-center ring-2 ring-emerald-500/30 shadow-xs select-none">
                JW
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-gray-800 leading-tight">Jin-Woo</p>
                <p className="text-[11px] text-gray-400 leading-tight">Farm Admin</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Notification Dropdown Panel */}
      <NotificationPanel
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}

export default TopBar;
