// lib/journal-service.ts
// Think-Habit Journal App - Journal CRUD 서비스 클래스

// lib/journal-service.ts 확장 부분
// JournalService 클래스에 추가할 동기화 메서드들

import { journalSyncService } from './journal-sync';
import { networkMonitor } from './network-monitor';
import Database from "better-sqlite3";
import { v4 as uuidv4 } from "uuid";
import {
  CreateJournalDto,
  Journal,
  JournalFilter,
  JournalListOptions,
  StructuredContent,
  UpdateJournalDto,
  calculateCompletionRate,
  isStructuredContent,
} from "../shared/types";
import { dbManager } from "./database/connection";
import { JOURNAL_QUERIES } from "./database/queries";
import {
  parseCreateJournalRequest,
  parseUpdateJournalRequest,
} from "./journal-validation";

/**
 * Journal CRUD 서비스 클래스
 */
export class JournalService {
  private static instance: JournalService;
  private db: Database.Database;

  private constructor() {
    this.db = dbManager.getDatabase();
  }

  /**
   * 싱글톤 인스턴스 반환
   */
  public static getInstance(): JournalService {
    if (!JournalService.instance) {
      JournalService.instance = new JournalService();
    }
    return JournalService.instance;
  }

  // ===== CREATE (생성) =====

  /**
   * 새로운 일지 생성
   */
  public async createJournal(
    userId: string,
    data: CreateJournalDto,
  ): Promise<Journal> {
    // 입력 데이터 검증
    const validationResult = parseCreateJournalRequest(data);
    if (!validationResult.success) {
      throw new Error(
        `유효성 검증 실패: ${validationResult.errors.map((e) => e.message).join(", ")}`,
      );
    }

    const validatedData = validationResult.data;

    // 완료율 자동 계산 (구조화된 일지인 경우)
    if (
      validatedData.type === "structured" &&
      isStructuredContent(validatedData.content)
    ) {
      (validatedData.content as StructuredContent).completionRate =
        calculateCompletionRate(
          (validatedData.content as StructuredContent).tasks,
        );
    }

    const journalId = uuidv4();
    const now = new Date();

    try {
      return this.db.transaction(() => {
        // 일지 생성
        const insertStmt = this.db.prepare(JOURNAL_QUERIES.INSERT_JOURNAL);
        insertStmt.run({
          id: journalId,
          userId,
          type: validatedData.type,
          title: validatedData.title,
          content: JSON.stringify(validatedData.content),
          tags: JSON.stringify(validatedData.tags || []),
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });

        // 생성된 일지 반환
        const createdJournal = this.getJournal(journalId, userId);
        if (!createdJournal) {
          throw new Error("일지 생성 후 조회에 실패했습니다");
        }

        return createdJournal;
      })();
    } catch (error) {
      console.error("일지 생성 실패:", error);
      throw new Error(`일지 생성에 실패했습니다: ${error.message}`);
    }
  }

  // ===== READ (조회) =====

  /**
   * 특정 일지 조회
   */
  public getJournal(journalId: string, userId: string): Journal | null {
    try {
      const stmt = this.db.prepare(JOURNAL_QUERIES.SELECT_JOURNAL_BY_ID);
      const row = stmt.get({ journalId, userId });

      if (!row) return null;

      return this.mapRowToJournal(row);
    } catch (error) {
      console.error("일지 조회 실패:", error);
      throw new Error(`일지 조회에 실패했습니다: ${error.message}`);
    }
  }

