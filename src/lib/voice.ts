import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import * as Speech from 'expo-speech';

import { en, type Line } from '@/content/lines';
import { voiceClips } from '@/content/voice-manifest';

// Pofi'nin sesi. Önce ElevenLabs ile üretilmiş dosyaya bakar (voice-manifest);
// yoksa cihazın seslendirmesine düşer. Satırlar sırayla, aralarında doğal duraklarla çalınır.
// Yeni bir konuşma başlarsa önceki anında kesilir (çocuk dokununca eski cümle sürmesin).

let enVoice: string | undefined;
let trVoice: string | undefined;
let voicesLoaded = false;
let token = 0;
let player: AudioPlayer | null = null;

async function pickVoices() {
  if (voicesLoaded) return;
  voicesLoaded = true;
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const by = (lang: string) => voices.filter((v) => v.language?.toLowerCase().startsWith(lang));
    const best = (list: typeof voices, pref: RegExp) =>
      (list.find((v) => pref.test(`${v.name} ${v.identifier} ${v.quality ?? ''}`)) ?? list[0])?.identifier;
    enVoice = best(
      by('en').filter((v) => /en[-_]us/i.test(v.language)).length ? by('en').filter((v) => /en[-_]us/i.test(v.language)) : by('en'),
      /enhanced|premium|neural|natural|samantha|aria|jenny|ava|google us/i,
    );
    trVoice = best(by('tr'), /enhanced|premium|neural|natural|yelda|emel|google/i);
  } catch {
    // ses listesi alınamazsa dil koduyla devam
  }
}

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

function speakDevice(l: Line, my: number) {
  return new Promise<void>((resolve) => {
    const text = stripTags(l.text);
    const guard = setTimeout(resolve, 1500 + text.length * 110);
    const done = () => {
      clearTimeout(guard);
      resolve();
    };
    if (my !== token) return done();
    Speech.speak(text, {
      language: l.lang === 'en' ? 'en-US' : 'tr-TR',
      voice: l.lang === 'en' ? enVoice : trVoice,
      // Öğretmen temposu: İngilizce kelimeler yavaş ve net, Türkçe doğal hızda
      rate: l.lang === 'en' ? (l.slow ? 0.62 : 0.8) : 0.98,
      pitch: l.lang === 'en' ? 1.05 : 1.08,
      onDone: done,
      onStopped: done,
      onError: done,
    });
  });
}

/** Satırları sırayla söyler. Yeni bir speak çağrısı öncekini keser. */
export async function speak(lines: Line | Line[]) {
  const list = Array.isArray(lines) ? lines : [lines];
  const my = ++token;
  Speech.stop();
  player?.pause();
  await pickVoices();
  for (const l of list) {
    if (my !== token) return;
    const clip = voiceClips[l.id];
    if (clip) await playClip(clip, my);
    else await speakDevice(l, my);
    if (my !== token) return;
    await wait(l.pauseAfter ?? 120);
  }
}

export function stopVoice() {
  token++;
  Speech.stop();
  try {
    player?.pause();
  } catch {
    // oynatıcı zaten kapandı
  }
}

/** Serbest İngilizce metin (dinamik içerik, ör. kart üzerindeki kelime) */
export const sayEnglish = (text: string, opts: { slow?: boolean } = {}) => speak(en(text, opts));
