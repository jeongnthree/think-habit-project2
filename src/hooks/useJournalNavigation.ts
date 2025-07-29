import { buildJournalUrl } from '@/utils/route-validation';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

interface NavigationOptions {
  categoryId?: string;
  preserveParams?: boolean;
}

export function useJournalNavigation() {
  const router = useRouter();

  // 훈련 홈으로 이동
  const goToTraining = useCallback(() => {
    router.push('/training');
  }, [router]);

  // 일지 목록으로 이동
  const goToJournalList = useCallback(
    (options?: NavigationOptions) => {
      const url = buildJournalUrl('/training/journals', {
        categoryId: options?.categoryId,
      });
      router.push(url);
    },
    [router]
  );

  // 일지 타입 선택으로 이동
  const goToJournalTypeSelection = useCallback(
    (categoryId: string) => {
      const url = buildJournalUrl('/training/journal/new', { categoryId });
      router.push(url);
    },
    [router]
  );

  // 구조화된 일지 작성으로 이동
  const goToStructuredJournal = useCallback(
    (categoryId: string) => {
      const url = buildJournalUrl('/training/journal/new/structured', {
        categoryId,
      });
      router.push(url);
    },
    [router]
  );

  // 사진 일지 작성으로 이동
  const goToPhotoJournal = useCallback(
    (categoryId: string) => {
      const url = buildJournalUrl('/training/journal/new/photo', {
        categoryId,
      });
      router.push(url);
    },
    [router]
  );

  // 일지 상세 보기로 이동
  const goToJournalDetail = useCallback(
    (journalId: string) => {
      router.push(`/training/journal/${journalId}`);
    },
    [router]
  );

  // 뒤로 가기 (브라우저 히스토리 사용)
  const goBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      // 히스토리가 없으면 훈련 홈으로
      goToTraining();
    }
  }, [router, goToTraining]);

  return {
    goToTraining,
    goToJournalList,
    goToJournalTypeSelection,
    goToStructuredJournal,
    goToPhotoJournal,
    goToJournalDetail,
    goBack,
  };
}
