import { vi } from 'vitest';

// ── Supabase mock factories ───────────────────────────────────────────────────

/**
 * Default auth mock — unauthenticated user, no active session.
 * Override individual methods using `vi.mocked(...).mockResolvedValueOnce(...)`.
 */
export const createAuthMock = () => ({
  getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
  signInWithPassword: vi.fn().mockResolvedValue({
    data: { user: null, session: null },
    error: null,
  }),
  signUp: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
  onAuthStateChange: vi.fn().mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  }),
  signOut: vi.fn().mockResolvedValue({ error: null }),
});

/**
 * Default from() chain mock — returns empty data, no error.
 * Use `.mockReturnValueOnce(...)` to override for specific queries.
 */
export const createFromMock = (overrides?: {
  data?: unknown;
  error?: unknown;
}) => {
  const resolved = {
    data: overrides?.data ?? [],
    error: overrides?.error ?? null,
  };
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue(resolved),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  return chain;
};

/**
 * Full supabase mock object. Pass to `vi.mock('@/integrations/supabase/client', ...)`.
 *
 * @example
 * ```ts
 * vi.mock('@/integrations/supabase/client', () => ({
 *   supabase: createSupabaseMock(),
 * }));
 * ```
 */
export const createSupabaseMock = (options?: {
  fromData?: unknown;
  fromError?: unknown;
}) => ({
  auth: createAuthMock(),
  from: vi.fn(() => createFromMock({ data: options?.fromData, error: options?.fromError })),
});

// ── Pre-built scenario helpers ────────────────────────────────────────────────

/** Simulates a logged-in user with no admin role. */
export const mockAuthenticatedUser = (id = 'user-123', email = 'user@eletronjun.com.br') => ({
  id,
  email,
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
});

/** Simulates a Supabase auth error response. */
export const mockAuthError = (message = 'Erro de autenticação') => ({
  data: { user: null, session: null },
  error: { message, status: 400 },
});
