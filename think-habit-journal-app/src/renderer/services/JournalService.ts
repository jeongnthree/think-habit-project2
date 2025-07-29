// src/renderer/services/JournalService.ts - Renderer process journal service using IPC
import { Journal, CreateJournalDto, JournalStats } from "../../shared/types";

export class RendererJournalService {
  private static instance: RendererJournalService;
  
  public static getInstance(): RendererJournalService {
    if (!RendererJournalService.instance) {
      RendererJournalService.instance = new RendererJournalService();
    }
    return RendererJournalService.instance;
  }

  // Create a new journal
  async createJournal(userId: string, data: CreateJournalDto): Promise<Journal | null> {
    try {
      // For now, create a mock journal object
      const mockJournal: Journal = {
        id: `journal-${Date.now()}`,
        userId,
        type: data.type,
        title: data.title,
        content: data.content as any,
        syncStatus: 'local',
        localVersion: 1,
        tags: data.tags || [],
        isFavorite: false,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Store in localStorage for now (will be replaced with IPC later)
      const journals = this.getStoredJournals();
      journals.push(mockJournal);
      localStorage.setItem('journals', JSON.stringify(journals));

      return mockJournal;
    } catch (error) {
      console.error('Failed to create journal:', error);
      return null;
    }
  }

  // Get all journals for a user
  getUserJournals(userId: string): Journal[] {
    try {
      const journals = this.getStoredJournals();
      return journals.filter(j => j.userId === userId);
    } catch (error) {
      console.error('Failed to get user journals:', error);
      return [];
    }
  }

  // Get journal statistics
  getJournalStats(userId: string): JournalStats {
    try {
      const journals = this.getUserJournals(userId);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      return {
        totalJournals: journals.length,
        weeklyJournals: journals.filter(j => new Date(j.createdAt) >= weekAgo).length,
        syncedJournals: journals.filter(j => j.syncStatus === 'synced').length,
        pendingJournals: journals.filter(j => j.syncStatus === 'pending' || j.syncStatus === 'local').length,
      };
    } catch (error) {
      console.error('Failed to get journal stats:', error);
      return {
        totalJournals: 0,
        weeklyJournals: 0,
        syncedJournals: 0,
        pendingJournals: 0,
      };
    }
  }

  // Delete a journal
  deleteJournal(journalId: string, userId: string): boolean {
    try {
      const journals = this.getStoredJournals();
      const filteredJournals = journals.filter(j => !(j.id === journalId && j.userId === userId));
      
      if (filteredJournals.length < journals.length) {
        localStorage.setItem('journals', JSON.stringify(filteredJournals));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to delete journal:', error);
      return false;
    }
  }

  // Get sync status
  getSyncStatus() {
    return {
      isOnline: navigator.onLine,
      syncInProgress: false,
      unsyncedCount: 0,
      queueLength: 0,
      retryQueueLength: 0
    };
  }

  private getStoredJournals(): Journal[] {
    try {
      const stored = localStorage.getItem('journals');
      if (!stored) return [];
      
      const journals = JSON.parse(stored);
      return journals.map((j: any) => ({
        ...j,
        createdAt: new Date(j.createdAt),
        updatedAt: new Date(j.updatedAt),
        syncedAt: j.syncedAt ? new Date(j.syncedAt) : undefined
      }));
    } catch (error) {
      console.error('Failed to parse stored journals:', error);
      return [];
    }
  }
}

export const rendererJournalService = RendererJournalService.getInstance();