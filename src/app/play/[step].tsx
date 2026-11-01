import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { Celebration } from '@/components/overlays';
import { PofiSays } from '@/components/pofi-says';
import { TopBar } from '@/components/top-bar';
import { getRegion } from '@/content/regions';
import { stopVoice } from '@/lib/voice';
import { MatchGame } from '@/screens/games/match-game';
import { MeetGame } from '@/screens/games/meet-game';
import { RoundsGame } from '@/screens/games/rounds-game';
import { useProgress } from '@/state/progress';
import { colors } from '@/theme';

export default function PlayScreen() {
  const { step: stepId, region: regionId } = useLocalSearchParams<{ step: string; region: string }>();
  const region = getRegion(regionId ?? '');
  const step = region?.steps.find((s) => s.id === stepId);
  const { pickWords, completeStep, progress } = useProgress();
  const [result, setResult] = useState<{ stars: number; collected?: string[] } | null>(null);

  // Kelimeler oyun başında bir kez seçilir: zayıf ve yeni kelimeler öne çıkar.
  const [words] = useState(() => {
    if (!region || !step) return [];
    if (step.kind === 'meet') {
      const fresh = region.words.filter((w) => !progress.words[w.id]?.collected);
      const base = fresh.length >= 5 ? fresh : region.words;
      return pickWords(base, 5);
    }
    return pickWords(region.words, step.kind === 'quest' ? 6 : 6);
  });

  useEffect(() => () => {
    stopVoice();
  }, []);

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
        <PofiSays text={step.hint} size={84} mood={step.kind === 'speak' ? 'think' : 'happy'} />
        {step.kind === 'meet' && <MeetGame words={words} onFinish={finish} />}
        {step.kind === 'match' && <MatchGame words={words} onFinish={finish} />}
        {(step.kind === 'listen' || step.kind === 'speak' || step.kind === 'quest') && (
          <RoundsGame kind={step.kind} words={words} pool={region.words} onFinish={finish} />
        )}
      </ScrollView>
      {result && <Celebration stars={result.stars} newCards={result.collected} onDone={exit} />}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48, gap: 20, width: '100%', maxWidth: 760, alignSelf: 'center' },
});
