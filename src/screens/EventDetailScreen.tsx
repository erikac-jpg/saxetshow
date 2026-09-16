import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { Event } from '../db/types';
import { colors } from '../theme/colors';
import { displayFont } from '../theme/fonts';

function formatEventDate(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function EventDetailScreen({
  event,
  onBack,
}: {
  event: Event;
  onBack: () => void;
}) {
  const handleRequestTables = () => {
    Alert.alert(
      'Thanks for your interest!',
      'We’ll be in touch! A staff member will follow up about your table request.'
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.promo}>
        <Pressable onPress={onBack} style={styles.backButton} hitSlop={12}>
          <Text style={styles.backButtonText}>‹ Back</Text>
        </Pressable>
        {event.image ? (
          <Image source={{ uri: event.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <Text style={styles.promoStar}>★</Text>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{event.name}</Text>
        <Text style={styles.date}>{formatEventDate(event.date)}</Text>
        {event.location ? <Text style={styles.location}>📍 {event.location}</Text> : null}
        {event.description ? <Text style={styles.description}>{event.description}</Text> : null}

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>VENDOR INFO</Text>
        <Text style={styles.sectionBody}>
          Interested in setting up a booth at this show? Let us know and our team will follow up
          with table pricing and availability.
        </Text>

        <Pressable
          style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]}
          onPress={handleRequestTables}
        >
          <Text style={styles.ctaButtonText}>I’m Interested — Request Tables</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  promo: {
    height: 240,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 6,
    borderBottomColor: colors.red,
    overflow: 'hidden',
  },
  promoStar: {
    fontSize: 96,
    color: colors.white,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  backButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  content: {
    padding: 24,
  },
  title: {
    fontFamily: displayFont,
    fontSize: 34,
    color: colors.navy,
    marginBottom: 10,
  },
  date: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.red,
    marginBottom: 6,
  },
  location: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 14,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  divider: {
    height: 2,
    backgroundColor: colors.divider,
    marginVertical: 26,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.navy,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  sectionBody: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    marginBottom: 22,
  },
  ctaButton: {
    backgroundColor: colors.red,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  ctaButtonPressed: {
    opacity: 0.85,
  },
  ctaButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
