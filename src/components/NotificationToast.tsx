import React, { useEffect } from 'react';
import { Bell, Check, X, Volume2 } from 'lucide-react';

export interface ToastData {
  id: string;
  title: string;
  message: string;
  taskId?: number;
  type?: 'reminder' | 'success' | 'info';
}

interface NotificationToastProps {
  toast: ToastData | null;
  onDismiss: () => void;
  onCompleteTask?: (taskId: number) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  toast,
  onDismiss,
  onCompleteTask,
}) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 7000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className="p-4 rounded-2xl glass-surface border border-white/80 dark:border-white/10 shadow-2xl flex items-start gap-3 bg-white/85 dark:bg-slate-900/85">
        {/* Icon */}
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            toast.type === 'reminder'
              ? 'bg-amber-500/15 text-amber-500'
              : 'bg-[#5B7CFA]/15 text-[#5B7CFA]'
          }`}
        >
          {toast.type === 'reminder' ? (
            <Volume2 className="w-5 h-5 animate-pulse" />
          ) : (
            <Bell className="w-5 h-5" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h5 className="text-xs font-bold text-[#172033] dark:text-white truncate burmese-text leading-tight">
            {toast.title}
          </h5>
          <p className="text-[11px] text-[#64748B] dark:text-slate-300 mt-0.5 line-clamp-2 burmese-text">
            {toast.message}
          </p>

          {/* Action button if related to a task */}
          {toast.taskId && onCompleteTask && (
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => {
                  onCompleteTask(toast.taskId!);
                  onDismiss();
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold transition flex items-center gap-1 burmese-text"
              >
                <Check className="w-3 h-3" />
                <span>ပြီးစီးကြောင်း မှတ်သားမည်</span>
              </button>
            </div>
          )}
        </div>

        {/* Dismiss Button */}
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
