import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { Celebration } from '@/components/overlays';
import { TopBar } from '@/components/top-bar';
import { getRegion } from '@/content/regions';
import { stopVoice } from '@/lib/voice';
import { FarmDay } from '@/screens/world/farm-day';
import { useProgress } from '@/state/progress';
import { colors } from '@/theme';

/** Canlı dünya: bölgenin tek sahnesi ve o günün olayları (prototip: Pofi'nin Çiftliği, 1. gün). */
export default function WorldScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const region = getRegion(id ?? '');
  const { completeStep } = useProgress();
  const [result, setResult] = useState<{ stars: number } | null>(null);

  useEffect(
    () => () => {
      stopVoice();
    },
    [],
  );

  if (!region) return null;

  const exit = () => {
    stopVoice();
    router.back();
  };

  return (
    <LinearGradient colors={[colors.sky, '#E9F8FB']} style={{ flex: 1 }}>
      <TopBar title="Pofi’nin Çiftliği" onBack={exit} />
      <ScrollView contentContainerStyle={styles.content}>
        <FarmDay
          pool={region.words}
          onFinish={(r) => {
            completeStep('farm-d1', r.stars);
            setResult(r);
          }}
        />
      </ScrollView>
      {result && <Celebration stars={result.stars} note="Ahırın çatısı onarıldı! Yarın: yağmurlu gün." onDone={exit} />}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  content: { padding: 12, paddingBottom: 40, width: '100%', maxWidth: 860, alignSelf: 'center' },
});