  /**
   * 사용자의 모든 일지 조회 (필터링 및 정렬 지원)
   */
  public getUserJournals(
    userId: string,
    options: JournalListOptions = {},
  ): Journal[] {
    try {
      const {
        filter = {},
        sort = { sortBy: "updatedAt", order: "desc" },
        pagination,
      } = options;

      // 동적 쿼리 생성
      let query = JOURNAL_QUERIES.SELECT_USER_JOURNALS_BASE;
      const params: any = { userId };
      const conditions: string[] = [];

      // 필터 조건 추가
      if (filter.type) {
        conditions.push("type = $type");
        params.type = filter.type;
      }

      if (filter.syncStatus) {
        conditions.push("sync_status = $syncStatus");
        params.syncStatus = filter.syncStatus;
      }

      if (filter.dateFrom) {
        conditions.push("created_at >= $dateFrom");
        params.dateFrom = filter.dateFrom.toISOString();
      }

      if (filter.dateTo) {
        conditions.push("created_at <= $dateTo");
        params.dateTo = filter.dateTo.toISOString();
      }

      if (filter.isFavorite !== undefined) {
        conditions.push("is_favorite = $isFavorite");
        params.isFavorite = filter.isFavorite ? 1 : 0;
      }

      if (filter.isArchived !== undefined) {
        conditions.push("is_archived = $isArchived");
        params.isArchived = filter.isArchived ? 1 : 0;
      }

      if (filter.tags && filter.tags.length > 0) {
        // JSON 배열에서 태그 검색
        const tagConditions = filter.tags.map(
          (_, index) => `json_extract(tags, '$[*]') LIKE $tag${index}`,
        );
        conditions.push(`(${tagConditions.join(" OR ")})`);

        filter.tags.forEach((tag, index) => {
          params[`tag${index}`] = `%${tag}%`;
        });
      }

      // 검색어 처리 (FTS 사용)
      if (filter.searchText) {
        query = JOURNAL_QUERIES.SELECT_USER_JOURNALS_WITH_SEARCH;
        params.searchText = filter.searchText;
      }

      // WHERE 조건 추가
      if (conditions.length > 0) {
        query += ` AND ${conditions.join(" AND ")}`;
      }

      // 정렬 추가
      const sortColumn = this.getSortColumn(sort.sortBy);
      query += ` ORDER BY ${sortColumn} ${sort.order.toUpperCase()}`;

      // 페이지네이션 추가
      if (pagination) {
        query += ` LIMIT $limit OFFSET $offset`;
        params.limit = pagination.limit;
        params.offset = (pagination.page - 1) * pagination.limit;
      }

      const stmt = this.db.prepare(query);
      const rows = stmt.all(params);

      return rows.map((row) => this.mapRowToJournal(row));
    } catch (error) {
      console.error("사용자 일지 목록 조회 실패:", error);
      throw new Error(`일지 목록 조회에 실패했습니다: ${error.message}`);
    }
  }

  /**
   * 일지 검색 (전문 검색)
   */
  public searchJournals(
    userId: string,
    searchText: string,
    limit: number = 20,
  ): Journal[] {
    try {
      const stmt = this.db.prepare(JOURNAL_QUERIES.SEARCH_JOURNALS);
      const rows = stmt.all({ userId, searchText, limit });

      return rows.map((row) => this.mapRowToJournal(row));
    } catch (error) {
      console.error("일지 검색 실패:", error);
      throw new Error(`일지 검색에 실패했습니다: ${error.message}`);
    }
  }

  // ===== UPDATE (수정) =====

