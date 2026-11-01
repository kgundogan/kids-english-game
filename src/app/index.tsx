import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Chunky } from '@/components/chunky';
import { BookIcon, LockIcon } from '@/components/icons';
import { IslandMap } from '@/components/island-map';
import { ParentGate } from '@/components/overlays';
import { PofiSays } from '@/components/pofi-says';
import { TopBar } from '@/components/top-bar';
import { regions } from '@/content/regions';
import { sayTurkish } from '@/lib/voice';
import { useProgress } from '@/state/progress';
import { colors, type } from '@/theme';

export default function Home() {
  const { progress } = useProgress();
  const [gate, setGate] = useState(false);
  const firstTime = Object.keys(progress.steps).length === 0;

  const starsByRegion = Object.fromEntries(
    regions.map((r) => [r.id, r.steps.reduce((sum, s) => sum + (progress.steps[s.id] ?? 0), 0)]),
  );

  return (
    <LinearGradient colors={[colors.sky, colors.skyDeep, colors.lagoon]} locations={[0, 0.35, 1]} style={{ flex: 1 }}>
      <TopBar back={false} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[type.hero, styles.brand]} accessibilityRole="header">
          Pofi Adası
        </Text>
        <View style={styles.say}>
          <PofiSays
            text={firstTime ? 'Merhaba! Ben Pofi. Hayvan Koyu’na gidelim mi?' : 'Tekrar hoş geldin! Bugün nereye gidiyoruz?'}
            mood="happy"
          />
        </View>

        <IslandMap
          regions={regions}
          starsByRegion={starsByRegion}
          onSelect={(r) => {
            if (r.locked) {
              sayTurkish(`${r.name} henüz hazırlanıyor. Çok yakında!`);
              return;
            }
            router.push({ pathname: '/region/[id]', params: { id: r.id } });
          }}
        />

        <View style={styles.actions}>
          <Chunky tone="sun" onPress={() => router.push('/album')} accessibilityLabel="Kelime albümü" faceStyle={styles.action}>
            <BookIcon />
            <Text style={[type.label, { color: colors.ink, fontSize: 20 }]}>Albümüm</Text>
          </Chunky>
          <Chunky tone="paper" onPress={() => setGate(true)} accessibilityLabel="Veli alanı" faceStyle={styles.action}>
            <LockIcon />
            <Text style={[type.label, { color: colors.inkSoft }]}>Veli</Text>
          </Chunky>
        </View>
      </ScrollView>
      <ParentGate
        visible={gate}
        onCancel={() => setGate(false)}
        onPass={() => {
          setGate(false);
          router.push('/parent');
        }}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 40, gap: 8, width: '100%', maxWidth: 820, alignSelf: 'center' },
  brand: { color: colors.sea, textAlign: 'center', marginTop: -4 },
  say: { maxWidth: 560, width: '100%', alignSelf: 'center' },
  actions: { flexDirection: 'row', gap: 12, justifyContent: 'center', marginTop: 4 },
  action: { flexDirection: 'row', gap: 8, paddingHorizontal: 22 },
});
