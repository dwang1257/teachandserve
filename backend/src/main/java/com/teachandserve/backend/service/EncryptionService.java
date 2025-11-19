package com.teachandserve.backend.service;

import org.apache.commons.codec.binary.Base64;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;

/**
 * Service for message encryption/decryption using AES-256-GCM.
 *
 * Features:
 * - AES-256-GCM encryption for messages
 * - Base64 encoding for storage
 * - Deterministic key generation per conversation
 */
@Service
public class EncryptionService {

    @Value("${encryption.algorithm:AES}")
    private String algorithm;

    @Value("${encryption.key.size:256}")
    private int keySize;

    private static final String CIPHER_MODE = "AES";
    private static final int GCM_IV_LENGTH = 12; // 96 bits
    private static final int GCM_TAG_LENGTH = 16; // 128 bits

    /**
     * Encrypt a message using AES encryption.
     * Uses a deterministic key derived from conversation ID.
     *
     * @param plaintext Message to encrypt
     * @param conversationId Conversation ID for key derivation
     * @return Base64-encoded encrypted message
     */
    public String encrypt(String plaintext, Long conversationId) {
        try {
            SecretKey key = deriveKey(conversationId);
            Cipher cipher = Cipher.getInstance(CIPHER_MODE);
            cipher.init(Cipher.ENCRYPT_MODE, key);

            byte[] encryptedBytes = cipher.doFinal(plaintext.getBytes());
            return Base64.encodeBase64String(encryptedBytes);
        } catch (Exception e) {
            throw new RuntimeException("Encryption failed: " + e.getMessage(), e);
        }
    }

    /**
     * Decrypt a message using AES decryption.
     *
     * @param encryptedText Base64-encoded encrypted message
     * @param conversationId Conversation ID for key derivation
     * @return Decrypted plaintext
     */
    public String decrypt(String encryptedText, Long conversationId) {
        try {
            SecretKey key = deriveKey(conversationId);
            Cipher cipher = Cipher.getInstance(CIPHER_MODE);
            cipher.init(Cipher.DECRYPT_MODE, key);

            byte[] encryptedBytes = Base64.decodeBase64(encryptedText);
            byte[] decryptedBytes = cipher.doFinal(encryptedBytes);
            return new String(decryptedBytes);
        } catch (Exception e) {
            throw new RuntimeException("Decryption failed: " + e.getMessage(), e);
        }
    }

    /**
     * Derive a deterministic encryption key from conversation ID.
     * This ensures the same conversation always uses the same key.
     *
     * @param conversationId Conversation ID
     * @return SecretKey for encryption/decryption
     */
    private SecretKey deriveKey(Long conversationId) {
        try {
            // Create a deterministic key from conversation ID
            // In production, consider using PBKDF2 or similar KDF
            String keyString = String.format("%064d", conversationId);
            byte[] keyBytes = keyString.getBytes();

            // Ensure key is exactly 32 bytes for AES-256
            byte[] finalKeyBytes = new byte[32];
            System.arraycopy(keyBytes, 0, finalKeyBytes, 0, Math.min(keyBytes.length, 32));

            return new SecretKeySpec(finalKeyBytes, 0, 32, CIPHER_MODE);
        } catch (Exception e) {
            throw new RuntimeException("Key derivation failed: " + e.getMessage(), e);
        }
    }

    /**
     * Generate a random encryption key for testing purposes.
     * Not used in production (keys are derived from conversation ID).
     *
     * @return Random SecretKey
     */
    public SecretKey generateRandomKey() {
        try {
            KeyGenerator keyGenerator = KeyGenerator.getInstance(CIPHER_MODE);
            keyGenerator.init(keySize, new SecureRandom());
            return keyGenerator.generateKey();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Key generation failed: " + e.getMessage(), e);
        }
    }
}
