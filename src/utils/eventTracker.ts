import mixpanel from "mixpanel-browser";
import { identifyUser, trackPageView } from "./important_file";

const isTrackingEnabled = () => {
  if (!mixpanel.config) {                 // ← makes sure init() has run
    console.warn('Mixpanel not initialised – skipping event');
    return false;
  }
  return true;
};


// Track user sign up events with enhanced user properties including IP data
export const trackSignUp = async (userData: {
  email?: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
}) => {
  if (!isTrackingEnabled() || !userData.userId) return;

  // Identify the user first
  identifyUser(userData.userId, {
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    createdAt: new Date(),
  });

  // Get IP location data for enrichment
  const locationData = await getLocationData();

  // Track the signup event with enhanced IP data
  mixpanel.track("Sign Up", {
    email: userData.email,
    userId: userData.userId,
    source: document.referrer || "direct",
    timestamp: new Date().toISOString(),
    ...locationData, // Add IP-based location data
  });

  // People analytics for user acquisition
  mixpanel.people.set_once({
    $first_seen: new Date().toISOString(),
    initial_referrer: document.referrer || "direct",
    initial_utm_source: getUrlParam("utm_source"),
    initial_utm_medium: getUrlParam("utm_medium"),
    initial_utm_campaign: getUrlParam("utm_campaign"),
    // Store location data in the user profile
    ...locationData,
  });
};

// Track user login events with enhanced IP data
export const trackLogin = async (userData: {
  userId: string;
  email?: string;
  method?: string;
}) => {
  if (!isTrackingEnabled() || !userData.userId) return;

  // Get IP location data for enrichment
  const locationData = await getLocationData();

  mixpanel.track("User Login", {
    userId: userData.userId,
    email: userData.email,
    method: userData.method || "password",
    timestamp: new Date().toISOString(),
    ...locationData, // Add IP-based location data
  });

  // Update last login time and location
  mixpanel.people.set({
    $last_login: new Date().toISOString(),
    last_login_country: locationData.ip_country,
    last_login_city: locationData.ip_city,
  });
};

// Track theme mode changes
export const trackThemeChange = (theme: "dark" | "light", userId?: string) => {
  if (!isTrackingEnabled()) return;

  const eventProps = {
    enabled: theme === "dark",
    theme: theme,
    timestamp: new Date().toISOString(),
  };

  mixpanel.track("Dark Mode", eventProps);

  // Update user preferences if user is identified
  if (userId) {
    mixpanel.people.set({
      theme_preference: theme,
    });
  }
};

// Track assignment tracker interactions with enhanced properties
export const trackAssignmentTracker = (
  action: "view" | "complete" | "filter" | "create" | "edit",
  details?: Record<string, any>
) => {
  if (!isTrackingEnabled()) return;

  // Enrich the event with additional context
  const enrichedDetails = {
    ...details,
    screen_width: window.innerWidth,
    screen_height: window.innerHeight,
    device_type: getDeviceType(),
    timestamp: new Date().toISOString(),
  };

  mixpanel.track("Assignment Tracker", {
    action,
    ...enrichedDetails,
  });

  // If completing an assignment, update user's completion count
  if (action === "complete") {
    mixpanel.people.increment("assignments_completed");

    // If a streak property was provided
    if (details?.streak) {
      mixpanel.people.set({
        current_completion_streak: details.streak,
      });
    }
  }
};

// Track issues or suggestions form submissions
export const trackFeedbackSubmission = (
  type: "issue" | "suggestion" | "bug" | "feature_request",
  details?: Record<string, any>
) => {
  if (!isTrackingEnabled()) return;

  const feedbackProperties = {
    type,
    browser: navigator.userAgent,
    ...details,
    timestamp: new Date().toISOString(),
  };

  mixpanel.track("Feedback Submission", feedbackProperties);

  // Update user properties to track engagement
  mixpanel.people.increment("feedback_submissions");
  mixpanel.people.append({
    feedback_types: type,
  });
};

