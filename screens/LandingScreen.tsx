
import React, { useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import Icon from '../components/Icon';
import { FadeInView, ScalePress } from '../components/AnimatedComponents';

const LandingScreen: React.FC = () => {
  const router = useRouter();
  const { login, register } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const nameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });

  const horizontalPadding = useMemo(() => {
    // Keep it comfortable on small phones, a bit wider on large devices.
    if (width < 360) return 16;
    if (width < 420) return 20;
    return 24;
  }, [width]);

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
      className="flex-1 bg-slate-50"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingTop: insets.top + 10,
          paddingBottom: insets.bottom + 20,
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 w-full max-w-md mx-auto">
          <FadeInView delay={0} duration={650}>
            <View className="pt-6 pb-5">
              <View className="flex-row items-center">
                <View className="h-12 w-12 rounded-2xl bg-accent/15 items-center justify-center">
                  <Icon name="directions-run" className="text-accent text-4xl" />
                </View>
                <View className="ml-3 flex-1">
                  <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-primary text-3xl tracking-tight">
                    KrewsUp
                  </Text>
                  <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-slate-400 text-sm">
                    Find gigs. Hire crews. Chat instantly.
                  </Text>
                </View>
              </View>

              <View className="mt-5">
                <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-slate-900 text-2xl tracking-tight">
                  {isLoginMode ? 'Log in' : 'Create your account'}
                </Text>
                <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-500 text-sm mt-1">
                  {isLoginMode ? 'Welcome back — let’s get you working.' : 'It takes less than a minute.'}
                </Text>
              </View>
            </View>
          </FadeInView>

          <FadeInView delay={120} duration={450}>
            <View className="bg-white rounded-3xl p-6 shadow-sm ring-1 ring-slate-100">
              {error ? (
                <View className="mb-4 rounded-2xl bg-red-50 px-4 py-3">
                  <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-red-600 text-sm">
                    {error}
                  </Text>
                </View>
              ) : null}

              <View className="space-y-4">
                {!isLoginMode && (
                  <View>
                    <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[11px] uppercase tracking-widest text-slate-400 mb-2">
                      Full name
                    </Text>
                    <View className="h-14 w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 flex-row items-center">
                      <Icon name="person" className="text-slate-400 text-2xl" />
                      <TextInput
                        ref={nameRef}
                        value={formData.name}
                        onChangeText={(value) => updateField('name', value)}
                        placeholder="John Doe"
                        placeholderTextColor="#94a3b8"
                        style={{ fontFamily: 'Inter_600SemiBold' }}
                        className="flex-1 ml-3 text-base text-slate-900"
                        returnKeyType="next"
                        autoCapitalize="words"
                        onSubmitEditing={() => emailRef.current?.focus()}
                      />
                    </View>
                  </View>
                )}

                <View>
                  <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[11px] uppercase tracking-widest text-slate-400 mb-2">
                    Email
                  </Text>
                  <View className="h-14 w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 flex-row items-center">
                    <Icon name="mail" className="text-slate-400 text-2xl" />
                    <TextInput
                      ref={emailRef}
                      value={formData.email}
                      onChangeText={(value) => updateField('email', value)}
                      placeholder="name@email.com"
                      placeholderTextColor="#94a3b8"
                      style={{ fontFamily: 'Inter_600SemiBold' }}
                      className="flex-1 ml-3 text-base text-slate-900"
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      returnKeyType="next"
                      textContentType="emailAddress"
                      autoComplete="email"
                      onSubmitEditing={() => passwordRef.current?.focus()}
                    />
                  </View>
                </View>

                <View>
                  <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[11px] uppercase tracking-widest text-slate-400 mb-2">
                    Password
                  </Text>
                  <View className="h-14 w-full rounded-2xl border border-slate-100 bg-slate-50 px-4 flex-row items-center">
                    <Icon name="lock" className="text-slate-400 text-2xl" />
                    <TextInput
                      ref={passwordRef}
                      value={formData.password}
                      onChangeText={(value) => updateField('password', value)}
                      placeholder="Your password"
                      placeholderTextColor="#94a3b8"
                      secureTextEntry={!showPassword}
                      style={{ fontFamily: 'Inter_600SemiBold' }}
                      className="flex-1 ml-3 text-base text-slate-900"
                      returnKeyType="go"
                      textContentType="password"
                      autoComplete="password"
                      onSubmitEditing={handleSubmit}
                    />
                    <Pressable
                      onPress={() => setShowPassword(v => !v)}
                      hitSlop={10}
                      className="h-10 w-10 items-center justify-center rounded-xl"
                      accessibilityRole="button"
                      accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <Icon name={showPassword ? 'visibility-off' : 'visibility'} className="text-slate-500 text-2xl" />
                    </Pressable>
                  </View>
                </View>
              </View>

              <View className="mt-6 space-y-4">
                <ScalePress
                  onPress={handleSubmit}
                  disabled={isLoading}
                  className={`h-14 w-full items-center justify-center rounded-2xl ${isLoading ? 'bg-primary/60' : 'bg-primary'}`}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-white text-base tracking-tight">
                      {isLoginMode ? 'Continue' : 'Create account'}
                    </Text>
                  )}
                </ScalePress>

                <Pressable
                  onPress={() => {
                    setIsLoginMode(!isLoginMode);
                    setError('');
                    setShowPassword(false);
                  }}
                  className="items-center justify-center py-2"
                  accessibilityRole="button"
                >
                  <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-slate-600 text-sm">
                    {isLoginMode ? 'New here? ' : 'Already have an account? '}
                    <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-primary">
                      {isLoginMode ? 'Create account' : 'Log in'}
                    </Text>
                  </Text>
                </Pressable>
              </View>
            </View>
          </FadeInView>

          <FadeInView delay={260} duration={400}>
            <View className="mt-6">
              <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-center text-[11px] text-slate-400 leading-relaxed px-3">
                By continuing, you agree to our Terms of Service and Privacy Policy.
              </Text>
            </View>
          </FadeInView>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LandingScreen;
