import React, { useState } from 'react';
import { Sparkles, ArrowRight, Wand2 } from 'lucide-react';
import { Task } from '../types';

interface WelcomeBannerProps {
  tasks: Task[];
  onAddNaturalTask: (input: string) => void;
  onOpenVoiceModal: () => void;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
  tasks,
  onAddNaturalTask,
  onOpenVoiceModal,
}) => {
  const [nlInput, setNlInput] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter((t) => t.date === today);
  const totalToday = todayTasks.length;
  const completedToday = todayTasks.filter((t) => t.completed).length;
  const pendingToday = totalToday - completedToday;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nlInput.trim()) {
      onAddNaturalTask(nlInput.trim());
      setNlInput('');
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl glass-surface p-6 sm:p-7 border border-white/70 dark:border-white/10 bg-gradient-to-br from-white/75 via-[#F0F4FF]/70 to-[#F5F0FF]/60 dark:from-slate-900/80 dark:via-slate-900/60 dark:to-indigo-950/40 shadow-xl shadow-[#5B7CFA]/5">
      {/* Subtle restrained decorative glow (soft, non-distracting) */}
      <div className="absolute -top-16 -right-16 w-60 h-60 bg-gradient-to-br from-[#5B7CFA]/15 to-[#A78BFA]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-52 h-52 bg-gradient-to-tr from-[#67D5E8]/15 to-[#5B7CFA]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Left: Summary Prose */}
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5B7CFA]/10 dark:bg-[#5B7CFA]/20 text-[#5B7CFA] dark:text-blue-300 text-[11px] font-semibold burmese-text">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ယနေ့အတွက် စီမံခန့်ခွဲမှု အကျဉ်းချုပ်</span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-[#172033] dark:text-white burmese-text leading-snug">
            {totalToday === 0 ? (
              'ယနေ့အတွက် လုပ်ဆောင်ဖွယ်များ စတင်စီစဉ်ပါ'
            ) : pendingToday === 0 ? (
              'သာဓုပါ! ယနေ့ လုပ်ဆောင်ဖွယ်များ အားလုံး ပြီးမြောက်ပါပြီ'
            ) : (
              <>
                ယနေ့ လုပ်ဆောင်ဖွယ် <span className="text-[#5B7CFA] dark:text-blue-400 tabular-nums">{totalToday}</span> ခုအနက်{' '}
                <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">{completedToday}</span> ခု ပြီးစီးထားပြီး{' '}
                <span className="text-amber-600 dark:text-amber-400 tabular-nums">{pendingToday}</span> ခု ကျန်ရှိပါသည်
              </>
            )}
          </h3>

          <p className="text-xs text-[#64748B] dark:text-slate-400 burmese-text leading-relaxed">
            အချိန်မီ အသံဖြင့် သတိပေးချက်များ လက်ခံရယူပြီး သင့်တစ်နေ့တာ လုပ်ငန်းတာဝန်များကို အလွယ်တကူ စီမံလိုက်ပါ။
          </p>
        </div>

        {/* Right: Quick Voice shortcut pill */}
        <div className="shrink-0 flex items-center gap-2">
          <button
            onClick={onOpenVoiceModal}
            className="px-4 py-2.5 rounded-2xl glass-card border-white/80 dark:border-white/10 hover:border-amber-400/40 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 transition-all flex items-center gap-2 shadow-sm active:scale-95 burmese-text"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>အသံဖြင့် Task ဖန်တီးမည်</span>
          </button>
        </div>
      </div>

      {/* Smart AI Natural Language Input Row */}
      <div className="relative z-10 mt-5 pt-4 border-t border-slate-200/60 dark:border-white/10">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch gap-2.5">
          <div className="relative flex-1">
            <Wand2 className="w-4 h-4 text-[#5B7CFA] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={nlInput}
              onChange={(e) => setNlInput(e.target.value)}
              placeholder="စမတ်စာသားဖြင့် ထည့်ရန် ဥပမာ: အလုပ် / မနက် ၉:၀၀ / အစည်းအဝေးတက်ရန်"
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl glass-input text-[#172033] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B7CFA]/30 focus:border-[#5B7CFA] transition-all burmese-text"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-2xl bg-[#5B7CFA] hover:bg-[#4E70F8] text-white text-xs font-semibold shadow-md shadow-[#5B7CFA]/20 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 burmese-text"
          >
            <span>ထည့်မည်</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 mt-2 text-[10px] text-[#64748B] dark:text-slate-400 burmese-text">
          <span className="font-semibold text-slate-500 dark:text-slate-300">Format အကြံပြုချက်:</span>
          <span>[ကဏ္ဍ] / [အချိန်] / [ခေါင်းစဉ်]</span>
          <span className="text-slate-300 dark:text-slate-600">·</span>
          <span>ဥပမာ: ကျန်းမာရေး / မနက် ၈:၀၀ / ရေသောက်ရန်</span>
        </div>
      </div>
    </div>
  );
};
