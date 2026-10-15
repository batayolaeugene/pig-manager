import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function StatCard({
  title,
  value,
  change,
  changeLabel = '',
  icon: Icon,
  iconBg = 'bg-emerald-50',
  iconColor = 'text-emerald-600',
  gradient,
  className = '',
}) {
  const hasChange = change !== undefined && change !== null && change !== '';
  const numericChange = Number(change);
  const isNumeric = !isNaN(numericChange) && typeof change !== 'boolean';
  const isPositive = isNumeric && numericChange > 0;
  const isNegative = isNumeric && numericChange < 0;

  return (
    <div
      className={`rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
        gradient ? gradient : 'bg-white'
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider truncate mb-1">
            {title}
          </p>
          <h4 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight tabular-nums truncate">
            {value}
          </h4>
        </div>
        {Icon && (
          <div
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs ${iconBg} ${iconColor}`}
          >
            <Icon className="w-5 h-5 sm:w-5 sm:h-5" />
          </div>
        )}
      </div>

      {hasChange && (
        <div className="mt-3 pt-2.5 border-t border-gray-100/80 flex items-center justify-between text-xs">
          {isNumeric ? (
            <div className="flex items-center gap-1.5 font-semibold">
              {isPositive && (
                <span className="inline-flex items-center text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px] font-bold">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +{Math.abs(numericChange)}%
                </span>
              )}
              {isNegative && (
                <span className="inline-flex items-center text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md text-[11px] font-bold">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  -{Math.abs(numericChange)}%
                </span>
              )}
              {!isPositive && !isNegative && (
                <span className="inline-flex items-center text-gray-600 bg-gray-50 px-2 py-0.5 rounded-md text-[11px] font-bold">
                  0%
                </span>
              )}
            </div>
          ) : (
            <span className="inline-flex items-center text-gray-700 bg-gray-100/80 px-2 py-0.5 rounded-md text-[11px] font-bold truncate">
              {change}
            </span>
          )}

          {changeLabel && (
            <span className="text-[11px] text-gray-400 font-medium truncate ml-1">
              {changeLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default StatCard;
