import React, { useCallback, useEffect, useState } from 'react';
import { WidgetConfig, WidgetState } from '../types';
import { ActivityFeed } from './ActivityFeed';
import { EncouragementPanel } from './EncouragementPanel';
import { JournalForm } from './JournalForm';
import { Leaderboard } from './Leaderboard';
import { NotificationContainer } from './NotificationContainer';
import { StatsOverview } from './StatsOverview';
import './ThinkHabitWidget.css';

interface ThinkHabitWidgetProps {
  config: WidgetConfig;
}

export const ThinkHabitWidget: React.FC<ThinkHabitWidgetProps> = ({
  config,
}) => {
  const [state, setState] = useState<WidgetState>({
    data: null,
    loading: true,
    error: null,
    activeTab: 'overview',
  });

  const [notifications, setNotifications] = useState<any[]>([]);

  // API 서비스 인스턴스
  const apiService = new MockApiService(
    config.apiEndpoint || 'http://localhost:3000/api',
    config.groupId || 'default-group'
  );

  // 데이터 로드
  const loadData = useCallback(async () => {
    if (!config.groupId) {
      setState(prev => ({
        ...prev,
        error: '그룹 ID가 필요합니다',
        loading: false,
      }));
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const response = await apiService.getGroupData();

      if (response.success && response.data) {
        setState(prev => ({ ...prev, data: response.data!, loading: false }));

        // 이벤트 발생
        config.onEvent?.({
          type: 'data_refreshed',
          data: response.data,
        });
      } else {
        throw new Error(response.error || '데이터 로드 실패');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '데이터 로드 실패';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));

      config.onEvent?.({
        type: 'error_occurred',
        data: { error: errorMessage },
      });
    }
  }, [config.groupId, config.onEvent, config.apiEndpoint]);

  // 초기 로드 및 자동 새로고침
  useEffect(() => {
    loadData();

    if (config.refreshInterval && config.refreshInterval > 0) {
      const interval = setInterval(loadData, config.refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [loadData, config.refreshInterval]);

  // 실시간 업데이트 (WebSocket 연결)
  useEffect(() => {
    if (!config.enableRealtime || !config.groupId) return;

    // 실제 구현에서는 WebSocket 연결
    // const ws = new WebSocket(`${config.apiEndpoint}/ws/${config.groupId}`);
    // ws.onmessage = (event) => {
    //   const update = JSON.parse(event.data);
    //   handleRealtimeUpdate(update);
    // };

    // return () => ws.close();
  }, [config.enableRealtime, config.groupId]);

  // 탭 변경
  const handleTabChange = (tab: WidgetState['activeTab']) => {
    setState(prev => ({ ...prev, activeTab: tab }));
  };

  // 알림 추가
  const addNotification = (notification: any) => {
    setNotifications(prev => [
      ...prev,
      { ...notification, id: Date.now().toString() },
    ]);
  };

  // 알림 제거
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // 일지 제출 처리
  const handleJournalSubmit = async (journalData: any) => {
    try {
      const response = await apiService.submitJournal(journalData);

      if (response.success && response.data) {
        addNotification({
          type: 'success',
          title: '일지 작성 완료',
          message: '일지가 성공적으로 작성되었습니다.',
          duration: 3000,
        });

        config.onEvent?.({
          type: 'journal_submitted',
          data: response.data,
        });

        // 데이터 새로고침
        loadData();
      } else {
        throw new Error(response.error || '일지 작성 실패');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: '일지 작성 실패',
        message:
          error instanceof Error
            ? error.message
            : '알 수 없는 오류가 발생했습니다.',
        duration: 5000,
      });
    }
  };

  // 격려 메시지 전송
  const handleEncouragementSend = async (encouragementData: any) => {
    try {
      const response = await apiService.sendEncouragement(
        encouragementData.toUserId,
        encouragementData.message,
        encouragementData.type
      );

      if (response.success && response.data) {
        addNotification({
          type: 'success',
          title: '격려 메시지 전송',
          message: '격려 메시지가 전송되었습니다.',
          duration: 3000,
        });

        config.onEvent?.({
          type: 'encouragement_sent',
          data: response.data,
        });
      } else {
        throw new Error(response.error || '메시지 전송 실패');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: '메시지 전송 실패',
        message:
          error instanceof Error ? error.message : '전송에 실패했습니다.',
        duration: 5000,
      });
    }
  };

  // 로딩 상태
  if (state.loading) {
    return (
      <div className={`think-habit-widget theme-${config.theme || 'light'}`}>
        <div className='widget-loading'>
          <div className='loading-spinner'></div>
          <p>데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (state.error) {
    return (
      <div className={`think-habit-widget theme-${config.theme || 'light'}`}>
        <div className='widget-error'>
          <h3>오류 발생</h3>
          <p>{state.error}</p>
          <button onClick={loadData} className='retry-button'>
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const { data } = state;
  if (!data) return null;

  return (
    <div
      className={`think-habit-widget theme-${config.theme || 'light'}`}
      style={{
        height: config.height ? `${config.height}px` : 'auto',
        width: config.width ? `${config.width}px` : '100%',
        ...config.customStyles,
      }}
    >
      {/* 헤더 */}
      <div className='widget-header'>
        <h2 className='group-name'>{data.name}</h2>
        <div className='group-stats-summary'>
          <span className='member-count'>{data.memberCount}명</span>
          <span className='progress-indicator'>
            {Math.round(data.overallProgress)}% 완료
          </span>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className='widget-tabs'>
        <button
          className={`tab-button ${state.activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleTabChange('overview')}
        >
          개요
        </button>
        {config.showLeaderboard && (
          <button
            className={`tab-button ${state.activeTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => handleTabChange('leaderboard')}
          >
            순위
          </button>
        )}
        {config.showRecentActivity && (
          <button
            className={`tab-button ${state.activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => handleTabChange('activity')}
          >
            활동
          </button>
        )}
        {config.showJournalForm && (
          <button
            className={`tab-button ${state.activeTab === 'journal' ? 'active' : ''}`}
            onClick={() => handleTabChange('journal')}
          >
            일지 작성
          </button>
        )}
      </div>

      {/* 탭 컨텐츠 */}
      <div className='widget-content'>
        {state.activeTab === 'overview' && (
          <div className='overview-tab'>
            {config.showStats && <StatsOverview stats={data.stats} />}
            {config.showProgress && (
              <div className='progress-section'>
                <h3>전체 진행률</h3>
                <div className='progress-bar'>
                  <div
                    className='progress-fill'
                    style={{ width: `${data.overallProgress}%` }}
                  ></div>
                </div>
                <p>{data.totalJournals}개의 일지 작성됨</p>
              </div>
            )}
            {config.showEncouragement && (
              <EncouragementPanel
                participants={data.topParticipants}
                onSendEncouragement={handleEncouragementSend}
              />
            )}
          </div>
        )}

        {state.activeTab === 'leaderboard' && config.showLeaderboard && (
          <Leaderboard
            participants={data.topParticipants}
            maxParticipants={config.maxParticipants}
            theme={config.theme || 'light'}
          />
        )}

        {state.activeTab === 'activity' && config.showRecentActivity && (
          <ActivityFeed
            activities={data.recentActivity}
            theme={config.theme || 'light'}
          />
        )}

        {state.activeTab === 'journal' && config.showJournalForm && (
          <JournalForm
            onSubmit={handleJournalSubmit}
            theme={config.theme || 'light'}
          />
        )}
      </div>

      {/* 알림 컨테이너 */}
      {config.enableNotifications && (
        <NotificationContainer
          notifications={notifications}
          onRemove={removeNotification}
        />
      )}
    </div>
  );
};
