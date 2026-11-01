import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Paper } from '@/components/chunky';
import { TopBar } from '@/components/top-bar';
import { WordTile } from '@/components/word-tile';
import { regions } from '@/content/regions';
import { say } from '@/content/lines';
import { speak } from '@/lib/voice';
import { useProgress } from '@/state/progress';
import { colors, type } from '@/theme';

/** Kelime hazinesi: toplanan her kelime bir koleksiyon kartı. */
export default function Album() {
  const { progress } = useProgress();
  const open = regions.filter((r) => !r.locked);
  const total = open.reduce((n, r) => n + r.words.length, 0);
  const have = open.reduce((n, r) => n + r.words.filter((w) => progress.words[w.id]?.collected).length, 0);

  return (
    <LinearGradient colors={['#FFF4D6', colors.sand]} style={{ flex: 1 }}>
      <TopBar title="Albümüm" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[type.body, { color: colors.inkSoft, textAlign: 'center' }]}>
          {have} / {total} kart topladın. Bir karta dokun, adını duy.
        </Text>
        {open.map((r) => (
          <Paper key={r.id} style={styles.page} round={28}>
            <Text style={[type.title, { color: colors.ink }]}>
              {r.emoji} {r.name}
            </Text>
            <View style={styles.grid}>
              {r.words.map((w) => {
                const got = progress.words[w.id]?.collected;
                return got ? (
                  <WordTile key={w.id} picture={w.picture} label={w.en} size={104} tone={r.tone} onPress={() => speak(say.word(w))} />
                ) : (
                  <WordTile key={w.id} picture="❔" label="?" size={104} accessibilityLabel="Henüz toplanmadı" />
                );
              })}
            </View>
          </Paper>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48, gap: 16, width: '100%', maxWidth: 820, alignSelf: 'center' },
  page: { padding: 16, gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
});
