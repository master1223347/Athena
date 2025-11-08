
import React, { createContext, useContext, useEffect, useState } from "react";
import { userDataService } from "@/services/userDataService";
import { trackThemeChange } from "@/utils/eventTracker";
import { userStorage } from "@/utils/userStorage";

// First, import the AuthContext directly
import { useAuth } from "@/contexts/AuthContext";

export type Theme = "dark" | "light";

export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

// Create the context with a default undefined value
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const user = auth?.user || null;

  // State for tracking theme switches for achievements
  const [themeSwitchCount, setThemeSwitchCount] = useState(0);

  // Initialize from user storage or system preference
  const [theme, setTheme] = useState<Theme>(() => {
    // If we have a user, check their preference in userStorage first
    if (user?.id) {
      const savedTheme = userStorage.get(user.id, 'theme', '');
      if (savedTheme === "dark" || savedTheme === "light") {
        return savedTheme as Theme;
      }
    }
    
    // Check regular localStorage for non-authenticated users
    const savedTheme = userStorage.get(user?.id, "theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      return savedTheme as Theme;
    }

    // Otherwise use system preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  // Update document class and storage when theme changes
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(theme);

    // Save to the appropriate storage based on authentication status
    if (user?.id) {
      userStorage.set(user.id, 'theme', theme);
    } else {
      // For non-authenticated users, still save to localStorage
      userStorage.set(user?.id, "theme", theme);
    }

    // Save to database if user is logged in
    if (user) {
      try {
        // Make sure we don't override other settings when updating just the theme
        userDataService.updateUserSettings(user.id, { theme });
      } catch (error) {
        console.error("Error saving theme to database:", error);
      }
    }

    // Track theme switch count for achievements (only after initial load)
    if (themeSwitchCount > 0) {
      try {
        // Track the theme switch for achievements
        if (user) {
          console.log("Tracking theme switch achievement");
          userDataService.trackThemeChange(user.id, theme);
        }
      } catch (error) {
        console.error("Error tracking theme switch achievement:", error);
      }
    }
  }, [theme, user, themeSwitchCount]);

  // Listen for system preference changes if using system theme
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      // Only change theme if user is using system preference (no storage setting)
      const userId = user?.id;
      const hasUserPreference = userId ? !!userStorage.get(userId, 'theme', '') : !!localStorage.getItem("theme");
      
      if (!hasUserPreference) {
        setTheme(mediaQuery.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [user]);

  // Load theme from database when user logs in
  useEffect(() => {
    if (user) {
      const loadSavedTheme = async () => {
        try {
          const settings = await userDataService.getUserSettings(user.id);
          if (
            settings?.theme &&
            (settings.theme === "dark" || settings.theme === "light")
          ) {
            setTheme(settings.theme as Theme);
            // Also update in user storage
            userStorage.set(user.id, 'theme', settings.theme);
          }
        } catch (error) {
          console.error("Error loading theme from database:", error);
        }
      };

      loadSavedTheme();
    }
  }, [user]);

  // Add a function to toggle between light and dark
  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === "dark" ? "light" : "dark";

      // Increment theme switch count for achievements
      setThemeSwitchCount((prevCount) => prevCount + 1);

      // Track theme change in Mixpanel
      trackThemeChange(newTheme);

      return newTheme;
    });
  };

  // Also track when theme is explicitly set
  const setThemeWithTracking = (newTheme: Theme) => {
    // Track theme change in Mixpanel
    trackThemeChange(newTheme);
    setTheme(newTheme);
  };

  const contextValue: ThemeContextType = {
    theme,
    setTheme: setThemeWithTracking,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// Define the useTheme hook
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
