'use client';

import {
  Activity,
  CheckCircle,
  Clock,
  Eye,
  Flag,
  Shield,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface Report {
  id: string;
  reported_content_type: 'comment' | 'journal';
  reported_content_id: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  reporter: { id: string; full_name: string };
  reported_user: { id: string; full_name: string };
  reviewer?: { id: string; full_name: string };
}

interface ModerationAction {
  id: string;
  action_type: string;
  target_type: string;
  reason?: string;
  created_at: string;
  moderator: { id: string; full_name: string };
  target_user?: { id: string; full_name: string };
}

const REASON_LABELS: { [key: string]: string } = {
  spam: '스팸/광고',
  inappropriate: '부적절한 내용',
  harassment: '괴롭힘/욕설',
  offensive: '혐오 발언',
  other: '기타',
};

const ACTION_LABELS: { [key: string]: string } = {
  delete_comment: '댓글 삭제',
  delete_journal: '일지 삭제',
  block_user: '사용자 차단',
  unblock_user: '차단 해제',
  resolve_report: '신고 해결',
  dismiss_report: '신고 기각',
};

export default function ModerationPage() {
  const [activeTab, setActiveTab] = useState<'reports' | 'actions'>('reports');
  const [reports, setReports] = useState<Report[]>([]);
  const [actions, setActions] = useState<ModerationAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportStatus, setReportStatus] = useState('pending');

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports();
    } else {
      fetchActions();
    }
  }, [activeTab, reportStatus]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/community/reports?status=${reportStatus}`
      );
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/moderation-actions');
      if (response.ok) {
        const data = await response.json();
        setActions(data.actions);
      }
    } catch (error) {
      console.error('Failed to fetch actions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReportAction = async (
    reportId: string,
    status: string,
    action?: string,
    notes?: string
  ) => {
    try {
      const response = await fetch(`/api/community/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          resolution_notes: notes,
          action,
        }),
      });

      if (response.ok) {
        alert('신고가 처리되었습니다.');
        fetchReports();
        setSelectedReport(null);
      } else {
        const data = await response.json();
        alert(data.error || '처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Report action error:', error);
      alert('네트워크 오류가 발생했습니다.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className='w-4 h-4 text-yellow-500' />;
      case 'reviewed':
        return <Eye className='w-4 h-4 text-blue-500' />;
      case 'resolved':
        return <CheckCircle className='w-4 h-4 text-green-500' />;
      case 'dismissed':
        return <XCircle className='w-4 h-4 text-gray-500' />;
      default:
        return null;
    }
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 py-8'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>콘텐츠 조정</h1>
          <p className='text-gray-600'>
            커뮤니티 신고 및 조정 활동을 관리합니다.
          </p>
        </div>

        {/* 탭 네비게이션 */}
        <div className='bg-white rounded-lg shadow-sm mb-6'>
          <div className='border-b border-gray-200'>
            <nav className='flex space-x-8 px-6'>
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reports'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className='flex items-center gap-2'>
                  <Flag className='w-4 h-4' />
                  신고 관리
                </div>
              </button>
              <button
                onClick={() => setActiveTab('actions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'actions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className='flex items-center gap-2'>
                  <Activity className='w-4 h-4' />
                  조정 로그
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* 신고 관리 탭 */}
        {activeTab === 'reports' && (
          <div className='space-y-6'>
            {/* 상태 필터 */}
            <div className='bg-white rounded-lg shadow-sm p-4'>
              <div className='flex gap-2'>
                {['pending', 'reviewed', 'resolved', 'dismissed'].map(
                  status => (
                    <button
                      key={status}
                      onClick={() => setReportStatus(status)}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        reportStatus === status
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {status === 'pending' && '대기 중'}
                      {status === 'reviewed' && '검토됨'}
                      {status === 'resolved' && '해결됨'}
                      {status === 'dismissed' && '기각됨'}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* 신고 목록 */}
            <div className='bg-white rounded-lg shadow-sm'>
              {loading ? (
                <div className='p-8 text-center'>
                  <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
                  <p className='mt-2 text-gray-600'>로딩 중...</p>
                </div>
              ) : reports.length === 0 ? (
                <div className='p-8 text-center text-gray-500'>
                  해당 상태의 신고가 없습니다.
                </div>
              ) : (
                <div className='divide-y divide-gray-200'>
                  {reports.map(report => (
                    <div key={report.id} className='p-6 hover:bg-gray-50'>
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          <div className='flex items-center gap-2 mb-2'>
                            {getStatusIcon(report.status)}
                            <span className='font-medium text-gray-900'>
                              {report.reported_content_type === 'comment'
                                ? '댓글'
                                : '일지'}{' '}
                              신고
                            </span>
                            <span className='px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full'>
                              {REASON_LABELS[report.reason]}
                            </span>
                          </div>
                          <div className='text-sm text-gray-600 space-y-1'>
                            <p>신고자: {report.reporter.full_name}</p>
                            <p>신고 대상: {report.reported_user.full_name}</p>
                            <p>신고 시간: {formatDate(report.created_at)}</p>
                            {report.description && (
                              <p className='mt-2 p-2 bg-gray-100 rounded text-sm'>
                                {report.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className='flex gap-2'>
                          <button
                            onClick={() => setSelectedReport(report)}
                            className='px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-sm'
                          >
                            상세보기
                          </button>
                          {report.status === 'pending' && (
                            <>
                              <button
                                onClick={() =>
                                  handleReportAction(
                                    report.id,
                                    'resolved',
                                    'hide_content',
                                    '부적절한 콘텐츠로 판단하여 숨김 처리'
                                  )
                                }
                                className='px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-sm'
                              >
                                콘텐츠 숨김
                              </button>
                              <button
                                onClick={() =>
                                  handleReportAction(
                                    report.id,
                                    'dismissed',
                                    undefined,
                                    '신고 내용이 부적절하여 기각'
                                  )
                                }
                                className='px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded text-sm'
                              >
                                기각
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 조정 로그 탭 */}
        {activeTab === 'actions' && (
          <div className='bg-white rounded-lg shadow-sm'>
            {loading ? (
              <div className='p-8 text-center'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
                <p className='mt-2 text-gray-600'>로딩 중...</p>
              </div>
            ) : actions.length === 0 ? (
              <div className='p-8 text-center text-gray-500'>
                조정 활동이 없습니다.
              </div>
            ) : (
              <div className='divide-y divide-gray-200'>
                {actions.map(action => (
                  <div key={action.id} className='p-6'>
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-2'>
                          <Shield className='w-4 h-4 text-blue-500' />
                          <span className='font-medium text-gray-900'>
                            {ACTION_LABELS[action.action_type] ||
                              action.action_type}
                          </span>
                        </div>
                        <div className='text-sm text-gray-600 space-y-1'>
                          <p>조정자: {action.moderator.full_name}</p>
                          {action.target_user && (
                            <p>대상 사용자: {action.target_user.full_name}</p>
                          )}
                          <p>실행 시간: {formatDate(action.created_at)}</p>
                          {action.reason && (
                            <p className='mt-2 p-2 bg-gray-100 rounded text-sm'>
                              사유: {action.reason}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 신고 상세 모달 */}
        {selectedReport && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
            <div className='bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto'>
              <h3 className='text-lg font-semibold mb-4'>신고 상세 정보</h3>

              <div className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>
                      신고 유형
                    </label>
                    <p className='text-sm text-gray-900'>
                      {selectedReport.reported_content_type === 'comment'
                        ? '댓글'
                        : '일지'}
                    </p>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>
                      신고 사유
                    </label>
                    <p className='text-sm text-gray-900'>
                      {REASON_LABELS[selectedReport.reason]}
                    </p>
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    신고자
                  </label>
                  <p className='text-sm text-gray-900'>
                    {selectedReport.reporter.full_name}
                  </p>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700'>
                    신고 대상
                  </label>
                  <p className='text-sm text-gray-900'>
                    {selectedReport.reported_user.full_name}
                  </p>
                </div>

                {selectedReport.description && (
                  <div>
                    <label className='block text-sm font-medium text-gray-700'>
                      상세 설명
                    </label>
                    <p className='text-sm text-gray-900 p-3 bg-gray-50 rounded'>
                      {selectedReport.description}
                    </p>
                  </div>
                )}

                <div className='flex gap-3 pt-4'>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className='flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md'
                  >
                    닫기
                  </button>
                  {selectedReport.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          handleReportAction(
                            selectedReport.id,
                            'resolved',
                            'hide_content',
                            '부적절한 콘텐츠로 판단하여 숨김 처리'
                          );
                        }}
                        className='px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md'
                      >
                        콘텐츠 숨김
                      </button>
                      <button
                        onClick={() => {
                          handleReportAction(
                            selectedReport.id,
                            'dismissed',
                            undefined,
                            '신고 내용이 부적절하여 기각'
                          );
                        }}
                        className='px-4 py-2 bg-gray-600 text-white hover:bg-gray-700 rounded-md'
                      >
                        신고 기각
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
