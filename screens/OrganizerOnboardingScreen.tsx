import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { uploadFile, UploadAsset } from '../lib/storage';
import Icon from '../components/Icon';

const OrganizerOnboardingScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<UploadAsset | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');

  const [formData, setFormData] = useState({
    companyName: '',
    organizerType: '',
    email: '',
    phone: '',
    city: '',
    country: '',
  });

  const organizerTypes = [
    'Corporate Events',
    'Wedding Planner',
    'Concert Promoter',
    'Sports Organization',
    'Non-Profit',
    'Agency',
    'Individual',
  ];

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handlePhotoSelect = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'image/*', multiple: false });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setProfilePhoto({ uri: asset.uri, name: asset.name || 'profile.jpg', mimeType: asset.mimeType || 'image/jpeg' });
      setPhotoPreview(asset.uri);
      setError('');
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');

    let avatarUrl = '';

    // Upload photo if selected
    if (profilePhoto) {
      const uploadResult = await uploadFile(profilePhoto);
      if (uploadResult.success && uploadResult.fileUrl) {
        avatarUrl = uploadResult.fileUrl;
      } else {
        setError(uploadResult.error || 'Failed to upload photo');
        setIsLoading(false);
        return;
      }
    }

    const result = await completeOnboarding({
      name: formData.companyName,
      email: formData.email,
      phone: formData.phone,
      city: formData.city,
      country: formData.country,
      companyName: formData.companyName,
      organizerType: formData.organizerType,
      avatarUrl,
    });

    if (result.success) {
      router.replace('/organizer');
    } else {
      setError(result.error || 'Failed to complete onboarding');
    }

    setIsLoading(false);
  };

  const isFormValid = formData.companyName && formData.email && formData.organizerType;

  return (
    <KeyboardAvoidingView className="flex-1 bg-slate-50" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View className="px-6 pb-6 bg-white border-b border-slate-100" style={{ paddingTop: insets.top + 12 }}>
        <View className="flex-row items-center gap-4 mb-6">
          <View className="h-14 w-14 rounded-2xl bg-primary/10 items-center justify-center">
            <Icon name="corporate-fare" className="text-primary text-3xl" />
          </View>
          <View>
            <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-xl text-slate-900 tracking-tight">
              Company Details
            </Text>
            <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-sm text-slate-400 mt-1">
              Tell us about your organization
            </Text>
          </View>
        </View>
        <View className="flex-row gap-1">
          {[1, 2, 3].map((step) => (
            <View key={step} className={`h-1.5 flex-1 rounded-full ${step === 1 ? 'bg-primary' : 'bg-slate-200'}`} />
          ))}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 48 + insets.bottom }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {error && (
          <View className="mb-4 p-4 bg-red-50 rounded-xl">
            <Text className="text-red-600 text-sm font-medium">{error}</Text>
          </View>
        )}

        <View className="space-y-6 max-w-lg mx-auto">
          <View className="items-center mb-8">
            <Pressable onPress={handlePhotoSelect} className="relative">
              <View className="h-28 w-28 rounded-full bg-slate-100 border-4 border-white shadow-xl overflow-hidden items-center justify-center">
                {photoPreview ? (
                  <Image source={{ uri: photoPreview }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <Icon name="person" className="text-slate-300 text-5xl" />
                )}
              </View>
              <View className="absolute -bottom-1 -right-1 h-10 w-10 bg-primary rounded-full border-4 border-white items-center justify-center shadow-lg">
                <Icon name="add_a_photo" className="text-white text-lg" />
              </View>
            </Pressable>
            <Text className="text-sm font-bold text-slate-400 mt-4">Add Profile Photo</Text>
          </View>

          <View className="flex flex-col">
            <Text className="text-sm font-extrabold text-slate-900 pb-2 px-1">
              Company / Brand Name <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={formData.companyName}
              onChangeText={(value) => handleChange('companyName', value)}
              className="w-full rounded-2xl border border-slate-100 bg-white h-14 px-5 text-base font-medium"
              placeholder="e.g. Apex Events Group"
            />
          </View>

          <View className="flex flex-col">
            <Text className="text-sm font-extrabold text-slate-900 pb-2 px-1">
              Organizer Type <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={formData.organizerType}
              onChangeText={(value) => handleChange('organizerType', value)}
              className="w-full rounded-2xl border border-slate-100 bg-white h-14 px-5 text-base font-medium"
              placeholder="Select type..."
            />
          </View>

          <View className="flex flex-col">
            <Text className="text-sm font-extrabold text-slate-900 pb-2 px-1">
              Official Email <Text className="text-red-500">*</Text>
            </Text>
            <TextInput
              value={formData.email}
              onChangeText={(value) => handleChange('email', value)}
              className="w-full rounded-2xl border border-slate-100 bg-white h-14 px-5 text-base font-medium"
              placeholder="contact@company.com"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View className="flex flex-col">
            <Text className="text-sm font-extrabold text-slate-900 pb-2 px-1">Phone Number</Text>
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
                placeholder="New York"
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
                <Text className={`${isFormValid ? 'text-white' : 'text-slate-400'} text-lg font-extrabold`}>Continue</Text>
                {isFormValid && <Icon name="arrow_forward" className="text-white" />}
              </View>
            )}
          </Pressable>
        </View>
      </ScrollView >
    </KeyboardAvoidingView >
  );
};

export default OrganizerOnboardingScreen;
