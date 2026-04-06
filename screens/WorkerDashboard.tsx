const WORKER_LOCATION_KEY = 'worker_location';
const LOCATION_MAX_AGE_MS = 30 * 60 * 1000; // 30 min
const RADII_KM = [5, 10, 25, 50, 100];

const DISTANCE_OPTIONS = [
  { value: 5, label: 'Within 5 km' },
  { value: 10, label: 'Within 10 km' },
  { value: 25, label: 'Within 25 km' },
  { value: 50, label: 'Within 50 km' },
  { value: 100, label: 'Within 100 km' },
];

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
import { LinearGradient } from 'expo-linear-gradient';
import api from '../lib/api';
import Icon from '../components/Icon';
import { FadeInView, ScalePress, ScaleInView } from '../components/AnimatedComponents';
import { SearchBar, SectionHeader, EmptyState } from '../components/DistrictUI';

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
  const [maxDistance, setMaxDistance] = useState<number>(0); // 0 = no distance filter

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
      // When distance filter is active on "All" tab, show nearby results instead
      if (maxDistance > 0 && nearbyEvents.length > 0) {
        list = nearbyEvents;
      } else {
        list = events;
      }
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
  }, [events, activeFilter, savedIds, nearbyEvents, minPay, sortBy, maxDistance]);

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

  const getWebLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(err),
        { enableHighAccuracy: false, timeout: 10000 }
      );
    });
  };

  const loadNearby = async (filterRadius?: number) => {
    try {
      setIsLoadingNearby(true);
      setLocationError(null);

      let lat: number;
      let lng: number;

      // Use cached location if available
      if (workerLocation && workerLocation.lat != null && workerLocation.lng != null) {
        lat = workerLocation.lat;
        lng = workerLocation.lng;
      } else if (Platform.OS === 'web') {
        // Web: use browser Geolocation API
        try {
          const coords = await getWebLocation();
          lat = coords.lat;
          lng = coords.lng;
        } catch {
          setLocationError('Allow location access to see nearby gigs.');
          setIsLoadingNearby(false);
          return;
        }
      } else {
        // Native: use expo-location
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
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      }

      // Cache location
      setWorkerLocation({ lat, lng });
      await AsyncStorage.setItem(WORKER_LOCATION_KEY, JSON.stringify({
        lat, lng, updatedAt: Date.now(),
      }));

      // If a specific radius is given (from filter), use it directly
      if (filterRadius && filterRadius > 0) {
        const result = await api.getNearbyEvents(lat, lng, filterRadius);
        const list = result.data?.events || [];
        setNearbyEvents(list);
        setNearbyRadiusKm(filterRadius);
        setIsLoadingNearby(false);
        return;
      }

      console.log(`[Nearby] Worker location: lat=${lat}, lng=${lng}`);

      // Auto-expand radius until events are found
      let lastResult: any[] = [];
      let usedRadius = RADII_KM[0];
      for (const radius of RADII_KM) {
        const result = await api.getNearbyEvents(lat, lng, radius);
        console.log(`[Nearby] Radius ${radius}km: ${result.data?.events?.length ?? 0} events, error: ${result.error || 'none'}`);
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
      console.error('[Nearby] Error:', e);
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

  // Featured events (first 3 with images)
  const featuredEvents = visibleEvents.filter(e => e.image_url).slice(0, 3);
  const restEvents = visibleEvents.filter(e => !featuredEvents.includes(e));

  return (
    <KeyboardAvoidingView className="flex-1 bg-surface-secondary" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Sticky Header */}
      <View className="bg-white" style={{ paddingTop: insets.top }}>
        <FadeInView delay={0} duration={400}>
          <View className="flex-row items-center justify-between px-5 pt-3 pb-2">
            <View>
              <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-2xl text-primary-900 tracking-tight">
                Discover
              </Text>
              <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-xs text-slate-400">
                {events.length} gigs available
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <ScalePress
                onPress={() => router.push('/worker/applications')}
                className="h-10 px-4 rounded-full bg-accent-50 flex-row items-center gap-1.5"
              >
                <Icon name="bookmark" className="text-accent text-base" />
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-accent text-xs">Applied</Text>
              </ScalePress>
            </View>
          </View>

          {/* Search Bar */}
          <View className="px-5 pb-3">
            <View className="h-12 flex-row items-center bg-surface-tertiary rounded-2xl px-4">
              <Icon name="search" className="text-slate-400 text-xl mr-3" />
              <TextInput
                placeholder="Search roles, events..."
                placeholderTextColor="#94a3b8"
                style={{ fontFamily: 'Inter_500Medium', flex: 1, fontSize: 14 }}
                className="text-primary-900"
              />
              <Pressable
                onPress={() => setFilterVisible(true)}
                className="h-8 w-8 rounded-xl bg-accent items-center justify-center"
              >
                <Icon name="tune" className="text-white text-sm" />
              </Pressable>
            </View>
          </View>
        </FadeInView>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 48 + insets.bottom + 90 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        {/* Filter Tabs */}
        <FadeInView delay={100} duration={400}>
          <View className="px-5 pt-4 pb-2">
            <View className="flex-row bg-surface-tertiary rounded-2xl p-1">
              {(['all', 'nearby', 'saved'] as const).map((filter) => (
                <Pressable
                  key={filter}
                  onPress={() => {
                    setActiveFilter(filter);
                    if (filter === 'nearby' && nearbyEvents.length === 0 && !isLoadingNearby) loadNearby(0);
                  }}
                  className={`flex-1 py-2.5 rounded-xl ${activeFilter === filter ? 'bg-white' : ''}`}
                  style={activeFilter === filter ? {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 6,
                    elevation: 2,
                  } : undefined}
                >
                  <Text
                    style={{ fontFamily: activeFilter === filter ? 'Inter_700Bold' : 'Inter_500Medium' }}
                    className={`text-center text-sm ${activeFilter === filter ? 'text-accent' : 'text-slate-400'}`}
                  >
                    {filter === 'all' ? 'All Gigs' : filter === 'nearby' ? 'Near You' : 'Saved'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </FadeInView>

        {(activeFilter === 'nearby' || (maxDistance > 0 && activeFilter === 'all')) && (
          <FadeInView delay={50} duration={300}>
            <View className="mx-5 mt-2 mb-1 rounded-2xl bg-accent-50 px-4 py-2.5">
              {locationError ? (
                <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-xs text-error">{locationError}</Text>
              ) : (
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Icon name="near-me" className="text-accent text-sm" />
                    <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-xs text-accent-dark">
                      {isLoadingNearby ? 'Finding nearby events...' : nearbyEvents.length > 0 ? `${nearbyEvents.length} event${nearbyEvents.length === 1 ? '' : 's'} within ${nearbyRadiusKm} km` : `No events within ${maxDistance || 100} km`}
                    </Text>
                  </View>
                  {maxDistance > 0 && activeFilter === 'all' && !isLoadingNearby && (
                    <Pressable onPress={() => { setMaxDistance(0); setNearbyEvents([]); }}>
                      <Icon name="close" className="text-accent text-sm" />
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          </FadeInView>
        )}

        {isLoading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#E94560" />
          </View>
        ) : visibleEvents.length === 0 ? (
          <EmptyState
            icon={activeFilter === 'saved' ? 'bookmark' : activeFilter === 'nearby' ? 'near-me' : 'event'}
            title={activeFilter === 'saved' ? 'No saved gigs' : activeFilter === 'nearby' ? 'No nearby events' : 'No gigs yet'}
            subtitle={
              activeFilter === 'saved'
                ? 'Tap the bookmark on any gig to save it here'
                : activeFilter === 'nearby'
                ? 'Switch to "All Gigs" to see all available events'
                : 'Check back soon for new opportunities'
            }
          />
        ) : (
          <>
            {/* Featured Carousel (horizontal scroll of top events) */}
            {featuredEvents.length > 0 && activeFilter === 'all' && (
              <FadeInView delay={150} duration={450}>
                <SectionHeader title="Featured" subtitle="Top opportunities" />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 20 }}
                  className="mb-2"
                >
                  {featuredEvents.map((event, index) => (
                    <ScalePress
                      key={event.id}
                      onPress={() => router.push(`/worker/event/${event.id}`)}
                      className="mr-4 rounded-3xl overflow-hidden"
                      style={{
                        width: 300,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 0.12,
                        shadowRadius: 20,
                        elevation: 6,
                      }}
                    >
                      <View className="relative h-48 bg-primary-dark">
                        <Image source={{ uri: event.image_url }} resizeMode="cover" className="w-full h-full" />
                        <LinearGradient
                          colors={['transparent', 'rgba(0,0,0,0.7)']}
                          className="absolute bottom-0 left-0 right-0 h-28"
                        />
                        <View className="absolute top-3 right-3 bg-white/95 px-3 py-1.5 rounded-full">
                          <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-accent text-sm">
                            ₹{getDisplayPay(event)}
                          </Text>
                        </View>
                        {event.company_name && (
                          <View className="absolute top-3 left-3 bg-accent/90 px-2.5 py-1 rounded-full flex-row items-center gap-1">
                            <Icon name="verified" className="text-white text-xs" />
                            <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-white text-[9px] uppercase tracking-wider">
                              Top Organizer
                            </Text>
                          </View>
                        )}
                        <View className="absolute bottom-4 left-4 right-4">
                          <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-white text-lg" numberOfLines={1}>
                            {event.title}
                          </Text>
                          <View className="flex-row items-center gap-3 mt-1.5">
                            <View className="flex-row items-center gap-1">
                              <Icon name="calendar-today" className="text-white/70 text-xs" />
                              <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-white/70 text-xs">
                                {formatDate(event.event_date)}
                              </Text>
                            </View>
                            <View className="flex-row items-center gap-1">
                              <Icon name="location-on" className="text-white/70 text-xs" />
                              <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-white/70 text-xs" numberOfLines={1}>
                                {event.venue || event.location || 'TBD'}
                              </Text>
                            </View>
                            {typeof event.distanceKm === 'number' && (
                              <View className="flex-row items-center gap-1">
                                <Icon name="near-me" className="text-white/70 text-xs" />
                                <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-white/90 text-xs">
                                  {event.distanceKm.toFixed(1)} km
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                    </ScalePress>
                  ))}
                </ScrollView>
              </FadeInView>
            )}

            {/* All Events - Card Grid */}
            <FadeInView delay={250} duration={400}>
              <SectionHeader
                title={activeFilter === 'all' ? 'All Gigs' : activeFilter === 'nearby' ? 'Near You' : 'Saved'}
                subtitle={`${(activeFilter === 'all' ? restEvents : visibleEvents).length} available`}
              />
            </FadeInView>

            <View className="px-5 flex-row flex-wrap justify-between">
              {(activeFilter === 'all' ? restEvents : visibleEvents).map((event, index) => (
                <FadeInView key={event.id} delay={300 + index * 50} duration={400} style={{ width: '48.5%', marginBottom: 12 }}>
                  <ScalePress
                    onPress={() => router.push(`/worker/event/${event.id}`)}
                    className="rounded-2xl bg-white overflow-hidden"
                    style={{
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.06,
                      shadowRadius: 10,
                      elevation: 3,
                    }}
                  >
                    {/* Image */}
                    <View className="relative h-32">
                      {event.image_url ? (
                        <Image source={{ uri: event.image_url }} resizeMode="cover" className="w-full h-full" />
                      ) : (
                        <View className="w-full h-full items-center justify-center bg-primary-50">
                          <Icon name="event" className="text-primary-200 text-3xl" />
                        </View>
                      )}
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.55)']}
                        className="absolute bottom-0 left-0 right-0 h-16"
                      />
                      {/* Bookmark */}
                      <Pressable
                        onPress={() => toggleSave(event.id)}
                        className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/90 items-center justify-center"
                      >
                        <Icon
                          name={savedIds.has(event.id) ? 'bookmark' : 'bookmark-outline'}
                          className={`${savedIds.has(event.id) ? 'text-accent' : 'text-slate-400'}`}
                          size={14}
                        />
                      </Pressable>
                      {/* Pay overlay */}
                      <View className="absolute bottom-2 left-2 bg-white/95 px-2 py-1 rounded-full">
                        <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-accent text-xs">
                          ₹{getDisplayPay(event)}
                        </Text>
                      </View>
                      {/* Status badge */}
                      <View className="absolute top-2 left-2 bg-accent/90 px-2 py-0.5 rounded-full">
                        <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-white text-[8px] uppercase tracking-wider">
                          {event.status || 'Open'}
                        </Text>
                      </View>
                    </View>

                    {/* Content */}
                    <View className="p-3">
                      <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900 text-[13px] leading-tight" numberOfLines={2}>
                        {event.title}
                      </Text>
                      {(event.company_name || event.organizer_name) && (
                        <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-400 text-[10px] mt-1" numberOfLines={1}>
                          {event.company_name || event.organizer_name}
                        </Text>
                      )}
                      <View className="mt-2 gap-1">
                        <View className="flex-row items-center gap-1">
                          <Icon name="calendar-today" className="text-slate-300" size={10} />
                          <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-500 text-[10px]">
                            {formatDate(event.event_date)}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-1">
                          <Icon name="location-on" className="text-slate-300" size={10} />
                          <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-500 text-[10px]" numberOfLines={1}>
                            {event.venue || event.location || 'TBD'}
                          </Text>
                        </View>
                      </View>
                      {typeof event.distanceKm === 'number' && (
                        <View className="flex-row items-center gap-1 mt-1">
                          <Icon name="near-me" className="text-accent" size={10} />
                          <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-[10px] text-accent">
                            {event.distanceKm.toFixed(1)} km away
                          </Text>
                        </View>
                      )}

                      {/* Apply Button */}
                      <ScalePress
                        onPress={() => handleApply(event.id)}
                        disabled={applyingId === event.id}
                        className="mt-2.5 h-9 bg-accent items-center justify-center rounded-xl"
                        style={{
                          shadowColor: '#E94560',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.2,
                          shadowRadius: 4,
                          elevation: 2,
                        }}
                      >
                        <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-white text-[11px]">
                          {applyingId === event.id ? 'Applying...' : 'Quick Apply'}
                        </Text>
                      </ScalePress>
                    </View>
                  </ScalePress>
                </FadeInView>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal visible={filterVisible} transparent animationType="slide">
        <Pressable className="flex-1 justify-end bg-black/50" onPress={() => setFilterVisible(false)}>
          <Pressable className="bg-white rounded-t-4xl pt-4 pb-8" style={{ paddingBottom: insets.bottom + 24 }} onPress={e => e.stopPropagation()}>
            <View className="w-10 h-1 rounded-full bg-slate-200 self-center mb-5" />
            <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-xl text-primary-900 px-6 mb-5">Filter & Sort</Text>

            {/* Distance Filter */}
            <View className="px-6 mb-5">
              <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-slate-500 text-sm mb-2">Nearby events</Text>
              <View className="flex-row flex-wrap gap-2">
                <Pressable
                  onPress={() => setMaxDistance(0)}
                  className={`px-4 py-2.5 rounded-2xl ${maxDistance === 0 ? 'bg-accent-50 border border-accent/20' : 'bg-surface-tertiary'}`}
                >
                  <Text style={{ fontFamily: 'Inter_600SemiBold' }} className={`text-sm ${maxDistance === 0 ? 'text-accent' : 'text-slate-600'}`}>All</Text>
                </Pressable>
                {DISTANCE_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => setMaxDistance(opt.value)}
                    className={`px-4 py-2.5 rounded-2xl ${maxDistance === opt.value ? 'bg-accent-50 border border-accent/20' : 'bg-surface-tertiary'}`}
                  >
                    <Text style={{ fontFamily: 'Inter_600SemiBold' }} className={`text-sm ${maxDistance === opt.value ? 'text-accent' : 'text-slate-600'}`}>{opt.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="px-6 mb-5">
              <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-slate-500 text-sm mb-2">Minimum pay (₹)</Text>
              <TextInput
                value={minPay}
                onChangeText={setMinPay}
                placeholder="e.g. 500"
                keyboardType="numeric"
                className="h-12 px-4 bg-surface-tertiary rounded-2xl text-base"
                style={{ fontFamily: 'Inter_500Medium' }}
              />
            </View>

            <View className="px-6 mb-6">
              <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-slate-500 text-sm mb-2">Sort by</Text>
              <View className="gap-2">
                {SORT_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => setSortBy(opt.value)}
                    className={`flex-row items-center justify-between py-3.5 px-4 rounded-2xl ${sortBy === opt.value ? 'bg-accent-50 border border-accent/20' : 'bg-surface-tertiary'}`}
                  >
                    <Text style={{ fontFamily: 'Inter_600SemiBold' }} className={sortBy === opt.value ? 'text-accent' : 'text-slate-600'}>{opt.label}</Text>
                    {sortBy === opt.value && <Icon name="check_circle" className="text-accent" size={20} />}
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="px-6 flex-row gap-3">
              <Pressable
                onPress={() => { setMinPay(''); setSortBy('default'); setMaxDistance(0); setNearbyEvents([]); setFilterVisible(false); }}
                className="flex-1 h-12 rounded-2xl bg-surface-tertiary items-center justify-center"
              >
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-slate-500">Clear</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setFilterVisible(false);
                  if (maxDistance > 0) {
                    loadNearby(maxDistance);
                  }
                }}
                className="flex-1 h-12 rounded-2xl bg-accent items-center justify-center"
                style={{
                  shadowColor: '#E94560',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 4,
                }}
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
