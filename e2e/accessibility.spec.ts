import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility Tests', () => {
  test('should not have any automatically detectable accessibility issues on home page', async ({ page }) => {
    await page.goto('/')
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should not have accessibility issues on login page', async ({ page }) => {
    await page.goto('/auth/login')
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should not have accessibility issues on register page', async ({ page }) => {
    await page.goto('/auth/register')
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should have proper form labels and ARIA attributes', async ({ page }) => {
    await page.goto('/auth/login')
    
    // Check form inputs have proper labels
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toHaveAttribute('aria-label')
    
    const passwordInput = page.locator('input[type="password"]')
    await expect(passwordInput).toHaveAttribute('aria-label')
    
    // Check submit button is properly labeled
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeVisible()
  })

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/auth/login')
    
    // Tab through form elements
    await page.keyboard.press('Tab')
    await expect(page.locator('input[type="email"]')).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.locator('input[type="password"]')).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.locator('button[type="submit"]')).toBeFocused()
  })

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/')
    
    // Check main heading exists
    const h1 = page.locator('h1')
    await expect(h1).toBeVisible()
    
    // Check heading text is meaningful
    await expect(h1).toContainText('Connect with your')
  })

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/')
    
    // This would be caught by axe-core, but we can also do manual checks
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should provide alternative text for images', async ({ page }) => {
    await page.goto('/')
    
    // Check all images have alt text
    const images = page.locator('img')
    const count = await images.count()
    
    for (let i = 0; i < count; i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute('alt')
      expect(alt).toBeTruthy()
    }
  })
})