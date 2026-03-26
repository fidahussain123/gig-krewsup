
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../contexts/AuthContext';
import socketClient from '../lib/socket';
import Icon from '../components/Icon';

type RtcApi = {
  RTCPeerConnection: any;
  RTCSessionDescription: any;
  RTCIceCandidate: any;
  mediaDevices: any;
};

const getRtcApi = (): RtcApi => {
  if (Platform.OS === 'web') {
    return {
      RTCPeerConnection,
      RTCSessionDescription,
      RTCIceCandidate,
      mediaDevices: navigator.mediaDevices,
    };
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const webrtc = require('react-native-webrtc');
  return {
    RTCPeerConnection: webrtc.RTCPeerConnection,
    RTCSessionDescription: webrtc.RTCSessionDescription,
    RTCIceCandidate: webrtc.RTCIceCandidate,
    mediaDevices: webrtc.mediaDevices,
  };
};

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

const VideoCallScreen: React.FC = () => {
  const { id, conversationId } = useLocalSearchParams<{ id: string; conversationId?: string }>();
  const callId = String(id || '');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [peerIds, setPeerIds] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const localStreamRef = useRef<any>(null);
  const peerConnectionsRef = useRef<Map<string, any>>(new Map());

  const rtcApi = useMemo(() => getRtcApi(), []);

  const ensurePeerConnection = async (remoteUserId: string) => {
    const existing = peerConnectionsRef.current.get(remoteUserId);
    if (existing) return existing;

    const pc = new rtcApi.RTCPeerConnection({ iceServers: ICE_SERVERS });
    pc.onicecandidate = (event: any) => {
      if (event.candidate) {
        socketClient.sendIce(callId, remoteUserId, event.candidate);
      }
    };
    pc.ontrack = () => {
      // Audio tracks are handled internally; no UI rendering required.
    };

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track: any) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    peerConnectionsRef.current.set(remoteUserId, pc);
    return pc;
  };

  const startLocalStream = async () => {
    const stream = await rtcApi.mediaDevices.getUserMedia({ audio: true, video: false });
    localStreamRef.current = stream;
  };

  const createOfferTo = async (remoteUserId: string) => {
    const pc = await ensurePeerConnection(remoteUserId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socketClient.sendOffer(callId, remoteUserId, offer);
  };

  const handleLeave = () => {
    socketClient.leaveCall(callId);
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track: any) => track.stop());
    }
    router.back();
  };

  useEffect(() => {
    if (!callId || !token) return;

    if (!socketClient.isConnected()) {
      socketClient.connect(token);
    }

    const setup = async () => {
      try {
        await startLocalStream();
        socketClient.joinCall(callId);
        setIsReady(true);
      } catch (e) {
        console.warn('Call setup failed', e);
      }
    };
    setup();

    const unsubParticipants = socketClient.onCallParticipants((data) => {
      if (data.callId !== callId) return;
      const others = (data.participants || []).filter((pid: string) => pid !== user?.id);
      setPeerIds(others);
      others.forEach((pid: string) => {
        createOfferTo(pid).catch(() => undefined);
      });
    });

    const unsubUserJoined = socketClient.onCallUserJoined((data) => {
      if (data.callId !== callId) return;
      if (!data.userId || data.userId === user?.id) return;
      setPeerIds(prev => (prev.includes(data.userId) ? prev : [...prev, data.userId]));
    });

    const unsubUserLeft = socketClient.onCallUserLeft((data) => {
      if (data.callId !== callId) return;
      const pc = peerConnectionsRef.current.get(data.userId);
      if (pc) {
        pc.close();
        peerConnectionsRef.current.delete(data.userId);
      }
      setPeerIds(prev => prev.filter(pid => pid !== data.userId));
    });

    const unsubOffer = socketClient.onCallOffer(async (data) => {
      if (data.callId !== callId || !data.fromUserId) return;
      const pc = await ensurePeerConnection(data.fromUserId);
      const desc = Platform.OS === 'web' ? data.sdp : new rtcApi.RTCSessionDescription(data.sdp);
      await pc.setRemoteDescription(desc);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketClient.sendAnswer(callId, data.fromUserId, answer);
    });

    const unsubAnswer = socketClient.onCallAnswer(async (data) => {
      if (data.callId !== callId || !data.fromUserId) return;
      const pc = peerConnectionsRef.current.get(data.fromUserId);
      if (!pc) return;
      const desc = Platform.OS === 'web' ? data.sdp : new rtcApi.RTCSessionDescription(data.sdp);
      await pc.setRemoteDescription(desc);
    });

    const unsubIce = socketClient.onCallIce(async (data) => {
      if (data.callId !== callId || !data.fromUserId) return;
      const pc = peerConnectionsRef.current.get(data.fromUserId);
      if (!pc) return;
      const candidate = Platform.OS === 'web' ? data.candidate : new rtcApi.RTCIceCandidate(data.candidate);
      await pc.addIceCandidate(candidate);
    });

    return () => {
      unsubParticipants();
      unsubUserJoined();
      unsubUserLeft();
      unsubOffer();
      unsubAnswer();
      unsubIce();
      socketClient.leaveCall(callId);
      peerConnectionsRef.current.forEach((pc) => {
        try {
          pc.close();
        } catch (_) {}
      });
      peerConnectionsRef.current.clear();
      if (localStreamRef.current) {
        try {
          localStreamRef.current.getTracks().forEach((track: any) => track.stop());
        } catch (_) {}
      }
    };
  }, [callId, token, user?.id, rtcApi]);

  const toggleMute = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((track: any) => {
      track.enabled = !track.enabled;
      setIsMuted(!track.enabled);
    });
  };

  return (
    <View className="flex-1 bg-primary-dark">
      <LinearGradient
        colors={['#1A1A2E', '#16213E', '#0F3460']}
        className="absolute top-0 left-0 right-0 bottom-0"
      />

      {/* Header */}
      <View className="flex-row items-center justify-between px-5" style={{ paddingTop: insets.top + 12, paddingBottom: 8 }}>
        <Pressable onPress={handleLeave} className="h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
          <Icon name="expand-more" className="text-white text-2xl" />
        </Pressable>
        <View className="items-center">
          <Text style={{ fontFamily: 'Inter_800ExtraBold' }} className="text-white text-base">Voice Call</Text>
          <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-white/50 text-[10px] uppercase tracking-widest">
            {conversationId ? 'Event Chat' : 'Direct Call'}
          </Text>
        </View>
        <View className="h-11 w-11" />
      </View>

      {/* Participants */}
      <ScrollView className="flex-1 px-5 py-4" contentContainerStyle={{ paddingBottom: 120 }}>
        {!isReady ? (
          <View className="items-center justify-center py-16">
            <ActivityIndicator size="large" color="#E94560" />
            <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-white/50 text-xs mt-4">Connecting...</Text>
          </View>
        ) : peerIds.length === 0 ? (
          <View className="items-center justify-center py-16">
            <View className="h-20 w-20 rounded-3xl bg-white/5 items-center justify-center mb-4">
              <Icon name="group" className="text-white/20 text-3xl" />
            </View>
            <Text style={{ fontFamily: 'Inter_600SemiBold' }} className="text-white/40 text-sm">Waiting for others to join...</Text>
          </View>
        ) : (
          <View className="gap-3">
            {peerIds.map(pid => (
              <View
                key={pid}
                className="rounded-2xl bg-white/5 p-5 flex-row items-center gap-4"
                style={{
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.08)',
                }}
              >
                <View className="h-12 w-12 rounded-full bg-accent/20 items-center justify-center">
                  <Icon name="person" className="text-accent text-xl" />
                </View>
                <View className="flex-1">
                  <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-white text-sm">Connected Member</Text>
                  <Text style={{ fontFamily: 'Inter_500Medium' }} className="text-white/30 text-xs mt-0.5">ID: {pid.slice(0, 8)}...</Text>
                </View>
                <View className="h-3 w-3 rounded-full bg-success" />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Controls */}
      <View className="pt-4 px-8" style={{ paddingBottom: Math.max(insets.bottom, 16) + 12 }}>
        <View className="flex-row items-center justify-center gap-8">
          <Pressable onPress={toggleMute} className="items-center gap-2">
            <View
              className={`h-16 w-16 rounded-full items-center justify-center ${isMuted ? 'bg-white/20' : 'bg-white/10'}`}
              style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
            >
              <Icon name={isMuted ? 'mic-off' : 'mic'} className="text-white text-2xl" />
            </View>
            <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[9px] text-white/40 uppercase tracking-widest">
              {isMuted ? 'Unmute' : 'Mute'}
            </Text>
          </Pressable>
          <Pressable onPress={handleLeave} className="items-center gap-2">
            <View
              className="h-16 w-16 rounded-full bg-error items-center justify-center"
              style={{
                shadowColor: '#FF4757',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              <Icon name="call-end" className="text-white text-3xl" />
            </View>
            <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-[9px] text-error uppercase tracking-widest">End Call</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default VideoCallScreen;
