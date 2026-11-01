import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming, ZoomIn } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

import { ChunkIntro } from '@/components/chunk-intro';
import { Chunky } from '@/components/chunky';
import { en, say } from '@/content/lines';
import type { Word } from '@/content/regions';
import { speak } from '@/lib/voice';
import { useProgress } from '@/state/progress';
import { colors, type } from '@/theme';

import type { GameProps } from './helpers';

/**
 * Sesli kitap — dokun-dinle kitaplarının oyunlaşmış hâli.
 * Her bölge bir kitap, her sayfa bir sahne. Çocuk sahnedeki her şeye dokunur ve adını duyar:
 * "Cow. … Cow! Moo! Hello, cow!" Dokunduğu her hayvan albüme kart olarak girer.
 * Ders yok, sıra yok: çocuk kendi merakıyla keşfeder (anlaşılır girdi + seçim özgürlüğü).
 */

type Spot = { left: number; top: number };
type Page = { id: string; scene: 'farm' | 'wild'; words: string[]; spots: Spot[] };

const PAGES: Page[] = [
  {
    id: 'farm',
    scene: 'farm',
    words: ['cow', 'duck', 'dog', 'cat', 'rabbit'],
    spots: [
      { left: 14, top: 40 },
      { left: 70, top: 66 },
      { left: 40, top: 60 },
      { left: 60, top: 30 },
      { left: 84, top: 44 },
    ],
  },
  {
    id: 'wild',
    scene: 'wild',
    words: ['lion', 'elephant', 'frog', 'fish', 'bird'],
    spots: [
      { left: 20, top: 52 },
      { left: 52, top: 40 },
      { left: 70, top: 72 },
      { left: 40, top: 76 },
      { left: 78, top: 14 },
    ],
  },
];

function Scene({ kind }: { kind: Page['scene'] }) {
  if (kind === 'farm')
    return (
      <Svg width="100%" height="100%" viewBox="0 0 400 260" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
        <Rect x="0" y="0" width="400" height="260" fill="#CDEFFA" />
        <Circle cx="350" cy="40" r="22" fill={colors.sun} />
        <Path d="M0 120 C 90 100, 180 130, 260 112 C 320 100, 370 118, 400 110 V260 H0 Z" fill="#8ED16F" />
        <Path d="M0 160 C 100 145, 220 175, 400 150 V260 H0 Z" fill={colors.leaf} />
        {/* ahır */}
        <Rect x="210" y="70" width="70" height="56" fill={colors.berry} />
        <Path d="M202 74 L245 44 L288 74 Z" fill={colors.berryDeep} />
        <Rect x="234" y="96" width="22" height="30" fill={colors.paper} />
        {/* çit */}
        <Path d="M300 128 H400 M300 140 H400" stroke="#C99A5B" strokeWidth={4} />
        {[306, 330, 354, 378].map((x) => (
          <Rect key={x} x={x} y="118" width="6" height="30" fill="#B5844A" />
        ))}
        {/* gölet */}
        <Ellipse cx="290" cy="220" rx="80" ry="22" fill="#6FD1DB" />
      </Svg>
    );
  return (
    <Svg width="100%" height="100%" viewBox="0 0 400 260" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
      <Rect x="0" y="0" width="400" height="260" fill="#FFE9B8" />
      <Circle cx="60" cy="40" r="24" fill="#FFB547" />
      <Path d="M0 130 C 100 112, 200 140, 300 120 C 350 112, 380 124, 400 120 V260 H0 Z" fill="#E8C766" />
      {/* akasya */}
      <Path d="M300 130 V70" stroke="#8A5A2B" strokeWidth={8} />
      <Ellipse cx="300" cy="64" rx="58" ry="16" fill={colors.leafDeep} />
      {/* nehir */}
      <Path d="M0 210 C 80 190, 160 230, 260 205 C 320 192, 370 210, 400 200 V260 H0 Z" fill="#6FD1DB" />
      <Path d="M20 140 C 30 120, 60 120, 70 140 Z" fill="#B8A04A" />
    </Svg>
  );
}

