import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Mail, Calendar, Trophy, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface NotificationPreferences {
  notifications_enabled: boolean;
}

const NotificationSettings: React.FC = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    notifications_enabled: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load current notification preferences
  useEffect(() => {
    const loadNotificationPreferences = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('notifications_enabled')
          .eq('user_id', user.id)
          .single();

        if (error) {
          // If no settings exist, create default ones
          if (error.code === 'PGRST116') {
            const { error: insertError } = await supabase
              .from('user_settings')
              .insert({
                user_id: user.id,
                notifications_enabled: true
              });

            if (insertError) {
              console.error('Error creating user settings:', insertError);
              toast.error('Failed to load notification settings');
            } else {
              setPreferences({ notifications_enabled: true });
            }
          } else {
            console.error('Error loading notification preferences:', error);
            toast.error('Failed to load notification settings');
          }
        } else if (data) {
          setPreferences({
            notifications_enabled: data.notifications_enabled ?? true
          });
        }
      } catch (error) {
        console.error('Error loading notification preferences:', error);
        toast.error('Failed to load notification settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadNotificationPreferences();
  }, [user]);

  // Save notification preferences
  const updateNotificationPreference = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .update({ [key]: value, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating notification preferences:', error);
        toast.error('Failed to update notification settings');
        return;
      }

      setPreferences(prev => ({ ...prev, [key]: value }));
      toast.success('Notification settings updated successfully');
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      toast.error('Failed to update notification settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-muted-foreground">Loading notification settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Notification Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Control when and how you receive email notifications from Gambit
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">Enable Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email notifications for important updates and achievements
              </p>
            </div>
            <Switch
              checked={preferences.notifications_enabled}
              onCheckedChange={(checked) => updateNotificationPreference('notifications_enabled', checked)}
              disabled={isSaving}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Types Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            What You'll Receive
          </CardTitle>
          <CardDescription>
            When notifications are enabled, you'll receive emails for these events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className={`flex items-center gap-3 p-3 rounded-lg border ${
              preferences.notifications_enabled 
                ? 'bg-muted/50 border-border' 
                : 'bg-muted/20 border-muted text-muted-foreground'
            }`}>
              <Trophy className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="font-medium">Achievement Unlocked</p>
                <p className="text-sm text-muted-foreground">
                  When you earn new achievements and milestones
                </p>
              </div>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-lg border ${
              preferences.notifications_enabled 
                ? 'bg-muted/50 border-border' 
                : 'bg-muted/20 border-muted text-muted-foreground'
            }`}>
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium">Assignment Reminders</p>
                <p className="text-sm text-muted-foreground">
                  Upcoming deadlines and important course dates
                </p>
              </div>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-lg border ${
              preferences.notifications_enabled 
                ? 'bg-muted/50 border-border' 
                : 'bg-muted/20 border-muted text-muted-foreground'
            }`}>
              <BookOpen className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Weekly Progress Summary</p>
                <p className="text-sm text-muted-foreground">
                  Weekly summaries of your academic progress and streaks
                </p>
              </div>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-lg border ${
              preferences.notifications_enabled 
                ? 'bg-muted/50 border-border' 
                : 'bg-muted/20 border-muted text-muted-foreground'
            }`}>
              <Bell className="h-5 w-5 text-purple-500" />
              <div>
                <p className="font-medium">System Updates</p>
                <p className="text-sm text-muted-foreground">
                  Important announcements and new feature releases
                </p>
              </div>
            </div>
          </div>

          {!preferences.notifications_enabled && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                📪 Email notifications are currently disabled. You can still access all features in the app, 
                but you won't receive email updates.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Privacy Note */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              🔒 Your email preferences are private and secure. We never share your information with third parties.
            </p>
            <p className="text-xs text-muted-foreground">
              You can change these settings at any time. Changes take effect immediately.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSettings;
