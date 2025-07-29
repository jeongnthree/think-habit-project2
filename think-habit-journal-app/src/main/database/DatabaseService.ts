// src/main/database/DatabaseService.ts
import { supabase } from "../../shared/supabase";

export class DatabaseService {
  // === 사용자 관련 메서드 ===

  async createUserProfile(userData: {
    id: string;
    user_id: string;
    email: string;
    full_name?: string;
  }) {
    const { data, error } = await supabase
      .from("user_profiles")
      .insert(userData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    return data;
  }

  async updateUserProfile(userId: string, updates: any) {
    const { data, error } = await supabase
      .from("user_profiles")
      .update(updates)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // === 저널 관련 메서드 ===

  async createJournal(journalData: {
    student_id: string;
    title: string;
    content: any;
    type?: string;
    tags?: string[];
  }) {
    const { data, error } = await supabase
      .from("journals")
      .insert({
        ...journalData,
        sync_status: "synced",
        version: 1,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getJournals(
    userId: string,
    options?: {
      type?: string;
      limit?: number;
      offset?: number;
      archived?: boolean;
    },
  ) {
    let query = supabase
      .from("journals")
      .select("*")
      .eq("student_id", userId)
      .order("created_at", { ascending: false });

    if (options?.type) {
      query = query.eq("type", options.type);
    }

    if (options?.archived !== undefined) {
      query = query.eq("is_archived", options.archived);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(
        options.offset,
        options.offset + (options.limit || 10) - 1,
      );
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async getJournalById(journalId: string) {
    const { data, error } = await supabase
      .from("journals")
      .select("*")
      .eq("id", journalId)
      .single();

    if (error) throw error;
    return data;
  }

  async updateJournal(journalId: string, updates: any) {
    // 버전 증가
    const currentJournal = await this.getJournalById(journalId);

    const { data, error } = await supabase
      .from("journals")
      .update({
        ...updates,
        version: currentJournal.version + 1,
        sync_status: "synced",
        synced_at: new Date().toISOString(),
      })
      .eq("id", journalId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteJournal(journalId: string) {
    const { error } = await supabase
      .from("journals")
      .delete()
      .eq("id", journalId);

    if (error) throw error;
    return true;
  }

  async toggleJournalFavorite(journalId: string) {
    const journal = await this.getJournalById(journalId);

    const { data, error } = await supabase
      .from("journals")
      .update({ is_favorite: !journal.is_favorite })
      .eq("id", journalId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async archiveJournal(journalId: string, archived: boolean = true) {
    const { data, error } = await supabase
      .from("journals")
      .update({ is_archived: archived })
      .eq("id", journalId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // === 파일 관련 메서드 ===

  async createFileMetadata(fileData: {
    journal_id: string;
    user_id: string;
    file_name: string;
    file_size: number;
    file_type: string;
    mime_type?: string;
    storage_path?: string;
  }) {
    const { data, error } = await supabase
      .from("file_metadata")
      .insert(fileData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getFilesByJournal(journalId: string) {
    const { data, error } = await supabase
      .from("file_metadata")
      .select("*")
      .eq("journal_id", journalId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  }

  async deleteFileMetadata(fileId: string) {
    const { error } = await supabase
      .from("file_metadata")
      .delete()
      .eq("id", fileId);

    if (error) throw error;
    return true;
  }

  // === 검색 메서드 ===

  async searchJournals(userId: string, searchTerm: string) {
    const { data, error } = await supabase
      .from("journals")
      .select("*")
      .eq("student_id", userId)
      .or(`title.ilike.%${searchTerm}%,content->>'text'.ilike.%${searchTerm}%`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  }

  async getJournalsByTags(userId: string, tags: string[]) {
    const { data, error } = await supabase
      .from("journals")
      .select("*")
      .eq("student_id", userId)
      .overlaps("tags", tags)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  }

  // === 통계 메서드 ===

  async getJournalStats(userId: string) {
    const { data: allJournals, error: allError } = await supabase
      .from("journals")
      .select("id, type, is_favorite, is_archived, created_at")
      .eq("student_id", userId);

    if (allError) throw allError;

    const stats = {
      total: allJournals.length,
      structured: allJournals.filter((j) => j.type === "structured").length,
      photo: allJournals.filter((j) => j.type === "photo").length,
      favorites: allJournals.filter((j) => j.is_favorite).length,
      archived: allJournals.filter((j) => j.is_archived).length,
      thisMonth: allJournals.filter((j) => {
        const created = new Date(j.created_at);
        const now = new Date();
        return (
          created.getMonth() === now.getMonth() &&
          created.getFullYear() === now.getFullYear()
        );
      }).length,
    };

    return stats;
  }
}

// 싱글톤 인스턴스 export
export const databaseService = new DatabaseService();
