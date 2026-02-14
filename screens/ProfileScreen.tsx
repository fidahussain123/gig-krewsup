
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { uploadFile, UploadAsset } from '../lib/storage';
import Icon from '../components/Icon';

interface ProfileScreenProps {
  role: 'organizer' | 'worker';
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ role }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout, user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<UploadAsset | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [profile, setProfile] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    country: '',
    companyName: '',
    organizerType: '',
    age: '',
    gender: '',
    experienceYears: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const result = await api.getProfile();
      if (result.data) {
        setProfile(result.data);
        setPhotos(result.data.photos || []);
        setFormData({
          name: result.data.name || '',
          phone: result.data.phone || '',
          city: result.data.city || '',
          country: result.data.country || '',
          companyName: result.data.profile?.company_name || '',
          organizerType: result.data.profile?.organizer_type || '',
          age: result.data.profile?.age?.toString?.() || '',
          gender: result.data.profile?.gender || '',
          experienceYears: result.data.profile?.experience_years?.toString?.() || '',
        });
        if (result.data.avatarUrl) {
          setPhotoPreview(result.data.avatarUrl);
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handlePhotoSelect = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'image/*', multiple: false });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setProfilePhoto({ uri: asset.uri, name: asset.name || 'profile.jpg', mimeType: asset.mimeType || 'image/jpeg' });
      setPhotoPreview(asset.uri);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);

    let avatarUrl = profile?.avatarUrl || '';

    if (profilePhoto) {
      const uploadResult = await uploadFile(profilePhoto);
      if (uploadResult.success && uploadResult.fileUrl) {
        avatarUrl = uploadResult.fileUrl;
      }
    }

    await api.updateProfile({
      name: formData.name,
      phone: formData.phone,
      city: formData.city,
      country: formData.country,
      avatarUrl,
    });

    if (role === 'organizer') {
      await api.updateOrganizerProfile({
        companyName: formData.companyName,
        organizerType: formData.organizerType,
      });
    } else {
      await api.updateWorkerProfile({
        age: formData.age ? Number(formData.age) : null,
        gender: formData.gender || null,
        experienceYears: formData.experienceYears ? Number(formData.experienceYears) : null,
      });
    }

    setIsEditing(false);
    setIsLoading(false);
    loadProfile();
  };

  const handleSignOut = () => {
    logout();
    router.replace('/');
  };

  const roleLabel = role === 'organizer' ? 'Event Organizer' : 'Gig Worker';
  const displayName = formData.name || user?.name || 'User';
  const currentAvatar = photoPreview || user?.avatarUrl;

  return (
    <KeyboardAvoidingView className="flex-1 bg-slate-50" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View className="px-6 pb-6 bg-white border-b border-slate-100" style={{ paddingTop: insets.top + 14 }}>
        <View className="flex-row items-center justify-between mb-6">
          <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-2xl text-slate-900">
            Profile
          </Text>
          {!isEditing ? (
            <Pressable onPress={() => setIsEditing(true)}>
              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary text-sm">
                Edit
              </Text>
            </Pressable>
          ) : (
            <Pressable onPress={handleSave} disabled={isLoading}>
              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary text-sm">
                {isLoading ? 'Saving...' : 'Save'}
              </Text>
            </Pressable>
          )}
        </View>

        <View className="flex-row items-center gap-6">
          <View className="relative">
            <Pressable
              onPress={isEditing ? handlePhotoSelect : undefined}
              className="h-24 w-24 rounded-3xl bg-gray-200 overflow-hidden ring-4 ring-primary/10"
            >
              {currentAvatar ? (
                <Image source={{ uri: currentAvatar }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <View className="w-full h-full items-center justify-center bg-primary/10">
                  <Icon name="person" className="text-primary text-4xl" />
                </View>
              )}
            </Pressable>
            {isEditing && (
              <Pressable
                onPress={handlePhotoSelect}
                className="absolute -bottom-2 -right-2 h-10 w-10 bg-primary rounded-2xl border-4 border-white items-center justify-center"
              >
                <Icon name="edit" className="text-white text-lg" />
              </Pressable>
            )}
          </View>
          <View className="flex-1">
            {isEditing ? (
              <TextInput
                value={formData.name}
                onChangeText={(value) => setFormData(prev => ({ ...prev, name: value }))}
                style={{ fontFamily: 'Inter_800ExtraBold' }}
                className="w-full text-2xl text-slate-900 border-b-2 border-primary/20 pb-1"
                placeholder="Your name"
              />
            ) : (
              <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-2xl text-slate-900">
                {displayName}
              </Text>
            )}
            <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-sm text-slate-400 uppercase tracking-widest mt-1">
              {roleLabel}
            </Text>
            <View className="flex-row items-center gap-1.5 mt-3 bg-primary/5 px-3 py-1 rounded-xl">
              <Icon name="verified" className="text-primary text-sm" />
              <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-[10px] uppercase tracking-widest text-primary">
                Identity Verified
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 48 + insets.bottom + 80 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {isEditing ? (
          <View className="space-y-4">
            {role === 'organizer' && (
              <>
                <View className="flex flex-col">
                  <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-sm text-slate-900 pb-2 px-1">
                    Company Name
                  </Text>
                  <TextInput
                    value={formData.companyName}
                    onChangeText={(value) => setFormData(prev => ({ ...prev, companyName: value }))}
                    style={{ fontFamily: 'Inter_500Medium' }}
                    className="w-full rounded-2xl border border-slate-100 bg-white h-14 px-5 text-base"
                    placeholder="Company name"
                  />
                </View>
                <View className="flex flex-col">
                  <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-sm text-slate-900 pb-2 px-1">
                    Organizer Type
                  </Text>
                  <TextInput
                    value={formData.organizerType}
                    onChangeText={(value) => setFormData(prev => ({ ...prev, organizerType: value }))}
                    style={{ fontFamily: 'Inter_500Medium' }}
                    className="w-full rounded-2xl border border-slate-100 bg-white h-14 px-5 text-base"
                    placeholder="Organizer type"
                  />
                </View>
              </>
            )}
            <View className="flex flex-col">
              <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-sm text-slate-900 pb-2 px-1">
                Phone
              </Text>
              <TextInput
                value={formData.phone}
                onChangeText={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                style={{ fontFamily: 'Inter_500Medium' }}
                className="w-full rounded-2xl border border-slate-100 bg-white h-14 px-5 text-base"
                placeholder="Phone number"
              />
            </View>
            {role === 'worker' && (
              <>
                <View className="flex-row gap-4">
                  <View className="flex-1">
                    <Text className="text-sm font-extrabold text-slate-900 pb-2 px-1">Age</Text>
                    <TextInput
                      value={formData.age}
                      onChangeText={(value) => setFormData(prev => ({ ...prev, age: value }))}
                      className="w-full rounded-2xl border border-slate-100 bg-white h-14 px-5 text-base font-medium"
                      placeholder="Age"
                      keyboardType="numeric"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-extrabold text-slate-900 pb-2 px-1">Gender</Text>
                    <TextInput
                      value={formData.gender}
                      onChangeText={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                      className="w-full rounded-2xl border border-slate-100 bg-white h-14 px-5 text-base font-medium"
                      placeholder="Male/Female/Other"
                    />
                  </View>
                </View>
                <View className="flex flex-col">
                  <Text className="text-sm font-extrabold text-slate-900 pb-2 px-1">Experience (Years)</Text>
                  <TextInput
                    value={formData.experienceYears}
                    onChangeText={(value) => setFormData(prev => ({ ...prev, experienceYears: value }))}
                    className="w-full rounded-2xl border border-slate-100 bg-white h-14 px-5 text-base font-medium"
                    placeholder="Years of experience"
                    keyboardType="numeric"
                  />
                </View>
              </>
            )}
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Text className="text-sm font-extrabold text-slate-900 pb-2 px-1">City</Text>
                <TextInput
                  value={formData.city}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, city: value }))}
                  className="w-full rounded-2xl border border-slate-100 bg-white h-14 px-5 text-base font-medium"
                  placeholder="City"
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-extrabold text-slate-900 pb-2 px-1">Country</Text>
                <TextInput
                  value={formData.country}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, country: value }))}
                  className="w-full rounded-2xl border border-slate-100 bg-white h-14 px-5 text-base font-medium"
                  placeholder="Country"
                />
              </View>
            </View>
          </View>
        ) : (
          <>
            {role === 'worker' && (
              <View>
                <Text className="text-[11px] font-extrabold uppercase tracking-widest mb-4 text-slate-400">Worker Details</Text>
                <View className="bg-white rounded-3xl shadow-sm ring-1 ring-slate-100 p-5 space-y-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-slate-400 font-bold uppercase text-[10px]">Age</Text>
                    <Text className="font-semibold text-slate-700">{profile?.profile?.age || 'N/A'}</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-slate-400 font-bold uppercase text-[10px]">Gender</Text>
                    <Text className="font-semibold text-slate-700">{profile?.profile?.gender || 'N/A'}</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-slate-400 font-bold uppercase text-[10px]">Experience</Text>
                    <Text className="font-semibold text-slate-700">{profile?.profile?.experience_years ?? 'N/A'} yrs</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-slate-400 font-bold uppercase text-[10px]">Aadhaar</Text>
                    <Text className="font-semibold text-slate-700">
                      {profile?.profile?.aadhaar_doc_url ? 'Uploaded' : 'Not uploaded'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {role === 'worker' && (
              <View>
                <Text className="text-[11px] font-extrabold uppercase tracking-widest mb-4 text-slate-400">Additional Photos</Text>
                <View className="bg-white rounded-3xl shadow-sm ring-1 ring-slate-100 p-5">
                  {photos.length === 0 ? (
                    <Text className="text-sm text-slate-400">No additional photos uploaded.</Text>
                  ) : (
                    <View className="flex-row flex-wrap gap-3">
                      {photos.map((photo: any) => (
                        <Image key={photo.id} source={{ uri: photo.url }} className="w-[30%] h-24 rounded-xl" resizeMode="cover" />
                      ))}
                    </View>
                  )}
                </View>
              </View>
            )}

            <View>
              <Text className="text-[11px] font-extrabold uppercase tracking-widest mb-4 text-slate-400">Account Settings</Text>
              <View className="bg-white rounded-3xl shadow-sm ring-1 ring-slate-100 overflow-hidden">
                {[
                  { label: 'Personal Information', icon: 'person', onPress: () => setIsEditing(true) },
                  { label: 'Wallet & Payments', icon: 'account_balance_wallet', onPress: () => router.push(`/${role}/wallet`) },
                  { label: 'Notification Settings', icon: 'notifications', onPress: undefined },
                  { label: 'Privacy & Security', icon: 'lock', onPress: undefined }
                ].map((item, idx) => (
                  <Pressable
                    key={idx}
                    onPress={item.onPress}
                    className="flex-row items-center justify-between w-full p-5 border-b border-slate-50"
                  >
                    <View className="flex-row items-center gap-4">
                      <View className="h-10 w-10 rounded-xl bg-primary/5 items-center justify-center">
                        <Icon name={item.icon} className="text-primary text-2xl" />
                      </View>
                      <Text className="text-base font-bold text-slate-700">{item.label}</Text>
                    </View>
                    <Icon name="chevron_right" className="text-slate-300" />
                  </Pressable>
                ))}
              </View>
            </View>

            <View>
              <Text className="text-[11px] font-extrabold uppercase tracking-widest mb-4 text-slate-400">Support & Legal</Text>
              <View className="bg-white rounded-3xl shadow-sm ring-1 ring-slate-100 overflow-hidden">
                {[
                  { label: 'Help Center', icon: 'help' },
                  { label: 'Terms of Service', icon: 'description' },
                  { label: 'Community Guidelines', icon: 'groups' }
                ].map((item, idx) => (
                  <Pressable
                    key={idx}
                    className="flex-row items-center justify-between w-full p-5 border-b border-slate-50"
                  >
                    <View className="flex-row items-center gap-4">
                      <View className="h-10 w-10 rounded-xl bg-slate-100 items-center justify-center">
                        <Icon name={item.icon} className="text-slate-400 text-2xl" />
                      </View>
                      <Text className="text-base font-bold text-slate-700">{item.label}</Text>
                    </View>
                    <Icon name="chevron_right" className="text-slate-300" />
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        )}

        <Pressable
          onPress={handleSignOut}
          className="w-full flex-row items-center justify-center gap-3 py-5 rounded-3xl border-2 border-red-100"
        >
          <Icon name="logout" className="text-red-500 text-2xl" />
          <Text className="text-red-500 font-extrabold text-lg">Sign Out</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ProfileScreen;
