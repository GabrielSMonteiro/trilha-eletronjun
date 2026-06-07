import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display the login page correctly', async ({ page }) => {
    await page.goto('/auth');
    
    // Check main headings and descriptions
    await expect(page.getByRole('heading', { name: 'CapacitaJun', exact: true })).toBeVisible();
    await expect(page.getByText('Acesse sua conta para continuar aprendendo')).toBeVisible();
    
    // Check tabs
    await expect(page.getByRole('tab', { name: 'Entrar' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Cadastrar' })).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/auth');
    
    // Attempt to login with an invalid email
    await page.fill('[placeholder="seu.email@eletronjun.com.br"]', 'emailinvalido');
    await page.locator('button[type="submit"]').first().click();
    
    // Expect zod validation errors
    await expect(page.getByText('Email inválido').first()).toBeVisible();
  });

  test('should successfully login user and redirect to dashboard', async ({ page }) => {
    await page.goto('/auth');
    
    await page.fill('[placeholder="seu.email@eletronjun.com.br"]', process.env.E2E_USER_EMAIL!);
    await page.fill('[placeholder="••••••••"]', process.env.E2E_USER_PASSWORD!);
    await page.locator('button[type="submit"]').first().click();
    
    // Assert redirect to /app
    await page.waitForURL('**/app');
    await expect(page.getByText('Carregando trilhas...').or(page.getByRole('heading', { name: 'CapacitaJUN' }))).toBeVisible();
  });
});
