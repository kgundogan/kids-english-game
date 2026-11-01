// Pofi Adası — görsel dil: "kartondan kesilmiş diorama".
// Her yüzey altında koyu tonunu taşıyan, bulanık olmayan bir "kalınlık" gölgesi taşır;
// böylece 2D ekran katman katman, dokunulabilir bir oyuncak gibi görünür.

export const colors = {
  sky: '#BFE9F5',
  skyDeep: '#8FD3EA',
  lagoon: '#1FA2B0',
  lagoonDeep: '#0D6E7A',
  sea: '#0B4F6C',
  sand: '#FFE3A3',
  sandDeep: '#E8B95E',
  leaf: '#47B649',
  leafDeep: '#2C8131',
  sun: '#FFC93C',
  sunDeep: '#D89A0B',
  berry: '#EF4F7F',
  berryDeep: '#B32C57',
  plum: '#6C4AB6',
  plumDeep: '#4A2F86',
  paper: '#FFFDF7',
  ink: '#1D3557',
  inkSoft: '#4F6582',
  white: '#FFFFFF',
} as const;

export type Tone = 'lagoon' | 'leaf' | 'sun' | 'berry' | 'plum' | 'paper';

export const tones: Record<Tone, { face: string; edge: string; text: string }> = {
  lagoon: { face: colors.lagoon, edge: colors.lagoonDeep, text: colors.white },
  leaf: { face: colors.leaf, edge: colors.leafDeep, text: colors.white },
  sun: { face: colors.sun, edge: colors.sunDeep, text: colors.ink },
  berry: { face: colors.berry, edge: colors.berryDeep, text: colors.white },
  plum: { face: colors.plum, edge: colors.plumDeep, text: colors.white },
  paper: { face: colors.paper, edge: '#D9CFB8', text: colors.ink },
};

export const fonts = {
  regular: 'Baloo2_500Medium',
  bold: 'Baloo2_700Bold',
  black: 'Baloo2_800ExtraBold',
};

export const type = {
  hero: { fontFamily: fonts.black, fontSize: 40, lineHeight: 44 },
  title: { fontFamily: fonts.black, fontSize: 28, lineHeight: 32 },
  word: { fontFamily: fonts.black, fontSize: 34, lineHeight: 38 },
  body: { fontFamily: fonts.regular, fontSize: 18, lineHeight: 24 },
  label: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 20 },
  small: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 18 },
} as const;

// Karton kalınlığı: basılınca yüzey bu kadar aşağı iner.
export const DEPTH = 6;
export const radius = { s: 14, m: 22, l: 32 };
