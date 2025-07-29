import React, { useState } from "react";
import "./JournalTypeSelector.css";

export type JournalType = "structured" | "photo";

interface JournalTypeOption {
  type: JournalType;
  title: string;
  description: string;
  icon: string;
  features: string[];
}

interface JournalTypeSelectorProps {
  selectedType?: JournalType;
  onTypeSelect: (type: JournalType) => void;
  onNext: () => void;
  disabled?: boolean;
}

const journalTypes: JournalTypeOption[] = [
  {
    type: "structured",
    title: "구조화된 일지",
    description: "체크리스트와 템플릿을 활용한 체계적인 일지 작성",
    icon: "📝",
    features: [
      "할일 체크리스트",
      "구조화된 템플릿",
      "진행률 추적",
      "자동 저장",
    ],
  },
  {
    type: "photo",
    title: "사진 일지",
    description: "사진과 함께하는 자유로운 형태의 일지 작성",
    icon: "📷",
    features: [
      "다중 사진 업로드",
      "사진 설명 추가",
      "자유로운 형식",
      "시각적 기록",
    ],
  },
];

export const JournalTypeSelector: React.FC<JournalTypeSelectorProps> = ({
  selectedType,
  onTypeSelect,
  onNext,
  disabled = false,
}) => {
  const [hoveredType, setHoveredType] = useState<JournalType | null>(null);

  const handleTypeClick = (type: JournalType) => {
    if (disabled) return;
    onTypeSelect(type);
  };

  const handleNextClick = () => {
    if (selectedType && !disabled) {
      onNext();
    }
  };

  return (
    <div className="journal-type-selector">
      <div className="selector-header">
        <h2>일지 유형을 선택하세요</h2>
        <p>작성하고 싶은 일지의 형태를 선택해주세요.</p>
      </div>

      <div className="type-options">
        {journalTypes.map((option) => (
          <div
            key={option.type}
            className={`type-option ${
              selectedType === option.type ? "selected" : ""
            } ${hoveredType === option.type ? "hovered" : ""} ${
              disabled ? "disabled" : ""
            }`}
            onClick={() => handleTypeClick(option.type)}
            onMouseEnter={() => !disabled && setHoveredType(option.type)}
            onMouseLeave={() => setHoveredType(null)}
            role="button"
            tabIndex={disabled ? -1 : 0}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !disabled) {
                e.preventDefault();
                handleTypeClick(option.type);
              }
            }}
            aria-pressed={selectedType === option.type}
            aria-disabled={disabled}
          >
            <div className="option-icon">{option.icon}</div>

            <div className="option-content">
              <h3 className="option-title">{option.title}</h3>
              <p className="option-description">{option.description}</p>

              <ul className="option-features">
                {option.features.map((feature, index) => (
                  <li key={index} className="feature-item">
                    <span className="feature-check">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {selectedType === option.type && (
              <div className="selection-indicator">
                <span className="check-icon">✓</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="selector-actions">
        <div className="selection-info">
          {selectedType ? (
            <span className="selected-info">
              {journalTypes.find((t) => t.type === selectedType)?.title} 선택됨
            </span>
          ) : (
            <span className="no-selection">일지 유형을 선택해주세요</span>
          )}
        </div>

        <button
          className={`next-button ${selectedType ? "enabled" : "disabled"}`}
          onClick={handleNextClick}
          disabled={!selectedType || disabled}
        >
          다음 단계
          <span className="arrow">→</span>
        </button>
      </div>
    </div>
  );
};
