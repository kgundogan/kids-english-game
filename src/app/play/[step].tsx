import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Chunky } from '@/components/chunky';
import { Celebration } from '@/components/overlays';
import { PofiSays } from '@/components/pofi-says';
import { TopBar } from '@/components/top-bar';
import { say } from '@/content/lines';
import { getRegion } from '@/content/regions';
import { speak, stopVoice } from '@/lib/voice';
import { MatchGame } from '@/screens/games/match-game';
import { BookGame } from '@/screens/games/book-game';
import { RoundsGame } from '@/screens/games/rounds-game';
import { useProgress } from '@/state/progress';
import { colors } from '@/theme';

export default function PlayScreen() {
  const { step: stepId, region: regionId } = useLocalSearchParams<{ step: string; region: string }>();
  const region = getRegion(regionId ?? '');
  const step = region?.steps.find((s) => s.id === stepId);
  const { pickWords, completeStep, progress } = useProgress();
  const [result, setResult] = useState<{ stars: number; collected?: string[] } | null>(null);
  // Önce Pofi ne yapılacağını anlatır, sonra oyun başlar (sesler üst üste binmesin)
  const [started, setStarted] = useState(false);

  // Kelimeler oyun başında bir kez seçilir: zayıf ve yeni kelimeler öne çıkar.
  const [words] = useState(() => {
    if (!region || !step) return [];
    if (step.kind === 'book') return region.words;
    // Tanıştığı kelimelerden seç; yeterli değilse hepsi
    const met = region.words.filter((w) => progress.words[w.id]?.collected);
    return pickWords(met.length >= 6 ? met : region.words, 6);
  });

  useEffect(() => {
    if (!step) return;
    let alive = true;
    speak(say.hint(step.hint)).then(() => alive && setStarted(true));
    return () => {
      alive = false;
      stopVoice();
    };
  }, [step]);

  if (!region || !step) return null;

  const finish = (r: { stars: number; collected?: string[] }) => {
    completeStep(step.id, r.stars);
    setResult(r);
  };

  const exit = () => {
    stopVoice();
    router.back();
  };

  return (
    <LinearGradient colors={[colors.sky, '#E9F8FB']} style={{ flex: 1 }}>
      <TopBar title={step.title} onBack={exit} />
      <ScrollView contentContainerStyle={styles.content}>
        <PofiSays text={step.hint} size={84} mood={step.kind === 'speak' ? 'think' : 'happy'} autoSpeak={false} />
        {!started ? (
          <View style={{ alignItems: 'center' }}>
            <Chunky tone="sun" label="Hazırım!" onPress={() => setStarted(true)} style={{ minWidth: 200 }} />
          </View>
        ) : (
          <>
            {step.kind === 'book' && <BookGame words={words} pool={region.words} onFinish={finish} />}
            {step.kind === 'match' && <MatchGame words={words} onFinish={finish} />}
            {step.kind !== 'book' && step.kind !== 'match' && <RoundsGame kind={step.kind} words={words} pool={region.words} onFinish={finish} />}
          </>
        )}
      </ScrollView>
      {result && <Celebration stars={result.stars} newCards={result.collected} onDone={exit} />}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48, gap: 20, width: '100%', maxWidth: 760, alignSelf: 'center' },
});
