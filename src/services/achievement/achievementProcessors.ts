import { Achievement, AchievementMetrics, AchievementDifficulty } from '@/types/achievement';
import { supabase } from '@/integrations/supabase/client';
import { calculateAchievementProgress } from '@/utils/achievement/achievementTracker';
import { NEW_ACHIEVEMENTS } from '@/data/newAchievements';
import { Json } from '@/types/supabase';
import { userStorage } from '@/utils/userStorage';
import { getMilestones } from '@/lib/milestones';
import { getAchievements } from '@/lib/achievements';

// Centralized error handling for achievement processors
const handleProcessorError = (processorName: string, error: unknown) => {
  console.error(`Error in ${processorName}:`, error);
};

/**
 * Process the "First Steps" achievement (Canvas connection)
 */
export async function processFirstStepsAchievement(
  userId: string, 
  metrics: AchievementMetrics,
  updateAchievement: (achievementId: string, updates: Partial<Achievement>) => Promise<void>,
  addAchievement: (userId: string, achievement: Achievement) => Promise<void>
): Promise<void> {
  try {
    // Check if the First Steps achievement already exists using the new helper
    const achievements = await getAchievements(userId);
    const existingAchievement = achievements.find(a => a.title === 'First Steps');
    
    // Get the canvas sync count from metrics
    const canvasSyncCount = metrics.canvasSyncCount || 0;
    const hasRequiredCount = canvasSyncCount >= 1;
    
    console.log(`Canvas sync status for user ${userId}: ${canvasSyncCount} syncs (${hasRequiredCount ? '100' : '0'}%)`);
    
    if (!existingAchievement) {
      // Add the First Steps achievement if it doesn't exist
      const achievement = NEW_ACHIEVEMENTS.find(a => a.title === 'First Steps');
      if (achievement) {
        await addAchievement(userId, achievement);
        console.log('Added First Steps achievement');
        
        // If user already has canvas syncs, update the progress immediately
        if (canvasSyncCount > 0) {
          // Get the newly added achievement
          const { data: addedAchievement } = await supabase
            .from('achievements')
            .select('id')
            .eq('user_id', userId)
            .eq('title', 'First Steps')
            .maybeSingle();
            
          if (addedAchievement) {
            // First Steps is binary - either 0% or 100%
            const progress = hasRequiredCount ? 100 : 0;
            
            await updateAchievement(addedAchievement.id, {
              progress,
              unlocked: hasRequiredCount,
              points: 10 // Ensure it has the correct point value
            });
            console.log(`First Steps achievement initialized with ${progress}% progress`);
          }
        }
      }
    } else if (hasRequiredCount && (!existingAchievement.unlocked || existingAchievement.progress < 100)) {
      // If the achievement exists but is not unlocked and the user has canvas syncs, unlock it
      await updateAchievement(existingAchievement.id, {
        progress: 100,
        unlocked: true
      });
      console.log('First Steps achievement updated to unlocked');
    } else if (existingAchievement.points !== 10) {
      // Ensure it has the correct point value (10 for Easy achievement)
      await updateAchievement(existingAchievement.id, {
        points: 10
      });
      console.log(`First Steps achievement points corrected from ${existingAchievement.points} to 10`);
    }
  } catch (error) {
    handleProcessorError('processFirstStepsAchievement', error);
  }
}

/**
 * Process the "5 Guys" achievement (Assignment completion)
 */
