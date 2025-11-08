
import React, { useEffect, useState } from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from '../navigation/AppSidebar';
import { Toaster } from '@/components/ui/sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, Bell, HelpCircle, Award, Sun, Moon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from '@/contexts/ThemeContext';
import { canvasApi } from '@/services/canvasApi';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LEVEL_TITLES } from '@/components/achievements/AchievementStats';
import { userDataService } from '@/services/userDataService';
import { Badge } from '@/components/ui/badge';
import { achievementManager } from '@/services/achievement/AchievementManager';
import { userStorage } from '@/utils/userStorage';
import { AchievementPointsService } from '@/services/achievementPointsService';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userLevel, setUserLevel] = useState(1);
  const [userPoints, setUserPoints] = useState(0);
  const [userXP, setUserXP] = useState(0);
  
  // Calculate total XP including gambling wins/losses
  const calculateTotalXP = async () => {
    if (!user) return;
    
    try {
      // Use getAvailablePoints to include gambling wins/losses in the display
      const totalXP = await AchievementPointsService.getAvailablePoints(user.id);
            
      setUserXP(totalXP);
    } catch (error) {
      console.error('Error calculating total XP:', error);
      setUserXP(0);
    }
  };
  
  const handleLogout = async () => {
    // Clean up Canvas API connection before logging out
    if (canvasApi.hasCredentials()) {
      canvasApi.clearAutoSync();
    }
    
    // Clear all user data from localStorage
    if (user?.id) {
      userStorage.clear(user.id);
    }
    
    await logout();
    navigate('/login');
  };
  
  useEffect(() => {
    if (!user) return
    achievementManager.checkAndUpdateAchievements(user.id, {
      prefersDarkMode: theme === 'dark'
    }).catch(console.error)
  }, [user])
  
  // Get first name and avatar from user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, points')
          .eq('id', user.id)
          .single();
          
        if (!error && data) {
          setAvatarUrl(data.avatar_url);
        }
        
        // Calculate total XP from all sources
        await calculateTotalXP();
        
        // Fetch user achievements to calculate level
        const achievements = await userDataService.getAchievements(user.id);

        
        // Calculate total points based on progress percentage
        const totalPoints = achievements.reduce(
          (sum, a) => sum + (a.points * (a.progress / 100)), 0
        );
        
        setUserPoints(totalPoints);
        
        // Calculate user level
        const level = userDataService.calculateLevel(totalPoints);
        setUserLevel(level);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    
    fetchUserProfile();
  }, [user]);

  // Refresh XP when navigating to/from gambling page or periodically on gambling page
  useEffect(() => {
    if (!user) return;

    // Always refresh XP when location changes
    calculateTotalXP();

    // If on gambling page, refresh XP every 2 seconds to catch gambling transactions
    let interval: NodeJS.Timeout | null = null;
    if (location.pathname === '/gambling') {
      interval = setInterval(() => {
        calculateTotalXP();
      }, 2000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [user, location.pathname]);


  const handleThemeToggle = async () => {
    const isDarkNow = theme !== 'dark'      // ← this is the *new* mode
    toggleTheme()
  
    try {
      if (user?.id) {
        // Store theme preference in user storage
        userStorage.setBoolean(user.id, 'prefersDarkMode', isDarkNow);
        
        await achievementManager.checkAndUpdateAchievements(user.id, {
          prefersDarkMode: isDarkNow
        });
      }
    } catch (e) {
      console.error('could not refresh achievements after theme change', e)
    }
  }
  
  // Get first name from user metadata
  const firstName = user?.user_metadata?.first_name || user?.email?.split('@')[0] || '';
  
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  const levelTitle = LEVEL_TITLES[userLevel - 1] || 'Chancellor';
  
  return (
    <SidebarProvider>
      <div className={`min-h-screen flex w-full ${theme === 'dark' ? 'dark bg-gray-900 text-white' : 'bg-journey-background'}`}>
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden relative">
          <div className="container mx-auto relative">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleThemeToggle}
              className="absolute top-0 right-6 h-9 w-9"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            <div className="flex justify-between items-center mb-6">
              <SidebarTrigger className="lg:hidden" />
              
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 pl-0">
                      <Avatar className="w-8 h-8 rounded-full">
                        {avatarUrl ? (
                          <AvatarImage src={avatarUrl} alt="Profile" />
                        ) : (
                          <AvatarFallback className="bg-journey-primary/10 text-journey-primary">
                            {user.email ? getInitials(user.user_metadata?.full_name || user.email) : 'U'}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="hidden md:block text-left">
                        <p className="text-sm font-medium flex items-center gap-1">
                          {firstName || user.email}
                          <Badge variant="outline" className="ml-1 text-xs">
                            <Award className="w-3 h-3 mr-1" />
                            {levelTitle}
                          </Badge>
                        </p>
                        <p className="text-xs text-muted-foreground">{Math.round(userXP)} XP</p>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/achievements')} className="flex items-center">
                      <Award className="w-4 h-4 mr-2" />
                      Level {userLevel} • {levelTitle}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/settings?tab=profile')}>
                      Profile Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleThemeToggle}>
                      {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            {children}
          </div>
        </main>
        <Toaster />
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;
