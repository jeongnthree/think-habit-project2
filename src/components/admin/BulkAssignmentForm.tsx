"use client";

// Bulk Assignment Form Component - 대량 할당 폼
import { useState } from "react";
import {
  BulkAssignmentProps,
  BulkAssignmentData,
  UserProfile,
  CategoryResponse,
} from "@/types";

export default function BulkAssignmentForm({
  students,
  categories,
  onSubmit,
  onCancel,
  isLoading = false,
  className = "",
}: BulkAssignmentProps) {
  const [formData, setFormData] = useState<BulkAssignmentData>({
    student_ids: [],
    category_ids: [],
    weekly_goal: 1,
    start_date: new Date().toISOString().split("T")[0]!,
    end_date: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.student_ids.length === 0) {
      newErrors.student_ids = "최소 1명의 학습자를 선택해주세요";
    }

    if (formData.category_ids.length === 0) {
      newErrors.category_ids = "최소 1개의 카테고리를 선택해주세요";
    }

    if (!formData.weekly_goal || formData.weekly_goal < 1) {
      newErrors.weekly_goal = "주당 목표는 1 이상이어야 합니다";
    }

    if (!formData.start_date) {
      newErrors.start_date = "시작일을 선택해주세요";
    }

    if (
      formData.end_date &&
      formData.start_date &&
      formData.end_date <= formData.start_date
    ) {
      newErrors.end_date = "종료일은 시작일보다 늦어야 합니다";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  const handleStudentToggle = (studentId: string, checked: boolean) => {
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        student_ids: [...prev.student_ids, studentId],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        student_ids: prev.student_ids.filter((id) => id !== studentId),
      }));
    }

    if (errors.student_ids) {
      const newErrors = { ...errors };
      delete newErrors.student_ids;
      setErrors(newErrors);
    }
  };

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        category_ids: [...prev.category_ids, categoryId],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        category_ids: prev.category_ids.filter((id) => id !== categoryId),
      }));
    }

    if (errors.category_ids) {
      const newErrors = { ...errors };
      delete newErrors.category_ids;
      setErrors(newErrors);
    }
  };

  const handleSelectAllStudents = (checked: boolean) => {
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        student_ids: students.map((s) => s.id),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        student_ids: [],
      }));
    }
  };

  const handleSelectAllCategories = (checked: boolean) => {
    const activeCategories = categories.filter((c) => c.is_active);
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        category_ids: activeCategories.map((c) => c.id),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        category_ids: [],
      }));
    }
  };

  const totalAssignments =
    formData.student_ids.length * formData.category_ids.length;

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">대량 할당</h2>
        <p className="text-gray-600 mt-1">
          여러 학습자에게 여러 카테고리를 한 번에 할당합니다
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 학습자 선택 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              학습자 선택 * ({formData.student_ids.length}명 선택됨)
            </label>
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={formData.student_ids.length === students.length}
                onChange={(e) => handleSelectAllStudents(e.target.checked)}
                className="mr-2 rounded"
                disabled={isLoading}
              />
              전체 선택
            </label>
          </div>

          <div
            className={`max-h-48 overflow-y-auto border rounded-lg p-3 ${
              errors.student_ids ? "border-red-500" : "border-gray-300"
            }`}
          >
            {students.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                학습자가 없습니다
              </p>
            ) : (
              <div className="space-y-2">
                {students.map((student) => (
                  <label key={student.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.student_ids.includes(student.id)}
                      onChange={(e) =>
                        handleStudentToggle(student.id, e.target.checked)
                      }
                      className="mr-3 rounded"
                      disabled={isLoading}
                    />
                    <span className="text-sm">
                      {student.name} ({student.member_type})
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
          {errors.student_ids && (
            <p className="text-red-500 text-sm mt-1">{errors.student_ids}</p>
          )}
        </div>

        {/* 카테고리 선택 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              카테고리 선택 * ({formData.category_ids.length}개 선택됨)
            </label>
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={
                  formData.category_ids.length ===
                  categories.filter((c) => c.is_active).length
                }
                onChange={(e) => handleSelectAllCategories(e.target.checked)}
                className="mr-2 rounded"
                disabled={isLoading}
              />
              전체 선택
            </label>
          </div>

          <div
            className={`max-h-48 overflow-y-auto border rounded-lg p-3 ${
              errors.category_ids ? "border-red-500" : "border-gray-300"
            }`}
          >
            {categories.filter((c) => c.is_active).length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                활성 카테고리가 없습니다
              </p>
            ) : (
              <div className="space-y-2">
                {categories
                  .filter((c) => c.is_active)
                  .map((category) => (
                    <label key={category.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.category_ids.includes(category.id)}
                        onChange={(e) =>
                          handleCategoryToggle(category.id, e.target.checked)
                        }
                        className="mr-3 rounded"
                        disabled={isLoading}
                      />
                      <div className="text-sm">
                        <div className="font-medium">{category.name}</div>
                        {category.description && (
                          <div className="text-gray-500">
                            {category.description}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
              </div>
            )}
          </div>
          {errors.category_ids && (
            <p className="text-red-500 text-sm mt-1">{errors.category_ids}</p>
          )}
        </div>

        {/* 할당 미리보기 */}
        {totalAssignments > 0 && (
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-medium text-yellow-900 mb-2">할당 미리보기</h3>
            <div className="text-sm text-yellow-800 space-y-1">
              <p>
                <strong>선택된 학습자:</strong> {formData.student_ids.length}명
              </p>
              <p>
                <strong>선택된 카테고리:</strong> {formData.category_ids.length}
                개
              </p>
              <p>
                <strong>총 생성될 할당:</strong> {totalAssignments}개
              </p>
            </div>
          </div>
        )}

        {/* 주당 목표 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            주당 목표 횟수 *
          </label>
          <input
            type="number"
            min="1"
            max="7"
            value={formData.weekly_goal}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                weekly_goal: parseInt(e.target.value),
              }))
            }
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.weekly_goal ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="1"
            disabled={isLoading}
          />
          {errors.weekly_goal && (
            <p className="text-red-500 text-sm mt-1">{errors.weekly_goal}</p>
          )}
        </div>

        {/* 날짜 설정 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              시작일 *
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, start_date: e.target.value }))
              }
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.start_date ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isLoading}
            />
            {errors.start_date && (
              <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              종료일 (선택사항)
            </label>
            <input
              type="date"
              value={formData.end_date || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  end_date: e.target.value || undefined,
                }))
              }
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.end_date ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isLoading}
            />
            {errors.end_date && (
              <p className="text-red-500 text-sm mt-1">{errors.end_date}</p>
            )}
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={isLoading}
          >
            취소
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            disabled={isLoading || totalAssignments === 0}
          >
            {isLoading ? "처리 중..." : `${totalAssignments}개 할당 생성`}
          </button>
        </div>
      </form>
    </div>
  );
}
