import { useCallback, useEffect, useState } from 'react';
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

import { getRequestHistoryForVendor, type VendorRequestHistoryEntry } from '../db/supabase/tableRequests';
import { deleteMyAccount } from '../db/supabase/users';
import { createVendor, getVendorById, updateVendor } from '../db/supabase/vendors';
import type { TableRequestStatus, Vendor } from '../db/types';
import VendorQrCode from '../components/VendorQrCode';
import { colors } from '../theme/colors';
import { displayFont } from '../theme/fonts';
import { daysUntil, expirationWarning } from '../util/expiration';

const STAFF_TAG_OPTIONS = ['Reliable', 'New Vendor', 'VIP', 'Do Not Rebook'] as const;

interface FormState {
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  productsTheyBring: string;
  boothNotes: string;
  fflLicenseNumber: string;
  fflExpirationDate: string;
  vendorCategory: string;
  preferredTableLocation: string;
  staffNotes: string;
  insuranceOnFile: boolean;
  insuranceExpirationDate: string;
  staffTags: string[];
}

const EMPTY_FORM: FormState = {
  businessName: '',
  contactName: '',
  phone: '',
  email: '',
  website: '',
  address: '',
  productsTheyBring: '',
  boothNotes: '',
  fflLicenseNumber: '',
  fflExpirationDate: '',
  vendorCategory: '',
  preferredTableLocation: '',
  staffNotes: '',
  insuranceOnFile: false,
  insuranceExpirationDate: '',
  staffTags: [],
};

