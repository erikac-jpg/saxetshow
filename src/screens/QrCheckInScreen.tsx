import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { parseVendorQrPayload } from '../components/VendorQrCode';
import {
  getTableRequestsForVendor,
  setCheckedIn,
  updateTableRequestPayment,
} from '../db/supabase/tableRequests';
import { getVendorById } from '../db/supabase/vendors';
import type { TableRequest, Vendor } from '../db/types';
import { colors } from '../theme/colors';
import { displayFont } from '../theme/fonts';
import { expirationWarning } from '../util/expiration';

type ScanResult =
  | { kind: 'vendor'; vendor: Vendor; request: TableRequest | null }
  | { kind: 'not_found' }
  | { kind: 'invalid' };

export default function QrCheckInScreen({
  eventId,
  onBack,
}: {
  eventId: number;
  onBack: () => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const dingPlayer = useAudioPlayer(require('../../assets/sounds/scan-success.wav'));

  // Staff are scanning in a noisy, busy room and aren't staring at the
  // screen — a ding + buzz tells them "got it" (or "try again") without
  // looking. Errors are swallowed: feedback is a nice-to-have, never a
  // reason to block the scan flow (e.g. on web, where haptics no-op).
  const playScanFeedback = useCallback(
    (outcome: 'success' | 'error') => {
      Haptics.notificationAsync(
        outcome === 'success'
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Error
      ).catch(() => {});
      if (outcome === 'success') {
        dingPlayer
          .seekTo(0)
          .catch(() => {})
          .finally(() => dingPlayer.play());
      }
    },
    [dingPlayer]
  );

  const handleBarcodeScanned = useCallback(
    async (scan: { data: string }) => {
      if (!scanning) return;
      setScanning(false);
      const vendorId = parseVendorQrPayload(scan.data);
      if (vendorId === null) {
        playScanFeedback('error');
        setResult({ kind: 'invalid' });
        return;
      }
      setBusy(true);
      try {
        const vendor = await getVendorById(vendorId);
        if (!vendor) {
          playScanFeedback('error');
          setResult({ kind: 'not_found' });
          return;
        }
        const requests = await getTableRequestsForVendor(vendorId);
        const request = requests.find((r) => r.eventId === eventId) ?? null;
        playScanFeedback('success');
        setResult({ kind: 'vendor', vendor, request });
      } finally {
        setBusy(false);
      }
    },
    [scanning, eventId, playScanFeedback]
  );

  const scanNext = () => {
    setResult(null);
    setScanning(true);
  };

  const handleToggleCheckIn = useCallback(async () => {
    if (result?.kind !== 'vendor' || !result.request) return;
    setBusy(true);
    try {
      const updated = await setCheckedIn(result.request.id, !result.request.checkedInAt);
      if (updated) {
        setResult({ kind: 'vendor', vendor: result.vendor, request: updated });
      }
    } finally {
      setBusy(false);
    }
  }, [result]);

  const handleMarkPaid = useCallback(async () => {
    if (result?.kind !== 'vendor' || !result.request) return;
    setBusy(true);
    try {
      const updated = await updateTableRequestPayment(result.request.id, { paymentStatus: 'paid' });
      if (updated) {
        setResult({ kind: 'vendor', vendor: result.vendor, request: updated });
      }
    } finally {
      setBusy(false);
    }
  }, [result]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton} hitSlop={12}>
          <Text style={styles.backButtonText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Scan Check-In</Text>
        <Text style={styles.headerSubtitle}>DOOR CHECK-IN</Text>
      </View>

      {!permission ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.navy} size="large" />
        </View>
      ) : !permission.granted ? (
        <View style={styles.centered}>
          <Text style={styles.permissionText}>
            Camera access is needed to scan vendor check-in codes.
          </Text>
          <Pressable style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Allow Camera</Text>
          </Pressable>
        </View>
      ) : scanning ? (
        <View style={styles.cameraWrap}>
          <CameraView
            style={StyleSheet.absoluteFill}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={handleBarcodeScanned}
          />
          <View style={styles.scanFrame} pointerEvents="none" />
          <Text style={styles.scanHint}>Point the camera at a vendor's check-in QR code</Text>
        </View>
      ) : (
        <View style={styles.resultWrap}>
          {result?.kind === 'invalid' && (
            <ResultCard tone="error" message="That doesn't look like a Saxetshow vendor code." />
          )}
          {result?.kind === 'not_found' && (
            <ResultCard tone="error" message="No vendor found for this code." />
          )}
          {result?.kind === 'vendor' && (
            <VendorScanCard
              vendor={result.vendor}
              request={result.request}
              busy={busy}
              onToggleCheckIn={handleToggleCheckIn}
              onMarkPaid={handleMarkPaid}
            />
          )}
          <Pressable style={styles.scanNextButton} onPress={scanNext} disabled={busy}>
            <Text style={styles.scanNextButtonText}>Scan Next</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function ResultCard({ tone, message }: { tone: 'error'; message: string }) {
  return (
    <View style={[styles.card, tone === 'error' && styles.cardError]}>
      <Text style={styles.cardErrorText}>{message}</Text>
    </View>
  );
}

function VendorScanCard({
  vendor,
  request,
  busy,
  onToggleCheckIn,
  onMarkPaid,
}: {
  vendor: Vendor;
  request: TableRequest | null;
  busy: boolean;
  onToggleCheckIn: () => void;
  onMarkPaid: () => void;
}) {
  const fflWarning = expirationWarning('FFL license', vendor.fflExpirationDate ?? '');
  const isCheckedIn = Boolean(request?.checkedInAt);
  const isPaid = request?.paymentStatus === 'paid';

  return (
    <View style={styles.card}>
      <Text style={styles.vendorName}>{vendor.businessName}</Text>
      {vendor.contactName && <Text style={styles.vendorMeta}>{vendor.contactName}</Text>}

      {fflWarning && (
        <View style={styles.warningNotice}>
          <Text style={styles.warningNoticeText}>{fflWarning}</Text>
        </View>
      )}

      {!request ? (
        <View style={styles.noticeBox}>
          <Text style={styles.noticeBoxText}>
            No table request on file for this vendor at this event.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Amount Owed</Text>
            <Text style={styles.amountValue}>${vendor.feesOwed.toFixed(2)}</Text>
          </View>

          <View style={styles.actionRow}>
            <Pressable
              style={[styles.actionButton, isCheckedIn && styles.actionButtonActive]}
              onPress={onToggleCheckIn}
              disabled={busy}
            >
              <Text style={[styles.actionButtonText, isCheckedIn && styles.actionButtonTextActive]}>
                {isCheckedIn ? 'Checked In ✓' : 'Check In'}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, isPaid && styles.actionButtonActive]}
              onPress={onMarkPaid}
              disabled={busy || isPaid}
            >
              <Text style={[styles.actionButtonText, isPaid && styles.actionButtonTextActive]}>
                {isPaid ? 'Paid ✓' : 'Mark Paid'}
              </Text>
            </Pressable>
          </View>
        </>
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
    paddingHorizontal: 24,
    gap: 16,
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
    fontSize: 32,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: colors.headerSubtitle,
    fontSize: 14,
    marginTop: 4,
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  permissionText: {
    fontSize: 17,
    lineHeight: 25,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: colors.navy,
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 28,
    minHeight: 52,
    justifyContent: 'center',
  },
  permissionButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
  },
  cameraWrap: {
    flex: 1,
    backgroundColor: '#000',
  },
  scanFrame: {
    position: 'absolute',
    top: '30%',
    left: '15%',
    right: '15%',
    bottom: '40%',
    borderWidth: 3,
    borderColor: colors.brass,
    borderRadius: 16,
  },
  scanHint: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    textAlign: 'center',
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  resultWrap: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  cardError: {
    backgroundColor: '#F1DCD3',
  },
  cardErrorText: {
    fontSize: 17,
    lineHeight: 25,
    fontWeight: '700',
    color: colors.red,
    textAlign: 'center',
  },
  vendorName: {
    // Deliberately not the decorative display font - staff need to
    // read this fast and correctly to catch a wrong-person scan.
    fontSize: 24,
    fontWeight: '800',
    color: colors.navy,
  },
  vendorMeta: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 5,
  },
  warningNotice: {
    backgroundColor: '#F1DCD3',
    borderRadius: 10,
    padding: 14,
    marginTop: 16,
  },
  warningNoticeText: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '700',
    color: colors.red,
  },
  noticeBox: {
    backgroundColor: '#EDE0C6',
    borderRadius: 10,
    padding: 14,
    marginTop: 16,
  },
  noticeBoxText: {
    fontSize: 16,
    lineHeight: 23,
    color: colors.textPrimary,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  amountLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  amountValue: {
    // Same reasoning as vendorName - this is the dollar figure staff
    // collect in cash, it needs to be unambiguous, not stylized.
    fontSize: 28,
    fontWeight: '800',
    color: colors.navy,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.navy,
    borderRadius: 12,
    paddingVertical: 16,
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonActive: {
    backgroundColor: '#DCEBDD',
    borderColor: '#DCEBDD',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.navy,
  },
  actionButtonTextActive: {
    color: colors.navy,
  },
  scanNextButton: {
    marginTop: 22,
    backgroundColor: colors.navy,
    borderRadius: 12,
    paddingVertical: 16,
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanNextButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