  /**
   * 일지 수정
   */
  public async updateJournal(
    journalId: string,
    userId: string,
    data: UpdateJournalDto,
  ): Promise<Journal> {
    // 권한 확인
    if (!this.validateJournalAccess(journalId, userId)) {
      throw new Error("해당 일지에 대한 접근 권한이 없습니다");
    }

    // 입력 데이터 검증
    const validationResult = parseUpdateJournalRequest(data);
    if (!validationResult.success) {
      throw new Error(
        `유효성 검증 실패: ${validationResult.errors.map((e) => e.message).join(", ")}`,
      );
    }

    const validatedData = validationResult.data;

    // 완료율 자동 계산 (구조화된 일지 콘텐츠가 수정되는 경우)
    if (validatedData.content && isStructuredContent(validatedData.content)) {
      (validatedData.content as StructuredContent).completionRate =
        calculateCompletionRate(
          (validatedData.content as StructuredContent).tasks,
        );
    }

    try {
      return this.db.transaction(() => {
        // 수정할 필드들 준비
        const updateFields: string[] = [];
        const params: any = { journalId, userId };

        if (validatedData.title !== undefined) {
          updateFields.push("title = $title");
          params.title = validatedData.title;
        }

        if (validatedData.content !== undefined) {
          updateFields.push("content = $content");
          params.content = JSON.stringify(validatedData.content);
        }

        if (validatedData.tags !== undefined) {
          updateFields.push("tags = $tags");
          params.tags = JSON.stringify(validatedData.tags);
        }

        if (validatedData.isFavorite !== undefined) {
          updateFields.push("is_favorite = $isFavorite");
          params.isFavorite = validatedData.isFavorite ? 1 : 0;
        }

        if (validatedData.isArchived !== undefined) {
          updateFields.push("is_archived = $isArchived");
          params.isArchived = validatedData.isArchived ? 1 : 0;
        }

        if (updateFields.length === 0) {
          throw new Error("수정할 내용이 없습니다");
        }

        // 버전 및 동기화 상태 업데이트
        updateFields.push("local_version = local_version + 1");
        updateFields.push("sync_status = $syncStatus");
        params.syncStatus = "pending";

        // 업데이트 실행
        const query = `
          UPDATE journals 
          SET ${updateFields.join(", ")}
          WHERE id = $journalId AND user_id = $userId
        `;

        const stmt = this.db.prepare(query);
        const result = stmt.run(params);

        if (result.changes === 0) {
          throw new Error("일지를 찾을 수 없거나 수정 권한이 없습니다");
        }

        // 수정된 일지 반환
        const updatedJournal = this.getJournal(journalId, userId);
        if (!updatedJournal) {
          throw new Error("일지 수정 후 조회에 실패했습니다");
        }

        return updatedJournal;
      })();
    } catch (error) {
      console.error("일지 수정 실패:", error);
      throw new Error(`일지 수정에 실패했습니다: ${error.message}`);
    }
  }

  // ===== DELETE (삭제) =====

  /**
   * 일지 삭제
   */
  public deleteJournal(journalId: string, userId: string): boolean {
    // 권한 확인
    if (!this.validateJournalAccess(journalId, userId)) {
      throw new Error("해당 일지에 대한 접근 권한이 없습니다");
    }

    try {
      return this.db.transaction(() => {
        const stmt = this.db.prepare(JOURNAL_QUERIES.DELETE_JOURNAL);
        const result = stmt.run({ journalId, userId });

        return result.changes > 0;
      })();
    } catch (error) {
      console.error("일지 삭제 실패:", error);
      throw new Error(`일지 삭제에 실패했습니다: ${error.message}`);
    }
  }

  // ===== 헬퍼 메서드들 =====

  /**
   * 데이터베이스 행을 Journal 객체로 변환
   */
  private mapRowToJournal(row: any): Journal {
    try {
      return {
        id: row.id,
        userId: row.user_id,
        type: row.type,
        title: row.title,
        content: JSON.parse(row.content),
        syncStatus: row.sync_status,
        serverId: row.server_id || undefined,
        serverVersion: row.server_version || undefined,
        localVersion: row.local_version || undefined,
        tags: row.tags ? JSON.parse(row.tags) : undefined,
        isFavorite: Boolean(row.is_favorite),
        isArchived: Boolean(row.is_archived),
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        syncedAt: row.synced_at ? new Date(row.synced_at) : undefined,
      };
    } catch (error) {
      console.error("Journal 매핑 실패:", error);
      throw new Error(`데이터 변환에 실패했습니다: ${error.message}`);
    }
  }

  /**
   * 일지 접근 권한 검증
   */
  private validateJournalAccess(journalId: string, userId: string): boolean {
    try {
      const stmt = this.db.prepare(JOURNAL_QUERIES.CHECK_JOURNAL_ACCESS);
      const result = stmt.get({ journalId, userId });
      return !!result;
    } catch (error) {
      console.error("권한 검증 실패:", error);
      return false;
    }
  }

