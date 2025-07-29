import React, { useState } from "react";
import {
  DEFAULT_TEMPLATES,
  TEMPLATE_CATEGORIES,
  TodoTemplate,
} from "../../types/journal";
import "./TodoTemplateSelector.css";

interface TodoTemplateSelectorProps {
  selectedTemplate?: TodoTemplate;
  onTemplateSelect: (template: TodoTemplate | null) => void;
  onClose: () => void;
}

export const TodoTemplateSelector: React.FC<TodoTemplateSelectorProps> = ({
  selectedTemplate,
  onTemplateSelect,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // 템플릿 필터링
  const filteredTemplates = DEFAULT_TEMPLATES.filter((template) => {
    const matchesCategory =
      selectedCategory === "all" || template.category === selectedCategory;
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleTemplateSelect = (template: TodoTemplate) => {
    onTemplateSelect(template);
  };

  const handleStartFromScratch = () => {
    onTemplateSelect(null);
  };

  return (
    <div className="template-selector-overlay">
      <div className="template-selector-modal">
        <div className="template-selector-header">
          <h2>템플릿 선택</h2>
          <p>일지 작성을 위한 템플릿을 선택하거나 처음부터 시작하세요.</p>
          <button className="close-button" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        <div className="template-selector-content">
          {/* 검색 및 필터 */}
          <div className="template-filters">
            <div className="search-box">
              <input
                type="text"
                placeholder="템플릿 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
            </div>

            <div className="category-filters">
              <button
                className={`category-filter ${selectedCategory === "all" ? "active" : ""}`}
                onClick={() => setSelectedCategory("all")}
              >
                전체
              </button>
              {TEMPLATE_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  className={`category-filter ${selectedCategory === category.id ? "active" : ""}`}
                  onClick={() => setSelectedCategory(category.id)}
                  style={
                    {
                      "--category-color": category.color,
                    } as React.CSSProperties
                  }
                >
                  <span className="category-icon">{category.icon}</span>
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* 처음부터 시작 옵션 */}
          <div className="start-from-scratch">
            <div
              className={`template-card scratch-card ${!selectedTemplate ? "selected" : ""}`}
              onClick={handleStartFromScratch}
            >
              <div className="template-icon">✨</div>
              <div className="template-info">
                <h3>처음부터 시작</h3>
                <p>빈 템플릿으로 자유롭게 작성하기</p>
              </div>
              {!selectedTemplate && (
                <div className="selection-indicator">
                  <span className="check-icon">✓</span>
                </div>
              )}
            </div>
          </div>

          {/* 템플릿 목록 */}
          <div className="templates-grid">
            {filteredTemplates.map((template) => {
              const category = TEMPLATE_CATEGORIES.find(
                (cat) => cat.id === template.category,
              );
              const isSelected = selectedTemplate?.id === template.id;

              return (
                <div
                  key={template.id}
                  className={`template-card ${isSelected ? "selected" : ""}`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <div className="template-header">
                    <div
                      className="template-icon"
                      style={{ backgroundColor: category?.color }}
                    >
                      {category?.icon}
                    </div>
                    <div className="template-badge">
                      {template.items.length}개 항목
                    </div>
                  </div>

                  <div className="template-info">
                    <h3>{template.name}</h3>
                    <p>{template.description}</p>
                  </div>

                  <div className="template-preview">
                    <ul className="preview-items">
                      {template.items.slice(0, 3).map((item, index) => (
                        <li key={index} className="preview-item">
                          <span className="preview-check">☐</span>
                          {item.text}
                        </li>
                      ))}
                      {template.items.length > 3 && (
                        <li className="preview-more">
                          +{template.items.length - 3}개 더...
                        </li>
                      )}
                    </ul>
                  </div>

                  {isSelected && (
                    <div className="selection-indicator">
                      <span className="check-icon">✓</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="no-templates">
              <p>검색 조건에 맞는 템플릿이 없습니다.</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
              >
                필터 초기화
              </button>
            </div>
          )}
        </div>

        <div className="template-selector-actions">
          <button className="cancel-button" onClick={onClose}>
            취소
          </button>
          <button
            className="confirm-button"
            onClick={onClose}
            disabled={!selectedTemplate && selectedTemplate !== null}
          >
            선택 완료
          </button>
        </div>
      </div>
    </div>
  );
};
