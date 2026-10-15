import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
    const newToast = { id, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  const toast = useMemo(
    () => ({
      success: (msg, duration) => addToast(msg, 'success', duration),
      error: (msg, duration) => addToast(msg, 'error', duration),
      warning: (msg, duration) => addToast(msg, 'warning', duration),
      info: (msg, duration) => addToast(msg, 'info', duration),
      remove: removeToast,
    }),
    [addToast, removeToast]
  );

  return (
    <ToastContext.Provider value={{ toast, toasts, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback if used outside ToastProvider
    return {
      toast: {
        success: (msg) => console.log('[Toast Success]:', msg),
        error: (msg) => console.error('[Toast Error]:', msg),
        warning: (msg) => console.warn('[Toast Warning]:', msg),
        info: (msg) => console.log('[Toast Info]:', msg),
        remove: () => {},
      },
    };
  }
  return { toast: context.toast };
}

const typeConfig = {
  success: {
    icon: CheckCircle2,
    iconColor: 'text-emerald-500',
    borderColor: 'border-l-emerald-500',
    bgColor: 'bg-emerald-50/40',
  },
  error: {
    icon: AlertCircle,
    iconColor: 'text-red-500',
    borderColor: 'border-l-red-500',
    bgColor: 'bg-red-50/40',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    borderColor: 'border-l-amber-500',
    bgColor: 'bg-amber-50/40',
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-500',
    borderColor: 'border-l-blue-500',
    bgColor: 'bg-blue-50/40',
  },
};

export function ToastContainer() {
  const context = useContext(ToastContext);
  if (!context || !context.toasts || context.toasts.length === 0) {
    return null;
  }

  const { toasts, removeToast } = context;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((item) => {
        const config = typeConfig[item.type] || typeConfig.info;
        const IconComponent = config.icon;

        return (
          <div
            key={item.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 p-4 bg-white rounded-xl shadow-lg border border-gray-100 border-l-4 ${config.borderColor} ${config.bgColor} animate-slideIn transition-all duration-200`}
          >
            <IconComponent className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
            <div className="flex-1 text-sm font-medium text-gray-800 leading-snug">
              {item.message}
            </div>
            <button
              type="button"
              onClick={() => removeToast(item.id)}
              className="text-gray-400 hover:text-gray-600 p-0.5 rounded transition-colors focus:outline-none"
              aria-label="Close toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default ToastContainer;
