import { Rye_400Regular, useFonts } from '@expo-google-fonts/rye';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import type { Event } from './src/db/types';
import EventDetailScreen from './src/screens/EventDetailScreen';
import EventsHomeScreen from './src/screens/EventsHomeScreen';
import StaffDashboardScreen from './src/screens/StaffDashboardScreen';
import { colors } from './src/theme/colors';

type Route = { screen: 'home' } | { screen: 'detail'; event: Event } | { screen: 'staff' };

export default function App() {
  const [fontsLoaded] = useFonts({ Rye_400Regular });
  const [route, setRoute] = useState<Route>({ screen: 'home' });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      {!fontsLoaded ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.navy} size="large" />
        </View>
      ) : route.screen === 'home' ? (
        <EventsHomeScreen onSelectEvent={(event) => setRoute({ screen: 'detail', event })} />
      ) : route.screen === 'detail' ? (
        <EventDetailScreen event={route.event} onBack={() => setRoute({ screen: 'home' })} />
      ) : (
        <StaffDashboardScreen onExit={() => setRoute({ screen: 'home' })} />
      )}

      {fontsLoaded && route.screen !== 'staff' && (
        <Pressable
          style={styles.staffFab}
          onPress={() => setRoute({ screen: 'staff' })}
          hitSlop={8}
        >
          <Text style={styles.staffFabText}>Staff</Text>
        </Pressable>
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
});
