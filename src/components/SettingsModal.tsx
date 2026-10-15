import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Download,
  Upload,
  Gauge,
  RotateCcw,
  Volume2,
  Lock,
} from 'lucide-react';
import { Task } from '../types';
import { speakBurmeseText } from '../utils/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  voiceSpeed: number;
  setVoiceSpeed: (speed: number) => void;
  voiceName: string;
  setVoiceName: (name: string) => void;
  tasks: Task[];
  onRestoreTasks: (tasks: Task[]) => void;
  onResetDefaults: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  voiceSpeed,
  setVoiceSpeed,
  voiceName,
  setVoiceName,
  tasks,
  onRestoreTasks,
  onResetDefaults,
}) => {
  const [saveMessage, setSaveMessage] = useState('');
  const [isTestingVoice, setIsTestingVoice] = useState(false);

  if (!isOpen) return null;

  const handleTestKeyVoice = async () => {
    setIsTestingVoice(true);
    await speakBurmeseText('မင်္ဂလာပါ။ Gemini AI မြန်မာအသံစနစ် ကောင်းမွန်စွာ အလုပ်လုပ်နေပါပြီ။', {
      voiceSpeed,
      voiceName,
      onStart: () => setIsTestingVoice(true),
      onSuccess: () => {
        setSaveMessage('Gemini AI မြန်မာအသံ စမ်းသပ်မှု အောင်မြင်ပါသည်!');
      },
      onError: (err) => {
        setSaveMessage(`အသံစမ်းသပ်မှု အမှား: ${err}`);
      },
      onEnd: () => {
        setIsTestingVoice(false);
        setTimeout(() => setSaveMessage(''), 4000);
      },
    });
  };

  const handleBackup = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tasks, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `myanmar_tasks_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onRestoreTasks(parsed);
          setSaveMessage('Data ပြန်လည် ထည့်သွင်းပြီးပါပြီ!');
          setTimeout(() => setSaveMessage(''), 3000);
        } else {
          alert('ဖိုင်ဖော်မတ် မမှန်ကန်ပါ။ Task JSON ဖိုင်သာ ထည့်သွင်းပါ။');
        }
      } catch (err) {
        alert('JSON ဖိုင် ဖတ်ရှုရာတွင် အမှားဖြစ်ပေါ်ပါသည်');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl glass-surface p-6 sm:p-7 border border-white/80 dark:border-white/10 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/10">
          <div>
            <h3 className="text-base font-bold text-[#172033] dark:text-white burmese-text">
              အက်ပ် ဆက်တင်များနှင့် စီမံခန့်ခွဲမှု
            </h3>
            <p className="text-[11px] text-[#64748B] dark:text-slate-400">
              Preferences, Voice Configuration & Backup
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {saveMessage && (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 burmese-text">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{saveMessage}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Server-Side Secret Key Security Card */}
          <div className="p-4 rounded-2xl glass-card space-y-2.5 border border-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <label className="text-xs font-bold text-slate-800 dark:text-slate-100 burmese-text">
                  Gemini API Key (Server Secret)
                </label>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>လုံခြုံစွာ ဝှက်ထားသည် (.env.local)</span>
              </span>
            </div>

            <p className="text-[11px] text-slate-600 dark:text-slate-300 burmese-text leading-relaxed">
              Gemini API Key သည် လျှို့ဝှက်ချက် (Secret Key) ဖြစ်သောကြောင့် Client browser UI တွင် ရိုက်ထည့်ရန် မလိုပါ။ ဆာဗာရှိ <code className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">.env.local</code> (သို့မဟုတ် AI Studio Secrets) တွင် ထည့်သွင်းထားပြီး Express server မှတစ်ဆင့် လုံခြုံစွာ ခေါ်ယူပါသည်။
            </p>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-400 burmese-text">
                .gitignore တွင် .env* ဖိုင်များ အလိုအလျောက် ပါဝင်ပြီးဖြစ်ပါသည်
              </span>
              <button
                type="button"
                onClick={handleTestKeyVoice}
                disabled={isTestingVoice}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center gap-1.5 burmese-text disabled:opacity-50"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{isTestingVoice ? 'အသံစမ်းနေသည်...' : 'Gemini အသံစမ်းသပ်မည်'}</span>
              </button>
            </div>
          </div>

          {/* Voice Persona & Speed */}
          <div className="p-4 rounded-2xl glass-card space-y-3 border border-white/70 dark:border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-100 burmese-text">
                Gemini Voice အသံပုံစံ (Voice Persona)
              </label>
              <select
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-xl glass-input text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="Kore">Kore (ကြည်လင်သော အမျိုးသမီးသံ)</option>
                <option value="Puck">Puck (တက်ကြွသော အမျိုးသားသံ)</option>
                <option value="Zephyr">Zephyr (နူးညံ့ညင်သာသောအသံ)</option>
                <option value="Fenrir">Fenrir (ခန့်ညားပြတ်သားသောအသံ)</option>
                <option value="Charon">Charon (တည်ငြိမ်သောအသံ)</option>
              </select>
            </div>

            <div className="pt-1">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 burmese-text">
                    အသံပြောကြားနှုန်း (Speech Speed)
                  </span>
                </div>
                <span className="text-xs font-bold text-[#5B7CFA] dark:text-blue-400 tabular-nums">
                  {voiceSpeed}x
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[0.75, 0.9, 1.0, 1.25].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setVoiceSpeed(speed)}
                    className={`py-1.5 text-xs font-semibold rounded-xl border transition-all tabular-nums ${
                      voiceSpeed === speed
                        ? 'bg-[#5B7CFA] text-white border-[#5B7CFA] shadow-sm'
                        : 'glass-input text-slate-600 dark:text-slate-300 hover:border-[#5B7CFA]/40'
                    }`}
                  >
                    {speed === 0.75
                      ? '၀.၇၅x (နှေး)'
                      : speed === 0.9
                      ? '၀.၉x (ပုံမှန်)'
                      : speed === 1.0
                      ? '၁.၀x'
                      : '၁.၂၅x (မြန်)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Data Backup & Restore */}
          <div className="p-4 rounded-2xl glass-card space-y-2 border border-white/70 dark:border-white/10">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block burmese-text">
              ဒေတာ သိမ်းဆည်းခြင်းနှင့် ပြန်လည်ယူခြင်း (Backup & Restore)
            </span>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleBackup}
                className="py-2.5 px-3 rounded-xl bg-white/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#5B7CFA] text-slate-700 dark:text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm burmese-text"
              >
                <Download className="w-3.5 h-3.5 text-[#5B7CFA]" />
                <span>Backup ထုတ်ယူမည်</span>
              </button>

              <label className="py-2.5 px-3 rounded-xl bg-white/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#5B7CFA] text-slate-700 dark:text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer burmese-text">
                <Upload className="w-3.5 h-3.5 text-emerald-500" />
                <span>Restore တင်သွင်းမည်</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleRestoreFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Reset Demo Data Button */}
          <div className="pt-2 flex justify-between items-center text-xs">
            <button
              onClick={() => {
                if (window.confirm('မူလနမူနာ Task များကို ပြန်လည်သတ်မှတ်လိုပါသလား?')) {
                  onResetDefaults();
                  setSaveMessage('နမူနာ ဒေတာများ ပြန်လည်ထည့်သွင်းပြီးပါပြီ');
                  setTimeout(() => setSaveMessage(''), 3000);
                }
              }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1.5 burmese-text transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>နမူနာဒေတာများ ပြန်ယူမည်</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#5B7CFA] text-white font-semibold burmese-text"
            >
              ပြီးပါပြီ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
