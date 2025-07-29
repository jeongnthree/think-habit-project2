import { cache, cacheKeys, invalidateCache } from '../cache';

// 타이머 목킹
jest.useFakeTimers();

describe('MemoryCache', () => {
  beforeEach(() => {
    cache.clear();
    jest.clearAllTimers();
  });

  afterEach(() => {
    cache.clear();
  });

  it('데이터를 저장하고 조회할 수 있다', () => {
    const testData = { id: 1, name: 'test' };

    cache.set('test-key', testData, 5);
    const retrieved = cache.get('test-key');

    expect(retrieved).toEqual(testData);
  });

  it('존재하지 않는 키에 대해 null을 반환한다', () => {
    const result = cache.get('non-existent-key');
    expect(result).toBeNull();
  });

  it('TTL이 만료된 데이터는 null을 반환한다', () => {
    const testData = { id: 1, name: 'test' };

    cache.set('test-key', testData, 1); // 1분 TTL

    // 1분 경과
    jest.advanceTimersByTime(60 * 1000);

    const result = cache.get('test-key');
    expect(result).toBeNull();
  });

  it('TTL이 만료되지 않은 데이터는 정상 반환한다', () => {
    const testData = { id: 1, name: 'test' };

    cache.set('test-key', testData, 5); // 5분 TTL

    // 3분 경과 (TTL 미만)
    jest.advanceTimersByTime(3 * 60 * 1000);

    const result = cache.get('test-key');
    expect(result).toEqual(testData);
  });

  it('데이터를 삭제할 수 있다', () => {
    const testData = { id: 1, name: 'test' };

    cache.set('test-key', testData, 5);
    expect(cache.get('test-key')).toEqual(testData);

    cache.delete('test-key');
    expect(cache.get('test-key')).toBeNull();
  });

  it('모든 데이터를 삭제할 수 있다', () => {
    cache.set('key1', 'data1', 5);
    cache.set('key2', 'data2', 5);

    expect(cache.get('key1')).toBe('data1');
    expect(cache.get('key2')).toBe('data2');

    cache.clear();

    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBeNull();
  });

  it('캐시 통계를 올바르게 반환한다', () => {
    cache.set('key1', 'data1', 5);
    cache.set('key2', 'data2', 5);

    const stats = cache.getStats();

    expect(stats.size).toBe(2);
    expect(stats.keys).toContain('key1');
    expect(stats.keys).toContain('key2');
  });

  it('만료된 항목들을 정리할 수 있다', () => {
    // 서로 다른 TTL로 데이터 저장
    cache.set('short-lived', 'data1', 1); // 1분
    cache.set('long-lived', 'data2', 10); // 10분

    // 5분 경과 (첫 번째는 만료, 두 번째는 유효)
    jest.advanceTimersByTime(5 * 60 * 1000);

    cache.cleanup();

    expect(cache.get('short-lived')).toBeNull();
    expect(cache.get('long-lived')).toBe('data2');

    const stats = cache.getStats();
    expect(stats.size).toBe(1);
  });
});

describe('cacheKeys', () => {
  it('공개 일지 캐시 키를 올바르게 생성한다', () => {
    expect(cacheKeys.publicJournals()).toBe('public_journals_all_1');
    expect(cacheKeys.publicJournals('category1')).toBe(
      'public_journals_category1_1'
    );
    expect(cacheKeys.publicJournals('category1', 2)).toBe(
      'public_journals_category1_2'
    );
  });

  it('일지 상세 캐시 키를 올바르게 생성한다', () => {
    expect(cacheKeys.journalDetail('journal-123')).toBe(
      'journal_detail_journal-123'
    );
  });

  it('댓글 캐시 키를 올바르게 생성한다', () => {
    expect(cacheKeys.journalComments('journal-123')).toBe(
      'journal_comments_journal-123'
    );
  });

  it('격려 캐시 키를 올바르게 생성한다', () => {
    expect(cacheKeys.journalEncouragements('journal-123')).toBe(
      'journal_encouragements_journal-123'
    );
  });

  it('사용자 격려 캐시 키를 올바르게 생성한다', () => {
    expect(cacheKeys.userEncouragements('user-123', 'journal-456')).toBe(
      'user_encouragements_user-123_journal-456'
    );
  });

  it('카테고리 캐시 키를 올바르게 생성한다', () => {
    expect(cacheKeys.categories()).toBe('categories');
  });
});

describe('invalidateCache', () => {
  beforeEach(() => {
    cache.clear();
  });

  it('일지 상세 관련 캐시를 무효화한다', () => {
    const journalId = 'journal-123';

    // 관련 캐시 데이터 설정
    cache.set(cacheKeys.journalDetail(journalId), 'detail-data', 5);
    cache.set(cacheKeys.journalComments(journalId), 'comments-data', 5);
    cache.set(
      cacheKeys.journalEncouragements(journalId),
      'encouragements-data',
      5
    );
    cache.set('unrelated-key', 'unrelated-data', 5);

    // 무효화 실행
    invalidateCache.journalDetail(journalId);

    // 관련 캐시는 삭제되고 무관한 캐시는 유지
    expect(cache.get(cacheKeys.journalDetail(journalId))).toBeNull();
    expect(cache.get(cacheKeys.journalComments(journalId))).toBeNull();
    expect(cache.get(cacheKeys.journalEncouragements(journalId))).toBeNull();
    expect(cache.get('unrelated-key')).toBe('unrelated-data');
  });

  it('공개 일지 목록 캐시를 무효화한다', () => {
    // 다양한 공개 일지 캐시 설정
    cache.set('public_journals_all_1', 'data1', 5);
    cache.set('public_journals_category1_1', 'data2', 5);
    cache.set('public_journals_category2_2', 'data3', 5);
    cache.set('other_cache_key', 'other-data', 5);

    // 무효화 실행
    invalidateCache.publicJournals();

    // 공개 일지 관련 캐시만 삭제
    expect(cache.get('public_journals_all_1')).toBeNull();
    expect(cache.get('public_journals_category1_1')).toBeNull();
    expect(cache.get('public_journals_category2_2')).toBeNull();
    expect(cache.get('other_cache_key')).toBe('other-data');
  });

  it('사용자 격려 캐시를 무효화한다', () => {
    const userId = 'user-123';

    // 사용자 격려 관련 캐시 설정
    cache.set(`user_encouragements_${userId}_journal1`, 'data1', 5);
    cache.set(`user_encouragements_${userId}_journal2`, 'data2', 5);
    cache.set('user_encouragements_other-user_journal1', 'other-data', 5);
    cache.set('unrelated_key', 'unrelated-data', 5);

    // 무효화 실행
    invalidateCache.userEncouragements(userId);

    // 해당 사용자의 격려 캐시만 삭제
    expect(cache.get(`user_encouragements_${userId}_journal1`)).toBeNull();
    expect(cache.get(`user_encouragements_${userId}_journal2`)).toBeNull();
    expect(cache.get('user_encouragements_other-user_journal1')).toBe(
      'other-data'
    );
    expect(cache.get('unrelated_key')).toBe('unrelated-data');
  });
});
