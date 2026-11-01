import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

import { ChunkIntro } from '@/components/chunk-intro';
import { Chunky } from '@/components/chunky';
import { MicIcon, SpeakerIcon } from '@/components/icons';
import { PofiSays } from '@/components/pofi-says';
import type { ChunkId } from '@/content/chunks';
import { en, say } from '@/content/lines';
import type { Word } from '@/content/regions';
import { heardMatches, useListen } from '@/lib/listen';
import { speak } from '@/lib/voice';
import { useProgress } from '@/state/progress';
import { colors, type } from '@/theme';

import { shuffle, starsFor } from '../games/helpers';
import { Cover, FarmBackdrop, SCENE_H, SCENE_W, type CoverKind } from './farm-art';

/**
 * Pofi'nin Çiftliği — 1. gün: "Fırtınadan sonra".
 * Tek sahne, her şeye dokunulur ve her şey konuşur. Oyunlar ayrı ekran değil, sahnedeki olaylar:
 *  1) Saklananları bul — kapak kaldırma sürprizi; ilk karşılaşma (girdi)
 *  2) "Where is the duck?" — sahnede bulma (dinleyip tanıma)
 *  3) Akşam: hayvanları ahıra çağır — önce dokunarak, sonra sesle (üretim)
 *  Gece: "Good night!" ritüeli, çiftlik onarılır, yarının merakı bırakılır.
 */

type Spot = { wordId: string; cover: CoverKind; x: number; y: number };
// x, y: sahnede yüzde (saklanma yerinin merkezi)
const SPOTS: Spot[] = [
  { wordId: 'bird', cover: 'leaves', x: 17, y: 20 },
  { wordId: 'cow', cover: 'door', x: 59, y: 44 },
  { wordId: 'cat', cover: 'hay', x: 38, y: 52 },
  { wordId: 'rabbit', cover: 'bush', x: 10, y: 62 },
  { wordId: 'dog', cover: 'crate', x: 86, y: 64 },
  { wordId: 'frog', cover: 'reeds', x: 60, y: 84 },
  { wordId: 'fish', cover: 'ripple', x: 82, y: 88 },
  { wordId: 'duck', cover: 'bush', x: 34, y: 80 },
];
const BARN_DOOR = { x: 59, y: 46 };

// Sahnedeki eşyalar da konuşur (sesli kitap ruhu): ek kelime, test edilmez
const SCENERY = [
  { word: 'sun', x: 88, y: 12, w: 14, h: 16 },
  { word: 'tree', x: 17, y: 42, w: 8, h: 18 },
  { word: 'flower', x: 39, y: 81, w: 9, h: 8 },
  { word: 'barn', x: 59, y: 26, w: 22, h: 12 },
];

type Phase = 'story' | 'find' | 'where' | 'call' | 'night' | 'done';

function useShake() {
  const x = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));
  const shake = () => x.set(withSequence(withTiming(-6, { duration: 50 }), withTiming(6, { duration: 70 }), withTiming(-4, { duration: 60 }), withTiming(0, { duration: 60 })));
  return { style, shake };
}

