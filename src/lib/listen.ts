import { useCallback, useEffect, useRef, useState } from 'react';

// Bas-konuş ses tanıma. Mikrofon sürekli açık değil; ses saklanmaz, yalnızca metin döner.
// Expo Go'da yerel modül bulunmaz: o durumda `available=false` olur ve oyun
// "Pofi'yi taklit et" (shadowing) moduna düşer. Geliştirme derlemesi ve web'de tam çalışır.

type Module = {
  start: (o: Record<string, unknown>) => void;
  stop: () => void;
  abort: () => void;
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  isRecognitionAvailable: () => boolean;
  addListener: (event: string, cb: (e: any) => void) => { remove: () => void };
};

let mod: Module | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  mod = require('expo-speech-recognition').ExpoSpeechRecognitionModule as Module;
} catch {
  mod = null;
}

export type ListenState = 'idle' | 'listening' | 'thinking';

export function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Çocuk söyleyişine hoşgörülü eşleşme: hedef kelime ya da kabul listesi cümlede geçiyorsa doğru. */
export function heardMatches(heard: string[], target: string, accept: string[] = []) {
  const wanted = [target, ...accept].map(normalize);
  return heard.some((h) => {
    const words = normalize(h).split(' ');
    const joined = normalize(h);
    return wanted.some((w) => joined === w || words.includes(w) || joined.includes(w));
  });
}

export function useListen() {
  const [state, setState] = useState<ListenState>('idle');
  const [available, setAvailable] = useState<boolean>(() => {
    try {
      return !!mod && mod.isRecognitionAvailable();
    } catch {
      return false;
    }
  });
  const resultRef = useRef<string[]>([]);
  const resolver = useRef<((r: string[]) => void) | null>(null);

  useEffect(() => {
    if (!mod) return;
    const subs = [
      mod.addListener('result', (e) => {
        const list: string[] = (e?.results ?? []).map((r: { transcript: string }) => r.transcript);
        if (list.length) resultRef.current = list;
      }),
      mod.addListener('end', () => {
        setState('idle');
        resolver.current?.(resultRef.current);
        resolver.current = null;
      }),
      mod.addListener('error', (e) => {
        if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed') setAvailable(false);
        setState('idle');
        resolver.current?.([]);
        resolver.current = null;
      }),
    ];
    return () => subs.forEach((s) => s.remove());
  }, []);

  const start = useCallback(async () => {
    if (!mod || !available) return false;
    const perm = await mod.requestPermissionsAsync().catch(() => ({ granted: false }));
    if (!perm.granted) {
      setAvailable(false);
      return false;
    }
    resultRef.current = [];
    setState('listening');
    mod.start({ lang: 'en-US', interimResults: true, maxAlternatives: 5, continuous: false });
    return true;
  }, [available]);

  /** Parmak kalkınca çağrılır; tanınan alternatifleri döndürür. */
  const stop = useCallback(() => {
    if (!mod) return Promise.resolve<string[]>([]);
    setState('thinking');
    return new Promise<string[]>((resolve) => {
      resolver.current = resolve;
      mod!.stop();
      // Bazı tarayıcılar 'end' göndermezse takılmayalım
      setTimeout(() => {
        if (resolver.current === resolve) {
          resolver.current = null;
          setState('idle');
          resolve(resultRef.current);
        }
      }, 2500);
    });
  }, []);

  return { available, state, start, stop };
}
