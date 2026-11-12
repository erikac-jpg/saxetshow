import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '../auth/AuthContext';
import { createTableRequest, getTableRequestsForVendor } from '../db/supabase/tableRequests';
import type { Event, TableRequest } from '../db/types';
import AppIcon from '../components/AppIcon';
import EngravedRule from '../components/EngravedRule';
import HeroRibbon from '../components/HeroRibbon';
import MascotCelebration from '../components/MascotCelebration';
import type { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import {
  bodyFont,
  bodyFontBold,
  bodyFontExtraBold,
  bodyFontSemiBold,
  displayFont,
  displayFontBold,
} from '../theme/fonts';

/** "21" for a single-day show, "21–22" for a multi-day one that doesn't cross a month. */
function dayRangeLabel(dateString: string, endDateString?: string | null): string {
  const start = new Date(`${dateString}T00:00:00`);
  const end = new Date(`${(endDateString || dateString)}T00:00:00`);
  const startDay = start.getDate();
  const endDay = end.getDate();
  return startDay === endDay ? `${startDay}` : `${startDay}–${endDay}`;
}

function monthYearLabel(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }).toUpperCase();
}

/** "NOVEMBER 21–22, 2026" for the header's date band. */
function dateBandLabel(dateString: string, endDateString?: string | null): string {
  const start = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(start.getTime())) return dateString;
  const month = start.toLocaleDateString(undefined, { month: 'long' }).toUpperCase();
  const year = start.getFullYear();
  return `${month} ${dayRangeLabel(dateString, endDateString)}, ${year}`;
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
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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

  const handleGetDirections = useCallback(() => {
    if (!event.location) return;
    const query = encodeURIComponent(event.location);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {});
  }, [event.location]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <HeroRibbon width={200} height={150} opacity={1} corner="bottomRight" />
        <View style={styles.headerTopRow}>
          <Pressable onPress={onBack} style={styles.backButton} hitSlop={12}>
            <Text style={styles.backButtonText}>‹ All shows</Text>
          </Pressable>
          <Text style={styles.wordmark}>SAXET</Text>
        </View>

        {event.image ? (
          <Image source={{ uri: event.image }} style={styles.promoImage} resizeMode="cover" />
        ) : (
          <>
            <View style={styles.eyebrowRow}>
              <Text style={styles.eyebrow}>Saxet Gun Shows</Text>
              <View style={styles.eyebrowRule} />
            </View>
            <Text style={styles.title}>{event.name}</Text>
          </>
        )}
      </View>
      <View style={styles.dateBand}>
        <Text style={styles.dateBandText}>{dateBandLabel(event.date, event.endDate)}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.dateWidget}>
          <AppIcon name="calendar" size={40} color={colors.accentText} strokeWidth={1.6} />
          <View style={styles.dateWidgetDivider} />
          <View>
            <Text style={styles.dateWidgetDay}>{dayRangeLabel(event.date, event.endDate)}</Text>
            <Text style={styles.dateWidgetMonth}>{monthYearLabel(event.date)}</Text>
          </View>
        </View>

        {event.description ? <Text style={styles.description}>{event.description}</Text> : null}

        {event.location ? (
          <>
            <EngravedRule />
            <Text style={styles.sectionLabel}>Location</Text>
            <Text style={styles.locationText}>{event.location}</Text>
            <Pressable
              style={({ pressed }) => [styles.directionsButton, pressed && styles.directionsButtonPressed]}
              onPress={handleGetDirections}
            >
              <AppIcon name="locationPin" size={16} color={colors.accentText} />
              <Text style={styles.directionsButtonText}>Get directions</Text>
            </Pressable>
          </>
        ) : null}

        <EngravedRule ornament />

        <Text style={styles.sectionLabel}>Vendor Info</Text>
        <Text style={styles.vendorHeading}>Save your spot.</Text>
        <Text style={styles.sectionBody}>
          Interested in setting up a booth at this show? Let us know and our team will follow up
          with table pricing and availability.
        </Text>

        {existingRequest === undefined ? (
          <ActivityIndicator color={colors.accentText} />
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
                <Text style={styles.stepperButtonText} allowFontScaling={false}>
                  −
                </Text>
              </Pressable>
              <Text style={styles.stepperValue}>{tablesWanted}</Text>
              <Pressable
                style={styles.stepperButton}
                onPress={() => setTablesWanted((n) => Math.min(10, n + 1))}
                hitSlop={8}
              >
                <Text style={styles.stepperButtonText} allowFontScaling={false}>
                  +
                </Text>
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
            <Text style={styles.ctaButtonText}>Ask about vendor space</Text>
          </Pressable>
        )}

        <EngravedRule ornament />

        <Text style={styles.sectionLabel}>Become a Vendor</Text>
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
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>
      <Text style={styles.stepLabel}>{label}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  header: {
    backgroundColor: colors.navy,
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  backButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: bodyFontBold,
  },
  wordmark: {
    fontFamily: displayFontBold,
    color: colors.cream,
    fontSize: 20,
    letterSpacing: 1.5,
  },
  promoImage: {
    width: '100%',
    height: 180,
    borderRadius: 6,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  eyebrow: {
    fontFamily: bodyFontExtraBold,
    color: colors.cream,
    fontSize: 13,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  eyebrowRule: {
    flex: 1,
    height: 1,
    backgroundColor: colors.headerSubtitle,
  },
  title: {
    fontFamily: displayFont,
    fontSize: 40,
    lineHeight: 46,
    color: colors.cream,
  },
  dateBand: {
    backgroundColor: colors.flagRed,
    paddingVertical: 10,
    alignItems: 'center',
  },
  dateBandText: {
    fontFamily: bodyFontExtraBold,
    color: colors.white,
    fontSize: 14,
    letterSpacing: 2,
  },
  content: {
    padding: 24,
  },
  dateWidget: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  dateWidgetDivider: {
    width: 1.5,
    height: 44,
    backgroundColor: colors.divider,
  },
  dateWidgetDay: {
    fontFamily: displayFontBold,
    fontSize: 44,
    lineHeight: 48,
    color: colors.textPrimary,
  },
  dateWidgetMonth: {
    fontFamily: bodyFontExtraBold,
    fontSize: 13,
    letterSpacing: 1.5,
    color: colors.accentText,
    marginTop: 2,
  },
  description: {
    fontSize: 17,
    lineHeight: 26,
    fontFamily: bodyFont,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: bodyFontExtraBold,
    color: colors.accentText,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 18,
    lineHeight: 25,
    fontFamily: displayFontBold,
    color: colors.textPrimary,
    marginBottom: 14,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: colors.accentText,
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  directionsButtonPressed: {
    opacity: 0.7,
  },
  directionsButtonText: {
    fontSize: 15,
    fontFamily: bodyFontBold,
    color: colors.textPrimary,
  },
  vendorHeading: {
    fontFamily: displayFontBold,
    fontSize: 26,
    color: colors.textPrimary,
    marginBottom: 10,
  },
  sectionBody: {
    fontSize: 17,
    lineHeight: 26,
    fontFamily: bodyFont,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  ctaButton: {
    backgroundColor: colors.flagRed,
    borderRadius: 6,
    paddingVertical: 20,
    alignItems: 'center',
  },
  ctaButtonPressed: {
    opacity: 0.85,
  },
  ctaButtonText: {
    color: colors.white,
    fontSize: 17,
    fontFamily: displayFontBold,
    letterSpacing: 0.3,
  },
  requestStatusCard: {
    backgroundColor: colors.surface,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.accentText,
    padding: 18,
  },
  requestStatusTitle: {
    fontSize: 17,
    fontFamily: bodyFontExtraBold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  requestStatusBody: {
    fontSize: 16,
    lineHeight: 23,
    color: colors.accentText,
    fontFamily: bodyFontBold,
  },
  requestForm: {
    backgroundColor: colors.surface,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.accentText,
    padding: 20,
  },
  requestFormLabel: {
    fontSize: 16,
    fontFamily: bodyFontBold,
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
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: {
    fontSize: 26,
    fontFamily: bodyFontExtraBold,
    color: colors.accentText,
  },
  stepperValue: {
    fontSize: 28,
    fontFamily: bodyFontExtraBold,
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
    fontFamily: bodyFont,
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
    fontFamily: bodyFontExtraBold,
  },
  stepLabel: {
    flex: 1,
    fontSize: 18,
    lineHeight: 25,
    fontFamily: bodyFontSemiBold,
    color: colors.textPrimary,
  },
});