export async function process5GuysAchievement(
  userId: string, 
  metrics: AchievementMetrics,
  updateAchievement: (achievementId: string, updates: Partial<Achievement>) => Promise<void>,
  addAchievement: (userId: string, achievement: Achievement) => Promise<void>
): Promise<void> {
  try {
    console.log('Processing 5 Guys achievement for user:', userId);
    console.log('Current metrics:', metrics);
    
    // Check if the 5 Guys achievement already exists using the new helper
    const achievements = await getAchievements(userId);
    const existingAchievement = achievements.find(a => a.title === '5 Guys');
    
    // Get the assignment completion count from metrics
    const assignmentCompleteCount = metrics.assignmentCompleteCount || 0;
    const requiredCount = 5;
    const hasRequiredCount = assignmentCompleteCount >= requiredCount;
    
    console.log(`Assignment completion status: ${assignmentCompleteCount}/${requiredCount} assignments completed`);
    console.log('Existing achievement:', existingAchievement);
    
    if (!existingAchievement) {
      // Add the 5 Guys achievement if it doesn't exist
      const achievement = NEW_ACHIEVEMENTS.find(a => a.title === '5 Guys');
      if (achievement) {
        await addAchievement(userId, achievement);
        console.log('Added 5 Guys achievement');
        
        // If user already has completed assignments, update the progress immediately
        if (assignmentCompleteCount > 0) {
          // Get the newly added achievement
          const { data: addedAchievement } = await supabase
            .from('achievements')
            .select('id')
            .eq('user_id', userId)
            .eq('title', '5 Guys')
            .maybeSingle();
            
          if (addedAchievement) {
            // Calculate progress percentage
            const progress = Math.min(100, Math.round((assignmentCompleteCount / requiredCount) * 100));
            const unlocked = progress >= 100;
            
            await updateAchievement(addedAchievement.id, {
              progress,
              unlocked
            });
            console.log(`5 Guys achievement initialized with ${progress}% progress`);
          }
        }
      }
    } else if (hasRequiredCount && (!existingAchievement.unlocked || existingAchievement.progress < 100)) {
      // If the achievement exists but is not unlocked and the user has completed enough assignments, unlock it
      await updateAchievement(existingAchievement.id, {
        progress: 100,
        unlocked: true
      });
      console.log(`5 Guys achievement updated to unlocked for user with ${assignmentCompleteCount} completed assignments`);
    } else if (!hasRequiredCount) {
      // Update the progress for the achievement based on assignment count
      const progress = Math.min(100, Math.round((assignmentCompleteCount / requiredCount) * 100));
      if (progress !== existingAchievement.progress) {
        await updateAchievement(existingAchievement.id, {
          progress
        });
        console.log(`5 Guys achievement progress updated to ${progress}%`);
      }
    }
  } catch (error) {
    handleProcessorError('process5GuysAchievement', error);
  }
}

/**
 * Process the "35 Guys" achievement (Assignment completion - medium difficulty)
 */
export async function process35GuysAchievement(
  userId: string, 
  metrics: AchievementMetrics,
  updateAchievement: (achievementId: string, updates: Partial<Achievement>) => Promise<void>,
  addAchievement: (userId: string, achievement: Achievement) => Promise<void>
): Promise<void> {
  try {
    // Check if the 35 Guys achievement already exists using the new helper
    const achievements = await getAchievements(userId);
    const existingAchievement = achievements.find(a => a.title === '35 Guys');
    
    // Get the assignment completion count from metrics
    const assignmentCompleteCount = metrics.assignmentCompleteCount || 0;
    const requiredCount = 35;
    const hasRequiredCount = assignmentCompleteCount >= requiredCount;
    
    console.log(`Assignment completion status for user ${userId}: ${assignmentCompleteCount}/${requiredCount} assignments completed (${Math.min(100, Math.round((assignmentCompleteCount / requiredCount) * 100))}%)`);
    
    if (!existingAchievement) {
      // Add the 35 Guys achievement if it doesn't exist
      const achievement = NEW_ACHIEVEMENTS.find(a => a.title === '35 Guys');
      if (achievement) {
        await addAchievement(userId, achievement);
        console.log('Added 35 Guys achievement');
        
        // If user already has completed assignments, update the progress immediately
        if (assignmentCompleteCount > 0) {
          // Get the newly added achievement
          const { data: addedAchievement } = await supabase
            .from('achievements')
            .select('id')
            .eq('user_id', userId)
            .eq('title', '35 Guys')
            .maybeSingle();
            
          if (addedAchievement) {
            // Calculate progress percentage
            const progress = Math.min(100, Math.round((assignmentCompleteCount / requiredCount) * 100));
            const unlocked = progress >= 100;
            
            await updateAchievement(addedAchievement.id, {
              progress,
              unlocked
            });
            console.log(`35 Guys achievement initialized with ${progress}% progress`);
          }
        }
      }
    } else if (hasRequiredCount && (!existingAchievement.unlocked || existingAchievement.progress < 100)) {
      // If the achievement exists but is not unlocked and the user has completed enough assignments, unlock it
      await updateAchievement(existingAchievement.id, {
        progress: 100,
        unlocked: true
      });
      console.log(`35 Guys achievement updated to unlocked for user with ${assignmentCompleteCount} completed assignments`);
    } else if (!hasRequiredCount) {
      // Update the progress for the achievement based on assignment count
      const progress = Math.min(100, Math.round((assignmentCompleteCount / requiredCount) * 100));
      if (progress !== existingAchievement.progress) {
        await updateAchievement(existingAchievement.id, {
          progress
        });
        console.log(`35 Guys achievement progress updated to ${progress}%`);
      }
    }
  } catch (error) {
    handleProcessorError('process35GuysAchievement', error);
  }
}