function formFromVendor(vendor: Vendor): FormState {
  return {
    businessName: vendor.businessName,
    contactName: vendor.contactName ?? '',
    phone: vendor.phone ?? '',
    email: vendor.email ?? '',
    website: vendor.website ?? '',
    address: vendor.address ?? '',
    productsTheyBring: vendor.productsTheyBring ?? '',
    boothNotes: vendor.boothNotes ?? '',
    fflLicenseNumber: vendor.fflLicenseNumber ?? '',
    fflExpirationDate: vendor.fflExpirationDate ?? '',
    vendorCategory: vendor.vendorCategory ?? '',
    preferredTableLocation: vendor.preferredTableLocation ?? '',
    staffNotes: vendor.staffNotes ?? '',
    insuranceOnFile: vendor.insuranceOnFile,
    insuranceExpirationDate: vendor.insuranceExpirationDate ?? '',
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

  const load = useCallback(async () => {
    if (vendorId === null) {
      setVendor(null);
      setForm(EMPTY_FORM);
      return;
    }
    const found = await getVendorById(vendorId);
    setVendor(found);
    setForm(found ? formFromVendor(found) : EMPTY_FORM);
  }, [vendorId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isStaffView && vendorId !== null) {
      getRequestHistoryForVendor(vendorId).then(setHistory);
    }
  }, [isStaffView, vendorId]);

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

  const handleSave = useCallback(async () => {
    if (form.businessName.trim().length === 0) {
      Alert.alert('Business name required', 'Please enter a business name before saving.');
      return;
    }
    setSaving(true);
    try {
      const input = {
        businessName: form.businessName.trim(),
        contactName: form.contactName.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        website: form.website.trim() || null,
        address: form.address.trim() || null,
        productsTheyBring: form.productsTheyBring.trim() || null,
        boothNotes: form.boothNotes.trim() || null,
        fflLicenseNumber: form.fflLicenseNumber.trim() || null,
        fflExpirationDate: form.fflExpirationDate.trim() || null,
        vendorCategory: form.vendorCategory.trim() || null,
        preferredTableLocation: form.preferredTableLocation.trim() || null,
        ...(isStaffView
          ? {
              staffNotes: form.staffNotes.trim() || null,
              insuranceOnFile: form.insuranceOnFile,
              insuranceExpirationDate: form.insuranceExpirationDate.trim() || null,
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
        <ActivityIndicator color={colors.navy} size="large" />
      </View>
    );
  }

  const isNewProfile = vendor === null;
  const fflWarning = expirationWarning('FFL license', form.fflExpirationDate);
  const insuranceWarning = isStaffView
    ? expirationWarning('Insurance', form.insuranceExpirationDate)
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
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
        {fflWarning && (
          <View style={styles.warningNotice}>
            <Text style={styles.warningNoticeText}>{fflWarning}</Text>
          </View>
        )}
        {insuranceWarning && (
          <View style={styles.warningNotice}>
            <Text style={styles.warningNoticeText}>{insuranceWarning}</Text>
          </View>
        )}

        <Text style={styles.sectionLabel}>CONTACT INFO</Text>
        <Field
          label="Business Name*"
          value={form.businessName}
          onChangeText={updateField('businessName')}
        />
        <Field
          label="Contact Name"
          value={form.contactName}
          onChangeText={updateField('contactName')}
        />
        <Field
          label="Phone"
          value={form.phone}
          onChangeText={updateField('phone')}
          keyboardType="phone-pad"
        />
        <Field
          label="Email"
          value={form.email}
          onChangeText={updateField('email')}
          keyboardType="email-address"
        />
        <Field label="Website" value={form.website} onChangeText={updateField('website')} />
        <Field label="Mailing Address" value={form.address} onChangeText={updateField('address')} />

        <Text style={styles.sectionLabel}>VENDOR DETAILS</Text>
        <Field
          label="FFL License Number"
          value={form.fflLicenseNumber}
          onChangeText={updateField('fflLicenseNumber')}
        />
        <Field
          label="FFL Expiration Date (YYYY-MM-DD)"
          value={form.fflExpirationDate}
          onChangeText={updateField('fflExpirationDate')}
        />
        <Field
          label="Vendor Category"
          value={form.vendorCategory}
          onChangeText={updateField('vendorCategory')}
          placeholder="Firearms, Ammo, Accessories, Knives, Apparel…"
        />
        <Field
          label="Preferred Table Location"
          value={form.preferredTableLocation}
          onChangeText={updateField('preferredTableLocation')}
          placeholder="Corner, near entrance, near power…"
        />
        <Field
          label="Products They Bring"
          value={form.productsTheyBring}
          onChangeText={updateField('productsTheyBring')}
          multiline
        />
        <Field
          label="Booth Notes"
          value={form.boothNotes}
          onChangeText={updateField('boothNotes')}
          multiline
        />

        {isStaffView && (
          <>
            <Text style={styles.sectionLabel}>STAFF ONLY</Text>
            <Field
              label="Staff Notes (private)"
              value={form.staffNotes}
              onChangeText={updateField('staffNotes')}
              multiline
              placeholder="Always brings extra tables, difficult to reach…"
            />

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Insurance On File</Text>
              <View style={styles.toggleRow}>
                <Pressable
                  style={[styles.toggleOption, form.insuranceOnFile && styles.toggleOptionActive]}
                  onPress={() => setForm((prev) => ({ ...prev, insuranceOnFile: true }))}
                >
                  <Text
                    style={[
                      styles.toggleOptionText,
                      form.insuranceOnFile && styles.toggleOptionTextActive,
                    ]}
                  >
                    Yes
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.toggleOption, !form.insuranceOnFile && styles.toggleOptionActive]}
                  onPress={() => setForm((prev) => ({ ...prev, insuranceOnFile: false }))}
                >
                  <Text
                    style={[
                      styles.toggleOptionText,
                      !form.insuranceOnFile && styles.toggleOptionTextActive,
                    ]}
                  >
                    No
                  </Text>
                </Pressable>
              </View>
            </View>

            <Field
              label="Insurance Expiration Date (YYYY-MM-DD)"
              value={form.insuranceExpirationDate}
              onChangeText={updateField('insuranceExpirationDate')}
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

        <Pressable
          style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving…' : isNewProfile ? 'Create Profile' : 'Save Changes'}
          </Text>
        </Pressable>

        {!isNewProfile && vendor && (
          <View style={styles.qrSection}>
            <Text style={styles.sectionLabel}>CHECK-IN QR CODE</Text>
            <Text style={styles.qrHint}>
              Show this to staff at the door — they'll scan it to check you in.
            </Text>
            <VendorQrCode vendorId={vendor.id} />
          </View>
        )}

        {isStaffView && !isNewProfile && (
          <>
            <Text style={styles.sectionLabel}>VENDOR HISTORY</Text>
            {history === null ? (
              <ActivityIndicator color={colors.navy} />
            ) : history.length === 0 ? (
              <Text style={styles.emptyHistoryText}>No past table requests for this vendor.</Text>
            ) : (
              history.map((entry) => (
                <HistoryRow key={entry.id} entry={entry} />
              ))
            )}
          </>
        )}

        {onSignOut && (
          <View style={styles.dangerZone}>
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

const STATUS_LABEL: Record<TableRequestStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  denied: 'Denied',
};

function HistoryRow({ entry }: { entry: VendorRequestHistoryEntry }) {
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
  scrollContent: {
    paddingBottom: 48,
  },
  header: {
    backgroundColor: colors.navy,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 4,
    borderBottomColor: colors.brass,
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
    fontWeight: '700',
  },
  signOutText: {
    color: colors.headerSubtitle,
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
  content: {
    padding: 20,
  },
  notice: {
    backgroundColor: '#EDE0C6',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  noticeText: {
    fontSize: 16,
    lineHeight: 23,
    color: colors.textPrimary,
  },
  warningNotice: {
    backgroundColor: '#F1DCD3',
    borderRadius: 10,
    padding: 16,
    marginBottom: 14,
  },
  warningNoticeText: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '700',
    color: colors.red,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.navy,
    letterSpacing: 1.5,
    marginTop: 10,
    marginBottom: 14,
  },
  field: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 52,
    fontSize: 17,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  fieldInputMultiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  toggleOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 10,
    paddingVertical: 14,
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  toggleOptionActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  toggleOptionText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  toggleOptionTextActive: {
    color: colors.white,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tagChip: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  tagChipActive: {
    backgroundColor: colors.brass,
    borderColor: colors.brass,
  },
  tagChipText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tagChipTextActive: {
    color: colors.textPrimary,
  },
  saveButton: {
    backgroundColor: colors.navy,
    borderRadius: 12,
    paddingVertical: 18,
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  saveButtonPressed: {
    opacity: 0.85,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  emptyHistoryText: {
    fontSize: 16,
    lineHeight: 23,
    color: colors.textSecondary,
  },
  qrSection: {
    marginTop: 28,
    alignItems: 'center',
  },
  qrHint: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  dangerZone: {
    marginTop: 36,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  dangerHint: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.textSecondary,
    marginBottom: 14,
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: 12,
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
    fontWeight: '800',
  },
  historyRow: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.divider,
  },
  historyEventName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  historyMeta: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    marginTop: 3,
  },
});
