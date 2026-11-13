import { PlayfairDisplay_700Bold, useFonts } from '@expo-google-fonts/playfair-display';
import {
  PublicSans_400Regular,
  PublicSans_600SemiBold,
  PublicSans_700Bold,
  PublicSans_800ExtraBold,
} from '@expo-google-fonts/public-sans';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './src/auth/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import type { ThemeColors } from './src/theme/colors';
import { ThemeProvider, useIsDarkMode, useTheme } from './src/theme/ThemeContext';

function AppShell() {
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    PublicSans_400Regular,
    PublicSans_600SemiBold,
    PublicSans_700Bold,
    PublicSans_800ExtraBold,
  });
  const { loading: authLoading } = useAuth();
  const colors = useTheme();
  const isDark = useIsDarkMode();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const loading = !fontsLoaded || authLoading;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.navy} size="large" />
        </View>
      ) : (
        <RootNavigator />
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
