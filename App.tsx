import { Rye_400Regular, useFonts } from '@expo-google-fonts/rye';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, View } from 'react-native';

import type { Event } from './src/db/types';
import EventDetailScreen from './src/screens/EventDetailScreen';
import EventsHomeScreen from './src/screens/EventsHomeScreen';
import { colors } from './src/theme/colors';

type Route = { screen: 'home' } | { screen: 'detail'; event: Event };

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
      ) : (
        <EventDetailScreen event={route.event} onBack={() => setRoute({ screen: 'home' })} />
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
});