/**
 * Process the "65 Guys" achievement (Assignment completion - hard difficulty)
 */
export async function process65GuysAchievement(
  userId: string, 
  metrics: AchievementMetrics,
  updateAchievement: (achievementId: string, updates: Partial<Achievement>) => Promise<void>,
  addAchievement: (userId: string, achievement: Achievement) => Promise<void>
): Promise<void> {
  try {
    // Check if the 65 Guys achievement already exists using the new helper
    const achievements = await getAchievements(userId);
    const existingAchievement = achievements.find(a => a.title === '65 Guys');
    
    // Get the assignment completion count from metrics
    const assignmentCompleteCount = metrics.assignmentCompleteCount || 0;
    const requiredCount = 65;
    const hasRequiredCount = assignmentCompleteCount >= requiredCount;
    
    console.log(`Assignment completion status for user ${userId}: ${assignmentCompleteCount}/${requiredCount} assignments completed (${Math.min(100, Math.round((assignmentCompleteCount / requiredCount) * 100))}%)`);
    
    if (!existingAchievement) {
      // Add the 65 Guys achievement if it doesn't exist
      const achievement = NEW_ACHIEVEMENTS.find(a => a.title === '65 Guys');
      if (achievement) {
        await addAchievement(userId, achievement);
        console.log('Added 65 Guys achievement');
        
        // If user already has completed assignments, update the progress immediately
        if (assignmentCompleteCount > 0) {
          // Get the newly added achievement
          const { data: addedAchievement } = await supabase
            .from('achievements')
            .select('id')
            .eq('user_id', userId)
            .eq('title', '65 Guys')
            .maybeSingle();
            
          if (addedAchievement) {
            // Calculate progress percentage
            const progress = Math.min(100, Math.round((assignmentCompleteCount / requiredCount) * 100));
            const unlocked = progress >= 100;
            
            await updateAchievement(addedAchievement.id, {
              progress,
              unlocked
            });
            console.log(`65 Guys achievement initialized with ${progress}% progress`);
          }
        }
      }
    } else if (hasRequiredCount && (!existingAchievement.unlocked || existingAchievement.progress < 100)) {
      // If the achievement exists but is not unlocked and the user has completed enough assignments, unlock it
      await updateAchievement(existingAchievement.id, {
        progress: 100,
        unlocked: true
      });
      console.log(`65 Guys achievement updated to unlocked for user with ${assignmentCompleteCount} completed assignments`);
    } else if (!hasRequiredCount) {
      // Update the progress for the achievement based on assignment count
      const progress = Math.min(100, Math.round((assignmentCompleteCount / requiredCount) * 100));
      if (progress !== existingAchievement.progress) {
        await updateAchievement(existingAchievement.id, {
          progress
        });
        console.log(`65 Guys achievement progress updated to ${progress}%`);
      }
    }
  } catch (error) {
    handleProcessorError('process65GuysAchievement', error);
  }
}

