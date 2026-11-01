import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { Chunky, Paper } from '@/components/chunky';
import { MicIcon, SpeakerIcon, StarIcon } from '@/components/icons';
import type { Word } from '@/content/regions';
import { heardMatches, normalize, useListen } from '@/lib/listen';
import { en, say } from '@/content/lines';
import { speak } from '@/lib/voice';
import { useProgress } from '@/state/progress';
import { colors, type } from '@/theme';

type Phase = 'model' | 'ready' | 'right' | 'retry';

const MAX_TRIES = 3;

/**
 * Konuş-büyü: çocuk kelimeyi (ya da kalıbı) söyler, doğruysa büyü çalışır.
 * Hata cezası yok: 3 denemeden sonra Pofi doğrusunu söyler ve oyun devam eder.
 * Ses tanıma yoksa (Expo Go) "Pofi'yi taklit et" moduna düşer.
 */
export function SpeakRound({
  word,
  phrase,
  required,
  onDone,
}: {
  word: Word;
  /** Söylenecek kalıp, ör. "I like cats". Yoksa kelimenin kendisi. */
  phrase?: string;
  /** Kalıpta duyulması gereken kelimeler */
  required?: string[];
  onDone: (mistakes: number) => void;
}) {
  const { recordAnswer, progress } = useProgress();
  // İlk kez: önce model, sonra taklit. Sonra: önce kendisi hatırlasın, model sadece takılırsa.
  const [firstTime] = useState(() => (progress.words[word.id]?.passed?.speak ?? 0) === 0);
  const listen = useListen();
  const [phase, setPhase] = useState<Phase>('model');
  const [heard, setHeard] = useState('');
  const tries = useRef(0);
  const target = phrase ?? word.en;

  useEffect(() => {
    tries.current = 0;
    setHeard('');
    setPhase('model');
    let alive = true;
    (async () => {
      const t = setTimeout(() => alive && setPhase('ready'), 3500);
      await speak(phrase ? say.likeModel(word) : say.speakPrompt(word, firstTime));
      clearTimeout(t);
      if (alive) setPhase('ready');
    })();
    return () => {
      alive = false;
    };
  }, [target]);

  const succeed = async () => {
    setPhase('right');
    recordAnswer(word.id, tries.current === 0, phrase ? 'chunk' : 'speak');
    await speak([en('[excited] Yes!', { pauseAfter: 120 }), phrase ? en(`${target}!`) : say.word(word)]);
    onDone(tries.current);
  };

  const check = (alts: string[]) => {
    setHeard(alts[0] ?? '');
    const ok = required
      ? alts.some((a) => required.every((r) => normalize(a).split(' ').some((w) => w.startsWith(normalize(r)))))
      : heardMatches(alts, word.en, word.accept);
    if (ok) return succeed();

    tries.current += 1;
    if (tries.current >= MAX_TRIES) {
      // Nazik düzeltme: hatayı söylemez, doğrusunu tekrar eder ve devam eder.
      setPhase('right');
      recordAnswer(word.id, false, phrase ? 'chunk' : 'speak');
      speak(phrase ? [en(`${target}!`), say.praise[0]] : say.speakGiveUp(word)).then(() => onDone(tries.current));
      return;
    }
    setPhase('retry');
    speak(phrase ? [say.likeModel(word)[0]] : say.speakRetry(word));
  };

  const onHoldStart = async () => {
    if (phase === 'right' || phase === 'model') return;
    await listen.start();
  };
  const onHoldEnd = async () => {
    if (listen.state !== 'listening') return;
    const alts = await listen.stop();
    check(alts);
  };

  const listening = listen.state === 'listening';

  return (
    <View style={styles.wrap}>
      <Paper style={styles.stage} round={36} depth={8}>
        <Text style={styles.picture}>{word.picture}</Text>
        {phase === 'right' &&
          [0, 1, 2, 3, 4].map((i) => (
            <Animated.View key={i} entering={ZoomIn.delay(i * 70).springify()} style={[styles.spark, sparkPos[i]]}>
              <StarIcon size={30} />
            </Animated.View>
          ))}
        {(firstTime || phrase || phase === 'right' || phase === 'retry') && <Text style={[type.word, { color: colors.ink }]}>{target}</Text>}
      </Paper>

      <Chunky tone="paper" onPress={() => speak(phrase ? say.likeModel(word)[0] : say.wordSlow(word))} round={18} depth={4} faceStyle={styles.again} accessibilityLabel="Pofi'den tekrar dinle">
        <SpeakerIcon size={22} />
        <Text style={[type.label, { color: colors.ink }]}>Tekrar dinle</Text>
      </Chunky>

      {listen.available ? (
        <>
          <Chunky
            tone={listening ? 'berry' : 'plum'}
            onPressIn={onHoldStart}
            onPressOut={onHoldEnd}
            disabled={phase === 'model' || phase === 'right'}
            round={70}
            depth={10}
            faceStyle={styles.mic}
            accessibilityLabel="Basılı tut ve konuş"
          >
            <MicIcon size={58} />
          </Chunky>
          <Text style={[type.label, { color: colors.inkSoft, textAlign: 'center' }]}>
            {listening
              ? 'Dinliyorum…'
              : listen.state === 'thinking'
                ? 'Bir saniye…'
                : phase === 'retry'
                  ? `Neredeyse! Duyduğum: “${heard || '…'}”. Bir daha dene.`
                  : 'Basılı tut ve söyle'}
          </Text>
        </>
      ) : (
        <>
          <Text style={[type.body, { color: colors.inkSoft, textAlign: 'center', maxWidth: 340 }]}>
            Pofi’yi dinle ve yüksek sesle tekrar et. Söyleyince düğmeye bas.
          </Text>
          <Chunky tone="plum" label="Söyledim!" disabled={phase !== 'ready'} onPress={succeed} />
        </>
      )}
    </View>
  );
}

const sparkPos = [
  { top: 6, left: 14 },
  { top: 0, right: 22 },
  { top: 70, right: 4 },
  { top: 84, left: 0 },
  { top: -10, left: '45%' as const },
];

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 14 },
  stage: { alignItems: 'center', paddingHorizontal: 40, paddingVertical: 16, minWidth: 260 },
  picture: { fontSize: 110, lineHeight: 130 },
  spark: { position: 'absolute' },
  again: { flexDirection: 'row', gap: 6, minHeight: 44, paddingVertical: 6 },
  mic: { width: 128, height: 128, paddingHorizontal: 0 },
});
