// src/api/training/journals.ts
import { supabase } from '../../../lib/supabase';
// 임시 타입 정의 (types/database가 없는 경우)
interface TrainingLogCreateRequest {
  user_id: string;
  category_id: string;
  title: string;
  content: Record<string, any>;
  completion_status: 'draft' | 'completed';
  completed_at?: string;
}

interface TrainingLogUpdateRequest {
  title?: string;
  content?: Record<string, any>;
  completion_status?: 'draft' | 'completed';
  completed_at?: string;
  category_id?: string;
}

export class JournalAPI {
  /**
   * 학습자의 할당받은 카테고리 조회
   */
  static async getAssignedCategories(userId: string) {
    const { data, error } = await supabase
      .from('user_assignments')
      .select(
        `
        *,
        category:categories(*)
      `
      )
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('assigned_at', { ascending: false });

    if (error) throw error;

    // 영역별로 그룹화
    const categoriesByArea = (data || []).reduce(
      (acc: Record<string, any[]>, assignment: any) => {
        const area = assignment.category.area;
        if (!acc[area]) acc[area] = [];
        acc[area].push({
          ...assignment.category,
          assignment_id: assignment.id,
          weekly_goal: assignment.weekly_goal,
          target_period_weeks: assignment.target_period_weeks,
        });
        return acc;
      },
      {}
    );

    return {
      assignments: data || [],
      categoriesByArea,
      totalCategories: data?.length || 0,
    };
  }

  /**
   * 특정 카테고리에 대한 접근 권한 확인
   */
  static async checkCategoryAccess(
    userId: string,
    categoryId: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_assignments')
      .select('id')
      .eq('user_id', userId)
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  }

