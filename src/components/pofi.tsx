import { useEffect } from 'react';
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

export type PofiMood = 'happy' | 'cheer' | 'think' | 'sleep' | 'sad';

const BODY = '#7AD7C9';
const EDGE = '#3BA89A';
const BELLY = '#D6F5EF';

/**
 * Pofi — çocuğun dost yaratığı. Yıldız topladıkça başındaki filiz büyür (level).
 * Hafif bir "nefes alma" döngüsü onu canlı gösterir; azaltılmış hareket açıkken durur.
 */
export function Pofi({ size = 160, mood = 'happy', level = 1 }: { size?: number; mood?: PofiMood; level?: number }) {
  const breathe = useSharedValue(0);

  useEffect(() => {
    breathe.set(
      withRepeat(
        withSequence(
          withTiming(1, { duration: mood === 'sleep' ? 1800 : 1100, easing: Easing.bezier(0.77, 0, 0.175, 1) }),
          withTiming(0, { duration: mood === 'sleep' ? 1800 : 1100, easing: Easing.bezier(0.77, 0, 0.175, 1) }),
        ),
        -1,
        false,
        undefined,
        ReduceMotion.System,
      ),
    );
  }, [mood, breathe]);

  const style = useAnimatedStyle(() => {
    const b = breathe.get();
    const hop = mood === 'cheer' ? -10 * b : -3 * b;
    return { transform: [{ translateY: hop }, { scaleY: 1 + b * 0.025 }, { scaleX: 1 - b * 0.015 }] };
  });

  const leaves = Math.max(1, Math.min(5, level));

  return (
    <Animated.View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        {/* zemindeki gölge */}
        <Ellipse cx="100" cy="186" rx="58" ry="9" fill="#0B4F6C" opacity={0.18} />

        {/* filiz: seviye arttıkça yaprak eklenir */}
        <G>
          <Path d="M100 58 C 98 44, 100 34, 104 24" stroke="#2C8131" strokeWidth={6} strokeLinecap="round" fill="none" />
          {leaves >= 1 && <Path d="M104 26 C 118 12, 134 16, 136 22 C 124 32, 112 32, 104 26 Z" fill="#47B649" />}
          {leaves >= 2 && <Path d="M101 40 C 86 28, 72 32, 70 38 C 82 48, 94 46, 101 40 Z" fill="#47B649" />}
          {leaves >= 3 && <Path d="M103 34 C 114 30, 126 36, 126 42 C 116 46, 106 42, 103 34 Z" fill="#6FCB5C" />}
          {leaves >= 4 && <Circle cx="105" cy="20" r="7" fill="#FFC93C" />}
          {leaves >= 5 && <Circle cx="105" cy="20" r="3.5" fill="#EF4F7F" />}
        </G>

        {/* gövde: karton kalınlığı + yüz */}
        <Path d="M30 128 C 30 78, 62 52, 100 52 C 138 52, 170 78, 170 128 C 170 166, 140 182, 100 182 C 60 182, 30 166, 30 128 Z" fill={EDGE} />
        <Path d="M30 120 C 30 72, 62 46, 100 46 C 138 46, 170 72, 170 120 C 170 158, 140 174, 100 174 C 60 174, 30 158, 30 120 Z" fill={BODY} />
        <Ellipse cx="100" cy="140" rx="44" ry="30" fill={BELLY} />

        {/* kulak tüyleri */}
        <Path d="M52 70 C 40 56, 44 42, 52 40 C 60 50, 64 60, 62 66 Z" fill={BODY} />
        <Path d="M148 70 C 160 56, 156 42, 148 40 C 140 50, 136 60, 138 66 Z" fill={BODY} />

        {/* yanaklar */}
        <Ellipse cx="58" cy="122" rx="12" ry="8" fill="#EF4F7F" opacity={0.35} />
        <Ellipse cx="142" cy="122" rx="12" ry="8" fill="#EF4F7F" opacity={0.35} />

        {/* gözler */}
        {mood === 'sleep' ? (
          <G stroke="#1D3557" strokeWidth={5} strokeLinecap="round" fill="none">
            <Path d="M66 102 Q 78 112, 90 102" />
            <Path d="M110 102 Q 122 112, 134 102" />
          </G>
        ) : (
          <G>
            <Ellipse cx="78" cy="100" rx="15" ry={mood === 'cheer' ? 15 : 17} fill="#FFFFFF" />
            <Ellipse cx="122" cy="100" rx="15" ry={mood === 'cheer' ? 15 : 17} fill="#FFFFFF" />
            <Circle cx={mood === 'think' ? 82 : 80} cy={mood === 'think' ? 96 : 103} r={9} fill="#1D3557" />
            <Circle cx={mood === 'think' ? 126 : 124} cy={mood === 'think' ? 96 : 103} r={9} fill="#1D3557" />
            <Circle cx={mood === 'think' ? 85 : 83} cy={mood === 'think' ? 92 : 99} r={3.2} fill="#FFFFFF" />
            <Circle cx={mood === 'think' ? 129 : 127} cy={mood === 'think' ? 92 : 99} r={3.2} fill="#FFFFFF" />
          </G>
        )}

        {/* ağız */}
        {mood === 'cheer' && <Path d="M84 124 Q 100 146, 116 124 Z" fill="#B32C57" />}
        {mood === 'happy' && <Path d="M86 124 Q 100 136, 114 124" stroke="#1D3557" strokeWidth={5} strokeLinecap="round" fill="none" />}
        {mood === 'think' && <Path d="M90 128 Q 100 124, 110 128" stroke="#1D3557" strokeWidth={5} strokeLinecap="round" fill="none" />}
        {mood === 'sad' && <Path d="M88 132 Q 100 122, 112 132" stroke="#1D3557" strokeWidth={5} strokeLinecap="round" fill="none" />}
        {mood === 'sleep' && <Ellipse cx="100" cy="128" rx="6" ry="4" fill="#1D3557" />}

        {/* uyku "z"leri */}
        {mood === 'sleep' && (
          <G stroke="#0B4F6C" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.7}>
            <Path d="M150 54 h12 l-12 12 h12" />
            <Path d="M168 32 h9 l-9 9 h9" />
          </G>
        )}
      </Svg>
    </Animated.View>
  );
}
