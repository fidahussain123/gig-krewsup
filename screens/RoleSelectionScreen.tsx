
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import Icon from '../components/Icon';
import { FadeInView, ScalePress } from '../components/AnimatedComponents';

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
      <FadeInView delay={0} duration={600}>
        <View className="px-8 pt-16 pb-8">
          <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-slate-900 text-3xl tracking-tight">
            Who are you?
          </Text>
          <Text style={{ fontFamily: 'Inter_500Medium' }} className="mt-2 text-slate-500 text-base">
            Choose your role to get started with KrewsUp.
          </Text>
        </View>
      </FadeInView>

      {error && (
        <View className="mx-6 mb-4 p-4 bg-red-50 rounded-xl">
          <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-red-600 text-sm">{error}</Text>
        </View>
      )}

      <View className="flex-1 flex-col gap-6 px-6">
        <FadeInView delay={200} duration={500}>
          <ScalePress
            onPress={() => handleSelect('organizer')}
            disabled={isLoading}
            className="relative w-full flex-col items-start overflow-hidden rounded-3xl bg-white p-6 text-left shadow-sm border-2 border-transparent"
          >
            <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Icon name="corporate-fare" className="text-primary text-3xl" />
            </View>
            <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-xl text-slate-900">I want to hire</Text>
            <Text style={{ fontFamily: 'Inter_500Medium' }} className="mt-2 text-slate-500 leading-relaxed text-sm">
              Event Organizer looking for professional talent to staff upcoming gigs and events.
            </Text>
            <View className="mt-6 flex-row items-center">
              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary">Select Organizer Role</Text>
              <Icon name="chevron-right" className="text-primary text-xl ml-1" />
            </View>
            <View className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-primary/5"></View>
          </ScalePress>
        </FadeInView>

        <FadeInView delay={350} duration={500}>
          <ScalePress
            onPress={() => handleSelect('worker')}
            disabled={isLoading}
            className="relative w-full flex-col items-start overflow-hidden rounded-3xl bg-white p-6 text-left shadow-sm border-2 border-transparent"
          >
            <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-accent/20">
              <Icon name="emoji-people" className="text-yellow-700 text-3xl" />
            </View>
            <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-xl text-slate-900">I want to work</Text>
            <Text style={{ fontFamily: 'Inter_500Medium' }} className="mt-2 text-slate-500 leading-relaxed text-sm">
              Gig Worker looking for event opportunities, flexible schedules, and great pay.
            </Text>
            <View className="mt-6 flex-row items-center">
              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-yellow-700">Select Worker Role</Text>
              <Icon name="chevron-right" className="text-yellow-700 text-xl ml-1" />
            </View>
            <View className="absolute top-0 right-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-accent/10"></View>
          </ScalePress>
        </FadeInView>
      </View>

      <FadeInView delay={500} duration={400}>
        <View className="items-center py-8">
          <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-slate-400 text-sm uppercase tracking-widest">
            Need help deciding?
          </Text>
          <Pressable className="mt-2">
            <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-primary underline">Contact Support</Text>
          </Pressable>
        </View>
      </FadeInView>
    </View>
  );
};

export default RoleSelectionScreen;
