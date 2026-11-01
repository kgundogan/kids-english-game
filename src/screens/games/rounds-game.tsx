import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ChunkIntro } from '@/components/chunk-intro';
import { WordTile } from '@/components/word-tile';
import type { ChunkId } from '@/content/chunks';
import { plural, say } from '@/content/lines';
import type { Word } from '@/content/regions';
import { speak } from '@/lib/voice';
import { useProgress, type AgeBand } from '@/state/progress';

import { FindRound } from './find-round';
import { optionsFor, shuffle, starsFor, type GameProps } from './helpers';
import { ListenRound } from './listen-round';
import { RoundDots } from './round-dots';
import { SpeakRound } from './speak-round';
import { YesNoRound } from './yesno-round';

export type RoundsKind = 'listen' | 'yesno' | 'find' | 'speak' | 'quest';

type Round =
  | { kind: 'listen'; word: Word; options: Word[]; alt?: boolean; read?: boolean }
  | { kind: 'yesno'; actual: Word; asked: Word }
  | { kind: 'find'; word: Word; others: Word[] }
  | { kind: 'speak'; word: Word }
  | { kind: 'like'; choices: Word[] };

function LikeRound({ choices, onDone }: { choices: Word[]; onDone: (m: number) => void }) {
  const [picked, setPicked] = useState<Word | null>(null);
  useEffect(() => {
    speak(say.likeAsk());
  }, []);
  if (picked) return <SpeakRound word={picked} phrase={`I like ${plural(picked)}`} required={['like', picked.en]} onDone={onDone} />;
  return (
    <View style={styles.grid}>
      {choices.map((w) => (
        <WordTile key={w.id} picture={w.picture} label="❤️" size={120} onPress={() => setPicked(w)} accessibilityLabel={w.en} />
      ))}
    </View>
  );
}

function yesNoPair(w: Word, pool: Word[]): { actual: Word; asked: Word } {
  // Yarı yarıya doğru/yanlış sorulur: çocuk tahminle geçemesin
  if (Math.random() < 0.5) return { actual: w, asked: w };
  const other = shuffle(pool.filter((x) => x.id !== w.id))[0];
  return { actual: w, asked: other };
}

function buildRounds(kind: RoundsKind, words: Word[], pool: Word[], band: AgeBand): Round[] {
  const others = (w: Word) => shuffle(pool.filter((x) => x.id !== w.id)).slice(0, 4);
  switch (kind) {
    case 'listen':
      // 6 tur; son iki turda hedef farklı görselle gelir (kavram testi)
      return words.slice(0, 6).map((w, i) => ({ kind: 'listen', word: w, options: optionsFor(w, pool, band === 'small' ? 3 : 4), alt: i >= 4 }));
    case 'yesno':
      return words.slice(0, 6).map((w) => ({ kind: 'yesno', ...yesNoPair(w, pool) }));
    case 'find':
      return words.slice(0, 5).map((w) => ({ kind: 'find', word: w, others: others(w) }));
    case 'speak':
      return words.slice(0, 4).map((w) => ({ kind: 'speak', word: w }));
    case 'quest': {
      // Bölüm sonu: her kelimeyi farklı bir yoldan sınar
      const [a, b, c, d, e, f] = words;
      const rounds: Round[] = [
        { kind: 'listen', word: a, options: optionsFor(a, pool, 4), alt: true },
        { kind: 'yesno', ...yesNoPair(b, pool) },
        { kind: 'find', word: c, others: others(c) },
        { kind: 'speak', word: d },
        band === 'small' ? { kind: 'yesno', ...yesNoPair(e, pool) } : { kind: 'listen', word: e, options: optionsFor(e, pool, 3), read: true },
        { kind: 'like', choices: optionsFor(f, pool, 3) },
      ];
      return rounds;
    }
  }
}

const chunksFor: Record<RoundsKind, ChunkId[]> = {
  listen: [],
  yesno: ['yes', 'no'],
  find: ['where'],
  speak: [],
  quest: ['like'],
};

export function RoundsGame({ kind, words, pool, onFinish }: GameProps & { kind: RoundsKind; pool: Word[] }) {
  const { progress } = useProgress();
  const [rounds] = useState(() => buildRounds(kind, words, pool, progress.ageBand ?? 'small'));
  // Bu oyunun kalıbını çocuk henüz hiç görmediyse önce tanıt
  const [intro, setIntro] = useState<ChunkId[]>(() => chunksFor[kind].filter((c) => (progress.chunks?.[c] ?? 0) < 1));
  const [i, setI] = useState(0);
  const mistakes = useRef(0);

  if (intro.length) return <ChunkIntro ids={intro} onDone={() => setIntro([])} />;

  const r = rounds[i];
  const done = (m: number) => {
    mistakes.current += m;
    if (i + 1 >= rounds.length) onFinish({ stars: starsFor(mistakes.current, rounds.length) });
    else setI(i + 1);
  };

  return (
    <View style={{ gap: 12 }}>
      <RoundDots total={rounds.length} current={i} />
      <Animated.View key={i} entering={FadeIn.duration(200)}>
        {r.kind === 'listen' && <ListenRound word={r.word} options={r.options} useAlt={r.alt} showText={r.read} onDone={done} />}
        {r.kind === 'yesno' && <YesNoRound actual={r.actual} asked={r.asked} onDone={done} />}
        {r.kind === 'find' && <FindRound word={r.word} others={r.others} onDone={done} />}
        {r.kind === 'speak' && <SpeakRound word={r.word} onDone={done} />}
        {r.kind === 'like' && <LikeRound choices={r.choices} onDone={done} />}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center' },
});
