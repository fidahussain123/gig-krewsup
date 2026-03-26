import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../lib/api';
import Icon from '../components/Icon';
import { FadeInView } from '../components/AnimatedComponents';
import { EmptyState, GlassCard } from '../components/DistrictUI';

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-warning/10', text: 'text-warning', label: 'Pending' },
  accepted: { bg: 'bg-success/10', text: 'text-success', label: 'Accepted' },
  rejected: { bg: 'bg-slate-100', text: 'text-slate-500', label: 'Declined' },
};

const WorkerApplicationsScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [applications, setApplications] = useState<any[]>([]);

  const loadApplications = useCallback(async () => {
    const result = await api.getMyEventApplicationsDetails();
    if (result.data?.applications) {
      setApplications(result.data.applications);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const run = async () => {
        setIsLoading(true);
        await loadApplications();
        if (!cancelled) setIsLoading(false);
      };
      run();
      return () => { cancelled = true; };
    }, [loadApplications])
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadApplications();
    setIsRefreshing(false);
  }, [loadApplications]);

  const handleOpenChat = async (eventId: string) => {
    const result = await api.getEventConversation(eventId);
    if (result.data?.conversationId) {
      router.push(`/chat/event/${result.data.conversationId}`);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Date TBD';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const canGoBack = router.canGoBack?.() ?? false;

  return (
    <View className="flex-1 bg-surface-secondary">
      <View className="bg-white" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center px-5 py-3">
          {canGoBack && (
            <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full mr-2">
              <Icon name="arrow_back_ios_new" className="text-primary-900" size={20} />
            </Pressable>
          )}
          <Text
            style={{ fontFamily: 'Inter_800ExtraBold' }}
            className={`text-xl text-primary-900 ${canGoBack ? 'flex-1' : 'flex-1'}`}
          >
            My Applications
          </Text>
          {canGoBack && <View className="w-10" />}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 32 + insets.bottom + 80,
        }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#E94560" />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View className="items-center justify-center py-16">
            <ActivityIndicator size="large" color="#E94560" />
          </View>
        ) : applications.length === 0 ? (
          <EmptyState
            icon="event-note"
            title="No applications yet"
            subtitle="Apply to events from Home to see them here."
          />
        ) : (
          <View className="gap-3">
            {applications.map((app, index) => {
              const status = statusConfig[app.status] || statusConfig.pending;
              return (
                <FadeInView key={app.application_id} delay={index * 50} duration={350}>
                  <GlassCard>
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="flex-1 min-w-0">
                        <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900 text-base" numberOfLines={2}>
                          {app.title}
                        </Text>
                        <View className="flex-row items-center mt-2 gap-3">
                          <View className="flex-row items-center gap-1">
                            <Icon name="calendar-today" size={13} className="text-slate-300" />
                            <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-400 text-xs">
                              {formatDate(app.event_date)}
                            </Text>
                          </View>
                          {(app.venue || app.location) && (
                            <View className="flex-row items-center gap-1 flex-1">
                              <Icon name="location-on" size={13} className="text-slate-300" />
                              <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-400 text-xs" numberOfLines={1}>
                                {app.venue || app.location}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View className={`px-3 py-1.5 rounded-full ${status.bg}`}>
                        <Text style={{ fontFamily: 'Inter_700Bold' }} className={`text-xs ${status.text}`}>
                          {status.label}
                        </Text>
                      </View>
                    </View>
                    {app.status === 'accepted' && (
                      <Pressable
                        onPress={() => handleOpenChat(app.event_id)}
                        className="mt-4 h-11 rounded-2xl bg-accent flex-row items-center justify-center gap-2"
                        style={{
                          shadowColor: '#E94560',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.2,
                          shadowRadius: 8,
                          elevation: 4,
                        }}
                      >
                        <Icon name="chat-bubble" className="text-white" size={16} />
                        <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-white text-sm">Open Event Chat</Text>
                      </Pressable>
                    )}
                  </GlassCard>
                </FadeInView>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default WorkerApplicationsScreen;
