
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
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
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
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
  };

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

  const filters = ['All', 'Events', 'Direct', 'Unread'];

  return (
    <KeyboardAvoidingView className="flex-1 bg-white relative" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View className="px-6 pb-4" style={{ paddingTop: insets.top + 14 }}>
        <View className="flex-row items-center justify-between mb-6">
          <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-3xl tracking-tight text-slate-900">
            Messages
          </Text>
          <Pressable className="h-12 w-12 items-center justify-center rounded-full bg-slate-50">
            <Icon name="edit-note" className="text-slate-600 text-2xl" />
          </Pressable>
        </View>
        <View className="relative mb-4">
          <Icon name="search" className="text-slate-400 text-lg absolute left-4 top-4" />
          <TextInput
            placeholder="Search Messages"
            style={{ fontFamily: 'Inter_600SemiBold' }}
            className="w-full rounded-2xl bg-slate-50 py-4 pl-12 pr-6 text-sm text-slate-900"
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-2">
          {filters.map((cat, idx) => (
            <Pressable
              key={idx}
              onPress={() => setFilter(cat)}
              className={`rounded-full px-6 py-2.5 mr-3 ${filter === cat ? 'bg-primary' : 'bg-slate-50'
                }`}
            >
              <Text
                style={{ fontFamily: 'Inter_700Bold' }}
                className={`text-xs uppercase tracking-widest ${filter === cat ? 'text-white' : 'text-slate-400'
                  }`}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {isLoading ? (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" color="#008080" />
          </View>
        ) : conversations.length === 0 ? (
          <View className="items-center justify-center py-16 px-6">
            <View className="h-24 w-24 rounded-full bg-slate-100 items-center justify-center mb-6">
              <Icon name="chat-bubble" className="text-slate-300 text-5xl" />
            </View>
            <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-xl text-slate-900 mb-2">
              No Messages Yet
            </Text>
            <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-sm text-slate-400 text-center">
              {role === 'organizer'
                ? 'Start a conversation with workers who apply to your events'
                : 'Apply to gigs to start messaging with organizers'}
            </Text>
          </View>
        ) : (
          <View className="divide-y divide-slate-50">
            {conversations.map(chat => (
              <Pressable
                key={chat.id}
                onPress={() => router.push(`/chat/${chat.id}`)}
                className="flex-row items-center gap-5 px-6 py-5"
              >
                <View className="h-16 w-16">
                  {chat.participants.length === 1 ? (
                    <View className="h-full w-full rounded-2xl bg-gray-200 overflow-hidden">
                      {chat.participants[0]?.avatar_url ? (
                        <Image source={{ uri: chat.participants[0].avatar_url }} className="w-full h-full" resizeMode="cover" />
                      ) : (
                        <View className="w-full h-full items-center justify-center bg-primary/10">
                          <Icon name="person" className="text-primary text-2xl" />
                        </View>
                      )}
                    </View>
                  ) : (
                    <View className="h-full w-full rounded-2xl bg-primary/10 items-center justify-center">
                      <Icon name="group" className="text-primary text-2xl" />
                    </View>
                  )}
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-lg text-slate-900" numberOfLines={1}>
                      {chat.title || chat.participants.map(p => p.name).join(', ') || 'Conversation'}
                    </Text>
                    <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[10px] uppercase tracking-widest text-slate-300">
                      {formatTime(chat.last_message_at)}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-sm text-slate-400" numberOfLines={1}>
                    {chat.last_message || 'No messages yet'}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <Pressable
        className="absolute right-6 h-16 w-16 items-center justify-center rounded-3xl bg-primary"
        style={{ bottom: insets.bottom + 88 }}
      >
        <Icon name="add" className="text-white text-3xl font-bold" />
      </Pressable>
    </KeyboardAvoidingView>
  );
};

export default MessagesScreen;
