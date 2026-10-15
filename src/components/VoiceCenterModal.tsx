import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Play,
  CheckCircle2,
  Calendar,
  Clock,
  RotateCcw,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { Task, TaskCategory, TaskPriority } from '../types';
import { speakBurmeseText } from '../utils/audio';

interface VoiceCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (taskData: Omit<Task, 'id' | 'completed' | 'completedAt' | 'notified'>) => void;
  voiceSpeed: number;
  setVoiceSpeed: (speed: number) => void;
  voiceName: string;
  setVoiceName: (name: string) => void;
}

export const VoiceCenterModal: React.FC<VoiceCenterModalProps> = ({
  isOpen,
  onClose,
  onAddTask,
  voiceSpeed,
  setVoiceSpeed,
  voiceName,
  setVoiceName,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [statusMessage, setStatusMessage] = useState('အဆင်သင့် (Ready)');
  const [errorMessage, setErrorMessage] = useState('');

  // Voice transcript & parsed preview
  const [transcript, setTranscript] = useState('');
  const [parsedTask, setParsedTask] = useState<{
    title: string;
    date: string;
    time: string;
    category: TaskCategory;
    priority: TaskPriority;
    ttsMessage: string;
  } | null>(null);

  // Audio test state
  const [voiceTestText, setVoiceTestText] = useState(
    'မင်္ဂလာပါ။ မြန်မာ အသံဖြင့် သတိပေးချက် စနစ် အဆင်သင့် ဖြစ်ပါပြီ။'
  );

  // MediaRecorder & WebSpeech refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const handleStopAll = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn(e);
      }
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn(e);
      }
    }
    setIsRecording(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      handleStopAll();
      setParsedTask(null);
      setTranscript('');
      setErrorMessage('');
      setStatusMessage('အဆင်သင့် (Ready)');
    }
  }, [isOpen, handleStopAll]);

  const handleStartRecording = async () => {
    setErrorMessage('');
    setTranscript('');
    setParsedTask(null);
    audioChunksRef.current = [];

    // 1. Try starting MediaRecorder (captures raw microphone audio for Gemini AI)
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stream?.getTracks().forEach((track) => track.stop());
        await processRecordedAudio();
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250); // collect chunks every 250ms
      setIsRecording(true);
      setStatusMessage('နားထောင်နေပါသည်... စကားပြောပါ');
    } catch (micErr: any) {
      console.warn('Microphone stream access error:', micErr);
    }

    // 2. Try starting Web Speech API for real-time live preview text
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'my-MM';
        recognition.interimResults = true;
        recognition.continuous = true;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
          let accumulated = '';
          for (let i = 0; i < event.results.length; i++) {
            accumulated += event.results[i][0].transcript;
          }
          if (accumulated.trim()) {
            setTranscript(accumulated.trim());
          }
        };

        recognition.onerror = (e: any) => {
          console.warn('SpeechRecognition interim event:', e?.error);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (e) {
        console.warn('Speech recognition start failed:', e);
      }
    }

    if (!stream && !SpeechRecognition) {
      setErrorMessage(
        'မိုက်ခရိုဖုန်း ခွင့်ပြုချက် (Microphone Permission) မရရှိပါ။ ကျေးဇူးပြု၍ Browser Setting တွင် မိုက်ခရိုဖုန်းကို ခွင့်ပြုပေးပါ။'
      );
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setStatusMessage('အသံကို ခွဲခြမ်းစိတ်ဖြာနေပါသည်...');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn(e);
      }
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn(e);
      }
    } else {
      // If MediaRecorder was not active but speech recognition caught transcript
      if (transcript.trim()) {
        parseTranscriptText(transcript.trim());
      }
    }
  };

  // Convert audio blob to base64 and send to Gemini /api/transcribe-audio
  const processRecordedAudio = async () => {
    setIsProcessing(true);

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

      if (audioBlob.size > 2000) {
        // Convert Blob to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64Data = (reader.result as string).split(',')[1];
            const today = new Date().toISOString().split('T')[0];

            const response = await fetch('/api/transcribe-audio', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audioBase64: base64Data,
                mimeType: audioBlob.type || 'audio/webm',
                today,
              }),
            });

            if (response.ok) {
              const result = await response.json();
              if (result.transcript) {
                setTranscript(result.transcript);
              }
              if (result.task) {
                setParsedTask({
                  title: result.task.title,
                  date: result.task.date || today,
                  time: result.task.time || '12:00',
                  category: (result.task.category as TaskCategory) || 'ကိုယ်ရေးကိုယ်တာ',
                  priority: (result.task.priority as TaskPriority) || 'medium',
                  ttsMessage: result.task.ttsMessage || `${result.task.title} ပြုလုပ်ရန် အချိန်တန်ပါပြီ`,
                });
                setStatusMessage('Task အချက်အလက်များ အောင်မြင်စွာ ဖော်ထုတ်ပြီးပါပြီ');
                setIsProcessing(false);
                return;
              }
            }
          } catch (apiErr) {
            console.warn('Transcribe endpoint error, falling back to text parser:', apiErr);
          }

          // Fallback to text parser if audio transcription was unreachable
          if (transcript.trim()) {
            await parseTranscriptText(transcript.trim());
          } else {
            setIsProcessing(false);
            setStatusMessage('အသံဖမ်းယူမှု အဆင်သင့်ဖြစ်ပါပြီ');
          }
        };
        reader.readAsDataURL(audioBlob);
        return;
      }
    } catch (e) {
      console.warn('Audio blob processing error:', e);
    }

    if (transcript.trim()) {
      await parseTranscriptText(transcript.trim());
    } else {
      setIsProcessing(false);
      setStatusMessage('အသံ မရရှိခဲ့ပါ၊ ပြန်လည် စမ်းသပ်ပါ');
    }
  };

  const parseTranscriptText = async (textToParse: string) => {
    setIsProcessing(true);
    const today = new Date().toISOString().split('T')[0];

    try {
      const res = await fetch('/api/parse-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToParse,
          today,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.task) {
          setParsedTask({
            title: data.task.title,
            date: data.task.date || today,
            time: data.task.time || '12:00',
            category: (data.task.category as TaskCategory) || 'ကိုယ်ရေးကိုယ်တာ',
            priority: (data.task.priority as TaskPriority) || 'medium',
            ttsMessage: data.task.ttsMessage || `${data.task.title} ပြုလုပ်ရန် အချိန်တန်ပါပြီ`,
          });
          setStatusMessage('Task အချက်အလက်များ ပြင်ဆင်ပြီးပါပြီ');
          setIsProcessing(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Parse task endpoint error:', err);
    }

    // Default manual structured fallback
    setParsedTask({
      title: textToParse,
      date: today,
      time: '12:00',
      category: 'ကိုယ်ရေးကိုယ်တာ',
      priority: 'medium',
      ttsMessage: `${textToParse} ပြုလုပ်ရန် အချိန်တန်ပါပြီ`,
    });
    setIsProcessing(false);
    setStatusMessage('အချက်အလက်များ စစ်ဆေးပြီး ထည့်သွင်းပါ');
  };

  const handleConfirmAddTask = () => {
    if (!parsedTask || !parsedTask.title.trim()) return;

    onAddTask({
      title: parsedTask.title.trim(),
      date: parsedTask.date,
      time: parsedTask.time,
      category: parsedTask.category,
      priority: parsedTask.priority,
      ttsMessage: parsedTask.ttsMessage || `${parsedTask.title.trim()} ပြုလုပ်ရန် အချိန်တန်ပါပြီ`,
    });

    onClose();
  };

  const handlePlayVoiceTest = async () => {
    setIsSpeaking(true);
    setStatusMessage('အသံ ထွက်ပေါ်နေသည်...');

    const textToPlay = parsedTask?.ttsMessage || voiceTestText;

    await speakBurmeseText(textToPlay, {
      voiceSpeed,
      voiceName,
      onStart: () => setIsSpeaking(true),
      onEnd: () => {
        setIsSpeaking(false);
        setStatusMessage('အဆင်သင့် (Ready)');
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-md transition-all">
      <div className="relative w-full max-w-lg rounded-3xl glass-surface p-6 sm:p-7 border border-white/80 dark:border-white/10 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shadow-sm">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#172033] dark:text-white burmese-text leading-tight">
                မြန်မာအသံဖြင့် Task ထည့်သွင်းခြင်း
              </h3>
              <p className="text-[11px] text-[#64748B] dark:text-slate-400">
                AI Voice Recognition & Automatic Scheduling
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Notice */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 burmese-text">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Status indicator */}
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 text-xs">
          <span className="text-[#64748B] dark:text-slate-400 burmese-text">အခြေအနေ:</span>
          <span
            className={`font-semibold burmese-text text-right truncate ml-2 flex items-center gap-1.5 ${
              isRecording
                ? 'text-rose-500 animate-pulse'
                : isProcessing
                ? 'text-[#5B7CFA] animate-pulse'
                : isSpeaking
                ? 'text-amber-500 animate-pulse'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {isProcessing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{statusMessage}</span>
          </span>
        </div>

        {/* Main Mic Recording Zone */}
        {!parsedTask ? (
          <div className="text-center py-4 space-y-4">
            <div className="relative inline-flex items-center justify-center">
              {isRecording && (
                <>
                  <div className="absolute w-28 h-28 rounded-full bg-rose-500/20 animate-ping" />
                  <div className="absolute w-24 h-24 rounded-full bg-rose-500/30 animate-pulse" />
                </>
              )}

              <button
                type="button"
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                disabled={isProcessing}
                className={`w-20 h-20 rounded-3xl flex items-center justify-center text-3xl transition-all shadow-xl active:scale-95 ${
                  isRecording
                    ? 'bg-rose-500 text-white shadow-rose-500/40 ring-4 ring-rose-500/20'
                    : 'bg-gradient-to-tr from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/30'
                }`}
              >
                {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
              </button>
            </div>

            <div className="space-y-1">
              <h4 className="text-xs sm:text-sm font-bold text-[#172033] dark:text-white burmese-text">
                {isRecording
                  ? 'နားထောင်နေပါသည်... စကားပြောပါ'
                  : 'မိုက်ခရိုဖုန်းကို နှိပ်ပြီး မြန်မာလို အသံဖြင့် ပြောပါ'}
              </h4>
              <p className="text-[11px] text-[#64748B] dark:text-slate-400 burmese-text max-w-sm mx-auto">
                ဥပမာ - "မနက်ဖြန် မနက် ၉ နာရီ ရုံးအစည်းအဝေး တက်ရမယ်" (သို့မဟုတ်) "ညနေ ၅ နာရီ ဆေးသောက်ရန်"
              </p>
            </div>

            {/* Live speech feedback box */}
            <div className="p-3.5 rounded-2xl glass-card text-xs min-h-[64px] flex items-center justify-center text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/60 burmese-text">
              {transcript ? (
                <div className="w-full text-left">
                  <span className="text-[10px] text-slate-400 block mb-0.5">ကြားရသော စကားသံ:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">"{transcript}"</span>
                </div>
              ) : (
                <span className="text-slate-400 italic">
                  စကားပြောပြီးပါက အလိုအလျောက် ရက်စွဲ၊ အချိန်နှင့် ခေါင်းစဉ်ကို ထုတ်ယူပေးပါမည်...
                </span>
              )}
            </div>

            {isRecording && (
              <button
                type="button"
                onClick={handleStopRecording}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md transition burmese-text"
              >
                ပြောပြီးပါပြီ (ပြီးစီးမည်)
              </button>
            )}

            {/* Quick manual typing fallback if mic is unavailable */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-white/10 text-left">
              <span className="text-[10px] font-semibold text-slate-400 block mb-1 burmese-text">
                သို့မဟုတ် စာသားဖြင့် ရိုက်ထည့်ပြီး AI ဖြင့် ခွဲခြမ်းစိတ်ဖြာရန်:
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="ဥပမာ: မနက်ဖြန် မနက် ၉:၀၀ ရုံးအစည်းအဝေး"
                  className="flex-1 px-3 py-2 text-xs rounded-xl glass-input text-slate-800 dark:text-slate-200 outline-none burmese-text"
                />
                <button
                  type="button"
                  onClick={() => transcript.trim() && parseTranscriptText(transcript.trim())}
                  disabled={!transcript.trim() || isProcessing}
                  className="px-4 py-2 rounded-xl bg-[#5B7CFA] hover:bg-[#4E70F8] text-white text-xs font-semibold transition shrink-0 burmese-text disabled:opacity-50"
                >
                  AI ဖြင့် စစ်ဆေးမည်
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Parsed Task Review & Confirmation Card */
          <div className="space-y-4 pt-1">
            <div className="p-4 rounded-2xl border border-[#5B7CFA]/30 bg-blue-50/30 dark:bg-blue-950/20 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-blue-200/60 dark:border-blue-900/60">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#5B7CFA] dark:text-blue-400 burmese-text">
                  <Sparkles className="w-4 h-4" />
                  <span>AI အသံစနစ်မှ ဖော်ထုတ်ရရှိသော Task အချက်အလက်</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setParsedTask(null);
                    setTranscript('');
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 burmese-text"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>အသံအသစ် ပြန်ပြောမည်</span>
                </button>
              </div>

              {transcript && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 burmese-text">
                  <span className="font-semibold">ပြောကြားခဲ့သည့် စကားသံ:</span> "{transcript}"
                </div>
              )}

              {/* Editable Fields for User Confirmation */}
              <div className="space-y-3 text-xs">
                {/* Title */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1 burmese-text">
                    ခေါင်းစဉ် (Title)
                  </label>
                  <input
                    type="text"
                    value={parsedTask.title}
                    onChange={(e) =>
                      setParsedTask({ ...parsedTask, title: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl glass-input text-slate-900 dark:text-white outline-none font-semibold burmese-text"
                  />
                </div>

                {/* Date & Time */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1 burmese-text flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" /> ရက်စွဲ (Date)
                    </label>
                    <input
                      type="date"
                      value={parsedTask.date}
                      onChange={(e) =>
                        setParsedTask({ ...parsedTask, date: e.target.value })
                      }
                      className="w-full px-3 py-1.5 rounded-xl glass-input text-slate-900 dark:text-white outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1 burmese-text flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> အချိန် (Time)
                    </label>
                    <input
                      type="time"
                      value={parsedTask.time}
                      onChange={(e) =>
                        setParsedTask({ ...parsedTask, time: e.target.value })
                      }
                      className="w-full px-3 py-1.5 rounded-xl glass-input text-slate-900 dark:text-white outline-none text-xs"
                    />
                  </div>
                </div>

                {/* Category & Priority */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1 burmese-text">
                      ကဏ္ဍ (Category)
                    </label>
                    <select
                      value={parsedTask.category}
                      onChange={(e) =>
                        setParsedTask({
                          ...parsedTask,
                          category: e.target.value as TaskCategory,
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-xl glass-input text-slate-900 dark:text-white outline-none text-xs burmese-text"
                    >
                      <option value="အလုပ်">အလုပ်</option>
                      <option value="ကိုယ်ရေးကိုယ်တာ">ကိုယ်ရေးကိုယ်တာ</option>
                      <option value="ကျန်းမာရေး">ကျန်းမာရေး</option>
                      <option value="ပညာရေး">ပညာရေး</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-1 burmese-text">
                      ဦးစားပေး (Priority)
                    </label>
                    <select
                      value={parsedTask.priority}
                      onChange={(e) =>
                        setParsedTask({
                          ...parsedTask,
                          priority: e.target.value as TaskPriority,
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-xl glass-input text-slate-900 dark:text-white outline-none text-xs burmese-text"
                    >
                      <option value="high">အရေးကြီး (High)</option>
                      <option value="medium">အလယ်အလတ် (Medium)</option>
                      <option value="low">ပုံမှန် (Low)</option>
                    </select>
                  </div>
                </div>

                {/* TTS reminder message */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 burmese-text">
                      အသံသတိပေး စာသား (TTS Message)
                    </label>
                    <button
                      type="button"
                      onClick={handlePlayVoiceTest}
                      disabled={isSpeaking}
                      className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold hover:underline flex items-center gap-1 burmese-text"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>အသံစမ်းနားထောင်မည်</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={parsedTask.ttsMessage}
                    onChange={(e) =>
                      setParsedTask({ ...parsedTask, ttsMessage: e.target.value })
                    }
                    className="w-full px-3 py-1.5 rounded-xl glass-input text-slate-900 dark:text-white outline-none text-xs burmese-text"
                  />
                </div>
              </div>
            </div>

            {/* Confirm Actions */}
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setParsedTask(null);
                  setTranscript('');
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition burmese-text"
              >
                ပြန်လည်ပြောမည်
              </button>
              <button
                type="button"
                onClick={handleConfirmAddTask}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#5B7CFA] to-[#4361EE] hover:from-[#4E70F8] hover:to-[#3A56DF] text-white text-xs font-bold shadow-md shadow-[#5B7CFA]/25 transition flex items-center justify-center gap-1.5 burmese-text active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Task အတည်ပြု ထည့်သွင်းမည်</span>
              </button>
            </div>
          </div>
        )}

        {/* Voice Persona & Speed Settings Footer */}
        <div className="pt-3 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#64748B] dark:text-slate-400 burmese-text">
              အသံပုံစံ:
            </span>
            <select
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              className="px-2 py-1 text-[11px] rounded-lg glass-input text-slate-700 dark:text-slate-200 outline-none"
            >
              <option value="Kore">Kore</option>
              <option value="Puck">Puck</option>
              <option value="Zephyr">Zephyr</option>
              <option value="Fenrir">Fenrir</option>
            </select>
          </div>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition burmese-text"
          >
            ပိတ်မည်
          </button>
        </div>
      </div>
    </div>
  );
};
