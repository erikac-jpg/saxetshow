import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getRequestHistoryForVendor, type VendorRequestHistoryEntry } from '../db/supabase/tableRequests';
import { deleteMyAccount } from '../db/supabase/users';
import { createVendor, getVendorById, updateVendor } from '../db/supabase/vendors';
import type { TableRequestStatus, Vendor } from '../db/types';
import EngravedRule from '../components/EngravedRule';
import HeroRibbon from '../components/HeroRibbon';
import VendorQrCode from '../components/VendorQrCode';
import type { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { bodyFont, bodyFontBold, bodyFontExtraBold, bodyFontSemiBold, displayFontBold } from '../theme/fonts';

const STAFF_TAG_OPTIONS = ['Reliable', 'New Vendor', 'VIP', 'Do Not Rebook'] as const;

// Matches the client's real paper "Application for Exhibit Space" form's
// item checklist, word-for-word except "Firearms" (was "Guns") and "Grips
// & Accessories" (was "Grips/Clips") - softer wording for the app-store
// facing product, same list and order otherwise.
const ITEM_CATEGORY_OPTIONS = [
  'Firearms',
  'Books',
  'Reloading',
  'Leather',
  'Metal / Cleaning Items',
  'Grips & Accessories',
  'Jewelry',
  'Government Surplus',
  'Coins',
  'Clothing',
  'Electronics',
  'Parts',
  'Knives',
  'Optics',
  'Other',
] as const;

interface FormState {
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  boothNotes: string;
  itemCategories: string[];
  preferredTableLocation: string;
  staffNotes: string;
  staffTags: string[];
}

const EMPTY_FORM: FormState = {
  businessName: '',
  contactName: '',
  phone: '',
  email: '',
  website: '',
  address: '',
  boothNotes: '',
  itemCategories: [],
  preferredTableLocation: '',
  staffNotes: '',
  staffTags: [],
};

function formFromVendor(vendor: Vendor): FormState {
  return {
    businessName: vendor.businessName ?? '',
    contactName: vendor.contactName ?? '',
    phone: vendor.phone ?? '',
    email: vendor.email ?? '',
    website: vendor.website ?? '',
    address: vendor.address ?? '',
    boothNotes: vendor.boothNotes ?? '',
    itemCategories: vendor.itemCategories,
    preferredTableLocation: vendor.preferredTableLocation ?? '',
    staffNotes: vendor.staffNotes ?? '',
    staffTags: vendor.staffTags,
  };
}

function deriveAttendance(entry: VendorRequestHistoryEntry): string {
  if (entry.status === 'denied') return 'Cancelled';
  if (entry.checkedInAt) return 'Attended';
  const eventTime = new Date(`${entry.eventDate}T00:00:00`).getTime();
  const isPast = !Number.isNaN(eventTime) && eventTime < Date.now();
  if (entry.status === 'approved' && isPast) return 'No-Show';
  if (entry.status === 'approved') return 'Upcoming';
  return 'Pending';
}

function formatShortDate(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function VendorProfileScreen({
  vendorId,
  onBack,
  onSaved,
  onSignOut,
  subtitle = 'STAFF VIEW',
  isStaffView = false,
  linkUserId = null,
}: {
  vendorId: number | null;
  onBack: () => void;
  onSaved?: (vendor: Vendor) => void;
  onSignOut?: () => void | Promise<void>;
  subtitle?: string;
  isStaffView?: boolean;
  /** When creating a brand-new profile, link it to this signed-in account. */
  linkUserId?: number | null;
}) {
  const [vendor, setVendor] = useState<Vendor | null | undefined>(undefined);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [history, setHistory] = useState<VendorRequestHistoryEntry[] | null>(null);
  // Collapsed to a summary once there's a saved profile to show instead of
  // one - an already-filled-in form sitting open by default read as
  // unfinished. Starts open for a brand-new profile, since there's
  // nothing yet to collapse to.
  const [editing, setEditing] = useState(false);
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const load = useCallback(async () => {
    if (vendorId === null) {
      setVendor(null);
      setForm(EMPTY_FORM);
      setEditing(true);
      return;
    }
    const found = await getVendorById(vendorId);
    setVendor(found);
    setForm(found ? formFromVendor(found) : EMPTY_FORM);
    setEditing(!found);
  }, [vendorId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (vendorId !== null) {
      getRequestHistoryForVendor(vendorId).then(setHistory);
    }
  }, [vendorId]);

  const updateField = (field: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleTag = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      staffTags: prev.staffTags.includes(tag)
        ? prev.staffTags.filter((t) => t !== tag)
        : [...prev.staffTags, tag],
    }));
  };

  const toggleItemCategory = (category: string) => {
    setForm((prev) => ({
      ...prev,
      itemCategories: prev.itemCategories.includes(category)
        ? prev.itemCategories.filter((c) => c !== category)
        : [...prev.itemCategories, category],
    }));
  };

  const handleSave = useCallback(async () => {
    // Matches the client's real paper "Application for Exhibit Space" form:
    // the vendor's own name, phone, email, and address are required there;
    // a business name is explicitly optional.
    if (form.contactName.trim().length === 0) {
      Alert.alert('Name required', 'Please enter your name before saving.');
      return;
    }
    if (form.phone.trim().length === 0) {
      Alert.alert('Phone required', 'Please enter a phone number before saving.');
      return;
    }
    if (form.email.trim().length === 0) {
      Alert.alert('Email required', 'Please enter an email address before saving.');
      return;
    }
    if (form.address.trim().length === 0) {
      Alert.alert('Address required', 'Please enter your address before saving.');
      return;
    }
    setSaving(true);
    try {
      const input = {
        businessName: form.businessName.trim() || null,
        contactName: form.contactName.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        website: form.website.trim() || null,
        address: form.address.trim() || null,
        itemCategories: form.itemCategories,
        preferredTableLocation: form.preferredTableLocation.trim() || null,
        ...(isStaffView
          ? {
              boothNotes: form.boothNotes.trim() || null,
              staffNotes: form.staffNotes.trim() || null,
              staffTags: form.staffTags,
            }
          : {}),
      };
      const saved = vendor
        ? await updateVendor(vendor.id, input)
        : await createVendor({ ...input, userId: linkUserId });
      setVendor(saved);
      if (saved) {
        onSaved?.(saved);
        setEditing(false);
      }
      Alert.alert('Saved', 'This vendor profile has been saved.');
    } finally {
      setSaving(false);
    }
  }, [form, vendor, onSaved, isStaffView, linkUserId]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'This permanently deletes your account and personal information. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteMyAccount();
              await onSignOut?.();
            } catch (err) {
              Alert.alert(
                'Something went wrong',
                err instanceof Error ? err.message : 'Please try again.'
              );
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }, [onSignOut]);

  if (vendor === undefined) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accentText} size="large" />
      </View>
    );
  }

  const isNewProfile = vendor === null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <HeroRibbon />
        <View style={styles.headerTopRow}>
          <Pressable onPress={onBack} style={styles.backButton} hitSlop={12}>
            <Text style={styles.backButtonText}>‹ Back</Text>
          </Pressable>
          {onSignOut && (
            <Pressable onPress={onSignOut} hitSlop={12}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </Pressable>
          )}
        </View>
        <Text style={styles.headerTitle}>Vendor Profile</Text>
        <Text style={styles.headerSubtitle}>{subtitle}</Text>
      </View>

      <View style={styles.content}>
        {isNewProfile && (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              No profile yet — fill in what you know below to create one.
            </Text>
          </View>
        )}

        {editing ? (
          <>
            <Text style={styles.sectionLabel}>CONTACT INFO</Text>
            <Field
              label="Your Name*"
              value={form.contactName}
              onChangeText={updateField('contactName')}
            />
            <Field
              label="Business Name"
              value={form.businessName}
              onChangeText={updateField('businessName')}
            />
            <Field
              label="Phone*"
              value={form.phone}
              onChangeText={updateField('phone')}
              keyboardType="phone-pad"
            />
            <Field
              label="Email*"
              value={form.email}
              onChangeText={updateField('email')}
              keyboardType="email-address"
            />
            <Field label="Website" value={form.website} onChangeText={updateField('website')} />
            <Field
              label="Mailing Address*"
              value={form.address}
              onChangeText={updateField('address')}
            />

            <EngravedRule />

            <Text style={styles.sectionLabel}>VENDOR DETAILS</Text>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Items for Sale (check all that apply)</Text>
              <View style={styles.tagRow}>
                {ITEM_CATEGORY_OPTIONS.map((category) => {
                  const active = form.itemCategories.includes(category);
                  return (
                    <Pressable
                      key={category}
                      style={[styles.tagChip, active && styles.tagChipActive]}
                      onPress={() => toggleItemCategory(category)}
                    >
                      <Text style={[styles.tagChipText, active && styles.tagChipTextActive]}>
                        {category}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <Field
              label="Preferred Table Location"
              value={form.preferredTableLocation}
              onChangeText={updateField('preferredTableLocation')}
              placeholder="Corner, near entrance, near power…"
            />

            {isStaffView && (
              <>
                <EngravedRule />

                <Text style={styles.sectionLabel}>STAFF ONLY</Text>
                <Field
                  label="Booth Notes (private)"
                  value={form.boothNotes}
                  onChangeText={updateField('boothNotes')}
                  multiline
                />
                <Field
                  label="Staff Notes (private)"
                  value={form.staffNotes}
                  onChangeText={updateField('staffNotes')}
                  multiline
                  placeholder="Always brings extra tables, difficult to reach…"
                />

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Tags</Text>
                  <View style={styles.tagRow}>
                    {STAFF_TAG_OPTIONS.map((tag) => {
                      const active = form.staffTags.includes(tag);
                      return (
                        <Pressable
                          key={tag}
                          style={[styles.tagChip, active && styles.tagChipActive]}
                          onPress={() => toggleTag(tag)}
                        >
                          <Text style={[styles.tagChipText, active && styles.tagChipTextActive]}>
                            {tag}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </>
            )}

            <View style={styles.editButtonRow}>
              {!isNewProfile && (
                <Pressable
                  style={({ pressed }) => [styles.cancelButton, pressed && styles.cancelButtonPressed]}
                  onPress={() => {
                    setForm(vendor ? formFromVendor(vendor) : EMPTY_FORM);
                    setEditing(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
              )}
              <Pressable
                style={({ pressed }) => [
                  styles.saveButton,
                  !isNewProfile && styles.saveButtonFlex,
                  pressed && styles.saveButtonPressed,
                ]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Saving…' : isNewProfile ? 'Create Profile' : 'Save Changes'}
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          vendor && <ProfileSummaryCard vendor={vendor} onEdit={() => setEditing(true)} />
        )}

        {!isNewProfile && vendor && (
          <>
            <EngravedRule />
            <View style={styles.qrSection}>
              <Text style={styles.sectionLabel}>CHECK-IN QR CODE</Text>
              <Text style={styles.qrHint}>
                Show this to staff at the door — they'll scan it to check you in.
              </Text>
              <VendorQrCode vendorId={vendor.id} />
            </View>
          </>
        )}

        {!isNewProfile && (
          <>
            <EngravedRule />
            <Text style={styles.sectionLabel}>
              {isStaffView ? 'VENDOR HISTORY' : 'YOUR TABLE REQUESTS'}
            </Text>
            {history === null ? (
              <ActivityIndicator color={colors.accentText} />
            ) : history.length === 0 ? (
              <Text style={styles.emptyHistoryText}>
                {isStaffView ? 'No past table requests for this vendor.' : 'No table requests yet.'}
              </Text>
            ) : (
              history.map((entry) => (
                <HistoryRow key={entry.id} entry={entry} />
              ))
            )}
          </>
        )}

        {onSignOut && (
          <View style={styles.dangerZone}>
            <EngravedRule style={styles.dangerZoneRule} />
            <Text style={styles.sectionLabel}>DELETE ACCOUNT</Text>
            <Text style={styles.dangerHint}>
              Permanently deletes your login and personal information. This cannot be undone.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.deleteButton, pressed && styles.deleteButtonPressed]}
              onPress={handleDeleteAccount}
              disabled={deleting}
            >
              <Text style={styles.deleteButtonText}>
                {deleting ? 'Deleting…' : 'Delete My Account'}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

/** Read-only recap shown once a profile is saved, instead of leaving the full edit form open by default. */
function ProfileSummaryCard({ vendor, onEdit }: { vendor: Vendor; onEdit: () => void }) {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const headerName = vendor.contactName ?? vendor.businessName ?? 'Vendor';
  const summaryLine = [
    vendor.contactName && vendor.businessName ? vendor.businessName : null,
    vendor.phone,
    vendor.email,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryTopRow}>
        <Text style={styles.summaryBusinessName} numberOfLines={1}>
          {headerName}
        </Text>
        <Pressable onPress={onEdit} hitSlop={8}>
          <Text style={styles.summaryEditLink}>Edit</Text>
        </Pressable>
      </View>
      {summaryLine.length > 0 && <Text style={styles.summaryMeta}>{summaryLine}</Text>}
      {vendor.itemCategories.length > 0 && (
        <Text style={styles.summaryMeta}>{vendor.itemCategories.join(', ')}</Text>
      )}
    </View>
  );
}

const STATUS_LABEL: Record<TableRequestStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  denied: 'Denied',
};

function HistoryRow({ entry }: { entry: VendorRequestHistoryEntry }) {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const canPayNow = Boolean(entry.paymentLink) && entry.paymentStatus !== 'paid';

  const handlePayNow = useCallback(() => {
    if (entry.paymentLink) {
      Linking.openURL(entry.paymentLink).catch(() => {});
    }
  }, [entry.paymentLink]);

  return (
    <View style={styles.historyRow}>
      <Text style={styles.historyEventName} numberOfLines={1}>
        {entry.eventName}
      </Text>
      <Text style={styles.historyMeta}>
        {formatShortDate(entry.eventDate)} · {entry.tablesWanted}{' '}
        {entry.tablesWanted === 1 ? 'table' : 'tables'} · {STATUS_LABEL[entry.status]}
      </Text>
      <Text style={styles.historyMeta}>
        Payment: {entry.paymentStatus} · {deriveAttendance(entry)}
      </Text>
      {canPayNow && (
        <Pressable
          onPress={handlePayNow}
          style={({ pressed }) => [styles.payNowButton, pressed && styles.payNowButtonPressed]}
        >
          <Text style={styles.payNowButtonText}>Pay now</Text>
        </Pressable>
      )}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  multiline,
  keyboardType,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  keyboardType?: 'phone-pad' | 'email-address';
  placeholder?: string;
}) {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
        multiline={multiline}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  header: {
    backgroundColor: colors.navy,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 4,
    borderBottomColor: colors.flagRed,
    overflow: 'hidden',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  backButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: bodyFontBold,
  },
  signOutText: {
    color: colors.headerSubtitle,
    fontSize: 16,
    fontFamily: bodyFontBold,
  },
  headerTitle: {
    fontFamily: displayFontBold,
    color: colors.white,
    fontSize: 32,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: colors.headerSubtitle,
    fontSize: 14,
    marginTop: 4,
    letterSpacing: 1.5,
    fontFamily: bodyFontSemiBold,
  },
  content: {
    padding: 20,
  },
  notice: {
    backgroundColor: colors.noticeBg,
    borderRadius: 4,
    padding: 16,
    marginBottom: 20,
  },
  noticeText: {
    fontSize: 16,
    lineHeight: 23,
    fontFamily: bodyFont,
    color: colors.textPrimary,
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: bodyFontExtraBold,
    color: colors.accentText,
    letterSpacing: 1.5,
    marginTop: 10,
    marginBottom: 14,
  },
  field: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 15,
    fontFamily: bodyFontBold,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 4,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 52,
    fontSize: 17,
    fontFamily: bodyFont,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  fieldInputMultiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tagChip: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 48,
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  tagChipActive: {
    backgroundColor: colors.flagRed,
    borderColor: colors.flagRed,
  },
  tagChipText: {
    fontSize: 15,
    fontFamily: bodyFontBold,
    color: colors.textPrimary,
  },
  tagChipTextActive: {
    color: colors.white,
  },
  editButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: colors.navy,
    borderRadius: 6,
    paddingVertical: 18,
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonFlex: {
    flex: 1,
    marginTop: 0,
  },
  saveButtonPressed: {
    opacity: 0.85,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 17,
    fontFamily: bodyFontExtraBold,
    letterSpacing: 0.3,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 6,
    paddingVertical: 18,
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.divider,
  },
  cancelButtonPressed: {
    opacity: 0.7,
  },
  cancelButtonText: {
    color: colors.textPrimary,
    fontSize: 17,
    fontFamily: bodyFontExtraBold,
    letterSpacing: 0.3,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.divider,
    padding: 18,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryBusinessName: {
    flex: 1,
    fontSize: 19,
    fontFamily: displayFontBold,
    color: colors.textPrimary,
  },
  summaryEditLink: {
    fontSize: 15,
    fontFamily: bodyFontBold,
    color: colors.accentText,
  },
  summaryMeta: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: bodyFont,
    color: colors.textSecondary,
    marginTop: 4,
  },
  emptyHistoryText: {
    fontSize: 16,
    lineHeight: 23,
    fontFamily: bodyFont,
    color: colors.textSecondary,
  },
  qrSection: {
    alignItems: 'center',
  },
  qrHint: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: bodyFont,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  dangerZone: {
    marginTop: 14,
  },
  dangerZoneRule: {
    marginTop: 0,
  },
  dangerHint: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: bodyFont,
    color: colors.textSecondary,
    marginBottom: 14,
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: 6,
    paddingVertical: 16,
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonPressed: {
    opacity: 0.7,
  },
  deleteButtonText: {
    color: colors.red,
    fontSize: 16,
    fontFamily: bodyFontExtraBold,
  },
  historyRow: {
    backgroundColor: colors.surface,
    borderRadius: 4,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.divider,
  },
  historyEventName: {
    fontSize: 16,
    fontFamily: bodyFontBold,
    color: colors.textPrimary,
  },
  historyMeta: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: bodyFont,
    color: colors.textSecondary,
    marginTop: 3,
  },
  payNowButton: {
    backgroundColor: colors.flagRed,
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
  },
  payNowButtonPressed: {
    opacity: 0.85,
  },
  payNowButtonText: {
    fontSize: 14,
    fontFamily: bodyFontBold,
    color: colors.white,
  },
});
