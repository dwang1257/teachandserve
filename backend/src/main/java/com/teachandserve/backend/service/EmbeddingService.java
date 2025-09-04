package com.teachandserve.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class EmbeddingService {
    
    @Value("${openai.api.key:}")
    private String openaiApiKey;
    
    @Value("${openai.api.url:https://api.openai.com/v1/embeddings}")
    private String openaiApiUrl;
    
    private final RestTemplate restTemplate;
    
    public EmbeddingService() {
        this.restTemplate = new RestTemplate();
    }
    
    @Value("${embedding.strategy:SMART}")
    private String embeddingStrategy;
    
    @Value("${embedding.openai.threshold:100}")
    private int openaiUserThreshold;
    
    /**
     * Generate embeddings using smart hybrid strategy
     * MOCK: Always use mock embeddings (fast, free)
     * OPENAI: Always use OpenAI (best quality, costs money)  
     * SMART: Use mock for MVP, OpenAI for scale (default)
     */
    public List<Double> generateEmbedding(String text) {
        if (text == null || text.trim().isEmpty()) {
            return null;
        }
        
        EmbeddingStrategy strategy = determineStrategy();
        
        switch (strategy) {
            case MOCK_ONLY:
                return generateMockEmbedding(text);
                
            case OPENAI_ONLY:
                return generateOpenAIEmbedding(text);
                
            case SMART:
            default:
                // Use OpenAI for better quality, fallback to mock
                return generateSmartEmbedding(text);
        }
    }
    
    private EmbeddingStrategy determineStrategy() {
        if ("MOCK".equalsIgnoreCase(embeddingStrategy)) {
            return EmbeddingStrategy.MOCK_ONLY;
        } else if ("OPENAI".equalsIgnoreCase(embeddingStrategy)) {
            return EmbeddingStrategy.OPENAI_ONLY;
        } else {
            return EmbeddingStrategy.SMART;
        }
    }
    
    private List<Double> generateSmartEmbedding(String text) {
        // Smart strategy: Use OpenAI if available, mock as fallback
        if (openaiApiKey != null && !openaiApiKey.trim().isEmpty()) {
            try {
                return callOpenAIEmbeddingAPI(text);
            } catch (Exception e) {
                System.err.println("OpenAI failed, using mock embedding: " + e.getMessage());
                return generateMockEmbedding(text);
            }
        } else {
            return generateMockEmbedding(text);
        }
    }
    
    private List<Double> generateOpenAIEmbedding(String text) {
        if (openaiApiKey == null || openaiApiKey.trim().isEmpty()) {
            throw new RuntimeException("OpenAI API key not configured");
        }
        return callOpenAIEmbeddingAPI(text);
    }
    
    private enum EmbeddingStrategy {
        MOCK_ONLY,
        OPENAI_ONLY, 
        SMART
    }
    
    private List<Double> callOpenAIEmbeddingAPI(String text) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openaiApiKey);
        
        Map<String, Object> requestBody = Map.of(
            "model", "text-embedding-3-small",
            "input", text
        );
        
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
        
        ResponseEntity<Map> response = restTemplate.exchange(
            openaiApiUrl,
            HttpMethod.POST,
            request,
            Map.class
        );
        
        Map<String, Object> responseBody = response.getBody();
        if (responseBody != null && responseBody.containsKey("data")) {
            List<Map<String, Object>> data = (List<Map<String, Object>>) responseBody.get("data");
            if (!data.isEmpty()) {
                return (List<Double>) data.get(0).get("embedding");
            }
        }
        
        throw new RuntimeException("Invalid response from OpenAI API");
    }
    
    /**
     * Generate mock embeddings for development/testing
     * Creates a simple hash-based vector representation
     */
    private List<Double> generateMockEmbedding(String text) {
        // Create a simple deterministic embedding based on text content
        String normalizedText = text.toLowerCase().trim();
        int dimension = 384; // Common embedding dimension
        Double[] embedding = new Double[dimension];
        
        // Simple hash-based approach for consistent mock embeddings
        int hash = normalizedText.hashCode();
        for (int i = 0; i < dimension; i++) {
            // Create pseudo-random values based on text hash and position
            double value = Math.sin(hash + i * 0.1) * 0.5;
            embedding[i] = value;
        }
        
        // Normalize the vector
        double norm = 0.0;
        for (double val : embedding) {
            norm += val * val;
        }
        norm = Math.sqrt(norm);
        
        for (int i = 0; i < dimension; i++) {
            embedding[i] = embedding[i] / norm;
        }
        
        return List.of(embedding);
    }
    
    /**
     * Calculate cosine similarity between two embedding vectors
     */
    public double calculateCosineSimilarity(List<Double> vector1, List<Double> vector2) {
        if (vector1 == null || vector2 == null || vector1.size() != vector2.size()) {
            return 0.0;
        }
        
        double dotProduct = 0.0;
        double norm1 = 0.0;
        double norm2 = 0.0;
        
        for (int i = 0; i < vector1.size(); i++) {
            dotProduct += vector1.get(i) * vector2.get(i);
            norm1 += vector1.get(i) * vector1.get(i);
            norm2 += vector2.get(i) * vector2.get(i);
        }
        
        if (norm1 == 0.0 || norm2 == 0.0) {
            return 0.0;
        }
        
        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }
    
    /**
     * Combine bio and interests into a single text for embedding
     */
    public String createEmbeddingText(String bio, List<String> interests) {
        StringBuilder text = new StringBuilder();
        
        if (bio != null && !bio.trim().isEmpty()) {
            text.append(bio.trim());
        }
        
        if (interests != null && !interests.isEmpty()) {
            if (text.length() > 0) {
                text.append(" ");
            }
            text.append("Interests: ");
            text.append(String.join(", ", interests));
        }
        
        return text.toString();
    }
}