
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { uploadFile, UploadAsset } from '../lib/storage';
import Icon from '../components/Icon';
import { FadeInView } from '../components/AnimatedComponents';
import { GlassCard } from '../components/DistrictUI';

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
    if (user?.name) setFormData(prev => ({ ...prev, name: user.name }));
    if (user?.avatarUrl) setPhotoPreview(user.avatarUrl);
  }, [user?.name, user?.avatarUrl]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const result = await api.getProfile();
      if (result.data) {
        setProfile(result.data);
        setPhotos(result.data.photos || []);
        setFormData(prev => ({
          name: result.data.name || prev.name || user?.name || '',
          phone: result.data.phone || '',
          city: result.data.city || '',
          country: result.data.country || '',
          companyName: result.data.profile?.company_name || '',
          organizerType: result.data.profile?.organizer_type || '',
          age: result.data.profile?.age?.toString?.() || '',
          gender: result.data.profile?.gender || '',
          experienceYears: result.data.profile?.experience_years?.toString?.() || '',
        }));
        if (result.data.avatarUrl) setPhotoPreview(result.data.avatarUrl);
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
    <KeyboardAvoidingView className="flex-1 bg-surface-secondary" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Profile Header */}
      <View className="bg-white" style={{ paddingTop: insets.top }}>
        <View className="px-5 pt-3 pb-5">
          <View className="flex-row items-center justify-between mb-5">
            <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-2xl text-primary-900">Profile</Text>
            {!isEditing ? (
              <Pressable onPress={() => setIsEditing(true)} className="px-4 py-2 rounded-full bg-accent-50">
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-accent text-xs">Edit</Text>
              </Pressable>
            ) : (
              <Pressable onPress={handleSave} disabled={isLoading} className="px-4 py-2 rounded-full bg-accent">
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-white text-xs">
                  {isLoading ? 'Saving...' : 'Save'}
                </Text>
              </Pressable>
            )}
          </View>

          <View className="flex-row items-center gap-5">
            <View className="relative">
              <Pressable
                onPress={isEditing ? handlePhotoSelect : undefined}
                className="h-20 w-20 rounded-3xl bg-accent-50 overflow-hidden"
                style={{
                  shadowColor: '#E94560',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 4,
                }}
              >
                {currentAvatar ? (
                  <Image source={{ uri: currentAvatar }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <View className="w-full h-full items-center justify-center">
                    <Icon name="person" className="text-accent text-3xl" />
                  </View>
                )}
              </Pressable>
              {isEditing && (
                <Pressable
                  onPress={handlePhotoSelect}
                  className="absolute -bottom-1 -right-1 h-8 w-8 bg-accent rounded-xl border-2 border-white items-center justify-center"
                >
                  <Icon name="edit" className="text-white text-sm" />
                </Pressable>
              )}
            </View>
            <View className="flex-1">
              {isEditing ? (
                <TextInput
                  value={formData.name}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, name: value }))}
                  style={{ fontFamily: 'Inter_800ExtraBold' }}
                  className="w-full text-xl text-primary-900 border-b-2 border-accent/20 pb-1"
                  placeholder="Your name"
                />
              ) : (
                <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-xl text-primary-900">
                  {displayName}
                </Text>
              )}
              <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-sm text-slate-400 uppercase tracking-wider mt-1">
                {roleLabel}
              </Text>
              <View className="flex-row items-center gap-1.5 mt-2">
                <Icon name="verified" className="text-accent text-sm" />
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[10px] uppercase tracking-wider text-accent">
                  Verified
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 56 + insets.bottom + 80 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {isEditing ? (
          <View className="gap-4">
            {role === 'organizer' && (
              <>
                <View>
                  <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-sm text-primary-900 pb-2 px-1">Company Name</Text>
                  <TextInput
                    value={formData.companyName}
                    onChangeText={(value) => setFormData(prev => ({ ...prev, companyName: value }))}
                    style={{ fontFamily: 'Inter_500Medium' }}
                    className="w-full rounded-2xl bg-white h-14 px-5 text-base"
                  />
                </View>
                <View>
                  <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-sm text-primary-900 pb-2 px-1">Organizer Type</Text>
                  <TextInput
                    value={formData.organizerType}
                    onChangeText={(value) => setFormData(prev => ({ ...prev, organizerType: value }))}
                    style={{ fontFamily: 'Inter_500Medium' }}
                    className="w-full rounded-2xl bg-white h-14 px-5 text-base"
                  />
                </View>
              </>
            )}
            <View>
              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-sm text-primary-900 pb-2 px-1">Phone</Text>
              <TextInput
                value={formData.phone}
                onChangeText={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                style={{ fontFamily: 'Inter_500Medium' }}
                className="w-full rounded-2xl bg-white h-14 px-5 text-base"
                placeholder="Phone number"
              />
            </View>
            {role === 'worker' && (
              <>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-sm text-primary-900 pb-2 px-1">Age</Text>
                    <TextInput
                      value={formData.age}
                      onChangeText={(value) => setFormData(prev => ({ ...prev, age: value }))}
                      className="w-full rounded-2xl bg-white h-14 px-5 text-base"
                      style={{ fontFamily: 'Inter_500Medium' }}
                      keyboardType="numeric"
                    />
                  </View>
                  <View className="flex-1">
                    <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-sm text-primary-900 pb-2 px-1">Gender</Text>
                    <TextInput
                      value={formData.gender}
                      onChangeText={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                      className="w-full rounded-2xl bg-white h-14 px-5 text-base"
                      style={{ fontFamily: 'Inter_500Medium' }}
                      placeholder="Male/Female/Other"
                    />
                  </View>
                </View>
                <View>
                  <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-sm text-primary-900 pb-2 px-1">Experience (Years)</Text>
                  <TextInput
                    value={formData.experienceYears}
                    onChangeText={(value) => setFormData(prev => ({ ...prev, experienceYears: value }))}
                    className="w-full rounded-2xl bg-white h-14 px-5 text-base"
                    style={{ fontFamily: 'Inter_500Medium' }}
                    keyboardType="numeric"
                  />
                </View>
              </>
            )}
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-sm text-primary-900 pb-2 px-1">City</Text>
                <TextInput
                  value={formData.city}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, city: value }))}
                  className="w-full rounded-2xl bg-white h-14 px-5 text-base"
                  style={{ fontFamily: 'Inter_500Medium' }}
                />
              </View>
              <View className="flex-1">
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-sm text-primary-900 pb-2 px-1">Country</Text>
                <TextInput
                  value={formData.country}
                  onChangeText={(value) => setFormData(prev => ({ ...prev, country: value }))}
                  className="w-full rounded-2xl bg-white h-14 px-5 text-base"
                  style={{ fontFamily: 'Inter_500Medium' }}
                />
              </View>
            </View>
          </View>
        ) : (
          <>
            {role === 'worker' && (
              <FadeInView delay={100} duration={400}>
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-xs text-slate-400 uppercase tracking-wider mb-3">Worker Details</Text>
                <GlassCard className="mb-5">
                  <View className="gap-3">
                    {[
                      { label: 'Age', value: profile?.profile?.age || 'N/A' },
                      { label: 'Gender', value: profile?.profile?.gender || 'N/A' },
                      { label: 'Experience', value: `${profile?.profile?.experience_years ?? 'N/A'} yrs` },
                      { label: 'Aadhaar', value: profile?.profile?.aadhaar_doc_url ? 'Uploaded' : 'Not uploaded' },
                    ].map((item, idx) => (
                      <View key={idx} className="flex-row items-center justify-between">
                        <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-slate-400 text-xs uppercase">{item.label}</Text>
                        <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-primary-900">{item.value}</Text>
                      </View>
                    ))}
                  </View>
                </GlassCard>
              </FadeInView>
            )}

            {role === 'worker' && photos.length > 0 && (
              <FadeInView delay={150} duration={400}>
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-xs text-slate-400 uppercase tracking-wider mb-3">Photos</Text>
                <GlassCard className="mb-5">
                  <View className="flex-row flex-wrap gap-3">
                    {photos.map((photo: any) => (
                      <Image key={photo.id} source={{ uri: photo.url }} className="w-[30%] h-24 rounded-2xl" resizeMode="cover" />
                    ))}
                  </View>
                </GlassCard>
              </FadeInView>
            )}

            <FadeInView delay={200} duration={400}>
              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-xs text-slate-400 uppercase tracking-wider mb-3">Account</Text>
              <GlassCard className="mb-5 p-0 overflow-hidden">
                {[
                  { label: 'Personal Information', icon: 'person', onPress: () => setIsEditing(true) },
                  { label: 'Wallet & Payments', icon: 'account-balance-wallet', onPress: () => router.push(`/${role}/wallet`) },
                  { label: 'Notifications', icon: 'notifications-none', onPress: undefined },
                  { label: 'Privacy & Security', icon: 'lock-outline', onPress: undefined }
                ].map((item, idx) => (
                  <Pressable
                    key={idx}
                    onPress={item.onPress}
                    className="flex-row items-center justify-between w-full p-4 border-b border-surface-tertiary"
                  >
                    <View className="flex-row items-center gap-4">
                      <View className="h-10 w-10 rounded-xl bg-accent-50 items-center justify-center">
                        <Icon name={item.icon} className="text-accent text-xl" />
                      </View>
                      <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-primary-900">{item.label}</Text>
                    </View>
                    <Icon name="chevron-right" className="text-slate-300" />
                  </Pressable>
                ))}
              </GlassCard>
            </FadeInView>

            <FadeInView delay={250} duration={400}>
              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-xs text-slate-400 uppercase tracking-wider mb-3">Support</Text>
              <GlassCard className="mb-5 p-0 overflow-hidden">
                {[
                  { label: 'Help Center', icon: 'help-outline' },
                  { label: 'Terms of Service', icon: 'description' },
                  { label: 'Community', icon: 'groups' }
                ].map((item, idx) => (
                  <Pressable
                    key={idx}
                    className="flex-row items-center justify-between w-full p-4 border-b border-surface-tertiary"
                  >
                    <View className="flex-row items-center gap-4">
                      <View className="h-10 w-10 rounded-xl bg-surface-tertiary items-center justify-center">
                        <Icon name={item.icon} className="text-slate-400 text-xl" />
                      </View>
                      <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-primary-900">{item.label}</Text>
                    </View>
                    <Icon name="chevron-right" className="text-slate-300" />
                  </Pressable>
                ))}
              </GlassCard>
            </FadeInView>
          </>
        )}

        <FadeInView delay={300} duration={400}>
          <Pressable
            onPress={handleSignOut}
            className="w-full flex-row items-center justify-center gap-3 py-4 rounded-2xl border-2 border-error/20 bg-error/5"
          >
            <Icon name="logout" className="text-error text-xl" />
            <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-error text-base">Sign Out</Text>
          </Pressable>
        </FadeInView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ProfileScreen;
