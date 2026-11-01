import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';

import { Chunky } from '@/components/chunky';
import { SpeakerIcon } from '@/components/icons';
import { say } from '@/content/lines';
import { allWords } from '@/content/regions';
import { speak } from '@/lib/voice';
import { useProgress } from '@/state/progress';
import { colors, type } from '@/theme';

import { shuffle, type GameProps } from './helpers';

type Card = { key: string; wordId: string; face: 'picture' | 'sound'; picture: string; en: string };

const EASE = Easing.bezier(0.77, 0, 0.175, 1);

function FlipCard({ card, open, matched, size, onPress }: { card: Card; open: boolean; matched: boolean; size: number; onPress: () => void }) {
  const flip = useSharedValue(open ? 1 : 0);
  useEffect(() => {
    flip.set(withTiming(open ? 1 : 0, { duration: 220, easing: EASE }));
  }, [open, flip]);
  // Kart yatayda daralıp öbür yüzüyle açılır (transform: ucuz, UI iş parçacığında)
  const style = useAnimatedStyle(() => ({ transform: [{ scaleX: Math.abs(1 - flip.get() * 2) * 0.9 + 0.1 }] }));
  const showFront = open;

  return (
    <Animated.View style={style}>
      <Chunky
        tone={matched ? 'leaf' : showFront ? (card.face === 'sound' ? 'lagoon' : 'paper') : 'plum'}
        onPress={onPress}
        disabled={matched}
        round={20}
        depth={6}
        faceStyle={{ width: size, height: size * 1.15, paddingHorizontal: 0 }}
        accessibilityLabel={showFront ? (card.face === 'sound' ? `Ses kartı: ${card.en}` : 'Resim kartı') : 'Kapalı kart'}
      >
        {!showFront && <Text style={{ fontSize: size * 0.34, color: colors.white, fontFamily: 'Baloo2_800ExtraBold' }}>?</Text>}
        {showFront && card.face === 'picture' && <Text style={{ fontSize: size * 0.55, lineHeight: size * 0.7 }}>{card.picture}</Text>}
        {showFront && card.face === 'sound' && (
          <View style={{ alignItems: 'center' }}>
            <SpeakerIcon size={size * 0.32} color={colors.white} />
            <Text style={[type.label, { color: colors.white, fontSize: 18 }]}>{card.en}</Text>
          </View>
        )}
      </Chunky>
    </Animated.View>
  );
}

/** Eşleştir: resim kartını ses kartıyla eşleştir (ses–görsel bağı, okumaya yumuşak giriş). */
export function MatchGame({ words, onFinish }: GameProps) {
  const { recordAnswer } = useProgress();
  const { width } = useWindowDimensions();
  const cards = useMemo<Card[]>(
    () =>
      shuffle(
        words.slice(0, 4).flatMap((w) => [
          { key: `${w.id}-p`, wordId: w.id, face: 'picture' as const, picture: w.picture, en: w.en },
          { key: `${w.id}-s`, wordId: w.id, face: 'sound' as const, picture: w.picture, en: w.en },
        ]),
      ),
    [words],
  );
  const [open, setOpen] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const misses = useRef(0);
  const busy = useRef(false);
  const size = Math.min(130, Math.max(72, (Math.min(width, 640) - 80) / 4 - 10));

  const press = (c: Card) => {
    if (busy.current || open.includes(c.key) || matched.includes(c.wordId)) return;
    const w = allWords().find((x) => x.id === c.wordId);
    if (c.face === 'sound' && w) speak(say.word(w));
    const nextOpen = [...open, c.key];
    setOpen(nextOpen);
    if (nextOpen.length < 2) return;

    busy.current = true;
    const [a, b] = nextOpen.map((k) => cards.find((x) => x.key === k)!);
    if (a.wordId === b.wordId && a.face !== b.face) {
      const nowMatched = [...matched, a.wordId];
      setTimeout(async () => {
        setMatched(nowMatched);
        setOpen([]);
        busy.current = false;
        recordAnswer(a.wordId, true, 'match');
        const aw = allWords().find((x) => x.id === a.wordId);
        if (aw) await speak(say.right(aw));
        if (nowMatched.length === cards.length / 2) {
          onFinish({ stars: misses.current <= 3 ? 3 : misses.current <= 7 ? 2 : 1 });
        }
      }, 450);
    } else {
      misses.current += 1;
      setTimeout(() => {
        setOpen([]);
        busy.current = false;
      }, 1000);
    }
  };

  return (
    <View style={styles.grid}>
      {cards.map((c) => (
        <FlipCard key={c.key} card={c} size={size} open={open.includes(c.key) || matched.includes(c.wordId)} matched={matched.includes(c.wordId)} onPress={() => press(c)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, maxWidth: 640, alignSelf: 'center' },
});
