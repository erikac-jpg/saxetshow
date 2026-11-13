import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getUpcomingEvents } from '../db/supabase/events';
import type { Event } from '../db/types';
import AppIcon from '../components/AppIcon';
import HeroRibbon from '../components/HeroRibbon';
import SaxetPatch from '../components/SaxetPatch';
import type { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import {
  bodyFont,
  bodyFontBold,
  bodyFontExtraBold,
  displayFont,
  displayFontBold,
} from '../theme/fonts';

const MONTH_ABBR = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

function formatEventDate(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Month abbreviation + day number for the date block, parsed straight from the ISO date so it never drifts from `formatEventDate`'s own parsing. */
function dateBlockParts(dateString: string): { month: string; day: string } {
  const [, , monthStr, dayStr] = dateString.match(/^(\d{4})-(\d{2})-(\d{2})/) ?? [];
  const monthIndex = monthStr ? Number(monthStr) - 1 : NaN;
  return {
    month: MONTH_ABBR[monthIndex] ?? '',
    day: dayStr ? String(Number(dayStr)) : '',
  };
}

function EventCard({ event, onPress }: { event: Event; onPress: () => void }) {
  const colors = useTheme();
  const cardStyles = useMemo(() => createStyles(colors), [colors]);
  const { month, day } = dateBlockParts(event.date);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [cardStyles.card, pressed && cardStyles.cardPressed]}
    >
      <View style={cardStyles.dateBlock}>
        <AppIcon name="star" size={14} color={colors.cream} style={cardStyles.dateBlockStar} />
        <Text style={cardStyles.dateBlockMonth}>{month}</Text>
        <Text style={cardStyles.dateBlockDay}>{day}</Text>
      </View>
      <View style={cardStyles.cardBody}>
        <Text style={cardStyles.cardTitle}>{event.name}</Text>
        <Text style={cardStyles.cardDate}>{formatEventDate(event.date)}</Text>
        {event.location ? <Text style={cardStyles.cardLocation}>{event.location}</Text> : null}
      </View>
    </Pressable>
  );
}

function eventYear(event: Event): number {
  return Number(event.date.slice(0, 4));
}

