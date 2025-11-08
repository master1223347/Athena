import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { UserCircle, Trophy, Star, Target, TrendingUp, BookOpen, CheckCircle, GraduationCap, BarChart3, Clock, TrendingDown, Calendar, Award, Flame, Map, Users, Heart, MessageCircle, Zap, Flag, User, Settings, Compass, Sun, Repeat, CheckSquare, Edit3, LogIn, Clipboard, BarChart2, Medal, Crown, Shield, Edit, Save, X, Camera, Eye, EyeOff } from 'lucide-react';
import { userDataService } from '@/services/userDataService';
import { fetchCanvasGrades } from '@/services/fetchCanvasGrades';
import { canvasDataTransformer } from '@/services/canvas/canvasDataTransformer';
import { canvasSync } from '@/services/canvas/canvasSync';
import { Achievement, AchievementDifficulty } from '@/types/achievement';
import { AchievementPointsService } from '@/services/achievementPointsService';
import { WEEKLY_ACHIEVEMENTS } from '@/data/weeklyAchievements';

interface UserProfile {
  fullName: string;
  email: string;
  avatarUrl: string | null;
  bio?: string;
  role: string;
}

interface UserStats {
  totalXP: number;
  level: number;
  pointsToNext: number;
  globalRank: number | null;
  achievementsCount: number;
}



const ProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hiddenCourses, setHiddenCourses] = useState<string[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  
  // Profile customization state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    bio: '',
    avatarUrl: ''
  });
  const [privacySettings, setPrivacySettings] = useState({
    showGlobalRank: true
  });

  // Achievement icons mapping
  const achievementIcons: Record<string, React.ReactNode> = {
    'trophy': <Trophy />,
    'award': <Award />,
    'check-circle': <CheckCircle />,
    'star': <Star />,
    'clock': <Clock />,
    'book-open': <BookOpen />,
    'target': <Target />,
    'trending-up': <TrendingUp />,
    'calendar': <Calendar />,
    'flame': <Flame />,
    'map': <Map />,
    'users': <Users />,
    'heart': <Heart />,
    'message-circle': <MessageCircle />,
    'zap': <Zap />,
    'flag': <Flag />,
    'user': <User />,
    'settings': <Settings />,
    'compass': <Compass />,
    'sun': <Sun />,
    'repeat': <Repeat />,
    'check-square': <CheckSquare />,
    'edit-3': <Edit3 />,
    'log-in': <LogIn />,
    'clipboard': <Clipboard />,
    'bar-chart-2': <BarChart2 />,
    'medal': <Medal />,
    'crown': <Crown />,
    'shield': <Shield />
  };

  const difficultyText: Record<AchievementDifficulty, string> = {
    [AchievementDifficulty.EASY]: 'Easy',
    [AchievementDifficulty.MEDIUM]: 'Medium',
    [AchievementDifficulty.HARD]: 'Hard'
  };

  const getIconComponent = (iconName: string) => {
    return achievementIcons[iconName] || <Trophy />;
  };

  // Function to merge grades from Canvas into courses (from ProgressPage)
  const mergeGradesIntoCourses = (
    courses: any[],
    gradesFromCanvas: Array<{ id: number; grade: number | null; [key: string]: any }>
  ): any[] => {
    console.log('Merging grades into courses...');
    console.log('Courses to merge:', courses.map(c => ({ id: c.id, canvas_id: c.canvas_id, title: c.title })));
    console.log('Grades from Canvas:', gradesFromCanvas.map(g => ({ id: g.id, grade: g.grade })));
    
    return courses.map(course => {
      // coerce your course IDs into numbers for matching
      const canvasIdNum = Number(course.canvas_id);
      const courseIdNum = Number(course.id);
  
      const match = gradesFromCanvas.find(g =>
        g.id === canvasIdNum ||
        g.id === courseIdNum
      );
      
      const updatedCourse = {
        ...course,
        grade: match?.grade ?? course.grade ?? null, // Keep existing grade if no match
      };
      
      console.log(`Course ${course.title}: canvas_id=${course.canvas_id}, grade=${match?.grade}, final_grade=${updatedCourse.grade}`);
      
      return updatedCourse;
    });
  };
  
  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadUserSettings();
      loadAchievements();
      loadPrivacySettings();
    }
  }, [user]);
  
  const loadUserSettings = async () => {
    if (!user) return;
    
    try {
      // Load user settings
      const settings = await userDataService.getUserSettings(user.id);
      
      // Check if hidden_courses exists and is an array, otherwise initialize as empty array
      const hiddenCoursesArray = settings && 
        'hidden_courses' in settings && 
        Array.isArray(settings.hidden_courses) 
          ? settings.hidden_courses 
          : [];
      
      setHiddenCourses(hiddenCoursesArray);
      console.log('Loaded hidden courses for ProfilePage:', hiddenCoursesArray);
    } catch (error) {
      console.error('Error loading user settings for ProfilePage:', error);
    }
  };

  const loadAchievements = async () => {
    if (!user) return;
    
    try {
      const userAchievements = await userDataService.getAchievements(user.id);
      setAchievements(userAchievements);
      console.log(`Loaded ${userAchievements.length} achievements for ProfilePage`);
    } catch (error) {
      console.error('Error loading achievements for ProfilePage:', error);
    }
  };

  const loadPrivacySettings = async () => {
    if (!user) return;
    
    try {
      const settings = await userDataService.getUserSettings(user.id);
      if (settings && 'privacy_settings' in settings) {
        const privacySettings = settings.privacy_settings as any;
        setPrivacySettings({
          showGlobalRank: privacySettings?.showGlobalRank ?? true
        });
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
    }
  };

  const handleEditProfile = () => {
    if (profile) {
      setEditForm({
        fullName: profile.fullName || '',
        bio: profile.bio || '',
        avatarUrl: profile.avatarUrl || ''
      });
      setIsEditingProfile(true);
    }
  };
  
  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      // For now, just update the local state without database changes
      // TODO: Implement actual database update later
      
      // Update local state
      setProfile(prev => prev ? {
        ...prev,
        fullName: editForm.fullName,
        bio: editForm.bio,
        avatarUrl: editForm.avatarUrl
      } : null);

      setIsEditingProfile(false);
      toast.success('Profile updated successfully');
      
      // Log the changes for debugging
      console.log('Profile changes (UI only):', {
        fullName: editForm.fullName,
        bio: editForm.bio,
        avatarUrl: editForm.avatarUrl
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setEditForm({
      fullName: '',
      bio: '',
      avatarUrl: ''
    });
  };

  const handlePrivacySettingChange = async (setting: keyof typeof privacySettings, value: boolean) => {
    if (!user) return;
    
    const newSettings = { ...privacySettings, [setting]: value };
    setPrivacySettings(newSettings);
    
    try {
      // For now, just update the local state without database changes
      // TODO: Implement actual database update later
      
      toast.success('Privacy settings updated');
      
      // Log the changes for debugging
      console.log('Privacy setting changed (UI only):', {
        setting,
        value,
        allSettings: newSettings
      });
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      toast.error('Failed to update privacy settings');
      // Revert on error
      setPrivacySettings(privacySettings);
    }
  };

  // Comprehensive data loading function that matches ProgressPage approach
  const loadComprehensiveData = async () => {
    if (!user) return null;

    try {
      // Check for Canvas credentials
      const credentials = await userDataService.getCanvasCredentials(user.id);
      if (!credentials) {
        console.log('No Canvas credentials found, using database-only data');
        return await userDataService.getCoursesAsync(user.id);
      }

      // Initialize Canvas API with user credentials
      const { canvasApi } = await import('@/services/canvasApi');
      canvasApi.setCredentials(credentials.domain, credentials.token);

      // Try to sync with Canvas first (same as ProgressPage)
      try {
        console.log('Starting Canvas sync for ProfilePage...');
        await canvasSync.syncWithCanvas(user.id, { syncType: 'progressOnly' });
        console.log('Canvas sync completed for ProfilePage');
      } catch (syncError) {
        console.error('Canvas sync failed for ProfilePage:', syncError);
        // Continue with cached data even if sync fails
      }

      // Fetch Canvas data using the enhanced data transformer (same as ProgressPage)
      console.log('Fetching transformed Canvas data for ProfilePage...');
      const canvasData = await canvasDataTransformer.fetchAndTransformAllData(true);
      
      if (canvasData && canvasData.length > 0) {
        // Ensure each course has a milestones array
        const safeCanvasData = canvasData.map((course: any) => ({
          ...course,
          milestones: Array.isArray(course.milestones) ? course.milestones : []
        }));

        // Also fetch fresh grades from Canvas (same as ProgressPage)
        try {
          const canvasBase = credentials.domain.startsWith("http")
            ? credentials.domain
            : `https://${credentials.domain}`;
            
          console.log('Fetching fresh Canvas grades for ProfilePage...');
          const gradesFromCanvas = await fetchCanvasGrades(canvasBase, credentials.token, false);
          
          if (gradesFromCanvas && gradesFromCanvas.length > 0) {
            // Merge grades into the fresh Canvas data
            const dataWithGrades = mergeGradesIntoCourses(safeCanvasData, gradesFromCanvas);
            console.log('ProfilePage courses with fresh grades:', dataWithGrades.map(c => ({ title: c.title, grade: c.grade })));
            setCourses(dataWithGrades);
            return dataWithGrades;
          } else {
            setCourses(safeCanvasData);
            return safeCanvasData;
          }
        } catch (gradeError) {
          console.error('Failed to fetch grades for ProfilePage:', gradeError);
          setCourses(safeCanvasData);
          return safeCanvasData;
          }
        } else {
        // Fallback to database courses
        console.log('No Canvas data found, falling back to database courses');
        const dbCourses = await userDataService.getCoursesAsync(user.id);
        setCourses(dbCourses);
        return dbCourses;
        }
    } catch (error) {
      console.error('Error in comprehensive data loading for ProfilePage:', error);
      // Fallback to database courses
      const dbCourses = await userDataService.getCoursesAsync(user.id);
      setCourses(dbCourses);
      return dbCourses;
    }
  };
  
  const loadUserProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Get profile data from Supabase profiles table
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('full_name, email, avatar_url')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }
      
      // Set profile data
      setProfile({
        fullName: profileData?.full_name || 'Anonymous User',
        email: profileData?.email || user.email || '',
        avatarUrl: profileData?.avatar_url || null,
        bio: "Learning enthusiast and achievement hunter", // Default bio
        role: "Student" // Default role
      });

      // Get user achievements and calculate stats
      const achievements = await userDataService.getAchievements(user.id);
      
      // Use the same XP calculation as leaderboard
      const totalXP = await AchievementPointsService.getTotalAchievementPoints(user.id);
      const level = userDataService.calculateLevel(totalXP);
      const pointsToNext = userDataService.calculatePointsToNextLevel(totalXP);
      
      // Count only unlocked achievements (progress = 100)
      const unlockedAchievements = achievements.filter(a => a.progress === 100);
      
      // Count weekly achievements specifically
      // Get the titles of all weekly achievements from the weeklyAchievements.ts file
      const weeklyAchievementTitles = WEEKLY_ACHIEVEMENTS.map(wa => wa.title);
      
      // Filter achievements that are completed and match weekly achievement titles
      const weeklyAchievements = achievements.filter(a => 
        a.progress === 100 && 
        weeklyAchievementTitles.includes(a.title)
      );

      // Get global ranking - use exact same logic as LeaderboardPage
      const { data: leaderboardData, error: leaderboardError } = await supabase
        .from('leaderboard_scores')
        .select(`
          id,
          user_id,
          score,
          assignments_completed,
          assignments_due,
          average_course_percentage,
          calculated_at,
          time_period
        `)
        .eq('time_period', 'all_time')
        .order('score', { ascending: false });

      let globalRank = null;
      
      if (!leaderboardError && leaderboardData && leaderboardData.length > 0) {
        
        // Get user profiles for names (same as LeaderboardPage)
        const userIds = [...new Set(leaderboardData.map(s => s.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);

        // Create a map of user_id to profile data
        const profileMap: Record<string, any> = {};
        if (profiles) {
          profiles.forEach(profile => {
            profileMap[profile.id] = profile;
          });
        }

        // Create display array exactly like LeaderboardPage
        const display = leaderboardData.map((score) => {
          const profile = profileMap[score.user_id];
          const name = score.user_id === user?.id ? "You" : (profile?.full_name || "Anonymous");
          const calculatedLevel = userDataService.calculateLevel(score.score);
          
          return {
            id: score.user_id,
            name,
            total: Math.round(score.score * 100) / 100,
            level: calculatedLevel,
          };
        });

        // Ensure current user is in the display array (same logic as LeaderboardPage)
        const existingUser = display.find(r => r.id === user.id);
        if (!existingUser) {
          display.push({
            id: user.id,
            name: "You",
            total: Math.round(totalXP * 100) / 100,
            level: level,
          });
          
          // Sort the display again to maintain ranking
          display.sort((a, b) => b.total - a.total);
        }

        // Find user's global rank in the sorted display array
        const userIndex = display.findIndex(entry => entry.id === user.id);
        if (userIndex !== -1) {
          globalRank = userIndex + 1;
        }
      } else {
        // Fallback: if leaderboard_scores is empty or error, calculate rank from achievements
        // This matches the fallback logic in LeaderboardPage
        try {
          const { data: allAchievements } = await supabase
            .from("achievements")
            .select("user_id, points, progress");
          
          if (allAchievements) {
            // Calculate scores for all users
            const userScores: Record<string, number> = {};
            
            allAchievements.forEach(achievement => {
              const currentScore = userScores[achievement.user_id] || 0;
              const achievementPoints = achievement.points * (achievement.progress / 100);
              userScores[achievement.user_id] = currentScore + achievementPoints;
            });
            
            // Convert to array and sort by score
            const sortedScores = Object.entries(userScores)
              .map(([userId, score]) => ({ user_id: userId, score }))
              .sort((a, b) => b.score - a.score);
            
            // Find user's rank
            const userIndex = sortedScores.findIndex(entry => entry.user_id === user.id);
            if (userIndex !== -1) {
              globalRank = userIndex + 1;
            }
          }
    } catch (error) {
          console.error('Error calculating fallback ranking:', error);
        }
      }

              setStats({
          totalXP: Math.round(totalXP),
          level,
          pointsToNext: pointsToNext.next - pointsToNext.current,
          globalRank,
          achievementsCount: weeklyAchievements.length
        });

      
    } catch (error) {
        console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };
  


  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!profile || !stats) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Unable to load profile data</p>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground mt-1">
            Your learning journey and achievements
          </p>
        </div>
        
        {/* Profile Header */}
            <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="relative">
                  <Avatar className="w-24 h-24">
                  {profile.avatarUrl ? (
                    <AvatarImage src={profile.avatarUrl} alt="Profile" />
                    ) : (
                      <AvatarFallback>
                        <UserCircle className="w-12 h-12" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                {isEditingProfile && (
                    <Button 
                    size="sm"
                      variant="outline" 
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                    onClick={() => {/* TODO: Implement avatar upload */}}
                  >
                    <Camera className="h-4 w-4" />
                    </Button>
                )}
              </div>
                  
              <div className="flex-1 text-center md:text-left">
                {isEditingProfile ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={editForm.fullName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={editForm.bio}
                        onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Tell us about yourself..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="avatarUrl">Avatar URL</Label>
                      <Input
                        id="avatarUrl"
                        value={editForm.avatarUrl}
                        onChange={(e) => setEditForm(prev => ({ ...prev, avatarUrl: e.target.value }))}
                        placeholder="https://example.com/avatar.jpg"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveProfile} size="sm">
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </Button>
                      <Button onClick={handleCancelEdit} variant="outline" size="sm">
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-bold">{profile.fullName}</h2>
                    <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                      <Badge variant="secondary">{profile.role}</Badge>
                      <span className="text-sm text-muted-foreground">Level {stats.level}</span>
                    </div>
                    <p className="text-muted-foreground mt-2">{profile.bio}</p>
                    <p className="text-sm text-muted-foreground mt-1">{profile.email}</p>
                      <Button 
                      onClick={handleEditProfile}
                      variant="outline"
                      size="sm"
                      className="mt-4"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                      </Button>
                  </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* XP Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total XP</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalXP.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pointsToNext} XP to next level
              </p>
            </CardContent>
          </Card>

          {/* Level Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Level</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.level}</div>
              <p className="text-xs text-muted-foreground">
                Current level
              </p>
            </CardContent>
          </Card>

          {/* Global Rank Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Global Rank</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.globalRank ? `#${stats.globalRank}` : 'Unranked'}
                  </div>
              <p className="text-xs text-muted-foreground">
                {stats.globalRank ? 'Out of all users' : 'Complete assignments to rank'}
              </p>
            </CardContent>
          </Card>

          {/* Weekly Achievements Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Achievements</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.achievementsCount}</div>
              <p className="text-xs text-muted-foreground">
                Total done
              </p>
            </CardContent>
          </Card>
                </div>



        {/* Achievements & Milestones Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Achievements & Milestones</h2>
          
          {/* Achievement Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Total Achievements */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Achievements</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{achievements.length + WEEKLY_ACHIEVEMENTS.length}</div>
                <p className="text-xs text-muted-foreground">
                  Available to unlock
                </p>
              </CardContent>
            </Card>

            {/* Unlocked Achievements */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unlocked</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {achievements.filter(a => a.unlocked).length + achievements.filter(a => 
                    a.progress === 100 && 
                    WEEKLY_ACHIEVEMENTS.map(wa => wa.title).includes(a.title)
                  ).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {achievements.length + WEEKLY_ACHIEVEMENTS.length > 0 
                    ? `${Math.round(((achievements.filter(a => a.unlocked).length + achievements.filter(a => 
                        a.progress === 100 && 
                        WEEKLY_ACHIEVEMENTS.map(wa => wa.title).includes(a.title)
                      ).length) / (achievements.length + WEEKLY_ACHIEVEMENTS.length)) * 100)}% completion`
                    : '0% completion'
                      }
                    </p>
              </CardContent>
            </Card>

            {/* Total Points */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Points</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {achievements.reduce((sum, a) => a.unlocked ? sum + a.points : sum, 0)}
                  </div>
                <p className="text-xs text-muted-foreground">
                  From unlocked achievements
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Completed Achievements */}
            <Card>
              <CardHeader>
              <CardTitle>Completed Achievements</CardTitle>
              </CardHeader>
              <CardContent>
              {achievements.filter(a => a.unlocked).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements
                    .filter(a => a.unlocked)
                    .sort((a, b) => b.points - a.points)
                    .map((achievement) => (
                      <div key={achievement.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary">
                          {React.cloneElement(getIconComponent(achievement.icon) as React.ReactElement, { className: 'w-5 h-5' })}
                  </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate">{achievement.title}</h4>
                          <p className="text-xs text-muted-foreground truncate">{achievement.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {achievement.points} pts
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                achievement.difficulty === AchievementDifficulty.EASY ? 'text-green-600' :
                                achievement.difficulty === AchievementDifficulty.MEDIUM ? 'text-yellow-600' :
                                'text-red-600'
                              }`}
                            >
                              {difficultyText[achievement.difficulty]}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Achievements Yet</h3>
                  <p className="text-muted-foreground">Complete assignments and use the app to unlock your first achievement!</p>
                </div>
              )}
              </CardContent>
            </Card>
                  </div>

          
        {/* Privacy Settings Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Privacy Settings</h2>
            <Card>
              <CardHeader>
              <CardTitle>Control Your Profile Visibility</CardTitle>
              </CardHeader>
              <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Global Ranking</Label>
                    <p className="text-sm text-muted-foreground">
                      Show your global rank in leaderboards
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.showGlobalRank}
                    onCheckedChange={(checked) => handlePrivacySettingChange('showGlobalRank', checked)}
                    />
                  </div>
                  
              </div>
              </CardContent>
            </Card>
        </div>
                  
        {/* Level Progress Bar */}
        <Card>
          <CardHeader>
            <CardTitle>Level Progress</CardTitle>
          </CardHeader>
          <CardContent>
                  <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Level {stats.level}</span>
                <span>Level {stats.level + 1}</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(stats.totalXP % 1000) / 10}%` // Assuming 1000 XP per level
                  }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {stats.pointsToNext} XP remaining to reach Level {stats.level + 1}
              </p>
                  </div>
              </CardContent>
            </Card>
      </div>
    </MainLayout>
  );
};

export default ProfilePage;
