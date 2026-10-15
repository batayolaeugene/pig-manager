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
  ArrowRight,
} from 'lucide-react';

export function QuickActionSheet({ isOpen, onClose, onOpenQuickWeigh }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const actions = [
    {
      title: 'Quick Weigh',
      desc: '1-tap scale log',
      icon: Scale,
      color: 'bg-emerald-500 text-white',
      badge: 'Fast',
      onClick: () => {
        onClose();
        if (onOpenQuickWeigh) onOpenQuickWeigh();
      },
    },
    {
      title: 'Daily Feeding',
      desc: 'DA morning & afternoon',
      icon: Utensils,
      color: 'bg-blue-500 text-white',
      onClick: () => {
        onClose();
        navigate('/feed');
      },
    },
    {
      title: 'Add Pig',
      desc: 'Single or batch intake',
      icon: PlusCircle,
      color: 'bg-indigo-500 text-white',
      onClick: () => {
        onClose();
        navigate('/pigs/add');
      },
    },
    {
      title: 'Batches',
      desc: 'Pen & cohort groups',
      icon: Layers,
      color: 'bg-purple-500 text-white',
      onClick: () => {
        onClose();
        navigate('/batches');
      },
    },
    {
      title: 'Tasks & Health',
      desc: 'Vaccines & deworming',
      icon: ClipboardCheck,
      color: 'bg-amber-500 text-white',
      onClick: () => {
        onClose();
        navigate('/tasks');
      },
    },
    {
      title: 'Log Finance',
      desc: 'Sales & feed costs (₱)',
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
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex flex-col justify-end lg:justify-center lg:items-center p-0 lg:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full lg:max-w-md bg-white rounded-t-3xl lg:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-slideIn flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab Handle for Mobile */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 lg:hidden" />

        {/* Header */}
        <div className="px-5 py-3.5 flex items-center justify-between border-b border-gray-100">
          <div>
            <h3 className="text-base font-extrabold text-gray-900 tracking-tight flex items-center gap-1.5">
              <span>Quick Field Actions</span>
              <Sparkles className="w-4 h-4 text-emerald-500" />
            </h3>
            <p className="text-[11px] text-gray-400">One-tap swine operations</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Grid: 2-Column Chunky Tactile Tiles (Glove & Thumb Friendly) */}
        <div className="p-4 overflow-y-auto grid grid-cols-2 gap-2.5">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.title}
                type="button"
                onClick={act.onClick}
                className="flex flex-col items-center text-center p-3.5 rounded-2xl bg-gray-50/90 hover:bg-emerald-50/60 active:scale-95 border border-gray-200/80 hover:border-emerald-300 transition-all group shadow-xs relative"
              >
                {act.badge && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                    {act.badge}
                  </span>
                )}
                <div
                  className={`w-12 h-12 rounded-2xl ${act.color} flex items-center justify-center mb-2 shadow-sm group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-6 h-6 stroke-[2.2]" />
                </div>
                <span className="text-xs font-extrabold text-gray-900 group-hover:text-emerald-800 leading-tight">
                  {act.title}
                </span>
                <span className="text-[10px] text-gray-400 mt-1 line-clamp-1">
                  {act.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-[10px] text-gray-400 font-medium">
            Philippine DA &bull; Bureau of Animal Industry (BAI) Standards
          </p>
        </div>
      </div>
    </div>
  );
}

export default QuickActionSheet;
