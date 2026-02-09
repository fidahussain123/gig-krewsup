import React, { useState, useEffect, useRef } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import api from '../lib/api';
import socketClient from '../lib/socket';
import { useAuth } from '../contexts/AuthContext';
import Icon from '../components/Icon';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  createdAt: string;
  messageType?: 'text' | 'system';
}

interface Participant {
  user_id: string;
  name: string;
  avatar_url?: string;
}

const EventGroupChatScreen: React.FC = () => {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const router = useRouter();
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [conversationTitle, setConversationTitle] = useState('Team Chat');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    // Connect socket if not connected
    if (token && !socketClient.isConnected()) {
      socketClient.connect(token);
    }

    // Join conversation room
    socketClient.joinConversation(conversationId);

    // Load messages and participants
    loadConversationData();

    // Listen for new messages
    const unsubMessage = socketClient.onMessage((message) => {
      if (message.conversationId === conversationId) {
        setMessages(prev => [...prev, {
          id: message.id,
          senderId: message.senderId,
          senderName: message.senderName,
          senderAvatar: message.senderAvatar,
          content: message.content,
          createdAt: message.createdAt,
          messageType: 'text'
        }]);
      }
    });

    // Listen for member joined
    const unsubMember = socketClient.onMemberJoined((data) => {
      setParticipants(prev => [...prev, { user_id: data.userId, name: data.name }]);
    });

    // Listen for typing
    const unsubTyping = socketClient.onTyping((data) => {
      setTypingUsers(prev => {
        const next = new Set(prev);
        if (data.isTyping) {
          next.add(data.userId);
        } else {
          next.delete(data.userId);
        }
        return next;
      });
    });

    return () => {
      socketClient.leaveConversation(conversationId);
      unsubMessage();
      unsubMember();
      unsubTyping();
    };
  }, [conversationId, token]);

  const loadConversationData = async () => {
    if (!conversationId) return;
    setIsLoading(true);

    try {
      // Load messages
      const msgResult = await api.getMessages(conversationId);
      if (msgResult.data?.messages) {
        setMessages(msgResult.data.messages.map((m: any) => ({
          id: m.id,
          senderId: m.sender_id,
          senderName: m.sender_name || 'Unknown',
          senderAvatar: m.sender_avatar,
          content: m.content,
          createdAt: m.created_at,
          messageType: m.message_type
        })));
      }

      // Load conversation info (participants)
      const convResult = await api.getConversation(conversationId);
      if (convResult.data?.conversation) {
        setConversationTitle(convResult.data.conversation.title || 'Team Chat');
        if (convResult.data.participants) {
          setParticipants(convResult.data.participants);
        }
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    }

    setIsLoading(false);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !conversationId) return;

    socketClient.sendMessage(conversationId, newMessage.trim());
    setNewMessage('');

    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socketClient.setTyping(conversationId, false);
  };

  const handleInputChange = (value: string) => {
    setNewMessage(value);

    if (!conversationId) return;

    // Send typing indicator
    socketClient.setTyping(conversationId, true);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      socketClient.setTyping(conversationId, false);
    }, 2000);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  messages.forEach((msg) => {
    const date = formatDate(msg.createdAt);
    const lastGroup = groupedMessages[groupedMessages.length - 1];
    if (lastGroup && lastGroup.date === date) {
      lastGroup.messages.push(msg);
    } else {
      groupedMessages.push({ date, messages: [msg] });
    }
  });

  return (
    <View className="flex-1 bg-slate-50">
      <View className="bg-white border-b border-slate-100 px-4 py-3 flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} className="h-10 w-10 rounded-full bg-slate-100 items-center justify-center">
          <Icon name="arrow_back_ios_new" className="text-slate-600" />
        </Pressable>
        <View className="flex-1">
          <Text className="font-bold text-slate-900 text-base">{conversationTitle}</Text>
          <Text className="text-xs text-slate-400">{participants.length} members</Text>
        </View>
        <Pressable className="h-10 w-10 rounded-full bg-slate-100 items-center justify-center">
          <Icon name="group" className="text-slate-600" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-4 py-4" contentContainerStyle={{ paddingBottom: 120 }}>
        {isLoading ? (
          <View className="items-center justify-center h-32">
            <ActivityIndicator size="large" color="#008080" />
          </View>
        ) : messages.length === 0 ? (
          <View className="items-center py-12">
            <View className="h-16 w-16 rounded-full bg-slate-100 items-center justify-center mb-4">
              <Icon name="chat-bubble" className="text-slate-300 text-3xl" />
            </View>
            <Text className="font-bold text-slate-700 mb-1">No messages yet</Text>
            <Text className="text-sm text-slate-400">Start the conversation!</Text>
          </View>
        ) : (
          <>
            {groupedMessages.map((group, idx) => (
              <View key={idx}>
                <View className="items-center my-4">
                  <Text className="px-3 py-1 rounded-full bg-slate-100 text-xs font-medium text-slate-500">
                    {group.date}
                  </Text>
                </View>

                {group.messages.map((msg) => {
                  const isOwn = msg.senderId === user?.id;
                  const isSystem = msg.messageType === 'system';

                  if (isSystem) {
                    return (
                      <View key={msg.id} className="items-center my-2">
                        <Text className="px-4 py-1.5 rounded-full bg-slate-100 text-xs text-slate-500">
                          {msg.content}
                        </Text>
                      </View>
                    );
                  }

                  return (
                    <View key={msg.id} className={`flex-row mb-3 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      {!isOwn && (
                        <View className="h-8 w-8 rounded-full bg-primary/10 items-center justify-center mr-2">
                          {msg.senderAvatar ? (
                            <Image source={{ uri: msg.senderAvatar }} className="w-full h-full rounded-full" resizeMode="cover" />
                          ) : (
                            <Text className="text-xs font-bold text-primary">{msg.senderName?.[0] || '?'}</Text>
                          )}
                        </View>
                      )}
                      <View className={`max-w-[75%] ${isOwn ? 'items-end' : ''}`}>
                        {!isOwn && (
                          <Text className="text-xs font-medium text-slate-500 mb-1">{msg.senderName}</Text>
                        )}
                        <View className={`px-4 py-2.5 rounded-2xl ${isOwn ? 'bg-primary' : 'bg-white border border-slate-100'}`}>
                          <Text className={`text-sm ${isOwn ? 'text-white' : 'text-slate-800'}`}>{msg.content}</Text>
                        </View>
                        <Text className={`text-[10px] text-slate-400 mt-1 ${isOwn ? 'text-right' : ''}`}>
                          {formatTime(msg.createdAt)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}

            {typingUsers.size > 0 && (
              <View className="flex-row items-center gap-2 text-xs text-slate-400 ml-10">
                <Text>Someone is typing...</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <View className="bg-white border-t border-slate-100 p-4">
        <View className="flex-row items-center gap-3">
          <TextInput
            value={newMessage}
            onChangeText={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 h-12 px-4 rounded-xl bg-slate-100 text-sm"
          />
          <Pressable
            onPress={handleSendMessage}
            disabled={!newMessage.trim()}
            className="h-12 w-12 rounded-xl bg-primary items-center justify-center"
          >
            <Icon name="send" className="text-white" />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default EventGroupChatScreen;