  /**
   * 정렬 컬럼명 매핑
   */
  private getSortColumn(sortBy: string): string {
    const columnMap: Record<string, string> = {
      createdAt: "created_at",
      updatedAt: "updated_at",
      title: "title",
      completionRate: 'json_extract(content, "$.completionRate")',
      syncedAt: "synced_at",
    };

    return columnMap[sortBy] || "updated_at";
  }

  // ===== 통계 및 유틸리티 메서드들 =====

  /**
   * 사용자 일지 개수 조회
   */
  public getUserJournalCount(
    userId: string,
    filter?: Partial<JournalFilter>,
  ): number {
    try {
      let query =
        "SELECT COUNT(*) as count FROM journals WHERE user_id = $userId";
      const params: any = { userId };

      if (filter?.type) {
        query += " AND type = $type";
        params.type = filter.type;
      }

      if (filter?.syncStatus) {
        query += " AND sync_status = $syncStatus";
        params.syncStatus = filter.syncStatus;
      }

      if (filter?.isArchived !== undefined) {
        query += " AND is_archived = $isArchived";
        params.isArchived = filter.isArchived ? 1 : 0;
      }

      const stmt = this.db.prepare(query);
      const result = stmt.get(params) as { count: number };

      return result.count;
    } catch (error) {
      console.error("일지 개수 조회 실패:", error);
      return 0;
    }
  }

  /**
   * 동기화되지 않은 일지 목록 조회
   */
  public getUnsyncedJournals(userId: string): Journal[] {
    try {
      const stmt = this.db.prepare(JOURNAL_QUERIES.SELECT_UNSYNCED_JOURNALS);
      const rows = stmt.all({ userId });

      return rows.map((row) => this.mapRowToJournal(row));
    } catch (error) {
      console.error("미동기화 일지 조회 실패:", error);
      throw new Error(`미동기화 일지 조회에 실패했습니다: ${error.message}`);
    }
  }

  /**
   * 일지 즐겨찾기 토글
   */
  public toggleFavorite(journalId: string, userId: string): boolean {
    if (!this.validateJournalAccess(journalId, userId)) {
      throw new Error("해당 일지에 대한 접근 권한이 없습니다");
    }

    try {
      const stmt = this.db.prepare(JOURNAL_QUERIES.TOGGLE_FAVORITE);
      const result = stmt.run({ journalId, userId });

      return result.changes > 0;
    } catch (error) {
      console.error("즐겨찾기 토글 실패:", error);
      throw new Error(`즐겨찾기 설정에 실패했습니다: ${error.message}`);
    }
  }

  /**
   * 일지 아카이브 토글
   */
  public toggleArchive(journalId: string, userId: string): boolean {
    if (!this.validateJournalAccess(journalId, userId)) {
      throw new Error("해당 일지에 대한 접근 권한이 없습니다");
    }

    try {
      const stmt = this.db.prepare(JOURNAL_QUERIES.TOGGLE_ARCHIVE);
      const result = stmt.run({ journalId, userId });

      return result.changes > 0;
    } catch (error) {
      console.error("아카이브 토글 실패:", error);
      throw new Error(`아카이브 설정에 실패했습니다: ${error.message}`);
    }
  }
}

/**
 * JournalService 싱글톤 인스턴스 내보내기
 */
export const journalService = JournalService.getInstance();




// JournalService 클래스에 추가할 메서드들:

/**
 * 자동 동기화 실행
 */
public async autoSync(): Promise<BatchSyncResult> {
  if (!networkMonitor.isOnline()) {
    console.log('오프라인 상태로 인해 동기화를 건너뜁니다');
    return {
      success: true,
      totalJournals: 0,
      syncedJournals: 0,
      failedJournals: 0,
      conflicts: 0,
      errors: [],
      startedAt: new Date(),
      completedAt: new Date()
    };
  }

  try {
    return await journalSyncService.startAutoSync();
  } catch (error) {
    console.error('자동 동기화 실패:', error);
    throw new Error(`자동 동기화에 실패했습니다: ${error.message}`);
  }
}