/**
 * Process the "Good Looks" achievement (Profile picture)
 * Enhanced to properly check for profile picture and handle the cases correctly
 */
export async function processGoodLooksAchievement(
  userId: string, 
  metrics: AchievementMetrics,
  updateAchievement: (achievementId: string, updates: Partial<Achievement>) => Promise<void>,
  addAchievement: (userId: string, achievement: Achievement) => Promise<void>
): Promise<void> {
  try {
    // Check if the Good Looks achievement already exists using the new helper
    const achievements = await getAchievements(userId);
    const existingAchievement = achievements.find(a => a.title === 'Good Looks');
      
    // Get profile data to check if user has a custom avatar
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .maybeSingle();
    
    // Check if user has a profile picture from metrics or from database
    const hasProfilePictureFromMetrics = metrics.hasProfilePicture || false;
    const hasProfilePictureFromDB = profile && profile.avatar_url ? true : false;
    const hasProfilePicture = hasProfilePictureFromMetrics || hasProfilePictureFromDB;

    if (existingAchievement) {
      if (hasProfilePicture) {
        if (!existingAchievement.unlocked) {
          await updateAchievement(existingAchievement.id, {
            progress:  100,
            unlocked:  true,
          });
          console.log('Good Looks → unlocked');
        }
      } else {
        // user removed pic
        if (existingAchievement.unlocked || existingAchievement.progress > 0) {
          await updateAchievement(existingAchievement.id, {
            progress:  0,
            unlocked:  false,
          });
          console.log('Good Looks → rolled back to 0%');
        }
      }
      return;
    }
    
    console.log(`Profile picture status for user ${userId}: 
      - From metrics: ${hasProfilePictureFromMetrics ? 'Yes' : 'No'}
      - From database: ${hasProfilePictureFromDB ? 'Yes' : 'No'} (${profile?.avatar_url || 'none'})
      - Combined: ${hasProfilePicture ? 'Has profile picture' : 'No profile picture'}`);
    
    // If the user has a profile picture, update the local storage to reflect that
    if (hasProfilePicture) {
      userStorage.set(userId, 'hasProfilePicture', 'true');
    }
    
    if (!existingAchievement) {
      // Add the Good Looks achievement if it doesn't exist
      const achievement = NEW_ACHIEVEMENTS.find(a => a.title === 'Good Looks');
      if (achievement) {
        await addAchievement(userId, achievement);
        console.log('Added Good Looks achievement');
        
        // If user already has a profile picture, immediately unlock the achievement
        if (hasProfilePicture) {
          // Get the newly added achievement
          const { data: addedAchievement } = await supabase
            .from('achievements')
            .select('id')
            .eq('user_id', userId)
            .eq('title', 'Good Looks')
            .maybeSingle();
            
          if (addedAchievement) {
            await updateAchievement(addedAchievement.id, {
              progress: 100,
              unlocked: true
            });
            console.log('Good Looks achievement auto-unlocked for user with existing profile picture');
          }
        }
      }
    } else if (hasProfilePicture && (!existingAchievement.unlocked || existingAchievement.progress < 100)) {
      // If the achievement exists but is not unlocked and the user has a profile picture, unlock it
      await updateAchievement(existingAchievement.id, {
        progress: 100,
        unlocked: true
      });
      console.log('Good Looks achievement updated to unlocked for user with profile picture');
    } else if (!hasProfilePicture && existingAchievement.progress > 0) {
      // Reset progress if user removed profile picture
      await updateAchievement(existingAchievement.id, {
        progress: 0,
        unlocked: false
      });
      console.log('Good Looks achievement progress reset for user without profile picture');
    }
  } catch (error) {
    handleProcessorError('processGoodLooksAchievement', error);
  }
}