function Actor({
  word,
  spot,
  scene,
  revealed,
  walking,
  highlight,
  mark,
  onPress,
}: {
  word: Word;
  spot: Spot;
  scene: { w: number; h: number };
  revealed: boolean;
  walking: boolean;
  highlight: boolean;
  mark: null | 'right' | 'wrong';
  onPress: () => void;
}) {
  const coverShake = useShake();
  // Küçük ekranda saklanma yerleri birbirinin üstüne binmesin
  const coverSize = Math.round(Math.min(84, Math.max(44, scene.w * 0.15)));
  const emoji = Math.round(coverSize * 0.66);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const op = useSharedValue(1);
  const pulse = useSharedValue(0);
  const hop = useSharedValue(0);
  // Ahıra giren hayvan sahneden kalkar (görünmez hâlde dokunuşları yutmasın)
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (!walking) return;
    const dx = ((BARN_DOOR.x - spot.x) / 100) * scene.w;
    const dy = ((BARN_DOOR.y - spot.y) / 100) * scene.h;
    const ease = Easing.bezier(0.77, 0, 0.175, 1);
    tx.set(withTiming(dx, { duration: 1100, easing: ease }));
    ty.set(withTiming(dy, { duration: 1100, easing: ease }));
    op.set(withDelay(900, withTiming(0, { duration: 300 })));
    const t = setTimeout(() => setGone(true), 1250);
    return () => clearTimeout(t);
  }, [walking, scene, spot, tx, ty, op]);

  useEffect(() => {
    pulse.set(highlight ? withRepeat(withSequence(withTiming(1, { duration: 500 }), withTiming(0, { duration: 500 })), -1) : withTiming(0, { duration: 150 }));
  }, [highlight, pulse]);

  const actorStyle = useAnimatedStyle(() => ({
    opacity: op.get(),
    transform: [{ translateX: tx.get() }, { translateY: ty.get() + hop.get() }, { scale: 1 + pulse.get() * 0.12 }],
  }));

  const press = () => {
    hop.set(withSequence(withTiming(-14, { duration: 120 }), withSpring(0, { duration: 420, dampingRatio: 0.5 })));
    if (!revealed) coverShake.shake();
    onPress();
  };

  return (
    <View style={[styles.spot, { left: `${spot.x}%`, top: `${spot.y}%` }]} pointerEvents="box-none">
      <Animated.View style={[styles.cover, coverShake.style]} pointerEvents={revealed ? 'none' : 'auto'}>
        <Pressable onPress={press} hitSlop={8} accessible={!revealed} accessibilityRole="button" accessibilityLabel={revealed ? undefined : 'Saklanma yeri'} disabled={revealed}>
          <Cover kind={spot.cover} size={coverSize} />
        </Pressable>
      </Animated.View>
      {revealed && !gone && (
        <Animated.View entering={ZoomIn.springify().damping(12)} style={[styles.actor, { top: -emoji * 1.15 }, actorStyle]} pointerEvents={walking ? 'none' : 'auto'}>
          <Pressable onPress={press} hitSlop={10} disabled={walking} accessible={!walking} accessibilityRole="button" accessibilityLabel={walking ? undefined : word.en} style={[styles.actorHit, { width: emoji * 1.4, height: emoji * 1.4 }]}>
            {highlight && <View style={[styles.ring, { width: emoji * 1.5, height: emoji * 1.5, borderRadius: emoji }]} />}
            <Text style={{ fontSize: emoji, lineHeight: emoji * 1.2 }}>{word.picture}</Text>
            {mark && <Text style={styles.mark}>{mark === 'right' ? '✅' : '❌'}</Text>}
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

function CallMic({ word, onDone }: { word: Word; onDone: (mistakes: number) => void }) {
  const listen = useListen();
  const [tries, setTries] = useState(0);
  const [heard, setHeard] = useState('');
  const done = useRef(false);

  const finish = (m: number) => {
    if (done.current) return;
    done.current = true;
    onDone(m);
  };

  const release = async () => {
    if (listen.state !== 'listening') return;
    const alts = await listen.stop();
    setHeard(alts[0] ?? '');
    if (heardMatches(alts, word.en, word.accept)) return finish(tries);
    const t = tries + 1;
    setTries(t);
    if (t >= 3) {
      await speak(say.speakGiveUp(word));
      finish(t);
    } else speak(say.speakRetry(word));
  };

  if (!listen.available) {
    return (
      <View style={styles.micRow}>
        <Chunky tone="paper" onPress={() => speak(say.wordSlow(word))} faceStyle={styles.hintBtn} accessibilityLabel="Pofi söylesin">
          <SpeakerIcon size={20} />
          <Text style={[type.label, { color: colors.ink }]}>Dinle</Text>
        </Chunky>
        <Chunky tone="plum" label="Söyledim!" onPress={() => finish(0)} />
      </View>
    );
  }
  return (
    <View style={{ alignItems: 'center', gap: 6 }}>
      <View style={styles.micRow}>
        <Chunky tone="paper" onPress={() => speak(say.wordSlow(word))} faceStyle={styles.hintBtn} accessibilityLabel="Pofi söylesin">
          <SpeakerIcon size={20} />
          <Text style={[type.label, { color: colors.ink }]}>İpucu</Text>
        </Chunky>
        <Chunky
          tone={listen.state === 'listening' ? 'berry' : 'plum'}
          onPressIn={() => listen.start()}
          onPressOut={release}
          round={50}
          depth={8}
          faceStyle={styles.mic}
          accessibilityLabel="Basılı tut ve çağır"
        >
          <MicIcon size={40} />
        </Chunky>
      </View>
      <Text style={[type.small, { color: colors.inkSoft }]}>
        {listen.state === 'listening' ? 'Dinliyorum…' : tries > 0 ? `Duyduğum: “${heard || '…'}”. Bir daha dene!` : 'Basılı tut ve adını söyle'}
      </Text>
    </View>
  );
}

export function FarmDay({ pool, onFinish }: { pool: Word[]; onFinish: (r: { stars: number; collected: string[] }) => void }) {
  const { progress, recordAnswer, collect, markSeen } = useProgress();
  const words = useMemo(() => Object.fromEntries(pool.map((w) => [w.id, w])), [pool]);
  const spots = useMemo(() => SPOTS.filter((s) => words[s.wordId]), [words]);
  const roofFixed = (progress.steps['farm-d1'] ?? 0) > 0;

  const { height: winH, width: winW } = useWindowDimensions();
  // Dik telefonda sahne daha uzun olsun; yatay tablette ekrana sığsın
  const aspect = winW < 600 && winH > winW ? 0.95 : SCENE_W / SCENE_H;
  // Yatay tablette sahne ekrana sığsın
  const sceneMax = Math.min(820, Math.max(320, (winH - 300) * (SCENE_W / SCENE_H)));
  const [phase, setPhase] = useState<Phase>('story');
  const [intro, setIntro] = useState<ChunkId[]>([]);
  const [scene, setScene] = useState({ w: 360, h: 270 });
  const [revealed, setRevealed] = useState<string[]>([]);
  const [walked, setWalked] = useState<string[]>([]);
  const [marks, setMarks] = useState<Record<string, 'right' | 'wrong'>>({});
  const [target, setTarget] = useState<Word | null>(null);
  const [round, setRound] = useState(0);
  const mistakes = useRef(0);
  const roundMistakes = useRef(0);
  const busy = useRef(false);

  const whereOrder = useMemo(() => shuffle(spots.map((s) => words[s.wordId])).slice(0, 4), [spots, words]);
  const callOrder = useMemo(() => shuffle(spots.map((s) => words[s.wordId])).slice(0, 5), [spots, words]);
  const VOICE_FROM = 3; // son iki çağrı sesle

  const needChunk = (id: ChunkId) => (progress.chunks?.[id] ?? 0) < 1;

  // Hikâye
  useEffect(() => {
    speak(say.farm.story);
  }, []);

  const begin = () => {
    if (needChunk('hello')) setIntro(['hello']);
    setPhase('find');
  };

  // ——— 1) Saklananları bul ———
  const reveal = (w: Word) => {
    if (revealed.includes(w.id)) {
      const n = Math.floor(Math.random() * 3);
      speak(n === 0 ? [say.word(w)] : n === 1 && w.sound ? [en(`[playfully] ${w.sound}`)] : [en(`Hello, ${w.en}!`)]);
      return;
    }
    const next = [...revealed, w.id];
    setRevealed(next);
    collect(w.id);
    markSeen(w.id);
    const lines = say.meet(w, next.length - 1, true);
    if (next.length === spots.length) {
      speak(lines).then(() => {
        if (needChunk('where')) setIntro(['where']);
        setPhase('where');
        setRound(0);
      });
    } else speak(spots.length - next.length === 1 ? [...lines.slice(1), say.farm.found(next.length, spots.length)] : lines.slice(1));
  };

  // ——— 2) Where is the …? ———
  useEffect(() => {
    if (phase !== 'where' || intro.length) return;
    const w = whereOrder[round];
    setTarget(w);
    setMarks({});
    roundMistakes.current = 0;
    speak(round === 0 ? [say.farm.allFound, say.where(w)] : say.where(w));
  }, [phase, round, intro.length, whereOrder]);

  // ——— 3) Akşam: ahıra çağır ———
  useEffect(() => {
    if (phase !== 'call') return;
    const w = callOrder[round];
    setTarget(w);
    setMarks({});
    roundMistakes.current = 0;
    if (round < VOICE_FROM) speak(round === 0 ? [say.farm.callStart, say.ask(w)] : say.ask(w));
    else speak(round === VOICE_FROM ? say.farm.callVoice : say.farm.whoIsIt);
  }, [phase, round, callOrder]);

  const walkIn = async (w: Word) => {
    setWalked((list) => [...list, w.id]);
    await speak(say.farm.comeIn(w));
  };

  const nextCallRound = async () => {
    if (round + 1 < callOrder.length) setRound(round + 1);
    else {
      // Kalanlar arkadaşlarının peşinden ahıra girer
      const rest = spots.map((s) => s.wordId).filter((id) => !callOrder.some((c) => c.id === id));
      setWalked((list) => [...list, ...rest]);
      await new Promise((r) => setTimeout(r, 1200));
      if (needChunk('night')) setIntro(['night']);
      setPhase('night');
    }
  };

  const tapActor = async (w: Word) => {
    if (phase === 'find') return reveal(w);
    if (busy.current || !target) {
      speak(say.word(w));
      return;
    }
    if (phase === 'where' || (phase === 'call' && round < VOICE_FROM)) {
      if (w.id === target.id) {
        busy.current = true;
        setMarks({ [w.id]: 'right' });
        recordAnswer(w.id, roundMistakes.current === 0, phase === 'where' ? 'find' : 'listen');
        if (phase === 'where') {
          await speak(say.found(w));
          busy.current = false;
          if (round + 1 < whereOrder.length) setRound(round + 1);
          else {
            setPhase('call');
            setRound(0);
          }
        } else {
          await speak(say.right(w));
          await walkIn(w);
          busy.current = false;
          nextCallRound();
        }
      } else {
        mistakes.current += 1;
        roundMistakes.current += 1;
        setMarks({ [w.id]: 'wrong' });
        await speak([en('No.', { pauseAfter: 120 }), say.word(w), phase === 'where' ? say.where(target) : say.ask(target)]);
        setMarks({});
      }
    } else {
      // sesli çağrı turunda dokunmak sadece adını söyletir
      speak(say.word(w));
    }
  };

  const voiceDone = async (m: number) => {
    if (!target) return;
    mistakes.current += m;
    recordAnswer(target.id, m === 0, 'speak');
    busy.current = true;
    await speak([en('[excited] Yes!', { pauseAfter: 100 })]);
    await walkIn(target);
    busy.current = false;
    nextCallRound();
  };

  // ——— Gece ———
  useEffect(() => {
    if (phase !== 'night' || intro.length) return;
    let alive = true;
    (async () => {
      await speak(say.farm.night);
      await speak(say.farm.repaired);
      if (!alive) return;
      setPhase('done');
      const rounds = whereOrder.length + callOrder.length;
      onFinish({ stars: starsFor(mistakes.current, rounds), collected: [] });
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, intro.length]);

  const night = phase === 'night' || phase === 'done';
  // Pofi'nin balonunda o anki görev yazar; hoparlöre basınca tekrar söyler
  const caption =
    phase === 'story' || phase === 'find'
      ? say.farm.story
      : phase === 'where'
        ? say.farm.allFound
        : phase === 'call'
          ? round >= VOICE_FROM
            ? say.farm.callVoice
            : say.farm.callStart
          : say.farm.night[0];
  const voiceRound = phase === 'call' && round >= VOICE_FROM && target && !walked.includes(target.id);

  return (
    <View style={styles.wrap}>
      <View style={{ width: '100%', maxWidth: 700 }}>
        <PofiSays text={caption.text} line={caption} autoSpeak={false} size={64} mood={night ? 'sleep' : phase === 'call' && round >= VOICE_FROM ? 'think' : 'happy'} />
      </View>
      {/* Görev çubuğu: şu an ne yapılıyor */}
      <View style={styles.hud}>
        {phase === 'story' && <Chunky tone="sun" label="Hadi bulalım!" onPress={begin} />}
        {phase === 'find' && (
          <View style={styles.counter} accessibilityLabel={`${revealed.length} / ${spots.length} bulundu`}>
            {spots.map((s) => (
              <Text key={s.wordId} style={{ fontSize: 22, opacity: revealed.includes(s.wordId) ? 1 : 0.2 }}>
                {revealed.includes(s.wordId) ? words[s.wordId].picture : '❔'}
              </Text>
            ))}
          </View>
        )}
        {phase === 'where' && target && (
          <Chunky tone="lagoon" onPress={() => speak(say.where(target))} round={18} depth={5} faceStyle={styles.question} accessibilityLabel="Soruyu tekrar dinle">
            <Text style={{ fontSize: 22 }}>🔍</Text>
            <Text style={[type.title, { color: colors.white, fontSize: 24 }]}>Where is the {target.en}?</Text>
          </Chunky>
        )}
        {phase === 'call' && target && round < VOICE_FROM && (
          <Chunky tone="lagoon" onPress={() => speak(say.ask(target))} round={18} depth={5} faceStyle={styles.question} accessibilityLabel="Tekrar dinle">
            <SpeakerIcon size={24} color={colors.white} />
            <Text style={[type.title, { color: colors.white, fontSize: 24 }]}>Ahıra kim girecek?</Text>
          </Chunky>
        )}
        {voiceRound && target && <CallMic key={target.id} word={target} onDone={voiceDone} />}
      </View>

      <View style={[styles.scene, { maxWidth: sceneMax, aspectRatio: aspect }]} onLayout={(e) => setScene({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        <FarmBackdrop roofFixed={roofFixed || night} />
        {SCENERY.map((s) => (
          <Pressable
            key={s.word}
            onPress={() => speak(say.farm.scenery(s.word))}
            style={[styles.scenery, { left: `${s.x - s.w / 2}%`, top: `${s.y - s.h / 2}%`, width: `${s.w}%`, height: `${s.h}%` }]}
            accessibilityRole="button"
            accessibilityLabel={s.word}
          />
        ))}
        {spots.map((s) => {
          const w = words[s.wordId];
          return (
            <Actor
              key={s.wordId}
              word={w}
              spot={s}
              scene={scene}
              revealed={revealed.includes(w.id)}
              walking={walked.includes(w.id)}
              highlight={!!voiceRound && target?.id === w.id}
              mark={marks[w.id] ?? null}
              onPress={() => tapActor(w)}
            />
          );
        })}
        {night && (
          <Animated.View entering={FadeIn.duration(1200)} style={styles.night} pointerEvents="none">
            <Text style={styles.moon}>🌙</Text>
          </Animated.View>
        )}
      </View>

      {/* Kalıp tanıtımı (Hello / Where is…? / Good night!) sahnenin üstünde açılır */}
      <Modal visible={intro.length > 0} transparent animationType="fade" onRequestClose={() => setIntro([])}>
        <View style={styles.introLayer}>
          {intro.length > 0 && <ChunkIntro ids={intro} onDone={() => setIntro([])} />}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', alignItems: 'center', gap: 12 },
  hud: { minHeight: 70, alignItems: 'center', justifyContent: 'center' },
  counter: { flexDirection: 'row', gap: 6, backgroundColor: colors.paper, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 6 },
  question: { flexDirection: 'row', gap: 10, paddingHorizontal: 18 },
  scene: {
    width: '100%',
    maxWidth: 820,
    aspectRatio: SCENE_W / SCENE_H,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 5,
    borderColor: colors.paper,
  },
  scenery: { position: 'absolute' },
  spot: { position: 'absolute', width: 0, height: 0, alignItems: 'center', justifyContent: 'center' },
  cover: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  actor: { position: 'absolute', alignItems: 'center', zIndex: 2 },
  actorHit: { alignItems: 'center', justifyContent: 'center' },
  mark: { position: 'absolute', top: -4, right: -6, fontSize: 20 },
  ring: { position: 'absolute', borderWidth: 5, borderColor: colors.sun, backgroundColor: 'rgba(255,201,60,0.25)' },
  micRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hintBtn: { flexDirection: 'row', gap: 6 },
  mic: { width: 92, height: 92, paddingHorizontal: 0 },
  night: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(14,30,72,0.62)', alignItems: 'flex-end', padding: 18 },
  moon: { fontSize: 44 },
  introLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11,79,108,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
});
