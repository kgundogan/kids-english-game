import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { DEPTH, radius, tones, type, type Tone } from '@/theme';

const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

type Props = {
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  tone?: Tone;
  label?: string;
  children?: ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  faceStyle?: StyleProp<ViewStyle>;
  depth?: number;
  round?: number;
  accessibilityLabel?: string;
  haptic?: boolean;
};

/**
 * Kartondan kesilmiş düğme: yüz, altındaki koyu "kalınlık" katmanının üzerine oturur.
 * Basınca yüz aşağı iner (geri bildirim basışta, işlem bırakışta).
 */
export function Chunky({
  onPress,
  onPressIn,
  onPressOut,
  tone = 'paper',
  label,
  children,
  disabled,
  style,
  faceStyle,
  depth = DEPTH,
  round = radius.m,
  accessibilityLabel,
  haptic = true,
}: Props) {
  const t = tones[tone];
  const press = useSharedValue(0);

  const faceAnim = useAnimatedStyle(() => ({
    transform: [{ translateY: press.get() * (depth - 1) }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        press.set(withTiming(1, { duration: 90, easing: EASE_OUT }));
        if (haptic && Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPressIn?.();
      }}
      onPressOut={() => {
        press.set(withTiming(0, { duration: 140, easing: EASE_OUT }));
        onPressOut?.();
      }}
      pressRetentionOffset={{ top: 20, bottom: 20, left: 20, right: 20 }}
      hitSlop={6}
      style={[{ paddingBottom: depth, opacity: disabled ? 0.55 : 1 }, style]}
    >
      <View style={[StyleSheet.absoluteFill, { top: depth, backgroundColor: t.edge, borderRadius: round }]} />
      <Animated.View style={[styles.face, { backgroundColor: t.face, borderRadius: round }, faceStyle, faceAnim]}>
        {label ? <Text style={[type.label, { color: t.text, fontSize: 20 }]}>{label}</Text> : children}
      </Animated.View>
    </Pressable>
  );
}

/** Basılmayan karton yüzey (kart, panel). */
export function Paper({
  tone = 'paper',
  children,
  style,
  depth = DEPTH,
  round = radius.m,
}: {
  tone?: Tone;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  depth?: number;
  round?: number;
}) {
  const t = tones[tone];
  return (
    <View style={{ paddingBottom: depth }}>
      <View style={[StyleSheet.absoluteFill, { top: depth, backgroundColor: t.edge, borderRadius: round }]} />
      <View style={[{ backgroundColor: t.face, borderRadius: round }, style]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  face: {
    minHeight: 56,
    minWidth: 56,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
