// src/hooks/useJournalService.ts
import { useEffect, useState } from 'react';
import { rendererJournalService } from '../renderer/services/JournalService';
import { Journal, CreateJournalDto } from '../shared/types';

export interface JournalStats {
  totalJournals: number;
  weeklyJournals: number;
  syncedJournals: number;
  pendingJournals: number;
}

export const useJournalService = (userId?: string) => {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [stats, setStats] = useState<JournalStats>({
    totalJournals: 0,
    weeklyJournals: 0,
    syncedJournals: 0,
    pendingJournals: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load journals for user
  const loadJournals = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const userJournals = rendererJournalService.getUserJournals(userId);
      setJournals(userJournals);
      
      // Get stats
      const journalStats = rendererJournalService.getJournalStats(userId);
      setStats(journalStats);
      
    } catch (err) {
      console.error('Failed to load journals:', err);
      setError(err instanceof Error ? err.message : 'Failed to load journals');
    } finally {
      setLoading(false);
    }
  };

  // Create new journal
  const createJournal = async (data: CreateJournalDto): Promise<Journal | null> => {
    if (!userId) return null;
    
    try {
      setError(null);
      const newJournal = await rendererJournalService.createJournal(userId, data);
      
      // Refresh journals list
      await loadJournals();
      
      return newJournal;
    } catch (err) {
      console.error('Failed to create journal:', err);
      setError(err instanceof Error ? err.message : 'Failed to create journal');
      return null;
    }
  };

  // Delete journal
  const deleteJournal = async (journalId: string): Promise<boolean> => {
    if (!userId) return false;
    
    try {
      setError(null);
      const success = rendererJournalService.deleteJournal(journalId, userId);
      
      if (success) {
        // Refresh journals list
        await loadJournals();
      }
      
      return success;
    } catch (err) {
      console.error('Failed to delete journal:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete journal');
      return false;
    }
  };

  // Get sync status
  const getSyncStatus = () => {
    return rendererJournalService.getSyncStatus();
  };

  // Load journals when userId changes
  useEffect(() => {
    if (userId) {
      loadJournals();
    }
  }, [userId]);

  return {
    journals,
    stats,
    loading,
    error,
    loadJournals,
    createJournal,
    deleteJournal,
    getSyncStatus
  };
};