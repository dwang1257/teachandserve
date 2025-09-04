# 🧪 Mock Embeddings Testing Guide

## Overview
This guide shows you how to test the mock embeddings system manually using the frontend and API endpoints.

## ✅ Mock Embeddings Configuration
Your system is configured with:
```properties
embedding.strategy=MOCK
```
This means:
- **No API costs** - Everything runs locally
- **Fast generation** - Instant embedding creation
- **Deterministic** - Same text = same embedding
- **384 dimensions** - Standard embedding size

## 🚀 Testing Steps

### 1. Start the System
```bash
# Backend (already running on port 8080)
cd backend && ./mvnw spring-boot:run

# Frontend
cd my-app && npm start
```

### 2. Create Test Users via Frontend

#### Option A: Via Web Interface
1. Go to http://localhost:3000
2. Click "Get Started" 
3. Create accounts:
   - **Mentor**: `mentor@test.com` / `SecurePass123!` / MENTOR
   - **Mentee**: `mentee@test.com` / `SecurePass123!` / MENTEE

#### Option B: Via API (curl)
```bash
# Create Mentor
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "mentor@test.com", "password": "SecurePass123!", "role": "MENTOR"}'

# Create Mentee  
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "mentee@test.com", "password": "SecurePass123!", "role": "MENTEE"}'
```

### 3. Complete Profiles
After logging in, you'll see a **"Complete Profile"** prompt:

#### Mentor Profile Example:
```
Bio: "I'm a senior React developer with 5 years of experience building scalable web applications. I specialize in modern JavaScript, React ecosystem, and mentoring junior developers. I'm passionate about clean code and helping others grow their careers."

Interests: React, JavaScript, Web Development, Mentoring, Career Growth
Goals: Help 10 developers this year, Share React knowledge, Build mentoring community
Skills: React, Node.js, TypeScript, Leadership
Experience Level: Advanced
```

#### Mentee Profile Example:
```
Bio: "I'm a computer science student learning React and JavaScript. I want to become a frontend developer and build amazing user interfaces. I'm looking for guidance on best practices and career advice."

Interests: React, JavaScript, Frontend Development, Learning, Career Development  
Goals: Land first developer job, Master React, Build portfolio projects
Skills: HTML, CSS, JavaScript, Git
Experience Level: Beginner
```

### 4. Test Matching System

#### Check Mock Embeddings Generation:
1. After saving profile, check browser console for embedding logs
2. Profile should be marked as "complete"
3. Dashboard should show "Profile Complete" status

#### Test Similarity Matching:
The mock embedding system should match users with similar interests:
- **React Mentee** ↔ **React Mentor** (high similarity)
- **Data Science Mentee** ↔ **ML Mentor** (high similarity)
- **Frontend Mentee** ↔ **Backend Mentor** (lower similarity)

### 5. Verify Mock Embeddings Work

#### Via Database (if you have psql access):
```sql
-- Check if embeddings were generated
SELECT 
  u.email, 
  u.role,
  p.bio IS NOT NULL as has_bio,
  p.bio_embedding IS NOT NULL as has_embedding,
  json_array_length(p.bio_embedding) as embedding_dimensions
FROM users u 
JOIN user_profiles p ON u.id = p.user_id;
```

#### Via API Endpoint:
```bash
# Get your profile (replace TOKEN with actual JWT)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8080/api/profile/me

# Should return profile with embeddings (internal field)
```

#### Via Frontend Dashboard:
- Profile completion warning should disappear
- Matching should work (find matches based on interests)
- Search functionality should return relevant results

## 🎯 What Mock Embeddings Do

### Text Processing:
```
Input: "I love React and JavaScript development"
↓
Mock Algorithm: Hash-based vector generation
↓
Output: [0.123, -0.456, 0.789, ..., 0.321] (384 dimensions)
```

### Similar Texts → Similar Vectors:
- "React developer" ≈ "React programmer" (high similarity)
- "Frontend" ≈ "UI development" (medium similarity)  
- "React" ≠ "Python" (low similarity)

### Matching Process:
1. **Profile Creation** → Generate embedding from bio + interests
2. **Find Matches** → Calculate cosine similarity with all other users
3. **Rank Results** → Return top matches sorted by similarity score

## 🔍 Expected Test Results

### ✅ Working Correctly:
- Profile saves successfully with completion status
- Users with similar interests/bios get matched
- Search returns relevant results
- No API calls to external services
- Fast response times (<100ms)

### ❌ Issues to Debug:
- Profile marked as incomplete after saving
- No matches found for any user
- All similarity scores are 0
- Console errors about embedding generation

## 🚨 Common Issues & Solutions

### Issue: "Profile not complete" 
**Solution**: Ensure bio is 50+ characters and all required fields filled

### Issue: "No matches found"
**Solution**: Create at least 2 users with different roles (mentor + mentee)

### Issue: "Embedding generation failed"
**Solution**: Check backend logs for errors in EmbeddingService

### Issue: "Database errors"
**Solution**: Ensure PostgreSQL is running and user_profiles table exists

## 📊 Mock vs Real Embeddings Quality

### Mock Embeddings (Current):
- ✅ Fast (instant)
- ✅ Free (no costs)
- ✅ Privacy (local only)
- ❌ Basic quality (keyword matching mostly)
- ❌ No semantic understanding

### OpenAI Embeddings (Future):
- ❌ Slower (200-500ms)
- ❌ Costs money (~$0.00002/1K tokens)
- ❌ Privacy concerns (data sent to OpenAI)
- ✅ Excellent quality (semantic understanding)
- ✅ Understands context and nuance

## 🎉 Success Indicators

If you see these, mock embeddings are working perfectly:

1. **Profile Creation**: ✅ "Profile saved successfully"
2. **Completion Status**: ✅ Profile marked as complete
3. **Dashboard**: ✅ No "complete profile" warning
4. **Matching**: ✅ Similar users appear in matches
5. **Search**: ✅ Interest-based search returns results
6. **Performance**: ✅ All operations under 100ms

## 🔄 Next Steps

Once mock embeddings are working:
1. **Add OpenAI API key** for better quality
2. **A/B test** mock vs OpenAI matching
3. **Monitor** user engagement and match success
4. **Scale** to handle more users

## 🛠 Development Tips

1. **Check logs** - Backend console shows embedding generation
2. **Use browser dev tools** - Network tab shows API calls
3. **Test edge cases** - Empty bios, special characters, long text
4. **Performance monitoring** - Check response times
5. **Database inspection** - Verify embeddings are stored correctly

Ready to test! 🚀