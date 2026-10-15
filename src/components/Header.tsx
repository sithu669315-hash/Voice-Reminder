import React from 'react';
import {
  Search,
  Plus,
  Moon,
  Sun,
  Volume2,
  Mic,
  Sliders,
} from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenAddModal: () => void;
  onOpenVoiceModal: () => void;
  onOpenSettingsModal: () => void;
  onTestVoice: () => void;
  isSpeaking: boolean;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  onOpenAddModal,
  onOpenVoiceModal,
  onOpenSettingsModal,
  onTestVoice,
  isSpeaking,
  isDarkMode,
  toggleDarkMode,
}) => {
  // Compute contextual greeting based on local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'မင်္ဂလာ နံနက်ခင်းပါ';
    if (hour < 16) return 'မင်္ဂလာ နေ့လယ်ခင်းပါ';
    if (hour < 19) return 'မင်္ဂလာ ညနေခင်းပါ';
    return 'မင်္ဂလာ ညချမ်းပါ';
  };

  // Compute Burmese Date
  const getBurmeseDate = () => {
    const now = new Date();
    const days = [
      'တနင်္ဂနွေ',
      'တနင်္လာ',
      'အင်္ဂါ',
      'ဗုဒ္ဓဟူး',
      'ကြာသပတေး',
      'သောကြာ',
      'စနေ',
    ];
    const months = [
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
    const dayName = days[now.getDay()];
    const monthName = months[now.getMonth()];
    const dateNum = now.getDate();
    const year = now.getFullYear();

    return `${dayName}နေ့၊ ${year} ခုနှစ်၊ ${monthName}လ (${dateNum}) ရက်`;
  };

  return (
    <header className="sticky top-0 z-30 glass-surface border-b border-white/60 dark:border-white/10 px-4 sm:px-6 lg:px-8 py-3.5 transition-all">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Left: Friendly Greeting & Date */}
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-[#172033] dark:text-white burmese-text leading-tight">
              {getGreeting()}
            </h2>
            <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-[#5B7CFA]" />
            <span className="hidden sm:inline-block text-xs text-[#64748B] dark:text-slate-400">
              Welcome back
            </span>
          </div>
          <p className="text-[11px] font-medium text-[#64748B] dark:text-slate-400 burmese-text mt-0.5">
            {getBurmeseDate()}
          </p>
        </div>

        {/* Center / Right: Search & Action Tools */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Search Field */}
          <div className="relative flex-1 sm:w-60 md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ရှာဖွေရန်... (Search tasks)"
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl glass-input text-[#172033] dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5B7CFA]/30 focus:border-[#5B7CFA] transition-all burmese-text"
            />
          </div>

          {/* Test Voice Button */}
          <button
            onClick={onTestVoice}
            disabled={isSpeaking}
            title="အသံစမ်းသပ်ရန် (Test Voice)"
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 shrink-0 ${
              isSpeaking
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 animate-pulse'
                : 'glass-card text-slate-700 dark:text-slate-200 border-white/70 dark:border-white/10 hover:text-[#5B7CFA]'
            }`}
          >
            <Volume2 className="w-4 h-4 text-amber-500" />
            <span className="hidden md:inline burmese-text">
              {isSpeaking ? 'ပြောနေသည်...' : 'အသံစမ်းသပ်'}
            </span>
          </button>

          {/* Voice Mic Quick Add */}
          <button
            onClick={onOpenVoiceModal}
            title="အသံဖြင့် Task ထည့်မည် (Burmese Voice Input)"
            className="w-9 h-9 rounded-xl glass-card border-white/70 dark:border-white/10 flex items-center justify-center text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all shrink-0"
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            title={isDarkMode ? 'Light Mode သို့ ပြောင်းမည်' : 'Dark Mode သို့ ပြောင်းမည်'}
            className="w-9 h-9 rounded-xl glass-card border-white/70 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#5B7CFA] transition-all shrink-0"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Settings Modal Toggle */}
          <button
            onClick={onOpenSettingsModal}
            title="ဆက်တင်များ (Settings)"
            className="w-9 h-9 rounded-xl glass-card border-white/70 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#5B7CFA] transition-all shrink-0"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Prominent Add Task Action */}
          <button
            onClick={onOpenAddModal}
            className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-[#5B7CFA] to-[#4361EE] hover:from-[#4E70F8] hover:to-[#3A56DF] text-white text-xs font-semibold shadow-md shadow-[#5B7CFA]/20 active:scale-95 transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap burmese-text"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Task အသစ်</span>
          </button>
        </div>
      </div>
    </header>
  );
};
