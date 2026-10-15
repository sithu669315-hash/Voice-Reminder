import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Sparkles, MessageSquare } from 'lucide-react';
import { Task, TaskCategory, TaskPriority } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Omit<Task, 'id' | 'completed' | 'completedAt' | 'notified'>, editingId?: number) => void;
  initialTask?: Task | null;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState<TaskCategory>('အလုပ်');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [ttsMessage, setTtsMessage] = useState('');

  const quickPresets = [
    { title: 'နံနက် ရေသောက်ရန်', category: 'ကျန်းမာရေး' as TaskCategory, time: '08:00' },
    { title: 'အလုပ် အစည်းအဝေး', category: 'အလုပ်' as TaskCategory, time: '10:00' },
    { title: 'နေ့လယ်စာ စားရန်', category: 'ကိုယ်ရေးကိုယ်တာ' as TaskCategory, time: '12:30' },
    { title: 'စာဖတ်ရန်နှင့် လေ့လာရန်', category: 'ပညာရေး' as TaskCategory, time: '15:00' },
    { title: 'လေ့ကျင့်ခန်း လုပ်ရန်', category: 'ကျန်းမာရေး' as TaskCategory, time: '17:30' },
    { title: 'ဆေးသောက်ရန်', category: 'ကျန်းမာရေး' as TaskCategory, time: '20:00' },
  ];

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDate(initialTask.date);
      setTime(initialTask.time);
      setCategory(initialTask.category as TaskCategory);
      setPriority(initialTask.priority);
      setTtsMessage(initialTask.ttsMessage || '');
    } else {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMins = String(now.getMinutes()).padStart(2, '0');
      setTitle('');
      setDate(today);
      setTime(`${currentHours}:${currentMins}`);
      setCategory('အလုပ်');
      setPriority('medium');
      setTtsMessage('');
    }
  }, [initialTask, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave(
      {
        title: title.trim(),
        date: date || new Date().toISOString().split('T')[0],
        time: time || '12:00',
        category,
        priority,
        ttsMessage: ttsMessage.trim() || `${title.trim()} ပြုလုပ်ရန် အချိန်တန်ပါပြီ`,
      },
      initialTask ? initialTask.id : undefined
    );

    onClose();
  };

  const handleApplyPreset = (preset: typeof quickPresets[0]) => {
    setTitle(preset.title);
    setCategory(preset.category);
    setTime(preset.time);
    setTtsMessage(`${preset.title} ပြုလုပ်ရန် အချိန်တန်ပါပြီ`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md transition-all">
      <div className="relative w-full max-w-lg rounded-3xl glass-surface p-6 sm:p-7 border border-white/80 dark:border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-white/10">
          <div>
            <h3 className="text-base font-bold text-[#172033] dark:text-white burmese-text">
              {initialTask ? 'Task ပြင်ဆင်ရန်' : 'Task အသစ် ဖန်တီးမည်'}
            </h3>
            <p className="text-[11px] text-[#64748B] dark:text-slate-400">
              {initialTask ? 'Update task details & Burmese voice' : 'Set reminder time, category & Burmese voice'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Suggestion Presets */}
        {!initialTask && (
          <div className="mt-4 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 burmese-text">
              အမြန်ရွေးချယ်စရာ ပုံစံများ (Quick Presets)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickPresets.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-white/70 dark:bg-slate-800/80 hover:bg-[#5B7CFA]/10 hover:text-[#5B7CFA] dark:hover:text-blue-300 border border-slate-200/80 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 transition burmese-text"
                >
                  + {p.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Task Title */}
          <div>
            <label className="text-[11px] font-semibold text-[#172033] dark:text-slate-200 block mb-1 burmese-text">
              လုပ်ဆောင်ဖွယ် ခေါင်းစဉ် (Task Title) *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!ttsMessage || ttsMessage === `${title} ပြုလုပ်ရန် အချိန်တန်ပါပြီ`) {
                  setTtsMessage(`${e.target.value} ပြုလုပ်ရန် အချိန်တန်ပါပြီ`);
                }
              }}
              placeholder="ဥပမာ: နေ့လယ် ၁:၀၀ အစည်းအဝေးတက်ရန်"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl glass-input text-[#172033] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B7CFA]/30 focus:border-[#5B7CFA] transition burmese-text"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#172033] dark:text-slate-200 block mb-1 burmese-text flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" /> ရက်စွဲ (Date)
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl glass-input text-[#172033] dark:text-white outline-none focus:ring-1 focus:ring-[#5B7CFA]"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#172033] dark:text-slate-200 block mb-1 burmese-text flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" /> အချိန် (Time)
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl glass-input text-[#172033] dark:text-white outline-none focus:ring-1 focus:ring-[#5B7CFA]"
              />
            </div>
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-[#172033] dark:text-slate-200 block mb-1 burmese-text">
                ကဏ္ဍ (Category)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full px-3 py-2 text-xs rounded-xl glass-input text-[#172033] dark:text-white outline-none focus:ring-1 focus:ring-[#5B7CFA] burmese-text"
              >
                <option value="အလုပ်">အလုပ်</option>
                <option value="ကိုယ်ရေးကိုယ်တာ">ကိုယ်ရေးကိုယ်တာ</option>
                <option value="ကျန်းမာရေး">ကျန်းမာရေး</option>
                <option value="ပညာရေး">ပညာရေး</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#172033] dark:text-slate-200 block mb-1 burmese-text">
                ဦးစားပေး (Priority)
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 text-xs rounded-xl glass-input text-[#172033] dark:text-white outline-none focus:ring-1 focus:ring-[#5B7CFA] burmese-text"
              >
                <option value="low">ပုံမှန် (Low)</option>
                <option value="medium">အလယ်အလတ် (Medium)</option>
                <option value="high">အရေးကြီး (High)</option>
              </select>
            </div>
          </div>

          {/* Burmese TTS Message */}
          <div>
            <label className="text-[11px] font-semibold text-[#172033] dark:text-slate-200 block mb-1 burmese-text flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3 text-amber-500" />
              <span>အသံသတိပေး စာသား (Burmese Voice TTS Message)</span>
            </label>
            <textarea
              rows={2}
              value={ttsMessage}
              onChange={(e) => setTtsMessage(e.target.value)}
              placeholder="သတ်မှတ်ချိန်တွင် အသံဖြင့် ပြောကြားပေးမည့် မြန်မာစာသား..."
              className="w-full px-3.5 py-2 text-xs rounded-xl glass-input text-[#172033] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B7CFA]/30 focus:border-[#5B7CFA] transition burmese-text"
            />
            <p className="text-[10px] text-slate-400 mt-1 burmese-text">
              မဖြည့်ပါက ခေါင်းစဉ်အတိုင်း အလိုအလျောက် သတိပေးပါမည်။
            </p>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200/60 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition burmese-text"
            >
              ပယ်ဖျက်မည်
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5B7CFA] to-[#4361EE] hover:from-[#4E70F8] hover:to-[#3A56DF] text-white text-xs font-semibold shadow-md shadow-[#5B7CFA]/25 active:scale-95 transition burmese-text flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{initialTask ? 'ပြင်ဆင်ချက် သိမ်းမည်' : 'Task သိမ်းဆည်းမည်'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
