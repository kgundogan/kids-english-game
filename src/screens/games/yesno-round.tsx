import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { Chunky, Paper } from '@/components/chunky';
import { SpeakerIcon } from '@/components/icons';
import { say } from '@/content/lines';
import type { Word } from '@/content/regions';
import { speak } from '@/lib/voice';
import { useProgress } from '@/state/progress';
import { colors, type } from '@/theme';

/**
 * Evet mi hayır mı: resim + Pofi'nin sorusu ("Cow?"). Çocuk ✅ ya da ❌ seçer.
 * Tanımadan farklı bir beceri: çocuk sesi resimle karşılaştırıp karar verir.
 * Kayıt, resimdeki hayvana (actual) yapılır.
 */
export function YesNoRound({ actual, asked, onDone }: { actual: Word; asked: Word; onDone: (mistakes: number) => void }) {
  const { recordAnswer } = useProgress();
  const [answer, setAnswer] = useState<null | { correct: boolean }>(null);
  const done = useRef(false);
  const isMatch = actual.id === asked.id;

  useEffect(() => {
    done.current = false;
    setAnswer(null);
    speak(say.isIt(asked));
  }, [actual, asked]);

  const choose = async (saidYes: boolean) => {
    if (done.current) return;
    done.current = true;
    const correct = saidYes === isMatch;
    setAnswer({ correct });
    recordAnswer(actual.id, correct, 'yesno');
    await speak(say.yesNoFeedback(correct, isMatch, asked, actual));
    onDone(correct ? 0 : 1);
  };

  return (
    <View style={styles.wrap}>
      <Paper style={styles.stage} round={36} depth={8}>
        <Text style={styles.picture}>{actual.picture}</Text>
        {answer && (
          <Animated.View entering={ZoomIn.springify()} style={styles.reveal}>
            <Text style={[type.title, { color: colors.ink }]}>{actual.en}</Text>
          </Animated.View>
        )}
      </Paper>

      <Chunky tone="lagoon" onPress={() => speak(say.isIt(asked))} round={20} depth={5} faceStyle={styles.question} accessibilityLabel="Soruyu tekrar dinle">
        <SpeakerIcon size={26} color={colors.white} />
        <Text style={[type.title, { color: colors.white }]}>{asked.en}?</Text>
      </Chunky>

      <View style={styles.row}>
        <Chunky tone="leaf" onPress={() => choose(true)} round={40} depth={8} faceStyle={styles.answer} accessibilityLabel="Yes">
          <Text style={styles.sign}>✅</Text>
          <Text style={[type.title, { color: colors.white }]}>Yes</Text>
        </Chunky>
        <Chunky tone="berry" onPress={() => choose(false)} round={40} depth={8} faceStyle={styles.answer} accessibilityLabel="No">
          <Text style={styles.sign}>❌</Text>
          <Text style={[type.title, { color: colors.white }]}>No</Text>
        </Chunky>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 16 },
  stage: { alignItems: 'center', paddingHorizontal: 44, paddingVertical: 14, minWidth: 240 },
  picture: { fontSize: 120, lineHeight: 140 },
  reveal: { marginTop: -6 },
  question: { flexDirection: 'row', gap: 10, paddingHorizontal: 22 },
  row: { flexDirection: 'row', gap: 20 },
  answer: { width: 130, height: 110, paddingHorizontal: 0, gap: 0 },
  sign: { fontSize: 36, lineHeight: 42 },
});
