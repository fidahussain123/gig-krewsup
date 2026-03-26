
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../lib/api';
import Icon from '../components/Icon';
import { FadeInView } from '../components/AnimatedComponents';
import { GlassCard } from '../components/DistrictUI';

const GigDetailsScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [gig, setGig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    loadGig(id);
  }, [id]);

  const loadGig = async (gigId: string) => {
    setIsLoading(true);
    const result = await api.getGig(gigId);
    if (result.data?.gig) {
      setGig(result.data.gig);
    } else {
      setError(result.error || 'Failed to load gig');
    }
    setIsLoading(false);
  };

  const handleApply = async () => {
    if (!id) return;
    setIsApplying(true);
    const result = await api.applyToGig(id);
    if (!result.data) {
      setError(result.error || 'Failed to apply');
    }
    setIsApplying(false);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Date TBD';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <View className="flex-1 bg-surface-secondary">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 128 + insets.bottom }} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#E94560" />
          </View>
        ) : gig ? (
          <>
            {/* Hero Image */}
            <View className="relative h-72">
              {gig.image_url ? (
                <Image source={{ uri: gig.image_url }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <View className="w-full h-full items-center justify-center bg-primary-light">
                  <Icon name="event" className="text-white/20 text-6xl" />
                </View>
              )}
              <LinearGradient
                colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.7)']}
                className="absolute top-0 left-0 right-0 bottom-0"
              />
              {/* Nav Buttons */}
              <View className="absolute flex-row items-center justify-between w-full px-4" style={{ top: insets.top + 8 }}>
                <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-black/30">
                  <Icon name="arrow_back_ios_new" className="text-white text-base" />
                </Pressable>
                <View className="flex-row gap-2">
                  <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-black/30">
                    <Icon name="share" className="text-white text-base" />
                  </Pressable>
                  <Pressable className="h-10 w-10 items-center justify-center rounded-full bg-black/30">
                    <Icon name="bookmark-outline" className="text-white text-base" />
                  </Pressable>
                </View>
              </View>
              {/* Overlay Content */}
              <View className="absolute bottom-5 left-5 right-5">
                <View className="bg-accent px-3 py-1.5 rounded-full self-start mb-2">
                  <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-white text-[10px] uppercase tracking-wider">Open</Text>
                </View>
                <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-white text-2xl">{gig.title}</Text>
              </View>
            </View>

            {/* Organizer */}
            <FadeInView delay={100} duration={400}>
              <View className="mx-5 -mt-5">
                <GlassCard>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-3">
                      <View className="h-12 w-12 rounded-2xl overflow-hidden bg-accent-50 items-center justify-center">
                        {gig.organizer_avatar ? (
                          <Image source={{ uri: gig.organizer_avatar }} className="w-full h-full" resizeMode="cover" />
                        ) : (
                          <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-accent text-lg">
                            {(gig.company_name || gig.organizer_name || 'O')[0]}
                          </Text>
                        )}
                      </View>
                      <View>
                        <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900">
                          {gig.company_name || gig.organizer_name || 'Organizer'}
                        </Text>
                        <View className="flex-row items-center gap-1">
                          <Icon name="verified" className="text-accent text-xs" />
                          <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-xs text-slate-400">Verified</Text>
                        </View>
                      </View>
                    </View>
                    <Pressable className="px-4 py-2 bg-accent-50 rounded-full">
                      <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-accent text-xs">Profile</Text>
                    </Pressable>
                  </View>
                </GlassCard>
              </View>
            </FadeInView>

            {/* Quick Stats */}
            <FadeInView delay={200} duration={400}>
              <View className="px-5 flex-row gap-3 mt-4">
                {[
                  { label: 'Pay', value: `₹${gig.pay_rate}/${gig.pay_type === 'fixed' ? 'gig' : 'hr'}`, icon: 'payments' },
                  { label: 'Date', value: formatDate(gig.event_date), icon: 'calendar-today' },
                  { label: 'Type', value: gig.title, icon: 'category' }
                ].map((item, idx) => (
                  <View key={idx} className="flex-1 bg-white p-4 rounded-2xl items-center"
                    style={{
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.04,
                      shadowRadius: 8,
                      elevation: 2,
                    }}
                  >
                    <View className="h-10 w-10 rounded-xl bg-accent-50 items-center justify-center mb-2">
                      <Icon name={item.icon} className="text-accent text-lg" />
                    </View>
                    <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-[10px] uppercase text-slate-400 tracking-wider mb-1">{item.label}</Text>
                    <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-sm text-primary-900 text-center" numberOfLines={1}>{item.value}</Text>
                  </View>
                ))}
              </View>
            </FadeInView>

            {gig.description && (
              <FadeInView delay={300} duration={400}>
                <View className="mx-5 mt-4">
                  <GlassCard>
                    <View className="flex-row items-center gap-2 mb-3">
                      <Icon name="description" className="text-accent text-lg" />
                      <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900 text-base">Description</Text>
                    </View>
                    <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-500 leading-relaxed">{gig.description}</Text>
                  </GlassCard>
                </View>
              </FadeInView>
            )}

            {gig.requirements && (
              <FadeInView delay={350} duration={400}>
                <View className="mx-5 mt-3">
                  <GlassCard>
                    <View className="flex-row items-center gap-2 mb-3">
                      <Icon name="fact-check" className="text-accent text-lg" />
                      <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900 text-base">Requirements</Text>
                    </View>
                    <View className="gap-3">
                      {gig.requirements.split(',').map((req: string, idx: number) => (
                        <View key={idx} className="flex-row items-start gap-3">
                          <View className="h-6 w-6 rounded-full bg-success/10 items-center justify-center mt-0.5">
                            <Icon name="check" className="text-success text-sm" />
                          </View>
                          <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-600 flex-1">{req.trim()}</Text>
                        </View>
                      ))}
                    </View>
                  </GlassCard>
                </View>
              </FadeInView>
            )}

            <FadeInView delay={400} duration={400}>
              <View className="mx-5 mt-3 mb-6">
                <GlassCard>
                  <View className="flex-row items-center gap-2 mb-3">
                    <Icon name="location-on" className="text-accent text-lg" />
                    <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900 text-base">Location</Text>
                  </View>
                  <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-primary-900">{gig.venue || gig.location || 'Location TBD'}</Text>
                  {gig.location && gig.venue && (
                    <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-sm text-slate-400 mt-1">{gig.location}</Text>
                  )}
                </GlassCard>
              </View>
            </FadeInView>
          </>
        ) : (
          <View className="p-6 items-center pt-20">
            <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-400">{error || 'Gig not found'}</Text>
          </View>
        )}
      </ScrollView>

      {gig && (
        <View
          className="absolute bottom-0 left-0 right-0 bg-white px-5 py-4 flex-row items-center gap-5"
          style={{
            paddingBottom: insets.bottom + 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 8,
          }}
        >
          <View>
            <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Pay Rate</Text>
            <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-xl text-primary-900">
              ₹{gig.pay_rate}/{gig.pay_type === 'fixed' ? 'gig' : 'hr'}
            </Text>
          </View>
          <Pressable
            onPress={handleApply}
            disabled={isApplying}
            className="flex-1 bg-accent items-center justify-center py-4 rounded-2xl"
            style={{
              shadowColor: '#E94560',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <View className="flex-row items-center gap-2">
              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-white text-base">
                {isApplying ? 'Applying...' : 'Apply Now'}
              </Text>
              {!isApplying && <Icon name="arrow_forward" className="text-white text-xl" />}
            </View>
          </Pressable>
        </View>
      )}
    </View>
  );
};

export default GigDetailsScreen;
