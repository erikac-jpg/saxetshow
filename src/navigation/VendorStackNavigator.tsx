import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import type { AuthActionResult } from '../auth/AuthContext';
import { useAuth } from '../auth/AuthContext';
import AuthScreen from '../screens/AuthScreen';
import VendorProfileScreen from '../screens/VendorProfileScreen';
import { usePendingVendorRequest } from './PendingVendorRequestContext';
import type { RootTabParamList, VendorStackParamList } from './types';

const Stack = createNativeStackNavigator<VendorStackParamList>();

type Props<Screen extends keyof VendorStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<VendorStackParamList, Screen>,
  BottomTabScreenProps<RootTabParamList>
>;

function VendorAuthAdapter({ navigation }: Props<'VendorAuth'>) {
  const { pendingRequestEvent, setPendingRequestEvent } = usePendingVendorRequest();

  const handleSuccess = (result: AuthActionResult) => {
    if (pendingRequestEvent) {
      const returnToEvent = pendingRequestEvent;
      setPendingRequestEvent(null);
      navigation.navigate('ShowsTab', { screen: 'Detail', params: { event: returnToEvent } });
    }
    // Otherwise there's nothing to do - a successful sign-in flips `session`,
    // and the stack below swaps this screen for VendorProfile on its own.
  };

  return (
    <AuthScreen
      intent="vendor"
      onBack={() => {
        setPendingRequestEvent(null);
        navigation.navigate('ShowsTab', { screen: 'Home' });
      }}
      onSuccess={handleSuccess}
    />
  );
}

function VendorProfileAdapter({ navigation }: Props<'VendorProfile'>) {
  const { appUser, vendor, applyVendor, signOut } = useAuth();
  const { pendingRequestEvent, setPendingRequestEvent } = usePendingVendorRequest();

  return (
    <VendorProfileScreen
      vendorId={vendor?.id ?? null}
      linkUserId={appUser?.id ?? null}
      onBack={() => navigation.navigate('ShowsTab', { screen: 'Home' })}
      onSaved={(savedVendor) => {
        applyVendor(savedVendor);
        if (pendingRequestEvent) {
          const returnToEvent = pendingRequestEvent;
          setPendingRequestEvent(null);
          navigation.navigate('ShowsTab', { screen: 'Detail', params: { event: returnToEvent } });
        }
      }}
      onSignOut={async () => {
        await signOut();
        navigation.navigate('ShowsTab', { screen: 'Home' });
      }}
      subtitle="MY PROFILE"
    />
  );
}

/**
 * Follows React Navigation's auth-flow pattern: which screen is the stack's
 * only child is decided by `session`, not by navigating between them, so
 * signing in/out swaps the whole stack instead of leaving a stale screen
 * reachable via back.
 */
export default function VendorStackNavigator() {
  const { session } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: false }}>
      {!session ? (
        <Stack.Screen name="VendorAuth" component={VendorAuthAdapter} />
      ) : (
        <Stack.Screen name="VendorProfile" component={VendorProfileAdapter} />
      )}
    </Stack.Navigator>
  );
}
