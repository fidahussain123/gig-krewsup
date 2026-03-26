import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../components/Icon';
import api from '../lib/api';
import { FadeInView, ScalePress } from '../components/AnimatedComponents';
import { StatCard, GlassCard } from '../components/DistrictUI';

interface WalletScreenProps {
  role: 'organizer' | 'worker';
}

const WalletScreen: React.FC<WalletScreenProps> = ({ role }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [pendingTotal, setPendingTotal] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [appStats, setAppStats] = useState<{ total: number; accepted: number; pending: number; rejected: number }>({
    total: 0,
    accepted: 0,
    pending: 0,
    rejected: 0,
  });

  const loadSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await api.getWalletSummary();
    if (result.data) {
      setPendingTotal(result.data.pendingTotal ?? 0);
    } else if (result.error) {
      setError(result.error);
    }
    setIsLoading(false);
  }, []);

  const loadAppStats = useCallback(async () => {
    if (role !== 'worker') return;
    const result = await api.getMyEventApplicationsDetails();
    if (result.data?.applications) {
      const apps = result.data.applications as { status: string }[];
      setAppStats({
        total: apps.length,
        accepted: apps.filter(a => a.status === 'accepted').length,
        pending: apps.filter(a => a.status === 'pending').length,
        rejected: apps.filter(a => a.status === 'rejected').length,
      });
    }
  }, [role]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([loadSummary(), loadAppStats()]);
    setIsRefreshing(false);
  }, [loadSummary, loadAppStats]);

  useEffect(() => {
    loadSummary().catch(() => undefined);
    loadAppStats().catch(() => undefined);
  }, [loadSummary, loadAppStats]);

  const displayAmount = pendingTotal ?? 0;
  const mainLabel = role === 'organizer' ? 'Pending To Pay' : 'Pending Earnings';
  const isWorker = role === 'worker';

  return (
    <View className="flex-1 bg-surface-secondary">
      <View className="bg-white" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center justify-between px-5 py-3">
          {!isWorker ? (
            <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full">
              <Icon name="arrow_back_ios_new" className="text-xl text-primary-900" />
            </Pressable>
          ) : (
            <View className="w-10" />
          )}
          <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-lg text-primary-900">
            {isWorker ? 'Wallet' : 'Wallet & Billing'}
          </Text>
          <View className="w-10" />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 32 + insets.bottom + 80,
        }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#E94560" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Wallet Card */}
        <FadeInView delay={0} duration={400}>
          <View className="rounded-3xl overflow-hidden" style={{
            shadowColor: '#1A1A2E',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 8,
          }}>
            <LinearGradient
              colors={['#1A1A2E', '#16213E', '#0F3460']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="px-6 pt-6 pb-7"
            >
              <View className="flex-row items-center justify-between mb-3">
                <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-white/60 text-xs uppercase tracking-wider">
                  {mainLabel}
                </Text>
                <View className="h-9 w-9 rounded-full bg-white/10 items-center justify-center">
                  <Icon name="account-balance-wallet" className="text-white" size={18} />
                </View>
              </View>
              {isLoading && pendingTotal === null ? (
                <ActivityIndicator color="#fff" size="large" style={{ marginVertical: 24 }} />
              ) : (
                <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-4xl text-white tracking-tight mb-5">
                  ₹{displayAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </Text>
              )}
              {error && (
                <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-white/80 text-xs mb-3">{error}</Text>
              )}
              <Pressable className="bg-accent rounded-2xl py-3 flex-row items-center justify-center gap-2"
                style={{
                  shadowColor: '#E94560',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-white text-sm">{isWorker ? 'Withdraw' : 'Add Funds'}</Text>
                <Icon name="arrow_forward" className="text-white" size={16} />
              </Pressable>
            </LinearGradient>
          </View>
        </FadeInView>

        {isWorker && (
          <FadeInView delay={150} duration={400}>
            <View className="flex-row items-center justify-between mt-6 mb-3">
              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900 text-base">Applications</Text>
              <Pressable onPress={() => router.push('/worker/applications')} className="py-1">
                <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-accent text-sm">View all</Text>
              </Pressable>
            </View>
            <View className="flex-row gap-3">
              <StatCard label="Total" value={String(appStats.total)} icon="assignment" color="accent" />
              <StatCard label="Accepted" value={String(appStats.accepted)} icon="check-circle" color="success" />
            </View>
            <View className="flex-row gap-3 mt-3">
              <StatCard label="Pending" value={String(appStats.pending)} icon="schedule" color="warning" />
              <StatCard label="Declined" value={String(appStats.rejected)} icon="cancel" color="accent" />
            </View>
          </FadeInView>
        )}

        {role === 'organizer' && (
          <FadeInView delay={150} duration={400}>
            <View className="flex-row gap-3 mt-6">
              <GlassCard className="flex-1">
                <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-slate-400 text-[10px] uppercase tracking-wider mb-2">Jobs Done</Text>
                <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-2xl text-primary-900">12</Text>
              </GlassCard>
              <GlassCard className="flex-1">
                <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-slate-400 text-[10px] uppercase tracking-wider mb-2">Avg. Per Gig</Text>
                <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-2xl text-primary-900">$103</Text>
              </GlassCard>
            </View>

            <View className="mt-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900 text-lg">Payment History</Text>
                <Pressable>
                  <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-accent text-sm">View All</Text>
                </Pressable>
              </View>
              <View className="gap-3">
                {[
                  { title: 'Tech Conference 2024', date: 'Oct 12', val: '245.00', status: 'Paid', icon: 'check_circle' },
                  { title: 'Luxury Gala Hosting', date: 'Oct 10', val: '150.00', status: 'Processing', icon: 'sync' },
                  { title: 'Private Wedding Setup', date: 'Oct 08', val: '320.00', status: 'Paid', icon: 'check_circle' }
                ].map((tx, idx) => (
                  <GlassCard key={idx}>
                    <View className="flex-row items-center gap-4">
                      <View className={`h-12 w-12 rounded-2xl items-center justify-center ${
                        tx.status === 'Paid' ? 'bg-accent-50' : 'bg-amber-50'
                      }`}>
                        <Icon name={tx.icon} className={`${tx.status === 'Paid' ? 'text-accent' : 'text-warning'} text-2xl`} />
                      </View>
                      <View className="flex-1">
                        <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900" numberOfLines={1}>{tx.title}</Text>
                        <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-xs text-slate-400 mt-0.5">{tx.date}</Text>
                      </View>
                      <View className="items-end">
                        <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900">-${tx.val}</Text>
                        <View className={`mt-1 px-2 py-0.5 rounded-full ${
                          tx.status === 'Paid' ? 'bg-accent-50' : 'bg-amber-50'
                        }`}>
                          <Text style={{ fontFamily: 'Inter_700Bold' }} className={`text-[9px] uppercase ${
                            tx.status === 'Paid' ? 'text-accent' : 'text-warning'
                          }`}>{tx.status}</Text>
                        </View>
                      </View>
                    </View>
                  </GlassCard>
                ))}
              </View>
            </View>
          </FadeInView>
        )}
      </ScrollView>
    </View>
  );
};

export default WalletScreen;
