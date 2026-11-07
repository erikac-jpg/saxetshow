import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useMemo } from 'react';

import AppIcon from '../components/AppIcon';
import type { ThemeColors } from '../theme/colors';
import { useIsDarkMode, useTheme } from '../theme/ThemeContext';
import { bodyFontBold } from '../theme/fonts';
import { PendingVendorRequestProvider } from './PendingVendorRequestContext';
import ShowsStackNavigator from './ShowsStackNavigator';
import StaffStackNavigator from './StaffStackNavigator';
import type { RootTabParamList } from './types';
import VendorStackNavigator from './VendorStackNavigator';

const Tab = createBottomTabNavigator<RootTabParamList>();

function buildNavigationTheme(colors: ThemeColors, isDark: boolean) {
  const base = isDark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      background: colors.background,
      card: colors.navy,
      text: colors.textPrimary,
      border: colors.divider,
      primary: colors.flagRed,
    },
  };
}

/**
 * Bottom tab bar is the app's primary navigation - it replaces the old
 * floating Vendor/Staff FABs, and every stack behind it has
 * `gestureEnabled: false` so the iOS edge swipe-back gesture never fires
 * (easy to trigger by accident, and there's always a visible "‹ Back"
 * button on every pushed screen already).
 */
export default function RootNavigator() {
  const colors = useTheme();
  const isDark = useIsDarkMode();
  const navigationTheme = useMemo(() => buildNavigationTheme(colors, isDark), [colors, isDark]);

  return (
    <PendingVendorRequestProvider>
      <NavigationContainer theme={navigationTheme}>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: colors.navy,
              borderTopColor: colors.flagRed,
              borderTopWidth: 3,
              height: 64,
              paddingTop: 8,
            },
            tabBarActiveTintColor: colors.white,
            tabBarInactiveTintColor: colors.headerSubtitle,
            tabBarLabelStyle: {
              fontFamily: bodyFontBold,
              fontSize: 12,
              letterSpacing: 0.3,
            },
          }}
        >
          <Tab.Screen
            name="ShowsTab"
            component={ShowsStackNavigator}
            options={{
              title: 'Shows',
              tabBarIcon: ({ color, size }) => <AppIcon name="ticket" color={color} size={size} />,
            }}
          />
          <Tab.Screen
            name="VendorTab"
            component={VendorStackNavigator}
            options={{
              title: 'Vendor',
              tabBarIcon: ({ color, size }) => <AppIcon name="person" color={color} size={size} />,
            }}
          />
          <Tab.Screen
            name="StaffTab"
            component={StaffStackNavigator}
            options={{
              title: 'Staff',
              tabBarIcon: ({ color, size }) => <AppIcon name="shield" color={color} size={size} />,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </PendingVendorRequestProvider>
  );
}
