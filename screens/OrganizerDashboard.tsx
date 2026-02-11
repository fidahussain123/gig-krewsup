
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
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
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ pendingToPay: 0, activeGigs: 0, applicants: 0 });
  const [isLoading, setIsLoading] = useState(true);

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
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <FadeInView delay={0} duration={500}>
          <View className="flex-row items-center justify-between bg-white p-6">
            <View className="flex-row items-center gap-3">
              <View className="h-12 w-12 rounded-full border-2 border-primary/20 bg-gray-200 overflow-hidden">
                {user?.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <View className="w-full h-full items-center justify-center bg-primary/10">
                    <Icon name="person" className="text-primary text-2xl" />
                  </View>
                )}
              </View>
              <View>
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[10px] uppercase tracking-widest text-slate-400">Welcome back</Text>
                <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-xl text-slate-900">{user?.name || 'Organizer'}</Text>
              </View>
            </View>
            <ScalePress className="h-11 w-11 items-center justify-center rounded-full bg-white ring-1 ring-slate-100">
              <Icon name="notifications" className="text-slate-700 text-2xl" />
            </ScalePress>
          </View>
        </FadeInView>

        <View className="p-6 pt-2">
          <View className="flex-row flex-wrap gap-4">
            <FadeInView delay={150} duration={500}>
              <ScalePress
                onPress={() => router.push('/organizer/wallet')}
                className="w-full flex-row items-center justify-between rounded-3xl bg-primary p-7"
              >
                <View>
                  <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-xs uppercase tracking-widest text-white/80">Pending To Pay</Text>
                  <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="mt-1 text-3xl text-white">₹{stats.pendingToPay.toLocaleString()}</Text>
                </View>
                <View className="rounded-2xl bg-white/20 p-4">
                  <Icon name="account-balance-wallet" className="text-white text-4xl" />
                </View>
              </ScalePress>
            </FadeInView>

            <SlideInView direction="left" delay={250} duration={450}>
              <View className="flex-1 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                <Icon name="work" className="text-primary mb-2 text-3xl" />
                <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-3xl text-slate-900">{stats.activeGigs}</Text>
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[10px] text-slate-400 uppercase tracking-widest">Active Events</Text>
              </View>
            </SlideInView>

            <SlideInView direction="right" delay={300} duration={450}>
              <View className="flex-1 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 border-l-4 border-accent">
                <Icon name="groups" className="text-slate-300 mb-2 text-3xl" />
                <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-3xl text-slate-900">{stats.applicants}</Text>
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[10px] text-slate-400 uppercase tracking-widest">Applicants</Text>
              </View>
            </SlideInView>
          </View>
        </View>

        <FadeInView delay={350} duration={450}>
          <View className="mt-2">
            <View className="flex-row items-center justify-between px-6 pb-4">
              <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-xl text-slate-900">Your Events</Text>
              <ScalePress onPress={() => router.push('/organizer/create-event')}>
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-sm text-primary">+ Create New</Text>
              </ScalePress>
            </View>

            {isLoading ? (
              <View className="items-center justify-center py-12">
                <ActivityIndicator size="large" color="#008080" />
              </View>
            ) : events.length === 0 ? (
              <View className="mx-6 mb-6 rounded-3xl bg-white p-8 items-center shadow-sm ring-1 ring-slate-100">
                <Icon name="event" className="text-slate-200 text-6xl mb-4" />
                <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-lg text-slate-900 mb-2">No Events Yet</Text>
                <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-sm text-slate-400 mb-6 text-center">
                  Create your first event to start hiring gig workers
                </Text>
                <ScalePress
                  onPress={() => router.push('/organizer/create-event')}
                  className="flex-row items-center gap-2 rounded-2xl bg-primary px-6 py-3"
                >
                  <Icon name="add-circle" className="text-white text-xl" />
                  <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-white">Create Event</Text>
                </ScalePress>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6 pb-6">
                {events.map((event, index) => {
                  const date = formatDate(event.event_date);
                  return (
                    <FadeInView key={event.id} delay={400 + index * 100} duration={400}>
                      <ScalePress
                        onPress={() => router.push(`/organizer/events/${event.id}`)}
                        className="w-[300px] mr-4 bg-white rounded-3xl p-3 shadow-sm ring-1 ring-slate-100"
                      >
                        <View className="relative aspect-video w-full overflow-hidden rounded-2xl bg-slate-100">
                          {event.image_url ? (
                            <Image source={{ uri: event.image_url }} className="w-full h-full" resizeMode="cover" />
                          ) : (
                            <View className="w-full h-full items-center justify-center">
                              <Icon name="event" className="text-slate-300 text-6xl" />
                            </View>
                          )}
                          <View className="absolute right-3 top-3 rounded-2xl bg-white/95 px-3 py-2 items-center">
                            <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[10px] uppercase text-primary leading-none">{date.month}</Text>
                            <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-lg text-slate-900 leading-none mt-1">{date.day}</Text>
                          </View>
                          <View className={`absolute left-3 top-3 rounded-full px-3 py-1 ${event.status === 'published' ? 'bg-green-500' : 'bg-slate-200'
                            }`}>
                            <Text style={{ fontFamily: 'Inter_700Bold' }} className={`text-[10px] uppercase tracking-wider ${event.status === 'published' ? 'text-white' : 'text-slate-600'
                              }`}>
                              {event.status}
                            </Text>
                          </View>
                        </View>
                        <View className="px-2 py-3">
                          <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-lg text-slate-900">{event.title}</Text>
                          <View className="mt-1 flex-row items-center gap-1">
                            <Icon name="location-on" className="text-slate-400 text-sm" />
                            <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-xs text-slate-400">{event.location || 'Location TBD'}</Text>
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

        <FadeInView delay={500} duration={400}>
          <View className="mt-2 px-6 pb-10">
            <ScalePress
              onPress={() => router.push('/organizer/create-event')}
              className="w-full flex-row items-center justify-center gap-3 rounded-3xl bg-primary py-5"
            >
              <Icon name="add-circle" className="text-white text-2xl" />
              <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-lg text-white">Create New Event</Text>
            </ScalePress>
          </View>
        </FadeInView>
      </ScrollView>
    </View>
  );
};

export default OrganizerDashboard;
