import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

interface SocketContextType {
  socket: Socket | null;
  userId: string;
  username: string;
  setUsername: (name: string) => void;
  isConnected: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  userId: '',
  username: '',
  setUsername: () => {},
  isConnected: false,
  connectionStatus: 'disconnected'
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: ReactNode;
}

// Constants
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [userId] = useState<string>(uuidv4());
  const [username, setUsername] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('connecting');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    // Determine if we're using ngrok or local connection
    // Look for a special meta tag that might be set by our server script
    const ngrokBackendUrl = document.querySelector('meta[name="backend-url"]')?.getAttribute('content');
    
    let serverUrl: string;
    
    if (ngrokBackendUrl && ngrokBackendUrl !== '') {
      // Use the ngrok URL if available
      serverUrl = ngrokBackendUrl;
      console.log('Using ngrok backend URL:', serverUrl);
    } else {
      // Fallback to dynamic URL based on current hostname
      const host = window.location.hostname;
      // serverUrl = `${window.location.protocol}//${host}:4000`; 
      serverUrl = ' https://backend-chat-zsoq.onrender.com';// Using port 4000
      console.log('Using dynamic backend URL:', serverUrl);
    }
    
    const newSocket = io(serverUrl, {
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });
    
    setSocket(newSocket);
    setConnectionStatus('connecting');

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
      setIsConnected(true);
      setConnectionStatus('connected');
      setReconnectAttempts(0);
      
      // If we already had a username, rejoin automatically
      if (username) {
        newSocket.emit('user:join', { userId, username });
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from socket server');
      setIsConnected(false);
      setConnectionStatus('disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
      setConnectionStatus('error');
      setReconnectAttempts(prev => prev + 1);
    });
    
    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
      // The connect event will handle setting connected state
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
      setConnectionStatus('error');
    });

    newSocket.on('reconnect_failed', () => {
      console.error('Failed to reconnect');
      setConnectionStatus('error');
      
      // Try to completely re-initialize the connection
      if (reconnectAttempts > 5) {
        setTimeout(() => {
          window.location.reload();
        }, 5000);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [reconnectAttempts]);

  // Set up heartbeat to prevent disconnections
  useEffect(() => {
    if (!socket || !isConnected || !userId) return;
    
    const heartbeatInterval = setInterval(() => {
      if (socket && isConnected) {
        // Send a ping to keep the connection alive
        socket.emit('user:ping', { userId });
        
        // Also check connection status
        if (!socket.connected) {
          setIsConnected(false);
          setConnectionStatus('disconnected');
        }
      }
    }, HEARTBEAT_INTERVAL);
    
    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [socket, isConnected, userId]);

  // Handle user join
  useEffect(() => {
    if (socket && username && isConnected) {
      socket.emit('user:join', { userId, username });
    }
  }, [socket, userId, username, isConnected]);

  return (
    <SocketContext.Provider value={{ 
      socket, 
      userId, 
      username, 
      setUsername, 
      isConnected,
      connectionStatus
    }}>
      {children}
    </SocketContext.Provider>
  );
}; 