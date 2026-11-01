import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { Chunky, Paper } from '@/components/chunky';
import { SpeakerIcon } from '@/components/icons';
import { chunks, SCAFFOLD_EXPOSURES, type ChunkId } from '@/content/chunks';
import { say } from '@/content/lines';
import { speak } from '@/lib/voice';
import { useProgress } from '@/state/progress';
import { colors, type } from '@/theme';

/**
 * Bir kalıbı (Hello / Yes / No / Where is…? / I like…) oyun içinde tanıtır.
 * Kalıp hep aynı işaretle görünür; ilk iki karşılaşmada Pofi durumu Türkçe anlatır,
 * sonra Türkçe destek çekilir ve sadece İngilizce kalıp kalır.
 */
export function ChunkIntro({ ids, onDone }: { ids: ChunkId[]; onDone: () => void }) {
  const { progress, markChunk } = useProgress();
  const [i, setI] = useState(0);
  const [ready, setReady] = useState(false);
  const id = ids[i];
  const c = chunks[id];
  const scaffold = (progress.chunks?.[id] ?? 0) < SCAFFOLD_EXPOSURES;

  useEffect(() => {
    let alive = true;
    setReady(false);
    speak(say.chunkIntro(id, scaffold)).then(() => alive && setReady(true));
    const t = setTimeout(() => alive && setReady(true), 2500);
    return () => {
      alive = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const next = () => {
    markChunk(id);
    if (i + 1 >= ids.length) onDone();
    else setI(i + 1);
  };

  return (
    <View style={styles.wrap}>
      <Animated.View key={id} entering={ZoomIn.springify().damping(14)}>
        <Paper style={styles.card} round={36} depth={8}>
          <Text style={styles.sign}>{c.sign}</Text>
          <Text style={[type.hero, { color: colors.ink, textAlign: 'center' }]}>{c.en}</Text>
          {scaffold && <Text style={[type.body, styles.scaffold]}>{c.scaffold}</Text>}
        </Paper>
      </Animated.View>
      <View style={styles.row}>
        <Chunky tone="paper" onPress={() => speak(say.chunkIntro(id, false))} faceStyle={styles.again} accessibilityLabel="Tekrar dinle">
          <SpeakerIcon size={22} />
          <Text style={[type.label, { color: colors.ink }]}>Tekrar</Text>
        </Chunky>
        <Chunky tone="leaf" label="Tamam!" onPress={next} disabled={!ready} style={{ minWidth: 160 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 18 },
  card: { alignItems: 'center', paddingHorizontal: 32, paddingVertical: 20, gap: 6, maxWidth: 460 },
  sign: { fontSize: 88, lineHeight: 104 },
  scaffold: { color: colors.inkSoft, textAlign: 'center' },
  row: { flexDirection: 'row', gap: 12 },
  again: { flexDirection: 'row', gap: 6 },
});
