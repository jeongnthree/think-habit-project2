import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface JournalSyncData {
  id: string;
  title: string;
  content: string;
  category_id: string;
  category_name: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  user_id: string;
  user_name: string;
  app_version: string;
  sync_source: 'desktop_app' | 'mobile_app' | 'web';
  image_urls?: string[]; // Supabase Storage 이미지 URL 배열
  image_count?: number; // 이미지 개수
}

/**
 * Journal App에서 웹사이트로 일지 동기화
 * POST /api/journals/sync
 */
export async function POST(request: NextRequest) {
  // CORS 헤더 설정
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, User-Agent',
  };

  try {
    const body = await request.json();
    const { journals, user_token } = body;

    // 인증 토큰 검증 (간단한 예시)
    if (!user_token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Supabase 클라이언트 생성
    const supabase = await createClient();

    const syncResults = [];

    for (const journalData of journals as JournalSyncData[]) {
      try {
        // 1. 사용자 확인 (간단한 검증으로 대체)
        // 실제 구현에서는 JWT 토큰 검증이나 다른 인증 방식 사용
        const user = {
          id: journalData.user_id, // auth.users의 실제 ID 사용
          email: 'test@example.com',
          profile: { name: journalData.user_name },
        };

        console.log('Using user:', user);

        // 2. 카테고리 확인/생성
        let { data: category, error: categoryError } = await supabase
          .from('categories')
          .select('id, name')
          .eq('name', journalData.category_name)
          .single();

        if (categoryError || !category) {
          // 카테고리가 없으면 생성
          const { data: newCategory, error: createCategoryError } =
            await supabase
              .from('categories')
              .insert({
                name: journalData.category_name,
                description: `${journalData.category_name} 훈련 카테고리`,
                is_active: true,
              })
              .select()
              .single();

          if (createCategoryError || !newCategory) {
            console.error('Failed to create category:', createCategoryError);
            syncResults.push({
              journal_id: journalData.id,
              success: false,
              error: 'Failed to create category',
            });
            continue;
          }
          category = newCategory;
        }

        // 카테고리 최종 확인
        if (!category) {
          console.error('Category is null after creation attempt');
          syncResults.push({
            journal_id: journalData.id,
            success: false,
            error: 'Category creation failed',
          });
          continue;
        }

        // 3. 기존 일지 확인 (중복 방지)
        const { data: existingJournal } = await supabase
          .from('training_journals')
          .select('id')
          .eq('external_id', journalData.id)
          .eq('user_id', user.id)
          .single();

        if (existingJournal) {
          // 기존 일지 업데이트
          const updateData: any = {
            title: journalData.title,
            content: journalData.content,
            category_id: category.id,
            is_public: journalData.is_public,
            updated_at: journalData.updated_at,
          };

          // 이미지 URL이 있으면 attachments에 저장 (안전하게 처리)
          try {
            if (journalData.image_urls && journalData.image_urls.length > 0) {
              updateData.attachments = journalData.image_urls;
              console.log(
                `📷 일지 ${journalData.id} 업데이트: ${journalData.image_urls.length}개 이미지`
              );
            }
          } catch (imageError) {
            console.warn(
              `⚠️ 일지 ${journalData.id} 이미지 처리 중 오류 (업데이트):`,
              imageError
            );
            // 이미지 처리 실패해도 텍스트 업데이트는 계속 진행
          }

          const { error: updateError } = await supabase
            .from('training_journals')
            .update(updateData)
            .eq('id', existingJournal.id);

          if (updateError) {
            console.error('Failed to update journal:', updateError);
            syncResults.push({
              journal_id: journalData.id,
              success: false,
              error: 'Failed to update journal',
            });
          } else {
            syncResults.push({
              journal_id: journalData.id,
              success: true,
              action: 'updated',
            });
          }
        } else {
          // 새 일지 생성
          const insertData: any = {
            external_id: journalData.id, // 데스크톱 앱의 ID를 external_id로 저장
            title: journalData.title,
            content: journalData.content,
            category_id: category.id,
            user_id: user.id,
            is_public: journalData.is_public,
            sync_source: journalData.sync_source,
            app_version: journalData.app_version,
            created_at: journalData.created_at,
            updated_at: journalData.updated_at,
          };

          // 이미지 URL이 있으면 안전하게 저장
          try {
            if (journalData.image_urls && journalData.image_urls.length > 0) {
              insertData.image_urls = journalData.image_urls;
              insertData.image_count =
                journalData.image_count || journalData.image_urls.length;
              console.log(
                `📷 일지 ${journalData.id} 생성: ${journalData.image_urls.length}개 이미지`
              );
            }
          } catch (imageError) {
            console.warn(
              `⚠️ 일지 ${journalData.id} 이미지 처리 중 오류 (생성):`,
              imageError
            );
            // 이미지 처리 실패해도 텍스트 일지는 생성
          }

          const { error: insertError } = await supabase
            .from('training_journals')
            .insert(insertData);

          if (insertError) {
            console.error('Failed to insert journal:', insertError);
            console.error('Journal data:', journalData);
            console.error('User:', user);
            console.error('Category:', category);
            syncResults.push({
              journal_id: journalData.id,
              success: false,
              error: `Failed to insert journal: ${insertError.message}`,
            });
          } else {
            syncResults.push({
              journal_id: journalData.id,
              success: true,
              action: 'created',
            });

            // 공개 일지인 경우 커뮤니티에도 추가
            if (journalData.is_public) {
              console.log('🔄 커뮤니티 포스트 생성 시도:', {
                title: journalData.title,
                author_id: user.id,
                category_id: category.id,
                is_public: journalData.is_public,
              });

              const communityPostData: any = {
                title: journalData.title,
                content: journalData.content,
                author_id: user.id,
                category_id: category.id,
                post_type: 'journal',
                is_public: true,
                source_journal_id: journalData.id,
                created_at: journalData.created_at,
              };

              // 이미지 URL이 있으면 community_posts에도 저장 (컬럼이 있는 경우)
              if (journalData.image_urls && journalData.image_urls.length > 0) {
                // community_posts 테이블에 attachments 컬럼이 있는지 확인 후 추가
                // 현재는 기본 구조만 사용
              }

              const { error: communityError } = await supabase
                .from('community_posts')
                .insert(communityPostData);

              if (communityError) {
                console.error('❌ 커뮤니티 포스트 생성 실패:', communityError);
              } else {
                console.log('✅ 커뮤니티 포스트 생성 성공');
              }
            }
          }
        }
      } catch (journalError) {
        console.error('Error processing journal:', journalError);
        syncResults.push({
          journal_id: journalData.id,
          success: false,
          error: 'Processing error',
        });
      }
    }

    // 동기화 결과 반환
    const successCount = syncResults.filter(r => r.success).length;
    const failureCount = syncResults.length - successCount;

    return NextResponse.json(
      {
        success: true,
        message: `Sync completed: ${successCount} success, ${failureCount} failed`,
        results: syncResults,
        summary: {
          total: syncResults.length,
          success: successCount,
          failed: failureCount,
        },
      },
      {
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error('Journal sync error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to sync journals',
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

/**
 * CORS preflight 요청 처리
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, User-Agent',
    },
  });
}

/**
 * Journal App에서 동기화 상태 확인
 * GET /api/journals/sync?user_id=xxx&last_sync=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const lastSync = searchParams.get('last_sync');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 마지막 동기화 이후 변경된 일지 확인
    try {
      let query = supabase
        .from('training_journals')
        .select('external_id, updated_at, sync_source')
        .eq('user_id', userId);

      if (lastSync) {
        query = query.gt('updated_at', lastSync);
      }

      const { data: journals, error } = await query;

      if (error) {
        console.error('Supabase query error:', error);
        return NextResponse.json(
          { success: false, error: `Database error: ${error.message}` },
          { status: 500 }
        );
      }

      // journals가 null인 경우 빈 배열로 처리
      const journalList = journals || [];

      return NextResponse.json(
        {
          success: true,
          data: {
            needs_sync: journalList.length > 0,
            changed_journals: journalList,
            last_check: new Date().toISOString(),
          },
        },
        {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers':
              'Content-Type, Authorization, User-Agent',
          },
        }
      );
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Sync status check error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
