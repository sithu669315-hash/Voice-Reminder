import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  ClipboardList,
  Calendar,
  Mic,
  CheckCircle2,
  Bell,
  Settings,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { NavItemKey, Task } from '../types';

interface SidebarProps {
  activeNav: NavItemKey;
  setActiveNav: (nav: NavItemKey) => void;
  tasks: Task[];
  onOpenAddModal: () => void;
  onOpenVoiceModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeNav,
  setActiveNav,
  tasks,
  onOpenAddModal,
  onOpenVoiceModal,
}) => {
  const pendingCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  const navItems = [
    {
      key: 'dashboard' as NavItemKey,
      label: 'ပင်မ ဒက်ရှ်ဘုတ်',
      sublabel: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      key: 'tasks' as NavItemKey,
      label: 'လုပ်ဆောင်ဖွယ်များ',
      sublabel: 'Daily Tasks',
      icon: CheckSquare,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      key: 'records' as NavItemKey,
      label: 'လုပ်ငန်းမှတ်တမ်း',
      sublabel: 'Daily / Weekly / Monthly',
      icon: ClipboardList,
      badge: null,
    },
    {
      key: 'voice' as NavItemKey,
      label: 'အသံဖြင့် ထည့်သွင်းရန်',
      sublabel: 'Voice Input',
      icon: Mic,
      badge: null,
      action: onOpenVoiceModal,
    },
    {
      key: 'completed' as NavItemKey,
      label: 'ပြီးစီးခဲ့သည်များ',
      sublabel: 'Completed Tasks',
      icon: CheckCircle2,
      badge: completedCount > 0 ? completedCount : null,
    },
    {
      key: 'history' as NavItemKey,
      label: 'သတိပေးမှု မှတ်တမ်း',
      sublabel: 'Reminder History',
      icon: Bell,
      badge: null,
    },
    {
      key: 'settings' as NavItemKey,
      label: 'ဆက်တင်များ',
      sublabel: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  const totalTasks = tasks.length;
  const completedRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return (
    <>
      {/* Desktop / Tablet Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 shrink-0 glass-surface border-r border-white/60 dark:border-white/10 p-5 min-h-screen sticky top-0 z-20">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3.5 px-2 py-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#5B7CFA] to-[#A78BFA] flex items-center justify-center text-white shadow-md shadow-[#5B7CFA]/25">
            <Volume2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-[#172033] dark:text-white burmese-text leading-tight">
              မြန်မာ Task & အသံသတိပေး
            </h1>
            <p className="text-[11px] font-medium text-[#64748B] dark:text-slate-400">
              Burmese Voice Daily Reminder
            </p>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="mb-6">
          <button
            onClick={onOpenAddModal}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#5B7CFA] to-[#4361EE] hover:from-[#4E70F8] hover:to-[#3A56DF] text-white text-xs font-semibold shadow-lg shadow-[#5B7CFA]/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 burmese-text"
          >
            <Sparkles className="w-4 h-4 text-white/90" />
            <span>Task အသစ် ထည့်သွင်းမည်</span>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-slate-400 px-3 py-1 burmese-text">
            အဓိက အပိုင်းများ
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.key;
            return (
              <button
                key={item.key}
                onClick={() => {
                  if (item.action) {
                    item.action();
                  } else {
                    setActiveNav(item.key);
                  }
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between group ${
                  isActive
                    ? 'bg-white/80 dark:bg-white/10 text-[#5B7CFA] dark:text-blue-400 shadow-sm border border-white/90 dark:border-white/10 font-semibold'
                    : 'text-[#64748B] dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/5 hover:text-[#172033] dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? 'text-[#5B7CFA] dark:text-blue-400'
                        : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
                    }`}
                  />
                  <div>
                    <span className="block burmese-text leading-tight">{item.label}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                      {item.sublabel}
                    </span>
                  </div>
                </div>

                {item.badge !== null && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold tabular-nums ${
                      isActive
                        ? 'bg-[#5B7CFA]/15 text-[#5B7CFA] dark:bg-blue-400/20 dark:text-blue-300'
                        : 'bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Mini Progress Card */}
        <div className="mt-auto pt-4 border-t border-slate-200/60 dark:border-white/10">
          <div className="p-3.5 rounded-2xl glass-card bg-gradient-to-br from-white/70 to-blue-50/40 dark:from-slate-800/60 dark:to-slate-900/40">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 burmese-text">
                ယနေ့ ပြီးစီးမှုနှုန်း
              </span>
              <span className="text-xs font-bold text-[#5B7CFA] dark:text-blue-400 tabular-nums">
                {completedRate}%
              </span>
            </div>
            <div className="w-full bg-slate-200/80 dark:bg-slate-700/60 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#5B7CFA] to-[#A78BFA] h-full rounded-full transition-all duration-500"
                style={{ width: `${completedRate}%` }}
              />
            </div>
            <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 flex justify-between burmese-text">
              <span>ပြီးစီး: {completedCount}</span>
              <span>စုစုပေါင်း: {totalTasks}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 glass-surface border-t border-white/60 dark:border-white/10 px-2 py-2 flex items-center justify-around">
        <button
          onClick={() => setActiveNav('dashboard')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] ${
            activeNav === 'dashboard'
              ? 'text-[#5B7CFA] dark:text-blue-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="burmese-text">ပင်မ</span>
        </button>

        <button
          onClick={() => setActiveNav('tasks')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] relative ${
            activeNav === 'tasks'
              ? 'text-[#5B7CFA] dark:text-blue-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <CheckSquare className="w-5 h-5" />
          {pendingCount > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-[#5B7CFA]" />
          )}
          <span className="burmese-text">Tasks</span>
        </button>

        {/* Center Add Button */}
        <button
          onClick={onOpenAddModal}
          className="w-12 h-12 -mt-5 rounded-full bg-gradient-to-tr from-[#5B7CFA] to-[#A78BFA] text-white flex items-center justify-center shadow-lg shadow-[#5B7CFA]/30 active:scale-95 transition-transform"
          title="Task သစ်ထည့်ရန်"
        >
          <Sparkles className="w-5 h-5" />
        </button>

        <button
          onClick={() => setActiveNav('records')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] ${
            activeNav === 'records' || activeNav === 'calendar'
              ? 'text-[#5B7CFA] dark:text-blue-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <ClipboardList className="w-5 h-5" />
          <span className="burmese-text">မှတ်တမ်း</span>
        </button>

        <button
          onClick={onOpenVoiceModal}
          className="flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] text-amber-500"
        >
          <Mic className="w-5 h-5" />
          <span className="burmese-text">အသံ</span>
        </button>
      </div>
    </>
  );
};
