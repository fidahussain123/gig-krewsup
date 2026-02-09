
import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Icon from '../components/Icon';

const ChatScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const messages = [
    { sender: 'Sarah (Organizer)', text: 'Does everyone have their badges? We\'re starting in 15 mins.', type: 'received', img: 'https://picsum.photos/id/64/50/50' },
    { sender: 'Me', text: 'Yes, I\'m at the main entrance with Marcus. All set!', type: 'sent', img: 'https://picsum.photos/id/65/50/50' },
    { sender: 'Marcus', text: 'Confirmed. Scanning the first group now.', type: 'received', img: 'https://picsum.photos/id/91/50/50' }
  ];

  return (
    <View className="flex-1 bg-white">
      <View className="bg-white px-6 py-4 flex-row items-center justify-between border-b border-slate-100">
        <View className="flex-row items-center gap-4">
          <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center">
            <Icon name="arrow_back_ios_new" className="text-2xl text-slate-900" />
          </Pressable>
          <View>
            <Text className="text-lg font-extrabold text-slate-900">Tech Expo 2024</Text>
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Organizer + 5 Workers</Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.push(`/call/${id}`)}
          className="h-12 w-12 items-center justify-center rounded-full bg-primary/5"
        >
          <Icon name="call" className="text-2xl text-primary" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 p-6" contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="w-full">
          <View className="flex-row items-center justify-between gap-4 rounded-3xl bg-primary/5 p-5 border border-primary/10">
            <View className="flex-row items-center gap-4">
              <View className="h-12 w-12 rounded-2xl bg-primary items-center justify-center">
                <Icon name="group-work" className="text-white text-2xl" />
              </View>
              <View>
                <Text className="text-sm font-extrabold text-slate-900">Start Group Call</Text>
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Connect with the team</Text>
              </View>
            </View>
            <Pressable onPress={() => router.push(`/call/${id}`)} className="px-6 py-2.5 bg-primary rounded-xl">
              <Text className="text-white text-xs font-bold uppercase tracking-widest">Join</Text>
            </Pressable>
          </View>
        </View>

        <View className="items-center my-6">
          <Text className="text-[10px] font-extrabold uppercase tracking-widest text-slate-300 bg-slate-50 px-4 py-1.5 rounded-full">
            Today
          </Text>
        </View>

        <View className="space-y-6">
          {messages.map((msg, idx) => (
            <View key={idx} className={`flex-row items-end gap-3 ${msg.type === 'sent' ? 'justify-end' : ''}`}>
              {msg.type === 'received' && (
                <View className="h-10 w-10 rounded-2xl bg-gray-100 overflow-hidden">
                  <Image source={{ uri: msg.img }} className="w-full h-full" resizeMode="cover" />
                </View>
              )}
              <View className={`flex-col gap-1.5 max-w-[80%] ${msg.type === 'sent' ? 'items-end' : ''}`}>
                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{msg.sender}</Text>
                <View className={`px-5 py-3.5 rounded-3xl ${msg.type === 'sent' ? 'bg-primary' : 'bg-slate-50'}`}>
                  <Text className={`${msg.type === 'sent' ? 'text-white' : 'text-slate-700'} text-sm font-semibold`}>
                    {msg.text}
                  </Text>
                </View>
              </View>
              {msg.type === 'sent' && (
                <View className="h-10 w-10 rounded-2xl bg-gray-100 overflow-hidden">
                  <Image source={{ uri: msg.img }} className="w-full h-full" resizeMode="cover" />
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      <View className="p-6 bg-white border-t border-slate-50">
        <View className="flex-row items-center gap-4">
          <View className="flex-row items-center gap-2">
            <Pressable className="h-12 w-12 items-center justify-center">
              <Icon name="add-circle" className="text-slate-400 text-3xl" />
            </Pressable>
            <Pressable className="h-12 w-12 items-center justify-center">
              <Icon name="photo-camera" className="text-slate-400 text-3xl" />
            </Pressable>
          </View>
          <View className="flex-1">
            <TextInput
              placeholder="Type a message..."
              className="w-full bg-slate-50 rounded-2xl px-6 py-4 text-sm font-semibold text-slate-900"
            />
          </View>
          <Pressable className="h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <Icon name="send" className="text-white text-2xl font-bold" />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default ChatScreen;
