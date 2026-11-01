import { useEffect, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import { Chunky } from '@/components/chunky';
import { LockIcon, StarIcon } from '@/components/icons';
import type { Region } from '@/content/regions';
import { colors, type } from '@/theme';

// Bölgelerin ada üzerindeki konumları (yüzde)
const spots: Record<string, { left: string; top: string }> = {
  animals: { left: '14%', top: '40%' },
  food: { left: '56%', top: '22%' },
  colors: { left: '62%', top: '60%' },
  family: { left: '30%', top: '9%' },
};

function Waves() {
  const drift = useSharedValue(0);
  useEffect(() => {
    drift.set(withRepeat(withTiming(1, { duration: 6000, easing: Easing.linear }), -1, true, undefined, ReduceMotion.System));
  }, [drift]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: -14 + drift.get() * 28 }] }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
        <G stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.55}>
          <Path d="M20 40 q10 -8 20 0 t20 0" />
          <Path d="M330 30 q10 -8 20 0 t20 0" />
          <Path d="M350 250 q10 -8 20 0 t20 0" />
          <Path d="M10 260 q10 -8 20 0 t20 0" />
          <Path d="M300 285 q10 -8 20 0 t20 0" />
        </G>
      </Svg>
    </Animated.View>
  );
}

export function IslandMap({
  regions,
  starsByRegion,
  onSelect,
}: {
  regions: Region[];
  starsByRegion: Record<string, number>;
  onSelect: (r: Region) => void;
}) {
  const { height } = useWindowDimensions();
  const [w, setW] = useState(360);
  // Yatay tablette ada ekrana sığsın; telefonda çıkartmalar haritayla küçülsün
  const maxWidth = Math.min(760, Math.max(320, (height - 300) * (4 / 3)));
  const sticker = Math.round(Math.min(80, Math.max(56, w * 0.14)));
  return (
    <View style={[styles.wrap, { maxWidth }]} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <Svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" style={StyleSheet.absoluteFill}>
        {/* kıyı sığlığı */}
        <Path
          d="M60 160 C 50 90, 120 40, 200 42 C 290 44, 360 90, 350 170 C 342 240, 270 272, 196 270 C 110 268, 68 230, 60 160 Z"
          fill="#6FD1DB"
        />
        {/* kum: karton kalınlığı + yüz */}
        <Path
          d="M82 168 C 74 104, 132 66, 202 66 C 278 66, 336 104, 328 172 C 322 228, 264 254, 198 254 C 126 254, 88 222, 82 168 Z"
          fill={colors.sandDeep}
        />
        <Path
          d="M82 158 C 74 96, 132 58, 202 58 C 278 58, 336 96, 328 162 C 322 218, 264 244, 198 244 C 126 244, 88 212, 82 158 Z"
          fill={colors.sand}
        />
        {/* çimen */}
        <Path
          d="M108 154 C 104 108, 146 82, 202 82 C 262 82, 304 110, 300 158 C 296 200, 252 222, 200 222 C 146 222, 112 196, 108 154 Z"
          fill={colors.leafDeep}
        />
        <Path
          d="M108 148 C 104 102, 146 76, 202 76 C 262 76, 304 104, 300 152 C 296 194, 252 216, 200 216 C 146 216, 112 190, 108 148 Z"
          fill={colors.leaf}
        />
        {/* tepe */}
        <Path d="M170 128 C 180 96, 222 92, 236 126 Z" fill="#2C8131" />
        <Path d="M176 124 C 186 100, 216 98, 228 122 Z" fill="#6FCB5C" />
        {/* palmiye */}
        <G>
          <Path d="M300 196 C 304 176, 302 158, 296 142" stroke="#8A5A2B" strokeWidth={6} strokeLinecap="round" fill="none" />
          <Path d="M296 142 C 280 132, 266 138, 262 146 C 276 142, 288 144, 296 142 Z" fill={colors.leafDeep} />
          <Path d="M296 142 C 310 128, 326 130, 330 138 C 316 136, 304 140, 296 142 Z" fill={colors.leafDeep} />
          <Path d="M296 142 C 292 126, 298 116, 306 114 C 302 126, 300 134, 296 142 Z" fill={colors.leaf} />
          <Circle cx="294" cy="146" r="4" fill="#8A5A2B" />
        </G>
        {/* küçük taşlar ve deniz yıldızı */}
        <Ellipse cx="128" cy="226" rx="8" ry="4" fill="#C9A15A" />
        <Ellipse cx="270" cy="236" rx="6" ry="3" fill="#C9A15A" />
        <Path d="M240 248 l3 6 6 1 -4.5 4 1 6 -5.5 -3 -5.5 3 1 -6 -4.5 -4 6 -1z" fill="#EF4F7F" />
      </Svg>
      <Waves />

      {regions.map((r) => {
        const spot = spots[r.id] ?? { left: '40%', top: '40%' };
        return (
          <View key={r.id} style={[styles.spot, { left: spot.left as `${number}%`, top: spot.top as `${number}%` }]}>
            <Chunky
              tone={r.locked ? 'paper' : 'sun'}
              onPress={() => onSelect(r)}
              accessibilityLabel={r.locked ? `${r.name}, yakında` : r.name}
              round={26}
              faceStyle={[styles.sticker, { width: sticker, height: sticker }]}
            >
              <Text style={{ fontSize: sticker * 0.5, lineHeight: sticker * 0.62 }}>{r.emoji}</Text>
              {r.locked && (
                <View style={styles.lock}>
                  <LockIcon size={18} />
                </View>
              )}
            </Chunky>
            <View style={styles.tag}>
              <Text style={[type.label, { color: colors.ink, fontSize: w < 420 ? 13 : 16 }]} numberOfLines={1}>
                {r.name}
              </Text>
              {!r.locked && (starsByRegion[r.id] ?? 0) > 0 && (
                <View style={styles.tagStars}>
                  <StarIcon size={14} />
                  <Text style={[type.small, { color: colors.inkSoft }]}>{starsByRegion[r.id]}</Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', aspectRatio: 4 / 3, alignSelf: 'center' },
  spot: { position: 'absolute', alignItems: 'center', width: 120, marginLeft: -10 },
  sticker: { paddingHorizontal: 0, paddingVertical: 0 },
  lock: { position: 'absolute', right: 4, bottom: 4, backgroundColor: colors.paper, borderRadius: 12, padding: 2 },
  tag: {
    marginTop: 4,
    backgroundColor: 'rgba(255,253,247,0.95)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagStars: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
