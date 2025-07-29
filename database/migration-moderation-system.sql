-- Moderation System Migration
-- Adds tables for content reporting, user blocking, and audit logging

-- 1. Reports table for content reporting
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reported_content_type VARCHAR(20) NOT NULL CHECK (reported_content_type IN ('comment', 'journal')),
  reported_content_id UUID NOT NULL,
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason VARCHAR(50) NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'harassment', 'offensive', 'other')),
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Prevent duplicate reports from same user for same content
  UNIQUE(reporter_id, reported_content_type, reported_content_id)
);

-- 2. Blocked users table
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  blocked_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  blocked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Prevent duplicate blocks
  UNIQUE(user_id, blocked_user_id)
);

-- 3. Moderation actions audit log
CREATE TABLE IF NOT EXISTS moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  action_type VARCHAR(30) NOT NULL CHECK (action_type IN ('delete_comment', 'delete_journal', 'block_user', 'unblock_user', 'resolve_report', 'dismiss_report')),
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('comment', 'journal', 'user', 'report')),
  target_id UUID NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Add moderation status to comments table
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS hidden_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS hidden_reason TEXT;

-- 5. Add moderation status to journals table
ALTER TABLE journals ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;
ALTER TABLE journals ADD COLUMN IF NOT EXISTS hidden_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE journals ADD COLUMN IF NOT EXISTS hidden_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE journals ADD COLUMN IF NOT EXISTS hidden_reason TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user ON reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_active ON blocked_users(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_moderation_actions_created_at ON moderation_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_moderator ON moderation_actions(moderator_id);
CREATE INDEX IF NOT EXISTS idx_comments_hidden ON comments(is_hidden) WHERE is_hidden = false;
CREATE INDEX IF NOT EXISTS idx_journals_hidden ON journals(is_hidden) WHERE is_hidden = false;

-- RLS Policies for moderation tables

-- Reports: Users can create reports, admins can view all
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" ON reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports" ON reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'teacher')
    )
  );

-- Blocked users: Users can manage their own blocks, admins can view all
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their blocks" ON blocked_users
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all blocks" ON blocked_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'teacher')
    )
  );

-- Moderation actions: Only admins can access
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can access moderation actions" ON moderation_actions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'teacher')
    )
  );