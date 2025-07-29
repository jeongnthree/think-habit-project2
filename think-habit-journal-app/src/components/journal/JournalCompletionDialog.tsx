import React from "react";
import { JournalProgress, StructuredJournalContent } from "../../types/journal";
import "./JournalCompletionDialog.css";

interface JournalCompletionDialogProps {
  content: StructuredJournalContent;
  progress: JournalProgress;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const JournalCompletionDialog: React.FC<
  JournalCompletionDialogProps
> = ({ content, progress, onConfirm, onCancel, isLoading = false }) => {
  // 검증 결과 계산
  const validationResults = {
    hasTitle: content.title.trim().length > 0,
    hasTodos: content.todos.length > 0,
    hasCompletedTodos: progress.completedTodos > 0,
    hasNotes: content.notes.trim().length > 0,
    completionRate: progress.completionPercentage,
  };

  const isReadyToSave = validationResults.hasTitle;
  const warnings = [];
  const suggestions = [];

  // 경고 및 제안 생성
  if (!validationResults.hasTitle) {
    warnings.push("제목이 입력되지 않았습니다.");
  }

  if (!validationResults.hasTodos) {
    suggestions.push("할 일 목록을 추가하면 더 체계적인 일지가 됩니다.");
  } else if (validationResults.completionRate < 50) {
    suggestions.push(
      "아직 완료하지 않은 할 일이 많습니다. 계속 진행하시겠습니까?",
    );
  }

  if (!validationResults.hasNotes) {
    suggestions.push("메모를 추가하면 더 풍부한 기록이 됩니다.");
  }

  if (!content.mood) {
    suggestions.push("오늘의 기분을 선택해보세요.");
  }

  if (content.tags.length === 0) {
    suggestions.push("태그를 추가하면 나중에 찾기 쉬워집니다.");
  }

  const getMoodEmoji = (mood?: string) => {
    const moodEmojis = {
      "very-bad": "😢",
      bad: "😕",
      neutral: "😐",
      good: "😊",
      "very-good": "😄",
    };
    return mood ? moodEmojis[mood as keyof typeof moodEmojis] : "😐";
  };

  const getMoodText = (mood?: string) => {
    const moodTexts = {
      "very-bad": "매우 나쁨",
      bad: "나쁨",
      neutral: "보통",
      good: "좋음",
      "very-good": "매우 좋음",
    };
    return mood ? moodTexts[mood as keyof typeof moodTexts] : "선택 안함";
  };

  return (
    <div className="completion-dialog-overlay">
      <div className="completion-dialog">
        <div className="dialog-header">
          <h2>일지 저장 확인</h2>
          <p>작성하신 일지를 저장하시겠습니까?</p>
        </div>

        <div className="dialog-content">
          {/* 일지 요약 */}
          <div className="journal-summary">
            <div className="summary-item">
              <span className="summary-label">제목:</span>
              <span className="summary-value">
                {content.title || <em className="empty-value">제목 없음</em>}
              </span>
            </div>

            <div className="summary-item">
              <span className="summary-label">날짜:</span>
              <span className="summary-value">
                {content.date.toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "long",
                })}
              </span>
            </div>

            {content.todos.length > 0 && (
              <div className="summary-item">
                <span className="summary-label">할 일 진행률:</span>
                <div className="progress-summary">
                  <div className="progress-bar-small">
                    <div
                      className="progress-fill-small"
                      style={{ width: `${progress.completionPercentage}%` }}
                    />
                  </div>
                  <span className="progress-text-small">
                    {progress.completedTodos}/{progress.totalTodos} (
                    {progress.completionPercentage}%)
                  </span>
                </div>
              </div>
            )}

            <div className="summary-item">
              <span className="summary-label">기분:</span>
              <span className="summary-value">
                {getMoodEmoji(content.mood)} {getMoodText(content.mood)}
              </span>
            </div>

            {content.tags.length > 0 && (
              <div className="summary-item">
                <span className="summary-label">태그:</span>
                <div className="tags-summary">
                  {content.tags.map((tag) => (
                    <span key={tag} className="tag-small">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {content.notes && (
              <div className="summary-item notes-preview">
                <span className="summary-label">메모:</span>
                <div className="notes-preview-content">
                  {content.notes.length > 100
                    ? `${content.notes.substring(0, 100)}...`
                    : content.notes}
                </div>
              </div>
            )}
          </div>

          {/* 경고 메시지 */}
          {warnings.length > 0 && (
            <div className="validation-section warnings">
              <h4>⚠️ 필수 항목</h4>
              <ul>
                {warnings.map((warning, index) => (
                  <li key={index} className="warning-item">
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 제안 메시지 */}
          {suggestions.length > 0 && (
            <div className="validation-section suggestions">
              <h4>💡 제안사항</h4>
              <ul>
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="suggestion-item">
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 완료도 표시 */}
          <div className="completion-stats">
            <div className="stat-item">
              <div className="stat-number">{content.todos.length}</div>
              <div className="stat-label">할 일</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{progress.completedTodos}</div>
              <div className="stat-label">완료</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{content.notes.length}</div>
              <div className="stat-label">메모 글자</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{content.tags.length}</div>
              <div className="stat-label">태그</div>
            </div>
          </div>
        </div>

        <div className="dialog-actions">
          <button
            onClick={onCancel}
            className="cancel-button"
            disabled={isLoading}
          >
            취소
          </button>

          {!isReadyToSave ? (
            <button
              className="save-button disabled"
              disabled={true}
              title="필수 항목을 입력해주세요"
            >
              저장 불가
            </button>
          ) : (
            <button
              onClick={onConfirm}
              className="save-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  저장 중...
                </>
              ) : (
                "저장하기"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
