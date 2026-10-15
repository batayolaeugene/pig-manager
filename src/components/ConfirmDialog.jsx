import React from 'react';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';
import Modal from './Modal';

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
}) {
  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';

  const iconConfig = {
    danger: {
      icon: AlertTriangle,
      iconContainer: 'bg-red-50 text-red-600 ring-8 ring-red-50/50',
      confirmBtn: 'btn-danger',
    },
    warning: {
      icon: AlertCircle,
      iconContainer: 'bg-amber-50 text-amber-600 ring-8 ring-amber-50/50',
      confirmBtn: 'inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 active:bg-amber-800 transition-colors duration-150 shadow-sm',
    },
    info: {
      icon: Info,
      iconContainer: 'bg-blue-50 text-blue-600 ring-8 ring-blue-50/50',
      confirmBtn: 'btn-primary',
    },
  };

  const currentConfig = iconConfig[variant] || iconConfig.danger;
  const IconComponent = currentConfig.icon;

  const handleConfirm = () => {
    onConfirm?.();
    onClose?.();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" showClose={true}>
      <div className="flex flex-col items-center text-center pt-1 pb-2">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${currentConfig.iconContainer}`}>
          <IconComponent className="w-7 h-7" />
        </div>
        <p className="text-sm text-gray-600 leading-relaxed mb-6 px-2">
          {message}
        </p>
        <div className="flex items-center justify-end gap-3 w-full border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`${currentConfig.confirmBtn} flex-1`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
