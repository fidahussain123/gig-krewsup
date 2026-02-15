
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../lib/api';
import Icon from '../components/Icon';
import { FadeInView, ScalePress } from '../components/AnimatedComponents';

const WorkerDashboard: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<any[]>([]);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gender, setGender] = useState<string>('');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [appliedEventIds, setAppliedEventIds] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<'all' | 'nearby' | 'saved'>('all');
  const [workerLocation, setWorkerLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyEvents, setNearbyEvents] = useState<any[]>([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    loadGigs();
    loadProfile();
    loadSaved();
    loadApplied();
  }, []);

  useEffect(() => {
    setEvents(allEvents.filter(event => !appliedEventIds.has(event.id)));
  }, [allEvents, appliedEventIds]);

  const visibleEvents = useMemo(() => {
    if (activeFilter === 'saved') {
      return events.filter(event => savedIds.has(event.id));
    }
    if (activeFilter === 'nearby') {
      return nearbyEvents;
    }
    return events;
  }, [events, activeFilter, savedIds, nearbyEvents]);

  const loadGigs = async () => {
    setIsLoading(true);
    const result = await api.browseEvents();
    if (result.data?.events) {
      setAllEvents(result.data.events);
    }
    setIsLoading(false);
  };

  const loadProfile = async () => {
    const result = await api.getProfile();
    if (result.data?.profile?.gender) {
      setGender(result.data.profile.gender);
    }
  };

  const loadSaved = async () => {
    const raw = await AsyncStorage.getItem('saved_gigs');
    if (raw) {
      try {
        const ids = JSON.parse(raw) as string[];
        setSavedIds(new Set(ids));
      } catch {
        setSavedIds(new Set());
      }
    }
  };

  const loadApplied = async () => {
    const result = await api.getMyEventApplications();
    if (result.data?.eventIds) {
      setAppliedEventIds(new Set(result.data.eventIds));
    }
  };

  const loadNearby = async () => {
    if (Platform.OS === 'web') {
      setLocationError('Location services are not available on web. Please use the mobile app.');
      setIsLoadingNearby(false);
      return;
    }

    try {
      setIsLoadingNearby(true);
      setLocationError(null);

      const Location = await import('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Allow location access to see nearby gigs.');
        setIsLoadingNearby(false);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setWorkerLocation({ lat, lng });

      const result = await api.getNearbyEvents(lat, lng, 25);
      if (result.data?.events) {
        setNearbyEvents(result.data.events);
      } else if (result.error) {
        setLocationError(result.error);
      }
    } catch (e: any) {
      setLocationError('Unable to fetch nearby gigs. Please try again.');
    } finally {
      setIsLoadingNearby(false);
    }
  };

  const toggleSave = async (eventId: string) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      AsyncStorage.setItem('saved_gigs', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const handleApply = async (eventId: string) => {
    setApplyingId(eventId);
    const result = await api.applyToEvent(eventId);
    if (result.data) {
      setAppliedEventIds(prev => new Set(prev).add(eventId));
      setEvents(prev => prev.filter(event => event.id !== eventId));
    }
    setApplyingId(null);
  };

  const getDisplayPay = (event: any) => {
    if (gender === 'male' && event.male_pay != null) return event.male_pay;
    if (gender === 'female' && event.female_pay != null) return event.female_pay;
    return event.male_pay ?? event.female_pay ?? 0;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Date TBD';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-slate-50" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FadeInView delay={0} duration={500}>
        <View className="bg-white border-b border-slate-100">
          <View className="flex-row items-center justify-between px-6 pb-3" style={{ paddingTop: insets.top + 20 }}>
            <View className="flex-row items-center gap-4">
              <View className="h-12 w-12 rounded-full bg-primary/10 items-center justify-center">
                <Icon name="person" className="text-primary text-3xl" />
              </View>
              <View>
                <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-2xl text-slate-900 tracking-tight">Find Work</Text>
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-xs text-slate-400 uppercase tracking-widest">
                  {events.length} gigs available
                </Text>
              </View>
            </View>
            <ScalePress
              onPress={() => router.push('/worker/applications')}
              className="px-4 py-2 rounded-full bg-primary/10"
            >
              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary text-xs uppercase tracking-widest">My Applications</Text>
            </ScalePress>
          </View>

          <View className="px-6 py-4">
            <View className="relative">
              <Icon name="search" className="text-primary text-lg absolute left-4 top-4" />
              <TextInput
                placeholder="Search roles or keywords"
                style={{ fontFamily: 'Inter_500Medium' }}
                className="w-full h-14 pl-12 pr-6 bg-slate-100 rounded-2xl text-base"
              />
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 pb-5">
            {['High Pay', 'Near Me', 'Starting Soon', 'Hospitality', 'Security'].map((filter, idx) => (
              <ScalePress
                key={filter}
                className={`flex-row items-center gap-2 h-10 px-5 rounded-full mr-2 ${idx === 0 ? 'bg-primary' : 'bg-white border border-slate-100'}`}
              >
                <Icon
                  name={['payments', 'near-me', 'calendar-today', 'restaurant', 'security'][idx]}
                  className={`${idx === 0 ? 'text-white' : 'text-slate-600'} text-lg`}
                />
                <Text style={{ fontFamily: 'Inter_700Bold' }} className={`${idx === 0 ? 'text-white' : 'text-slate-600'} text-sm`}>
                  {filter}
                </Text>
              </ScalePress>
            ))}
          </ScrollView>
        </View>
      </FadeInView>

      <ScrollView
        className="flex-1 px-6 py-6"
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 48 + insets.bottom + 90 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View className="flex-row items-center justify-between mb-4">
          <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-xl text-slate-900">Available Gigs</Text>
          <View className="flex-row gap-2">
            {(['all', 'nearby', 'saved'] as const).map((filter) => (
              <Pressable
                key={filter}
                onPress={() => {
                  setActiveFilter(filter);
                  if (filter === 'nearby' && nearbyEvents.length === 0 && !isLoadingNearby) {
                    loadNearby();
                  }
                }}
                className={`px-3 py-1.5 rounded-full border ${
                  activeFilter === filter ? 'bg-primary border-primary' : 'bg-white border-slate-200'
                }`}
              >
                <Text
                  style={{ fontFamily: 'Inter_600SemiBold' }}
                  className={`text-[11px] uppercase tracking-widest ${
                    activeFilter === filter ? 'text-white' : 'text-slate-500'
                  }`}
                >
                  {filter === 'all' ? 'All' : filter === 'nearby' ? 'Nearby' : 'Saved'}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        {activeFilter === 'nearby' && (
          <View className="mb-3 rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3">
            <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-xs text-slate-700 mb-1">
              Showing gigs near your current location.
            </Text>
            {locationError ? (
              <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-xs text-red-500">
                {locationError}
              </Text>
            ) : (
              <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-xs text-slate-500">
                {isLoadingNearby
                  ? 'Finding nearby gigs...'
                  : workerLocation
                  ? 'Location set. Results are sorted by distance.'
                  : 'Tap Nearby again if results do not load.'}
              </Text>
            )}
          </View>
        )}
        {isLoading ? (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" color="#008080" />
          </View>
        ) : visibleEvents.length === 0 ? (
          <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-center py-12 text-slate-400">No gigs available yet.</Text>
        ) : (
          <View className="space-y-6">
            {visibleEvents.map((event, index) => (
              <FadeInView key={event.id} delay={100 + index * 80} duration={450}>
                <View className="bg-white rounded-3xl shadow-sm ring-1 ring-slate-100 overflow-hidden">
                  <View className="relative h-48 w-full bg-gray-200">
                    {event.image_url ? (
                      <Image source={{ uri: event.image_url }} resizeMode="cover" className="w-full h-full" />
                    ) : (
                      <View className="w-full h-full items-center justify-center">
                        <Icon name="event" className="text-slate-300 text-5xl" />
                      </View>
                    )}
                    {event.company_name && (
                      <View className="absolute top-4 right-4 bg-white/95 px-3 py-1.5 rounded-xl flex-row items-center gap-1.5 shadow-sm">
                        <Icon name="stars" className="text-accent text-lg" />
                        <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[11px] text-slate-900 uppercase tracking-widest">Top Organizer</Text>
                      </View>
                    )}
                  </View>
                  <View className="p-6">
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="bg-primary/10 px-2.5 py-1 rounded-lg">
                        <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-primary text-[10px] uppercase tracking-widest">
                          {event.status || 'Open'}
                        </Text>
                      </View>
                      <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-primary text-2xl">
                        ₹{getDisplayPay(event)}
                      </Text>
                    </View>
                    <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-xl text-slate-900">{event.title}</Text>
                    {(event.company_name || event.organizer_name) && (
                      <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-sm text-slate-500 mt-2">
                        {event.company_name || event.organizer_name}
                      </Text>
                    )}
                    <View className="flex-col gap-3 mt-4">
                      <View className="flex-row items-center gap-2">
                        <Icon name="calendar-month" className="text-slate-500 text-lg" />
                        <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-sm text-slate-500">{formatDate(event.event_date)}</Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Icon name="location-on" className="text-slate-500 text-lg" />
                        <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-sm text-slate-500">
                          {event.venue || event.location || 'Location TBD'}
                        </Text>
                      </View>
                      {activeFilter === 'nearby' && typeof event.distanceKm === 'number' && (
                        <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-xs text-primary mt-1">
                          {event.distanceKm.toFixed(1)} km away
                        </Text>
                      )}
                    </View>
                    <View className="flex-row items-center justify-between mt-4 mb-3">
                      <Pressable
                        onPress={() => router.push(`/worker/gig/${event.id}`)}
                        className="flex-row items-center gap-1"
                      >
                        <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-xs text-primary">
                          View details
                        </Text>
                        <Icon name="arrow_forward" className="text-primary text-sm" />
                      </Pressable>
                      {savedIds.has(event.id) && (
                        <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-[11px] text-primary/80">
                          Saved
                        </Text>
                      )}
                    </View>
                    <View className="mt-1">
                      <ScalePress
                        onPress={() => handleApply(event.id)}
                        disabled={applyingId === event.id}
                        className="h-12 bg-primary items-center justify-center rounded-full"
                      >
                        <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-white text-base">
                          {applyingId === event.id ? 'Applying...' : 'Apply'}
                        </Text>
                      </ScalePress>
                      <View className="mt-3 flex-row justify-center">
                        <Pressable
                          onPress={() => toggleSave(event.id)}
                          className={`h-10 w-10 border border-slate-100 items-center justify-center rounded-full ${
                            savedIds.has(event.id) ? 'bg-primary/10' : 'bg-white'
                          }`}
                        >
                          <Icon
                            name="bookmark"
                            className={`${savedIds.has(event.id) ? 'text-primary' : 'text-slate-300'} text-xl`}
                          />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>
              </FadeInView>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default WorkerDashboard;
