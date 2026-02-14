
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

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadSummary();
    setIsRefreshing(false);
  }, [loadSummary]);

  useEffect(() => {
    loadSummary().catch(() => undefined);
  }, [loadSummary]);

  const displayAmount = pendingTotal ?? 0;
  const mainLabel = role === 'organizer' ? 'Pending To Pay' : 'Pending Earnings';

  return (
    <View className="flex-1 bg-slate-50">
      <View className="bg-white px-6 pb-6 flex-row items-center justify-between border-b border-slate-100" style={{ paddingTop: insets.top + 12 }}>
        <Pressable onPress={() => router.back()} className="h-12 w-12 items-center justify-center rounded-full">
          <Icon name="arrow_back_ios_new" className="text-2xl text-slate-700" />
        </Pressable>
        <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-xl text-slate-900 tracking-tight">
          {role === 'organizer' ? 'Wallet & Billing' : 'Worker Earnings'}
        </Text>
        <Pressable className="h-12 w-12 items-center justify-center rounded-full">
          <Icon name="filter-list" className="text-2xl text-primary" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-6 py-8"
        contentContainerStyle={{ paddingBottom: 24 + insets.bottom }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#008080" />
        }
      >
        <View className="bg-primary p-8 rounded-3xl shadow-2xl shadow-primary/30">
          <View className="flex-row items-center justify-between mb-3">
            <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-white/80 text-sm uppercase tracking-widest">
              {mainLabel}
            </Text>
            <Icon name="account_balance_wallet" className="text-white/60" />
          </View>
          <View className="flex-row items-end justify-between mb-6">
            {isLoading && pendingTotal === null ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-5xl tracking-tight text-white">
                ₹{displayAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </Text>
            )}
            {error && (
              <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-xs text-white/80 max-w-[45%] text-right">
                {error}
              </Text>
            )}
          </View>
          <View className="flex-row items-center justify-between gap-6">
            <View className="flex-1">
              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-white/70 text-[10px] uppercase tracking-widest mb-1.5">
                Pending
              </Text>
              <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-xl text-white">
                ₹{displayAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </Text>
            </View>
            <Pressable className="bg-accent px-8 py-3.5 rounded-2xl">
              <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-slate-900 text-sm">
                {role === 'organizer' ? 'Add Funds' : 'Withdraw'}
              </Text>
            </Pressable>
          </View>
        </View>

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
