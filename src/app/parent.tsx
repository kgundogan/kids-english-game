import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Chunky, Paper } from '@/components/chunky';
import { TopBar } from '@/components/top-bar';
import { regions } from '@/content/regions';
import { useProgress } from '@/state/progress';
import { colors, fonts, type } from '@/theme';

const LIMITS = [10, 15, 20, 30];

function lastNDays(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d.toISOString().slice(0, 10);
  });
}

/**
 * Veli alanı (MVP). Asıl veli paneli Faz 1'de web'de olacak; bu ekran aynı verinin
 * cihaz içi özetini ve ayarlarını verir. Rapor dili sade Türkçe ve eyleme dönük.
 */
export default function Parent() {
  const { progress, setDailyLimit, grantBonus, reset, secondsLeft } = useProgress();
  const [confirmReset, setConfirmReset] = useState(false);

  const days = lastNDays(7);
  const week = days.map((d) => progress.days[d] ?? { seconds: 0, correct: 0, wrong: 0, spoken: 0 });
  const minutes = Math.round(week.reduce((n, d) => n + d.seconds, 0) / 60);
  const correct = week.reduce((n, d) => n + d.correct, 0);
  const wrong = week.reduce((n, d) => n + d.wrong, 0);
  const spoken = week.reduce((n, d) => n + d.spoken, 0);
  const accuracy = correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 100) : null;
  const maxSec = Math.max(60, ...week.map((d) => d.seconds));

  const allWords = regions.flatMap((r) => r.words);
  const learned = allWords.filter((w) => progress.words[w.id]?.collected);
  const strong = allWords.filter((w) => (progress.words[w.id]?.strength ?? 0) >= 3);
  const weak = allWords.filter((w) => {
    const s = progress.words[w.id];
    return s && s.seen > 1 && (s.strength <= 1 || s.wrong > s.correct);
  });

  const note =
    learned.length === 0
      ? 'Henüz oynamaya başlamadı. İlk gün birlikte oynamak, çocuğun oyuna ısınmasını kolaylaştırır.'
      : `Bu hafta ${learned.length} kelimeyle tanıştı${spoken ? ` ve ${spoken} kez İngilizce konuştu` : ''}. ` +
        (strong.length ? `${strong.map((w) => w.en).join(', ')} kelimelerinde rahat. ` : '') +
        (weak.length ? `${weak.map((w) => w.en).join(', ')} biraz daha tekrar istiyor; oyun bunları otomatik olarak daha sık getirecek. ` : '') +
        `Akşam yemeğinde ona “What’s your favorite animal?” diye sorun ve cevabını İngilizce vermesini bekleyin.`;

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
          <Stat value={`${minutes} dk`} label="Oyun süresi" />
          <Stat value={String(learned.length)} label="Tanıştığı kelime" />
          <Stat value={String(spoken)} label="Konuşarak bildiği" />
          <Stat value={accuracy === null ? '—' : `%${accuracy}`} label="İlk denemede doğru" />
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
          <Text style={styles.h2}>Kelime haritası</Text>
          <View style={styles.words}>
            {allWords.map((w) => {
              const s = progress.words[w.id];
              const level = !s?.collected ? 0 : Math.min(5, s.strength);
              return (
                <View key={w.id} style={styles.wordRow}>
                  <Text style={{ fontSize: 22 }}>{w.picture}</Text>
                  <Text style={[styles.wordEn, !s?.collected && { color: '#9AA9BA' }]}>{w.en}</Text>
                  <View style={styles.meter}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <View key={n} style={[styles.meterCell, n <= level && { backgroundColor: level >= 3 ? colors.leaf : colors.sun }]} />
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.block}>
          <Text style={styles.h2}>Ayarlar</Text>
          <Text style={[type.small, { color: colors.inkSoft }]}>Günlük oyun süresi (süre dolunca Pofi uyur, oyun nazikçe biter)</Text>
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

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <Paper style={styles.stat} round={18} depth={4}>
      <Text style={{ fontFamily: fonts.black, fontSize: 30, lineHeight: 34, color: colors.sea }}>{value}</Text>
      <Text style={[type.small, { color: colors.inkSoft }]}>{label}</Text>
    </Paper>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48, gap: 16, width: '100%', maxWidth: 760, alignSelf: 'center' },
  block: { backgroundColor: colors.white, borderRadius: 18, padding: 16, gap: 10 },
  h2: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 24, color: colors.ink },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { padding: 12, minWidth: 150, flexGrow: 1 },
  bars: { flexDirection: 'row', gap: 10, height: 120, alignItems: 'flex-end' },
  barCol: { flex: 1, alignItems: 'center', gap: 4, height: '100%' },
  barTrack: { flex: 1, width: '70%', justifyContent: 'flex-end', backgroundColor: '#EEF3F6', borderRadius: 8, overflow: 'hidden' },
  bar: { width: '100%', backgroundColor: colors.lagoon, borderRadius: 8 },
  barLabel: { fontFamily: fonts.regular, fontSize: 13, color: colors.inkSoft },
  words: { gap: 6 },
  wordRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wordEn: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink, width: 90 },
  meter: { flexDirection: 'row', gap: 4 },
  meterCell: { width: 22, height: 10, borderRadius: 5, backgroundColor: '#E5ECF1' },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 2, borderColor: '#D3DEE6', minHeight: 44, justifyContent: 'center' },
  chipOn: { backgroundColor: colors.sea, borderColor: colors.sea },
});
