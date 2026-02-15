import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { uploadFile, UploadAsset } from '../lib/storage';
import Icon from '../components/Icon';

const WorkerOnboardingScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<UploadAsset | null>(null);
  const [profilePreview, setProfilePreview] = useState<string>('');
  const [aadhaarFile, setAadhaarFile] = useState<UploadAsset | null>(null);
  const [aadhaarPreview, setAadhaarPreview] = useState<string>('');
  const [additionalPhotos, setAdditionalPhotos] = useState<UploadAsset[]>([]);
  const [additionalPreviews, setAdditionalPreviews] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: '',
    country: '',
    age: '',
    experienceYears: '',
    gender: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleProfileSelect = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'image/*', multiple: false });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setProfilePhoto({ uri: asset.uri, name: asset.name || 'profile.jpg', mimeType: asset.mimeType || 'image/jpeg' });
      setProfilePreview(asset.uri);
      setError('');
    }
  };

  const handleAadhaarSelect = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'], multiple: false });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setAadhaarFile({ uri: asset.uri, name: asset.name || 'aadhaar', mimeType: asset.mimeType || 'application/pdf' });
      setAadhaarPreview(asset.uri);
      setError('');
    }
  };

  const handleAdditionalPhotosSelect = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'image/*', multiple: true });
    if (!result.canceled && result.assets?.length) {
      const newPhotos: UploadAsset[] = [];
      const newPreviews: string[] = [];
      for (const asset of result.assets) {
        newPhotos.push({ uri: asset.uri, name: asset.name || 'photo.jpg', mimeType: asset.mimeType || 'image/jpeg' });
        newPreviews.push(asset.uri);
      }
      setAdditionalPhotos(prev => [...prev, ...newPhotos]);
      setAdditionalPreviews(prev => [...prev, ...newPreviews]);
      setError('');
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');

    if (!profilePhoto || !aadhaarFile || additionalPhotos.length === 0) {
      setError('Profile photo, Aadhaar, and additional photos are required');
      setIsLoading(false);
      return;
    }

    let avatarUrl = '';
    let aadhaarDocUrl = '';
    const workerPhotoUrls: string[] = [];

    const profileUpload = await uploadFile(profilePhoto);
    if (profileUpload.success && profileUpload.fileUrl) {
      avatarUrl = profileUpload.fileUrl;
    } else {
      setError(profileUpload.error || 'Failed to upload profile photo');
      setIsLoading(false);
      return;
    }

    const aadhaarUpload = await uploadFile(aadhaarFile);
    if (aadhaarUpload.success && aadhaarUpload.fileUrl) {
      aadhaarDocUrl = aadhaarUpload.fileUrl;
    } else {
      setError(aadhaarUpload.error || 'Failed to upload Aadhaar');
      setIsLoading(false);
      return;
    }

    for (const photo of additionalPhotos) {
      const uploadResult = await uploadFile(photo);
      if (uploadResult.success && uploadResult.fileUrl) {
        workerPhotoUrls.push(uploadResult.fileUrl);
      } else {
        setError(uploadResult.error || 'Failed to upload additional photos');
        setIsLoading(false);
        return;
      }
    }

    const result = await completeOnboarding({
      name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      city: formData.city,
      country: formData.country,
      age: Number(formData.age),
      experienceYears: Number(formData.experienceYears),
      gender: formData.gender,
      avatarUrl,
      aadhaarDocUrl,
      workerPhotoUrls,
    });

    if (result.success) {
      router.replace('/worker');
    } else {
      setError(result.error || 'Failed to complete onboarding');
    }

    setIsLoading(false);
  };

  const isFormValid = Boolean(
    formData.fullName &&
    formData.email &&
    formData.phone &&
    formData.age &&
    formData.experienceYears &&
    formData.gender &&
    profilePhoto &&
    aadhaarFile &&
    additionalPhotos.length > 0
  );

  return (
    <KeyboardAvoidingView className="flex-1 bg-slate-50" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View className="px-6 pb-6 bg-white border-b border-slate-100" style={{ paddingTop: insets.top + 20 }}>
        <View className="flex-row items-center gap-4 mb-6">
          <View className="h-14 w-14 rounded-2xl bg-accent/20 items-center justify-center">
            <Icon name="emoji-people" className="text-yellow-700 text-3xl" />
          </View>
          <View>
            <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-xl text-slate-900 tracking-tight">
              Your Details
            </Text>
            <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-sm text-slate-400 mt-1">
              Let's set up your worker profile
            </Text>
          </View>
        </View>
        <View className="flex-row gap-1">
          {[1, 2, 3].map((step) => (
            <View key={step} className={`h-1.5 flex-1 rounded-full ${step === 1 ? 'bg-accent' : 'bg-slate-200'}`} />
          ))}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingTop: 16, paddingBottom: 56 + insets.bottom }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {error && (
          <View className="mb-4 p-4 bg-red-50 rounded-xl">
            <Text className="text-red-600 text-sm font-medium">{error}</Text>
          </View>
        )}

        <View className="space-y-6 max-w-lg mx-auto">
          <View className="items-center">
            <Pressable onPress={handleProfileSelect} className="relative">
              <View className="h-28 w-28 rounded-full bg-slate-100 border-4 border-white shadow-xl overflow-hidden items-center justify-center">
                {profilePreview ? (
                  <Image source={{ uri: profilePreview }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <Icon name="person" className="text-slate-300 text-5xl" />
                )}
              </View>
              <View className="absolute -bottom-1 -right-1 h-10 w-10 bg-primary rounded-full border-4 border-white items-center justify-center shadow-lg">
                <Icon name="add_a_photo" className="text-white text-lg" />
              </View>
            </Pressable>
            <Text className="text-sm font-bold text-slate-400 mt-4">Profile Photo *</Text>
          </View>

          <View className="flex flex-col">
            <Text className="text-sm font-extrabold text-slate-900 pb-2 px-1">
              Full Name <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={formData.fullName}
              onChangeText={(value) => handleChange('fullName', value)}
              className="w-full rounded-2xl border border-slate-100 bg-white h-14 px-5 text-base font-medium"
              placeholder="John Doe"
            />
          </View>

          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-sm font-extrabold text-slate-900 pb-2 px-1">
                Age <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={formData.age}
                onChangeText={(value) => handleChange('age', value)}
                className="w-full rounded-2xl border border-slate-100 bg-white h-14 px-5 text-base font-medium"
                placeholder="Age"
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-extrabold text-slate-900 pb-2 px-1">
                Gender <Text className="text-red-500">*</Text>
              </Text>
              <TextInput
                value={formData.gender}
                onChangeText={(value) => handleChange('gender', value)}
                className="w-full rounded-2xl border border-slate-100 bg-white h-14 px-5 text-base font-medium"
                placeholder="Male/Female/Other"
              />
            </View>
          </View>
          <View className="flex flex-col">
            <Text className="text-sm font-extrabold text-slate-900 pb-2 px-1">
              Experience (Years) <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={formData.experienceYears}
              onChangeText={(value) => handleChange('experienceYears', value)}
              className="w-full rounded-2xl border border-slate-100 bg-white h-14 px-5 text-base font-medium"
              placeholder="Years"
              keyboardType="numeric"
            />
          </View>

          <View className="flex flex-col">
            <Text className="text-sm font-extrabold text-slate-900 pb-2 px-1">
              Email Address <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={formData.email}
              onChangeText={(value) => handleChange('email', value)}
              className="w-full rounded-2xl border border-slate-100 bg-white h-14 px-5 text-base font-medium"
              placeholder="john@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View className="flex flex-col">
            <Text className="text-sm font-extrabold text-slate-900 pb-2 px-1">
              Phone Number <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={formData.phone}
              onChangeText={(value) => handleChange('phone', value)}
              className="w-full rounded-2xl border border-slate-100 bg-white h-14 px-5 text-base font-medium"
              placeholder="+1 (555) 000-0000"
              keyboardType="phone-pad"
            />
          </View>

          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-sm font-extrabold text-slate-900 pb-2 px-1">City</Text>
              <TextInput
                value={formData.city}
                onChangeText={(value) => handleChange('city', value)}
                className="w-full rounded-2xl border border-slate-100 bg-white h-14 px-5 text-base font-medium"
                placeholder="San Francisco"
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-extrabold text-slate-900 pb-2 px-1">Country</Text>
              <TextInput
                value={formData.country}
                onChangeText={(value) => handleChange('country', value)}
                className="w-full rounded-2xl border border-slate-100 bg-white h-14 px-5 text-base font-medium"
                placeholder="United States"
              />
            </View>
          </View>

          <View className="bg-white rounded-2xl p-5 border border-slate-100">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center gap-3">
                <View className="h-12 w-12 rounded-xl bg-primary/10 items-center justify-center">
                  <Icon name="verified_user" className="text-primary text-2xl" />
                </View>
                <View>
                  <Text className="font-extrabold text-slate-900 text-sm">Aadhaar Verification *</Text>
                  <Text className="text-xs text-slate-500 mt-1">Upload Aadhaar document for verification.</Text>
                </View>
              </View>
              <Pressable onPress={handleAadhaarSelect} className="px-4 py-2 rounded-xl bg-primary/5">
                <Text className="text-primary text-xs font-extrabold">Upload</Text>
              </Pressable>
            </View>
            {aadhaarPreview ? (
              <View className="w-full rounded-xl overflow-hidden border border-slate-100">
                <Image source={{ uri: aadhaarPreview }} className="w-full h-40" resizeMode="cover" />
              </View>
            ) : (
              <View className="w-full h-28 rounded-xl bg-slate-50 border border-dashed border-slate-200 items-center justify-center">
                <Text className="text-slate-400 text-sm font-bold">No Aadhaar uploaded</Text>
              </View>
            )}
          </View>

          <View className="bg-white rounded-2xl p-5 border border-slate-100">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="font-extrabold text-slate-900 text-sm">Additional Photos *</Text>
                <Text className="text-xs text-slate-500 mt-1">Upload more photos for your profile.</Text>
              </View>
              <Pressable onPress={handleAdditionalPhotosSelect} className="px-4 py-2 rounded-xl bg-primary">
                <Text className="text-white text-xs font-extrabold">Add Photos</Text>
              </Pressable>
            </View>
            {additionalPreviews.length > 0 ? (
              <View className="flex-row flex-wrap gap-2">
                {additionalPreviews.map((src, idx) => (
                  <Image key={idx} source={{ uri: src }} className="w-[30%] h-20 rounded-lg" resizeMode="cover" />
                ))}
              </View>
            ) : (
              <View className="w-full h-24 rounded-xl bg-slate-50 border border-dashed border-slate-200 items-center justify-center">
                <Text className="text-slate-400 text-sm font-bold">No additional photos yet</Text>
              </View>
            )}
          </View>
        </View>

        <View className="mt-8">
          <Pressable
            onPress={handleSubmit}
            disabled={!isFormValid || isLoading}
            className={`w-full py-4 rounded-2xl items-center justify-center ${isFormValid && !isLoading ? 'bg-primary' : 'bg-slate-100'
              }`}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View className="flex-row items-center gap-3">
                <Text className={`${isFormValid ? 'text-white' : 'text-slate-400'} text-lg font-extrabold`}>
                  Start Finding Gigs
                </Text>
                {isFormValid && <Icon name="arrow_forward" className="text-white" />}
              </View>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default WorkerOnboardingScreen;
