import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { uploadFile, UploadAsset } from '../lib/storage';
import Icon from '../components/Icon';
import { FadeInView } from '../components/AnimatedComponents';
import { GlassCard } from '../components/DistrictUI';

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const EXPERIENCE_OPTIONS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'];

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
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showExperiencePicker, setShowExperiencePicker] = useState(false);

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

    if (!formData.fullName || !formData.phone || !formData.gender || !formData.age) {
      setError('Please fill all required fields');
      setIsLoading(false);
      return;
    }
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

    const expYears = formData.experienceYears === '10+' ? 10 : Number(formData.experienceYears) || 0;

    const result = await completeOnboarding({
      name: formData.fullName,
      phone: formData.phone,
      city: formData.city || undefined,
      country: formData.country || undefined,
      age: Number(formData.age) || 0,
      experienceYears: expYears,
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
    formData.phone &&
    formData.age &&
    formData.experienceYears &&
    formData.gender &&
    profilePhoto &&
    aadhaarFile &&
    additionalPhotos.length > 0
  );

  return (
    <KeyboardAvoidingView className="flex-1 bg-surface-secondary" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
          <View className="h-14 w-14 rounded-2xl bg-accent-50 items-center justify-center">
            <Icon name="emoji-people" className="text-accent text-3xl" />
          </View>
          <View>
            <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-xl text-primary-900 tracking-tight">
              Your Details
            </Text>
            <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-sm text-slate-400 mt-1">
              Let's set up your worker profile
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
            <Pressable onPress={handleProfileSelect} className="relative">
              <View
                className="h-28 w-28 rounded-full bg-surface-tertiary border-4 border-white overflow-hidden items-center justify-center"
                style={{
                  shadowColor: '#E94560',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                  elevation: 4,
                }}
              >
                {profilePreview ? (
                  <Image source={{ uri: profilePreview }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <Icon name="person" className="text-slate-300 text-5xl" />
                )}
              </View>
              <View className="absolute -bottom-1 -right-1 h-10 w-10 bg-accent rounded-full border-4 border-white items-center justify-center">
                <Icon name="add_a_photo" className="text-white text-lg" />
              </View>
            </Pressable>
            <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-sm text-slate-400 mt-4">Profile Photo *</Text>
          </View>
        </FadeInView>

        {/* Personal Info */}
        <FadeInView delay={100} duration={400}>
          <GlassCard>
            <View className="flex-row items-center gap-2 mb-4">
              <Icon name="person" className="text-accent text-lg" />
              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900">Personal Information</Text>
            </View>
            <View className="gap-4">
              <View>
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[11px] uppercase tracking-widest text-slate-400 mb-2">
                  Full Name <Text className="text-accent">*</Text>
                </Text>
                <View className="h-14 rounded-2xl bg-surface-tertiary px-4 justify-center">
                  <TextInput
                    value={formData.fullName}
                    onChangeText={(value) => handleChange('fullName', value)}
                    placeholder="John Doe"
                    placeholderTextColor="#B8B8D0"
                    style={{ fontFamily: 'Inter_500Medium' }}
                    className="text-base text-primary-900"
                  />
                </View>
              </View>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[11px] uppercase tracking-widest text-slate-400 mb-2">
                    Age <Text className="text-accent">*</Text>
                  </Text>
                  <View className="h-14 rounded-2xl bg-surface-tertiary px-4 justify-center">
                    <TextInput
                      value={formData.age}
                      onChangeText={(value) => handleChange('age', value)}
                      placeholder="25"
                      placeholderTextColor="#B8B8D0"
                      keyboardType="numeric"
                      style={{ fontFamily: 'Inter_500Medium' }}
                      className="text-base text-primary-900"
                    />
                  </View>
                </View>
                <View className="flex-1">
                  <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[11px] uppercase tracking-widest text-slate-400 mb-2">
                    Gender <Text className="text-accent">*</Text>
                  </Text>
                  <Pressable onPress={() => setShowGenderPicker(true)} className="h-14 rounded-2xl bg-surface-tertiary px-4 flex-row items-center justify-between">
                    <Text style={{ fontFamily: 'Inter_500Medium' }} className={`text-base ${formData.gender ? 'text-primary-900' : 'text-[#B8B8D0]'}`}>
                      {formData.gender || 'Select'}
                    </Text>
                    <Icon name="keyboard-arrow-down" className="text-slate-400 text-xl" />
                  </Pressable>
                </View>
              </View>
              <View>
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[11px] uppercase tracking-widest text-slate-400 mb-2">
                  Experience (Years) <Text className="text-accent">*</Text>
                </Text>
                <Pressable onPress={() => setShowExperiencePicker(true)} className="h-14 rounded-2xl bg-surface-tertiary px-4 flex-row items-center justify-between">
                  <Text style={{ fontFamily: 'Inter_500Medium' }} className={`text-base ${formData.experienceYears ? 'text-primary-900' : 'text-[#B8B8D0]'}`}>
                    {formData.experienceYears ? `${formData.experienceYears} year${formData.experienceYears === '1' ? '' : 's'}` : 'Select experience'}
                  </Text>
                  <Icon name="keyboard-arrow-down" className="text-slate-400 text-xl" />
                </Pressable>
              </View>
            </View>
          </GlassCard>
        </FadeInView>

        {/* Contact Info */}
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
                    Phone <Text className="text-accent">*</Text>
                  </Text>
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

        {/* Aadhaar Verification */}
        <FadeInView delay={300} duration={400}>
          <View className="mt-3">
            <GlassCard>
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-3">
                  <View className="h-12 w-12 rounded-xl bg-accent-50 items-center justify-center">
                    <Icon name="verified_user" className="text-accent text-2xl" />
                  </View>
                  <View>
                    <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900 text-sm">Aadhaar Verification *</Text>
                    <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-xs text-slate-400 mt-0.5">Upload for verification</Text>
                  </View>
                </View>
                <Pressable onPress={handleAadhaarSelect} className="px-4 py-2 rounded-full bg-accent-50">
                  <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-accent text-xs">Upload</Text>
                </Pressable>
              </View>
              {aadhaarPreview ? (
                <View className="w-full rounded-2xl overflow-hidden">
                  <Image source={{ uri: aadhaarPreview }} className="w-full h-40" resizeMode="cover" />
                </View>
              ) : (
                <View className="w-full h-28 rounded-2xl bg-surface-tertiary border border-dashed border-slate-200 items-center justify-center">
                  <Icon name="upload-file" className="text-slate-300 text-2xl mb-1" />
                  <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-400 text-xs">No Aadhaar uploaded</Text>
                </View>
              )}
            </GlassCard>
          </View>
        </FadeInView>

        {/* Additional Photos */}
        <FadeInView delay={350} duration={400}>
          <View className="mt-3">
            <GlassCard>
              <View className="flex-row items-center justify-between mb-4">
                <View>
                  <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900 text-sm">Additional Photos *</Text>
                  <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-xs text-slate-400 mt-0.5">Upload more photos for your profile</Text>
                </View>
                <Pressable
                  onPress={handleAdditionalPhotosSelect}
                  className="px-4 py-2 rounded-full bg-accent"
                  style={{
                    shadowColor: '#E94560',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-white text-xs">Add Photos</Text>
                </Pressable>
              </View>
              {additionalPreviews.length > 0 ? (
                <View className="flex-row flex-wrap gap-2">
                  {additionalPreviews.map((src, idx) => (
                    <Image key={idx} source={{ uri: src }} className="w-[30%] h-20 rounded-xl" resizeMode="cover" />
                  ))}
                </View>
              ) : (
                <View className="w-full h-24 rounded-2xl bg-surface-tertiary border border-dashed border-slate-200 items-center justify-center">
                  <Icon name="photo-library" className="text-slate-300 text-2xl mb-1" />
                  <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-400 text-xs">No additional photos yet</Text>
                </View>
              )}
            </GlassCard>
          </View>
        </FadeInView>

        {/* Submit */}
        <FadeInView delay={400} duration={400}>
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
                  <Text style={{ fontFamily: 'Inter_700Bold' }} className={`${isFormValid ? 'text-white' : 'text-slate-400'} text-lg`}>
                    Start Finding Gigs
                  </Text>
                  {isFormValid && <Icon name="arrow_forward" className="text-white text-xl" />}
                </View>
              )}
            </Pressable>
          </View>
        </FadeInView>
      </ScrollView>

      {/* Gender Picker Modal */}
      <Modal transparent animationType="fade" visible={showGenderPicker} onRequestClose={() => setShowGenderPicker(false)}>
        <Pressable onPress={() => setShowGenderPicker(false)} className="flex-1 items-center justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <Pressable onPress={() => {}} className="w-full bg-white rounded-t-3xl" style={{ paddingBottom: insets.bottom + 16 }}>
            <View className="items-center py-3">
              <View className="w-10 h-1 rounded-full bg-slate-200" />
            </View>
            <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900 text-lg px-6 mb-3">Select Gender</Text>
            {GENDER_OPTIONS.map((option) => (
              <Pressable
                key={option}
                onPress={() => { handleChange('gender', option); setShowGenderPicker(false); }}
                className={`px-6 py-4 flex-row items-center justify-between ${formData.gender === option ? 'bg-accent/5' : ''}`}
              >
                <Text style={{ fontFamily: formData.gender === option ? 'Inter_700Bold' : 'Inter_500Medium' }} className={`text-base ${formData.gender === option ? 'text-accent' : 'text-primary-900'}`}>
                  {option}
                </Text>
                {formData.gender === option && <Icon name="check-circle" className="text-accent text-xl" />}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Experience Picker Modal */}
      <Modal transparent animationType="fade" visible={showExperiencePicker} onRequestClose={() => setShowExperiencePicker(false)}>
        <Pressable onPress={() => setShowExperiencePicker(false)} className="flex-1 items-center justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <Pressable onPress={() => {}} className="w-full bg-white rounded-t-3xl" style={{ paddingBottom: insets.bottom + 16, maxHeight: '50%' }}>
            <View className="items-center py-3">
              <View className="w-10 h-1 rounded-full bg-slate-200" />
            </View>
            <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900 text-lg px-6 mb-3">Years of Experience</Text>
            <ScrollView>
              {EXPERIENCE_OPTIONS.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => { handleChange('experienceYears', option); setShowExperiencePicker(false); }}
                  className={`px-6 py-4 flex-row items-center justify-between ${formData.experienceYears === option ? 'bg-accent/5' : ''}`}
                >
                  <Text style={{ fontFamily: formData.experienceYears === option ? 'Inter_700Bold' : 'Inter_500Medium' }} className={`text-base ${formData.experienceYears === option ? 'text-accent' : 'text-primary-900'}`}>
                    {option} year{option === '1' ? '' : 's'}
                  </Text>
                  {formData.experienceYears === option && <Icon name="check-circle" className="text-accent text-xl" />}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default WorkerOnboardingScreen;
