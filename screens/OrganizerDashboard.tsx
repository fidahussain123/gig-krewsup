import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Image, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import Icon from '../components/Icon';
import { FadeInView, ScalePress, SlideInView } from '../components/AnimatedComponents';

interface Event {
  id: string;
  title: string;
  location: string;
  event_date: string;
  image_url?: string;
  status: string;
}

interface DashboardStats {
  pendingToPay: number;
  activeGigs: number;
  applicants: number;
}

const OrganizerDashboard: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ pendingToPay: 0, activeGigs: 0, applicants: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [eventsResult, walletResult] = await Promise.all([
        api.getEvents(),
        api.getWalletSummary(),
      ]);

      if (eventsResult.data?.events) {
        setEvents(eventsResult.data.events);
        const activeGigs = eventsResult.data.events.filter(
          (e: Event) => e.status === 'published'
        ).length;
        setStats(prev => ({ ...prev, activeGigs }));
      }

      if (walletResult.data) {
        setStats(prev => ({ ...prev, pendingToPay: walletResult.data.pendingTotal }));
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
    setIsLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return { month: 'TBD', day: '' };
    const date = new Date(dateString);
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      day: date.getDate().toString(),
    };
  };

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView
        contentContainerStyle={{
          paddingTop: 12,
          paddingBottom: 32 + insets.bottom + 90,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#008080" />
        }
      >
        {/* Header */}
        <FadeInView delay={0} duration={400}>
          <View
            className="flex-row items-center justify-between bg-white px-5 pb-5 border-b border-slate-100"
            style={{ paddingTop: insets.top + 16 }}
          >
            <View className="flex-row items-center gap-3">
              <View className="h-12 w-12 rounded-full border-2 border-primary/30 bg-slate-100 overflow-hidden">
                {user?.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <View className="w-full h-full items-center justify-center bg-primary/10">
                    <Icon name="person" className="text-primary text-2xl" />
                  </View>
                )}
              </View>
              <View>
                <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-lg text-slate-900">
                  {user?.name || 'Organizer'}
                </Text>
              </View>
            </View>
            <ScalePress
              onPress={() => {}}
              className="h-10 w-10 items-center justify-center rounded-full bg-slate-50"
            >
              <Icon name="notifications" className="text-slate-600 text-xl" />
            </ScalePress>
          </View>
        </FadeInView>

        {/* Pending to Pay — full-width hero card */}
        <View className="pt-5">
          <FadeInView delay={100} duration={400}>
            <ScalePress
              onPress={() => router.push('/organizer/wallet')}
              className="overflow-hidden"
              style={{
                backgroundColor: '#008080',
                borderRadius: 24,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <View className="flex-row items-center justify-between px-6 py-6">
                <View className="flex-1">
                  <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-sm uppercase tracking-wider text-white/90">
                    Pending to pay
                  </Text>
                  <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="mt-2 text-4xl text-white">
                    ₹{stats.pendingToPay.toLocaleString('en-IN')}
                  </Text>
                  <Text style={{ fontFamily: 'Inter_500Medium' }} className="mt-2 text-xs text-white/80">
                    Tap to view wallet & pay
                  </Text>
                </View>
                <View className="rounded-2xl bg-white/20 p-4">
                  <Icon name="account-balance-wallet" className="text-white text-5xl" />
                </View>
              </View>
            </ScalePress>
          </FadeInView>
        </View>

        {/* Stats row — Active Events & Applicants */}
        <View className="pt-4">
          <View className="flex-row gap-3">
            <SlideInView direction="left" delay={200} duration={400} style={{ flex: 1 }}>
              <ScalePress
                onPress={() => router.push('/organizer/events')}
                className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100"
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-2xl text-slate-900">{stats.activeGigs}</Text>
                    <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-xs text-slate-500 mt-1">Active events</Text>
                  </View>
                  <View className="h-12 w-12 rounded-xl bg-primary/10 items-center justify-center">
                    <Icon name="event" className="text-primary text-2xl" />
                  </View>
                </View>
              </ScalePress>
            </SlideInView>
            <SlideInView direction="right" delay={250} duration={400} style={{ flex: 1 }}>
              <View className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-2xl text-slate-900">{stats.applicants}</Text>
                    <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-xs text-slate-500 mt-1">Applicants</Text>
                  </View>
                  <View className="h-12 w-12 rounded-xl bg-amber-100 items-center justify-center">
                    <Icon name="groups" className="text-amber-600 text-2xl" />
                  </View>
                </View>
              </View>
            </SlideInView>
          </View>
        </View>

        {/* Your Events */}
        <FadeInView delay={300} duration={400}>
          <View className="mt-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-lg text-slate-900">Your events</Text>
              <ScalePress onPress={() => router.push('/organizer/create-event')}>
                <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-sm text-primary">+ New event</Text>
              </ScalePress>
            </View>

            {isLoading ? (
              <View className="items-center justify-center py-14">
                <ActivityIndicator size="large" color="#008080" />
              </View>
            ) : events.length === 0 ? (
              <View className="rounded-2xl bg-white p-8 items-center border border-slate-100">
                <View className="h-16 w-16 rounded-full bg-slate-100 items-center justify-center mb-4">
                  <Icon name="event" className="text-slate-400 text-4xl" />
                </View>
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-base text-slate-800 mb-1">No events yet</Text>
                <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-sm text-slate-500 mb-6 text-center px-4">
                  Create your first event to start hiring gig workers
                </Text>
                <ScalePress
                  onPress={() => router.push('/organizer/create-event')}
                  className="flex-row items-center gap-2 rounded-xl bg-primary px-5 py-3"
                >
                  <Icon name="add" className="text-white text-lg" />
                  <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-white">Create event</Text>
                </ScalePress>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-2">
                {events.map((event, index) => {
                  const date = formatDate(event.event_date);
                  return (
                    <FadeInView key={event.id} delay={350 + index * 80} duration={350} style={{ marginRight: 12 }}>
                      <ScalePress
                        onPress={() => router.push(`/organizer/events/${event.id}`)}
                        className="w-[280px] bg-white rounded-2xl overflow-hidden border border-slate-100"
                        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}
                      >
                        <View className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                          {event.image_url ? (
                            <Image source={{ uri: event.image_url }} className="w-full h-full" resizeMode="cover" />
                          ) : (
                            <View className="w-full h-full items-center justify-center bg-slate-200">
                              <Icon name="event" className="text-slate-400 text-5xl" />
                            </View>
                          )}
                          <View className="absolute right-3 top-3 rounded-xl bg-white px-3 py-2 items-center shadow-sm">
                            <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-[10px] uppercase text-primary">{date.month}</Text>
                            <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-base text-slate-900">{date.day}</Text>
                          </View>
                          <View className={`absolute left-3 top-3 rounded-lg px-2.5 py-1 ${event.status === 'published' ? 'bg-emerald-500' : 'bg-slate-400'}`}>
                            <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-[10px] uppercase text-white">{event.status}</Text>
                          </View>
                        </View>
                        <View className="p-4">
                          <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-base text-slate-900" numberOfLines={2}>{event.title}</Text>
                          <View className="mt-2 flex-row items-center gap-1.5">
                            <Icon name="location-on" className="text-slate-400" size={14} />
                            <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-xs text-slate-500 flex-1" numberOfLines={1}>{event.location || 'Location TBD'}</Text>
                          </View>
                        </View>
                      </ScalePress>
                    </FadeInView>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </FadeInView>

        {/* Quick action — Create event */}
        <FadeInView delay={450} duration={400}>
          <View className="mt-5 pb-8">
            <ScalePress
              onPress={() => router.push('/organizer/create-event')}
              className="flex-row items-center justify-center gap-2 rounded-2xl bg-primary py-4"
              style={{ shadowColor: '#008080', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 }}
            >
              <Icon name="add-circle" className="text-white text-2xl" />
              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-base text-white">Create new event</Text>
            </ScalePress>
          </View>
        </FadeInView>
      </ScrollView>
    </View>
  );
};

export default OrganizerDashboard;
