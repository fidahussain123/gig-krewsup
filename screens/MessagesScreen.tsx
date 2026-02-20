import React, { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../lib/api';
import Icon from '../components/Icon';

interface MessagesScreenProps {
  role: 'organizer' | 'worker';
}

interface Conversation {
  id: string;
  title: string;
  type: string;
  last_message: string;
  last_message_at: string;
  participants: { id: string; name: string; avatar_url?: string }[];
}

const MessagesScreen: React.FC<MessagesScreenProps> = ({ role }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await api.getConversations();
      if (result.data?.conversations) {
        setConversations(result.data.conversations);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations])
  );

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const displayTitle = (chat: Conversation) =>
    chat.title || chat.participants.map(p => p.name).filter(Boolean).join(', ') || 'Chat';

  const displayPreview = (chat: Conversation) => {
    const msg = chat.last_message || '';
    if (msg.startsWith('Voice call')) return msg;
    return msg || 'No messages yet';
  };

  return (
    <View className="flex-1 bg-slate-50">
      <View
        className="bg-white border-b border-slate-100 px-5 pb-4"
        style={{ paddingTop: Math.max(insets.top, 12) + 10 }}
      >
        <Text className="text-2xl font-extrabold text-slate-900 tracking-tight">Messages</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 24 + insets.bottom + 80,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#008080" />
          </View>
        ) : conversations.length === 0 ? (
          <View className="items-center justify-center py-20 px-6">
            <View className="h-24 w-24 rounded-full bg-slate-100 items-center justify-center mb-5">
              <Icon name="chat-bubble" className="text-slate-300 text-5xl" />
            </View>
            <Text className="text-xl font-bold text-slate-800 mb-2">No messages yet</Text>
            <Text className="text-base text-slate-500 text-center">
              {role === 'organizer'
                ? 'Chat with workers from your event team'
                : 'Apply to gigs to message organizers'}
            </Text>
          </View>
        ) : (
          <View className="pt-3">
            {conversations.map((chat) => (
              <Pressable
                key={chat.id}
                onPress={() => router.push(`/chat/${chat.id}`)}
                className="flex-row items-center gap-4 bg-white rounded-2xl p-4 mb-3 border border-slate-100 active:opacity-90"
              >
                <View className="h-14 w-14 rounded-2xl overflow-hidden bg-slate-100">
                  {chat.participants.length === 1 && chat.participants[0]?.avatar_url ? (
                    <Image
                      source={{ uri: chat.participants[0].avatar_url }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-full h-full items-center justify-center bg-primary/10">
                      {chat.participants.length > 1 ? (
                        <Icon name="group" className="text-primary text-2xl" />
                      ) : (
                        <Icon name="person" className="text-primary text-2xl" />
                      )}
                    </View>
                  )}
                </View>
                <View className="flex-1 min-w-0">
                  <View className="flex-row items-center justify-between gap-2">
                    <Text className="font-bold text-slate-900 text-lg flex-1" numberOfLines={1}>
                      {displayTitle(chat)}
                    </Text>
                    <Text className="text-xs font-medium text-slate-400 shrink-0">
                      {formatTime(chat.last_message_at)}
                    </Text>
                  </View>
                  <Text className="text-base text-slate-500 mt-1" numberOfLines={1}>
                    {displayPreview(chat)}
                  </Text>
                </View>
                <Icon name="chevron_right" className="text-slate-300 text-xl" />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default MessagesScreen;
