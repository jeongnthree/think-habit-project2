import { act, renderHook } from '@testing-library/react';
import { useDebounce, useDebouncedCallback } from '../useDebounce';

// 타이머 목킹
jest.useFakeTimers();

describe('useDebounce', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('초기값을 즉시 반환한다', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));

    expect(result.current).toBe('initial');
  });

  it('지연 시간 내에 값이 변경되면 이전 값을 유지한다', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    // 값 변경
    rerender({ value: 'updated', delay: 500 });

    // 지연 시간 전에는 이전 값 유지
    expect(result.current).toBe('initial');

    // 지연 시간의 절반만 경과
    act(() => {
      jest.advanceTimersByTime(250);
    });

    expect(result.current).toBe('initial');
  });

  it('지연 시간 후에 새로운 값을 반환한다', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    // 값 변경
    rerender({ value: 'updated', delay: 500 });

    // 지연 시간 완전 경과
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe('updated');
  });

  it('연속적인 값 변경 시 마지막 값만 적용한다', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    // 첫 번째 변경
    rerender({ value: 'first', delay: 500 });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    // 두 번째 변경 (첫 번째 타이머 취소됨)
    rerender({ value: 'second', delay: 500 });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    // 세 번째 변경 (두 번째 타이머 취소됨)
    rerender({ value: 'final', delay: 500 });

    // 마지막 변경 후 지연 시간 경과
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe('final');
  });
});

describe('useDebouncedCallback', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  it('지연 시간 후에 콜백을 실행한다', () => {
    const mockCallback = jest.fn();
    const { result } = renderHook(() =>
      useDebouncedCallback(mockCallback, 500)
    );

    // 콜백 실행
    act(() => {
      result.current('test');
    });

    // 즉시는 실행되지 않음
    expect(mockCallback).not.toHaveBeenCalled();

    // 지연 시간 후 실행됨
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockCallback).toHaveBeenCalledWith('test');
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it('연속 호출 시 마지막 호출만 실행한다', () => {
    const mockCallback = jest.fn();
    const { result } = renderHook(() =>
      useDebouncedCallback(mockCallback, 500)
    );

    // 연속 호출
    act(() => {
      result.current('first');
    });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    act(() => {
      result.current('second');
    });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    act(() => {
      result.current('final');
    });

    // 마지막 호출 후 지연 시간 경과
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockCallback).toHaveBeenCalledWith('final');
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it('여러 인자를 올바르게 전달한다', () => {
    const mockCallback = jest.fn();
    const { result } = renderHook(() =>
      useDebouncedCallback(mockCallback, 500)
    );

    act(() => {
      result.current('arg1', 'arg2', 123);
    });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockCallback).toHaveBeenCalledWith('arg1', 'arg2', 123);
  });

  it('컴포넌트 언마운트 시 타이머를 정리한다', () => {
    const mockCallback = jest.fn();
    const { result, unmount } = renderHook(() =>
      useDebouncedCallback(mockCallback, 500)
    );

    act(() => {
      result.current('test');
    });

    // 언마운트
    unmount();

    // 지연 시간 경과해도 콜백 실행되지 않음
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(mockCallback).not.toHaveBeenCalled();
  });
});
