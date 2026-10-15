import React from 'react';
import {
  Check,
  Clock,
  Volume2,
  Edit3,
  Trash2,
  Calendar as CalendarIcon,
  Inbox,
  Filter,
} from 'lucide-react';
import { Task, TaskPriority } from '../types';

interface TaskListProps {
  tasks: Task[];
  statusFilter: 'all' | 'pending' | 'completed';
  setStatusFilter: (f: 'all' | 'pending' | 'completed') => void;
  categoryFilter: string;
  setCategoryFilter: (c: string) => void;
  priorityFilter: 'all' | TaskPriority;
  setPriorityFilter: (p: 'all' | TaskPriority) => void;
  onToggleTask: (id: number) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: number) => void;
  onSpeakTTS: (text: string, taskId: number) => void;
  speakingTaskId: number | null;
  onOpenAddModal: () => void;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  statusFilter,
  setStatusFilter,
  categoryFilter,
  setCategoryFilter,
  priorityFilter,
  setPriorityFilter,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onSpeakTTS,
  speakingTaskId,
  onOpenAddModal,
}) => {
  const categories = ['အားလုံး', 'အလုပ်', 'ကိုယ်ရေးကိုယ်တာ', 'ကျန်းမာရေး', 'ပညာရေး'];

  // Priority color accents
  const getPriorityIndicator = (p: TaskPriority) => {
    switch (p) {
      case 'high':
        return {
          dot: 'bg-rose-500',
          label: 'အရေးကြီး',
          textColor: 'text-rose-600 dark:text-rose-400',
        };
      case 'medium':
        return {
          dot: 'bg-amber-500',
          label: 'အလယ်အလတ်',
          textColor: 'text-amber-600 dark:text-amber-400',
        };
      case 'low':
      default:
        return {
          dot: 'bg-blue-500',
          label: 'ပုံမှန်',
          textColor: 'text-blue-600 dark:text-blue-400',
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters & Segmented Controls Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl glass-surface border border-white/70 dark:border-white/10">
        {/* Status Filter Buttons (Segmented Control) */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/50 dark:bg-slate-800/60 rounded-xl">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all burmese-text whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-slate-700 text-[#5B7CFA] dark:text-blue-300 shadow-sm'
                : 'text-[#64748B] dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            အားလုံး
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all burmese-text whitespace-nowrap ${
              statusFilter === 'pending'
                ? 'bg-white dark:bg-slate-700 text-[#5B7CFA] dark:text-blue-300 shadow-sm'
                : 'text-[#64748B] dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            မပြီးသေး
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all burmese-text whitespace-nowrap ${
              statusFilter === 'completed'
                ? 'bg-white dark:bg-slate-700 text-[#5B7CFA] dark:text-blue-300 shadow-sm'
                : 'text-[#64748B] dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            ပြီးစီးပြီး
          </button>
        </div>

        {/* Secondary Category & Priority Selectors */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 text-xs text-[#64748B] dark:text-slate-400 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span className="burmese-text text-[11px]">ကဏ္ဍ:</span>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-xl glass-input text-slate-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-[#5B7CFA] burmese-text"
          >
            {categories.map((c) => (
              <option key={c} value={c === 'အားလုံး' ? 'all' : c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as 'all' | TaskPriority)}
            className="px-2.5 py-1.5 text-xs rounded-xl glass-input text-slate-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-[#5B7CFA] burmese-text"
          >
            <option value="all">ဦးစားပေး အားလုံး</option>
            <option value="high">အရေးကြီး (High)</option>
            <option value="medium">အလယ်အလတ် (Medium)</option>
            <option value="low">ပုံမှန် (Low)</option>
          </select>
        </div>
      </div>

      {/* Task Rows List */}
      {tasks.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl glass-surface border border-white/70 dark:border-white/10 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#5B7CFA]/10 text-[#5B7CFA] flex items-center justify-center mx-auto">
            <Inbox className="w-7 h-7" />
          </div>
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 burmese-text">
            လုပ်ဆောင်ဖွယ်များ မရှိသေးပါ
          </h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto burmese-text">
            သင့်အတွက် အချိန်မီ သတိပေးနိုင်ရန် Task အသစ်တစ်ခု ထည့်သွင်းလိုက်ပါ။
          </p>
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 rounded-xl bg-[#5B7CFA] hover:bg-[#4E70F8] text-white text-xs font-semibold shadow-md shadow-[#5B7CFA]/20 transition-all burmese-text"
          >
            + Task သစ် စတင်ဖန်တီးမည်
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {tasks.map((task) => {
            const priorityInfo = getPriorityIndicator(task.priority);
            const isSpeakingThis = speakingTaskId === task.id;

            return (
              <div
                key={task.id}
                className={`p-4 rounded-2xl glass-card flex items-center justify-between gap-3.5 transition-all group ${
                  task.completed
                    ? 'opacity-75 bg-white/40 dark:bg-slate-900/40'
                    : 'bg-white/65 dark:bg-slate-900/65'
                }`}
              >
                {/* Left: Checkbox & Main Info */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Custom Checkbox */}
                  <button
                    onClick={() => onToggleTask(task.id)}
                    className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                      task.completed
                        ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                        : 'border-2 border-slate-300 dark:border-slate-600 hover:border-[#5B7CFA] dark:hover:border-[#5B7CFA]'
                    }`}
                    title={task.completed ? 'မပြီးသေးအဖြစ် ပြောင်းရန်' : 'ပြီးစီးကြောင်း မှတ်သားရန်'}
                  >
                    {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  {/* Task Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${priorityInfo.dot}`} />
                      <h4
                        className={`text-xs sm:text-sm font-semibold truncate burmese-text ${
                          task.completed
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-[#172033] dark:text-white'
                        }`}
                      >
                        {task.title}
                      </h4>
                    </div>

                    {/* Unboxed Metadata Line (Zero-Pill Discipline) */}
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-[#64748B] dark:text-slate-400 burmese-text">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="tabular-nums">{task.time}</span>
                      </span>

                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>

                      <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <CalendarIcon className="w-3 h-3 text-slate-400" />
                        <span className="tabular-nums">{task.date}</span>
                      </span>

                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>

                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        {task.category}
                      </span>

                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>

                      <span className={`text-[10px] font-semibold ${priorityInfo.textColor}`}>
                        {priorityInfo.label}
                      </span>
                    </div>

                    {/* TTS Message hint if different from title */}
                    {task.ttsMessage && task.ttsMessage !== task.title && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 italic mt-0.5 truncate burmese-text">
                        အသံ: "{task.ttsMessage}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Play Voice TTS Button */}
                  <button
                    onClick={() => onSpeakTTS(task.ttsMessage || task.title, task.id)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                      isSpeakingThis
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 animate-pulse'
                        : 'text-amber-500 hover:bg-amber-500/10 dark:hover:bg-amber-500/20'
                    }`}
                    title="မြန်မာအသံဖြင့် နားထောင်မည် (Burmese Voice TTS)"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  {/* Edit Button */}
                  <button
                    onClick={() => onEditTask(task)}
                    className="w-8 h-8 rounded-xl text-[#5B7CFA] hover:bg-[#5B7CFA]/10 flex items-center justify-center transition-all"
                    title="ပြင်ဆင်ရန် (Edit)"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="w-8 h-8 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 flex items-center justify-center transition-all"
                    title="ဖျက်ပစ်ရန် (Delete)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
