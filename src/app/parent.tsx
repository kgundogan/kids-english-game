import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Chunky, Paper } from '@/components/chunky';
import { SpeakerIcon } from '@/components/icons';
import { TopBar } from '@/components/top-bar';
import { say } from '@/content/lines';
import { allWords, type Word } from '@/content/regions';
import { speak } from '@/lib/voice';
import { masteryOf, masteryTypes, useProgress, type AgeBand, type Mastery, type TestType } from '@/state/progress';
import { colors, fonts, type } from '@/theme';

const LIMITS = [10, 15, 20, 30];
const BANDS: { id: AgeBand; label: string; note: string }[] = [
  { id: 'small', label: '5–6 yaş', note: 'Okuma yok: her şey ses ve resimle.' },
  { id: 'mid', label: '7–8 yaş', note: 'Okumaya giriş: bölüm sonunda yazıyı okuyup resmini bulur.' },
  { id: 'big', label: '9–10 yaş', note: 'Daha çok seçenek ve okuma.' },
];

const masteryLabel: Record<Mastery, { text: string; color: string }> = {
  new: { text: 'Henüz yok', color: '#9AA9BA' },
  met: { text: 'Tanıştı', color: colors.lagoonDeep },
  practicing: { text: 'Pekişiyor', color: colors.sunDeep },
  learned: { text: 'Öğrendi', color: colors.leafDeep },
};

const testLabel: Record<TestType, string> = {
  listen: 'duyunca tanıdı',
  yesno: 'evet/hayır ile ayırt etti',
  find: 'sahnede buldu',
  match: 'sesle eşleştirdi',
  speak: 'kendisi söyledi',
  read: 'yazıyı okudu',
  chunk: 'kalıp içinde kullandı',
  alt: 'farklı resimde de tanıdı',
  parent: 'size söyledi',
};

const TIPS = [
  'Türkçe çevirisini sormayın ("cow ne demek?"). Resmi, oyuncağı ya da hayvanı gösterip "What’s this?" diye sorun.',
  'Yanlış söylerse düzeltmeyin; doğrusunu siz sevinçle tekrar edin: "Yes! Cow!" Çocuk duyarak düzeltir.',
  'Türkçe cevap verirse sorun değil. İngilizcesini siz söyleyin, o tekrar etsin.',
  'Günde 2–3 kısa an yeter: yemekte, banyoda, yolda. Uzun "ders" yapmayın.',
];

function lastNDays(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d.toISOString().slice(0, 10);
  });
}

/** Veli köşesi: kelimeyi nasıl söyleyeceğini ve çocuğa nasıl soracağını gösterir; velinin duyduğu da sayılır. */
function WordCoach({ word }: { word: Word }) {
  const { progress, recordAnswer } = useProgress();
  const stat = progress.words[word.id];
  const m = masteryOf(stat);
  const types = masteryTypes(stat);
  const [heard, setHeard] = useState(false);

  return (
    <View style={styles.coach}>
      <View style={styles.coachRow}>
        <Chunky tone="lagoon" depth={4} round={14} faceStyle={styles.coachBtn} onPress={() => speak(say.word(word))} accessibilityLabel="Normal hızda dinle">
          <SpeakerIcon size={18} color={colors.white} />
          <Text style={[type.label, { color: colors.white }]}>Normal</Text>
        </Chunky>
        <Chunky tone="paper" depth={4} round={14} faceStyle={styles.coachBtn} onPress={() => speak(say.syllables(word))} accessibilityLabel="Yavaş dinle">
          <Text style={{ fontSize: 16 }}>🐢</Text>
          <Text style={[type.label, { color: colors.ink }]}>Yavaş</Text>
        </Chunky>
      </View>
      <Text style={[type.small, { color: colors.ink }]}>
        Okunuşu: <Text style={{ fontFamily: fonts.bold }}>{word.trSay}</Text>
        {word.syllables ? `  ·  vurgu büyük harfli hecede: ${word.syllables}` : ''}
      </Text>

      <Text style={[styles.h3, { marginTop: 4 }]}>Çocuğa nasıl sorarsınız</Text>
      {say.parentQuestions(word).map((q) => (
        <Pressable key={q.en.id} onPress={() => speak(q.en)} style={styles.question} accessibilityRole="button" accessibilityLabel={`${q.en.text}, dinle`}>
          <SpeakerIcon size={16} color={colors.lagoonDeep} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[type.label, { color: colors.ink }]}>{q.en.text}</Text>
            <Text style={[type.small, { color: colors.inkSoft }]}>{q.tr}</Text>
          </View>
        </Pressable>
      ))}

      <Text style={[type.small, { color: colors.inkSoft }]}>
        Durum: <Text style={{ color: masteryLabel[m].color, fontFamily: fonts.bold }}>{masteryLabel[m].text}</Text>
        {types.length ? ` — ${types.map((t) => testLabel[t]).join(', ')}.` : ''}
      </Text>

      {heard ? (
        <Text style={[type.label, { color: colors.leafDeep }]}>Kaydedildi. Teşekkürler!</Text>
      ) : (
        <Chunky
          tone="leaf"
          depth={4}
          round={14}
          label={`Çocuğum "${word.en}" dedi`}
          onPress={() => {
            recordAnswer(word.id, true, 'parent');
            setHeard(true);
          }}
          style={{ alignSelf: 'flex-start' }}
        />
      )}
    </View>
  );
}

