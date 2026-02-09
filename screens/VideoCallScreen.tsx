
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from 'react-native';
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
      await startLocalStream();
      socketClient.joinCall(callId);
      setIsReady(true);
    };
    setup().catch(() => undefined);

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
      peerConnectionsRef.current.forEach(pc => pc.close());
      peerConnectionsRef.current.clear();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track: any) => track.stop());
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
    <View className="flex-1 bg-slate-900">
      <View className="flex-row items-center justify-between p-6 pt-10">
        <Pressable onPress={handleLeave} className="h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
          <Icon name="expand-more" className="text-white text-2xl" />
        </Pressable>
        <View className="items-center">
          <Text className="text-white text-base font-extrabold">Voice Call</Text>
          <Text className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
            {conversationId ? 'Event Chat' : 'Direct Call'}
          </Text>
        </View>
        <View className="h-11 w-11" />
      </View>

      <ScrollView className="flex-1 px-5 py-4" contentContainerStyle={{ paddingBottom: 120 }}>
        {!isReady ? (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" color="#ffffff" />
            <Text className="text-white/60 text-xs mt-3">Connecting...</Text>
          </View>
        ) : peerIds.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Text className="text-white/60 text-xs">Waiting for others to join</Text>
          </View>
        ) : (
          <View className="space-y-3">
            {peerIds.map(pid => (
              <View key={pid} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <Text className="text-white text-sm font-bold">Connected member</Text>
                <Text className="text-white/50 text-xs mt-1">ID: {pid}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View className="pb-12 pt-6 px-8">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={toggleMute} className="items-center gap-2">
            <View className="h-16 w-16 rounded-full bg-white/10 items-center justify-center border border-white/10">
              <Icon name={isMuted ? 'mic-off' : 'mic'} className="text-white text-2xl" />
            </View>
            <Text className="text-[9px] font-extrabold text-white/40 uppercase tracking-widest">
              {isMuted ? 'Unmute' : 'Mute'}
            </Text>
          </Pressable>
          <Pressable onPress={handleLeave} className="items-center gap-2">
            <View className="h-16 w-16 rounded-[2rem] bg-red-500 items-center justify-center">
              <Icon name="call-end" className="text-white text-3xl" />
            </View>
            <Text className="text-[9px] font-extrabold text-red-400 uppercase tracking-widest">End Call</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default VideoCallScreen;
