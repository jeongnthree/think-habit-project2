import { expect, test } from '@playwright/test';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
  });

  test('should display dashboard title and description', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '내 대시보드' })).toBeVisible();
    await expect(page.getByText('훈련 진행 상황을 한눈에 확인하세요.')).toBeVisible();
  });

  test('should display statistics cards', async ({ page }) => {
    // Wait for loading to complete
    await page.waitForSelector('[data-testid="stats-cards"]', { state: 'visible' });

    // Check statistics cards
    await expect(page.getByText('할당된 카테고리')).toBeVisible();
    await expect(page.getByText('완료한 일지')).toBeVisible();
    await expect(page.getByText('연속 기록')).toBeVisible();
    await expect(page.getByText('전체 완료율')).toBeVisible();

    // Check if numbers are displayed
    await expect(page.locator('text=3').first()).toBeVisible(); // assignedCategories
    await expect(page.locator('text=12').first()).toBeVisible(); // completedJournals
    await expect(page.locator('text=5일').first()).toBeVisible(); // streakDays
    await expect(page.locator('text=75%').first()).toBeVisible(); // overallCompletionRate
  });

  test('should display progress section', async ({ page }) => {
    await expect(page.getByText('이번 주 진행률')).toBeVisible();
    await expect(page.getByText('목표 달성률')).toBeVisible();
    await expect(page.locator('text=60%').first()).toBeVisible();
    
    // Check progress bar
    const progressBar = page.locator('.bg-blue-600.h-3.rounded-full');
    await expect(progressBar).toBeVisible();
    await expect(progressBar).toHaveCSS('width', /60%/);
  });

  test('should display recent journals', async ({ page }) => {
    await expect(page.getByText('최근 일지')).toBeVisible();
    await expect(page.getByText('비판적 사고 훈련 - 뉴스 분석')).toBeVisible();
    await expect(page.getByText('창의적 문제 해결')).toBeVisible();
    await expect(page.getByText('감정 조절 훈련')).toBeVisible();

    // Check category badges
    await expect(page.locator('.bg-blue-100.text-blue-800').first()).toBeVisible();
  });

  test('should display quick actions', async ({ page }) => {
    await expect(page.getByText('빠른 액션')).toBeVisible();
    
    const newJournalButton = page.getByRole('link', { name: /새 일지 작성/ });
    const journalListButton = page.getByRole('link', { name: /일지 목록 보기/ });
    const adminButton = page.getByRole('link', { name: /관리자 페이지/ });

    await expect(newJournalButton).toBeVisible();
    await expect(journalListButton).toBeVisible();
    await expect(adminButton).toBeVisible();

    // Check links
    await expect(newJournalButton).toHaveAttribute('href', '/training');
    await expect(journalListButton).toHaveAttribute('href', '/training/journals');
    await expect(adminButton).toHaveAttribute('href', '/admin');
  });

  test('should navigate to journal detail when clicking recent journal', async ({ page }) => {
    const journalLink = page.getByRole('link', { name: '비판적 사고 훈련 - 뉴스 분석' });
    await expect(journalLink).toBeVisible();
    
    await journalLink.click();
    await expect(page).toHaveURL('/training/journal/journal1');
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check if content is still visible and properly arranged
    await expect(page.getByRole('heading', { name: '내 대시보드' })).toBeVisible();
    await expect(page.getByText('할당된 카테고리')).toBeVisible();
    
    // Check if cards stack vertically on mobile
    const statsCards = page.locator('[data-testid="stats-cards"] > div');
    const firstCard = statsCards.first();
    const secondCard = statsCards.nth(1);
    
    const firstCardBox = await firstCard.boundingBox();
    const secondCardBox = await secondCard.boundingBox();
    
    // On mobile, cards should stack vertically (second card should be below first)
    expect(secondCardBox?.y).toBeGreaterThan(firstCardBox?.y || 0);
  });
});