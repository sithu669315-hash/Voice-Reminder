import React from 'react';
import { Layers, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import { Task } from '../types';

interface StatsGridProps {
  tasks: Task[];
}

export const StatsGrid: React.FC<StatsGridProps> = ({ tasks }) => {
  const total = tasks.length;
  const pending = tasks.filter((t) => !t.completed).length;
  const completed = tasks.filter((t) => t.completed).length;

  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter((t) => t.date === today);
  const todayCompleted = todayTasks.filter((t) => t.completed).length;
  const todayRate = todayTasks.length > 0 ? Math.round((todayCompleted / todayTasks.length) * 100) : 0;

  const stats = [
    {
      title: 'စုစုပေါင်း Tasks',
      englishTitle: 'Total Tasks',
      value: total,
      unit: 'ခု',
      icon: Layers,
      accentColor: 'text-[#5B7CFA]',
      bgGradient: 'from-blue-500/10 to-indigo-500/5',
      borderColor: 'border-blue-500/20',
      description: 'မှတ်တမ်းရှိ အားလုံး',
    },
    {
      title: 'မပြီးသေးသော Tasks',
      englishTitle: 'Pending Tasks',
      value: pending,
      unit: 'ခု',
      icon: Clock,
      accentColor: 'text-amber-500',
      bgGradient: 'from-amber-500/10 to-orange-500/5',
      borderColor: 'border-amber-500/20',
      description: 'လုပ်ဆောင်ရန် ကျန်ရှိ',
    },
    {
      title: 'ပြီးစီးခဲ့သော Tasks',
      englishTitle: 'Completed Tasks',
      value: completed,
      unit: 'ခု',
      icon: CheckCircle2,
      accentColor: 'text-emerald-500',
      bgGradient: 'from-emerald-500/10 to-teal-500/5',
      borderColor: 'border-emerald-500/20',
      description: 'ပြီးမြောက်မှု အောင်မြင်',
    },
    {
      title: 'ယနေ့ ပြီးစီးမှုနှုန်း',
      englishTitle: 'Today Progress',
      value: `${todayRate}%`,
      unit: '',
      icon: TrendingUp,
      accentColor: 'text-[#A78BFA]',
      bgGradient: 'from-purple-500/10 to-pink-500/5',
      borderColor: 'border-purple-500/20',
      description: `ယနေ့ ${todayCompleted}/${todayTasks.length} ခု ပြီးစီး`,
      progress: todayRate,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="p-4 sm:p-5 rounded-2xl glass-card relative overflow-hidden flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-[#64748B] dark:text-slate-400 burmese-text leading-tight">
                {stat.title}
              </span>
              <div
                className={`w-8 h-8 rounded-xl bg-gradient-to-br ${stat.bgGradient} flex items-center justify-center shrink-0 ${stat.accentColor}`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-bold text-[#172033] dark:text-white tabular-nums tracking-tight">
                  {stat.value}
                </span>
                {stat.unit && (
                  <span className="text-xs font-medium text-slate-400 dark:text-slate-500 burmese-text">
                    {stat.unit}
                  </span>
                )}
              </div>

              {stat.progress !== undefined ? (
                <div className="space-y-1 pt-1">
                  <div className="w-full bg-slate-200/80 dark:bg-slate-700/60 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#5B7CFA] to-[#A78BFA] h-full rounded-full transition-all duration-500"
                      style={{ width: `${stat.progress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-[#64748B] dark:text-slate-400 burmese-text truncate">
                    {stat.description}
                  </p>
                </div>
              ) : (
                <p className="text-[10px] text-[#64748B] dark:text-slate-400 burmese-text truncate">
                  {stat.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