/**
 * Process the "Ace" achievement (Perfect grades)
 * Improved to ensure it correctly tracks and awards progress
 */
export async function processAceAchievement(
  userId: string, 
  metrics: AchievementMetrics,
  updateAchievement: (achievementId: string, updates: Partial<Achievement>) => Promise<void>,
  addAchievement: (userId: string, achievement: Achievement) => Promise<void>
): Promise<void> {
  try {
    // Check if the Ace achievement already exists using the new helper
    const achievements = await getAchievements(userId);
    const existingAchievement = achievements.find(a => a.title === 'Ace');
    
    // Get the perfect grade count from metrics
    let perfectGradeCount = metrics.perfectGradeCount || 0;
    
    // Additional check from database to count assignments with 100% grade
    const completedAssignments = await getMilestones(undefined, { userId, status: 'completed' });
    const perfectAssignments = await getMilestones(undefined, { userId, grade: 100 });
    
    // If we have assignments with 100% grade from the database, use that count if it's higher
    if (perfectAssignments && perfectAssignments.length > perfectGradeCount) {
      perfectGradeCount = perfectAssignments.length;
      // Update local storage with the more accurate count
      userStorage.setNumber(userId, 'perfectGradeCount', perfectGradeCount);
    }
    
    const requiredCount = 15;
    const hasRequiredCount = perfectGradeCount >= requiredCount;
    // console.log("local storage after ace achievement:", { ...localStorage });
    console.log(`Perfect grade status for user ${userId}: ${perfectGradeCount}/${requiredCount} assignments with 100% grade (${Math.min(100, Math.round((perfectGradeCount / requiredCount) * 100))}%)`);
    
    if (!existingAchievement) {
      // Add the Ace achievement if it doesn't exist
      const achievement = NEW_ACHIEVEMENTS.find(a => a.title === 'Ace');
      if (achievement) {
        await addAchievement(userId, achievement);
        console.log('Added Ace achievement');
        
        // If user already has some perfect grades, update the progress immediately
        if (perfectGradeCount > 0) {
          // Get the newly added achievement
          const { data: addedAchievement } = await supabase
            .from('achievements')
            .select('id')
            .eq('user_id', userId)
            .eq('title', 'Ace')
            .maybeSingle();
            
          if (addedAchievement) {
            // Calculate progress percentage
            const progress = Math.min(100, Math.round((perfectGradeCount / requiredCount) * 100));
            const unlocked = progress >= 100;
            
            await updateAchievement(addedAchievement.id, {
              progress,
              unlocked
            });
            console.log(`Ace achievement initialized with ${progress}% progress`);
          }
        }
      }
    } else if (hasRequiredCount && (!existingAchievement.unlocked || existingAchievement.progress < 100)) {
      // If the achievement exists but is not unlocked and the user has the required perfect grades, unlock it
      await updateAchievement(existingAchievement.id, {
        progress: 100,
        unlocked: true
      });
      console.log(`Ace achievement updated to unlocked for user with ${requiredCount} perfect grades`);
    } else if (!hasRequiredCount) {
      // Update the progress for the achievement based on perfect grades
      const progress = Math.min(100, Math.round((perfectGradeCount / requiredCount) * 100));
      if (progress !== existingAchievement.progress) {
        await updateAchievement(existingAchievement.id, {
          progress
        });
        console.log(`Ace achievement progress updated to ${progress}%`);
      }
    }
  } catch (error) {
    handleProcessorError('processAceAchievement', error);
  }
}

/**
 * Process the "Getting There" achievement (Course grades)
 */
