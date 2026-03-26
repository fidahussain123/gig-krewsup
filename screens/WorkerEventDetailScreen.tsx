import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../lib/api';
import Icon from '../components/Icon';
import { useAuth } from '../contexts/AuthContext';
import { FadeInView, ScalePress } from '../components/AnimatedComponents';
import { GlassCard } from '../components/DistrictUI';

const WorkerEventDetailScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [organizer, setOrganizer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    loadEvent();
  }, [id]);

  const loadEvent = async () => {
    setIsLoading(true);
    setError('');
    const result = await api.getEvent(id);
    if (result.data?.event) {
      setEvent(result.data.event);
      setOrganizer(result.data.organizer || null);
    } else {
      setError(result.error || 'Event not found');
    }
    setIsLoading(false);
  };

  const handleApply = async () => {
    if (!id) return;
    setIsApplying(true);
    const result = await api.applyToEvent(id);
    if (result.data) {
      router.back();
    } else {
      setError(result.error || 'Failed to apply');
    }
    setIsApplying(false);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Date TBD';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${period}`;
  };

  const getDisplayPay = () => {
    if (!event) return 0;
    if (user?.gender === 'male' && event.male_pay != null) return event.male_pay;
    if (user?.gender === 'female' && event.female_pay != null) return event.female_pay;
    return event.male_pay ?? event.female_pay ?? 0;
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface-secondary items-center justify-center">
        <ActivityIndicator size="large" color="#E94560" />
      </View>
    );
  }

  if (!event) {
    return (
      <View className="flex-1 bg-surface-secondary items-center justify-center p-6">
        <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-400 text-center">{error || 'Event not found'}</Text>
        <Pressable onPress={() => router.back()} className="mt-4 px-6 py-3 bg-accent rounded-2xl">
          <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-white">Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface-secondary">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 + insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image */}
        <View className="relative h-72">
          {event.image_url ? (
            <Image source={{ uri: event.image_url }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <View className="w-full h-full bg-primary-light items-center justify-center">
              <Icon name="event" className="text-white/20 text-6xl" />
            </View>
          )}
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.7)']}
            className="absolute top-0 left-0 right-0 bottom-0"
          />
          {/* Back Button */}
          <Pressable
            onPress={() => router.back()}
            className="absolute h-10 w-10 rounded-full bg-black/30 items-center justify-center"
            style={{ top: insets.top + 8, left: 16 }}
          >
            <Icon name="arrow_back_ios_new" className="text-white text-base" />
          </Pressable>
          {/* Bottom overlay */}
          <View className="absolute bottom-5 left-5 right-5">
            <View className="bg-accent/90 px-3 py-1.5 rounded-full self-start mb-2">
              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-white text-xs uppercase">{event.job_type || 'Event'}</Text>
            </View>
            <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-white text-2xl" numberOfLines={2}>{event.title}</Text>
          </View>
        </View>

        {/* Organizer Card */}
        {(organizer?.company_name || organizer?.name) && (
          <FadeInView delay={100} duration={400}>
            <View className="mx-5 -mt-5">
              <GlassCard>
                <View className="flex-row items-center gap-4">
                  <View className="h-14 w-14 rounded-2xl bg-accent-50 overflow-hidden items-center justify-center">
                    {organizer.avatar_url ? (
                      <Image source={{ uri: organizer.avatar_url }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                      <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-xl text-accent">{(organizer.company_name || organizer.name || 'O')[0]}</Text>
                    )}
                  </View>
                  <View className="flex-1">
                    <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900 text-base">
                      {organizer.company_name || organizer.name || 'Organizer'}
                    </Text>
                    <View className="flex-row items-center gap-1.5 mt-1">
                      <Icon name="verified" className="text-accent text-sm" />
                      <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-xs text-slate-400">Verified organizer</Text>
                    </View>
                  </View>
                </View>
              </GlassCard>
            </View>
          </FadeInView>
        )}

        {/* Info Cards */}
        <FadeInView delay={200} duration={400}>
          <View className="mx-5 mt-4">
            <GlassCard>
              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-xs text-slate-400 uppercase tracking-wider mb-3">Date & Time</Text>
              <View className="flex-row items-center gap-3 mb-2">
                <View className="h-9 w-9 rounded-xl bg-accent-50 items-center justify-center">
                  <Icon name="calendar-today" className="text-accent text-base" />
                </View>
                <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-primary-900">{formatDate(event.event_date)}</Text>
              </View>
              {(event.start_time || event.end_time) && (
                <View className="flex-row items-center gap-3">
                  <View className="h-9 w-9 rounded-xl bg-brand-50 items-center justify-center">
                    <Icon name="schedule" className="text-brand text-base" />
                  </View>
                  <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-primary-900">
                    {formatTime(event.start_time)} – {formatTime(event.end_time)}
                  </Text>
                </View>
              )}
            </GlassCard>
          </View>
        </FadeInView>

        <FadeInView delay={250} duration={400}>
          <View className="mx-5 mt-3">
            <GlassCard>
              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-xs text-slate-400 uppercase tracking-wider mb-3">Location</Text>
              <View className="flex-row items-start gap-3">
                <View className="h-9 w-9 rounded-xl bg-accent-50 items-center justify-center">
                  <Icon name="location-on" className="text-accent text-base" />
                </View>
                <View className="flex-1">
                  <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-primary-900">{event.venue || event.location || 'TBD'}</Text>
                  {event.location && event.venue && (
                    <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-sm text-slate-400 mt-0.5">{event.location}</Text>
                  )}
                </View>
              </View>
            </GlassCard>
          </View>
        </FadeInView>

        <FadeInView delay={300} duration={400}>
          <View className="mx-5 mt-3">
            <GlassCard>
              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-xs text-slate-400 uppercase tracking-wider mb-3">Staffing & Pay</Text>
              <View className="flex-row gap-6">
                <View className="flex-row items-center gap-2">
                  <View className="h-10 w-10 rounded-xl bg-blue-50 items-center justify-center">
                    <Icon name="male" className="text-blue-600" />
                  </View>
                  <View>
                    <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900">{event.male_count || 0} roles</Text>
                    <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-xs text-slate-400">₹{event.male_pay ?? 0}/each</Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="h-10 w-10 rounded-xl bg-pink-50 items-center justify-center">
                    <Icon name="female" className="text-pink-600" />
                  </View>
                  <View>
                    <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900">{event.female_count || 0} roles</Text>
                    <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-xs text-slate-400">₹{event.female_pay ?? 0}/each</Text>
                  </View>
                </View>
              </View>
            </GlassCard>
          </View>
        </FadeInView>

        {event.description && (
          <FadeInView delay={350} duration={400}>
            <View className="mx-5 mt-3">
              <GlassCard>
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-xs text-slate-400 uppercase tracking-wider mb-3">Description</Text>
                <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-600 leading-relaxed">{event.description}</Text>
              </GlassCard>
            </View>
          </FadeInView>
        )}

        {event.total != null && (
          <FadeInView delay={400} duration={400}>
            <View className="mx-5 mt-3">
              <GlassCard>
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-xs text-slate-400 uppercase tracking-wider mb-2">Your Pay</Text>
                <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-3xl text-accent">
                  ₹{getDisplayPay()} <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-sm text-slate-400">/ role</Text>
                </Text>
              </GlassCard>
            </View>
          </FadeInView>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white px-5 py-4 flex-row items-center gap-4"
        style={{
          paddingBottom: insets.bottom + 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        <View>
          <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-xs text-slate-400">Pay</Text>
          <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-xl text-primary-900">₹{getDisplayPay()}</Text>
        </View>
        <Pressable
          onPress={handleApply}
          disabled={isApplying}
          className="flex-1 h-13 bg-accent rounded-2xl items-center justify-center"
          style={{
            height: 52,
            shadowColor: '#E94560',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-white text-base">{isApplying ? 'Applying...' : 'Apply Now'}</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default WorkerEventDetailScreen;
