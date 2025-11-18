# LMN8 Onboarding Questions Guide

This document outlines the complete onboarding flow for both Full-Track and Fast-Track options, including all questions and their corresponding data structure for API integration.

## Overview

The LMN8 app offers two onboarding paths:
- **Full-Track**: 13 comprehensive questions for deep personalization
- **Fast-Track**: 8 essential questions for quick setup

Both flows collect user data to create a personalized AI companion experience.

## Data Structure

### Full-Track Onboarding Data
```typescript
interface FullTrackOnboardingData {
  inspirationFigure: string;        // Who inspires them
  inspirationQuality: string;       // What qualities they admire
  actorAuthorStyle: string;         // Preferred creative voice
  actorAuthorTone: string;          // Preferred communication tone
  spiritualPractices: string;       // Values and practices
  spiritualReflection: string;      // How AI should reflect values
  lifeLandscape: string;            // Current life metaphor
  safePlace: string;                // Safe space in their journey
  strengthSymbol: string;           // Symbol of strength
  sensoryAnchor: string;            // Comforting sensory experience
  chapterTitle: string;             // Current life chapter title
  strengthMoment: string;           // Recent moment of strength
  primaryHope: string;              // Main transformation goal
  copingPattern: string;            // Stress response pattern
}
```

### Fast-Track Onboarding Data
```typescript
interface FastTrackOnboardingData {
  inspirationFigure: string;        // Who inspires them
  inspirationQuality: string;       // What qualities they admire
  actorAuthorStyle: string;         // Preferred creative voice
  actorAuthorTone: string;          // Preferred communication tone
  spiritualPractices: string;       // Values and practices
  spiritualReflection: string;      // How AI should reflect values
  chapterTitle: string;             // Current life chapter title
  primaryHope: string;              // Main transformation goal
}
```

## Full-Track Onboarding Questions

### Part 1: Discovering Your Companion's Voice

#### Q1: Inspiration Figure
**Question:** "If you could sit down for dinner or a drink with any person — real or fictional, living or from history — who would it be?"
- **Field:** `inspirationFigure`
- **Purpose:** Identifies the user's role model or inspiration
- **Example Response:** "Oprah Winfrey, Albert Einstein, my grandmother, a fictional character..."

#### Q2: Inspiration Qualities
**Question:** "What is it about them — their voice, their wisdom, their humor — that makes you choose them?"
- **Field:** `inspirationQuality`
- **Purpose:** Understands what specific qualities the user admires
- **Example Response:** "Their gentle wisdom, their humor, their courage, their perspective..."

#### Q3: Creative Voice
**Question:** "Who are one or two actors, authors, or artists whose style really resonates with you?"
- **Field:** `actorAuthorStyle`
- **Purpose:** Identifies preferred communication style
- **Example Response:** "Maya Angelou, Morgan Freeman, Brené Brown, David Attenborough..."

#### Q4: Communication Tone
**Question:** "What about their way of being, their tone, or the feeling they bring connects with you most?"
- **Field:** `actorAuthorTone`
- **Purpose:** Defines the preferred emotional tone
- **Example Response:** "Their calm presence, their passionate delivery, their gentle humor..."

#### Q5: Values and Practices
**Question:** "Are there any spiritual practices, traditions, or things that matter most to you in life that are important?"
- **Field:** `spiritualPractices`
- **Purpose:** Identifies core values and beliefs
- **Example Response:** "Meditation, nature, family, creativity, service to others..."

#### Q6: AI Reflection of Values
**Question:** "How would you want your companion to reflect or honor what matters to you?"
- **Field:** `spiritualReflection`
- **Purpose:** Defines how AI should embody user's values
- **Example Response:** "Remind me of what matters, help me stay grounded, encourage my growth..."

### Part 2: Mapping Your Inner World

#### Q7: Life Landscape
**Question:** "If this chapter of your life were a landscape — maybe a forest, a river, a storm, or a city street — what would it look and feel like?"
- **Field:** `lifeLandscape`
- **Purpose:** Creates a metaphor for current life situation
- **Example Response:** "A winding mountain path, a calm ocean, a bustling city at dawn..."

#### Q8: Safe Place
**Question:** "And in that landscape, what would a safe or restful place look like for you?"
- **Field:** `safePlace`
- **Purpose:** Identifies comfort and safety needs
- **Example Response:** "A quiet garden, a cozy cabin, a peaceful meadow..."

