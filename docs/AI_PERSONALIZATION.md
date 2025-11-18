# AI Personalization System

## Overview

The LMN8 app now features a fully personalized AI companion that uses the user's profile data to provide tailored, empathetic responses. The AI system dynamically adapts its communication style, references, and support approach based on the user's specific profile information.

## Personalization Data Sources

### Primary Source: Backend Profile Data
- **Source:** User profile loaded from `/api/patient-auth/profile` after login
- **Priority:** Highest - used when available
- **Data:** Complete profile with all 8 onboarding questions

### Fallback Source: Local Onboarding Data
- **Source:** Onboarding data stored locally during profile completion
- **Priority:** Secondary - used when backend data unavailable
- **Data:** May be incomplete or outdated

## Profile Data Structure

```typescript
interface ProfileData {
  idol: string;                    // "Oprah Winfrey"
  personality: string;             // "Creative, analytical, empathetic"
  goals: string;                   // "Career success, better relationships, personal growth"
  challenges: string;              // "Anxiety, time management, self-doubt"
  communicationStyle: string;      // "Direct and honest, but supportive"
  interests: string;               // "Art, technology, nature, music"
  values: string;                  // "Honesty, creativity, family, growth"
  supportNeeds: string;            // "Motivation, accountability, emotional support"
}
```

## AI Personalization Features

### 1. Personalized Welcome Message

The AI generates a unique welcome message based on the user's profile:

**Example with Profile Data:**
```
Hello! I'm LMN8, your AI companion. I know you admire Oprah Winfrey - that's wonderful inspiration! I can see you're creative, analytical, empathetic. I'm here to help you work towards your goals: career success, better relationships, personal growth. I'll communicate with you in a direct and honest, but supportive way. How can I support you on your journey today?
```

**Fallback (No Profile):**
```
Hello! I'm LMN8, your AI companion, ready to help you on your journey. How can I support you today?
```

### 2. Dynamic System Prompt

The AI receives a comprehensive system prompt that includes:

#### User Profile Section
```
PERSONALIZED USER PROFILE:
- Idol/Inspiration: Oprah Winfrey
- Personality Traits: Creative, analytical, empathetic
- Life Goals: Career success, better relationships, personal growth
- Current Challenges: Anxiety, time management, self-doubt
- Preferred Communication Style: Direct and honest, but supportive
- Personal Interests: Art, technology, nature, music
- Core Values: Honesty, creativity, family, growth
- Support Needs: Motivation, accountability, emotional support
```

#### Personalization Instructions
```
PERSONALIZATION INSTRUCTIONS:
- Always respond in their preferred communication style: Direct and honest, but supportive
- Be understanding and supportive of their specific challenges: Anxiety, time management, self-doubt
- Help them work towards their stated goals: Career success, better relationships, personal growth
- Reference their core values when providing guidance: Honesty, creativity, family, growth
- Provide the specific type of support they need: Motivation, accountability, emotional support
- Use their interests as conversation starters and examples when relevant
- Draw inspiration from their idol (Oprah Winfrey) when appropriate for motivation
- Acknowledge their personality traits (Creative, analytical, empathetic) in your responses
- Keep responses conversational, empathetic, and encouraging
- Be concise but meaningful (2-3 sentences typically)
- Remember this is a therapeutic context - be professional yet warm
```

### 3. Contextual Responses

The AI uses profile data to provide contextually relevant responses:

#### Example Scenarios

**User asks about motivation:**
- **Profile Context:** User needs "Motivation, accountability" and admires "Oprah Winfrey"
- **AI Response:** "I know you value accountability and look up to Oprah Winfrey's resilience. Let's create a plan that holds you accountable while celebrating small wins, just like Oprah would encourage."

**User mentions anxiety:**
- **Profile Context:** User's challenges include "Anxiety, time management" and prefers "Direct and honest, but supportive" communication
- **AI Response:** "I understand anxiety and time management are challenges for you. Let's be direct about this - what specific aspect of your day is triggering the most anxiety right now? I'm here to support you through it."

**User discusses goals:**
- **Profile Context:** User's goals are "Career success, better relationships, personal growth" and values "Honesty, creativity, family, growth"
- **AI Response:** "Your goals of career success, better relationships, and personal growth align beautifully with your values of creativity, family, and growth. Which area feels most important to focus on right now?"

## Technical Implementation

### 1. Data Flow

```
User Login → Load Profile from API → Store in User Object → ChatContext Access → Generate System Prompt → AI Response
```

### 2. Code Structure

**ChatContext (`contexts/ChatContext.tsx`):**
```typescript
// Prioritize backend profile data over local onboarding data
const profileData = user?.profile || onboardingData;

// Generate personalized system prompt
const generateSystemPrompt = (): string => {
  // Uses profileData to create detailed AI instructions
};

// Generate personalized welcome message
React.useEffect(() => {
  // Creates custom welcome based on profile
}, [user?.profile, onboardingData]);
```

**AuthContext (`contexts/AuthContext.tsx`):**
```typescript
// Load profile data after successful login
const profileResponse = await profileAPI.getProfile();
if (profileResponse.success) {
  setUser(prevUser => ({ ...prevUser, profile: profileResponse.data }));
}
```

### 3. Console Logging

The system provides detailed logging for debugging:

```
🤖 Generating personalized AI prompt with profile data: {
  source: 'backend',
  profile: { idol: 'Oprah Winfrey', personality: 'Creative...', ... }
}

👋 Generated personalized welcome message: Hello! I'm LMN8, your AI companion...
```

## Benefits

### 1. Enhanced User Experience
- **Personalized Communication:** AI speaks in user's preferred style
- **Relevant References:** Uses user's interests and inspirations
- **Targeted Support:** Addresses specific challenges and goals
- **Emotional Connection:** References user's values and personality

### 2. Therapeutic Effectiveness
- **Consistent Approach:** AI maintains therapeutic context
- **Goal-Oriented:** Focuses on user's specific objectives
- **Challenge-Aware:** Understands and addresses user's struggles
- **Value-Aligned:** Responses align with user's core values

### 3. Scalability
- **Dynamic Loading:** Profile data loaded from backend
- **Fallback Support:** Works with or without profile data
- **Real-time Updates:** Profile changes reflect in AI behavior
- **Cross-Device Sync:** Consistent experience across devices

## Testing

### Manual Testing Steps

1. **Complete Onboarding:** Fill out all 8 profile questions
2. **Login:** Verify profile data loads from backend
3. **Start Chat:** Check personalized welcome message
4. **Send Messages:** Verify AI responses reference profile data
5. **Clear Chat:** Confirm personalized welcome regenerates

### Expected Behaviors

- **With Profile:** AI references specific user details in responses
- **Without Profile:** AI provides generic but supportive responses
- **Profile Changes:** AI adapts to updated profile information
- **Error Handling:** Graceful fallback when profile unavailable

## Future Enhancements

1. **Learning Adaptation:** AI learns from user interactions
2. **Mood Tracking:** Incorporate user's emotional state
3. **Progress Monitoring:** Track goal achievement over time
4. **Dynamic Prompts:** Adjust AI behavior based on user progress
5. **Multi-Modal Support:** Incorporate voice and visual cues