export async function processGettingThereAchievement(
  userId: string, 
  metrics: AchievementMetrics,
  updateAchievement: (achievementId: string, updates: Partial<Achievement>) => Promise<void>,
  addAchievement: (userId: string, achievement: Achievement) => Promise<void>
): Promise<void> {
  try {
    // Check if the Getting There achievement already exists using the new helper
    const achievements = await getAchievements(userId);
    const existingAchievement = achievements.find(a => a.title === 'Getting There');
    
    // Count courses with grades above threshold directly from database
    const threshold = 90; // 90% threshold as specified
    const { data: coursesAboveThreshold } = await supabase
      .from('courses')
      .select('id')
      .eq('user_id', userId)
      .gte('grade', threshold);
    
    const coursesAboveThresholdCount = coursesAboveThreshold ? coursesAboveThreshold.length : 0;
    
    // Get the course grade metrics from passed metrics
    const courseGradesAbove = metrics.courseGradesAbove || {};
    const metricsCoursesAboveThreshold = courseGradesAbove[threshold] || 0;
    
    // Use the higher count between metrics and database query
    const coursesAboveThresholdFinal = Math.max(coursesAboveThresholdCount, metricsCoursesAboveThreshold);
    
    const requiredCount = 1;
    const hasRequiredCount = coursesAboveThresholdFinal >= requiredCount;
    
    console.log(`Course grade status for user ${userId}: ${coursesAboveThresholdFinal}/${requiredCount} courses with grades above ${threshold}% (${hasRequiredCount ? '100' : '0'}%)`);
    
    if (!existingAchievement) {
      // Add the Getting There achievement if it doesn't exist
      const achievement = NEW_ACHIEVEMENTS.find(a => a.title === 'Getting There');
      if (achievement) {
        await addAchievement(userId, achievement);
        console.log('Added Getting There achievement');
        
        // If user already has courses with grades above threshold, update the progress immediately
        if (coursesAboveThresholdFinal > 0) {
          // Get the newly added achievement
          const { data: addedAchievement } = await supabase
            .from('achievements')
            .select('id')
            .eq('user_id', userId)
            .eq('title', 'Getting There')
            .maybeSingle();
            
          if (addedAchievement) {
            // Calculate progress - for this one it's binary (0% or 100%)
            const progress = hasRequiredCount ? 100 : 0;
            
            await updateAchievement(addedAchievement.id, {
              progress,
              unlocked: hasRequiredCount
            });
            console.log(`Getting There achievement initialized with ${progress}% progress`);
          }
        }
      }
    } else if (hasRequiredCount && (!existingAchievement.unlocked || existingAchievement.progress < 100)) {
      // If the achievement exists but is not unlocked and the user has courses above threshold, unlock it
      await updateAchievement(existingAchievement.id, {
        progress: 100,
        unlocked: true
      });
      console.log(`Getting There achievement updated to unlocked for user with ${coursesAboveThresholdFinal} courses above ${threshold}%`);
    } else if (!hasRequiredCount && existingAchievement.progress > 0) {
      // Reset progress if user no longer has courses above threshold
      await updateAchievement(existingAchievement.id, {
        progress: 0,
        unlocked: false
      });
      console.log(`Getting There achievement progress reset for user with no courses above ${threshold}%`);
    }
  } catch (error) {
    handleProcessorError('processGettingThereAchievement', error);
  }
}

/**
 * Process the "Getting Closer" achievement (3 courses with grades above 90%)
 */