  /**
   * 훈련 일지 생성
   */
  static async createJournal(request: TrainingLogCreateRequest) {
    // 권한 확인
    const hasAccess = await this.checkCategoryAccess(
      request.user_id,
      request.category_id
    );
    if (!hasAccess) {
      throw new Error('이 카테고리에 대한 훈련 권한이 없습니다.');
    }

    const { data, error } = await supabase
      .from('training_logs')
      .insert({
        ...request,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(
        `
        *,
        category:categories(*),
        user:users(id, name, email)
      `
      )
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * 훈련 일지 수정
   */
  static async updateJournal(
    journalId: string,
    updates: TrainingLogUpdateRequest,
    userId: string
  ) {
    // 소유권 확인
    const { data: existing, error: checkError } = await supabase
      .from('training_logs')
      .select('user_id, category_id')
      .eq('id', journalId)
      .single();

    if (checkError) throw checkError;
    if (existing.user_id !== userId) {
      throw new Error('이 일지를 수정할 권한이 없습니다.');
    }

    // 카테고리 변경 시 권한 재확인
    if (updates.category_id && updates.category_id !== existing.category_id) {
      const hasAccess = await this.checkCategoryAccess(
        userId,
        updates.category_id
      );
      if (!hasAccess) {
        throw new Error('변경하려는 카테고리에 대한 권한이 없습니다.');
      }
    }

    const { data, error } = await supabase
      .from('training_logs')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', journalId)
      .select(
        `
        *,
        category:categories(*),
        user:users(id, name, email)
      `
      )
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * 훈련 일지 목록 조회
   */
  static async getJournals(options: {
    userId: string;
    categoryId?: string;
    status?: 'draft' | 'completed';
    page?: number;
    limit?: number;
  }) {
    const { userId, categoryId, status, page = 1, limit = 10 } = options;

    let query = supabase
      .from('training_logs')
      .select(
        `
        *,
        category:categories(*),
        attachments:training_attachments(*)
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (status) {
      query = query.eq('completion_status', status);
    }

    const { data, error, count } = await query.range(
      (page - 1) * limit,
      page * limit - 1
    );

    if (error) throw error;

    return {
      journals: data || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  /**
   * 단일 훈련 일지 조회
   */
  static async getJournal(journalId: string, userId: string) {
    const { data, error } = await supabase
      .from('training_logs')
      .select(
        `
        *,
        category:categories(*),
        attachments:training_attachments(*),
        user:users(id, name, email)
      `
      )
      .eq('id', journalId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * 훈련 일지 삭제
   */
  static async deleteJournal(journalId: string, userId: string) {
    // 소유권 확인
    const { data: existing, error: checkError } = await supabase
      .from('training_logs')
      .select('user_id')
      .eq('id', journalId)
      .single();

    if (checkError) throw checkError;
    if (existing.user_id !== userId) {
      throw new Error('이 일지를 삭제할 권한이 없습니다.');
    }

    // 첨부파일들도 함께 삭제
    await this.deleteJournalAttachments(journalId);

    const { error } = await supabase
      .from('training_logs')
      .delete()
      .eq('id', journalId);

    if (error) throw error;
    return { success: true };
  }

  /**
   * 첨부파일 업로드
   */
  static async uploadAttachment(file: File, journalId: string, userId: string) {
    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('파일 크기는 10MB를 초과할 수 없습니다.');
    }

    // 허용된 파일 타입 확인
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('지원되지 않는 파일 형식입니다.');
    }

    // 파일명 생성 (유니크)
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${journalId}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

    // Supabase Storage에 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('training-attachments')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // 첨부파일 메타데이터 저장
    const { data, error } = await supabase
      .from('training_attachments')
      .insert({
        training_log_id: journalId,
        file_name: file.name,
        file_path: uploadData.path,
        file_size: file.size,
        file_type: file.type,
        uploaded_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // 공개 URL 생성
    const {
      data: { publicUrl },
    } = supabase.storage
      .from('training-attachments')
      .getPublicUrl(uploadData.path);

    return {
      ...data,
      public_url: publicUrl,
    };
  }

  /**
   * 첨부파일 삭제
   */
  static async deleteAttachment(attachmentId: string, userId: string) {
    // 소유권 확인
    const { data: attachment, error: checkError } = await supabase
      .from('training_attachments')
      .select(
        `
        *,
        training_log:training_logs(user_id)
      `
      )
      .eq('id', attachmentId)
      .single();

    if (checkError) throw checkError;
    if ((attachment as any).training_log.user_id !== userId) {
      throw new Error('이 파일을 삭제할 권한이 없습니다.');
    }

    // Storage에서 파일 삭제
    const { error: deleteError } = await supabase.storage
      .from('training-attachments')
      .remove([(attachment as any).file_path]);

    if (deleteError) throw deleteError;

    // DB에서 메타데이터 삭제
    const { error } = await supabase
      .from('training_attachments')
      .delete()
      .eq('id', attachmentId);

    if (error) throw error;
    return { success: true };
  }

  /**
   * 일지의 모든 첨부파일 삭제
   */
  static async deleteJournalAttachments(journalId: string) {
    const { data: attachments, error: fetchError } = await supabase
      .from('training_attachments')
      .select('file_path')
      .eq('training_log_id', journalId);

    if (fetchError) throw fetchError;

    if (attachments && attachments.length > 0) {
      // Storage에서 파일들 삭제
      const filePaths = attachments.map((att: any) => att.file_path);
      const { error: deleteError } = await supabase.storage
        .from('training-attachments')
        .remove(filePaths);

      if (deleteError) throw deleteError;

      // DB에서 메타데이터 삭제
      const { error } = await supabase
        .from('training_attachments')
        .delete()
        .eq('training_log_id', journalId);

      if (error) throw error;
    }
  }

  /**
   * 진행률 통계 조회
   */
  static async getProgressStats(userId: string, categoryId?: string) {
    let baseQuery = supabase
      .from('training_logs')
      .select('completion_status, created_at, category_id')
      .eq('user_id', userId);

    if (categoryId) {
      baseQuery = baseQuery.eq('category_id', categoryId);
    }

    const { data: logs, error } = await baseQuery;
    if (error) throw error;

    // 전체 통계
    const totalLogs = logs?.length || 0;
    const completedLogs =
      logs?.filter((log: any) => log.completion_status === 'completed')
        .length || 0;
    const draftLogs =
      logs?.filter((log: any) => log.completion_status === 'draft').length || 0;

    // 주간 통계 (최근 4주)
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const recentLogs =
      logs?.filter((log: any) => new Date(log.created_at) >= fourWeeksAgo) ||
      [];

    const weeklyStats = Array.from({ length: 4 }, (_, i) => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() - 7);

      const weekLogs = recentLogs.filter((log: any) => {
        const logDate = new Date(log.created_at);
        return logDate >= weekEnd && logDate < weekStart;
      });

      return {
        week: `${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`,
        completed: weekLogs.filter(
          (log: any) => log.completion_status === 'completed'
        ).length,
        draft: weekLogs.filter((log: any) => log.completion_status === 'draft')
          .length,
        total: weekLogs.length,
      };
    }).reverse();

    // 카테고리별 통계 (전체 조회 시)
    let categoryStats: Record<string, any> = {};
    if (!categoryId) {
      categoryStats = (logs || []).reduce(
        (acc: Record<string, any>, log: any) => {
          const catId = log.category_id;
          if (!acc[catId]) {
            acc[catId] = { total: 0, completed: 0, draft: 0 };
          }
          acc[catId].total++;
          if (log.completion_status === 'completed') {
            acc[catId].completed++;
          } else if (log.completion_status === 'draft') {
            acc[catId].draft++;
          }
          return acc;
        },
        {}
      );
    }

    return {
      overall: {
        total: totalLogs,
        completed: completedLogs,
        draft: draftLogs,
        completionRate: totalLogs > 0 ? (completedLogs / totalLogs) * 100 : 0,
      },
      weekly: weeklyStats,
      byCategory: categoryStats,
    };
  }

  /**
   * 할당 목표 대비 진행률 조회
   */
  static async getGoalProgress(userId: string) {
    // 사용자의 활성 할당 조회
    const { data: assignments, error: assignmentError } = await supabase
      .from('user_assignments')
      .select(
        `
        *,
        category:categories(*)
      `
      )
      .eq('user_id', userId)
      .eq('is_active', true);

    if (assignmentError) throw assignmentError;

    const progressList = await Promise.all(
      (assignments || []).map(async (assignment: any) => {
        // 각 할당의 완료된 로그 수 조회
        const { data: logs, error: logError } = await supabase
          .from('training_logs')
          .select('id, created_at, completion_status')
          .eq('user_id', userId)
          .eq('category_id', assignment.category_id)
          .eq('completion_status', 'completed');

        if (logError) throw logError;

        // 할당 이후 완료된 로그만 계산
        const assignedDate = new Date(assignment.assigned_at);
        const validLogs = (logs || []).filter(
          (log: any) => new Date(log.created_at) >= assignedDate
        );

        // 경과 주수 계산
        const weeksSinceAssigned = Math.floor(
          (Date.now() - assignedDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
        );

        // 목표 대비 진행률 계산
        const expectedTotal = Math.min(
          weeksSinceAssigned * assignment.weekly_goal,
          assignment.target_period_weeks * assignment.weekly_goal
        );

        const actualCompleted = validLogs.length;
        const progressRate =
          expectedTotal > 0 ? (actualCompleted / expectedTotal) * 100 : 0;

        return {
          assignment,
          weeksSinceAssigned,
          expectedTotal,
          actualCompleted,
          progressRate: Math.min(progressRate, 100),
          isOnTrack: actualCompleted >= expectedTotal * 0.8, // 80% 이상이면 정상 진행
          remainingWeeks: Math.max(
            0,
            assignment.target_period_weeks - weeksSinceAssigned
          ),
        };
      })
    );

    return progressList;
  }

  /**
   * 최근 훈련 활동 조회
   */
  static async getRecentActivity(userId: string, limit: number = 10) {
    const { data, error } = await supabase
      .from('training_logs')
      .select(
        `
        *,
        category:categories(name, area)
      `
      )
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
}
