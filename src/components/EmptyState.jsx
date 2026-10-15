import React from 'react';
import { PackageOpen } from 'lucide-react';

export function EmptyState({
  icon: Icon = PackageOpen,
  title = 'No items found',
  description = 'There are no records to display at this time.',
  action,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-white border border-dashed border-gray-200 ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mb-4 text-brand-600 shadow-sm">
        <Icon className="w-8 h-8 opacity-80" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-5 leading-relaxed">
        {description}
      </p>
      {action && action.label && action.onClick && (
        <button
          type="button"
          onClick={action.onClick}
          className="btn-primary inline-flex items-center gap-2"
        >
          {action.icon && <action.icon className="w-4 h-4" />}
          {action.label}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
