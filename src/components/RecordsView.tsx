import React, { useState, useMemo } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  Volume2,
  Filter,
  Search,
  TrendingUp,
  Printer,
} from 'lucide-react';
import { Task, TaskPriority, StatsPeriod, RecordStatusFilter } from '../types';
import { exportToCSV, exportToPDF } from '../utils/export';

interface RecordsViewProps {
  tasks: Task[];
  onToggleTask: (id: number) => void;
  onSpeakTTS: (text: string, taskId: number) => void;
  onOpenAddModalWithDate?: (date: string) => void;
  speakingTaskId: number | null;
}

export const RecordsView: React.FC<RecordsViewProps> = ({
  tasks,
  onToggleTask,
  onSpeakTTS,
  onOpenAddModalWithDate,
  speakingTaskId,
}) => {
  const [period, setPeriod] = useState<StatsPeriod>('daily');
  const [statusFilter, setStatusFilter] = useState<RecordStatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentAnchorDate, setCurrentAnchorDate] = useState<Date>(new Date());

  // Date Navigation Helpers
  const handlePrevPeriod = () => {
    const next = new Date(currentAnchorDate);
    if (period === 'daily') {
      next.setDate(next.getDate() - 1);
    } else if (period === 'weekly') {
      next.setDate(next.getDate() - 7);
    } else if (period === 'monthly') {
      next.setMonth(next.getMonth() - 1);
    }
    setCurrentAnchorDate(next);
  };

  const handleNextPeriod = () => {
    const next = new Date(currentAnchorDate);
    if (period === 'daily') {
      next.setDate(next.getDate() + 1);
    } else if (period === 'weekly') {
      next.setDate(next.getDate() + 7);
    } else if (period === 'monthly') {
      next.setMonth(next.getMonth() + 1);
    }
    setCurrentAnchorDate(next);
  };

  const handleResetToday = () => {
    setCurrentAnchorDate(new Date());
  };

  // Compute period boundaries and Burmese label
  const periodDetails = useMemo(() => {
    const anchor = currentAnchorDate;
    const year = anchor.getFullYear();
    const month = anchor.getMonth();
    const monthNames = [
      'ဇန်နဝါရီ',
      'ဖေဖော်ဝါရီ',
      'မတ်',
      'ဧပြီ',
      'မေ',
      'ဇွန်',
      'ဇူလိုင်',
      'သြဂုတ်',
      'စက်တင်ဘာ',
      'အောက်တိုဘာ',
      'နိုဝင်ဘာ',
      'ဒီဇင်ဘာ',
    ];

    if (period === 'daily') {
      const dateStr = anchor.toISOString().split('T')[0];
      const burmeseDate = `${anchor.getDate()} ${monthNames[month]} ${year}`;
      return {
        label: `နေ့စဉ် မှတ်တမ်း (${burmeseDate})`,
        shortLabel: 'နေ့စဉ်',
        filterFn: (t: Task) => t.date === dateStr,
        dateForNewTask: dateStr,
      };
    } else if (period === 'weekly') {
      // 7-day window centered or leading to anchor
      const start = new Date(anchor);
      start.setDate(anchor.getDate() - anchor.getDay()); // Start of week (Sunday)
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(start.getDate() + 6); // End of week (Saturday)
      end.setHours(23, 59, 59, 999);

      const startStr = `${start.getDate()} ${monthNames[start.getMonth()]}`;
      const endStr = `${end.getDate()} ${monthNames[end.getMonth()]} ${end.getFullYear()}`;

      return {
        label: `အပတ်စဉ် မှတ်တမ်း (${startStr} - ${endStr})`,
        shortLabel: 'အပတ်စဉ်',
        filterFn: (t: Task) => {
          const tDate = new Date(`${t.date}T00:00:00`);
          return tDate >= start && tDate <= end;
        },
        dateForNewTask: anchor.toISOString().split('T')[0],
      };
    } else {
      // Monthly window
      return {
        label: `လစဉ် မှတ်တမ်း (${year} ခုနှစ်၊ ${monthNames[month]}လ)`,
        shortLabel: 'လစဉ်',
        filterFn: (t: Task) => {
          const parts = t.date.split('-');
          if (parts.length < 2) return false;
          return parseInt(parts[0], 10) === year && parseInt(parts[1], 10) === month + 1;
        },
        dateForNewTask: anchor.toISOString().split('T')[0],
      };
    }
  }, [period, currentAnchorDate]);

  // Tasks in this period
  const tasksInPeriod = useMemo(() => {
    return tasks.filter(periodDetails.filterFn);
  }, [tasks, periodDetails]);

  // Summary Metrics
  const totalInPeriod = tasksInPeriod.length;
  const completedInPeriod = tasksInPeriod.filter((t) => t.completed).length;
  const unfulfilledInPeriod = totalInPeriod - completedInPeriod;
  const completionRate =
    totalInPeriod > 0 ? Math.round((completedInPeriod / totalInPeriod) * 100) : 0;

  // Filtered tasks by status, category, and search query
  const displayedTasks = useMemo(() => {
    return tasksInPeriod.filter((task) => {
      // Status filter
      if (statusFilter === 'completed' && !task.completed) return false;
      if (statusFilter === 'unfulfilled' && task.completed) return false;

      // Category filter
      if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesTTS = (task.ttsMessage || '').toLowerCase().includes(query);
        const matchesCategory = task.category.toLowerCase().includes(query);
        if (!matchesTitle && !matchesTTS && !matchesCategory) return false;
      }

      return true;
    });
  }, [tasksInPeriod, statusFilter, categoryFilter, searchQuery]);

  const handleExportCSV = () => {
    const statusText =
      statusFilter === 'completed'
        ? 'ပြီးစီးခဲ့သည်များ'
        : statusFilter === 'unfulfilled'
        ? 'မပြီးပြတ်သေးသော တာဝန်များ'
        : 'အားလုံး';
    exportToCSV(displayedTasks, {
      periodLabel: periodDetails.label,
      statusFilterLabel: statusText,
    });
  };

  const handleExportPDF = () => {
    const statusText =
      statusFilter === 'completed'
        ? 'ပြီးစီးခဲ့သည်များ'
        : statusFilter === 'unfulfilled'
        ? 'မပြီးပြတ်သေးသော တာဝန်များ'
        : 'အားလုံး';
    exportToPDF(displayedTasks, {
      periodLabel: periodDetails.label,
      statusFilterLabel: statusText,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Period Navigation & Export Actions */}
      <div className="p-5 sm:p-6 rounded-3xl glass-surface border border-white/70 dark:border-white/10 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Title lockup */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#5B7CFA]/15 text-[#5B7CFA] flex items-center justify-center shadow-sm">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#172033] dark:text-white burmese-text leading-tight">
                {periodDetails.label}
              </h2>
              <p className="text-[11px] text-[#64748B] dark:text-slate-400 burmese-text">
                ပြီးစီးခဲ့သော လုပ်ငန်းများနှင့် မပြီးပြတ်သေးသော တာဝန်များ စာရင်းဇယား
              </p>
            </div>
          </div>

          {/* Period Toggle & Date Paging */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Period Segmented Button */}
            <div className="flex items-center p-1 bg-slate-200/50 dark:bg-slate-800/60 rounded-xl">
              <button
                onClick={() => setPeriod('daily')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all burmese-text ${
                  period === 'daily'
                    ? 'bg-white dark:bg-slate-700 text-[#5B7CFA] dark:text-blue-300 shadow-sm'
                    : 'text-[#64748B] dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                နေ့စဉ်
              </button>
              <button
                onClick={() => setPeriod('weekly')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all burmese-text ${
                  period === 'weekly'
                    ? 'bg-white dark:bg-slate-700 text-[#5B7CFA] dark:text-blue-300 shadow-sm'
                    : 'text-[#64748B] dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                အပတ်စဉ်
              </button>
              <button
                onClick={() => setPeriod('monthly')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all burmese-text ${
                  period === 'monthly'
                    ? 'bg-white dark:bg-slate-700 text-[#5B7CFA] dark:text-blue-300 shadow-sm'
                    : 'text-[#64748B] dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                လစဉ်
              </button>
            </div>

            {/* Paging Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevPeriod}
                className="w-8 h-8 rounded-xl glass-card flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#5B7CFA] transition"
                title="ယခင် ကာလ"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetToday}
                className="px-2.5 py-1.5 rounded-xl glass-card text-xs font-semibold text-[#5B7CFA] hover:bg-[#5B7CFA]/10 transition burmese-text"
              >
                ယနေ့
              </button>
              <button
                onClick={handleNextPeriod}
                className="w-8 h-8 rounded-xl glass-card flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#5B7CFA] transition"
                title="နောက် ကာလ"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Export Actions */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200/80 dark:border-white/10">
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 rounded-xl glass-card text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-white/80 dark:border-white/10 flex items-center gap-1.5 transition active:scale-95"
                title="CSV ဖိုင် ထုတ်ယူမည် (Excel/Spreadsheet)"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="burmese-text">CSV ထုတ်မည်</span>
              </button>

              <button
                onClick={handleExportPDF}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-semibold shadow-md shadow-rose-500/20 flex items-center gap-1.5 transition active:scale-95"
                title="မြန်မာစာလုံးပေါင်းမှန်ကန်သော PDF အစီရင်ခံစာ ထုတ်ယူမည်"
              >
                <FileText className="w-4 h-4" />
                <span className="burmese-text">PDF အစီရင်ခံစာ</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Summary KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Total */}
          <div className="p-4 rounded-2xl glass-card border border-white/80 dark:border-white/10">
            <span className="text-xs text-[#64748B] dark:text-slate-400 burmese-text block">
              စုစုပေါင်း တာဝန်များ
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl sm:text-3xl font-bold text-[#172033] dark:text-white tabular-nums">
                {totalInPeriod}
              </span>
              <span className="text-xs text-slate-400 burmese-text">ခု</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 burmese-text">
              {periodDetails.shortLabel} မှတ်တမ်းအားလုံး
            </p>
          </div>

          {/* Completed */}
          <div className="p-4 rounded-2xl glass-card border border-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20">
            <span className="text-xs text-emerald-700 dark:text-emerald-400 burmese-text block font-medium">
              ပြီးစီးခဲ့သော လုပ်ငန်းများ
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {completedInPeriod}
              </span>
              <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70 burmese-text">ခု</span>
            </div>
            <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 mt-0.5 burmese-text">
              အောင်မြင်စွာ ပြီးမြောက်ခဲ့သည်
            </p>
          </div>

          {/* Unfulfilled / Pending */}
          <div className="p-4 rounded-2xl glass-card border border-rose-500/20 bg-rose-50/20 dark:bg-rose-950/20">
            <span className="text-xs text-rose-700 dark:text-rose-400 burmese-text block font-medium">
              မပြီးပြတ်သေးသော တာဝန်များ
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl sm:text-3xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                {unfulfilledInPeriod}
              </span>
              <span className="text-xs text-rose-600/70 dark:text-rose-400/70 burmese-text">ခု</span>
            </div>
            <p className="text-[10px] text-rose-600/70 dark:text-rose-400/70 mt-0.5 burmese-text">
              လုပ်ဆောင်ရန် ကျန်ရှိ / တာဝန်မကျေ
            </p>
          </div>

          {/* Rate */}
          <div className="p-4 rounded-2xl glass-card border border-blue-500/20 bg-blue-50/20 dark:bg-blue-950/20">
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#5B7CFA] dark:text-blue-400 burmese-text font-medium">
                ပြီးစီးမှု ရာခိုင်နှုန်း
              </span>
              <TrendingUp className="w-3.5 h-3.5 text-[#5B7CFA]" />
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl sm:text-3xl font-bold text-[#5B7CFA] dark:text-blue-400 tabular-nums">
                {completionRate}%
              </span>
            </div>
            <div className="w-full bg-slate-200/80 dark:bg-slate-700/60 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-gradient-to-r from-[#5B7CFA] to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3.5 rounded-2xl glass-surface border border-white/70 dark:border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/50 dark:bg-slate-800/60 rounded-xl overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all burmese-text whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-slate-700 text-[#5B7CFA] dark:text-blue-300 shadow-sm'
                : 'text-[#64748B] dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            အားလုံး ({totalInPeriod})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all burmese-text whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'completed'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-[#64748B] dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>ပြီးစီးခဲ့သည်များ ({completedInPeriod})</span>
          </button>
          <button
            onClick={() => setStatusFilter('unfulfilled')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all burmese-text whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'unfulfilled'
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'text-[#64748B] dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>မပြီးပြတ်သေးသော တာဝန်များ ({unfulfilledInPeriod})</span>
          </button>
        </div>

        {/* Secondary Category & Search */}
        <div className="flex items-center gap-2">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1 text-xs text-[#64748B] dark:text-slate-400 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-xl glass-input text-slate-700 dark:text-slate-200 outline-none burmese-text"
            >
              <option value="all">ကဏ္ဍ အားလုံး</option>
              <option value="အလုပ်">အလုပ်</option>
              <option value="ကိုယ်ရေးကိုယ်တာ">ကိုယ်ရေးကိုယ်တာ</option>
              <option value="ကျန်းမာရေး">ကျန်းမာရေး</option>
              <option value="ပညာရေး">ပညာရေး</option>
            </select>
          </div>

          {/* Search Field */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ရှာဖွေရန်..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl glass-input text-slate-800 dark:text-slate-200 outline-none burmese-text"
            />
          </div>

          {/* Quick Add For Period Date */}
          {onOpenAddModalWithDate && (
            <button
              onClick={() => onOpenAddModalWithDate(periodDetails.dateForNewTask)}
              className="px-3 py-1.5 rounded-xl bg-[#5B7CFA] hover:bg-[#4E70F8] text-white text-xs font-semibold shadow-sm transition flex items-center gap-1 shrink-0 burmese-text"
              title="ဤကာလအတွက် Task အသစ် ထည့်မည်"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">တာဝန်သစ် ထည့်မည်</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Records List / Table */}
      <div className="space-y-3">
        {displayedTasks.length === 0 ? (
          <div className="py-16 text-center rounded-3xl glass-surface border border-white/70 dark:border-white/10 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <ClipboardList className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 burmese-text">
              ဤကာလအတွင်း မှတ်တမ်း မရှိပါ
            </h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto burmese-text">
              ရွေးချယ်ထားသော အချိန်ကာလ (သို့မဟုတ်) Filter နှင့် ကိုက်ညီသော တာဝန်မှတ်တမ်းများ မတွေ့ရှိပါ။
            </p>
          </div>
        ) : (
          displayedTasks.map((task) => {
            const isSpeakingThis = speakingTaskId === task.id;

            return (
              <div
                key={task.id}
                className={`p-4 rounded-2xl glass-card flex items-center justify-between gap-3.5 transition-all ${
                  task.completed
                    ? 'border-emerald-500/20 bg-emerald-50/10 dark:bg-emerald-950/10'
                    : 'border-rose-500/20 bg-rose-50/10 dark:bg-rose-950/10'
                }`}
              >
                {/* Status Toggle & Title */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <button
                    onClick={() => onToggleTask(task.id)}
                    className={`w-5 h-5 rounded-lg flex items-center justify-center transition shrink-0 ${
                      task.completed
                        ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                        : 'border-2 border-rose-400 dark:border-rose-500 hover:border-emerald-500'
                    }`}
                    title={
                      task.completed
                        ? 'မပြီးပြတ်သေးသော တာဝန်အဖြစ် ပြောင်းရန်'
                        : 'ပြီးစီးကြောင်း မှတ်သားရန်'
                    }
                  >
                    {task.completed && <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
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
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span className="tabular-nums">{task.date}</span>
                      </span>

                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>

                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="tabular-nums">{task.time}</span>
                      </span>

                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>

                      <span>{task.category}</span>

                      <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>

                      <span
                        className={`font-semibold ${
                          task.completed
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {task.completed ? '✓ ပြီးစီးပြီး' : '✕ မပြီးပြတ်သေး (တာဝန်မကျေ)'}
                      </span>

                      {task.completedAt && (
                        <>
                          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                          <span className="text-slate-500 dark:text-slate-400">
                            ပြီးစီးချိန်:{' '}
                            {new Date(task.completedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onSpeakTTS(task.ttsMessage || task.title, task.id)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${
                      isSpeakingThis
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30 animate-pulse'
                        : 'text-amber-500 hover:bg-amber-500/10'
                    }`}
                    title="မြန်မာအသံဖြင့် နားထောင်မည်"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