#### Q9: Strength Symbol
**Question:** "What's a simple symbol of strength or peace for you right now — maybe an animal, a tree, an object, or an image?"
- **Field:** `strengthSymbol`
- **Purpose:** Identifies personal symbols of resilience
- **Example Response:** "An oak tree, a lighthouse, a phoenix, a mountain..."

#### Q10: Sensory Anchor
**Question:** "What sound, type of music, color, or texture feels most grounding or healing for you right now?"
- **Field:** `sensoryAnchor`
- **Purpose:** Identifies comforting sensory experiences
- **Example Response:** "Ocean waves, classical music, the color blue, soft fabrics..."

### Part 3: Your Current Chapter & Compass

#### Q11: Chapter Title
**Question:** "If this chapter of your life had a title, what would you call it?"
- **Field:** `chapterTitle`
- **Purpose:** Names the current life phase
- **Example Response:** "The Awakening", "Finding My Voice", "New Beginnings"...

#### Q12: Strength Moment
**Question:** "Tell me about a recent moment, even a small one, where you felt a glimpse of yourself at your best."
- **Field:** `strengthMoment`
- **Purpose:** Identifies recent positive experiences
- **Example Response:** "When I helped a friend, when I completed a difficult task, when I spoke up for myself..."

#### Q13: Primary Hope
**Question:** "What's the biggest shift or change you hope this journey will bring for you?"
- **Field:** `primaryHope`
- **Purpose:** Defines the main transformation goal
- **Example Response:** "More confidence, better relationships, inner peace, clarity about my purpose..."

#### Q14: Coping Pattern
**Question:** "When things feel overwhelming, what do you usually do first?"
- **Field:** `copingPattern`
- **Purpose:** Identifies stress response patterns
- **Example Response:** "I take a walk, I call a friend, I journal, I take deep breaths..."

## Fast-Track Onboarding Questions

### Essential Questions Only

#### Q1: Inspiration Figure
**Question:** "If you could sit down for dinner or a drink with any person — real or fictional, living or from history — who would it be?"
- **Field:** `inspirationFigure`
- **Same as Full-Track Q1**

#### Q2: Inspiration Qualities
**Question:** "What is it about them — their voice, wisdom, humor, or presence — that makes you choose them?"
- **Field:** `inspirationQuality`
- **Same as Full-Track Q2**

#### Q3: Creative Voice
**Question:** "Who's one actor or author whose style or way of being really resonates with you?"
- **Field:** `actorAuthorStyle`
- **Simplified version of Full-Track Q3**

#### Q4: Communication Tone
**Question:** "What part of their style or tone feels most supportive to you?"
- **Field:** `actorAuthorTone`
- **Simplified version of Full-Track Q4**

#### Q5: Values and Practices
**Question:** "Are there any traditions, practices, or things that matter most to you in life?"
- **Field:** `spiritualPractices`
- **Simplified version of Full-Track Q5**

#### Q6: AI Reflection of Values
**Question:** "How would you want your companion to reflect or honor that?"
- **Field:** `spiritualReflection`
- **Simplified version of Full-Track Q6**

#### Q7: Chapter Title
**Question:** "If this chapter of your life had a title, what would you call it?"
- **Field:** `chapterTitle`
- **Same as Full-Track Q11**

#### Q8: Primary Hope
**Question:** "What's the single biggest change or shift you hope this journey will bring?"
- **Field:** `primaryHope`
- **Simplified version of Full-Track Q13**

## API Integration

### Legacy Data Mapping

Both onboarding flows map to the existing `OnboardingData` interface:

```typescript
interface OnboardingData {
  idol: string;                    // Maps from inspirationFigure
  personality: string;             // Combines inspirationQuality + actorAuthorStyle
  goals: string;                   // Maps from primaryHope
  challenges: string;              // Combines chapterTitle + lifeLandscape (Full-Track only)
  communicationStyle: string;      // Combines actorAuthorTone + spiritualPractices
  interests: string;               // Combines strengthSymbol + sensoryAnchor (Full-Track) or spiritualPractices (Fast-Track)
  values: string;                  // Maps from spiritualPractices
  supportNeeds: string;            // Combines copingPattern + strengthMoment (Full-Track) or spiritualReflection (Fast-Track)
}
```

