
import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { achievementManager } from '@/services/achievement/AchievementManager';
import { userStorage } from '@/utils/userStorage';

const AppearanceSettings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  
  const handleThemeChange = async (isDark: boolean) => {
    // Only toggle if the desired state differs from current theme
    if ((isDark && theme !== 'dark') || (!isDark && theme !== 'light')) {
      const isDarkNow = isDark; // This is the new mode after toggle
      toggleTheme();
      
      try {
        if (user?.id) {
          // Store theme preference in user storage
          userStorage.setBoolean(user.id, 'prefersDarkMode', isDarkNow);
          
          await achievementManager.checkAndUpdateAchievements(user.id, {
            prefersDarkMode: isDarkNow
          });
        }
      } catch (e) {
        console.error('could not refresh achievements after theme change', e);
      }
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Customize the look and feel of Gambit
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sun className="h-5 w-5 text-muted-foreground" />
              <Label htmlFor="theme-mode">Dark Mode</Label>
            </div>
            <Switch 
              id="theme-mode" 
              checked={theme === 'dark'}
              onCheckedChange={handleThemeChange}
            />
          </div>
          
          <p className="text-sm text-muted-foreground">
            {theme === 'dark' 
              ? 'Dark mode is currently enabled. The application will use a darker color scheme.' 
              : 'Light mode is currently enabled. The application will use a lighter color scheme.'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppearanceSettings;
