import type { Word } from '@/content/regions';

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function optionsFor(target: Word, pool: Word[], count: number) {
  const others = shuffle(pool.filter((w) => w.id !== target.id)).slice(0, count - 1);
  return shuffle([target, ...others]);
}

/** Hata sayısını yıldıza çevirir; en az 1 yıldız — denemek her zaman ödüllenir. */
export function starsFor(mistakes: number, rounds: number) {
  const ratio = mistakes / Math.max(1, rounds);
  if (ratio <= 0.2) return 3;
  if (ratio <= 0.6) return 2;
  return 1;
}

export function plural(en: string) {
  if (en === 'fish') return 'fish';
  return `${en}s`;
}

export type GameProps = {
  words: Word[];
  onFinish: (result: { stars: number; collected?: string[] }) => void;
};
