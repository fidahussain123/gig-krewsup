
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import Icon from '../components/Icon';

const RoleSelectionScreen: React.FC = () => {
  const router = useRouter();
  const { setRole } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSelect = async (role: 'organizer' | 'worker') => {
    setIsLoading(true);
    setError('');
    
    const result = await setRole(role);
    
    if (result.success) {
      router.replace(`/${role}/onboarding`);
    } else {
      setError(result.error || 'Failed to set role');
    }
    
    setIsLoading(false);
  };

  return (
    <View className="flex-1 bg-slate-50">
      <View className="px-8 pt-16 pb-8">
        <Text className="text-slate-900 text-3xl font-extrabold tracking-tight">
          Who are you?
        </Text>
        <Text className="mt-2 text-slate-500 text-base font-medium">
          Choose your role to get started with KrewsUp.
        </Text>
      </View>

      {error && (
        <View className="mx-6 mb-4 p-4 bg-red-50 rounded-xl">
          <Text className="text-red-600 text-sm font-medium">{error}</Text>
        </View>
      )}

      <View className="flex-1 flex-col gap-6 px-6">
        <Pressable
          onPress={() => handleSelect('organizer')}
          disabled={isLoading}
          className="relative w-full flex-col items-start overflow-hidden rounded-3xl bg-white p-6 text-left shadow-sm border-2 border-transparent"
        >
          <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Icon name="corporate-fare" className="text-primary text-3xl" />
          </View>
          <Text className="text-xl font-extrabold text-slate-900">I want to hire</Text>
          <Text className="mt-2 text-slate-500 font-medium leading-relaxed text-sm">
            Event Organizer looking for professional talent to staff upcoming gigs and events.
          </Text>
          <View className="mt-6 flex-row items-center">
            <Text className="text-primary font-bold">Select Organizer Role</Text>
            <Icon name="chevron_right" className="text-primary text-xl ml-1" />
          </View>
          <View className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-primary/5"></View>
        </Pressable>

        <Pressable
          onPress={() => handleSelect('worker')}
          disabled={isLoading}
          className="relative w-full flex-col items-start overflow-hidden rounded-3xl bg-white p-6 text-left shadow-sm border-2 border-transparent"
        >
          <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-accent/20">
            <Icon name="emoji-people" className="text-yellow-700 text-3xl" />
          </View>
          <Text className="text-xl font-extrabold text-slate-900">I want to work</Text>
          <Text className="mt-2 text-slate-500 font-medium leading-relaxed text-sm">
            Gig Worker looking for event opportunities, flexible schedules, and great pay.
          </Text>
          <View className="mt-6 flex-row items-center">
            <Text className="text-yellow-700 font-bold">Select Worker Role</Text>
            <Icon name="chevron_right" className="text-yellow-700 text-xl ml-1" />
          </View>
          <View className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-accent/10"></View>
        </Pressable>
      </View>

      <View className="items-center py-8">
        <Text className="text-slate-400 text-sm font-bold uppercase tracking-widest">
          Need help deciding?
        </Text>
        <Pressable className="mt-2">
          <Text className="text-primary font-extrabold underline">Contact Support</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default RoleSelectionScreen;
