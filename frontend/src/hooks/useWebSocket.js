import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { useApiClient } from '../api/client';

const useWebSocket = () => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const reconnectTimeoutRef = useRef(null);
  const maxReconnectAttempts = 5;
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (socket?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`);
      
      ws.onopen = () => {
        console.log('🔌 WebSocket connected');
        setConnected(true);
        setSocket(ws);
        reconnectAttemptsRef.current = 0;
        
        // Authenticate with JWT token
        const { token } = useAuth.getState();
        if (token) {
          ws.send(JSON.stringify({
            type: 'auth',
            token
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          
          // Handle different message types
          switch (data.type) {
            case 'broadcast':
              console.log('🔌 Broadcast received:', data.message);
              break;
            case 'appointment_update':
              // Handle appointment updates
              console.log('🔌 Appointment update:', data.data);
              break;
            case 'new_bill':
              // Handle new bill notifications
              console.log('🔌 New bill:', data.data);
              break;
            case 'queue_update':
              // Handle queue updates
              console.log('🔌 Queue update:', data.data);
              break;
            default:
              console.log('🔌 Message received:', data);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setConnected(false);
        setSocket(null);
        
        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          
          console.log(`🔌 Reconnecting in ${delay}ms... (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.error('🔌 Max reconnection attempts reached');
        }
      };

      ws.onerror = (error) => {
        console.error('🔌 WebSocket error:', error);
        setConnected(false);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setConnected(false);
    }
  }, [socket]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (socket) {
      socket.close();
      setSocket(null);
      setConnected(false);
    }
    
    reconnectAttemptsRef.current = 0;
  }, [socket]);

  const sendMessage = useCallback((message) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, [socket]);

  const joinRoom = useCallback((roomName) => {
    sendMessage({
      type: 'join_room',
      room: roomName
    });
  }, [sendMessage]);

  const leaveRoom = useCallback((roomName) => {
    sendMessage({
      type: 'leave_room',
      room: roomName
    });
  }, [sendMessage]);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    socket,
    connected,
    lastMessage,
    sendMessage,
    joinRoom,
    leaveRoom,
    disconnect
  };
};

export default useWebSocket;
