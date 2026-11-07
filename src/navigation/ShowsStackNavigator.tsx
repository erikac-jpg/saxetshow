import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import EventDetailScreen from '../screens/EventDetailScreen';
import EventsHomeScreen from '../screens/EventsHomeScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsAndConditionsScreen from '../screens/TermsAndConditionsScreen';
import { usePendingVendorRequest } from './PendingVendorRequestContext';
import type { RootTabParamList, ShowsStackParamList } from './types';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

const Stack = createNativeStackNavigator<ShowsStackParamList>();

type Props<Screen extends keyof ShowsStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<ShowsStackParamList, Screen>,
  BottomTabScreenProps<RootTabParamList>
>;

function HomeAdapter({ navigation }: Props<'Home'>) {
  return (
    <EventsHomeScreen
      onSelectEvent={(event) => navigation.navigate('Detail', { event })}
      onOpenPrivacyPolicy={() => navigation.navigate('PrivacyPolicy')}
      onOpenTermsAndConditions={() => navigation.navigate('TermsAndConditions')}
    />
  );
}

function DetailAdapter({ route, navigation }: Props<'Detail'>) {
  const { setPendingRequestEvent } = usePendingVendorRequest();
  return (
    <EventDetailScreen
      event={route.params.event}
      onBack={() => navigation.goBack()}
      onNeedVendorAccount={(event) => {
        setPendingRequestEvent(event);
        navigation.navigate('VendorTab', { screen: 'VendorAuth' });
      }}
    />
  );
}

function PrivacyPolicyAdapter({ navigation }: Props<'PrivacyPolicy'>) {
  return <PrivacyPolicyScreen onBack={() => navigation.goBack()} />;
}

function TermsAndConditionsAdapter({ navigation }: Props<'TermsAndConditions'>) {
  return <TermsAndConditionsScreen onBack={() => navigation.goBack()} />;
}

/** Stack behind the "Shows" tab - swipe-back is disabled app-wide so a stray edge swipe can't bounce someone off a screen they didn't mean to leave. */
export default function ShowsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: false }}>
      <Stack.Screen name="Home" component={HomeAdapter} />
      <Stack.Screen name="Detail" component={DetailAdapter} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyAdapter} />
      <Stack.Screen name="TermsAndConditions" component={TermsAndConditionsAdapter} />
    </Stack.Navigator>
  );
}
