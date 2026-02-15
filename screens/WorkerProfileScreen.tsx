import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../lib/api';
import Icon from '../components/Icon';

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
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#008080" />
      </View>
    );
  }

  if (!worker) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <Text className="text-slate-400">{error || 'Worker not found'}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <View className="bg-white px-6 pb-4 flex-row items-center border-b border-slate-100" style={{ paddingTop: insets.top + 20 }}>
        <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full">
          <Icon name="arrow_back_ios_new" className="text-slate-700" />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-lg text-slate-900 flex-1 text-center pr-10">
          Worker Profile
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingTop: 16, paddingBottom: 32 + insets.bottom + 90 }}>
        <View className="bg-white rounded-3xl p-6 shadow-sm ring-1 ring-slate-100">
          <View className="flex-row items-center gap-4">
            <View className="h-20 w-20 rounded-3xl bg-slate-100 overflow-hidden">
              {worker.avatar_url ? (
                <Image source={{ uri: worker.avatar_url }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <View className="w-full h-full items-center justify-center">
                  <Text className="text-primary font-bold">{(worker.name || 'W')[0]}</Text>
                </View>
              )}
            </View>
            <View>
              <Text className="text-xl font-extrabold text-slate-900">{worker.name || 'Worker'}</Text>
              <Text className="text-sm font-bold text-slate-400">
                {worker.age ? `${worker.age} yrs` : 'Age N/A'} • {worker.experience_years ?? 0} yrs exp
              </Text>
              {worker.gender && (
                <Text className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mt-1">
                  {worker.gender}
                </Text>
              )}
              {worker.verification_status && (
                <Text className="text-[10px] font-extrabold uppercase tracking-widest text-primary mt-2">
                  Aadhaar {worker.verification_status}
                </Text>
              )}
            </View>
          </View>

          <View className="mt-6 flex-row flex-wrap gap-4">
            <View className="w-[48%]">
              <Text className="text-slate-400 font-bold uppercase text-[10px]">Email</Text>
              <Text className="font-medium text-slate-700">{worker.email || 'N/A'}</Text>
            </View>
            <View className="w-[48%]">
              <Text className="text-slate-400 font-bold uppercase text-[10px]">Phone</Text>
              <Text className="font-medium text-slate-700">{worker.phone || 'N/A'}</Text>
            </View>
            <View className="w-[48%]">
              <Text className="text-slate-400 font-bold uppercase text-[10px]">City</Text>
              <Text className="font-medium text-slate-700">{worker.city || 'N/A'}</Text>
            </View>
            <View className="w-[48%]">
              <Text className="text-slate-400 font-bold uppercase text-[10px]">Country</Text>
              <Text className="font-medium text-slate-700">{worker.country || 'N/A'}</Text>
            </View>
          </View>

          {worker.skills && (
            <View className="mt-6">
              <Text className="text-slate-400 font-bold uppercase text-[10px] mb-2">Skills</Text>
              <View className="flex-row flex-wrap gap-2">
                {worker.skills.split(',').map((skill: string, idx: number) => (
                  <Text key={idx} className="px-3 py-1 rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                    {skill.trim()}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {worker.bio && (
            <View className="mt-6">
              <Text className="text-slate-400 font-bold uppercase text-[10px] mb-2">Bio</Text>
              <Text className="text-slate-600">{worker.bio}</Text>
            </View>
          )}

          {worker.aadhaar_doc_url && (
            <View className="mt-6">
              <Text className="text-slate-400 font-bold uppercase text-[10px] mb-2">Aadhaar Document</Text>
              <Text className="text-primary font-bold text-sm underline">View Aadhaar Document</Text>
            </View>
          )}
        </View>

        <View className="mt-6 bg-white rounded-3xl p-6 shadow-sm ring-1 ring-slate-100">
          <Text className="text-slate-400 font-bold uppercase text-[10px] mb-4">Additional Photos</Text>
          {photos.length === 0 ? (
            <Text className="text-slate-400 text-sm">No additional photos uploaded.</Text>
          ) : (
            <View className="flex-row flex-wrap gap-3">
              {photos.map((photo: any) => (
                <Image key={photo.id} source={{ uri: photo.url }} className="w-[30%] h-24 rounded-xl" resizeMode="cover" />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default WorkerProfileScreen;
