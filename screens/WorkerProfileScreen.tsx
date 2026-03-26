import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../lib/api';
import Icon from '../components/Icon';
import { FadeInView } from '../components/AnimatedComponents';
import { GlassCard } from '../components/DistrictUI';

const WorkerProfileScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [worker, setWorker] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    loadWorker(id);
  }, [id]);

  const loadWorker = async (workerId: string) => {
    setIsLoading(true);
    const result = await api.getWorkerProfile(workerId);
    if (result.data?.worker) {
      setWorker(result.data.worker);
      setPhotos(result.data.photos || []);
    } else {
      setError(result.error || 'Failed to load worker profile');
    }
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface-secondary items-center justify-center">
        <ActivityIndicator size="large" color="#E94560" />
      </View>
    );
  }

  if (!worker) {
    return (
      <View className="flex-1 bg-surface-secondary items-center justify-center">
        <View className="h-20 w-20 rounded-3xl bg-surface-tertiary items-center justify-center mb-4">
          <Icon name="person-off" className="text-slate-300 text-3xl" />
        </View>
        <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-slate-400">{error || 'Worker not found'}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface-secondary">
      {/* Hero Header */}
      <View className="relative h-48">
        <LinearGradient
          colors={['#1A1A2E', '#16213E', '#0F3460']}
          className="absolute top-0 left-0 right-0 bottom-0"
        />
        <View className="absolute flex-row items-center justify-between w-full px-5" style={{ top: insets.top + 8 }}>
          <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
            <Icon name="arrow_back_ios_new" className="text-white" size={18} />
          </Pressable>
          <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-white text-base">Worker Profile</Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}>
        {/* Profile Card - overlapping hero */}
        <FadeInView delay={0} duration={400}>
          <View className="mx-5 -mt-16">
            <GlassCard>
              <View className="items-center -mt-14 mb-3">
                <View
                  className="h-24 w-24 rounded-3xl bg-surface-tertiary overflow-hidden border-4 border-white"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                    elevation: 4,
                  }}
                >
                  {worker.avatar_url ? (
                    <Image source={{ uri: worker.avatar_url }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <View className="w-full h-full items-center justify-center bg-accent-50">
                      <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-accent text-2xl">{(worker.name || 'W')[0]}</Text>
                    </View>
                  )}
                </View>
              </View>
              <View className="items-center">
                <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-xl text-primary-900">{worker.name || 'Worker'}</Text>
                <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-sm text-slate-400 mt-1">
                  {worker.age ? `${worker.age} yrs` : 'Age N/A'} • {worker.experience_years ?? 0} yrs exp
                </Text>
                {worker.gender && (
                  <View className="mt-2 px-3 py-1 rounded-full bg-surface-tertiary">
                    <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[10px] uppercase tracking-widest text-slate-400">
                      {worker.gender}
                    </Text>
                  </View>
                )}
                {worker.verification_status && (
                  <View className="mt-2 flex-row items-center gap-1 px-3 py-1 rounded-full bg-success/10">
                    <Icon name="verified" className="text-success text-xs" />
                    <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[10px] uppercase tracking-widest text-success">
                      Aadhaar {worker.verification_status}
                    </Text>
                  </View>
                )}
              </View>
            </GlassCard>
          </View>
        </FadeInView>

        {/* Contact Info */}
        <FadeInView delay={100} duration={400}>
          <View className="mx-5 mt-3">
            <GlassCard>
              <View className="flex-row items-center gap-2 mb-4">
                <Icon name="contact-mail" className="text-accent text-lg" />
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900">Contact Details</Text>
              </View>
              <View className="gap-4">
                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-slate-400 uppercase text-[10px] tracking-wider mb-1">Email</Text>
                    <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-primary-900 text-sm">{worker.email || 'N/A'}</Text>
                  </View>
                  <View className="flex-1">
                    <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-slate-400 uppercase text-[10px] tracking-wider mb-1">Phone</Text>
                    <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-primary-900 text-sm">{worker.phone || 'N/A'}</Text>
                  </View>
                </View>
                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-slate-400 uppercase text-[10px] tracking-wider mb-1">City</Text>
                    <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-primary-900 text-sm">{worker.city || 'N/A'}</Text>
                  </View>
                  <View className="flex-1">
                    <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-slate-400 uppercase text-[10px] tracking-wider mb-1">Country</Text>
                    <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-primary-900 text-sm">{worker.country || 'N/A'}</Text>
                  </View>
                </View>
              </View>
            </GlassCard>
          </View>
        </FadeInView>

        {/* Skills */}
        {worker.skills && (
          <FadeInView delay={200} duration={400}>
            <View className="mx-5 mt-3">
              <GlassCard>
                <View className="flex-row items-center gap-2 mb-3">
                  <Icon name="stars" className="text-accent text-lg" />
                  <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900">Skills</Text>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {worker.skills.split(',').map((skill: string, idx: number) => (
                    <View key={idx} className="px-3 py-1.5 rounded-full bg-accent-50">
                      <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-xs text-accent">
                        {skill.trim()}
                      </Text>
                    </View>
                  ))}
                </View>
              </GlassCard>
            </View>
          </FadeInView>
        )}

        {/* Bio */}
        {worker.bio && (
          <FadeInView delay={250} duration={400}>
            <View className="mx-5 mt-3">
              <GlassCard>
                <View className="flex-row items-center gap-2 mb-3">
                  <Icon name="description" className="text-accent text-lg" />
                  <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900">About</Text>
                </View>
                <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-500 leading-relaxed">{worker.bio}</Text>
              </GlassCard>
            </View>
          </FadeInView>
        )}

        {/* Aadhaar */}
        {worker.aadhaar_doc_url && (
          <FadeInView delay={300} duration={400}>
            <View className="mx-5 mt-3">
              <GlassCard>
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 rounded-xl bg-success/10 items-center justify-center">
                    <Icon name="verified_user" className="text-success text-lg" />
                  </View>
                  <View className="flex-1">
                    <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900 text-sm">Aadhaar Document</Text>
                    <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-xs text-slate-400 mt-0.5">Identity verified</Text>
                  </View>
                  <Pressable className="px-4 py-2 rounded-full bg-accent-50">
                    <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-accent text-xs">View</Text>
                  </Pressable>
                </View>
              </GlassCard>
            </View>
          </FadeInView>
        )}

        {/* Photos */}
        <FadeInView delay={350} duration={400}>
          <View className="mx-5 mt-3">
            <GlassCard>
              <View className="flex-row items-center gap-2 mb-4">
                <Icon name="photo-library" className="text-accent text-lg" />
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900">Photos</Text>
              </View>
              {photos.length === 0 ? (
                <View className="items-center py-6">
                  <Icon name="image" className="text-slate-200 text-3xl mb-2" />
                  <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-400 text-sm">No additional photos</Text>
                </View>
              ) : (
                <View className="flex-row flex-wrap gap-2">
                  {photos.map((photo: any) => (
                    <Image key={photo.id} source={{ uri: photo.url }} className="w-[30%] h-24 rounded-xl" resizeMode="cover" />
                  ))}
                </View>
              )}
            </GlassCard>
          </View>
        </FadeInView>
      </ScrollView>
    </View>
  );
};

export default WorkerProfileScreen;
