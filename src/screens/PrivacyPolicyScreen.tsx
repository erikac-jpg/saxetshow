import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  PRIVACY_POLICY_PARAGRAPHS,
  PRIVACY_POLICY_TITLE,
} from '../content/privacyPolicyTemplate';
import HeroRibbon from '../components/HeroRibbon';
import type { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { bodyFont, bodyFontBold, bodyFontExtraBold, displayFontBold } from '../theme/fonts';

export default function PrivacyPolicyScreen({ onBack }: { onBack: () => void }) {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <HeroRibbon />
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    paddingVertical: 6,
  },
  backButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: bodyFontBold,
  },
  headerTitle: {
    fontFamily: displayFontBold,
    color: colors.white,
    fontSize: 30,
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 48,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.accentText,
    padding: 22,
  },
  policyTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: bodyFontExtraBold,
    color: colors.accentText,
    marginBottom: 16,
  },
  paragraph: {
    fontSize: 17,
    lineHeight: 27,
    fontFamily: bodyFont,
    color: colors.textPrimary,
    marginBottom: 16,
  },
});
