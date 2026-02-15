
import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../lib/api';
import Icon from '../components/Icon';

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
    <View className="flex-1 bg-white">
      <View className="px-6 pb-4 flex-row items-center justify-between border-b border-slate-100" style={{ paddingTop: insets.top + 20 }}>
        <Pressable onPress={() => router.back()} className="h-12 w-12 items-center justify-center rounded-full">
          <Icon name="arrow_back_ios_new" className="text-slate-700 text-xl" />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-xl text-slate-900">
          Gig Details
        </Text>
        <View className="flex-row gap-2">
          <Pressable className="h-12 w-12 items-center justify-center rounded-full">
            <Icon name="share" className="text-slate-700 text-xl" />
          </Pressable>
          <Pressable className="h-12 w-12 items-center justify-center rounded-full">
            <Icon name="bookmark" className="text-primary text-xl" />
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingTop: 8, paddingBottom: 128 + insets.bottom + 90 }}>
        {isLoading ? (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" color="#008080" />
          </View>
        ) : gig ? (
          <>
            <View className="p-6">
              <View className="relative w-full aspect-[16/9] rounded-3xl overflow-hidden mb-6 shadow-md">
                {gig.image_url ? (
                  <Image source={{ uri: gig.image_url }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <View className="w-full h-full items-center justify-center bg-slate-100">
                    <Icon name="event" className="text-slate-300 text-5xl" />
                  </View>
                )}
                <View className="absolute bottom-6 left-6">
                  <View className="bg-primary px-3 py-1 rounded-lg mb-3">
                    <Text className="text-white text-[10px] font-bold uppercase tracking-widest">Open</Text>
                  </View>
                  <Text className="text-3xl font-extrabold text-white">{gig.title}</Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between py-6 border-b border-slate-50">
                <View className="flex-row items-center gap-4">
                  <View className="h-14 w-14 rounded-full overflow-hidden bg-slate-100">
                    {gig.organizer_avatar ? (
                      <Image source={{ uri: gig.organizer_avatar }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                      <View className="w-full h-full items-center justify-center">
                        <Text className="text-slate-400 font-bold">
                          {(gig.company_name || gig.organizer_name || 'O')[0]}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View>
                    <Text className="font-extrabold text-lg text-slate-900">
                      {gig.company_name || gig.organizer_name || 'Organizer'}
                    </Text>
                    <View className="flex-row items-center gap-1.5">
                      <Icon name="star" className="text-accent text-sm" />
                      <Text className="text-sm text-slate-400 font-bold">Verified Organizer</Text>
                    </View>
                  </View>
                </View>
                <Pressable className="px-4 py-2 bg-primary/5 rounded-xl">
                  <Text className="text-primary font-extrabold text-sm">Profile</Text>
                </Pressable>
              </View>
            </View>

            <View className="px-6 flex-row gap-3 mb-8">
              {[
                { label: 'Pay', value: `₹${gig.pay_rate}/${gig.pay_type === 'fixed' ? 'gig' : 'hr'}`, icon: 'payments' },
                { label: 'Date', value: formatDate(gig.event_date), icon: 'calendar_today' },
                { label: 'Type', value: gig.title, icon: 'category' }
              ].map((item, idx) => (
                <View key={idx} className="flex-1 bg-slate-50 p-4 rounded-3xl items-center">
                  <Icon name={item.icon} className="text-primary mb-2 text-2xl" />
                  <Text className="text-[10px] uppercase text-slate-400 font-bold tracking-widest mb-1">{item.label}</Text>
                  <Text className="text-sm font-extrabold text-slate-900 text-center">{item.value}</Text>
                </View>
              ))}
            </View>

            {gig.description && (
              <View className="px-6 mb-10">
                <View className="flex-row items-center gap-2 mb-4">
                  <Icon name="description" className="text-primary text-xl" />
                  <Text className="text-xl font-extrabold text-slate-900">Description</Text>
                </View>
                <Text className="text-slate-500 font-medium leading-relaxed text-base">{gig.description}</Text>
              </View>
            )}

            {gig.requirements && (
              <View className="px-6 mb-10">
                <View className="flex-row items-center gap-2 mb-4">
                  <Icon name="fact_check" className="text-primary text-xl" />
                  <Text className="text-xl font-extrabold text-slate-900">Requirements</Text>
                </View>
                <View className="space-y-4">
                  {gig.requirements.split(',').map((req: string, idx: number) => (
                    <View key={idx} className="flex-row items-start gap-3">
                      <Icon name="check_circle" className="text-primary text-xl" />
                      <Text className="text-slate-600 font-medium">{req.trim()}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View className="px-6 mb-10">
              <View className="flex-row items-center gap-2 mb-4">
                <Icon name="location_on" className="text-primary text-xl" />
                <Text className="text-xl font-extrabold text-slate-900">Location</Text>
              </View>
              <View className="bg-slate-50 rounded-3xl overflow-hidden border border-slate-100">
                <View className="p-5 bg-white border-b border-slate-50">
                  <Text className="font-extrabold text-slate-900">{gig.venue || gig.location || 'Location TBD'}</Text>
                  {gig.location && gig.venue && (
                    <Text className="text-sm font-bold text-slate-400 mt-1">{gig.location}</Text>
                  )}
                </View>
                <View className="w-full h-48 items-center justify-center bg-slate-200">
                  <Icon name="location_on" className="text-primary text-6xl" />
                </View>
              </View>
            </View>
          </>
        ) : (
          <View className="p-6 items-center">
            <Text className="text-slate-400">{error || 'Gig not found'}</Text>
          </View>
        )}
      </ScrollView>

      {gig && (
        <View
          className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-6 flex-row items-center gap-6"
          style={{ paddingBottom: insets.bottom + 16 }}
        >
          <View>
            <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Pay Rate</Text>
            <Text className="text-2xl font-extrabold text-slate-900">
              ₹{gig.pay_rate}/{gig.pay_type === 'fixed' ? 'gig' : 'hr'}
            </Text>
          </View>
          <Pressable
            onPress={handleApply}
            disabled={isApplying}
            className="flex-1 bg-primary items-center justify-center py-4 rounded-2xl"
          >
            <View className="flex-row items-center gap-2">
              <Text className="text-white font-extrabold">
                {isApplying ? 'Applying...' : 'Apply Now'}
              </Text>
              {!isApplying && <Icon name="arrow_forward" className="text-white text-2xl" />}
            </View>
          </Pressable>
        </View>
      )}
    </View>
  );
};

export default GigDetailsScreen;
