
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import Icon from '../components/Icon';
import { FadeInView, ScalePress } from '../components/AnimatedComponents';

const RoleSelectionScreen: React.FC = () => {
  const router = useRouter();
  const { setRole } = useAuth();
  const insets = useSafeAreaInsets();
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
    <View className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 16,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <FadeInView delay={0} duration={600}>
          <View className="px-6 pt-12 pb-8">
            <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-primary-900 text-3xl tracking-tight">
              Who are you?
            </Text>
            <Text style={{ fontFamily: 'Inter_500Medium' }} className="mt-2 text-slate-400 text-base">
              Choose your role to get started with KrewsUp.
            </Text>
          </View>
        </FadeInView>

        {error && (
          <View className="mx-6 mb-4 p-4 bg-error/10 rounded-2xl">
            <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-error text-sm">{error}</Text>
          </View>
        )}

        <View className="flex-1 flex-col gap-5 px-6">
          <FadeInView delay={200} duration={500}>
            <ScalePress
              onPress={() => handleSelect('organizer')}
              disabled={isLoading}
              className="relative w-full flex-col items-start overflow-hidden rounded-3xl bg-surface-secondary p-6"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.06,
                shadowRadius: 16,
                elevation: 3,
              }}
            >
              <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-accent-50">
                <Icon name="corporate-fare" className="text-accent text-3xl" />
              </View>
              <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-xl text-primary-900">I want to hire</Text>
              <Text style={{ fontFamily: 'Inter_500Medium' }} className="mt-2 text-slate-400 leading-relaxed text-sm">
                Event Organizer looking for professional talent to staff upcoming gigs and events.
              </Text>
              <View className="mt-5 flex-row items-center px-4 py-2.5 rounded-full bg-accent">
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-white text-sm">Get Started</Text>
                <Icon name="arrow_forward" className="text-white text-lg ml-2" />
              </View>
            </ScalePress>
          </FadeInView>

          <FadeInView delay={350} duration={500}>
            <ScalePress
              onPress={() => handleSelect('worker')}
              disabled={isLoading}
              className="relative w-full flex-col items-start overflow-hidden rounded-3xl bg-surface-secondary p-6"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.06,
                shadowRadius: 16,
                elevation: 3,
              }}
            >
              <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
                <Icon name="emoji-people" className="text-brand text-3xl" />
              </View>
              <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-xl text-primary-900">I want to work</Text>
              <Text style={{ fontFamily: 'Inter_500Medium' }} className="mt-2 text-slate-400 leading-relaxed text-sm">
                Gig Worker looking for event opportunities, flexible schedules, and great pay.
              </Text>
              <View className="mt-5 flex-row items-center px-4 py-2.5 rounded-full bg-brand">
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-white text-sm">Get Started</Text>
                <Icon name="arrow_forward" className="text-white text-lg ml-2" />
              </View>
            </ScalePress>
          </FadeInView>
        </View>

        <FadeInView delay={500} duration={400}>
          <View className="items-center py-8">
            <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-400 text-sm">
              Need help?{' '}
              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-accent">Contact Support</Text>
            </Text>
          </View>
        </FadeInView>
      </ScrollView>
    </View>
  );
};

export default RoleSelectionScreen;
