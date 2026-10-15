/**
 * Audio synthesis & speech recognition utility
 * Supports server-side Gemini TTS (/api/tts), direct Gemini TTS fallback,
 * and browser Web Speech API.
 * Correctly handles both complete RIFF/WAV files and raw PCM buffers.
 */

export function playChimeSound() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;

    // Dual-tone crystal glass ping
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.8);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.12);
    gain2.gain.setValueAtTime(0.18, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 1.2);
  } catch (e) {
    console.warn('AudioContext chime error:', e);
  }
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function pcmToWav(pcmData: Int16Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + pcmData.length * 2);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + pcmData.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono channel
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // Byte rate
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // Bits per sample
  writeString(view, 36, 'data');
  view.setUint32(40, pcmData.length * 2, true);

  let offset = 44;
  for (let i = 0; i < pcmData.length; i++, offset += 2) {
    view.setInt16(offset, pcmData[i], true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Converts audio base64 data to a playable audio Blob.
 * Intelligently checks whether the data already contains a RIFF WAV header
 * or is raw PCM, preventing double-header corruption.
 */
function createPlayableBlob(audioData: string, mimeType?: string): Blob {
  const binaryString = window.atob(audioData);

  // Check if first 4 bytes are 'RIFF' (0x52, 0x49, 0x46, 0x46)
  const isRiff =
    binaryString.length >= 4 &&
    binaryString.charCodeAt(0) === 0x52 &&
    binaryString.charCodeAt(1) === 0x49 &&
    binaryString.charCodeAt(2) === 0x46 &&
    binaryString.charCodeAt(3) === 0x46;

  if (isRiff) {
    // Already a complete WAV file with header
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: 'audio/wav' });
  }

  // Raw PCM: determine sample rate from mimeType if available (default 24000)
  const sampleRateMatch = (mimeType || '').match(/rate=(\d+)/);
  const sampleRate = sampleRateMatch ? parseInt(sampleRateMatch[1], 10) : 24000;

  const pcmBuffer = base64ToArrayBuffer(audioData);
  const pcm16 = new Int16Array(pcmBuffer);
  return pcmToWav(pcm16, sampleRate);
}

export interface SpeakOptions {
  apiKey?: string;
  voiceSpeed?: number;
  voiceName?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (errMessage: string) => void;
  onSuccess?: (engine: 'gemini' | 'browser') => void;
}

export async function speakBurmeseText(text: string, options: SpeakOptions = {}): Promise<boolean> {
  const { apiKey, voiceSpeed = 0.9, voiceName = 'Kore', onStart, onEnd, onError, onSuccess } = options;

  if (onStart) onStart();

  // 1. Try server-side endpoint first (/api/tts)
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        apiKey: apiKey?.trim() || undefined,
        voiceName,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.audioData) {
        const audioBlob = createPlayableBlob(data.audioData, data.mimeType);
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          if (onEnd) onEnd();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          fallbackWebSpeech(text, voiceSpeed, onEnd, onError, onSuccess);
        };

        await audio.play();
        if (onSuccess) onSuccess('gemini');
        return true;
      }
    } else {
      const errJson = await res.json().catch(() => null);
      console.warn('Server TTS returned non-ok:', res.status, errJson);
    }
  } catch (serverErr) {
    console.warn('Server /api/tts endpoint request failed:', serverErr);
  }

  // 2. Direct Gemini REST fallback if client has an API key
  const trimmedKey = apiKey?.trim();
  if (trimmedKey) {
    try {
      const models = [
        'gemini-3.8-flash-lite-tts',
        'gemini-2.5-flash-preview-tts',
        'gemini-2.5-flash',
      ];

      for (const model of models) {
        try {
          const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${trimmedKey}`;
          const directRes = await fetch(directUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `Say in natural Burmese: ${text}`,
                    },
                  ],
                },
              ],
              generationConfig: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' },
                  },
                },
              },
            }),
          });

          if (directRes.ok) {
            const result = await directRes.json();
            const part = result?.candidates?.[0]?.content?.parts?.[0];
            const audioData = part?.inlineData?.data;
            const mimeType = part?.inlineData?.mimeType;

            if (audioData) {
              const audioBlob = createPlayableBlob(audioData, mimeType);
              const audioUrl = URL.createObjectURL(audioBlob);
              const audio = new Audio(audioUrl);

              audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                if (onEnd) onEnd();
              };
              audio.onerror = () => {
                URL.revokeObjectURL(audioUrl);
                fallbackWebSpeech(text, voiceSpeed, onEnd, onError, onSuccess);
              };

              await audio.play();
              if (onSuccess) onSuccess('gemini');
              return true;
            }
          }
        } catch (mErr) {
          console.warn(`Direct call to ${model} failed:`, mErr);
        }
      }
    } catch (directErr) {
      console.warn('Direct Gemini TTS call failed:', directErr);
    }
  }

  // 3. Fallback to Web Speech API
  fallbackWebSpeech(text, voiceSpeed, onEnd, onError, onSuccess);
  return false;
}

function fallbackWebSpeech(
  text: string,
  voiceSpeed: number,
  onEnd?: () => void,
  onError?: (err: string) => void,
  onSuccess?: (engine: 'gemini' | 'browser') => void
) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'my-MM';
      utterance.rate = voiceSpeed;

      const voices = window.speechSynthesis.getVoices();
      const burmeseVoice = voices.find(
        (v) => v.lang.includes('my') || v.lang.includes('burmese')
      );
      if (burmeseVoice) {
        utterance.voice = burmeseVoice;
      }

      utterance.onend = () => {
        if (onEnd) onEnd();
      };
      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        if (onError) onError('Browser speech synthesis error');
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
      if (onSuccess) onSuccess('browser');
      return;
    } catch (err: any) {
      console.warn('SpeechSynthesis invocation error:', err);
    }
  }

  if (onError) onError('အသံထုတ်ပေးသည့် စနစ် အဆင်မပြေပါ');
  if (onEnd) onEnd();
}
