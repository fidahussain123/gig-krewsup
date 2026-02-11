
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../lib/api';
import Icon from '../components/Icon';
import { FadeInView, ScalePress } from '../components/AnimatedComponents';

const WorkerDashboard: React.FC = () => {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gender, setGender] = useState<string>('');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [appliedEventIds, setAppliedEventIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadGigs();
    loadProfile();
    loadSaved();
    loadApplied();
  }, []);

  useEffect(() => {
    setEvents(allEvents.filter(event => !appliedEventIds.has(event.id)));
  }, [allEvents, appliedEventIds]);

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
          <View className="flex-row items-center justify-between px-6 pt-6 pb-3">
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

      <ScrollView className="flex-1 px-6 py-6" contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
        <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-xl text-slate-900 mb-6">Available Gigs</Text>
        {isLoading ? (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" color="#008080" />
          </View>
        ) : events.length === 0 ? (
          <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-center py-12 text-slate-400">No gigs available yet.</Text>
        ) : (
          <View className="space-y-6">
            {events.map((event, index) => (
              <FadeInView key={event.id} delay={100 + index * 80} duration={450}>
                <ScalePress
                  onPress={() => router.push(`/worker/gig/${event.id}`)}
                  className="bg-white rounded-3xl shadow-sm ring-1 ring-slate-100 overflow-hidden"
                >
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
                    <View className="flex-row justify-between items-start mb-3">
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
                    <View className="flex-col gap-3 mb-6 mt-4">
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
                    </View>
                    <View className="flex-row gap-3">
                      <ScalePress
                        onPress={() => handleApply(event.id)}
                        disabled={applyingId === event.id}
                        className="flex-1 h-12 bg-primary items-center justify-center rounded-2xl"
                      >
                        <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-white text-sm">
                          {applyingId === event.id ? 'Applying...' : 'Apply'}
                        </Text>
                      </ScalePress>
                      <Pressable
                        onPress={() => toggleSave(event.id)}
                        className={`w-14 h-12 border border-slate-100 items-center justify-center rounded-2xl ${savedIds.has(event.id) ? 'bg-primary/10' : 'bg-white'}`}
                      >
                        <Icon
                          name="bookmark"
                          className={`${savedIds.has(event.id) ? 'text-primary' : 'text-slate-300'} text-2xl`}
                        />
                      </Pressable>
                    </View>
                  </View>
                </ScalePress>
              </FadeInView>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default WorkerDashboard;
