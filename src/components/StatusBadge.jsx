import React from 'react';
import {
  PIG_STATUS_LABELS,
  PIG_STATUS_COLORS,
  HEALTH_STATUS_LABELS,
  HEALTH_STATUS_COLORS,
} from '../utils/constants';

const TASK_PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'badge-gray' },
  medium: { label: 'Medium', color: 'badge-blue' },
  high: { label: 'High', color: 'badge-yellow' },
  urgent: { label: 'Urgent', color: 'badge-red' },
};

const TASK_STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'badge-yellow' },
  'in-progress': { label: 'In Progress', color: 'badge-blue' },
  completed: { label: 'Completed', color: 'badge-green' },
};

export function StatusBadge({ type, value, className = '' }) {
  if (!value) return null;

  const normalizedValue = String(value).toLowerCase();
  let label = String(value);
  let colorClass = 'badge-gray';

  switch (type) {
    case 'pig-status':
      label = PIG_STATUS_LABELS[normalizedValue] || PIG_STATUS_LABELS[value] || value;
      colorClass = PIG_STATUS_COLORS[normalizedValue] || PIG_STATUS_COLORS[value] || 'badge-gray';
      break;

    case 'health':
      label = HEALTH_STATUS_LABELS[normalizedValue] || HEALTH_STATUS_LABELS[value] || value;
      colorClass = HEALTH_STATUS_COLORS[normalizedValue] || HEALTH_STATUS_COLORS[value] || 'badge-gray';
      break;

    case 'task-priority': {
      const priorityInfo = TASK_PRIORITY_CONFIG[normalizedValue];
      if (priorityInfo) {
        label = priorityInfo.label;
        colorClass = priorityInfo.color;
      }
      break;
    }

    case 'task-status': {
      const statusInfo = TASK_STATUS_CONFIG[normalizedValue];
      if (statusInfo) {
        label = statusInfo.label;
        colorClass = statusInfo.color;
      }
      break;
    }

    default:
      label = value;
      colorClass = 'badge-gray';
      break;
  }

  return (
    <span className={`${colorClass} ${className} capitalize`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
      {label}
    </span>
  );
}

export default StatusBadge;
