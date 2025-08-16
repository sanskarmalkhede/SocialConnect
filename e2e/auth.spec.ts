import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display landing page for unauthenticated users', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Connect with your community')
    await expect(page.locator('text=Join SocialConnect')).toBeVisible()
    await expect(page.locator('text=Sign In')).toBeVisible()
  })

  test('should navigate to login page', async ({ page }) => {
    await page.click('text=Sign In')
    await expect(page).toHaveURL('/auth/login')
    await expect(page.locator('h1')).toContainText('Welcome back')
  })

  test('should navigate to register page', async ({ page }) => {
    await page.click('text=Join SocialConnect')
    await expect(page).toHaveURL('/auth/register')
    await expect(page.locator('h1')).toContainText('Create your account')
  })

  test('should show validation errors on empty login form', async ({ page }) => {
    await page.goto('/auth/login')
    await page.click('button[type="submit"]')
    
    await expect(page.locator('text=Email is required')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()
  })

  test('should show validation error for invalid email', async ({ page }) => {
    await page.goto('/auth/login')
    await page.fill('input[type="email"]', 'invalid-email')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await expect(page.locator('text=Please enter a valid email')).toBeVisible()
  })

  test('should navigate between login and register pages', async ({ page }) => {
    await page.goto('/auth/login')
    await page.click('text=Sign up')
    await expect(page).toHaveURL('/auth/register')
    
    await page.click('text=Sign in')
    await expect(page).toHaveURL('/auth/login')
  })

  test('should navigate to reset password page', async ({ page }) => {
    await page.goto('/auth/login')
    await page.click('text=Forgot your password?')
    await expect(page).toHaveURL('/auth/reset-password')
    await expect(page.locator('h1')).toContainText('Reset your password')
  })

  test('should show validation errors on empty register form', async ({ page }) => {
    await page.goto('/auth/register')
    await page.click('button[type="submit"]')
    
    await expect(page.locator('text=Username is required')).toBeVisible()
    await expect(page.locator('text=Email is required')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()
  })

  test('should validate password requirements on register', async ({ page }) => {
    await page.goto('/auth/register')
    await page.fill('input[name="username"]', 'testuser')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', '123') // Too short
    await page.click('button[type="submit"]')
    
    await expect(page.locator('text=Password must be at least 6 characters')).toBeVisible()
  })
})