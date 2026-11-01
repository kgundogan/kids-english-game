// Kalıplar (chunks): sıfır seviyedeki çocuk "this / is / a" gibi tek tek kelimeleri bilmez.
// Bu yüzden İngilizce cümleleri parçalara ayırıp öğretmiyoruz; birkaç işlevsel kalıbı
// bütün olarak, her zaman aynı jest/simgeyle ve bir durum içinde veriyoruz.
// İlk iki karşılaşmada Pofi durumu Türkçe kısaca anlatır (iskele), sonra Türkçe destek çekilir.

export type ChunkId = 'hello' | 'yes' | 'no' | 'where' | 'like';

export type Chunk = {
  id: ChunkId;
  /** Ekranda ve seste kalıp */
  en: string;
  /** Her zaman aynı görsel işaret: çocuk anlamı bu işaretten çıkarır */
  sign: string;
  /** Pofi'nin Türkçe iskele cümlesi: çeviri değil, durumu anlatır */
  scaffold: string;
  /** Örnek kullanım (veli köşesi ve tanıtım) */
  example: string;
};

export const chunks: Record<ChunkId, Chunk> = {
  hello: {
    id: 'hello',
    en: 'Hello!',
    sign: '👋',
    scaffold: 'İngilizcede biriyle karşılaşınca el sallar ve "Hello!" deriz. Hadi, sen de el salla ve söyle!',
    example: 'Hello, cow!',
  },
  yes: {
    id: 'yes',
    en: 'Yes!',
    sign: '✅',
    scaffold: 'Bir şey doğruysa İngilizcede "Yes!" deriz. Yeşil işaret hep "Yes" demek.',
    example: 'Yes! Cow!',
  },
  no: {
    id: 'no',
    en: 'No.',
    sign: '❌',
    scaffold: 'Bir şey yanlışsa İngilizcede "No" deriz. Kırmızı işaret hep "No" demek.',
    example: 'No. Dog.',
  },
  where: {
    id: 'where',
    en: 'Where is the cow?',
    sign: '🔍',
    scaffold: 'Bir şeyi ararken İngilizcede "Where is…?" diye sorarız. Büyüteci görünce arama zamanı!',
    example: 'Where is the cow?',
  },
  like: {
    id: 'like',
    en: 'I like cats!',
    sign: '❤️',
    scaffold: 'Sevdiğimiz bir şeyi söylerken İngilizcede "I like…" deriz. Kalbi görünce sevdiğini söyle!',
    example: 'I like cats!',
  },
};

/** Türkçe iskele kaç karşılaşmaya kadar okunur */
export const SCAFFOLD_EXPOSURES = 2;
