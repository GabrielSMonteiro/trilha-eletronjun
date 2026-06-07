import { test, expect } from '@playwright/test';
import { loginAsUser } from './helpers';

test.describe('Application Tools', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test('should navigate to Analytics page', async ({ page }) => {
    await page.goto('/analytics');
    
    // Wait for the auth loading to pass
    await page.waitForSelector('text=Analytics');
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
    await expect(page.getByText('Dashboard de Desempenho')).toBeVisible();
  });

  test('should navigate to Community page', async ({ page }) => {
    await page.goto('/community');
    
    await expect(page.getByRole('heading', { name: 'Comunidade' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Fóruns' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Grupos' })).toBeVisible();
  });

  test('should navigate to AI Automations page', async ({ page }) => {
    await page.goto('/ai');
    
    await expect(page.getByRole('heading', { name: 'Automações IA' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Flashcards' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Resumos' })).toBeVisible();
  });
});
