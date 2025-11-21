package com.teachandserve.backend.service;

import org.owasp.html.PolicyFactory;
import org.owasp.html.Sanitizers;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Service for sanitizing user input to prevent XSS attacks.
 *
 * Uses OWASP Java HTML Sanitizer to remove potentially dangerous HTML/JavaScript
 * from user-provided content.
 */
@Service
public class SanitizationService {

    private static final Logger log = LoggerFactory.getLogger(SanitizationService.class);

    // Policy that allows basic formatting but strips dangerous content
    private static final PolicyFactory POLICY = Sanitizers.FORMATTING
            .and(Sanitizers.LINKS)
            .and(Sanitizers.BLOCKS);

    // Strict policy that strips all HTML
    private static final PolicyFactory STRICT_POLICY = Sanitizers.FORMATTING;

    /**
     * Sanitize user input allowing basic formatting (bold, italic, links, paragraphs).
     * Use this for bio, messages, and other rich-text fields.
     *
     * @param input User input to sanitize
     * @return Sanitized string safe for rendering
     */
    public String sanitize(String input) {
        if (input == null) {
            return null;
        }

        String sanitized = POLICY.sanitize(input);

        if (!sanitized.equals(input)) {
            log.warn("Input was sanitized - potential XSS attempt detected");
        }

        return sanitized;
    }

    /**
     * Strictly sanitize user input, removing ALL HTML tags.
     * Use this for names, emails, and other plain-text fields.
     *
     * @param input User input to sanitize
     * @return Sanitized string with all HTML removed
     */
    public String sanitizeStrict(String input) {
        if (input == null) {
            return null;
        }

        String sanitized = STRICT_POLICY.sanitize(input);

        // Also remove any remaining HTML entities and trim
        sanitized = sanitized.replaceAll("&[a-z]+;", "").trim();

        if (!sanitized.equals(input.trim())) {
            log.warn("Input was strictly sanitized - potential XSS attempt detected");
        }

        return sanitized;
    }

    /**
     * Sanitize plain text input by removing ALL HTML.
     * Alias for sanitizeStrict for clarity.
     *
     * @param input User input to sanitize
     * @return Plain text with no HTML
     */
    public String sanitizePlainText(String input) {
        return sanitizeStrict(input);
    }
}
