import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useAuth, type AuthActionResult } from '../auth/AuthContext';
import { colors } from '../theme/colors';
import { displayFont } from '../theme/fonts';

type Mode = 'signIn' | 'signUp';

export default function AuthScreen({
  intent,
  onBack,
  onSuccess,
}: {
  intent: 'vendor' | 'staff';
  onBack: () => void;
  onSuccess: (result: AuthActionResult) => void;
}) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signIn');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }
    if (mode === 'signUp' && !name.trim()) {
      setError('Name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const result =
        mode === 'signUp'
          ? await signUp({ name: name.trim(), email: email.trim(), password })
          : await signIn(email.trim(), password);

      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.needsConfirmation) {
        setNotice('Account created. Check your email to confirm it, then sign in below.');
        setMode('signIn');
        setPassword('');
        return;
      }
      onSuccess(result);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable onPress={onBack} style={styles.backButton} hitSlop={12}>
            <Text style={styles.backButtonText}>‹ Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{mode === 'signIn' ? 'Sign In' : 'Create Account'}</Text>
          <Text style={styles.headerSubtitle}>
            {intent === 'vendor' ? 'VENDOR ACCESS' : 'STAFF ACCESS'}
          </Text>
        </View>

        <View style={styles.content}>
          {notice && (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>{notice}</Text>
            </View>
          )}
          {error && (
            <View style={styles.errorNotice}>
              <Text style={styles.errorNoticeText}>{error}</Text>
            </View>
          )}

          {mode === 'signUp' && (
            <Field label="Name" value={name} onChangeText={setName} autoCapitalize="words" />
          )}
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <Pressable
            style={({ pressed }) => [styles.submitButton, pressed && styles.submitButtonPressed]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>
                {mode === 'signIn' ? 'Sign In' : 'Create Account'}
              </Text>
            )}
          </Pressable>

          <Pressable
            style={styles.switchModeButton}
            onPress={() => switchMode(mode === 'signIn' ? 'signUp' : 'signIn')}
          >
            <Text style={styles.switchModeText}>
              {mode === 'signIn' ? "New here? Create an account" : 'Already have an account? Sign in'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'email-address';
  autoCapitalize?: 'none' | 'words';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={styles.fieldInput}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        placeholderTextColor={colors.textSecondary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  scrollContent: {
    flexGrow: 1,
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
  errorNotice: {
    backgroundColor: '#F3DCDC',
    borderRadius: 10,
    padding: 14,
    marginBottom: 18,
  },
  errorNoticeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.red,
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
  submitButton: {
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
  submitButtonPressed: {
    opacity: 0.85,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  switchModeButton: {
    marginTop: 18,
    alignItems: 'center',
  },
  switchModeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.red,
  },
});
