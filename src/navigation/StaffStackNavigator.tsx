import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../auth/AuthContext';
import HeroRibbon from '../components/HeroRibbon';
import AgreementScreen from '../screens/AgreementScreen';
import AuthScreen from '../screens/AuthScreen';
import QrCheckInScreen from '../screens/QrCheckInScreen';
import StaffDashboardScreen from '../screens/StaffDashboardScreen';
import VendorProfileScreen from '../screens/VendorProfileScreen';
import type { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { bodyFont, bodyFontBold, bodyFontExtraBold, displayFont } from '../theme/fonts';
import type { RootTabParamList, StaffStackParamList } from './types';

const Stack = createNativeStackNavigator<StaffStackParamList>();

const NOT_STAFF_MESSAGE =
  "Your account isn't set up for staff access yet. Ask the show organizer to promote your account.";

type Props<Screen extends keyof StaffStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<StaffStackParamList, Screen>,
  BottomTabScreenProps<RootTabParamList>
>;

function StaffAuthAdapter({ navigation }: Props<'StaffAuth'>) {
  return (
    <AuthScreen
      intent="staff"
      onBack={() => navigation.navigate('ShowsTab', { screen: 'Home' })}
      onSuccess={() => {
        // A successful sign-in flips `session`/`isStaff`, and the stack
        // below swaps this screen for StaffAccessRequired or StaffDashboard
        // on its own - nothing to navigate to here.
      }}
    />
  );
}

/** Shown in-tab instead of the old `Alert.alert` bounce, so a signed-in non-staff account has somewhere to land rather than being shoved back to Home. */
function StaffAccessRequiredScreen({ navigation }: Props<'StaffAccessRequired'>) {
  const { signOut } = useAuth();
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <HeroRibbon />
        <Text style={styles.headerTitle}>Staff</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.message}>{NOT_STAFF_MESSAGE}</Text>
        <Pressable
          style={styles.primaryButton}
          onPress={() => navigation.navigate('ShowsTab', { screen: 'Home' })}
        >
          <Text style={styles.primaryButtonText}>Back to Shows</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryButton}
          onPress={async () => {
            await signOut();
          }}
        >
          <Text style={styles.secondaryButtonText}>Sign Out</Text>
        </Pressable>
      </View>
    </View>
  );
}

function StaffDashboardAdapter({ navigation }: Props<'StaffDashboard'>) {
  const { signOut } = useAuth();
  return (
    <StaffDashboardScreen
      onExit={() => navigation.navigate('ShowsTab', { screen: 'Home' })}
      onSignOut={async () => {
        await signOut();
        navigation.navigate('ShowsTab', { screen: 'Home' });
      }}
      onOpenVendorProfile={(vendorId) => navigation.navigate('StaffVendorProfile', { vendorId })}
      onOpenAgreement={(vendorId, eventId) =>
        navigation.navigate('StaffAgreement', { vendorId, eventId })
      }
      onOpenQrCheckIn={(eventId) => navigation.navigate('StaffQrCheckIn', { eventId })}
    />
  );
}

function StaffVendorProfileAdapter({ route, navigation }: Props<'StaffVendorProfile'>) {
  return (
    <VendorProfileScreen
      vendorId={route.params.vendorId}
      onBack={() => navigation.goBack()}
      isStaffView
    />
  );
}

function StaffAgreementAdapter({ route, navigation }: Props<'StaffAgreement'>) {
  return (
    <AgreementScreen
      vendorId={route.params.vendorId}
      eventId={route.params.eventId}
      onBack={() => navigation.goBack()}
    />
  );
}

function StaffQrCheckInAdapter({ route, navigation }: Props<'StaffQrCheckIn'>) {
  return <QrCheckInScreen eventId={route.params.eventId} onBack={() => navigation.goBack()} />;
}

/**
 * Follows React Navigation's auth-flow pattern: which screen(s) the stack
 * holds is decided by `session`/`isStaff`, not by navigating between them,
 * so signing in/out or losing staff access swaps the whole stack instead of
 * leaving a stale screen reachable via back.
 */
export default function StaffStackNavigator() {
  const { session, isStaff } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: false }}>
      {!session ? (
        <Stack.Screen name="StaffAuth" component={StaffAuthAdapter} />
      ) : !isStaff ? (
        <Stack.Screen name="StaffAccessRequired" component={StaffAccessRequiredScreen} />
      ) : (
        <>
          <Stack.Screen name="StaffDashboard" component={StaffDashboardAdapter} />
          <Stack.Screen name="StaffVendorProfile" component={StaffVendorProfileAdapter} />
          <Stack.Screen name="StaffAgreement" component={StaffAgreementAdapter} />
          <Stack.Screen name="StaffQrCheckIn" component={StaffQrCheckInAdapter} />
        </>
      )}
    </Stack.Navigator>
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
  headerTitle: {
    fontFamily: displayFont,
    color: colors.white,
    fontSize: 30,
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  message: {
    fontFamily: bodyFont,
    fontSize: 16,
    lineHeight: 23,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 28,
  },
  primaryButton: {
    backgroundColor: colors.navy,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 4,
    marginBottom: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: bodyFontExtraBold,
    letterSpacing: 0.5,
  },
  secondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 28,
  },
  secondaryButtonText: {
    color: colors.accentText,
    fontSize: 15,
    fontFamily: bodyFontBold,
  },
});
