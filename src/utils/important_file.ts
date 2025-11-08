import mixpanel from "mixpanel-browser";

// Initialize Mixpanel with advanced configuration and security
export const initMixpanel = () => {
  // Get token from secure source
  const token = getSecureMixpanelToken();

  if (!token) {
    console.warn("Mixpanel token is missing!");
    return;
  }

  try {
    mixpanel.init(token, {
      track_pageview: true,
      persistence: "localStorage",
      ip: false, // Disable IP address tracking for privacy
      property_blacklist: ["$device_id", "$user_id"], // Blacklist sensitive properties
      batch_requests: true, // Batch multiple API requests for efficiency
      secure_cookie: true, // Use secure cookies
      debug: process.env.NODE_ENV === "development",
      loaded: (mixpanel) => {
        console.log("Analytics initialized successfully");
      },
      opt_out_tracking_by_default: false, // Allow users to opt-out
    });
  } catch (error) {
    console.error("Failed to initialize analytics:", error);
  }
};

// TODO: Get token from secure source. For now, just use a hardcoded token.
const getSecureMixpanelToken = (): string => {
  return "d2238bd31d7a669d40d88b123f52fdc9";
};

// Identify a user with improved privacy and security
export const identifyUser = (
  userId: string,
  userProperties?: Record<string, any>
) => {
  if (!userId) {
    console.warn("User ID is required for analytics identification");
    return;
  }

  try {
    // Hash the user ID before sending to analytics
    const hashedId = hashUserId(userId);

    // Set the user identity for all future events
    mixpanel.identify(hashedId);

    // If user properties provided, update their profile with sanitized data
    if (userProperties) {
      const sanitizedProps = sanitizeUserProperties(userProperties);

      mixpanel.people.set({
        $first_name: sanitizedProps.firstName,
        $last_name: sanitizedProps.lastName,
        $created: sanitizedProps.createdAt || new Date(),
        // Remove email to enhance privacy
        // Add any other non-sensitive properties
      });

      // Register super properties that will be sent with all events
      mixpanel.register({
        account_type: sanitizedProps.accountType || "standard",
        has_canvas: !!sanitizedProps.hasCanvasConnection,
      });
    }
  } catch (error) {
    console.error("Error identifying user for analytics:", error);
  }
};

// Simple hash function for user IDs
const hashUserId = (userId: string): string => {
  // In production, use a proper hashing algorithm
  // This is a simple implementation for demonstration
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return "user_" + Math.abs(hash).toString(16);
};

// Sanitize user properties to remove sensitive information
const sanitizeUserProperties = (
  props: Record<string, any>
): Record<string, any> => {
  const sanitized = { ...props };

  // Remove email and other sensitive fields
  delete sanitized.email;
  delete sanitized.password;
  delete sanitized.token;
  delete sanitized.apiKey;

  return sanitized;
};

// Reset user identity (for logouts)
export const resetIdentity = () => {
  try {
    mixpanel.reset();
  } catch (error) {
    console.error("Error resetting analytics identity:", error);
  }
};

// Track a page view with enhanced information but no PII
export const trackPageView = (
  pageName: string,
  properties?: Record<string, any>
) => {
  try {
    // Sanitize properties to remove PII
    const sanitizedProps = properties
      ? sanitizeEventProperties(properties)
      : {};

    mixpanel.track("Page View", {
      page_name: pageName,
      path: window.location.pathname,
      // Remove URL and referrer to enhance privacy
      ...sanitizedProps,
    });
  } catch (error) {
    console.error("Error tracking page view:", error);
  }
};

// Sanitize event properties
const sanitizeEventProperties = (
  props: Record<string, any>
): Record<string, any> => {
  const sanitized = { ...props };

  // Remove potentially sensitive info
  delete sanitized.email;
  delete sanitized.fullName;
  delete sanitized.token;
  delete sanitized.apiKey;
  delete sanitized.userId;

  return sanitized;
};

// Set super properties that should be included with all future events
export const setSuperProperties = (properties: Record<string, any>) => {
  try {
    // Sanitize properties first
    const sanitizedProps = sanitizeEventProperties(properties);
    mixpanel.register(sanitizedProps);
  } catch (error) {
    console.error("Error setting super properties:", error);
  }
};

// Set one-time super properties
export const setOneSuperProperties = (properties: Record<string, any>) => {
  try {
    // Sanitize properties first
    const sanitizedProps = sanitizeEventProperties(properties);
    mixpanel.register_once(sanitizedProps);
  } catch (error) {
    console.error("Error setting one-time super properties:", error);
  }
};

// Track revenue/monetization events
export const trackRevenue = (
  amount: number,
  properties?: Record<string, any>
) => {
  try {
    // Sanitize properties
    const sanitizedProps = properties
      ? sanitizeEventProperties(properties)
      : {};

    mixpanel.people.track_charge(amount);
    mixpanel.track("Purchase", {
      $amount: amount,
      ...sanitizedProps,
    });
  } catch (error) {
    console.error("Error tracking revenue:", error);
  }
};

// Create an A/B test for a feature with improved privacy
export const createABTest = (
  experimentName: string,
  variantName: string,
  userId: string
) => {
  try {
    // Hash the user ID for privacy
    const hashedId = hashUserId(userId);

    // Deterministic variant assignment based on user ID
    const variantAssignment = hashStringToVariant(
      experimentName,
      hashedId,
      variantName
    );

    // Track which variant the user saw
    mixpanel.track("Experiment Viewed", {
      experiment_name: experimentName,
      variant_name: variantAssignment,
    });

    // Return the variant to be used in the app
    return variantAssignment;
  } catch (error) {
    console.error("Error creating A/B test:", error);
    return variantName; // Fall back to default
  }
};

// Helper function for A/B testing
const hashStringToVariant = (
  experimentName: string,
  userId: string,
  defaultVariant: string
): string => {
  // Simple hash function for deterministic variant assignment
  if (!userId || !experimentName) return defaultVariant;

  const hash = experimentName.split("").reduce((acc, char, i) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  const userHash = userId.split("").reduce((acc, char, i) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  const combinedHash = (hash + userHash) % 100;

  // For A/B test with 50/50 split
  return combinedHash < 50 ? "A" : "B";
};

// Group analytics for organization/team features
export const setGroup = (
  groupId: string,
  groupType: string = "organization"
) => {
  try {
    // Hash the group ID for privacy
    const hashedGroupId = hashUserId(groupId);
    mixpanel.set_group(groupType, hashedGroupId);
  } catch (error) {
    console.error("Error setting group:", error);
  }
};

// Track group-level events
export const trackGroupEvent = (
  eventName: string,
  groupId: string,
  groupType: string = "organization",
  properties?: Record<string, any>
) => {
  try {
    // Hash the group ID for privacy
    const hashedGroupId = hashUserId(groupId);

    // Sanitize properties
    const sanitizedProps = properties
      ? sanitizeEventProperties(properties)
      : {};

    mixpanel.track(eventName, {
      ...sanitizedProps,
      [groupType]: hashedGroupId,
    });
  } catch (error) {
    console.error("Error tracking group event:", error);
  }
};
