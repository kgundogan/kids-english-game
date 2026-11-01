import * as Speech from 'expo-speech';

// Başlangıçta cihazın kendi seslendirmesi; ana karakterler için ileride
// AI seslendirme / gerçek seslendirmen dosyalarıyla değişecek (yol haritası).

let enVoice: string | undefined;
let voicesLoaded = false;

async function pickVoice() {
  if (voicesLoaded) return;
  voicesLoaded = true;
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const en = voices.filter((v) => v.language?.toLowerCase().startsWith('en'));
    const preferred =
      en.find((v) => /samantha|google us english|aria|jenny|ava|enhanced/i.test(`${v.name} ${v.identifier}`)) ??
      en.find((v) => v.language === 'en-US') ??
      en[0];
    enVoice = preferred?.identifier;
  } catch {
    // ses listesi alınamazsa dil koduyla devam edilir
  }
}

/** İngilizce kelime/cümle: yavaş ve net, çocuk kulağına göre. */
export async function sayEnglish(text: string, opts: { slow?: boolean } = {}) {
  await pickVoice();
  Speech.stop();
  return new Promise<void>((resolve) => {
    // Ses motoru 'bitti' olayını göndermezse oyun takılmasın
    const guard = setTimeout(resolve, 1200 + text.length * 110);
    const done = () => {
      clearTimeout(guard);
      resolve();
    };
    Speech.speak(text, {
      language: 'en-US',
      voice: enVoice,
      rate: opts.slow ? 0.7 : 0.85,
      pitch: 1.1,
      onDone: done,
      onStopped: done,
      onError: done,
    });
  });
}

/** Pofi'nin Türkçe yönergesi (okuma bilmeyen 5–6 yaş için). */
export function sayTurkish(text: string) {
  Speech.stop();
  return new Promise<void>((resolve) => {
    const guard = setTimeout(resolve, 1200 + text.length * 90);
    const done = () => {
      clearTimeout(guard);
      resolve();
    };
    Speech.speak(text, {
      language: 'tr-TR',
      rate: 0.95,
      pitch: 1.15,
      onDone: done,
      onStopped: done,
      onError: done,
    });
  });
}

export const stopVoice = () => Speech.stop();

const praise = ['Great job!', 'Yes! Well done!', 'Super!', 'You did it!', 'Wow, amazing!'];
const retry = ['Try again!', 'Almost! One more time.', 'Listen again.'];
export const randomPraise = () => praise[Math.floor(Math.random() * praise.length)];
export const randomRetry = () => retry[Math.floor(Math.random() * retry.length)];
