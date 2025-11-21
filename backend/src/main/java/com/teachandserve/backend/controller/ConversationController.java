package com.teachandserve.backend.controller;

import com.teachandserve.backend.dto.*;
import com.teachandserve.backend.model.Conversation;
import com.teachandserve.backend.model.User;
import com.teachandserve.backend.service.ConversationService;
import com.teachandserve.backend.service.MessageService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST controller for conversation management.
 *
 * Endpoints:
 * - POST /api/conversations: Create or get a 1:1 conversation
 * - GET /api/conversations: List user's conversations
 * - GET /api/conversations/{id}: Get conversation details with messages
 * - POST /api/conversations/{id}/messages: Send a message
 * - POST /api/conversations/{id}/read: Mark messages as read
 */
@RestController
@RequestMapping("/api/conversations")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class ConversationController {

    private final ConversationService conversationService;
    private final MessageService messageService;

    public ConversationController(ConversationService conversationService,
                                 MessageService messageService) {
        this.conversationService = conversationService;
        this.messageService = messageService;
    }

    /**
     * Create or get a 1:1 conversation with a peer user.
     * This endpoint is idempotent - multiple calls return the same conversation.
     *
     * @param request Request containing peer user ID
     * @param user    Authenticated user
     * @return Conversation ID
     */
    @PostMapping
    public ResponseEntity<?> createOrGetConversation(
            @Valid @RequestBody CreateOrGetConversationRequest request,
            @AuthenticationPrincipal User user) {
        try {
            Conversation conversation = conversationService.getOrCreate1to1Conversation(
                    user.getId(), request.getPeerUserId());

            ConversationResponse response = conversationService.toConversationResponse(conversation, user.getId());

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all conversations for the authenticated user.
     * Returns conversations ordered by most recently updated first.
     * Includes participants, last message, and unread count.
     *
     * @param user Authenticated user
     * @return List of conversations
     */
    @GetMapping
    public ResponseEntity<List<ConversationResponse>> getUserConversations(
            @AuthenticationPrincipal User user) {
        List<ConversationResponse> conversations =
                conversationService.getUserConversations(user.getId());
        return ResponseEntity.ok(conversations);
    }

    /**
     * Get conversation details with paginated messages.
     *
     * @param id     Conversation ID
     * @param before Optional message ID for pagination (get messages before this ID)
     * @param limit  Number of messages to retrieve (default 50, max 100)
     * @param user   Authenticated user
     * @return Map containing conversation details and messages
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getConversation(
            @PathVariable Long id,
            @RequestParam(required = false) Long before,
            @RequestParam(defaultValue = "50") int limit,
            @AuthenticationPrincipal User user) {
        try {
            // Validate limit
            if (limit > 100) {
                limit = 100;
            }

            Conversation conversation = conversationService.getConversation(id, user.getId());
            List<MessageResponse> messages = messageService.getMessages(
                    id, user.getId(), before, limit);

            Map<String, Object> response = new HashMap<>();
            response.put("id", conversation.getId());
            response.put("createdAt", conversation.getCreatedAt());
            response.put("updatedAt", conversation.getUpdatedAt());
            response.put("messages", messages);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Send a message in a conversation.
     *
     * @param id      Conversation ID
     * @param request Request containing message body
     * @param user    Authenticated user
     * @return Sent message
     */
    @PostMapping("/{id}/messages")
    public ResponseEntity<?> sendMessage(
            @PathVariable Long id,
            @Valid @RequestBody SendMessageRequest request,
            @AuthenticationPrincipal User user) {
        try {
            MessageResponse message = messageService.sendMessage(id, user.getId(), request.getBody());
            return ResponseEntity.ok(message);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Mark messages as read up to a specific message ID.
     * This marks all messages with ID <= lastMessageId as read for the authenticated user.
     *
     * @param id      Conversation ID
     * @param request Request containing last message ID to mark as read
     * @param user    Authenticated user
     * @return Success message
     */
    @PostMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(
            @PathVariable Long id,
            @Valid @RequestBody MarkAsReadRequest request,
            @AuthenticationPrincipal User user) {
        try {
            messageService.markMessagesAsRead(id, user.getId(), request.getLastMessageId());
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(403).body(Map.of("error", e.getMessage()));
        }
    }
}
