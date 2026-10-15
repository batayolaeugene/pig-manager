import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Warehouse,
  PlusCircle,
  Layers,
  Calculator,
  ClipboardList,
  Receipt,
  TrendingUp,
  X,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const NAV_GROUPS = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Management',
    items: [
      { label: 'Pig Inventory', path: '/pigs', icon: Warehouse },
      { label: 'Add Pig', path: '/pigs/add', icon: PlusCircle },
      { label: 'Batches', path: '/batches', icon: Layers },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Feed Calculator', path: '/feed', icon: Calculator },
      { label: 'Tasks', path: '/tasks', icon: ClipboardList },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Transactions', path: '/finance', icon: Receipt },
      { label: 'Profit Calculator', path: '/profit', icon: TrendingUp },
    ],
  },
];

export function Sidebar({ isOpen, onClose }) {
  const location = useLocation();
  const { state } = useApp();
  const farmName = state?.settings?.farmName || 'PorkPro Farm';

  const isItemActive = (itemPath) => {
    if (itemPath === '/') {
      return location.pathname === '/';
    }
    return location.pathname === itemPath || location.pathname.startsWith(`${itemPath}/`);
  };

  const content = (
    <div className="flex flex-col h-full bg-slate-900 gradient-dark text-slate-200">
      {/* Brand & Logo Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800/80 flex-shrink-0">
        <Link
          to="/"
          onClick={onClose}
          className="flex items-center gap-3 group focus:outline-none"
        >
          <span className="text-2xl transform group-hover:scale-110 transition-transform select-none">
            🐷
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-white tracking-tight leading-none">
                PorkPro
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            </div>
            <span className="text-[11px] font-medium text-slate-400 tracking-wide">
              Farm Management
            </span>
          </div>
        </Link>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors focus:outline-none"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-4 py-5 scrollbar-thin space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="text-[11px] font-semibold text-slate-400/80 uppercase tracking-wider px-3 mb-2">
              {group.title}
            </p>
            <nav className="space-y-1">
              {group.items.map((item) => {
                const active = isItemActive(item.path);
                const IconComponent = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                      active
                        ? 'bg-brand-600 text-white font-medium shadow-sm shadow-brand-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-white/5 font-normal'
                    }`}
                  >
                    <IconComponent
                      className={`w-4 h-4 flex-shrink-0 transition-transform ${
                        active ? 'text-white' : 'text-slate-400 group-hover:text-white'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer Info Area */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="truncate mr-2">
            <p className="text-xs font-semibold text-slate-200 truncate">
              {farmName}
            </p>
            <p className="text-[10px] text-slate-500 font-mono">v1.0.0</p>
          </div>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-[260px] flex-shrink-0 h-screen border-r border-slate-800">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-slate-950/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        >
          <div
            className="fixed inset-y-0 left-0 w-[260px] max-w-[80vw] shadow-2xl animate-slideIn"
            onClick={(e) => e.stopPropagation()}
          >
            {content}
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
