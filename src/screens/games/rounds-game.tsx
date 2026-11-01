import { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { WordTile } from '@/components/word-tile';
import type { Word } from '@/content/regions';
import { sayEnglish } from '@/lib/voice';
import { colors, type } from '@/theme';

import { optionsFor, plural, starsFor, type GameProps } from './helpers';
import { ListenRound } from './listen-round';
import { RoundDots } from './round-dots';
import { SpeakRound } from './speak-round';

type Round =
  | { kind: 'listen'; word: Word; options: Word[] }
  | { kind: 'speak'; word: Word }
  | { kind: 'chunk'; choices: Word[] };

function ChunkRound({ choices, onDone }: { choices: Word[]; onDone: (m: number) => void }) {
  const [picked, setPicked] = useState<Word | null>(null);
  if (picked) {
    const p = plural(picked.en);
    return <SpeakRound word={picked} phrase={`I like ${p}`} required={['like', picked.en]} onDone={onDone} />;
  }
  return (
    <View style={{ alignItems: 'center', gap: 16 }}>
      <Text style={[type.title, { color: colors.ink, textAlign: 'center' }]}>Which animal do you like?</Text>
      <Text style={[type.label, { color: colors.inkSoft }]}>En sevdiğin hayvanı seç</Text>
      <View style={styles.grid}>
        {choices.map((w) => (
          <WordTile
            key={w.id}
            picture={w.picture}
            label={w.en}
            size={120}
            onPress={() => {
              sayEnglish(`I like ${plural(w.en)}!`);
              setPicked(w);
            }}
          />
        ))}
      </View>
    </View>
  );
}

function useRounds(kind: 'listen' | 'speak' | 'quest', words: Word[], pool: Word[]): Round[] {
  return useMemo(() => {
    if (kind === 'listen') return words.slice(0, 6).map((w) => ({ kind: 'listen' as const, word: w, options: optionsFor(w, pool, 3) }));
    if (kind === 'speak') return words.slice(0, 4).map((w) => ({ kind: 'speak' as const, word: w }));
    // Bölüm sonu görevi: tüm bölge kelimeleri + kalıp ("I like ___") ile konuşma
    const [a, b, c, d, e, f] = words;
    return [
      { kind: 'listen', word: a, options: optionsFor(a, pool, 4) },
      { kind: 'listen', word: b, options: optionsFor(b, pool, 4) },
      { kind: 'speak', word: c },
      { kind: 'listen', word: d, options: optionsFor(d, pool, 4) },
      { kind: 'speak', word: e },
      { kind: 'chunk', choices: optionsFor(f, pool, 3) },
    ] as Round[];
  }, [kind, words, pool]);
}

export function RoundsGame({ kind, words, pool, onFinish }: GameProps & { kind: 'listen' | 'speak' | 'quest'; pool: Word[] }) {
  const rounds = useRounds(kind, words, pool);
  const [i, setI] = useState(0);
  const mistakes = useRef(0);
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
        {r.kind === 'listen' && <ListenRound word={r.word} options={r.options} onDone={done} />}
        {r.kind === 'speak' && <SpeakRound word={r.word} onDone={done} />}
        {r.kind === 'chunk' && <ChunkRound choices={r.choices} onDone={done} />}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center' },
});
