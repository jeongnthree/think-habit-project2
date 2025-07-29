// hooks/useAutoSave.ts
// 자동 저장 기능을 위한 커스텀 훅

import { useEffect, useRef, useCallback, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

interface AutoSaveOptions {
  delay?: number; // 저장 지연 시간 (ms)
  enabled?: boolean; // 자동 저장 활성화 여부
  onSave: (data: any) => Promise<void>; // 저장 함수
  onError?: (error: Error) => void; // 에러 처리 함수
  onSuccess?: () => void; // 저장 성공 시 콜백
}

interface AutoSaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  error: string | null;
}

export function useAutoSave<T>(data: T, options: AutoSaveOptions) {
  const {
    delay = 3000,
    enabled = true,
    onSave,
    onError,
    onSuccess
  } = options;

  const [saveState, setSaveState] = useState<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    hasUnsavedChanges: false,
    error: null
  });

  const lastSavedDataRef = useRef<T>(data);
  const saveInProgressRef = useRef(false);
  const mountedRef = useRef(true);

  // 데이터 변경 감지를 위한 debounced 값
  const debouncedData = useDebounce(data, delay);

  // 수동 저장 함수
  const save = useCallback(async (forceSave = false) => {
    if (!enabled || saveInProgressRef.current) return;

    // 데이터 변경 체크
    const hasChanges = JSON.stringify(data) !== JSON.stringify(lastSavedDataRef.current);
    if (!hasChanges && !forceSave) return;

    saveInProgressRef.current = true;
    setSaveState(prev => ({ 
      ...prev, 
      isSaving: true, 
      error: null 
    }));

    try {
      await onSave(data);
      
      if (mountedRef.current) {
        lastSavedDataRef.current = data;
        setSaveState(prev => ({
          ...prev,
          isSaving: false,
          lastSaved: new Date(),
          hasUnsavedChanges: false,
          error: null
        }));
        onSuccess?.();
      }
    } catch (error) {
      if (mountedRef.current) {
        const errorMessage = error instanceof Error ? error.message : '저장 중 오류가 발생했습니다';
        setSaveState(prev => ({
          ...prev,
          isSaving: false,
          error: errorMessage
        }));
        onError?.(error instanceof Error ? error : new Error(errorMessage));
      }
    } finally {
      saveInProgressRef.current = false;
    }
  }, [data, enabled, onSave, onSuccess, onError]);

  // 자동 저장 효과
  useEffect(() => {
    if (!enabled) return;

    const hasChanges = JSON.stringify(debouncedData) !== JSON.stringify(lastSavedDataRef.current);
    
    if (hasChanges) {
      setSaveState(prev => ({ ...prev, hasUnsavedChanges: true }));
      save();
    }
  }, [debouncedData, enabled, save]);

  // 데이터 변경 감지
  useEffect(() => {
    const hasChanges = JSON.stringify(data) !== JSON.stringify(lastSavedDataRef.current);
    setSaveState(prev => ({ ...prev, hasUnsavedChanges: hasChanges }));
  }, [data]);

  // 컴포넌트 언마운트 시 마지막 저장
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      // 언마운트 시 저장이 필요한 경우
      if (saveState.hasUnsavedChanges && !saveInProgressRef.current) {
        onSave(data).catch(console.error);
      }
    };
  }, [data, onSave, saveState.hasUnsavedChanges]);

  // 페이지 이탈 시 저장
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (saveState.hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = '저장하지 않은 변경사항이 있습니다. 정말 나가시겠습니까?';
        return event.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveState.hasUnsavedChanges]);

  // 키보드 단축키 (Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        save(true); // 강제 저장
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [save]);

  return {
    ...saveState,
    save: () => save(true),
    reset: () => {
      lastSavedDataRef.current = data;
      setSaveState({
        isSaving: false,
        lastSaved: new Date(),
        hasUnsavedChanges: false,
        error: null
      });
    }
  };
}

// useDebounce 훅 (별도 파일에서 import되지만 여기서 정의)
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// 자동 저장 상태 표시용 컴포넌트
export const AutoSaveIndicator: React.FC<{ state: AutoSaveState }> = ({ state }) => {
  if (state.isSaving) {
    return (
      <div className="flex items-center gap-2 text-sm text-blue-600">
        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        저장 중...
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        저장 실패
      </div>
    );
  }

  if (state.hasUnsavedChanges) {
    return (
      <div className="flex items-center gap-2 text-sm text-orange-600">
        <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse" />
        저장되지 않음
      </div>
    );
  }

  if (state.lastSaved) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        {state.lastSaved.toLocaleTimeString('ko-KR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })} 저장됨
      </div>
    );
  }

  return null;
};