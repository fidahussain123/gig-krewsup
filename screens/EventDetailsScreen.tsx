import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../lib/api';
import Icon from '../components/Icon';
import { FadeInView, ScalePress } from '../components/AnimatedComponents';
import { PillTabs, GlassCard, EmptyState } from '../components/DistrictUI';

interface Applicant {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  avatar_url: string;
  worker_photo?: string;
  skills: string;
  bio: string;
  hourly_rate: number;
  experience_years?: number;
  age?: number;
  gender?: string;
  verification_status?: string;
  status: 'pending' | 'accepted' | 'rejected';
  applied_at: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  venue: string;
  event_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  image_url: string;
  job_type: string;
  male_count: number;
  female_count: number;
  male_pay: number;
  female_pay: number;
  subtotal: number;
  commission: number;
  total: number;
  status: string;
}

const EventDetailsScreen: React.FC = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [event, setEvent] = useState<Event | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadEventDetails();
  }, [id]);

  const loadEventDetails = async () => {
    if (!id) return;
    setIsLoading(true);
    const eventResult = await api.getEvent(id);
    if (eventResult.data?.event) {
      setEvent(eventResult.data.event);
    }
    const applicantsResult = await api.getEventApplicants(id);
    if (applicantsResult.data?.applicants) {
      setApplicants(applicantsResult.data.applicants);
    }
    const convResult = await api.getEventConversation(id);
    if (convResult.data?.conversationId) {
      setConversationId(convResult.data.conversationId);
    }
    setIsLoading(false);
  };

  const handleUpdateStatus = async (applicantId: string, status: 'accepted' | 'rejected') => {
    setUpdatingId(applicantId);
    const result = await api.updateApplicationStatus(applicantId, status);
    if (result.data) {
      setApplicants(prev =>
        prev.map(a => a.id === applicantId ? { ...a, status } : a)
      );
    }
    setUpdatingId(null);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${period}`;
  };

  const pendingApplicants = applicants.filter(a => a.status === 'pending');
  const acceptedApplicants = applicants.filter(a => a.status === 'accepted');
  const rejectedApplicants = applicants.filter(a => a.status === 'rejected');

  const handleDeleteEvent = () => {
    const hasAccepted = acceptedApplicants.length > 0;
    const title = 'Delete event?';
    const message = hasAccepted
      ? `This event has ${acceptedApplicants.length} accepted worker(s). If you confirm, they will get a push notification and an in-app alert. Are you sure you want to delete "${event?.title}"?`
      : `Are you sure you want to delete "${event?.title}"? This cannot be undone.`;
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!id) return;
          setIsDeleting(true);
          try {
            const result = await api.deleteEvent(id);
            if (result.error) {
              Alert.alert('Could not delete', result.error);
              return;
            }
            router.replace('/organizer/events');
          } finally {
            setIsDeleting(false);
          }
        },
      },
    ]);
  };

  const handleCreateOrOpenChat = async () => {
    if (!id) return;
    if (conversationId) {
      router.push(`/chat/event/${conversationId}`);
      return;
    }
    setIsCreatingChat(true);
    const result = await api.createEventConversation(id);
    if (result.data?.conversationId) {
      setConversationId(result.data.conversationId);
      router.push(`/chat/event/${result.data.conversationId}`);
    }
    setIsCreatingChat(false);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface-secondary items-center justify-center">
        <ActivityIndicator size="large" color="#E94560" />
      </View>
    );
  }

  if (!event) {
    return (
      <View className="flex-1 bg-surface-secondary items-center justify-center">
        <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-400">Event not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface-secondary">
      {/* Hero Image */}
      <View className="relative h-52" style={{ paddingTop: 0 }}>
        {event.image_url ? (
          <Image source={{ uri: event.image_url }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="w-full h-full bg-primary items-center justify-center">
            <Icon name="event" className="text-white/20 text-6xl" />
          </View>
        )}
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.6)']}
          className="absolute top-0 left-0 right-0 bottom-0"
        />
        <Pressable
          onPress={() => router.back()}
          className="absolute h-10 w-10 rounded-full bg-black/30 items-center justify-center"
          style={{ top: insets.top + 8, left: 16 }}
        >
          <Icon name="arrow_back_ios_new" className="text-white text-base" />
        </Pressable>
        <Pressable
          onPress={handleDeleteEvent}
          disabled={isDeleting}
          className="absolute h-10 w-10 rounded-full bg-black/30 items-center justify-center"
          style={{ top: insets.top + 8, right: 16 }}
        >
          <Icon name="delete_outline" className="text-white text-base" />
        </Pressable>
        <View className="absolute bottom-4 left-5 right-5">
          <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-white text-xl" numberOfLines={2}>{event.title}</Text>
          {event.job_type && (
            <View className="mt-1.5 px-3 py-1 rounded-full bg-accent/90 self-start">
              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-white text-xs">{event.job_type}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View className="bg-white py-3">
        <PillTabs
          tabs={[`Applicants (${applicants.length})`, 'Details']}
          activeIndex={activeTab}
          onTabPress={setActiveTab}
        />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 + insets.bottom, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 1 ? (
          <View className="gap-3">
            <GlassCard>
              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-xs text-slate-400 uppercase tracking-wider mb-3">Group Chat</Text>
              <Pressable
                onPress={handleCreateOrOpenChat}
                disabled={isCreatingChat}
                className="h-12 rounded-2xl bg-accent items-center justify-center"
                style={{
                  shadowColor: '#E94560',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-white text-sm">
                  {isCreatingChat ? 'Creating...' : conversationId ? 'Open Group Chat' : 'Create Group Chat'}
                </Text>
              </Pressable>
            </GlassCard>
            <GlassCard>
              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-xs text-slate-400 uppercase tracking-wider mb-3">Date & Time</Text>
              <View className="flex-row items-center gap-3 mb-2">
                <View className="h-9 w-9 rounded-xl bg-accent-50 items-center justify-center">
                  <Icon name="calendar-today" className="text-accent" />
                </View>
                <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-primary-900">{formatDate(event.event_date)}</Text>
              </View>
              <View className="flex-row items-center gap-3">
                <View className="h-9 w-9 rounded-xl bg-brand-50 items-center justify-center">
                  <Icon name="schedule" className="text-brand" />
                </View>
                <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-primary-900">{formatTime(event.start_time)} - {formatTime(event.end_time)}</Text>
              </View>
            </GlassCard>

            <GlassCard>
              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-xs text-slate-400 uppercase tracking-wider mb-3">Location</Text>
              <View className="flex-row items-start gap-3">
                <View className="h-9 w-9 rounded-xl bg-accent-50 items-center justify-center">
                  <Icon name="location-on" className="text-accent" />
                </View>
                <View>
                  <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-primary-900">{event.venue || event.location}</Text>
                  {event.location && event.venue && (
                    <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-sm text-slate-400">{event.location}</Text>
                  )}
                </View>
              </View>
            </GlassCard>

            <GlassCard>
              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-xs text-slate-400 uppercase tracking-wider mb-3">Staffing</Text>
              <View className="flex-row gap-4">
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 rounded-xl bg-blue-50 items-center justify-center">
                    <Icon name="male" className="text-blue-500" />
                  </View>
                  <View>
                    <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-xl text-primary-900">{event.male_count || 0}</Text>
                    <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-xs text-slate-400">₹{event.male_pay || 0}/each</Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 rounded-xl bg-pink-50 items-center justify-center">
                    <Icon name="female" className="text-pink-500" />
                  </View>
                  <View>
                    <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-xl text-primary-900">{event.female_count || 0}</Text>
                    <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-xs text-slate-400">₹{event.female_pay || 0}/each</Text>
                  </View>
                </View>
              </View>
            </GlassCard>

            <GlassCard>
              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-xs text-slate-400 uppercase tracking-wider mb-3">Payment</Text>
              <View className="gap-2">
                <View className="flex-row justify-between">
                  <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-400">Subtotal</Text>
                  <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900">₹{event.subtotal?.toFixed(2) || '0.00'}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-400">Platform Fee (13%)</Text>
                  <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900">₹{event.commission?.toFixed(2) || '0.00'}</Text>
                </View>
                <View className="flex-row justify-between pt-3 border-t border-surface-tertiary">
                  <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900">Total</Text>
                  <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-accent text-lg">₹{event.total?.toFixed(2) || '0.00'}</Text>
                </View>
              </View>
            </GlassCard>

            {event.description && (
              <GlassCard>
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-xs text-slate-400 uppercase tracking-wider mb-3">Description</Text>
                <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-slate-600 text-sm leading-relaxed">{event.description}</Text>
              </GlassCard>
            )}

            <GlassCard className="border border-error/20">
              <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-xs text-slate-400 uppercase tracking-wider mb-3">Danger Zone</Text>
              <Pressable
                onPress={handleDeleteEvent}
                disabled={isDeleting}
                className="h-12 rounded-2xl border-2 border-error/30 bg-error/5 items-center justify-center"
              >
                <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-error text-sm">
                  {isDeleting ? 'Deleting...' : 'Delete Event'}
                </Text>
              </Pressable>
            </GlassCard>
          </View>
        ) : (
          <View className="gap-3">
            {applicants.length === 0 ? (
              <EmptyState
                icon="person-search"
                title="No Applicants Yet"
                subtitle="Publish your event to start receiving applications"
              />
            ) : (
              <>
                {pendingApplicants.length > 0 && (
                  <View>
                    <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-xs text-slate-400 uppercase tracking-wider mb-3">
                      Pending ({pendingApplicants.length})
                    </Text>
                    <View className="gap-3">
                      {pendingApplicants.map((applicant) => (
                        <ApplicantCard
                          key={applicant.id}
                          applicant={applicant}
                          onAccept={() => handleUpdateStatus(applicant.id, 'accepted')}
                          onReject={() => handleUpdateStatus(applicant.id, 'rejected')}
                          updating={updatingId === applicant.id}
                          onViewProfile={() => router.push(`/organizer/workers/${applicant.user_id}`)}
                        />
                      ))}
                    </View>
                  </View>
                )}
                {acceptedApplicants.length > 0 && (
                  <View>
                    <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-xs text-slate-400 uppercase tracking-wider mb-3">
                      Accepted ({acceptedApplicants.length})
                    </Text>
                    <View className="gap-3">
                      {acceptedApplicants.map((applicant) => (
                        <ApplicantCard
                          key={applicant.id}
                          applicant={applicant}
                          showActions={false}
                          onViewProfile={() => router.push(`/organizer/workers/${applicant.user_id}`)}
                        />
                      ))}
                    </View>
                  </View>
                )}
                {rejectedApplicants.length > 0 && (
                  <View>
                    <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-xs text-slate-400 uppercase tracking-wider mb-3">
                      Rejected ({rejectedApplicants.length})
                    </Text>
                    <View className="gap-3 opacity-60">
                      {rejectedApplicants.map((applicant) => (
                        <ApplicantCard
                          key={applicant.id}
                          applicant={applicant}
                          showActions={false}
                          onViewProfile={() => router.push(`/organizer/workers/${applicant.user_id}`)}
                        />
                      ))}
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// Applicant Card Component
interface ApplicantCardProps {
  applicant: Applicant;
  onAccept?: () => void;
  onReject?: () => void;
  updating?: boolean;
  showActions?: boolean;
  onViewProfile?: () => void;
}

const ApplicantCard: React.FC<ApplicantCardProps> = ({
  applicant,
  onAccept,
  onReject,
  updating = false,
  showActions = true,
  onViewProfile
}) => {
  return (
    <GlassCard>
      <View className="flex-row items-start gap-3">
        <View className="h-12 w-12 rounded-2xl bg-accent-50 items-center justify-center overflow-hidden">
          {applicant.worker_photo || applicant.avatar_url ? (
            <Image source={{ uri: applicant.worker_photo || applicant.avatar_url }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-lg text-accent">{applicant.name?.[0] || 'A'}</Text>
          )}
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-primary-900" numberOfLines={1}>{applicant.name || 'Anonymous'}</Text>
            {applicant.status !== 'pending' && (
              <View className={`px-2.5 py-1 rounded-full ${
                applicant.status === 'accepted' ? 'bg-success/10' : 'bg-error/10'
              }`}>
                <Text style={{ fontFamily: 'Inter_700Bold' }} className={`text-[10px] uppercase ${
                  applicant.status === 'accepted' ? 'text-success' : 'text-error'
                }`}>
                  {applicant.status}
                </Text>
              </View>
            )}
          </View>
          {(applicant.age || applicant.experience_years) && (
            <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-xs text-slate-400 mt-1">
              {applicant.age ? `${applicant.age} yrs` : 'Age N/A'} • {applicant.experience_years ?? 0} yrs exp
            </Text>
          )}
          {applicant.verification_status && (
            <View className="flex-row items-center gap-1 mt-1">
              <Icon name="verified" className="text-accent text-xs" />
              <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-[10px] uppercase tracking-wider text-accent">
                Aadhaar {applicant.verification_status}
              </Text>
            </View>
          )}
          {applicant.skills && (
            <View className="flex-row flex-wrap gap-1.5 mt-2">
              {applicant.skills.split(',').slice(0, 3).map((skill, idx) => (
                <View key={idx} className="px-2.5 py-1 rounded-full bg-surface-tertiary">
                  <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-[10px] text-slate-500">
                    {skill.trim()}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {onViewProfile && (
        <View className="mt-3">
          <Pressable onPress={onViewProfile}>
            <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-accent text-xs">View Profile</Text>
          </Pressable>
        </View>
      )}

      {showActions && applicant.status === 'pending' && (
        <View className="flex-row items-center gap-2 mt-4 pt-3 border-t border-surface-tertiary">
          <Pressable
            onPress={onReject}
            disabled={updating}
            className="flex-1 py-2.5 rounded-xl border border-error/20 items-center"
          >
            <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-error text-sm">{updating ? '...' : 'Reject'}</Text>
          </Pressable>
          <Pressable
            onPress={onAccept}
            disabled={updating}
            className="flex-1 py-2.5 rounded-xl bg-success items-center"
          >
            <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-white text-sm">{updating ? '...' : 'Accept'}</Text>
          </Pressable>
        </View>
      )}
    </GlassCard>
  );
};

export default EventDetailsScreen;
