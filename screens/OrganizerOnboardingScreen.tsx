import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { uploadFile, UploadAsset } from '../lib/storage';
import Icon from '../components/Icon';
import { FadeInView } from '../components/AnimatedComponents';
import { GlassCard } from '../components/DistrictUI';

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
    <KeyboardAvoidingView className="flex-1 bg-surface-secondary" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Header */}
      <View
        className="px-6 pb-5 bg-white"
        style={{
          paddingTop: insets.top + 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View className="flex-row items-center gap-4 mb-5">
          <View className="h-14 w-14 rounded-2xl bg-brand-50 items-center justify-center">
            <Icon name="corporate-fare" className="text-brand text-3xl" />
          </View>
          <View>
            <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-xl text-primary-900 tracking-tight">
              Company Details
            </Text>
            <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-sm text-slate-400 mt-1">
              Tell us about your organization
            </Text>
          </View>
        </View>
        <View className="flex-row gap-1.5">
          {[1, 2, 3].map((step) => (
            <View key={step} className={`h-1.5 flex-1 rounded-full ${step === 1 ? 'bg-accent' : 'bg-slate-200'}`} />
          ))}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingTop: 16, paddingBottom: 56 + insets.bottom }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {error && (
          <View className="mb-4 p-4 bg-error/10 rounded-2xl">
            <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-error text-sm">{error}</Text>
          </View>
        )}

        {/* Profile Photo */}
        <FadeInView delay={0} duration={400}>
          <View className="items-center mb-6">
            <Pressable onPress={handlePhotoSelect} className="relative">
              <View
                className="h-28 w-28 rounded-full bg-surface-tertiary border-4 border-white overflow-hidden items-center justify-center"
                style={{
                  shadowColor: '#533483',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 4,
                }}
              >
                {photoPreview ? (
                  <Image source={{ uri: photoPreview }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <Icon name="business" className="text-slate-300 text-5xl" />
                )}
              </View>
              <View className="absolute -bottom-1 -right-1 h-10 w-10 bg-accent rounded-full border-4 border-white items-center justify-center">
                <Icon name="add_a_photo" className="text-white text-lg" />
              </View>
            </Pressable>
            <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-sm text-slate-400 mt-4">Company Logo</Text>
          </View>
        </FadeInView>

        {/* Company Info */}
        <FadeInView delay={100} duration={400}>
          <GlassCard>
            <View className="flex-row items-center gap-2 mb-4">
              <Icon name="corporate-fare" className="text-accent text-lg" />
              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900">Company Information</Text>
            </View>
            <View className="gap-4">
              <View>
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[11px] uppercase tracking-widest text-slate-400 mb-2">
                  Company / Brand Name <Text className="text-accent">*</Text>
                </Text>
                <View className="h-14 rounded-2xl bg-surface-tertiary px-4 justify-center">
                  <TextInput
                    value={formData.companyName}
                    onChangeText={(value) => handleChange('companyName', value)}
                    placeholder="e.g. Apex Events Group"
                    placeholderTextColor="#B8B8D0"
                    style={{ fontFamily: 'Inter_500Medium' }}
                    className="text-base text-primary-900"
                  />
                </View>
              </View>

              <View>
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[11px] uppercase tracking-widest text-slate-400 mb-2">
                  Organizer Type <Text className="text-accent">*</Text>
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {organizerTypes.map((type) => (
                    <Pressable
                      key={type}
                      onPress={() => handleChange('organizerType', type)}
                      className={`px-4 py-2.5 rounded-full ${formData.organizerType === type ? 'bg-accent' : 'bg-surface-tertiary'}`}
                      style={formData.organizerType === type ? {
                        shadowColor: '#E94560',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                        elevation: 2,
                      } : undefined}
                    >
                      <Text
                        style={{ fontFamily: 'Inter_600SemiBold' }}
                        className={`text-xs ${formData.organizerType === type ? 'text-white' : 'text-slate-500'}`}
                      >
                        {type}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </GlassCard>
        </FadeInView>

        {/* Contact Details */}
        <FadeInView delay={200} duration={400}>
          <View className="mt-3">
            <GlassCard>
              <View className="flex-row items-center gap-2 mb-4">
                <Icon name="mail" className="text-accent text-lg" />
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900">Contact Details</Text>
              </View>
              <View className="gap-4">
                <View>
                  <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[11px] uppercase tracking-widest text-slate-400 mb-2">
                    Official Email <Text className="text-accent">*</Text>
                  </Text>
                  <View className="h-14 rounded-2xl bg-surface-tertiary px-4 justify-center">
                    <TextInput
                      value={formData.email}
                      onChangeText={(value) => handleChange('email', value)}
                      placeholder="contact@company.com"
                      placeholderTextColor="#B8B8D0"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      style={{ fontFamily: 'Inter_500Medium' }}
                      className="text-base text-primary-900"
                    />
                  </View>
                </View>
                <View>
                  <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[11px] uppercase tracking-widest text-slate-400 mb-2">Phone Number</Text>
                  <View className="h-14 rounded-2xl bg-surface-tertiary px-4 justify-center">
                    <TextInput
                      value={formData.phone}
                      onChangeText={(value) => handleChange('phone', value)}
                      placeholder="+91 98765 43210"
                      placeholderTextColor="#B8B8D0"
                      keyboardType="phone-pad"
                      style={{ fontFamily: 'Inter_500Medium' }}
                      className="text-base text-primary-900"
                    />
                  </View>
                </View>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[11px] uppercase tracking-widest text-slate-400 mb-2">City</Text>
                    <View className="h-14 rounded-2xl bg-surface-tertiary px-4 justify-center">
                      <TextInput
                        value={formData.city}
                        onChangeText={(value) => handleChange('city', value)}
                        placeholder="Mumbai"
                        placeholderTextColor="#B8B8D0"
                        style={{ fontFamily: 'Inter_500Medium' }}
                        className="text-base text-primary-900"
                      />
                    </View>
                  </View>
                  <View className="flex-1">
                    <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[11px] uppercase tracking-widest text-slate-400 mb-2">Country</Text>
                    <View className="h-14 rounded-2xl bg-surface-tertiary px-4 justify-center">
                      <TextInput
                        value={formData.country}
                        onChangeText={(value) => handleChange('country', value)}
                        placeholder="India"
                        placeholderTextColor="#B8B8D0"
                        style={{ fontFamily: 'Inter_500Medium' }}
                        className="text-base text-primary-900"
                      />
                    </View>
                  </View>
                </View>
              </View>
            </GlassCard>
          </View>
        </FadeInView>

        {/* Submit */}
        <FadeInView delay={300} duration={400}>
          <View className="mt-6">
            <Pressable
              onPress={handleSubmit}
              disabled={!isFormValid || isLoading}
              className={`w-full py-4 rounded-2xl items-center justify-center ${isFormValid && !isLoading ? 'bg-accent' : 'bg-surface-tertiary'}`}
              style={isFormValid && !isLoading ? {
                shadowColor: '#E94560',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 6,
              } : undefined}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <View className="flex-row items-center gap-3">
                  <Text style={{ fontFamily: 'Inter_700Bold' }} className={`${isFormValid ? 'text-white' : 'text-slate-400'} text-lg`}>Continue</Text>
                  {isFormValid && <Icon name="arrow_forward" className="text-white text-xl" />}
                </View>
              )}
            </Pressable>
          </View>
        </FadeInView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default OrganizerOnboardingScreen;
