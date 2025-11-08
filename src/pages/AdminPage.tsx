import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminService } from '@/services/adminService';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '../integrations/supabase/admin';

const AdminPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [redisTest, setRedisTest] = useState<any>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Get basic stats
      const adminStats = await AdminService.getAdminStats();
      setStats(adminStats);

      // Get recent users
      const { data: recentUsers, error } = await supabase
        .from('profiles')
        .select('id, email, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && recentUsers) {
        setUsers(recentUsers);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const investigateUsers = async () => {
    try {
      console.log('Investigating where users are stored...');
      
      // Check courses table to see unique user_ids
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('user_id')
        .limit(100);
      
      if (courses) {
        const uniqueUserIds = [...new Set(courses.map(c => c.user_id))];
        console.log('Unique user IDs in courses:', uniqueUserIds.length);
        console.log('Sample user IDs:', uniqueUserIds.slice(0, 5));
        
        // Check if these user_ids exist in profiles
        if (uniqueUserIds.length > 0) {
          const { data: profileUsers, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .in('id', uniqueUserIds.slice(0, 10));
          
          console.log('Users found in profiles:', profileUsers?.length || 0);
          console.log('Profile error:', profileError);
        }
      }
      
    } catch (error) {
      console.error('User investigation error:', error);
    }
  };

  const testRedisCache = async () => {
    try {
      // Test Redis cache for a few different users
      const testUsers = users.slice(0, 3); // Test first 3 users
      const results = [];

      for (const user of testUsers) {
        try {
          // Test achievements cache
          const { data: achievements, error: achievementsError } = await supabase.functions.invoke('redis-achievements', {
            body: { userId: user.id, invalidate: false }
          });

          // Test milestones cache
          const { data: milestones, error: milestonesError } = await supabase.functions.invoke('redis', {
            body: { userId: user.id, invalidate: false }
          });

          results.push({
            userId: user.id,
            email: user.email,
            achievements: { data: achievements, error: achievementsError },
            milestones: { data: milestones, error: milestonesError }
          });
        } catch (error) {
          results.push({
            userId: user.id,
            email: user.email,
            error: error.message
          });
        }
      }

      setRedisTest(results);
    } catch (error) {
      console.error('Error testing Redis cache:', error);
    }
  };

  const testServiceRole = async () => {
    try {
      console.log('Testing service role connection...');
      
      // Test direct query with service role
      const { data: testUsers, error: testError } = await supabase.functions.invoke('redis-admin', {
        body: { dataType: 'users', invalidate: true }
      });
      
      console.log('Service role test result:', { testUsers, testError });
      
      // Also test direct admin query
      const { data: directUsers, error: directError } = await supabase
        .from('profiles')
        .select('id, email')
        .limit(5);
      
      console.log('Direct query test:', { directUsers, directError });
      
    } catch (error) {
      console.error('Service role test error:', error);
    }
  };

  const testServiceRoleKey = async () => {
    try {
      console.log('Testing service role key directly...');
      
      // Test 1: Direct query with admin client
      const { data: directTest, error: directError } = await supabaseAdmin
        .from('profiles')
        .select('count', { count: 'exact', head: true });
      
      console.log('Direct admin count test:', { directTest, directError });
      
      // Test 2: Try to get all profiles with admin client
      const { data: allProfiles, error: allError } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .limit(5);
      
      console.log('All profiles test:', { 
        count: allProfiles?.length, 
        error: allError,
        sample: allProfiles?.slice(0, 3)
      });
      
      // Test 3: Check if the service role key is actually working
      const { data: authTest, error: authError } = await supabaseAdmin.auth.getUser();
      console.log('Auth test with service role:', { authTest, authError });
      
    } catch (error) {
      console.error('Service role key test error:', error);
    }
  };

  const checkProfilesTable = async () => {
    try {
      console.log('Checking what\'s in the profiles table with admin service...');
      
      // Use AdminService to get all users (bypasses RLS)
      const allUsers = await AdminService.getAllUsers();
      console.log('All users from admin service:', allUsers.length);
      console.log('Sample users:', allUsers.slice(0, 3));
      
      // Also try direct admin query
      const { data: adminProfiles, error: adminError } = await supabaseAdmin
        .from('profiles')
        .select('id, email, created_at')
        .limit(10);
      
      console.log('Direct admin query result:', { 
        count: adminProfiles?.length, 
        error: adminError,
        sample: adminProfiles?.slice(0, 3)
      });
      
    } catch (error) {
      console.error('Profile check error:', error);
    }
  };

  const testDirectDatabase = async () => {
    try {
      console.log('Testing direct database access...');
      
      // Test 1: Direct count query
      const { count: userCount, error: countError } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      
      console.log('Direct user count:', { userCount, countError });
      
      // Test 2: Get first 10 users
      const { data: users, error: usersError } = await supabaseAdmin
        .from('profiles')
        .select('id, email, created_at')
        .limit(10);
      
      console.log('First 10 users:', { 
        count: users?.length, 
        error: usersError,
        users: users?.slice(0, 3)
      });
      
      // Test 3: Check if we can see all users with regular client
      const { data: regularUsers, error: regularError } = await supabase
        .from('profiles')
        .select('id, email')
        .limit(5);
      
      console.log('Regular client users:', { 
        count: regularUsers?.length, 
        error: regularError,
        users: regularUsers
      });
      
    } catch (error) {
      console.error('Direct database test error:', error);
    }
  };

  const populateRedisCache = async () => {
    try {
      console.log('Populating Redis cache for all users...');
      
      // Get all users first
      const { data: userData, error } = await supabase.functions.invoke('redis-admin', {
        body: { dataType: 'users', invalidate: true }
      });
      
      if (error || !userData?.data) {
        console.error('Failed to get users for cache population:', error);
        return;
      }
      
      const users = userData.data;
      console.log(`Found ${users.length} users to cache`);
      
      // Cache achievements for each user
      let cachedCount = 0;
      for (const user of users.slice(0, 50)) { // Start with first 50 users
        try {
          // Cache achievements
          await supabase.functions.invoke('redis-achievements', {
            body: { userId: user.id, invalidate: true }
          });
          
          // Cache milestones
          await supabase.functions.invoke('redis', {
            body: { userId: user.id, invalidate: true }
          });
          
          cachedCount++;
          if (cachedCount % 10 === 0) {
            console.log(`Cached ${cachedCount}/${users.length} users...`);
          }
        } catch (userError) {
          console.error(`Failed to cache user ${user.id}:`, userError);
        }
      }
      
      console.log(`Successfully cached data for ${cachedCount} users`);
      
      // Test the cache after population
      await testRedisCache();
      
    } catch (error) {
      console.error('Error populating Redis cache:', error);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto w-full p-8">
        <div className="mb-6">
          <h1 className="text-4xl font-extrabold mb-2">Admin Dashboard</h1>
          <p className="text-lg text-muted-foreground">
            Monitor your application's user activity and Redis cache status
          </p>
        </div>

        <div className="flex gap-4 mb-6">
          <Button onClick={fetchAdminData} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
          <Button onClick={testRedisCache} variant="outline">
            Test Redis Cache
          </Button>
          <Button onClick={testServiceRole} variant="outline">
            Test Service Role
          </Button>
          <Button onClick={investigateUsers} variant="outline">
            Investigate Users
          </Button>
          {/* <Button onClick={checkProfilesTable} variant="outline">
            Check Profiles
          </Button> */}
          {/* <Button onClick={testServiceRoleKey} variant="outline">
            Test Service Key
          </Button> */}
          <Button onClick={testDirectDatabase} variant="outline">
            Test Direct DB
          </Button>
          <Button onClick={populateRedisCache} variant="outline">
            Populate Redis Cache
          </Button>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{stats.totalUsers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats.activeUsers}</div>
                <p className="text-sm text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Milestones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{stats.totalMilestones}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Gambles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">{stats.totalGambles}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Recent Users</CardTitle>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {loading ? 'Loading users...' : 'No users found'}
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{user.email}</div>
                      <div className="text-sm text-muted-foreground">
                        Created: {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        {user.last_sign_in_at 
                          ? `Last active: ${new Date(user.last_sign_in_at).toLocaleDateString()}`
                          : 'Never signed in'
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {redisTest && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-xl">Redis Cache Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {redisTest.map((result, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="font-medium mb-2">{result.email}</div>
                    <div className="text-sm space-y-1">
                      <div>User ID: {result.userId}</div>
                      {result.error ? (
                        <div className="text-red-600">Error: {result.error}</div>
                      ) : (
                        <>
                          <div>Achievements: {result.achievements?.data ? '✅ Cached' : '❌ Not cached'}</div>
                          <div>Milestones: {result.milestones?.data ? '✅ Cached' : '❌ Not cached'}</div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Redis Cache Status</h3>
          <p className="text-yellow-700 text-sm">
            Redis cache entries expire after 2 hours and are only created when users access the app. 
            Use "Populate Redis Cache" to pre-cache data for all users, or "Test Redis Cache" to check current cache status.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminPage; 