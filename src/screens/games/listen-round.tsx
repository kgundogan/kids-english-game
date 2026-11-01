import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Chunky } from '@/components/chunky';
import { SpeakerIcon } from '@/components/icons';
import { WordTile, type TileState } from '@/components/word-tile';
import { say } from '@/content/lines';
import type { Word } from '@/content/regions';
import { speak } from '@/lib/voice';
import { useProgress } from '@/state/progress';
import { colors, type } from '@/theme';

/**
 * Dinle-bul: Pofi kelimeyi söyler, çocuk doğru resme dokunur. Önce kulak, yazı yok.
 * Doğruda "Yes!" + yeşil işaret, yanlışta "No." + kırmızı işaret: çocuk Yes/No'yu bu tekrarla edinir.
 * useAlt: hedef kelime farklı bir görselle gelir (kavramı mı ezberi mi bildiğini ölçer).
 */
export function ListenRound({
  word,
  options,
  useAlt = false,
  showText = false,
  onDone,
}: {
  word: Word;
  options: Word[];
  useAlt?: boolean;
  /** Okuma turu: ses yok, yazı var (7+) */
  showText?: boolean;
  onDone: (mistakes: number) => void;
}) {
  const { recordAnswer } = useProgress();
  const [states, setStates] = useState<Record<string, TileState>>({});
  const mistakes = useRef(0);
  const finished = useRef(false);
  const { width } = useWindowDimensions();
  const tile = Math.min(150, Math.max(96, (Math.min(width, 720) - 64) / Math.min(options.length, 4) - 12));
  const alt = useAlt && !!word.altPicture;

  useEffect(() => {
    mistakes.current = 0;
    finished.current = false;
    setStates({});
    if (showText) speak(say.read());
    else speak(say.ask(word));
  }, [word, showText]);

  const pick = async (w: Word) => {
    if (finished.current) return;
    if (w.id === word.id) {
      finished.current = true;
      setStates((s) => ({ ...s, [w.id]: 'right' }));
      recordAnswer(word.id, mistakes.current === 0, showText ? 'read' : 'listen', { alsoAlt: alt });
      await speak(say.right(word));
      onDone(mistakes.current);
    } else {
      mistakes.current += 1;
      setStates((s) => ({ ...s, [w.id]: 'wrong' }));
      setTimeout(() => setStates((s) => ({ ...s, [w.id]: 'faded' })), 700);
      await speak(showText ? [say.wrong(w, word)[0], say.wrong(w, word)[1]] : say.wrong(w, word));
    }
  };

  return (
    <View style={styles.wrap}>
      {showText ? (
        <View style={styles.readCard}>
          <Text style={[type.hero, { color: colors.ink, fontSize: 52, lineHeight: 60 }]}>{word.en}</Text>
        </View>
      ) : (
        <>
          <Chunky tone="lagoon" onPress={() => speak(say.wordSlow(word))} accessibilityLabel="Kelimeyi tekrar dinle" round={60} depth={8} faceStyle={styles.ear}>
            <SpeakerIcon size={56} color={colors.white} />
          </Chunky>
          <Text style={[type.label, { color: colors.inkSoft }]}>Dinle ve doğru resme dokun</Text>
        </>
      )}
      <View style={styles.grid}>
        {options.map((o) => (
          <WordTile
            key={o.id}
            picture={o.id === word.id && alt ? word.altPicture! : o.picture}
            size={tile}
            state={states[o.id] ?? 'idle'}
            onPress={() => pick(o)}
            accessibilityLabel="Seçenek"
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 16 },
  ear: { width: 112, height: 112, paddingHorizontal: 0 },
  readCard: { backgroundColor: colors.paper, borderRadius: 24, paddingHorizontal: 36, paddingVertical: 10, borderWidth: 3, borderColor: colors.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center', marginTop: 8 },
});
