import { Page } from '@playwright/test';

export async function loginAsUser(page: Page) {
  await page.goto('/auth');
  
  // Wait for the sign in tab to be active
  await page.waitForSelector('text=Entrar');
  
  // Fill the credentials
  await page.fill('[placeholder="seu.email@eletronjun.com.br"]', process.env.E2E_USER_EMAIL!);
  await page.fill('[placeholder="••••••••"]', process.env.E2E_USER_PASSWORD!);
  
  // Click submit
  await page.locator('button[type="submit"]').first().click();
  
  // Wait for redirect to /app
  await page.waitForURL('**/app');
}

export async function loginAsAdmin(page: Page) {
  await page.goto('/auth');
  
  // Fill the credentials
  await page.fill('[placeholder="seu.email@eletronjun.com.br"]', process.env.E2E_ADMIN_EMAIL!);
  await page.fill('[placeholder="••••••••"]', process.env.E2E_ADMIN_PASSWORD!);
  
  // Click submit
  await page.locator('button[type="submit"]').first().click();
  
  // Wait for redirect to /admin
  await page.waitForURL('**/admin');
}
