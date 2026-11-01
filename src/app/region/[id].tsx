import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Chunky, Paper } from '@/components/chunky';
import { LockIcon, SpeakerIcon, StarIcon } from '@/components/icons';
import { PofiSays } from '@/components/pofi-says';
import { TopBar } from '@/components/top-bar';
import { getRegion, type StepKind } from '@/content/regions';
import { say } from '@/content/lines';
import { speak } from '@/lib/voice';
import { useProgress } from '@/state/progress';
import { colors, type } from '@/theme';

const kindIcon: Record<StepKind, string> = { book: '📖', listen: '👂', yesno: '✅', match: '🃏', find: '🔍', speak: '🎤', quest: '🗺️' };

export default function RegionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const region = getRegion(id ?? '');
  const { progress } = useProgress();

  // Ekran dışı görev: TPR — çocuk kalkar, hareket eder, kelimeyi söyler.
  const offScreen = useMemo(() => {
    const w = region?.words[Math.floor(Math.random() * (region?.words.length ?? 1))];
    return w;
  }, [region]);

  if (!region) return null;

  const nextIndex = region.steps.findIndex((s) => !progress.steps[s.id]);

  return (
    <LinearGradient colors={[colors.sky, colors.sand]} locations={[0, 0.5]} style={{ flex: 1 }}>
      <TopBar title={region.name} />
      <ScrollView contentContainerStyle={styles.content}>
        <PofiSays
          text={(nextIndex === -1 ? say.regionDone : say.regionNext(region.steps[nextIndex].title)).text}
          mood={nextIndex === -1 ? 'cheer' : 'happy'}
          size={96}
        />

        <View style={styles.path}>
          {region.steps.map((step, i) => {
            const locked = i > 0 && !progress.steps[region.steps[i - 1].id];
            const earned = progress.steps[step.id] ?? 0;
            const isNext = i === nextIndex;
            return (
              <View key={step.id} style={[styles.stone, { alignSelf: i % 2 === 0 ? 'flex-start' : 'flex-end' }]}>
                <Chunky
                  tone={locked ? 'paper' : isNext ? 'sun' : earned ? region.tone : 'lagoon'}
                  disabled={locked}
                  onPress={() => router.push({ pathname: '/play/[step]', params: { step: step.id, region: region.id } })}
                  accessibilityLabel={`${step.title}${locked ? ', kilitli' : ''}`}
                  round={44}
                  depth={8}
                  faceStyle={styles.stoneFace}
                >
                  <Text style={styles.kind}>{kindIcon[step.kind]}</Text>
                  {locked && (
                    <View style={styles.lock}>
                      <LockIcon size={16} />
                    </View>
                  )}
                </Chunky>
                <View style={styles.label}>
                  <Text style={[type.label, { color: colors.ink, fontSize: 18 }]}>{step.title}</Text>
                  <View style={{ flexDirection: 'row' }}>
                    {[1, 2, 3].map((n) => (
                      <StarIcon key={n} size={16} color={n <= earned ? colors.sun : '#E7E1D2'} />
                    ))}
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {offScreen && (
          <Paper tone="paper" style={styles.offscreen}>
            <Text style={styles.offEmoji}>{offScreen.picture}</Text>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[type.label, { color: colors.leafDeep }]}>Ekran dışı görev</Text>
              <Text style={[type.body, { color: colors.ink }]}>
                Tableti bırak! {offScreen.move} ve “{offScreen.en}” de.
              </Text>
            </View>
            <Chunky
              tone="leaf"
              round={18}
              depth={4}
              faceStyle={{ minWidth: 48, paddingHorizontal: 10 }}
              accessibilityLabel="Görevi dinle"
              onPress={() => speak(say.offScreen(offScreen))}
            >
              <SpeakerIcon size={22} color={colors.white} />
            </Chunky>
          </Paper>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48, gap: 16, width: '100%', maxWidth: 640, alignSelf: 'center' },
  path: { paddingHorizontal: 24, gap: 12, paddingVertical: 8 },
  stone: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '62%', minWidth: 230 },
  stoneFace: { width: 88, height: 88, paddingHorizontal: 0 },
  kind: { fontSize: 40, lineHeight: 48 },
  lock: { position: 'absolute', right: 8, bottom: 8, backgroundColor: colors.paper, borderRadius: 10, padding: 2 },
  label: { backgroundColor: 'rgba(255,253,247,0.92)', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4 },
  offscreen: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 3, borderColor: colors.leaf, borderStyle: 'dashed' },
  offEmoji: { fontSize: 40, lineHeight: 48 },
});
