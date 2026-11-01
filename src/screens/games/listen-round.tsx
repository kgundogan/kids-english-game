import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Chunky } from '@/components/chunky';
import { SpeakerIcon } from '@/components/icons';
import { WordTile, type TileState } from '@/components/word-tile';
import type { Word } from '@/content/regions';
import { randomPraise, randomRetry, sayEnglish } from '@/lib/voice';
import { useProgress } from '@/state/progress';
import { colors, type } from '@/theme';

/** Dinle-bul: Pofi kelimeyi söyler, çocuk doğru resme dokunur. Önce kulak, yazı yok. */
export function ListenRound({ word, options, onDone }: { word: Word; options: Word[]; onDone: (mistakes: number) => void }) {
  const { recordAnswer } = useProgress();
  const [states, setStates] = useState<Record<string, TileState>>({});
  const mistakes = useRef(0);
  const finished = useRef(false);
  const { width } = useWindowDimensions();
  const tile = Math.min(150, Math.max(96, (Math.min(width, 720) - 64) / Math.min(options.length, 4) - 12));

  useEffect(() => {
    mistakes.current = 0;
    finished.current = false;
    setStates({});
    const t = setTimeout(() => sayEnglish(word.en), 350);
    return () => clearTimeout(t);
  }, [word]);

  const pick = async (w: Word) => {
    if (finished.current) return;
    if (w.id === word.id) {
      finished.current = true;
      setStates((s) => ({ ...s, [w.id]: 'right' }));
      recordAnswer(word.id, mistakes.current === 0);
      await sayEnglish(`${randomPraise()} ${word.en}!`);
      onDone(mistakes.current);
    } else {
      mistakes.current += 1;
      setStates((s) => ({ ...s, [w.id]: 'wrong' }));
      setTimeout(() => setStates((s) => ({ ...s, [w.id]: 'faded' })), 320);
      await sayEnglish(`That's ${w.en}. ${randomRetry()} ${word.en}.`);
    }
  };

  return (
    <View style={styles.wrap}>
      <Chunky tone="lagoon" onPress={() => sayEnglish(word.en, { slow: true })} accessibilityLabel="Kelimeyi tekrar dinle" round={60} depth={8} faceStyle={styles.ear}>
        <SpeakerIcon size={56} color={colors.white} />
      </Chunky>
      <Text style={[type.label, { color: colors.inkSoft }]}>Dinle ve doğru resme dokun</Text>
      <View style={styles.grid}>
        {options.map((o) => (
          <WordTile key={o.id} picture={o.picture} size={tile} state={states[o.id] ?? 'idle'} onPress={() => pick(o)} accessibilityLabel="Seçenek" />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 16 },
  ear: { width: 112, height: 112, paddingHorizontal: 0 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center', marginTop: 8 },
});
