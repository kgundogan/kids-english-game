import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chunky } from '@/components/chunky';
import { BackIcon, ClockLeaf, StarIcon } from '@/components/icons';
import { useProgress } from '@/state/progress';
import { colors, type } from '@/theme';

export function TopBar({ title, back = true, onBack }: { title?: string; back?: boolean; onBack?: () => void }) {
  const insets = useSafeAreaInsets();
  const { progress, secondsLeft } = useProgress();
  const min = Math.ceil(secondsLeft / 60);

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
      <View style={styles.side}>
        {back && (
          <Chunky
            accessibilityLabel="Geri"
            onPress={onBack ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
            round={18}
            faceStyle={{ paddingHorizontal: 12 }}
          >
            <BackIcon />
          </Chunky>
        )}
      </View>
      {title ? (
        <Text style={[type.title, styles.title]} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      <View style={[styles.side, styles.right]}>
        <View style={styles.pill} accessibilityLabel={`${min} dakika kaldı`}>
          <ClockLeaf />
          <Text style={[type.label, { color: colors.leafDeep }]}>{min} dk</Text>
        </View>
        <View style={styles.pill} accessibilityLabel={`${progress.stars} yıldız`}>
          <StarIcon size={22} />
          <Text style={[type.label, { color: colors.ink }]}>{progress.stars}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  side: { minWidth: 64, flexDirection: 'row' },
  right: { justifyContent: 'flex-end', gap: 6, minWidth: 140 },
  title: { flex: 1, textAlign: 'center', color: colors.ink },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,253,247,0.92)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});
