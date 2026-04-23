import React, { useState, useImperativeHandle, forwardRef } from 'react';

// 1. We define the shape of our "remote control" so TypeScript knows what buttons exist.
export interface ToastHandle {
  showToast: (message: string) => void;
}

// 2. We use 'forwardRef' so this component can accept a 'ref' from its parent.
const ToastNotification = forwardRef<ToastHandle>((_props, ref) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');

  // 3. REQUIREMENT: useImperativeHandle
  // This wires up the functions that the parent is allowed to trigger.
  useImperativeHandle(ref, () => ({
    showToast: (newMessage: string) => {
      setMessage(newMessage);
      setVisible(true);
      
      // Automatically hide the toast after 3 seconds
      setTimeout(() => {
        setVisible(false);
      }, 3000);
    }
  }));

  // If it's not visible, render nothing to the screen
  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl font-medium animate-bounce z-50">
      ✅ {message}
    </div>
  );
});

export default ToastNotification;