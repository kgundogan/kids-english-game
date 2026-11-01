import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

/** Kaç tur kaldığını gösteren noktalar: süre baskısı yok, sadece "nerdeyim" bilgisi. */
export function RoundDots({ total, current }: { total: number; current: number }) {
  return (
    <View style={styles.row} accessibilityLabel={`${total} turdan ${current + 1}.`}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i < current && { backgroundColor: colors.leaf, borderColor: colors.leafDeep },
            i === current && { backgroundColor: colors.sun, borderColor: colors.sunDeep, transform: [{ scale: 1.25 }] },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, justifyContent: 'center', paddingVertical: 8 },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.paper, borderWidth: 2, borderColor: '#D9CFB8' },
});
