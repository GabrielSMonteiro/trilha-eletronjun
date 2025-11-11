import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserAnalytics {
  lessons_completed: number;
  total_study_minutes: number;
  avg_score: number;
  total_sessions: number;
  current_streak: number;
  current_level: number;
  total_xp: number;
}

interface CategoryAnalytics {
  category_id: string;
  category_name: string;
  total_lessons: number;
  unique_students: number;
  total_completions: number;
  avg_score: number;
  total_study_minutes: number;
}

interface StudySession {
  id: string;
  created_at: string;
  duration_minutes: number;
  completed: boolean;
}

export const useAnalytics = (userId: string | undefined) => {
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);
  const [categoryAnalytics, setCategoryAnalytics] = useState<CategoryAnalytics[]>([]);
  const [recentSessions, setRecentSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    if (!userId) return;

    try {
      // Load user analytics
      const { data: userData, error: userError } = await supabase
        .from('user_analytics')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        console.error('Error loading user analytics:', userError);
      } else if (userData) {
        setUserAnalytics(userData);
      }

      // Load category analytics
      const { data: categoryData, error: categoryError } = await supabase
        .from('category_analytics')
        .select('*');

      if (categoryError) {
        console.error('Error loading category analytics:', categoryError);
      } else {
        setCategoryAnalytics(categoryData || []);
      }

      // Load recent study sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('study_sessions')
        .select('id, created_at, duration_minutes, completed')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (sessionsError) {
        console.error('Error loading sessions:', sessionsError);
      } else {
        setRecentSessions(sessionsData || []);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const startSession = useCallback(async (lessonId?: string, categoryId?: string) => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .insert({
          user_id: userId,
          lesson_id: lessonId,
          category_id: categoryId,
          duration_minutes: 0,
          completed: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error starting session:', error);
      return null;
    }
  }, [userId]);

  const endSession = useCallback(async (sessionId: string, durationMinutes: number) => {
    try {
      const { error } = await supabase
        .from('study_sessions')
        .update({
          duration_minutes: durationMinutes,
          completed: true,
          ended_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (error) throw error;
      await loadAnalytics();
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }, [loadAnalytics]);

  return {
    userAnalytics,
    categoryAnalytics,
    recentSessions,
    loading,
    startSession,
    endSession,
    reloadAnalytics: loadAnalytics,
  };
};
