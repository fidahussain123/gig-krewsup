
import React from 'react';
import { useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import Icon from '../components/Icon';

const VideoCallScreen: React.FC = () => {
  const router = useRouter();

  return (
    <View className="flex-1 bg-slate-900">
      <Image source={{ uri: 'https://picsum.photos/id/452/1000/1500?blur=10' }} className="absolute inset-0 w-full h-full opacity-40" />

      <View className="flex-row items-center justify-between p-6 pt-10">
        <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
          <Icon name="expand-more" className="text-white text-2xl" />
        </Pressable>
        <View className="items-center">
          <Text className="text-white text-base font-extrabold">Main Stage Setup Crew</Text>
          <View className="flex-row items-center gap-2 mt-1">
            <View className="h-2 w-2 rounded-full bg-red-500" />
            <Text className="text-white/60 text-[10px] font-bold uppercase tracking-widest">12:45</Text>
          </View>
        </View>
        <Pressable className="h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
          <Icon name="person-add" className="text-white text-2xl" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-4 py-4" contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="flex-row flex-wrap gap-4">
          {['64', '65', '91', '10'].map((id, idx) => (
            <View key={id} className="w-[48%] aspect-[3/4] rounded-3xl overflow-hidden border border-white/10">
              <Image source={{ uri: `https://picsum.photos/id/${id}/400/600` }} className="w-full h-full" resizeMode="cover" />
              <View className="absolute bottom-4 left-4">
                <Text className="text-[10px] font-extrabold text-white uppercase tracking-widest">
                  {idx === 0 ? 'Alex (Lead)' : idx === 1 ? 'Jordan' : idx === 2 ? 'Casey' : 'Taylor'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View className="pb-12 pt-6 px-8">
        <View className="flex-row items-center justify-between">
          {[
            { label: 'Mute', icon: 'mic' },
            { label: 'Video', icon: 'videocam' },
            { label: 'Flip', icon: 'flip-camera-ios' }
          ].map((ctrl, idx) => (
            <Pressable key={idx} className="items-center gap-2">
              <View className="h-16 w-16 rounded-full bg-white/10 items-center justify-center border border-white/10">
                <Icon name={ctrl.icon} className="text-white text-2xl" />
              </View>
              <Text className="text-[9px] font-extrabold text-white/40 uppercase tracking-widest">{ctrl.label}</Text>
            </Pressable>
          ))}
          <Pressable onPress={() => router.back()} className="items-center gap-2">
            <View className="h-16 w-16 rounded-[2rem] bg-red-500 items-center justify-center">
              <Icon name="call-end" className="text-white text-3xl" />
            </View>
            <Text className="text-[9px] font-extrabold text-red-400 uppercase tracking-widest">End Call</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default VideoCallScreen;
