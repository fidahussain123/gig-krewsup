
import React, { useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: horizontalPadding,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 32,
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 w-full max-w-md mx-auto">
          {/* Brand Header */}
          <FadeInView delay={0} duration={650}>
            <View className="pt-6 pb-6">
              <View className="flex-row items-center">
                <View className="h-14 w-14 rounded-2xl bg-accent items-center justify-center"
                  style={{
                    shadowColor: '#E94560',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 4,
                  }}
                >
                  <Icon name="directions-run" className="text-white text-3xl" />
                </View>
                <View className="ml-4 flex-1">
                  <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-primary text-3xl tracking-tight">
                    KrewsUp
                  </Text>
                  <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-400 text-sm">
                    Find gigs. Hire crews. Chat instantly.
                  </Text>
                </View>
              </View>

              <View className="mt-8">
                <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-primary-900 text-2xl tracking-tight">
                  {isLoginMode ? 'Welcome back' : 'Create your account'}
                </Text>
                <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-400 text-sm mt-1">
                  {isLoginMode ? 'Sign in to continue' : 'It takes less than a minute'}
                </Text>
              </View>
            </View>
          </FadeInView>

          {/* Form Card */}
          <FadeInView delay={120} duration={450}>
            <View className="bg-surface-secondary rounded-3xl p-6"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.04,
                shadowRadius: 16,
                elevation: 2,
              }}
            >
              {error ? (
                <View className="mb-4 rounded-2xl bg-error/10 px-4 py-3">
                  <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-error text-sm">
                    {error}
                  </Text>
                </View>
              ) : null}

              <View className="gap-4">
                {!isLoginMode && (
                  <View>
                    <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[11px] uppercase tracking-widest text-slate-400 mb-2">
                      Full name
                    </Text>
                    <View className="h-14 w-full rounded-2xl bg-white px-4 flex-row items-center">
                      <Icon name="person" className="text-slate-300 text-xl" />
                      <TextInput
                        ref={nameRef}
                        value={formData.name}
                        onChangeText={(value) => updateField('name', value)}
                        placeholder="John Doe"
                        placeholderTextColor="#B8B8D0"
                        style={{ fontFamily: 'Inter_500Medium' }}
                        className="flex-1 ml-3 text-base text-primary-900"
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
                  <View className="h-14 w-full rounded-2xl bg-white px-4 flex-row items-center">
                    <Icon name="mail" className="text-slate-300 text-xl" />
                    <TextInput
                      ref={emailRef}
                      value={formData.email}
                      onChangeText={(value) => updateField('email', value)}
                      placeholder="name@email.com"
                      placeholderTextColor="#B8B8D0"
                      style={{ fontFamily: 'Inter_500Medium' }}
                      className="flex-1 ml-3 text-base text-primary-900"
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
                  <View className="h-14 w-full rounded-2xl bg-white px-4 flex-row items-center">
                    <Icon name="lock" className="text-slate-300 text-xl" />
                    <TextInput
                      ref={passwordRef}
                      value={formData.password}
                      onChangeText={(value) => updateField('password', value)}
                      placeholder="Your password"
                      placeholderTextColor="#B8B8D0"
                      secureTextEntry={!showPassword}
                      style={{ fontFamily: 'Inter_500Medium' }}
                      className="flex-1 ml-3 text-base text-primary-900"
                      returnKeyType="go"
                      textContentType="password"
                      autoComplete="password"
                      onSubmitEditing={handleSubmit}
                    />
                    <Pressable
                      onPress={() => setShowPassword(v => !v)}
                      hitSlop={10}
                      className="h-10 w-10 items-center justify-center rounded-xl"
                    >
                      <Icon name={showPassword ? 'visibility-off' : 'visibility'} className="text-slate-400 text-xl" />
                    </Pressable>
                  </View>
                </View>
              </View>

              <View className="mt-6 gap-4">
                <ScalePress
                  onPress={handleSubmit}
                  disabled={isLoading}
                  className={`h-14 w-full items-center justify-center rounded-2xl ${isLoading ? 'bg-accent/60' : 'bg-accent'}`}
                  style={!isLoading ? {
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
                    <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-white text-base">
                      {isLoginMode ? 'Sign In' : 'Create Account'}
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
                >
                  <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-500 text-sm">
                    {isLoginMode ? 'New here? ' : 'Already have an account? '}
                    <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-accent">
                      {isLoginMode ? 'Create account' : 'Sign in'}
                    </Text>
                  </Text>
                </Pressable>
              </View>
            </View>
          </FadeInView>

          <FadeInView delay={260} duration={400}>
            <View className="mt-6">
              <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-center text-[11px] text-slate-400 leading-relaxed px-3">
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