// Track profile picture uploads
export const trackProfilePicUpload = (
  success: boolean,
  details?: Record<string, any>
) => {
  if (!isTrackingEnabled()) return;

  const uploadProperties = {
    success,
    fileType: details?.fileType,
    fileSize: details?.fileSize,
    error: details?.error,
    timestamp: new Date().toISOString(),
  };

  mixpanel.track("Profile Pic Upload", uploadProperties);

  // Update user profile properties if successful
  if (success) {
    mixpanel.people.set({
      has_profile_picture: true,
      last_profile_update: new Date().toISOString(),
    });
  }
};

// Track Canvas account connections
export const trackCanvasConnection = (
  success: boolean,
  details?: Record<string, any>
) => {
  if (!isTrackingEnabled()) return;

  const connectionProperties = {
    success,
    domain: details?.domain,
    error: details?.error,
    timestamp: new Date().toISOString(),
  };

  mixpanel.track("Connect Canvas Account", connectionProperties);

  // Update user properties
  if (success) {
    mixpanel.people.set({
      has_canvas_connected: true,
      canvas_domain: details?.domain,
      canvas_connected_at: new Date().toISOString(),
    });
  }
};

// Track feature usage
export const trackFeatureUsage = (
  featureName: string,
  action: "viewed" | "used" | "dismissed",
  details?: Record<string, any>
) => {
  if (!isTrackingEnabled()) return;

  mixpanel.track("Feature Usage", {
    feature: featureName,
    action,
    ...details,
    timestamp: new Date().toISOString(),
  });

  // Increment feature usage count
  if (action === "used") {
    mixpanel.people.increment(
      `${featureName.toLowerCase().replace(/\s+/g, "_")}_usage_count`
    );
  }
};

// Track onboarding progress
export const trackOnboardingStep = (
  stepName: string,
  stepNumber: number,
  completed: boolean,
  details?: Record<string, any>
) => {
  if (!isTrackingEnabled()) return;

  mixpanel.track("Onboarding Step", {
    step_name: stepName,
    step_number: stepNumber,
    completed,
    ...details,
    timestamp: new Date().toISOString(),
  });

  // Update user's onboarding status
  if (completed) {
    mixpanel.people.set({
      onboarding_progress: stepNumber,
      [`completed_${stepName.toLowerCase().replace(/\s+/g, "_")}`]: true,
    });
  }
};

// Helper function to get URL parameters (for utm tracking)
function getUrlParam(param: string): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get(param);
}

// Helper function to determine device type
function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "tablet";
  }
  if (
    /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
      ua
    )
  ) {
    return "mobile";
  }
  return "desktop";
}

// Add a utility function to get IP-based location data for enhanced tracking
async function getLocationData(): Promise<Record<string, any>> {
  try {
    // Use a third-party service to get IP location data
    // Note: In a production app, you'd typically proxy this request through your backend
    const response = await fetch("https://ipapi.co/json/");
    if (!response.ok) {
      throw new Error("Failed to fetch location data");
    }
    const data = await response.json();

    return {
      ip_country: data.country_name,
      ip_region: data.region,
      ip_city: data.city,
      ip_timezone: data.timezone,
      // IP address itself is automatically tracked by Mixpanel with our updated config
    };
  } catch (error) {
    console.warn("Error fetching IP location data:", error);
    return {};
  }
}

// Enhance the existing trackPageView function to include location data
export const enhancedTrackPageView = async (
  pageName: string,
  properties?: Record<string, any>
) => {
  if (!isTrackingEnabled()) return;

  try {
    // Get IP-based location data
    const locationData = await getLocationData();

    // Forward to the main trackPageView with enhanced data
    trackPageView(pageName, {
      ...properties,
      ...locationData,
    });
  } catch (error) {
    // Fallback to regular page view tracking if location data fails
    trackPageView(pageName, properties);
  }
};
