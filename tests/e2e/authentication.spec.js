// test/e2e/authentication.spec.js
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should show login page', async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Check if we're on the login page
    await expect(page.getByRole('heading', { name: /Relay Platform/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
  });
  
  test('should validate invite code format', async ({ page }) => {
    // Navigate to the invite code page
    await page.goto('/invite');
    
    // Try to submit an invalid invite code
    await page.getByLabel('Invite Code').fill('INVALID');
    await page.getByRole('button', { name: /Verify/ }).click();
    
    // Should show validation error
    await expect(page.getByText(/Invalid invite code format/i)).toBeVisible();
  });

  // More E2E tests would be added here
});
