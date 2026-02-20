import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../lib/api';
import Icon from '../components/Icon';

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Pending' },
  accepted: { bg: 'bg-green-50', text: 'text-green-700', label: 'Accepted' },
  rejected: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Declined' },
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
    <View className="flex-1 bg-slate-50">
      <View
        className="bg-white border-b border-slate-100 px-4 flex-row items-center"
        style={{ paddingTop: insets.top + 12, paddingBottom: 14 }}
      >
        {canGoBack && (
          <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full mr-2">
            <Icon name="arrow_back_ios_new" className="text-slate-600" size={22} />
          </Pressable>
        )}
        <Text
          style={{ fontFamily: 'Inter_800ExtraBold' }}
          className={`text-lg text-slate-900 ${canGoBack ? 'flex-1' : 'flex-1 text-center'}`}
        >
          My Applications
        </Text>
        {canGoBack && <View className="w-10" />}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 32 + insets.bottom + 80,
        }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#008080" />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View className="items-center justify-center py-16">
            <ActivityIndicator size="large" color="#008080" />
          </View>
        ) : applications.length === 0 ? (
          <View className="items-center py-16 px-6">
            <View className="h-20 w-20 rounded-full bg-slate-100 items-center justify-center mb-4">
              <Icon name="event-note" className="text-slate-300 text-4xl" />
            </View>
            <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-slate-800 text-center mb-1">No applications yet</Text>
            <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-500 text-sm text-center">Apply to events from Home to see them here.</Text>
          </View>
        ) : (
          <View className="gap-3">
            {applications.map((app) => {
              const status = statusConfig[app.status] || statusConfig.pending;
              return (
                <View
                  key={app.application_id}
                  className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm"
                >
                  <View className="p-4 flex-row items-start justify-between gap-3">
                    <View className="flex-1 min-w-0">
                      <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-slate-900 text-base" numberOfLines={2}>
                        {app.title}
                      </Text>
                      <View className="flex-row items-center mt-2 gap-2">
                        <Icon name="calendar_today" size={14} className="text-slate-400" />
                        <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-500 text-xs">
                          {formatDate(app.event_date)}
                        </Text>
                      </View>
                      {(app.venue || app.location) && (
                        <View className="flex-row items-center mt-1 gap-2">
                          <Icon name="location_on" size={14} className="text-slate-400" />
                          <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-500 text-xs" numberOfLines={1}>
                            {app.venue || app.location}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View className={`px-3 py-1.5 rounded-lg ${status.bg}`}>
                      <Text style={{ fontFamily: 'Inter_700Bold' }} className={`text-xs ${status.text}`}>
                        {status.label}
                      </Text>
                    </View>
                  </View>
                  {app.status === 'accepted' && (
                    <View className="px-4 pb-4 pt-0">
                      <Pressable
                        onPress={() => handleOpenChat(app.event_id)}
                        className="h-11 rounded-xl bg-primary flex-row items-center justify-center gap-2"
                      >
                        <Icon name="chat-bubble" className="text-white" size={18} />
                        <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-white text-sm">Open event chat</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default WorkerApplicationsScreen;
