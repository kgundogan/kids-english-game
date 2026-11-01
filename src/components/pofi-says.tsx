import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Chunky } from '@/components/chunky';
import { SpeakerIcon } from '@/components/icons';
import { Pofi, type PofiMood } from '@/components/pofi';
import { sayTurkish } from '@/lib/voice';
import { useProgress } from '@/state/progress';
import { colors, radius, type } from '@/theme';

/** Pofi + konuşma balonu. Yazı okuma bilmeyen çocuk için balon sesli de okunur. */
export function PofiSays({
  text,
  mood = 'happy',
  size = 110,
  autoSpeak = true,
}: {
  text: string;
  mood?: PofiMood;
  size?: number;
  autoSpeak?: boolean;
}) {
  const { companionLevel } = useProgress();

  useEffect(() => {
    if (autoSpeak && text) sayTurkish(text);
  }, [text, autoSpeak]);

  return (
    <View style={styles.row}>
      <Pofi size={size} mood={mood} level={companionLevel} />
      <View style={styles.bubbleWrap}>
        <View style={styles.tail} />
        <View style={styles.bubble}>
          <Text style={[type.body, { color: colors.ink, flex: 1 }]}>{text}</Text>
          <Chunky accessibilityLabel="Tekrar dinle" onPress={() => sayTurkish(text)} round={16} depth={4} faceStyle={styles.speak}>
            <SpeakerIcon size={22} />
          </Chunky>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bubbleWrap: { flex: 1, justifyContent: 'center' },
  bubble: {
    backgroundColor: colors.paper,
    borderRadius: radius.m,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 3,
    borderColor: colors.ink,
  },
  tail: {
    position: 'absolute',
    left: -9,
    top: '50%',
    marginTop: -9,
    width: 18,
    height: 18,
    backgroundColor: colors.paper,
    borderLeftWidth: 3,
    borderBottomWidth: 3,
    borderColor: colors.ink,
    transform: [{ rotate: '45deg' }],
    zIndex: 1,
  },
  speak: { minHeight: 44, minWidth: 44, paddingHorizontal: 8, paddingVertical: 6 },
});
