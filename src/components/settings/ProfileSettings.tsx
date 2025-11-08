import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Loader2,
  Upload,
  Lock,
  User as UserIcon,
  Mail,
  Camera,
  Eye,
  EyeOff,
  Star,
  Target,
  Trophy,
  TrendingUp,
  Award,
  CheckCircle,
  BookOpen,
  Clock,
  Calendar,
  Flame,
  Map,
  Users,
  Heart,
  MessageCircle,
  Zap,
  Flag,
  User as UserIcon2,
  Settings as SettingsIcon,
  Compass,
  Sun,
  Repeat,
  CheckSquare,
  Edit3,
  LogIn,
  Clipboard,
  BarChart2,
  Medal,
  Crown,
  Shield,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { trackProfilePicUpload } from "@/utils/eventTracker";
import { achievementManager } from '@/services/achievement/AchievementManager';
import { userDataService } from '@/services/userDataService';
import { AchievementPointsService } from '@/services/achievementPointsService';
import { WEEKLY_ACHIEVEMENTS } from '@/data/weeklyAchievements';
import { Achievement, AchievementDifficulty } from '@/types/achievement';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { SubscriptionService } from '@/services/subscriptionService';
import { X } from 'lucide-react';


const profileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
});

const passwordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(6, "Password must be at least 6 characters"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z
      .string()
      .min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

interface UserStats {
  totalXP: number;
  level: number;
  pointsToNext: number;
  globalRank: number | null;
  achievementsCount: number;
}

const ProfileSettings: React.FC = () => {
  const { user, updateUserProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [scoreVisibility, setScoreVisibility] = useState<boolean>(true); // true = public, false = anonymous
  const [userPlan, setUserPlan] = useState<string>("basic");
  const [stats, setStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isCancelingSubscription, setIsCancelingSubscription] = useState(false);

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      email: "",
    },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (user) {
      loadProfileData();
      loadStats();
    }
  }, [user]);

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
    'user': <UserIcon2 />,
    'settings': <SettingsIcon />,
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

  const loadStats = async () => {
    if (!user) return;

    try {
      // Get user achievements and calculate stats
      const userAchievements = await userDataService.getAchievements(user.id);
      setAchievements(userAchievements);
      
      const achievements = userAchievements;
      
      // Use the same XP calculation as leaderboard
      const totalXP = await AchievementPointsService.getTotalAchievementPoints(user.id);
      const level = userDataService.calculateLevel(totalXP);
      const pointsToNext = userDataService.calculatePointsToNextLevel(totalXP);

      // Count weekly achievements specifically
      const weeklyAchievementTitles = WEEKLY_ACHIEVEMENTS.map(wa => wa.title);
      const weeklyAchievements = achievements.filter(a => 
        a.progress === 100 && 
        weeklyAchievementTitles.includes(a.title)
      );

      // Get global ranking - use same logic as ProfilePage
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
        const userIds = [...new Set(leaderboardData.map(s => s.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);

        const profileMap: Record<string, any> = {};
        if (profiles) {
          profiles.forEach(profile => {
            profileMap[profile.id] = profile;
          });
        }

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

        const existingUser = display.find(r => r.id === user.id);
        if (!existingUser) {
          display.push({
            id: user.id,
            name: "You",
            total: Math.round(totalXP * 100) / 100,
            level: level,
          });
          display.sort((a, b) => b.total - a.total);
        }

        const userIndex = display.findIndex(entry => entry.id === user.id);
        if (userIndex !== -1) {
          globalRank = userIndex + 1;
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
      console.error('Error loading stats:', error);
    }
  };

  const loadProfileData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Load the user's profile data
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, email, avatar_url, plan")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error loading profile:", error);
        toast.error("Could not load your profile information.");
      } else if (data) {
        const profileData = data as any;
        profileForm.setValue("fullName", profileData.full_name || "");
        profileForm.setValue("email", profileData.email || user.email || "");
        setAvatarUrl(profileData.avatar_url || null);
        setUserPlan(profileData.plan || "basic");
      }

      // Load score visibility setting from user_settings
      try {
        const { data: settingsData, error: settingsError } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!settingsError && settingsData) {
          // Check if score_visibility exists in the data (it might not exist yet)
          if ('score_visibility' in settingsData && settingsData.score_visibility !== null) {
            setScoreVisibility(settingsData.score_visibility as boolean);
          } else {
            // If no setting found, default to true (public)
            setScoreVisibility(true);
          }
        } else {
          // If no settings record found, default to true (public)
          setScoreVisibility(true);
        }
      } catch (settingsError) {
        console.log('Score visibility setting not found, using default (public)');
        setScoreVisibility(true);
      }
    } catch (error) {
      console.error("Error in profile loading:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScoreVisibilityChange = async (isPublic: boolean) => {
    if (!user) return;
    
    try {
      setScoreVisibility(isPublic);
      
      // Try to update existing setting
      const { error: updateError } = await supabase
        .from("user_settings")
        .update({ 
          score_visibility: isPublic,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id);

      if (updateError) {
        // If update fails, try to insert
        const { error: insertError } = await supabase
          .from("user_settings")
          .insert({
            user_id: user.id,
            score_visibility: isPublic,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error("Error saving score visibility:", insertError);
          toast.error("Failed to save score visibility setting");
          // Revert the state change
          setScoreVisibility(!isPublic);
          return;
        }
      }

      toast.success(`Your scores are now ${isPublic ? 'public' : 'anonymous'}`);
    } catch (error) {
      console.error("Error updating score visibility:", error);
      toast.error("Failed to update score visibility");
      // Revert the state change
      setScoreVisibility(!isPublic);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user) return;
    
    setIsCancelingSubscription(true);
    try {
      await SubscriptionService.cancelSubscription(user.id);
      
      // Update local state
      setUserPlan('basic');
      
      toast.success('Subscription canceled successfully', {
        description: 'Your plan has been downgraded to Basic and all files have been removed.',
      });
      
      // Refresh the page data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel subscription');
    } finally {
      setIsCancelingSubscription(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    setIsSaving(true);
  
    try {
      // 1) Optionally delete the file from storage
      //    (you could keep it if you want history)
      if (avatarUrl?.includes(`${user.id}/`)) {
        const path = avatarUrl.split('/avatars/')[1]
        await supabase.storage
          .from('avatars')
          .remove([ path ])
      }
  
      // 2) Clear it in your profiles table
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq('id', user.id)
  
      if (error) throw error
  
      // 3) Clear local states
      setAvatarUrl(null)
      setAvatarFile(null)
  
      toast.success("Profile picture removed")
  
      // 4) Kick off your achievements re‑check (Good Looks should now reset)
      await achievementManager.checkAndUpdateAchievements(user.id)
  
    } catch (err: any) {
      console.error("Error removing avatar:", err)
      toast.error("Failed to remove profile picture")
    } finally {
      setIsSaving(false)
    }
  }
  

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];

    // Check file size and type
    if (file.size > 5 * 1024 * 1024) {
      // 5MB
      toast.error("Image size must be less than 5MB");

      // Track failed upload due to file size
      trackProfilePicUpload(false, {
        reason: "file_too_large",
        fileSize: file.size,
        fileType: file.type,
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");

      // Track failed upload due to file type
      trackProfilePicUpload(false, {
        reason: "invalid_file_type",
        fileType: file.type,
      });
      return;
    }

    setAvatarFile(file);

    // Create a preview URL
    const objectUrl = URL.createObjectURL(file);
    setAvatarUrl(objectUrl);
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return null;

    try {
      // Create a unique filename for the avatar
      const fileExt = avatarFile.name.split(".").pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Check if the avatars bucket exists, create it if it doesn't
      try {
        const { data: buckets } = await supabase.storage.listBuckets();
        if (!buckets?.find((bucket) => bucket.name === "avatars")) {
          await supabase.storage.createBucket("avatars", { public: true });
        }
      } catch (error) {
        console.error("Error checking/creating bucket:", error);
      }

      // Upload the file to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatarFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL for the avatar
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      // Track successful upload
      trackProfilePicUpload(true, {
        fileSize: avatarFile.size,
        fileType: avatarFile.type,
      });

      return urlData.publicUrl;
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload profile picture");

      // Track failed upload
      trackProfilePicUpload(false, {
        reason: "upload_error",
        error: String(error),
      });

      return null;
    }
  };

  const handleSaveProfile = async (values: z.infer<typeof profileSchema>) => {
    if (!user) return;

    setIsSaving(true);
    try {
      let newAvatarUrl = avatarUrl;

      // Upload avatar if a new file was selected
      if (avatarFile) {
        const publicUrl = await uploadAvatar();
        if (!publicUrl) {
          throw new Error("Failed to upload avatar");
        }
        newAvatarUrl = publicUrl;
      }
      

      
      
      // Update the user profile in Supabase
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: values.fullName,
          email: values.email,
          avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profileError) {
        throw profileError;
      }

      // Update the user metadata in Supabase Auth
      if (updateUserProfile) {
        await updateUserProfile({
          full_name: values.fullName,
          avatar_url: newAvatarUrl,
        });
      }

      toast.success("Your profile settings have been saved successfully.");

      // Reset the avatarFile state since it's been uploaded
      setAvatarFile(null);

      // Reload the profile data to ensure everything is in sync
      await loadProfileData();
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast.error(error.message || "Could not save your profile information.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (
    values: z.infer<typeof passwordSchema>
  ) => {
    if (!user) return;

    setIsChangingPassword(true);
    try {
      // Update the user's password in Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      if (error) {
        throw error;
      }

      toast.success("Your password has been updated successfully.");

      // Reset the password form
      passwordForm.reset();
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(error.message || "Could not change your password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // ...existing code...
  const handleDeleteAccount = async () => {
    if (!user) {
      toast.error("User not found");
      return;
    }
    setIsDeletingAccount(true);
    try {
      // Call the Supabase Edge Function
      // Ensure 'delete-account' matches the name you deployed your function with.
      const { error: functionError } = await supabase.functions.invoke('delete-account');

      if (functionError) {
        // It's good to log the specific error from the function
        console.error("Edge function invocation error:", functionError);
        // Provide a user-friendly message, but you can also include functionError.message if it's safe to display
        toast.error(`Failed to delete account: ${functionError.message || "An error occurred with the delete service."}`);
        // Optionally, re-throw if you want to ensure the catch block below also sees it,
        // or just return if the toast is sufficient.
        // throw new Error(functionError.message || "Failed to invoke delete function.");
        setIsDeletingAccount(false); // Ensure loading state is reset on function error
        return; 
      }

      // If the function call was successful (no error thrown by it)
      toast.success(
        "Your account and all associated data have been successfully deleted."
      );

      // Log out the user
      if (logout) {
        await logout();
      } else {
        // Fallback if logout from context is not available
        await supabase.auth.signOut();
      }

      navigate("/login"); // Redirect to login or a public page
    } catch (error: any) {
      // This catch block will now primarily handle network errors during the invoke call,
      // or errors re-thrown from the functionError check if you choose to do so.
      console.error("Error during account deletion process:", error);
      toast.error(
        `Failed to delete account: ${
          error.message || "An unexpected error occurred."
        }`
      );
      // Ensure isDeletingAccount is reset in the catch-all as well
      // setIsDeletingAccount(false); // This is handled by the finally block
    } finally {
      setIsDeletingAccount(false);
    }
  };

// ...existing code...;

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      {stats && (
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
      )}

      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>
            Manage your personal information and preferences
          </CardDescription>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-muted-foreground">Plan:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              userPlan === 'premium' 
                ? 'bg-gradient-to-r from-yellow-100 to-orange-200 text-orange-700 border border-orange-200' 
                : 'bg-gray-100 text-gray-700 border border-gray-200'
            }`}>
              {userPlan === 'premium' ? 'Premium' : 'Basic'}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              <Avatar className="h-24 w-24 border-2 border-primary/20">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt="Profile" />
                ) : (
                  <AvatarFallback className="text-xl">
                    {user?.user_metadata?.full_name
                      ? getInitials(user.user_metadata.full_name)
                      : user?.email?.substring(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                )}
              </Avatar>
                {/* Change button (your existing camera icon) */}
                <label
                    htmlFor="avatar-upload"
                    className="
                      absolute bottom-0 right-0 p-1 rounded-full
                      bg-white text-journey-primary
                      hover:bg-primary hover:text-white
                      cursor-pointer
                    "
                  >
                    <Camera className="h-4 w-4" />
                <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange}/>
              </label>
            </div>
            {avatarUrl && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="text-sm text-red-500 hover:underline"
              >
                Remove profile picture
              </button>
            )}
            <p className="text-sm text-muted-foreground">
              Click the camera icon to change your profile picture (PNG only)
            </p>
          </div>

          <Form {...profileForm}>
            <form
              onSubmit={profileForm.handleSubmit(handleSaveProfile)}
              className="space-y-4"
            >
              <FormField
                control={profileForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          className="pl-10"
                          placeholder="Enter your full name"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={profileForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type="email"
                          className="pl-10"
                          placeholder="Enter your email address"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="mt-4" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Profile Changes"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form
              onSubmit={passwordForm.handleSubmit(handleChangePassword)}
              className="space-y-4"
            >
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type="password"
                          className="pl-10"
                          placeholder="Enter your current password"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type="password"
                          className="pl-10"
                          placeholder="Enter your new password"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type="password"
                          className="pl-10"
                          placeholder="Confirm your new password"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="mt-4"
                disabled={isChangingPassword}
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Change Password"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Score Visibility</CardTitle>
          <CardDescription>
            Control whether your scores and achievements are visible to other users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {scoreVisibility ? (
                  <Eye className="h-4 w-4 text-green-600" />
                ) : (
                  <EyeOff className="h-4 w-4 text-slate-500" />
                )}
                <span className="font-medium">
                  {scoreVisibility ? 'Public Scores' : 'Anonymous Scores'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {scoreVisibility 
                  ? 'Other users can see your scores and achievements on leaderboards'
                  : 'Your scores and achievements will be hidden from other users'
                }
              </p>
            </div>
            <Switch
              checked={scoreVisibility}
              onCheckedChange={handleScoreVisibilityChange}
              className="ml-4"
            />
          </div>
        </CardContent>
      </Card>

      {/* Subscription Management */}
      {userPlan === 'premium' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              Subscription Management
            </CardTitle>
            <CardDescription>
              Manage your Premium subscription
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                <div>
                  <p className="font-semibold">Active Premium Subscription</p>
                  <p className="text-sm text-muted-foreground">
                    You have access to all premium features
                  </p>
                </div>
                <Badge className="bg-yellow-600 text-white">Premium</Badge>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Cancel Subscription</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Canceling will immediately downgrade your account and remove all AI features.
                </p>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                      disabled={isCancelingSubscription}
                    >
                      {isCancelingSubscription ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Canceling...
                        </>
                      ) : (
                        <>
                          <X className="w-4 h-4 mr-2" />
                          Cancel Subscription
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription className="space-y-2">
                        <p className="font-semibold text-foreground">This action will:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>Cancel your Premium subscription immediately</li>
                          <li>Delete all your processed Canvas files</li>
                          <li>Downgrade your account to Basic plan</li>
                          <li>Remove all AI study assistance features</li>
                        </ul>
                        <p className="mt-4 font-semibold text-red-600">This action cannot be undone.</p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancelSubscription}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Yes, Cancel Subscription
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

      <Card>
        <CardHeader>
          <CardTitle>Manage Account</CardTitle>
          <CardDescription>
            Permanently delete your account along with all your data and history. This action cannot be undone. Any groups you created will also be deleted so please transfer ownership of any groups you created before proceeding.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline"
                size="sm"
                disabled={isDeletingAccount}
                className=" hover:text-foreground border-muted-foreground/30"
              >
                {isDeletingAccount ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Account" 
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action is irreversible. This will permanently delete your
                  account and remove all your data from our servers. To
                  confirm, please click "Yes, Delete My Account".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeletingAccount}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeletingAccount ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Yes, Delete My Account"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSettings;