export async function processGettingCloserAchievement(
  userId: string, 
  metrics: AchievementMetrics,
  updateAchievement: (achievementId: string, updates: Partial<Achievement>) => Promise<void>,
  addAchievement: (userId: string, achievement: Achievement) => Promise<void>
): Promise<void> {
  try {
    // Check if the Getting Closer achievement already exists using the new helper
    const achievements = await getAchievements(userId);
    const existingAchievement = achievements.find(a => a.title === 'Getting Closer');
    
    // Count courses with grades above threshold directly from database
    const threshold = 90; // 90% threshold as specified
    const { data: coursesAboveThreshold } = await supabase
      .from('courses')
      .select('id')
      .eq('user_id', userId)
      .gte('grade', threshold);
    
    const coursesAboveThresholdCount = coursesAboveThreshold ? coursesAboveThreshold.length : 0;
    
    // Get the course grade metrics from passed metrics
    const courseGradesAbove = metrics.courseGradesAbove || {};
    const metricsCoursesAboveThreshold = courseGradesAbove[threshold] || 0;
    
    // Use the higher count between metrics and database query
    const coursesAboveThresholdFinal = Math.max(coursesAboveThresholdCount, metricsCoursesAboveThreshold);
    
    const requiredCount = 3;
    const hasRequiredCount = coursesAboveThresholdFinal >= requiredCount;
    
    console.log(`Course grade status for user ${userId}: ${coursesAboveThresholdFinal}/${requiredCount} courses with grades above ${threshold}% (${Math.min(100, Math.round((coursesAboveThresholdFinal / requiredCount) * 100))}%)`);
    
    if (!existingAchievement) {
      // Add the Getting Closer achievement if it doesn't exist
      const achievement = NEW_ACHIEVEMENTS.find(a => a.title === 'Getting Closer');
      if (achievement) {
        await addAchievement(userId, achievement);
        console.log('Added Getting Closer achievement');
        
        // If user already has courses with grades above threshold, update the progress immediately
        if (coursesAboveThresholdFinal > 0) {
          // Get the newly added achievement
          const { data: addedAchievement } = await supabase
            .from('achievements')
            .select('id')
            .eq('user_id', userId)
            .eq('title', 'Getting Closer')
            .maybeSingle();
            
          if (addedAchievement) {
            // Calculate progress
            const progress = Math.min(100, Math.round((coursesAboveThresholdFinal / requiredCount) * 100));
            const unlocked = progress >= 100;
            
            await updateAchievement(addedAchievement.id, {
              progress,
              unlocked
            });
            console.log(`Getting Closer achievement initialized with ${progress}% progress`);
          }
        }
      }
    } else if (hasRequiredCount && (!existingAchievement.unlocked || existingAchievement.progress < 100)) {
      // If the achievement exists but is not unlocked and the user has enough courses above threshold, unlock it
      await updateAchievement(existingAchievement.id, {
        progress: 100,
        unlocked: true
      });
      console.log(`Getting Closer achievement updated to unlocked for user with ${coursesAboveThresholdFinal} courses above ${threshold}%`);
    } else if (!hasRequiredCount) {
      // Update progress based on current count
      const progress = Math.min(100, Math.round((coursesAboveThresholdFinal / requiredCount) * 100));
      if (progress !== existingAchievement.progress) {
        await updateAchievement(existingAchievement.id, {
          progress
        });
        console.log(`Getting Closer achievement progress updated to ${progress}%`);
      }
    }
  } catch (error) {
    handleProcessorError('processGettingCloserAchievement', error);
  }
}

/**
 * Process the "Got There" achievement (5 courses with grades above 90%)
 */
