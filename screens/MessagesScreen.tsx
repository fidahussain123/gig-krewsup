import React, { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../lib/api';
import Icon from '../components/Icon';
import { FadeInView } from '../components/AnimatedComponents';
import { EmptyState } from '../components/DistrictUI';

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
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
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
    <View className="flex-1 bg-surface-secondary">
      <View className="bg-white" style={{ paddingTop: insets.top }}>
        <View className="px-5 py-3">
          <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-2xl text-primary-900 tracking-tight">Chat</Text>
        </View>
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
            <ActivityIndicator size="large" color="#E94560" />
          </View>
        ) : conversations.length === 0 ? (
          <EmptyState
            icon="chat-bubble"
            title="No messages yet"
            subtitle={role === 'organizer'
              ? 'Chat with workers from your event team'
              : 'Apply to gigs to message organizers'}
          />
        ) : (
          <View className="gap-2">
            {conversations.map((chat, index) => (
              <FadeInView key={chat.id} delay={index * 40} duration={350}>
                <Pressable
                  onPress={() => router.push(`/chat/${chat.id}`)}
                  className="flex-row items-center gap-4 bg-white rounded-2xl p-4 active:opacity-90"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.04,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <View className="h-13 w-13 rounded-2xl overflow-hidden bg-accent-50 items-center justify-center" style={{ width: 52, height: 52 }}>
                    {chat.participants.length === 1 && chat.participants[0]?.avatar_url ? (
                      <Image
                        source={{ uri: chat.participants[0].avatar_url }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-full h-full items-center justify-center">
                        {chat.participants.length > 1 ? (
                          <Icon name="group" className="text-accent text-2xl" />
                        ) : (
                          <Icon name="person" className="text-accent text-2xl" />
                        )}
                      </View>
                    )}
                  </View>
                  <View className="flex-1 min-w-0">
                    <View className="flex-row items-center justify-between gap-2">
                      <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900 text-base flex-1" numberOfLines={1}>
                        {displayTitle(chat)}
                      </Text>
                      <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-xs text-slate-400 shrink-0">
                        {formatTime(chat.last_message_at)}
                      </Text>
                    </View>
                    <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-sm text-slate-400 mt-1" numberOfLines={1}>
                      {displayPreview(chat)}
                    </Text>
                  </View>
                </Pressable>
              </FadeInView>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default MessagesScreen;
