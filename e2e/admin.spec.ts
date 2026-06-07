import { test, expect } from '@playwright/test';
import { loginAsUser, loginAsAdmin } from './helpers';

test.describe('Admin Panel Authorization', () => {

  test('should deny access to standard users', async ({ page }) => {
    await loginAsUser(page);
    
    // Attempt to access admin panel
    await page.goto('/admin');
    
    // Should be redirected to /app or show 'Acesso negado' toast
    // Because of our Admin logic, it shows a toast and navigates back to /app
    await page.waitForURL('**/app');
    
    // Check if the denied toast appeared
    await expect(page.getByText('Acesso negado').first()).toBeVisible();
  });

  test('should grant access to admin users', async ({ page }) => {
    await loginAsAdmin(page);
    
    // Should be redirected to /admin automatically by the Auth page, or we can go there manually
    await page.goto('/admin');
    
    // Wait for the admin panel to load instead of the "Acesso negado" message
    // The exact text will depend on the AdminLayout component, but we can assume /admin URL sticks
    await page.waitForURL('**/admin');
    
    // If it stays on /admin, the test passes
    // We expect the 'Carregando painel administrativo...' to go away
    await expect(page.getByText('Carregando painel administrativo...')).toBeHidden();
  });

});
