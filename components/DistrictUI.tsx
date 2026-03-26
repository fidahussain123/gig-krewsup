import React from 'react';
import { View, Text, Image, Pressable, TextInput, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import Icon from './Icon';

// ─── Section Header ─────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  onViewAll?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, onViewAll }) => (
  <View className="flex-row items-center justify-between px-5 mb-4">
    <View>
      <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-xl text-primary-900 tracking-tight">
        {title}
      </Text>
      {subtitle && (
        <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-sm text-slate-400 mt-0.5">
          {subtitle}
        </Text>
      )}
    </View>
    {onViewAll && (
      <Pressable onPress={onViewAll} className="flex-row items-center gap-1 px-3 py-1.5 rounded-full bg-accent-50">
        <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-accent text-xs">View all</Text>
        <Icon name="arrow_forward" className="text-accent text-sm" />
      </Pressable>
    )}
  </View>
);

// ─── Featured Card (Large Hero Carousel Card) ───────────────
interface FeaturedCardProps {
  imageUrl?: string;
  title: string;
  subtitle?: string;
  tag?: string;
  pay?: string;
  onPress?: () => void;
}

export const FeaturedCard: React.FC<FeaturedCardProps> = ({
  imageUrl, title, subtitle, tag, pay, onPress,
}) => (
  <Pressable
    onPress={onPress}
    className="mx-5 rounded-3xl overflow-hidden"
    style={{
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 8,
    }}
  >
    <View className="relative h-56 bg-primary-dark">
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} resizeMode="cover" className="w-full h-full" />
      ) : (
        <View className="w-full h-full bg-primary-light items-center justify-center">
          <Icon name="event" className="text-white/20 text-6xl" />
        </View>
      )}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.75)']}
        className="absolute bottom-0 left-0 right-0 h-32"
      />
      {tag && (
        <View className="absolute top-4 left-4 bg-accent px-3 py-1.5 rounded-full">
          <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-white text-[10px] uppercase tracking-widest">
            {tag}
          </Text>
        </View>
      )}
      {pay && (
        <View className="absolute top-4 right-4 bg-white/95 px-3 py-1.5 rounded-full">
          <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-primary text-sm">
            {pay}
          </Text>
        </View>
      )}
      <View className="absolute bottom-5 left-5 right-5">
        <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-white text-xl" numberOfLines={2}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-white/70 text-sm mt-1" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  </Pressable>
);

// ─── Horizontal Event Card ──────────────────────────────────
interface HorizontalCardProps {
  imageUrl?: string;
  title: string;
  subtitle?: string;
  tag?: string;
  meta?: string;
  onPress?: () => void;
  width?: number;
}

export const HorizontalCard: React.FC<HorizontalCardProps> = ({
  imageUrl, title, subtitle, tag, meta, onPress, width = 200,
}) => (
  <Pressable
    onPress={onPress}
    style={{
      width,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    }}
    className="rounded-2xl bg-white overflow-hidden mr-4"
  >
    <View className="relative h-32 bg-surface-tertiary">
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} resizeMode="cover" className="w-full h-full" />
      ) : (
        <View className="w-full h-full items-center justify-center bg-primary-50">
          <Icon name="event" className="text-primary-200 text-4xl" />
        </View>
      )}
      {tag && (
        <View className="absolute top-2.5 left-2.5 bg-accent/90 px-2.5 py-1 rounded-full">
          <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-white text-[9px] uppercase tracking-wider">
            {tag}
          </Text>
        </View>
      )}
    </View>
    <View className="p-3">
      <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900 text-sm" numberOfLines={1}>
        {title}
      </Text>
      {subtitle && (
        <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-400 text-xs mt-1" numberOfLines={1}>
          {subtitle}
        </Text>
      )}
      {meta && (
        <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-accent text-xs mt-1.5">
          {meta}
        </Text>
      )}
    </View>
  </Pressable>
);

// ─── Category Chip ──────────────────────────────────────────
interface CategoryChipProps {
  icon: string;
  label: string;
  isActive?: boolean;
  onPress?: () => void;
}

export const CategoryChip: React.FC<CategoryChipProps> = ({
  icon, label, isActive, onPress,
}) => (
  <Pressable
    onPress={onPress}
    className={`items-center justify-center px-4 py-3 rounded-2xl mr-3 ${
      isActive ? 'bg-accent' : 'bg-white'
    }`}
    style={!isActive ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    } : undefined}
  >
    <View className={`h-12 w-12 rounded-xl items-center justify-center mb-2 ${
      isActive ? 'bg-white/20' : 'bg-surface-tertiary'
    }`}>
      <Icon name={icon} className={`${isActive ? 'text-white' : 'text-primary-400'} text-2xl`} />
    </View>
    <Text
      style={{ fontFamily: 'Inter_600SemiBold' }}
      className={`text-[11px] ${isActive ? 'text-white' : 'text-slate-600'}`}
    >
      {label}
    </Text>
  </Pressable>
);

// ─── Search Bar (District-style) ────────────────────────────
interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onPress?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search events, gigs...', value, onChangeText, onPress,
}) => (
  <Pressable
    onPress={onPress}
    className="mx-5 h-13 flex-row items-center bg-surface-tertiary rounded-2xl px-4"
    style={{
      height: 52,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    }}
  >
    <Icon name="search" className="text-slate-400 text-xl mr-3" />
    {onChangeText ? (
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        style={{ fontFamily: 'Inter_500Medium', flex: 1, fontSize: 15 }}
        className="text-primary-900"
      />
    ) : (
      <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-400 text-[15px] flex-1">
        {placeholder}
      </Text>
    )}
    <View className="h-8 w-8 rounded-xl bg-accent items-center justify-center">
      <Icon name="tune" className="text-white text-base" />
    </View>
  </Pressable>
);

