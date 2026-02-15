// Socket.IO Client for Real-Time Messaging
import { io, Socket } from 'socket.io-client';
import { SOCKET_BASE_URL } from './config';

const SOCKET_URL = SOCKET_BASE_URL;

class SocketClient {
  private socket: Socket | null = null;
  private messageCallbacks: ((message: any) => void)[] = [];
  private memberJoinedCallbacks: ((data: any) => void)[] = [];
  private typingCallbacks: ((data: any) => void)[] = [];
  private joinedEventGroupCallbacks: ((data: any) => void)[] = [];
  private callInviteCallbacks: ((data: any) => void)[] = [];
  private callParticipantsCallbacks: ((data: any) => void)[] = [];
  private callUserJoinedCallbacks: ((data: any) => void)[] = [];
  private callUserLeftCallbacks: ((data: any) => void)[] = [];
  private callOfferCallbacks: ((data: any) => void)[] = [];
  private callAnswerCallbacks: ((data: any) => void)[] = [];
  private callIceCallbacks: ((data: any) => void)[] = [];

  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
    });

    this.socket.on('new_message', (message: any) => {
      this.messageCallbacks.forEach(cb => cb(message));
    });

    this.socket.on('member_joined', (data: any) => {
      this.memberJoinedCallbacks.forEach(cb => cb(data));
    });

    this.socket.on('user_typing', (data: any) => {
      this.typingCallbacks.forEach(cb => cb(data));
    });

    this.socket.on('joined_event_group', (data: any) => {
      this.joinedEventGroupCallbacks.forEach(cb => cb(data));
    });

    this.socket.on('call_invite', (data: any) => {
      this.callInviteCallbacks.forEach(cb => cb(data));
    });

    this.socket.on('call_participants', (data: any) => {
      this.callParticipantsCallbacks.forEach(cb => cb(data));
    });

    this.socket.on('call_user_joined', (data: any) => {
      this.callUserJoinedCallbacks.forEach(cb => cb(data));
    });

    this.socket.on('call_user_left', (data: any) => {
      this.callUserLeftCallbacks.forEach(cb => cb(data));
    });

    this.socket.on('webrtc_offer', (data: any) => {
      this.callOfferCallbacks.forEach(cb => cb(data));
    });

    this.socket.on('webrtc_answer', (data: any) => {
      this.callAnswerCallbacks.forEach(cb => cb(data));
    });

    this.socket.on('webrtc_ice', (data: any) => {
      this.callIceCallbacks.forEach(cb => cb(data));
    });

    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinConversation(conversationId: string) {
    this.socket?.emit('join_conversation', conversationId);
  }

  leaveConversation(conversationId: string) {
    this.socket?.emit('leave_conversation', conversationId);
  }

  sendMessage(conversationId: string, content: string) {
    this.socket?.emit('send_message', { conversationId, content });
  }

  setTyping(conversationId: string, isTyping: boolean) {
    this.socket?.emit('typing', { conversationId, isTyping });
  }

  onMessage(callback: (message: any) => void) {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    };
  }

  onMemberJoined(callback: (data: any) => void) {
    this.memberJoinedCallbacks.push(callback);
    return () => {
      this.memberJoinedCallbacks = this.memberJoinedCallbacks.filter(cb => cb !== callback);
    };
  }

  onTyping(callback: (data: any) => void) {
    this.typingCallbacks.push(callback);
    return () => {
      this.typingCallbacks = this.typingCallbacks.filter(cb => cb !== callback);
    };
  }

  onJoinedEventGroup(callback: (data: any) => void) {
    this.joinedEventGroupCallbacks.push(callback);
    return () => {
      this.joinedEventGroupCallbacks = this.joinedEventGroupCallbacks.filter(cb => cb !== callback);
    };
  }

  onCallInvite(callback: (data: any) => void) {
    this.callInviteCallbacks.push(callback);
    return () => {
      this.callInviteCallbacks = this.callInviteCallbacks.filter(cb => cb !== callback);
    };
  }

  onCallParticipants(callback: (data: any) => void) {
    this.callParticipantsCallbacks.push(callback);
    return () => {
      this.callParticipantsCallbacks = this.callParticipantsCallbacks.filter(cb => cb !== callback);
    };
  }

  onCallUserJoined(callback: (data: any) => void) {
    this.callUserJoinedCallbacks.push(callback);
    return () => {
      this.callUserJoinedCallbacks = this.callUserJoinedCallbacks.filter(cb => cb !== callback);
    };
  }

  onCallUserLeft(callback: (data: any) => void) {
    this.callUserLeftCallbacks.push(callback);
    return () => {
      this.callUserLeftCallbacks = this.callUserLeftCallbacks.filter(cb => cb !== callback);
    };
  }

  onCallOffer(callback: (data: any) => void) {
    this.callOfferCallbacks.push(callback);
    return () => {
      this.callOfferCallbacks = this.callOfferCallbacks.filter(cb => cb !== callback);
    };
  }

  onCallAnswer(callback: (data: any) => void) {
    this.callAnswerCallbacks.push(callback);
    return () => {
      this.callAnswerCallbacks = this.callAnswerCallbacks.filter(cb => cb !== callback);
    };
  }

  onCallIce(callback: (data: any) => void) {
    this.callIceCallbacks.push(callback);
    return () => {
      this.callIceCallbacks = this.callIceCallbacks.filter(cb => cb !== callback);
    };
  }

  sendCallInvite(toUserId: string, callId: string, conversationId?: string, mode?: string) {
    this.socket?.emit('call_invite', { toUserId, callId, conversationId, mode });
  }

  joinCall(callId: string) {
    this.socket?.emit('call_join', { callId });
  }

  leaveCall(callId: string) {
    this.socket?.emit('call_leave', { callId });
  }

  sendOffer(callId: string, toUserId: string, sdp: any) {
    this.socket?.emit('webrtc_offer', { callId, toUserId, sdp });
  }

  sendAnswer(callId: string, toUserId: string, sdp: any) {
    this.socket?.emit('webrtc_answer', { callId, toUserId, sdp });
  }

  sendIce(callId: string, toUserId: string, candidate: any) {
    this.socket?.emit('webrtc_ice', { callId, toUserId, candidate });
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export const socketClient = new SocketClient();
export default socketClient;
