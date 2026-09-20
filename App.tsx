import { Rye_400Regular, useFonts } from '@expo-google-fonts/rye';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { AuthProvider, useAuth, type AuthActionResult } from './src/auth/AuthContext';
import type { Event } from './src/db/types';
import AgreementScreen from './src/screens/AgreementScreen';
import AuthScreen from './src/screens/AuthScreen';
import EventDetailScreen from './src/screens/EventDetailScreen';
import EventsHomeScreen from './src/screens/EventsHomeScreen';
import PrivacyPolicyScreen from './src/screens/PrivacyPolicyScreen';
import QrCheckInScreen from './src/screens/QrCheckInScreen';
import StaffDashboardScreen from './src/screens/StaffDashboardScreen';
import VendorProfileScreen from './src/screens/VendorProfileScreen';
import { colors } from './src/theme/colors';

type Route =
  | { screen: 'home' }
  | { screen: 'detail'; event: Event }
  | { screen: 'privacyPolicy' }
  | { screen: 'auth'; intent: 'vendor' | 'staff' }
  | { screen: 'staff' }
  | { screen: 'vendorProfile'; vendorId: number }
  | { screen: 'myVendorProfile' }
  | { screen: 'agreement'; vendorId: number; eventId: number }
  | { screen: 'qrCheckIn'; eventId: number };

const MEMBER_SCREENS: Route['screen'][] = ['home', 'detail'];

const NOT_STAFF_MESSAGE =
  "Your account isn't set up for staff access yet. Ask the show organizer to promote your account.";

function AppShell() {
  const [fontsLoaded] = useFonts({ Rye_400Regular });
  const [route, setRoute] = useState<Route>({ screen: 'home' });
  const { loading: authLoading, session, appUser, vendor, isStaff, signOut, applyVendor } = useAuth();

  const backToHome = () => setRoute({ screen: 'home' });
  const backToStaff = () => setRoute({ screen: 'staff' });

  const openVendorTab = () => {
    if (!session) {
      setRoute({ screen: 'auth', intent: 'vendor' });
      return;
    }
    setRoute({ screen: 'myVendorProfile' });
  };

  const openStaffTab = () => {
    if (!session) {
      setRoute({ screen: 'auth', intent: 'staff' });
      return;
    }
    if (!isStaff) {
      Alert.alert('Staff Access Required', NOT_STAFF_MESSAGE);
      return;
    }
    setRoute({ screen: 'staff' });
  };

  const handleAuthSuccess = (intent: 'vendor' | 'staff', result: AuthActionResult) => {
    if (intent === 'staff') {
      if (result.user?.role === 'staff') {
        setRoute({ screen: 'staff' });
      } else {
        setRoute({ screen: 'home' });
        Alert.alert('Signed In', NOT_STAFF_MESSAGE);
      }
    } else {
      setRoute({ screen: 'myVendorProfile' });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setRoute({ screen: 'home' });
  };

  const loading = !fontsLoaded || authLoading;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.navy} size="large" />
        </View>
      ) : route.screen === 'home' ? (
        <EventsHomeScreen
          onSelectEvent={(event) => setRoute({ screen: 'detail', event })}
          onOpenPrivacyPolicy={() => setRoute({ screen: 'privacyPolicy' })}
        />
      ) : route.screen === 'detail' ? (
        <EventDetailScreen event={route.event} onBack={backToHome} />
      ) : route.screen === 'privacyPolicy' ? (
        <PrivacyPolicyScreen onBack={backToHome} />
      ) : route.screen === 'auth' ? (
        <AuthScreen
          intent={route.intent}
          onBack={backToHome}
          onSuccess={(result) => handleAuthSuccess(route.intent, result)}
        />
      ) : route.screen === 'vendorProfile' ? (
        <VendorProfileScreen vendorId={route.vendorId} onBack={backToStaff} isStaffView />
      ) : route.screen === 'myVendorProfile' ? (
        <VendorProfileScreen
          vendorId={vendor?.id ?? null}
          linkUserId={appUser?.id ?? null}
          onBack={backToHome}
          onSaved={applyVendor}
          onSignOut={handleSignOut}
          subtitle="MY PROFILE"
        />
      ) : route.screen === 'agreement' ? (
        <AgreementScreen vendorId={route.vendorId} eventId={route.eventId} onBack={backToStaff} />
      ) : route.screen === 'qrCheckIn' ? (
        <QrCheckInScreen eventId={route.eventId} onBack={backToStaff} />
      ) : (
        <StaffDashboardScreen
          onExit={backToHome}
          onSignOut={handleSignOut}
          onOpenVendorProfile={(vendorId) => setRoute({ screen: 'vendorProfile', vendorId })}
          onOpenAgreement={(vendorId, eventId) =>
            setRoute({ screen: 'agreement', vendorId, eventId })
          }
          onOpenQrCheckIn={(eventId) => setRoute({ screen: 'qrCheckIn', eventId })}
        />
      )}

      {!loading && MEMBER_SCREENS.includes(route.screen) && (
        <>
          <Pressable style={styles.vendorFab} onPress={openVendorTab} hitSlop={8}>
            <Text style={styles.vendorFabText}>Vendor</Text>
          </Pressable>
          <Pressable style={styles.staffFab} onPress={openStaffTab} hitSlop={8}>
            <Text style={styles.staffFabText}>Staff</Text>
          </Pressable>
        </>
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffFab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: colors.navy,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  staffFabText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  vendorFab: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    backgroundColor: colors.red,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  vendorFabText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
