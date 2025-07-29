import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 데이터베이스 응답 타입 정의
export interface DatabaseResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

// 페이지네이션 타입
export interface PaginationOptions {
  page?: number;
  limit?: number;
  orderBy?: string;
  ascending?: boolean;
}

// 필터 옵션 타입
export interface FilterOptions {
  [key: string]: any;
}

// Supabase 클라이언트 인스턴스 생성
function getSupabaseClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// 에러 처리 래퍼 함수
function handleDatabaseError(error: any, operation: string): DatabaseResponse {
  console.error(`데이터베이스 ${operation} 오류:`, error);

  // Supabase 특정 에러 코드 처리
  switch (error?.code) {
    case 'PGRST116':
      return {
        success: false,
        error: '요청한 데이터를 찾을 수 없습니다.',
        details: { code: error.code },
      };
    case '23505':
      return {
        success: false,
        error: '이미 존재하는 데이터입니다.',
        details: { code: error.code },
      };
    case '23503':
      return {
        success: false,
        error: '참조된 데이터가 존재하지 않습니다.',
        details: { code: error.code },
      };
    case '42501':
      return {
        success: false,
        error: '권한이 부족합니다.',
        details: { code: error.code },
      };
    default:
      return {
        success: false,
        error: '데이터베이스 작업 중 오류가 발생했습니다.',
        details: error,
      };
  }
}

// ================================
// 사용자 관련 헬퍼 함수
// ================================

export class UserHelpers {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = getSupabaseClient();
  }

  // 사용자 조회 (ID로)
  async getUserById(userId: string): Promise<DatabaseResponse> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return handleDatabaseError(error, '사용자 조회');
      }

      return { success: true, data };
    } catch (error) {
      return handleDatabaseError(error, '사용자 조회');
    }
  }

  // 사용자 조회 (이메일로)
  async getUserByEmail(email: string): Promise<DatabaseResponse> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        return handleDatabaseError(error, '사용자 조회(이메일)');
      }

      return { success: true, data };
    } catch (error) {
      return handleDatabaseError(error, '사용자 조회(이메일)');
    }
  }

  // 사용자 목록 조회 (페이지네이션 지원)
  async getUsers(
    pagination: PaginationOptions = {},
    filters: FilterOptions = {}
  ): Promise<DatabaseResponse> {
    try {
      const {
        page = 1,
        limit = 10,
        orderBy = 'created_at',
        ascending = false,
      } = pagination;
      const offset = (page - 1) * limit;

      let query = this.supabase
        .from('users')
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1)
        .order(orderBy, { ascending });

      // 필터 적용
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      const { data, error, count } = await query;

      if (error) {
        return handleDatabaseError(error, '사용자 목록 조회');
      }

      return {
        success: true,
        data: {
          users: data,
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit),
          },
        },
      };
    } catch (error) {
      return handleDatabaseError(error, '사용자 목록 조회');
    }
  }

  // 사용자 프로필 업데이트
  async updateUserProfile(
    userId: string,
    profileData: any
  ): Promise<DatabaseResponse> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .update({
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return handleDatabaseError(error, '사용자 프로필 업데이트');
      }

      return { success: true, data };
    } catch (error) {
      return handleDatabaseError(error, '사용자 프로필 업데이트');
    }
  }

  // 사용자 상태 변경 (활성화/비활성화)
  async updateUserStatus(
    userId: string,
    status: string
  ): Promise<DatabaseResponse> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return handleDatabaseError(error, '사용자 상태 변경');
      }

      return { success: true, data };
    } catch (error) {
      return handleDatabaseError(error, '사용자 상태 변경');
    }
  }

  // 사용자 통계 조회
  async getUserStats(userId: string): Promise<DatabaseResponse> {
    try {
      // 설문조사 완료 수
      const { count: surveyCount } = await this.supabase
        .from('surveys')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'completed');

      // 훈련 기록 수
      const { count: trainingCount } = await this.supabase
        .from('training_records')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      // 커뮤니티 게시글 수
      const { count: postCount } = await this.supabase
        .from('community_posts')
        .select('*', { count: 'exact' })
        .eq('author_id', userId);

      // 최근 활동일
      const { data: recentActivity } = await this.supabase
        .from('training_records')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      return {
        success: true,
        data: {
          surveysCompleted: surveyCount || 0,
          trainingsCompleted: trainingCount || 0,
          postsCreated: postCount || 0,
          lastActivityAt: recentActivity?.[0]?.created_at || null,
        },
      };
    } catch (error) {
      return handleDatabaseError(error, '사용자 통계 조회');
    }
  }
}

// ================================
// 설문조사 관련 헬퍼 함수
// ================================

