// lib/database/queries.ts
// Think-Habit Journal App - SQL 쿼리 상수 정의

/**
 * Journal 관련 SQL 쿼리 상수들
 */
export const JOURNAL_QUERIES = {
  // ===== INSERT (생성) =====

  INSERT_JOURNAL: `
    INSERT INTO journals (
      id, user_id, type, title, content, tags, 
      sync_status, local_version, created_at, updated_at
    ) VALUES (
      $id, $userId, $type, $title, $content, $tags,
      'local', 1, $createdAt, $updatedAt
    )
  `,

  // ===== SELECT (조회) =====

  SELECT_JOURNAL_BY_ID: `
    SELECT * FROM journals 
    WHERE id = $journalId AND user_id = $userId
  `,

  SELECT_USER_JOURNALS_BASE: `
    SELECT * FROM journals 
    WHERE user_id = $userId
  `,

  SELECT_USER_JOURNALS_WITH_SEARCH: `
    SELECT j.* FROM journals j
    INNER JOIN journals_fts fts ON j.id = fts.journal_id
    WHERE j.user_id = $userId 
    AND journals_fts MATCH $searchText
  `,

  SELECT_UNSYNCED_JOURNALS: `
    SELECT * FROM journals 
    WHERE user_id = $userId 
    AND sync_status IN ('local', 'pending')
    ORDER BY updated_at DESC
  `,

  SELECT_RECENT_JOURNALS: `
    SELECT * FROM recent_journals 
    WHERE user_id = $userId 
    ORDER BY updated_at DESC 
    LIMIT $limit
  `,

  // ===== UPDATE (수정) =====

  UPDATE_JOURNAL_BASIC: `
    UPDATE journals 
    SET title = $title, content = $content, tags = $tags,
        local_version = local_version + 1, sync_status = 'pending'
    WHERE id = $journalId AND user_id = $userId
  `,

  TOGGLE_FAVORITE: `
    UPDATE journals 
    SET is_favorite = NOT is_favorite,
        local_version = local_version + 1, sync_status = 'pending'
    WHERE id = $journalId AND user_id = $userId
  `,

  TOGGLE_ARCHIVE: `
    UPDATE journals 
    SET is_archived = NOT is_archived,
        local_version = local_version + 1, sync_status = 'pending'
    WHERE id = $journalId AND user_id = $userId
  `,

  UPDATE_SYNC_STATUS: `
    UPDATE journals 
    SET sync_status = $syncStatus, 
        server_id = $serverId,
        server_version = $serverVersion,
        synced_at = $syncedAt
    WHERE id = $journalId AND user_id = $userId
  `,

  // ===== DELETE (삭제) =====

  DELETE_JOURNAL: `
    DELETE FROM journals 
    WHERE id = $journalId AND user_id = $userId
  `,

  DELETE_USER_JOURNALS: `
    DELETE FROM journals 
    WHERE user_id = $userId
  `,

  // ===== 권한 및 검증 =====

  CHECK_JOURNAL_ACCESS: `
    SELECT 1 FROM journals 
    WHERE id = $journalId AND user_id = $userId
  `,

  // ===== 검색 =====

  SEARCH_JOURNALS: `
    SELECT j.*, 
           highlight(journals_fts, 1, '<mark>', '</mark>') as title_highlight,
           highlight(journals_fts, 2, '<mark>', '</mark>') as content_highlight
    FROM journals j
    INNER JOIN journals_fts ON j.id = journals_fts.journal_id
    WHERE j.user_id = $userId 
    AND journals_fts MATCH $searchText
    ORDER BY bm25(journals_fts) DESC
    LIMIT $limit
  `,

  // ===== 통계 쿼리들 =====

  GET_USER_STATS: `
    SELECT * FROM user_journal_stats 
    WHERE user_id = $userId
  `,

  COUNT_JOURNALS_BY_TYPE: `
    SELECT type, COUNT(*) as count 
    FROM journals 
    WHERE user_id = $userId AND is_archived = 0
    GROUP BY type
  `,

  COUNT_JOURNALS_BY_SYNC_STATUS: `
    SELECT sync_status, COUNT(*) as count 
    FROM journals 
    WHERE user_id = $userId 
    GROUP BY sync_status
  `,

  GET_COMPLETION_STATS: `
    SELECT 
      COUNT(*) as total_structured_journals,
      AVG(CAST(json_extract(content, '$.completionRate') AS REAL)) as avg_completion_rate,
      COUNT(CASE WHEN json_extract(content, '$.completionRate') = 100 THEN 1 END) as fully_completed
    FROM journals 
    WHERE user_id = $userId 
    AND type = 'structured' 
    AND is_archived = 0
  `,

  GET_STREAK_INFO: `
    WITH RECURSIVE date_series AS (
      SELECT date('now') as check_date, 0 as streak
      UNION ALL
      SELECT date(check_date, '-1 day'), streak + 1
      FROM date_series
      WHERE EXISTS (
        SELECT 1 FROM journals 
        WHERE user_id = $userId 
        AND date(created_at) = date(check_date, '-1 day')
      )
      AND streak < 365
    )
    SELECT MAX(streak) as current_streak FROM date_series
  `,

  // ===== 최근 활동 =====

  GET_RECENT_ACTIVITY: `
    SELECT 
      'journal_created' as activity_type,
      id as item_id,
      title as item_title,
      created_at as activity_date
    FROM journals 
    WHERE user_id = $userId 
    AND created_at >= datetime('now', '-30 days')
    
    UNION ALL
    
    SELECT 
      'journal_updated' as activity_type,
      id as item_id,
      title as item_title,
      updated_at as activity_date
    FROM journals 
    WHERE user_id = $userId 
    AND updated_at >= datetime('now', '-30 days')
    AND updated_at != created_at
    
    ORDER BY activity_date DESC 
    LIMIT $limit
  `,

  // ===== 태그 관련 =====

  GET_POPULAR_TAGS: `
    SELECT 
      tag.value as tag_name,
      COUNT(*) as usage_count
    FROM journals j, json_each(j.tags) as tag
    WHERE j.user_id = $userId 
    AND j.is_archived = 0
    AND tag.value IS NOT NULL
    GROUP BY tag.value
    ORDER BY usage_count DESC, tag_name ASC
    LIMIT $limit
  `,

  GET_JOURNALS_BY_TAG: `
    SELECT j.* FROM journals j, json_each(j.tags) as tag
    WHERE j.user_id = $userId 
    AND tag.value = $tagName
    AND j.is_archived = 0
    ORDER BY j.updated_at DESC
  `,

  // ===== 백업 및 내보내기 =====

  GET_ALL_USER_DATA: `
    SELECT 
      j.*,
      GROUP_CONCAT(jf.file_path) as file_paths
    FROM journals j
    LEFT JOIN journal_files jf ON j.id = jf.journal_id
    WHERE j.user_id = $userId
    GROUP BY j.id
    ORDER BY j.created_at DESC
  `,
} as const;

