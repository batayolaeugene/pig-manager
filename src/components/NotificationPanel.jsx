import React, { useEffect, useRef } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCheck,
  Trash2,
  X,
} from 'lucide-react';
import { useNotifications } from '../context/AppContext';
import { formatRelative } from '../utils/helpers';

const TYPE_CONFIG = {
  info: {
    icon: Info,
    iconColor: 'text-blue-500',
    borderColor: 'border-l-blue-500',
    unreadBg: 'bg-blue-50/30',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    borderColor: 'border-l-amber-500',
    unreadBg: 'bg-amber-50/30',
  },
  success: {
    icon: CheckCircle2,
    iconColor: 'text-emerald-500',
    borderColor: 'border-l-emerald-500',
    unreadBg: 'bg-emerald-50/30',
  },
  error: {
    icon: AlertCircle,
    iconColor: 'text-red-500',
    borderColor: 'border-l-red-500',
    unreadBg: 'bg-red-50/30',
  },
};

export function NotificationPanel({ isOpen, onClose }) {
  const panelRef = useRef(null);
  const {
    notifications = [],
    unreadCount = 0,
    clearNotifications,
    markNotificationRead,
  } = useNotifications();

  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleMarkAllAsRead = () => {
    notifications
      .filter((n) => !n.read)
      .forEach((n) => markNotificationRead(n.id));
  };

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-scaleIn flex flex-col"
      role="region"
      aria-label="Notifications panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 bg-gray-50/60">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 text-sm">Notifications</span>
          {unreadCount > 0 && (
            <span className="badge-blue text-[11px] font-semibold px-2 py-0.5">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium px-2 py-1 rounded hover:bg-brand-50/80 transition-colors inline-flex items-center gap-1"
              title="Mark all as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={clearNotifications}
              className="text-xs text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
              title="Clear all notifications"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors ml-1"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto scrollbar-thin divide-y divide-gray-100">
        {notifications.length === 0 ? (
          <div className="py-10 px-4 text-center">
            <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-2">
              <Bell className="w-5 h-5" />
            </div>
            <p className="text-sm font-medium text-gray-700">All caught up!</p>
            <p className="text-xs text-gray-400 mt-0.5">No notifications right now.</p>
          </div>
        ) : (
          notifications.map((item) => {
            const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.info;
            const IconComponent = config.icon;
            const isUnread = !item.read;

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (isUnread) {
                    markNotificationRead(item.id);
                  }
                }}
                className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer border-l-4 ${config.borderColor} ${
                  isUnread ? `${config.unreadBg} hover:bg-gray-100/70` : 'bg-white hover:bg-gray-50'
                }`}
              >
                <div className={`mt-0.5 flex-shrink-0 ${config.iconColor}`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs truncate ${isUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {item.title}
                    </p>
                    <span className="text-[11px] text-gray-400 flex-shrink-0 whitespace-nowrap">
                      {formatRelative(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                    {item.message}
                  </p>
                </div>
                {isUnread && (
                  <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1.5" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default NotificationPanel;
