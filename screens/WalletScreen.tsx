import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from '../components/Icon';
import api from '../lib/api';

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
    <View className="flex-1 bg-slate-50">
      <View
        className="bg-white border-b border-slate-100 px-4 pb-4"
        style={{ paddingTop: insets.top + 12 }}
      >
        <View className="flex-row items-center justify-between">
          {isWorker ? (
            <View className="w-12" />
          ) : (
            <Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full">
              <Icon name="arrow_back_ios_new" className="text-xl text-slate-700" />
            </Pressable>
          )}
          <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-lg text-slate-900">
            {isWorker ? 'Wallet' : 'Wallet & Billing'}
          </Text>
          <View className="w-12" />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 20,
          paddingBottom: 32 + insets.bottom,
        }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#008080" />
        }
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-primary rounded-2xl px-5 pt-5 pb-6 shadow-lg" style={{ shadowColor: '#008080', shadowOpacity: 0.2, shadowRadius: 12, elevation: 4 }}>
          <View className="flex-row items-center justify-between mb-2">
            <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-white/80 text-xs uppercase tracking-wider">
              {mainLabel}
            </Text>
            <View className="h-9 w-9 rounded-full bg-white/15 items-center justify-center">
              <Icon name="account_balance_wallet" className="text-white" size={20} />
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
            <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-white/90 text-xs mb-3">{error}</Text>
          )}
          <Pressable className="bg-white rounded-xl py-3 flex-row items-center justify-center gap-2">
            <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary text-sm">{isWorker ? 'Withdraw' : 'Add Funds'}</Text>
            <Icon name="arrow_forward" className="text-primary" size={18} />
          </Pressable>
        </View>

        {isWorker && (
          <>
            <View className="flex-row items-center justify-between mt-6 mb-3">
              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-slate-800 text-base">Applications</Text>
              <Pressable onPress={() => router.push('/worker/applications')} className="py-1">
                <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-primary text-sm">View all</Text>
              </Pressable>
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1 bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-slate-400 text-xs uppercase tracking-wider mb-1">Total</Text>
                <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-2xl text-slate-900">{appStats.total}</Text>
                <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-500 text-xs mt-0.5">applications</Text>
              </View>
              <View className="flex-1 bg-white rounded-xl p-4 border border-green-100 shadow-sm">
                <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-green-600 text-xs uppercase tracking-wider mb-1">Accepted</Text>
                <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-2xl text-green-700">{appStats.accepted}</Text>
                <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-500 text-xs mt-0.5">confirmed</Text>
              </View>
            </View>
            <View className="flex-row gap-3 mt-3">
              <View className="flex-1 bg-white rounded-xl p-4 border border-amber-100 shadow-sm">
                <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-amber-600 text-xs uppercase tracking-wider mb-1">Pending</Text>
                <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-2xl text-amber-700">{appStats.pending}</Text>
                <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-500 text-xs mt-0.5">awaiting</Text>
              </View>
              <View className="flex-1 bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-slate-400 text-xs uppercase tracking-wider mb-1">Rejected</Text>
                <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-2xl text-slate-600">{appStats.rejected}</Text>
                <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-500 text-xs mt-0.5">declined</Text>
              </View>
            </View>
          </>
        )}

        {role === 'organizer' && (
          <>
            <View className="flex-row gap-4 mt-6">
              <View className="flex-1 bg-white p-6 rounded-3xl shadow-sm ring-1 ring-slate-100">
                <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Jobs Completed</Text>
                <Text className="text-2xl font-extrabold text-slate-900">12</Text>
              </View>
              <View className="flex-1 bg-white p-6 rounded-3xl shadow-sm ring-1 ring-slate-100">
                <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Avg. Per Gig</Text>
                <Text className="text-2xl font-extrabold text-slate-900">$103.30</Text>
              </View>
            </View>

            <View className="space-y-6 mt-6">
              <View className="flex-row items-center justify-between">
                <Text className="text-xl font-extrabold text-slate-900">Payment History</Text>
                <Pressable>
                  <Text className="text-primary text-sm font-bold">View All</Text>
                </Pressable>
              </View>
              <View className="space-y-4">
                {[
                  { title: 'Tech Conference 2024', date: 'Oct 12', val: '245.00', status: 'Paid', icon: 'check_circle' },
                  { title: 'Luxury Gala Hosting', date: 'Oct 10', val: '150.00', status: 'Processing', icon: 'sync' },
                  { title: 'Private Wedding Setup', date: 'Oct 08', val: '320.00', status: 'Paid', icon: 'check_circle' }
                ].map((tx, idx) => (
                  <View key={idx} className="flex-row items-center gap-4 bg-white p-5 rounded-3xl shadow-sm ring-1 ring-slate-100">
                    <View className={`h-14 w-14 rounded-2xl items-center justify-center ${
                      tx.status === 'Paid' ? 'bg-primary/5' : 'bg-accent/10'
                    }`}>
                      <Icon name={tx.icon} className={`${tx.status === 'Paid' ? 'text-primary' : 'text-yellow-700'} text-3xl`} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-extrabold text-slate-900" numberOfLines={1}>{tx.title}</Text>
                      <Text className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{tx.date} • 8.5 Hours</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-lg font-extrabold text-slate-900">+{role === 'organizer' ? '-' : ''}${tx.val}</Text>
                      <Text className={`mt-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest ${
                        tx.status === 'Paid' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-yellow-700'
                      }`}>
                        {tx.status}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            <View className="bg-white p-7 rounded-3xl shadow-sm ring-1 ring-slate-100 mt-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-sm font-extrabold text-slate-900">Earnings Trends</Text>
                <Text className="text-[10px] font-extrabold text-primary bg-primary/5 px-3 py-1.5 rounded-xl uppercase tracking-widest">
                  +12% vs last week
                </Text>
              </View>
              <View className="h-40 w-full items-center justify-center bg-slate-50 rounded-2xl">
                <Text className="text-slate-400 text-sm">Chart not available on mobile yet.</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default WalletScreen;