export async function processGotThereAchievement(
  userId: string, 
  metrics: AchievementMetrics,
  updateAchievement: (achievementId: string, updates: Partial<Achievement>) => Promise<void>,
  addAchievement: (userId: string, achievement: Achievement) => Promise<void>
): Promise<void> {
  try {
    // Check if the Got There achievement already exists using the new helper
    const achievements = await getAchievements(userId);
    const existingAchievement = achievements.find(a => a.title === 'Got There');
    
    // Count courses with grades above threshold directly from database
    const threshold = 90; // 90% threshold as specified
    const { data: coursesAboveThreshold } = await supabase
      .from('courses')
      .select('id')
      .eq('user_id', userId)
      .gte('grade', threshold);
    
    const coursesAboveThresholdCount = coursesAboveThreshold ? coursesAboveThreshold.length : 0;
    
    // Get the course grade metrics from passed metrics
    const courseGradesAbove = metrics.courseGradesAbove || {};
    const metricsCoursesAboveThreshold = courseGradesAbove[threshold] || 0;
    
    // Use the higher count between metrics and database query
    const coursesAboveThresholdFinal = Math.max(coursesAboveThresholdCount, metricsCoursesAboveThreshold);
    
    const requiredCount = 5;
    const hasRequiredCount = coursesAboveThresholdFinal >= requiredCount;
    
    console.log(`Course grade status for user ${userId}: ${coursesAboveThresholdFinal}/${requiredCount} courses with grades above ${threshold}% (${Math.min(100, Math.round((coursesAboveThresholdFinal / requiredCount) * 100))}%)`);
    
    if (!existingAchievement) {
      // Add the Got There achievement if it doesn't exist
      const achievement = NEW_ACHIEVEMENTS.find(a => a.title === 'Got There');
      if (achievement) {
        await addAchievement(userId, achievement);
        console.log('Added Got There achievement');
        
        // If user already has courses with grades above threshold, update the progress immediately
        if (coursesAboveThresholdFinal > 0) {
          // Get the newly added achievement
          const { data: addedAchievement } = await supabase
            .from('achievements')
            .select('id')
            .eq('user_id', userId)
            .eq('title', 'Got There')
            .maybeSingle();
            
          if (addedAchievement) {
            // Calculate progress
            const progress = Math.min(100, Math.round((coursesAboveThresholdFinal / requiredCount) * 100));
            const unlocked = progress >= 100;
            
            await updateAchievement(addedAchievement.id, {
              progress,
              unlocked
            });
            console.log(`Got There achievement initialized with ${progress}% progress`);
          }
        }
      }
    } else if (hasRequiredCount && (!existingAchievement.unlocked || existingAchievement.progress < 100)) {
      // If the achievement exists but is not unlocked and the user has enough courses above threshold, unlock it
      await updateAchievement(existingAchievement.id, {
        progress: 100,
        unlocked: true
      });
      console.log(`Got There achievement updated to unlocked for user with ${coursesAboveThresholdFinal} courses above ${threshold}%`);
    } else if (!hasRequiredCount) {
      // Update progress based on current count
      const progress = Math.min(100, Math.round((coursesAboveThresholdFinal / requiredCount) * 100));
      if (progress !== existingAchievement.progress) {
        await updateAchievement(existingAchievement.id, {
          progress
        });
        console.log(`Got There achievement progress updated to ${progress}%`);
      }
    }
  } catch (error) {
    handleProcessorError('processGotThereAchievement', error);
  }
}

/**
 * Process the Day N Nite achievement
 */
export async function processDayNNiteAchievement(
  userId: string,
  metrics: AchievementMetrics,
  updateAchievement: (id: string, up: Partial<Achievement>) => Promise<void>,
  addAchievement: (userId: string, achievement: Achievement) => Promise<void>
) {
  try {
    // Check if the Day N Nite achievement already exists using the new helper
    const achievements = await getAchievements(userId);
    const existing = achievements.find(a => a.title === 'Day N Nite');
    
    if (existing?.unlocked) return;

    const shouldUnlock = metrics.prefersDarkMode;
    // if already unlocked, no-op
    if (existing?.unlocked) return;

    const tpl = NEW_ACHIEVEMENTS.find(a => a.title === 'Day N Nite')!;
    const dbRow = {
      ...tpl,
      user_id: userId,
      progress: shouldUnlock ? 100 : 0,
      unlocked: shouldUnlock,
    };

    if (!existing) {
      await addAchievement(userId, dbRow);
      console.log('Day N Nite added & unlocked');
    } else if (shouldUnlock) {
      await updateAchievement(existing.id, { progress: 100, unlocked: true });
      console.log('Day N Nite unlocked');
    }
  } catch (e) {
    console.error('Error in Day N Nite processor', e);
  }
}
