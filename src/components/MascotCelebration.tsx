import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { displayFont } from '../theme/fonts';
import { getCurrentSeason, SEASON_LABEL } from '../util/season';
import MascotIcon from './mascots/MascotIcon';

const SEASON_GREETING: Record<ReturnType<typeof getCurrentSeason>, string> = {
  deer: 'Good luck out there this deer season.',
  turkey: 'Good luck out there this spring turkey season.',
  hog: 'Good luck out there this hog season.',
  dove: 'Good luck out there this dove season.',
};

export default function MascotCelebration({
  visible,
  eventName,
  onDismiss,
}: {
  visible: boolean;
  eventName: string;
  onDismiss: () => void;
}) {
  const season = getCurrentSeason();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.scrim}>
        <View style={styles.card}>
          <View style={styles.medallion}>
            <View style={styles.medallionRing} />
            <MascotIcon season={season} size={92} />
          </View>
          <Text style={styles.title}>See you at the show!</Text>
          <Text style={styles.body}>
            Your table request for {eventName} has been sent to our staff.
          </Text>
          <Text style={styles.greeting}>{SEASON_GREETING[season]}</Text>
          <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={onDismiss}>
            <Text style={styles.buttonText}>Got it</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(12,45,87,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  medallion: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.navy,
    borderWidth: 4,
    borderColor: colors.flagRed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  medallionRing: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    borderRadius: 60,
    borderWidth: 1.5,
    borderColor: colors.flagRed,
    opacity: 0.85,
  },
  title: {
    fontFamily: displayFont,
    fontSize: 28,
    color: colors.navy,
    textAlign: 'center',
    marginBottom: 10,
  },
  body: {
    fontSize: 16,
    lineHeight: 23,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  greeting: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 22,
  },
  button: {
    backgroundColor: colors.flagRed,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 36,
    minHeight: 52,
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
