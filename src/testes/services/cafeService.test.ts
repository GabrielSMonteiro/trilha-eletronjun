import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cafeService } from '@/services/cafeService';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn()
    },
    from: vi.fn()
  }
}));

describe('cafeService', () => {
  const mockUser = { id: 'user1' };

  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });
  });

  const buildFromChain = (overrides: Record<string, any> = {}) => {
    const chain: any = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: 'session-id' }, error: null }),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      then: function(resolve: any) { resolve({ error: null }); },
      ...overrides,
    };
    (supabase.from as any).mockReturnValue(chain);
    return chain;
  };

  // ─── startSession ───────────────────────────────────────────────
  it('startSession cria uma nova sessão de estudo', async () => {
    buildFromChain({
      single: vi.fn().mockResolvedValue({ data: { id: 'session-id' }, error: null })
    });
    const sessionId = await cafeService.startSession('Preset Teste');
    expect(supabase.auth.getUser).toHaveBeenCalled();
    expect(supabase.from).toHaveBeenCalledWith('cafe_sessions');
    expect(sessionId).toBe('session-id');
  });

  it('startSession retorna null quando não há usuário', async () => {
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } });
    const sessionId = await cafeService.startSession();
    expect(sessionId).toBeNull();
  });

  it('startSession retorna null em caso de erro', async () => {
    buildFromChain({
      single: vi.fn().mockResolvedValue({ data: null, error: new Error('fail') })
    });
    const sessionId = await cafeService.startSession();
    expect(sessionId).toBeNull();
  });

  // ─── endSession ───────────────────────────────────────────────
  it('endSession finaliza uma sessão de estudo', async () => {
    buildFromChain();
    await cafeService.endSession('session-id', 45);
    expect(supabase.from).toHaveBeenCalledWith('cafe_sessions');
  });

  // ─── savePreset ───────────────────────────────────────────────
  it('savePreset salva e retorna um preset', async () => {
    const presetData = {
      id: 'preset-1',
      preset_name: 'Meu Preset',
      preset_config: { soundLevels: { chuva: 0.8 }, description: 'Desc' },
      is_default: false,
      user_id: 'user1',
    };
    buildFromChain({
      single: vi.fn().mockResolvedValue({ data: presetData, error: null })
    });

    const result = await cafeService.savePreset({
      name: 'Meu Preset',
      soundLevels: { chuva: 0.8 },
      description: 'Desc',
    });

    expect(result).not.toBeNull();
    expect(result?.name).toBe('Meu Preset');
    expect(result?.soundLevels).toEqual({ chuva: 0.8 });
    expect(result?.isDefault).toBe(false);
  });

  it('savePreset retorna null quando não há usuário', async () => {
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } });
    const result = await cafeService.savePreset({ name: 'Preset', soundLevels: {} });
    expect(result).toBeNull();
  });

  it('savePreset retorna null em caso de erro', async () => {
    buildFromChain({
      single: vi.fn().mockResolvedValue({ data: null, error: new Error('fail') })
    });
    const result = await cafeService.savePreset({ name: 'Preset', soundLevels: {} });
    expect(result).toBeNull();
  });

  // ─── loadUserPresets ───────────────────────────────────────────
  it('loadUserPresets carrega lista de presets', async () => {
    const chain = buildFromChain();
    chain.order = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'p1',
          preset_name: 'Preset 1',
          preset_config: { soundLevels: { chuva: 0.5 } },
          is_default: true,
          user_id: 'user1',
        }
      ],
      error: null
    });

    const result = await cafeService.loadUserPresets();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Preset 1');
    expect(result[0].isDefault).toBe(true);
  });

  it('loadUserPresets retorna [] quando não há usuário', async () => {
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } });
    const result = await cafeService.loadUserPresets();
    expect(result).toEqual([]);
  });

  it('loadUserPresets retorna [] em caso de erro', async () => {
    const chain = buildFromChain();
    chain.order = vi.fn().mockResolvedValue({ data: null, error: new Error('fail') });
    const result = await cafeService.loadUserPresets();
    expect(result).toEqual([]);
  });

  // ─── deletePreset ───────────────────────────────────────────────
  it('deletePreset deleta um preset e retorna true', async () => {
    buildFromChain({
      eq: vi.fn().mockResolvedValue({ error: null })
    });
    const result = await cafeService.deletePreset('preset-1');
    expect(result).toBe(true);
    expect(supabase.from).toHaveBeenCalledWith('cafe_presets');
  });

  it('deletePreset retorna false em caso de erro', async () => {
    buildFromChain({
      eq: vi.fn().mockResolvedValue({ error: new Error('fail') })
    });
    const result = await cafeService.deletePreset('preset-1');
    expect(result).toBe(false);
  });
});

