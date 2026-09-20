import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getAgreementsForEvent } from '../db/supabase/agreements';
import { getAllEvents, getEventById, updateEvent } from '../db/supabase/events';
import {
  getTableRequestsForEvent,
  setCheckedIn,
  updateTableRequestPayment,
  updateTableRequestStatus,
} from '../db/supabase/tableRequests';
import { getAllVendors } from '../db/supabase/vendors';
import { getWaitlistForEvent, removeFromWaitlist } from '../db/supabase/waitlist';
import type { Agreement, Event, PaymentStatus, TableRequest, Vendor, WaitlistEntry } from '../db/types';
import { colors } from '../theme/colors';
import { displayFont } from '../theme/fonts';

function daysUntil(dateString: string): number {
  const target = new Date(`${dateString}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDaysUntil(days: number): string {
  if (days === 0) return 'Today';
  if (days === 1) return '1 day';
  if (days > 1) return `${days} days`;
  return 'Past';
}

function formatShortDate(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function StaffDashboardScreen({
  onExit,
  onOpenVendorProfile,
  onOpenAgreement,
}: {
  onExit: () => void;
  onOpenVendorProfile: (vendorId: number) => void;
  onOpenAgreement: (vendorId: number, eventId: number) => void;
}) {
  const [events, setEvents] = useState<Event[] | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [requests, setRequests] = useState<TableRequest[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [agreementsByVendorId, setAgreementsByVendorId] = useState<Map<number, Agreement>>(
    new Map()
  );
  const [vendorsById, setVendorsById] = useState<Map<number, Vendor>>(new Map());
  const [totalTablesInput, setTotalTablesInput] = useState('0');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    try {
      const [allEvents, allVendors] = await Promise.all([getAllEvents(), getAllVendors()]);
      setEvents(allEvents);
      setVendorsById(new Map(allVendors.map((vendor) => [vendor.id, vendor])));
      setSelectedEventId((current) => current ?? allEvents[0]?.id ?? null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong loading the dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const loadEventDetails = useCallback(async (eventId: number) => {
    const [event, eventRequests, eventWaitlist, eventAgreements] = await Promise.all([
      getEventById(eventId),
      getTableRequestsForEvent(eventId),
      getWaitlistForEvent(eventId),
      getAgreementsForEvent(eventId),
    ]);
    setSelectedEvent(event);
    setRequests(eventRequests);
    setWaitlist(eventWaitlist);
    setAgreementsByVendorId(new Map(eventAgreements.map((agreement) => [agreement.vendorId, agreement])));
  }, []);

  useEffect(() => {
    if (selectedEventId != null) {
      loadEventDetails(selectedEventId);
    }
  }, [selectedEventId, loadEventDetails]);

  useEffect(() => {
    if (selectedEvent) {
      setTotalTablesInput(String(selectedEvent.totalTables));
    }
    // Only reset the field when the selected event itself changes, not on
    // every refresh of the same event (that would clobber in-progress typing).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEvent?.id]);

  const tablesSold = useMemo(
    () =>
      requests
        .filter((request) => request.status === 'approved')
        .reduce((sum, request) => sum + request.tablesWanted, 0),
    [requests]
  );
  const totalTables = Number(totalTablesInput) || 0;
  const tablesOpen = Math.max(totalTables - tablesSold, 0);
  const pendingCount = useMemo(
    () => requests.filter((request) => request.status === 'pending').length,
    [requests]
  );
  const daysUntilShow = selectedEvent ? daysUntil(selectedEvent.date) : null;

  const commitTotalTables = useCallback(async () => {
    if (!selectedEvent) return;
    const parsed = Math.max(0, parseInt(totalTablesInput, 10) || 0);
    const updated = await updateEvent(selectedEvent.id, { totalTables: parsed });
    if (updated) {
      setSelectedEvent(updated);
      setEvents((prev) => prev?.map((event) => (event.id === updated.id ? updated : event)) ?? prev);
      setTotalTablesInput(String(updated.totalTables));
    }
  }, [selectedEvent, totalTablesInput]);

  const refreshRequests = useCallback(async () => {
    if (selectedEventId == null) return;
    setRequests(await getTableRequestsForEvent(selectedEventId));
  }, [selectedEventId]);

  const refreshWaitlist = useCallback(async () => {
    if (selectedEventId == null) return;
    setWaitlist(await getWaitlistForEvent(selectedEventId));
  }, [selectedEventId]);

  const handleApprove = useCallback(
    async (request: TableRequest) => {
      await updateTableRequestStatus(request.id, 'approved');
      await refreshRequests();
    },
    [refreshRequests]
  );

  const handleDeny = useCallback(
    async (request: TableRequest) => {
      await updateTableRequestStatus(request.id, 'denied');
      await refreshRequests();
    },
    [refreshRequests]
  );

  const handleSetPaymentStatus = useCallback(
    async (request: TableRequest, paymentStatus: PaymentStatus) => {
      await updateTableRequestPayment(request.id, { paymentStatus });
      await refreshRequests();
    },
    [refreshRequests]
  );

  const handleSetPaymentDetail = useCallback(
    async (request: TableRequest, field: 'paymentMethod' | 'checkNumber', value: string) => {
      await updateTableRequestPayment(request.id, {
        paymentStatus: request.paymentStatus,
        [field]: value.trim() || null,
      });
      await refreshRequests();
    },
    [refreshRequests]
  );

  const handleToggleCheckIn = useCallback(
    async (request: TableRequest) => {
      await setCheckedIn(request.id, !request.checkedInAt);
      await refreshRequests();
    },
    [refreshRequests]
  );

  const handleOffer = useCallback(
    (entry: WaitlistEntry) => {
      const vendorName = vendorsById.get(entry.vendorId)?.businessName ?? 'This vendor';
      Alert.alert('Offer Sent', `${vendorName} will be notified about an open table.`);
    },
    [vendorsById]
  );

  const handleRemoveFromWaitlist = useCallback(
    async (entry: WaitlistEntry) => {
      await removeFromWaitlist(entry.id);
      await refreshWaitlist();
    },
    [refreshWaitlist]
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.navy} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onExit} style={styles.exitButton} hitSlop={12}>
          <Text style={styles.exitButtonText}>‹ Exit</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Staff Dashboard</Text>
        <Text style={styles.headerSubtitle}>SHOW MANAGEMENT</Text>
      </View>

      {error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : !events || events.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No events yet.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectorRow}
          >
            {events.map((event) => {
              const isActive = event.id === selectedEventId;
              return (
                <Pressable
                  key={event.id}
                  onPress={() => setSelectedEventId(event.id)}
                  style={[styles.selectorPill, isActive && styles.selectorPillActive]}
                >
                  <Text
                    style={[styles.selectorPillTitle, isActive && styles.selectorPillTitleActive]}
                    numberOfLines={1}
                  >
                    {event.name}
                  </Text>
                  <Text
                    style={[styles.selectorPillDate, isActive && styles.selectorPillDateActive]}
                  >
                    {formatShortDate(event.date)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {selectedEvent && (
            <>
              <View style={styles.countsGrid}>
                <StatTile label="Tables Sold" value={String(tablesSold)} />
                <StatTile label="Tables Open" value={String(tablesOpen)} />
                <StatTile label="Pending Requests" value={String(pendingCount)} />
                <StatTile
                  label="Days Until Show"
                  value={daysUntilShow != null ? formatDaysUntil(daysUntilShow) : '—'}
                />
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionLabel}>TABLE SETUP</Text>
                <Text style={styles.fieldLabel}>Total tables at this venue</Text>
                <TextInput
                  value={totalTablesInput}
                  onChangeText={setTotalTablesInput}
                  onEndEditing={commitTotalTables}
                  onBlur={commitTotalTables}
                  keyboardType="number-pad"
                  style={styles.totalTablesInput}
                />
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionLabel}>VENDOR REQUESTS</Text>
                {requests.length === 0 ? (
                  <Text style={styles.emptySectionText}>No table requests for this show yet.</Text>
                ) : (
                  requests.map((request) => (
                    <RequestRow
                      key={request.id}
                      request={request}
                      vendorName={vendorsById.get(request.vendorId)?.businessName ?? 'Unknown vendor'}
                      agreementStatus={agreementsByVendorId.get(request.vendorId)?.status ?? null}
                      exceedsOpenTables={
                        request.status === 'pending' && request.tablesWanted > tablesOpen
                      }
                      onApprove={() => handleApprove(request)}
                      onDeny={() => handleDeny(request)}
                      onOpenVendorProfile={() => onOpenVendorProfile(request.vendorId)}
                      onOpenAgreement={() => onOpenAgreement(request.vendorId, request.eventId)}
                      onSetPaymentStatus={(status) => handleSetPaymentStatus(request, status)}
                      onSetPaymentDetail={(field, value) =>
                        handleSetPaymentDetail(request, field, value)
                      }
                      onToggleCheckIn={() => handleToggleCheckIn(request)}
                    />
                  ))
                )}
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionLabel}>WAITLIST</Text>
                {waitlist.length === 0 ? (
                  <Text style={styles.emptySectionText}>No one on the waitlist.</Text>
                ) : (
                  waitlist.map((entry) => (
                    <WaitlistRow
                      key={entry.id}
                      entry={entry}
                      vendorName={vendorsById.get(entry.vendorId)?.businessName ?? 'Unknown vendor'}
                      onOffer={() => handleOffer(entry)}
                      onRemove={() => handleRemoveFromWaitlist(entry)}
                      onOpenVendorProfile={() => onOpenVendorProfile(entry.vendorId)}
                    />
                  ))
                )}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const STATUS_LABEL: Record<TableRequest['status'], string> = {
  pending: 'Pending',
  approved: 'Approved',
  denied: 'Denied',
};

const AGREEMENT_LABEL: Record<Agreement['status'], string> = {
  not_sent: 'Not Signed',
  sent: 'Not Signed',
  signed: 'Signed',
};

const PAYMENT_OPTIONS: PaymentStatus[] = ['unpaid', 'partial', 'paid'];
const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  unpaid: 'Unpaid',
  partial: 'Partial',
  paid: 'Paid',
};

function RequestRow({
  request,
  vendorName,
  agreementStatus,
  exceedsOpenTables,
  onApprove,
  onDeny,
  onOpenVendorProfile,
  onOpenAgreement,
  onSetPaymentStatus,
  onSetPaymentDetail,
  onToggleCheckIn,
}: {
  request: TableRequest;
  vendorName: string;
  agreementStatus: Agreement['status'] | null;
  exceedsOpenTables: boolean;
  onApprove: () => void;
  onDeny: () => void;
  onOpenVendorProfile: () => void;
  onOpenAgreement: () => void;
  onSetPaymentStatus: (status: PaymentStatus) => void;
  onSetPaymentDetail: (field: 'paymentMethod' | 'checkNumber', value: string) => void;
  onToggleCheckIn: () => void;
}) {
  const isSigned = agreementStatus === 'signed';
  const [methodInput, setMethodInput] = useState(request.paymentMethod ?? '');
  const [checkNumberInput, setCheckNumberInput] = useState(request.checkNumber ?? '');

  useEffect(() => {
    setMethodInput(request.paymentMethod ?? '');
    setCheckNumberInput(request.checkNumber ?? '');
  }, [request.id, request.paymentMethod, request.checkNumber]);

  return (
    <View style={styles.row}>
      <View style={styles.rowTopLine}>
        <Pressable onPress={onOpenVendorProfile} style={styles.vendorNameLink} hitSlop={4}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {vendorName}
          </Text>
        </Pressable>
        <View style={[styles.statusPill, styles[`statusPill_${request.status}`]]}>
          <Text style={styles.statusPillText}>{STATUS_LABEL[request.status]}</Text>
        </View>
      </View>
      <Text style={styles.rowSubtitle}>
        {request.tablesWanted} {request.tablesWanted === 1 ? 'table' : 'tables'} requested
      </Text>
      {exceedsOpenTables && <Text style={styles.flagText}>⚠ Not enough tables</Text>}
      <Pressable onPress={onOpenAgreement} hitSlop={4} style={styles.agreementLink}>
        <Text style={[styles.agreementLinkText, isSigned && styles.agreementLinkTextSigned]}>
          Agreement: {AGREEMENT_LABEL[agreementStatus ?? 'not_sent']} ›
        </Text>
      </Pressable>

      <View style={styles.paymentSection}>
        <Text style={styles.paymentLabel}>PAYMENT</Text>
        <View style={styles.paymentPillRow}>
          {PAYMENT_OPTIONS.map((option) => {
            const active = request.paymentStatus === option;
            return (
              <Pressable
                key={option}
                style={[styles.paymentPill, active && styles.paymentPillActive]}
                onPress={() => onSetPaymentStatus(option)}
              >
                <Text style={[styles.paymentPillText, active && styles.paymentPillTextActive]}>
                  {PAYMENT_LABEL[option]}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.paymentDetailRow}>
          <TextInput
            value={methodInput}
            onChangeText={setMethodInput}
            onEndEditing={() => onSetPaymentDetail('paymentMethod', methodInput)}
            placeholder="Method (cash, check…)"
            placeholderTextColor={colors.textSecondary}
            style={styles.paymentDetailInput}
          />
          <TextInput
            value={checkNumberInput}
            onChangeText={setCheckNumberInput}
            onEndEditing={() => onSetPaymentDetail('checkNumber', checkNumberInput)}
            placeholder="Check #"
            placeholderTextColor={colors.textSecondary}
            style={styles.paymentDetailInput}
          />
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.checkInButton,
          request.checkedInAt && styles.checkInButtonActive,
          pressed && styles.actionButtonPressed,
        ]}
        onPress={onToggleCheckIn}
      >
        <Text
          style={[
            styles.checkInButtonText,
            request.checkedInAt && styles.checkInButtonTextActive,
          ]}
        >
          {request.checkedInAt ? 'Checked In ✓' : 'Check In'}
        </Text>
      </Pressable>

      <View style={styles.rowActions}>
        <Pressable
          style={({ pressed }) => [styles.actionButton, styles.approveButton, pressed && styles.actionButtonPressed]}
          onPress={onApprove}
        >
          <Text style={styles.approveButtonText}>Approve</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionButton, styles.denyButton, pressed && styles.actionButtonPressed]}
          onPress={onDeny}
        >
          <Text style={styles.denyButtonText}>Deny</Text>
        </Pressable>
      </View>
    </View>
  );
}

function WaitlistRow({
  entry,
  vendorName,
  onOffer,
  onRemove,
  onOpenVendorProfile,
}: {
  entry: WaitlistEntry;
  vendorName: string;
  onOffer: () => void;
  onRemove: () => void;
  onOpenVendorProfile: () => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowTopLine}>
        <Pressable onPress={onOpenVendorProfile} style={styles.vendorNameLink} hitSlop={4}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {vendorName}
          </Text>
        </Pressable>
        <Text style={styles.waitlistPosition}>#{entry.position}</Text>
      </View>
      <Text style={styles.rowSubtitle}>
        {entry.tablesWanted} {entry.tablesWanted === 1 ? 'table' : 'tables'} wanted
      </Text>
      <View style={styles.rowActions}>
        <Pressable
          style={({ pressed }) => [styles.actionButton, styles.offerButton, pressed && styles.actionButtonPressed]}
          onPress={onOffer}
        >
          <Text style={styles.offerButtonText}>Offer</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionButton, styles.denyButton, pressed && styles.actionButtonPressed]}
          onPress={onRemove}
        >
          <Text style={styles.denyButtonText}>Remove</Text>
        </Pressable>
      </View>
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
    backgroundColor: colors.cream,
  },
  errorText: {
    color: colors.red,
    paddingHorizontal: 24,
    textAlign: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  header: {
    backgroundColor: colors.navy,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 4,
    borderBottomColor: colors.red,
  },
  exitButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  exitButtonText: {
    color: colors.white,
    fontSize: 15,
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
    fontSize: 13,
    marginTop: 2,
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  selectorRow: {
    paddingBottom: 16,
    gap: 10,
  },
  selectorPill: {
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 10,
    minWidth: 140,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  selectorPillActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  selectorPillTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  selectorPillTitleActive: {
    color: colors.white,
  },
  selectorPillDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  selectorPillDateActive: {
    color: colors.headerSubtitle,
  },
  countsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statTile: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderLeftWidth: 6,
    borderLeftColor: colors.red,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  statValue: {
    fontFamily: displayFont,
    fontSize: 34,
    color: colors.navy,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.navy,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  totalTablesInput: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  emptySectionText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  row: {
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  rowTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vendorNameLink: {
    flex: 1,
  },
  rowTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginRight: 8,
    textDecorationLine: 'underline',
    textDecorationColor: colors.divider,
  },
  rowSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  flagText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.red,
    marginTop: 6,
  },
  agreementLink: {
    marginTop: 8,
  },
  agreementLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.red,
  },
  agreementLinkTextSigned: {
    color: colors.navy,
  },
  paymentSection: {
    marginTop: 12,
  },
  paymentLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  paymentPillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  paymentPill: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  paymentPillActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  paymentPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  paymentPillTextActive: {
    color: colors.white,
  },
  paymentDetailRow: {
    flexDirection: 'row',
    gap: 8,
  },
  paymentDetailInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 13,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  checkInButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.navy,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  checkInButtonActive: {
    backgroundColor: '#DCEBDD',
    borderColor: '#DCEBDD',
  },
  checkInButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
  },
  checkInButtonTextActive: {
    color: colors.navy,
  },
  statusPill: {
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  statusPill_pending: {
    backgroundColor: '#F0E6C8',
  },
  statusPill_approved: {
    backgroundColor: '#DCEBDD',
  },
  statusPill_denied: {
    backgroundColor: '#F3DCDC',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  waitlistPosition: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.navy,
  },
  rowActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionButtonPressed: {
    opacity: 0.85,
  },
  approveButton: {
    backgroundColor: colors.navy,
  },
  approveButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  denyButton: {
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.red,
  },
  denyButtonText: {
    color: colors.red,
    fontSize: 14,
    fontWeight: '700',
  },
  offerButton: {
    backgroundColor: colors.red,
  },
  offerButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
