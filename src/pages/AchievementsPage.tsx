
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { userDataService } from '@/services/userDataService';
import { Achievement, AchievementDifficulty } from '@/types/achievement';
import { toast } from 'sonner';
import AchievementStats from '@/components/achievements/AchievementStats';
import AchievementList from '@/components/achievements/AchievementList';
import { Button } from '@/components/ui/button';
import { RefreshCw, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


const AchievementsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate  = useNavigate();  
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [totalPoints, setTotalPoints] = useState(0);
  const [progressCount, setProgressCount] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [nextLevelProgress, setNextLevelProgress] = useState(0);
  const [pointsToNextLevel, setPointsToNextLevel] = useState({ current: 0, next: 0, progress: 0 });
  const [showConnectPrompt, setShowConnectPrompt] = useState(false);  

  useEffect(() => {
    if (!user) return;

    (async () => {
      /* 1️⃣  Do we have Canvas creds? */
      const creds = await userDataService.getCanvasCredentials(user.id);
      setShowConnectPrompt(!creds);                         /* NEW  */
      if (!creds) {                                         /* NEW – stop here */
        setIsLoading(false);
        return;
      }

      /* 2️⃣  Regular data fetch */
      await loadAchievements();
      userDataService.trackPageView(user.id, "achievements");
    })();
  }, [user]);
  
  const loadAchievements = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Get latest achievements
      const userAchievements = await userDataService.getAchievements(user.id);
      console.log("achievements");
      console.log(achievements);
      console.log(user.id);
      console.log('after login localStorage:', { ...localStorage });
      console.log(`Loaded ${userAchievements.length} achievements:`, userAchievements.map(a => a.title));
      setAchievements(userAchievements);
      
      // Calculate achievements in progress
      // Only count achievements that have started but are not fully unlocked
      const inProgress = userAchievements.filter(a => a.progress > 0 && a.progress < 100);
      const unlocked = userAchievements.filter(a => a.unlocked);
      setProgressCount(inProgress.length);
      
      // Calculate total points
      const calculatedPoints = userAchievements.reduce((sum, a) => {
        if (a.unlocked) {
          return sum + a.points;
        } else if (a.progress > 0) {
          // For achievements in progress, add partial points
          return sum + (a.points * (a.progress / 100));
        }
        return sum;
      }, 0);
      
      setTotalPoints(calculatedPoints);
      
      // Calculate user level
      const level = userDataService.calculateLevel(calculatedPoints);
      setUserLevel(level);
      
      // Calculate next level progress
      const nextLevelInfo = userDataService.calculatePointsToNextLevel(calculatedPoints);
      setPointsToNextLevel(nextLevelInfo);
      setNextLevelProgress(nextLevelInfo.progress);
      
    } catch (error) {
      console.error('Error loading achievements:', error);
      toast.error('Failed to load achievements');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRefreshAchievements = async () => {
    if (!user || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      console.log('Refreshing achievement progress...');
      
      // Call the refresh method in the achievement service
      await userDataService.refreshAchievements(user.id);
      
      toast.success('Refreshing achievement progress...', {
        description: 'Updating your achievements',
        duration: 2000
      });
      
      // Wait a moment to ensure database operations complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reload achievements after refresh
      await loadAchievements();
      
      console.log('Refresh and reload complete');
    } catch (error) {
      console.error('Error refreshing achievements:', error);
      toast.error('Failed to refresh achievements', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const filteredAchievements = achievements.filter(achievement => {
    if (activeTab === 'all') return true;
    if (activeTab === 'progress') return achievement.progress > 0 && achievement.progress < 100;
    return achievement.difficulty === activeTab;
  });


  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          Loading…
        </div>
      </MainLayout>
    );
  }

  if (showConnectPrompt) {                                  /* NEW – same look/feel as Dashboard */
    return (
      <MainLayout>
        <div className="max-w-xl mx-auto mt-16">
          <div className="border rounded-lg p-8 text-center shadow-sm bg-background">
            <LayoutDashboard className="w-12 h-12 mx-auto text-journey-primary opacity-50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Connect Your Canvas Account
            </h2>
            <p className="text-muted-foreground mb-6">
              You’ll need to connect Canvas before you can start earning
              achievements.
            </p>
            <Button onClick={() => navigate("/settings")}>Connect Canvas</Button>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-1">Achievements</h1>
            <p className="text-muted-foreground">
              {achievements.length > 0 
                ? `You have ${achievements.length} achievement${achievements.length !== 1 ? 's' : ''} to unlock` 
                : 'You have no achievements yet.'}
            </p>
          </div>
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAchievements}
              disabled={isRefreshing || isLoading}
              className="flex items-center gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Achievements'}
            </Button>
          </div>
        </div>
        
        <AchievementStats 
          achievements={achievements}
          totalPoints={totalPoints}
          progressCount={progressCount}
          userLevel={userLevel}
          nextLevelProgress={nextLevelProgress}
          pointsToNextLevel={pointsToNextLevel}
          isLoading={isLoading}
          hideNextAchievement={true}
        />
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 grid grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="progress">In Progress</TabsTrigger>
            <TabsTrigger value="easy">Easy</TabsTrigger>
            <TabsTrigger value="medium">Medium</TabsTrigger>
            <TabsTrigger value="hard">Hard</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-0">
            <AchievementList 
              achievements={filteredAchievements} 
              isLoading={isLoading} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default AchievementsPage;