/**
 * 특정 일지 수동 동기화
 */
public async syncJournal(journalId: string, userId: string): Promise<SyncResult> {
  // 권한 확인
  if (!this.validateJournalAccess(journalId, userId)) {
    throw new Error('해당 일지에 대한 접근 권한이 없습니다');
  }

  const journal = this.getJournal(journalId, userId);
  if (!journal) {
    throw new Error('일지를 찾을 수 없습니다');
  }

  try {
    return await journalSyncService.syncToServer(journal);
  } catch (error) {
    console.error('일지 동기화 실패:', error);
    throw new Error(`일지 동기화에 실패했습니다: ${error.message}`);
  }
}

/**
 * 동기화 상태 확인
 */
public getSyncStatus(): {
  isOnline: boolean;
  syncInProgress: boolean;
  unsyncedCount: number;
  queueLength: number;
  retryQueueLength: number;
  lastSync?: Date;
} {
  const syncStatus = journalSyncService.getSyncStatus();
  const networkStats = networkMonitor.getNetworkStats();
  
  return {
    isOnline: networkStats.isOnline,
    syncInProgress: syncStatus.inProgress,
    unsyncedCount: this.currentUser ? this.getUserJournalCount(this.currentUser.id, { syncStatus: 'local' }) : 0,
    queueLength: syncStatus.queueLength,
    retryQueueLength: syncStatus.retryQueueLength,
    lastSync: syncStatus.lastSync
  };
}

/**
 * 동기화 진행 상황 모니터링
 */
public onSyncProgress(callback: (progress: SyncProgress) => void): void {
  journalSyncService.onSyncProgress(callback);
}

/**
 * 네트워크 상태 변화 모니터링
 */
public onNetworkChange(callback: (isOnline: boolean) => void): void {
  networkMonitor.onNetworkChange(callback);
}

/**
 * 강제 동기화 (충돌 무시하고 로컬 우선)
 */
public async forceSyncToServer(journalId: string, userId: string): Promise<SyncResult> {
  if (!this.validateJournalAccess(journalId, userId)) {
    throw new Error('해당 일지에 대한 접근 권한이 없습니다');
  }

  const journal = this.getJournal(journalId, userId);
  if (!journal) {
    throw new Error('일지를 찾을 수 없습니다');
  }

  try {
    // 동기화 상태를 pending으로 강제 설정
    this.db.transaction(() => {
      const stmt = this.db.prepare(`
        UPDATE journals 
        SET sync_status = 'pending', local_version = local_version + 1
        WHERE id = ? AND user_id = ?
      `);
      stmt.run(journalId, userId);
    })();

    // 강제 동기화 실행
    const updatedJournal = this.getJournal(journalId, userId)!;
    return await journalSyncService.syncToServer(updatedJournal);
  } catch (error) {
    console.error('강제 동기화 실패:', error);
    throw new Error(`강제 동기화에 실패했습니다: ${error.message}`);
  }
}

/**
 * 서버에서 모든 데이터 다시 가져오기
 */
public async refreshFromServer(userId: string): Promise<Journal[]> {
  if (!networkMonitor.isOnline()) {
    throw new Error('네트워크 연결이 필요합니다');
  }

  try {
    return await journalSyncService.syncFromServer(userId);
  } catch (error) {
    console.error('서버 새로고침 실패:', error);
    throw new Error(`서버에서 데이터를 가져오는데 실패했습니다: ${error.message}`);
  }
}

/**
 * 동기화 설정 관리
 */