/**
 * Veli alanı (MVP). Asıl veli paneli Faz 1'de web'de olacak; bu ekran aynı verinin
 * cihaz içi özetini, veli köşesini ve ayarları verir. Rapor dili sade Türkçe ve eyleme dönük.
 */
export default function Parent() {
  const { progress, setDailyLimit, setAgeBand, grantBonus, reset, secondsLeft } = useProgress();
  const [confirmReset, setConfirmReset] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const days = lastNDays(7);
  const week = days.map((d) => progress.days[d] ?? { seconds: 0, correct: 0, wrong: 0, spoken: 0 });
  const minutes = Math.round(week.reduce((n, d) => n + d.seconds, 0) / 60);
  const spoken = week.reduce((n, d) => n + d.spoken, 0);
  const maxSec = Math.max(60, ...week.map((d) => d.seconds));

  const words = allWords();
  const by = (m: Mastery) => words.filter((w) => masteryOf(progress.words[w.id]) === m);
  const learned = by('learned');
  const practicing = by('practicing');
  const met = by('met');
  const focus = practicing[0] ?? met[0];

  const note =
    learned.length + practicing.length + met.length === 0
      ? 'Henüz oynamaya başlamadı. İlk gün yanında oturup birlikte oynamak, çocuğun oyuna ısınmasını kolaylaştırır.'
      : [
          learned.length ? `${learned.map((w) => w.en).join(', ')} kelimelerini öğrendi: farklı oyunlarda ve farklı günlerde doğru bildi, kendisi de söyledi.` : '',
          practicing.length ? `${practicing.map((w) => w.en).join(', ')} pekişiyor; oyun ${practicing.length > 1 ? 'bunları' : 'bunu'} farklı yollarla tekrar soracak.` : '',
          met.length ? `${met.map((w) => w.en).join(', ')} ile yeni tanıştı.` : '',
          focus ? `Bu akşam ${focus.en} için aşağıdaki veli köşesine bakın ve evde bir kez "Where is the ${focus.en}?" diye sorun.` : '',
        ]
          .filter(Boolean)
          .join(' ');

  const dayLetters = ['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'];

  return (
    <View style={{ flex: 1, backgroundColor: '#F3F7F9' }}>
      <TopBar title="Veli alanı" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.block}>
          <Text style={styles.h2}>Bu hafta</Text>
          <Text style={[type.body, { color: colors.ink }]}>{note}</Text>
        </View>

        <View style={styles.stats}>
          <Stat value={String(learned.length)} label="Öğrendi" color={colors.leafDeep} />
          <Stat value={String(practicing.length)} label="Pekişiyor" color={colors.sunDeep} />
          <Stat value={String(spoken)} label="İngilizce konuştu" color={colors.sea} />
          <Stat value={`${minutes} dk`} label="Bu hafta oyun" color={colors.sea} />
        </View>

        <View style={styles.block}>
          <Text style={styles.h2}>“Öğrendi” ne demek?</Text>
          <Text style={[type.small, { color: colors.inkSoft }]}>
            Bir kelime ancak en az 4 farklı yoldan (duyunca tanıma, evet/hayır, sahnede bulma, farklı resimde tanıma, kendisi söyleme…) ilk denemede doğru
            bilinince, en az 2 farklı günde ve en az bir kez kendisi söyleyince “öğrendi” sayılır. Ezberlediği bir resmi değil, kelimeyi bildiğini böyle anlıyoruz.
          </Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.h2}>Veli köşesi</Text>
          <Text style={[type.small, { color: colors.inkSoft }]}>Bir kelimeye dokunun: nasıl söylendiğini dinleyin ve çocuğa evde nasıl soracağınızı görün.</Text>
          {words.map((w) => {
            const s = progress.words[w.id];
            const m = masteryOf(s);
            const isOpen = open === w.id;
            return (
              <View key={w.id} style={styles.wordBlock}>
                <Pressable onPress={() => setOpen(isOpen ? null : w.id)} style={styles.wordRow} accessibilityRole="button" accessibilityState={{ expanded: isOpen }}>
                  <Text style={{ fontSize: 24 }}>{w.picture}</Text>
                  <Text style={[styles.wordEn, m === 'new' && { color: '#9AA9BA' }]}>{w.en}</Text>
                  <View style={[styles.pill, { borderColor: masteryLabel[m].color }]}>
                    <Text style={[type.small, { color: masteryLabel[m].color, fontFamily: fonts.bold }]}>{masteryLabel[m].text}</Text>
                  </View>
                  <Text style={[type.label, { color: colors.inkSoft, marginLeft: 'auto' }]}>{isOpen ? '▲' : '▼'}</Text>
                </Pressable>
                {isOpen && <WordCoach word={w} />}
              </View>
            );
          })}
        </View>

        <View style={styles.block}>
          <Text style={styles.h2}>Evde nasıl yardım edersiniz</Text>
          {TIPS.map((t) => (
            <Text key={t} style={[type.small, { color: colors.ink }]}>
              • {t}
            </Text>
          ))}
        </View>

        <View style={styles.block}>
          <Text style={styles.h2}>Günlük süre</Text>
          <View style={styles.bars}>
            {week.map((d, i) => (
              <View key={days[i]} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View style={[styles.bar, { height: `${Math.max(4, (d.seconds / maxSec) * 100)}%` }]} />
                </View>
                <Text style={styles.barLabel}>{dayLetters[new Date(days[i]).getDay()]}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.block}>
          <Text style={styles.h2}>Ayarlar</Text>
          <Text style={[type.small, { color: colors.inkSoft }]}>Çocuğun yaşı (oyunlar buna göre ayarlanır)</Text>
          <View style={styles.chips}>
            {BANDS.map((b) => (
              <Pressable
                key={b.id}
                onPress={() => setAgeBand(b.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: progress.ageBand === b.id }}
                style={[styles.chip, progress.ageBand === b.id && styles.chipOn]}
              >
                <Text style={[type.label, { color: progress.ageBand === b.id ? colors.white : colors.ink }]}>{b.label}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[type.small, { color: colors.inkSoft }]}>{BANDS.find((b) => b.id === progress.ageBand)?.note}</Text>

          <Text style={[type.small, { color: colors.inkSoft, marginTop: 8 }]}>Günlük oyun süresi (süre dolunca Pofi uyur, oyun nazikçe biter)</Text>
          <View style={styles.chips}>
            {LIMITS.map((m) => (
              <Pressable
                key={m}
                onPress={() => setDailyLimit(m)}
                accessibilityRole="radio"
                accessibilityState={{ selected: progress.dailyLimitMin === m }}
                style={[styles.chip, progress.dailyLimitMin === m && styles.chipOn]}
              >
                <Text style={[type.label, { color: progress.dailyLimitMin === m ? colors.white : colors.ink }]}>{m} dk</Text>
              </Pressable>
            ))}
          </View>
          <Text style={[type.small, { color: colors.inkSoft }]}>Bugün kalan: {Math.ceil(secondsLeft / 60)} dk</Text>
          <Chunky tone="lagoon" label="Bugüne 10 dk ekle" onPress={() => grantBonus(10)} style={{ alignSelf: 'flex-start' }} />
        </View>

        <View style={styles.block}>
          <Text style={styles.h2}>Gizlilik</Text>
          <Text style={[type.small, { color: colors.inkSoft }]}>
            Ses kaydı saklanmaz; konuşma yalnızca o anda metne çevrilir. İlerleme bilgileri şimdilik sadece bu cihazda tutulur. Uygulamada reklam ve
            çocuklar arası mesajlaşma yoktur.
          </Text>
          {confirmReset ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Chunky tone="paper" label="Vazgeç" onPress={() => setConfirmReset(false)} />
              <Chunky
                tone="berry"
                label="Evet, sıfırla"
                onPress={() => {
                  reset();
                  setConfirmReset(false);
                }}
              />
            </View>
          ) : (
            <Chunky tone="paper" label="İlerlemeyi sıfırla" onPress={() => setConfirmReset(true)} style={{ alignSelf: 'flex-start' }} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <Paper style={styles.stat} round={18} depth={4}>
      <Text style={{ fontFamily: fonts.black, fontSize: 30, lineHeight: 34, color }}>{value}</Text>
      <Text style={[type.small, { color: colors.inkSoft }]}>{label}</Text>
    </Paper>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48, gap: 16, width: '100%', maxWidth: 760, alignSelf: 'center' },
  block: { backgroundColor: colors.white, borderRadius: 18, padding: 16, gap: 10 },
  h2: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 24, color: colors.ink },
  h3: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 20, color: colors.ink },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { padding: 12, minWidth: 150, flexGrow: 1 },
  bars: { flexDirection: 'row', gap: 10, height: 120, alignItems: 'flex-end' },
  barCol: { flex: 1, alignItems: 'center', gap: 4, height: '100%' },
  barTrack: { flex: 1, width: '70%', justifyContent: 'flex-end', backgroundColor: '#EEF3F6', borderRadius: 8, overflow: 'hidden' },
  bar: { width: '100%', backgroundColor: colors.lagoon, borderRadius: 8 },
  barLabel: { fontFamily: fonts.regular, fontSize: 13, color: colors.inkSoft },
  wordBlock: { borderTopWidth: 1, borderColor: '#E5ECF1' },
  wordRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 },
  wordEn: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink, width: 86 },
  pill: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 8 },
  coach: { gap: 8, paddingBottom: 14, paddingLeft: 4 },
  coachRow: { flexDirection: 'row', gap: 10 },
  coachBtn: { flexDirection: 'row', gap: 6, minHeight: 44, paddingVertical: 6, paddingHorizontal: 14 },
  question: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: '#F3F7F9', borderRadius: 12, padding: 10 },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 2, borderColor: '#D3DEE6', minHeight: 44, justifyContent: 'center' },
  chipOn: { backgroundColor: colors.sea, borderColor: colors.sea },
});
