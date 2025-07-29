import React, { useMemo, useState } from "react";
import {
  Journal,
  PhotoJournalContent,
  StructuredJournalContent,
} from "../../types/journal";
import { JournalFilters } from "./JournalFilters";
import "./JournalList.css";

interface JournalListProps {
  journals: Journal[];
  onJournalSelect: (journal: Journal) => void;
  onJournalEdit: (journal: Journal) => void;
  onJournalDelete: (journalId: string) => void;
  onCreateNew: () => void;
  isLoading?: boolean;
}

export interface JournalFiltersState {
  searchQuery: string;
  journalType: "all" | "structured" | "photo";
  syncStatus: "all" | "local" | "syncing" | "synced" | "error";
  dateRange: "all" | "today" | "week" | "month" | "custom";
  customDateStart?: Date;
  customDateEnd?: Date;
  sortBy: "date" | "title" | "updated";
  sortOrder: "asc" | "desc";
}

export const JournalList: React.FC<JournalListProps> = ({
  journals,
  onJournalSelect,
  onJournalEdit,
  onJournalDelete,
  onCreateNew,
  isLoading = false,
}) => {
  const [filters, setFilters] = useState<JournalFiltersState>({
    searchQuery: "",
    journalType: "all",
    syncStatus: "all",
    dateRange: "all",
    sortBy: "date",
    sortOrder: "desc",
  });

  const [selectedJournals, setSelectedJournals] = useState<Set<string>>(
    new Set(),
  );
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // 필터링 및 정렬된 일지 목록
  const filteredAndSortedJournals = useMemo(() => {
    let filtered = journals.filter((journal) => {
      // 삭제된 일지 제외
      if (journal.isDeleted) return false;

      // 검색 쿼리 필터링
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const content = journal.content as
          | StructuredJournalContent
          | PhotoJournalContent;

        const titleMatch = content.title?.toLowerCase().includes(query);
        const notesMatch =
          journal.type === "structured"
            ? (content as StructuredJournalContent).notes
                ?.toLowerCase()
                .includes(query)
            : (content as PhotoJournalContent).description
                ?.toLowerCase()
                .includes(query);

        const tagsMatch = content.tags?.some((tag) =>
          tag.toLowerCase().includes(query),
        );

        if (!titleMatch && !notesMatch && !tagsMatch) return false;
      }

      // 일지 타입 필터링
      if (
        filters.journalType !== "all" &&
        journal.type !== filters.journalType
      ) {
        return false;
      }

      // 동기화 상태 필터링
      if (
        filters.syncStatus !== "all" &&
        journal.syncStatus !== filters.syncStatus
      ) {
        return false;
      }

      // 날짜 범위 필터링
      if (filters.dateRange !== "all") {
        const journalDate = new Date(journal.content.date);
        const now = new Date();

        switch (filters.dateRange) {
          case "today":
            if (journalDate.toDateString() !== now.toDateString()) return false;
            break;
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (journalDate < weekAgo) return false;
            break;
          case "month":
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (journalDate < monthAgo) return false;
            break;
          case "custom":
            if (
              filters.customDateStart &&
              journalDate < filters.customDateStart
            )
              return false;
            if (filters.customDateEnd && journalDate > filters.customDateEnd)
              return false;
            break;
        }
      }

      return true;
    });

    // 정렬
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case "date":
          comparison =
            new Date(a.content.date).getTime() -
            new Date(b.content.date).getTime();
          break;
        case "title":
          comparison = a.content.title.localeCompare(b.content.title);
          break;
        case "updated":
          comparison =
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
      }

      return filters.sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [journals, filters]);

  // 선택된 일지 관리
  const handleJournalSelect = (journalId: string, isSelected: boolean) => {
    const newSelected = new Set(selectedJournals);
    if (isSelected) {
      newSelected.add(journalId);
    } else {
      newSelected.delete(journalId);
    }
    setSelectedJournals(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedJournals.size === filteredAndSortedJournals.length) {
      setSelectedJournals(new Set());
    } else {
      setSelectedJournals(new Set(filteredAndSortedJournals.map((j) => j.id)));
    }
  };

  // 일지 미리보기 텍스트 생성
  const getJournalPreview = (journal: Journal): string => {
    if (journal.type === "structured") {
      const content = journal.content as StructuredJournalContent;
      return content.notes || `${content.todos?.length || 0}개의 할 일`;
    } else {
      const content = journal.content as PhotoJournalContent;
      return content.description || `${content.photos?.length || 0}개의 사진`;
    }
  };

  // 일지 완성도 계산
  const getCompletionRate = (journal: Journal): number => {
    if (journal.type === "structured") {
      const content = journal.content as StructuredJournalContent;
      if (!content.todos || content.todos.length === 0) return 0;
      const completed = content.todos.filter((todo) => todo.completed).length;
      return Math.round((completed / content.todos.length) * 100);
    }
    return 100; // 사진 일지는 항상 100%
  };

  const getSyncStatusIcon = (status: Journal["syncStatus"]) => {
    switch (status) {
      case "local":
        return "📱";
      case "syncing":
        return "🔄";
      case "synced":
        return "✅";
      case "error":
        return "❌";
      default:
        return "📱";
    }
  };

  const getSyncStatusText = (status: Journal["syncStatus"]) => {
    switch (status) {
      case "local":
        return "로컬";
      case "syncing":
        return "동기화 중";
      case "synced":
        return "동기화됨";
      case "error":
        return "오류";
      default:
        return "로컬";
    }
  };

  if (isLoading) {
    return (
      <div className="journal-list-loading">
        <div className="loading-spinner"></div>
        <p>일지를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="journal-list">
      {/* 필터 및 검색 */}
      <JournalFilters
        filters={filters}
        onFiltersChange={setFilters}
        totalCount={journals.length}
        filteredCount={filteredAndSortedJournals.length}
      />

      {/* 도구 모음 */}
      <div className="journal-toolbar">
        <div className="toolbar-left">
          <button
            onClick={handleSelectAll}
            className="select-all-button"
            disabled={filteredAndSortedJournals.length === 0}
          >
            {selectedJournals.size === filteredAndSortedJournals.length
              ? "전체 해제"
              : "전체 선택"}
          </button>

          {selectedJournals.size > 0 && (
            <span className="selection-count">
              {selectedJournals.size}개 선택됨
            </span>
          )}
        </div>

        <div className="toolbar-right">
          <div className="view-mode-toggle">
            <button
              className={`view-mode-button ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              title="목록 보기"
            >
              📋
            </button>
            <button
              className={`view-mode-button ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="격자 보기"
            >
              ⊞
            </button>
          </div>

          <button onClick={onCreateNew} className="create-new-button">
            ➕ 새 일지
          </button>
        </div>
      </div>

      {/* 일지 목록 */}
      {filteredAndSortedJournals.length === 0 ? (
        <div className="empty-journal-list">
          {filters.searchQuery ||
          filters.journalType !== "all" ||
          filters.syncStatus !== "all" ||
          filters.dateRange !== "all" ? (
            <>
              <p className="empty-message">검색 조건에 맞는 일지가 없습니다.</p>
              <button
                onClick={() =>
                  setFilters({
                    searchQuery: "",
                    journalType: "all",
                    syncStatus: "all",
                    dateRange: "all",
                    sortBy: "date",
                    sortOrder: "desc",
                  })
                }
                className="reset-filters-button"
              >
                필터 초기화
              </button>
            </>
          ) : (
            <>
              <p className="empty-message">아직 작성된 일지가 없습니다.</p>
              <p className="empty-subtitle">첫 번째 일지를 작성해보세요!</p>
              <button onClick={onCreateNew} className="create-first-button">
                일지 작성하기
              </button>
            </>
          )}
        </div>
      ) : (
        <div className={`journal-items ${viewMode}`}>
          {filteredAndSortedJournals.map((journal) => (
            <div
              key={journal.id}
              className={`journal-item ${selectedJournals.has(journal.id) ? "selected" : ""}`}
            >
              <div className="journal-item-header">
                <input
                  type="checkbox"
                  checked={selectedJournals.has(journal.id)}
                  onChange={(e) =>
                    handleJournalSelect(journal.id, e.target.checked)
                  }
                  className="journal-checkbox"
                />

                <div className="journal-type-icon">
                  {journal.type === "structured" ? "📝" : "📷"}
                </div>

                <div
                  className="journal-sync-status"
                  title={getSyncStatusText(journal.syncStatus)}
                >
                  {getSyncStatusIcon(journal.syncStatus)}
                </div>
              </div>

              <div
                className="journal-item-content"
                onClick={() => onJournalSelect(journal)}
              >
                <h3 className="journal-title">
                  {journal.content.title || "제목 없음"}
                </h3>

                <p className="journal-date">
                  {new Date(journal.content.date).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    weekday: "short",
                  })}
                </p>

                <p className="journal-preview">{getJournalPreview(journal)}</p>

                {journal.type === "structured" && (
                  <div className="completion-indicator">
                    <div className="completion-bar">
                      <div
                        className="completion-fill"
                        style={{ width: `${getCompletionRate(journal)}%` }}
                      />
                    </div>
                    <span className="completion-text">
                      {getCompletionRate(journal)}%
                    </span>
                  </div>
                )}

                {journal.content.tags && journal.content.tags.length > 0 && (
                  <div className="journal-tags">
                    {journal.content.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="journal-tag">
                        {tag}
                      </span>
                    ))}
                    {journal.content.tags.length > 3 && (
                      <span className="journal-tag-more">
                        +{journal.content.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="journal-item-actions">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onJournalEdit(journal);
                  }}
                  className="journal-action-button edit"
                  title="편집"
                >
                  ✏️
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("정말 이 일지를 삭제하시겠습니까?")) {
                      onJournalDelete(journal.id);
                    }
                  }}
                  className="journal-action-button delete"
                  title="삭제"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 페이지네이션 (향후 구현) */}
      {filteredAndSortedJournals.length > 0 && (
        <div className="journal-pagination">
          <span className="pagination-info">
            총 {filteredAndSortedJournals.length}개의 일지
          </span>
        </div>
      )}
    </div>
  );
};
