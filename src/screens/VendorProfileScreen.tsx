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

import { createVendor, getVendorById, updateVendor } from '../db/supabase/vendors';
import type { Vendor } from '../db/types';
import { colors } from '../theme/colors';
import { displayFont } from '../theme/fonts';

interface FormState {
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  productsTheyBring: string;
  boothNotes: string;
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
  };
}

export default function VendorProfileScreen({
  vendorId,
  onBack,
  onSaved,
  subtitle = 'STAFF VIEW',
}: {
  vendorId: number | null;
  onBack: () => void;
  onSaved?: (vendor: Vendor) => void;
  subtitle?: string;
}) {
  const [vendor, setVendor] = useState<Vendor | null | undefined>(undefined);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

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

  const updateField = (field: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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
  }, [form, vendor, onSaved]);

  if (vendor === undefined) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.navy} size="large" />
      </View>
    );
  }

  const isNewProfile = vendor === null;

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
        <Field label="Address" value={form.address} onChangeText={updateField('address')} />
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

        <Pressable
          style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving…' : isNewProfile ? 'Create Profile' : 'Save Changes'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
  keyboardType?: 'phone-pad' | 'email-address';
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
});