function YearTabs({
  years,
  selectedYear,
  onSelectYear,
}: {
  years: number[];
  selectedYear: number | null;
  onSelectYear: (year: number) => void;
}) {
  const colors = useTheme();
  const yearStyles = useMemo(() => createStyles(colors), [colors]);
  if (years.length < 2) return null;
  return (
    <View style={yearStyles.yearTabRow}>
      {years.map((year) => {
        const active = year === selectedYear;
        return (
          <Pressable
            key={year}
            onPress={() => onSelectYear(year)}
            style={[yearStyles.yearTab, active && yearStyles.yearTabActive]}
          >
            <Text style={[yearStyles.yearTabText, active && yearStyles.yearTabTextActive]}>{year}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function EmptyState() {
  const colors = useTheme();
  const emptyStyles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={emptyStyles.emptyState}>
      <AppIcon
        name="calendar"
        size={48}
        color={colors.textSecondary}
        strokeWidth={1.4}
        style={emptyStyles.emptyStateIcon}
      />
      <Text style={emptyStyles.emptyStateTitle}>No shows on the calendar yet</Text>
      <Text style={emptyStyles.emptyStateSubtitle}>Add your first event and it’ll show up here.</Text>
    </View>
  );
}

export default function EventsHomeScreen({
  onSelectEvent,
  onOpenPrivacyPolicy,
  onOpenTermsAndConditions,
}: {
  onSelectEvent: (event: Event) => void;
  onOpenPrivacyPolicy: () => void;
  onOpenTermsAndConditions: () => void;
}) {
  const [events, setEvents] = useState<Event[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const colors = useTheme();
  const screenStyles = useMemo(() => createStyles(colors), [colors]);

  const loadEvents = useCallback(async () => {
    try {
      const upcoming = await getUpcomingEvents();
      setEvents(upcoming);
      setError(null);
      setSelectedYear((current) => {
        const years = Array.from(new Set(upcoming.map(eventYear))).sort((a, b) => a - b);
        return current !== null && years.includes(current) ? current : years[0] ?? null;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong loading events.');
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  }, [loadEvents]);

  const years = useMemo(
    () => Array.from(new Set((events ?? []).map(eventYear))).sort((a, b) => a - b),
    [events]
  );
  const visibleEvents = useMemo(() => {
    if (!events) return [];
    return selectedYear === null ? events : events.filter((e) => eventYear(e) === selectedYear);
  }, [events, selectedYear]);

  return (
    <View style={screenStyles.container}>
      <View style={screenStyles.header}>
        <HeroRibbon height={110} opacity={1} />
        <View style={screenStyles.headerStarRow}>
          <AppIcon name="star" size={30} color={colors.cream} />
          <AppIcon name="star" size={18} color={colors.cream} style={screenStyles.headerStarSmall} />
        </View>
        <SaxetPatch size={64} style={screenStyles.headerPatch} />
        <View style={screenStyles.eyebrowRow}>
          <View style={screenStyles.eyebrowRule} />
          <Text style={screenStyles.eyebrow}>Texas Tradition</Text>
          <View style={screenStyles.eyebrowRule} />
        </View>
        <Text style={screenStyles.headerTitle}>Saxet Gun Show</Text>
      </View>
      <View style={screenStyles.headerBand}>
        <AppIcon name="star" size={12} color={colors.white} />
        <Text style={screenStyles.headerBandText}>Upcoming Gun Shows</Text>
        <AppIcon name="star" size={12} color={colors.white} />
      </View>

      <ScrollView
        style={screenStyles.body}
        contentContainerStyle={screenStyles.bodyContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accentText} />
        }
      >
        <Text style={screenStyles.sectionHeading}>Find your next show.</Text>
        <YearTabs years={years} selectedYear={selectedYear} onSelectYear={setSelectedYear} />
        {events === null ? (
          <View style={screenStyles.centered}>
            <ActivityIndicator color={colors.accentText} size="large" />
          </View>
        ) : error ? (
          <View style={screenStyles.centered}>
            <Text style={screenStyles.errorText}>{error}</Text>
          </View>
        ) : events.length === 0 ? (
          <EmptyState />
        ) : (
          <View style={screenStyles.listContent}>
            {visibleEvents.map((item) => (
              <EventCard key={item.id} event={item} onPress={() => onSelectEvent(item)} />
            ))}
          </View>
        )}

        <View style={screenStyles.footerDivider}>
          <View style={screenStyles.footerDividerLine} />
          <View style={screenStyles.footerDividerStars}>
            <AppIcon name="star" size={10} color={colors.accentText} />
            <AppIcon name="star" size={10} color={colors.accentText} />
            <AppIcon name="star" size={10} color={colors.accentText} />
          </View>
          <View style={screenStyles.footerDividerLine} />
        </View>
        <View style={screenStyles.footerLinkRow}>
          <Pressable onPress={onOpenPrivacyPolicy} hitSlop={12}>
            <Text style={screenStyles.footerLink}>Privacy Policy</Text>
          </Pressable>
          <Text style={screenStyles.footerLinkDivider}>|</Text>
          <Pressable onPress={onOpenTermsAndConditions} hitSlop={12}>
            <Text style={screenStyles.footerLink}>Terms & Conditions</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.navy,
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    overflow: 'hidden',
  },
  headerStarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  headerStarSmall: {
    marginTop: 10,
  },
  headerPatch: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  eyebrowRule: {
    width: 28,
    height: 1,
    backgroundColor: colors.headerSubtitle,
  },
  eyebrow: {
    fontFamily: bodyFontBold,
    color: colors.cream,
    fontSize: 13,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontFamily: displayFont,
    color: colors.cream,
    fontSize: 48,
    lineHeight: 54,
    textAlign: 'center',
  },
  headerBand: {
    backgroundColor: colors.flagRed,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  headerBandText: {
    fontFamily: bodyFontExtraBold,
    color: colors.white,
    fontSize: 13,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingBottom: 28,
  },
  sectionHeading: {
    fontFamily: displayFontBold,
    color: colors.textPrimary,
    fontSize: 28,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 4,
  },
  yearTabRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  yearTab: {
    paddingVertical: 9,
    paddingHorizontal: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.accentText,
    backgroundColor: colors.background,
  },
  yearTabActive: {
    backgroundColor: colors.navy,
  },
  yearTabText: {
    fontSize: 15,
    fontFamily: bodyFontBold,
    color: colors.accentText,
  },
  yearTabTextActive: {
    color: colors.cream,
  },
  listContent: {
    padding: 16,
  },
  footerDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginTop: 12,
    paddingHorizontal: 40,
  },
  footerDividerLine: {
    flex: 1,
    maxWidth: 64,
    height: 1.5,
    backgroundColor: colors.flagRed,
  },
  footerDividerStars: {
    flexDirection: 'row',
    gap: 6,
  },
  footerLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 14,
  },
  footerLink: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: bodyFont,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  footerLinkDivider: {
    fontSize: 15,
    fontFamily: bodyFont,
    color: colors.textSecondary,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.accentText,
    marginBottom: 16,
  },
  cardPressed: {
    opacity: 0.8,
  },
  dateBlock: {
    width: 84,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  dateBlockStar: {
    marginBottom: 6,
  },
  dateBlockMonth: {
    fontSize: 13,
    letterSpacing: 1.5,
    fontFamily: bodyFontExtraBold,
    color: colors.headerSubtitle,
  },
  dateBlockDay: {
    fontSize: 34,
    lineHeight: 38,
    fontFamily: bodyFontExtraBold,
    color: colors.cream,
    marginTop: 2,
  },
  cardBody: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 20,
    lineHeight: 25,
    fontFamily: displayFontBold,
    color: colors.textPrimary,
  },
  cardDate: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.accentText,
    fontFamily: bodyFontBold,
    marginTop: 6,
  },
  cardLocation: {
    fontSize: 14,
    lineHeight: 19,
    fontFamily: bodyFont,
    color: colors.textSecondary,
    marginTop: 4,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    lineHeight: 23,
    fontFamily: bodyFont,
    color: colors.red,
    paddingHorizontal: 24,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 19,
    lineHeight: 27,
    fontFamily: bodyFontBold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    lineHeight: 23,
    fontFamily: bodyFont,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});
