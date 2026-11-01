// İçerik: Cambridge Pre-A1 (Starters) kelime listesiyle hizalı.
// Görseller şimdilik emoji; tasarım sistemi netleşince özel illüstrasyonlarla değişecek
// (Word.picture alanı tek yerden değiştirilir).

export type Word = {
  id: string;
  en: string;
  picture: string;
  /** Konuşma tanımada kabul edilen yakın söyleyişler */
  accept?: string[];
  /** Hareketle öğrenme (TPR) için ekran dışı komut */
  move?: string;
};

export type StepKind = 'meet' | 'listen' | 'match' | 'speak' | 'quest';

export type Step = {
  id: string;
  kind: StepKind;
  title: string;
  /** Pofi'nin Türkçe yönergesi (okuma bilmeyen çocuk için sesli okunur) */
  hint: string;
};

export type Region = {
  id: string;
  name: string;
  englishName: string;
  tone: 'lagoon' | 'leaf' | 'sun' | 'berry' | 'plum';
  emoji: string;
  locked: boolean;
  words: Word[];
  chunk?: { pattern: string; example: string };
  steps: Step[];
};

const animalWords: Word[] = [
  { id: 'cat', en: 'cat', picture: '🐱', accept: ['cut', 'kat', 'cats'], move: 'Kedi gibi miyavla' },
  { id: 'dog', en: 'dog', picture: '🐶', accept: ['dock', 'dogs', 'doug'], move: 'Köpek gibi havla' },
  { id: 'fish', en: 'fish', picture: '🐟', accept: ['fis', 'fishes'], move: 'Balık gibi yüz' },
  { id: 'bird', en: 'bird', picture: '🐦', accept: ['bert', 'burt', 'birds'], move: 'Kuş gibi kanat çırp' },
  { id: 'duck', en: 'duck', picture: '🦆', accept: ['dock', 'duk', 'ducks'], move: 'Ördek gibi yürü' },
  { id: 'frog', en: 'frog', picture: '🐸', accept: ['frock', 'frogs'], move: 'Kurbağa gibi zıpla' },
  { id: 'cow', en: 'cow', picture: '🐮', accept: ['cows', 'cao'], move: 'İnek gibi möö de' },
  { id: 'lion', en: 'lion', picture: '🦁', accept: ['lyon', 'lions', 'line'], move: 'Aslan gibi kükre' },
  { id: 'rabbit', en: 'rabbit', picture: '🐰', accept: ['rabbits', 'rabid'], move: 'Tavşan gibi hopla' },
  { id: 'elephant', en: 'elephant', picture: '🐘', accept: ['elephants', 'elefant'], move: 'Hortumunu salla' },
];

export const regions: Region[] = [
  {
    id: 'animals',
    name: 'Hayvan Koyu',
    englishName: 'Animal Bay',
    tone: 'leaf',
    emoji: '🐾',
    locked: false,
    words: animalWords,
    chunk: { pattern: 'I like ___', example: 'I like cats!' },
    steps: [
      { id: 'a1', kind: 'meet', title: 'Tanış', hint: 'Koyun sakinleriyle tanış. Her birine dokun ve dinle.' },
      { id: 'a2', kind: 'listen', title: 'Dinle-bul', hint: 'Pofi bir hayvan söyleyecek. Doğru hayvana dokun!' },
      { id: 'a3', kind: 'match', title: 'Eşleştir', hint: 'Aynı hayvanın iki kartını bul.' },
      { id: 'a4', kind: 'speak', title: 'Konuş-büyü', hint: 'Düğmeye basılı tut ve hayvanın adını söyle.' },
      { id: 'a5', kind: 'quest', title: 'Kayıp yavrular', hint: 'Yavrular kayboldu! Hepsini bulup evlerine götür.' },
    ],
  },
  { id: 'food', name: 'Meyve Pazarı', englishName: 'Fruit Market', tone: 'berry', emoji: '🍎', locked: true, words: [], steps: [] },
  { id: 'colors', name: 'Gökkuşağı Tepesi', englishName: 'Rainbow Hill', tone: 'sun', emoji: '🌈', locked: true, words: [], steps: [] },
  { id: 'family', name: 'Ağaç Ev', englishName: 'Tree House', tone: 'plum', emoji: '🏡', locked: true, words: [], steps: [] },
];

export const getRegion = (id: string) => regions.find((r) => r.id === id);
