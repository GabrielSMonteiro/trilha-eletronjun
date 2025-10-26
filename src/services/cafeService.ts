import { supabase } from '@/integrations/supabase/client';
import { PresetConfig, CafeSession } from '@/types/cafe';

export const cafeService = {
  async savePreset(preset: Omit<PresetConfig, 'id'>): Promise<PresetConfig | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('cafe_presets')
      .insert({
        user_id: user.id,
        preset_name: preset.name,
        preset_config: { soundLevels: preset.soundLevels, description: preset.description },
        is_default: false,
      })
      .select()
      .single();

    if (error) {
      if (import.meta.env?.DEV) console.error('Error saving preset:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.preset_name,
      soundLevels: data.preset_config.soundLevels,
      description: data.preset_config.description,
      isDefault: data.is_default,
      userId: data.user_id,
    };
  },

  async loadUserPresets(): Promise<PresetConfig[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('cafe_presets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      if (import.meta.env?.DEV) console.error('Error loading presets:', error);
      return [];
    }

    return data.map(preset => ({
      id: preset.id,
      name: preset.preset_name,
      soundLevels: preset.preset_config.soundLevels,
      description: preset.preset_config.description,
      isDefault: preset.is_default,
      userId: preset.user_id,
    }));
  },

  async deletePreset(presetId: string): Promise<boolean> {
    const { error } = await supabase
      .from('cafe_presets')
      .delete()
      .eq('id', presetId);

    if (error) {
      if (import.meta.env?.DEV) console.error('Error deleting preset:', error);
      return false;
    }

    return true;
  },

  async startSession(presetName?: string): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('cafe_sessions')
      .insert({
        user_id: user.id,
        duration_minutes: 0,
        preset_used: presetName,
        points_earned: 0,
      })
      .select()
      .single();

    if (error) {
      if (import.meta.env?.DEV) console.error('Error starting session:', error);
      return null;
    }

    return data.id;
  },

  async endSession(sessionId: string, durationMinutes: number): Promise<void> {
    const points = Math.floor(durationMinutes / 5);

    const { error } = await supabase
      .from('cafe_sessions')
      .update({
        duration_minutes: durationMinutes,
        points_earned: points,
      })
      .eq('id', sessionId);

    if (error && import.meta.env?.DEV) {
      console.error('Error ending session:', error);
    }
  },
};
