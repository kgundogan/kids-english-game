import type { Line } from '@/content/lines';

// Tarayıcı seslendirmesi. expo-speech yerine doğrudan speechSynthesis, bilinen tarayıcı sorunlarına karşı:
// - Sesler geç yüklenir: voiceschanged beklenir.
// - İnternet üzerinden çalışan sesler (ör. "Google US English") gömülü sayfalarda sessizce düşebilir:
//   önce cihazdaki yerel sesler seçilir, hata olursa varsayılan sesle bir kez daha denenir.
// - cancel()'dan hemen sonraki speak() bazı Chrome sürümlerinde kaybolur: kısa bir ara bırakılır.
// - Konuşma nesnesi çöp toplayıcıya giderse 'end' olayı gelmez: referans tutulur.
// - iOS Safari ilk konuşmanın bir dokunuşla başlamasını ister: ilk dokunuşta sessiz bir konuşmayla kilit açılır.

const synth: SpeechSynthesis | undefined = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
const live = new Set<SpeechSynthesisUtterance>();
let voices: SpeechSynthesisVoice[] = [];
let enVoice: SpeechSynthesisVoice | undefined;
let trVoice: SpeechSynthesisVoice | undefined;
let failures = 0;
let successes = 0;

function rank(list: SpeechSynthesisVoice[], prefer: RegExp) {
  return [...list].sort((a, b) => {
    const score = (v: SpeechSynthesisVoice) => (v.localService ? 4 : 0) + (prefer.test(v.name) ? 2 : 0) + (v.default ? 1 : 0);
    return score(b) - score(a);
  })[0];
}

function choose() {
  voices = synth?.getVoices() ?? [];
  const lang = (code: string) => voices.filter((v) => v.lang?.toLowerCase().replace('_', '-').startsWith(code));
  const us = lang('en-us');
  enVoice = rank(us.length ? us : lang('en'), /samantha|ava|allison|aria|jenny|natural|enhanced|premium/i);
  trVoice = rank(lang('tr'), /yelda|emel|filiz|natural|enhanced|premium/i);
}

let ready: Promise<void> | null = null;
export function prepare() {
  if (!synth) return Promise.resolve();
  if (!ready) {
    ready = new Promise<void>((resolve) => {
      choose();
      if (voices.length) return resolve();
      const t = setTimeout(resolve, 1500);
      synth.addEventListener?.('voiceschanged', () => {
        choose();
        clearTimeout(t);
        resolve();
      });
    });
  }
  return ready;
}

if (typeof window !== 'undefined' && synth) {
  const unlock = () => {
    try {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      synth.speak(u);
    } catch {
      // önemli değil
    }
    window.removeEventListener('pointerdown', unlock);
  };
  window.addEventListener('pointerdown', unlock);
  prepare();
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Result = 'ok' | 'failed' | 'blocked';

function once(l: Line, text: string, voice: SpeechSynthesisVoice | undefined) {
  return new Promise<Result>((resolve) => {
    if (!synth) return resolve('failed');
    const u = new SpeechSynthesisUtterance(text);
    u.lang = l.lang === 'en' ? 'en-US' : 'tr-TR';
    if (voice) u.voice = voice;
    u.rate = l.lang === 'en' ? (l.slow ? 0.62 : 0.82) : 1;
    u.pitch = l.lang === 'en' ? 1.05 : 1.08;
    live.add(u);
    let settled = false;
    const finish = (r: Result) => {
      if (settled) return;
      settled = true;
      live.delete(u);
      clearTimeout(guard);
      resolve(r);
    };
    const guard = setTimeout(() => finish('ok'), 2000 + text.length * 120);
    u.onend = () => finish('ok');
    // 'not-allowed': kullanıcı henüz sayfaya dokunmadı; arıza değil, ilk dokunuştan sonra düzelir
    u.onerror = (e) => finish(e.error === 'interrupted' || e.error === 'canceled' ? 'ok' : e.error === 'not-allowed' ? 'blocked' : 'failed');
    synth.speak(u);
  });
}

export async function speakLine(l: Line, text: string) {
  if (!synth) {
    failures++;
    return;
  }
  await prepare();
  const voice = l.lang === 'en' ? enVoice : trVoice;
  let r = await once(l, text, voice);
  if (r === 'failed' && voice) r = await once(l, text, undefined);
  if (r === 'ok') successes++;
  else if (r === 'failed') failures++;
}

export function stopSpeech() {
  synth?.cancel();
  // cancel'dan hemen sonra gelen konuşma kaybolmasın
  return wait(60);
}

/** 'none': tarayıcıda ses motoru yok; 'failing': denendi, çalmadı */
export function deviceVoiceStatus(): 'ok' | 'none' | 'failing' {
  if (!synth) return 'none';
  if (failures >= 2 && successes === 0) return 'failing';
  return 'ok';
}
