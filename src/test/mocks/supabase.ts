import { vi } from 'vitest';

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

export const createSupabaseMock = (options?: {
  fromData?: unknown;
  fromError?: unknown;
}) => ({
  auth: createAuthMock(),
  from: vi.fn(() => createFromMock({ data: options?.fromData, error: options?.fromError })),
});

export const mockAuthenticatedUser = (id = 'user-123', email = 'user@eletronjun.com.br') => ({
  id,
  email,
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
});

export const mockAuthError = (message = 'Erro de autenticação') => ({
  data: { user: null, session: null },
  error: { message, status: 400 },
});
