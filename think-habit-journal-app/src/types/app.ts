// src/types/app.ts
export interface AppJournal {
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
  sync_source: string;
  synced_to_website: boolean;
  image_urls?: string[];
  image_count?: number;
}

export interface AppStats {
  totalJournals: number;
  weeklyJournals: number;
  syncedJournals: number;
  pendingJournals: number;
}

export type Page = "dashboard" | "journal-list" | "journal-create";