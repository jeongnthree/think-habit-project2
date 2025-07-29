// components/journal/SearchAndFilter.tsx
// 일지 검색 및 필터링을 위한 컴포넌트

"use client";

import { useDebounce } from "@/hooks/useAutoSave";
import type { JournalFilter, JournalSortOptions } from "@/shared/types";
import { cn } from "@/utils";
import {
  Camera,
  CheckSquare,
  ChevronDown,
  RotateCcw,
  Search,
  Sliders,
  SortAsc,
  SortDesc,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

interface SearchAndFilterProps {
  onFilterChange: (filter: JournalFilter) => void;
  onSortChange: (sort: JournalSortOptions) => void;
  totalCount: number;
  className?: string;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  onFilterChange,
  onSortChange,
  totalCount,
  className,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 검색 및 필터 상태
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedType, setSelectedType] = useState<
    "all" | "structured" | "photo"
  >((searchParams.get("type") as any) || "all");
  const [selectedStatus, setSelectedStatus] = useState<
    "all" | "local" | "synced" | "pending"
  >((searchParams.get("status") as any) || "all");
  const [dateFrom, setDateFrom] = useState(searchParams.get("dateFrom") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("dateTo") || "");
  const [sortBy, setSortBy] = useState<
    "createdAt" | "updatedAt" | "title" | "completionRate"
  >((searchParams.get("sortBy") as any) || "createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    (searchParams.get("order") as any) || "desc",
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [completionRateMin, setCompletionRateMin] = useState(
    Number(searchParams.get("completionMin")) || 0,
  );
  const [completionRateMax, setCompletionRateMax] = useState(
    Number(searchParams.get("completionMax")) || 100,
  );

  // 검색어 디바운싱
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // URL 업데이트
  const updateURL = (params: Record<string, string | null>) => {
    const newSearchParams = new URLSearchParams(searchParams);

    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newSearchParams.set(key, value);
      } else {
        newSearchParams.delete(key);
      }
    });

    router.push(`?${newSearchParams.toString()}`, { scroll: false });
  };

  // 필터 적용
  useEffect(() => {
    const filter: JournalFilter = {};

    if (debouncedSearchQuery) filter.searchQuery = debouncedSearchQuery;
    if (selectedType !== "all")
      filter.type = selectedType as "structured" | "photo";
    if (selectedStatus !== "all") filter.syncStatus = selectedStatus as any;
    if (dateFrom) filter.dateFrom = new Date(dateFrom);
    if (dateTo) filter.dateTo = new Date(dateTo);
    if (completionRateMin > 0) filter.completionRateMin = completionRateMin;
    if (completionRateMax < 100) filter.completionRateMax = completionRateMax;

    onFilterChange(filter);

    // URL 업데이트
    updateURL({
      q: debouncedSearchQuery || null,
      type: selectedType !== "all" ? selectedType : null,
      status: selectedStatus !== "all" ? selectedStatus : null,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
      completionMin:
        completionRateMin > 0 ? completionRateMin.toString() : null,
      completionMax:
        completionRateMax < 100 ? completionRateMax.toString() : null,
    });
  }, [
    debouncedSearchQuery,
    selectedType,
    selectedStatus,
    dateFrom,
    dateTo,
    completionRateMin,
    completionRateMax,
    onFilterChange,
  ]);

  // 정렬 적용
  useEffect(() => {
    onSortChange({ sortBy, order: sortOrder });
    updateURL({
      sortBy: sortBy !== "createdAt" ? sortBy : null,
      order: sortOrder !== "desc" ? sortOrder : null,
    });
  }, [sortBy, sortOrder, onSortChange]);

  // 모든 필터 초기화
  const resetFilters = () => {
    setSearchQuery("");
    setSelectedType("all");
    setSelectedStatus("all");
    setDateFrom("");
    setDateTo("");
    setCompletionRateMin(0);
    setCompletionRateMax(100);
    setSortBy("createdAt");
    setSortOrder("desc");
    router.push("/journal/list");
  };

  // 활성 필터 개수 계산
  const activeFiltersCount = [
    searchQuery,
    selectedType !== "all",
    selectedStatus !== "all",
    dateFrom,
    dateTo,
    completionRateMin > 0,
    completionRateMax < 100,
  ].filter(Boolean).length;

  const typeOptions = [
    { value: "all", label: "모든 일지", icon: null },
    { value: "structured", label: "구조화된 일지", icon: CheckSquare },
    { value: "photo", label: "사진 일지", icon: Camera },
  ];

  const statusOptions = [
    { value: "all", label: "모든 상태" },
    { value: "local", label: "로컬 전용" },
    { value: "synced", label: "동기화됨" },
    { value: "pending", label: "동기화 대기" },
  ];

  const sortOptions = [
    { value: "createdAt", label: "생성일" },
    { value: "updatedAt", label: "수정일" },
    { value: "title", label: "제목" },
    { value: "completionRate", label: "완료율" },
  ];

  return (
    <div className={cn("bg-white border-b sticky top-0 z-10", className)}>
      <div className="p-4 space-y-4">
        {/* 상단: 검색바 + 기본 컨트롤 */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* 검색바 */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="일지 제목, 내용, 태그로 검색..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 기본 필터 */}
          <div className="flex gap-2">
            {/* 타입 선택 */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* 정렬 */}
            <div className="flex">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
                className="px-3 py-2 border-t border-r border-b border-gray-300 rounded-r-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
              >
                {sortOrder === "asc" ? (
                  <SortAsc className="w-4 h-4" />
                ) : (
                  <SortDesc className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* 고급 필터 토글 */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors",
                isFilterOpen
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-300 hover:bg-gray-50",
              )}
            >
              <Sliders className="w-4 h-4" />
              필터
              {activeFiltersCount > 0 && (
                <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
              <ChevronDown
                className={cn(
                  "w-4 h-4 transition-transform",
                  isFilterOpen && "rotate-180",
                )}
              />
            </button>
          </div>
        </div>

        {/* 고급 필터 패널 */}
        {isFilterOpen && (
          <div className="p-4 bg-gray-50 rounded-lg border space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 동기화 상태 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  동기화 상태
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 시작 날짜 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  시작 날짜
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 종료 날짜 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  종료 날짜
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 완료율 범위 (구조화된 일지만) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  완료율 범위
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={completionRateMin}
                      onChange={(e) =>
                        setCompletionRateMin(Number(e.target.value))
                      }
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600 w-8">
                      {completionRateMin}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={completionRateMax}
                      onChange={(e) =>
                        setCompletionRateMax(Number(e.target.value))
                      }
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600 w-8">
                      {completionRateMax}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 필터 액션 */}
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-gray-600">
                {totalCount}개의 일지 중 필터 적용됨
              </span>
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                모든 필터 초기화
              </button>
            </div>
          </div>
        )}

        {/* 활성 필터 태그 */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {searchQuery && (
              <FilterTag
                label={`검색: "${searchQuery}"`}
                onRemove={() => setSearchQuery("")}
              />
            )}
            {selectedType !== "all" && (
              <FilterTag
                label={`타입: ${typeOptions.find((t) => t.value === selectedType)?.label}`}
                onRemove={() => setSelectedType("all")}
              />
            )}
            {selectedStatus !== "all" && (
              <FilterTag
                label={`상태: ${statusOptions.find((s) => s.value === selectedStatus)?.label}`}
                onRemove={() => setSelectedStatus("all")}
              />
            )}
            {dateFrom && (
              <FilterTag
                label={`시작: ${dateFrom}`}
                onRemove={() => setDateFrom("")}
              />
            )}
            {dateTo && (
              <FilterTag
                label={`종료: ${dateTo}`}
                onRemove={() => setDateTo("")}
              />
            )}
            {completionRateMin > 0 && (
              <FilterTag
                label={`완료율 최소: ${completionRateMin}%`}
                onRemove={() => setCompletionRateMin(0)}
              />
            )}
            {completionRateMax < 100 && (
              <FilterTag
                label={`완료율 최대: ${completionRateMax}%`}
                onRemove={() => setCompletionRateMax(100)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// 필터 태그 컴포넌트
const FilterTag: React.FC<{
  label: string;
  onRemove: () => void;
}> = ({ label, onRemove }) => (
  <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
    <span>{label}</span>
    <button onClick={onRemove} className="text-blue-600 hover:text-blue-800">
      <X className="w-3 h-3" />
    </button>
  </div>
);
