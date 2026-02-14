import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../lib/api';
import Icon from '../components/Icon';

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const WorkerApplicationsScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setIsLoading(true);
    const result = await api.getMyEventApplicationsDetails();
    if (result.data?.applications) {
      setApplications(result.data.applications);
    }
    setIsLoading(false);
  };

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

  return (
    <View className="flex-1 bg-slate-50">
      <View className="bg-white px-6 pb-4 flex-row items-center border-b border-slate-100" style={{ paddingTop: insets.top + 10 }}>
        <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full">
          <Icon name="arrow_back_ios_new" className="text-slate-700" />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-lg text-slate-900 flex-1 text-center pr-10">
          My Applications
        </Text>
      </View>

      <ScrollView className="flex-1 px-6 py-6" contentContainerStyle={{ paddingBottom: 24 + insets.bottom + 90 }}>
        {isLoading ? (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" color="#008080" />
          </View>
        ) : applications.length === 0 ? (
          <View className="items-center py-16">
            <View className="h-16 w-16 rounded-full bg-slate-100 items-center justify-center mb-4">
              <Icon name="fact_check" className="text-slate-300 text-3xl" />
            </View>
            <Text className="font-bold text-slate-700 mb-1">No applications yet</Text>
            <Text className="text-sm text-slate-400">Apply to events to see status here.</Text>
          </View>
        ) : (
          <View className="space-y-4">
            {applications.map((app) => (
              <View key={app.application_id} className="bg-white rounded-2xl p-4 border border-slate-100">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-4">
                    <Text className="text-base font-extrabold text-slate-900">{app.title}</Text>
                    <Text className="text-xs text-slate-400 mt-1">{formatDate(app.event_date)}</Text>
                    <Text className="text-xs text-slate-400 mt-1">{app.venue || app.location || 'Location TBD'}</Text>
                  </View>
                  <View className={`px-2.5 py-1 rounded-full ${statusStyles[app.status] || 'bg-slate-100 text-slate-600'}`}>
                    <Text className="text-[10px] font-bold uppercase">{app.status}</Text>
                  </View>
                </View>
                {app.status === 'accepted' && (
                  <Pressable
                    onPress={() => handleOpenChat(app.event_id)}
                    className="mt-4 h-10 rounded-xl bg-primary items-center justify-center"
                  >
                    <Text className="text-white text-xs font-bold uppercase tracking-widest">Open Event Chat</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default WorkerApplicationsScreen;
