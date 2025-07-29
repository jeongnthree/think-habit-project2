import { expect, test } from '@playwright/test';

test.describe('Community System Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication - simulate logged in user
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'supabase.auth.token',
        JSON.stringify({
          access_token: 'mock-token',
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
          },
        })
      );
    });
  });

  test.describe('Community Main Page', () => {
    test('should display community page with public journals', async ({
      page,
    }) => {
      // Mock API responses
      await page.route('/api/categories', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              { id: 'cat1', name: '비판적 사고' },
              { id: 'cat2', name: '창의적 사고' },
              { id: 'cat3', name: '감정 조절' },
            ],
          }),
        });
      });

      await page.route('/api/community/journals*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'journal1',
                title: '비판적 사고 훈련 일지',
                content: '오늘은 뉴스 기사를 분석해보았습니다...',
                created_at: '2024-01-15T10:00:00Z',
                category: { id: 'cat1', name: '비판적 사고' },
                author: { id: 'user1', full_name: '김학습' },
                comment_count: 3,
                encouragement_count: 5,
                user_has_encouraged: false,
              },
              {
                id: 'journal2',
                title: '창의적 문제 해결',
                content: '새로운 아이디어를 생각해보는 시간을 가졌습니다...',
                created_at: '2024-01-14T15:30:00Z',
                category: { id: 'cat2', name: '창의적 사고' },
                author: { id: 'user2', full_name: '이창의' },
                comment_count: 1,
                encouragement_count: 2,
                user_has_encouraged: true,
              },
            ],
            pagination: {
              page: 1,
              limit: 10,
              total: 2,
              totalPages: 1,
            },
          }),
        });
      });

      await page.goto('/community');

      // Check page header
      await expect(
        page.getByRole('heading', { name: '커뮤니티' })
      ).toBeVisible();
      await expect(
        page.getByText(
          '다른 학습자들의 훈련 일지를 확인하고 서로 격려해보세요.'
        )
      ).toBeVisible();

      // Check category filters
      await expect(page.getByRole('button', { name: '전체' })).toBeVisible();
      await expect(
        page.getByRole('button', { name: '비판적 사고' })
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: '창의적 사고' })
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: '감정 조절' })
      ).toBeVisible();

      // Check journal cards
      await expect(page.getByText('비판적 사고 훈련 일지')).toBeVisible();
      await expect(page.getByText('창의적 문제 해결')).toBeVisible();
      await expect(page.getByText('김학습')).toBeVisible();
      await expect(page.getByText('이창의')).toBeVisible();

      // Check comment and encouragement counts
      await expect(page.getByText('댓글 3개')).toBeVisible();
      await expect(page.getByText('댓글 1개')).toBeVisible();
      await expect(page.locator('text=5').first()).toBeVisible(); // encouragement count
      await expect(page.locator('text=2').first()).toBeVisible(); // encouragement count
    });

    test('should filter journals by category', async ({ page }) => {
      // Mock category API
      await page.route('/api/categories', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              { id: 'cat1', name: '비판적 사고' },
              { id: 'cat2', name: '창의적 사고' },
            ],
          }),
        });
      });

      // Mock initial journals (all categories)
      await page.route(
        '/api/community/journals?page=1&limit=10',
        async route => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: [
                {
                  id: 'journal1',
                  title: '비판적 사고 일지',
                  content: '내용...',
                  created_at: '2024-01-15T10:00:00Z',
                  category: { id: 'cat1', name: '비판적 사고' },
                  author: { id: 'user1', full_name: '김학습' },
                  comment_count: 0,
                  encouragement_count: 0,
                  user_has_encouraged: false,
                },
                {
                  id: 'journal2',
                  title: '창의적 사고 일지',
                  content: '내용...',
                  created_at: '2024-01-14T15:30:00Z',
                  category: { id: 'cat2', name: '창의적 사고' },
                  author: { id: 'user2', full_name: '이창의' },
                  comment_count: 0,
                  encouragement_count: 0,
                  user_has_encouraged: false,
                },
              ],
              pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
            }),
          });
        }
      );

      // Mock filtered journals (only 비판적 사고)
      await page.route(
        '/api/community/journals?categoryId=cat1&page=1&limit=10',
        async route => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: [
                {
                  id: 'journal1',
                  title: '비판적 사고 일지',
                  content: '내용...',
                  created_at: '2024-01-15T10:00:00Z',
                  category: { id: 'cat1', name: '비판적 사고' },
                  author: { id: 'user1', full_name: '김학습' },
                  comment_count: 0,
                  encouragement_count: 0,
                  user_has_encouraged: false,
                },
              ],
              pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
            }),
          });
        }
      );

      await page.goto('/community');

      // Initially both journals should be visible
      await expect(page.getByText('비판적 사고 일지')).toBeVisible();
      await expect(page.getByText('창의적 사고 일지')).toBeVisible();

      // Click on 비판적 사고 filter
      await page.getByRole('button', { name: '비판적 사고' }).click();

      // Wait for filtered results
      await page.waitForResponse(
        '/api/community/journals?categoryId=cat1&page=1&limit=10'
      );

      // Only 비판적 사고 journal should be visible
      await expect(page.getByText('비판적 사고 일지')).toBeVisible();
      await expect(page.getByText('창의적 사고 일지')).not.toBeVisible();

      // Check that the filter button is highlighted
      await expect(
        page.getByRole('button', { name: '비판적 사고' })
      ).toHaveClass(/bg-blue-600/);
    });

    test('should handle empty state when no journals exist', async ({
      page,
    }) => {
      await page.route('/api/categories', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [{ id: 'cat1', name: '비판적 사고' }],
          }),
        });
      });

      await page.route('/api/community/journals*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
          }),
        });
      });

      await page.goto('/community');

      // Check empty state
      await expect(page.getByText('공개된 일지가 없습니다')).toBeVisible();
      await expect(
        page.getByText('다른 카테고리를 선택하거나 나중에 다시 확인해보세요.')
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: '내 일지 작성하기' })
      ).toBeVisible();
    });

    test('should handle API errors gracefully', async ({ page }) => {
      await page.route('/api/categories', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [{ id: 'cat1', name: '비판적 사고' }],
          }),
        });
      });

      await page.route('/api/community/journals*', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Internal server error',
          }),
        });
      });

      await page.goto('/community');

      // Check error message
      await expect(page.getByText('Internal server error')).toBeVisible();
      await expect(
        page.getByRole('button', { name: '다시 시도' })
      ).toBeVisible();
    });
  });

  test.describe('Journal Detail Page', () => {
    test('should display journal detail with comments and encouragements', async ({
      page,
    }) => {
      // Mock journal detail API
      await page.route('/api/community/journals/journal1', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'journal1',
              student_id: 'user1',
              title: '비판적 사고 훈련 일지',
              content:
                '오늘은 뉴스 기사를 분석해보았습니다. 다양한 관점에서 사실과 의견을 구분하는 연습을 했습니다.',
              attachments: [],
              is_public: true,
              created_at: '2024-01-15T10:00:00Z',
              updated_at: '2024-01-15T10:00:00Z',
              category: {
                id: 'cat1',
                name: '비판적 사고',
                description: '비판적 사고 훈련',
              },
              author: { id: 'user1', full_name: '김학습' },
              comments: [
                {
                  id: 'comment1',
                  journal_id: 'journal1',
                  author_id: 'user2',
                  content: '좋은 분석이네요! 저도 비슷한 경험이 있어요.',
                  comment_type: 'comment',
                  created_at: '2024-01-15T11:00:00Z',
                  author: { id: 'user2', full_name: '이동료', role: 'student' },
                },
                {
                  id: 'comment2',
                  journal_id: 'journal1',
                  author_id: 'teacher1',
                  content:
                    '훌륭한 접근입니다. 다음에는 더 다양한 출처를 활용해보세요.',
                  comment_type: 'advice',
                  created_at: '2024-01-15T12:00:00Z',
                  author: {
                    id: 'teacher1',
                    full_name: '박선생',
                    role: 'teacher',
                  },
                },
              ],
              comment_count: 2,
              encouragement_count: 5,
              user_has_encouraged: false,
            },
          }),
        });
      });

      // Mock current user API
      await page.route('/api/auth/user', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: { id: 'test-user-id', email: 'test@example.com' },
          }),
        });
      });

      await page.goto('/community/journal/journal1');

      // Check journal content
      await expect(
        page.getByRole('heading', { name: '비판적 사고 훈련 일지' })
      ).toBeVisible();
      await expect(page.getByText('김학습')).toBeVisible();
      await expect(page.getByText('비판적 사고').first()).toBeVisible();
      await expect(
        page.getByText('오늘은 뉴스 기사를 분석해보았습니다')
      ).toBeVisible();

      // Check encouragement button
      await expect(
        page.getByRole('button', { name: /격려하기/ })
      ).toBeVisible();
      await expect(page.getByText('5')).toBeVisible(); // encouragement count

      // Check comments section
      await expect(page.getByText('댓글 (2)')).toBeVisible();
      await expect(
        page.getByText('좋은 분석이네요! 저도 비슷한 경험이 있어요.')
      ).toBeVisible();
      await expect(
        page.getByText(
          '훌륭한 접근입니다. 다음에는 더 다양한 출처를 활용해보세요.'
        )
      ).toBeVisible();
      await expect(page.getByText('이동료')).toBeVisible();
      await expect(page.getByText('박선생')).toBeVisible();
      await expect(page.getByText('(선생님)')).toBeVisible();

      // Check comment form
      await expect(page.locator('#comment-type')).toBeVisible();
      await expect(page.locator('#comment-content')).toBeVisible();
      await expect(
        page.getByRole('button', { name: '댓글 작성' })
      ).toBeVisible();
    });

    test('should allow adding comments', async ({ page }) => {
      // Mock journal detail API
      await page.route('/api/community/journals/journal1', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'journal1',
              student_id: 'user1',
              title: '테스트 일지',
              content: '테스트 내용',
              attachments: [],
              is_public: true,
              created_at: '2024-01-15T10:00:00Z',
              updated_at: '2024-01-15T10:00:00Z',
              category: { id: 'cat1', name: '비판적 사고' },
              author: { id: 'user1', full_name: '김학습' },
              comments: [],
              comment_count: 0,
              encouragement_count: 0,
              user_has_encouraged: false,
            },
          }),
        });
      });

      await page.route('/api/auth/user', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: { id: 'test-user-id', email: 'test@example.com' },
          }),
        });
      });

      // Mock comment creation API
      await page.route('/api/community/comments', async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: 'new-comment-id',
                journal_id: 'journal1',
                author_id: 'test-user-id',
                content: '테스트 댓글입니다.',
                comment_type: 'comment',
                created_at: new Date().toISOString(),
                author: {
                  id: 'test-user-id',
                  full_name: '테스트 사용자',
                  role: 'student',
                },
              },
            }),
          });
        }
      });

      await page.goto('/community/journal/journal1');

      // Fill comment form
      await page.locator('#comment-content').fill('테스트 댓글입니다.');

      // Submit comment
      await page.getByRole('button', { name: '댓글 작성' }).click();

      // Wait for API call
      await page.waitForResponse('/api/community/comments');

      // Check if comment appears (this would be handled by React state update)
      await expect(page.getByText('작성 중...')).toBeVisible();
    });

    test('should allow encouraging journals', async ({ page }) => {
      // Mock journal detail API
      await page.route('/api/community/journals/journal1', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'journal1',
              student_id: 'user1',
              title: '테스트 일지',
              content: '테스트 내용',
              attachments: [],
              is_public: true,
              created_at: '2024-01-15T10:00:00Z',
              updated_at: '2024-01-15T10:00:00Z',
              category: { id: 'cat1', name: '비판적 사고' },
              author: { id: 'user1', full_name: '김학습' },
              comments: [],
              comment_count: 0,
              encouragement_count: 3,
              user_has_encouraged: false,
            },
          }),
        });
      });

      await page.route('/api/auth/user', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: { id: 'test-user-id', email: 'test@example.com' },
          }),
        });
      });

      // Mock encouragement API
      await page.route('/api/community/encouragements', async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                journal_id: 'journal1',
                is_encouraged: true,
                encouragement_count: 4,
              },
            }),
          });
        }
      });

      await page.goto('/community/journal/journal1');

      // Check initial state
      await expect(
        page.getByRole('button', { name: /격려하기/ })
      ).toBeVisible();
      await expect(page.getByText('3')).toBeVisible();

      // Click encouragement button
      await page.getByRole('button', { name: /격려하기/ }).click();

      // Wait for API call
      await page.waitForResponse('/api/community/encouragements');

      // Check loading state (encouragement button should show loading)
      await expect(page.getByText('처리 중...')).toBeVisible();
    });

    test('should handle private journal access restriction', async ({
      page,
    }) => {
      await page.route('/api/community/journals/journal1', async route => {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'This journal is not public',
          }),
        });
      });

      await page.goto('/community/journal/journal1');

      // Check access restriction message
      await expect(page.getByText('This journal is not public')).toBeVisible();
      await expect(page.getByText('← 커뮤니티로 돌아가기')).toBeVisible();
    });

    test('should handle journal not found', async ({ page }) => {
      await page.route('/api/community/journals/nonexistent', async route => {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Journal not found',
          }),
        });
      });

      await page.goto('/community/journal/nonexistent');

      // Check error message
      await expect(page.getByText('Journal not found')).toBeVisible();
      await expect(page.getByText('← 커뮤니티로 돌아가기')).toBeVisible();
    });
  });

  test.describe('Complete User Flow', () => {
    test('should complete full community browsing to commenting flow', async ({
      page,
    }) => {
      // Mock all necessary APIs for complete flow
      await page.route('/api/categories', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [{ id: 'cat1', name: '비판적 사고' }],
          }),
        });
      });

      await page.route('/api/community/journals*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'journal1',
                title: '비판적 사고 훈련',
                content: '내용...',
                created_at: '2024-01-15T10:00:00Z',
                category: { id: 'cat1', name: '비판적 사고' },
                author: { id: 'user1', full_name: '김학습' },
                comment_count: 0,
                encouragement_count: 0,
                user_has_encouraged: false,
              },
            ],
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          }),
        });
      });

      await page.route('/api/community/journals/journal1', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'journal1',
              student_id: 'user1',
              title: '비판적 사고 훈련',
              content: '오늘은 비판적 사고 훈련을 했습니다.',
              attachments: [],
              is_public: true,
              created_at: '2024-01-15T10:00:00Z',
              updated_at: '2024-01-15T10:00:00Z',
              category: { id: 'cat1', name: '비판적 사고' },
              author: { id: 'user1', full_name: '김학습' },
              comments: [],
              comment_count: 0,
              encouragement_count: 0,
              user_has_encouraged: false,
            },
          }),
        });
      });

      await page.route('/api/auth/user', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: { id: 'test-user-id', email: 'test@example.com' },
          }),
        });
      });

      await page.route('/api/community/comments', async route => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                id: 'new-comment',
                journal_id: 'journal1',
                author_id: 'test-user-id',
                content: '좋은 일지네요!',
                comment_type: 'comment',
                created_at: new Date().toISOString(),
                author: {
                  id: 'test-user-id',
                  full_name: '테스트 사용자',
                  role: 'student',
                },
              },
            }),
          });
        }
      });

      // Start from community page
      await page.goto('/community');

      // Verify community page loaded
      await expect(
        page.getByRole('heading', { name: '커뮤니티' })
      ).toBeVisible();
      await expect(page.getByText('비판적 사고 훈련')).toBeVisible();

      // Click on journal to view detail
      await page.getByRole('link', { name: '자세히 보기' }).first().click();

      // Verify navigation to detail page
      await expect(page).toHaveURL('/community/journal/journal1');
      await expect(
        page.getByRole('heading', { name: '비판적 사고 훈련' })
      ).toBeVisible();

      // Add a comment
      await page.locator('#comment-content').fill('좋은 일지네요!');
      await page.getByRole('button', { name: '댓글 작성' }).click();

      // Wait for comment submission
      await page.waitForResponse('/api/community/comments');

      // Verify comment form was submitted (loading state)
      await expect(page.getByText('작성 중...')).toBeVisible();

      // Navigate back to community
      await page.getByText('← 커뮤니티로').click();
      await expect(page).toHaveURL('/community');
      await expect(
        page.getByRole('heading', { name: '커뮤니티' })
      ).toBeVisible();
    });
  });

  test.describe('Mobile Responsiveness Testing', () => {
    test('should be responsive on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await page.route('/api/categories', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [{ id: 'cat1', name: '비판적 사고' }],
          }),
        });
      });

      await page.route('/api/community/journals*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'journal1',
                title: '모바일 테스트 일지',
                content: '모바일에서 잘 보이는지 테스트',
                created_at: '2024-01-15T10:00:00Z',
                category: { id: 'cat1', name: '비판적 사고' },
                author: { id: 'user1', full_name: '김학습' },
                comment_count: 2,
                encouragement_count: 5,
                user_has_encouraged: false,
              },
            ],
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          }),
        });
      });

      await page.goto('/community');

      // Check that elements are visible and properly sized on mobile
      await expect(
        page.getByRole('heading', { name: '커뮤니티' })
      ).toBeVisible();
      await expect(page.getByText('모바일 테스트 일지')).toBeVisible();

      // Check that category filters wrap properly on mobile
      await expect(
        page.getByRole('button', { name: '비판적 사고' })
      ).toBeVisible();

      // Check that cards are properly sized
      const journalCard = page.locator('.space-y-6 > div').first();
      await expect(journalCard).toBeVisible();

      // Test navigation on mobile
      await page.getByRole('link', { name: '자세히 보기' }).first().click();
      await expect(page).toHaveURL(/\/community\/journal\/journal1/);
    });

    test('should handle touch interactions properly', async ({ page }) => {
      // Set mobile viewport with touch support
      await page.setViewportSize({ width: 375, height: 667 });

      await page.route('/api/categories', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              { id: 'cat1', name: '비판적 사고' },
              { id: 'cat2', name: '창의적 사고' },
            ],
          }),
        });
      });

      await page.route('/api/community/journals*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
          }),
        });
      });

      await page.goto('/community');

      // Test touch interactions with category filters
      await page.getByRole('button', { name: '비판적 사고' }).tap();
      await expect(
        page.getByRole('button', { name: '비판적 사고' })
      ).toHaveClass(/bg-blue-600/);

      await page.getByRole('button', { name: '창의적 사고' }).tap();
      await expect(
        page.getByRole('button', { name: '창의적 사고' })
      ).toHaveClass(/bg-blue-600/);
    });
  });

  test.describe('Accessibility Testing', () => {
    test('should have proper ARIA labels and keyboard navigation', async ({
      page,
    }) => {
      await page.route('/api/categories', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [{ id: 'cat1', name: '비판적 사고' }],
          }),
        });
      });

      await page.route('/api/community/journals*', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 'journal1',
                title: '접근성 테스트 일지',
                content: '접근성 테스트 내용',
                created_at: '2024-01-15T10:00:00Z',
                category: { id: 'cat1', name: '비판적 사고' },
                author: { id: 'user1', full_name: '김학습' },
                comment_count: 0,
                encouragement_count: 0,
                user_has_encouraged: false,
              },
            ],
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          }),
        });
      });

      await page.goto('/community');

      // Check heading structure
      await expect(
        page.getByRole('heading', { name: '커뮤니티', level: 1 })
      ).toBeVisible();

      // Check that buttons are keyboard accessible
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(
        () => document.activeElement?.textContent
      );
      expect(focusedElement).toContain('비판적 사고');

      // Check that links have proper roles
      await expect(
        page.getByRole('link', { name: '자세히 보기' })
      ).toBeVisible();
    });

    test('should work with screen readers', async ({ page }) => {
      await page.route('/api/categories', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [{ id: 'cat1', name: '비판적 사고' }],
          }),
        });
      });

      await page.route('/api/community/journals/journal1', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 'journal1',
              student_id: 'user1',
              title: '스크린 리더 테스트',
              content: '스크린 리더 접근성 테스트',
              attachments: [],
              is_public: true,
              created_at: '2024-01-15T10:00:00Z',
              updated_at: '2024-01-15T10:00:00Z',
              category: { id: 'cat1', name: '비판적 사고' },
              author: { id: 'user1', full_name: '김학습' },
              comments: [],
              comment_count: 0,
              encouragement_count: 0,
              user_has_encouraged: false,
            },
          }),
        });
      });

      await page.route('/api/auth/user', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: { id: 'test-user-id', email: 'test@example.com' },
          }),
        });
      });

      await page.goto('/community/journal/journal1');

      // Check that form labels are properly associated
      await expect(page.locator('label[for="comment-type"]')).toBeVisible();
      await expect(page.locator('label[for="comment-content"]')).toBeVisible();

      // Check that form controls have proper labels
      const commentTypeSelect = page.locator('#comment-type');
      await expect(commentTypeSelect).toHaveAttribute('id', 'comment-type');

      const commentTextarea = page.locator('#comment-content');
      await expect(commentTextarea).toHaveAttribute('id', 'comment-content');
    });
  });

  test.describe('Performance and Load Testing', () => {
    test('should handle large number of journals efficiently', async ({
      page,
    }) => {
      // Generate mock data for 50 journals
      const mockJournals = Array.from({ length: 50 }, (_, i) => ({
        id: `journal${i + 1}`,
        title: `테스트 일지 ${i + 1}`,
        content: `테스트 내용 ${i + 1}...`,
        created_at: new Date(Date.now() - i * 86400000).toISOString(),
        category: { id: 'cat1', name: '비판적 사고' },
        author: { id: `user${i + 1}`, full_name: `사용자${i + 1}` },
        comment_count: Math.floor(Math.random() * 10),
        encouragement_count: Math.floor(Math.random() * 20),
        user_has_encouraged: Math.random() > 0.5,
      }));

      await page.route('/api/categories', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [{ id: 'cat1', name: '비판적 사고' }],
          }),
        });
      });

      await page.route('/api/community/journals*', async route => {
        // Simulate pagination
        const url = new URL(route.request().url());
        const page_num = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const start = (page_num - 1) * limit;
        const end = start + limit;

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: mockJournals.slice(start, end),
            pagination: {
              page: page_num,
              limit,
              total: mockJournals.length,
              totalPages: Math.ceil(mockJournals.length / limit),
            },
          }),
        });
      });

      const startTime = Date.now();
      await page.goto('/community');

      // Wait for initial load
      await expect(
        page.getByRole('heading', { name: '커뮤니티' })
      ).toBeVisible();
      await expect(page.getByText('테스트 일지 1').first()).toBeVisible();

      const loadTime = Date.now() - startTime;

      // Verify reasonable load time (should be under 3 seconds)
      expect(loadTime).toBeLessThan(3000);

      // Test pagination performance
      const paginationStartTime = Date.now();
      await page.getByRole('button', { name: /더 보기/ }).click();

      // Wait for more journals to load
      await page.waitForResponse('/api/community/journals*');
      await expect(page.getByText('테스트 일지 11')).toBeVisible();

      const paginationTime = Date.now() - paginationStartTime;

      // Pagination should be fast (under 1 second)
      expect(paginationTime).toBeLessThan(1000);
    });

    test('should handle network errors and recovery', async ({ page }) => {
      let failCount = 0;

      await page.route('/api/categories', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [{ id: 'cat1', name: '비판적 사고' }],
          }),
        });
      });

      await page.route('/api/community/journals*', async route => {
        failCount++;
        if (failCount <= 2) {
          // Fail first 2 requests
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: 'Network error',
            }),
          });
        } else {
          // Succeed on 3rd request
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: [
                {
                  id: 'journal1',
                  title: '복구된 일지',
                  content: '내용...',
                  created_at: '2024-01-15T10:00:00Z',
                  category: { id: 'cat1', name: '비판적 사고' },
                  author: { id: 'user1', full_name: '김학습' },
                  comment_count: 0,
                  encouragement_count: 0,
                  user_has_encouraged: false,
                },
              ],
              pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
            }),
          });
        }
      });

      await page.goto('/community');

      // Should show error initially
      await expect(page.getByText('Network error')).toBeVisible();
      await expect(
        page.getByRole('button', { name: '다시 시도' })
      ).toBeVisible();

      // Click retry button
      await page.getByRole('button', { name: '다시 시도' }).click();

      // Should still show error on second attempt
      await expect(page.getByText('Network error')).toBeVisible();

      // Click retry again
      await page.getByRole('button', { name: '다시 시도' }).click();

      // Should succeed on third attempt
      await expect(page.getByText('복구된 일지')).toBeVisible();
      await expect(page.getByText('Network error')).not.toBeVisible();
    });
  });
});
