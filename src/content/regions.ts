// İçerik: Cambridge Pre-A1 (Starters) kelime listesiyle hizalı.
// Görseller şimdilik emoji; tasarım sistemi netleşince özel illüstrasyonlarla değişecek
// (Word.picture alanı tek yerden değiştirilir).

export type Word = {
  id: string;
  en: string;
  picture: string;
  /** Aynı kavramın farklı görseli: çocuğun resmi değil kavramı öğrendiğini test eder */
  altPicture?: string;
  /** Hayvanın sesi (İngilizce yansıma): kelimeyi akılda tutan çapa — "Cow. Moo!" */
  sound?: string;
  /** Hece hece söyleyiş, vurgulu hece büyük harf: "EL-e-phant" */
  syllables?: string;
  /** Veli için Türkçe okunuş ipucu */
  trSay: string;
  /** Konuşma tanımada kabul edilen yakın söyleyişler */
  accept?: string[];
  /** Hareketle öğrenme (TPR) için ekran dışı komut */
  move?: string;
};

export type StepKind = 'book' | 'listen' | 'yesno' | 'match' | 'find' | 'speak' | 'quest';

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
  steps: Step[];
};

const animalWords: Word[] = [
  { id: 'cat', en: 'cat', picture: '🐱', altPicture: '🐈', sound: 'Meow!', trSay: 'ket', accept: ['cut', 'kat', 'cats', 'kit'], move: 'Kedi gibi miyavla' },
  { id: 'dog', en: 'dog', picture: '🐶', altPicture: '🐕', sound: 'Woof woof!', trSay: 'dog (o kısa ve açık)', accept: ['dock', 'dogs', 'doug', 'dug'], move: 'Köpek gibi havla' },
  { id: 'fish', en: 'fish', picture: '🐟', altPicture: '🐠', sound: 'Blub blub!', trSay: 'fiş', accept: ['fis', 'fishes', 'fist'], move: 'Balık gibi yüz' },
  { id: 'bird', en: 'bird', picture: '🐦', altPicture: '🕊️', sound: 'Tweet tweet!', trSay: 'börd', accept: ['bert', 'burt', 'birds', 'bud'], move: 'Kuş gibi kanat çırp' },
  { id: 'duck', en: 'duck', picture: '🦆', sound: 'Quack quack!', trSay: 'dak', accept: ['dock', 'duk', 'ducks', 'dark'], move: 'Ördek gibi paytak yürü' },
  { id: 'frog', en: 'frog', picture: '🐸', sound: 'Ribbit!', trSay: 'frog', accept: ['frock', 'frogs', 'fog'], move: 'Kurbağa gibi zıpla' },
  { id: 'cow', en: 'cow', picture: '🐮', altPicture: '🐄', sound: 'Moo!', trSay: 'kau', accept: ['cows', 'cao', 'cal', 'how'], move: 'İnek gibi möö de' },
  { id: 'lion', en: 'lion', picture: '🦁', sound: 'Roar!', syllables: 'LI-on', trSay: 'LAY-ın', accept: ['lyon', 'lions', 'line', 'ryan', 'leon'], move: 'Aslan gibi kükre' },
  { id: 'rabbit', en: 'rabbit', picture: '🐰', altPicture: '🐇', sound: 'Hop hop!', syllables: 'RAB-bit', trSay: 'RE-bit', accept: ['rabbits', 'rabid', 'robert'], move: 'Tavşan gibi hopla' },
  { id: 'elephant', en: 'elephant', picture: '🐘', sound: 'Toot!', syllables: 'EL-e-phant', trSay: 'E-lı-fınt', accept: ['elephants', 'elefant', 'element'], move: 'Hortumunu salla' },
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
    steps: [
      { id: 'a1', kind: 'book', title: 'Sesli kitap', hint: 'Sesli kitabımızı açalım. Her sayfada saklanan hayvanlara dokun ve adlarını duy.' },
      { id: 'a2', kind: 'listen', title: 'Dinle-bul', hint: 'Ben bir hayvanın adını söyleyeceğim. Sen o hayvana dokun.' },
      { id: 'a3', kind: 'yesno', title: 'Evet mi, hayır mı?', hint: 'Sana bir hayvan göstereceğim ve adını soracağım. Doğruysa yeşile, yanlışsa kırmızıya dokun.' },
      { id: 'a4', kind: 'match', title: 'Eşleştir', hint: 'Kartları aç. Hayvanın resmini, adının sesiyle eşleştir.' },
      { id: 'a5', kind: 'find', title: 'Saklambaç', hint: 'Hayvanlar adaya saklandı. Hangisini sorarsam onu bul.' },
      { id: 'a6', kind: 'speak', title: 'Konuş-büyü', hint: 'Mor düğmeye basılı tut ve hayvanın adını yüksek sesle söyle.' },
      { id: 'a7', kind: 'quest', title: 'Kayıp yavrular', hint: 'Yavrular kayboldu! Öğrendiğin her şeyi kullanarak onları evlerine götür.' },
    ],
  },
  { id: 'food', name: 'Meyve Pazarı', englishName: 'Fruit Market', tone: 'berry', emoji: '🍎', locked: true, words: [], steps: [] },
  { id: 'colors', name: 'Gökkuşağı Tepesi', englishName: 'Rainbow Hill', tone: 'sun', emoji: '🌈', locked: true, words: [], steps: [] },
  { id: 'family', name: 'Ağaç Ev', englishName: 'Tree House', tone: 'plum', emoji: '🏡', locked: true, words: [], steps: [] },
];

export const getRegion = (id: string) => regions.find((r) => r.id === id);
export const allWords = () => regions.flatMap((r) => r.words);
