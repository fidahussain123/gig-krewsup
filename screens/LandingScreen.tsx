
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import Icon from '../components/Icon';

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
        <View className="flex-1 items-center justify-center text-center pt-8">
          <View className="mb-4 items-center">
            <View className="flex-row items-center">
              <View className="h-16 w-16 items-center justify-center">
                <Icon name="directions-run" className="text-accent text-6xl" />
              </View>
              <Text className="text-primary text-5xl font-extrabold tracking-tighter -ml-3">
                rewsUp
              </Text>
            </View>
            <Text className="text-gray-400 text-sm font-semibold tracking-widest mt-2 uppercase">
              KrewsUp Technologies
            </Text>
          </View>
        </View>

        <View className="flex flex-col space-y-4">
          {!isLoginMode && (
            <TextInput
              value={formData.name}
              onChangeText={(value) => updateField('name', value)}
              placeholder="Full Name"
              className="h-14 w-full rounded-2xl border border-gray-200 bg-white px-5 text-base font-medium"
            />
          )}
          <TextInput
            value={formData.email}
            onChangeText={(value) => updateField('email', value)}
            placeholder="Email Address"
            autoCapitalize="none"
            keyboardType="email-address"
            className="h-14 w-full rounded-2xl border border-gray-200 bg-white px-5 text-base font-medium"
          />
          <TextInput
            value={formData.password}
            onChangeText={(value) => updateField('password', value)}
            placeholder="Password"
            secureTextEntry
            className="h-14 w-full rounded-2xl border border-gray-200 bg-white px-5 text-base font-medium"
          />

          {error && (
            <Text className="text-red-500 text-sm font-medium text-center">{error}</Text>
          )}

          <Pressable
            onPress={handleSubmit}
            disabled={isLoading}
            className="h-14 w-full items-center justify-center rounded-2xl bg-primary"
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white text-lg font-bold">
                {isLoginMode ? 'Log In' : 'Sign Up'}
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => {
              setIsLoginMode(!isLoginMode);
              setError('');
            }}
            className="h-14 w-full items-center justify-center rounded-2xl border-2 border-primary"
          >
            <Text className="text-primary text-lg font-bold">
              {isLoginMode ? 'Create Account' : 'Already have an account?'}
            </Text>
          </Pressable>
        </View>

        <View className="mt-8 mb-8">
          <Text className="text-center text-[10px] text-gray-400 font-bold px-4 leading-relaxed">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LandingScreen;