public setSyncSettings(settings: {
  autoSync?: boolean;
  syncInterval?: number;
}): void {
  if (settings.autoSync !== undefined) {
    journalSyncService.setAutoSync(settings.autoSync);
    
    // 설정을 데이터베이스에 저장
    const stmt = this.db.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)');
    stmt.run('auto_sync', settings.autoSync.toString());
  }

  if (settings.syncInterval !== undefined) {
    // 동기화 간격 설정 저장
    const stmt = this.db.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)');
    stmt.run('sync_interval', settings.syncInterval.toString());
  }
}

/**
 * 네트워크 연결 품질 테스트
 */
public async testNetworkQuality(): Promise<{
  latency: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'unavailable';
  recommendation: string;
}> {
  const result = await networkMonitor.testConnectionQuality();
  
  let recommendation: string;
  switch (result.quality) {
    case 'excellent':
      recommendation = '네트워크 상태가 매우 좋습니다. 실시간 동기화를 권장합니다.';
      break;
    case 'good':
      recommendation = '네트워크 상태가 좋습니다. 정상적인 동기화가 가능합니다.';
      break;
    case 'fair':
      recommendation = '네트워크 상태가 보통입니다. 배치 동기화를 권장합니다.';
      break;
    case 'poor':
      recommendation = '네트워크 상태가 좋지 않습니다. 중요한 데이터만 동기화하세요.';
      break;
    case 'unavailable':
      recommendation = '네트워크에 연결할 수 없습니다. 오프라인 모드로 작업하세요.';
      break;
  }

  return {
    ...result,
    recommendation
  };
}

/**
 * 동기화 통계 조회
 */
public getSyncStatistics(userId: string): {
  totalJournals: number;
  syncedJournals: number;
  pendingJournals: number;
  localJournals: number;
  conflictJournals: number;
  lastSyncTime?: Date;
  syncSuccess: number;
  syncFailed: number;
} {
  try {
    // 일지별 동기화 상태 통계
    const statusStats = this.db.prepare(`
      SELECT sync_status, COUNT(*) as count 
      FROM journals 
      WHERE user_id = ? 
      GROUP BY sync_status
    `).all(userId) as Array<{ sync_status: string; count: number }>;

    const stats = {
      totalJournals: 0,
      syncedJournals: 0,
      pendingJournals: 0,
      localJournals: 0,
      conflictJournals: 0
    };

    statusStats.forEach(stat => {
      stats.totalJournals += stat.count;
      switch (stat.sync_status) {
        case 'synced':
          stats.syncedJournals = stat.count;
          break;
        case 'pending':
          stats.pendingJournals = stat.count;
          break;
        case 'local':
          stats.localJournals = stat.count;
          break;
        case 'conflict':
          stats.conflictJournals = stat.count;
          break;
      }
    });

    // 최근 동기화 시간
    const lastSyncResult = this.db.prepare(`
      SELECT MAX(synced_at) as last_sync 
      FROM journals 
      WHERE user_id = ? AND synced_at IS NOT NULL
    `).get(userId) as { last_sync: string | null };

    // 동기화 성공/실패 통계 (최근 30일)
    const syncLogStats = this.db.prepare(`
      SELECT status, COUNT(*) as count 
      FROM sync_logs 
      WHERE created_at >= datetime('now', '-30 days')
      GROUP BY status
    `).all() as Array<{ status: string; count: number }>;

    let syncSuccess = 0;
    let syncFailed = 0;
    syncLogStats.forEach(stat => {
      if (stat.status === 'success') {
        syncSuccess = stat.count;
      } else if (stat.status === 'failed') {
        syncFailed = stat.count;
      }
    });

    return {
      ...stats,
      lastSyncTime: lastSyncResult.last_sync ? new Date(lastSyncResult.last_sync) : undefined,
      syncSuccess,
      syncFailed
    };
  } catch (error) {
    console.error('동기화 통계 조회 실패:', error);
    return {
      totalJournals: 0,
      syncedJournals: 0,
      pendingJournals: 0,
      localJournals: 0,
      conflictJournals: 0,
      syncSuccess: 0,
      syncFailed: 0
    };
  }
}