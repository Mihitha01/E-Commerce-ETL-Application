import { useState, useImperativeHandle, forwardRef } from 'react';

/**
 * REQUIREMENT: useImperativeHandle + forwardRef
 * The parent Dashboard triggers showToast() via a ref — the parent
 * controls WHEN the toast appears without owning the toast's state.
 */
export interface ToastHandle {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const typeStyles = {
  success: 'from-emerald-500 to-teal-600',
  error: 'from-rose-500 to-red-600',
  info: 'from-indigo-500 to-purple-600',
};

const typeIcons = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

const ToastNotification = forwardRef<ToastHandle>((_props, ref) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'success' | 'error' | 'info'>('success');

  useImperativeHandle(ref, () => ({
    showToast: (newMessage: string, newType: 'success' | 'error' | 'info' = 'success') => {
      setMessage(newMessage);
      setType(newType);
      setVisible(true);
      setTimeout(() => setVisible(false), 4000);
    }
  }));

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-right">
      <div className={`bg-gradient-to-r ${typeStyles[type]} text-white px-5 py-3.5 rounded-xl 
        shadow-2xl flex items-center gap-3 min-w-[280px]`}>
        <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold flex-shrink-0">
          {typeIcons[type]}
        </span>
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
});

export default ToastNotification;