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

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>BECOME A VENDOR</Text>
        <View style={styles.stepsList}>
          <VendorStep number={1} label="Reserve a table" />
          <VendorStep number={2} label="Sign the vendor agreement" />
          <VendorStep number={3} label="Set up and sell" />
        </View>
      </View>
    </ScrollView>
  );
}

function VendorStep({ number, label }: { number: number; label: string }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>
      <Text style={styles.stepLabel}>{label}</Text>
    </View>
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
    borderBottomColor: colors.brass,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  backButtonText: {
    color: colors.white,
    fontSize: 16,
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
    fontSize: 17,
    lineHeight: 25,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 8,
  },
  location: {
    fontSize: 17,
    lineHeight: 25,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  description: {
    fontSize: 17,
    lineHeight: 26,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  divider: {
    height: 2,
    backgroundColor: colors.divider,
    marginVertical: 26,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.navy,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  sectionBody: {
    fontSize: 17,
    lineHeight: 26,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  ctaButton: {
    backgroundColor: colors.brass,
    borderRadius: 12,
    paddingVertical: 20,
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
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  stepsList: {
    marginTop: 4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepNumber: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  stepLabel: {
    flex: 1,
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
