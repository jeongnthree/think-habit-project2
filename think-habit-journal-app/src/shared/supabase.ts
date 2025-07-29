// src/shared/supabase.ts
import { createClient } from "@supabase/supabase-js";

// 환경 변수에서 설정 값 가져오기
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be provided");
}

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// 데이터베이스 타입 정의 (생성된 스키마에 맞춤)
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          full_name: string | null;
          role: string | null;
          avatar_url: string | null;
          preferences: any;
          subscription_status: string;
          last_active: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          email: string;
          full_name?: string | null;
          role?: string | null;
          avatar_url?: string | null;
          preferences?: any;
          subscription_status?: string;
          last_active?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string;
          full_name?: string | null;
          role?: string | null;
          avatar_url?: string | null;
          preferences?: any;
          subscription_status?: string;
          last_active?: string;
        };
      };
      journals: {
        Row: {
          id: string;
          student_id: string;
          category_id: string | null;
          title: string;
          content: any;
          type: string;
          sync_status: string;
          version: number;
          tags: string[];
          is_favorite: boolean;
          is_archived: boolean;
          attachments: string[] | null;
          is_public: boolean | null;
          synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          category_id?: string | null;
          title: string;
          content: any;
          type?: string;
          sync_status?: string;
          version?: number;
          tags?: string[];
          is_favorite?: boolean;
          is_archived?: boolean;
          attachments?: string[] | null;
          is_public?: boolean | null;
          synced_at?: string | null;
        };
        Update: {
          id?: string;
          student_id?: string;
          category_id?: string | null;
          title?: string;
          content?: any;
          type?: string;
          sync_status?: string;
          version?: number;
          tags?: string[];
          is_favorite?: boolean;
          is_archived?: boolean;
          attachments?: string[] | null;
          is_public?: boolean | null;
          synced_at?: string | null;
        };
      };
      file_metadata: {
        Row: {
          id: string;
          journal_id: string;
          user_id: string;
          file_name: string;
          file_size: number;
          file_type: string;
          mime_type: string | null;
          storage_path: string | null;
          thumbnail_path: string | null;
          upload_status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          journal_id: string;
          user_id: string;
          file_name: string;
          file_size: number;
          file_type: string;
          mime_type?: string | null;
          storage_path?: string | null;
          thumbnail_path?: string | null;
          upload_status?: string;
        };
        Update: {
          id?: string;
          journal_id?: string;
          user_id?: string;
          file_name?: string;
          file_size?: number;
          file_type?: string;
          mime_type?: string | null;
          storage_path?: string | null;
          thumbnail_path?: string | null;
          upload_status?: string;
        };
      };
    };
  };
}
