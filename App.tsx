import { Rye_400Regular, useFonts } from '@expo-google-fonts/rye';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import type { Event } from './src/db/types';
import { getMyVendorId, setMyVendorId } from './src/local/myVendorIdentity';
import AgreementScreen from './src/screens/AgreementScreen';
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
  | { screen: 'staff' }
  | { screen: 'vendorProfile'; vendorId: number }
  | { screen: 'myVendorProfile'; vendorId: number | null }
  | { screen: 'agreement'; vendorId: number; eventId: number }
  | { screen: 'qrCheckIn'; eventId: number };

const MEMBER_SCREENS: Route['screen'][] = ['home', 'detail'];

export default function App() {
  const [fontsLoaded] = useFonts({ Rye_400Regular });
  const [route, setRoute] = useState<Route>({ screen: 'home' });

  const backToHome = () => setRoute({ screen: 'home' });
  const backToStaff = () => setRoute({ screen: 'staff' });

  const openMyVendorProfile = async () => {
    const vendorId = await getMyVendorId();
    setRoute({ screen: 'myVendorProfile', vendorId });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      {!fontsLoaded ? (
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
      ) : route.screen === 'vendorProfile' ? (
        <VendorProfileScreen vendorId={route.vendorId} onBack={backToStaff} isStaffView />
      ) : route.screen === 'myVendorProfile' ? (
        <VendorProfileScreen
          vendorId={route.vendorId}
          onBack={backToHome}
          onSaved={(vendor) => setMyVendorId(vendor.id)}
          subtitle="MY PROFILE"
        />
      ) : route.screen === 'agreement' ? (
        <AgreementScreen vendorId={route.vendorId} eventId={route.eventId} onBack={backToStaff} />
      ) : route.screen === 'qrCheckIn' ? (
        <QrCheckInScreen eventId={route.eventId} onBack={backToStaff} />
      ) : (
        <StaffDashboardScreen
          onExit={backToHome}
          onOpenVendorProfile={(vendorId) => setRoute({ screen: 'vendorProfile', vendorId })}
          onOpenAgreement={(vendorId, eventId) =>
            setRoute({ screen: 'agreement', vendorId, eventId })
          }
          onOpenQrCheckIn={(eventId) => setRoute({ screen: 'qrCheckIn', eventId })}
        />
      )}

      {fontsLoaded && MEMBER_SCREENS.includes(route.screen) && (
        <>
          <Pressable style={styles.vendorFab} onPress={openMyVendorProfile} hitSlop={8}>
            <Text style={styles.vendorFabText}>Vendor</Text>
          </Pressable>
          <Pressable
            style={styles.staffFab}
            onPress={() => setRoute({ screen: 'staff' })}
            hitSlop={8}
          >
            <Text style={styles.staffFabText}>Staff</Text>
          </Pressable>
        </>
      )}
    </SafeAreaView>
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
