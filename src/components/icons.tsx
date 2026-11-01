import Svg, { Circle, Path, Rect } from 'react-native-svg';

type P = { size?: number; color?: string };

export const StarIcon = ({ size = 24, color = '#FFC93C' }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M12 2.6l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.4l-5.4 2.9 1.1-6.1L3.2 9l6.1-.8L12 2.6z"
      fill={color}
      stroke="#D89A0B"
      strokeWidth={1.4}
      strokeLinejoin="round"
    />
  </Svg>
);

export const BackIcon = ({ size = 26, color = '#1D3557' }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M15 5l-7 7 7 7" stroke={color} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Svg>
);

export const SpeakerIcon = ({ size = 28, color = '#1D3557' }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill={color} />
    <Path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11" stroke={color} strokeWidth={2.2} strokeLinecap="round" fill="none" />
  </Svg>
);

export const MicIcon = ({ size = 40, color = '#FFFFFF' }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect x="8.5" y="3" width="7" height="12" rx="3.5" fill={color} />
    <Path d="M5.5 11.5a6.5 6.5 0 0013 0M12 18v3" stroke={color} strokeWidth={2.2} strokeLinecap="round" fill="none" />
  </Svg>
);

export const LockIcon = ({ size = 22, color = '#4F6582' }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect x="5" y="10.5" width="14" height="10" rx="3" fill={color} />
    <Path d="M8 10.5V8a4 4 0 018 0v2.5" stroke={color} strokeWidth={2.4} fill="none" />
  </Svg>
);

export const BookIcon = ({ size = 28, color = '#1D3557' }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M3.5 5.5c3-1 6-1 8.5.8v13c-2.5-1.8-5.5-1.8-8.5-.8z" fill={color} />
    <Path d="M20.5 5.5c-3-1-6-1-8.5.8v13c2.5-1.8 5.5-1.8 8.5-.8z" fill={color} opacity={0.7} />
  </Svg>
);

export const ClockLeaf = ({ size = 22, color = '#2C8131' }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="9" fill="#FFFFFF" stroke={color} strokeWidth={2.4} />
    <Path d="M12 7v5l3 2" stroke={color} strokeWidth={2.4} strokeLinecap="round" fill="none" />
  </Svg>
);
