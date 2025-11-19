package com.teachandserve.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket configuration for real-time messaging using STOMP protocol.
 *
 * Supports both single-instance and distributed deployment:
 * - Single instance: In-memory broker (development)
 * - Multi-instance: Redis Pub/Sub broker (production)
 *
 * Endpoints:
 * - /ws: WebSocket handshake endpoint with SockJS fallback
 *
 * Message destinations:
 * - /app: Prefix for application-level messages
 * - /topic: Prefix for broker destinations (subscriptions)
 *
 * Topics:
 * - /topic/conversations.{conversationId}.messages: Message broadcasts for a conversation
 * - /topic/users.{userId}.conversations: Conversation updates for a user
 * - /topic/users.{userId}.read-receipts: Read receipt notifications for a user
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Enable simple in-memory broker for development
        // For production with multi-instance, use STOMP broker relay
        registry.enableSimpleBroker("/topic");

        // Production: Use external broker relay for Redis Pub/Sub
        // Uncomment below for multi-instance deployments
        /*
        registry.enableStompBrokerRelay("/topic")
                .setRelayHost("localhost")
                .setRelayPort(61613)
                .setVirtualHost("/")
                .setAutoStartup(true)
                .setClientPasscode("")
                .setClientLogin("")
                .setSystemPasscode("")
                .setSystemLogin("");
        */

        // Prefix for messages bound for @MessageMapping methods
        registry.setApplicationDestinationPrefixes("/app");

        // Allow time for broker operations
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register the "/ws" endpoint for WebSocket handshake
        // SockJS fallback enables browser compatibility
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("http://localhost:3000", "http://localhost:3001")
                .withSockJS();
    }
}
