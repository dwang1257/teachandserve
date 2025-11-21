package com.teachandserve.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

/**
 * Service for rate limiting message sending.
 *
 * Limits: 60 messages per minute per user
 * Uses Redis for distributed rate limiting across multiple instances.
 */
@Service
public class RateLimitingService {

    private final RedisTemplate<String, Object> redisTemplate;

    @Value("${rate.limit.enabled:true}")
    private boolean rateLimitEnabled;

    @Value("${rate.limit.messages.per.minute:60}")
    private int messagesPerMinute;

    @Value("${rate.limit.messages.window.seconds:60}")
    private int windowSeconds;

    public RateLimitingService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * Check if user has exceeded message rate limit.
     *
     * Uses sliding window counter with Redis:
     * - Key: "rate_limit:messages:{userId}"
     * - Increments counter on each message
     * - Expires after window period
     *
     * @param userId User ID
     * @return true if user is within limit, false if exceeded
     */
    public boolean allowMessage(Long userId) {
        if (!rateLimitEnabled) {
            return true;
        }

        String key = buildRateLimitKey(userId);

        try {
            // Get current count
            Object countObj = redisTemplate.opsForValue().get(key);
            int count = countObj != null ? Integer.parseInt(countObj.toString()) : 0;

            // Check limit
            if (count >= messagesPerMinute) {
                return false;
            }

            // Increment counter
            redisTemplate.opsForValue().increment(key);

            // Set expiration on first message
            if (count == 0) {
                redisTemplate.expire(key, windowSeconds, TimeUnit.SECONDS);
            }

            return true;
        } catch (Exception e) {
            // Fail open - allow message if Redis is unavailable
            return true;
        }
    }

    /**
     * Get remaining messages for user in current window.
     *
     * @param userId User ID
     * @return Number of remaining messages allowed (0 if limit exceeded)
     */
    public int getRemainingMessages(Long userId) {
        if (!rateLimitEnabled) {
            return messagesPerMinute;
        }

        String key = buildRateLimitKey(userId);

        try {
            Object countObj = redisTemplate.opsForValue().get(key);
            int count = countObj != null ? Integer.parseInt(countObj.toString()) : 0;
            return Math.max(0, messagesPerMinute - count);
        } catch (Exception e) {
            return messagesPerMinute;
        }
    }

    /**
     * Get time until rate limit resets for user.
     *
     * @param userId User ID
     * @return Seconds remaining until limit resets (0 if no active limit)
     */
    public long getResetTime(Long userId) {
        String key = buildRateLimitKey(userId);

        try {
            Long ttl = redisTemplate.getExpire(key, TimeUnit.SECONDS);
            return ttl != null && ttl > 0 ? ttl : 0;
        } catch (Exception e) {
            return 0;
        }
    }

    /**
     * Reset rate limit for user (admin operation).
     *
     * @param userId User ID
     */
    public void resetLimit(Long userId) {
        String key = buildRateLimitKey(userId);
        redisTemplate.delete(key);
    }

    private String buildRateLimitKey(Long userId) {
        return "rate_limit:messages:" + userId;
    }
}
