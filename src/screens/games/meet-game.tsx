import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';

import { Chunky, Paper } from '@/components/chunky';
import { SpeakerIcon } from '@/components/icons';
import { sayEnglish, sayTurkish } from '@/lib/voice';
import { useProgress } from '@/state/progress';
import { colors, type } from '@/theme';

import type { GameProps } from './helpers';
import { RoundDots } from './round-dots';

/** Tanış: anlaşılır girdi. Çeviri yok — kelime resim, ses ve hareketle bağlanır. */
export function MeetGame({ words, onFinish }: GameProps) {
  const { markSeen, collect } = useProgress();
  const [i, setI] = useState(0);
  const [taps, setTaps] = useState(0);
  const w = words[i];

  useEffect(() => {
    setTaps(0);
    const t = setTimeout(() => {
      sayEnglish(`This is a ${w.en}. ${w.en}!`);
      markSeen(w.id);
    }, 300);
    return () => clearTimeout(t);
  }, [w, markSeen]);

  const next = () => {
    collect(w.id);
    if (i + 1 >= words.length) onFinish({ stars: 3, collected: words.map((x) => x.picture) });
    else setI(i + 1);
  };

  return (
    <View style={styles.wrap}>
      <RoundDots total={words.length} current={i} />
      <Animated.View key={w.id} entering={FadeInRight.duration(220)} exiting={FadeOutLeft.duration(160)}>
        <Pressable
          onPress={() => {
            setTaps((n) => n + 1);
            sayEnglish(w.en, { slow: taps % 2 === 1 });
          }}
          accessibilityRole="button"
          accessibilityLabel={`${w.en}, dinlemek için dokun`}
        >
          <Paper style={styles.card} round={40} depth={10}>
            <Text style={styles.picture}>{w.picture}</Text>
            <View style={styles.wordRow}>
              <SpeakerIcon size={28} color={colors.lagoonDeep} />
              <Text style={[type.hero, { color: colors.ink }]}>{w.en}</Text>
            </View>
          </Paper>
        </Pressable>
      </Animated.View>

      {w.move && (
        <Chunky
          tone="sun"
          onPress={async () => {
            await sayTurkish(`${w.move}!`);
            sayEnglish(w.en);
          }}
          faceStyle={styles.move}
          accessibilityLabel="Hareketle öğren"
        >
          <Text style={{ fontSize: 26 }}>🤸</Text>
          <Text style={[type.label, { color: colors.ink }]}>{w.move}</Text>
        </Chunky>
      )}

      <Chunky tone="leaf" label={i + 1 >= words.length ? 'Kartları topla!' : 'Sıradaki'} onPress={next} style={{ minWidth: 220 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 18 },
  card: { alignItems: 'center', paddingHorizontal: 48, paddingVertical: 20, minWidth: 280 },
  picture: { fontSize: 150, lineHeight: 176 },
  wordRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  move: { flexDirection: 'row', gap: 10 },
});
