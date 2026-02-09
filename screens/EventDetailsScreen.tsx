import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import api from '../lib/api';
import Icon from '../components/Icon';

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
  gender: string;
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
  const [event, setEvent] = useState<Event | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'applicants'>('applicants');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  useEffect(() => {
    loadEventDetails();
  }, [id]);

  const loadEventDetails = async () => {
    if (!id) return;
    setIsLoading(true);
    
    // Load event details
    const eventResult = await api.getEvent(id);
    if (eventResult.data?.event) {
      setEvent(eventResult.data.event);
    }
    
    // Load applicants
    const applicantsResult = await api.getEventApplicants(id);
    if (applicantsResult.data?.applicants) {
      setApplicants(applicantsResult.data.applicants);
    }

    // Load conversation if exists
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
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#008080" />
      </View>
    );
  }

  if (!event) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <Text className="text-slate-400">Event not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <View className="relative">
        <View className="h-48 bg-primary">
          {event.image_url ? (
            <Image source={{ uri: event.image_url }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Icon name="event" className="text-white/30 text-6xl" />
            </View>
          )}
        </View>
        <Pressable
          onPress={() => router.back()}
          className="absolute top-4 left-4 h-10 w-10 rounded-full bg-white/20 items-center justify-center"
        >
          <Icon name="arrow_back_ios_new" className="text-white text-xl" />
        </Pressable>
        <View className="absolute bottom-4 left-4 right-4">
          <Text className="text-xl font-extrabold text-white">{event.title}</Text>
          {event.job_type && (
            <View className="mt-2 px-3 py-1 rounded-full bg-white/20">
              <Text className="text-white text-xs font-bold">{event.job_type}</Text>
            </View>
          )}
        </View>
      </View>

      <View className="bg-white border-b border-slate-100 p-3">
        <View className="flex-row rounded-xl bg-slate-100 p-1">
          <Pressable
            onPress={() => setActiveTab('applicants')}
            className={`flex-1 py-2 rounded-lg ${activeTab === 'applicants' ? 'bg-white' : ''}`}
          >
            <Text className={`text-sm font-bold text-center ${activeTab === 'applicants' ? 'text-primary' : 'text-slate-500'}`}>
              Applicants ({applicants.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('details')}
            className={`flex-1 py-2 rounded-lg ${activeTab === 'details' ? 'bg-white' : ''}`}
          >
            <Text className={`text-sm font-bold text-center ${activeTab === 'details' ? 'text-primary' : 'text-slate-500'}`}>
              Event Details
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        {activeTab === 'details' ? (
          <View className="p-4 space-y-4">
            <View className="bg-white rounded-2xl p-4 shadow-sm">
              <Text className="text-xs font-bold text-slate-400 uppercase mb-3">Group Chat</Text>
              <Pressable
                onPress={handleCreateOrOpenChat}
                disabled={isCreatingChat}
                className="h-12 rounded-xl bg-primary items-center justify-center"
              >
                <Text className="text-white font-bold text-sm">
                  {isCreatingChat ? 'Creating...' : conversationId ? 'Open Group Chat' : 'Create Group Chat'}
                </Text>
              </Pressable>
            </View>
            <View className="bg-white rounded-2xl p-4 shadow-sm">
              <Text className="text-xs font-bold text-slate-400 uppercase mb-3">Date & Time</Text>
              <View className="flex-row items-center gap-3 mb-2">
                <Icon name="calendar_today" className="text-primary" />
                <Text className="font-medium">{formatDate(event.event_date)}</Text>
              </View>
              <View className="flex-row items-center gap-3">
                <Icon name="schedule" className="text-primary" />
                <Text className="font-medium">{formatTime(event.start_time)} - {formatTime(event.end_time)}</Text>
              </View>
            </View>

            <View className="bg-white rounded-2xl p-4 shadow-sm">
              <Text className="text-xs font-bold text-slate-400 uppercase mb-3">Location</Text>
              <View className="flex-row items-start gap-3">
                <Icon name="location_on" className="text-primary" />
                <View>
                  <Text className="font-medium">{event.venue || event.location}</Text>
                  {event.location && event.venue && (
                    <Text className="text-sm text-slate-400">{event.location}</Text>
                  )}
                </View>
              </View>
            </View>

            <View className="bg-white rounded-2xl p-4 shadow-sm">
              <Text className="text-xs font-bold text-slate-400 uppercase mb-3">Staffing Requirements</Text>
              <View className="flex-row gap-4">
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 rounded-xl bg-blue-50 items-center justify-center">
                    <Icon name="male" className="text-blue-500" />
                  </View>
                  <View>
                    <Text className="text-xl font-extrabold">{event.male_count || 0}</Text>
                    <Text className="text-xs text-slate-400">₹{event.male_pay || 0}/each</Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-3">
                  <View className="h-10 w-10 rounded-xl bg-pink-50 items-center justify-center">
                    <Icon name="female" className="text-pink-500" />
                  </View>
                  <View>
                    <Text className="text-xl font-extrabold">{event.female_count || 0}</Text>
                    <Text className="text-xs text-slate-400">₹{event.female_pay || 0}/each</Text>
                  </View>
                </View>
              </View>
            </View>

            <View className="bg-white rounded-2xl p-4 shadow-sm">
              <Text className="text-xs font-bold text-slate-400 uppercase mb-3">Payment</Text>
              <View className="space-y-2">
                <View className="flex-row justify-between">
                  <Text className="text-slate-500">Subtotal</Text>
                  <Text className="font-bold">₹{event.subtotal?.toFixed(2) || '0.00'}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-slate-500">Platform Fee (13%)</Text>
                  <Text className="font-bold">₹{event.commission?.toFixed(2) || '0.00'}</Text>
                </View>
                <View className="flex-row justify-between pt-2 border-t border-slate-100">
                  <Text className="font-bold text-slate-900">Total</Text>
                  <Text className="font-extrabold text-primary text-lg">₹{event.total?.toFixed(2) || '0.00'}</Text>
                </View>
              </View>
            </View>

            {event.description && (
              <View className="bg-white rounded-2xl p-4 shadow-sm">
                <Text className="text-xs font-bold text-slate-400 uppercase mb-3">Description</Text>
                <Text className="text-slate-600">{event.description}</Text>
              </View>
            )}
          </View>
        ) : (
          <View className="p-4 space-y-4">
            {applicants.length === 0 ? (
              <View className="items-center py-12">
                <View className="h-16 w-16 rounded-full bg-slate-100 items-center justify-center mb-4">
                  <Icon name="person_search" className="text-slate-300 text-3xl" />
                </View>
                <Text className="font-bold text-slate-700 mb-1">No Applicants Yet</Text>
                <Text className="text-sm text-slate-400 text-center">
                  Publish your event to start receiving applications
                </Text>
              </View>
            ) : (
              <>
                {pendingApplicants.length > 0 && (
                  <View>
                    <Text className="text-xs font-bold text-slate-400 uppercase mb-3">
                      Pending ({pendingApplicants.length})
                    </Text>
                    <View className="space-y-3">
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
                    <Text className="text-xs font-bold text-slate-400 uppercase mb-3">
                      Accepted ({acceptedApplicants.length})
                    </Text>
                    <View className="space-y-3">
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
                    <Text className="text-xs font-bold text-slate-400 uppercase mb-3">
                      Rejected ({rejectedApplicants.length})
                    </Text>
                    <View className="space-y-3 opacity-60">
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
    <View className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <View className="flex-row items-start gap-3">
        <View className="h-12 w-12 rounded-full bg-primary/10 items-center justify-center overflow-hidden">
          {applicant.worker_photo || applicant.avatar_url ? (
            <Image source={{ uri: applicant.worker_photo || applicant.avatar_url }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <Text className="text-lg font-bold text-primary">{applicant.name?.[0] || 'A'}</Text>
          )}
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="font-bold text-slate-900" numberOfLines={1}>{applicant.name || 'Anonymous'}</Text>
            {applicant.status !== 'pending' && (
              <Text className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                applicant.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {applicant.status}
              </Text>
            )}
          </View>
          {(applicant.age || applicant.experience_years) && (
            <Text className="text-xs text-slate-400 mt-1">
              {applicant.age ? `${applicant.age} yrs` : 'Age N/A'} • {applicant.experience_years ?? 0} yrs exp
            </Text>
          )}
          {applicant.verification_status && (
            <Text className="text-[10px] font-bold uppercase tracking-widest mt-1 text-primary">
              Aadhaar {applicant.verification_status}
            </Text>
          )}
          {applicant.phone && (
            <View className="flex-row items-center gap-1 mt-1">
              <Icon name="phone" className="text-slate-400 text-xs" />
              <Text className="text-xs text-slate-400">{applicant.phone}</Text>
            </View>
          )}
          {applicant.skills && (
            <View className="flex-row flex-wrap gap-1 mt-2">
              {applicant.skills.split(',').slice(0, 3).map((skill, idx) => (
                <Text key={idx} className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-medium text-slate-600">
                  {skill.trim()}
                </Text>
              ))}
            </View>
          )}
        </View>
      </View>

      {onViewProfile && (
        <View className="mt-3">
          <Pressable onPress={onViewProfile}>
            <Text className="text-primary text-xs font-bold underline">View Profile</Text>
          </Pressable>
        </View>
      )}

      {showActions && applicant.status === 'pending' && (
        <View className="flex-row items-center gap-2 mt-4 pt-3 border-t border-slate-100">
          <Pressable
            onPress={onReject}
            disabled={updating}
            className="flex-1 py-2.5 rounded-xl border border-red-200 items-center"
          >
            <Text className="text-red-500 font-bold text-sm">{updating ? '...' : 'Reject'}</Text>
          </Pressable>
          <Pressable
            onPress={onAccept}
            disabled={updating}
            className="flex-1 py-2.5 rounded-xl bg-green-500 items-center"
          >
            <Text className="text-white font-bold text-sm">{updating ? '...' : 'Accept'}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

export default EventDetailsScreen;
