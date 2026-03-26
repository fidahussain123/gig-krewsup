import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Image, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import Icon from '../components/Icon';
import { FadeInView, ScalePress, SlideInView } from '../components/AnimatedComponents';
import { LocationHeader, SectionHeader, StatCard, EmptyState } from '../components/DistrictUI';

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
    <View className="flex-1 bg-surface-secondary">
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 32 + insets.bottom + 90,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E94560" />
        }
      >
        {/* Header */}
        <FadeInView delay={0} duration={400}>
          <View className="bg-white" style={{ paddingTop: insets.top }}>
            <LocationHeader
              name={user?.name || 'Organizer'}
              avatarUrl={user?.avatarUrl}
              onProfilePress={() => router.push('/organizer/profile')}
              onNotificationPress={() => {}}
            />
          </View>
        </FadeInView>

        {/* Wallet Hero Card */}
        <View className="px-5 pt-5">
          <FadeInView delay={100} duration={400}>
            <ScalePress
              onPress={() => router.push('/organizer/wallet')}
              className="overflow-hidden rounded-3xl"
              style={{
                shadowColor: '#1A1A2E',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 20,
                elevation: 8,
              }}
            >
              <LinearGradient
                colors={['#1A1A2E', '#16213E', '#0F3460']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="px-6 py-6"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-sm uppercase tracking-wider text-white/60">
                      Pending to pay
                    </Text>
                    <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="mt-2 text-4xl text-white">
                      ₹{stats.pendingToPay.toLocaleString('en-IN')}
                    </Text>
                    <View className="flex-row items-center gap-1.5 mt-3">
                      <Icon name="arrow_forward" className="text-accent text-sm" />
                      <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-xs text-accent">
                        View wallet
                      </Text>
                    </View>
                  </View>
                  <View className="rounded-2xl bg-white/10 p-4">
                    <Icon name="account-balance-wallet" className="text-white text-4xl" />
                  </View>
                </View>
              </LinearGradient>
            </ScalePress>
          </FadeInView>
        </View>

        {/* Stats Row */}
        <View className="px-5 pt-4">
          <View className="flex-row gap-3">
            <SlideInView direction="left" delay={200} duration={400} style={{ flex: 1 }}>
              <StatCard
                label="Active events"
                value={String(stats.activeGigs)}
                icon="event"
                color="accent"
              />
            </SlideInView>
            <SlideInView direction="right" delay={250} duration={400} style={{ flex: 1 }}>
              <StatCard
                label="Applicants"
                value={String(stats.applicants)}
                icon="groups"
                color="warning"
              />
            </SlideInView>
          </View>
        </View>

        {/* Your Events */}
        <FadeInView delay={300} duration={400}>
          <View className="mt-6">
            <SectionHeader
              title="Your Events"
              onViewAll={() => router.push('/organizer/events')}
            />

            {isLoading ? (
              <View className="items-center justify-center py-14">
                <ActivityIndicator size="large" color="#E94560" />
              </View>
            ) : events.length === 0 ? (
              <View className="mx-5">
                <EmptyState
                  icon="event"
                  title="No events yet"
                  subtitle="Create your first event to start hiring gig workers"
                  actionLabel="Create Event"
                  onAction={() => router.push('/organizer/create-event')}
                />
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }} className="pb-2">
                {events.map((event, index) => {
                  const date = formatDate(event.event_date);
                  return (
                    <FadeInView key={event.id} delay={350 + index * 60} duration={350} style={{ marginRight: 14 }}>
                      <ScalePress
                        onPress={() => router.push(`/organizer/events/${event.id}`)}
                        className="w-[260px] bg-white rounded-3xl overflow-hidden"
                        style={{
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.08,
                          shadowRadius: 12,
                          elevation: 4,
                        }}
                      >
                        <View className="relative aspect-[16/10] overflow-hidden bg-surface-tertiary">
                          {event.image_url ? (
                            <Image source={{ uri: event.image_url }} className="w-full h-full" resizeMode="cover" />
                          ) : (
                            <View className="w-full h-full items-center justify-center bg-primary-50">
                              <Icon name="event" className="text-primary-200 text-5xl" />
                            </View>
                          )}
                          <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.4)']}
                            className="absolute bottom-0 left-0 right-0 h-16"
                          />
                          {/* Date Badge */}
                          <View className="absolute right-3 top-3 rounded-xl bg-white px-3 py-2 items-center"
                            style={{
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.1,
                              shadowRadius: 4,
                              elevation: 2,
                            }}
                          >
                            <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-[10px] uppercase text-accent">{date.month}</Text>
                            <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-base text-primary-900">{date.day}</Text>
                          </View>
                          {/* Status Badge */}
                          <View className={`absolute left-3 top-3 rounded-full px-2.5 py-1 ${event.status === 'published' ? 'bg-success' : 'bg-slate-400'}`}>
                            <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[9px] uppercase text-white tracking-wider">{event.status}</Text>
                          </View>
                        </View>
                        <View className="p-4">
                          <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900 text-base" numberOfLines={2}>{event.title}</Text>
                          <View className="mt-2 flex-row items-center gap-1.5">
                            <Icon name="location-on" className="text-slate-300" size={14} />
                            <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-xs text-slate-400 flex-1" numberOfLines={1}>{event.location || 'Location TBD'}</Text>
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

        {/* Quick Action CTA */}
        <FadeInView delay={450} duration={400}>
          <View className="mx-5 mt-6">
            <ScalePress
              onPress={() => router.push('/organizer/create-event')}
              className="flex-row items-center justify-center gap-2 rounded-2xl bg-accent py-4"
              style={{
                shadowColor: '#E94560',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <Icon name="add-circle" className="text-white text-2xl" />
              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-base text-white">Create New Event</Text>
            </ScalePress>
          </View>
        </FadeInView>
      </ScrollView>
    </View>
  );
};

export default OrganizerDashboard;
