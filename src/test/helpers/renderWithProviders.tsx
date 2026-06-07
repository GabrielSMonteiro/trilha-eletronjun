import React from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';

// ── Provider wrapper ──────────────────────────────────────────────────────────

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Optionally override the initial URL for routing tests. */
  initialPath?: string;
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

const AllProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>{children}</AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

/**
 * Drop-in replacement for `render()` that wraps the component with all
 * application providers (QueryClient, BrowserRouter, AuthProvider).
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: RenderWithProvidersOptions,
): RenderResult {
  const { initialPath = '/', ...rest } = options ?? {};
  window.history.pushState({}, '', initialPath);
  return render(ui, { wrapper: AllProviders, ...rest });
}
