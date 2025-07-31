import { expect, test } from '@playwright/test';
import path from 'path';

test.describe('Complete Journal Creation Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.route('**/api/auth/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'test-user-1',
            email: 'test@example.com',
            role: 'student',
          },
        }),
      });
    });

    // Mock categories with comprehensive task templates
    await page.route('**/api/categories**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'critical-thinking',
            name: '비판적 사고',
            description: '비판적 사고 훈련 카테고리',
            template: '뉴스 기사를 읽고 분석해보세요.',
            task_templates: [
              {
                id: 'task-1',
                title: '기사 요약하기',
                description: '기사의 핵심 내용을 3줄로 요약하세요.',
                order_index: 0,
                is_required: true,
                difficulty_level: 'easy',
                estimated_minutes: 10,
              },
              {
                id: 'task-2',
                title: '편향성 분석하기',
                description: '기사에서 편향된 표현이나 관점을 찾아보세요.',
                order_index: 1,
                is_required: true,
                difficulty_level: 'medium',
                estimated_minutes: 15,
              },
              {
                id: 'task-3',
                title: '대안적 관점 제시하기',
                description: '다른 관점에서 이 주제를 바라본다면?',
                order_index: 2,
                is_required: false,
                difficulty_level: 'hard',
                estimated_minutes: 20,
              },
            ],
          },
          {
            id: 'creative-thinking',
            name: '창의적 사고',
            description: '창의적 사고 훈련 카테고리',
            template: '주어진 주제로 창의적인 아이디어를 생각해보세요.',
            task_templates: [
              {
                id: 'creative-task-1',
                title: '브레인스토밍',
                description: '5분 동안 최대한 많은 아이디어를 생각해보세요.',
                order_index: 0,
                is_required: true,
                difficulty_level: 'easy',
                estimated_minutes: 5,
              },
            ],
          },
        ]),
      });
    });

    // Mock progress tracking
    await page.route('**/api/training/progress**', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            currentWeek: {
              id: 'progress-1',
              user_id: 'test-user-1',
              category_id: 'critical-thinking',
              week_start_date: '2024-01-01',
              target_count: 3,
              completed_count: 0,
              completion_rate: 0,
              current_streak: 0,
              best_streak: 0,
              last_entry_date: null,
            },
            totalJournals: 0,
          }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            progress: {
              completion_rate: 33,
              current_streak: 1,
            },
          }),
        });
      }
    });
  });

  test.describe('End-to-End Structured Journal Flow', () => {
    test('should complete full structured journal creation workflow', async ({
      page,
    }) => {
      // Mock successful journal submission
      await page.route('**/api/training/journals/structured', route => {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            journal: {
              id: 'journal-1',
              title: '완전한 비판적 사고 일지',
              created_at: '2024-01-01T10:00:00Z',
            },
          }),
        });
      });

      // Start from training dashboard
      await page.goto('/training');

      // Verify initial state
      await expect(page.getByText('0%')).toBeVisible(); // Initial progress
      await expect(page.getByText('비판적 사고')).toBeVisible();

      // Click to create new journal
      const createButton = page.getByText('새 일지 작성').first();
      await createButton.click();

      // Should navigate to journal type selection
      await expect(page).toHaveURL(
        /\/training\/journal\/new\?categoryId=critical-thinking/
      );
      await expect(page.getByText('📝 훈련 일지 작성하기')).toBeVisible();

      // Verify category information is displayed
      await expect(page.getByText('📚 비판적 사고')).toBeVisible();
      await expect(page.getByText('비판적 사고 훈련 카테고리')).toBeVisible();

      // Select structured journal type
      const structuredCard = page.locator('text=양식 작성하기').locator('..');
      await expect(structuredCard).toBeVisible();
      await expect(page.getByText('3개의 가이드 질문')).toBeVisible();
      await structuredCard.click();

      // Should navigate to structured journal form
      await expect(page).toHaveURL(
        /\/training\/journal\/new\/structured\?categoryId=critical-thinking/
      );
      await expect(page.getByText('📋 구조화된 일지 작성')).toBeVisible();

      // Verify template guide is shown
      await expect(page.getByText('📝 비판적 사고 훈련 가이드')).toBeVisible();
      await expect(
        page.getByText('뉴스 기사를 읽고 분석해보세요.')
      ).toBeVisible();

      // Verify all tasks are displayed
      await expect(page.getByText('✅ 훈련 태스크 체크리스트')).toBeVisible();
      await expect(page.getByText('1. 기사 요약하기')).toBeVisible();
      await expect(page.getByText('2. 편향성 분석하기')).toBeVisible();
      await expect(page.getByText('3. 대안적 관점 제시하기')).toBeVisible();

      // Verify task details
      await expect(
        page.getByText('기사의 핵심 내용을 3줄로 요약하세요.')
      ).toBeVisible();
      await expect(page.getByText('필수')).toBeVisible();
      await expect(page.getByText('쉬움')).toBeVisible();
      await expect(page.getByText('~10분')).toBeVisible();

      // Fill journal title
      const titleInput = page.getByPlaceholder('일지 제목을 입력하세요');
      await titleInput.fill('완전한 비판적 사고 일지');

      // Complete first task (required)
      const firstTaskCheckbox = page.getByLabel('1. 기사 요약하기');
      await firstTaskCheckbox.click();

      // Should show completion confirmation
      await expect(page.getByText('태스크 완료 확인')).toBeVisible();
      await expect(page.getByText('이 태스크를 완료하셨나요?')).toBeVisible();
      await page.getByText('완료').click();

      // Add completion note for first task
      const firstTaskNote = page
        .getByPlaceholder('이 태스크를 어떻게 완료했는지')
        .first();
      await firstTaskNote.fill(
        '뉴스 기사를 읽고 핵심 내용 3줄로 요약했습니다.'
      );

      // Verify progress update
      await expect(page.getByText('33%')).toBeVisible();
      await expect(page.getByText('완료: 1/3 태스크')).toBeVisible();

      // Complete second task (required)
      const secondTaskCheckbox = page.getByLabel('2. 편향성 분석하기');
      await secondTaskCheckbox.click();
      await page.getByText('완료').click();

      const secondTaskNote = page
        .getByPlaceholder('이 태스크를 어떻게 완료했는지')
        .nth(1);
      await secondTaskNote.fill('기사에서 편향된 표현들을 찾아 분석했습니다.');

      // Progress should update
      await expect(page.getByText('67%')).toBeVisible();
      await expect(page.getByText('완료: 2/3 태스크')).toBeVisible();

      // Complete optional third task
      const thirdTaskCheckbox = page.getByLabel('3. 대안적 관점 제시하기');
      await thirdTaskCheckbox.click();
      await page.getByText('완료').click();

      const thirdTaskNote = page
        .getByPlaceholder('이 태스크를 어떻게 완료했는지')
        .nth(2);
      await thirdTaskNote.fill('다른 관점에서 이 주제를 분석해보았습니다.');

      // All tasks completed
      await expect(page.getByText('100%')).toBeVisible();
      await expect(page.getByText('완료: 3/3 태스크')).toBeVisible();

      // Add overall reflection
      const reflectionTextarea =
        page.getByPlaceholder('오늘의 훈련을 통해 느낀 점');
      await reflectionTextarea.fill(
        '오늘은 뉴스 기사를 다각도로 분석하면서 비판적 사고 능력을 기를 수 있었습니다. 특히 편향성을 찾는 과정에서 많은 것을 배웠습니다.'
      );

      // Submit journal
      await page.getByText('💾 일지 저장').click();

      // Should show success and redirect
      await expect(page).toHaveURL(/\/training/);

      // Verify progress was updated on dashboard
      await expect(page.getByText('33%')).toBeVisible(); // Updated progress
    });

    test('should handle partial completion and save draft', async ({
      page,
    }) => {
      // Mock draft save
      await page.route('**/api/training/journals/draft', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            draft: {
              id: 'draft-1',
              title: '임시저장된 일지',
            },
          }),
        });
      });

      await page.goto(
        '/training/journal/new/structured?categoryId=critical-thinking'
      );

      // Fill partial data
      const titleInput = page.getByPlaceholder('일지 제목을 입력하세요');
      await titleInput.fill('임시저장된 일지');

      // Complete only one task
      const firstTaskCheckbox = page.getByLabel('1. 기사 요약하기');
      await firstTaskCheckbox.click();
      await page.getByText('완료').click();

      // Save as draft
      await page.getByText('📝 임시저장').click();

      // Should show draft saved message
      await expect(page.getByText('임시저장되었습니다')).toBeVisible();
    });

    test('should validate required fields before submission', async ({
      page,
    }) => {
      await page.goto(
        '/training/journal/new/structured?categoryId=critical-thinking'
      );

      // Try to submit without title
      await page.getByText('💾 일지 저장').click();

      // Should show validation errors
      await expect(page.getByText('제목을 입력해주세요')).toBeVisible();
      await expect(
        page.getByText('최소 하나의 필수 태스크를 완료해주세요')
      ).toBeVisible();

      // Fill title but no required tasks
      const titleInput = page.getByPlaceholder('일지 제목을 입력하세요');
      await titleInput.fill('검증 테스트 일지');

      await page.getByText('💾 일지 저장').click();

      // Title error should disappear, but task error remains
      await expect(page.getByText('제목을 입력해주세요')).not.toBeVisible();
      await expect(
        page.getByText('최소 하나의 필수 태스크를 완료해주세요')
      ).toBeVisible();

      // Complete one required task
      const firstTaskCheckbox = page.getByLabel('1. 기사 요약하기');
      await firstTaskCheckbox.click();
      await page.getByText('완료').click();

      // All validation errors should disappear
      await expect(
        page.getByText('최소 하나의 필수 태스크를 완료해주세요')
      ).not.toBeVisible();
    });
  });

  test.describe('End-to-End Photo Journal Flow', () => {
    test('should complete full photo journal creation workflow', async ({
      page,
    }) => {
      // Mock successful photo journal submission
      await page.route('**/api/training/journals/photo', route => {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            journal: {
              id: 'photo-journal-1',
              title: '창의적 사고 사진 일지',
              created_at: '2024-01-01T10:00:00Z',
            },
          }),
        });
      });

      // Start from training dashboard
      await page.goto('/training');

      // Select creative thinking category
      const creativeThinkingCard = page
        .locator('text=창의적 사고')
        .locator('..');
      await creativeThinkingCard.getByText('새 일지 작성').click();

      // Should navigate to journal type selection
      await expect(page).toHaveURL(
        /\/training\/journal\/new\?categoryId=creative-thinking/
      );

      // Select photo journal type
      const photoCard = page.locator('text=사진 업로드').locator('..');
      await expect(photoCard).toBeVisible();
      await expect(page.getByText('빠른 기록')).toBeVisible();
      await expect(page.getByText('손글씨 인식')).toBeVisible();
      await photoCard.click();

      // Should navigate to photo journal form
      await expect(page).toHaveURL(
        /\/training\/journal\/new\/photo\?categoryId=creative-thinking/
      );
      await expect(page.getByText('📷 사진 일지 작성')).toBeVisible();

      // Verify category template is shown
      await expect(page.getByText('📝 창의적 사고 훈련 가이드')).toBeVisible();
      await expect(
        page.getByText('주어진 주제로 창의적인 아이디어를 생각해보세요.')
      ).toBeVisible();

      // Fill journal title
      const titleInput = page.getByPlaceholder('일지 제목을 입력하세요');
      await titleInput.fill('창의적 사고 사진 일지');

      // Verify file upload area
      await expect(
        page.getByText('사진을 드래그하여 놓거나 클릭하여 선택하세요')
      ).toBeVisible();
      await expect(
        page.getByText('JPG, PNG, HEIC, WebP 형식 지원 (최대 10MB)')
      ).toBeVisible();

      // Upload first photo
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(
        path.join(__dirname, 'fixtures', 'test-image.jpg')
      );

      // Should show photo preview
      await expect(page.getByText('업로드된 사진 (1장)')).toBeVisible();
      await expect(page.getByAltText('업로드된 사진 1')).toBeVisible();

      // Add description for first photo
      const photoDescription =
        page.getByPlaceholder('이 사진에 대한 설명을 입력하세요');
      await photoDescription.fill(
        '브레인스토밍 과정을 손으로 그린 마인드맵입니다.'
      );

      // Upload second photo (simulate multiple files)
      await page.evaluate(() => {
        const fileInput = document.querySelector(
          'input[type="file"]'
        ) as HTMLInputElement;
        const file1 = new File(['test1'], 'sketch1.jpg', {
          type: 'image/jpeg',
        });
        const file2 = new File(['test2'], 'sketch2.jpg', {
          type: 'image/jpeg',
        });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file1);
        dataTransfer.items.add(file2);
        fileInput.files = dataTransfer.files;
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      });

      // Should show multiple photos
      await expect(page.getByText('업로드된 사진 (2장)')).toBeVisible();

      // Add overall description
      const overallDescription =
        page.getByPlaceholder('오늘의 훈련에 대한 전체적인 생각');
      await overallDescription.fill(
        '오늘은 창의적 사고 훈련을 위해 손글씨로 아이디어를 정리해보았습니다. 디지털 도구보다 손으로 그리는 것이 더 자유로운 발상을 도와주는 것 같습니다.'
      );

      // Submit journal
      await page.getByText('📷 일지 제출').click();

      // Should show success and redirect
      await expect(page).toHaveURL(/\/training/);
    });

    test('should validate photo requirements', async ({ page }) => {
      await page.goto(
        '/training/journal/new/photo?categoryId=creative-thinking'
      );

      // Fill title but no photos
      const titleInput = page.getByPlaceholder('일지 제목을 입력하세요');
      await titleInput.fill('사진 없는 일지');

      // Try to submit
      await page.getByText('📷 일지 제출').click();

      // Should show validation error
      await expect(
        page.getByText('최소 1장의 사진을 업로드해주세요')
      ).toBeVisible();
    });

    test('should handle file upload errors', async ({ page }) => {
      // Mock file upload error
      await page.route('**/api/training/journals/photo', route => {
        route.fulfill({
          status: 413,
          contentType: 'application/json',
          body: JSON.stringify({
            error: '파일 크기가 너무 큽니다 (최대 10MB)',
          }),
        });
      });

      await page.goto(
        '/training/journal/new/photo?categoryId=creative-thinking'
      );

      const titleInput = page.getByPlaceholder('일지 제목을 입력하세요');
      await titleInput.fill('파일 오류 테스트');

      // Upload file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(
        path.join(__dirname, 'fixtures', 'test-image.jpg')
      );

      await page.getByText('📷 일지 제출').click();

      // Should show file size error
      await expect(
        page.getByText('파일 크기가 너무 큽니다 (최대 10MB)')
      ).toBeVisible();
    });
  });

  test.describe('Cross-Category Workflow', () => {
    test('should handle switching between different categories', async ({
      page,
    }) => {
      await page.goto('/training');

      // Start with critical thinking
      const criticalThinkingCard = page
        .locator('text=비판적 사고')
        .locator('..');
      await criticalThinkingCard.getByText('새 일지 작성').click();

      await expect(page).toHaveURL(/categoryId=critical-thinking/);
      await expect(page.getByText('3개의 가이드 질문')).toBeVisible();

      // Go back to training page
      await page.goBack();

      // Now try creative thinking
      const creativeThinkingCard = page
        .locator('text=창의적 사고')
        .locator('..');
      await creativeThinkingCard.getByText('새 일지 작성').click();

      await expect(page).toHaveURL(/categoryId=creative-thinking/);
      await expect(page.getByText('1개의 가이드 질문')).toBeVisible();

      // Verify different template content
      await page.getByText('양식 작성하기').click();
      await expect(
        page.getByText('주어진 주제로 창의적인 아이디어를 생각해보세요.')
      ).toBeVisible();
    });

    test('should maintain separate progress for different categories', async ({
      page,
    }) => {
      // Mock different progress for each category
      await page.route('**/api/training/progress**', route => {
        const url = new URL(route.request().url());
        const categoryId = url.searchParams.get('categoryId');

        if (categoryId === 'critical-thinking') {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              currentWeek: {
                completed_count: 2,
                target_count: 3,
                completion_rate: 67,
              },
            }),
          });
        } else if (categoryId === 'creative-thinking') {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              currentWeek: {
                completed_count: 1,
                target_count: 3,
                completion_rate: 33,
              },
            }),
          });
        }
      });

      await page.goto('/training');

      // Should show different progress for each category
      const criticalThinkingProgress = page
        .locator('text=비판적 사고')
        .locator('..')
        .getByText('67%');
      const creativeThinkingProgress = page
        .locator('text=창의적 사고')
        .locator('..')
        .getByText('33%');

      await expect(criticalThinkingProgress).toBeVisible();
      await expect(creativeThinkingProgress).toBeVisible();
    });
  });

  test.describe('Accessibility and Usability', () => {
    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/training/journal/new?categoryId=critical-thinking');

      // Tab through journal type selection
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should focus on structured journal card
      const structuredCard = page.locator('text=양식 작성하기').locator('..');
      await expect(structuredCard).toBeFocused();

      // Press Enter to select
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/structured/);

      // Tab through form elements
      await page.keyboard.press('Tab'); // Title input
      const titleInput = page.getByPlaceholder('일지 제목을 입력하세요');
      await expect(titleInput).toBeFocused();

      await titleInput.fill('키보드 네비게이션 테스트');

      // Continue tabbing to checkboxes
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should be able to check tasks with Space
      await page.keyboard.press('Space');

      // Should show completion dialog
      await expect(page.getByText('태스크 완료 확인')).toBeVisible();
    });

    test('should have proper ARIA labels and roles', async ({ page }) => {
      await page.goto(
        '/training/journal/new/structured?categoryId=critical-thinking'
      );

      // Check for proper ARIA labels
      const titleInput = page.getByPlaceholder('일지 제목을 입력하세요');
      await expect(titleInput).toHaveAttribute('aria-label', '일지 제목');

      const firstTaskCheckbox = page.getByLabel('1. 기사 요약하기');
      await expect(firstTaskCheckbox).toHaveAttribute('role', 'checkbox');

      const progressIndicator = page.getByText('훈련 진행률');
      await expect(progressIndicator).toHaveAttribute('role', 'progressbar');
    });

    test('should work with screen reader announcements', async ({ page }) => {
      await page.goto(
        '/training/journal/new/structured?categoryId=critical-thinking'
      );

      // Check for live regions for dynamic updates
      const progressRegion = page.locator('[aria-live="polite"]');
      await expect(progressRegion).toBeVisible();

      // Complete a task and verify announcement
      const firstTaskCheckbox = page.getByLabel('1. 기사 요약하기');
      await firstTaskCheckbox.click();
      await page.getByText('완료').click();

      // Progress update should be announced
      await expect(progressRegion).toContainText('33%');
    });
  });

  test.describe('Performance and Loading States', () => {
    test('should show loading states during submission', async ({ page }) => {
      // Mock slow API response
      await page.route('**/api/training/journals/structured', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            journal: { id: 'journal-1' },
          }),
        });
      });

      await page.goto(
        '/training/journal/new/structured?categoryId=critical-thinking'
      );

      // Fill form
      const titleInput = page.getByPlaceholder('일지 제목을 입력하세요');
      await titleInput.fill('로딩 테스트 일지');

      const firstTaskCheckbox = page.getByLabel('1. 기사 요약하기');
      await firstTaskCheckbox.click();
      await page.getByText('완료').click();

      // Submit
      await page.getByText('💾 일지 저장').click();

      // Should show loading state
      await expect(page.getByText('저장 중...')).toBeVisible();
      await expect(
        page.getByRole('button', { name: '💾 일지 저장' })
      ).toBeDisabled();

      // Should show spinner or loading indicator
      await expect(page.locator('.loading-spinner')).toBeVisible();

      // Wait for completion
      await expect(page).toHaveURL(/\/training/, { timeout: 5000 });
    });

    test('should handle slow network conditions', async ({ page }) => {
      // Simulate slow network
      await page.route('**/api/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        route.continue();
      });

      const startTime = Date.now();
      await page.goto('/training/journal/new?categoryId=critical-thinking');
      const loadTime = Date.now() - startTime;

      // Should still load within reasonable time
      expect(loadTime).toBeLessThan(10000);

      // Should show loading indicators
      await expect(page.getByText('로딩 중...')).toBeVisible();
    });

    test('should optimize for mobile performance', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      const startTime = Date.now();
      await page.goto(
        '/training/journal/new/structured?categoryId=critical-thinking'
      );
      const loadTime = Date.now() - startTime;

      // Should load quickly on mobile
      expect(loadTime).toBeLessThan(5000);

      // Should be responsive
      await expect(page.getByText('📋 구조화된 일지 작성')).toBeVisible();

      // Form should be usable on mobile
      const titleInput = page.getByPlaceholder('일지 제목을 입력하세요');
      await titleInput.fill('모바일 테스트');

      // Checkboxes should be large enough for touch
      const firstTaskCheckbox = page.getByLabel('1. 기사 요약하기');
      const checkboxSize = await firstTaskCheckbox.boundingBox();
      expect(checkboxSize?.width).toBeGreaterThan(44); // Minimum touch target size
      expect(checkboxSize?.height).toBeGreaterThan(44);
    });
  });
});
