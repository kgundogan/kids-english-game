/**
 * Pofi'nin tüm cümlelerini ElevenLabs ile seslendirir ve uygulamaya bağlar.
 *
 *   ELEVENLABS_API_KEY=...  ELEVENLABS_VOICE_ID=...  npx tsx scripts/generate-voice.ts
 *
 * - Satırlar src/content/lines.ts → allLines() listesinden gelir (tek kaynak).
 * - Her satır assets/voice/<kimlik>.mp3 olarak kaydedilir; var olan dosyalar atlanır,
 *   yani metin değişmedikçe tekrar para harcanmaz. Hepsini yenilemek için: --force
 * - Sonunda src/content/voice-manifest.ts yeniden yazılır; uygulama dosyası olan satırı
 *   ElevenLabs sesiyle, olmayanı cihaz sesiyle çalar.
 * - Seçenekler: --dry (sadece listele ve karakter say), --limit=20 (deneme için ilk N satır)
 *
 * Ses önerisi: hem Türkçe hem İngilizce doğal konuşan, sıcak, net bir ses (Voice Library'de
 * "Turkish" + "warm/friendly" filtresi). Aynı ses iki dilde konuşursa çocuk tek bir öğretmen duyar.
 */
import fs from 'node:fs';
import path from 'node:path';

import { allLines, type Line } from '../src/content/lines';

const args = new Set(process.argv.slice(2));
const DRY = args.has('--dry');
const FORCE = args.has('--force');
const limitArg = [...args].find((a) => a.startsWith('--limit='));
const LIMIT = limitArg ? Number(limitArg.split('=')[1]) : Infinity;

const KEY = process.env.ELEVENLABS_API_KEY;
const VOICE = process.env.ELEVENLABS_VOICE_ID;
const MODEL = process.env.ELEVENLABS_MODEL ?? 'eleven_v4';
const OUT_DIR = path.resolve('assets/voice');
const MANIFEST = path.resolve('src/content/voice-manifest.ts');

/** Yavaş satırlar: v4'te hız ayarı yok, tempoyu noktalama ve etiketle veriyoruz. */
function textFor(l: Line) {
  if (!l.slow) return l.text;
  const plain = l.text.replace(/\[[^\]]*\]\s*/g, '');
  return `[slowly, clearly] ${plain}`;
}

async function synth(l: Line): Promise<Buffer> {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': KEY!, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({
      text: textFor(l),
      model_id: MODEL,
      language_code: l.lang,
      // Çocuk öğretmeni: tutarlı ama canlı
      voice_settings: { stability: 0.55, similarity_boost: 0.8 },
    }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

function writeManifest() {
  const files = fs.existsSync(OUT_DIR) ? fs.readdirSync(OUT_DIR).filter((f) => f.endsWith('.mp3')).sort() : [];
  const body = files.map((f) => `  '${f.replace(/\.mp3$/, '')}': require('../../assets/voice/${f}'),`).join('\n');
  fs.writeFileSync(
    MANIFEST,
    `// Bu dosya scripts/generate-voice.ts tarafından üretilir. Elle düzenlemeyin.\n` +
      `// Satır kimliği → ElevenLabs ses dosyası. Boşken uygulama cihaz sesini kullanır.\n\n` +
      `export const voiceClips: Record<string, number> = {\n${body}\n};\n`,
  );
  console.log(`voice-manifest.ts: ${files.length} ses dosyası bağlandı`);
}

async function main() {
  const lines = allLines().slice(0, LIMIT);
  const chars = lines.reduce((n, l) => n + textFor(l).length, 0);
  console.log(`${lines.length} satır, yaklaşık ${chars} karakter (${lines.filter((l) => l.lang === 'tr').length} Türkçe, ${lines.filter((l) => l.lang === 'en').length} İngilizce)`);
  if (DRY) {
    lines.slice(0, 40).forEach((l) => console.log(`${l.id}\t${l.lang}\t${textFor(l)}`));
    return;
  }
  if (!KEY || !VOICE) {
    console.error('ELEVENLABS_API_KEY ve ELEVENLABS_VOICE_ID gerekli.');
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  let made = 0;
  for (const l of lines) {
    const file = path.join(OUT_DIR, `${l.id}.mp3`);
    if (!FORCE && fs.existsSync(file)) continue;
    try {
      fs.writeFileSync(file, await synth(l));
      made++;
      process.stdout.write(`\r${made} yeni dosya`);
    } catch (e) {
      console.error(`\n${l.id} (${l.text}): ${(e as Error).message}`);
      if (String(e).includes('401') || String(e).includes('quota')) break;
    }
  }
  console.log('');
  writeManifest();
}

main();
