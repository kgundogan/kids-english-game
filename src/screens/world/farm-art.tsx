import { StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { colors } from '@/theme';

// Pofi'nin Çiftliği — sahne çizimleri. Emoji hayvanlar geçici; sahne ve saklanma yerleri kalıcı tasarımın taslağı.

export const SCENE_W = 400;
export const SCENE_H = 300;

/** Arka plan: gökyüzü, tepeler, ahır, ağaç, gölet. roofFixed: fırtınanın kırdığı çatı onarıldı mı */
export function FarmBackdrop({ roofFixed }: { roofFixed: boolean }) {
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${SCENE_W} ${SCENE_H}`} preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
      <Rect x="0" y="0" width="400" height="300" fill="#CDEFFA" />
      <Circle cx="352" cy="38" r="20" fill={colors.sun} />
      {/* fırtınadan kalan bulut */}
      <Ellipse cx="120" cy="34" rx="34" ry="12" fill="#FFFFFF" opacity={0.9} />
      <Ellipse cx="146" cy="28" rx="22" ry="10" fill="#FFFFFF" opacity={0.9} />
      <Path d="M0 130 C 90 108, 180 140, 260 120 C 320 106, 370 126, 400 118 V300 H0 Z" fill="#8ED16F" />
      <Path d="M0 170 C 110 152, 230 186, 400 160 V300 H0 Z" fill={colors.leaf} />
      {/* ağaç */}
      <Rect x="62" y="74" width="14" height="80" rx="4" fill="#8A5A2B" />
      <Circle cx="69" cy="64" r="38" fill={colors.leafDeep} />
      <Circle cx="50" cy="76" r="22" fill="#3E9E40" />
      <Circle cx="92" cy="72" r="24" fill="#3E9E40" />
      {/* ahır */}
      <Rect x="196" y="90" width="84" height="66" fill={colors.berry} />
      <Path d="M186 94 L238 58 L290 94 Z" fill={colors.berryDeep} />
      {!roofFixed && (
        <G>
          {/* çatıdaki delik ve kopmuş tahta */}
          <Path d="M232 70 L250 66 L254 80 L236 84 Z" fill="#3B1D2A" />
          <Rect x="256" y="112" width="30" height="7" rx="2" fill="#B5844A" transform="rotate(28 271 115)" />
        </G>
      )}
      {roofFixed && <Path d="M230 70 L252 64 L256 80 L234 86 Z" fill="#C99A5B" />}
      <Rect x="222" y="112" width="32" height="44" fill="#7A2340" />
      <Path d="M222 112 L254 156 M254 112 L222 156" stroke={colors.paper} strokeWidth={3} />
      {/* çit */}
      <Path d="M296 150 H400 M296 162 H400" stroke="#C99A5B" strokeWidth={4} />
      {[302, 326, 350, 374, 396].map((x) => (
        <Rect key={x} x={x} y="140" width="6" height="30" fill="#B5844A" />
      ))}
      {/* gölet */}
      <Ellipse cx="300" cy="262" rx="86" ry="24" fill="#6FD1DB" />
      <Ellipse cx="300" cy="258" rx="60" ry="12" fill="#9BE3EA" opacity={0.6} />
      {/* çiçekler */}
      {[
        [150, 236],
        [168, 246],
        [140, 252],
      ].map(([x, y]) => (
        <G key={`${x}-${y}`}>
          <Circle cx={x} cy={y} r="5" fill={colors.berry} />
          <Circle cx={x} cy={y} r="2" fill={colors.sun} />
        </G>
      ))}
      {/* fırtınanın savurduğu yapraklar */}
      {!roofFixed &&
        [
          [120, 200, 20],
          [260, 196, -30],
          [360, 232, 50],
        ].map(([x, y, r]) => <Ellipse key={`${x}`} cx={x} cy={y} rx="6" ry="3" fill="#3E9E40" transform={`rotate(${r} ${x} ${y})`} />)}
    </Svg>
  );
}

export type CoverKind = 'leaves' | 'door' | 'hay' | 'bush' | 'crate' | 'reeds' | 'ripple';

/** Saklanma yerleri: dokununca sallanır, arkasından hayvan çıkar */
export function Cover({ kind, size = 76 }: { kind: CoverKind; size?: number }) {
  const s = size;
  switch (kind) {
    case 'leaves':
      return (
        <Svg width={s} height={s * 0.8} viewBox="0 0 80 64">
          <Circle cx="24" cy="36" r="20" fill="#3E9E40" />
          <Circle cx="48" cy="28" r="24" fill={colors.leafDeep} />
          <Circle cx="60" cy="42" r="16" fill="#3E9E40" />
        </Svg>
      );
    case 'door':
      return (
        <Svg width={s * 0.6} height={s * 0.8} viewBox="0 0 48 64">
          <Rect x="2" y="2" width="44" height="60" rx="3" fill="#7A2340" stroke={colors.paper} strokeWidth={3} />
          <Path d="M2 2 L46 62 M46 2 L2 62" stroke={colors.paper} strokeWidth={3} />
        </Svg>
      );
    case 'hay':
      return (
        <Svg width={s} height={s * 0.75} viewBox="0 0 80 60">
          <Path d="M4 58 C 4 20, 76 20, 76 58 Z" fill="#F2C94C" />
          <Path d="M14 50 L22 30 M32 54 L36 26 M48 54 L46 26 M64 50 L58 30" stroke="#D4A62A" strokeWidth={3} strokeLinecap="round" />
        </Svg>
      );
    case 'bush':
      return (
        <Svg width={s} height={s * 0.7} viewBox="0 0 80 56">
          <Circle cx="20" cy="36" r="18" fill={colors.leafDeep} />
          <Circle cx="40" cy="26" r="22" fill="#3E9E40" />
          <Circle cx="60" cy="36" r="18" fill={colors.leafDeep} />
          <Rect x="4" y="40" width="72" height="16" rx="8" fill="#2C8131" />
        </Svg>
      );
    case 'crate':
      return (
        <Svg width={s * 0.8} height={s * 0.7} viewBox="0 0 64 56">
          <Rect x="2" y="6" width="60" height="48" rx="4" fill="#C99A5B" stroke="#8A5A2B" strokeWidth={3} />
          <Path d="M2 22 H62 M2 38 H62" stroke="#8A5A2B" strokeWidth={3} />
        </Svg>
      );
    case 'reeds':
      return (
        <Svg width={s * 0.8} height={s * 0.8} viewBox="0 0 64 64">
          {[10, 22, 34, 46, 56].map((x, i) => (
            <G key={x}>
              <Path d={`M${x} 64 C ${x - 4} 40, ${x + 4} 24, ${x} ${10 + (i % 2) * 8}`} stroke="#2C8131" strokeWidth={4} fill="none" strokeLinecap="round" />
              <Ellipse cx={x} cy={14 + (i % 2) * 8} rx="3" ry="8" fill="#8A5A2B" />
            </G>
          ))}
        </Svg>
      );
    case 'ripple':
      return (
        <Svg width={s} height={s * 0.5} viewBox="0 0 80 40">
          <Ellipse cx="40" cy="22" rx="34" ry="12" fill="none" stroke="#FFFFFF" strokeWidth={3} />
          <Ellipse cx="40" cy="22" rx="20" ry="7" fill="none" stroke="#FFFFFF" strokeWidth={3} />
        </Svg>
      );
  }
}
