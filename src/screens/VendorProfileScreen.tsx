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
import { createVendor, getVendorById, updateVendor } from '../db/supabase/vendors';
import type { TableRequestStatus, Vendor } from '../db/types';
import { colors } from '../theme/colors';
import { displayFont } from '../theme/fonts';

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

/** Days until `dateString`; negative means already past. Null if unparseable/empty. */
function daysUntil(dateString: string): number | null {
  if (!dateString) return null;
  const target = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function expirationWarning(label: string, dateString: string): string | null {
  const days = daysUntil(dateString);
  if (days === null) return null;
  if (days < 0) return `⚠ ${label} expired`;
  if (days <= 60) return `⚠ ${label} expires in ${days} days`;
  return null;
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
  subtitle = 'STAFF VIEW',
  isStaffView = false,
}: {
  vendorId: number | null;
  onBack: () => void;
  onSaved?: (vendor: Vendor) => void;
  subtitle?: string;
  isStaffView?: boolean;
}) {
  const [vendor, setVendor] = useState<Vendor | null | undefined>(undefined);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
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
        : await createVendor(input);
      setVendor(saved);
      if (saved) {
        onSaved?.(saved);
      }
      Alert.alert('Saved', 'This vendor profile has been saved.');
    } finally {
      setSaving(false);
    }
  }, [form, vendor, onSaved, isStaffView]);

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
        <Pressable onPress={onBack} style={styles.backButton} hitSlop={12}>
          <Text style={styles.backButtonText}>‹ Back</Text>
        </Pressable>
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
    borderBottomColor: colors.red,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  backButtonText: {
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
  content: {
    padding: 20,
  },
  notice: {
    backgroundColor: '#F0E6C8',
    borderRadius: 10,
    padding: 14,
    marginBottom: 18,
  },
  noticeText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  warningNotice: {
    backgroundColor: '#F3DCDC',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  warningNoticeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.red,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.navy,
    letterSpacing: 1.5,
    marginTop: 8,
    marginBottom: 12,
  },
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  fieldInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  toggleOptionActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  toggleOptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  toggleOptionTextActive: {
    color: colors.white,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
  },
  tagChipActive: {
    backgroundColor: colors.red,
    borderColor: colors.red,
  },
  tagChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tagChipTextActive: {
    color: colors.white,
  },
  saveButton: {
    backgroundColor: colors.navy,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
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
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  historyRow: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: colors.divider,
  },
  historyEventName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  historyMeta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
