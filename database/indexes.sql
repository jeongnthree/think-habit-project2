-- Think-Habit Lite Indexes (간소화)
-- 핵심 성능 최적화에 집중

-- 1. user_profiles 인덱스
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id 
ON user_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_role 
ON user_profiles(role, is_active) WHERE is_active = true;

-- 2. categories 인덱스
CREATE INDEX IF NOT EXISTS idx_categories_active 
ON categories(is_active, name) WHERE is_active = true;

-- 3. assignments 인덱스 (핵심 성능)
CREATE INDEX IF NOT EXISTS idx_assignments_student_active 
ON assignments(student_id, is_active, end_date) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_assignments_category_active 
ON assignments(category_id, is_active) WHERE is_active = true;

-- 4. journals 인덱스 (핵심 성능)
CREATE INDEX IF NOT EXISTS idx_journals_student_date 
ON journals(student_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_journals_category_date 
ON journals(category_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_journals_public 
ON journals(is_public, created_at DESC) WHERE is_public = true AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_journals_type_date 
ON journals(journal_type, created_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_journals_deleted 
ON journals(student_id, deleted_at DESC) WHERE deleted_at IS NOT NULL;

-- 복합 인덱스 for common query patterns
CREATE INDEX IF NOT EXISTS idx_journals_student_category_date 
ON journals(student_id, category_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_journals_public_category_date 
ON journals(category_id, created_at DESC) WHERE is_public = true AND deleted_at IS NULL;

-- 텍스트 검색 최적화
CREATE INDEX IF NOT EXISTS idx_journals_text_search 
ON journals USING gin(to_tsvector('korean', title || ' ' || content)) WHERE deleted_at IS NULL;

-- 5. comments 인덱스
CREATE INDEX IF NOT EXISTS idx_comments_journal 
ON comments(journal_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_comments_author 
ON comments(author_id, created_at DESC);

-- 6. notifications 인덱스
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON notifications(user_id, is_read, created_at DESC);

-- 통계 갱신
ANALYZE user_profiles;
ANALYZE categories;
ANALYZE assignments;
ANALYZE journals;
ANALYZE comments;
ANALYZE notifications;-- 7. t
ask_completions 인덱스 (structured journals)
CREATE INDEX IF NOT EXISTS idx_task_completions_journal 
ON task_completions(journal_id, task_template_id);

CREATE INDEX IF NOT EXISTS idx_task_completions_template 
ON task_completions(task_template_id, is_completed);

-- 8. journal_photos 인덱스 (photo journals)
CREATE INDEX IF NOT EXISTS idx_journal_photos_journal 
ON journal_photos(journal_id, order_index);

-- 9. task_templates 인덱스
CREATE INDEX IF NOT EXISTS idx_task_templates_category 
ON task_templates(category_id, order_index);

-- 10. Progress tracking optimization
CREATE INDEX IF NOT EXISTS idx_journals_progress_tracking 
ON journals(student_id, category_id, created_at) 
WHERE deleted_at IS NULL AND created_at >= CURRENT_DATE - INTERVAL '7 days';

-- 11. Weekly progress calculation optimization
CREATE INDEX IF NOT EXISTS idx_journals_weekly_progress 
ON journals(student_id, category_id, DATE_TRUNC('week', created_at)) 
WHERE deleted_at IS NULL;

-- Update statistics for new indexes
ANALYZE task_completions;
ANALYZE journal_photos;
ANALYZE task_templates;