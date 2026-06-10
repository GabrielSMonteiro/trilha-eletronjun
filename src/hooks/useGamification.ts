import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import confetti from 'canvas-confetti';


let notificationCallback: ((notification: {
  title: string;
  description: string;
  type: 'info' | 'success' | 'warning' | 'system' | 'achievement';
  icon?: string;
}) => void) | null = null;

export const setGamificationNotificationCallback = (
  callback: typeof notificationCallback
) => {
  notificationCallback = callback;
};

const notify = (notification: {
  title: string;
  description: string;
  type: 'info' | 'success' | 'warning' | 'system' | 'achievement';
  icon?: string;
}) => {
  if (notificationCallback) {
    notificationCallback(notification);
  }
};

interface GamificationData {
  total_xp: number;
  current_level: number;
  total_points: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  badge_type: 'bronze' | 'silver' | 'gold' | 'special';
  icon_name: string;
  requirement_type: string;
  requirement_value: number;
}

export const useGamification = (userId: string | undefined) => {
  const [gamificationData, setGamificationData] = useState<GamificationData | null>(null);
  const [userBadges, setUserBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGamificationData = useCallback(async () => {
    if (!userId) return;

    try {
      
      const { data: gamData, error: gamError } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      let currentData = gamData;
      if (!currentData) {
        
        const { data: newGamData, error: createError } = await supabase
          .from('user_gamification')
          .insert({ user_id: userId })
          .select()
          .single();

        if (createError) throw createError;
        currentData = newGamData;
      } else if (gamError) {
        throw gamError;
      }

      setGamificationData(currentData as GamificationData);

      
      const { data: badgesData, error: badgesError } = await supabase
        .from('user_badges')
        .select(`
          badge_id,
          badges (
            id,
            name,
            description,
            badge_type,
            icon_name,
            requirement_type,
            requirement_value
          )
        `)
        .eq('user_id', userId);

      if (badgesError) throw badgesError;

      const badges = badgesData
        .map((ub: { badges: Badge }) => ub.badges)
        .filter(Boolean) as Badge[];
      
      setUserBadges(badges);
    } catch (error) {
      console.error('Error loading gamification data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadGamificationData();
  }, [loadGamificationData]);

  const awardXP = useCallback(async (
    amount: number,
    reason: string,
    lessonId?: string
  ) => {
    if (!userId || !gamificationData) return;

    try {
      const newTotalXP = gamificationData.total_xp + amount;
      const newLevel = Math.floor(Math.sqrt(newTotalXP / 100)) + 1;
      const leveledUp = newLevel > gamificationData.current_level;

      
      const { error: updateError } = await supabase
        .from('user_gamification')
        .update({
          total_xp: newTotalXP,
          current_level: newLevel,
          total_points: gamificationData.total_points + amount,
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      
      await supabase.from('xp_transactions').insert({
        user_id: userId,
        amount,
        reason,
        lesson_id: lessonId,
      });

      setGamificationData({
        ...gamificationData,
        total_xp: newTotalXP,
        current_level: newLevel,
        total_points: gamificationData.total_points + amount,
      });

      
      notify({
        title: `+${amount} XP`,
        description: reason,
        type: 'success',
        icon: 'zap',
      });

      
      if (leveledUp) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FFA500', '#FF6347'],
        });

        notify({
          title: `🎉 Nível ${newLevel}!`,
          description: 'Você subiu de nível! Continue assim!',
          type: 'achievement',
          icon: 'star',
        });
      }

      
      await checkAndAwardBadges();
    } catch (error) {
      console.error('Error awarding XP:', error);
    }
  }, [userId, gamificationData, checkAndAwardBadges]);

  const updateStreak = useCallback(async () => {
    if (!userId || !gamificationData) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      const lastActivity = gamificationData.last_activity_date;

      let newStreak = gamificationData.current_streak;
      let newLongestStreak = gamificationData.longest_streak;

      if (!lastActivity) {
        
        newStreak = 1;
      } else {
        const lastDate = new Date(lastActivity);
        const todayDate = new Date(today);
        const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff === 0) {
          
          return;
        } else if (daysDiff === 1) {
          
          newStreak = gamificationData.current_streak + 1;
        } else {
          
          newStreak = 1;
        }
      }

      if (newStreak > gamificationData.longest_streak) {
        newLongestStreak = newStreak;
      }

      const { error } = await supabase
        .from('user_gamification')
        .update({
          current_streak: newStreak,
          longest_streak: newLongestStreak,
          last_activity_date: today,
        })
        .eq('user_id', userId);

      if (error) throw error;

      setGamificationData({
        ...gamificationData,
        current_streak: newStreak,
        longest_streak: newLongestStreak,
        last_activity_date: today,
      });

      
      if (newStreak > 1 && newStreak % 7 === 0) {
        await awardXP(50, `Bônus de ${newStreak} dias de sequência!`);
      }

      await checkAndAwardBadges();
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  }, [userId, gamificationData, awardXP, checkAndAwardBadges]);

  const checkAndAwardBadges = useCallback(async () => {
    if (!userId) return;

    try {
      
      const { data: allBadges, error: badgesError } = await supabase
        .from('badges')
        .select('*');

      if (badgesError) throw badgesError;

      
      const { count: lessonsCompleted } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .not('completed_at', 'is', null);

      
      const { count: perfectScores } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('score', 100);

      
      const { data: currentBadges } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', userId);

      const currentBadgeIds = new Set(currentBadges?.map(b => b.badge_id) || []);

      
      for (const badge of allBadges || []) {
        if (currentBadgeIds.has(badge.id)) continue;

        let earned = false;

        switch (badge.requirement_type) {
          case 'lessons_completed':
            earned = (lessonsCompleted || 0) >= badge.requirement_value;
            break;
          case 'streak_days':
            earned = (gamificationData?.current_streak || 0) >= badge.requirement_value;
            break;
          case 'perfect_scores':
            earned = (perfectScores || 0) >= badge.requirement_value;
            break;
        }

        if (earned) {
          
          await supabase.from('user_badges').insert({
            user_id: userId,
            badge_id: badge.id,
          });

          
          confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#FFD700', '#C0C0C0', '#CD7F32'],
          });

          notify({
            title: `🏆 Nova Conquista!`,
            description: `Você ganhou: ${badge.name}`,
            type: 'achievement',
            icon: 'trophy',
          });

          
          await awardXP(25, `Conquista desbloqueada: ${badge.name}`);

          
          await loadGamificationData();
        }
      }
    } catch (error) {
      console.error('Error checking badges:', error);
    }
  }, [userId, gamificationData, awardXP, loadGamificationData]);

  return {
    gamificationData,
    userBadges,
    loading,
    awardXP,
    updateStreak,
    checkAndAwardBadges,
    reloadData: loadGamificationData,
  };
};
