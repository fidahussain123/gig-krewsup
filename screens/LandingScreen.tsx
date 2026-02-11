
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import Icon from '../components/Icon';
import { FadeInView, ScalePress } from '../components/AnimatedComponents';

const LandingScreen: React.FC = () => {
  const router = useRouter();
  const { login, register } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');

    try {
      if (isLoginMode) {
        const result = await login(formData.email, formData.password);
        if (result.success) {
          router.replace('/role-selection');
        } else {
          setError(result.error || 'Login failed');
        }
      } else {
        if (!formData.name) {
          setError('Name is required');
          setIsLoading(false);
          return;
        }
        const result = await register(formData.email, formData.password, formData.name);
        if (result.success) {
          router.replace('/role-selection');
        } else {
          setError(result.error || 'Registration failed');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 32, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <FadeInView delay={0} duration={700}>
          <View className="flex-1 items-center justify-center text-center pt-8">
            <View className="mb-4 items-center">
              <View className="flex-row items-center">
                <View className="h-16 w-16 items-center justify-center">
                  <Icon name="directions-run" className="text-accent text-6xl" />
                </View>
                <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-primary text-5xl tracking-tighter -ml-3">
                  rewsUp
                </Text>
              </View>
              <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-gray-400 text-sm tracking-widest mt-2 uppercase">
                KrewsUp Technologies
              </Text>
            </View>
          </View>
        </FadeInView>

        <FadeInView delay={200} duration={500}>
          <View className="flex flex-col space-y-4">
            {!isLoginMode && (
              <TextInput
                value={formData.name}
                onChangeText={(value) => updateField('name', value)}
                placeholder="Full Name"
                style={{ fontFamily: 'Inter_500Medium' }}
                className="h-14 w-full rounded-2xl border border-gray-200 bg-white px-5 text-base"
              />
            )}
            <TextInput
              value={formData.email}
              onChangeText={(value) => updateField('email', value)}
              placeholder="Email Address"
              autoCapitalize="none"
              keyboardType="email-address"
              style={{ fontFamily: 'Inter_500Medium' }}
              className="h-14 w-full rounded-2xl border border-gray-200 bg-white px-5 text-base"
            />
            <TextInput
              value={formData.password}
              onChangeText={(value) => updateField('password', value)}
              placeholder="Password"
              secureTextEntry
              style={{ fontFamily: 'Inter_500Medium' }}
              className="h-14 w-full rounded-2xl border border-gray-200 bg-white px-5 text-base"
            />

            {error && (
              <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-red-500 text-sm text-center">{error}</Text>
            )}

            <ScalePress
              onPress={handleSubmit}
              disabled={isLoading}
              className="h-14 w-full items-center justify-center rounded-2xl bg-primary"
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-white text-lg">
                  {isLoginMode ? 'Log In' : 'Sign Up'}
                </Text>
              )}
            </ScalePress>

            <ScalePress
              onPress={() => {
                setIsLoginMode(!isLoginMode);
                setError('');
              }}
              className="h-14 w-full items-center justify-center rounded-2xl border-2 border-primary"
            >
              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary text-lg">
                {isLoginMode ? 'Create Account' : 'Already have an account?'}
              </Text>
            </ScalePress>
          </View>
        </FadeInView>

        <FadeInView delay={400} duration={400}>
          <View className="mt-8 mb-8">
            <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-center text-[10px] text-gray-400 px-4 leading-relaxed">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </Text>
          </View>
        </FadeInView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LandingScreen;
