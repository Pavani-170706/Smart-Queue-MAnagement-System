import SockJS from 'sockjs-client/dist/sockjs';
import { Client } from '@stomp/stompjs';

const WS_BASE = process.env.REACT_APP_WS_URL || '';

let stompClient = null;
const subscribers = new Map();

export function connectWebSocket() {
  if (stompClient && stompClient.connected) return;

  stompClient = new Client({
    webSocketFactory: () => new SockJS(`${WS_BASE}/ws`),
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    onConnect: () => {
      console.log('[WS] Connected');
      // Re-subscribe to all active subscriptions
      subscribers.forEach((callback, topic) => {
        stompClient.subscribe(topic, (message) => {
          try {
            const data = JSON.parse(message.body);
            callback(data);
          } catch (e) {
            callback(message.body);
          }
        });
      });
    },
    onStompError: (frame) => {
      console.error('[WS] Error:', frame.headers?.message || 'Unknown error');
    },
    onDisconnect: () => {
      console.log('[WS] Disconnected');
    },
  });

  stompClient.activate();
}

export function subscribeToQueue(doctorId, callback) {
  const topic = `/topic/queue/${doctorId}`;
  subscribers.set(topic, callback);

  if (stompClient && stompClient.connected) {
    stompClient.subscribe(topic, (message) => {
      try {
        const data = JSON.parse(message.body);
        callback(data);
      } catch (e) {
        callback(message.body);
      }
    });
  }

  return () => {
    subscribers.delete(topic);
  };
}

export function subscribeToNotifications(userId, callback) {
  const topic = `/topic/notifications/${userId}`;
  subscribers.set(topic, callback);

  if (stompClient && stompClient.connected) {
    stompClient.subscribe(topic, (message) => {
      try {
        const data = JSON.parse(message.body);
        callback(data);
      } catch (e) {
        callback(message.body);
      }
    });
  }

  return () => {
    subscribers.delete(topic);
  };
}

export function disconnectWebSocket() {
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
    subscribers.clear();
  }
}
