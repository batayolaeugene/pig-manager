import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scale,
  Utensils,
  PlusCircle,
  Layers,
  ClipboardCheck,
  Receipt,
  X,
  Sparkles,
} from 'lucide-react';

export function QuickActionSheet({ isOpen, onClose, onOpenQuickWeigh }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const actions = [
    {
      title: 'Quick Weigh-In',
      desc: 'Update scale weight & recalculate DA feed',
      icon: Scale,
      color: 'bg-emerald-500 text-white',
      badge: 'Fast',
      onClick: () => {
        onClose();
        if (onOpenQuickWeigh) onOpenQuickWeigh();
      },
    },
    {
      title: 'Daily Feeding Guide',
      desc: 'Morning & afternoon ration schedules',
      icon: Utensils,
      color: 'bg-blue-500 text-white',
      onClick: () => {
        onClose();
        navigate('/feed');
      },
    },
    {
      title: 'Add Single Pig',
      desc: 'Auto-generates DA vaccine schedule',
      icon: PlusCircle,
      color: 'bg-indigo-500 text-white',
      onClick: () => {
        onClose();
        navigate('/pigs/add');
      },
    },
    {
      title: 'Batch Management',
      desc: 'Group intake, cohort feed & profit',
      icon: Layers,
      color: 'bg-purple-500 text-white',
      onClick: () => {
        onClose();
        navigate('/batches');
      },
    },
    {
      title: 'Vaccine & Health Tasks',
      desc: 'Hog cholera, deworming & checks',
      icon: ClipboardCheck,
      color: 'bg-amber-500 text-white',
      onClick: () => {
        onClose();
        navigate('/tasks');
      },
    },
    {
      title: 'Log Sale or Feed Expense',
      desc: 'Track farm cash flow & profit in ₱',
      icon: Receipt,
      color: 'bg-rose-500 text-white',
      onClick: () => {
        onClose();
        navigate('/finance');
      },
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex flex-col justify-end lg:justify-center lg:items-center p-0 lg:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full lg:max-w-md bg-white rounded-t-3xl lg:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-slideIn flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab Handle for Mobile */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 lg:hidden" />

        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900 tracking-tight flex items-center gap-1.5">
              <span>Farm Quick Actions</span>
              <Sparkles className="w-4 h-4 text-emerald-500" />
            </h3>
            <p className="text-xs text-gray-500">Tap an action for fast field logging</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action List with Big Glove-Friendly Buttons */}
        <div className="p-4 overflow-y-auto space-y-2.5">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.title}
                type="button"
                onClick={act.onClick}
                className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-gray-50/80 hover:bg-emerald-50/60 active:bg-emerald-100/70 border border-gray-200/70 hover:border-emerald-300 transition-all text-left group shadow-xs"
              >
                <div
                  className={`w-11 h-11 rounded-xl ${act.color} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900 group-hover:text-emerald-800 truncate">
                      {act.title}
                    </span>
                    {act.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                        {act.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{act.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-[11px] text-gray-400">
            PorkPro PH &bull; Aligned with DA &amp; BAI Standards
          </p>
        </div>
      </div>
    </div>
  );
}

export default QuickActionSheet;
