
import React, { useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import Icon from '../components/Icon';
import { FadeInView, ScalePress } from '../components/AnimatedComponents';
import { auth } from '../lib/firebase';

const LandingScreen: React.FC = () => {
  const router = useRouter();
  const { loginWithPhone, registerWithPhone } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [confirmation, setConfirmation] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [otpVerifiedToast, setOtpVerifiedToast] = useState(false);

  const nameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const otpRef = useRef<TextInput>(null);

  const [formData, setFormData] = useState({ phone: '', otp: '', name: '' });

  const horizontalPadding = useMemo(() => {
    if (width < 360) return 16;
    if (width < 420) return 20;
    return 24;
  }, [width]);

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const resetForm = () => {
    setFormData({ phone: '', otp: '', name: '' });
    setOtpSent(false);
    setConfirmation(null);
    setError('');
  };

  const sendOTP = async () => {
    if (formData.phone.length !== 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    if (!isLoginMode && !formData.name.trim()) {
      setError('Name is required');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const fullPhone = `+91${formData.phone}`;
      const confirmResult = await auth().signInWithPhoneNumber(fullPhone);
      setConfirmation(confirmResult);
      setOtpSent(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to send OTP. Check the number and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (formData.otp.length !== 6) {
      setError('Enter the 6-digit OTP');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await confirmation.confirm(formData.otp);
      const idToken = await auth().currentUser?.getIdToken();
      if (!idToken) throw new Error('Failed to get Firebase token');

      // Show "OTP Verified" toast for 2 seconds, then call API
      setOtpVerifiedToast(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setOtpVerifiedToast(false);

      const result = isLoginMode
        ? await loginWithPhone(idToken)
        : await registerWithPhone(idToken, formData.name.trim(), `+91${formData.phone}`);

      setModalSuccess(result.success);
      setModalMessage(
        result.success
          ? isLoginMode ? 'Signed in successfully!' : 'Account created successfully!'
          : result.error || 'Verification failed. Please try again.'
      );
      setModalVisible(true);
    } catch (e: any) {
      setOtpVerifiedToast(false);
      setModalSuccess(false);
      setModalMessage('Invalid OTP. Please try again.');
      setModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    if (modalSuccess) {
      router.replace('/role-selection');
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
                <View
                  className="h-14 w-14 rounded-2xl bg-accent items-center justify-center"
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
                  {otpSent
                    ? `OTP sent to +91 ${formData.phone}`
                    : isLoginMode ? 'Sign in to continue' : 'It takes less than a minute'}
                </Text>
              </View>
            </View>
          </FadeInView>

          {/* Form Card */}
          <FadeInView delay={120} duration={450}>
            <View
              className="bg-surface-secondary rounded-3xl p-6"
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
                {/* Name — register only, step 1 */}
                {!isLoginMode && !otpSent && (
                  <View>
                    <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[11px] uppercase tracking-widest text-slate-400 mb-2">
                      Full name
                    </Text>
                    <View className="h-14 w-full rounded-2xl bg-white px-4 flex-row items-center">
                      <Icon name="person" className="text-slate-300 text-xl" />
                      <TextInput
                        ref={nameRef}
                        value={formData.name}
                        onChangeText={v => updateField('name', v)}
                        placeholder="John Doe"
                        placeholderTextColor="#B8B8D0"
                        style={{ fontFamily: 'Inter_500Medium' }}
                        className="flex-1 ml-3 text-base text-primary-900"
                        returnKeyType="next"
                        autoCapitalize="words"
                        onSubmitEditing={() => phoneRef.current?.focus()}
                      />
                    </View>
                  </View>
                )}

                {/* Phone number — step 1 only */}
                {!otpSent && (
                  <View>
                    <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[11px] uppercase tracking-widest text-slate-400 mb-2">
                      Mobile number
                    </Text>
                    <View className="h-14 w-full rounded-2xl bg-white px-4 flex-row items-center">
                      <Icon name="phone" className="text-slate-300 text-xl" />
                      <View className="ml-3 mr-1 h-full justify-center">
                        <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-primary-900 text-base">
                          +91
                        </Text>
                      </View>
                      <View className="w-px h-5 bg-slate-200 mx-2" />
                      <TextInput
                        ref={phoneRef}
                        value={formData.phone}
                        onChangeText={v => updateField('phone', v.replace(/[^0-9]/g, '').slice(0, 10))}
                        placeholder="9876543210"
                        placeholderTextColor="#B8B8D0"
                        style={{ fontFamily: 'Inter_500Medium' }}
                        className="flex-1 text-base text-primary-900"
                        keyboardType="phone-pad"
                        returnKeyType="done"
                        maxLength={10}
                        onSubmitEditing={sendOTP}
                      />
                    </View>
                  </View>
                )}

                {/* OTP — step 2 only */}
                {otpSent && (
                  <View>
                    <View className="flex-row items-center justify-between mb-2">
                      <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[11px] uppercase tracking-widest text-slate-400">
                        Enter OTP
                      </Text>
                      <Pressable onPress={sendOTP}>
                        <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-accent text-xs">
                          Resend OTP
                        </Text>
                      </Pressable>
                    </View>
                    <View className="h-14 w-full rounded-2xl bg-white px-4 flex-row items-center">
                      <Icon name="lock" className="text-slate-300 text-xl" />
                      <TextInput
                        ref={otpRef}
                        value={formData.otp}
                        onChangeText={v => updateField('otp', v.replace(/[^0-9]/g, '').slice(0, 6))}
                        placeholder="6-digit OTP"
                        placeholderTextColor="#B8B8D0"
                        style={{ fontFamily: 'Inter_500Medium' }}
                        className="flex-1 ml-3 text-base text-primary-900 tracking-widest"
                        keyboardType="number-pad"
                        returnKeyType="go"
                        maxLength={6}
                        onSubmitEditing={verifyOTP}
                        autoFocus
                      />
                    </View>
                    <Pressable onPress={resetForm} className="mt-2">
                      <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-400 text-xs">
                        Wrong number?{' '}
                        <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-accent">
                          Change
                        </Text>
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>

              <View className="mt-6 gap-4">
                <ScalePress
                  onPress={otpSent ? verifyOTP : sendOTP}
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
                      {otpSent ? 'Verify OTP' : isLoginMode ? 'Send OTP' : 'Send OTP'}
                    </Text>
                  )}
                </ScalePress>

                <Pressable
                  onPress={() => {
                    setIsLoginMode(!isLoginMode);
                    resetForm();
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

      {/* OTP Verified Toast */}
      {otpVerifiedToast && (
        <View
          style={{
            position: 'absolute',
            top: insets.top + 16,
            left: 24,
            right: 24,
            backgroundColor: '#22c55e',
            borderRadius: 16,
            paddingVertical: 14,
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            zIndex: 100,
            shadowColor: '#22c55e',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 12,
            elevation: 10,
          }}
        >
          <Icon name="check-circle" className="text-white text-xl" />
          <Text style={{ fontFamily: 'Inter_700Bold', color: '#fff', fontSize: 15, marginLeft: 10 }}>
            OTP Verified Successfully
          </Text>
        </View>
      )}

      {/* Success / Failure Modal */}
      <Modal transparent animationType="fade" visible={modalVisible} onRequestClose={handleModalClose}>
        <View className="flex-1 items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <View
            className="bg-white rounded-3xl mx-8 p-8 items-center"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.15,
              shadowRadius: 24,
              elevation: 12,
              width: width - horizontalPadding * 2,
            }}
          >
            {/* Icon */}
            <View
              className={`h-20 w-20 rounded-full items-center justify-center mb-5 ${modalSuccess ? 'bg-green-100' : 'bg-error/10'}`}
            >
              <Icon
                name={modalSuccess ? 'check-circle' : 'error'}
                className={`text-5xl ${modalSuccess ? 'text-green-500' : 'text-error'}`}
              />
            </View>

            <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-primary-900 text-xl mb-2">
              {modalSuccess ? 'Success!' : 'Failed'}
            </Text>
            <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-500 text-sm text-center leading-relaxed mb-6">
              {modalMessage}
            </Text>

            <ScalePress
              onPress={handleModalClose}
              className={`h-12 w-full items-center justify-center rounded-2xl ${modalSuccess ? 'bg-green-500' : 'bg-accent'}`}
            >
              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-white text-base">
                {modalSuccess ? 'Continue' : 'Try Again'}
              </Text>
            </ScalePress>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default LandingScreen;
