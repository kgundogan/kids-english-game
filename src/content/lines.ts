// Öğretmen metni: Pofi'nin söylediği HER cümle buradan gelir.
// Her satırın sabit bir kimliği var; ElevenLabs ile üretilen ses dosyası bu kimlikle eşleşir
// (scripts/generate-voice.ts). Dosya yoksa cihaz sesi okur.
//
// Sıfır seviye kuralları:
// - İngilizce önce TEK KELİME olarak gelir ("Cow."), cümle değil. "This is a…" yok.
// - Anlam resim, hayvan sesi ve hareketten gelir; çeviri söylenmez.
// - Yönerge ve çerçeve Türkçe ("Bak, kim gelmiş!"), hedef dil İngilizce.
// - Kalıplar (Hello, Yes, No, Where is…, I like…) bütün olarak ve hep aynı işaretle verilir.
// - Köşeli parantez ElevenLabs v4 ses etiketidir ([warmly] gibi); cihaz sesi bunları atlar.
// - Türkçe satırlarda İngilizce kelime geçmez: Türkçe sesle okunan İngilizce kelime aksanlı çıkar ve yanlış öğretir.

import { chunks, type ChunkId } from './chunks';
import { regions, type Word } from './regions';

export type Lang = 'en' | 'tr';
export type Line = { id: string; lang: Lang; text: string; slow?: boolean; pauseAfter?: number };

