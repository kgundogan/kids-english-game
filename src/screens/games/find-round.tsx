import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Ellipse, Path } from 'react-native-svg';

import { Chunky } from '@/components/chunky';
import { say } from '@/content/lines';
import type { Word } from '@/content/regions';
import { speak } from '@/lib/voice';
import { useProgress } from '@/state/progress';
import { colors, type } from '@/theme';

import { shuffle } from './helpers';

// Sahnede saklanma noktaları (yüzde): çalı arkası, ağaç dibi, kaya yanı, su kenarı…
const SPOTS = [
  { left: 8, top: 52 },
  { left: 30, top: 22 },
  { left: 54, top: 58 },
  { left: 74, top: 26 },
  { left: 40, top: 72 },
  { left: 82, top: 64 },
];

function Hider({ word, state, onPress, spot }: { word: Word; state: 'idle' | 'right' | 'wrong'; onPress: () => void; spot: { left: number; top: number } }) {
  const x = useSharedValue(0);
  const s = useSharedValue(1);
  useEffect(() => {
    if (state === 'wrong') x.set(withSequence(withTiming(-7, { duration: 50 }), withTiming(7, { duration: 70 }), withTiming(0, { duration: 60 })));
    if (state === 'right') s.set(withSequence(withTiming(1.25, { duration: 140 }), withSpring(1.1, { duration: 400, dampingRatio: 0.6 })));
  }, [state, x, s]);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }, { scale: s.get() }] }));
  return (
    <Animated.View style={[styles.hider, { left: `${spot.left}%`, top: `${spot.top}%` }, anim]}>
      <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel="Saklanan hayvan" style={styles.hiderHit}>
        <Text style={styles.hiderEmoji}>{word.picture}</Text>
        {state !== 'idle' && <Text style={styles.mark}>{state === 'right' ? '✅' : '❌'}</Text>}
      </Pressable>
    </Animated.View>
  );
}

/** Saklambaç: "Where is the cow?" — çocuk kalıbı duyar, sahnede arayıp bulur. */
export function FindRound({ word, others, onDone }: { word: Word; others: Word[]; onDone: (mistakes: number) => void }) {
  const { recordAnswer } = useProgress();
  const cast = useMemo(() => shuffle([word, ...others].slice(0, SPOTS.length)), [word, others]);
  const spots = useMemo(() => shuffle(SPOTS), [word]);
  const [states, setStates] = useState<Record<string, 'idle' | 'right' | 'wrong'>>({});
  const mistakes = useRef(0);
  const done = useRef(false);

  useEffect(() => {
    mistakes.current = 0;
    done.current = false;
    setStates({});
    speak(say.where(word));
  }, [word]);

  const tap = async (w: Word) => {
    if (done.current) return;
    if (w.id === word.id) {
      done.current = true;
      setStates((s) => ({ ...s, [w.id]: 'right' }));
      recordAnswer(word.id, mistakes.current === 0, 'find');
      await speak(say.found(word));
      onDone(mistakes.current);
    } else {
      mistakes.current += 1;
      setStates((s) => ({ ...s, [w.id]: 'wrong' }));
      await speak([say.wrong(w, word)[0], say.wrong(w, word)[1], say.where(word)]);
      setStates((s) => ({ ...s, [w.id]: 'idle' }));
    }
  };

  return (
    <View style={styles.wrap}>
      <Chunky tone="lagoon" onPress={() => speak(say.where(word))} round={20} depth={5} faceStyle={styles.question} accessibilityLabel="Soruyu tekrar dinle">
        <Text style={{ fontSize: 26 }}>🔍</Text>
        <Text style={[type.title, { color: colors.white }]}>Where is the {word.en}?</Text>
      </Chunky>
      <View style={styles.scene}>
        <Svg width="100%" height="100%" viewBox="0 0 400 260" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
          <Path d="M0 0 H400 V260 H0 Z" fill="#DDF3E0" />
          <Path d="M0 170 C 80 150, 160 190, 240 168 C 300 152, 360 176, 400 166 V260 H0 Z" fill={colors.sand} />
          <Ellipse cx="300" cy="215" rx="70" ry="22" fill="#6FD1DB" />
          {/* çalılar ve ağaçlar: saklanma yerleri */}
          <Path d="M20 160 C 20 120, 90 120, 90 160 Z" fill={colors.leaf} />
          <Path d="M110 90 C 110 50, 180 50, 180 90 Z" fill={colors.leafDeep} />
          <Path d="M140 92 V130" stroke="#8A5A2B" strokeWidth={8} />
          <Path d="M290 100 C 290 62, 350 62, 350 100 Z" fill={colors.leaf} />
          <Path d="M190 200 C 196 176, 236 176, 242 200 Z" fill="#A9B4C2" />
          <Path d="M320 200 C 320 176, 372 176, 372 200 Z" fill={colors.leafDeep} />
        </Svg>
        {cast.map((w, i) => (
          <Hider key={w.id} word={w} spot={spots[i]} state={states[w.id] ?? 'idle'} onPress={() => tap(w)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 14, width: '100%' },
  question: { flexDirection: 'row', gap: 10, paddingHorizontal: 20 },
  scene: { width: '100%', maxWidth: 640, aspectRatio: 400 / 260, borderRadius: 28, overflow: 'hidden', borderWidth: 4, borderColor: colors.leafDeep },
  hider: { position: 'absolute', marginLeft: -10, marginTop: -10 },
  hiderHit: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  hiderEmoji: { fontSize: 48, lineHeight: 56 },
  mark: { position: 'absolute', top: -4, right: -4, fontSize: 22 },
});
