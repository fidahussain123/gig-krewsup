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
import api from '../lib/api';
import Icon from '../components/Icon';
import { useAuth } from '../contexts/AuthContext';

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
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#008080" />
      </View>
    );
  }

  if (!event) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center p-6">
        <Text className="text-slate-500 text-center">{error || 'Event not found'}</Text>
        <Pressable onPress={() => router.back()} className="mt-4 px-6 py-3 bg-primary rounded-xl">
          <Text className="text-white font-bold">Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <View
        className="bg-white border-b border-slate-100 px-4 flex-row items-center justify-between"
        style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}
      >
        <Pressable onPress={() => router.back()} className="h-10 w-10 rounded-full bg-slate-100 items-center justify-center">
          <Icon name="arrow_back_ios_new" className="text-slate-600" />
        </Pressable>
        <Text className="text-lg font-bold text-slate-900">Event details</Text>
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 + insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="rounded-b-3xl overflow-hidden bg-white shadow-sm">
          <View className="h-48">
            {event.image_url ? (
              <Image source={{ uri: event.image_url }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <View className="w-full h-full bg-slate-200 items-center justify-center">
                <Icon name="event" className="text-slate-400 text-5xl" />
              </View>
            )}
            <View className="absolute bottom-3 left-4 right-4">
              <View className="bg-primary/90 px-3 py-1.5 rounded-lg self-start mb-2">
                <Text className="text-white text-xs font-bold uppercase">{event.job_type || 'Event'}</Text>
              </View>
              <Text className="text-xl font-extrabold text-white" numberOfLines={2}>{event.title}</Text>
            </View>
          </View>
        </View>

        {/* Company / Organizer profile */}
        {(organizer?.company_name || organizer?.name) && (
          <View className="mx-4 mt-4 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <Text className="text-xs font-bold text-slate-400 uppercase mb-3">Company / Organizer</Text>
            <View className="flex-row items-center gap-4">
              <View className="h-14 w-14 rounded-xl bg-slate-100 overflow-hidden items-center justify-center">
                {organizer.avatar_url ? (
                  <Image source={{ uri: organizer.avatar_url }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <Text className="text-xl font-bold text-primary">{(organizer.company_name || organizer.name || 'O')[0]}</Text>
                )}
              </View>
              <View className="flex-1">
                <Text className="font-bold text-slate-900 text-base">
                  {organizer.company_name || organizer.name || 'Organizer'}
                </Text>
                {organizer.company_name && organizer.name && (
                  <Text className="text-sm text-slate-500">{organizer.name}</Text>
                )}
                <View className="flex-row items-center gap-1.5 mt-1">
                  <Icon name="check_circle" className="text-primary text-sm" />
                  <Text className="text-xs font-medium text-slate-500">Verified organizer</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View className="mx-4 mt-3 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <Text className="text-xs font-bold text-slate-400 uppercase mb-3">Date & time</Text>
          <View className="flex-row items-center gap-3 mb-2">
            <Icon name="calendar_today" className="text-primary" />
            <Text className="font-medium text-slate-800">{formatDate(event.event_date)}</Text>
          </View>
          {(event.start_time || event.end_time) && (
            <View className="flex-row items-center gap-3">
              <Icon name="schedule" className="text-primary" />
              <Text className="font-medium text-slate-800">
                {formatTime(event.start_time)} – {formatTime(event.end_time)}
              </Text>
            </View>
          )}
        </View>

        <View className="mx-4 mt-3 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <Text className="text-xs font-bold text-slate-400 uppercase mb-3">Location</Text>
          <View className="flex-row items-start gap-3">
            <Icon name="location_on" className="text-primary" />
            <View>
              <Text className="font-medium text-slate-800">{event.venue || event.location || 'TBD'}</Text>
              {event.location && event.venue && (
                <Text className="text-sm text-slate-500 mt-0.5">{event.location}</Text>
              )}
            </View>
          </View>
        </View>

        <View className="mx-4 mt-3 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <Text className="text-xs font-bold text-slate-400 uppercase mb-3">Staffing & pay</Text>
          <View className="flex-row gap-6">
            <View className="flex-row items-center gap-2">
              <View className="h-10 w-10 rounded-xl bg-blue-50 items-center justify-center">
                <Icon name="male" className="text-blue-600" />
              </View>
              <View>
                <Text className="font-bold text-slate-900">{event.male_count || 0} roles</Text>
                <Text className="text-xs text-slate-500">₹{event.male_pay ?? 0}/each</Text>
              </View>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="h-10 w-10 rounded-xl bg-pink-50 items-center justify-center">
                <Icon name="female" className="text-pink-600" />
              </View>
              <View>
                <Text className="font-bold text-slate-900">{event.female_count || 0} roles</Text>
                <Text className="text-xs text-slate-500">₹{event.female_pay ?? 0}/each</Text>
              </View>
            </View>
          </View>
        </View>

        {event.description && (
          <View className="mx-4 mt-3 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <Text className="text-xs font-bold text-slate-400 uppercase mb-3">Description</Text>
            <Text className="text-slate-600 leading-relaxed">{event.description}</Text>
          </View>
        )}

        {event.total != null && (
          <View className="mx-4 mt-3 bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <Text className="text-xs font-bold text-slate-400 uppercase mb-2">Pay (indicative)</Text>
            <Text className="text-2xl font-extrabold text-primary">₹{getDisplayPay()} <Text className="text-sm font-medium text-slate-500">/ role</Text></Text>
          </View>
        )}
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-3 flex-row items-center gap-4"
        style={{ paddingBottom: insets.bottom + 12 }}
      >
        <View>
          <Text className="text-xs text-slate-400 font-medium">Pay</Text>
          <Text className="text-xl font-bold text-slate-900">₹{getDisplayPay()}</Text>
        </View>
        <Pressable
          onPress={handleApply}
          disabled={isApplying}
          className="flex-1 h-12 bg-primary rounded-xl items-center justify-center"
        >
          <Text className="text-white font-bold">{isApplying ? 'Applying...' : 'Apply now'}</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default WorkerEventDetailScreen;
