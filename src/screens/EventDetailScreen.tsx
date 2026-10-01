import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '../auth/AuthContext';
import { createTableRequest, getTableRequestsForVendor } from '../db/supabase/tableRequests';
import type { Event, TableRequest } from '../db/types';
import FlagWatermark from '../components/FlagWatermark';
import MascotCelebration from '../components/MascotCelebration';
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

const STATUS_LABEL: Record<TableRequest['status'], string> = {
  pending: 'Pending staff approval',
  approved: 'Approved',
  denied: 'Denied',
};

export default function EventDetailScreen({
  event,
  onBack,
  onNeedVendorAccount,
}: {
  event: Event;
  onBack: () => void;
  /** Called when the visitor isn't signed in as a vendor yet (or has no vendor profile). The
   * caller is expected to route them through sign-in/profile creation and bring them back here. */
  onNeedVendorAccount: (event: Event) => void;
}) {
  const { session, vendor } = useAuth();
  const [existingRequest, setExistingRequest] = useState<TableRequest | null | undefined>(undefined);
  const [requesting, setRequesting] = useState(false);
  const [tablesWanted, setTablesWanted] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [showMascot, setShowMascot] = useState(false);

  useEffect(() => {
    let active = true;
    if (!vendor) {
      setExistingRequest(null);
      return;
    }
    getTableRequestsForVendor(vendor.id)
      .then((requests) => {
        if (!active) return;
        setExistingRequest(requests.find((r) => r.eventId === event.id) ?? null);
      })
      .catch(() => {
        if (active) setExistingRequest(null);
      });
    return () => {
      active = false;
    };
  }, [vendor, event.id]);

  const handlePressRequestTables = () => {
    if (!session || !vendor) {
      onNeedVendorAccount(event);
      return;
    }
    setRequesting(true);
  };

  const handleSubmitRequest = useCallback(async () => {
    if (!vendor) return;
    setSubmitting(true);
    try {
      const created = await createTableRequest({
        vendorId: vendor.id,
        eventId: event.id,
        tablesWanted,
      });
      setExistingRequest(created);
      setRequesting(false);
      setShowMascot(true);
    } catch (e) {
      Alert.alert(
        'Something went wrong',
        e instanceof Error ? e.message : 'Please try again in a moment.'
      );
    } finally {
      setSubmitting(false);
    }
  }, [vendor, event.id, tablesWanted]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.promo}>
        <Pressable onPress={onBack} style={styles.backButton} hitSlop={12}>
          <Text style={styles.backButtonText}>‹ Back</Text>
        </Pressable>
        {event.image ? (
          <Image source={{ uri: event.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <>
            <FlagWatermark />
            <Text style={styles.promoStar}>★</Text>
          </>
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

        {existingRequest === undefined ? (
          <ActivityIndicator color={colors.navy} />
        ) : existingRequest ? (
          <View style={styles.requestStatusCard}>
            <Text style={styles.requestStatusTitle}>
              You requested {existingRequest.tablesWanted}{' '}
              {existingRequest.tablesWanted === 1 ? 'table' : 'tables'}
            </Text>
            <Text style={styles.requestStatusBody}>{STATUS_LABEL[existingRequest.status]}</Text>
          </View>
        ) : requesting ? (
          <View style={styles.requestForm}>
            <Text style={styles.requestFormLabel}>How many tables?</Text>
            <View style={styles.stepperRow}>
              <Pressable
                style={styles.stepperButton}
                onPress={() => setTablesWanted((n) => Math.max(1, n - 1))}
                hitSlop={8}
              >
                <Text style={styles.stepperButtonText}>−</Text>
              </Pressable>
              <Text style={styles.stepperValue}>{tablesWanted}</Text>
              <Pressable
                style={styles.stepperButton}
                onPress={() => setTablesWanted((n) => Math.min(10, n + 1))}
                hitSlop={8}
              >
                <Text style={styles.stepperButtonText}>+</Text>
              </Pressable>
            </View>
            <Pressable
              style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]}
              onPress={handleSubmitRequest}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.ctaButtonText}>Submit Request</Text>
              )}
            </Pressable>
            <Pressable onPress={() => setRequesting(false)} hitSlop={8} style={styles.cancelLink}>
              <Text style={styles.cancelLinkText}>Cancel</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]}
            onPress={handlePressRequestTables}
          >
            <Text style={styles.ctaButtonText}>I’m Interested — Request Tables</Text>
          </Pressable>
        )}

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>BECOME A VENDOR</Text>
        <View style={styles.stepsList}>
          <VendorStep number={1} label="Reserve a table" />
          <VendorStep number={2} label="Sign the vendor agreement" />
          <VendorStep number={3} label="Set up and sell" />
        </View>
      </View>

      <MascotCelebration
        visible={showMascot}
        eventName={event.name}
        onDismiss={() => setShowMascot(false)}
      />
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
    borderBottomColor: colors.flagRed,
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
    backgroundColor: colors.flagRed,
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
    color: colors.white,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  requestStatusCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderLeftWidth: 6,
    borderLeftColor: colors.navy,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  requestStatusTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  requestStatusBody: {
    fontSize: 16,
    lineHeight: 23,
    color: colors.navy,
    fontWeight: '700',
  },
  requestForm: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  requestFormLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 14,
    textAlign: 'center',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 20,
  },
  stepperButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.navy,
  },
  stepperValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    minWidth: 40,
    textAlign: 'center',
  },
  cancelLink: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 6,
  },
  cancelLinkText: {
    fontSize: 15,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
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
