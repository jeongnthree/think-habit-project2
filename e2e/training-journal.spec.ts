import { expect, test } from '@playwright/test';
import path from 'path';

test.describe('Training Journal System', () => {
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

    // Mock categories with task templates
    await page.route('**/api/categories**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'cat-1',
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
            ],
          },
        ]),
      });
    });

    // Mock progress data
    await page.route('**/api/training/progress**', route => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            currentWeek: {
              id: 'progress-1',
              user_id: 'test-user-1',
              category_id: 'cat-1',
              week_start_date: '2024-01-01',
              target_count: 3,
              completed_count: 1,
              completion_rate: 33,
              current_streak: 2,
              best_streak: 5,
              last_entry_date: '2024-01-02',
            },
            totalJournals: 5,
          }),
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            progress: {
              completion_rate: 67,
              current_streak: 3,
            },
          }),
        });
      }
    });
  });

  test.describe('Journal Type Selection', () => {
    test('should display journal type selection page', async ({ page }) => {
      await page.goto('/training/journal/new?categoryId=cat-1');

      await expect(page.getByText('📝 훈련 일지 작성하기')).toBeVisible();
      await expect(
        page.getByText('어떤 방식으로 일지를 작성하시겠어요?')
      ).toBeVisible();

      // Check category information
      await expect(page.getByText('📚 비판적 사고')).toBeVisible();
      await expect(page.getByText('비판적 사고 훈련 카테고리')).toBeVisible();
    });

    test('should show structured journal option with task count', async ({
      page,
    }) => {
      await page.goto('/training/journal/new?categoryId=cat-1');

      const structuredCard = page.locator('text=양식 작성하기').locator('..');
      await expect(structuredCard).toBeVisible();
      await expect(page.getByText('2개의 가이드 질문')).toBeVisible();
      await expect(page.getByText('체계적인 사고 훈련')).toBeVisible();
    });

    test('should show photo journal option', async ({ page }) => {
      await page.goto('/training/journal/new?categoryId=cat-1');

      const photoCard = page.locator('text=사진 업로드').locator('..');
      await expect(photoCard).toBeVisible();
      await expect(page.getByText('빠른 기록')).toBeVisible();
      await expect(page.getByText('손글씨 인식')).toBeVisible();
    });

    test('should navigate to structured journal form', async ({ page }) => {
      await page.goto('/training/journal/new?categoryId=cat-1');

      const structuredCard = page.locator('text=양식 작성하기').locator('..');
      await structuredCard.click();

      await expect(page).toHaveURL(
        '/training/journal/new/structured?categoryId=cat-1'
      );
    });

    test('should navigate to photo journal form', async ({ page }) => {
      await page.goto('/training/journal/new?categoryId=cat-1');

      const photoCard = page.locator('text=사진 업로드').locator('..');
      await photoCard.click();

      await expect(page).toHaveURL(
        '/training/journal/new/photo?categoryId=cat-1'
      );
    });
  });

  test.describe('Structured Journal Creation', () => {
    test.beforeEach(async ({ page }) => {
      // Mock journal submission
      await page.route('**/api/training/journals/structured', route => {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            journal: {
              id: 'journal-1',
              title: '테스트 일지',
              created_at: '2024-01-01T10:00:00Z',
            },
          }),
        });
      });
    });

    test('should display structured journal form', async ({ page }) => {
      await page.goto('/training/journal/new/structured?categoryId=cat-1');

      await expect(page.getByText('📋 구조화된 일지 작성')).toBeVisible();
      await expect(
        page.getByText('비판적 사고 - 체크리스트를 완료하며')
      ).toBeVisible();

      // Check progress indicator
      await expect(page.getByText('훈련 진행률')).toBeVisible();
      await expect(page.getByText('0%')).toBeVisible();
    });

    test('should show category template guide', async ({ page }) => {
      await page.goto('/training/journal/new/structured?categoryId=cat-1');

      await expect(page.getByText('📝 비판적 사고 훈련 가이드')).toBeVisible();
      await expect(
        page.getByText('뉴스 기사를 읽고 분석해보세요.')
      ).toBeVisible();
    });

    test('should display task checklist', async ({ page }) => {
      await page.goto('/training/journal/new/structured?categoryId=cat-1');

      await expect(page.getByText('✅ 훈련 태스크 체크리스트')).toBeVisible();
      await expect(page.getByText('1. 기사 요약하기')).toBeVisible();
      await expect(page.getByText('2. 편향성 분석하기')).toBeVisible();

      // Check task details
      await expect(
        page.getByText('기사의 핵심 내용을 3줄로 요약하세요.')
      ).toBeVisible();
      await expect(page.getByText('필수')).toBeVisible();
      await expect(page.getByText('쉬움')).toBeVisible();
      await expect(page.getByText('~10분')).toBeVisible();
    });

    test('should update progress when tasks are completed', async ({
      page,
    }) => {
      await page.goto('/training/journal/new/structured?categoryId=cat-1');

      // Complete first task
      const firstTaskCheckbox = page.getByLabelText('1. 기사 요약하기');
      await firstTaskCheckbox.click();

      // Should show confirmation modal
      await expect(page.getByText('태스크 완료 확인')).toBeVisible();
      await page.getByText('완료').click();

      // Progress should update
      await expect(page.getByText('50%')).toBeVisible();
      await expect(page.getByText('완료: 1/2 태스크')).toBeVisible();
    });

    test('should allow adding completion notes', async ({ page }) => {
      await page.goto('/training/journal/new/structured?categoryId=cat-1');

      const noteTextarea = page
        .getByPlaceholder('이 태스크를 어떻게 완료했는지')
        .first();
      await noteTextarea.fill('기사를 읽고 핵심 내용을 정리했습니다.');

      await expect(noteTextarea).toHaveValue(
        '기사를 읽고 핵심 내용을 정리했습니다.'
      );
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/training/journal/new/structured?categoryId=cat-1');

      // Clear title
      const titleInput = page.getByPlaceholder('일지 제목을 입력하세요');
      await titleInput.clear();

      // Try to submit
      await page.getByText('💾 일지 저장').click();

      await expect(page.getByText('제목을 입력해주세요')).toBeVisible();
    });

    test('should submit structured journal successfully', async ({ page }) => {
      await page.goto('/training/journal/new/structured?categoryId=cat-1');

      // Fill title
      const titleInput = page.getByPlaceholder('일지 제목을 입력하세요');
      await titleInput.fill('비판적 사고 훈련 일지');

      // Complete at least one task
      const firstTaskCheckbox = page.getByLabelText('1. 기사 요약하기');
      await firstTaskCheckbox.click();
      await page.getByText('완료').click();

      // Add reflection
      const reflectionTextarea =
        page.getByPlaceholder('오늘의 훈련을 통해 느낀 점');
      await reflectionTextarea.fill(
        '오늘은 뉴스 기사를 분석하면서 많은 것을 배웠습니다.'
      );

      // Submit
      await page.getByText('💾 일지 저장').click();

      // Should redirect to success page or journal list
      await expect(page).toHaveURL(/\/training/);
    });

    test('should handle offline mode', async ({ page }) => {
      // Simulate offline
      await page.context().setOffline(true);
      await page.goto('/training/journal/new/structured?categoryId=cat-1');

      await expect(page.getByText('오프라인 모드')).toBeVisible();
      await expect(page.getByText('📱 오프라인 저장')).toBeVisible();
    });
  });

  test.describe('Photo Journal Creation', () => {
    test.beforeEach(async ({ page }) => {
      // Mock photo journal submission
      await page.route('**/api/training/journals/photo', route => {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            journal: {
              id: 'photo-journal-1',
              title: '사진 일지',
              created_at: '2024-01-01T10:00:00Z',
            },
          }),
        });
      });
    });

    test('should display photo journal form', async ({ page }) => {
      await page.goto('/training/journal/new/photo?categoryId=cat-1');

      await expect(page.getByText('사진 일지 작성')).toBeVisible();
      await expect(
        page.getByText('손으로 작성한 노트나 스케치 사진을 업로드')
      ).toBeVisible();
    });

    test('should show file upload area', async ({ page }) => {
      await page.goto('/training/journal/new/photo?categoryId=cat-1');

      await expect(
        page.getByText('사진을 드래그하여 놓거나 클릭하여 선택하세요')
      ).toBeVisible();
      await expect(
        page.getByText('JPG, PNG, HEIC, WebP 형식 지원 (최대 10MB)')
      ).toBeVisible();
      await expect(page.getByText('파일 선택')).toBeVisible();
    });

    test('should upload and preview photos', async ({ page }) => {
      await page.goto('/training/journal/new/photo?categoryId=cat-1');

      // Create a test image file
      const testImagePath = path.join(__dirname, 'fixtures', 'test-image.jpg');

      // Upload file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(testImagePath);

      // Should show preview
      await expect(page.getByText('업로드된 사진 (1장)')).toBeVisible();
      await expect(page.getByAltText('업로드된 사진 1')).toBeVisible();
    });

    test('should allow adding photo descriptions', async ({ page }) => {
      await page.goto('/training/journal/new/photo?categoryId=cat-1');

      // Mock file upload
      await page.evaluate(() => {
        const fileInput = document.querySelector(
          'input[type="file"]'
        ) as HTMLInputElement;
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      });

      // Add description
      const descriptionTextarea =
        page.getByPlaceholder('이 사진에 대한 설명을 입력하세요');
      await descriptionTextarea.fill('손으로 작성한 마인드맵입니다.');

      await expect(descriptionTextarea).toHaveValue(
        '손으로 작성한 마인드맵입니다.'
      );
    });

    test('should validate file requirements', async ({ page }) => {
      await page.goto('/training/journal/new/photo?categoryId=cat-1');

      // Try to submit without photos
      await page.getByText('일지 제출').click();

      await expect(
        page.getByText('최소 1장의 사진을 업로드해주세요')
      ).toBeVisible();
    });

    test('should submit photo journal successfully', async ({ page }) => {
      await page.goto('/training/journal/new/photo?categoryId=cat-1');

      // Mock successful file upload
      await page.evaluate(() => {
        const fileInput = document.querySelector(
          'input[type="file"]'
        ) as HTMLInputElement;
        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      });

      // Add overall description
      const descriptionTextarea =
        page.getByPlaceholder('오늘의 훈련에 대한 전체적인 생각');
      await descriptionTextarea.fill(
        '오늘은 손글씨로 생각을 정리해보았습니다.'
      );

      // Submit
      await page.getByText('일지 제출').click();

      // Should redirect to success page
      await expect(page).toHaveURL(/\/training/);
    });
  });

  test.describe('Journal List and Management', () => {
    test.beforeEach(async ({ page }) => {
      // Mock journal list
      await page.route('**/api/training/journals**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            journals: [
              {
                id: 'journal-1',
                title: '비판적 사고 훈련 일지',
                journal_type: 'structured',
                category: { name: '비판적 사고' },
                created_at: '2024-01-01T10:00:00Z',
                is_public: false,
              },
              {
                id: 'journal-2',
                title: '사진 일지',
                journal_type: 'photo',
                category: { name: '창의적 사고' },
                created_at: '2024-01-02T10:00:00Z',
                is_public: true,
              },
            ],
            total: 2,
          }),
        });
      });
    });

    test('should display journal list', async ({ page }) => {
      await page.goto('/training/journals');

      await expect(page.getByText('내 훈련 일지')).toBeVisible();
      await expect(page.getByText('비판적 사고 훈련 일지')).toBeVisible();
      await expect(page.getByText('사진 일지')).toBeVisible();
    });

    test('should show journal type indicators', async ({ page }) => {
      await page.goto('/training/journals');

      await expect(page.getByText('📋')).toBeVisible(); // Structured journal icon
      await expect(page.getByText('📷')).toBeVisible(); // Photo journal icon
    });

    test('should filter journals by category', async ({ page }) => {
      await page.goto('/training/journals');

      // Open filter dropdown
      const filterButton = page.getByText('카테고리 필터');
      await filterButton.click();

      // Select category
      await page.getByText('비판적 사고').click();

      // Should show only filtered journals
      await expect(page.getByText('비판적 사고 훈련 일지')).toBeVisible();
    });

    test('should navigate to journal detail', async ({ page }) => {
      await page.goto('/training/journals');

      const journalLink = page.getByText('비판적 사고 훈련 일지');
      await journalLink.click();

      await expect(page).toHaveURL('/training/journals/journal-1');
    });
  });

  test.describe('Progress Tracking Integration', () => {
    test('should update progress after journal submission', async ({
      page,
    }) => {
      // Mock progress update
      let progressUpdateCalled = false;
      await page.route('**/api/training/progress', route => {
        if (route.request().method() === 'POST') {
          progressUpdateCalled = true;
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              progress: { completion_rate: 67 },
            }),
          });
        } else {
          route.continue();
        }
      });

      await page.goto('/training/journal/new/structured?categoryId=cat-1');

      // Complete and submit journal
      const titleInput = page.getByPlaceholder('일지 제목을 입력하세요');
      await titleInput.fill('테스트 일지');

      const firstTaskCheckbox = page.getByLabelText('1. 기사 요약하기');
      await firstTaskCheckbox.click();
      await page.getByText('완료').click();

      await page.getByText('💾 일지 저장').click();

      // Progress should be updated
      expect(progressUpdateCalled).toBe(true);
    });

    test('should display real-time progress updates', async ({ page }) => {
      await page.goto('/training');

      // Should show current progress
      await expect(page.getByText('33%')).toBeVisible(); // From mocked progress data
      await expect(page.getByText('2일 연속')).toBeVisible();
    });
  });

  test.describe('Journal Editing and Management', () => {
    test.beforeEach(async ({ page }) => {
      // Mock journal detail
      await page.route('**/api/training/journals/journal-1', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'journal-1',
            title: '편집 테스트 일지',
            journal_type: 'structured',
            category: { name: '비판적 사고' },
            task_completions: [
              {
                task_template_id: 'task-1',
                is_completed: true,
                completion_note: '완료된 태스크',
              },
            ],
            reflection: '기존 성찰 내용',
            created_at: '2024-01-01T10:00:00Z',
            is_public: false,
          }),
        });
      });

      // Mock journal update
      await page.route('**/api/training/journals/journal-1', route => {
        if (route.request().method() === 'PUT') {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              journal: {
                id: 'journal-1',
                title: '수정된 일지',
                updated_at: new Date().toISOString(),
              },
            }),
          });
        } else {
          route.continue();
        }
      });
    });

    test('should edit existing journal', async ({ page }) => {
      await page.goto('/training/journals/journal-1/edit');

      // Should load existing data
      await expect(page.getByDisplayValue('편집 테스트 일지')).toBeVisible();
      await expect(page.getByDisplayValue('기존 성찰 내용')).toBeVisible();

      // Edit title
      const titleInput = page.getByDisplayValue('편집 테스트 일지');
      await titleInput.clear();
      await titleInput.fill('수정된 일지 제목');

      // Edit reflection
      const reflectionTextarea = page.getByDisplayValue('기존 성찰 내용');
      await reflectionTextarea.clear();
      await reflectionTextarea.fill('수정된 성찰 내용');

      // Save changes
      await page.getByText('변경사항 저장').click();

      // Should show success message
      await expect(
        page.getByText('일지가 성공적으로 수정되었습니다')
      ).toBeVisible();
    });

    test('should handle unsaved changes warning', async ({ page }) => {
      await page.goto('/training/journals/journal-1/edit');

      // Make changes
      const titleInput = page.getByDisplayValue('편집 테스트 일지');
      await titleInput.clear();
      await titleInput.fill('변경된 제목');

      // Try to navigate away
      await page.getByText('취소').click();

      // Should show confirmation dialog
      await expect(
        page.getByText('저장하지 않은 변경사항이 있습니다')
      ).toBeVisible();
      await expect(page.getByText('정말로 나가시겠습니까?')).toBeVisible();
    });

    test('should delete journal with confirmation', async ({ page }) => {
      // Mock delete endpoint
      await page.route('**/api/training/journals/journal-1', route => {
        if (route.request().method() === 'DELETE') {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              message: '일지가 휴지통으로 이동되었습니다',
            }),
          });
        } else {
          route.continue();
        }
      });

      await page.goto('/training/journals/journal-1');

      // Click delete button
      await page.getByText('삭제').click();

      // Should show confirmation dialog
      await expect(page.getByText('일지 삭제 확인')).toBeVisible();
      await expect(
        page.getByText('이 일지를 휴지통으로 이동하시겠습니까?')
      ).toBeVisible();

      // Confirm deletion
      await page.getByText('휴지통으로 이동').click();

      // Should show success message
      await expect(
        page.getByText('일지가 휴지통으로 이동되었습니다')
      ).toBeVisible();
    });

    test('should restore journal from trash', async ({ page }) => {
      // Mock trash list
      await page.route('**/api/training/journals/trash', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            journals: [
              {
                id: 'journal-1',
                title: '삭제된 일지',
                deleted_at: '2024-01-01T10:00:00Z',
                category: { name: '비판적 사고' },
              },
            ],
          }),
        });
      });

      // Mock restore endpoint
      await page.route('**/api/training/journals/journal-1/restore', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: '일지가 복원되었습니다',
          }),
        });
      });

      await page.goto('/training/journals/trash');

      // Should show deleted journals
      await expect(page.getByText('삭제된 일지')).toBeVisible();

      // Click restore
      await page.getByText('복원').click();

      // Should show success message
      await expect(page.getByText('일지가 복원되었습니다')).toBeVisible();
    });
  });

  test.describe('Advanced Progress Tracking', () => {
    test.beforeEach(async ({ page }) => {
      // Mock detailed progress data
      await page.route('**/api/training/progress**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            currentWeek: {
              id: 'progress-1',
              user_id: 'test-user-1',
              category_id: 'cat-1',
              week_start_date: '2024-01-01',
              target_count: 3,
              completed_count: 2,
              completion_rate: 67,
              current_streak: 5,
              best_streak: 8,
              last_entry_date: '2024-01-03',
            },
            history: [
              {
                week_start_date: '2023-12-25',
                completion_rate: 100,
                completed_count: 3,
              },
              {
                week_start_date: '2024-01-01',
                completion_rate: 67,
                completed_count: 2,
              },
            ],
            analysis: {
              trends: ['improving'],
              averageCompletionRate: 83,
              improvementTrend: 'positive',
              consistencyScore: 75,
            },
            achievements: [
              {
                id: 'streak-5',
                title: '5일 연속 달성',
                description: '5일 연속으로 일지를 작성했습니다',
                earned_at: '2024-01-03T10:00:00Z',
              },
            ],
            totalJournals: 12,
          }),
        });
      });
    });

    test('should display comprehensive progress dashboard', async ({
      page,
    }) => {
      await page.goto('/training/progress?categoryId=cat-1');

      // Should show current week progress
      await expect(page.getByText('이번 주 진행률')).toBeVisible();
      await expect(page.getByText('67%')).toBeVisible();
      await expect(page.getByText('2/3 완료')).toBeVisible();

      // Should show streak information
      await expect(page.getByText('현재 연속 기록')).toBeVisible();
      await expect(page.getByText('5일')).toBeVisible();
      await expect(page.getByText('최고 기록: 8일')).toBeVisible();

      // Should show progress chart
      await expect(page.getByText('주간 진행률 차트')).toBeVisible();

      // Should show achievements
      await expect(page.getByText('달성한 배지')).toBeVisible();
      await expect(page.getByText('5일 연속 달성')).toBeVisible();
    });

    test('should show progress comparison with previous periods', async ({
      page,
    }) => {
      await page.goto('/training/progress?categoryId=cat-1');

      // Should show comparison metrics
      await expect(page.getByText('지난 주 대비')).toBeVisible();
      await expect(page.getByText('평균 완성률')).toBeVisible();
      await expect(page.getByText('83%')).toBeVisible();

      // Should show trend indicators
      await expect(page.getByText('개선 추세')).toBeVisible();
      await expect(page.getByText('상승세')).toBeVisible();
    });

    test('should provide goal completion predictions', async ({ page }) => {
      // Mock prediction data
      await page.route('**/api/training/progress/prediction**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            willComplete: true,
            daysNeeded: 2,
            confidence: 85,
            recommendation: '현재 페이스를 유지하면 목표 달성이 가능해요!',
          }),
        });
      });

      await page.goto('/training/progress?categoryId=cat-1');

      // Should show prediction
      await expect(page.getByText('목표 달성 예측')).toBeVisible();
      await expect(page.getByText('85% 확률로 달성 가능')).toBeVisible();
      await expect(page.getByText('2일 더 필요')).toBeVisible();
      await expect(
        page.getByText('현재 페이스를 유지하면 목표 달성이 가능해요!')
      ).toBeVisible();
    });

    test('should handle progress updates in real-time', async ({ page }) => {
      await page.goto('/training');

      // Initial progress
      await expect(page.getByText('67%')).toBeVisible();

      // Create a new journal
      await page.getByText('새 일지 작성').click();
      await page.getByText('양식 작성하기').click();

      // Fill and submit
      const titleInput = page.getByPlaceholder('일지 제목을 입력하세요');
      await titleInput.fill('실시간 업데이트 테스트');

      const firstTaskCheckbox = page.getByLabelText('1. 기사 요약하기');
      await firstTaskCheckbox.click();
      await page.getByText('완료').click();

      await page.getByText('💾 일지 저장').click();

      // Progress should update
      await expect(page.getByText('100%')).toBeVisible();
      await expect(page.getByText('3/3 완료')).toBeVisible();
    });
  });

  test.describe('Error Handling and Recovery', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      // Mock API error
      await page.route('**/api/training/journals/structured', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: '서버 오류가 발생했습니다',
          }),
        });
      });

      await page.goto('/training/journal/new/structured?categoryId=cat-1');

      // Fill and submit form
      const titleInput = page.getByPlaceholder('일지 제목을 입력하세요');
      await titleInput.fill('테스트 일지');

      const firstTaskCheckbox = page.getByLabelText('1. 기사 요약하기');
      await firstTaskCheckbox.click();
      await page.getByText('완료').click();

      await page.getByText('💾 일지 저장').click();

      // Should show error message
      await expect(page.getByText('서버 오류가 발생했습니다')).toBeVisible();

      // Should show retry option
      await expect(page.getByText('다시 시도')).toBeVisible();
    });

    test('should handle network errors with offline support', async ({
      page,
    }) => {
      // Simulate network failure
      await page.route('**/api/**', route => {
        route.abort('failed');
      });

      await page.goto('/training/journal/new/structured?categoryId=cat-1');

      // Should show network error handling
      await expect(page.getByText('네트워크 오류')).toBeVisible();
      await expect(page.getByText('오프라인 모드로 전환됩니다')).toBeVisible();

      // Should still allow form filling
      const titleInput = page.getByPlaceholder('일지 제목을 입력하세요');
      await titleInput.fill('오프라인 일지');

      // Should show offline save option
      await expect(page.getByText('📱 오프라인 저장')).toBeVisible();
    });

    test('should recover from validation errors', async ({ page }) => {
      await page.goto('/training/journal/new/structured?categoryId=cat-1');

      // Submit without required fields
      await page.getByText('💾 일지 저장').click();

      // Should show validation errors
      await expect(page.getByText('제목을 입력해주세요')).toBeVisible();
      await expect(
        page.getByText('최소 하나의 태스크를 완료해주세요')
      ).toBeVisible();

      // Fix errors
      const titleInput = page.getByPlaceholder('일지 제목을 입력하세요');
      await titleInput.fill('수정된 일지');

      const firstTaskCheckbox = page.getByLabelText('1. 기사 요약하기');
      await firstTaskCheckbox.click();
      await page.getByText('완료').click();

      // Errors should disappear
      await expect(page.getByText('제목을 입력해주세요')).not.toBeVisible();
      await expect(
        page.getByText('최소 하나의 태스크를 완료해주세요')
      ).not.toBeVisible();

      // Should be able to submit
      await page.getByText('💾 일지 저장').click();
      await expect(page).toHaveURL(/\/training/);
    });

    test('should handle file upload errors in photo journals', async ({
      page,
    }) => {
      await page.goto('/training/journal/new/photo?categoryId=cat-1');

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

      // Try to upload large file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(
        path.join(__dirname, 'fixtures', 'test-image.jpg')
      );

      await page.getByText('일지 제출').click();

      // Should show file size error
      await expect(
        page.getByText('파일 크기가 너무 큽니다 (최대 10MB)')
      ).toBeVisible();

      // Should suggest compression
      await expect(page.getByText('이미지 압축하기')).toBeVisible();
    });

    test('should handle session expiration', async ({ page }) => {
      // Mock session expiration
      await page.route('**/api/training/journals/structured', route => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            error: '세션이 만료되었습니다',
          }),
        });
      });

      await page.goto('/training/journal/new/structured?categoryId=cat-1');

      // Fill form
      const titleInput = page.getByPlaceholder('일지 제목을 입력하세요');
      await titleInput.fill('세션 만료 테스트');

      const firstTaskCheckbox = page.getByLabelText('1. 기사 요약하기');
      await firstTaskCheckbox.click();
      await page.getByText('완료').click();

      await page.getByText('💾 일지 저장').click();

      // Should show session expiration message
      await expect(page.getByText('세션이 만료되었습니다')).toBeVisible();
      await expect(page.getByText('다시 로그인해주세요')).toBeVisible();

      // Should preserve form data
      await expect(titleInput).toHaveValue('세션 만료 테스트');
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/training/journal/new?categoryId=cat-1');

      // Should display properly on mobile
      await expect(page.getByText('📝 훈련 일지 작성하기')).toBeVisible();

      // Cards should stack vertically
      const structuredCard = page.locator('text=양식 작성하기').locator('..');
      const photoCard = page.locator('text=사진 업로드').locator('..');

      const structuredBox = await structuredCard.boundingBox();
      const photoBox = await photoCard.boundingBox();

      // Photo card should be below structured card on mobile
      expect(photoBox?.y).toBeGreaterThan(structuredBox?.y || 0);
    });

    test('should work on tablet devices', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/training/journal/new/structured?categoryId=cat-1');

      // Should display properly on tablet
      await expect(page.getByText('📋 구조화된 일지 작성')).toBeVisible();
      await expect(page.getByText('✅ 훈련 태스크 체크리스트')).toBeVisible();
    });
  });
});
