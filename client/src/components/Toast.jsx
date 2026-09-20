import { useEffect, useState } from 'react';

let toastId = 0;
let addToastFn = null;

export const toast = {
  success: (msg) => addToastFn?.({ id: ++toastId, type: 'success', msg }),
  error:   (msg) => addToastFn?.({ id: ++toastId, type: 'error',   msg }),
  info:    (msg) => addToastFn?.({ id: ++toastId, type: 'info',    msg }),
};

export default function Toast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    addToastFn = (t) => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 3500);
    };
    return () => { addToastFn = null; };
  }, []);

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{icons[t.type]}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
