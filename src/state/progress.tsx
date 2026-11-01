import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import type { ChunkId } from '@/content/chunks';
import type { Word } from '@/content/regions';

/** Kelimenin hangi yoldan bilindiği. Bir kelime ancak farklı yollardan geçince "öğrendi" sayılır. */
export type TestType = 'listen' | 'yesno' | 'find' | 'match' | 'speak' | 'read' | 'chunk' | 'alt' | 'parent';
export type AgeBand = 'small' | 'mid' | 'big';
export type Mastery = 'new' | 'met' | 'practicing' | 'learned';

export type WordStat = {
  seen: number;
  correct: number;
  wrong: number;
  /** 0 (yeni) – 5 (oturmuş). Aralıklı tekrar bu değere göre kelime seçer. */
  strength: number;
  lastSeen: number;
  collected: boolean;
  /** Test türü → ilk denemede doğru sayısı */
  passed: Partial<Record<TestType, number>>;
  /** İlk denemede doğru bildiği farklı günler (son 7) */
  goodDays: string[];
};

export type DayLog = { seconds: number; correct: number; wrong: number; spoken: number };

export type Progress = {
  childName: string;
  ageBand: AgeBand;
  /** Kalıp → kaç kez tanıtıldı (Türkçe iskele ilk 2 kez) */
  chunks: Partial<Record<ChunkId, number>>;
  stars: number;
  words: Record<string, WordStat>;
  steps: Record<string, number>;
  days: Record<string, DayLog>;
  dailyLimitMin: number;
  bonusSecondsToday: number;
  bonusDate: string;
};

const KEY = 'pofi.progress.v2';

const initial: Progress = {
  childName: '',
  ageBand: 'small',
  chunks: {},
  stars: 0,
  words: {},
  steps: {},
  days: {},
  dailyLimitMin: 15,
  bonusSecondsToday: 0,
  bonusDate: '',
};

export const today = () => new Date().toISOString().slice(0, 10);

const emptyStat = (): WordStat => ({ seen: 0, correct: 0, wrong: 0, strength: 0, lastSeen: 0, collected: false, passed: {}, goodDays: [] });

/**
 * Öğrendi kuralı: en az 4 farklı test türünde ilk denemede doğru, en az 2 farklı gün,
 * ve en az bir üretim kanıtı (kendisi söyledi ya da veli duydu).
 */
export function masteryOf(s?: WordStat): Mastery {
  if (!s || (!s.collected && s.seen === 0)) return 'new';
  const types = Object.keys(s.passed ?? {}).filter((k) => (s.passed?.[k as TestType] ?? 0) > 0);
  const produced = (s.passed?.speak ?? 0) > 0 || (s.passed?.parent ?? 0) > 0;
  if (types.length >= 4 && (s.goodDays?.length ?? 0) >= 2 && produced) return 'learned';
  if (types.length > 0) return 'practicing';
  return 'met';
}

export const masteryTypes = (s?: WordStat) => Object.keys(s?.passed ?? {}).filter((k) => (s?.passed?.[k as TestType] ?? 0) > 0) as TestType[];
const emptyDay = (): DayLog => ({ seconds: 0, correct: 0, wrong: 0, spoken: 0 });

type Ctx = {
  progress: Progress;
  ready: boolean;
  /** Bugün kalan oyun saniyesi */
  secondsLeft: number;
  asleep: boolean;
  companionLevel: number;
  recordAnswer: (wordId: string, correct: boolean, test: TestType, opts?: { alsoAlt?: boolean }) => void;
  markChunk: (id: ChunkId) => void;
  setAgeBand: (b: AgeBand) => void;
  markSeen: (wordId: string) => void;
  collect: (wordId: string) => void;
  completeStep: (stepId: string, stars: number) => void;
  setDailyLimit: (min: number) => void;
  setChildName: (name: string) => void;
  grantBonus: (minutes: number) => void;
  reset: () => void;
  /** Zorlanılan ve uzun süredir görülmeyen kelimeler öne çıkar. */
  pickWords: (pool: Word[], n: number) => Word[];
};

const ProgressContext = createContext<Ctx | null>(null);

