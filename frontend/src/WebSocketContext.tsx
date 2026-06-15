import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Client } from '@stomp/stompjs';
import { useAuth } from './authContext';

interface WebSocketContextType {
  connected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({
  connected: false,
});

export const useWebSocket = () => useContext(WebSocketContext);

export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { auth } = useAuth();
  const [connected, setConnected] = useState(false);
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    if (!auth?.token) {
      if (client) {
        client.deactivate();
        setClient(null);
        setConnected(false);
      }
      return;
    }

    const stompClient = new Client({
      brokerURL: 'ws://localhost:8080/ws-gym',
      connectHeaders: {
        Authorization: `Bearer ${auth.token}`
      },
      debug: (str) => {
        // console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    stompClient.onConnect = (frame) => {
      setConnected(true);
      // We can subscribe to notifications here
      stompClient.subscribe('/user/queue/notifications', (message) => {
        // Handle incoming notifications (e.g. update state, show toast)
        console.log("New notification: ", message.body);
      });
    };

    stompClient.onStompError = (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    };

    stompClient.onWebSocketClose = () => {
      setConnected(false);
    };

    stompClient.activate();
    setClient(stompClient);

    return () => {
      stompClient.deactivate();
    };
  }, [auth]);

  return (
    <WebSocketContext.Provider value={{ connected }}>
      {children}
    </WebSocketContext.Provider>
  );
};
