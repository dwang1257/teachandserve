package com.teachandserve.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket configuration for real-time messaging using STOMP protocol.
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
        // Enable a simple in-memory message broker
        // For production, consider using an external broker like RabbitMQ or ActiveMQ
        registry.enableSimpleBroker("/topic");

        // Prefix for messages bound for @MessageMapping methods
        registry.setApplicationDestinationPrefixes("/app");
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
