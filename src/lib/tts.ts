import * as Speech from 'expo-speech';

import type { Line } from '@/content/lines';

// Cihaz seslendirmesi (iOS/Android). Web sürümü: tts.web.ts

let enVoice: string | undefined;
let trVoice: string | undefined;
let loaded = false;

export async function prepare() {
  if (loaded) return;
  loaded = true;
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const pick = (lang: string, pref: RegExp) => {
      const list = voices.filter((v) => v.language?.toLowerCase().replace('_', '-').startsWith(lang));
      return (list.find((v) => v.quality === Speech.VoiceQuality.Enhanced) ?? list.find((v) => pref.test(v.name)) ?? list[0])?.identifier;
    };
    enVoice = pick('en-us', /samantha|ava|allison|aria|jenny/i) ?? pick('en', /./);
    trVoice = pick('tr', /yelda|emel|filiz/i);
  } catch {
    // ses listesi alınamazsa dil koduyla devam
  }
}

export function speakLine(l: Line, text: string) {
  return new Promise<void>((resolve) => {
    const guard = setTimeout(resolve, 1500 + text.length * 110);
    const done = () => {
      clearTimeout(guard);
      resolve();
    };
    Speech.speak(text, {
      language: l.lang === 'en' ? 'en-US' : 'tr-TR',
      voice: l.lang === 'en' ? enVoice : trVoice,
      rate: l.lang === 'en' ? (l.slow ? 0.62 : 0.8) : 0.98,
      pitch: l.lang === 'en' ? 1.05 : 1.08,
      onDone: done,
      onStopped: done,
      onError: done,
    });
  });
}

export function stopSpeech() {
  Speech.stop();
  return Promise.resolve();
}

export const deviceVoiceStatus = () => 'ok' as 'ok' | 'none' | 'failing';
