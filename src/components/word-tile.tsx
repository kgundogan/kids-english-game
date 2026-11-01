import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { Chunky } from '@/components/chunky';
import { colors, type Tone } from '@/theme';

export type TileState = 'idle' | 'right' | 'wrong' | 'faded';

/** Resimli kelime kartı. Yanlışta hafifçe sallanır (ceza yok), doğruda zıplar. */
export function WordTile({
  picture,
  label,
  size = 120,
  state = 'idle',
  onPress,
  tone,
  accessibilityLabel,
}: {
  picture: string;
  label?: string;
  size?: number;
  state?: TileState;
  onPress?: () => void;
  tone?: Tone;
  accessibilityLabel?: string;
}) {
  const x = useSharedValue(0);
  const s = useSharedValue(1);

  useEffect(() => {
    if (state === 'wrong') {
      x.set(withSequence(withTiming(-8, { duration: 50 }), withTiming(8, { duration: 70 }), withTiming(-5, { duration: 60 }), withTiming(0, { duration: 60 })));
    }
    if (state === 'right') {
      s.set(withSequence(withTiming(1.08, { duration: 120 }), withSpring(1, { duration: 400, dampingRatio: 0.6 })));
    }
  }, [state, x, s]);

  const anim = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }, { scale: s.get() }] }));
  const resolvedTone: Tone = tone ?? (state === 'right' ? 'leaf' : 'paper');

  return (
    <Animated.View style={[anim, { opacity: state === 'faded' ? 0.35 : 1 }]}>
      <Chunky
        tone={resolvedTone}
        onPress={onPress}
        disabled={!onPress || state === 'faded'}
        accessibilityLabel={accessibilityLabel ?? label}
        round={size * 0.22}
        depth={Math.max(5, size * 0.06)}
        faceStyle={[styles.face, { width: size, height: size + (label ? 26 : 0) }]}
      >
        <Text style={{ fontSize: size * 0.52, lineHeight: size * 0.64 }}>{picture}</Text>
        {label && (
          <View style={styles.labelWrap}>
            <Text style={[styles.label, { color: resolvedTone === 'paper' ? colors.ink : colors.white }]}>{label}</Text>
          </View>
        )}
      </Chunky>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  face: { paddingHorizontal: 0, paddingVertical: 4 },
  labelWrap: { marginTop: -2 },
  label: { fontFamily: 'Baloo2_800ExtraBold', fontSize: 20, lineHeight: 24 },
});
