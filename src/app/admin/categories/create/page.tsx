"use client";

// Admin Category Create Page - 카테고리 생성 페이지
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { CategoryFormData } from "@/types";

export default function CreateCategoryPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (formData: CategoryFormData) => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        alert("카테고리가 성공적으로 생성되었습니다!");
        router.push("/admin/categories");
      } else {
        alert(`생성 실패: ${result.error}`);
      }
    } catch (error) {
      console.error("Error creating category:", error);
      alert("카테고리 생성 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/admin/categories");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 브레드크럼 */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <button
                onClick={() => router.push("/admin")}
                className="hover:text-blue-600"
              >
                관리자
              </button>
            </li>
            <li>/</li>
            <li>
              <button
                onClick={() => router.push("/admin/categories")}
                className="hover:text-blue-600"
              >
                카테고리 관리
              </button>
            </li>
            <li>/</li>
            <li className="text-gray-900">새 카테고리</li>
          </ol>
        </nav>

        {/* 카테고리 폼 */}
        <CategoryForm
          onSave={handleSubmit}
          onCancel={handleCancel}
          loading={isLoading}
        />
      </div>
    </div>
  );
}
