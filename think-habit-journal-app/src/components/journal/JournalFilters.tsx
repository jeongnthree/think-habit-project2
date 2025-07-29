import React, { useState } from "react";
import "./JournalFilters.css";
import { JournalFiltersState } from "./JournalList";

interface JournalFiltersProps {
  filters: JournalFiltersState;
  onFiltersChange: (filters: JournalFiltersState) => void;
  totalCount: number;
  filteredCount: number;
}

export const JournalFilters: React.FC<JournalFiltersProps> = ({
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const handleFilterChange = (key: keyof JournalFiltersState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const resetFilters = () => {
    onFiltersChange({
      searchQuery: "",
      journalType: "all",
      syncStatus: "all",
      dateRange: "all",
      sortBy: "date",
      sortOrder: "desc",
    });
  };

  const hasActiveFilters =
    filters.searchQuery !== "" ||
    filters.journalType !== "all" ||
    filters.syncStatus !== "all" ||
    filters.dateRange !== "all";

  return (
    <div className="journal-filters">
      {/* 기본 검색 및 필터 */}
      <div className="filters-main">
        <div className="search-section">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="일지 제목, 내용, 태그로 검색..."
              value={filters.searchQuery}
              onChange={(e) =>
                handleFilterChange("searchQuery", e.target.value)
              }
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
        </div>

        <div className="quick-filters">
          <select
            value={filters.journalType}
            onChange={(e) => handleFilterChange("journalType", e.target.value)}
            className="filter-select"
          >
            <option value="all">모든 유형</option>
            <option value="structured">📝 구조화된 일지</option>
            <option value="photo">📷 사진 일지</option>
          </select>

          <select
            value={filters.dateRange}
            onChange={(e) => handleFilterChange("dateRange", e.target.value)}
            className="filter-select"
          >
            <option value="all">전체 기간</option>
            <option value="today">오늘</option>
            <option value="week">최근 1주일</option>
            <option value="month">최근 1개월</option>
            <option value="custom">사용자 지정</option>
          </select>

          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`advanced-filters-toggle ${showAdvancedFilters ? "active" : ""}`}
          >
            고급 필터 {showAdvancedFilters ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {/* 고급 필터 */}
      {showAdvancedFilters && (
        <div className="filters-advanced">
          <div className="advanced-filter-row">
            <div className="filter-group">
              <label>동기화 상태</label>
              <select
                value={filters.syncStatus}
                onChange={(e) =>
                  handleFilterChange("syncStatus", e.target.value)
                }
                className="filter-select"
              >
                <option value="all">모든 상태</option>
                <option value="local">📱 로컬</option>
                <option value="syncing">🔄 동기화 중</option>
                <option value="synced">✅ 동기화됨</option>
                <option value="error">❌ 오류</option>
              </select>
            </div>

            <div className="filter-group">
              <label>정렬 기준</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                className="filter-select"
              >
                <option value="date">작성일</option>
                <option value="title">제목</option>
                <option value="updated">수정일</option>
              </select>
            </div>

            <div className="filter-group">
              <label>정렬 순서</label>
              <select
                value={filters.sortOrder}
                onChange={(e) =>
                  handleFilterChange("sortOrder", e.target.value)
                }
                className="filter-select"
              >
                <option value="desc">내림차순</option>
                <option value="asc">오름차순</option>
              </select>
            </div>
          </div>

          {/* 사용자 지정 날짜 범위 */}
          {filters.dateRange === "custom" && (
            <div className="custom-date-range">
              <div className="date-input-group">
                <label>시작일</label>
                <input
                  type="date"
                  value={
                    filters.customDateStart?.toISOString().split("T")[0] || ""
                  }
                  onChange={(e) =>
                    handleFilterChange(
                      "customDateStart",
                      e.target.value ? new Date(e.target.value) : undefined,
                    )
                  }
                  className="date-input"
                />
              </div>
              <div className="date-input-group">
                <label>종료일</label>
                <input
                  type="date"
                  value={
                    filters.customDateEnd?.toISOString().split("T")[0] || ""
                  }
                  onChange={(e) =>
                    handleFilterChange(
                      "customDateEnd",
                      e.target.value ? new Date(e.target.value) : undefined,
                    )
                  }
                  className="date-input"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 필터 상태 및 결과 */}
      <div className="filters-status">
        <div className="filter-results">
          <span className="results-count">
            {filteredCount === totalCount
              ? `총 ${totalCount}개의 일지`
              : `${totalCount}개 중 ${filteredCount}개 표시`}
          </span>

          {hasActiveFilters && (
            <button onClick={resetFilters} className="reset-filters-button">
              필터 초기화
            </button>
          )}
        </div>

        {/* 활성 필터 태그 */}
        {hasActiveFilters && (
          <div className="active-filters">
            {filters.searchQuery && (
              <span className="filter-tag">
                검색: "{filters.searchQuery}"
                <button onClick={() => handleFilterChange("searchQuery", "")}>
                  ×
                </button>
              </span>
            )}

            {filters.journalType !== "all" && (
              <span className="filter-tag">
                유형:{" "}
                {filters.journalType === "structured"
                  ? "구조화된 일지"
                  : "사진 일지"}
                <button
                  onClick={() => handleFilterChange("journalType", "all")}
                >
                  ×
                </button>
              </span>
            )}

            {filters.syncStatus !== "all" && (
              <span className="filter-tag">
                동기화: {filters.syncStatus}
                <button onClick={() => handleFilterChange("syncStatus", "all")}>
                  ×
                </button>
              </span>
            )}

            {filters.dateRange !== "all" && (
              <span className="filter-tag">
                기간:{" "}
                {filters.dateRange === "today"
                  ? "오늘"
                  : filters.dateRange === "week"
                    ? "최근 1주일"
                    : filters.dateRange === "month"
                      ? "최근 1개월"
                      : "사용자 지정"}
                <button onClick={() => handleFilterChange("dateRange", "all")}>
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
