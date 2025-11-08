# Analytics Implementation Guide

This document describes the analytics implementation in our application using Mixpanel.

## Architecture

Our analytics system is built around Mixpanel and follows these key principles:

1. **User Identification** - We identify users across sessions for cohesive analytics
2. **Consistent Event Tracking** - Standard event naming and property structure
3. **Enriched Data** - Events include contextual information when relevant
4. **User Profiles** - We maintain user profiles with Mixpanel People

## Main Components

- `src/utils/important_file.ts` - Core Mixpanel initialization and configuration
- `src/utils/eventTracker.ts` - Specialized tracking functions for specific events

## User Identification

We use Mixpanel's identity management system to track users across sessions:

```typescript
// When a user logs in or signs up
identifyUser(userId, {
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  // Additional properties
});
```

## Tracked Events

Our application tracks the following primary events:

| Event Name | Description | Key Properties |
|------------|-------------|----------------|
| Sign Up | New user registration | email, userId, firstName, lastName |
| User Login | User authentication | userId, email, method |
| Dark Mode | Theme preference changes | theme, enabled |
| Assignment Tracker | Assignment interactions | action, courseId, assignmentId |
| Feedback Submission | User feedback | type, browser |
| Profile Pic Upload | Profile image changes | success, fileType, fileSize |
| Connect Canvas Account | LMS connections | success, domain |
| Feature Usage | Feature engagement | feature, action |
| Onboarding Step | Onboarding progress | step_name, step_number, completed |
| Page View | Page navigation | page_name, path, url, referrer |

## Super Properties

We use super properties to include important context with all events:

- `user_id` - Current user's ID
- `account_type` - User's account type
- `has_canvas` - Whether user has connected Canvas LMS

## People Analytics

We maintain user profiles with important attributes:

- Basic info: name, email, sign-up date
- Preferences: theme, UI settings
- Usage metrics: login counts, feature usage
- Completion tracking: assignments completed

## A/B Testing

The system supports A/B testing:

```typescript
// Define an experiment
const variant = createABTest("new_dashboard", "A", userId);

// Use the variant
if (variant === "A") {
  // Show version A
} else {
  // Show version B
}
```

## Implementation Guidelines

### Adding a New Event

1. Define a clear purpose for the event
2. Use descriptive names in camelCase (e.g., `featureUsed`, not `clicked_button`)
3. Include relevant properties that provide context
4. Add to the tracking function in `eventTracker.ts`

### Event Property Standards

- Use timestamps for all events
- Include user context when relevant
- Add device/browser info for technical events
- Keep property names consistent across events

### User Identification Best Practices

- Always identify users after authentication
- Reset identity on logout
- Associate anonymous activity with user after login when possible

## Privacy Considerations

- IP addresses are collected for geographic segmentation and fraud detection
- User IP addresses are stored in Mixpanel to improve analytics accuracy 
- IP data helps with regional performance analysis and user experience optimization
- We recommend updating your privacy policy to disclose IP address collection

## Debugging

During development, you can enable Mixpanel debugging:

```typescript
// In development mode
if (process.env.NODE_ENV === 'development') {
  mixpanel.set_config({ debug: true });
}
```

## Reporting

The Mixpanel dashboard can be used to:

1. Build funnels to track conversion
2. Create cohorts for user segmentation
3. Analyze retention metrics
4. Evaluate feature adoption
5. Track growth metrics 