import React, { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../lib/api';
import Icon from '../components/Icon';
import { FadeInView, ScalePress } from '../components/AnimatedComponents';
import { PillTabs, EmptyState } from '../components/DistrictUI';

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  venue: string;
  event_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  image_url: string;
  job_type: string;
  male_count: number;
  female_count: number;
  male_pay: number;
  female_pay: number;
  total: number;
  status: string;
  created_at: string;
  applicant_count?: number;
}

const FILTERS = ['All', 'Draft', 'Published'] as const;

const EventsListScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterIndex, setFilterIndex] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [])
  );

  const loadEvents = async () => {
    setIsLoading(true);
    const result = await api.getEvents();
    if (result.data?.events) {
      setEvents(result.data.events);
    }
    setIsLoading(false);
  };

  const filter = FILTERS[filterIndex].toLowerCase();
  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    return event.status === filter;
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleDeleteEvent = (event: Event) => {
    const hasApplicants = (event.applicant_count ?? 0) > 0;
    const message = hasApplicants
      ? `This event may have accepted workers. They will get a push notification if you delete. Are you sure you want to delete "${event.title}"?`
      : `Are you sure you want to delete "${event.title}"? This cannot be undone.`;
    Alert.alert('Delete event?', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeletingId(event.id);
          try {
            const result = await api.deleteEvent(event.id);
            if (result.error) {
              Alert.alert('Could not delete', result.error);
              return;
            }
            setEvents((prev) => prev.filter((e) => e.id !== event.id));
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-surface-secondary">
      {/* Header */}
      <View className="bg-white" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center justify-between px-5 py-3">
          <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-2xl text-primary-900 tracking-tight">
            My Events
          </Text>
          <ScalePress
            onPress={() => router.push('/organizer/create-event')}
            className="h-10 w-10 rounded-full bg-accent items-center justify-center"
            style={{
              shadowColor: '#E94560',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Icon name="add" className="text-white text-xl" />
          </ScalePress>
        </View>

        {/* Filter Tabs */}
        <View className="pb-3">
          <PillTabs
            tabs={[...FILTERS]}
            activeIndex={filterIndex}
            onTabPress={setFilterIndex}
          />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: 32 + insets.bottom + 90,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View className="items-center justify-center h-48">
            <ActivityIndicator size="large" color="#E94560" />
          </View>
        ) : filteredEvents.length === 0 ? (
          <EmptyState
            icon="event-busy"
            title="No Events Yet"
            subtitle="Create your first event to start finding workers"
            actionLabel="Create Event"
            onAction={() => router.push('/organizer/create-event')}
          />
        ) : (
          <View className="gap-4">
            {filteredEvents.map((event, index) => (
              <FadeInView key={event.id} delay={index * 60} duration={400}>
                <View
                  className="bg-white rounded-3xl overflow-hidden"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.06,
                    shadowRadius: 12,
                    elevation: 3,
                  }}
                >
                  <Pressable
                    onPress={() => router.push(`/organizer/events/${event.id}`)}
                    className="active:opacity-95"
                  >
                    <View className="relative h-36">
                      {event.image_url ? (
                        <Image source={{ uri: event.image_url }} className="w-full h-full" resizeMode="cover" />
                      ) : (
                        <View className="w-full h-full bg-primary-50 items-center justify-center">
                          <Icon name="event" className="text-primary-200 text-5xl" />
                        </View>
                      )}
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.5)']}
                        className="absolute bottom-0 left-0 right-0 h-16"
                      />
                      <View className={`absolute top-3 left-3 rounded-full px-2.5 py-1 ${event.status === 'published' ? 'bg-success' : event.status === 'draft' ? 'bg-warning' : 'bg-slate-400'}`}>
                        <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[9px] uppercase text-white tracking-wider">
                          {event.status || 'draft'}
                        </Text>
                      </View>
                      {(event.applicant_count ?? 0) > 0 && (
                        <View className="absolute top-3 right-3 bg-accent/90 px-2.5 py-1 rounded-full flex-row items-center gap-1">
                          <Icon name="people" className="text-white text-xs" />
                          <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-white text-[10px]">
                            {event.applicant_count}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View className="p-4">
                      <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900 text-base" numberOfLines={1}>{event.title}</Text>
                      <View className="flex-row items-center gap-3 mt-2">
                        <View className="flex-row items-center gap-1">
                          <Icon name="calendar-today" className="text-accent text-sm" />
                          <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-xs text-slate-500">{formatDate(event.event_date)}</Text>
                        </View>
                        {event.location && (
                          <View className="flex-row items-center gap-1 flex-1">
                            <Icon name="location-on" className="text-slate-300 text-sm" />
                            <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-xs text-slate-500" numberOfLines={1}>{event.location}</Text>
                          </View>
                        )}
                      </View>
                      <View className="flex-row items-center gap-4 mt-3 pt-3 border-t border-surface-tertiary">
                        <View className="flex-row items-center gap-2">
                          <View className="h-7 w-7 rounded-lg bg-blue-50 items-center justify-center">
                            <Icon name="male" className="text-blue-500 text-sm" />
                          </View>
                          <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-sm text-primary-900">{event.male_count || 0}</Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                          <View className="h-7 w-7 rounded-lg bg-pink-50 items-center justify-center">
                            <Icon name="female" className="text-pink-500 text-sm" />
                          </View>
                          <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-sm text-primary-900">{event.female_count || 0}</Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={() => handleDeleteEvent(event)}
                    disabled={deletingId === event.id}
                    className="absolute bottom-4 right-4 h-9 w-9 rounded-xl bg-error/10 items-center justify-center"
                    style={{ zIndex: 10 }}
                  >
                    {deletingId === event.id ? (
                      <ActivityIndicator size="small" color="#FF4757" />
                    ) : (
                      <Icon name="delete_outline" className="text-error text-lg" />
                    )}
                  </Pressable>
                </View>
              </FadeInView>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default EventsListScreen;
