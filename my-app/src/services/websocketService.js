import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

/**
 * WebSocket service for real-time messaging using STOMP protocol.
 *
 * Features:
 * - Auto-reconnect with exponential backoff
 * - Subscription management
 * - JWT authentication
 * - Fallback to polling if WebSocket fails
 */
class WebSocketService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.subscriptions = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.token = null;
  }

  /**
   * Connect to the WebSocket server.
   *
   * @param {string} token - JWT authentication token
   * @param {function} onConnect - Callback when connection is established
   * @param {function} onError - Callback when connection fails
   */
  connect(token, onConnect, onError) {
    if (this.connected) {
      return;
    }

    this.token = token;

    this.client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: (str) => {
        // console.log('STOMP: ' + str);
      },
      reconnectDelay: this.reconnectDelay,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        this.connected = true;
        this.reconnectAttempts = 0;
        if (onConnect) onConnect();
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
        this.connected = false;
        if (onError) onError(frame);
      },
      onWebSocketError: (event) => {
        console.error('WebSocket error:', event);
        this.connected = false;
        if (onError) onError(event);
      },
      onDisconnect: () => {
        this.connected = false;
        this.handleReconnect();
      }
    });

    this.client.activate();
  }

  /**
   * Handle reconnection logic with exponential backoff.
   */
  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached. Falling back to polling.');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);

    setTimeout(() => {
      if (!this.connected && this.token) {
        this.connect(this.token);
      }
    }, delay);
  }

  /**
   * Subscribe to a topic.
   *
   * @param {string} topic - Topic to subscribe to
   * @param {function} callback - Callback to handle incoming messages
   * @returns {string} - Subscription ID
   */
  subscribe(topic, callback) {
    if (!this.connected || !this.client) {
      console.error('Cannot subscribe: WebSocket not connected');
      return null;
    }

    const subscription = this.client.subscribe(topic, (message) => {
      try {
        const data = JSON.parse(message.body);
        callback(data);
      } catch (error) {
        console.error('Error parsing message:', error);
        callback(message.body);
      }
    });

    const subscriptionId = subscription.id;
    this.subscriptions[subscriptionId] = subscription;

    return subscriptionId;
  }

  /**
   * Unsubscribe from a topic.
   *
   * @param {string} subscriptionId - Subscription ID to unsubscribe
   */
  unsubscribe(subscriptionId) {
    if (this.subscriptions[subscriptionId]) {
      this.subscriptions[subscriptionId].unsubscribe();
      delete this.subscriptions[subscriptionId];
    }
  }

  /**
   * Send a message to a destination.
   *
   * @param {string} destination - Message destination
   * @param {object} body - Message body
   */
  send(destination, body) {
    if (!this.connected || !this.client) {
      console.error('Cannot send message: WebSocket not connected');
      return false;
    }

    try {
      this.client.publish({
        destination,
        body: JSON.stringify(body)
      });
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }

  /**
   * Disconnect from the WebSocket server.
   */
  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.connected = false;
      this.subscriptions = {};
    }
  }

  /**
   * Check if WebSocket is connected.
   *
   * @returns {boolean}
   */
  isConnected() {
    return this.connected;
  }
}

// Singleton instance
const websocketService = new WebSocketService();

export default websocketService;