function Critter({ word, spot, found, onPress }: { word: Word; spot: Spot; found: boolean; onPress: () => void }) {
  const s = useSharedValue(1);
  const y = useSharedValue(0);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }, { scale: s.get() }] }));
  return (
    <Animated.View style={[styles.critter, { left: `${spot.left}%`, top: `${spot.top}%` }, anim]}>
      <Pressable
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={found ? word.en : 'Dokun ve dinle'}
        onPress={() => {
          y.set(withSequence(withTiming(-16, { duration: 140 }), withSpring(0, { duration: 450, dampingRatio: 0.5 })));
          s.set(withSequence(withTiming(1.15, { duration: 140 }), withSpring(1, { duration: 450, dampingRatio: 0.6 })));
          onPress();
        }}
        style={styles.critterHit}
      >
        <Text style={styles.critterEmoji}>{word.picture}</Text>
      </Pressable>
      {found && (
        <Animated.View entering={ZoomIn.springify()} style={styles.tag} pointerEvents="none">
          <Text style={[type.label, { color: colors.ink }]}>{word.en}</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}

export function BookGame({ pool, onFinish }: GameProps & { pool: Word[] }) {
  const { progress, markSeen, collect } = useProgress();
  const [needHello] = useState(() => (progress.chunks?.hello ?? 0) < 1);
  const [helloDone, setHelloDone] = useState(!needHello);
  const [pageIndex, setPageIndex] = useState(0);
  const [found, setFound] = useState<string[]>([]);
  const [taps, setTaps] = useState<Record<string, number>>({});
  const page = PAGES[pageIndex];
  const pageWords = useMemo(() => page.words.map((id) => pool.find((w) => w.id === id)).filter(Boolean) as Word[], [page, pool]);
  const pageDone = pageWords.every((w) => found.includes(w.id));

  useEffect(() => {
    // İlk sayfanın yönergesini oyun ekranı zaten okudu; Hello tanıtımından sonra ya da yeni sayfada tekrar söyle
    if (!helloDone) return;
    if (pageIndex > 0) speak(say.bookNext);
    else if (needHello) speak(say.bookFirst);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [helloDone, pageIndex]);

  if (!helloDone) return <ChunkIntro ids={['hello']} onDone={() => setHelloDone(true)} />;

  const touch = (w: Word) => {
    const n = taps[w.id] ?? 0;
    setTaps((t) => ({ ...t, [w.id]: n + 1 }));
    markSeen(w.id);
    if (!found.includes(w.id)) {
      setFound((f) => [...f, w.id]);
      collect(w.id);
      // İlk dokunuş: tam öğretmen akışı. Sonrakiler: kısa ve her seferinde biraz farklı.
      speak(say.meet(w, pageIndex * 5 + found.length, true));
    } else {
      const variants = [[say.word(w)], w.sound ? [en(`[playfully] ${w.sound}`), say.word(w)] : [say.wordSlow(w)], [en(`Hello, ${w.en}!`)]];
      speak(variants[n % variants.length]);
    }
  };

  const turn = () => {
    if (pageIndex + 1 < PAGES.length) {
      setPageIndex(pageIndex + 1);
    } else {
      onFinish({ stars: 3, collected: pool.filter((w) => found.includes(w.id)).map((w) => w.picture) });
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.pageHead}>
        <Text style={[type.label, { color: colors.inkSoft }]}>
          Sayfa {pageIndex + 1} / {PAGES.length}
        </Text>
        <View style={styles.dots}>
          {pageWords.map((w) => (
            <Text key={w.id} style={{ fontSize: 20, opacity: found.includes(w.id) ? 1 : 0.25 }}>
              {w.picture}
            </Text>
          ))}
        </View>
      </View>

      <Animated.View key={page.id} entering={FadeIn.duration(300)} style={styles.book}>
        <Scene kind={page.scene} />
        {pageWords.map((w, i) => (
          <Critter key={w.id} word={w} spot={page.spots[i]} found={found.includes(w.id)} onPress={() => touch(w)} />
        ))}
      </Animated.View>

      {pageDone ? (
        <Animated.View entering={ZoomIn.springify()}>
          <Chunky tone="leaf" label={pageIndex + 1 < PAGES.length ? 'Sayfayı çevir' : 'Kitabı bitir'} onPress={turn} style={{ minWidth: 220 }} />
        </Animated.View>
      ) : (
        <Text style={[type.body, { color: colors.inkSoft, textAlign: 'center' }]}>Hepsine dokun, hepsini duy.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 14, width: '100%' },
  pageHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 680 },
  dots: { flexDirection: 'row', gap: 4 },
  book: {
    width: '100%',
    maxWidth: 680,
    aspectRatio: 400 / 260,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 6,
    borderColor: colors.paper,
    backgroundColor: colors.paper,
  },
  critter: { position: 'absolute', marginLeft: -36, marginTop: -36, alignItems: 'center' },
  critterHit: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
  critterEmoji: { fontSize: 56, lineHeight: 66 },
  tag: { backgroundColor: colors.paper, borderRadius: 12, paddingHorizontal: 10, marginTop: -8, borderWidth: 2, borderColor: colors.ink },
});