// Yıldızlarla Pofi büyür: 0, 10, 25, 45, 70…
export const levelFor = (stars: number) => {
  let level = 1;
  let need = 10;
  let total = 0;
  while (stars >= total + need) {
    total += need;
    level += 1;
    need += 5 * level;
  }
  return level;
};

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(initial);
  const [ready, setReady] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setProgress({ ...initial, ...JSON.parse(raw) });
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.setItem(KEY, JSON.stringify(progress)).catch(() => {});
    }, 400);
  }, [progress, ready]);

  const update = useCallback((fn: (p: Progress) => Progress) => setProgress(fn), []);

  const updateDay = (p: Progress, fn: (d: DayLog) => DayLog): Progress => {
    const d = today();
    return { ...p, days: { ...p.days, [d]: fn(p.days[d] ?? emptyDay()) } };
  };

  // Ön planda geçen süreyi say: günlük limit hem veliyi hem AI maliyetini korur.
  useEffect(() => {
    if (!ready) return;
    let active = AppState.currentState === 'active' || AppState.currentState == null;
    const sub = AppState.addEventListener('change', (s) => {
      active = s === 'active';
    });
    const id = setInterval(() => {
      if (!active) return;
      setProgress((p) => updateDay(p, (d) => ({ ...d, seconds: d.seconds + 5 })));
    }, 5000);
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, [ready]);

  const recordAnswer = useCallback<Ctx['recordAnswer']>(
    (wordId, correct, test, opts) =>
      update((p) => {
        const s = { ...emptyStat(), ...(p.words[wordId] ?? {}) };
        const d = today();
        const passed = { ...s.passed };
        if (correct) {
          passed[test] = (passed[test] ?? 0) + 1;
          if (opts?.alsoAlt) passed.alt = (passed.alt ?? 0) + 1;
        }
        const goodDays = correct && !s.goodDays.includes(d) ? [...s.goodDays, d].slice(-7) : s.goodDays;
        const next: WordStat = {
          ...s,
          passed,
          goodDays,
          seen: s.seen + 1,
          correct: s.correct + (correct ? 1 : 0),
          wrong: s.wrong + (correct ? 0 : 1),
          strength: Math.max(0, Math.min(5, s.strength + (correct ? 1 : -1))),
          lastSeen: Date.now(),
        };
        const withWord = { ...p, words: { ...p.words, [wordId]: next } };
        return updateDay(withWord, (d) => ({
          ...d,
          correct: d.correct + (correct ? 1 : 0),
          wrong: d.wrong + (correct ? 0 : 1),
          spoken: d.spoken + ((test === 'speak' || test === 'parent') && correct ? 1 : 0),
        }));
      }),
    [update],
  );

  const markSeen = useCallback(
    (wordId: string) =>
      update((p) => {
        const s = { ...emptyStat(), ...(p.words[wordId] ?? {}) };
        return { ...p, words: { ...p.words, [wordId]: { ...s, seen: s.seen + 1, lastSeen: Date.now() } } };
      }),
    [update],
  );

  const collect = useCallback(
    (wordId: string) =>
      update((p) => {
        const s = { ...emptyStat(), ...(p.words[wordId] ?? {}) };
        if (s.collected) return p;
        return { ...p, words: { ...p.words, [wordId]: { ...s, collected: true } } };
      }),
    [update],
  );

  const completeStep = useCallback(
    (stepId: string, stars: number) =>
      update((p) => {
        // Her oynayış yıldız kazandırır (tekrar teşvik edilir); en iyi skor ayrıca saklanır.
        const prev = p.steps[stepId] ?? 0;
        return { ...p, stars: p.stars + stars, steps: { ...p.steps, [stepId]: Math.max(prev, stars) } };
      }),
    [update],
  );

  const markChunk = useCallback(
    (id: ChunkId) => update((p) => ({ ...p, chunks: { ...p.chunks, [id]: (p.chunks?.[id] ?? 0) + 1 } })),
    [update],
  );
  const setAgeBand = useCallback((b: AgeBand) => update((p) => ({ ...p, ageBand: b })), [update]);

  const setDailyLimit = useCallback((min: number) => update((p) => ({ ...p, dailyLimitMin: min })), [update]);
  const setChildName = useCallback((name: string) => update((p) => ({ ...p, childName: name })), [update]);
  const grantBonus = useCallback(
    (minutes: number) =>
      update((p) => {
        const d = today();
        const base = p.bonusDate === d ? p.bonusSecondsToday : 0;
        return { ...p, bonusDate: d, bonusSecondsToday: base + minutes * 60 };
      }),
    [update],
  );
  const reset = useCallback(() => setProgress(initial), []);

  const pickWords = useCallback<Ctx['pickWords']>(
    (pool, n) => {
      const now = Date.now();
      const scored = pool.map((w) => {
        const s = progress.words[w.id] ?? emptyStat();
        const hoursAgo = s.lastSeen ? (now - s.lastSeen) / 36e5 : 48;
        // Zayıf kelime ağırlığı + unutmaya yaklaşma + biraz şans (aynı sıra hiç tekrarlanmasın)
        const score = (6 - s.strength) * 2 + Math.min(hoursAgo, 48) / 12 + Math.random() * 3;
        return { w, score };
      });
      return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, n)
        .map((x) => x.w);
    },
    [progress.words],
  );

  const d = today();
  const used = progress.days[d]?.seconds ?? 0;
  const bonus = progress.bonusDate === d ? progress.bonusSecondsToday : 0;
  const secondsLeft = Math.max(0, progress.dailyLimitMin * 60 + bonus - used);

  const value = useMemo<Ctx>(
    () => ({
      progress,
      ready,
      secondsLeft,
      asleep: ready && progress.dailyLimitMin > 0 && secondsLeft <= 0,
      companionLevel: levelFor(progress.stars),
      recordAnswer,
      markChunk,
      setAgeBand,
      markSeen,
      collect,
      completeStep,
      setDailyLimit,
      setChildName,
      grantBonus,
      reset,
      pickWords,
    }),
    [progress, ready, secondsLeft, recordAnswer, markChunk, setAgeBand, markSeen, collect, completeStep, setDailyLimit, setChildName, grantBonus, reset, pickWords],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider');
  return ctx;
}