export class SurveyHelpers {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = getSupabaseClient();
  }

  // 설문조사 생성
  async createSurvey(surveyData: any): Promise<DatabaseResponse> {
    try {
      const { data, error } = await this.supabase
        .from('surveys')
        .insert([
          {
            ...surveyData,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        return handleDatabaseError(error, '설문조사 생성');
      }

      return { success: true, data };
    } catch (error) {
      return handleDatabaseError(error, '설문조사 생성');
    }
  }

  // 설문조사 조회 (ID로)
  async getSurveyById(surveyId: string): Promise<DatabaseResponse> {
    try {
      const { data, error } = await this.supabase
        .from('surveys')
        .select('*')
        .eq('id', surveyId)
        .single();

      if (error) {
        return handleDatabaseError(error, '설문조사 조회');
      }

      return { success: true, data };
    } catch (error) {
      return handleDatabaseError(error, '설문조사 조회');
    }
  }

  // 사용자별 설문조사 목록 조회
  async getSurveysByUserId(
    userId: string,
    pagination: PaginationOptions = {}
  ): Promise<DatabaseResponse> {
    try {
      const {
        page = 1,
        limit = 10,
        orderBy = 'created_at',
        ascending = false,
      } = pagination;
      const offset = (page - 1) * limit;

      const { data, error, count } = await this.supabase
        .from('surveys')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .range(offset, offset + limit - 1)
        .order(orderBy, { ascending });

      if (error) {
        return handleDatabaseError(error, '사용자 설문조사 목록 조회');
      }

      return {
        success: true,
        data: {
          surveys: data,
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit),
          },
        },
      };
    } catch (error) {
      return handleDatabaseError(error, '사용자 설문조사 목록 조회');
    }
  }

  // 설문조사 업데이트
  async updateSurvey(
    surveyId: string,
    updateData: any
  ): Promise<DatabaseResponse> {
    try {
      const { data, error } = await this.supabase
        .from('surveys')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', surveyId)
        .select()
        .single();

      if (error) {
        return handleDatabaseError(error, '설문조사 업데이트');
      }

      return { success: true, data };
    } catch (error) {
      return handleDatabaseError(error, '설문조사 업데이트');
    }
  }

  // 설문조사 삭제
  async deleteSurvey(surveyId: string): Promise<DatabaseResponse> {
    try {
      const { error } = await this.supabase
        .from('surveys')
        .delete()
        .eq('id', surveyId);

      if (error) {
        return handleDatabaseError(error, '설문조사 삭제');
      }

      return { success: true, data: { message: '설문조사가 삭제되었습니다.' } };
    } catch (error) {
      return handleDatabaseError(error, '설문조사 삭제');
    }
  }

  // 설문조사 통계 조회
  async getSurveyStats(): Promise<DatabaseResponse> {
    try {
      // 전체 설문조사 수
      const { count: totalSurveys } = await this.supabase
        .from('surveys')
        .select('*', { count: 'exact' });

      // 완료된 설문조사 수
      const { count: completedSurveys } = await this.supabase
        .from('surveys')
        .select('*', { count: 'exact' })
        .eq('status', 'completed');

      // 평균 점수 계산
      const { data: avgScores } = await this.supabase
        .from('surveys')
        .select('scores')
        .eq('status', 'completed')
        .not('scores', 'is', null);

      let averageOverallScore = 0;
      if (avgScores && avgScores.length > 0) {
        const totalScore = avgScores.reduce((sum, survey) => {
          return sum + (survey.scores?.overallScore || 0);
        }, 0);
        averageOverallScore = totalScore / avgScores.length;
      }

      return {
        success: true,
        data: {
          totalSurveys: totalSurveys || 0,
          completedSurveys: completedSurveys || 0,
          completionRate: totalSurveys
            ? ((completedSurveys || 0) / totalSurveys) * 100
            : 0,
          averageOverallScore: Math.round(averageOverallScore * 10) / 10,
        },
      };
    } catch (error) {
      return handleDatabaseError(error, '설문조사 통계 조회');
    }
  }
}

// ================================
// 훈련 기록 관련 헬퍼 함수
// ================================

