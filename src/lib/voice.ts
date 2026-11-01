import { createAudioPlayer, type AudioPlayer } from 'expo-audio';

import { en, type Line } from '@/content/lines';
import { voiceClips } from '@/content/voice-manifest';

import { deviceVoiceStatus, prepare, speakLine, stopSpeech } from './tts';

// Pofi'nin sesi. Önce ElevenLabs ile üretilmiş dosyaya bakar (voice-manifest);
// yoksa cihaz/tarayıcı seslendirmesine düşer (tts.ts / tts.web.ts).
// Satırlar sırayla, aralarında doğal duraklarla çalınır.
// Yeni bir konuşma başlarsa önceki anında kesilir (çocuk dokununca eski cümle sürmesin).

let token = 0;
let player: AudioPlayer | null = null;

const stripTags = (t: string) => t.replace(/\[[^\]]*\]\s*/g, '').trim();
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function playClip(source: number, my: number) {
  return new Promise<void>((resolve) => {
    try {
      player?.remove();
      const p = createAudioPlayer(source);
      player = p;
      const guard = setTimeout(resolve, 15000);
      const sub = p.addListener('playbackStatusUpdate', (s) => {
        if (s.didJustFinish || my !== token) {
          clearTimeout(guard);
          sub.remove();
          resolve();
        }
      });
      p.play();
    } catch {
      resolve();
    }
  });
}

/** Satırları sırayla söyler. Yeni bir speak çağrısı öncekini keser. */
export async function speak(lines: Line | Line[]) {
  const list = Array.isArray(lines) ? lines : [lines];
  const my = ++token;
  try {
    player?.pause();
  } catch {
    // oynatıcı kapanmış
  }
  await stopSpeech();
  await prepare();
  for (const l of list) {
    if (my !== token) return;
    const clip = voiceClips[l.id];
    if (clip) await playClip(clip, my);
    else await speakLine(l, stripTags(l.text));
    if (my !== token) return;
    await wait(l.pauseAfter ?? 120);
  }
}

export function stopVoice() {
  token++;
  stopSpeech();
  try {
    player?.pause();
  } catch {
    // oynatıcı kapanmış
  }
}

/** Ses dosyası yokken cihaz sesi çalamıyorsa arayüz kullanıcıya söyleyebilsin */
export function voiceProblem(): null | 'none' | 'failing' {
  if (Object.keys(voiceClips).length > 0) return null;
  const s = deviceVoiceStatus();
  return s === 'ok' ? null : s;
}

/** Serbest İngilizce metin (dinamik içerik, ör. kart üzerindeki kelime) */
export const sayEnglish = (text: string, opts: { slow?: boolean } = {}) => speak(en(text, opts));