// ─── Stat Card ──────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  color?: 'accent' | 'brand' | 'success' | 'warning';
}

export const StatCard: React.FC<StatCardProps> = ({
  label, value, icon, color = 'accent',
}) => {
  const colorMap = {
    accent: { bg: 'bg-accent-50', icon: 'text-accent', border: 'border-accent-100' },
    brand: { bg: 'bg-brand-50', icon: 'text-brand', border: 'border-brand-100' },
    success: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-100' },
    warning: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-100' },
  };
  const c = colorMap[color];

  return (
    <View
      className={`flex-1 bg-white rounded-2xl p-4 border ${c.border}`}
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View className={`h-10 w-10 rounded-xl ${c.bg} items-center justify-center mb-3`}>
        <Icon name={icon} className={`${c.icon} text-xl`} />
      </View>
      <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-2xl text-primary-900">
        {value}
      </Text>
      <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-400 text-xs mt-0.5">
        {label}
      </Text>
    </View>
  );
};

// ─── Glass Card ─────────────────────────────────────────────
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: ViewStyle;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', style }) => (
  <View
    className={`bg-white rounded-3xl p-5 ${className}`}
    style={[{
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 16,
      elevation: 4,
    }, style]}
  >
    {children}
  </View>
);

// ─── Pill Tab ───────────────────────────────────────────────
interface PillTabsProps {
  tabs: string[];
  activeIndex: number;
  onTabPress: (index: number) => void;
}

export const PillTabs: React.FC<PillTabsProps> = ({ tabs, activeIndex, onTabPress }) => (
  <View className="flex-row bg-surface-tertiary rounded-2xl p-1 mx-5">
    {tabs.map((tab, idx) => (
      <Pressable
        key={tab}
        onPress={() => onTabPress(idx)}
        className={`flex-1 py-2.5 rounded-xl ${activeIndex === idx ? 'bg-white' : ''}`}
        style={activeIndex === idx ? {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
          elevation: 2,
        } : undefined}
      >
        <Text
          style={{ fontFamily: activeIndex === idx ? 'Inter_700Bold' : 'Inter_500Medium' }}
          className={`text-center text-sm ${activeIndex === idx ? 'text-primary-900' : 'text-slate-400'}`}
        >
          {tab}
        </Text>
      </Pressable>
    ))}
  </View>
);

// ─── Action Button (CTA) ───────────────────────────────────
interface ActionButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'accent' | 'outline';
  icon?: string;
  loading?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  label, onPress, disabled, variant = 'accent', icon, loading,
}) => {
  const bgClass = variant === 'accent'
    ? 'bg-accent'
    : variant === 'primary'
    ? 'bg-primary'
    : 'bg-white border-2 border-primary-100';

  const textClass = variant === 'outline' ? 'text-primary-900' : 'text-white';
  const iconClass = variant === 'outline' ? 'text-primary-900' : 'text-white';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`h-14 flex-row items-center justify-center rounded-2xl gap-2 ${bgClass} ${disabled ? 'opacity-50' : ''}`}
      style={variant !== 'outline' ? {
        shadowColor: variant === 'accent' ? '#E94560' : '#1A1A2E',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
      } : undefined}
    >
      {icon && <Icon name={icon} className={`${iconClass} text-xl`} />}
      <Text style={{ fontFamily: 'Inter_700Bold' }} className={`${textClass} text-base`}>
        {loading ? 'Loading...' : label}
      </Text>
    </Pressable>
  );
};

// ─── Location Header (District-style sticky header) ─────────
interface LocationHeaderProps {
  name: string;
  location?: string;
  avatarUrl?: string;
  onProfilePress?: () => void;
  onNotificationPress?: () => void;
}

export const LocationHeader: React.FC<LocationHeaderProps> = ({
  name, location, avatarUrl, onProfilePress, onNotificationPress,
}) => (
  <View className="flex-row items-center justify-between px-5 py-3">
    <Pressable onPress={onProfilePress} className="flex-row items-center gap-3 flex-1">
      <View className="h-11 w-11 rounded-full overflow-hidden bg-accent-50 items-center justify-center border-2 border-accent/20">
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <Icon name="person" className="text-accent text-xl" />
        )}
      </View>
      <View className="flex-1">
        <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900 text-base" numberOfLines={1}>
          {name}
        </Text>
        {location && (
          <View className="flex-row items-center gap-1 mt-0.5">
            <Icon name="location-on" className="text-accent text-xs" />
            <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-400 text-xs" numberOfLines={1}>
              {location}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
    <Pressable
      onPress={onNotificationPress}
      className="h-10 w-10 rounded-full bg-surface-tertiary items-center justify-center"
    >
      <Icon name="notifications-none" className="text-primary-900 text-xl" />
    </Pressable>
  </View>
);

// ─── Empty State ────────────────────────────────────────────
interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon, title, subtitle, actionLabel, onAction,
}) => (
  <View className="items-center py-16 px-8">
    <View className="h-20 w-20 rounded-3xl bg-accent-50 items-center justify-center mb-5">
      <Icon name={icon} className="text-accent text-4xl" />
    </View>
    <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900 text-lg mb-2 text-center">
      {title}
    </Text>
    <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-400 text-sm text-center leading-relaxed">
      {subtitle}
    </Text>
    {actionLabel && onAction && (
      <Pressable
        onPress={onAction}
        className="mt-6 px-6 py-3 bg-accent rounded-2xl"
        style={{
          shadowColor: '#E94560',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-white text-sm">{actionLabel}</Text>
      </Pressable>
    )}
  </View>
);
