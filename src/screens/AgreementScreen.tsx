import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  createAgreement,
  getAgreementForVendorAndEvent,
  updateAgreementStatus,
} from '../db/supabase/agreements';
import { getEventById } from '../db/supabase/events';
import { getVendorById } from '../db/supabase/vendors';
import type { Agreement, Event, Vendor } from '../db/types';
import {
  VENDOR_AGREEMENT_PARAGRAPHS,
  VENDOR_AGREEMENT_TITLE,
} from '../content/vendorAgreementTemplate';
import { colors } from '../theme/colors';
import { displayFont } from '../theme/fonts';

export default function AgreementScreen({
  vendorId,
  eventId,
  onBack,
}: {
  vendorId: number;
  eventId: number;
  onBack: () => void;
}) {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [loadedVendor, loadedEvent, loadedAgreement] = await Promise.all([
        getVendorById(vendorId),
        getEventById(eventId),
        getAgreementForVendorAndEvent(vendorId, eventId),
      ]);
      setVendor(loadedVendor);
      setEvent(loadedEvent);
      setAgreement(loadedAgreement);
    } finally {
      setLoading(false);
    }
  }, [vendorId, eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const commitSign = useCallback(async () => {
    setSigning(true);
    try {
      const signed = agreement
        ? await updateAgreementStatus(agreement.id, 'signed')
        : await createAgreement({ vendorId, eventId, status: 'signed' });
      setAgreement(signed);
      Alert.alert('Signed', 'This agreement is now marked as signed.');
    } finally {
      setSigning(false);
    }
  }, [agreement, vendorId, eventId]);

  const handleSignPress = useCallback(() => {
    Alert.alert(
      'Sign Agreement',
      'By signing, you confirm that you have read and agree to the terms above.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign', onPress: commitSign },
      ]
    );
  }, [commitSign]);

  const isSigned = agreement?.status === 'signed';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton} hitSlop={12}>
          <Text style={styles.backButtonText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Vendor Agreement</Text>
        {!loading && vendor && event && (
          <Text style={styles.headerSubtitle}>
            {vendor.businessName.toUpperCase()} · {event.name.toUpperCase()}
          </Text>
        )}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.navy} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.statusPill, isSigned ? styles.statusPillSigned : styles.statusPillNotSigned]}>
            <Text style={styles.statusPillText}>{isSigned ? 'Signed' : 'Not Signed'}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.agreementTitle}>{VENDOR_AGREEMENT_TITLE}</Text>
            {VENDOR_AGREEMENT_PARAGRAPHS.map((paragraph, index) => (
              <Text key={index} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.signButton,
              isSigned && styles.signButtonSigned,
              pressed && !isSigned && styles.signButtonPressed,
            ]}
            onPress={handleSignPress}
            disabled={isSigned || signing}
          >
            <Text style={[styles.signButtonText, isSigned && styles.signButtonTextSigned]}>
              {isSigned ? 'Signed ✓' : signing ? 'Signing…' : 'Sign Agreement'}
            </Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    backgroundColor: colors.navy,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 4,
    borderBottomColor: colors.brass,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    paddingVertical: 6,
  },
  backButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  headerTitle: {
    fontFamily: displayFont,
    color: colors.white,
    fontSize: 30,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: colors.headerSubtitle,
    fontSize: 13,
    marginTop: 5,
    letterSpacing: 1,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 48,
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  statusPillNotSigned: {
    backgroundColor: '#EDE0C6',
  },
  statusPillSigned: {
    backgroundColor: '#DCEBDD',
  },
  statusPillText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 22,
    marginBottom: 26,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  agreementTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 16,
  },
  paragraph: {
    fontSize: 17,
    lineHeight: 27,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  signButton: {
    backgroundColor: colors.brass,
    borderRadius: 12,
    paddingVertical: 20,
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  signButtonPressed: {
    opacity: 0.85,
  },
  signButtonSigned: {
    backgroundColor: '#DCEBDD',
    shadowOpacity: 0,
    elevation: 0,
  },
  signButtonText: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  signButtonTextSigned: {
    color: colors.navy,
  },
});
