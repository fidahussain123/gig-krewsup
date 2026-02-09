// Socket.IO Client for Real-Time Messaging
import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';

const SOCKET_URL =
  Constants.expoConfig?.extra?.socketUrl ||
  process.env.EXPO_PUBLIC_SOCKET_URL ||
  'http://localhost:3001';

class SocketClient {
  private socket: Socket | null = null;
  private messageCallbacks: ((message: any) => void)[] = [];
  private memberJoinedCallbacks: ((data: any) => void)[] = [];
  private typingCallbacks: ((data: any) => void)[] = [];

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
      console.log('Joined event group:', data);
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

  isConnected() {
    return this.socket?.connected || false;
  }
}

export const socketClient = new SocketClient();
export default socketClient;
