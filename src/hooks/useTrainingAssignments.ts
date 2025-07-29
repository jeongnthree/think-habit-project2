import { Assignment, Category } from '@/types/database';
import { useCallback, useEffect, useState } from 'react';

interface AssignmentWithProgress extends Assignment {
  category: Category;
  weeklyProgress: {
    completed: number;
    target: number;
    percentage: number;
  };
}

interface UseTrainingAssignmentsResult {
  assignments: AssignmentWithProgress[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTrainingAssignments(
  userId: string
): UseTrainingAssignmentsResult {
  const [assignments, setAssignments] = useState<AssignmentWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    if (!userId) {
      setError('사용자 ID가 필요합니다.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/training/assignments?userId=${userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || '할당 목록을 불러오는데 실패했습니다.'
        );
      }

      const data = await response.json();

      if (data.success) {
        setAssignments(data.data || []);
      } else {
        throw new Error(data.error || '할당 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('Error fetching training assignments:', err);
      setError(
        err instanceof Error
          ? err.message
          : '할당 목록을 불러오는데 실패했습니다.'
      );
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  return {
    assignments,
    loading,
    error,
    refetch: fetchAssignments,
  };
}