export class TrainingHelpers {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = getSupabaseClient();
  }

  // 훈련 기록 생성
  async createTrainingRecord(trainingData: any): Promise<DatabaseResponse> {
    try {
      const { data, error } = await this.supabase
        .from('training_records')
        .insert([
          {
            ...trainingData,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        return handleDatabaseError(error, '훈련 기록 생성');
      }

      return { success: true, data };
    } catch (error) {
      return handleDatabaseError(error, '훈련 기록 생성');
    }
  }

  // 사용자별 훈련 기록 조회
  async getTrainingRecordsByUserId(
    userId: string,
    pagination: PaginationOptions = {},
    filters: FilterOptions = {}
  ): Promise<DatabaseResponse> {
    try {
      const {
        page = 1,
        limit = 10,
        orderBy = 'created_at',
        ascending = false,
      } = pagination;
      const offset = (page - 1) * limit;

      let query = this.supabase
        .from('training_records')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .range(offset, offset + limit - 1)
        .order(orderBy, { ascending });

      // 필터 적용 (훈련 타입, 날짜 범위 등)
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === 'date_from') {
            query = query.gte('created_at', value);
          } else if (key === 'date_to') {
            query = query.lte('created_at', value);
          } else {
            query = query.eq(key, value);
          }
        }
      });

      const { data, error, count } = await query;

      if (error) {
        return handleDatabaseError(error, '훈련 기록 조회');
      }

      return {
        success: true,
        data: {
          records: data,
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit),
          },
        },
      };
    } catch (error) {
      return handleDatabaseError(error, '훈련 기록 조회');
    }
  }

  // 훈련 기록 업데이트
  async updateTrainingRecord(
    recordId: string,
    updateData: any
  ): Promise<DatabaseResponse> {
    try {
      const { data, error } = await this.supabase
        .from('training_records')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', recordId)
        .select()
        .single();

      if (error) {
        return handleDatabaseError(error, '훈련 기록 업데이트');
      }

      return { success: true, data };
    } catch (error) {
      return handleDatabaseError(error, '훈련 기록 업데이트');
    }
  }

  // 사용자 훈련 통계 조회
  async getTrainingStatsByUserId(userId: string): Promise<DatabaseResponse> {
    try {
      // 총 훈련 세션 수
      const { count: totalSessions } = await this.supabase
        .from('training_records')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);

      // 영역별 훈련 수
      const { data: areaStats } = await this.supabase
        .from('training_records')
        .select('area')
        .eq('user_id', userId);

      const areaCounts =
        areaStats?.reduce((acc: any, record: any) => {
          acc[record.area] = (acc[record.area] || 0) + 1;
          return acc;
        }, {}) || {};

      // 최근 7일 훈련 수
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: recentSessions } = await this.supabase
        .from('training_records')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .gte('created_at', sevenDaysAgo.toISOString());

      return {
        success: true,
        data: {
          totalSessions: totalSessions || 0,
          areaCounts,
          recentSessions: recentSessions || 0,
        },
      };
    } catch (error) {
      return handleDatabaseError(error, '훈련 통계 조회');
    }
  }
}

// ================================
// 접근 로그 관련 헬퍼 함수
// ================================

export class AccessLogHelpers {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = getSupabaseClient();
  }

  // 접근 로그 기록
  async logAccess(logData: {
    accessor_id: string;
    accessed_user_id: string;
    resource_type: string;
    resource_id: string;
    action: string;
  }): Promise<DatabaseResponse> {
    try {
      const { data, error } = await this.supabase
        .from('access_logs')
        .insert([
          {
            ...logData,
            timestamp: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        return handleDatabaseError(error, '접근 로그 기록');
      }

      return { success: true, data };
    } catch (error) {
      return handleDatabaseError(error, '접근 로그 기록');
    }
  }

  // 접근 로그 조회
  async getAccessLogs(
    filters: FilterOptions = {},
    pagination: PaginationOptions = {}
  ): Promise<DatabaseResponse> {
    try {
      const {
        page = 1,
        limit = 20,
        orderBy = 'timestamp',
        ascending = false,
      } = pagination;
      const offset = (page - 1) * limit;

      let query = this.supabase
        .from('access_logs')
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1)
        .order(orderBy, { ascending });

      // 필터 적용
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      const { data, error, count } = await query;

      if (error) {
        return handleDatabaseError(error, '접근 로그 조회');
      }

      return {
        success: true,
        data: {
          logs: data,
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit),
          },
        },
      };
    } catch (error) {
      return handleDatabaseError(error, '접근 로그 조회');
    }
  }
}

// ================================
// 트랜잭션 헬퍼 함수
// ================================

export class TransactionHelpers {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = getSupabaseClient();
  }

  // RPC 함수 호출 헬퍼
  async callFunction(
    functionName: string,
    params: any = {}
  ): Promise<DatabaseResponse> {
    try {
      const { data, error } = await this.supabase.rpc(functionName, params);

      if (error) {
        return handleDatabaseError(error, `함수 호출(${functionName})`);
      }

      return { success: true, data };
    } catch (error) {
      return handleDatabaseError(error, `함수 호출(${functionName})`);
    }
  }

  // 배치 업데이트
  async batchUpdate(
    tableName: string,
    updates: Array<{ id: string; data: any }>
  ): Promise<DatabaseResponse> {
    try {
      const results = [];

      for (const update of updates) {
        const { data, error } = await this.supabase
          .from(tableName)
          .update({
            ...update.data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', update.id)
          .select()
          .single();

        if (error) {
          console.error(`배치 업데이트 오류 (ID: ${update.id}):`, error);
          continue;
        }

        results.push(data);
      }

      return { success: true, data: results };
    } catch (error) {
      return handleDatabaseError(error, '배치 업데이트');
    }
  }
}

// 헬퍼 클래스 인스턴스 내보내기
export const userHelpers = new UserHelpers();
export const surveyHelpers = new SurveyHelpers();
export const trainingHelpers = new TrainingHelpers();
export const accessLogHelpers = new AccessLogHelpers();
export const transactionHelpers = new TransactionHelpers();
