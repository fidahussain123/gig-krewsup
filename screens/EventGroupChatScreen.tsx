import React, { useState, useEffect, useRef } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const params = useLocalSearchParams<{ conversationId?: string; id?: string }>();
  const conversationId = (params.conversationId || params.id) as string | undefined;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, token, role } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [conversationTitle, setConversationTitle] = useState('Team Chat');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<ScrollView>(null);

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

    // Listen for new messages (replace optimistic or append)
    const unsubMessage = socketClient.onMessage((message) => {
      if (message.conversationId !== conversationId) return;
      const newMsg = {
        id: message.id,
        senderId: message.senderId,
        senderName: message.senderName,
        senderAvatar: message.senderAvatar,
        content: message.content,
        createdAt: message.createdAt,
        messageType: (message.messageType as Message['messageType']) || 'text',
      };
      setMessages((prev) => {
        const isOwnEcho = message.senderId === user?.id;
        if (isOwnEcho && prev.length > 0 && prev[prev.length - 1].id.startsWith('temp-')) {
          return [...prev.slice(0, -1), newMsg];
        }
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, newMsg];
      });
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
          senderId: m.sender_id ?? '',
          senderName: m.sender_name || 'System',
          senderAvatar: m.sender_avatar,
          content: m.content,
          createdAt: m.created_at,
          messageType: (m.message_type as Message['messageType']) || 'text',
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
    const text = newMessage.trim();
    if (!text || !conversationId || !user?.id) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      senderId: user.id,
      senderName: user.name || 'You',
      senderAvatar: undefined,
      content: text,
      createdAt: new Date().toISOString(),
      messageType: 'text',
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage('');

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socketClient.setTyping(conversationId, false);

    if (!socketClient.isConnected() && token) {
      socketClient.connect(token);
    }
    socketClient.sendMessage(conversationId, text);
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

  const createCallId = () => `${conversationId || 'call'}-${Date.now()}`;

  const handleStartDirectCall = (participantId: string) => {
    if (!conversationId || !participantId) return;
    const callId = createCallId();
    socketClient.sendCallInvite(participantId, callId, conversationId, 'direct');
    setIsCallModalOpen(false);
    router.push(`/call/${callId}?conversationId=${conversationId}`);
  };

  const handleStartGroupCall = () => {
    if (!conversationId) return;
    const callId = createCallId();
    participants
      .filter(p => p.user_id !== user?.id)
      .forEach(p => socketClient.sendCallInvite(p.user_id, callId, conversationId, 'group'));
    setIsCallModalOpen(false);
    router.push(`/call/${callId}?conversationId=${conversationId}`);
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

  useEffect(() => {
    if (messages.length > 0) {
      const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      return () => clearTimeout(t);
    }
  }, [messages.length]);

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
    <KeyboardAvoidingView
      className="flex-1 bg-surface-secondary"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View
        className="bg-white px-4 pb-3 flex-row items-center gap-3"
        style={{
          paddingTop: insets.top + 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <Pressable onPress={() => router.back()} className="h-10 w-10 rounded-full bg-surface-tertiary items-center justify-center">
          <Icon name="arrow_back_ios_new" className="text-primary-900" size={18} />
        </Pressable>
        <View className="flex-1">
          <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900 text-base">{conversationTitle}</Text>
          <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-xs text-slate-400">{participants.length} members</Text>
        </View>
        <Pressable
          onPress={() => setIsCallModalOpen(true)}
          className="h-10 w-10 rounded-full bg-accent-50 items-center justify-center"
        >
          <Icon name="call" className="text-accent" size={18} />
        </Pressable>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        className="flex-1 px-4 py-3"
        contentContainerStyle={{ paddingTop: 6, paddingBottom: 20 + insets.bottom }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        {isLoading ? (
          <View className="items-center justify-center h-32">
            <ActivityIndicator size="large" color="#E94560" />
          </View>
        ) : messages.length === 0 ? (
          <View className="items-center py-16">
            <View className="h-20 w-20 rounded-3xl bg-accent-50 items-center justify-center mb-4">
              <Icon name="chat-bubble" className="text-accent text-3xl" />
            </View>
            <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900 mb-1">No messages yet</Text>
            <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-sm text-slate-400">Start the conversation!</Text>
          </View>
        ) : (
          <>
            {groupedMessages.map((group, idx) => (
              <View key={idx}>
                <View className="items-center my-4">
                  <View className="px-4 py-1.5 rounded-full bg-surface-tertiary">
                    <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-xs text-slate-400">
                      {group.date}
                    </Text>
                  </View>
                </View>

                {group.messages.map((msg) => {
                  const isOwn = msg.senderId === user?.id;
                  const isSystem = msg.messageType === 'system';

                  if (isSystem) {
                    return (
                      <View key={msg.id} className="items-center my-2">
                        <View className="px-4 py-1.5 rounded-full bg-surface-tertiary">
                          <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-xs text-slate-400">
                            {msg.content}
                          </Text>
                        </View>
                      </View>
                    );
                  }

                  return (
                    <View key={msg.id} className={`flex-row mb-3 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      {!isOwn && (
                        <View className="h-8 w-8 rounded-full bg-accent-50 items-center justify-center mr-2">
                          {msg.senderAvatar ? (
                            <Image source={{ uri: msg.senderAvatar }} className="w-full h-full rounded-full" resizeMode="cover" />
                          ) : (
                            <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-xs text-accent">{msg.senderName?.[0] || '?'}</Text>
                          )}
                        </View>
                      )}
                      <View className={`max-w-[75%] ${isOwn ? 'items-end' : ''}`}>
                        {!isOwn && (
                          <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-[10px] text-slate-400 mb-1">{msg.senderName}</Text>
                        )}
                        <View
                          className={`px-4 py-2.5 ${isOwn ? 'bg-accent rounded-2xl rounded-br-md' : 'bg-white rounded-2xl rounded-bl-md'}`}
                          style={!isOwn ? {
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.04,
                            shadowRadius: 4,
                            elevation: 1,
                          } : undefined}
                        >
                          <Text style={{ fontFamily: 'Inter_500Medium' }} className={`text-sm ${isOwn ? 'text-white' : 'text-primary-900'}`}>{msg.content}</Text>
                        </View>
                        <Text style={{ fontFamily: 'Inter_500Medium' }} className={`text-[10px] text-slate-300 mt-1 ${isOwn ? 'text-right' : ''}`}>
                          {formatTime(msg.createdAt)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}

            {typingUsers.size > 0 && (
              <View className="flex-row items-center gap-2 ml-10 mt-1">
                <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-xs text-slate-400">Someone is typing...</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Input Bar */}
      <View
        className="bg-white px-4 py-3"
        style={{
          paddingBottom: insets.bottom + 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <View className="flex-row items-center gap-3">
          <View className="flex-1 h-12 rounded-2xl bg-surface-tertiary px-4 flex-row items-center">
            <TextInput
              value={newMessage}
              onChangeText={handleInputChange}
              placeholder="Type a message..."
              placeholderTextColor="#B8B8D0"
              style={{ fontFamily: 'Inter_500Medium' }}
              className="flex-1 text-sm text-primary-900"
            />
          </View>
          <Pressable
            onPress={handleSendMessage}
            disabled={!newMessage.trim()}
            className={`h-12 w-12 rounded-2xl items-center justify-center ${newMessage.trim() ? 'bg-accent' : 'bg-surface-tertiary'}`}
            style={newMessage.trim() ? {
              shadowColor: '#E94560',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            } : undefined}
          >
            <Icon name="send" className={newMessage.trim() ? 'text-white' : 'text-slate-300'} size={20} />
          </Pressable>
        </View>
      </View>

      {/* Call Modal */}
      <Modal visible={isCallModalOpen} transparent animationType="fade" onRequestClose={() => setIsCallModalOpen(false)}>
        <View className="flex-1 items-center justify-end bg-black/50">
          <View
            className="w-full rounded-t-4xl bg-white p-6"
            style={{
              paddingBottom: insets.bottom + 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 16,
              elevation: 10,
            }}
          >
            <View className="w-10 h-1 rounded-full bg-slate-200 self-center mb-5" />
            <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-lg text-primary-900">Start Voice Call</Text>
            <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-xs text-slate-400 mt-1 mb-4">Choose a member to call</Text>
            <ScrollView className="max-h-60">
              {participants
                .filter(p => p.user_id !== user?.id)
                .map((p) => (
                  <Pressable
                    key={p.user_id}
                    onPress={() => handleStartDirectCall(p.user_id)}
                    className="flex-row items-center gap-3 py-3 border-b border-surface-tertiary"
                  >
                    <View className="h-10 w-10 rounded-full bg-accent-50 items-center justify-center overflow-hidden">
                      {p.avatar_url ? (
                        <Image source={{ uri: p.avatar_url }} className="w-full h-full" resizeMode="cover" />
                      ) : (
                        <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-xs text-accent">{p.name?.[0] || '?'}</Text>
                      )}
                    </View>
                    <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-sm text-primary-900 flex-1">{p.name || 'Member'}</Text>
                    <View className="h-8 w-8 rounded-full bg-success/10 items-center justify-center">
                      <Icon name="call" className="text-success" size={14} />
                    </View>
                  </Pressable>
                ))}
            </ScrollView>
            {role === 'organizer' && participants.length > 1 && (
              <Pressable
                onPress={handleStartGroupCall}
                className="mt-4 h-12 rounded-2xl bg-accent items-center justify-center flex-row gap-2"
                style={{
                  shadowColor: '#E94560',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Icon name="group" className="text-white" size={18} />
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-white text-sm">Start Group Call</Text>
              </Pressable>
            )}
            <Pressable onPress={() => setIsCallModalOpen(false)} className="mt-3 h-12 rounded-2xl bg-surface-tertiary items-center justify-center">
              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-slate-500 text-sm">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default EventGroupChatScreen;
