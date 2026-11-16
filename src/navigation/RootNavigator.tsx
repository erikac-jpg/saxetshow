import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useEffect, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../auth/AuthContext';
import AppIcon from '../components/AppIcon';
import { getPendingRequestCount, getTableRequestsForVendor } from '../db/supabase/tableRequests';
import type { ThemeColors } from '../theme/colors';
import { useIsDarkMode, useTheme } from '../theme/ThemeContext';
import { bodyFontBold } from '../theme/fonts';
import { PendingVendorRequestProvider } from './PendingVendorRequestContext';
import ShowsStackNavigator from './ShowsStackNavigator';
import StaffStackNavigator from './StaffStackNavigator';
import type { RootTabParamList } from './types';
import VendorStackNavigator from './VendorStackNavigator';

// How often the tab badges re-poll for changes - there's no realtime
// subscription here, just a periodic refresh, so this is a tradeoff
// between staleness and query volume rather than a real-time guarantee.
const BADGE_POLL_MS = 30000;

/** Count of pending requests across every show, for staff - cleared the moment a request is approved/denied, not tracked as "seen" per person. */
function usePendingRequestBadge(isStaff: boolean): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isStaff) {
      setCount(0);
      return;
    }
    let cancelled = false;
    const refresh = () => {
      getPendingRequestCount()
        .then((value) => {
          if (!cancelled) setCount(value);
        })
        .catch(() => {});
    };
    refresh();
    const interval = setInterval(refresh, BADGE_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isStaff]);

  return count;
}

/** Whether the signed-in vendor has at least one approved, not-yet-checked-in request - a live status flag (clears itself once staff checks them in), not an unread count. */
function useVendorApprovalBadge(vendorId: number | null): boolean {
  const [hasApproval, setHasApproval] = useState(false);

  useEffect(() => {
    if (vendorId === null) {
      setHasApproval(false);
      return;
    }
    let cancelled = false;
    const refresh = () => {
      getTableRequestsForVendor(vendorId)
        .then((requests) => {
          if (cancelled) return;
          setHasApproval(
            requests.some((request) => request.status === 'approved' && !request.checkedInAt)
          );
        })
        .catch(() => {});
    };
    refresh();
    const interval = setInterval(refresh, BADGE_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [vendorId]);

  return hasApproval;
}

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
  const { isStaff, vendor } = useAuth();
  const pendingCount = usePendingRequestBadge(isStaff);
  const hasVendorApproval = useVendorApprovalBadge(vendor?.id ?? null);
  // Setting an explicit tabBarStyle.height opts out of React Navigation's
  // own safe-area handling, so the home-indicator/gesture-bar inset has to
  // be added back in by hand or the icons/labels render underneath it.
  const insets = useSafeAreaInsets();
  // 56 is the icon+label content height the bar was already sized for; the
  // bottom padding below reserves room for the home indicator on top of it
  // instead of eating into that space.
  const tabBarBottomPadding = Math.max(insets.bottom, 8);
  const tabBarHeight = 8 + 56 + tabBarBottomPadding;

  return (
    <PendingVendorRequestProvider>
      <NavigationContainer theme={navigationTheme}>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            // The bar has a fixed height - at the largest accessibility text
            // sizes, a scaling label would overlap the icon above it.
            // Screen readers still announce the full tab name regardless.
            tabBarAllowFontScaling: false,
            tabBarStyle: {
              backgroundColor: colors.navy,
              borderTopColor: colors.flagRed,
              borderTopWidth: 3,
              height: tabBarHeight,
              paddingTop: 8,
              paddingBottom: tabBarBottomPadding,
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
              tabBarIcon: ({ color, size }) => <AppIcon name="calendar" color={color} size={size} />,
            }}
          />
          <Tab.Screen
            name="VendorTab"
            component={VendorStackNavigator}
            options={{
              title: 'Vendor',
              tabBarIcon: ({ color, size }) => <AppIcon name="storefront" color={color} size={size} />,
              tabBarBadge: hasVendorApproval ? '✓' : undefined,
              tabBarBadgeStyle: { backgroundColor: colors.flagRed },
            }}
          />
          <Tab.Screen
            name="StaffTab"
            component={StaffStackNavigator}
            options={{
              title: 'Staff',
              tabBarIcon: ({ color, size }) => <AppIcon name="people" color={color} size={size} />,
              tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
              tabBarBadgeStyle: { backgroundColor: colors.flagRed },
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </PendingVendorRequestProvider>
  );
}
