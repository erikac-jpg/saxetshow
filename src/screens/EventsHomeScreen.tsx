import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getUpcomingEvents } from '../db/supabase/events';
import type { Event } from '../db/types';
import { colors } from '../theme/colors';
import { displayFont } from '../theme/fonts';

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

function EventCard({ event, onPress }: { event: Event; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {event.image ? (
        <Image source={{ uri: event.image }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
          <Text style={styles.cardImagePlaceholderText}>★</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{event.name}</Text>
        <Text style={styles.cardDate}>{formatEventDate(event.date)}</Text>
        {event.location ? <Text style={styles.cardLocation}>{event.location}</Text> : null}
      </View>
    </Pressable>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateEmoji}>🎪</Text>
      <Text style={styles.emptyStateTitle}>No shows on the calendar yet</Text>
      <Text style={styles.emptyStateSubtitle}>Add your first event and it’ll show up here.</Text>
    </View>
  );
}

export default function EventsHomeScreen({
  onSelectEvent,
  onOpenPrivacyPolicy,
}: {
  onSelectEvent: (event: Event) => void;
  onOpenPrivacyPolicy: () => void;
}) {
  const [events, setEvents] = useState<Event[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    try {
      const upcoming = await getUpcomingEvents();
      setEvents(upcoming);
      setError(null);
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saxet Gun Show</Text>
        <Text style={styles.headerSubtitle}>UPCOMING GUN SHOWS</Text>
      </View>

      <View style={styles.body}>
        {events === null ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.navy} size="large" />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : events.length === 0 ? (
          <EmptyState />
        ) : (
          <FlatList
            data={events}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <EventCard event={item} onPress={() => onSelectEvent(item)} />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.navy} />
            }
          />
        )}
      </View>

      <View style={styles.footer}>
        <Pressable onPress={onOpenPrivacyPolicy} hitSlop={8}>
          <Text style={styles.footerLink}>Privacy Policy</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  header: {
    backgroundColor: colors.navy,
    paddingTop: 20,
    paddingBottom: 22,
    paddingHorizontal: 20,
    borderBottomWidth: 4,
    borderBottomColor: colors.red,
  },
  headerTitle: {
    fontFamily: displayFont,
    color: colors.white,
    fontSize: 36,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: colors.headerSubtitle,
    fontSize: 13,
    marginTop: 2,
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  body: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  footer: {
    paddingVertical: 14,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.cream,
  },
  footerLink: {
    fontSize: 13,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 14,
    overflow: 'hidden',
    borderLeftWidth: 10,
    borderLeftColor: colors.red,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardImage: {
    width: 108,
    alignSelf: 'stretch',
  },
  cardImagePlaceholder: {
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImagePlaceholderText: {
    fontSize: 36,
    color: colors.white,
  },
  cardBody: {
    flex: 1,
    padding: 18,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  cardDate: {
    fontSize: 14,
    color: colors.red,
    fontWeight: '700',
    marginTop: 6,
  },
  cardLocation: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
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
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
});