function hash(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

function line(lang: Lang, text: string, opts: { slow?: boolean; pauseAfter?: number } = {}): Line {
  return { id: `${lang}_${opts.slow ? 's_' : ''}${hash(text)}`, lang, text, ...opts };
}
export const en = (text: string, opts?: { slow?: boolean; pauseAfter?: number }) => line('en', text, opts);
export const tr = (text: string, opts?: { slow?: boolean; pauseAfter?: number }) => line('tr', text, opts);

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const plural = (w: Word) => (w.en === 'fish' ? 'fish' : `${w.en}s`);

const meetOpeners = ['Bak, kim gelmiş!', 'Şuna bak!', 'Bu da kim?', 'Yeni bir arkadaş geldi!', 'Bir ses duyuyorum…'];

export const say = {
  // ——— Tanış ———
  /** Kelimeyle ilk karşılaşma: Türkçe çerçeve → kelime iki kez → hayvan sesi → (Hello öğrenildiyse) selam → çocuğa sıra */
  meet(w: Word, index: number, helloKnown: boolean): Line[] {
    const out: Line[] = [
      tr(meetOpeners[index % meetOpeners.length], { pauseAfter: 250 }),
      en(`[warmly] ${cap(w.en)}.`, { pauseAfter: 500 }),
      en(`${cap(w.en)}!`, { slow: true, pauseAfter: 300 }),
    ];
    if (w.sound) out.push(en(`[playfully] ${w.sound}`, { pauseAfter: 400 }));
    if (helloKnown) out.push(en(`Hello, ${w.en}!`, { pauseAfter: 400 }));
    out.push(tr('Şimdi sen söyle!', { pauseAfter: 200 }));
    out.push(en(`${cap(w.en)}.`, { slow: true, pauseAfter: 1800 }));
    return out;
  },
  word: (w: Word) => en(`${cap(w.en)}.`),
  wordSlow: (w: Word) => en(`${cap(w.en)}.`, { slow: true }),
  /** Uzun kelimelerde hece hece, sonra bütün */
  syllables(w: Word): Line[] {
    if (!w.syllables) return [en(`${cap(w.en)}.`, { slow: true })];
    const parts = w.syllables.split('-').map((p) => p.toLowerCase());
    return [en(`${parts.join('… ')}.`, { slow: true, pauseAfter: 400 }), en(`${cap(w.en)}!`)];
  },

  // ——— Sesli kitap ———
  bookFirst: tr('Bu bizim sesli kitabımız. Sayfadaki hayvanlara dokun, kim olduklarını duy!'),
  bookNext: tr('Yeni sayfa! Burada kimler saklanıyor?'),

  // ——— Dinle-bul ———
  ask: (w: Word) => en(`${cap(w.en)}.`),
  right: (w: Word): Line[] => [en('[excited] Yes!', { pauseAfter: 150 }), en(`${cap(w.en)}!`)],
  /** Yanlışta ceza yok: dokunduğu hayvanın adını duyar (bu da öğrenme), sonra hedef tekrar */
  wrong: (tapped: Word, target: Word): Line[] => [
    en('No.', { pauseAfter: 150 }),
    en(`${cap(tapped.en)}.`, { pauseAfter: 500 }),
    en(`${cap(target.en)}?`),
  ],

  // ——— Evet mi hayır mı ———
  isIt: (w: Word) => en(`${cap(w.en)}?`),
  yesNoFeedback(correct: boolean, isMatch: boolean, asked: Word, actual: Word): Line[] {
    if (correct && isMatch) return [en('[excited] Yes!', { pauseAfter: 150 }), en(`${cap(actual.en)}!`)];
    if (correct && !isMatch) return [en('[excited] No!', { pauseAfter: 150 }), en(`${cap(actual.en)}!`)];
    if (!correct && isMatch) return [en('Yes!', { pauseAfter: 150 }), en(`${cap(actual.en)}.`, { pauseAfter: 200 }), tr('Bu gerçekten o!')];
    return [en('No.', { pauseAfter: 150 }), en(`${cap(actual.en)}.`)];
  },

  // ——— Saklambaç ———
  where: (w: Word) => en(`Where is the ${w.en}?`),
  found: (w: Word): Line[] => [en('[excited] Yes!', { pauseAfter: 120 }), en(`Hello, ${w.en}!`)],

  // ——— Konuş-büyü ———
  /** İlk kez: önce model, sonra sıra çocukta (taklit). Sonraki seferlerde: önce kendi hatırlasın (geri çağırma). */
  speakPrompt(w: Word, firstTime: boolean): Line[] {
    return firstTime
      ? [en(`${cap(w.en)}.`, { slow: true, pauseAfter: 300 }), tr('Şimdi sen söyle!')]
      : [tr('Bunun adı ne? Hatırlıyor musun?')];
  },
  speakRetry: (w: Word): Line[] => [tr('Benden sonra tekrar et:', { pauseAfter: 150 }), en(`${cap(w.en)}.`, { slow: true })],
  speakGiveUp: (w: Word): Line[] => [en(`${cap(w.en)}!`, { pauseAfter: 200 }), tr('Güzel denedin! Bir dahakine birlikte söyleriz.')],

  // ——— Okuma (7+) ———
  read: () => tr('Bu sefer ben söylemeyeceğim. Yazıyı oku ve resmini bul!'),

  // ——— Kalıp: I like ———
  likeAsk: () => tr('En sevdiğin hayvan hangisi? Ona dokun!'),
  likeModel: (w: Word): Line[] => [en(`[warmly] I like ${plural(w)}!`, { pauseAfter: 300 }), tr('Sen de söyle!')],

  // ——— Kalıp tanıtımı ———
  chunkIntro(id: ChunkId, withScaffold: boolean): Line[] {
    const c = chunks[id];
    const out: Line[] = [];
    if (withScaffold) out.push(tr(c.scaffold, { pauseAfter: 300 }));
    out.push(en(c.en, { pauseAfter: 400 }), en(c.en, { slow: true }));
    return out;
  },

  // ——— Ortak ———
  praise: [en('[excited] Well done!'), en('[excited] Great job!'), en('[excited] Super!')],
  celebrate: (stars: number): Line[] =>
    stars === 3 ? [en('[excited] Well done!', { pauseAfter: 200 }), tr('Üç yıldız! Muhteşemsin!')] : [en('[warmly] Well done!', { pauseAfter: 200 }), tr('Harika iş çıkardın!')],
  greetingFirst: tr('Merhaba! Ben Pofi. Seninle İngilizce oynayacağız. Hayvan Koyu’na gidelim mi?'),
  greetingBack: tr('Tekrar hoş geldin! Bugün nereye gidiyoruz?'),
  locked: (name: string) => tr(`${name} henüz hazırlanıyor. Çok yakında!`),
  regionNext: (title: string) => tr(`Sıradaki oyun: ${title.replace(/[?.!]+$/, '')}. Hazır mısın?`),
  regionDone: tr('Koyun tüm sırlarını çözdün! İstediğin oyunu tekrar oynayabilirsin.'),
  sleep: tr('Pofi çok yoruldu, uyku vakti. Yarın yeni maceralar bizi bekliyor!'),
  offScreen: (w: Word): Line[] => [tr(`Tableti bırak! ${w.move ?? 'Kalk ve hareket et'} ve şunu söyle:`, { pauseAfter: 200 }), en(`${cap(w.en)}!`, { slow: true })],
  move: (w: Word): Line[] => [tr(`${w.move ?? 'Hareket et'}!`, { pauseAfter: 300 }), en(`${cap(w.en)}!`)],
  hint: (text: string) => tr(text),

  // ——— Veli köşesi: veliye yardımcı İngilizce soru kalıpları ———
  parentQuestions: (w: Word) => [
    { en: en("What's this?", { slow: true }), tr: 'Bu ne? (resmi ya da oyuncağı gösterin)' },
    { en: en(`Where is the ${w.en}?`, { slow: true }), tr: `${w.en} nerede? (odada arasın, bulunca göstersin)` },
    { en: en(`Show me the ${w.en}!`, { slow: true }), tr: `Göster bakalım! (eliyle göstersin)` },
    { en: en(`Can you say ${w.en}?`, { slow: true }), tr: `${w.en} diyebilir misin?` },
  ],
};

/** Tüm sabit satırlar: ElevenLabs üretim betiği bu listeyi seslendirir. */
export function allLines(): Line[] {
  const out: Line[] = [];
  const push = (l: Line | Line[]) => (Array.isArray(l) ? out.push(...l) : out.push(l));
  for (const r of regions) {
    push(say.locked(r.name));
    for (const s of r.steps) {
      push(say.hint(s.hint));
      push(say.regionNext(s.title));
    }
    r.words.forEach((w, i) => {
      for (let k = 0; k < meetOpeners.length; k++) push(say.meet(w, k, k % 2 === 0));
      push([say.word(w), say.wordSlow(w), ...say.syllables(w), say.ask(w), ...say.right(w), say.isIt(w), say.where(w), ...say.found(w)]);
      push([...say.speakPrompt(w, true), ...say.speakPrompt(w, false), ...say.speakRetry(w), ...say.speakGiveUp(w), ...say.likeModel(w)]);
      push([...say.offScreen(w), ...say.move(w)]);
      say.parentQuestions(w).forEach((q) => push(q.en));
      for (const other of r.words) {
        if (other.id === w.id) continue;
        push(say.wrong(other, w));
        push(say.yesNoFeedback(false, false, w, other));
        push(say.yesNoFeedback(true, false, w, other));
      }
      push(say.yesNoFeedback(true, true, w, w));
      push(say.yesNoFeedback(false, true, w, w));
      void i;
    });
  }
  (Object.keys(chunks) as ChunkId[]).forEach((id) => push([...say.chunkIntro(id, true), ...say.chunkIntro(id, false)]));
  push([say.bookFirst, say.bookNext, say.read(), say.likeAsk(), ...say.praise, ...say.celebrate(3), ...say.celebrate(2), say.greetingFirst, say.greetingBack, say.regionDone, say.sleep]);
  const seen = new Set<string>();
  return out.filter((l) => (seen.has(l.id) ? false : (seen.add(l.id), true)));
}