### Full-Track Mapping
```typescript
const legacyOnboardingData = {
  idol: onboardingData.inspirationFigure,
  personality: `${onboardingData.inspirationQuality} with the style of ${onboardingData.actorAuthorStyle}`,
  goals: onboardingData.primaryHope,
  challenges: `Current chapter: ${onboardingData.chapterTitle}. Life feels like ${onboardingData.lifeLandscape}`,
  communicationStyle: `${onboardingData.actorAuthorTone} that honors ${onboardingData.spiritualPractices}`,
  interests: `${onboardingData.strengthSymbol} and ${onboardingData.sensoryAnchor}`,
  values: onboardingData.spiritualPractices,
  supportNeeds: `Help me with ${onboardingData.copingPattern} and remind me of ${onboardingData.strengthMoment}`,
};
```

### Fast-Track Mapping
```typescript
const legacyOnboardingData = {
  idol: onboardingData.inspirationFigure,
  personality: `${onboardingData.inspirationQuality} with the style of ${onboardingData.actorAuthorStyle}`,
  goals: onboardingData.primaryHope,
  challenges: `Current chapter: ${onboardingData.chapterTitle}`,
  communicationStyle: `${onboardingData.actorAuthorTone} that honors ${onboardingData.spiritualPractices}`,
  interests: `Values: ${onboardingData.spiritualPractices}`,
  values: onboardingData.spiritualPractices,
  supportNeeds: `Help me with ${onboardingData.spiritualReflection}`,
};
```

## Profile API Endpoint Structure

### Recommended API Schema

```typescript
interface ProfileData {
  // Core Identity
  inspirationFigure: string;
  inspirationQuality: string;
  
  // Communication Preferences
  actorAuthorStyle: string;
  actorAuthorTone: string;
  
  // Values & Beliefs
  spiritualPractices: string;
  spiritualReflection: string;
  
  // Current Life Context
  chapterTitle: string;
  primaryHope: string;
  
  // Full-Track Only Fields
  lifeLandscape?: string;
  safePlace?: string;
  strengthSymbol?: string;
  sensoryAnchor?: string;
  strengthMoment?: string;
  copingPattern?: string;
  
  // Metadata
  onboardingType: 'full-track' | 'fast-track';
  completedAt: string;
}
```

### API Endpoints

#### Update Profile
```
POST /api/profile/update
Content-Type: application/json

{
  "inspirationFigure": "Oprah Winfrey",
  "inspirationQuality": "Her gentle wisdom and authenticity",
  "actorAuthorStyle": "Maya Angelou",
  "actorAuthorTone": "Calm and inspiring presence",
  "spiritualPractices": "Meditation and nature",
  "spiritualReflection": "Remind me to stay grounded",
  "chapterTitle": "The Awakening",
  "primaryHope": "More confidence in relationships",
  "lifeLandscape": "A winding mountain path",
  "safePlace": "A quiet garden",
  "strengthSymbol": "An oak tree",
  "sensoryAnchor": "Ocean waves",
  "strengthMoment": "When I helped a friend through a difficult time",
  "copingPattern": "I take a walk and call a friend",
  "onboardingType": "full-track",
  "completedAt": "2024-01-15T10:30:00Z"
}
```

#### Get Profile
```
GET /api/profile
```

#### Reset Profile
```
DELETE /api/profile
```

## Implementation Notes

1. **Data Validation**: Ensure all required fields are present before saving
2. **Privacy**: All data is encrypted and stored locally on the device
3. **Fallback**: If profile save fails, onboarding continues but user is notified
4. **Re-onboarding**: Users can reset and go through onboarding again via settings
5. **Progressive Enhancement**: Fast-Track users can upgrade to Full-Track later

## Question Flow Logic

### Full-Track Flow
1. User selects Full-Track option
2. Presents 13 questions in sequence
3. Each question requires an answer to proceed
4. Progress bar shows completion status
5. Final step saves data and shows completion screen

### Fast-Track Flow
1. User selects Fast-Track option
2. Presents 8 essential questions in sequence
3. Each question requires an answer to proceed
4. Progress bar shows completion status
5. Final step saves data and shows completion screen

### Mid-Conversation Switching
- Users can be offered Fast-Track if they struggle with Full-Track questions
- System can detect low engagement and suggest switching
- Fallback option: "It's okay if that doesn't come to mind right now. We can skip this one and you can come back to it later if you'd like."

This guide provides everything needed to implement the profile API endpoint with the complete onboarding data structure.
