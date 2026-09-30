import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 4);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'none'
      }}>
        {toasts.map((toast) => {
          let bgColor = '#059669';
          let Icon = CheckCircle2;
          if (toast.type === 'error') {
            bgColor = '#dc2626';
            Icon = AlertCircle;
          } else if (toast.type === 'info') {
            bgColor = '#2563eb';
            Icon = Info;
          } else if (toast.type === 'warning') {
            bgColor = '#d97706';
            Icon = AlertCircle;
          }

          return (
            <div
              key={toast.id}
              style={{
                backgroundColor: bgColor,
                color: '#ffffff',
                padding: '12px 18px',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '0.925rem',
                fontWeight: '500',
                pointerEvents: 'auto',
                maxWidth: '380px',
                animation: 'slideUp 0.25s ease-out'
              }}
            >
              <Icon size={20} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>{toast.message}</div>
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  color: 'rgba(255,255,255,0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px',
                  borderRadius: '4px'
                }}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
