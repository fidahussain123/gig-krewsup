import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
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

  useEffect(() => {
    loadEvents();
  }, []);

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

  return (
    <View className="flex-1 bg-slate-50">
      <View className="bg-white px-6 pb-4 flex-row items-center border-b border-slate-100" style={{ paddingTop: insets.top + 10 }}>
        <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-lg text-slate-900 flex-1 tracking-tight">
          My Events
        </Text>
        <Pressable
          onPress={() => router.push('/organizer/create-event')}
          className="h-10 w-10 rounded-full bg-primary items-center justify-center"
        >
          <Icon name="add" className="text-white text-xl" />
        </Pressable>
      </View>

      {/* Filter Tabs */}
      <View className="bg-white border-b border-slate-100 p-3">
        <View className="flex-row gap-2">
          {(['all', 'draft', 'published'] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              className={`px-4 py-2 rounded-full ${
                filter === f 
                  ? 'bg-primary text-white' 
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              <Text className={`text-xs font-bold capitalize ${filter === f ? 'text-white' : 'text-slate-500'}`}>{f}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 + insets.bottom + 90 }}>
        {isLoading ? (
          <View className="items-center justify-center h-48">
            <ActivityIndicator size="large" color="#008080" />
          </View>
        ) : filteredEvents.length === 0 ? (
          <View className="items-center justify-center h-64 px-8">
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
          <View className="p-4 space-y-4">
            {filteredEvents.map((event) => (
              <Pressable
                key={event.id}
                onPress={() => router.push(`/organizer/events/${event.id}`)}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
              >
                <View className="relative h-32 bg-gradient-to-r from-primary/20 to-accent/20">
                  {event.image_url ? (
                    <Image source={{ uri: event.image_url }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <View className="w-full h-full items-center justify-center">
                      <Icon name="event" className="text-white/50 text-5xl" />
                    </View>
                  )}
                  <View className="absolute top-3 right-3">
                    <Text className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(event.status)}`}>
                      {event.status || 'draft'}
                    </Text>
                  </View>
                </View>

                <View className="p-4">
                  <Text className="font-bold text-slate-900 text-lg mb-1" numberOfLines={1}>{event.title}</Text>

                  <View className="flex-row items-center gap-3 text-xs text-slate-500 mb-3">
                    <View className="flex-row items-center gap-1">
                      <Icon name="calendar_today" className="text-slate-500 text-sm" />
                      <Text className="text-xs text-slate-500">{formatDate(event.event_date)}</Text>
                    </View>
                    {event.location && (
                      <View className="flex-row items-center gap-1">
                        <Icon name="location_on" className="text-slate-500 text-sm" />
                        <Text className="text-xs text-slate-500">{event.location}</Text>
                      </View>
                    )}
                  </View>

                  <View className="flex-row items-center justify-between pt-3 border-t border-slate-100">
                    <View className="flex-row items-center gap-4">
                      <View className="flex-row items-center gap-1">
                        <Icon name="male" className="text-blue-500 text-lg" />
                        <Text className="text-sm font-bold">{event.male_count || 0}</Text>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <Icon name="female" className="text-pink-500 text-lg" />
                        <Text className="text-sm font-bold">{event.female_count || 0}</Text>
                      </View>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-xs text-slate-400">Applicants:</Text>
                      <Text className="px-2 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold">
                        {event.applicant_count || 0}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default EventsListScreen;
