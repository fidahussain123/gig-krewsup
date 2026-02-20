const WORKER_LOCATION_KEY = 'worker_location';
const LOCATION_MAX_AGE_MS = 30 * 60 * 1000; // 30 min
const RADII_KM = [10, 25, 50, 100];

const SORT_OPTIONS: { value: 'default' | 'payHigh' | 'payLow' | 'soon' | 'nearby'; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'payHigh', label: 'Pay: High to low' },
  { value: 'payLow', label: 'Pay: Low to high' },
  { value: 'soon', label: 'Date: Soon first' },
  { value: 'nearby', label: 'Nearby first' },
];

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
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
  const [nearbyRadiusKm, setNearbyRadiusKm] = useState<number>(25);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [minPay, setMinPay] = useState<string>('');
  const [sortBy, setSortBy] = useState<'default' | 'payHigh' | 'payLow' | 'soon' | 'nearby'>('default');

  useEffect(() => {
    loadGigs();
    loadProfile();
    loadSaved();
    loadApplied();
    loadStoredLocation();
  }, []);

  useEffect(() => {
    setEvents(allEvents.filter(event => !appliedEventIds.has(event.id)));
  }, [allEvents, appliedEventIds]);

  const loadStoredLocation = async () => {
    try {
      const raw = await AsyncStorage.getItem(WORKER_LOCATION_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as { lat: number; lng: number; updatedAt: number };
      if (data.lat != null && data.lng != null && Date.now() - (data.updatedAt || 0) < LOCATION_MAX_AGE_MS) {
        setWorkerLocation({ lat: data.lat, lng: data.lng });
      }
    } catch {
      // ignore
    }
  };

  const visibleEvents = useMemo(() => {
    let list: any[];
    if (activeFilter === 'saved') {
      list = events.filter(event => savedIds.has(event.id));
    } else if (activeFilter === 'nearby') {
      list = nearbyEvents;
    } else {
      list = events;
    }
    const minPayNum = minPay.trim() ? parseFloat(minPay) : NaN;
    if (!Number.isNaN(minPayNum)) {
      list = list.filter(e => {
        const pay = e.male_pay ?? e.female_pay ?? 0;
        return pay >= minPayNum;
      });
    }
    list = [...list];
    if (sortBy === 'payHigh') {
      list.sort((a, b) => (b.male_pay ?? b.female_pay ?? 0) - (a.male_pay ?? a.female_pay ?? 0));
    } else if (sortBy === 'payLow') {
      list.sort((a, b) => (a.male_pay ?? a.female_pay ?? 0) - (b.male_pay ?? b.female_pay ?? 0));
    } else if (sortBy === 'soon') {
      list.sort((a, b) => new Date(a.event_date || 0).getTime() - new Date(b.event_date || 0).getTime());
    } else if (sortBy === 'nearby' && list.some((e: any) => typeof e.distanceKm === 'number')) {
      list.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    }
    return list;
  }, [events, activeFilter, savedIds, nearbyEvents, minPay, sortBy]);

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

      let lat: number;
      let lng: number;
      const Location = await import('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Allow location access to see nearby gigs.');
        setIsLoadingNearby(false);
        return;
      }

      if (workerLocation && workerLocation.lat != null && workerLocation.lng != null) {
        lat = workerLocation.lat;
        lng = workerLocation.lng;
      } else {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
        setWorkerLocation({ lat, lng });
        await AsyncStorage.setItem(WORKER_LOCATION_KEY, JSON.stringify({
          lat,
          lng,
          updatedAt: Date.now(),
        }));
      }

      let lastResult: any[] = [];
      let usedRadius = RADII_KM[0];
      for (const radius of RADII_KM) {
        const result = await api.getNearbyEvents(lat, lng, radius);
        const list = result.data?.events || [];
        if (list.length > 0) {
          setNearbyEvents(list);
          setNearbyRadiusKm(radius);
          setIsLoadingNearby(false);
          return;
        }
        lastResult = list;
        usedRadius = radius;
      }
      setNearbyEvents(lastResult);
      setNearbyRadiusKm(usedRadius);
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
          <View className="flex-row items-center justify-between px-4 pb-3" style={{ paddingTop: insets.top + 12 }}>
            <View>
              <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-xl text-slate-900">Find Work</Text>
              <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-xs text-slate-500">{events.length} gigs</Text>
            </View>
            <ScalePress
              onPress={() => router.push('/worker/applications')}
              className="px-3 py-2 rounded-lg bg-primary/10"
            >
              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary text-xs">My Applications</Text>
            </ScalePress>
          </View>

          <View className="px-4 py-3">
            <View className="relative">
              <Icon name="search" className="text-primary text-lg absolute left-4 top-4" />
              <TextInput
                placeholder="Search roles or keywords"
                style={{ fontFamily: 'Inter_500Medium' }}
                className="w-full h-12 pl-12 pr-4 bg-slate-100 rounded-xl text-base"
              />
            </View>
          </View>
        </View>
      </FadeInView>

      <ScrollView
        className="flex-1 px-4 py-4"
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 48 + insets.bottom + 90 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row rounded-lg bg-slate-100 p-1">
            {(['all', 'nearby', 'saved'] as const).map((filter) => (
              <Pressable
                key={filter}
                onPress={() => {
                  setActiveFilter(filter);
                  if (filter === 'nearby' && nearbyEvents.length === 0 && !isLoadingNearby) loadNearby();
                }}
                className={`px-4 py-2 rounded-md ${activeFilter === filter ? 'bg-white shadow-sm' : ''}`}
              >
                <Text
                  style={{ fontFamily: 'Inter_600SemiBold' }}
                  className={`text-sm ${activeFilter === filter ? 'text-primary' : 'text-slate-500'}`}
                >
                  {filter === 'all' ? 'All' : filter === 'nearby' ? 'Nearby' : 'Saved'}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            onPress={() => setFilterVisible(true)}
            className="h-10 px-4 rounded-xl bg-slate-100 flex-row items-center gap-2"
          >
            <Icon name="tune" className="text-slate-600" size={20} />
            <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-slate-700 text-sm">Filter</Text>
          </Pressable>
        </View>
        {activeFilter === 'nearby' && (
          <View className="mb-3 rounded-xl bg-primary/5 border border-primary/20 px-3 py-2">
            {locationError ? (
              <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-xs text-red-500">{locationError}</Text>
            ) : (
              <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-xs text-slate-600">
                {isLoadingNearby ? 'Finding events...' : nearbyEvents.length > 0 ? `Within ${nearbyRadiusKm} km · ${nearbyEvents.length} event${nearbyEvents.length === 1 ? '' : 's'}` : 'No events within 100 km'}
              </Text>
            )}
          </View>
        )}
        {isLoading ? (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" color="#008080" />
          </View>
        ) : visibleEvents.length === 0 ? (
          <View className="items-center py-12 px-4">
            <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-center text-slate-500">
              {activeFilter === 'nearby' && !isLoadingNearby
                ? 'No events within 100 km. Switch to "All" to see all events.'
                : activeFilter === 'saved'
                ? 'No saved gigs. Tap the bookmark on any event to save.'
                : 'No gigs available yet.'}
            </Text>
          </View>
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
                        onPress={() => router.push(`/worker/event/${event.id}`)}
                        className="flex-row items-center gap-1"
                      >
                        <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-xs text-primary">
                          More details
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

      <Modal visible={filterVisible} transparent animationType="slide">
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setFilterVisible(false)}>
          <Pressable className="bg-white rounded-t-3xl pt-4 pb-8" style={{ paddingBottom: insets.bottom + 24 }} onPress={e => e.stopPropagation()}>
            <View className="w-12 h-1 rounded-full bg-slate-200 self-center mb-4" />
            <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-lg text-slate-900 px-4 mb-4">Filter & sort</Text>

            <View className="px-4 mb-4">
              <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-slate-600 text-sm mb-2">Min pay (₹)</Text>
              <TextInput
                value={minPay}
                onChangeText={setMinPay}
                placeholder="e.g. 500"
                keyboardType="numeric"
                className="h-12 px-4 bg-slate-100 rounded-xl text-base"
              />
            </View>

            <View className="px-4 mb-6">
              <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-slate-600 text-sm mb-2">Sort by</Text>
              <View className="gap-2">
                {SORT_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => setSortBy(opt.value)}
                    className={`flex-row items-center justify-between py-3 px-4 rounded-xl ${sortBy === opt.value ? 'bg-primary/10 border border-primary/30' : 'bg-slate-50'}`}
                  >
                    <Text style={{ fontFamily: 'Inter_600SemiBold' }} className={sortBy === opt.value ? 'text-primary' : 'text-slate-700'}>{opt.label}</Text>
                    {sortBy === opt.value && <Icon name="check_circle" className="text-primary" size={22} />}
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="px-4 flex-row gap-3">
              <Pressable
                onPress={() => { setMinPay(''); setSortBy('default'); setFilterVisible(false); }}
                className="flex-1 h-12 rounded-xl bg-slate-100 items-center justify-center"
              >
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-slate-600">Clear</Text>
              </Pressable>
              <Pressable
                onPress={() => setFilterVisible(false)}
                className="flex-1 h-12 rounded-xl bg-primary items-center justify-center"
              >
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-white">Apply</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default WorkerDashboard;