/**
 * 사용자 관련 SQL 쿼리 상수들
 */
export const USER_QUERIES = {
  INSERT_USER: `
    INSERT INTO users (id, email, name, token, refresh_token, avatar_url, preferences)
    VALUES ($id, $email, $name, $token, $refreshToken, $avatarUrl, $preferences)
  `,

  SELECT_USER_BY_ID: `
    SELECT * FROM users WHERE id = $userId
  `,

  SELECT_USER_BY_EMAIL: `
    SELECT * FROM users WHERE email = $email
  `,

  UPDATE_USER_TOKENS: `
    UPDATE users 
    SET token = $token, refresh_token = $refreshToken, last_sync = $lastSync
    WHERE id = $userId
  `,

  UPDATE_USER_PROFILE: `
    UPDATE users 
    SET name = $name, avatar_url = $avatarUrl, preferences = $preferences
    WHERE id = $userId
  `,

  DELETE_USER: `
    DELETE FROM users WHERE id = $userId
  `,
} as const;

/**
 * 파일 관련 SQL 쿼리 상수들
 */
export const FILE_QUERIES = {
  INSERT_FILE: `
    INSERT INTO journal_files (
      id, journal_id, file_path, file_name, file_size, 
      file_type, mime_type, upload_status
    ) VALUES (
      $id, $journalId, $filePath, $fileName, $fileSize,
      $fileType, $mimeType, $uploadStatus
    )
  `,

  SELECT_FILES_BY_JOURNAL: `
    SELECT * FROM journal_files 
    WHERE journal_id = $journalId 
    ORDER BY created_at ASC
  `,

  UPDATE_FILE_UPLOAD_STATUS: `
    UPDATE journal_files 
    SET upload_status = $uploadStatus, server_url = $serverUrl
    WHERE id = $fileId
  `,

  DELETE_FILE: `
    DELETE FROM journal_files WHERE id = $fileId
  `,

  GET_UNUPLOADED_FILES: `
    SELECT * FROM journal_files 
    WHERE upload_status IN ('local', 'failed')
    ORDER BY created_at ASC
  `,
} as const;

/**
 * 동기화 관련 SQL 쿼리 상수들
 */
export const SYNC_QUERIES = {
  INSERT_SYNC_LOG: `
    INSERT INTO sync_logs (journal_id, sync_type, status, error_message, details)
    VALUES ($journalId, $syncType, $status, $errorMessage, $details)
  `,

  GET_RECENT_SYNC_LOGS: `
    SELECT * FROM sync_logs 
    WHERE journal_id = $journalId 
    ORDER BY created_at DESC 
    LIMIT $limit
  `,

  GET_FAILED_SYNCS: `
    SELECT * FROM sync_logs 
    WHERE status = 'failed' 
    AND created_at >= datetime('now', '-7 days')
    ORDER BY created_at DESC
  `,

  CLEANUP_OLD_SYNC_LOGS: `
    DELETE FROM sync_logs 
    WHERE created_at < datetime('now', '-30 days')
  `,
} as const;

/**
 * 설정 관련 SQL 쿼리 상수들
 */
export const SETTINGS_QUERIES = {
  GET_SETTING: `
    SELECT value FROM app_settings WHERE key = $key
  `,

  SET_SETTING: `
    INSERT OR REPLACE INTO app_settings (key, value) 
    VALUES ($key, $value)
  `,

  GET_ALL_SETTINGS: `
    SELECT key, value FROM app_settings
  `,

  DELETE_SETTING: `
    DELETE FROM app_settings WHERE key = $key
  `,
} as const;
