import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function StatCard({
  title,
  value,
  change,
  changeLabel = 'vs last month',
  icon: Icon,
  iconBg = 'bg-emerald-50',
  iconColor = 'text-emerald-600',
  gradient,
  className = '',
}) {
  const hasChange = typeof change === 'number' || (typeof change === 'string' && change.trim() !== '');
  const numericChange = Number(change);
  const isPositive = hasChange && numericChange > 0;
  const isNegative = hasChange && numericChange < 0;

  return (
    <div
      className={`rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden ${
        gradient ? gradient : 'bg-white'
      } ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h4 className="text-3xl font-bold text-gray-900 tracking-tight">
            {value}
          </h4>
        </div>
        {Icon && (
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs ${iconBg} ${iconColor}`}
          >
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>

      {hasChange && (
        <div className="mt-4 flex items-center gap-1.5 text-xs font-medium">
          {isPositive && (
            <span className="inline-flex items-center text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
              +{Math.abs(numericChange)}%
            </span>
          )}
          {isNegative && (
            <span className="inline-flex items-center text-red-600 font-semibold bg-red-50 px-1.5 py-0.5 rounded">
              <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
              -{Math.abs(numericChange)}%
            </span>
          )}
          {!isPositive && !isNegative && (
            <span className="inline-flex items-center text-gray-500 font-semibold bg-gray-50 px-1.5 py-0.5 rounded">
              <Minus className="w-3.5 h-3.5 mr-0.5" />
              0%
            </span>
          )}
          <span className="text-gray-400">{changeLabel}</span>
        </div>
      )}
    </div>
  );
}

export default StatCard;
