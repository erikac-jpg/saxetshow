import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  PRIVACY_POLICY_PARAGRAPHS,
  PRIVACY_POLICY_TITLE,
} from '../content/privacyPolicyTemplate';
import { colors } from '../theme/colors';
import { displayFont } from '../theme/fonts';

export default function PrivacyPolicyScreen({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backButton} hitSlop={12}>
          <Text style={styles.backButtonText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.policyTitle}>{PRIVACY_POLICY_TITLE}</Text>
          {PRIVACY_POLICY_PARAGRAPHS.map((paragraph, index) => (
            <Text key={index} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
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
  scrollContent: {
    padding: 20,
    paddingBottom: 48,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  policyTitle: {
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
});
