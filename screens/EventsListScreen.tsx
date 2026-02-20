import React, { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../lib/api';
import Icon from '../components/Icon';

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

const EventsListScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all');
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

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    return event.status === filter;
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-700';
      case 'draft': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-slate-100 text-slate-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-600';
    }
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
    <View className="flex-1 bg-slate-50">
      <View className="bg-white px-5 pb-4 flex-row items-center border-b border-slate-200/80" style={{ paddingTop: insets.top + 16 }}>
        <Text className="text-xl font-extrabold text-slate-900 flex-1 tracking-tight">
          My Events
        </Text>
        <Pressable
          onPress={() => router.push('/organizer/create-event')}
          className="h-11 w-11 rounded-full bg-primary items-center justify-center shadow-sm"
        >
          <Icon name="add" className="text-white text-2xl" />
        </Pressable>
      </View>

      {/* Filter Tabs */}
      <View className="bg-white border-b border-slate-200/80 px-4 py-3">
        <View className="flex-row rounded-xl bg-slate-100 p-1">
          {(['all', 'draft', 'published'] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              className={`flex-1 py-2.5 rounded-lg ${filter === f ? 'bg-white shadow-sm' : ''}`}
            >
              <Text className={`text-sm font-bold text-center capitalize ${filter === f ? 'text-primary' : 'text-slate-500'}`}>{f}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: 12,
          paddingBottom: 32 + insets.bottom + 90,
          paddingHorizontal: 20,
        }}
      >
        {isLoading ? (
          <View className="items-center justify-center h-48">
            <ActivityIndicator size="large" color="#008080" />
          </View>
        ) : filteredEvents.length === 0 ? (
          <View className="items-center justify-center h-64 px-6">
            <View className="h-20 w-20 rounded-full bg-slate-100 items-center justify-center mb-4">
              <Icon name="event-busy" className="text-slate-300 text-4xl" />
            </View>
            <Text className="text-lg font-bold text-slate-700 mb-2">No Events Yet</Text>
            <Text className="text-sm text-slate-400 mb-4 text-center">
              Create your first event to start finding workers
            </Text>
            <Pressable
              onPress={() => router.push('/organizer/create-event')}
              className="px-6 py-3 rounded-xl bg-primary"
            >
              <Text className="text-white font-bold">Create Event</Text>
            </Pressable>
          </View>
        ) : (
          <View className="pt-3 pb-4 space-y-4">
            {filteredEvents.map((event) => (
              <View
                key={event.id}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm relative"
              >
                <Pressable
                  onPress={() => router.push(`/organizer/events/${event.id}`)}
                  className="active:opacity-95"
                  style={{ paddingBottom: 8 }}
                >
                  <View className="relative h-32">
                    {event.image_url ? (
                      <Image source={{ uri: event.image_url }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                      <View className="w-full h-full bg-slate-100 items-center justify-center">
                        <Icon name="event" className="text-slate-300 text-5xl" />
                      </View>
                    )}
                    <View className="absolute top-2 right-2">
                      <Text className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(event.status)}`}>
                        {event.status || 'draft'}
                      </Text>
                    </View>
                  </View>

                  <View className="p-3 pr-14">
                    <Text className="font-bold text-slate-900 text-base mb-1.5" numberOfLines={1}>{event.title}</Text>
                    <View className="flex-row items-center gap-2 flex-wrap">
                      <View className="flex-row items-center gap-1">
                        <Icon name="calendar_today" className="text-primary text-sm" />
                        <Text className="text-xs text-slate-600">{formatDate(event.event_date)}</Text>
                      </View>
                      {event.location && (
                        <View className="flex-row items-center gap-1">
                          <Icon name="location_on" className="text-slate-400 text-sm" />
                          <Text className="text-xs text-slate-600" numberOfLines={1}>{event.location}</Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-row items-center gap-4 mt-2 pt-2 border-t border-slate-100">
                      <View className="flex-row items-center gap-1.5">
                        <Icon name="male" className="text-blue-600 text-sm" />
                        <Text className="text-sm font-bold text-slate-800">{event.male_count || 0}</Text>
                      </View>
                      <View className="flex-row items-center gap-1.5">
                        <Icon name="female" className="text-pink-600 text-sm" />
                        <Text className="text-sm font-bold text-slate-800">{event.female_count || 0}</Text>
                      </View>
                      <Text className="text-xs text-slate-400">Applicants</Text>
                      <View className="px-2 py-0.5 rounded bg-primary/10">
                        <Text className="text-primary text-xs font-bold">{event.applicant_count || 0}</Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
                <Pressable
                  onPress={() => handleDeleteEvent(event)}
                  disabled={deletingId === event.id}
                  className="absolute bottom-3 right-3 h-10 w-10 rounded-xl bg-red-50 items-center justify-center border border-red-200"
                  style={{ zIndex: 10 }}
                >
                  {deletingId === event.id ? (
                    <ActivityIndicator size="small" color="#dc2626" />
                  ) : (
                    <Icon name="delete_outline" className="text-red-600 text-xl" />
                  )}
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default EventsListScreen;
